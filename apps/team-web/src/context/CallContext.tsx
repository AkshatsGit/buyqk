import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';
import { rtdb } from '@buyqk/firebase';
import { ref, set, onValue, remove, push, onChildAdded, update } from 'firebase/database';
import { ActiveCallState } from '../types';

interface IncomingCall {
  callId: string;
  callerUid: string;
  callerName: string;
  callerAvatar: string;
  type: 'audio' | 'video';
  chatId?: string;
  offer: any;
}

interface CallContextType {
  activeCall: ActiveCallState | null;
  incomingCall: IncomingCall | null;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  audioVolume: number;
  permissionError: string;
  startCall: (recipientUid: string, name: string, avatar: string, type: 'audio' | 'video', role?: string, chatId?: string) => Promise<void>;
  acceptCall: () => Promise<void>;
  declineCall: () => void;
  endCall: () => Promise<void>;
  toggleMute: () => void;
  toggleVideo: () => Promise<void>;
  toggleScreenShare: () => void;
  toggleMinimize: () => void;
  clearPermissionError: () => void;
}

const CallContext = createContext<CallContextType | undefined>(undefined);

const rtcConfig = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' }
  ]
};

export const CallProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, profile } = useAuth();
  
  const [activeCall, setActiveCall] = useState<ActiveCallState | null>(null);
  const [incomingCall, setIncomingCall] = useState<IncomingCall | null>(null);
  const [permissionError, setPermissionError] = useState<string>('');
  
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [audioVolume, setAudioVolume] = useState<number>(0);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null); // ref so closures always see current stream
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const ringtoneTimerRef = useRef<any>(null);
  const activeCallRef = useRef<ActiveCallState | null>(null);

  // keep ref in sync with state
  useEffect(() => { activeCallRef.current = activeCall; }, [activeCall]);
  useEffect(() => { localStreamRef.current = localStream; }, [localStream]);

  // -------------- 1. Incoming call listener ----------------
  useEffect(() => {
    if (!currentUser?.uid) return;

    const userIncRef = ref(rtdb, `calls/incoming/${currentUser.uid}`);

    const unsubUser = onValue(userIncRef, (snap) => {
      if (snap.exists()) {
        const data = snap.val();
        // ignore our own notifications (shouldn't happen, but guard)
        if (data.callerUid !== currentUser.uid) {
          setIncomingCall(data);
        }
      } else {
        setIncomingCall(null);
      }
    });

    return () => unsubUser();
  }, [currentUser?.uid]);

  // -------------- 2. Remote call-ended listener ----------------
  useEffect(() => {
    if (!activeCall?.callId) return;

    const sigRef = ref(rtdb, `calls/signaling/${activeCall.callId}/status`);
    const unsub = onValue(sigRef, (snapshot) => {
      if (!snapshot.exists()) {
        // Node removed = other side ended
        internalCleanup();
        setActiveCall(null);
      } else if (snapshot.val() === 'ended') {
        internalCleanup();
        setActiveCall(null);
      }
    });

    return () => unsub();
  }, [activeCall?.callId]);

  // -------------- 3. Soft ringtone chime ----------------
  useEffect(() => {
    if (incomingCall && !activeCall) {
      const playSoftRingtone = () => {
        try {
          const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
          const ctx = new AudioCtx();
          const osc1 = ctx.createOscillator();
          const osc2 = ctx.createOscillator();
          const gain = ctx.createGain();
          osc1.type = 'sine'; osc2.type = 'sine';
          osc1.frequency.setValueAtTime(440, ctx.currentTime);
          osc2.frequency.setValueAtTime(480, ctx.currentTime);
          gain.gain.setValueAtTime(0.07, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.1);
          osc1.connect(gain); osc2.connect(gain);
          gain.connect(ctx.destination);
          osc1.start(); osc2.start();
          osc1.stop(ctx.currentTime + 1.1); osc2.stop(ctx.currentTime + 1.1);
        } catch (_) {}
      };
      playSoftRingtone();
      ringtoneTimerRef.current = setInterval(playSoftRingtone, 2200);
    } else {
      clearInterval(ringtoneTimerRef.current);
      ringtoneTimerRef.current = null;
    }
    return () => {
      clearInterval(ringtoneTimerRef.current);
      ringtoneTimerRef.current = null;
    };
  }, [!!incomingCall, !!activeCall]);

  // -------------- 4. Duration timer ----------------
  useEffect(() => {
    let t: any = null;
    if (activeCall?.status === 'connected') {
      t = setInterval(() => {
        setActiveCall(prev => prev ? { ...prev, durationSeconds: prev.durationSeconds + 1 } : null);
      }, 1000);
    }
    return () => clearInterval(t);
  }, [activeCall?.status]);

  // -------------- Audio analyzer ----------------
  const setupAudioAnalyzer = (stream: MediaStream) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      source.connect(analyser);
      audioContextRef.current = ctx;
      analyserRef.current = analyser;
      const data = new Uint8Array(analyser.frequencyBinCount);
      const tick = () => {
        analyser.getByteFrequencyData(data);
        const avg = data.reduce((a, v) => a + v, 0) / data.length;
        setAudioVolume(Math.min(100, Math.round((avg / 128) * 100)));
        animFrameRef.current = requestAnimationFrame(tick);
      };
      tick();
    } catch (e) { console.warn('Audio analyzer error', e); }
  };

  // Use ref for cleanup so closures always stop the *current* stream
  const internalCleanup = () => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    try { audioContextRef.current?.close(); } catch (_) {}
    audioContextRef.current = null;
    if (pcRef.current) { pcRef.current.close(); pcRef.current = null; }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(t => t.stop());
      localStreamRef.current = null;
    }
    setLocalStream(null);
    setRemoteStream(null);
    remoteStreamRef.current = null;
    setAudioVolume(0);
  };

  // -------------- Build a fresh RTCPeerConnection ----------------
  const buildPC = (callId: string, role: 'caller' | 'callee'): RTCPeerConnection => {
    const pc = new RTCPeerConnection(rtcConfig);
    pcRef.current = pc;

    // Create remote stream once, accumulate tracks
    const rStream = new MediaStream();
    remoteStreamRef.current = rStream;
    setRemoteStream(rStream);

    pc.ontrack = (event) => {
      // Always add the track directly — event.streams may be empty for audio
      event.track.onunmute = () => {
        rStream.addTrack(event.track);
        setRemoteStream(new MediaStream(rStream.getTracks())); // trigger re-render
      };
      if (!event.track.muted) {
        rStream.addTrack(event.track);
        setRemoteStream(new MediaStream(rStream.getTracks()));
      }
    };

    const myCandPath = role === 'caller' ? 'callerCandidates' : 'calleeCandidates';
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        const candRef = push(ref(rtdb, `calls/signaling/${callId}/${myCandPath}`));
        set(candRef, event.candidate.toJSON());
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'connected') {
        setActiveCall(prev => prev ? { ...prev, status: 'connected' } : null);
      }
    };

    return pc;
  };

  // -------------- Start outgoing call (Caller) ----------------
  const startCall = async (
    recipientUid: string, name: string, avatar: string,
    type: 'audio' | 'video', role?: string, chatId?: string
  ) => {
    if (!currentUser) return;
    internalCleanup();
    setPermissionError('');

    const callId = `call_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

    setActiveCall({
      callId,
      chatId: chatId || `direct_${recipientUid}`,
      type,
      recipientName: name || 'Teammate',
      recipientAvatar: avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      recipientRole: role || 'BuyQK Employee',
      status: 'calling',
      isMuted: false,
      isVideoOff: type === 'audio',
      isScreenSharing: false,
      durationSeconds: 0,
      isMinimized: false
    });

    try {
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: type === 'video' });
      } catch (mediaErr: any) {
        if (type === 'video') {
          stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          setPermissionError('Camera permission blocked — started audio-only. Tap Open Camera to retry.');
        } else {
          throw mediaErr;
        }
      }
      setLocalStream(stream);
      localStreamRef.current = stream;
      setupAudioAnalyzer(stream);

      const pc = buildPC(callId, 'caller');
      stream.getTracks().forEach(t => pc.addTrack(t, stream));

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // Separate signaling node for metadata vs. offer/answer
      await set(ref(rtdb, `calls/signaling/${callId}/meta`), { status: 'calling', callerId: currentUser.uid });
      await set(ref(rtdb, `calls/signaling/${callId}/offer`), { type: offer.type, sdp: offer.sdp });

      // Notify recipient
      const incNode = (recipientUid && recipientUid !== 'general' && !recipientUid.startsWith('group_'))
        ? `calls/incoming/${recipientUid}` : `calls/incoming/general`;
      await set(ref(rtdb, incNode), {
        callId,
        callerUid: currentUser.uid,
        callerName: profile?.fullName || currentUser.displayName || 'Teammate',
        callerAvatar: profile?.photoUrl || currentUser.photoURL || '',
        type,
        chatId: chatId || `direct_${recipientUid}`,
        offer: { type: offer.type, sdp: offer.sdp }
      });

      // Also write to signaling status (for remote-ended detection)
      await update(ref(rtdb, `calls/signaling/${callId}`), { status: 'calling' });

      // Listen for SDP answer
      const answerRef = ref(rtdb, `calls/signaling/${callId}/answer`);
      onValue(answerRef, async (snap) => {
        if (snap.exists() && pcRef.current && pcRef.current.signalingState !== 'closed') {
          const answer = snap.val();
          if (!pcRef.current.currentRemoteDescription) {
            await pcRef.current.setRemoteDescription(new RTCSessionDescription(answer));
            setActiveCall(prev => prev ? { ...prev, status: 'connected' } : null);
          }
        }
      });

      // Listen for callee ICE candidates
      const calleeCandRef = ref(rtdb, `calls/signaling/${callId}/calleeCandidates`);
      onChildAdded(calleeCandRef, (snap) => {
        if (snap.exists() && pcRef.current) {
          pcRef.current.addIceCandidate(new RTCIceCandidate(snap.val())).catch(() => {});
        }
      });

    } catch (err: any) {
      console.error('startCall error:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setPermissionError('Microphone/Camera permission blocked. Click the lock icon in your URL bar to allow access.');
      }
    }
  };

  // -------------- Accept incoming call (Callee) ----------------
  const acceptCall = async () => {
    if (!incomingCall || !currentUser) return;
    const { callId, callerName, callerAvatar, type, offer, chatId } = incomingCall;

    setIncomingCall(null);
    remove(ref(rtdb, `calls/incoming/${currentUser.uid}`));
    remove(ref(rtdb, `calls/incoming/general`));
    setPermissionError('');

    setActiveCall({
      callId,
      chatId: chatId || `direct_${incomingCall.callerUid}`,
      type,
      recipientName: callerName,
      recipientAvatar: callerAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      recipientRole: 'BuyQK Employee',
      status: 'connected',
      isMuted: false,
      isVideoOff: type === 'audio',
      isScreenSharing: false,
      durationSeconds: 0,
      isMinimized: false
    });

    try {
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: type === 'video' });
      } catch {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        setPermissionError('Camera permission blocked — connected audio-only.');
      }
      setLocalStream(stream);
      localStreamRef.current = stream;
      setupAudioAnalyzer(stream);

      const pc = buildPC(callId, 'callee');
      stream.getTracks().forEach(t => pc.addTrack(t, stream));

      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      await set(ref(rtdb, `calls/signaling/${callId}/answer`), { type: answer.type, sdp: answer.sdp });
      // Signal that call is now connected
      await update(ref(rtdb, `calls/signaling/${callId}`), { status: 'connected' });

      // Listen for caller ICE candidates
      const callerCandRef = ref(rtdb, `calls/signaling/${callId}/callerCandidates`);
      onChildAdded(callerCandRef, (snap) => {
        if (snap.exists() && pcRef.current) {
          pcRef.current.addIceCandidate(new RTCIceCandidate(snap.val())).catch(() => {});
        }
      });

    } catch (err: any) {
      console.error('acceptCall error:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setPermissionError('Microphone/Camera permission blocked. Allow access in browser settings.');
      }
    }
  };

  const declineCall = () => {
    if (!incomingCall || !currentUser) return;
    remove(ref(rtdb, `calls/incoming/${currentUser.uid}`));
    remove(ref(rtdb, `calls/incoming/general`));
    setIncomingCall(null);
  };

  const endCall = async () => {
    const call = activeCallRef.current;

    // 1. Signal ended to the other party FIRST, before cleanup
    if (call?.callId) {
      try { await update(ref(rtdb, `calls/signaling/${call.callId}`), { status: 'ended' }); } catch (_) {}
    }

    // 2. Post call duration log to chat
    if (call?.chatId && currentUser) {
      try {
        const dur = call.durationSeconds || 0;
        const durStr = `${Math.floor(dur / 60).toString().padStart(2, '0')}:${(dur % 60).toString().padStart(2, '0')}`;
        const msgRef = push(ref(rtdb, `messages/${call.chatId}`));
        await set(msgRef, {
          senderId: currentUser.uid,
          senderName: profile?.fullName || currentUser.displayName || 'Team Member',
          senderAvatar: profile?.photoUrl || currentUser.photoURL || '',
          text: `📞 ${call.type === 'video' ? 'Video' : 'Voice'} Call ended • ${durStr}`,
          timestamp: Date.now(),
          isCallRecord: true
        });
      } catch (_) {}
    }

    // 3. Remove RTDB nodes after a short delay so other side can read 'ended'
    setTimeout(() => {
      if (call?.callId) remove(ref(rtdb, `calls/signaling/${call.callId}`)).catch(() => {});
    }, 800);

    if (currentUser) {
      remove(ref(rtdb, `calls/incoming/${currentUser.uid}`)).catch(() => {});
      remove(ref(rtdb, `calls/incoming/general`)).catch(() => {});
    }

    internalCleanup();
    setActiveCall(null);
  };

  const toggleMute = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(t => { t.enabled = !t.enabled; });
    }
    setActiveCall(prev => prev ? { ...prev, isMuted: !prev.isMuted } : null);
  };

  const toggleVideo = async () => {
    setPermissionError('');
    const stream = localStreamRef.current;
    if (stream) {
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setActiveCall(prev => prev ? { ...prev, isVideoOff: !videoTrack.enabled } : null);
      } else {
        // Re-request camera permission
        try {
          const vStream = await navigator.mediaDevices.getUserMedia({ video: true });
          const newTrack = vStream.getVideoTracks()[0];
          if (newTrack) {
            stream.addTrack(newTrack);
            const pc = pcRef.current;
            if (pc) {
              const existing = pc.getSenders().find(s => s.track?.kind === 'video');
              if (existing) { existing.replaceTrack(newTrack); }
              else { pc.addTrack(newTrack, stream); }
            }
            setActiveCall(prev => prev ? { ...prev, isVideoOff: false } : null);
          }
        } catch (err: any) {
          if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
            setPermissionError('Camera blocked. Click the 🔒 lock icon in your browser URL bar → allow Camera → tap again.');
          }
        }
      }
    }
  };

  const toggleScreenShare = () => {
    setActiveCall(prev => prev ? { ...prev, isScreenSharing: !prev.isScreenSharing } : null);
  };

  const toggleMinimize = () => {
    setActiveCall(prev => prev ? { ...prev, isMinimized: !prev.isMinimized } : null);
  };

  const clearPermissionError = () => setPermissionError('');

  return (
    <CallContext.Provider value={{
      activeCall, incomingCall, localStream, remoteStream,
      audioVolume, permissionError,
      startCall, acceptCall, declineCall, endCall,
      toggleMute, toggleVideo, toggleScreenShare, toggleMinimize,
      clearPermissionError
    }}>
      {children}
    </CallContext.Provider>
  );
};

export const useCall = () => {
  const ctx = useContext(CallContext);
  if (!ctx) throw new Error('useCall must be used within a CallProvider');
  return ctx;
};

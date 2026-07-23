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

// Free ICE servers — STUN for same-network, metered TURN for cross-network/NAT
const rtcConfig: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    // Free TURN relay from open-relay.metered.ca
    {
      urls: 'turn:a.relay.metered.ca:80',
      username: 'openrelayproject',
      credential: 'openrelayproject'
    },
    {
      urls: 'turn:a.relay.metered.ca:443',
      username: 'openrelayproject',
      credential: 'openrelayproject'
    },
    {
      urls: 'turn:a.relay.metered.ca:443?transport=tcp',
      username: 'openrelayproject',
      credential: 'openrelayproject'
    }
  ],
  iceCandidatePoolSize: 10
};

export const CallProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, profile } = useAuth();

  const [activeCall, setActiveCall] = useState<ActiveCallState | null>(null);
  const [incomingCall, setIncomingCall] = useState<IncomingCall | null>(null);
  const [permissionError, setPermissionError] = useState<string>('');
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [audioVolume, setAudioVolume] = useState<number>(0);

  // Refs for stable closure access
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  // IMPORTANT: remoteStreamObj is a STABLE object — we mutate its tracks in place
  // so that the <audio>/<video> srcObject reference never goes stale
  const remoteStreamObj = useRef<MediaStream>(new MediaStream());
  const activeCallRef = useRef<ActiveCallState | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const ringtoneTimerRef = useRef<any>(null);

  useEffect(() => { activeCallRef.current = activeCall; }, [activeCall]);
  useEffect(() => { localStreamRef.current = localStream; }, [localStream]);

  // ─── 1. Incoming call listener ────────────────────────────────────────────
  useEffect(() => {
    if (!currentUser?.uid) return;
    const incRef = ref(rtdb, `calls/incoming/${currentUser.uid}`);
    return onValue(incRef, (snap) => {
      if (snap.exists()) {
        const data = snap.val();
        if (data.callerUid !== currentUser.uid) setIncomingCall(data);
      } else {
        setIncomingCall(null);
      }
    });
  }, [currentUser?.uid]);

  // ─── 2. Remote call-ended listener ────────────────────────────────────────
  useEffect(() => {
    if (!activeCall?.callId) return;
    const statusRef = ref(rtdb, `calls/signaling/${activeCall.callId}/status`);
    return onValue(statusRef, (snap) => {
      if (!snap.exists() || snap.val() === 'ended') {
        doCleanup();
        setActiveCall(null);
      }
    });
  }, [activeCall?.callId]);

  // ─── 3. Ringtone ──────────────────────────────────────────────────────────
  useEffect(() => {
    const ringing = !!incomingCall && !activeCall;
    if (ringing) {
      const chime = () => {
        try {
          const AC = window.AudioContext || (window as any).webkitAudioContext;
          const ctx = new AC();
          [440, 480].forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.value = freq;
            gain.gain.setValueAtTime(0.07, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.1);
            osc.connect(gain); gain.connect(ctx.destination);
            osc.start(); osc.stop(ctx.currentTime + 1.1);
          });
        } catch (_) {}
      };
      chime();
      ringtoneTimerRef.current = setInterval(chime, 2200);
    }
    return () => { clearInterval(ringtoneTimerRef.current); ringtoneTimerRef.current = null; };
  }, [!!incomingCall, !!activeCall]);

  // ─── 4. Duration timer ────────────────────────────────────────────────────
  useEffect(() => {
    if (activeCall?.status !== 'connected') return;
    const t = setInterval(() => {
      setActiveCall(prev => prev ? { ...prev, durationSeconds: prev.durationSeconds + 1 } : null);
    }, 1000);
    return () => clearInterval(t);
  }, [activeCall?.status]);

  // ─── Audio analyzer ───────────────────────────────────────────────────────
  const setupAudioAnalyzer = (stream: MediaStream) => {
    try {
      const AC = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AC();
      const src = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      src.connect(analyser);
      audioContextRef.current = ctx;
      analyserRef.current = analyser;
      const buf = new Uint8Array(analyser.frequencyBinCount);
      const tick = () => {
        analyser.getByteFrequencyData(buf);
        const avg = buf.reduce((a, v) => a + v, 0) / buf.length;
        setAudioVolume(Math.min(100, Math.round(avg / 128 * 100)));
        animFrameRef.current = requestAnimationFrame(tick);
      };
      tick();
    } catch (_) {}
  };

  const doCleanup = () => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    try { audioContextRef.current?.close(); } catch (_) {}
    audioContextRef.current = null;
    if (pcRef.current) { pcRef.current.close(); pcRef.current = null; }
    const ls = localStreamRef.current;
    if (ls) { ls.getTracks().forEach(t => t.stop()); }
    localStreamRef.current = null;
    setLocalStream(null);
    // Clear the stable remote stream's tracks
    remoteStreamObj.current.getTracks().forEach(t => remoteStreamObj.current.removeTrack(t));
    setRemoteStream(null);
    setAudioVolume(0);
  };

  // ─── Build RTCPeerConnection ───────────────────────────────────────────────
  const buildPC = (callId: string, role: 'caller' | 'callee'): RTCPeerConnection => {
    const pc = new RTCPeerConnection(rtcConfig);
    pcRef.current = pc;

    // Expose the STABLE remoteStreamObj — MediaStream identity never changes
    // so srcObject in <audio>/<video> remains valid forever
    setRemoteStream(remoteStreamObj.current);

    pc.ontrack = (event) => {
      // Add every incoming track to our stable MediaStream
      const track = event.track;
      const existing = remoteStreamObj.current.getTrackById(track.id);
      if (!existing) {
        remoteStreamObj.current.addTrack(track);
        // Force React to re-render so the video element picks up the stream
        setRemoteStream(new MediaStream(remoteStreamObj.current.getTracks()));
      }
    };

    const myPath = role === 'caller' ? 'callerCandidates' : 'calleeCandidates';
    pc.onicecandidate = ({ candidate }) => {
      if (candidate) {
        const r = push(ref(rtdb, `calls/signaling/${callId}/${myPath}`));
        set(r, candidate.toJSON());
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'connected') {
        setActiveCall(prev => prev ? { ...prev, status: 'connected' } : null);
      }
      if (pc.connectionState === 'failed') {
        setPermissionError('Connection failed. Both users must allow mic/camera, and be online.');
      }
    };

    return pc;
  };

  // ─── Start call (Caller) ──────────────────────────────────────────────────
  const startCall = async (
    recipientUid: string, name: string, avatar: string,
    type: 'audio' | 'video', role?: string, chatId?: string
  ) => {
    if (!currentUser) return;
    doCleanup();
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
      } catch (e: any) {
        if (type === 'video') {
          stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          setPermissionError('Camera blocked — audio-only call started. Tap Open Camera to retry.');
        } else throw e;
      }
      setLocalStream(stream);
      localStreamRef.current = stream;
      setupAudioAnalyzer(stream);

      const pc = buildPC(callId, 'caller');
      stream.getTracks().forEach(t => pc.addTrack(t, stream));

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // Write offer and status separately so we don't clobber ICE candidates
      await set(ref(rtdb, `calls/signaling/${callId}/offer`), { type: offer.type, sdp: offer.sdp });
      await set(ref(rtdb, `calls/signaling/${callId}/status`), 'calling');

      // Send notification to recipient
      const incNode = (recipientUid && recipientUid !== 'general')
        ? `calls/incoming/${recipientUid}`
        : `calls/incoming/general`;
      await set(ref(rtdb, incNode), {
        callId,
        callerUid: currentUser.uid,
        callerName: profile?.fullName || currentUser.displayName || 'Teammate',
        callerAvatar: profile?.photoUrl || currentUser.photoURL || '',
        type,
        chatId: chatId || `direct_${recipientUid}`,
        offer: { type: offer.type, sdp: offer.sdp }
      });

      // Listen for SDP answer
      onValue(ref(rtdb, `calls/signaling/${callId}/answer`), async (snap) => {
        if (!snap.exists()) return;
        const pc = pcRef.current;
        if (!pc || pc.signalingState === 'closed') return;
        if (!pc.currentRemoteDescription) {
          const answer = snap.val();
          await pc.setRemoteDescription(new RTCSessionDescription(answer));
          setActiveCall(prev => prev ? { ...prev, status: 'connected' } : null);
        }
      });

      // Listen for callee ICE candidates
      onChildAdded(ref(rtdb, `calls/signaling/${callId}/calleeCandidates`), (snap) => {
        if (snap.exists() && pcRef.current) {
          pcRef.current.addIceCandidate(new RTCIceCandidate(snap.val())).catch(() => {});
        }
      });

    } catch (err: any) {
      console.error('startCall error:', err);
      if (err.name === 'NotAllowedError') {
        setPermissionError('Mic/Camera permission blocked. Click the 🔒 lock in the URL bar to allow, then try again.');
      }
    }
  };

  // ─── Accept call (Callee) ─────────────────────────────────────────────────
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
        setPermissionError('Camera blocked — audio-only call accepted.');
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
      await set(ref(rtdb, `calls/signaling/${callId}/status`), 'connected');

      // Listen for caller ICE candidates
      onChildAdded(ref(rtdb, `calls/signaling/${callId}/callerCandidates`), (snap) => {
        if (snap.exists() && pcRef.current) {
          pcRef.current.addIceCandidate(new RTCIceCandidate(snap.val())).catch(() => {});
        }
      });

    } catch (err: any) {
      console.error('acceptCall error:', err);
      if (err.name === 'NotAllowedError') {
        setPermissionError('Mic/Camera permission blocked. Allow access in browser settings.');
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

    // 1. Signal 'ended' first so remote side terminates immediately
    if (call?.callId) {
      try { await set(ref(rtdb, `calls/signaling/${call.callId}/status`), 'ended'); } catch (_) {}
    }

    // 2. Post call duration badge in chat
    if (call?.chatId && currentUser) {
      try {
        const dur = call.durationSeconds || 0;
        const ds = `${Math.floor(dur / 60).toString().padStart(2, '0')}:${(dur % 60).toString().padStart(2, '0')}`;
        const msgRef = push(ref(rtdb, `messages/${call.chatId}`));
        await set(msgRef, {
          senderId: currentUser.uid,
          senderName: profile?.fullName || currentUser.displayName || 'Team Member',
          senderAvatar: profile?.photoUrl || currentUser.photoURL || '',
          text: `📞 ${call.type === 'video' ? 'Video' : 'Voice'} Call ended • ${ds}`,
          timestamp: Date.now(),
          isCallRecord: true
        });
      } catch (_) {}
    }

    // 3. Delete signaling node after delay
    setTimeout(() => {
      if (call?.callId) remove(ref(rtdb, `calls/signaling/${call.callId}`)).catch(() => {});
    }, 1000);

    if (currentUser) {
      remove(ref(rtdb, `calls/incoming/${currentUser.uid}`)).catch(() => {});
      remove(ref(rtdb, `calls/incoming/general`)).catch(() => {});
    }

    doCleanup();
    setActiveCall(null);
  };

  const toggleMute = () => {
    const ls = localStreamRef.current;
    if (ls) ls.getAudioTracks().forEach(t => { t.enabled = !t.enabled; });
    setActiveCall(prev => prev ? { ...prev, isMuted: !prev.isMuted } : null);
  };

  const toggleVideo = async () => {
    setPermissionError('');
    const ls = localStreamRef.current;
    if (!ls) return;
    const vt = ls.getVideoTracks()[0];
    if (vt) {
      vt.enabled = !vt.enabled;
      setActiveCall(prev => prev ? { ...prev, isVideoOff: !vt.enabled } : null);
    } else {
      // Re-request camera
      try {
        const vs = await navigator.mediaDevices.getUserMedia({ video: true });
        const nt = vs.getVideoTracks()[0];
        if (nt) {
          ls.addTrack(nt);
          const pc = pcRef.current;
          if (pc) {
            const sender = pc.getSenders().find(s => s.track?.kind === 'video');
            if (sender) sender.replaceTrack(nt);
            else pc.addTrack(nt, ls);
          }
          setActiveCall(prev => prev ? { ...prev, isVideoOff: false } : null);
        }
      } catch (err: any) {
        if (err.name === 'NotAllowedError') {
          setPermissionError('Camera blocked. Click the 🔒 lock icon in your URL bar → allow Camera → tap again.');
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

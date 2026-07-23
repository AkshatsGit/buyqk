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
    { urls: 'stun:stun2.l.google.com:19302' }
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
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const ringtoneTimerRef = useRef<any>(null);

  // 1. Listen for incoming calls on Firebase Realtime Database
  useEffect(() => {
    if (!currentUser?.uid) return;

    const userIncRef = ref(rtdb, `calls/incoming/${currentUser.uid}`);
    const genIncRef = ref(rtdb, `calls/incoming/general`);

    const unsubUser = onValue(userIncRef, (snap) => {
      if (snap.exists()) {
        const data = snap.val();
        if (data.callerUid !== currentUser.uid) {
          setIncomingCall(data);
        }
      } else {
        setIncomingCall(null);
      }
    });

    const unsubGen = onValue(genIncRef, (snap) => {
      if (snap.exists()) {
        const data = snap.val();
        if (data.callerUid !== currentUser.uid) {
          setIncomingCall(data);
        }
      }
    });

    return () => {
      unsubUser();
      unsubGen();
    };
  }, [currentUser?.uid]);

  // 2. Synchronized Call Termination: Listen for signaling status 'ended' or node removal to end call on recipient side
  useEffect(() => {
    if (!activeCall?.callId) return;

    const sigRef = ref(rtdb, `calls/signaling/${activeCall.callId}`);
    const unsubscribe = onValue(sigRef, (snapshot) => {
      if (!snapshot.exists()) {
        cleanupStreams();
        setActiveCall(null);
      } else {
        const data = snapshot.val();
        if (data?.status === 'ended') {
          cleanupStreams();
          setActiveCall(null);
        }
      }
    });

    return () => unsubscribe();
  }, [activeCall?.callId]);

  // 3. Play soft synthesized ringing chime sound effect for incoming call
  useEffect(() => {
    if (incomingCall && !activeCall) {
      const playSoftRingtone = () => {
        try {
          const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
          const ctx = new AudioCtx();
          
          const osc1 = ctx.createOscillator();
          const osc2 = ctx.createOscillator();
          const gain = ctx.createGain();

          osc1.type = 'sine';
          osc2.type = 'sine';
          osc1.frequency.setValueAtTime(440, ctx.currentTime);
          osc2.frequency.setValueAtTime(480, ctx.currentTime);

          gain.gain.setValueAtTime(0.06, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.1);

          osc1.connect(gain);
          osc2.connect(gain);
          gain.connect(ctx.destination);

          osc1.start();
          osc2.start();
          osc1.stop(ctx.currentTime + 1.1);
          osc2.stop(ctx.currentTime + 1.1);
        } catch (_) {}
      };

      playSoftRingtone();
      ringtoneTimerRef.current = setInterval(playSoftRingtone, 2200);
    } else {
      if (ringtoneTimerRef.current) {
        clearInterval(ringtoneTimerRef.current);
        ringtoneTimerRef.current = null;
      }
    }

    return () => {
      if (ringtoneTimerRef.current) {
        clearInterval(ringtoneTimerRef.current);
        ringtoneTimerRef.current = null;
      }
    };
  }, [incomingCall, activeCall]);

  // 4. Increment call duration timer when connected
  useEffect(() => {
    let durationTimer: any = null;
    if (activeCall && activeCall.status === 'connected') {
      durationTimer = setInterval(() => {
        setActiveCall(prev => prev ? { ...prev, durationSeconds: prev.durationSeconds + 1 } : null);
      }, 1000);
    }
    return () => {
      if (durationTimer) clearInterval(durationTimer);
    };
  }, [activeCall?.status]);

  // Audio Volume Analyzer using Web Audio API
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

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const updateVolume = () => {
        analyser.getByteFrequencyData(dataArray);
        const sum = dataArray.reduce((acc, val) => acc + val, 0);
        const avg = sum / dataArray.length;
        setAudioVolume(Math.min(100, Math.round((avg / 128) * 100)));
        animFrameRef.current = requestAnimationFrame(updateVolume);
      };
      updateVolume();
    } catch (e) {
      console.warn("Audio Context Analyzer error:", e);
    }
  };

  const cleanupStreams = () => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (audioContextRef.current) audioContextRef.current.close().catch(() => {});
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    if (localStream) {
      localStream.getTracks().forEach(t => t.stop());
      setLocalStream(null);
    }
    setRemoteStream(null);
    setAudioVolume(0);
  };

  // Start Outgoing Call (Caller)
  const startCall = async (recipientUid: string, name: string, avatar: string, type: 'audio' | 'video', role?: string, chatId?: string) => {
    if (!currentUser) return;
    cleanupStreams();
    setPermissionError('');

    const callId = `call_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

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
      // Get real microphone / camera media stream with permission handling
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: type === 'video'
        });
      } catch (mediaErr: any) {
        if (type === 'video') {
          // If video permission fails, fallback to audio-only stream
          stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          setPermissionError('Camera permission was blocked. Voice call started. You can enable camera in browser settings.');
        } else {
          throw mediaErr;
        }
      }

      setLocalStream(stream);
      setupAudioAnalyzer(stream);

      // Create WebRTC Peer Connection
      const pc = new RTCPeerConnection(rtcConfig);
      pcRef.current = pc;

      // Add local audio/video tracks to WebRTC connection
      stream.getTracks().forEach(track => pc.addTrack(track, stream));

      // Handle remote incoming stream
      const rStream = new MediaStream();
      setRemoteStream(rStream);
      pc.ontrack = (event) => {
        event.streams[0].getTracks().forEach(t => rStream.addTrack(t));
      };

      // Collect caller ICE Candidates
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          const candRef = push(ref(rtdb, `calls/signaling/${callId}/callerCandidates`));
          set(candRef, event.candidate.toJSON());
        }
      };

      // Create SDP Offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // Send incoming call notification to recipient via RTDB (direct or general)
      const targetIncNode = (recipientUid && recipientUid !== 'general' && !recipientUid.startsWith('group_')) 
        ? `calls/incoming/${recipientUid}` 
        : `calls/incoming/general`;
      
      const incRef = ref(rtdb, targetIncNode);
      await set(incRef, {
        callId,
        callerUid: currentUser.uid,
        callerName: profile?.fullName || currentUser.displayName || 'Teammate',
        callerAvatar: profile?.photoUrl || currentUser.photoURL || '',
        type,
        chatId: chatId || `direct_${recipientUid}`,
        offer: { type: offer.type, sdp: offer.sdp }
      });

      // Write Offer to signaling node with active status
      await set(ref(rtdb, `calls/signaling/${callId}`), {
        status: 'calling',
        offer: { type: offer.type, sdp: offer.sdp }
      });

      // Listen for recipient SDP Answer
      const answerRef = ref(rtdb, `calls/signaling/${callId}/answer`);
      onValue(answerRef, async (snapshot) => {
        if (snapshot.exists() && pc.signalingState !== 'closed') {
          const answer = snapshot.val();
          if (!pc.currentRemoteDescription) {
            await pc.setRemoteDescription(new RTCSessionDescription(answer));
            setActiveCall(prev => prev ? { ...prev, status: 'connected' } : null);
          }
        }
      });

      // Listen for recipient ICE Candidates
      const calleeCandRef = ref(rtdb, `calls/signaling/${callId}/calleeCandidates`);
      onChildAdded(calleeCandRef, (snapshot) => {
        if (snapshot.exists() && pc) {
          pc.addIceCandidate(new RTCIceCandidate(snapshot.val())).catch(() => {});
        }
      });

    } catch (err: any) {
      console.error("Failed starting WebRTC call:", err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setPermissionError('Microphone/Camera permission blocked by browser. Click the lock icon in your URL bar to allow permissions.');
      }
      setActiveCall(prev => prev ? { ...prev, status: 'connected' } : null);
    }
  };

  // Accept Incoming Call (Callee)
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
        stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: type === 'video'
        });
      } catch (mediaErr: any) {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        setPermissionError('Camera permission blocked by browser. Connected audio-only call.');
      }

      setLocalStream(stream);
      setupAudioAnalyzer(stream);

      const pc = new RTCPeerConnection(rtcConfig);
      pcRef.current = pc;

      stream.getTracks().forEach(track => pc.addTrack(track, stream));

      const rStream = new MediaStream();
      setRemoteStream(rStream);
      pc.ontrack = (event) => {
        event.streams[0].getTracks().forEach(t => rStream.addTrack(t));
      };

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          const candRef = push(ref(rtdb, `calls/signaling/${callId}/calleeCandidates`));
          set(candRef, event.candidate.toJSON());
        }
      };

      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      // Post SDP Answer
      await set(ref(rtdb, `calls/signaling/${callId}/answer`), { type: answer.type, sdp: answer.sdp });

      // Listen for caller ICE candidates
      const callerCandRef = ref(rtdb, `calls/signaling/${callId}/callerCandidates`);
      onChildAdded(callerCandRef, (snapshot) => {
        if (snapshot.exists() && pc) {
          pc.addIceCandidate(new RTCIceCandidate(snapshot.val())).catch(() => {});
        }
      });

    } catch (err: any) {
      console.error("Failed accepting call:", err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setPermissionError('Microphone/Camera permission blocked by browser. Please allow audio/video access in browser settings.');
      }
    }
  };

  const declineCall = () => {
    if (incomingCall && currentUser) {
      remove(ref(rtdb, `calls/incoming/${currentUser.uid}`));
      remove(ref(rtdb, `calls/incoming/general`));
      setIncomingCall(null);
    }
  };

  const endCall = async () => {
    if (activeCall?.callId) {
      try {
        await update(ref(rtdb, `calls/signaling/${activeCall.callId}`), { status: 'ended' });
      } catch (_) {}
    }

    if (activeCall?.chatId && currentUser) {
      try {
        const min = Math.floor((activeCall.durationSeconds || 0) / 60).toString().padStart(2, '0');
        const sec = ((activeCall.durationSeconds || 0) % 60).toString().padStart(2, '0');
        const durStr = `${min}:${sec}`;

        const msgRef = push(ref(rtdb, `messages/${activeCall.chatId}`));
        await set(msgRef, {
          senderId: currentUser.uid,
          senderName: profile?.fullName || currentUser.displayName || 'Team Member',
          senderAvatar: profile?.photoUrl || currentUser.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
          text: `📞 ${activeCall.type === 'video' ? 'Video' : 'Voice'} Call ended • ${durStr}`,
          timestamp: Date.now(),
          isCallRecord: true
        });
      } catch (_) {}
    }

    setTimeout(() => {
      if (activeCall?.callId) {
        remove(ref(rtdb, `calls/signaling/${activeCall.callId}`)).catch(() => {});
      }
    }, 600);

    if (currentUser) {
      remove(ref(rtdb, `calls/incoming/${currentUser.uid}`)).catch(() => {});
      remove(ref(rtdb, `calls/incoming/general`)).catch(() => {});
    }
    cleanupStreams();
    setActiveCall(null);
  };

  const toggleMute = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach(t => {
        t.enabled = !t.enabled;
      });
    }
    setActiveCall(prev => prev ? { ...prev, isMuted: !prev.isMuted } : null);
  };

  const toggleVideo = async () => {
    setPermissionError('');
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setActiveCall(prev => prev ? { ...prev, isVideoOff: !videoTrack.enabled } : null);
      } else {
        // Attempt requesting camera permission again
        try {
          const vStream = await navigator.mediaDevices.getUserMedia({ video: true });
          const newTrack = vStream.getVideoTracks()[0];
          if (newTrack) {
            localStream.addTrack(newTrack);
            if (pcRef.current) {
              const senders = pcRef.current.getSenders();
              const videoSender = senders.find(s => s.track?.kind === 'video');
              if (videoSender) {
                videoSender.replaceTrack(newTrack);
              } else {
                pcRef.current.addTrack(newTrack, localStream);
              }
            }
            setActiveCall(prev => prev ? { ...prev, isVideoOff: false } : null);
          }
        } catch (err: any) {
          console.warn("Camera permission re-request denied:", err);
          if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
            setPermissionError('Camera access was blocked by your browser. Click the lock icon in your URL bar to allow camera access, then tap Open Camera again.');
          }
        }
      }
    } else {
      setActiveCall(prev => prev ? { ...prev, isVideoOff: !prev.isVideoOff } : null);
    }
  };

  const toggleScreenShare = () => {
    setActiveCall(prev => prev ? { ...prev, isScreenSharing: !prev.isScreenSharing } : null);
  };

  const toggleMinimize = () => {
    setActiveCall(prev => prev ? { ...prev, isMinimized: !prev.isMinimized } : null);
  };

  const clearPermissionError = () => {
    setPermissionError('');
  };

  return (
    <CallContext.Provider value={{
      activeCall,
      incomingCall,
      localStream,
      remoteStream,
      audioVolume,
      permissionError,
      startCall,
      acceptCall,
      declineCall,
      endCall,
      toggleMute,
      toggleVideo,
      toggleScreenShare,
      toggleMinimize,
      clearPermissionError
    }}>
      {children}
    </CallContext.Provider>
  );
};

export const useCall = () => {
  const context = useContext(CallContext);
  if (!context) {
    throw new Error('useCall must be used within a CallProvider');
  }
  return context;
};

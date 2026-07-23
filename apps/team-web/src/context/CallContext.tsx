import React, { createContext, useContext, useState, useEffect } from 'react';
import { ActiveCallState } from '../types';

interface CallContextType {
  activeCall: ActiveCallState | null;
  startCall: (name: string, avatar: string, type: 'audio' | 'video', role?: string) => void;
  endCall: () => void;
  toggleMute: () => void;
  toggleVideo: () => void;
  toggleScreenShare: () => void;
  toggleMinimize: () => void;
}

const CallContext = createContext<CallContextType | undefined>(undefined);

export const CallProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeCall, setActiveCall] = useState<ActiveCallState | null>(null);

  useEffect(() => {
    let timer: any = null;
    let durationTimer: any = null;

    if (activeCall) {
      if (activeCall.status === 'calling') {
        timer = setTimeout(() => {
          setActiveCall(prev => prev ? { ...prev, status: 'connected' } : null);
        }, 2200);
      } else if (activeCall.status === 'connected') {
        durationTimer = setInterval(() => {
          setActiveCall(prev => prev ? { ...prev, durationSeconds: prev.durationSeconds + 1 } : null);
        }, 1000);
      }
    }

    return () => {
      if (timer) clearTimeout(timer);
      if (durationTimer) clearInterval(durationTimer);
    };
  }, [activeCall?.status]);

  const startCall = (name: string, avatar: string, type: 'audio' | 'video', role?: string) => {
    setActiveCall({
      callId: Math.random().toString(36).substring(2, 9),
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
  };

  const endCall = () => {
    setActiveCall(null);
  };

  const toggleMute = () => {
    setActiveCall(prev => prev ? { ...prev, isMuted: !prev.isMuted } : null);
  };

  const toggleVideo = () => {
    setActiveCall(prev => prev ? { ...prev, isVideoOff: !prev.isVideoOff } : null);
  };

  const toggleScreenShare = () => {
    setActiveCall(prev => prev ? { ...prev, isScreenSharing: !prev.isScreenSharing } : null);
  };

  const toggleMinimize = () => {
    setActiveCall(prev => prev ? { ...prev, isMinimized: !prev.isMinimized } : null);
  };

  return (
    <CallContext.Provider value={{ activeCall, startCall, endCall, toggleMute, toggleVideo, toggleScreenShare, toggleMinimize }}>
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

import React, { useRef, useEffect } from 'react';
import { useCall } from '../../context/CallContext';
import { 
  PhoneOff, Mic, MicOff, Video, VideoOff, 
  Monitor, Maximize2, Minimize2, Phone, Volume2, Sparkles, PhoneCall, Check, X 
} from 'lucide-react';

export const CallModal: React.FC = () => {
  const { 
    activeCall, 
    incomingCall, 
    localStream, 
    remoteStream, 
    audioVolume,
    acceptCall, 
    declineCall, 
    endCall, 
    toggleMute, 
    toggleVideo, 
    toggleScreenShare, 
    toggleMinimize 
  } = useCall();

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);

  // Bind local video stream
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream, activeCall?.isVideoOff]);

  // Bind remote audio & video stream for live voice & video exchange
  useEffect(() => {
    if (remoteAudioRef.current && remoteStream) {
      remoteAudioRef.current.srcObject = remoteStream;
    }
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream, activeCall?.status]);

  const formatDuration = (sec: number) => {
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <>
      {/* Invisible HTML5 Audio element for playing live incoming remote voice audio stream */}
      <audio ref={remoteAudioRef} autoPlay playsInline />

      {/* 1. Incoming Call Ringing Banner Popup (Bottom Right) */}
      {incomingCall && !activeCall && (
        <div className="fixed bottom-6 right-6 z-[100] bg-slate-950/95 border-2 border-yellow-500 rounded-3xl p-4 shadow-2xl backdrop-blur-2xl flex items-center gap-4 animate-in slide-in-from-bottom duration-300 font-sans max-w-sm">
          <div className="relative shrink-0">
            <img src={incomingCall.callerAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'} alt={incomingCall.callerName} className="w-12 h-12 rounded-2xl object-cover border border-yellow-500/40" />
            <span className="absolute inset-0 rounded-2xl border-2 border-yellow-500 animate-ping opacity-60 pointer-events-none" />
          </div>

          <div className="flex flex-col text-left overflow-hidden flex-1">
            <span className="text-[10px] font-black uppercase text-yellow-500 tracking-wider">Incoming {incomingCall.type === 'video' ? 'Video' : 'Voice'} Call</span>
            <span className="text-sm font-black text-white truncate">{incomingCall.callerName}</span>
            <span className="text-[10px] text-slate-400 font-semibold">BuyQK Teams Workstation</span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button 
              onClick={declineCall} 
              className="p-2.5 rounded-2xl bg-red-500/20 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/40 transition-all"
              title="Decline Call"
            >
              <X className="w-5 h-5" />
            </button>

            <button 
              onClick={acceptCall} 
              className="p-2.5 px-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black flex items-center gap-1.5 shadow-emerald-glow transition-all"
              title="Accept Call"
            >
              <PhoneCall className="w-5 h-5" />
              <span className="text-xs">Accept</span>
            </button>
          </div>
        </div>
      )}

      {/* 2. Active Call UI */}
      {activeCall && (
        activeCall.isMinimized ? (
          /* Minimized Floating Widget */
          <div className="fixed bottom-6 right-6 z-50 bg-slate-950/90 border border-yellow-500/40 rounded-2xl p-3 shadow-2xl backdrop-blur-xl flex items-center gap-3 animate-in slide-in-from-bottom duration-200 font-sans">
            <div className="relative">
              <img src={activeCall.recipientAvatar} alt={activeCall.recipientName} className="w-10 h-10 rounded-xl object-cover border border-yellow-500/40" />
              <span className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border border-slate-950 animate-pulse" />
            </div>

            <div className="flex flex-col text-left">
              <span className="text-xs font-black text-white">{activeCall.recipientName}</span>
              <div className="flex items-center gap-1.5 text-[10px] text-yellow-400 font-mono font-bold">
                {activeCall.status === 'calling' ? (
                  <span>Calling...</span>
                ) : (
                  <>
                    <span>{formatDuration(activeCall.durationSeconds)}</span>
                    <span className="text-[9px] text-emerald-400 font-sans">&bull; Live Voice</span>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1.5 ml-2">
              <button onClick={toggleMinimize} className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300">
                <Maximize2 className="w-4 h-4" />
              </button>
              <button onClick={endCall} className="p-2 rounded-xl bg-red-600 hover:bg-red-500 text-white shadow-lg">
                <PhoneOff className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          /* Fullscreen Call Modal */
          <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-2xl flex items-center justify-center p-4 animate-in fade-in duration-200 font-sans select-none">
            
            {/* Background Glow */}
            <div className="absolute w-[600px] h-[600px] bg-yellow-500/10 rounded-full blur-[140px] pointer-events-none" />

            <div className="relative max-w-2xl w-full bg-slate-900/80 border border-yellow-500/30 rounded-3xl p-6 shadow-2xl flex flex-col justify-between min-h-[520px] overflow-hidden">
              
              {/* Header Bar */}
              <div className="flex items-center justify-between z-10">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-yellow-500 bg-yellow-500/10 border border-yellow-500/20 px-3 py-1 rounded-full flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" /> BuyQK Teams {activeCall.type === 'video' ? 'Live Video Call' : 'Realtime Voice Call'}
                  </span>
                </div>

                <button 
                  onClick={toggleMinimize} 
                  className="p-2 rounded-xl bg-slate-950/60 hover:bg-slate-950 text-slate-400 hover:text-white border border-slate-800 transition-all"
                  title="Minimize Call"
                >
                  <Minimize2 className="w-4 h-4" />
                </button>
              </div>

              {/* Center Main Screen */}
              <div className="flex-1 flex flex-col items-center justify-center my-6 relative z-10">
                {!activeCall.isVideoOff ? (
                  <div className="w-full h-72 rounded-2xl overflow-hidden border-2 border-yellow-500/40 bg-slate-950 relative shadow-2xl flex items-center justify-center">
                    {remoteStream ? (
                      <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
                    ) : (
                      <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                    )}

                    <div className="absolute bottom-3 left-3 bg-slate-950/80 px-3 py-1 rounded-xl text-xs text-white font-bold border border-slate-800 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span>{remoteStream ? activeCall.recipientName : 'Local Camera Feed'}</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-4">
                    <div className="relative">
                      <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl overflow-hidden border-4 border-yellow-500/40 bg-slate-800 shadow-2xl">
                        <img src={activeCall.recipientAvatar} alt={activeCall.recipientName} className="w-full h-full object-cover" />
                      </div>
                      {activeCall.status === 'calling' && (
                        <span className="absolute inset-0 rounded-3xl border-4 border-yellow-500 animate-ping opacity-50" />
                      )}
                    </div>

                    <div className="text-center flex flex-col items-center gap-2">
                      <h3 className="text-xl sm:text-2xl font-black text-white">{activeCall.recipientName}</h3>
                      <p className="text-xs text-slate-400 font-semibold">{activeCall.recipientRole}</p>

                      {/* Live Microphone Voice Equalizer Visualizer Bar */}
                      <div className="mt-1 flex flex-col items-center gap-2">
                        <div className="flex items-center gap-1 bg-slate-950 px-4 py-1.5 rounded-full border border-slate-800">
                          {activeCall.status === 'calling' ? (
                            <>
                              <Volume2 className="w-4 h-4 text-yellow-500 animate-pulse" />
                              <span className="text-xs font-bold text-yellow-400">Ringing...</span>
                            </>
                          ) : (
                            <>
                              <div className="flex items-center gap-1 h-5">
                                <span 
                                  className="w-1 bg-emerald-500 rounded-full transition-all duration-75" 
                                  style={{ height: `${Math.max(6, Math.min(20, audioVolume * 0.2))}px` }} 
                                />
                                <span 
                                  className="w-1 bg-emerald-400 rounded-full transition-all duration-75" 
                                  style={{ height: `${Math.max(10, Math.min(24, audioVolume * 0.35))}px` }} 
                                />
                                <span 
                                  className="w-1 bg-emerald-500 rounded-full transition-all duration-75" 
                                  style={{ height: `${Math.max(8, Math.min(20, audioVolume * 0.25))}px` }} 
                                />
                              </div>
                              <span className="text-xs font-mono font-bold text-emerald-400 ml-1">
                                {formatDuration(activeCall.durationSeconds)}
                              </span>
                              <span className="text-[10px] text-slate-400 font-bold ml-1 uppercase">(Live Voice Connected)</span>
                            </>
                          )}
                        </div>

                        {/* Microphone Status Alert */}
                        {activeCall.isMuted ? (
                          <span className="text-[10px] font-bold text-red-400 bg-red-500/10 px-2.5 py-0.5 rounded-md border border-red-500/20">
                            Microphone Muted
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold text-slate-400">
                            Speak into your microphone to test live voice exchange
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Control Dock */}
              <div className="flex items-center justify-center gap-4 pt-4 border-t border-slate-800/80 z-10">
                
                {/* Mute Mic */}
                <button
                  onClick={toggleMute}
                  className={`p-3.5 rounded-2xl transition-all border ${
                    activeCall.isMuted 
                      ? 'bg-red-500/20 text-red-400 border-red-500/40' 
                      : 'bg-slate-950 text-slate-200 border-slate-800 hover:border-yellow-500/40'
                  }`}
                  title={activeCall.isMuted ? 'Unmute Mic' : 'Mute Mic'}
                >
                  {activeCall.isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </button>

                {/* Toggle Video */}
                <button
                  onClick={toggleVideo}
                  className={`p-3.5 rounded-2xl transition-all border ${
                    activeCall.isVideoOff 
                      ? 'bg-red-500/20 text-red-400 border-red-500/40' 
                      : 'bg-slate-950 text-slate-200 border-slate-800 hover:border-yellow-500/40'
                  }`}
                  title={activeCall.isVideoOff ? 'Turn Camera On' : 'Turn Camera Off'}
                >
                  {activeCall.isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
                </button>

                {/* Screen Share */}
                <button
                  onClick={toggleScreenShare}
                  className={`p-3.5 rounded-2xl transition-all border ${
                    activeCall.isScreenSharing 
                      ? 'bg-yellow-500 text-slate-950 border-yellow-400 font-extrabold shadow-gold-glow' 
                      : 'bg-slate-950 text-slate-200 border-slate-800 hover:border-yellow-500/40'
                  }`}
                  title="Screen Share"
                >
                  <Monitor className="w-5 h-5" />
                </button>

                {/* End Call Button */}
                <button
                  onClick={endCall}
                  className="p-3.5 px-6 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-extrabold text-xs shadow-lg flex items-center gap-2 transition-all cursor-pointer"
                >
                  <PhoneOff className="w-5 h-5" />
                  <span>End Call</span>
                </button>

              </div>

            </div>

          </div>
        )
      )}
    </>
  );
};

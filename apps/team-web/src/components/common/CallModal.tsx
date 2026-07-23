import React, { useRef, useEffect } from 'react';
import { useCall } from '../../context/CallContext';
import {
  PhoneOff, Mic, MicOff, Video, VideoOff,
  Monitor, Maximize2, Minimize2, Volume2, Sparkles, PhoneCall, X, AlertTriangle
} from 'lucide-react';

export const CallModal: React.FC = () => {
  const {
    activeCall,
    incomingCall,
    localStream,
    remoteStream,
    audioVolume,
    permissionError,
    acceptCall,
    declineCall,
    endCall,
    toggleMute,
    toggleVideo,
    toggleScreenShare,
    toggleMinimize,
    clearPermissionError
  } = useCall();

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  // Separate dedicated audio element that always stays mounted
  const remoteAudioRef = useRef<HTMLAudioElement>(null);

  // Always bind local video stream imperatively
  useEffect(() => {
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // Always bind remote stream imperatively — both audio AND video elements
  useEffect(() => {
    if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = remoteStream;
      if (remoteStream) {
        remoteAudioRef.current.play().catch(() => {});
      }
    }
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStream;
      if (remoteStream) {
        remoteVideoRef.current.play().catch(() => {});
      }
    }
  }, [remoteStream]);

  const fmt = (s: number) =>
    `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  return (
    <>
      {/* Persistent hidden audio element — ALWAYS mounted so srcObject is never lost */}
      <audio ref={remoteAudioRef} autoPlay playsInline style={{ display: 'none' }} />

      {/* ── Permission Error Toast ── */}
      {permissionError && (
        <div className="fixed top-6 right-6 z-[110] bg-amber-950/90 border-2 border-yellow-500 rounded-2xl p-4 shadow-2xl backdrop-blur-xl flex items-center gap-3 max-w-md font-sans text-xs text-white">
          <AlertTriangle className="w-6 h-6 text-yellow-400 shrink-0 animate-bounce" />
          <div className="flex flex-col gap-1 flex-1">
            <span className="font-extrabold text-yellow-400">Permission Required</span>
            <p className="text-[11px] text-slate-200 leading-relaxed font-medium">{permissionError}</p>
          </div>
          <button onClick={clearPermissionError} className="p-1.5 rounded-lg bg-amber-900/60 hover:bg-amber-800 text-yellow-400">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ── Incoming Call Popup (bottom right) ── */}
      {incomingCall && !activeCall && (
        <div className="fixed bottom-6 right-6 z-[100] bg-slate-950/95 border-2 border-yellow-500/80 rounded-3xl p-5 shadow-[0_20px_50px_rgba(234,179,8,0.3)] backdrop-blur-2xl flex items-center gap-4 font-sans max-w-sm animate-in slide-in-from-bottom duration-300">
          <div className="relative shrink-0">
            <div className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-yellow-500/60 bg-slate-800">
              <img src={incomingCall.callerAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'} alt={incomingCall.callerName} className="w-full h-full object-cover" />
            </div>
            <span className="absolute inset-0 rounded-2xl border-2 border-yellow-400 animate-ping opacity-75 pointer-events-none" />
          </div>
          <div className="flex flex-col text-left overflow-hidden flex-1">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
              <span className="text-[10px] font-black uppercase text-yellow-500 tracking-widest">
                Incoming {incomingCall.type === 'video' ? 'Video' : 'Voice'} Call
              </span>
            </div>
            <span className="text-sm font-black text-white truncate mt-0.5">{incomingCall.callerName}</span>
            <span className="text-[10px] text-slate-400 font-bold font-mono">BuyQK Teams</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={declineCall} className="p-3 rounded-2xl bg-red-500/20 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/40 transition-all cursor-pointer" title="Decline">
              <X className="w-5 h-5" />
            </button>
            <button onClick={acceptCall} className="p-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black flex items-center gap-1.5 shadow-lg transition-all cursor-pointer" title="Accept">
              <PhoneCall className="w-5 h-5" />
              <span className="text-xs">Accept</span>
            </button>
          </div>
        </div>
      )}

      {/* ── Active Call UI ── */}
      {activeCall && (
        activeCall.isMinimized ? (
          /* Minimized widget */
          <div className="fixed bottom-6 right-6 z-[100] bg-slate-950/95 border border-yellow-500/50 rounded-2xl p-3.5 shadow-2xl backdrop-blur-2xl flex items-center gap-3.5 font-sans">
            <div className="relative">
              <img src={activeCall.recipientAvatar} alt={activeCall.recipientName} className="w-10 h-10 rounded-xl object-cover border border-yellow-500/50" />
              <span className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border border-slate-950 animate-pulse" />
            </div>
            <div className="flex flex-col text-left">
              <span className="text-xs font-black text-white">{activeCall.recipientName}</span>
              <div className="flex items-center gap-1.5 text-[10px] text-yellow-400 font-mono font-bold">
                {activeCall.status === 'calling'
                  ? <span className="animate-pulse">Calling...</span>
                  : <span>{fmt(activeCall.durationSeconds)} • Live</span>
                }
              </div>
            </div>
            <div className="flex items-center gap-1.5 ml-2">
              <button onClick={toggleMinimize} className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 transition-colors"><Maximize2 className="w-4 h-4" /></button>
              <button onClick={endCall} className="p-2 rounded-xl bg-red-600 hover:bg-red-500 text-white shadow-lg transition-colors"><PhoneOff className="w-4 h-4" /></button>
            </div>
          </div>
        ) : (
          /* Full-screen call modal */
          <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-3xl flex items-center justify-center p-4 sm:p-6 font-sans select-none">
            <div className="absolute w-[700px] h-[700px] bg-yellow-500/10 rounded-full blur-[180px] -top-20 -left-20 pointer-events-none" />
            <div className="absolute w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[160px] -bottom-20 -right-20 pointer-events-none" />

            <div className="relative max-w-3xl w-full bg-slate-900/70 border border-yellow-500/30 rounded-3xl p-6 sm:p-8 shadow-[0_25px_60px_rgba(0,0,0,0.8)] backdrop-blur-2xl flex flex-col justify-between min-h-[550px] overflow-hidden">

              {/* Header */}
              <div className="flex items-center justify-between z-10 border-b border-slate-800/80 pb-4">
                <span className="text-[10px] font-black uppercase tracking-widest text-yellow-500 bg-yellow-500/10 border border-yellow-500/20 px-3.5 py-1.5 rounded-full flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
                  BuyQK Teams {activeCall.type === 'video' ? 'Live Video Call' : 'Realtime Voice Call'}
                </span>
                <button onClick={toggleMinimize} className="p-2 rounded-xl bg-slate-950/70 hover:bg-slate-950 text-slate-400 hover:text-white border border-slate-800 transition-all" title="Minimize">
                  <Minimize2 className="w-4 h-4" />
                </button>
              </div>

              {/* Center — video or avatar view */}
              <div className="flex-1 flex flex-col items-center justify-center my-6 relative z-10 gap-4">

                {activeCall.type === 'video' ? (
                  /* ── Video mode — show both remote & local ── */
                  <div className="w-full flex flex-col gap-3">
                    {/* Remote video (full width) */}
                    <div className="w-full h-72 rounded-3xl overflow-hidden border-2 border-yellow-500/40 bg-slate-950 relative shadow-2xl">
                      {/* remoteVideoRef is ALWAYS in DOM — srcObject set imperatively */}
                      <video
                        ref={remoteVideoRef}
                        autoPlay
                        playsInline
                        className="w-full h-full object-cover"
                      />
                      {/* Overlay label */}
                      <div className="absolute bottom-3 left-3 bg-slate-950/80 backdrop-blur-md px-3 py-1 rounded-xl text-xs text-white font-bold border border-slate-800 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        {remoteStream ? activeCall.recipientName : 'Waiting for remote video...'}
                      </div>
                    </div>
                    {/* Local video (PiP bottom right) */}
                    <div className="self-end w-36 h-24 rounded-2xl overflow-hidden border-2 border-slate-700 bg-slate-900 relative shadow-xl">
                      <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                      <div className="absolute bottom-1 left-2 text-[9px] text-white font-bold opacity-80">You</div>
                    </div>
                  </div>
                ) : (
                  /* ── Audio mode — avatar + equalizer ── */
                  <div className="flex flex-col items-center gap-5">
                    <div className="relative">
                      <div className="w-32 h-32 sm:w-36 sm:h-36 rounded-3xl overflow-hidden border-4 border-yellow-500/50 bg-slate-800 shadow-[0_0_40px_rgba(234,179,8,0.25)]">
                        <img src={activeCall.recipientAvatar} alt={activeCall.recipientName} className="w-full h-full object-cover" />
                      </div>
                      {activeCall.status === 'calling' && (
                        <span className="absolute inset-0 rounded-3xl border-4 border-yellow-500 animate-ping opacity-60 pointer-events-none" />
                      )}
                    </div>

                    <div className="text-center flex flex-col items-center gap-2">
                      <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">{activeCall.recipientName}</h3>
                      <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">{activeCall.recipientRole}</p>

                      <div className="mt-2 flex flex-col items-center gap-2">
                        <div className="flex items-center gap-2 bg-slate-950 px-5 py-2 rounded-full border border-slate-800 shadow-inner">
                          {activeCall.status === 'calling' ? (
                            <>
                              <Volume2 className="w-4 h-4 text-yellow-500 animate-pulse" />
                              <span className="text-xs font-bold text-yellow-400">Ringing Teammate...</span>
                            </>
                          ) : (
                            <>
                              <div className="flex items-center gap-1 h-6 px-1">
                                {[0.3, 0.6, 0.4, 0.8, 0.5, 0.9, 0.3, 0.7, 0.5, 0.4, 0.8, 0.3].map((mult, i) => (
                                  <span key={i} className="w-1 bg-gradient-to-t from-emerald-500 to-teal-300 rounded-full transition-all duration-75"
                                    style={{ height: `${Math.max(6, Math.min(26, audioVolume * mult * 0.4))}px` }}
                                  />
                                ))}
                              </div>
                              <span className="text-xs font-mono font-bold text-emerald-400 ml-2">{fmt(activeCall.durationSeconds)}</span>
                              <span className="text-[10px] text-slate-400 font-bold ml-1 uppercase">Voice Connected</span>
                            </>
                          )}
                        </div>
                        {activeCall.isMuted ? (
                          <span className="text-[10px] font-bold text-red-400 bg-red-500/10 px-3 py-1 rounded-full border border-red-500/20">Microphone Muted</span>
                        ) : (
                          <span className="text-[10px] font-medium text-slate-400">Speak into your microphone</span>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Control Dock */}
              <div className="flex items-center justify-center gap-4 sm:gap-6 pt-5 border-t border-slate-800/80 z-10">
                <button
                  onClick={toggleMute}
                  className={`p-4 rounded-2xl transition-all border shadow-lg cursor-pointer ${activeCall.isMuted ? 'bg-red-500/20 text-red-400 border-red-500/40' : 'bg-slate-950 text-slate-200 border-slate-800 hover:border-yellow-500/40 hover:text-white'}`}
                  title={activeCall.isMuted ? 'Unmute' : 'Mute'}
                >
                  {activeCall.isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </button>

                <button
                  onClick={toggleVideo}
                  className={`p-4 rounded-2xl transition-all border shadow-lg cursor-pointer ${activeCall.isVideoOff ? 'bg-red-500/20 text-red-400 border-red-500/40' : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'}`}
                  title={activeCall.isVideoOff ? 'Open Camera' : 'Turn Off Camera'}
                >
                  {activeCall.isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
                </button>

                <button
                  onClick={toggleScreenShare}
                  className={`p-4 rounded-2xl transition-all border shadow-lg cursor-pointer ${activeCall.isScreenSharing ? 'bg-yellow-500 text-slate-950 border-yellow-400' : 'bg-slate-950 text-slate-200 border-slate-800 hover:border-yellow-500/40 hover:text-white'}`}
                  title="Screen Share"
                >
                  <Monitor className="w-5 h-5" />
                </button>

                <button
                  onClick={endCall}
                  className="p-4 px-8 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-extrabold text-xs shadow-lg flex items-center gap-2 transition-all cursor-pointer hover:scale-105"
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

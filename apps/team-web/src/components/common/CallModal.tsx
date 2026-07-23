import React, { useRef, useEffect } from 'react';
import { useCall } from '../../context/CallContext';
import { 
  PhoneOff, Mic, MicOff, Video, VideoOff, 
  Monitor, Maximize2, Minimize2, Phone, Volume2, Sparkles 
} from 'lucide-react';

export const CallModal: React.FC = () => {
  const { activeCall, endCall, toggleMute, toggleVideo, toggleScreenShare, toggleMinimize } = useCall();
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;

    if (activeCall && !activeCall.isVideoOff) {
      navigator.mediaDevices?.getUserMedia({ video: true, audio: true })
        .then(s => {
          stream = s;
          if (videoRef.current) {
            videoRef.current.srcObject = s;
          }
        })
        .catch(err => {
          console.warn("Local video stream unavailable:", err);
        });
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach(t => t.stop());
      }
    };
  }, [activeCall?.isVideoOff, activeCall?.callId]);

  if (!activeCall) return null;

  const formatDuration = (sec: number) => {
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // Minimized Floating Widget
  if (activeCall.isMinimized) {
    return (
      <div className="fixed bottom-6 right-6 z-50 bg-slate-950/90 border border-yellow-500/40 rounded-2xl p-3 shadow-2xl backdrop-blur-xl flex items-center gap-3 animate-in slide-in-from-bottom duration-200">
        <div className="relative">
          <img src={activeCall.recipientAvatar} alt={activeCall.recipientName} className="w-10 h-10 rounded-xl object-cover border border-yellow-500/40" />
          <span className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border border-slate-950 animate-pulse" />
        </div>

        <div className="flex flex-col text-left">
          <span className="text-xs font-black text-white">{activeCall.recipientName}</span>
          <span className="text-[10px] text-yellow-400 font-mono font-bold">
            {activeCall.status === 'calling' ? 'Calling...' : formatDuration(activeCall.durationSeconds)}
          </span>
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
    );
  }

  // Fullscreen Call Modal
  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-2xl flex items-center justify-center p-4 animate-in fade-in duration-200 font-sans select-none">
      
      {/* Background Glow */}
      <div className="absolute w-[600px] h-[600px] bg-yellow-500/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="relative max-w-2xl w-full bg-slate-900/80 border border-yellow-500/30 rounded-3xl p-6 shadow-2xl flex flex-col justify-between min-h-[500px] overflow-hidden">
        
        {/* Header Bar */}
        <div className="flex items-center justify-between z-10">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-yellow-500 bg-yellow-500/10 border border-yellow-500/20 px-3 py-1 rounded-full flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> BuyQK Teams {activeCall.type === 'video' ? 'Video Call' : 'Audio Call'}
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
            <div className="w-full h-72 rounded-2xl overflow-hidden border-2 border-yellow-500/40 bg-slate-950 relative shadow-2xl">
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
              <div className="absolute bottom-3 left-3 bg-slate-950/80 px-3 py-1 rounded-xl text-xs text-white font-bold border border-slate-800">
                You (Local Feed)
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

              <div className="text-center flex flex-col items-center gap-1">
                <h3 className="text-xl sm:text-2xl font-black text-white">{activeCall.recipientName}</h3>
                <p className="text-xs text-slate-400 font-semibold">{activeCall.recipientRole}</p>

                <div className="mt-2 inline-flex items-center gap-2 bg-slate-950 px-4 py-1.5 rounded-full border border-slate-800">
                  {activeCall.status === 'calling' ? (
                    <>
                      <Volume2 className="w-4 h-4 text-yellow-500 animate-pulse" />
                      <span className="text-xs font-bold text-yellow-400">Ringing...</span>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-1">
                        <span className="w-1.5 h-4 bg-emerald-500 rounded-full animate-pulse" />
                        <span className="w-1.5 h-6 bg-emerald-400 rounded-full animate-pulse delay-75" />
                        <span className="w-1.5 h-3 bg-emerald-500 rounded-full animate-pulse delay-150" />
                      </div>
                      <span className="text-xs font-mono font-bold text-emerald-400">
                        {formatDuration(activeCall.durationSeconds)}
                      </span>
                    </>
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
  );
};

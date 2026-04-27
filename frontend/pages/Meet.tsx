import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Video, Mic, MicOff, VideoOff, MonitorUp, PhoneOff, Settings, Users, MessageSquare, Keyboard, Loader2, X } from 'lucide-react';
import { useStore } from '../store/useStore';
import { useNavigate } from 'react-router-dom';

export function Meet() {
  const [inMeeting, setInMeeting] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [meetingCode, setMeetingCode] = useState('');
  const [isMicOn, setIsMicOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);

  const [showComingSoon, setShowComingSoon] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const screenRef = useRef<HTMLVideoElement>(null);

  const { currentUser } = useStore();
  const navigate = useNavigate();

  const handleJoin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setShowComingSoon(true);
  };

  const handleNewMeeting = async () => {
    setShowComingSoon(true);
  };

  const handleLeave = () => {
    if (mediaStream) {
      mediaStream.getTracks().forEach(track => track.stop());
    }
    setMediaStream(null);
    setInMeeting(false);
    setIsScreenSharing(false);
  };

  const toggleVideo = () => {
    if (mediaStream) {
      const videoTrack = mediaStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !isVideoOn;
        setIsVideoOn(!isVideoOn);
      }
    }
  };

  const toggleAudio = () => {
    if (mediaStream) {
      const audioTrack = mediaStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !isMicOn;
        setIsMicOn(!isMicOn);
      }
    }
  };

  const toggleScreenShare = async () => {
    try {
      if (!isScreenSharing) {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        if (screenRef.current) {
          screenRef.current.srcObject = screenStream;
        }
        setIsScreenSharing(true);
        screenStream.getVideoTracks()[0].onended = () => {
          setIsScreenSharing(false);
        };
      } else {
        if (screenRef.current?.srcObject) {
          (screenRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
          screenRef.current.srcObject = null;
        }
        setIsScreenSharing(false);
      }
    } catch(err) {
      console.error("Screen share error", err);
    }
  };

  useEffect(() => {
    if (videoRef.current && mediaStream && isVideoOn && !isScreenSharing) {
      videoRef.current.srcObject = mediaStream;
    }
  }, [mediaStream, isVideoOn, isScreenSharing]);

  if (isJoining) {
    return (
      <div className="h-[90vh] flex flex-col items-center justify-center space-y-6">
        <Loader2 className="w-16 h-16 text-cyber-blue animate-spin" />
        <h2 className="text-2xl font-display font-bold text-white uppercase tracking-widest animate-pulse">Establishing Secure Uplink...</h2>
      </div>
    );
  }

  if (!inMeeting) {
    return (
      <div className="min-h-[80vh] flex flex-col md:flex-row items-center justify-center p-8 gap-16 max-w-6xl mx-auto">
        <AnimatePresence>
          {showComingSoon && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                onClick={() => setShowComingSoon(false)}
              />
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="relative bg-[#050B14] border border-cyber-yellow/30 p-8 shadow-[0_0_40px_rgba(255,214,0,0.15)] max-w-sm w-full text-center"
              >
                <button
                  onClick={() => setShowComingSoon(false)}
                  className="absolute top-4 right-4 text-white/50 hover:text-white"
                >
                  <X size={20} />
                </button>
                <div className="w-16 h-16 rounded-full border border-cyber-yellow/30 bg-cyber-yellow/10 flex items-center justify-center mx-auto mb-6 text-cyber-yellow animate-pulse">
                  <Video size={32} />
                </div>
                <h2 className="text-2xl font-display font-bold text-white mb-2 uppercase tracking-wider">
                  Feature Coming Soon
                </h2>
                <p className="text-white/60 font-mono text-sm leading-relaxed mb-6 uppercase">
                  Secure Comms infrastructure is currently undergoing recalibration. ETA: Unknown.
                </p>
                <button onClick={() => setShowComingSoon(false)} className="w-full bg-white/10 hover:bg-white/20 border border-white/20 text-white font-mono text-xs uppercase tracking-widest py-3 transition-colors">
                  Acknowledge
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <div className="flex-1 space-y-8 animate-in slide-in-from-left-8 duration-500">
          <h1 className="text-4xl md:text-5xl font-display font-bold text-white leading-tight">
            Premium covert comms.<br />
            <span className="text-cyber-blue">For operational teams.</span>
          </h1>
          <p className="text-white/60 font-mono">
            We engineered DSUC Meet to protect your operational security during sensitive briefings.
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-4 pt-4">
            <button
              onClick={handleNewMeeting}
              className="bg-cyber-blue text-black hover:bg-white px-6 py-3 font-display font-bold text-sm uppercase tracking-widest cyber-button flex items-center gap-2 w-full sm:w-auto justify-center"
            >
              <Video className="w-5 h-5" /> New Meeting
            </button>
            <form onSubmit={handleJoin} className="relative w-full sm:w-auto">
              <Keyboard className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 w-5 h-5" />
              <input
                type="text"
                placeholder="Enter a link"
                value={meetingCode}
                onChange={e => setMeetingCode(e.target.value)}
                className="w-full sm:w-72 bg-surface border border-white/20 px-10 py-3 text-white focus:outline-none focus:border-cyber-blue font-mono transition-colors"
                required
              />
              <button
                type="submit"
                disabled={!meetingCode}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-cyber-blue font-bold font-display uppercase tracking-widest text-sm disabled:opacity-50 hover:text-white"
              >
                Join
              </button>
            </form>
          </div>
          <div className="pt-8 border-t border-white/10 text-sm text-white/40 font-mono">
            <a href="#" className="hover:text-cyber-blue transition-colors underline decoration-white/20 underline-offset-4">Learn more</a> about DSUC operations.
          </div>
        </div>

        <div className="flex-1 w-full max-w-md animate-in slide-in-from-right-8 duration-500 delay-150">
          <div className="aspect-square rounded-full border border-cyber-blue/10 flex items-center justify-center relative bg-gradient-to-tr from-cyber-blue/5 to-surface/50 shadow-[0_0_50px_rgba(41,121,255,0.05)]">
             <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#050B14] to-transparent z-10 rounded-b-full"></div>
             <motion.div
               animate={{ y: [0, -10, 0] }}
               transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
               className="relative z-20"
             >
               <div className="w-64 h-64 border-2 border-dashed border-cyber-blue/30 rounded-full flex items-center justify-center bg-black/50 overflow-hidden relative group">
                 <img src="/logo.png" alt="DSUC Logo" className="w-32 h-32 object-contain opacity-20 grayscale brightness-200 pointer-events-none" />
                 <div className="absolute inset-0 bg-cyber-blue/10 flex items-center justify-center mix-blend-overlay">
                    <Video className="w-12 h-12 text-cyber-blue/50 drop-shadow-[0_0_10px_rgba(41,121,255,0.8)]" />
                 </div>
               </div>
             </motion.div>
          </div>
        </div>
      </div>
    );
  }

  // Active Meeting View
  return (
    <div className="h-[90vh] bg-black flex flex-col pt-4">
       <div className={`flex-1 p-4 grid gap-4 auto-rows-fr ${isScreenSharing ? 'grid-cols-1 lg:grid-cols-4' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'}`}>

          {/* Screen Share View */}
          {isScreenSharing && (
            <div className="bg-surface/80 rounded-2xl border border-cyber-blue/50 overflow-hidden relative col-span-1 lg:col-span-3 shadow-[0_0_40px_rgba(41,121,255,0.2)]">
              <video ref={screenRef} autoPlay playsInline muted className="w-full h-full object-contain bg-zinc-900" />
              <div className="absolute top-4 left-4 flex gap-2">
                 <div className="bg-cyber-blue/80 px-3 py-1 rounded-md border border-cyber-blue font-bold text-black text-xs uppercase tracking-widest animate-pulse">
                    Screen Shared
                 </div>
              </div>
            </div>
          )}

          {/* Main User Camera */}
          <div className={`bg-surface/80 rounded-2xl border border-white/10 overflow-hidden relative group shadow-[0_0_40px_rgba(0,0,0,0.5)] ${isScreenSharing ? 'col-span-1' : 'col-span-1 md:col-span-2 lg:col-span-2'}`}>
            {isVideoOn ? (
               <div className="w-full h-full bg-zinc-900 flex items-center justify-center relative overflow-hidden">
                 <video autoPlay playsInline muted ref={videoRef} className="absolute w-full h-full object-cover -scale-x-100" />
               </div>
            ) : (
               <div className="w-full h-full bg-zinc-900 flex items-center justify-center">
                 <div className="w-32 h-32 rounded-full border border-white/20 flex items-center justify-center overflow-hidden bg-black/50 shadow-lg">
                    {currentUser?.avatar ? (
                      <img src={currentUser.avatar} alt="You" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-4xl text-white/50">{currentUser?.name?.[0] || '?'}</span>
                    )}
                 </div>
               </div>
            )}
            <div className="absolute top-4 left-4 flex gap-2 z-10">
               {!isMicOn && (
                 <div className="bg-red-500/80 px-2 py-1 rounded-md border border-red-400">
                    <MicOff className="w-4 h-4 text-white" />
                 </div>
               )}
            </div>
            <div className="absolute bottom-4 left-4 text-white font-display font-medium text-lg drop-shadow-md bg-black/50 px-3 py-1 rounded border border-white/10 z-10 backdrop-blur-sm">
              {currentUser?.name || 'You'} (Operative)
            </div>
          </div>

          {/* Other participant placeholder */}
          <div className="bg-surface/80 rounded-2xl border border-white/10 overflow-hidden relative shadow-[0_0_40px_rgba(0,0,0,0.5)]">
            <div className="w-full h-full bg-zinc-900 flex items-center justify-center relative">
              <div className="w-24 h-24 rounded-full border border-white/10 flex items-center justify-center bg-black/50 shadow-lg relative">
                  <span className="text-3xl text-white/50 font-display">C</span>
              </div>
            </div>
            <div className="absolute bottom-4 left-4 text-white font-display font-medium bg-black/50 px-3 py-1 rounded border border-white/10 backdrop-blur-sm">
              Commander HQ
            </div>
            <div className="absolute top-4 left-4 bg-red-500/80 px-2 py-1 rounded-md border border-red-400">
              <MicOff className="w-4 h-4 text-white" />
            </div>
          </div>
       </div>

       {/* Controls Bar */}
       <div className="h-24 px-6 flex items-center justify-between">
          <div className="flexitems-center gap-4 w-1/3">
             <div className="text-white/80 font-mono text-sm tracking-widest bg-white/5 px-3 py-2 rounded border border-white/10 flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                {meetingCode || 'hq-xyz'}
             </div>
          </div>

          <div className="flex items-center justify-center gap-3 w-1/3">
            <button
              onClick={toggleAudio}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${isMicOn ? 'bg-surface border border-white/20 hover:bg-white/10 text-white' : 'bg-red-500 hover:bg-red-600 text-white'}`}
            >
               {isMicOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
            </button>
            <button
              onClick={toggleVideo}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${isVideoOn ? 'bg-surface border border-white/20 hover:bg-white/10 text-white' : 'bg-red-500 hover:bg-red-600 text-white'}`}
            >
               {isVideoOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
            </button>
            <button
              onClick={toggleScreenShare}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors hidden sm:flex ${isScreenSharing ? 'bg-cyber-blue text-black border border-cyber-blue shadow-[0_0_15px_rgba(41,121,255,0.4)]' : 'bg-surface border border-white/20 text-white hover:bg-white/10'}`}
            >
               <MonitorUp className="w-5 h-5" />
            </button>
            <button className="w-12 h-12 rounded-full bg-surface border border-white/20 text-white flex items-center justify-center hover:bg-white/10 transition-colors hidden sm:flex">
               <Settings className="w-5 h-5" />
            </button>
            <button
              onClick={handleLeave}
              className="w-14 h-12 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors px-4 ml-2"
            >
               <PhoneOff className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center justify-end gap-3 w-1/3">
            <button className="text-white/60 hover:text-white transition-colors relative">
               <Users className="w-6 h-6" />
               <span className="absolute -top-1 -right-1 bg-cyber-blue text-black text-[10px] font-bold px-1.5 rounded-full">2</span>
            </button>
            <button className="text-white/60 hover:text-white transition-colors ml-4 hidden sm:block">
               <MessageSquare className="w-6 h-6" />
            </button>
          </div>
       </div>
    </div>
  );
}

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Video,
  Mic,
  MicOff,
  VideoOff,
  MonitorUp,
  PhoneOff,
  Settings,
  Users,
  MessageSquare,
  Keyboard,
  Loader2,
  X,
} from "lucide-react";
import { useStore } from "../store/useStore";
import { useNavigate } from "react-router-dom";

export function Meet() {
  const [inMeeting, setInMeeting] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [meetingCode, setMeetingCode] = useState("");
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
      mediaStream.getTracks().forEach((track) => track.stop());
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
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
        });
        if (screenRef.current) {
          screenRef.current.srcObject = screenStream;
        }
        setIsScreenSharing(true);
        screenStream.getVideoTracks()[0].onended = () => {
          setIsScreenSharing(false);
        };
      } else {
        if (screenRef.current?.srcObject) {
          (screenRef.current.srcObject as MediaStream)
            .getTracks()
            .forEach((track) => track.stop());
          screenRef.current.srcObject = null;
        }
        setIsScreenSharing(false);
      }
    } catch (err) {
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
      <div className="h-[90vh] flex flex-col items-center justify-center space-y-6 bg-main-bg">
        <Loader2 className="w-16 h-16 text-primary animate-spin" />
        <h2 className="text-2xl font-display font-bold text-text-main tracking-wide animate-pulse">
          Connecting to room...
        </h2>
      </div>
    );
  }

  if (!inMeeting) {
    return (
      <div className="min-h-[80vh] flex flex-col md:flex-row items-center justify-center p-8 gap-16 max-w-6xl mx-auto bg-main-bg">
        <AnimatePresence>
          {showComingSoon && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-main-bg/60 backdrop-blur-sm"
                onClick={() => setShowComingSoon(false)}
              />
              <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="relative bg-surface rounded-none p-8 shadow-md  max-w-sm w-full text-center"
              >
                <button
                  onClick={() => setShowComingSoon(false)}
                  className="absolute top-4 right-4 text-text-muted hover:text-text-main transition-colors"
                >
                  <X size={20} />
                </button>
                <div className="w-20 h-20 bg-accent border border-border-main flex items-center justify-center mx-auto mb-6 text-main-bg shadow-sm">
                  <Video size={40} className="animate-pulse" />
                </div>
                <h2 className="text-2xl font-display font-bold text-text-main mb-2 tracking-tight uppercase">
                  Coming Soon
                </h2>
                <p className="text-text-muted font-mono text-xs leading-relaxed mb-8">
                  DSUC Meet communication system is currently under maintenance
                  to provide better connection quality. Check back later!
                </p>
                <button
                  onClick={() => setShowComingSoon(false)}
                  className="w-full bg-main-bg hover:bg-surface border border-border-main text-text-main font-bold text-sm uppercase tracking-wider py-4 transition-colors"
                >
                  Understood
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <div className="flex-1 space-y-8 animate-in slide-in-from-left-8 duration-500">
          <h1 className="text-4xl md:text-5xl font-display font-bold text-text-main leading-tight tracking-tight uppercase">
            High Quality Connection.
            <br />
            <span className="text-primary">For the Community.</span>
          </h1>
          <p className="text-text-muted text-sm font-mono max-w-lg mb-10 leading-relaxed">
            DSUC Meet is designed to provide a seamless and secure online
            meeting experience for all club members.
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-4 pt-4">
            <button
              onClick={handleNewMeeting}
              className="bg-primary text-main-bg hover:opacity-90 border border-border-main px-6 py-4 font-bold text-[10px] sm:text-xs uppercase tracking-widest flex items-center gap-2 w-full sm:w-auto justify-center transition-all shadow-sm hover:translate-y-[2px] hover:shadow-md-none"
            >
              <Video className="w-5 h-5" /> New Meeting
            </button>
            <form
              onSubmit={handleJoin}
              className="relative w-full sm:w-auto flex-1"
            >
              <Keyboard className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted w-5 h-5" />
              <input
                type="text"
                placeholder="Enter meeting code"
                value={meetingCode}
                onChange={(e) => setMeetingCode(e.target.value)}
                className="w-full bg-surface border border-border-main px-12 py-4 text-text-main focus:outline-none focus:border-primary font-mono text-sm transition-all"
                required
              />
              <button
                type="submit"
                disabled={!meetingCode}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-primary font-bold uppercase tracking-widest text-xs disabled:opacity-50 hover:opacity-80 transition-opacity"
              >
                Join
              </button>
            </form>
          </div>
          <div className="pt-8 text-[10px] text-text-muted font-mono uppercase tracking-widest">
            <a
              href="#"
              className="font-bold text-primary hover:underline transition-colors"
            >
              Learn more
            </a>{" "}
            about DSUC Meet security.
          </div>
        </div>

        <div className="flex-1 w-full max-w-md animate-in slide-in-from-right-8 duration-500 delay-150">
          <div className="aspect-square border border-border-main flex items-center justify-center relative bg-surface shadow-sm overflow-hidden">
            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-primary/10 to-transparent z-10"></div>
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="relative z-20"
            >
              <div className="w-64 h-64 border border-border-main flex items-center justify-center bg-main-bg overflow-hidden relative group shadow-sm">
                <img
                  src="/logo.png"
                  alt="DSUC Logo"
                  className="w-32 h-32 object-contain opacity-20 pointer-events-none"
                />
                <div className="absolute inset-0 bg-primary/20 flex items-center justify-center mix-blend-overlay">
                  <Video className="w-16 h-16 text-primary drop-shadow-md" />
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    );
  }

  // Active Meeting View (Rethemed)
  return (
    <div className="h-[90vh] bg-main-bg flex flex-col pt-4">
      <div
        className={`flex-1 p-4 grid gap-4 auto-rows-fr ${isScreenSharing ? "grid-cols-1 lg:grid-cols-4" : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"}`}
      >
        {/* Screen Share View */}
        {isScreenSharing && (
          <div className="bg-surface border border-border-main overflow-hidden relative col-span-1 lg:col-span-3 shadow-sm">
            <video
              ref={screenRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-contain bg-black"
            />
            <div className="absolute top-4 left-4 flex gap-2">
              <div className="bg-primary text-main-bg px-3 py-1.5 border border-border-main font-bold text-[10px] uppercase tracking-widest animate-pulse shadow-sm">
                Screen Sharing
              </div>
            </div>
          </div>
        )}

        {/* Main User Camera */}
        <div
          className={`bg-surface border border-border-main overflow-hidden relative group shadow-sm ${isScreenSharing ? "col-span-1" : "col-span-1 md:col-span-2 lg:col-span-2"}`}
        >
          {isVideoOn ? (
            <div className="w-full h-full bg-black flex items-center justify-center relative overflow-hidden">
              <video
                autoPlay
                playsInline
                muted
                ref={videoRef}
                className="absolute w-full h-full object-cover -scale-x-100"
              />
            </div>
          ) : (
            <div className="w-full h-full bg-surface flex items-center justify-center">
              <div className="w-32 h-32 border border-border-main flex items-center justify-center overflow-hidden bg-main-bg shadow-sm">
                {currentUser?.avatar ? (
                  <img
                    src={currentUser.avatar}
                    alt="You"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-4xl font-display font-bold text-text-muted">
                    {currentUser?.name?.[0] || "?"}
                  </span>
                )}
              </div>
            </div>
          )}
          <div className="absolute top-4 left-4 flex gap-2 z-10">
            {!isMicOn && (
              <div className="bg-red-500 px-2 py-2 border border-border-main shadow-sm text-white">
                <MicOff className="w-4 h-4" />
              </div>
            )}
          </div>
          <div className="absolute bottom-4 left-4 border border-border-main text-text-main font-mono text-[10px] font-bold uppercase tracking-widest bg-surface/80 px-3 py-1.5 z-10 backdrop-blur-sm shadow-sm">
            {currentUser?.name || "You"}
          </div>
        </div>

        {/* Other participant placeholder */}
        <div className="bg-surface border border-border-main overflow-hidden relative shadow-sm">
          <div className="w-full h-full bg-surface flex items-center justify-center relative">
            <div className="w-24 h-24 border border-border-main flex items-center justify-center bg-main-bg shadow-sm relative">
              <span className="text-3xl font-display font-medium text-text-muted">
                C
              </span>
            </div>
          </div>
          <div className="absolute bottom-4 left-4 text-text-main font-mono text-[10px] border border-border-main font-bold uppercase tracking-widest bg-surface/80 px-3 py-1.5 backdrop-blur-sm shadow-sm">
            Admin
          </div>
          <div className="absolute top-4 left-4 bg-red-500 p-2 border border-border-main shadow-sm">
            <MicOff className="w-4 h-4 text-white" />
          </div>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="h-24 px-6 flex items-center justify-between  bg-main-bg">
        <div className="flex items-center gap-4 w-1/3">
          <div className="text-text-main font-mono text-[10px] font-bold border border-border-main uppercase tracking-widest bg-surface px-4 py-2.5 flex items-center gap-3 shadow-sm">
            <div className="w-2.5 h-2.5 bg-emerald-500 rounded-none relative">
              <div className="absolute inset-0 bg-emerald-500 rounded-none animate-ping opacity-75"></div>
            </div>
            {meetingCode || "dsuc-meet-abc"}
          </div>
        </div>

        <div className="flex items-center justify-center gap-4 w-1/3">
          <button
            onClick={toggleAudio}
            className={`w-14 h-14 border border-border-main flex items-center justify-center transition-all ${isMicOn ? "bg-surface hover:bg-main-bg text-text-main" : "bg-red-500 hover:bg-red-600 text-white shadow-sm"}`}
          >
            {isMicOn ? (
              <Mic className="w-6 h-6" />
            ) : (
              <MicOff className="w-6 h-6" />
            )}
          </button>
          <button
            onClick={toggleVideo}
            className={`w-14 h-14 border border-border-main flex items-center justify-center transition-all ${isVideoOn ? "bg-surface hover:bg-main-bg text-text-main" : "bg-red-500 hover:bg-red-600 text-white shadow-sm"}`}
          >
            {isVideoOn ? (
              <Video className="w-6 h-6" />
            ) : (
              <VideoOff className="w-6 h-6" />
            )}
          </button>
          <button
            onClick={toggleScreenShare}
            className={`w-14 h-14 border border-border-main flex items-center justify-center transition-all hidden sm:flex ${isScreenSharing ? "bg-primary text-main-bg shadow-sm" : "bg-surface text-text-main hover:bg-main-bg"}`}
          >
            <MonitorUp className="w-6 h-6" />
          </button>
          <button className="w-14 h-14 bg-surface border border-border-main text-text-main flex items-center justify-center hover:bg-main-bg transition-colors hidden sm:flex">
            <Settings className="w-6 h-6" />
          </button>
          <button
            onClick={handleLeave}
            className="w-20 h-14 border border-border-main bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors ml-4 shadow-sm"
          >
            <PhoneOff className="w-6 h-6" />
          </button>
        </div>

        <div className="flex items-center justify-end gap-5 w-1/3">
          <button className="text-text-muted hover:text-text-main transition-colors relative">
            <Users className="w-6 h-6" />
            <span className="absolute -top-2 -right-2 bg-primary text-main-bg text-[9px] font-mono font-bold px-1.5 py-0.5 border border-border-main">
              2
            </span>
          </button>
          <button className="text-text-muted hover:text-text-main transition-colors hidden sm:block">
            <MessageSquare className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
}

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
        <Loader2 className="w-16 h-16 text-sky-500 animate-spin" />
        <h2 className="text-2xl font-display font-bold text-slate-800 tracking-wide animate-pulse">Đang kết nối vào phòng...</h2>
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
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                onClick={() => setShowComingSoon(false)}
              />
              <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="relative bg-white rounded-3xl p-8 shadow-2xl border border-slate-100 max-w-sm w-full text-center"
              >
                <button
                  onClick={() => setShowComingSoon(false)}
                  className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
                <div className="w-20 h-20 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto mb-6 text-amber-500 shadow-inner">
                  <Video size={40} className="animate-pulse" />
                </div>
                <h2 className="text-2xl font-display font-bold text-slate-800 mb-2">
                  Tính năng sắp ra mắt
                </h2>
                <p className="text-slate-500 font-medium text-sm leading-relaxed mb-8">
                  Hệ thống giao tiếp nội bộ DSUC đang được bảo trì và nâng cấp để mang lại chất lượng kết nối tốt hơn. Quay lại sau nhé!
                </p>
                <button onClick={() => setShowComingSoon(false)} className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm uppercase tracking-wider py-4 rounded-full transition-colors">
                  Đã hiểu
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <div className="flex-1 space-y-8 animate-in slide-in-from-left-8 duration-500">
          <h1 className="text-4xl md:text-5xl font-display font-bold text-slate-800 leading-tight">
            Kết nối chất lượng cao.<br />
            <span className="text-sky-600">Dành cho cộng đồng.</span>
          </h1>
          <p className="text-slate-500 text-lg font-medium">
            DSUC Meet được thiết kế để mang lại trải nghiệm họp trực tuyến mượt mà và bảo mật cho tất cả các thành viên trong câu lạc bộ.
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-4 pt-4">
            <button
              onClick={handleNewMeeting}
              className="bg-sky-600 text-white hover:bg-sky-700 hover:shadow-md px-6 py-4 rounded-full font-bold text-sm uppercase tracking-wider flex items-center gap-2 w-full sm:w-auto justify-center transition-all"
            >
              <Video className="w-5 h-5" /> Cuộc họp mới
            </button>
            <form onSubmit={handleJoin} className="relative w-full sm:w-auto flex-1">
              <Keyboard className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Nhập mã cuộc họp"
                value={meetingCode}
                onChange={e => setMeetingCode(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-full px-12 py-4 text-slate-800 focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100 font-medium transition-all"
                required
              />
              <button
                type="submit"
                disabled={!meetingCode}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-sky-600 font-bold uppercase tracking-widest text-sm disabled:opacity-50 hover:text-sky-800 transition-colors"
              >
                Tham gia
              </button>
            </form>
          </div>
          <div className="pt-8 border-t border-slate-100 text-sm text-slate-500 font-medium tracking-wide">
            <a href="#" className="font-bold text-sky-600 hover:text-sky-700 transition-colors">Tìm hiểu thêm</a> về bảo mật của DSUC Meet.
          </div>
        </div>

        <div className="flex-1 w-full max-w-md animate-in slide-in-from-right-8 duration-500 delay-150">
          <div className="aspect-square rounded-full border border-sky-100 flex items-center justify-center relative bg-gradient-to-tr from-sky-50 to-white shadow-xl overflow-hidden">
             <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-sky-100/50 to-transparent z-10"></div>
             <motion.div
               animate={{ y: [0, -10, 0] }}
               transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
               className="relative z-20"
             >
               <div className="w-64 h-64 border-4 border-white shadow-lg rounded-full flex items-center justify-center bg-sky-50 overflow-hidden relative group">
                 <img src="/logo.png" alt="DSUC Logo" className="w-32 h-32 object-contain opacity-20 pointer-events-none" />
                 <div className="absolute inset-0 bg-sky-200/20 flex items-center justify-center mix-blend-overlay">
                    <Video className="w-16 h-16 text-sky-600 drop-shadow-md" />
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
    <div className="h-[90vh] bg-slate-900 flex flex-col pt-4">
       <div className={`flex-1 p-4 grid gap-4 auto-rows-fr ${isScreenSharing ? 'grid-cols-1 lg:grid-cols-4' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'}`}>

          {/* Screen Share View */}
          {isScreenSharing && (
            <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden relative col-span-1 lg:col-span-3 shadow-md">
              <video ref={screenRef} autoPlay playsInline muted className="w-full h-full object-contain bg-black" />
              <div className="absolute top-4 left-4 flex gap-2">
                 <div className="bg-sky-500/90 px-3 py-1.5 rounded-lg font-bold text-white text-xs uppercase tracking-widest animate-pulse border border-sky-400">
                    Đang chia sẻ MH
                 </div>
              </div>
            </div>
          )}

          {/* Main User Camera */}
          <div className={`bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden relative group shadow-md ${isScreenSharing ? 'col-span-1' : 'col-span-1 md:col-span-2 lg:col-span-2'}`}>
            {isVideoOn ? (
               <div className="w-full h-full bg-slate-950 flex items-center justify-center relative overflow-hidden">
                 <video autoPlay playsInline muted ref={videoRef} className="absolute w-full h-full object-cover -scale-x-100" />
               </div>
            ) : (
               <div className="w-full h-full bg-slate-800 flex items-center justify-center">
                 <div className="w-32 h-32 rounded-full border-4 border-slate-700 flex items-center justify-center overflow-hidden bg-slate-900 shadow-xl">
                    {currentUser?.avatar ? (
                      <img src={currentUser.avatar} alt="You" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-4xl font-display font-medium text-slate-400">{currentUser?.name?.[0] || '?'}</span>
                    )}
                 </div>
               </div>
            )}
            <div className="absolute top-4 left-4 flex gap-2 z-10">
               {!isMicOn && (
                 <div className="bg-rose-500/90 px-2 py-2 rounded-full shadow-sm text-white">
                    <MicOff className="w-4 h-4" />
                 </div>
               )}
            </div>
            <div className="absolute bottom-4 left-4 text-white font-medium drop-shadow-md bg-slate-900/60 px-3 py-1.5 rounded-lg border border-slate-700 z-10 backdrop-blur-sm text-sm">
              {currentUser?.name || 'Bạn'}
            </div>
          </div>

          {/* Other participant placeholder */}
          <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden relative shadow-md">
            <div className="w-full h-full bg-slate-800 flex items-center justify-center relative">
              <div className="w-24 h-24 rounded-full border-4 border-slate-700 flex items-center justify-center bg-slate-900 shadow-xl relative">
                  <span className="text-3xl font-display font-medium text-slate-400">C</span>
              </div>
            </div>
            <div className="absolute bottom-4 left-4 text-white font-medium bg-slate-900/60 px-3 py-1.5 rounded-lg border border-slate-700 backdrop-blur-sm text-sm">
              Quản trị viên
            </div>
            <div className="absolute top-4 left-4 bg-rose-500/90 p-2 rounded-full shadow-sm">
              <MicOff className="w-4 h-4 text-white" />
            </div>
          </div>
       </div>

       {/* Controls Bar */}
       <div className="h-24 px-6 flex items-center justify-between border-t border-slate-800">
          <div className="flex items-center gap-4 w-1/3">
             <div className="text-slate-300 font-medium text-sm tracking-wide bg-slate-800 px-4 py-2.5 rounded-xl border border-slate-700 flex items-center gap-3">
                <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full relative"><div className="absolute inset-0 bg-emerald-500 rounded-full animate-ping opacity-75"></div></div>
                {meetingCode || 'dsuc-meet-abc'}
             </div>
          </div>

          <div className="flex items-center justify-center gap-4 w-1/3">
            <button
              onClick={toggleAudio}
              className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${isMicOn ? 'bg-slate-800 border border-slate-700 hover:bg-slate-700 text-white' : 'bg-rose-500 hover:bg-rose-600 text-white shadow-lg'}`}
            >
               {isMicOn ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
            </button>
            <button
              onClick={toggleVideo}
              className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${isVideoOn ? 'bg-slate-800 border border-slate-700 hover:bg-slate-700 text-white' : 'bg-rose-500 hover:bg-rose-600 text-white shadow-lg'}`}
            >
               {isVideoOn ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
            </button>
            <button
              onClick={toggleScreenShare}
              className={`w-14 h-14 rounded-full flex items-center justify-center transition-all hidden sm:flex ${isScreenSharing ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/30' : 'bg-slate-800 border border-slate-700 text-white hover:bg-slate-700'}`}
            >
               <MonitorUp className="w-6 h-6" />
            </button>
            <button className="w-14 h-14 rounded-full bg-slate-800 border border-slate-700 text-white flex items-center justify-center hover:bg-slate-700 transition-colors hidden sm:flex">
               <Settings className="w-6 h-6" />
            </button>
            <button
              onClick={handleLeave}
              className="w-20 h-14 rounded-3xl bg-rose-500 text-white flex items-center justify-center hover:bg-rose-600 transition-colors ml-4 shadow-lg"
            >
               <PhoneOff className="w-6 h-6" />
            </button>
          </div>

          <div className="flex items-center justify-end gap-5 w-1/3">
            <button className="text-slate-400 hover:text-white transition-colors relative">
               <Users className="w-6 h-6" />
               <span className="absolute -top-1 -right-2 bg-sky-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border-2 border-slate-900">2</span>
            </button>
            <button className="text-slate-400 hover:text-white transition-colors hidden sm:block">
               <MessageSquare className="w-6 h-6" />
            </button>
          </div>
       </div>
    </div>
  );
}

import React, { useEffect, useState } from 'react';
import { Trophy, Crown, Activity, Hexagon } from 'lucide-react';
import { useStore } from '../store/useStore';
import { Member } from '../types';
import { motion } from 'framer-motion';

export function Leaderboard() {
  const { members, currentUser } = useStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const leaderboardSource = currentUser && !members.some((member) => member.id === currentUser.id)
    ? [currentUser, ...members]
    : members;

  const leaderboardData = leaderboardSource.map(member => {
    return {
      ...member,
      streak: Math.max(0, Number(member.streak || 0))
    };
  }).sort((a, b) => (b.streak || 0) - (a.streak || 0)).slice(0, 10); // TOP 10!

  const top3 = leaderboardData.slice(0, 3);
  const others = leaderboardData.slice(3, 10);

  const renderTop3Card = (member: Member & { streak: number }, rank: number) => {
    let style = "bg-white";
    let iconColor = "text-brutal-black";
    let border = "border-4 border-brutal-black";
    let shadow = "shadow-neo";
    let glow = "";

    if (rank === 1) {
      style = "bg-brutal-yellow";
      iconColor = "text-brutal-black";
      shadow = "shadow-neo-lg";
    } else if (rank === 2) {
      style = "bg-brutal-blue";
      iconColor = "text-white";
      shadow = "shadow-neo";
    } else if (rank === 3) {
      style = "bg-brutal-green";
      iconColor = "text-brutal-black";
      shadow = "shadow-neo-sm";
    }

    const { streak } = member;
    const heightModifier = rank === 1 ? 'min-h-[250px] md:h-[420px] md:pb-12 z-20 brutal-card' :
                           rank === 2 ? 'min-h-[200px] md:h-[360px] md:pb-8 z-10 opacity-100 brutal-card' :
                                        'min-h-[200px] md:h-[320px] md:pb-6 z-0 opacity-100 brutal-card';

    return (
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: rank * 0.1 }}
        className={`relative flex flex-col items-center justify-end p-6 border ${style} ${border} ${shadow} ${heightModifier} transition-all group`}
      >
        {/* Background Number / Chip Graphic */}
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[180px] sm:text-[220px] font-display font-black leading-none pointer-events-none opacity-[0.1] select-none ${iconColor}`}>
          0{rank}
        </div>

        <div className="flex-1 flex flex-col items-center justify-center relative z-10 w-full mt-4">
          <motion.div
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: rank }}
          >
            {rank === 1 ? (
              <Crown size={48} className={`mb-4 ${iconColor}`} strokeWidth={3} />
            ) : rank === 2 ? (
              <Hexagon size={32} className={`mb-4 ${iconColor}`} strokeWidth={3} />
            ) : (
              <Hexagon size={32} className={`mb-4 ${iconColor}`} strokeWidth={3} />
            )}
          </motion.div>

          <div className={`w-20 h-20 sm:w-32 sm:h-32 mb-5 border-4 relative select-none shrink-0 ${border} shadow-neo-sm overflow-hidden bg-white`}>
            <img src={member.avatar || 'https://via.placeholder.com/150'} alt={member.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 font-mono text-[8px] bg-slate-100 text-slate-500 flex text-center items-center justify-center break-all" />
          </div>

          <div className={`text-[12px] font-black uppercase tracking-widest mb-1 ${iconColor} bg-white border-2 border-brutal-black px-2 py-0.5 text-brutal-black`}>
            HẠNG 0{rank}
          </div>
          <h3 className={`text-base sm:text-xl font-display font-black text-center mb-5 truncate w-full px-2 max-w-[180px] ${rank === 2 ? 'text-white' : 'text-brutal-black'}`}>
            {member.name}
          </h3>

          <div className={`flex items-center justify-center gap-2 px-4 py-2 border-4 text-sm font-black tracking-widest bg-white shadow-neo-sm ${border} text-brutal-black w-full max-w-[140px]`}>
            <FlameIcon color={rank===1?'text-brutal-red':rank===2?'text-brutal-blue':'text-brutal-green'} />
            {streak} ngày
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen pt-10 pb-32 max-w-5xl mx-auto px-4 sm:px-6 overflow-x-hidden relative">
      {/* Background ambient animations */}
      {mounted && (
        <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden opacity-50">
           <motion.div animate={{ opacity: [0.3, 0.6, 0.3] }} transition={{ duration: 5, repeat: Infinity }} className="absolute top-[20%] left-[10%] w-96 h-96 bg-sky-200/40 blur-[100px] rounded-full" />
           <motion.div animate={{ opacity: [0.3, 0.5, 0.3] }} transition={{ duration: 7, repeat: Infinity }} className="absolute top-[40%] right-[10%] w-64 h-64 bg-amber-200/40 blur-[100px] rounded-full" />
        </div>
      )}

      <header className="mb-14 text-center relative z-10 pt-4">
        <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="inline-flex items-center gap-2 px-4 py-2 border-4 border-brutal-black bg-brutal-yellow text-brutal-black text-sm font-black uppercase tracking-widest mb-6 shadow-neo-sm">
          <Activity size={18} strokeWidth={3} className="animate-pulse" /> BẢNG XẾP HẠNG TRỰC TIẾP
        </motion.div>

        <motion.h1 initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-4xl sm:text-6xl font-display font-black text-brutal-black tracking-tighter mb-4 uppercase decoration-brutal-yellow decoration-4 underline underline-offset-8">
          BẢNG VÀNG THÀNH TÍCH
        </motion.h1>

        <p className="text-brutal-black bg-white border-2 border-brutal-black p-4 inline-block font-bold mt-4 text-sm max-w-xl mx-auto shadow-neo-sm">
          TOP 10 THÀNH VIÊN XUẤT SẮC ĐƯỢC ĐÁNH GIÁ THEO CHUỖI NGÀY HỌC TẬP LIÊN TIẾP TẠI HỌC VIỆN.
        </p>
      </header>

      {/* Top 3 Board */}
      {leaderboardData.length === 0 ? (
        <div className="max-w-2xl mx-auto border-4 border-brutal-black bg-white p-10 text-center shadow-neo brutal-card">
          <Trophy className="mx-auto mb-4 h-16 w-16 text-brutal-black" strokeWidth={3} aria-hidden="true" />
          <h2 className="font-display text-2xl font-black text-brutal-black mb-2 uppercase tracking-wide">
            Chưa có bảng xếp hạng học viện
          </h2>
          <p className="text-brutal-black font-bold text-sm border-2 border-brutal-black bg-brutal-yellow p-4 inline-block shadow-neo-sm">
            Hãy đăng nhập và hoàn thành bài học tại DSUC Academy để xuất hiện trên bảng vàng.
          </p>
        </div>
      ) : (
        <div className="flex flex-col md:flex-row items-center md:items-end justify-center pt-8 mb-24 max-w-4xl mx-auto px-4 relative gap-6 md:gap-4">
          {/* Podium Base (Desktop) */}
          <div className="absolute bottom-6 left-[5%] right-[5%] h-8 border-t-4 border-x-4 border-brutal-black bg-brutal-black hidden md:block z-0" />

          {/* We reorder visually so Rank 1 is top/middle, 2 is left, 3 is right */}
          <div className="order-2 md:order-1 z-10 w-full md:w-[32%] md:-translate-y-6">
            {top3[1] && renderTop3Card(top3[1], 2)}
          </div>

          <div className="order-1 md:order-2 flex-shrink-0 w-full md:w-[36%] z-20 relative mb-4 md:mb-0">
            {top3[0] && renderTop3Card(top3[0], 1)}
          </div>

          <div className="order-3 md:order-3 z-0 w-full md:w-[32%] md:-translate-y-6">
            {top3[2] && renderTop3Card(top3[2], 3)}
          </div>
        </div>
      )}

      {/* Rest of the leaderboard */}
      {leaderboardData.length > 0 && (
        <div className="space-y-4 max-w-3xl mx-auto relative z-10">
          <div className="flex items-center justify-between text-[14px] font-black text-brutal-black px-6 mx-2 mb-2 uppercase tracking-widest bg-white border-2 border-brutal-black p-2 shadow-neo-sm">
            <span>Hạng / Tên thành viên</span>
            <span>Chuỗi ngày</span>
          </div>

          <div className="bg-brutal-bg border-4 border-brutal-black p-4 shadow-neo brutal-card flex flex-col gap-4">
            {others.map((member, idx) => {
              const rank = idx + 4;
              const isCurrentUser = currentUser?.id === member.id;

              return (
                <motion.div
                  initial={{ x: -20, opacity: 0 }}
                  whileInView={{ x: 0, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.05 }}
                  key={member.id}
                  className={`flex items-center gap-4 sm:gap-6 p-4 sm:p-5 transition-all border-4 border-brutal-black ${
                    isCurrentUser
                      ? 'bg-brutal-blue shadow-neo-sm text-white'
                      : 'hover:bg-brutal-yellow hover:translate-x-1 hover:-translate-y-1 hover:shadow-neo bg-white text-brutal-black'
                  }`}
                >
                  <div className={`w-8 h-8 sm:w-12 sm:h-12 flex items-center justify-center font-display font-black text-sm sm:text-2xl border-r-4 border-brutal-black pr-4 sm:pr-6 shrink-0 ${isCurrentUser ? 'text-white' : 'text-brutal-black'}`}>
                    {rank < 10 ? `0${rank}` : rank}
                  </div>

                  <div className="w-10 h-10 sm:w-16 sm:h-16 flex-shrink-0 relative overflow-hidden border-4 border-brutal-black bg-white shadow-neo-sm">
                    <img src={member.avatar || 'https://via.placeholder.com/50'} alt={member.name} className="w-full h-full object-cover" />
                  </div>

                  <div className="flex flex-col flex-grow min-w-0 justify-center">
                    <div className="flex items-center gap-2 sm:gap-4 truncate mb-1">
                      <span className={`font-display font-black tracking-wide text-sm sm:text-lg truncate ${isCurrentUser ? 'text-white' : 'text-brutal-black'}`}>
                        {member.name}
                      </span>
                      {isCurrentUser && (
                        <span className="px-2 py-0.5 border-2 border-brutal-black bg-white text-brutal-black text-[10px] font-black uppercase tracking-widest shrink-0 shadow-neo-sm">
                          BẠN
                        </span>
                      )}
                    </div>
                    <div className={`text-[12px] font-bold uppercase tracking-widest truncate ${isCurrentUser ? 'text-white/80' : 'text-slate-600'}`}>
                      {member.role || 'Thành viên'}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 px-4 py-2 bg-white border-4 border-brutal-black text-brutal-black text-[11px] sm:text-sm font-black tracking-widest shrink-0 min-w-[70px] justify-center shadow-neo-sm">
                    <FlameIcon color="text-brutal-red" />
                    {member.streak}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// Simple flame SVG to avoid lucide-react thick flame
function FlameIcon({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${color}`}>
      <path d="M12 2C12 2 15 7 15 11C15 14 12 17 12 17C12 17 9 14 9 11C9 7 12 2 12 2Z" />
      <path opacity="0.5" d="M12 21C14 21 17 19 19 16C19 11 15 8 15 8C15 8 13 14 10 14C8 14 7 11 7 11C7 16 9 21 12 21Z" />
    </svg>
  );
}

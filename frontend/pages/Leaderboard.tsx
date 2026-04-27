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
    let style = "bg-surface";
    let iconColor = "text-white/50";
    let border = "border-white/10";
    let shadow = "";
    let glow = "";

    if (rank === 1) {
      style = "bg-[#1a1500]/80";
      iconColor = "text-cyber-yellow";
      border = "border-cyber-yellow";
      shadow = "shadow-[0_0_40px_rgba(255,214,0,0.4)]";
      glow = "from-cyber-yellow/40 to-transparent";
    } else if (rank === 2) {
      style = "bg-[#001026]/80";
      iconColor = "text-cyber-blue";
      border = "border-cyber-blue";
      shadow = "shadow-[0_0_30px_rgba(41,121,255,0.3)]";
      glow = "from-cyber-blue/30 to-transparent";
    } else if (rank === 3) {
      style = "bg-purple-900/30";
      iconColor = "text-purple-400";
      border = "border-purple-500/50";
      shadow = "shadow-[0_0_30px_rgba(168,85,247,0.3)]";
      glow = "from-purple-500/30 to-transparent";
    }

    const { streak } = member;
    const heightModifier = rank === 1 ? 'min-h-[250px] md:h-[420px] md:pb-12 z-20' :
                           rank === 2 ? 'min-h-[200px] md:h-[360px] md:pb-8 z-10 opacity-90' :
                                        'min-h-[200px] md:h-[320px] md:pb-6 z-0 opacity-80';

    return (
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: rank * 0.1 }}
        className={`relative flex flex-col items-center justify-end p-6 border ${style} ${border} ${shadow} ${heightModifier} transition-all overflow-hidden group backdrop-blur-md`}
      >
        <div className={`absolute inset-0 bg-gradient-to-t ${glow} pointer-events-none group-hover:opacity-80 transition-opacity`} />

        {/* Background Number / Chip Graphic */}
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[180px] sm:text-[220px] font-display font-black leading-none pointer-events-none opacity-[0.03] select-none ${iconColor}`}>
          0{rank}
        </div>

        <div className={`absolute -bottom-8 -right-8 opacity-10 pointer-events-none ${iconColor}`}>
          <svg width="180" height="180" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
            <rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect>
            <rect x="9" y="9" width="6" height="6"></rect>
            <line x1="9" y1="1" x2="9" y2="4"></line>
            <line x1="15" y1="1" x2="15" y2="4"></line>
            <line x1="9" y1="20" x2="9" y2="23"></line>
            <line x1="15" y1="20" x2="15" y2="23"></line>
            <line x1="20" y1="9" x2="23" y2="9"></line>
            <line x1="20" y1="14" x2="23" y2="14"></line>
            <line x1="1" y1="9" x2="4" y2="9"></line>
            <line x1="1" y1="14" x2="4" y2="14"></line>
          </svg>
        </div>

        {/* Animated Background Line */}
        <div className="absolute top-0 left-0 right-0 h-[1px] overflow-hidden">
          <motion.div
            animate={{ x: ['-100%', '100%'] }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            className={`w-1/2 h-full bg-gradient-to-r from-transparent via-white to-transparent opacity-50`}
          />
        </div>

        <div className="absolute top-0 left-0 w-6 h-6 border-t border-l border-white/20 pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-6 h-6 border-b border-r border-white/20 pointer-events-none" />

        <div className="flex-1 flex flex-col items-center justify-center relative z-10 w-full mt-4">
          <motion.div
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: rank }}
          >
            {rank === 1 ? (
              <Crown size={rank === 1 ? 40 : 32} className={`mb-4 ${iconColor} drop-shadow-[0_0_15px_rgba(255,214,0,0.8)]`} />
            ) : (
              <Hexagon size={rank === 1 ? 40 : 32} className={`mb-4 ${iconColor}`} />
            )}
          </motion.div>

          <div className={`w-20 h-20 sm:w-28 sm:h-28 mb-4 border relative select-none shrink-0 ${border}`}>
            <div className={`absolute inset-0 border resize-animation ${border} scale-105 opacity-50`} />
            <img src={member.avatar || 'https://via.placeholder.com/150'} alt={member.name} className="w-full h-full object-cover grayscale-[20%] group-hover:grayscale-0 transition-all font-mono text-[8px] bg-black text-white/50 flex text-center items-center justify-center overflow-hidden break-all" />
          </div>

          <div className={`text-[9px] font-mono uppercase tracking-widest mb-1 ${iconColor}`}>
            RANK_0{rank}
          </div>
          <h3 className="text-sm sm:text-lg font-display font-bold text-white uppercase text-center mb-4 truncate w-full px-2 max-w-[150px]">
            {member.name}
          </h3>

          <div className={`flex items-center justify-center gap-1.5 px-3 py-1.5 border text-xs font-mono font-bold uppercase tracking-widest bg-black/50 ${border} ${iconColor} w-full shadow-inner shadow-black/80`}>
            <FlameIcon color={rank===1?'text-cyber-yellow':rank===2?'text-cyber-blue':'text-purple-400'} />
            {streak}
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen pt-20 pb-32 max-w-5xl mx-auto px-4 overflow-x-hidden relative">
      {/* Background ambient animations */}
      {mounted && (
        <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden mix-blend-screen opacity-30">
           <motion.div animate={{ opacity: [0.1, 0.3, 0.1] }} transition={{ duration: 5, repeat: Infinity }} className="absolute top-[20%] left-[10%] w-96 h-96 bg-cyber-blue/10 blur-[100px] rounded-full" />
           <motion.div animate={{ opacity: [0.1, 0.2, 0.1] }} transition={{ duration: 7, repeat: Infinity }} className="absolute top-[40%] right-[10%] w-64 h-64 bg-cyber-yellow/10 blur-[100px] rounded-full" />
        </div>
      )}

      <header className="mb-10 text-center relative z-10 pt-4">
        <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="inline-flex items-center gap-2 px-3 py-1 bg-cyber-yellow/5 border border-cyber-yellow/30 text-cyber-yellow text-[10px] font-mono font-bold uppercase tracking-widest shadow-[0_0_10px_rgba(255,214,0,0.1)] mb-4">
          <Activity size={12} className="animate-pulse" /> SYS_LIVE_RANKING
        </motion.div>

        <motion.h1 initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-4xl sm:text-6xl font-display font-black text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-white/40 uppercase tracking-widest drop-shadow-[0_0_15px_rgba(41,121,255,0.3)] mb-2">
          HALL OF FAME
        </motion.h1>

        <p className="text-white/40 font-mono uppercase tracking-widest text-[10px] sm:text-xs max-w-xl mx-auto mt-2">
          TOP 10 ELITE OPERATIVES. EVALUATED BY CONSECUTIVE UPTIME.
        </p>
      </header>

      {/* Top 3 Board */}
      {leaderboardData.length === 0 ? (
        <div className="max-w-2xl mx-auto border border-cyber-blue/20 bg-surface/70 p-8 text-center">
          <Trophy className="mx-auto mb-4 h-10 w-10 text-cyber-blue/60" aria-hidden="true" />
          <h2 className="font-display text-xl font-bold uppercase tracking-widest text-white">
            No Academy streaks yet
          </h2>
          <p className="mt-3 text-sm text-white/60">
            Complete a DSUC Academy lesson after signing in to appear on the leaderboard.
          </p>
        </div>
      ) : (
        <div className="flex flex-col md:flex-row items-center md:items-end justify-center pt-8 mb-20 max-w-4xl mx-auto px-4 relative gap-6 md:gap-4">
          {/* Podium Base (Desktop) */}
          <div className="absolute bottom-0 left-[5%] right-[5%] h-4 border-t border-x border-white/20 bg-gradient-to-b from-white/10 to-transparent hidden md:block" />

          {/* We reorder visually so Rank 1 is top/middle, 2 is left, 3 is right */}
          <div className="order-2 md:order-1 z-10 w-full md:w-[30%]">
            {top3[1] && renderTop3Card(top3[1], 2)}
          </div>

          <div className="order-1 md:order-2 flex-shrink-0 w-full md:w-[35%] z-20 shadow-2xl shadow-black relative mb-2 md:mb-0">
            {top3[0] && renderTop3Card(top3[0], 1)}
          </div>

          <div className="order-3 md:order-3 z-0 w-full md:w-[30%]">
            {top3[2] && renderTop3Card(top3[2], 3)}
          </div>
        </div>
      )}

      {/* Rest of the leaderboard */}
      {leaderboardData.length > 0 && (
        <div className="space-y-3 max-w-3xl mx-auto relative z-10">
          <div className="flex items-center justify-between text-[9px] font-mono text-white/30 px-4 mb-2 uppercase tracking-widest">
            <span>Rank / Operator</span>
            <span>Streak</span>
          </div>

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
                className={`flex items-center gap-3 sm:gap-4 p-2 sm:p-3 border transition-all ${
                  isCurrentUser
                    ? 'bg-cyber-blue/10 border-cyber-blue shadow-[0_0_15px_rgba(41,121,255,0.2)]'
                    : 'bg-[#050B14]/80 backdrop-blur-sm border-white/5 hover:border-white/20'
                }`}
              >
                <div className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center font-display font-medium text-white/30 text-sm sm:text-base border-r border-white/5 pr-2 sm:pr-4 shrink-0">
                  {rank < 10 ? `0${rank}` : rank}
                </div>

                <div className="w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0 relative overflow-hidden border border-white/10">
                  <img src={member.avatar || 'https://via.placeholder.com/50'} alt={member.name} className="w-full h-full object-cover grayscale opacity-80" />
                </div>

                <div className="flex flex-col flex-grow min-w-0">
                  <div className="flex items-center gap-1 sm:gap-2 truncate">
                    <span className={`font-display font-bold uppercase tracking-wider text-xs sm:text-sm truncate ${isCurrentUser ? 'text-cyber-blue' : 'text-white'}`}>
                      {member.name}
                    </span>
                    {isCurrentUser && (
                      <span className="px-1.5 py-0.5 bg-cyber-blue/20 border border-cyber-blue text-cyber-blue text-[8px] font-mono uppercase tracking-widest shrink-0">
                        YOU
                      </span>
                    )}
                  </div>
                  <div className="text-[9px] text-white/30 font-mono uppercase tracking-widest truncate">
                    {member.role || 'Operative'}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 sm:gap-2 px-2 py-1 bg-black/40 border border-white/5 text-white/80 text-[10px] sm:text-xs font-mono font-bold uppercase tracking-widest shrink-0 min-w-[70px] justify-center">
                  <FlameIcon color="text-white/40" />
                  {member.streak}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Simple flame SVG to avoid lucide-react thick flame
function FlameIcon({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={`w-3 h-3 sm:w-4 sm:h-4 ${color}`}>
      <path d="M12 2C12 2 15 7 15 11C15 14 12 17 12 17C12 17 9 14 9 11C9 7 12 2 12 2Z" />
      <path opacity="0.5" d="M12 21C14 21 17 19 19 16C19 11 15 8 15 8C15 8 13 14 10 14C8 14 7 11 7 11C7 16 9 21 12 21Z" />
    </svg>
  );
}

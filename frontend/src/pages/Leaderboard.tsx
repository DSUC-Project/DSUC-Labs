import React, { useEffect, useState } from "react";
import { Trophy, Crown, Activity, Hexagon } from "lucide-react";
import { useStore } from "../store/useStore";
import { Member } from "../types";
import { motion } from "motion/react";
import { SectionHeader, SoftBrutalCard } from "@/components/ui/Primitives";
import { streakTheme } from "@/lib/streakTheme";

export function Leaderboard() {
  const { members, currentUser } = useStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const leaderboardSource =
    currentUser && !members.some((member) => member.id === currentUser.id)
      ? [currentUser, ...members]
      : members;

  const rankedLeaderboard = leaderboardSource
    .map((member) => {
      return {
        ...member,
        streak: Math.max(0, Number(member.streak || 0)),
      };
    })
    .sort((a, b) => (b.streak || 0) - (a.streak || 0))
    .map((member, index) => ({
      ...member,
      rank: index + 1,
    }));

  const leaderboardData = rankedLeaderboard.slice(0, 10);
  const currentUserRank =
    currentUser
      ? rankedLeaderboard.find((member) => member.id === currentUser.id) || null
      : null;
  const showYourRank = Boolean(currentUserRank && currentUserRank.rank > 10);

  const top3 = leaderboardData.slice(0, 3);
  const others = leaderboardData.slice(3, 10);

  const renderTop3Card = (
    member: Member & { streak: number },
    rank: number,
  ) => {
    let style = "bg-surface";
    let iconColor = "text-text-main";

    if (rank === 1) {
      style = "bg-yellow-400 border-2 border-text-main shadow-[8px_8px_0_0_#000] dark:shadow-[8px_8px_0_0_#FFF]";
      iconColor = "text-black";
    } else if (rank === 2) {
      style = "bg-blue-500 border-2 border-text-main shadow-[8px_8px_0_0_#000] dark:shadow-[8px_8px_0_0_#FFF]";
      iconColor = "text-white";
    } else if (rank === 3) {
      style = "bg-purple-500 border-2 border-text-main shadow-[8px_8px_0_0_#000] dark:shadow-[8px_8px_0_0_#FFF]";
      iconColor = "text-white";
    }

    const { streak } = member;
    const heightModifier =
      rank === 1
        ? "min-h-[250px] md:h-[420px] md:pb-12 z-20 scale-100"
        : rank === 2
          ? "min-h-[200px] md:h-[360px] md:pb-8 z-10 opacity-100 scale-95"
          : "min-h-[200px] md:h-[320px] md:pb-6 z-0 opacity-100 scale-90";

    return (
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: rank * 0.1 }}
        className={`relative flex flex-col items-center justify-end p-6 ${style} ${heightModifier} transition-all group hover:-translate-y-2`}
      >
        <div
          className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[180px] sm:text-[220px] font-display font-black leading-none pointer-events-none opacity-20 select-none ${iconColor}`}
        >
          0{rank}
        </div>

        <div className="flex-1 flex flex-col items-center justify-center relative z-10 w-full mt-4">
          <motion.div
            animate={{ y: [0, -5, 0] }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut",
              delay: rank,
            }}
          >
            {rank === 1 ? (
              <Crown
                size={48}
                className={`mb-4 ${iconColor}`}
                strokeWidth={3}
              />
            ) : rank === 2 ? (
              <Hexagon
                size={32}
                className={`mb-4 ${iconColor}`}
                strokeWidth={3}
              />
            ) : (
              <Hexagon
                size={32}
                className={`mb-4 ${iconColor}`}
                strokeWidth={3}
              />
            )}
          </motion.div>

          <div
            className={`w-20 h-20 sm:w-28 sm:h-28 mb-5 border-4 relative select-none shrink-0 overflow-hidden bg-main-bg shadow-sm ${rank === 1 ? "border-yellow-200" : rank === 2 ? "border-blue-200" : "border-purple-200"}`}
          >
            <img
              src={member.avatar || "https://via.placeholder.com/150"}
              alt={member.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 font-mono text-[8px] flex text-center items-center justify-center break-all"
            />
          </div>

          <div
            className={`text-[10px] font-mono font-black uppercase tracking-widest mb-1 ${iconColor} bg-black/20 px-2 py-0.5 border ${rank===1 ? "border-black/50" : "border-white/50"}`}
          >
            RANK 0{rank}
          </div>
          <h3
            className={`text-base sm:text-xl font-heading font-black text-center mb-4 truncate w-full px-2 max-w-[180px] ${iconColor}`}
          >
            {member.name}
          </h3>

          <div
            className={`flex items-center justify-center gap-2 px-4 py-2 border-2 text-xs font-mono font-black tracking-widest bg-black/10 w-full max-w-[140px] ${iconColor} ${rank === 1 ? "border-black/50" : "border-white/50"}`}
          >
            <FlameIcon color={streakTheme.flame} />
            {streak} days
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen pt-10 pb-32 max-w-5xl mx-auto px-4 sm:px-6 relative">
      <header className="mb-14 text-center relative z-10 pt-4">
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="inline-flex items-center gap-2 px-4 py-2 border border-border-main bg-accent text-text-main text-[10px] font-mono font-bold uppercase tracking-widest mb-6"
        >
          <Activity size={14} strokeWidth={2} className="animate-pulse" /> LIVE
          LEADERBOARD
        </motion.div>

        <SectionHeader
          title="HALL OF FAME"
          subtitle="Top 10 members evaluated by consecutive learning streaks at the Academy."
          className="mb-0 mx-auto"
        />
      </header>

      {/* Top 3 Board */}
      {leaderboardData.length === 0 ? (
        <SoftBrutalCard className="max-w-2xl mx-auto p-10 text-center">
          <Trophy
            className="mx-auto mb-4 h-16 w-16 text-text-muted"
            strokeWidth={2}
            aria-hidden="true"
          />
          <h2 className="font-display text-2xl font-bold text-text-main mb-2 uppercase tracking-wide">
            No leaderboard yet
          </h2>
          <p className="text-text-main font-mono text-xs border border-border-main bg-accent p-4 inline-block font-bold mt-4">
            Sign in and complete lessons at DSUC Academy to appear on the Hall
            of Fame.
          </p>
        </SoftBrutalCard>
      ) : (
        <div className="flex flex-col md:flex-row items-center md:items-end justify-center pt-8 mb-24 max-w-4xl mx-auto px-4 relative gap-6 md:gap-4">
          {/* Podium Base (Desktop) */}
          <div className="absolute bottom-6 left-[5%] right-[5%] h-8 border border-border-main bg-text-main hidden md:block z-0" />

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
          <div className="flex items-center justify-between text-[10px] font-mono font-bold text-text-main px-6 mx-2 mb-2 uppercase tracking-widest bg-main-bg border border-border-main p-2">
            <span>Rank / Member</span>
            <span>Streak</span>
          </div>

          <div className="flex flex-col gap-2">
            {others.map((member) => {
              const rank = member.rank;
              const isCurrentUser = currentUser?.id === member.id;

              return (
                <motion.div
                  initial={{ x: -20, opacity: 0 }}
                  whileInView={{ x: 0, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: (rank - 4) * 0.05 }}
                  key={member.id}
                >
                  <div
                    className={`flex items-center gap-3 p-2 border-2 shadow-[2px_2px_0_0_#000] hover:-translate-y-0.5 hover:shadow-[4px_4px_0_0_#000] transition-all cursor-pointer ${
                      isCurrentUser ? "bg-primary text-primary-foreground border-text-main" : "bg-surface text-text-main border-text-main"
                    }`}
                  >
                    <div
                      className={`w-8 h-8 flex items-center justify-center font-mono font-black text-xs border-2 bg-main-bg shrink-0 ${isCurrentUser ? "text-primary border-text-main" : "text-text-main border-text-main"}`}
                    >
                      {rank < 10 ? `0${rank}` : rank}
                    </div>

                    <div
                      className={`w-8 h-8 flex-shrink-0 border-2 ${isCurrentUser ? "border-text-main" : "border-text-main"} bg-main-bg`}
                    >
                      <img
                        src={member.avatar || "https://via.placeholder.com/50"}
                        alt={member.name}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="flex flex-col flex-grow min-w-0 justify-center leading-tight">
                      <div className="flex items-center gap-2 truncate">
                        <span
                          className={`font-heading font-black tracking-tight text-sm truncate ${isCurrentUser ? "text-primary-foreground" : "text-text-main"}`}
                        >
                          {member.name}
                        </span>
                        {isCurrentUser && (
                          <span className="px-1 py-0.5 border border-primary-foreground bg-primary-foreground text-primary text-[8px] font-mono font-bold uppercase tracking-widest shrink-0">
                            YOU
                          </span>
                        )}
                      </div>
                    </div>

                    <div
                      className={`flex items-center justify-center gap-1.5 px-3 py-1.5 bg-black/10 border-2 ${isCurrentUser ? "border-primary-foreground text-primary-foreground" : "border-text-main text-text-main"} text-xs font-mono font-black tracking-widest shrink-0`}
                    >
                      <FlameIcon color={streakTheme.flame} />
                      {member.streak}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {showYourRank && currentUserRank ? (
        <div className="mx-auto mt-12 max-w-3xl">
          <div className="mb-3 flex items-center gap-3 px-2">
            <div className="h-2 w-2 bg-primary" />
            <span className="font-mono text-[10px] font-bold uppercase tracking-[0.24em] text-text-muted">
              Your Rank
            </span>
          </div>

          <SoftBrutalCard className="p-4 sm:p-5">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center bg-main-bg font-mono text-sm font-black uppercase tracking-widest text-text-main">
                {currentUserRank.rank < 10
                  ? `0${currentUserRank.rank}`
                  : currentUserRank.rank}
              </div>

              <div className="h-12 w-12 shrink-0 overflow-hidden bg-main-bg">
                <img
                  src={
                    currentUserRank.avatar ||
                    "https://via.placeholder.com/50"
                  }
                  alt={currentUserRank.name}
                  className="h-full w-full object-cover"
                />
              </div>

              <div className="min-w-0 flex-1">
                <div className="font-heading text-base font-black tracking-tight text-text-main">
                  {currentUserRank.name}
                </div>
                <div className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-text-muted">
                  {rankedLeaderboard.length} members ranked
                </div>
              </div>

              <div className="flex items-center gap-2 bg-main-bg px-3 py-2 font-mono text-xs font-black tracking-widest text-text-main">
                <FlameIcon color={streakTheme.flame} />
                {currentUserRank.streak}
              </div>
            </div>
          </SoftBrutalCard>
        </div>
      ) : null}
    </div>
  );
}

// Simple flame SVG to avoid lucide-react thick flame
function FlameIcon({ color }: { color: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${color}`}
    >
      <path d="M12 2C12 2 15 7 15 11C15 14 12 17 12 17C12 17 9 14 9 11C9 7 12 2 12 2Z" />
      <path
        opacity="0.5"
        d="M12 21C14 21 17 19 19 16C19 11 15 8 15 8C15 8 13 14 10 14C8 14 7 11 7 11C7 16 9 21 12 21Z"
      />
    </svg>
  );
}

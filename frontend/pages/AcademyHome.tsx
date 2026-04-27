import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {ArrowRight, BookOpen, Brain, Clock, Code, Cpu, Terminal as CmdIcon, Flame, Terminal, Check, User, Share2} from 'lucide-react';

import { TRACKS, type TrackId, lessonsByTrack } from '@/lib/academy/curriculum';
import { useStore } from '@/store/useStore';
import { loadProgress, isLessonCompleted } from '@/lib/academy/progress';

function isTrackCompleted(state: any, trackId: TrackId) {
  const lessons = lessonsByTrack(trackId);
  if (!lessons || lessons.length === 0) return false;
  return lessons.every(lesson => isLessonCompleted(state, trackId, lesson.id));
}

function stats(track: TrackId) {
  const lessons = lessonsByTrack(track);
  const quizzes = lessons.reduce((acc, lesson) => acc + (lesson.quiz?.length || 0), 0);
  const mins = lessons.reduce((acc, lesson) => acc + (lesson.minutes || 0), 0);
  const hours = Math.max(1, Math.round(mins / 60));
  return { modules: lessons.length, quizzes, hours };
}

export function AcademyHome() {
  const navigate = useNavigate();
  const { currentUser, walletAddress } = useStore();

  const identity = useMemo(() => ({
    userId: currentUser?.id ?? null,
    walletAddress: walletAddress ?? null,
  }), [currentUser?.id, walletAddress]);

  const progressState = useMemo(() => loadProgress(identity), [identity]);

  return (
    <div className="space-y-12 pb-32 max-w-7xl mx-auto px-4">
      {/* Banner & Profile Section */}
      <div className="pt-10 grid grid-cols-1 lg:grid-cols-12 gap-8 relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyber-blue/5 rounded-full blur-[100px] pointer-events-none" />

        {/* Main Title Area */}
        <div className="lg:col-span-8 flex flex-col justify-center">
          <div className="mb-6 inline-flex items-center gap-2 px-3 py-1 border border-cyber-blue/30 bg-cyber-blue/5 text-cyber-blue text-xs font-mono uppercase tracking-widest w-fit">
            <Terminal size={14} /> SYS_INIT // DSUC ACADEMY HUB
          </div>

          <h1 className="text-5xl sm:text-7xl lg:text-8xl font-display font-bold tracking-tight mb-8 leading-[1] text-white uppercase drop-shadow-[0_0_20px_rgba(41,121,255,0.2)]">
            DSUC <span className="text-transparent bg-clip-text bg-gradient-to-b from-cyber-blue to-black/50">ACADEMY</span>
          </h1>

          <p className="text-lg text-white/60 max-w-2xl font-mono leading-relaxed uppercase tracking-wide">
            Master Solana & Rust architecture. Upgrade your clearance level from Genin to Jonin. Engage with practical modules to recalibrate your coding neural network.
          </p>
        </div>

        {/* Player Stats (Shareable ID Card) */}
        <div className="lg:col-span-4 relative group">
          {/* Card Glow Effect */}
          <div className="absolute -inset-1 bg-gradient-to-br from-cyber-yellow/40 via-cyber-blue/20 to-purple-500/30 blur-2xl opacity-50 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl pointer-events-none z-0" />

          <div
            className="bg-[#050B14] border border-white/20 p-6 h-full flex flex-col relative overflow-hidden shadow-[0_0_40px_rgba(41,121,255,0.15)] group-hover:border-cyber-yellow/50 transition-colors duration-500 z-10"
          >
            {/* Holographic overlay */}
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 pointer-events-none mix-blend-overlay" />

            {/* Corner decorations */}
            <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-cyber-yellow/50 -translate-x-1 -translate-y-1" />
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-cyber-yellow/50 translate-x-1 translate-y-1" />

            {/* Header: ID & Designation */}
            <div className="flex justify-between items-start mb-6">
              <div>
                <div className="text-[10px] font-mono text-white/50 uppercase tracking-widest bg-white/5 px-2 py-0.5 rounded-sm border border-white/10 mb-1">
                  ID: {currentUser?.id?.slice(0,8) || 'GUEST-001'}
                </div>
                <div className="text-sm font-display font-bold text-cyber-blue uppercase tracking-wider">
                  {currentUser?.role || 'Initiate'}
                </div>
              </div>
              <div className="w-10 h-10 border border-cyber-blue/50 flex items-center justify-center bg-cyber-blue/10 p-1">
                <img src="/logo.png" alt="DSUC" className="w-full h-full object-contain grayscale brightness-200" crossOrigin="anonymous" />
              </div>
            </div>

            {/* User Details & Avatar */}
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 border-2 border-white/20 relative overflow-hidden bg-black/50 shrink-0">
                {currentUser?.avatar ? (
                  <img src={currentUser.avatar} alt="Avatar" className="w-full h-full object-cover" crossOrigin="anonymous" />
                ) : (
                  <User size={32} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white/20" />
                )}
                {/* Scanline over avatar */}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyber-blue/30 to-transparent w-full h-[20%] animate-scan pointer-events-none" />
              </div>
              <div className="flex flex-col overflow-hidden">
                <div className="text-2xl font-display font-bold text-white uppercase truncate">
                  {currentUser?.name || 'UNKNOWN OPERATIVE'}
                </div>
                <div className="text-xs font-mono text-cyber-yellow flex items-center gap-2 uppercase tracking-widest mt-1">
                  <span className="w-1.5 h-1.5 bg-cyber-yellow rounded-full animate-pulse shadow-[0_0_5px_#ffd600]" />
                  ACTIVE LINK
                </div>
              </div>
            </div>

            <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent mb-6" />

            {/* The Streak Metric (Focal Point) */}
            <div className="flex-grow flex flex-col items-center justify-center relative">
               <div className="absolute top-0 right-1/4 w-12 h-12 bg-cyber-yellow/20 blur-xl rounded-full pointer-events-none" />
               <div className="absolute bottom-0 left-1/4 w-12 h-12 bg-cyber-yellow/20 blur-xl rounded-full pointer-events-none" />

               <div className="flex items-end gap-3 z-10">
                 <div className="relative">
                   <Flame size={50} className={`relative z-10 ${currentUser?.streak && currentUser.streak > 0 ? 'text-cyber-yellow drop-shadow-[0_0_15px_rgba(255,214,0,0.8)] fill-cyber-yellow/30' : 'text-white/20'}`} />
                 </div>
                 <div className="flex flex-col leading-none">
                    <span className="font-display font-bold text-6xl text-white tracking-widest drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
                      {currentUser?.streak || 0}
                    </span>
                 </div>
               </div>
               <div className="mt-2 text-cyber-yellow font-mono text-xs tracking-[0.3em] uppercase font-bold bg-cyber-yellow/10 border border-cyber-yellow/20 px-4 py-1 rounded-sm shadow-[0_0_15px_rgba(255,214,0,0.15)] flex justify-center items-center">
                 DAY STREAK
               </div>
            </div>

            {/* Footer */}
            <div className="w-full text-center text-[9px] font-mono text-white/30 tracking-widest mt-6 uppercase pb-1 border-b border-white/5">
              DSUC ACADEMY VALID CARD
            </div>
          </div>
        </div>
      </div>

      {/* Tracks Container */}
      <div className="space-y-8 mt-12">
        <h2 className="text-2xl font-display font-bold text-white uppercase tracking-widest flex items-center gap-3">
          <BookOpen className="w-6 h-6 text-cyber-blue" />
          AVAILABLE PROTOCOLS
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {TRACKS.map((track) => {
            const info = stats(track.id);
            const isCompleted = isTrackCompleted(progressState, track.id);

            return (
              <div
                key={track.id}
                onClick={() => navigate(`/academy/track/${track.id}`)}
                className={`group cursor-pointer border p-6 flex flex-col transition-all relative shadow-lg overflow-hidden ${
                  isCompleted
                    ? 'bg-cyber-yellow/10 border-cyber-yellow hover:bg-cyber-yellow/20'
                    : 'bg-black border-cyber-blue hover:border-cyber-yellow hover:bg-cyber-yellow/5'
                }`}
              >
                {/* Completion Background V */}
                {isCompleted && (
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.05] pointer-events-none">
                    <Check size={240} className="text-cyber-yellow" />
                  </div>
                )}

                <div className={`absolute top-0 right-0 w-8 h-8 border-t border-r pointer-events-none translate-x-2 -translate-y-2 transition-colors ${
                  isCompleted ? 'border-cyber-yellow/50' : 'border-cyber-blue/50 group-hover:border-cyber-yellow/50'
                }`} />
                <div className={`absolute bottom-0 left-0 w-8 h-8 border-b border-l pointer-events-none -translate-x-2 translate-y-2 transition-colors ${
                  isCompleted ? 'border-cyber-yellow/50' : 'border-cyber-blue/50 group-hover:border-cyber-yellow/50'
                }`} />

                <div className="flex flex-col mb-6 relative z-10">
                  <span className={`px-2 py-1 mb-4 text-[10px] w-fit font-mono font-bold uppercase tracking-widest border transition-colors ${
                    isCompleted
                      ? 'bg-cyber-yellow/20 text-cyber-yellow border-cyber-yellow/50'
                      : 'bg-cyber-blue/10 text-cyber-blue border-cyber-blue/30 group-hover:bg-cyber-yellow/10 group-hover:text-cyber-yellow group-hover:border-cyber-yellow/30'
                  }`}>
                    CLEARANCE: {track.id}
                  </span>
                  <h3 className={`text-4xl font-display font-bold uppercase tracking-wide transition-colors ${
                    isCompleted ? 'text-cyber-yellow' : 'text-cyber-blue group-hover:text-cyber-yellow'
                  }`}>
                    {track.id} PROTOCOL
                  </h3>
                </div>

                <div className={`grid grid-cols-3 gap-2 text-[10px] mb-8 mt-auto font-mono uppercase tracking-wider text-center relative z-10 ${
                  isCompleted ? 'text-cyber-yellow/70' : 'text-cyber-blue/50 group-hover:text-cyber-yellow/70'
                }`}>
                  <div className={`flex flex-col items-center justify-center p-2 border transition-colors ${
                    isCompleted ? 'bg-cyber-yellow/10 border-cyber-yellow/20' : 'bg-cyber-blue/5 border-cyber-blue/20 group-hover:border-cyber-yellow/20'
                  }`}>
                    <span className={`font-bold text-sm mb-1 transition-colors ${
                      isCompleted ? 'text-cyber-yellow' : 'text-cyber-blue group-hover:text-cyber-yellow'
                    }`}>{info.modules}</span>
                    <span>Nodes</span>
                  </div>
                  <div className={`flex flex-col items-center justify-center p-2 border transition-colors ${
                    isCompleted ? 'bg-cyber-yellow/10 border-cyber-yellow/20' : 'bg-cyber-blue/5 border-cyber-blue/20 group-hover:border-cyber-yellow/20'
                  }`}>
                    <span className={`font-bold text-sm mb-1 transition-colors ${
                      isCompleted ? 'text-cyber-yellow' : 'text-cyber-blue group-hover:text-cyber-yellow'
                    }`}>{info.quizzes}</span>
                    <span>Exams</span>
                  </div>
                  <div className={`flex flex-col items-center justify-center p-2 border transition-colors ${
                    isCompleted ? 'bg-cyber-yellow/10 border-cyber-yellow/20' : 'bg-cyber-blue/5 border-cyber-blue/20 group-hover:border-cyber-yellow/20'
                  }`}>
                    <span className={`font-bold text-sm mb-1 transition-colors ${
                      isCompleted ? 'text-cyber-yellow' : 'text-cyber-blue group-hover:text-cyber-yellow'
                    }`}>{info.hours}</span>
                    <span>Hours</span>
                  </div>
                </div>

                <button className={`w-full py-4 font-display font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all relative z-10 border ${
                  isCompleted
                    ? 'bg-cyber-yellow text-black border-cyber-yellow hover:bg-white shadow-[0_0_15px_rgba(255,214,0,0.4)]'
                    : 'bg-cyber-blue/10 border-cyber-blue text-cyber-blue group-hover:border-cyber-yellow group-hover:bg-cyber-yellow group-hover:text-black shadow-[0_0_15px_rgba(41,121,255,0.2)] group-hover:shadow-[0_0_15px_rgba(255,214,0,0.4)]'
                }`}>
                  {isCompleted ? 'TRACK COMPLETED' : 'INITIALIZE BOOTUP'}
                  {!isCompleted && <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />}
                  {isCompleted && <Check size={16} />}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

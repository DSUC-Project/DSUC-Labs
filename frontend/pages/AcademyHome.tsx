import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, BookOpen, Brain, Clock, Code, Cpu, Layers } from 'lucide-react';

import { TRACKS, type TrackId, lessonsByTrack } from '@/lib/academy/curriculum';
import { Card } from '@/components/academy/ui/Card';
import { Badge } from '@/components/academy/ui/Badge';
import { Button } from '@/components/academy/ui/Button';
import { trackStyle } from '@/components/academy/ui/trackStyle';
import { useStore } from '@/store/useStore';

const TECH_KEYWORDS = [
  'SOLANA',
  'RUST',
  'ANCHOR',
  'WEB3.JS',
  'METAPLEX',
  'TOKEN EXTENSIONS',
  'DEFI',
  'BLINKS',
  'ZK COMPRESSION',
  'ACTIONS',
];

const MARQUEE_ITEMS = [...TECH_KEYWORDS, ...TECH_KEYWORDS, ...TECH_KEYWORDS, ...TECH_KEYWORDS];

function stats(track: TrackId) {
  const lessons = lessonsByTrack(track);
  const quizzes = lessons.reduce((acc, lesson) => acc + (lesson.quiz?.length || 0), 0);
  const mins = lessons.reduce((acc, lesson) => acc + (lesson.minutes || 0), 0);
  const hours = Math.max(1, Math.round(mins / 60));
  return { modules: lessons.length, quizzes, hours };
}

export function AcademyHome() {
  const navigate = useNavigate();
  const { currentUser } = useStore();

  return (
    <div className="space-y-8 sm:space-y-12 relative academy-scope">
      <div className="absolute top-0 inset-x-0 h-[400px] overflow-hidden -z-10 pointer-events-none select-none">
        <div className="absolute top-4 left-[2%] md:left-[10%] text-indigo-500/5 animate-float" style={{ animationDelay: '0s' }}>
          <Code size={80} strokeWidth={1} className="sm:w-24 sm:h-24 md:w-32 md:h-32" />
        </div>
        <div className="absolute top-16 right-[2%] md:right-[5%] text-purple-500/5 animate-float" style={{ animationDelay: '2s' }}>
          <Cpu size={70} strokeWidth={1} className="sm:w-20 sm:h-20 md:w-28 md:h-28" />
        </div>
        <div className="absolute bottom-10 left-[20%] text-emerald-500/5 animate-float" style={{ animationDelay: '4s' }}>
          <Layers size={60} strokeWidth={1} className="sm:w-16 sm:h-16 md:w-24 md:h-24" />
        </div>
      </div>

      <header className="text-center space-y-4 pt-2 sm:pt-4 relative z-10">
        <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-400 text-[10px] sm:text-xs font-bold uppercase tracking-widest mb-2 animate-pulse">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.5)]"></span>
          Native In DSUC Web
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-7xl font-extrabold font-display tracking-tight text-white drop-shadow-xl leading-tight">
          DSUC -{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400 animate-gradient-x bg-[length:200%_auto]">
            Academy
          </span>
        </h1>

        <p className="text-base sm:text-xl text-slate-400 font-light max-w-xl mx-auto leading-relaxed px-4">
          The ultimate path to{' '}
          <span className="text-slate-200 font-medium border-b border-indigo-500/50">Solana Mastery</span>.
          <br className="hidden sm:block" />
          Level up from <span className="text-emerald-400 font-medium">Genin</span> to{' '}
          <span className="text-purple-400 font-medium">Jonin</span>.
        </p>

        <p className="text-xs text-slate-500">
          {currentUser
            ? `Synced with club account: ${currentUser.name} (${currentUser.id})`
            : 'Guest mode active. Sign in once on DSUC web to sync your progress later.'}
        </p>
      </header>

      <div className="w-[100vw] relative left-1/2 -translate-x-1/2 overflow-hidden py-3 sm:py-4 border-y border-white/5 bg-white/[0.02] backdrop-blur-sm">
        <div className="flex w-max animate-marquee gap-8 sm:gap-16 items-center">
          {MARQUEE_ITEMS.map((tech, index) => (
            <div key={`${tech}-${index}`} className="flex items-center gap-8 sm:gap-16 group">
              <span
                className="text-2xl sm:text-3xl md:text-5xl font-black font-display text-transparent stroke-text opacity-10 whitespace-nowrap group-hover:opacity-30 transition-opacity duration-300"
                style={{ WebkitTextStroke: '1px rgba(255,255,255,0.5)' }}
              >
                {tech}
              </span>
              <span className="text-lg text-indigo-500/20">*</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6 pb-8 relative z-10 px-2 sm:px-0">
        {TRACKS.map((track) => {
          const style = trackStyle(track.id);
          const info = stats(track.id);

          return (
            <Card
              key={track.id}
              onClick={() => navigate(`/academy/track/${track.id}`)}
              className="flex flex-col h-full group relative overflow-hidden"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${style.cardGlow} opacity-0 group-hover:opacity-20 transition-opacity duration-500`} />

              <div className="flex justify-between items-start mb-4 relative z-10">
                <Badge className={`border ${style.badge} bg-transparent`}>{track.id.toUpperCase()}</Badge>
                <div
                  className={`w-10 h-10 rounded-full bg-gradient-to-br ${style.gradient} opacity-80 group-hover:scale-110 transition-transform duration-500 shadow-lg shadow-white/5 group-hover:shadow-[0_0_20px_rgba(255,255,255,0.2)]`}
                />
              </div>

              <h2 className="text-2xl font-bold mb-2 text-white font-display group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-slate-300 transition-colors relative z-10">
                {track.title}
              </h2>

              <p className="text-slate-400 text-sm mb-6 flex-grow leading-relaxed relative z-10 group-hover:text-slate-300 transition-colors line-clamp-3">
                {track.subtitle}
              </p>

              <div className="flex flex-wrap gap-2 mb-6 relative z-10">
                <Badge variant="neutral" className="flex items-center gap-1 text-[10px] sm:text-xs">
                  <BookOpen className="w-3 h-3" /> {info.modules} Modules
                </Badge>
                <Badge variant="neutral" className="flex items-center gap-1 text-[10px] sm:text-xs">
                  <Brain className="w-3 h-3" /> {info.quizzes} Quizzes
                </Badge>
                <Badge variant="neutral" className="flex items-center gap-1 text-[10px] sm:text-xs">
                  <Clock className="w-3 h-3" /> ~{info.hours} hrs
                </Badge>
              </div>

              <Button variant="secondary" fullWidth size="sm" className="relative z-10">
                View modules <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Card>
          );
        })}
      </div>

      <div className="text-center text-xs text-slate-600">
        <Link className="underline hover:text-slate-400" to="/academy/track/genin">
          Start from Genin
        </Link>
      </div>
    </div>
  );
}

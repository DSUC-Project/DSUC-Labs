import React, { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Clock, Lock, Star, Terminal, CheckCircle2, Navigation } from 'lucide-react';

import { TRACKS, lessonsByTrack, type TrackId } from '@/lib/academy/curriculum';
import { useStore } from '@/store/useStore';
import { loadProgress, isLessonCompleted } from '@/lib/academy/progress';

function isTrackId(value: string | undefined): value is TrackId {
  return value === 'genin' || value === 'chunin' || value === 'jonin';
}

export function AcademyTrack() {
  const params = useParams<{ track: string }>();
  const navigate = useNavigate();
  const [showSkipTest, setShowSkipTest] = useState(false);

  if (!isTrackId(params.track)) {
    return <div className="text-center py-20 text-white/40 font-mono text-sm tracking-widest uppercase">404 // Track not found</div>;
  }

  const track = params.track;
  const trackInfo = TRACKS.find((item) => item.id === track);
  const lessons = lessonsByTrack(track);

  if (!trackInfo) {
    return <div className="text-center py-20 text-white/40 font-mono text-sm tracking-widest uppercase">Track not found</div>;
  }

  // Zig-zag positions for path
  const getOffset = (index: number) => {
    const isMobile = window.innerWidth < 640;
    if (isMobile) return 0;
    const sequence = [0, 60, 90, 60, 0, -60, -90, -60];
    return sequence[index % sequence.length];
  };

  const { currentUser, walletAddress } = useStore();

  const identity = React.useMemo(
    () => ({
      userId: currentUser?.id ?? null,
      walletAddress: walletAddress ?? null,
    }),
    [currentUser?.id, walletAddress]
  );

  const [state] = React.useState(() => loadProgress(identity));

  // Calculate Progress Fill percentage
  const completedCount = lessons.filter(l => isLessonCompleted(state, track, l.id)).length;
  const progressPercent = lessons.length > 0 ? (completedCount / lessons.length) * 100 : 0;

  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-20">
      {/* Top Header Row */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-surface/50 p-4 border border-cyber-blue/20 backdrop-blur-md relative overflow-hidden">
        <Link to="/academy" className="inline-flex items-center text-xs font-mono font-bold uppercase tracking-widest text-cyber-blue hover:text-white transition-colors relative z-10">
          <ArrowLeft className="w-4 h-4 mr-2" /> BOOT_SEQUENCE
        </Link>
        <div className="flex items-center gap-4 relative z-10">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-cyber-yellow/10 border border-cyber-yellow/30 text-cyber-yellow text-xs font-mono font-bold uppercase tracking-widest shadow-[0_0_10px_rgba(255,214,0,0.1)]">
            <Star size={14} className="fill-cyber-yellow" />
            <span className="hidden sm:inline">STREAK: {currentUser?.streak || 0}</span>
            <span className="sm:hidden">{currentUser?.streak || 0}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-cyber-blue/10 border border-cyber-blue/30 text-cyber-blue text-xs font-mono font-bold uppercase tracking-widest shadow-[0_0_10px_rgba(41,121,255,0.1)]">
            <Terminal size={14} />
            <span className="hidden sm:inline">BUILDS: {currentUser?.builds || 0}</span>
            <span className="sm:hidden">{currentUser?.builds || 0}</span>
          </div>
        </div>
      </div>

      <header className="text-center space-y-6 pt-4 relative">
        <div className="inline-flex px-3 py-1 text-[10px] font-mono font-bold tracking-widest uppercase mb-2 bg-cyber-blue/10 text-cyber-blue border border-cyber-blue/30 shadow-[0_0_10px_rgba(41,121,255,0.2)]">
          {trackInfo.id} // SEC_CLEARANCE
        </div>

        <h1 className="text-4xl sm:text-6xl font-display font-bold tracking-widest text-white py-2 uppercase drop-shadow-[0_0_15px_rgba(41,121,255,0.3)] mb-4">
          {trackInfo.title}
        </h1>
      </header>

      {/* Timeline Section */}
      <div className="relative mt-16 px-4 sm:px-8">
        {/* Vertical Path Line */}
        <div className="absolute left-8 sm:left-12 top-0 bottom-0 w-1 bg-surface border-l border-r border-cyber-blue/20">
           {/* Animated progress fill */}
           <div className="w-full bg-cyber-yellow relative shadow-[0_0_10px_rgba(255,214,0,0.8)] transition-all duration-1000" style={{ height: `${progressPercent}%` }}>
             <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-[2px] bg-white shadow-[0_0_10px_rgba(255,255,255,1)]" />
           </div>
        </div>

        <div className="space-y-8 relative z-10">
          {lessons.length > 0 ? (
            lessons.map((lesson, index) => {
              const isCompleted = isLessonCompleted(state, track, lesson.id);
              const prevLessonId = index > 0 ? lessons[index - 1].id : null;
              const isPrevCompleted = prevLessonId ? isLessonCompleted(state, track, prevLessonId) : true;

              const isLocked = !isPrevCompleted;
              const isCurrent = !isLocked && !isCompleted;

              return (
                <button
                  type="button"
                  key={lesson.id}
                  className={`relative flex w-full text-left items-center gap-6 sm:gap-8 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyber-yellow/80 focus-visible:ring-offset-2 focus-visible:ring-offset-background ${isLocked ? 'cursor-default opacity-50' : 'cursor-pointer'}`}
                  onClick={() => !isLocked && navigate(`/academy/learn/${track}/${lesson.id}`)}
                  disabled={isLocked}
                >
                  {/* Timeline Node Connector */}
                  <div className={`relative flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-none border-2 bg-surface transition-colors ${
                    isLocked
                      ? 'border-white/20'
                      : isCompleted
                        ? 'border-cyber-yellow shadow-[0_0_15px_rgba(255,214,0,0.4)]'
                        : 'border-cyber-blue shadow-[0_0_15px_rgba(41,121,255,0.4)]'
                  }`}>
                    {isCompleted ? <CheckCircle2 size={16} className="text-cyber-yellow" /> : <div className={`w-2 h-2 ${isLocked ? 'bg-white/20' : 'bg-cyber-blue'}`} />}
                  </div>

                  {/* Lesson Card */}
                  <div className={`relative flex-grow p-6 border transition-all overflow-hidden ${
                    isCompleted
                      ? 'bg-cyber-yellow/10 border-cyber-yellow hover:bg-cyber-yellow/20'
                      : isLocked
                        ? 'bg-surface border-white/10'
                        : 'bg-cyber-blue/10 border-cyber-blue hover:bg-cyber-blue/20 shadow-[0_0_20px_rgba(41,121,255,0.1)]'
                  }`}>
                    {/* Background V for completed */}
                    {isCompleted && (
                      <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
                        <CheckCircle2 size={120} className="text-cyber-yellow" />
                      </div>
                    )}

                    <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`px-2 py-0.5 text-[10px] font-mono font-bold uppercase tracking-widest border ${
                            isCompleted ? 'bg-cyber-yellow/20 text-cyber-yellow border-cyber-yellow/50' : 'bg-white/5 text-white/50 border-white/10'
                          }`}>
                            MODULE {index + 1}
                          </span>
                          {isCurrent && (
                            <span className="px-2 py-0.5 text-[10px] font-mono font-bold uppercase tracking-widest bg-cyber-blue text-black animate-pulse">
                              ACTIVE_NODE
                            </span>
                          )}
                        </div>
                        <h3 className={`text-xl font-display font-bold uppercase tracking-wider ${
                          isCompleted ? 'text-cyber-yellow' : isLocked ? 'text-white/50' : 'text-cyber-blue'
                        }`}>
                          {lesson.title}
                        </h3>
                      </div>

                      <div className="flex items-center gap-4 text-[10px] font-mono tracking-widest uppercase shrink-0">
                        <span className={`flex items-center gap-1.5 ${isCompleted ? 'text-cyber-yellow/70' : 'text-white/50'}`}>
                          <Clock size={12} /> {lesson.minutes} MIN
                        </span>
                        {isLocked ? (
                          <Lock size={16} className="text-white/20 ml-2" />
                        ) : (
                          <div className={`p-2 border ${isCompleted ? 'border-cyber-yellow/50 bg-cyber-yellow/10 text-cyber-yellow' : 'border-cyber-blue/50 bg-cyber-blue/10 text-cyber-blue'}`}>
                             {isCompleted ? 'CLEARED' : 'INITIATE'}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })
          ) : (
            <div className="text-white/40 font-mono tracking-widest uppercase w-full text-center">No data found.</div>
          )}

          {/* End of Track Element */}
          {lessons.length > 0 && progressPercent === 100 && (
            <div className="relative flex items-center gap-6 sm:gap-8 group mt-12">
              <div className="relative flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-none border-2 bg-surface transition-colors border-cyber-yellow shadow-[0_0_15px_rgba(255,214,0,0.6)]">
                <Star size={16} className="fill-cyber-yellow text-cyber-yellow animate-pulse" />
              </div>
              <div className="relative flex-grow p-8 bg-cyber-yellow border border-cyber-yellow text-black flex flex-col sm:flex-row items-center justify-between gap-6 shadow-[0_0_30px_rgba(255,214,0,0.3)]">
                <div>
                  <h3 className="text-2xl font-display font-bold uppercase tracking-wider mb-2">
                    {trackInfo.id} CLEARANCE ACHIEVED
                  </h3>
                  <p className="font-mono text-xs uppercase tracking-widest text-black/70">
                    All modules validated. You are now ready for the next level.
                  </p>
                </div>
                <button
                  onClick={() => navigate('/academy')}
                  className="px-6 py-3 bg-black text-cyber-yellow border border-black font-display font-bold uppercase tracking-widest text-sm hover:bg-white hover:text-black transition-all shadow-lg whitespace-nowrap"
                >
                  RETURN TO BASE
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

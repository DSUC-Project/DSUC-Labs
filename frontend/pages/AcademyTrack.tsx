import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Clock, Lock, Star, Terminal } from 'lucide-react';

import type { AcademyTrackCatalog } from '@/types';
import { useStore } from '@/store/useStore';
import { loadProgress, isLessonCompleted } from '@/lib/academy/progress';
import { normalizeAcademyCatalogTrack } from '@/lib/academy/catalog';

function buildAuthHeaders(token: string | null, walletAddress: string | null) {
  const headers: Record<string, string> = {};

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  } else if (walletAddress) {
    headers['x-wallet-address'] = walletAddress;
  }

  return headers;
}

export function AcademyTrack() {
  const params = useParams<{ track: string }>();
  const navigate = useNavigate();
  const { currentUser, walletAddress, authToken } = useStore();
  const [trackInfo, setTrackInfo] = useState<AcademyTrackCatalog | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const trackId = String(params.track || '').trim();

  const identity = useMemo(
    () => ({
      userId: currentUser?.id ?? null,
      walletAddress: walletAddress ?? null,
    }),
    [currentUser?.id, walletAddress]
  );
  const [state] = useState(() => loadProgress(identity));

  useEffect(() => {
    if (!trackId) {
      setTrackInfo(null);
      setError('Track not found');
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function fetchTrack() {
      setLoading(true);
      setError('');
      try {
        const base = (import.meta as any).env.VITE_API_BASE_URL || '';
        const response = await fetch(`${base}/api/academy/catalog`, {
          headers: buildAuthHeaders(authToken || localStorage.getItem('auth_token'), walletAddress),
          credentials: 'include',
        });
        const result = await response.json().catch(() => null);

        if (!response.ok || !result?.success) {
          throw new Error(result?.message || 'Failed to load academy track.');
        }

        const tracks = (result.data || []).map(normalizeAcademyCatalogTrack);
        const found = tracks.find((item) => item.id === trackId) || null;

        if (!cancelled) {
          if (!found) {
            setError('Track not found');
            setTrackInfo(null);
          } else {
            setTrackInfo(found);
          }
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err.message || 'Failed to load academy track.');
          setTrackInfo(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void fetchTrack();

    return () => {
      cancelled = true;
    };
  }, [authToken, trackId, walletAddress]);

  if (loading) {
    return <div className="text-center py-20 text-white/40 font-mono tracking-widest uppercase">Loading track...</div>;
  }

  if (!trackInfo) {
    return <div className="text-center py-20 text-white/40 font-mono tracking-widest uppercase">{error || 'Track not found'}</div>;
  }

  const lessons = trackInfo.lessons || [];
  const completedCount = lessons.filter((lesson) => isLessonCompleted(state, trackInfo.id, lesson.id)).length;
  const progressPercent = lessons.length > 0 ? (completedCount / lessons.length) * 100 : 0;

  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-surface/50 p-4 border border-cyber-blue/20 backdrop-blur-md relative overflow-hidden">
        <Link to="/academy" className="inline-flex items-center text-xs font-mono font-bold uppercase tracking-widest text-cyber-blue hover:text-white transition-colors relative z-10">
          <ArrowLeft className="w-4 h-4 mr-2" /> BOOT_SEQUENCE
        </Link>
        <div className="flex items-center gap-4 relative z-10">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-cyber-yellow/10 border border-cyber-yellow/30 text-cyber-yellow text-xs font-mono font-bold uppercase tracking-widest">
            <Star size={14} className="fill-cyber-yellow" />
            <span className="hidden sm:inline">STREAK: {currentUser?.streak || 0}</span>
            <span className="sm:hidden">{currentUser?.streak || 0}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-cyber-blue/10 border border-cyber-blue/30 text-cyber-blue text-xs font-mono font-bold uppercase tracking-widest">
            <Terminal size={14} />
            <span className="hidden sm:inline">BUILDS: {currentUser?.builds || 0}</span>
            <span className="sm:hidden">{currentUser?.builds || 0}</span>
          </div>
        </div>
      </div>

      <header className="text-center space-y-6 pt-4 relative">
        <div className="inline-flex px-3 py-1 text-[10px] font-mono font-bold tracking-widest uppercase mb-2 bg-cyber-blue/10 text-cyber-blue border border-cyber-blue/30">
          {trackInfo.id} // TRACK
        </div>
        <h1 className="text-4xl sm:text-6xl font-display font-bold tracking-widest text-white py-2 uppercase">
          {trackInfo.title}
        </h1>
        <div className="mx-auto max-w-2xl border border-cyber-yellow/25 bg-cyber-yellow/10 px-4 py-3 text-sm leading-7 text-cyber-yellow/90">
          This page is the legacy <span className="font-semibold uppercase tracking-[0.16em]">community track lane</span>.
          Curated Academy v2 lives on the main `/academy` path and follows the new path/course/unit flow.
        </div>
      </header>

      <div className="relative mt-16 px-4 sm:px-8">
        <div className="absolute left-8 sm:left-12 top-0 bottom-0 w-1 bg-surface border-l border-r border-cyber-blue/20">
          <div className="w-full bg-cyber-yellow relative shadow-[0_0_10px_rgba(255,214,0,0.8)] transition-all duration-1000" style={{ height: `${progressPercent}%` }} />
        </div>

        <div className="space-y-8 relative z-10">
          {lessons.length > 0 ? (
            lessons.map((lesson, index) => {
              const isCompleted = isLessonCompleted(state, trackInfo.id, lesson.id);
              const prevLessonId = index > 0 ? lessons[index - 1].id : null;
              const isPrevCompleted = prevLessonId ? isLessonCompleted(state, trackInfo.id, prevLessonId) : true;
              const isLocked = !isPrevCompleted;
              const isCurrent = !isLocked && !isCompleted;

              return (
                <button
                  type="button"
                  key={lesson.id}
                  className={`relative flex w-full text-left items-center gap-6 sm:gap-8 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyber-yellow/80 focus-visible:ring-offset-2 focus-visible:ring-offset-background ${isLocked ? 'cursor-default opacity-50' : 'cursor-pointer'}`}
                  onClick={() => !isLocked && navigate(`/academy/community/${trackInfo.id}/${lesson.id}`)}
                  disabled={isLocked}
                >
                  <div className={`relative flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-none border-2 bg-surface transition-colors ${
                    isLocked
                      ? 'border-white/20'
                      : isCompleted
                        ? 'border-cyber-yellow shadow-[0_0_15px_rgba(255,214,0,0.4)]'
                        : 'border-cyber-blue shadow-[0_0_15px_rgba(41,121,255,0.4)]'
                  }`}>
                    {isCompleted ? <CheckCircle2 size={16} className="text-cyber-yellow" /> : <div className={`w-2 h-2 ${isLocked ? 'bg-white/20' : 'bg-cyber-blue'}`} />}
                  </div>

                  <div className={`relative flex-grow p-6 border transition-all overflow-hidden ${
                    isCompleted
                      ? 'bg-cyber-yellow/10 border-cyber-yellow hover:bg-cyber-yellow/20'
                      : isLocked
                        ? 'bg-surface border-white/10'
                        : 'bg-cyber-blue/10 border-cyber-blue hover:bg-cyber-blue/20'
                  }`}>
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
            <div className="text-white/40 font-mono tracking-widest uppercase w-full text-center">No lessons in this track.</div>
          )}
        </div>
      </div>
    </div>
  );
}

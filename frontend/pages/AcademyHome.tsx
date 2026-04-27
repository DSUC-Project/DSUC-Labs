import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  BookOpen,
  Check,
  Flame,
  Terminal,
  User,
} from 'lucide-react';

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

function isTrackCompleted(state: any, track: AcademyTrackCatalog) {
  if (!track.lessons || track.lessons.length === 0) {
    return false;
  }
  return track.lessons.every((lesson) => isLessonCompleted(state, track.id, lesson.id));
}

function trackStats(track: AcademyTrackCatalog) {
  const modules = track.lessons.length;
  const mins = track.lessons.reduce((sum, lesson) => sum + Number(lesson.minutes || 0), 0);
  const hours = Math.max(1, Math.round(mins / 60));
  return { modules, hours };
}

export function AcademyHome() {
  const navigate = useNavigate();
  const { currentUser, walletAddress, authToken } = useStore();
  const [tracks, setTracks] = useState<AcademyTrackCatalog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const identity = useMemo(
    () => ({
      userId: currentUser?.id ?? null,
      walletAddress: walletAddress ?? null,
    }),
    [currentUser?.id, walletAddress]
  );
  const progressState = useMemo(() => loadProgress(identity), [identity]);

  useEffect(() => {
    let cancelled = false;

    async function fetchCatalog() {
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
          throw new Error(result?.message || 'Failed to load academy catalog.');
        }

        if (!cancelled) {
          const normalized = (result.data || [])
            .map(normalizeAcademyCatalogTrack)
            .sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0));
          setTracks(normalized);
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err.message || 'Failed to load academy catalog.');
          setTracks([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void fetchCatalog();

    return () => {
      cancelled = true;
    };
  }, [authToken, walletAddress]);

  return (
    <div className="space-y-12 pb-20">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 flex flex-col justify-center">
          <div className="mb-6 inline-flex items-center gap-2 px-3 py-1 border border-cyber-blue/30 bg-cyber-blue/5 text-cyber-blue text-xs font-mono uppercase tracking-widest w-fit">
            <Terminal size={14} /> DSUC ACADEMY HUB
          </div>
          <h1 className="text-5xl sm:text-7xl lg:text-8xl font-display font-bold tracking-tight mb-8 leading-[1] text-white uppercase drop-shadow-[0_0_20px_rgba(41,121,255,0.2)]">
            DSUC <span className="text-transparent bg-clip-text bg-gradient-to-b from-cyber-blue to-black/50">ACADEMY</span>
          </h1>
          <p className="text-lg text-white/60 max-w-2xl font-mono leading-relaxed uppercase tracking-wide">
            Dynamic track system is now database-driven. Create your own learning paths from Academy Admin.
          </p>
        </div>

        <div className="lg:col-span-4 relative group">
          <div className="cyber-card bg-surface/60 border border-white/20 p-6 h-full flex flex-col relative overflow-hidden group-hover:border-cyber-yellow/50 transition-colors duration-500">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 pointer-events-none mix-blend-overlay" />
            <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-cyber-yellow/50 -translate-x-1 -translate-y-1" />
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-cyber-yellow/50 translate-x-1 translate-y-1" />

            <div className="flex justify-between items-start mb-6">
              <div>
                <div className="text-[10px] font-mono text-white/50 uppercase tracking-widest bg-white/5 px-2 py-0.5 rounded-sm border border-white/10 mb-1">
                  ID: {currentUser?.id?.slice(0, 8) || 'GUEST-001'}
                </div>
                <div className="text-sm font-display font-bold text-cyber-blue uppercase tracking-wider">
                  {currentUser?.role || 'Initiate'}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 border-2 border-white/20 relative overflow-hidden bg-black/50 shrink-0">
                {currentUser?.avatar ? (
                  <img src={currentUser.avatar} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <User size={32} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white/20" />
                )}
              </div>
              <div className="flex flex-col overflow-hidden">
                <div className="text-2xl font-display font-bold text-white uppercase truncate">
                  {currentUser?.name || 'UNKNOWN OPERATIVE'}
                </div>
              </div>
            </div>

            <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent mb-6" />
            <div className="flex-grow flex flex-col items-center justify-center relative">
              <div className="flex items-end gap-3 z-10">
                <Flame size={50} className={`${currentUser?.streak && currentUser.streak > 0 ? 'text-cyber-yellow drop-shadow-[0_0_15px_rgba(255,214,0,0.8)] fill-cyber-yellow/30' : 'text-white/20'}`} />
                <span className="font-display font-bold text-6xl text-white tracking-widest">
                  {currentUser?.streak || 0}
                </span>
              </div>
              <div className="mt-2 text-cyber-yellow font-mono text-xs tracking-[0.3em] uppercase font-bold bg-cyber-yellow/10 border border-cyber-yellow/20 px-4 py-1 rounded-sm">
                DAY STREAK
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-8 mt-12">
        <h2 className="text-2xl font-display font-bold text-white uppercase tracking-widest flex items-center gap-3">
          <BookOpen className="w-6 h-6 text-cyber-blue" />
          AVAILABLE TRACKS
        </h2>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="h-56 border border-white/10 bg-surface/40 animate-pulse" />
            ))}
          </div>
        ) : error ? (
          <div className="border border-red-400/40 bg-red-500/10 p-4 text-sm text-red-100">{error}</div>
        ) : tracks.length === 0 ? (
          <div className="border border-dashed border-cyber-blue/30 bg-surface/60 p-8 text-center">
            <h3 className="font-display text-xl font-bold uppercase tracking-widest text-white">
              No tracks yet
            </h3>
            <p className="mt-3 text-sm text-white/60">
              Go to Academy Admin and create the first track + lessons.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {tracks.map((track) => {
              const info = trackStats(track);
              const isCompleted = isTrackCompleted(progressState, track);

              return (
                <button
                  type="button"
                  key={track.id}
                  onClick={() => navigate(`/academy/track/${track.id}`)}
                  className={`group text-left border p-6 flex flex-col transition-all relative shadow-lg overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyber-yellow/80 focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                    isCompleted
                      ? 'bg-cyber-yellow/10 border-cyber-yellow hover:bg-cyber-yellow/20'
                      : 'bg-surface/50 border-cyber-blue hover:border-cyber-yellow hover:bg-cyber-yellow/5'
                  }`}
                >
                  {isCompleted && (
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.05] pointer-events-none">
                      <Check size={220} className="text-cyber-yellow" />
                    </div>
                  )}

                  <div className="flex flex-col mb-6 relative z-10">
                    <span className="px-2 py-1 mb-4 text-[10px] w-fit font-mono font-bold uppercase tracking-widest border bg-cyber-blue/10 text-cyber-blue border-cyber-blue/30">
                      TRACK: {track.id}
                    </span>
                    <h3 className="text-3xl font-display font-bold uppercase tracking-wide text-cyber-blue group-hover:text-cyber-yellow transition-colors">
                      {track.title}
                    </h3>
                    <p className="mt-2 text-xs text-white/60 leading-relaxed min-h-10">
                      {track.subtitle || track.description || 'Custom academy track'}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[10px] mb-8 mt-auto font-mono uppercase tracking-wider text-center relative z-10 text-cyber-blue/60">
                    <div className="flex flex-col items-center justify-center p-2 border bg-cyber-blue/5 border-cyber-blue/20">
                      <span className="font-bold text-sm mb-1 text-cyber-blue">{info.modules}</span>
                      <span>Modules</span>
                    </div>
                    <div className="flex flex-col items-center justify-center p-2 border bg-cyber-blue/5 border-cyber-blue/20">
                      <span className="font-bold text-sm mb-1 text-cyber-blue">{info.hours}</span>
                      <span>Hours</span>
                    </div>
                  </div>

                  <span className="w-full py-4 font-display font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all relative z-10 border bg-cyber-blue/10 border-cyber-blue text-cyber-blue group-hover:border-cyber-yellow group-hover:bg-cyber-yellow group-hover:text-black">
                    OPEN TRACK <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

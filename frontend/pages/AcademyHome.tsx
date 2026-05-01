import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BookOpen,
  Boxes,
  Flame,
  Sparkles,
  Trophy,
} from 'lucide-react';

import type { AcademyLearnerStats, AcademyV2CommunityTrack, AcademyV2Path } from '@/types';
import { fetchAcademyV2Catalog } from '@/lib/academy/v2Api';
import { useAcademyProgressState } from '@/lib/academy/useAcademyProgress';
import { countCompletedAcademyV2CourseUnits } from '@/lib/academy/v2Progress';
import { useStore } from '@/store/useStore';
import { useShellActions } from '@/components/Layout';
import {
  ActionButton,
  EmptyState,
  PageHeader,
  SectionHeader,
  SkeletonBlock,
  StatusBadge,
  SurfaceCard,
} from '@/components/ui/Primitives';

const ACADEMY_TIME_ZONE = 'Asia/Ho_Chi_Minh';
const academyDayFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: ACADEMY_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});
const academyWeekdayFormatter = new Intl.DateTimeFormat('vi-VN', {
  timeZone: ACADEMY_TIME_ZONE,
  weekday: 'short',
});
const academyDayNumberFormatter = new Intl.DateTimeFormat('vi-VN', {
  timeZone: ACADEMY_TIME_ZONE,
  day: '2-digit',
});

function academyDayKey(value: Date) {
  const parts = academyDayFormatter.formatToParts(value);
  const year = parts.find((part) => part.type === 'year')?.value || '0000';
  const month = parts.find((part) => part.type === 'month')?.value || '00';
  const day = parts.find((part) => part.type === 'day')?.value || '00';
  return `${year}-${month}-${day}`;
}

export function AcademyHome() {
  const { currentUser, walletAddress, authToken } = useStore();
  const { openAuthModal } = useShellActions();
  const [paths, setPaths] = useState<AcademyV2Path[]>([]);
  const [communityTracks, setCommunityTracks] = useState<AcademyV2CommunityTrack[]>([]);
  const [learnerStats, setLearnerStats] = useState<AcademyLearnerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const identity = useMemo(
    () => ({
      userId: currentUser?.id ?? null,
      walletAddress: walletAddress ?? null,
    }),
    [currentUser?.id, walletAddress]
  );

  const { state } = useAcademyProgressState({
    identity,
    currentUserId: currentUser?.id ?? null,
    authToken,
    walletAddress,
  });

  useEffect(() => {
    let cancelled = false;

    async function loadCatalog() {
      setLoading(true);
      setError('');
      try {
        const base = (import.meta as any).env.VITE_API_BASE_URL || '';
        const data = await fetchAcademyV2Catalog(
          base,
          authToken || localStorage.getItem('auth_token'),
          walletAddress
        );

        if (!cancelled) {
          setPaths((data.curated_paths || []).slice().sort((a, b) => a.order - b.order));
          setCommunityTracks(
            (data.community_tracks || []).slice().sort((a, b) => a.sort_order - b.sort_order)
          );
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err.message || 'Failed to load academy catalog.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadCatalog();
    return () => {
      cancelled = true;
    };
  }, [authToken, walletAddress]);

  useEffect(() => {
    if (!currentUser) {
      setLearnerStats(null);
      return;
    }

    let cancelled = false;

    async function loadLearnerStats() {
      try {
        const base = (import.meta as any).env.VITE_API_BASE_URL || '';
        const token = authToken || localStorage.getItem('auth_token');
        const headers: Record<string, string> = {};

        if (token) {
          headers.Authorization = `Bearer ${token}`;
        } else if (walletAddress) {
          headers['x-wallet-address'] = walletAddress;
        }

        const response = await fetch(`${base}/api/academy/stats`, {
          headers,
          credentials: 'include',
        });
        const result = await response.json().catch(() => null);

        if (!cancelled && response.ok && result?.success && result?.data) {
          setLearnerStats(result.data as AcademyLearnerStats);
        }
      } catch {
        if (!cancelled) {
          setLearnerStats(null);
        }
      }
    }

    void loadLearnerStats();
    return () => {
      cancelled = true;
    };
  }, [authToken, currentUser, walletAddress]);

  const totalCuratedUnits = paths.reduce((sum, path) => sum + path.total_unit_count, 0);
  const totalCompletedUnits = paths.reduce(
    (sum, path) =>
      sum +
      path.courses.reduce(
        (courseSum, course) =>
          courseSum + countCompletedAcademyV2CourseUnits(state.completedLessons, course.id),
        0
      ),
    0
  );

  const today = new Date();
  const firstName = currentUser?.name?.split(' ')[0] || 'Builder';
  const currentStreak = learnerStats?.streak ?? 0;
  const lastActivityLabel = learnerStats?.last_activity
    ? new Date(learnerStats.last_activity).toLocaleDateString('en-US', {
        timeZone: ACADEMY_TIME_ZONE,
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : '';
  const activeDays = new Set(learnerStats?.active_days || []);
  const streakDays = Array.from({ length: 14 }).map((_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (13 - i));
    const dayKey = academyDayKey(d);
    return {
      date: d,
      completed: activeDays.has(dayKey),
      isToday: i === 13,
    };
  });

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-14 pb-10">
      <section className="grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,420px)]">
        <div className="space-y-8">
          <PageHeader
            eyebrow="Academy"
            title="Serious learning for builders who want a real Solana roadmap."
            subtitle="Curated Paths are the official DSUC progression. Community Tracks stay lighter and exploratory, so the main roadmap remains focused."
          />

          <div className="grid gap-4 sm:grid-cols-3">
            <SurfaceCard className="p-5">
              <BookOpen className="h-5 w-5 text-primary" aria-hidden="true" />
              <p className="mt-4 text-3xl font-semibold tracking-tight text-text-main">{paths.length}</p>
              <p className="mt-1 text-sm text-text-muted">Curated paths</p>
            </SurfaceCard>
            <SurfaceCard className="p-5">
              <Boxes className="h-5 w-5 text-primary" aria-hidden="true" />
              <p className="mt-4 text-3xl font-semibold tracking-tight text-text-main">{totalCuratedUnits}</p>
              <p className="mt-1 text-sm text-text-muted">Total units</p>
            </SurfaceCard>
            <SurfaceCard className="p-5">
              <Flame className="h-5 w-5 text-primary" aria-hidden="true" />
              <p className="mt-4 text-3xl font-semibold tracking-tight text-text-main">{totalCompletedUnits}</p>
              <p className="mt-1 text-sm text-text-muted">Completed units</p>
            </SurfaceCard>
          </div>
        </div>

        <SurfaceCard className="p-6">
          {currentUser ? (
            <div className="space-y-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <StatusBadge tone="info">Learning streak</StatusBadge>
                  <p className="mt-4 font-heading text-5xl font-semibold tracking-tight text-text-main">
                    {currentStreak}
                  </p>
                  <p className="mt-2 text-sm text-text-muted">
                    {currentStreak > 0 ? `${firstName} is keeping momentum.` : 'Start your streak with the next unit.'}
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Trophy className="h-5 w-5" aria-hidden="true" />
                </div>
              </div>

              <div className="grid grid-cols-7 gap-2">
                {streakDays.map((day, index) => (
                  <div key={index} className="space-y-2 text-center">
                    <p className="text-[10px] uppercase tracking-[0.18em] text-text-muted">
                      {academyWeekdayFormatter.format(day.date)}
                    </p>
                    <div
                      className={`flex h-11 items-center justify-center rounded-2xl border ${
                        day.completed
                          ? 'border-primary/30 bg-primary text-white'
                          : day.isToday
                            ? 'border-primary/60 bg-primary/8 text-primary'
                            : 'border-border-main bg-main-bg text-text-muted/40'
                      }`}
                    >
                      {day.completed || day.isToday ? <Flame className="h-4 w-4" aria-hidden="true" /> : null}
                    </div>
                    <p className="text-[10px] uppercase tracking-[0.18em] text-text-muted">
                      {academyDayNumberFormatter.format(day.date)}
                    </p>
                  </div>
                ))}
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-[22px] border border-border-main bg-main-bg p-4">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-text-muted">Current</p>
                  <p className="mt-2 text-base font-semibold text-text-main">{currentStreak} day streak</p>
                </div>
                <div className="rounded-[22px] border border-border-main bg-main-bg p-4">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-text-muted">Last active</p>
                  <p className="mt-2 text-base font-semibold text-text-main">{lastActivityLabel || 'Not yet started'}</p>
                </div>
              </div>
            </div>
          ) : (
            <EmptyState
              title="Track your streak once you sign in"
              message="Guest mode lets you browse the curriculum. Sign in to persist completion, unlock credentials, and keep your daily streak."
              action={
                <ActionButton variant="secondary" onClick={() => openAuthModal('login')}>
                  Login To Start
                </ActionButton>
              }
            />
          )}
        </SurfaceCard>
      </section>

      <section className="space-y-6">
        <SectionHeader
          eyebrow="Primary Lane"
          title="Curated Paths"
          subtitle="The official DSUC roadmap. Each path keeps a clear sequence, visible progress, and a measured next step."
        />

        {loading ? (
          <div className="grid gap-6 lg:grid-cols-2">
            {Array.from({ length: 2 }).map((_, index) => (
              <SurfaceCard key={index} className="space-y-4 p-6">
                <SkeletonBlock className="h-5 w-28" />
                <SkeletonBlock className="h-12 w-3/4" />
                <SkeletonBlock className="h-20 w-full" />
                <SkeletonBlock className="h-2 w-full" />
              </SurfaceCard>
            ))}
          </div>
        ) : error ? (
          <SurfaceCard className="border border-red-500/30 bg-red-500/5 p-6 text-sm text-red-500">
            {error}
          </SurfaceCard>
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            {paths.map((path) => {
              const completedUnits = path.courses.reduce(
                (sum, course) =>
                  sum + countCompletedAcademyV2CourseUnits(state.completedLessons, course.id),
                0
              );
              const progressPercent =
                path.total_unit_count > 0
                  ? Math.round((completedUnits / path.total_unit_count) * 100)
                  : 0;

              return (
                <Link key={path.id} to={`/academy/path/${path.id}`}>
                  <SurfaceCard interactive className="h-full p-6 md:p-7">
                    <div className="flex items-start justify-between gap-4">
                      <StatusBadge tone="info">{path.tag || path.difficulty}</StatusBadge>
                      <p className="font-mono text-xs uppercase tracking-[0.18em] text-text-muted">
                        {progressPercent}% complete
                      </p>
                    </div>

                    <h3 className="mt-5 font-heading text-3xl font-semibold tracking-tight text-text-main">
                      {path.title}
                    </h3>
                    <p className="mt-3 text-sm leading-7 text-text-muted">{path.description}</p>

                    <div className="mt-6 h-2 overflow-hidden rounded-full bg-main-bg">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${progressPercent}%` }} />
                    </div>

                    <div className="mt-6 grid gap-3 sm:grid-cols-3">
                      <Metric label="Courses" value={String(path.course_count)} />
                      <Metric label="Units" value={String(path.total_unit_count)} />
                      <Metric label="Status" value={progressPercent > 0 ? 'In Progress' : 'Ready'} />
                    </div>

                    <div className="mt-6 flex items-center justify-between border-t border-border-main pt-5">
                      <div className="flex items-center gap-2 text-sm text-text-muted">
                        <Sparkles className="h-4 w-4 text-primary" aria-hidden="true" />
                        <span>Stepped roadmap</span>
                      </div>
                      <span className="inline-flex items-center gap-2 text-sm font-semibold text-primary">
                        Open Path
                        <ArrowRight className="h-4 w-4" aria-hidden="true" />
                      </span>
                    </div>
                  </SurfaceCard>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      <section className="space-y-6">
        <SectionHeader
          eyebrow="Secondary Lane"
          title="Community Tracks"
          subtitle="Lighter extensions, side quests, and supporting lessons that stay visually secondary to the main roadmap."
        />

        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <SurfaceCard key={index} className="space-y-4 p-5">
                <SkeletonBlock className="h-5 w-24" />
                <SkeletonBlock className="h-8 w-2/3" />
                <SkeletonBlock className="h-16 w-full" />
              </SurfaceCard>
            ))}
          </div>
        ) : communityTracks.length === 0 ? (
          <EmptyState
            title="No community tracks yet"
            message="The secondary library is empty right now. When community lessons are published, they will appear here without mixing into the primary roadmap."
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {communityTracks.map((track) => (
              <Link key={track.id} to={`/academy/community/${track.id}`}>
                <SurfaceCard interactive className="h-full p-5">
                  <div className="flex items-start justify-between gap-4">
                    <StatusBadge>Community</StatusBadge>
                    <Boxes className="h-4 w-4 text-text-muted" aria-hidden="true" />
                  </div>
                  <h3 className="mt-4 font-heading text-xl font-semibold tracking-tight text-text-main">
                    {track.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-text-muted">
                    {track.subtitle || track.description || 'Community contributed curriculum.'}
                  </p>
                  <div className="mt-5 flex items-center justify-between border-t border-border-main pt-4 text-xs uppercase tracking-[0.18em] text-text-muted">
                    <span>{track.lesson_count} lessons</span>
                    <span>~{Math.max(1, Math.round(track.total_minutes / 60))} hr</span>
                  </div>
                </SurfaceCard>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[20px] border border-border-main bg-main-bg p-4">
      <p className="text-[11px] uppercase tracking-[0.18em] text-text-muted">{label}</p>
      <p className="mt-2 text-lg font-semibold tracking-tight text-text-main">{value}</p>
    </div>
  );
}

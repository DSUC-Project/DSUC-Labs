import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  BookOpen,
  Boxes,
  ChevronRight,
  Flame,
  Layers3,
  Sparkles,
  Terminal,
  Trophy,
} from 'lucide-react';

import type { AcademyV2CommunityTrack, AcademyV2Path } from '@/types';
import { fetchAcademyV2Catalog } from '@/lib/academy/v2Api';
import { useAcademyProgressState } from '@/lib/academy/useAcademyProgress';
import { countCompletedAcademyV2CourseUnits } from '@/lib/academy/v2Progress';
import { useStore } from '@/store/useStore';

function pluralize(value: number, singular: string, plural: string) {
  return value === 1 ? singular : plural;
}

export function AcademyHome() {
  const navigate = useNavigate();
  const { currentUser, walletAddress, authToken } = useStore();
  const [paths, setPaths] = useState<AcademyV2Path[]>([]);
  const [communityTracks, setCommunityTracks] = useState<AcademyV2CommunityTrack[]>([]);
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

  const totalCuratedUnits = paths.reduce((sum, path) => sum + path.total_unit_count, 0);
  const totalCompletedUnits = paths.reduce(
    (sum, path) =>
      sum +
      path.courses.reduce(
        (courseSum, course) => courseSum + countCompletedAcademyV2CourseUnits(state.completedLessons, course.id),
        0
      ),
    0
  );

  return (
    <div className="space-y-14 pb-20">
      <section className="relative overflow-hidden rounded-[28px] border border-cyber-blue/20 bg-[radial-gradient(circle_at_top_left,rgba(41,121,255,0.22),transparent_34%),linear-gradient(180deg,rgba(5,10,20,0.95),rgba(5,10,20,0.72))] p-6 shadow-[0_0_60px_rgba(41,121,255,0.08)] sm:p-8 lg:p-12">
        <div className="pointer-events-none absolute inset-0 bg-grid-pattern bg-[size:34px_34px] opacity-[0.12]" />
        <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1.35fr)_360px] lg:items-end">
          <div className="space-y-6">
            <div className="inline-flex min-h-10 items-center gap-2 rounded-full border border-cyber-blue/30 bg-cyber-blue/10 px-4 text-[11px] font-mono font-bold uppercase tracking-[0.28em] text-cyber-blue">
              <Terminal size={14} aria-hidden="true" />
              Academy v2 Build
            </div>
            <div className="space-y-4">
              <h1 className="max-w-4xl font-display text-4xl font-black uppercase leading-[0.95] tracking-[0.08em] text-white sm:text-6xl lg:text-7xl">
                DSUC Academy
                <span className="mt-3 block bg-gradient-to-r from-cyber-yellow via-white to-cyber-blue bg-clip-text text-transparent">
                  Curated Paths + Community Labs
                </span>
              </h1>
              <p className="max-w-3xl text-base leading-8 text-white/72 sm:text-lg">
                Hệ học mới đang được dựng theo kiểu Superteam: đi theo learning path, vào từng
                course, chia rõ phần học và phần luyện tập. Custom track cũ của DSUC vẫn nằm cạnh
                các curated path để không mất workflow hiện tại.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <MetricCard
                icon={<Layers3 className="h-4 w-4" aria-hidden="true" />}
                label="Curated paths"
                value={String(paths.length)}
                detail="Seed từ bộ path Solana"
              />
              <MetricCard
                icon={<BookOpen className="h-4 w-4" aria-hidden="true" />}
                label="Units tracked"
                value={String(totalCuratedUnits)}
                detail="Learn + practice units"
              />
              <MetricCard
                icon={<Flame className="h-4 w-4" aria-hidden="true" />}
                label="Units done"
                value={String(totalCompletedUnits)}
                detail="Progress đọc từ local + DB"
              />
            </div>
          </div>

          <div className="relative overflow-hidden rounded-[24px] border border-cyber-yellow/20 bg-black/30 p-5 shadow-[0_0_24px_rgba(255,214,0,0.07)] backdrop-blur-sm">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyber-yellow/60 to-transparent" />
            <div className="space-y-5">
              <div>
                <div className="text-[10px] font-mono uppercase tracking-[0.32em] text-cyber-yellow/80">
                  Builder status
                </div>
                <h2 className="mt-2 font-display text-2xl font-bold uppercase tracking-[0.12em] text-white">
                  {currentUser?.name || 'Guest Builder'}
                </h2>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="text-[11px] font-mono uppercase tracking-[0.24em] text-white/42">
                      Learning streak
                    </div>
                    <div className="mt-2 font-display text-4xl font-black text-white">
                      {currentUser?.streak || 0}
                    </div>
                  </div>
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-cyber-yellow/35 bg-cyber-yellow/10 text-cyber-yellow">
                    <Trophy className="h-7 w-7" aria-hidden="true" />
                  </div>
                </div>
              </div>
              <div className="rounded-2xl border border-cyber-blue/20 bg-cyber-blue/8 p-4 text-sm leading-7 text-white/68">
                Vertical slice đầu tiên ưu tiên lại catalog, course detail và unit flow. Code lab
                runtime đầy đủ sẽ nối ở phase tiếp theo.
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-[0.3em] text-cyber-blue/75">
              Curated paths
            </div>
            <h2 className="mt-2 font-display text-3xl font-black uppercase tracking-[0.12em] text-white">
              7 learning directions
            </h2>
          </div>
          <div className="text-sm leading-7 text-white/58 sm:max-w-xl sm:text-right">
            Mỗi path gom các course theo đúng cấu trúc builder journey. Những path chưa có course sẽ
            hiện rõ là đang trống để dễ seed tiếp sau.
          </div>
        </div>

        {loading ? (
          <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="h-72 animate-pulse rounded-[24px] border border-white/8 bg-surface/50" />
            ))}
          </div>
        ) : error ? (
          <div className="rounded-[22px] border border-red-400/35 bg-red-500/10 p-6 text-sm leading-7 text-red-100">
            {error}
          </div>
        ) : (
          <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
            {paths.map((path) => {
              const completedUnits = path.courses.reduce(
                (sum, course) => sum + countCompletedAcademyV2CourseUnits(state.completedLessons, course.id),
                0
              );
              const progressPercent = path.total_unit_count > 0
                ? Math.round((completedUnits / path.total_unit_count) * 100)
                : 0;

              return (
                <button
                  key={path.id}
                  type="button"
                  onClick={() => navigate(`/academy/path/${path.id}`)}
                  className="group flex min-h-[300px] flex-col rounded-[26px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.01))] p-6 text-left transition-all duration-300 hover:-translate-y-1 hover:border-cyber-blue/45 hover:shadow-[0_18px_50px_rgba(41,121,255,0.12)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyber-yellow/80 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="inline-flex min-h-10 items-center rounded-full border border-cyber-blue/20 bg-cyber-blue/10 px-3 text-[10px] font-mono font-bold uppercase tracking-[0.28em] text-cyber-blue">
                        {path.tag || path.difficulty}
                      </div>
                      <h3 className="mt-4 font-display text-2xl font-black uppercase tracking-[0.12em] text-white transition-colors group-hover:text-cyber-yellow">
                        {path.title}
                      </h3>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-right">
                      <div className="text-[10px] font-mono uppercase tracking-[0.22em] text-white/42">
                        Progress
                      </div>
                      <div className="mt-1 font-display text-xl font-black text-white">{progressPercent}%</div>
                    </div>
                  </div>

                  <p className="mt-4 line-clamp-4 text-sm leading-7 text-white/66">{path.description}</p>

                  <div className="mt-6 overflow-hidden rounded-full border border-white/10 bg-black/25">
                    <div
                      className="h-2 rounded-full bg-gradient-to-r from-cyber-blue via-white to-cyber-yellow transition-all duration-500"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>

                  <div className="mt-6 grid grid-cols-2 gap-3 text-sm text-white/72">
                    <StatPill value={String(path.course_count)} label={pluralize(path.course_count, 'course', 'courses')} />
                    <StatPill value={String(path.practice_unit_count)} label={pluralize(path.practice_unit_count, 'lab', 'labs')} />
                    <StatPill value={String(path.learn_unit_count)} label="learn units" />
                    <StatPill value={String(completedUnits)} label="done" />
                  </div>

                  <div className="mt-auto flex items-center justify-between pt-8 text-sm font-semibold text-white/82">
                    <span className="inline-flex items-center gap-2 text-cyber-blue group-hover:text-cyber-yellow">
                      Open path
                      <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                    </span>
                    <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-white/40">
                      {path.difficulty}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </section>

      <section className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-[0.3em] text-cyber-yellow/70">
              Community tracks
            </div>
            <h2 className="mt-2 font-display text-3xl font-black uppercase tracking-[0.12em] text-white">
              Existing DSUC content
            </h2>
          </div>
          <div className="text-sm leading-7 text-white/58 sm:max-w-xl sm:text-right">
            Các track bạn tự add từ admin hiện vẫn nằm nguyên trong hệ cũ và được giữ song song với
            curated path mới.
          </div>
        </div>

        {communityTracks.length === 0 ? (
          <div className="rounded-[24px] border border-dashed border-cyber-blue/30 bg-surface/55 p-8 text-center text-sm leading-7 text-white/58">
            Chưa có custom track nào trong DSUC Academy.
          </div>
        ) : (
          <div className="grid gap-5 lg:grid-cols-2">
            {communityTracks.map((track) => (
              <button
                key={track.id}
                type="button"
                onClick={() => navigate(`/academy/community/${track.id}`)}
                className="group flex min-h-[190px] flex-col rounded-[24px] border border-white/10 bg-surface/65 p-6 text-left transition-all duration-300 hover:border-cyber-yellow/45 hover:bg-cyber-yellow/5 hover:shadow-[0_12px_36px_rgba(255,214,0,0.08)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyber-yellow/80 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="inline-flex min-h-10 items-center rounded-full border border-cyber-yellow/25 bg-cyber-yellow/10 px-3 text-[10px] font-mono font-bold uppercase tracking-[0.28em] text-cyber-yellow">
                      Community
                    </div>
                    <h3 className="mt-4 font-display text-2xl font-black uppercase tracking-[0.12em] text-white transition-colors group-hover:text-cyber-yellow">
                      {track.title}
                    </h3>
                  </div>
                  <Boxes className="h-6 w-6 text-white/30 transition-colors group-hover:text-cyber-yellow" aria-hidden="true" />
                </div>
                <p className="mt-4 line-clamp-3 text-sm leading-7 text-white/62">
                  {track.subtitle || track.description || 'Custom DSUC track managed from academy admin.'}
                </p>
                <div className="mt-auto flex flex-wrap items-center gap-3 pt-6 text-sm text-white/62">
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
                    {track.lesson_count} {pluralize(track.lesson_count, 'lesson', 'lessons')}
                  </span>
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
                    {Math.max(1, Math.round(track.total_minutes / 60))}h est.
                  </span>
                  <span className="inline-flex items-center gap-2 text-cyber-blue group-hover:text-cyber-yellow">
                    Continue track <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function MetricCard({
  icon,
  label,
  value,
  detail,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-[22px] border border-white/10 bg-black/20 p-4 backdrop-blur-sm">
      <div className="flex items-center gap-2 text-cyber-blue">{icon}</div>
      <div className="mt-3 font-display text-3xl font-black text-white">{value}</div>
      <div className="mt-1 text-[11px] font-mono uppercase tracking-[0.2em] text-white/38">{label}</div>
      <div className="mt-3 text-sm leading-6 text-white/58">{detail}</div>
    </div>
  );
}

function StatPill({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
      <div className="font-display text-2xl font-black text-white">{value}</div>
      <div className="mt-1 text-[10px] font-mono uppercase tracking-[0.2em] text-white/42">{label}</div>
    </div>
  );
}

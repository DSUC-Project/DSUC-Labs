import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, BookOpen, ChevronRight, Flame, Lock, Sparkles, Trophy } from 'lucide-react';

import type { AcademyV2Path } from '@/types';
import { fetchAcademyV2Catalog } from '@/lib/academy/v2Api';
import { useAcademyProgressState } from '@/lib/academy/useAcademyProgress';
import { countCompletedAcademyV2CourseUnits } from '@/lib/academy/v2Progress';
import { useStore } from '@/store/useStore';

function pluralize(value: number, singular: string, plural: string) {
  return value === 1 ? singular : plural;
}

function isCourseCompleted(pathState: ReturnType<typeof useAcademyProgressState>['state'], course: AcademyV2Path['courses'][number]) {
  const completed = countCompletedAcademyV2CourseUnits(pathState.completedLessons, course.id);

  return course.total_unit_count > 0 && completed >= course.total_unit_count;
}

export function AcademyPath() {
  const { pathId = '' } = useParams<{ pathId: string }>();
  const navigate = useNavigate();
  const { currentUser, walletAddress, authToken } = useStore();
  const [path, setPath] = useState<AcademyV2Path | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const identity = useMemo(
    () => ({
      userId: currentUser?.id ?? null,
      walletAddress: walletAddress ?? null,
    }),
    [currentUser?.id, walletAddress]
  );

  const progress = useAcademyProgressState({
    identity,
    currentUserId: currentUser?.id ?? null,
    authToken,
    walletAddress,
  });

  useEffect(() => {
    let cancelled = false;

    async function loadPath() {
      setLoading(true);
      setError('');
      try {
        const base = (import.meta as any).env.VITE_API_BASE_URL || '';
        const data = await fetchAcademyV2Catalog(
          base,
          authToken || localStorage.getItem('auth_token'),
          walletAddress
        );
        const found = (data.curated_paths || []).find((item) => item.id === pathId) || null;

        if (!cancelled) {
          if (!found) {
            setError('Learning path not found.');
            setPath(null);
          } else {
            setPath(found);
          }
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err.message || 'Failed to load learning path.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadPath();
    return () => {
      cancelled = true;
    };
  }, [authToken, pathId, walletAddress]);

  if (loading) {
    return (
      <div className="space-y-5">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="h-40 animate-pulse rounded-[24px] border border-white/10 bg-surface/55" />
        ))}
      </div>
    );
  }

  if (!path) {
    return (
      <div className="rounded-[24px] border border-red-400/35 bg-red-500/10 p-6 text-sm leading-7 text-red-100">
        {error || 'Path not found.'}
      </div>
    );
  }

  const completedCourses = path.courses.filter((course) => isCourseCompleted(progress.state, course)).length;

  return (
    <div className="space-y-10 pb-20">
      <section className="rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(41,121,255,0.14),rgba(5,10,20,0.92))] p-6 shadow-[0_18px_60px_rgba(41,121,255,0.08)] sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-5">
            <Link
              to="/academy"
              className="inline-flex min-h-10 items-center gap-2 rounded-full border border-white/10 bg-black/20 px-4 text-[11px] font-mono font-bold uppercase tracking-[0.24em] text-cyber-blue transition-colors hover:border-cyber-blue/45 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyber-yellow/80 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Back to Academy
            </Link>
            <div>
              <div className="inline-flex min-h-10 items-center rounded-full border border-cyber-yellow/25 bg-cyber-yellow/10 px-4 text-[10px] font-mono font-bold uppercase tracking-[0.28em] text-cyber-yellow">
                {path.tag || path.difficulty}
              </div>
              <h1 className="mt-4 font-display text-4xl font-black uppercase tracking-[0.12em] text-white sm:text-6xl">
                {path.title}
              </h1>
            </div>
            <p className="max-w-3xl text-base leading-8 text-white/68">{path.description}</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <PathMetric value={String(path.course_count)} label={pluralize(path.course_count, 'course', 'courses')} icon={<BookOpen className="h-4 w-4" aria-hidden="true" />} />
            <PathMetric value={String(path.practice_unit_count)} label={pluralize(path.practice_unit_count, 'lab', 'labs')} icon={<Sparkles className="h-4 w-4" aria-hidden="true" />} />
            <PathMetric value={String(completedCourses)} label="completed" icon={<Trophy className="h-4 w-4" aria-hidden="true" />} />
          </div>
        </div>
      </section>

      <section className="space-y-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-[0.3em] text-cyber-blue/75">
              Ordered journey
            </div>
            <h2 className="mt-2 font-display text-3xl font-black uppercase tracking-[0.12em] text-white">
              Courses in this path
            </h2>
          </div>
          <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-mono uppercase tracking-[0.2em] text-white/52">
            Sequential unlock
          </div>
        </div>

        {path.courses.length === 0 ? (
          <div className="rounded-[24px] border border-dashed border-white/15 bg-surface/55 p-8 text-sm leading-7 text-white/58">
            Path này đang được giữ chỗ nhưng chưa có course nào được seed vào catalog.
          </div>
        ) : (
          <div className="space-y-5">
            {path.courses.map((course, index) => {
              const completed = countCompletedAcademyV2CourseUnits(progress.state.completedLessons, course.id);
              const isCompleted = course.total_unit_count > 0 && completed >= course.total_unit_count;
              const previous = index > 0 ? path.courses[index - 1] : null;
              const previousDone = previous ? isCourseCompleted(progress.state, previous) : true;
              const locked = !previousDone;
              const completionPercent = course.total_unit_count > 0
                ? Math.round((completed / course.total_unit_count) * 100)
                : 0;

              return (
                <button
                  key={course.id}
                  type="button"
                  disabled={locked}
                  onClick={() => !locked && navigate(`/academy/course/${course.id}`)}
                  className={`group flex w-full flex-col gap-5 rounded-[26px] border p-6 text-left transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyber-yellow/80 focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                    locked
                      ? 'cursor-not-allowed border-white/10 bg-surface/45 opacity-60'
                      : 'border-white/10 bg-surface/70 hover:-translate-y-1 hover:border-cyber-blue/45 hover:shadow-[0_18px_50px_rgba(41,121,255,0.08)]'
                  }`}
                >
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-4">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="inline-flex min-h-10 items-center rounded-full border border-cyber-blue/20 bg-cyber-blue/10 px-3 text-[10px] font-mono font-bold uppercase tracking-[0.28em] text-cyber-blue">
                          Stage {String(index + 1).padStart(2, '0')}
                        </span>
                        <span className="inline-flex min-h-10 items-center rounded-full border border-white/10 bg-white/5 px-3 text-[10px] font-mono uppercase tracking-[0.24em] text-white/56">
                          {course.difficulty}
                        </span>
                        {locked ? (
                          <span className="inline-flex min-h-10 items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 text-[10px] font-mono uppercase tracking-[0.24em] text-white/56">
                            <Lock className="h-3.5 w-3.5" aria-hidden="true" />
                            Locked
                          </span>
                        ) : isCompleted ? (
                          <span className="inline-flex min-h-10 items-center gap-2 rounded-full border border-cyber-yellow/25 bg-cyber-yellow/10 px-3 text-[10px] font-mono uppercase tracking-[0.24em] text-cyber-yellow">
                            <Flame className="h-3.5 w-3.5" aria-hidden="true" />
                            Completed
                          </span>
                        ) : null}
                      </div>
                      <div>
                        <h3 className="font-display text-3xl font-black uppercase tracking-[0.12em] text-white transition-colors group-hover:text-cyber-yellow">
                          {course.title}
                        </h3>
                        <p className="mt-3 max-w-4xl text-sm leading-7 text-white/64">{course.description}</p>
                      </div>
                    </div>

                    <div className="grid shrink-0 grid-cols-2 gap-3 lg:w-[280px]">
                      <PathMetric value={String(course.module_count)} label="modules" icon={<BookOpen className="h-4 w-4" aria-hidden="true" />} />
                      <PathMetric value={String(course.practice_unit_count)} label="labs" icon={<Sparkles className="h-4 w-4" aria-hidden="true" />} />
                      <PathMetric value={`${completionPercent}%`} label="progress" icon={<Trophy className="h-4 w-4" aria-hidden="true" />} />
                      <PathMetric value={`${course.duration_hours}h`} label="effort" icon={<Flame className="h-4 w-4" aria-hidden="true" />} />
                    </div>
                  </div>

                  <div className="overflow-hidden rounded-full border border-white/10 bg-black/20">
                    <div
                      className="h-2 rounded-full bg-gradient-to-r from-cyber-blue via-white to-cyber-yellow transition-all duration-500"
                      style={{ width: `${completionPercent}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between gap-4 text-sm">
                    <div className="text-white/56">
                      {completed}/{course.total_unit_count} {pluralize(course.total_unit_count, 'unit', 'units')}
                    </div>
                    <span className="inline-flex items-center gap-2 font-semibold text-cyber-blue transition-colors group-hover:text-cyber-yellow">
                      {locked ? 'Finish previous course first' : 'Open course'}
                      <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

function PathMetric({
  value,
  label,
  icon,
}: {
  value: string;
  label: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-[20px] border border-white/10 bg-black/18 p-4">
      <div className="flex items-center gap-2 text-cyber-blue">{icon}</div>
      <div className="mt-3 font-display text-2xl font-black text-white">{value}</div>
      <div className="mt-1 text-[10px] font-mono uppercase tracking-[0.22em] text-white/40">{label}</div>
    </div>
  );
}

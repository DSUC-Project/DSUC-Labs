import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, BookOpen, CheckCircle2, Lock, Sparkles } from 'lucide-react';

import type { AcademyV2Path } from '@/types';
import { fetchAcademyV2Catalog } from '@/lib/academy/v2Api';
import { useAcademyProgressState } from '@/lib/academy/useAcademyProgress';
import { countCompletedAcademyV2CourseUnits } from '@/lib/academy/v2Progress';
import { useStore } from '@/store/useStore';
import {
  ActionButton,
  EmptyState,
  PageHeader,
  SectionHeader,
  SkeletonBlock,
  StatusBadge,
  SurfaceCard,
} from '@/components/ui/Primitives';

function pluralize(value: number, singular: string, plural: string) {
  return value === 1 ? singular : plural;
}

function isCourseCompleted(
  pathState: ReturnType<typeof useAcademyProgressState>['state'],
  course: AcademyV2Path['courses'][number]
) {
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
            setError('Path not found.');
            setPath(null);
          } else {
            setPath(found);
          }
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err.message || 'Unable to load this path.');
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
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <SkeletonBlock className="h-44 w-full" />
        {Array.from({ length: 3 }).map((_, index) => (
          <SkeletonBlock key={index} className="h-52 w-full" />
        ))}
      </div>
    );
  }

  if (!path) {
    return (
      <EmptyState
        title="Path unavailable"
        message={error || 'This academy path could not be opened right now.'}
        action={
          <Link to="/academy">
            <ActionButton variant="secondary">Back To Academy</ActionButton>
          </Link>
        }
      />
    );
  }

  const completedCourses = path.courses.filter((course) =>
    isCourseCompleted(progress.state, course)
  ).length;

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-10">
      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(280px,340px)]">
        <SurfaceCard className="p-7 md:p-8">
          <PageHeader
            eyebrow="Curated Path"
            title={path.title}
            subtitle={path.description}
            actions={
              <Link to="/academy">
                <ActionButton variant="secondary">
                  <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                  Back To Academy
                </ActionButton>
              </Link>
            }
          />
        </SurfaceCard>

        <SurfaceCard className="p-6">
          <StatusBadge tone="info">{path.tag || path.difficulty}</StatusBadge>
          <div className="mt-5 grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
            <Summary label="Courses" value={String(path.course_count)} />
            <Summary label="Practice units" value={String(path.practice_unit_count)} />
            <Summary label="Completed" value={`${completedCourses}/${path.course_count}`} />
          </div>
        </SurfaceCard>
      </section>

      <section className="space-y-6">
        <SectionHeader
          eyebrow="Roadmap"
          title="Follow the sequence"
          subtitle="Courses unlock in order. Each card explains whether it is ready, in progress, or still locked behind the previous stage."
        />

        {path.courses.length === 0 ? (
          <EmptyState
            title="This path has no courses yet"
            message="The roadmap is set up, but course content has not been attached to it yet."
          />
        ) : (
          <div className="relative space-y-6">
            <div className="absolute left-5 top-0 hidden h-full w-px bg-border-main lg:block" />
            {path.courses.map((course, index) => {
              const completed = countCompletedAcademyV2CourseUnits(
                progress.state.completedLessons,
                course.id
              );
              const isCompleted =
                course.total_unit_count > 0 && completed >= course.total_unit_count;
              const previous = index > 0 ? path.courses[index - 1] : null;
              const previousDone = previous ? isCourseCompleted(progress.state, previous) : true;
              const locked = !previousDone;
              const isCurrent = !locked && !isCompleted;
              const completionPercent =
                course.total_unit_count > 0
                  ? Math.round((completed / course.total_unit_count) * 100)
                  : 0;

              return (
                <div key={course.id} className="relative lg:pl-16">
                  <div className="absolute left-0 top-8 hidden lg:flex h-10 w-10 items-center justify-center rounded-full border border-border-main bg-main-bg text-sm font-semibold text-text-main">
                    {String(index + 1).padStart(2, '0')}
                  </div>
                  <button
                    type="button"
                    disabled={locked}
                    onClick={() => !locked && navigate(`/academy/course/${course.id}`)}
                    className={`w-full text-left ${
                      locked ? 'cursor-not-allowed opacity-80' : ''
                    }`}
                  >
                    <SurfaceCard interactive={!locked} className="p-6 md:p-7">
                      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                        <div className="space-y-4">
                          <div className="flex flex-wrap items-center gap-3">
                            <StatusBadge tone={isCompleted ? 'success' : isCurrent ? 'info' : 'warning'}>
                              {isCompleted ? 'Completed' : isCurrent ? 'Current' : 'Locked'}
                            </StatusBadge>
                            <span className="font-mono text-xs uppercase tracking-[0.18em] text-text-muted">
                              Step {String(index + 1).padStart(2, '0')}
                            </span>
                          </div>
                          <div>
                            <h3 className="font-heading text-3xl font-semibold tracking-tight text-text-main">
                              {course.title}
                            </h3>
                            <p className="mt-3 max-w-2xl text-sm leading-7 text-text-muted">
                              {course.description}
                            </p>
                          </div>

                          <div className="grid gap-3 sm:grid-cols-3">
                            <Metric label="Modules" value={String(course.module_count)} />
                            <Metric label="Units" value={String(course.total_unit_count)} />
                            <Metric label="Practice" value={String(course.practice_unit_count)} />
                          </div>
                        </div>

                        <div className="w-full max-w-sm space-y-4 lg:w-[320px]">
                          <div className="rounded-[24px] border border-border-main bg-main-bg p-4">
                            <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.18em] text-text-muted">
                              <span>Progress</span>
                              <span>{completionPercent}%</span>
                            </div>
                            <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/60 dark:bg-white/5">
                              <div
                                className="h-full rounded-full bg-primary"
                                style={{ width: `${completionPercent}%` }}
                              />
                            </div>
                            <p className="mt-3 text-sm text-text-muted">
                              {completed} / {course.total_unit_count}{' '}
                              {pluralize(course.total_unit_count, 'unit', 'units')} finished.
                            </p>
                          </div>

                          <div className="rounded-[24px] border border-border-main bg-main-bg p-4 text-sm leading-6 text-text-muted">
                            {locked ? (
                              <div className="flex items-start gap-3">
                                <Lock className="mt-0.5 h-4 w-4 text-text-muted" aria-hidden="true" />
                                <span>Finish the previous course to unlock this step.</span>
                              </div>
                            ) : isCompleted ? (
                              <div className="flex items-start gap-3">
                                <CheckCircle2 className="mt-0.5 h-4 w-4 text-success" aria-hidden="true" />
                                <span>This course is complete. You can revisit it anytime.</span>
                              </div>
                            ) : (
                              <div className="flex items-start gap-3">
                                <Sparkles className="mt-0.5 h-4 w-4 text-primary" aria-hidden="true" />
                                <span>This is the active course in your roadmap.</span>
                              </div>
                            )}
                          </div>

                          <div className="flex justify-end">
                            <span className="inline-flex items-center gap-2 text-sm font-semibold text-primary">
                              {locked ? 'Locked' : 'Open Course'}
                              {!locked ? <ArrowRight className="h-4 w-4" aria-hidden="true" /> : null}
                            </span>
                          </div>
                        </div>
                      </div>
                    </SurfaceCard>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[22px] border border-border-main bg-main-bg p-4">
      <p className="text-[11px] uppercase tracking-[0.18em] text-text-muted">{label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-text-main">{value}</p>
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

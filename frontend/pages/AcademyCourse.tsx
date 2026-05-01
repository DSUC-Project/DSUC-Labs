import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Code2,
  Layers3,
  Lock,
  Sparkles,
} from 'lucide-react';

import type { AcademyV2CourseDetail, AcademyV2Module, AcademyV2UnitSummary } from '@/types';
import { fetchAcademyV2Course } from '@/lib/academy/v2Api';
import { useAcademyProgressState } from '@/lib/academy/useAcademyProgress';
import {
  countCompletedAcademyV2CourseUnits,
  isAcademyV2UnitCompleted,
} from '@/lib/academy/v2Progress';
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

type FlatUnit = AcademyV2UnitSummary & {
  moduleId: string;
  moduleTitle: string;
};

function flattenCourseUnits(course: AcademyV2CourseDetail): FlatUnit[] {
  return course.modules.flatMap((module) =>
    [...module.learn_units, ...module.practice_units]
      .sort((left, right) => Number(left.order || 0) - Number(right.order || 0))
      .map((unit) => ({
        ...unit,
        moduleId: module.id,
        moduleTitle: module.title,
      }))
  );
}

function countCompletedModuleUnits(
  module: AcademyV2Module,
  completedLessons: Record<string, boolean>,
  courseId: string
) {
  return [...module.learn_units, ...module.practice_units].filter((unit) =>
    isAcademyV2UnitCompleted(completedLessons, courseId, unit.id)
  ).length;
}

function difficultyLabel(value: AcademyV2CourseDetail['difficulty']) {
  if (value === 'advanced') return 'Advanced';
  if (value === 'intermediate') return 'Intermediate';
  return 'Beginner';
}

function unitLabel(unit: AcademyV2UnitSummary) {
  if (unit.type === 'challenge') return 'Challenge';
  if (unit.type === 'quiz') return 'Quiz';
  return 'Content';
}

export function AcademyCourse() {
  const { courseId = '' } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { currentUser, walletAddress, authToken } = useStore();
  const [course, setCourse] = useState<AcademyV2CourseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadNonce, setReloadNonce] = useState(0);

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

    async function loadCourse() {
      setLoading(true);
      setError('');
      try {
        const base = (import.meta as any).env.VITE_API_BASE_URL || '';
        const result = await fetchAcademyV2Course(
          base,
          courseId,
          authToken || localStorage.getItem('auth_token'),
          walletAddress
        );

        if (!cancelled) {
          setCourse(result);
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err.message || 'Unable to load this course.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadCourse();
    return () => {
      cancelled = true;
    };
  }, [authToken, courseId, reloadNonce, walletAddress]);

  if (loading) {
    return (
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <SkeletonBlock className="h-48 w-full" />
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-5">
            {Array.from({ length: 3 }).map((_, index) => (
              <SkeletonBlock key={index} className="h-44 w-full" />
            ))}
          </div>
          <SkeletonBlock className="h-80 w-full" />
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <EmptyState
        title="Course unavailable"
        message={error || 'This course could not be opened right now.'}
        action={
          <div className="flex flex-wrap justify-center gap-3">
            <ActionButton variant="secondary" onClick={() => setReloadNonce((value) => value + 1)}>
              Retry
            </ActionButton>
            <Link to="/academy">
              <ActionButton>Back To Academy</ActionButton>
            </Link>
          </div>
        }
      />
    );
  }

  const flatUnits = flattenCourseUnits(course);
  const completedCount = countCompletedAcademyV2CourseUnits(progress.state.completedLessons, course.id);
  const progressPercent =
    course.total_unit_count > 0 ? Math.round((completedCount / course.total_unit_count) * 100) : 0;
  const firstIncomplete =
    flatUnits.find(
      (unit) => !isAcademyV2UnitCompleted(progress.state.completedLessons, course.id, unit.id)
    ) || null;
  const completedModules = course.modules.filter((module) => {
    const moduleUnitCount = module.learn_units.length + module.practice_units.length;
    if (moduleUnitCount === 0) {
      return false;
    }

    return countCompletedModuleUnits(module, progress.state.completedLessons, course.id) >= moduleUnitCount;
  }).length;

  return (
    <div className="mx-auto grid max-w-7xl gap-10 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-8">
        <SurfaceCard className="p-7 md:p-8">
          <PageHeader
            eyebrow="Course"
            title={course.title}
            subtitle={course.description}
            actions={
              <>
                <Link to={course.path_id ? `/academy/path/${course.path_id}` : '/academy'}>
                  <ActionButton variant="secondary">
                    <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                    Back
                  </ActionButton>
                </Link>
                {firstIncomplete ? (
                  <ActionButton onClick={() => navigate(`/academy/unit/${course.id}/${firstIncomplete.id}`)}>
                    Continue Next Unit
                  </ActionButton>
                ) : null}
              </>
            }
          />

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <Metric label="Difficulty" value={difficultyLabel(course.difficulty)} />
            <Metric label="Modules" value={String(course.module_count)} />
            <Metric label="Practice" value={String(course.practice_unit_count)} />
          </div>
        </SurfaceCard>

        <section className="space-y-6">
          <SectionHeader
            eyebrow="Curriculum"
            title="Course outline"
            subtitle="Units are grouped by module and presented as rows so scanning the sequence feels calm and predictable."
          />

          <div className="space-y-5">
            {course.modules.map((module, moduleIndex) => {
              const units = [...module.learn_units, ...module.practice_units].sort(
                (left, right) => Number(left.order || 0) - Number(right.order || 0)
              );
              const moduleCompleted = countCompletedModuleUnits(
                module,
                progress.state.completedLessons,
                course.id
              );
              const modulePercent =
                units.length > 0 ? Math.round((moduleCompleted / units.length) * 100) : 0;

              return (
                <SurfaceCard key={module.id} className="overflow-hidden p-0">
                  <div className="border-b border-border-main px-6 py-5">
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div className="space-y-2">
                        <StatusBadge tone="info">Module {String(moduleIndex + 1).padStart(2, '0')}</StatusBadge>
                        <h3 className="font-heading text-2xl font-semibold tracking-tight text-text-main">
                          {module.title}
                        </h3>
                        {module.description ? (
                          <p className="max-w-3xl text-sm leading-7 text-text-muted">
                            {module.description}
                          </p>
                        ) : null}
                      </div>
                      <div className="w-full max-w-xs rounded-[22px] border border-border-main bg-main-bg p-4">
                        <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.18em] text-text-muted">
                          <span>Progress</span>
                          <span>{modulePercent}%</span>
                        </div>
                        <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/60 dark:bg-white/5">
                          <div className="h-full rounded-full bg-primary" style={{ width: `${modulePercent}%` }} />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="divide-y divide-border-main">
                    {units.map((unit) => {
                      const unitIndex = flatUnits.findIndex((item) => item.id === unit.id);
                      const previous = unitIndex > 0 ? flatUnits[unitIndex - 1] : null;
                      const locked = previous
                        ? !isAcademyV2UnitCompleted(progress.state.completedLessons, course.id, previous.id)
                        : false;
                      const completed = isAcademyV2UnitCompleted(
                        progress.state.completedLessons,
                        course.id,
                        unit.id
                      );
                      const current = !locked && !completed;

                      return (
                        <div
                          key={unit.id}
                          className="flex flex-col gap-4 px-6 py-5 md:flex-row md:items-center md:justify-between"
                        >
                          <div className="flex min-w-0 items-start gap-4">
                            <div
                              className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border ${
                                completed
                                  ? 'border-success/30 bg-success/10 text-success'
                                  : current
                                    ? 'border-primary/30 bg-primary/10 text-primary'
                                    : 'border-border-main bg-main-bg text-text-muted'
                              }`}
                            >
                              {completed ? (
                                <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                              ) : locked ? (
                                <Lock className="h-4 w-4" aria-hidden="true" />
                              ) : unit.type === 'challenge' ? (
                                <Code2 className="h-4 w-4" aria-hidden="true" />
                              ) : unit.type === 'quiz' ? (
                                <Sparkles className="h-4 w-4" aria-hidden="true" />
                              ) : (
                                <BookOpen className="h-4 w-4" aria-hidden="true" />
                              )}
                            </div>
                            <div className="min-w-0 space-y-2">
                              <div className="flex flex-wrap items-center gap-2">
                                <h4 className="truncate text-lg font-semibold tracking-tight text-text-main">
                                  {unit.title}
                                </h4>
                                <StatusBadge>{unitLabel(unit)}</StatusBadge>
                                {locked ? <StatusBadge tone="warning">Locked</StatusBadge> : null}
                              </div>
                              <div className="flex flex-wrap items-center gap-3 text-sm text-text-muted">
                                <span>{unit.section === 'practice' ? 'Practice lane' : 'Learn lane'}</span>
                                <span>•</span>
                                <span>{unit.xp_reward} XP</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between gap-4 md:justify-end">
                            <p className="text-sm text-text-muted">
                              {locked
                                ? 'Complete the previous unit first.'
                                : completed
                                  ? 'Completed'
                                  : 'Ready to continue'}
                            </p>
                            <ActionButton
                              variant={locked ? 'ghost' : 'secondary'}
                              disabled={locked}
                              onClick={() => navigate(`/academy/unit/${course.id}/${unit.id}`)}
                            >
                              {locked ? 'Locked' : completed ? 'Review' : 'Open'}
                              {!locked ? <ArrowRight className="h-4 w-4" aria-hidden="true" /> : null}
                            </ActionButton>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </SurfaceCard>
              );
            })}
          </div>
        </section>
      </div>

      <div className="space-y-5 xl:sticky xl:top-28 xl:self-start">
        <SurfaceCard className="p-6">
          <p className="section-eyebrow">Progress</p>
          <div className="mt-5 h-2 overflow-hidden rounded-full bg-main-bg">
            <div className="h-full rounded-full bg-primary" style={{ width: `${progressPercent}%` }} />
          </div>
          <p className="mt-4 text-sm text-text-muted">
            {completedCount} / {course.total_unit_count} units complete
          </p>
          <div className="mt-5 grid gap-3">
            <Metric label="Completed" value={`${completedModules}/${course.module_count}`} compact />
            <Metric label="Next action" value={firstIncomplete ? firstIncomplete.title : 'Course complete'} compact />
          </div>
        </SurfaceCard>

        <SurfaceCard className="p-6">
          <p className="section-eyebrow">Course map</p>
          <div className="mt-4 space-y-3">
            {course.modules.map((module) => (
              <div key={module.id} className="rounded-[20px] border border-border-main bg-main-bg p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full border border-border-main bg-surface-elevated">
                    <Layers3 className="h-4 w-4 text-text-muted" aria-hidden="true" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-medium text-text-main">{module.title}</p>
                    <p className="text-xs uppercase tracking-[0.18em] text-text-muted">
                      {module.learn_units.length + module.practice_units.length} units
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </SurfaceCard>
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  compact = false,
}: {
  label: string;
  value: string;
  compact?: boolean;
}) {
  return (
    <div className={`rounded-[20px] border border-border-main bg-main-bg ${compact ? 'p-4' : 'p-5'}`}>
      <p className="text-[11px] uppercase tracking-[0.18em] text-text-muted">{label}</p>
      <p className="mt-2 text-lg font-semibold tracking-tight text-text-main">{value}</p>
    </div>
  );
}

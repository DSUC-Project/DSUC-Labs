import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Code2,
  Flame,
  Layers3,
  Lock,
  Sparkles,
  Trophy,
  User,
} from 'lucide-react';

import type { AcademyV2CourseDetail, AcademyV2Module, AcademyV2UnitSummary } from '@/types';
import { fetchAcademyV2Course } from '@/lib/academy/v2Api';
import { useAcademyProgressState } from '@/lib/academy/useAcademyProgress';
import {
  countCompletedAcademyV2CourseUnits,
  isAcademyV2UnitCompleted,
} from '@/lib/academy/v2Progress';
import { useStore } from '@/store/useStore';

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

function unitStateText(unit: AcademyV2UnitSummary) {
  return unit.section === 'practice'
    ? 'Hands-on lab, challenge checks, and reinforcement.'
    : 'Concept lesson and guided explanation for this module.';
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
  if (value === 'advanced') {
    return 'Advanced';
  }

  if (value === 'intermediate') {
    return 'Intermediate';
  }

  return 'Beginner';
}

function moduleAnchor(moduleId: string) {
  return `module-${moduleId}`;
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
          setError(err.message || 'Failed to load academy course.');
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
      <div className="space-y-6 pb-20">
        <div className="h-72 animate-pulse rounded-[30px] border border-white/10 bg-surface/55" />
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-5">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="h-64 animate-pulse rounded-[28px] border border-white/10 bg-surface/55"
              />
            ))}
          </div>
          <div className="h-80 animate-pulse rounded-[28px] border border-white/10 bg-surface/55" />
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="rounded-[26px] border border-red-400/35 bg-red-500/10 p-6 text-red-100">
        <div className="text-[10px] font-mono uppercase tracking-[0.28em] text-red-200/80">
          Course unavailable
        </div>
        <h1 className="mt-3 font-display text-2xl font-black uppercase tracking-[0.1em] text-white">
          Could not open this course
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-red-100/85">
          {error || 'The course could not be loaded from the Academy catalog right now.'}
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setReloadNonce((value) => value + 1)}
            className="inline-flex min-h-11 items-center gap-2 rounded-full bg-cyber-yellow px-5 text-sm font-display font-bold uppercase tracking-[0.16em] text-black transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyber-yellow/80 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            Retry load
          </button>
          <Link
            to="/academy"
            className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/12 bg-white/5 px-5 text-sm font-display font-bold uppercase tracking-[0.16em] text-white transition-colors hover:border-cyber-blue/40 hover:text-cyber-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyber-yellow/80 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            Back to Academy
          </Link>
        </div>
      </div>
    );
  }

  const flatUnits = flattenCourseUnits(course);
  const completedCount = countCompletedAcademyV2CourseUnits(
    progress.state.completedLessons,
    course.id
  );
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
    <div className="space-y-8 pb-20">
      <section className="relative overflow-hidden rounded-[32px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(255,214,0,0.18),transparent_26%),radial-gradient(circle_at_bottom_right,rgba(41,121,255,0.18),transparent_28%),linear-gradient(180deg,rgba(6,10,18,0.95),rgba(8,12,20,0.78))] p-6 shadow-[0_24px_70px_rgba(0,0,0,0.22)] sm:p-8 lg:p-10">
        <div className="absolute inset-0 bg-grid-pattern bg-[size:32px_32px] opacity-[0.08]" />
        <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1.3fr)_360px] lg:items-end">
          <div className="space-y-6">
            <Link
              to={course.path_id ? `/academy/path/${course.path_id}` : '/academy'}
              className="inline-flex min-h-10 items-center gap-2 rounded-full border border-white/10 bg-black/25 px-4 text-[11px] font-mono font-bold uppercase tracking-[0.24em] text-cyber-blue transition-colors hover:border-cyber-blue/45 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyber-yellow/80 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Back to {course.path_title || 'Academy'}
            </Link>

            <div className="flex flex-wrap gap-2">
              <span className="inline-flex min-h-10 items-center rounded-full border border-cyber-blue/20 bg-cyber-blue/10 px-4 text-[10px] font-mono font-bold uppercase tracking-[0.28em] text-cyber-blue">
                {course.path_title || 'Curated course'}
              </span>
              <span className="inline-flex min-h-10 items-center rounded-full border border-white/10 bg-white/5 px-4 text-[10px] font-mono uppercase tracking-[0.24em] text-white/58">
                {difficultyLabel(course.difficulty)}
              </span>
              <span className="inline-flex min-h-10 items-center rounded-full border border-cyber-yellow/20 bg-cyber-yellow/10 px-4 text-[10px] font-mono uppercase tracking-[0.24em] text-cyber-yellow">
                Stage {String(Math.max(1, course.track_level || 1)).padStart(2, '0')}
              </span>
            </div>

            <div className="space-y-4">
              <h1 className="max-w-5xl font-display text-4xl font-black uppercase leading-[0.94] tracking-[0.12em] text-white sm:text-6xl">
                {course.title}
              </h1>
              <p className="max-w-4xl text-base leading-8 text-white/72">{course.description}</p>
            </div>

            <div className="flex flex-wrap gap-2">
              {course.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex min-h-10 items-center rounded-full border border-white/10 bg-white/5 px-3 text-[10px] font-mono uppercase tracking-[0.22em] text-white/60"
                >
                  {tag}
                </span>
              ))}
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <CourseMetric
                icon={<Flame className="h-4 w-4" aria-hidden="true" />}
                label="Effort"
                value={`${course.duration_hours}h`}
              />
              <CourseMetric
                icon={<Layers3 className="h-4 w-4" aria-hidden="true" />}
                label="Modules"
                value={String(course.module_count)}
              />
              <CourseMetric
                icon={<Sparkles className="h-4 w-4" aria-hidden="true" />}
                label="Practice"
                value={String(course.practice_unit_count)}
              />
              <CourseMetric
                icon={<Trophy className="h-4 w-4" aria-hidden="true" />}
                label="Progress"
                value={`${progressPercent}%`}
              />
            </div>
          </div>

          <div className="rounded-[28px] border border-cyber-yellow/20 bg-black/24 p-5 shadow-[0_0_24px_rgba(255,214,0,0.07)] backdrop-blur-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-[10px] font-mono uppercase tracking-[0.28em] text-cyber-yellow/78">
                  Mission control
                </div>
                <h2 className="mt-3 font-display text-2xl font-black uppercase tracking-[0.1em] text-white">
                  {firstIncomplete ? firstIncomplete.title : 'Course complete'}
                </h2>
                <p className="mt-3 text-sm leading-7 text-white/66">
                  {firstIncomplete
                    ? `Next up in ${firstIncomplete.moduleTitle}: keep the route moving by finishing the next unlocked unit.`
                    : 'Every learn and practice unit in this course is marked complete.'}
                </p>
              </div>
              <div className="rounded-2xl border border-cyber-blue/20 bg-cyber-blue/10 px-3 py-2 text-right">
                <div className="text-[10px] font-mono uppercase tracking-[0.22em] text-white/46">
                  Completed
                </div>
                <div className="mt-1 font-display text-2xl font-black text-white">
                  {completedCount}/{course.total_unit_count}
                </div>
              </div>
            </div>

            <div className="mt-5 overflow-hidden rounded-full border border-white/10 bg-black/30">
              <div
                className="h-3 rounded-full bg-gradient-to-r from-cyber-blue via-white to-cyber-yellow transition-[width] duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-[20px] border border-white/10 bg-white/5 px-4 py-3">
                <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/42">
                  Modules cleared
                </div>
                <div className="mt-2 font-display text-xl font-black text-white">
                  {completedModules}/{course.module_count}
                </div>
              </div>
              <div className="rounded-[20px] border border-white/10 bg-white/5 px-4 py-3">
                <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/42">
                  Challenge labs
                </div>
                <div className="mt-2 font-display text-xl font-black text-white">
                  {course.practice_unit_count}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                firstIncomplete
                  ? navigate(`/academy/unit/${course.id}/${firstIncomplete.id}`)
                  : navigate(course.path_id ? `/academy/path/${course.path_id}` : '/academy')
              }
              className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-cyber-yellow px-5 text-sm font-display font-bold uppercase tracking-[0.16em] text-black transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyber-yellow/80 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              {firstIncomplete ? 'Resume route' : 'Back to path'}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <section className="space-y-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="text-[10px] font-mono uppercase tracking-[0.3em] text-cyber-blue/75">
                Course route
              </div>
              <h2 className="mt-2 font-display text-3xl font-black uppercase tracking-[0.12em] text-white">
                Learn, then practice
              </h2>
            </div>
            <div className="max-w-xl text-sm leading-7 text-white/58 sm:text-right">
              Each module keeps the learn lane and the practice lane separate so the course feels
              like a guided path instead of a flat lesson list.
            </div>
          </div>

          {course.modules.map((module, index) => {
            const moduleCompleted = countCompletedModuleUnits(
              module,
              progress.state.completedLessons,
              course.id
            );
            const moduleTotal = module.learn_units.length + module.practice_units.length;
            const modulePercent = moduleTotal > 0 ? Math.round((moduleCompleted / moduleTotal) * 100) : 0;

            return (
              <section
                key={module.id}
                id={moduleAnchor(module.id)}
                className="relative overflow-hidden rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] p-6 shadow-[0_18px_50px_rgba(0,0,0,0.18)]"
              >
                <div className="absolute right-[-72px] top-[-72px] h-40 w-40 rounded-full bg-cyber-blue/8 blur-3xl" />
                <div className="relative flex flex-col gap-6 border-b border-white/8 pb-6 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="inline-flex min-h-10 items-center rounded-full border border-cyber-blue/20 bg-cyber-blue/10 px-3 text-[10px] font-mono font-bold uppercase tracking-[0.28em] text-cyber-blue">
                        Module {String(index + 1).padStart(2, '0')}
                      </span>
                      <span className="inline-flex min-h-10 items-center rounded-full border border-white/10 bg-white/5 px-3 text-[10px] font-mono uppercase tracking-[0.22em] text-white/58">
                        {moduleCompleted}/{moduleTotal} units complete
                      </span>
                    </div>
                    <div>
                      <h3 className="font-display text-2xl font-black uppercase tracking-[0.1em] text-white sm:text-3xl">
                        {module.title}
                      </h3>
                      <p className="mt-3 max-w-4xl text-sm leading-7 text-white/64">
                        {module.description || 'This module is part of the curated route and keeps concept work separate from practice work.'}
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3 lg:w-[320px]">
                    <CompactMetric label="Learn" value={String(module.learn_units.length)} />
                    <CompactMetric label="Practice" value={String(module.practice_units.length)} />
                    <CompactMetric label="Progress" value={`${modulePercent}%`} />
                  </div>
                </div>

                <div className="mt-5 overflow-hidden rounded-full border border-white/10 bg-black/22">
                  <div
                    className="h-2 rounded-full bg-gradient-to-r from-cyber-blue via-white to-cyber-yellow transition-[width] duration-500"
                    style={{ width: `${modulePercent}%` }}
                  />
                </div>

                <div className="mt-6 grid gap-6 xl:grid-cols-2">
                  <UnitLane
                    title="Learn"
                    subtitle="Read, watch, and anchor the core concepts."
                    units={module.learn_units}
                    courseId={course.id}
                    flatUnits={flatUnits}
                    completedLessons={progress.state.completedLessons}
                  />
                  <UnitLane
                    title="Practice"
                    subtitle="Apply the lesson with challenge-style reinforcement."
                    units={module.practice_units}
                    courseId={course.id}
                    flatUnits={flatUnits}
                    completedLessons={progress.state.completedLessons}
                  />
                </div>
              </section>
            );
          })}
        </section>

        <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
          <div className="rounded-[26px] border border-cyber-blue/20 bg-surface/72 p-5 shadow-[0_12px_32px_rgba(41,121,255,0.08)] backdrop-blur-sm">
            <div className="text-[10px] font-mono uppercase tracking-[0.28em] text-cyber-blue/75">
              Route status
            </div>
            <div className="mt-3 font-display text-2xl font-black uppercase tracking-[0.1em] text-white">
              {progressPercent}% complete
            </div>
            <p className="mt-3 text-sm leading-7 text-white/62">
              Progress in curated paths is stored separately from community tracks, so this route can
              evolve without colliding with DSUC custom content.
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              <SidebarStat
                icon={<BookOpen className="h-4 w-4" aria-hidden="true" />}
                label="Units done"
                value={`${completedCount}/${course.total_unit_count}`}
              />
              <SidebarStat
                icon={<Sparkles className="h-4 w-4" aria-hidden="true" />}
                label="Practice units"
                value={String(course.practice_unit_count)}
              />
            </div>
          </div>

          {course.instructor && (
            <div className="rounded-[26px] border border-white/10 bg-surface/72 p-5 shadow-[0_12px_32px_rgba(0,0,0,0.16)]">
              <div className="text-[10px] font-mono uppercase tracking-[0.28em] text-cyber-yellow/72">
                Instructor
              </div>
              <div className="mt-4 flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-cyber-yellow/20 bg-cyber-yellow/10 text-cyber-yellow">
                  <User className="h-5 w-5" aria-hidden="true" />
                </div>
                <div>
                  <div className="font-display text-xl font-black uppercase tracking-[0.08em] text-white">
                    {course.instructor.name}
                  </div>
                  <p className="mt-3 text-sm leading-7 text-white/62">{course.instructor.bio}</p>
                </div>
              </div>
            </div>
          )}

          <div className="rounded-[26px] border border-white/10 bg-surface/72 p-5 shadow-[0_12px_32px_rgba(0,0,0,0.16)]">
            <div className="text-[10px] font-mono uppercase tracking-[0.28em] text-cyber-blue/75">
              Jump to module
            </div>
            <div className="mt-4 space-y-3">
              {course.modules.map((module, index) => {
                const completed = countCompletedModuleUnits(
                  module,
                  progress.state.completedLessons,
                  course.id
                );
                const total = module.learn_units.length + module.practice_units.length;
                const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

                return (
                  <a
                    key={module.id}
                    href={`#${moduleAnchor(module.id)}`}
                    className="group block rounded-[20px] border border-white/10 bg-white/4 p-4 transition-colors hover:border-cyber-blue/38 hover:bg-cyber-blue/8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyber-yellow/80 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-[10px] font-mono uppercase tracking-[0.22em] text-white/38">
                          Module {String(index + 1).padStart(2, '0')}
                        </div>
                        <div className="mt-2 font-display text-lg font-black uppercase tracking-[0.08em] text-white transition-colors group-hover:text-cyber-yellow">
                          {module.title}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-cyber-blue">
                          {percent}%
                        </div>
                        <div className="mt-1 text-xs text-white/46">
                          {completed}/{total}
                        </div>
                      </div>
                    </div>
                  </a>
                );
              })}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function UnitLane({
  title,
  subtitle,
  units,
  courseId,
  flatUnits,
  completedLessons,
}: {
  title: string;
  subtitle: string;
  units: AcademyV2UnitSummary[];
  courseId: string;
  flatUnits: FlatUnit[];
  completedLessons: Record<string, boolean>;
}) {
  const navigate = useNavigate();

  if (units.length === 0) {
    return (
      <div className="rounded-[24px] border border-dashed border-white/12 bg-black/18 p-5">
        <div className="text-[10px] font-mono uppercase tracking-[0.28em] text-cyber-yellow/75">
          {title}
        </div>
        <h4 className="mt-2 font-display text-xl font-black uppercase tracking-[0.1em] text-white">
          {subtitle}
        </h4>
        <p className="mt-4 text-sm leading-7 text-white/50">No units are attached to this lane yet.</p>
      </div>
    );
  }

  return (
    <div className="rounded-[24px] border border-white/10 bg-black/18 p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-[10px] font-mono uppercase tracking-[0.28em] text-cyber-yellow/75">
            {title}
          </div>
          <h4 className="mt-2 font-display text-xl font-black uppercase tracking-[0.1em] text-white">
            {subtitle}
          </h4>
        </div>
        <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] font-mono uppercase tracking-[0.22em] text-white/52">
          {units.length} units
        </div>
      </div>

      <div className="relative mt-5 space-y-3 pl-7">
        <div className="absolute bottom-3 left-2 top-3 w-px bg-gradient-to-b from-cyber-blue/45 via-white/10 to-cyber-yellow/35" />
        {units.map((unit) => {
          const flatIndex = flatUnits.findIndex((item) => item.id === unit.id);
          const previous = flatIndex > 0 ? flatUnits[flatIndex - 1] : null;
          const locked =
            previous && !isAcademyV2UnitCompleted(completedLessons, courseId, previous.id);
          const done = isAcademyV2UnitCompleted(completedLessons, courseId, unit.id);

          return (
            <div key={unit.id} className="relative">
              <div
                className={`absolute -left-[1.625rem] top-6 h-3 w-3 rounded-full border ${
                  done
                    ? 'border-cyber-yellow bg-cyber-yellow shadow-[0_0_10px_rgba(255,214,0,0.45)]'
                    : locked
                      ? 'border-white/20 bg-background'
                      : unit.section === 'practice'
                        ? 'border-cyber-blue bg-cyber-blue/90 shadow-[0_0_10px_rgba(41,121,255,0.45)]'
                        : 'border-white/20 bg-white/30'
                }`}
              />
              <button
                type="button"
                disabled={locked}
                onClick={() => !locked && navigate(`/academy/unit/${courseId}/${unit.id}`)}
                className={`group w-full rounded-[20px] border px-4 py-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyber-yellow/80 focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                  locked
                    ? 'cursor-not-allowed border-white/10 bg-white/4 opacity-55'
                    : done
                      ? 'border-cyber-yellow/25 bg-cyber-yellow/10 transition-colors hover:bg-cyber-yellow/14'
                      : 'border-white/10 bg-white/4 transition-colors transition-transform hover:-translate-y-0.5 hover:border-cyber-blue/38 hover:bg-cyber-blue/8'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono uppercase tracking-[0.22em] text-white/42">
                      <span>{unit.type}</span>
                      <span className="text-white/24">/</span>
                      <span>{unit.section}</span>
                      <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-white/58">
                        {unit.xp_reward} XP
                      </span>
                      {unit.language && (
                        <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-white/58">
                          {unit.language}
                        </span>
                      )}
                    </div>
                    <div className="mt-3 font-display text-lg font-black uppercase tracking-[0.08em] text-white transition-colors group-hover:text-cyber-yellow">
                      {unit.title}
                    </div>
                    <p className="mt-2 text-sm leading-7 text-white/58">
                      {locked
                        ? 'Finish the previous route step first to unlock this unit.'
                        : done
                          ? 'This unit is already marked complete in your course progress.'
                          : unitStateText(unit)}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    {locked ? (
                      <Lock className="h-4 w-4 text-white/35" aria-hidden="true" />
                    ) : done ? (
                      <CheckCircle2 className="h-5 w-5 text-cyber-yellow" aria-hidden="true" />
                    ) : unit.section === 'practice' ? (
                      <Code2 className="h-5 w-5 text-cyber-blue" aria-hidden="true" />
                    ) : (
                      <BookOpen className="h-5 w-5 text-white/46" aria-hidden="true" />
                    )}
                    {!locked && (
                      <ChevronRight
                        className="h-4 w-4 text-cyber-blue transition-transform group-hover:translate-x-1 group-hover:text-cyber-yellow"
                        aria-hidden="true"
                      />
                    )}
                  </div>
                </div>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CourseMetric({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[20px] border border-white/10 bg-black/20 p-4">
      <div className="flex items-center gap-2 text-cyber-blue">{icon}</div>
      <div className="mt-3 font-display text-2xl font-black text-white">{value}</div>
      <div className="mt-1 text-[10px] font-mono uppercase tracking-[0.22em] text-white/42">
        {label}
      </div>
    </div>
  );
}

function CompactMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[18px] border border-white/10 bg-black/18 px-4 py-3">
      <div className="text-[10px] font-mono uppercase tracking-[0.22em] text-white/40">{label}</div>
      <div className="mt-2 font-display text-xl font-black text-white">{value}</div>
    </div>
  );
}

function SidebarStat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[20px] border border-white/10 bg-black/18 px-4 py-3">
      <div className="flex items-center gap-2 text-cyber-blue">{icon}</div>
      <div className="mt-2 text-[10px] font-mono uppercase tracking-[0.22em] text-white/40">
        {label}
      </div>
      <div className="mt-2 font-display text-xl font-black text-white">{value}</div>
    </div>
  );
}

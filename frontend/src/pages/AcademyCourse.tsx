import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
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
  User,
  Trophy,
} from "lucide-react";

import type {
  AcademyV2CourseDetail,
  AcademyV2Module,
  AcademyV2UnitSummary,
} from "@/types";
import { fetchAcademyV2Course } from "@/lib/academy/v2Api";
import { useAcademyProgressState } from "@/lib/academy/useAcademyProgress";
import {
  countCompletedAcademyV2CourseUnits,
  isAcademyV2UnitCompleted,
} from "@/lib/academy/v2Progress";
import { useStore } from "@/store/useStore";
import {
  ActionButton,
  SoftBrutalCard,
  StatusBadge,
  SectionHeader,
} from "@/components/ui/Primitives";

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
      })),
  );
}

function countCompletedModuleUnits(
  module: AcademyV2Module,
  completedLessons: Record<string, boolean>,
  courseId: string,
) {
  return [...module.learn_units, ...module.practice_units].filter((unit) =>
    isAcademyV2UnitCompleted(completedLessons, courseId, unit.id),
  ).length;
}

function difficultyLabel(value: AcademyV2CourseDetail["difficulty"]) {
  if (value === "advanced") return "Advanced";
  if (value === "intermediate") return "Intermediate";
  return "Beginner";
}

function moduleAnchor(moduleId: string) {
  return `module-${moduleId}`;
}

export function AcademyCourse() {
  const { courseId = "" } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { currentUser, walletAddress, authToken } = useStore();
  const [course, setCourse] = useState<AcademyV2CourseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadNonce, setReloadNonce] = useState(0);

  const identity = useMemo(
    () => ({
      userId: currentUser?.id ?? null,
      walletAddress: walletAddress ?? null,
    }),
    [currentUser?.id, walletAddress],
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
      setError("");
      try {
        const base = (import.meta as any).env.VITE_API_BASE_URL || "";
        const result = await fetchAcademyV2Course(
          base,
          courseId,
          authToken || localStorage.getItem("auth_token"),
          walletAddress,
        );

        if (!cancelled) {
          setCourse(result);
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err.message || "Could not load course.");
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
      <div className="container mx-auto px-4 py-12 md:py-24 space-y-16">
        <div className="h-64 animate-pulse bg-surface" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="container mx-auto px-4 py-24 text-center">
        <div className="mb-4 inline-flex h-14 w-14 items-center justify-center bg-surface border border-border-main text-text-muted">
          <Code2 className="w-6 h-6" />
        </div>
        <h1 className="font-heading text-2xl font-bold uppercase tracking-tight">
          Could not load course
        </h1>
        <p className="mx-auto mt-4 max-w-xl p-4 text-sm text-text-muted bg-surface border border-border-main font-mono">
          {error || "Course data is unavailable. Please try again later."}
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <ActionButton onClick={() => setReloadNonce((value) => value + 1)}>
            Reload
          </ActionButton>
          <Link to="/academy">
            <ActionButton variant="secondary">Academy Home</ActionButton>
          </Link>
        </div>
      </div>
    );
  }

  const flatUnits = flattenCourseUnits(course);
  const completedCount = countCompletedAcademyV2CourseUnits(
    progress.state.completedLessons,
    course.id,
  );
  const progressPercent =
    course.total_unit_count > 0
      ? Math.round((completedCount / course.total_unit_count) * 100)
      : 0;
  const firstIncomplete =
    flatUnits.find(
      (unit) =>
        !isAcademyV2UnitCompleted(
          progress.state.completedLessons,
          course.id,
          unit.id,
        ),
    ) || null;
  const completedModules = course.modules.filter((module) => {
    const moduleUnitCount =
      module.learn_units.length + module.practice_units.length;
    if (moduleUnitCount === 0) {
      return false;
    }
    return (
      countCompletedModuleUnits(
        module,
        progress.state.completedLessons,
        course.id,
      ) >= moduleUnitCount
    );
  }).length;

  return (
    <div className="container mx-auto px-4 py-12 md:py-24 space-y-24">
      {/* Hero */}
      <section className="relative">
        <Link
          to={course.path_id ? `/academy/path/${course.path_id}` : "/academy"}
          className="inline-flex items-center gap-2 mb-8 border-2 border-text-main bg-surface px-4 py-2 text-xs font-bold uppercase tracking-widest font-mono shadow-[2px_2px_0_0_#000] hover:-translate-y-0.5 hover:shadow-[4px_4px_0_0_#000] transition-all text-text-main"
        >
          <ArrowLeft className="w-4 h-4" strokeWidth={2} />
          BACK TO {course.path_title ? "PATH" : "ACADEMY"}
        </Link>

        <div className="flex flex-col lg:flex-row gap-12 lg:items-start justify-between">
          <div className="flex flex-col gap-6 max-w-3xl flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <StatusBadge
                status={course.path_title || "Course"}
                className="inline-flex"
              />
              <span className="font-mono text-[10px] uppercase text-text-muted px-2 ">
                {difficultyLabel(course.difficulty)}
              </span>
              <span className="font-mono text-[10px] uppercase text-text-muted px-2 ">
                Stage{" "}
                {String(Math.max(1, course.track_level || 1)).padStart(2, "0")}
              </span>
            </div>

            <div>
              <h1 className="font-heading font-bold text-5xl md:text-7xl uppercase tracking-tighter leading-none mb-6">
                {course.title}
              </h1>
              <p className="text-lg text-text-muted max-w-2xl leading-relaxed">
                {course.description}
              </p>
            </div>

            {course.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {course.tags.map((tag) => (
                  <span
                    key={tag}
                    className="font-mono text-[10px] uppercase bg-surface border border-border-main px-2 py-1 text-text-muted"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            <div className="grid grid-cols-3 gap-3 w-full lg:w-auto mt-6">
              <div className="p-4 bg-surface text-center flex flex-col items-center justify-center min-w-[100px]">
                <p className="font-heading text-3xl font-bold">
                  {course.duration_hours}
                  <span className="text-sm font-sans font-normal text-text-muted">
                    h
                  </span>
                </p>
                <p className="font-mono text-[10px] uppercase text-text-muted mt-1">
                  Duration
                </p>
              </div>
              <div className="p-4 bg-surface text-center flex flex-col items-center justify-center min-w-[100px]">
                <p className="font-heading text-3xl font-bold">
                  {course.module_count}
                </p>
                <p className="font-mono text-[10px] uppercase text-text-muted mt-1">
                  Modules
                </p>
              </div>
              <div className="p-4 bg-surface text-center flex flex-col items-center justify-center min-w-[100px]">
                <p className="font-heading text-3xl font-bold text-emerald-500">
                  {course.practice_unit_count}
                </p>
                <p className="font-mono text-[10px] uppercase text-text-muted mt-1">
                  Exercises
                </p>
              </div>
            </div>
          </div>

          <div className="relative w-full lg:w-[380px] shrink-0 pointer-events-auto">
            <SoftBrutalCard className="p-8">
              <div className="text-[10px] font-mono uppercase tracking-widest text-text-muted mb-6">
                Your Progress
              </div>
              <h2 className="font-heading font-bold text-2xl uppercase tracking-tight line-clamp-2 mb-6 text-text-main group-hover:text-primary transition-colors">
                {firstIncomplete ? firstIncomplete.title : "Course Completed!"}
              </h2>

              <div className="space-y-6">
                {firstIncomplete ? (
                  <p className="text-sm font-mono text-text-muted p-3 bg-main-bg border border-border-main ">
                    {firstIncomplete.moduleTitle}
                  </p>
                ) : (
                  <p className="text-sm font-mono text-emerald-500 p-3 bg-emerald-500/10 border border-emerald-500/20">
                    Great job, you have completed all units!
                  </p>
                )}

                <div>
                  <div className="flex justify-between items-center text-[10px] font-mono text-text-muted uppercase mb-2">
                    <span>Completion</span>
                    <span className="text-primary">
                      {Math.round(progressPercent)}%
                    </span>
                  </div>
                  <div className="h-1 w-full bg-main-bg relative">
                    <div
                      className="absolute top-0 left-0 h-full bg-primary transition-all duration-1000 ease-out"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    firstIncomplete
                      ? navigate(
                          `/academy/unit/${course.id}/${firstIncomplete.id}`,
                        )
                      : navigate(
                          course.path_id
                            ? `/academy/path/${course.path_id}`
                            : "/academy",
                        )
                  }
                  className="w-full flex items-center justify-center gap-2 bg-primary text-main-bg hover:bg-accent font-bold uppercase tracking-widest text-xs py-4 px-6 transition-colors"
                >
                  {firstIncomplete ? "Continue Learning" : "Return to Path"}
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </SoftBrutalCard>
          </div>
        </div>
      </section>

      <div className="grid gap-16 lg:grid-cols-[minmax(0,1fr)_380px]">
        {/* Modules List */}
        <section className="space-y-16">
          <SectionHeader title="Syllabus" subtitle="Theory and practice." />

          <div className="space-y-8">
            {course.modules.map((module, index) => {
              const moduleCompleted = countCompletedModuleUnits(
                module,
                progress.state.completedLessons,
                course.id,
              );
              const moduleTotal =
                module.learn_units.length + module.practice_units.length;
              const modulePercent =
                moduleTotal > 0
                  ? Math.round((moduleCompleted / moduleTotal) * 100)
                  : 0;

              return (
                <section
                  key={module.id}
                  id={moduleAnchor(module.id)}
                  className="bg-surface relative overflow-hidden"
                >
                  <div className="absolute top-0 left-0 w-full h-1 bg-main-bg">
                    <div
                      className="h-full bg-emerald-500 transition-all ease-out duration-1000"
                      style={{ width: `${modulePercent}%` }}
                    />
                  </div>

                  <div className="p-6 md:p-8 flex flex-col md:flex-row md:items-start justify-between gap-6">
                    <div className="flex-1 space-y-4">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="font-mono text-[10px] uppercase tracking-widest text-text-muted">
                          Module {String(index + 1).padStart(2, "0")}
                        </span>
                        <span className="text-[10px] font-mono text-text-muted px-2 ">
                          {moduleCompleted}/{moduleTotal} done
                        </span>
                      </div>

                      <h3 className="font-heading font-bold text-2xl uppercase tracking-tight w-full break-words">
                        {module.title}
                      </h3>
                      {module.description && (
                        <p className="text-sm font-mono text-text-muted max-w-2xl leading-relaxed">
                          {module.description}
                        </p>
                      )}
                    </div>

                    <div className="flex gap-4 md:flex-col md:text-right shrink-0">
                      <div>
                        <div className="font-heading font-bold text-xl">
                          {module.learn_units.length}
                        </div>
                        <div className="font-mono text-[10px] uppercase text-text-muted">
                          Theory
                        </div>
                      </div>
                      <div>
                        <div className="font-heading font-bold text-xl">
                          {module.practice_units.length}
                        </div>
                        <div className="font-mono text-[10px] uppercase text-text-muted">
                          Practice
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 bg-main-bg/50">
                    <div className="grid gap-6 md:grid-cols-2">
                      <UnitLane
                        title="Theory"
                        units={module.learn_units}
                        courseId={course.id}
                        flatUnits={flatUnits}
                        completedLessons={progress.state.completedLessons}
                      />
                      <UnitLane
                        title="Practice"
                        units={module.practice_units}
                        courseId={course.id}
                        flatUnits={flatUnits}
                        completedLessons={progress.state.completedLessons}
                      />
                    </div>
                  </div>
                </section>
              );
            })}
          </div>
        </section>

        {/* Sidebar */}
        <aside className="space-y-8 lg:sticky lg:top-24 lg:self-start">
          {course.instructor && (
            <SoftBrutalCard className="p-6">
              <div className="text-[10px] font-mono uppercase tracking-widest text-text-muted mb-6 px-2 py-1 bg-main-bg inline-block">
                Instructor
              </div>
              <div className="flex flex-col gap-4">
                <div className="flex h-16 w-16 items-center justify-center bg-surface border border-border-main">
                  <User
                    className="h-6 w-6 text-text-muted"
                    aria-hidden="true"
                  />
                </div>
                <div>
                  <div className="font-heading text-lg font-bold uppercase mb-2">
                    {course.instructor.name}
                  </div>
                  <p className="text-xs font-mono text-text-muted leading-relaxed">
                    {course.instructor.bio}
                  </p>
                </div>
              </div>
            </SoftBrutalCard>
          )}

          <div className="bg-surface p-6 lg:max-h-[calc(100vh-200px)] overflow-y-auto">
            <div className="text-[10px] font-mono uppercase tracking-widest text-text-muted mb-6 pb-2">
              Table of Contents
            </div>
            <div className="space-y-4">
              {course.modules.map((module, index) => {
                const completed = countCompletedModuleUnits(
                  module,
                  progress.state.completedLessons,
                  course.id,
                );
                const total =
                  module.learn_units.length + module.practice_units.length;
                const percent =
                  total > 0 ? Math.round((completed / total) * 100) : 0;

                return (
                  <a
                    key={module.id}
                    href={`#${moduleAnchor(module.id)}`}
                    className="group block transition-all"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="text-[10px] font-mono uppercase text-text-muted mb-1">
                          Ch. {String(index + 1).padStart(2, "0")}
                        </div>
                        <div className="font-heading text-xs font-bold group-hover:text-primary transition-colors line-clamp-2 uppercase">
                          {module.title}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div
                          className={`text-[10px] font-mono ${percent === 100 ? "text-emerald-500" : "text-text-muted"} mt-1`}
                        >
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
  units,
  courseId,
  flatUnits,
  completedLessons,
}: {
  title: string;
  units: AcademyV2UnitSummary[];
  courseId: string;
  flatUnits: FlatUnit[];
  completedLessons: Record<string, boolean>;
}) {
  const navigate = useNavigate();

  if (units.length === 0) {
    return (
      <div className="border border-dashed border-border-main p-6 flex flex-col items-center justify-center text-center bg-surface">
        <div className="text-[10px] font-mono uppercase bg-main-bg text-text-muted px-2 py-1 mb-3">
          {title}
        </div>
        <p className="text-xs text-text-muted/60 font-mono">
          No units added yet.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-surface border border-border-main">
      <div className="flex items-center justify-between gap-4 p-4 bg-main-bg/50">
        <div className="text-[10px] font-mono uppercase tracking-widest text-text-muted">
          {title}
        </div>
        <div className="font-mono text-[10px] text-text-muted">
          {units.length} Unit(s)
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        {units.map((unit) => {
          const flatIndex = flatUnits.findIndex((item) => item.id === unit.id);
          const previous = flatIndex > 0 ? flatUnits[flatIndex - 1] : null;
          const locked =
            previous &&
            !isAcademyV2UnitCompleted(completedLessons, courseId, previous.id);
          const done = isAcademyV2UnitCompleted(
            completedLessons,
            courseId,
            unit.id,
          );

          return (
            <button
              key={unit.id}
              type="button"
              disabled={locked}
              onClick={() =>
                !locked && navigate(`/academy/unit/${courseId}/${unit.id}`)
              }
              className={`group w-full p-4 text-left transition-all relative flex items-start justify-between gap-4 border-b border-border-main last:border-b-0 ${
                locked
                  ? "cursor-not-allowed opacity-40 grayscale bg-main-bg"
                  : "hover:bg-main-bg focus-visible:outline-none focus:bg-main-bg"
              }`}
            >
              <div className="flex-1 min-w-0 pr-2">
                <div className="flex flex-wrap items-center gap-2 mb-2 text-[10px] font-mono uppercase text-text-muted">
                  <span>{unit.type}</span>

                  {unit.xp_reward && (
                    <span className="px-1 ">{unit.xp_reward} XP</span>
                  )}

                  {unit.language && (
                    <span className="px-1 ">{unit.language}</span>
                  )}
                </div>

                <div
                  className={`font-heading text-sm font-bold uppercase leading-tight ${locked ? "text-text-muted" : done ? "text-primary" : "text-text-main group-hover:text-primary transition-colors"}`}
                >
                  {unit.title}
                </div>
              </div>

              <div className="shrink-0 mt-1">
                {locked ? (
                  <Lock
                    className="h-3 w-3 text-text-muted"
                    aria-hidden="true"
                  />
                ) : done ? (
                  <Trophy
                    className="h-4 w-4 text-emerald-500"
                    aria-hidden="true"
                  />
                ) : unit.section === "practice" ? (
                  <Code2
                    className="h-4 w-4 text-text-muted group-hover:text-primary transition-colors"
                    aria-hidden="true"
                  />
                ) : (
                  <BookOpen
                    className="h-4 w-4 text-text-muted group-hover:text-primary transition-colors"
                    aria-hidden="true"
                  />
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

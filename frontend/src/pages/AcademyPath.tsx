import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  ChevronRight,
  Lock,
  Trophy,
} from "lucide-react";

import type { AcademyV2Path } from "@/types";
import { fetchAcademyV2Catalog } from "@/lib/academy/v2Api";
import { useAcademyProgressState } from "@/lib/academy/useAcademyProgress";
import { countCompletedAcademyV2CourseUnits } from "@/lib/academy/v2Progress";
import { useStore } from "@/store/useStore";
import {
  ActionButton,
  SoftBrutalCard,
  StatusBadge,
  SectionHeader,
} from "@/components/ui/Primitives";

function isCourseCompleted(
  pathState: ReturnType<typeof useAcademyProgressState>["state"],
  course: AcademyV2Path["courses"][number],
) {
  const completed = countCompletedAcademyV2CourseUnits(
    pathState.completedLessons,
    course.id,
  );
  return course.total_unit_count > 0 && completed >= course.total_unit_count;
}

export function AcademyPath() {
  const { pathId = "" } = useParams<{ pathId: string }>();
  const navigate = useNavigate();
  const { currentUser, walletAddress, authToken } = useStore();
  const [path, setPath] = useState<AcademyV2Path | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

    async function loadPath() {
      setLoading(true);
      setError("");
      try {
        const base = (import.meta as any).env.VITE_API_BASE_URL || "";
        const data = await fetchAcademyV2Catalog(
          base,
          authToken || localStorage.getItem("auth_token"),
          walletAddress,
        );
        const found =
          (data.curated_paths || []).find((item) => item.id === pathId) || null;

        if (!cancelled) {
          if (!found) {
            setError("Path not found.");
            setPath(null);
          } else {
            setPath(found);
          }
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err.message || "Could not load path.");
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
      <div className="container mx-auto px-4 py-12 md:py-24 space-y-32">
        <div className="h-64 animate-pulse bg-surface" />
      </div>
    );
  }

  if (!path) {
    return (
      <div className="container mx-auto px-4 py-24 text-center">
        <div className="p-8 border border-border-main bg-surface text-text-muted font-mono text-sm max-w-md mx-auto">
          {error || "Path not found."}
        </div>
        <div className="mt-8">
          <Link to="/academy">
            <ActionButton variant="primary">Return to Academy</ActionButton>
          </Link>
        </div>
      </div>
    );
  }

  const completedCourses = path.courses.filter((course) =>
    isCourseCompleted(progress.state, course),
  ).length;

  return (
    <div className="container mx-auto px-4 py-12 md:py-24 space-y-24">
      {/* Hero Section */}
      <section className="relative">
        <Link
          to="/academy"
          className="inline-flex items-center gap-2 mb-8 border-2 border-text-main bg-surface px-4 py-2 text-xs font-bold uppercase tracking-widest font-mono shadow-[2px_2px_0_0_#000] hover:-translate-y-0.5 hover:shadow-[4px_4px_0_0_#000] transition-all text-text-main"
        >
          <ArrowLeft className="w-4 h-4" strokeWidth={2} />
          BACK TO ACADEMY
        </Link>

        <div className="flex flex-col lg:flex-row gap-12 lg:items-end justify-between">
          <div className="flex flex-col gap-6 max-w-3xl">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <StatusBadge
                  status={path.tag || path.difficulty}
                  className="inline-flex border-2 border-text-main bg-blue-600 text-white"
                />
                {completedCourses === path.courses.length && path.courses.length > 0 && (
                  <StatusBadge
                    status="Path Completed"
                    className="inline-flex border-2 border-emerald-500 text-emerald-500 bg-emerald-500/10"
                  />
                )}
              </div>
              <h1 className="font-heading font-bold text-5xl md:text-7xl uppercase tracking-tighter leading-none mb-6">
                {path.title}
              </h1>
              <p className="text-lg text-text-muted max-w-2xl leading-relaxed">
                Complete this learning path progressively. Each course unlocks
                the next stage of your journey.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 w-full lg:w-auto shrink-0 mt-8 lg:mt-0">
            <div className="p-4 bg-surface text-center flex flex-col items-center justify-center min-w-[100px]">
              <p className="font-heading text-3xl font-bold">
                {path.course_count}
              </p>
              <p className="font-mono text-[10px] uppercase text-text-muted mt-1">
                Courses
              </p>
            </div>
            <div className="p-4 bg-surface text-center flex flex-col items-center justify-center min-w-[100px]">
              <p className="font-heading text-3xl font-bold">
                {path.practice_unit_count}
              </p>
              <p className="font-mono text-[10px] uppercase text-text-muted mt-1">
                Practice
              </p>
            </div>
            <div className="p-4 bg-surface text-center flex flex-col items-center justify-center min-w-[100px]">
              <p className="font-heading text-3xl font-bold text-emerald-500">
                {completedCourses}
              </p>
              <p className="font-mono text-[10px] uppercase text-text-muted mt-1">
                Done
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Courses Section */}
      <section>
        <SectionHeader
          title="Curriculum"
          subtitle="Courses included in this path."
        />

        {path.courses.length === 0 ? (
          <div className="p-12 text-center bg-surface border border-border-main font-mono text-sm text-text-muted mt-8">
            This path is currently under construction.
          </div>
        ) : (
          <div className="space-y-4">
            {path.courses.map((course, index) => {
              const completed = countCompletedAcademyV2CourseUnits(
                progress.state.completedLessons,
                course.id,
              );
              const isCompleted =
                course.total_unit_count > 0 &&
                completed >= course.total_unit_count;
              const previous = index > 0 ? path.courses[index - 1] : null;
              const previousDone = previous
                ? isCourseCompleted(progress.state, previous)
                : true;
              const locked = !previousDone;
              const completionPercent =
                course.total_unit_count > 0
                  ? Math.round((completed / course.total_unit_count) * 100)
                  : 0;

              return (
                <button
                  key={course.id}
                  type="button"
                  disabled={locked}
                  onClick={() =>
                    !locked && navigate(`/academy/course/${course.id}`)
                  }
                  className={`group w-full flex flex-col md:flex-row p-6 md:p-8 text-left transition-all relative overflow-hidden bg-surface border-2 border-text-main shadow-[4px_4px_0_0_#000] mb-4 ${
                    locked
                      ? "cursor-not-allowed opacity-60 grayscale"
                      : "hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[8px_8px_0_0_#000]"
                  }`}
                >
                  <div className="absolute top-0 left-0 w-full h-1.5 bg-main-bg border-b-2 border-text-main">
                    <div
                      className={`h-full transition-all duration-1000 ease-out ${isCompleted ? "bg-emerald-500" : "bg-primary"}`}
                      style={{ width: `${completionPercent}%` }}
                    />
                  </div>

                  <div className="flex-1 min-w-0 pr-8">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="inline-block px-3 py-1 font-mono text-[10px] uppercase tracking-widest font-bold border-2 border-text-main bg-blue-600 text-white shadow-[2px_2px_0_0_#000]">
                        Stage {String(index + 1).padStart(2, "0")}
                      </span>
                      {locked ? (
                        <span className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-widest text-text-muted">
                          <Lock className="w-3 h-3" /> Locked
                        </span>
                      ) : isCompleted ? (
                        <span className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-widest text-emerald-500">
                          <Trophy className="w-3 h-3" /> Completed
                        </span>
                      ) : null}
                    </div>

                    <h3
                      className={`font-heading font-bold text-2xl md:text-3xl uppercase tracking-tight mb-3 truncate w-full ${locked ? "text-text-muted" : "text-text-main group-hover:text-primary transition-colors"}`}
                    >
                      {course.title}
                    </h3>
                    <p
                      className={`text-sm leading-relaxed max-w-3xl line-clamp-2 ${locked ? "text-text-muted/60" : "text-text-muted"}`}
                    >
                      {course.description}
                    </p>
                  </div>

                  <div className="mt-8 md:mt-0 flex flex-row md:flex-col items-center md:items-end justify-between shrink-0 pl-0 md:pl-8">
                    <div className="flex gap-4 md:flex-col md:gap-2 text-left md:text-right">
                      <div>
                        <div className="font-heading font-bold text-xl">
                          {completed}
                          <span className="text-sm font-sans font-normal text-text-muted">
                            /{course.total_unit_count}
                          </span>
                        </div>
                        <div className="text-[10px] font-mono text-text-muted uppercase">
                          Units
                        </div>
                      </div>
                      <div>
                        <div className="font-heading font-bold text-xl">
                          {course.duration_hours}
                          <span className="text-sm font-sans font-normal text-text-muted">
                            h
                          </span>
                        </div>
                        <div className="text-[10px] font-mono text-text-muted uppercase">
                          Duration
                        </div>
                      </div>
                    </div>

                    <div className="mt-auto hidden md:block">
                      <span
                        className={`inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest transition-all ${locked ? "text-transparent" : "text-primary group-hover:gap-3"}`}
                      >
                        {isCompleted ? "Review" : "Open Course"}
                        <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
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

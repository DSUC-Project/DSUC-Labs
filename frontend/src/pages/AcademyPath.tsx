import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowRight,
  Lock,
  Trophy,
  Layers3,
} from "lucide-react";

import type { AcademyV2Path } from "@/types";
import { fetchAcademyV2Catalog } from "@/lib/academy/v2Api";
import { useAcademyProgressState } from "@/lib/academy/useAcademyProgress";
import { countCompletedAcademyV2CourseUnits } from "@/lib/academy/v2Progress";
import { useStore } from "@/store/useStore";
import { ActionButton } from "@/components/ui/Primitives";
import {
  AcademyBackLink,
  AcademyBadge,
  AcademyEmptyState,
  AcademyPage,
  AcademyPanel,
  AcademyCompactStat,
  AcademyProgressBar,
  AcademySectionTitle,
  AcademyStat,
} from "@/components/academy/AcademyPrimitives";

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
      <AcademyPage>
        <AcademyPanel className="h-72 animate-pulse" padding="p-0" />
      </AcademyPage>
    );
  }

  if (!path) {
    return (
      <AcademyPage>
        <AcademyEmptyState
          title="Path not found"
          description={error || "This learning path is not available right now."}
          action={
            <Link to="/academy">
              <ActionButton variant="primary">Return to Academy</ActionButton>
            </Link>
          }
        />
      </AcademyPage>
    );
  }

  const completedCourses = path.courses.filter((course) =>
    isCourseCompleted(progress.state, course),
  ).length;
  const completedUnits = path.courses.reduce(
    (sum, course) =>
      sum +
      countCompletedAcademyV2CourseUnits(progress.state.completedLessons, course.id),
    0,
  );
  const overallPercent =
    path.total_unit_count > 0
      ? Math.round((completedUnits / path.total_unit_count) * 100)
      : 0;

  return (
    <AcademyPage>
      <section className="space-y-6">
        <AcademyBackLink to="/academy" label="Back to Academy" />

        <AcademyPanel tone="primary" padding="p-5 sm:p-6">
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-3">
              <AcademyBadge tone="primary">
                {path.tag || path.difficulty}
              </AcademyBadge>
              {completedCourses === path.courses.length &&
              path.courses.length > 0 ? (
                <AcademyBadge tone="success">Path completed</AcademyBadge>
              ) : null}
            </div>
            <div className="space-y-3">
              <h1 className="font-display text-4xl font-black uppercase tracking-tighter text-text-main sm:text-5xl lg:text-6xl">
                {path.title}
              </h1>
              <p className="max-w-3xl font-mono text-sm leading-relaxed text-text-muted">
                Complete this path progressively. Each course unlocks the next
                stage so the sequence stays legible and the challenge density grows
                in the right order.
              </p>
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <AcademyCompactStat
                label="Courses"
                value={path.course_count}
                meta={`${completedCourses} completed`}
              />
              <AcademyCompactStat
                label="Practice"
                value={path.practice_unit_count}
                meta="Hands-on units"
              />
              <AcademyCompactStat
                label="Units"
                value={path.total_unit_count}
                meta={`${completedUnits} finished`}
              />
              <AcademyCompactStat
                label="Progress"
                value={`${overallPercent}%`}
                meta="Whole path completion"
                valueClassName="text-primary"
              />
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-text-muted">
                <span>Path completion</span>
                <span>{overallPercent}%</span>
              </div>
              <AcademyProgressBar value={overallPercent} className="h-2.5" />
            </div>
          </div>
        </AcademyPanel>
      </section>

      <section className="space-y-6">
        <AcademySectionTitle
          eyebrow="Path Curriculum"
          title="Courses"
          description="Each course keeps theory and practice together, with unlocking based on the previous course completion."
        />

        {path.courses.length === 0 ? (
          <AcademyEmptyState
            title="Curriculum in progress"
            description="This path is being assembled. Check back later for the full sequence."
          />
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
                  className="block w-full text-left disabled:cursor-not-allowed"
                >
                  <AcademyPanel
                    interactive={!locked}
                    tone={isCompleted ? "success" : locked ? "muted" : "primary"}
                    className={locked ? "opacity-65 grayscale" : "group"}
                  >
                    <div className="space-y-5">
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="space-y-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <AcademyBadge tone={locked ? "muted" : "default"}>
                              Stage {String(index + 1).padStart(2, "0")}
                            </AcademyBadge>
                            {locked ? (
                              <AcademyBadge tone="muted">
                                <Lock className="h-3 w-3" />
                                Locked
                              </AcademyBadge>
                            ) : isCompleted ? (
                              <AcademyBadge tone="success">
                                <Trophy className="h-3 w-3" />
                                Completed
                              </AcademyBadge>
                            ) : (
                              <AcademyBadge tone="primary">
                                <Layers3 className="h-3 w-3" />
                                In progress
                              </AcademyBadge>
                            )}
                          </div>

                          <div>
                            <h3
                              className={`font-display text-3xl font-black uppercase tracking-tight ${
                                locked
                                  ? "text-text-muted"
                                  : "text-text-main transition-colors group-hover:text-primary"
                              }`}
                            >
                              {course.title}
                            </h3>
                            <p
                              className={`mt-3 max-w-3xl font-mono text-sm leading-relaxed ${
                                locked ? "text-text-muted/70" : "text-text-muted"
                              }`}
                            >
                              {course.description}
                            </p>
                          </div>
                        </div>

                        <div className="grid min-w-[200px] gap-3 sm:grid-cols-2">
                          <AcademyStat
                            label="Units"
                            value={
                              <>
                                {completed}
                                <span className="ml-1 text-base text-text-muted">
                                  / {course.total_unit_count}
                                </span>
                              </>
                            }
                            meta="Completed / total"
                            className="px-4 py-3"
                            valueClassName="text-2xl"
                          />
                          <AcademyStat
                            label="Duration"
                            value={`${course.duration_hours}h`}
                            meta="Estimated"
                            className="px-4 py-3"
                            valueClassName="text-2xl"
                          />
                        </div>
                      </div>

                      <AcademyProgressBar
                        value={completionPercent}
                        fillClassName={isCompleted ? "bg-emerald-500" : undefined}
                      />

                      <div className="flex items-center justify-between border-t border-border-main pt-4">
                        <span className="font-mono text-[10px] font-bold uppercase tracking-[0.24em] text-text-muted">
                          {locked
                            ? "Complete the previous course to unlock"
                            : isCompleted
                              ? "Review this course anytime"
                              : "Continue from the next unfinished unit"}
                        </span>
                        <span
                          className={`inline-flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.24em] ${
                            locked ? "text-text-muted" : "text-primary"
                          }`}
                        >
                          {isCompleted ? "Review course" : "Open course"}
                          <ArrowRight className="h-3.5 w-3.5" />
                        </span>
                      </div>
                    </div>
                  </AcademyPanel>
                </button>
              );
            })}
          </div>
        )}
      </section>
    </AcademyPage>
  );
}

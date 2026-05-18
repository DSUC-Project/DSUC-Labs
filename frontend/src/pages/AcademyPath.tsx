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
import { useLocale } from "@/lib/locale";
import { localizeAcademyPath } from "@/lib/academy/academyLocale";
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
  const { text, isVIE } = useLocale();
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
            setError(text("Path not found.", "Không tìm thấy path."));
            setPath(null);
          } else {
            setPath(found);
          }
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err.message || text("Could not load path.", "Không thể tải path."));
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
          title={text("Path not found", "Không tìm thấy path")}
          description={
            error ||
            text(
              "This learning path is not available right now.",
              "Path học này hiện không khả dụng.",
            )
          }
          action={
            <Link to="/academy">
              <ActionButton variant="primary">
                {text("Return to Academy", "Quay lại Academy")}
              </ActionButton>
            </Link>
          }
        />
      </AcademyPage>
    );
  }

  const localizedPath = localizeAcademyPath(path, isVIE);

  const completedCourses = localizedPath.courses.filter((course) =>
    isCourseCompleted(progress.state, course),
  ).length;
  const completedUnits = localizedPath.courses.reduce(
    (sum, course) =>
      sum +
      countCompletedAcademyV2CourseUnits(progress.state.completedLessons, course.id),
    0,
  );
  const overallPercent =
    localizedPath.total_unit_count > 0
      ? Math.round((completedUnits / localizedPath.total_unit_count) * 100)
      : 0;

  return (
    <AcademyPage>
      <section className="space-y-6">
        <AcademyBackLink
          to="/academy"
          label={text("Back to Academy", "Quay lại Academy")}
        />

        <AcademyPanel tone="primary" padding="p-5 sm:p-6">
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-3">
              <AcademyBadge tone="primary">
                {localizedPath.tag || localizedPath.difficulty}
              </AcademyBadge>
              {completedCourses === localizedPath.courses.length &&
              localizedPath.courses.length > 0 ? (
                <AcademyBadge tone="success">
                  {text("Path completed", "Hoàn thành path")}
                </AcademyBadge>
              ) : null}
            </div>
            <div className="space-y-3">
              <h1 className="font-display text-4xl font-black uppercase tracking-tighter text-text-main sm:text-5xl lg:text-6xl">
                {localizedPath.title}
              </h1>
              <p className="max-w-3xl font-mono text-sm leading-relaxed text-text-muted">
                {localizedPath.description ||
                  text(
                    "Complete this path progressively. Each course unlocks the next stage so the sequence stays legible and the challenge density grows in the right order.",
                    "Hoàn thành path này theo từng bước. Mỗi course sẽ mở khóa stage tiếp theo để lộ trình rõ ràng hơn và độ khó tăng đúng nhịp.",
                  )}
              </p>
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <AcademyCompactStat
                label={text("Courses", "Course")}
                value={localizedPath.course_count}
                meta={text(
                  `${completedCourses} completed`,
                  `Hoàn thành ${completedCourses}`,
                )}
              />
              <AcademyCompactStat
                label={text("Practice", "Thực hành")}
                value={localizedPath.practice_unit_count}
                meta={text("Hands-on units", "Các unit thực hành")}
              />
              <AcademyCompactStat
                label={text("Units", "Unit")}
                value={localizedPath.total_unit_count}
                meta={text(
                  `${completedUnits} finished`,
                  `Hoàn thành ${completedUnits}`,
                )}
              />
              <AcademyCompactStat
                label={text("Progress", "Tiến độ")}
                value={`${overallPercent}%`}
                meta={text("Whole path completion", "Tiến độ toàn path")}
                valueClassName="text-primary"
              />
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-text-muted">
                <span>{text("Path completion", "Mức hoàn thành path")}</span>
                <span>{overallPercent}%</span>
              </div>
              <AcademyProgressBar value={overallPercent} className="h-2.5" />
            </div>
          </div>
        </AcademyPanel>
      </section>

      <section className="space-y-6">
        <AcademySectionTitle
          eyebrow={text("Path Curriculum", "Nội dung path")}
          title={text("Courses", "Course")}
          description={text(
            "Each course keeps theory and practice together, with unlocking based on the previous course completion.",
            "Mỗi course giữ phần lý thuyết và thực hành đi cùng nhau, và được mở khóa dựa trên mức hoàn thành của course trước đó.",
          )}
        />

        {localizedPath.courses.length === 0 ? (
          <AcademyEmptyState
            title={text("Curriculum in progress", "Nội dung đang được hoàn thiện")}
            description={text(
              "This path is being assembled. Check back later for the full sequence.",
              "Path này đang được hoàn thiện. Hãy quay lại sau để xem đầy đủ lộ trình.",
            )}
          />
        ) : (
          <div className="space-y-4">
            {localizedPath.courses.map((course, index) => {
              const completed = countCompletedAcademyV2CourseUnits(
                progress.state.completedLessons,
                course.id,
              );
              const isCompleted =
                course.total_unit_count > 0 &&
                completed >= course.total_unit_count;
              const previous =
                index > 0 ? localizedPath.courses[index - 1] : null;
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
                                {text("Locked", "Đã khóa")}
                              </AcademyBadge>
                            ) : isCompleted ? (
                              <AcademyBadge tone="success">
                                <Trophy className="h-3 w-3" />
                                {text("Completed", "Hoàn thành")}
                              </AcademyBadge>
                            ) : (
                              <AcademyBadge tone="primary">
                                <Layers3 className="h-3 w-3" />
                                {text("In progress", "Đang học")}
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
                            label={text("Units", "Unit")}
                            value={
                              <>
                                {completed}
                                <span className="ml-1 text-base text-text-muted">
                                  / {course.total_unit_count}
                                </span>
                              </>
                            }
                            meta={text("Completed / total", "Hoàn thành / tổng")}
                            className="px-4 py-3"
                            valueClassName="text-2xl"
                          />
                          <AcademyStat
                            label={text("Duration", "Thời lượng")}
                            value={`${course.duration_hours}h`}
                            meta={text("Estimated", "Ước tính")}
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
                            ? text(
                                "Complete the previous course to unlock",
                                "Hoàn thành course trước để mở khóa",
                              )
                            : isCompleted
                              ? text("Review this course anytime", "Bạn có thể review course này bất cứ lúc nào")
                              : text("Continue from the next unfinished unit", "Tiếp tục từ unit chưa hoàn thành tiếp theo")}
                        </span>
                        <span
                          className={`inline-flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.24em] ${
                            locked ? "text-text-muted" : "text-primary"
                          }`}
                        >
                          {isCompleted
                            ? text("Review course", "Xem lại course")
                            : text("Open course", "Mở course")}
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

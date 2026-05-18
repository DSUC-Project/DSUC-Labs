import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowRight,
  BookOpen,
  Code2,
  Lock,
  Trophy,
  User,
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
import { ActionButton } from "@/components/ui/Primitives";
import { useLocale } from "@/lib/locale";
import { localizeAcademyCourse } from "@/lib/academy/academyLocale";
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

function difficultyLabel(
  value: AcademyV2CourseDetail["difficulty"],
  text: (english: string, vietnamese: string) => string,
) {
  if (value === "advanced") return text("Advanced", "Nâng cao");
  if (value === "intermediate") return text("Intermediate", "Trung cấp");
  return text("Beginner", "Nhập môn");
}

function moduleAnchor(moduleId: string) {
  return `module-${moduleId}`;
}

export function AcademyCourse() {
  const { text, isVIE } = useLocale();
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
          setError(
            err.message || text("Could not load course.", "Không thể tải course."),
          );
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
      <AcademyPage>
        <AcademyPanel className="h-72 animate-pulse" padding="p-0" />
      </AcademyPage>
    );
  }

  if (!course) {
    return (
      <AcademyPage>
        <AcademyEmptyState
          title={text("Could not load course", "Không thể tải course")}
          description={
            error ||
            text(
              "Course data is unavailable right now.",
              "Dữ liệu course hiện không khả dụng.",
            )
          }
          action={
            <div className="flex flex-wrap justify-center gap-4">
              <ActionButton onClick={() => setReloadNonce((value) => value + 1)}>
                {text("Reload", "Tải lại")}
              </ActionButton>
              <Link to="/academy">
                <ActionButton variant="secondary">
                  {text("Academy Home", "Trang chủ Academy")}
                </ActionButton>
              </Link>
            </div>
          }
        />
      </AcademyPage>
    );
  }

  const localizedCourse = localizeAcademyCourse(course, isVIE);

  const flatUnits = flattenCourseUnits(localizedCourse);
  const completedCount = countCompletedAcademyV2CourseUnits(
    progress.state.completedLessons,
    localizedCourse.id,
  );
  const progressPercent =
    localizedCourse.total_unit_count > 0
      ? Math.round((completedCount / localizedCourse.total_unit_count) * 100)
      : 0;
  const firstIncomplete =
    flatUnits.find(
      (unit) =>
        !isAcademyV2UnitCompleted(
          progress.state.completedLessons,
          localizedCourse.id,
          unit.id,
        ),
    ) || null;
  const completedModules = localizedCourse.modules.filter((module) => {
    const moduleUnitCount =
      module.learn_units.length + module.practice_units.length;
    if (moduleUnitCount === 0) {
      return false;
    }
    return (
      countCompletedModuleUnits(
        module,
        progress.state.completedLessons,
        localizedCourse.id,
      ) >= moduleUnitCount
    );
  }).length;

  return (
    <AcademyPage>
      <section className="space-y-6">
        <AcademyBackLink
          to={
            localizedCourse.path_id
              ? `/academy/path/${localizedCourse.path_id}`
              : "/academy"
          }
          label={
            localizedCourse.path_id
              ? text("Back to Path", "Quay lại Path")
              : text("Back to Academy", "Quay lại Academy")
          }
        />

        <AcademyPanel tone="primary" padding="p-5 sm:p-6">
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-3">
              <AcademyBadge tone="primary">
                {localizedCourse.path_title || text("Course", "Course")}
              </AcademyBadge>
              <AcademyBadge tone="muted">
                {difficultyLabel(localizedCourse.difficulty, text)}
              </AcademyBadge>
              <AcademyBadge tone="muted">
                {text("Stage", "Stage")}{" "}
                {String(
                  Math.max(1, localizedCourse.track_level || 1),
                ).padStart(2, "0")}
              </AcademyBadge>
            </div>

            <div className="space-y-3">
              <h1 className="font-display text-4xl font-black uppercase tracking-tighter text-text-main sm:text-5xl lg:text-6xl">
                {localizedCourse.title}
              </h1>
              <p className="max-w-3xl font-mono text-sm leading-relaxed text-text-muted">
                {localizedCourse.description}
              </p>
            </div>

            {localizedCourse.tags.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {localizedCourse.tags.map((tag) => (
                  <AcademyBadge key={tag} tone="muted">
                    {tag}
                  </AcademyBadge>
                ))}
              </div>
            ) : null}

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <AcademyCompactStat
                label={text("Duration", "Thời lượng")}
                value={`${localizedCourse.duration_hours}h`}
                meta={text("Estimated duration", "Thời lượng ước tính")}
              />
              <AcademyCompactStat
                label={text("Modules", "Module")}
                value={localizedCourse.module_count}
                meta={text(
                  `${completedModules} completed`,
                  `Hoàn thành ${completedModules}`,
                )}
              />
              <AcademyCompactStat
                label={text("Exercises", "Bài thực hành")}
                value={localizedCourse.practice_unit_count}
                meta={text("Hands-on units", "Các unit thực hành")}
              />
              <AcademyCompactStat
                label={text("Progress", "Tiến độ")}
                value={`${progressPercent}%`}
                meta={text(
                  `${completedCount}/${localizedCourse.total_unit_count} total units`,
                  `${completedCount}/${localizedCourse.total_unit_count} unit`,
                )}
                valueClassName="text-primary"
              />
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-text-muted">
                <span>{text("Course completion", "Mức hoàn thành course")}</span>
                <span>{progressPercent}%</span>
              </div>
              <AcademyProgressBar value={progressPercent} className="h-2.5" />
            </div>
          </div>
        </AcademyPanel>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <section className="space-y-6">
          <AcademySectionTitle
            eyebrow={text("Course Outline", "Cấu trúc course")}
            title={text("Syllabus", "Nội dung course")}
            description={text(
              "Each module keeps learn units and practice units separated, but within one progression lane.",
              "Mỗi module giữ phần learn units và practice units tách riêng, nhưng vẫn nằm trong cùng một lộ trình tiến dần.",
            )}
          />

          <div className="space-y-5">
            {localizedCourse.modules.map((module, index) => {
              const moduleCompleted = countCompletedModuleUnits(
                module,
                progress.state.completedLessons,
                localizedCourse.id,
              );
              const moduleTotal =
                module.learn_units.length + module.practice_units.length;
              const modulePercent =
                moduleTotal > 0
                  ? Math.round((moduleCompleted / moduleTotal) * 100)
                  : 0;

              return (
                <AcademyPanel key={module.id} id={moduleAnchor(module.id)}>
                  <div className="space-y-5">
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                      <div className="space-y-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <AcademyBadge tone="muted">
                            {text("Module", "Module")} {String(index + 1).padStart(2, "0")}
                          </AcademyBadge>
                          <AcademyBadge tone={modulePercent === 100 ? "success" : "muted"}>
                            {text(
                              `${moduleCompleted}/${moduleTotal} done`,
                              `Xong ${moduleCompleted}/${moduleTotal}`,
                            )}
                          </AcademyBadge>
                        </div>
                        <div>
                          <h3 className="font-display text-3xl font-black uppercase tracking-tight text-text-main">
                            {module.title}
                          </h3>
                          {module.description ? (
                            <p className="mt-3 max-w-2xl font-mono text-sm leading-relaxed text-text-muted">
                              {module.description}
                            </p>
                          ) : null}
                        </div>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2 lg:w-[220px]">
                        <AcademyStat
                          label={text("Theory", "Lý thuyết")}
                          value={module.learn_units.length}
                          className="px-4 py-3"
                          valueClassName="text-2xl"
                        />
                        <AcademyStat
                          label={text("Practice", "Thực hành")}
                          value={module.practice_units.length}
                          className="px-4 py-3"
                          valueClassName="text-2xl"
                        />
                      </div>
                    </div>

                    <AcademyProgressBar
                      value={modulePercent}
                      fillClassName="bg-emerald-500"
                    />

                    <div className="grid gap-4 md:grid-cols-2">
                      <UnitLane
                        title={text("Theory", "Lý thuyết")}
                        units={module.learn_units}
                        courseId={localizedCourse.id}
                        flatUnits={flatUnits}
                        completedLessons={progress.state.completedLessons}
                      />
                      <UnitLane
                        title={text("Practice", "Thực hành")}
                        units={module.practice_units}
                        courseId={localizedCourse.id}
                        flatUnits={flatUnits}
                        completedLessons={progress.state.completedLessons}
                      />
                    </div>
                  </div>
                </AcademyPanel>
              );
            })}
          </div>
        </section>

        <aside className="space-y-6 xl:sticky xl:top-24 xl:self-start">
          <AcademyPanel tone="primary">
            <div className="space-y-5">
              <div>
                <AcademyBadge tone="muted">
                  {text("Your next move", "Bước tiếp theo")}
                </AcademyBadge>
                <h2 className="mt-4 font-display text-3xl font-black uppercase tracking-tighter text-text-main">
                  {firstIncomplete
                    ? firstIncomplete.title
                    : text("Course completed", "Đã hoàn thành course")}
                </h2>
                <p className="mt-3 font-mono text-sm leading-relaxed text-text-muted">
                  {firstIncomplete
                    ? text(
                        `Continue in ${firstIncomplete.moduleTitle} to keep the sequence intact.`,
                        `Tiếp tục ở ${firstIncomplete.moduleTitle} để giữ đúng mạch học.`,
                      )
                    : text(
                        "All units in this course are complete. You can review or head back to the path.",
                        "Bạn đã hoàn thành tất cả unit trong course này. Có thể review lại hoặc quay về path.",
                      )}
                </p>
              </div>

              {firstIncomplete ? (
                <AcademyBadge tone="primary">{firstIncomplete.moduleTitle}</AcademyBadge>
              ) : (
                <AcademyBadge tone="success">
                  {text("Great job, all units finished", "Làm tốt lắm, bạn đã xong toàn bộ unit")}
                </AcademyBadge>
              )}

              <div>
                <div className="mb-2 flex items-center justify-between font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-text-muted">
                  <span>{text("Completion", "Hoàn thành")}</span>
                  <span className="text-primary">{progressPercent}%</span>
                </div>
                <AcademyProgressBar value={progressPercent} />
              </div>

              <button
                type="button"
                onClick={() =>
                  firstIncomplete
                    ? navigate(`/academy/unit/${localizedCourse.id}/${firstIncomplete.id}`)
                    : navigate(
                        localizedCourse.path_id
                          ? `/academy/path/${localizedCourse.path_id}`
                          : "/academy",
                      )
                }
                className="inline-flex w-full items-center justify-center gap-2 border-2 border-text-main bg-primary px-5 py-3 font-mono text-[11px] font-bold uppercase tracking-widest text-primary-foreground shadow-[2px_2px_0_0_#000] transition-all hover:-translate-y-0.5 hover:-translate-x-0.5 hover:shadow-[4px_4px_0_0_#000] dark:shadow-[2px_2px_0_0_rgba(0,0,0,0.45)] dark:hover:shadow-[4px_4px_0_0_rgba(0,0,0,0.65)]"
              >
                {firstIncomplete
                  ? text("Continue learning", "Tiếp tục học")
                  : text("Return to path", "Quay lại path")}
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </AcademyPanel>

          {localizedCourse.instructor ? (
            <AcademyPanel>
              <div className="space-y-4">
                <AcademyBadge tone="muted">
                      {text("Instructor", "Người hướng dẫn")}
                </AcademyBadge>
                <div className="flex items-start gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center border border-border-main bg-main-bg text-text-muted shadow-sm">
                    <User className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-display text-2xl font-black uppercase tracking-tight text-text-main">
                      {localizedCourse.instructor.name}
                    </div>
                    <p className="mt-2 font-mono text-sm leading-relaxed text-text-muted">
                      {localizedCourse.instructor.bio}
                    </p>
                  </div>
                </div>
              </div>
            </AcademyPanel>
          ) : null}

          <AcademyPanel>
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <AcademyBadge tone="muted">
                  {text("Table of contents", "Mục lục")}
                </AcademyBadge>
                <span className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-text-muted">
                  {text("Jump by module", "Nhảy theo module")}
                </span>
              </div>
              <div className="border-l-2 border-border-main">
                {localizedCourse.modules.map((module, index) => {
                  const completed = countCompletedModuleUnits(
                    module,
                    progress.state.completedLessons,
                    localizedCourse.id,
                  );
                  const total =
                    module.learn_units.length + module.practice_units.length;
                  const percent =
                    total > 0 ? Math.round((completed / total) * 100) : 0;

                  return (
                    <a
                      key={module.id}
                      href={`#${moduleAnchor(module.id)}`}
                      className="group block border-b border-border-main/70 py-3 pl-4 pr-3 transition-colors last:border-b-0 hover:bg-main-bg/60"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-text-muted">
                            Ch. {String(index + 1).padStart(2, "0")}
                          </div>
                          <div className="mt-1 font-display text-base font-black uppercase tracking-tight text-text-main transition-colors group-hover:text-primary">
                            {module.title}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-text-muted">
                            {completed}/{total}
                          </div>
                          <div
                            className={`mt-1 text-xs font-bold ${
                              percent === 100 ? "text-emerald-500" : "text-text-muted"
                            }`}
                          >
                            {percent}%
                          </div>
                        </div>
                      </div>
                    </a>
                  );
                })}
              </div>
            </div>
          </AcademyPanel>
        </aside>
      </div>
    </AcademyPage>
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
      <AcademyPanel padding="p-5">
        <div className="space-y-3 text-center">
          <AcademyBadge tone="muted">{title}</AcademyBadge>
          <p className="text-sm text-text-muted">No units added yet.</p>
        </div>
      </AcademyPanel>
    );
  }

  return (
    <AcademyPanel padding="p-0">
      <div className="border-b border-border-main px-5 py-4">
        <div className="flex items-center justify-between gap-4">
          <AcademyBadge tone="muted">{title}</AcademyBadge>
          <div className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-text-muted">
            {units.length} unit(s)
          </div>
        </div>
      </div>

      <div className="divide-y divide-border-main">
        {units.map((unit) => {
          const flatIndex = flatUnits.findIndex((item) => item.id === unit.id);
          const previous = flatIndex > 0 ? flatUnits[flatIndex - 1] : null;
          const locked =
            previous &&
            !isAcademyV2UnitCompleted(completedLessons, courseId, previous.id);
          const done = isAcademyV2UnitCompleted(completedLessons, courseId, unit.id);

          return (
            <button
              key={unit.id}
              type="button"
              disabled={locked}
              onClick={() =>
                !locked && navigate(`/academy/unit/${courseId}/${unit.id}`)
              }
              className={`group flex w-full items-start justify-between gap-4 px-5 py-4 text-left transition-colors ${
                locked
                  ? "cursor-not-allowed opacity-50"
                  : "hover:bg-main-bg/60 focus-visible:outline-none focus-visible:bg-main-bg/60"
              }`}
            >
              <div className="min-w-0 flex-1">
                <div className="mb-2 flex flex-wrap items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-text-muted">
                  <span>{unit.type}</span>
                  {unit.xp_reward ? <span>{unit.xp_reward} XP</span> : null}
                  {unit.language ? <span>{unit.language}</span> : null}
                </div>
                <div
                  className={`font-display text-base font-black uppercase tracking-tight ${
                    locked
                      ? "text-text-muted"
                      : done
                        ? "text-primary"
                        : "text-text-main transition-colors group-hover:text-primary"
                  }`}
                >
                  {unit.title}
                </div>
              </div>

              <div className="mt-0.5 shrink-0 text-text-muted">
                {locked ? (
                  <Lock className="h-4 w-4" />
                ) : done ? (
                  <Trophy className="h-4 w-4 text-emerald-500" />
                ) : unit.section === "practice" ? (
                  <Code2 className="h-4 w-4 transition-colors group-hover:text-primary" />
                ) : (
                  <BookOpen className="h-4 w-4 transition-colors group-hover:text-primary" />
                )}
              </div>
            </button>
          );
        })}
      </div>
    </AcademyPanel>
  );
}

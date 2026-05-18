import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  BookOpen,
  CheckCircle2,
  ChevronRight,
  ClipboardCopy,
  Code2,
  Lightbulb,
  LoaderCircle,
  Lock,
  Play,
  RotateCcw,
  Sparkles,
  TerminalSquare,
} from "lucide-react";

import type {
  AcademyV2CourseDetail,
  AcademyV2UnitDetail,
  AcademyV2UnitSummary,
} from "@/types";
import {
  canRunAcademyChallenge,
  runAcademyChallenge,
  type ChallengeRunReport,
} from "@/lib/academy/challengeRunner";
import {
  CodeEditorPane,
  CodeSurface,
} from "@/components/academy/CodeSurface";
import { renderMd, slugifyMarkdownHeading } from "@/lib/academy/md";
import { fetchAcademyV2Unit } from "@/lib/academy/v2Api";
import { localizeAcademyUnitResponse } from "@/lib/academy/academyLocale";
import { useAcademyProgressState } from "@/lib/academy/useAcademyProgress";
import {
  ACADEMY_STREAK_COMPLETION_SECONDS,
  ACADEMY_STREAK_REVIEW_SECONDS,
  useAcademyStudyTimer,
} from "@/lib/academy/useAcademyStudyTimer";
import {
  countCompletedAcademyV2CourseUnits,
  isAcademyV2UnitCompleted,
} from "@/lib/academy/v2Progress";
import { useStore } from "@/store/useStore";
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
import { useLocale } from "@/lib/locale";

type OutlineItem = {
  id: string;
  label: string;
  level: number;
};

type FlatUnit = AcademyV2UnitSummary & {
  moduleId: string;
  moduleTitle: string;
};

type WorkspaceTab = "editor" | "results";
type TranslateFn = (english: string, vietnamese: string) => string;

function getEmbedUrl(url: string): string | null {
  try {
    const value = new URL(url);
    if (
      value.hostname === "www.youtube.com" ||
      value.hostname === "youtube.com"
    ) {
      const video = value.searchParams.get("v");
      return video ? `https://www.youtube.com/embed/${video}` : null;
    }
    if (value.hostname === "youtu.be") {
      const video = value.pathname.slice(1);
      return video ? `https://www.youtube.com/embed/${video}` : null;
    }
    if (value.hostname === "vimeo.com" || value.hostname === "www.vimeo.com") {
      const video = value.pathname.slice(1);
      return video ? `https://player.vimeo.com/video/${video}` : null;
    }
    return null;
  } catch {
    return null;
  }
}

function draftKey(courseId: string, unitId: string) {
  return `academy-lab-draft:${courseId}:${unitId}`;
}

function extractMarkdownOutline(md: string): OutlineItem[] {
  return String(md || "")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => /^#{1,4}\s+/.test(line))
    .map((line) => {
      const match = /^(#{1,4})\s+(.+)$/.exec(line);
      if (!match) {
        return null;
      }

      const label = match[2].replace(/[`*_~]/g, "").trim();
      return {
        id: slugifyMarkdownHeading(label),
        label,
        level: match[1].length,
      } satisfies OutlineItem;
    })
    .filter((item): item is OutlineItem => !!item && !!item.id)
    .slice(0, 8);
}

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

function isUnitLocked(
  completedLessons: Record<string, boolean>,
  courseId: string,
  flatUnits: FlatUnit[],
  unitId: string,
) {
  const flatIndex = flatUnits.findIndex((item) => item.id === unitId);
  const previous = flatIndex > 0 ? flatUnits[flatIndex - 1] : null;

  return previous
    ? !isAcademyV2UnitCompleted(completedLessons, courseId, previous.id)
    : false;
}

function practiceModeText(unit: AcademyV2UnitDetail, text: TranslateFn) {
  if (unit.language === "rust" && unit.deployable) {
    return text("Solana Lab", "Solana Lab");
  }

  if (unit.language === "rust") {
    return text("Rust Lab", "Rust Lab");
  }

  if (unit.language === "typescript") {
    return text("TypeScript Challenge", "TypeScript Challenge");
  }

  return text("Practice Challenge", "Challenge thực hành");
}

function outlineIndent(level: number) {
  if (level <= 1) return "pl-3";
  if (level === 2) return "pl-5";
  return "pl-8";
}

function buildOutlineNumbers(outline: OutlineItem[]) {
  if (outline.length === 0) {
    return [];
  }

  const minLevel = outline.reduce(
    (lowest, item) => Math.min(lowest, item.level),
    outline[0]?.level ?? 1,
  );
  const counters = [1, 0];

  return outline.map((item) => {
    const depth = Math.max(1, item.level - minLevel + 1);

    while (counters.length <= depth) {
      counters.push(0);
    }

    counters.length = depth + 1;
    counters[depth] = (counters[depth] || 0) + 1;

    return [1, ...counters.slice(1, depth + 1)].join(".");
  });
}

export function AcademyUnit() {
  const { text, isVIE } = useLocale();
  const { courseId = "", unitId = "" } = useParams<{
    courseId: string;
    unitId: string;
  }>();
  const navigate = useNavigate();
  const { currentUser, walletAddress, authToken } = useStore();

  const [unitData, setUnitData] = useState<{
    course: AcademyV2CourseDetail;
    unit: AcademyV2UnitDetail;
    previous_unit: AcademyV2UnitSummary | null;
    next_unit: AcademyV2UnitSummary | null;
    unit_index: number;
    total_units: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [draftCode, setDraftCode] = useState("");
  const [revealedHints, setRevealedHints] = useState(1);
  const [reloadNonce, setReloadNonce] = useState(0);
  const [runLoading, setRunLoading] = useState(false);
  const [runReport, setRunReport] = useState<ChallengeRunReport | null>(null);
  const [lastRunSource, setLastRunSource] = useState("");
  const [activeWorkspaceTab, setActiveWorkspaceTab] =
    useState<WorkspaceTab>("editor");
  const [solutionUnlocked, setSolutionUnlocked] = useState(false);
  const [pendingEditorReveal, setPendingEditorReveal] = useState(false);
  const [guidanceOpen, setGuidanceOpen] = useState(false);
  const [reviewRecorded, setReviewRecorded] = useState(false);
  const workspacePanelRef = useRef<HTMLDivElement | null>(null);

  const identity = useMemo(
    () => ({
      userId: currentUser?.id ?? null,
      walletAddress: walletAddress ?? null,
    }),
    [currentUser?.id, walletAddress],
  );

  const {
    state: academyProgressState,
    persistUnitCompletion,
    recordUnitReview,
  } = useAcademyProgressState({
    identity,
    currentUserId: currentUser?.id ?? null,
    authToken,
    walletAddress,
  });

  useEffect(() => {
    let cancelled = false;

    window.scrollTo(0, 0);
    async function loadUnit() {
      setLoading(true);
      setError("");
      setNotice("");
      try {
        const base = (import.meta as any).env.VITE_API_BASE_URL || "";
        const result = await fetchAcademyV2Unit(
          base,
          courseId,
          unitId,
          authToken || localStorage.getItem("auth_token"),
          walletAddress,
        );

        if (!cancelled) {
          setUnitData(result);
          const nextDraft =
            typeof window !== "undefined"
              ? window.localStorage.getItem(draftKey(courseId, unitId)) ||
                result.unit.code ||
                ""
              : result.unit.code || "";
          setDraftCode(nextDraft);
          setRevealedHints(1);
          setRunReport(null);
          setLastRunSource("");
          setActiveWorkspaceTab("editor");
          setSolutionUnlocked(false);
          setGuidanceOpen(false);
          setReviewRecorded(false);
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(
            err.message || text("Unable to load this lesson.", "Không thể tải lesson này."),
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadUnit();
    return () => {
      cancelled = true;
    };
  }, [authToken, courseId, reloadNonce, text, unitId, walletAddress]);

  useEffect(() => {
    if (!unitData || typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(draftKey(courseId, unitId), draftCode);
  }, [courseId, draftCode, unitData, unitId]);

  useEffect(() => {
    if (!pendingEditorReveal || activeWorkspaceTab !== "editor") {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      workspacePanelRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });

      const textarea = workspacePanelRef.current?.querySelector("textarea");
      if (textarea instanceof HTMLTextAreaElement) {
        textarea.focus();
      }

      setPendingEditorReveal(false);
    });

    return () => window.cancelAnimationFrame(frame);
  }, [activeWorkspaceTab, pendingEditorReveal]);

  const previewUnit = unitData?.unit ?? null;
  const previewCourse = unitData?.course ?? null;
  const previewPracticeRunnable =
    !!previewUnit &&
    previewUnit.section === "practice" &&
    canRunAcademyChallenge(previewUnit);
  const previewUnitDone =
    !!previewCourse &&
    !!previewUnit &&
    isAcademyV2UnitCompleted(
      academyProgressState.completedLessons,
      previewCourse.id,
      previewUnit.id,
    );
  const previewIsPractice = previewUnit?.section === "practice";
  const {
    studySeconds,
    completionEligible,
    reviewEligible,
  } = useAcademyStudyTimer({
    sessionKey: `${courseId}:${unitId}:${currentUser?.id || walletAddress || "guest"}`,
    enabled: Boolean(courseId && unitId),
  });

  useEffect(() => {
    if (
      !previewUnit ||
      previewUnit.section !== "practice" ||
      !previewPracticeRunnable ||
      typeof window === "undefined"
    ) {
      return;
    }

    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
        event.preventDefault();
        void handleRunChallenge();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [draftCode, previewPracticeRunnable, previewUnit?.id]);

  useEffect(() => {
    if (
      !currentUser ||
      !previewCourse ||
      !previewUnit ||
      !previewUnitDone ||
      reviewRecorded ||
      !reviewEligible
    ) {
      return;
    }

    let cancelled = false;

    async function recordReview() {
      const recorded = await recordUnitReview(previewCourse.id, previewUnit.id, {
        quizPassed: previewIsPractice,
        xpAwarded: previewUnit.xp_reward,
        studySeconds,
      });

      if (!cancelled && recorded) {
        setReviewRecorded(true);
      }
    }

    void recordReview();
    return () => {
      cancelled = true;
    };
  }, [
    currentUser,
    previewCourse,
    previewIsPractice,
    previewUnit,
    previewUnitDone,
    recordUnitReview,
    reviewEligible,
    reviewRecorded,
    studySeconds,
  ]);

  if (loading) {
    return (
      <AcademyPage>
        <AcademyPanel className="h-72 animate-pulse" padding="p-0" />
      </AcademyPage>
    );
  }

  if (!unitData) {
    return (
      <AcademyPage>
        <AcademyEmptyState
          title={text("Failed to load unit", "Không thể tải unit")}
          description={
            error ||
            text(
              "The unit could not be loaded. Please try again later.",
              "Unit này hiện không thể tải. Vui lòng thử lại sau.",
            )
          }
          action={
            <div className="flex flex-wrap justify-center gap-4">
              <button
                type="button"
                onClick={() => setReloadNonce((value) => value + 1)}
                className="inline-flex items-center justify-center gap-2 border-2 border-text-main bg-primary px-5 py-3 font-mono text-[11px] font-bold uppercase tracking-widest text-primary-foreground shadow-[2px_2px_0_0_#000] transition-all hover:-translate-y-0.5 hover:-translate-x-0.5 hover:shadow-[4px_4px_0_0_#000] dark:shadow-[2px_2px_0_0_rgba(0,0,0,0.45)] dark:hover:shadow-[4px_4px_0_0_rgba(0,0,0,0.65)]"
              >
                {text("Retry", "Thử lại")}
              </button>
              <Link
                to="/academy"
                className="inline-flex items-center justify-center border-2 border-text-main bg-surface px-5 py-3 font-mono text-[11px] font-bold uppercase tracking-widest text-text-main shadow-[2px_2px_0_0_#000] transition-all hover:-translate-y-0.5 hover:-translate-x-0.5 hover:text-primary hover:shadow-[4px_4px_0_0_#000] dark:shadow-[2px_2px_0_0_rgba(0,0,0,0.45)] dark:hover:shadow-[4px_4px_0_0_rgba(0,0,0,0.65)]"
              >
                {text("Back to Academy", "Quay lại Academy")}
              </Link>
            </div>
          }
        />
      </AcademyPage>
    );
  }

  const localizedUnitData = localizeAcademyUnitResponse(unitData, isVIE);
  const { course, unit, previous_unit, next_unit, unit_index, total_units } =
    localizedUnitData;
  const embedUrl = unit.video_url ? getEmbedUrl(unit.video_url) : null;
  const flatCourseUnits = flattenCourseUnits(course);
  const currentModule =
    course.modules.find((module) => module.id === unit.module_id) || null;
  const currentModuleUnits = currentModule
    ? [...currentModule.learn_units, ...currentModule.practice_units].sort(
        (left, right) => Number(left.order || 0) - Number(right.order || 0),
      )
    : [];
  const outline = extractMarkdownOutline(unit.content_md);
  const outlineNumbers = buildOutlineNumbers(outline);
  const unitDone = isAcademyV2UnitCompleted(
    academyProgressState.completedLessons,
    course.id,
    unit.id,
  );
  const isPractice = unit.section === "practice";
  const draftDirty = draftCode !== (unit.code || "");
  const runnerSupported = isPractice && canRunAcademyChallenge(unit);
  const runReportIsFresh = !!runReport && lastRunSource === draftCode;
  const activeRunReport = runReportIsFresh ? runReport : null;
  const completionBlocked =
    runnerSupported &&
    !unitDone &&
    (!runReportIsFresh || !runReport?.allPassed);
  const runtimeLabel =
    activeRunReport?.runtimeLabel ||
    runReport?.runtimeLabel ||
    (unit.language === "rust"
      ? unit.build_type === "buildable"
        ? text("Rust compiler sandbox", "Rust compiler sandbox")
        : text("Guided Rust validator", "Guided Rust validator")
      : runnerSupported
        ? text("Browser challenge runner", "Trình chạy challenge trên trình duyệt")
        : text("Practice workspace", "Khu vực thực hành"));
  const completedCount = countCompletedAcademyV2CourseUnits(
    academyProgressState.completedLessons,
    course.id,
  );
  const courseProgressPercent =
    course.total_unit_count > 0
      ? Math.round((completedCount / course.total_unit_count) * 100)
      : 0;
  const currentModuleCompleted = currentModule
    ? currentModuleUnits.filter((item) =>
        isAcademyV2UnitCompleted(
          academyProgressState.completedLessons,
          course.id,
          item.id,
        ),
      ).length
    : 0;
  const currentModulePercent =
    currentModuleUnits.length > 0
      ? Math.round((currentModuleCompleted / currentModuleUnits.length) * 100)
      : 0;
  const publicTests = unit.tests.filter((item) => item.hidden !== true);
  const hiddenTests = unit.tests.filter((item) => item.hidden === true);
  const visibleHints = unit.hints.slice(0, revealedHints);
  const canRevealMoreHints = revealedHints < unit.hints.length;
  const canUnlockSolution =
    !!unit.solution &&
    !solutionUnlocked &&
    (unit.hints.length === 0 ||
      revealedHints >= unit.hints.length ||
      (!!runReport && !runReport.allPassed));

  async function handleComplete() {
    setNotice("");

    if (completionBlocked) {
      setNotice(
        runLoading
          ? text(
              "The runner is still executing. Wait for the result before completing this unit.",
              "Trình chạy vẫn đang xử lý. Hãy chờ kết quả trước khi hoàn thành unit này.",
            )
          : text(
              "Pass all public and hidden checks before marking this challenge complete.",
              "Hãy pass toàn bộ public và hidden checks trước khi đánh dấu challenge này là hoàn thành.",
            ),
      );
      return;
    }

    const saved = await persistUnitCompletion(course.id, unit.id, {
      quizPassed: isPractice,
      xpAwarded: unit.xp_reward,
      studySeconds,
    });

    setNotice(
      saved
        ? completionEligible
          ? text(
              "Progress synchronized. This study session counted toward your streak.",
              "Tiến độ đã được đồng bộ. Phiên học này đã được tính vào streak của bạn.",
            )
          : text(
              `Progress synchronized. Stay at least ${ACADEMY_STREAK_COMPLETION_SECONDS} seconds in a new unit if you want it to count toward your streak.`,
              `Tiến độ đã được đồng bộ. Hãy ở lại tối thiểu ${ACADEMY_STREAK_COMPLETION_SECONDS} giây trong một unit mới nếu bạn muốn phiên này được tính vào streak.`,
            )
        : text(
            "Progress saved locally. The system will attempt to sync next time this lab is loaded.",
            "Tiến độ đã được lưu cục bộ. Hệ thống sẽ thử đồng bộ lại vào lần sau khi mở lab này.",
          ),
    );
  }

  function copyDraft() {
    if (!draftCode) {
      return;
    }

    void navigator.clipboard.writeText(draftCode);
    setNotice(text("Your code has been copied to clipboard.", "Code của bạn đã được sao chép vào clipboard."));
  }

  function resetDraft() {
    setDraftCode(unit.code || "");
    setNotice(text("Successfully restored the original code of this lab.", "Đã khôi phục code gốc của lab này."));
  }

  function applySolutionToEditor() {
    if (!unit.solution) {
      return;
    }

    setDraftCode(unit.solution);
    setActiveWorkspaceTab("editor");
    setGuidanceOpen(false);
    setPendingEditorReveal(true);
    setNotice(text("Reference solution loaded into the editor.", "Đã đưa lời giải tham chiếu vào editor."));
  }

  async function handleRunChallenge() {
    if (!isPractice || !runnerSupported) {
      return;
    }

    setNotice("");
    setRunLoading(true);
    try {
      const report = await runAcademyChallenge({ ...unit, code: draftCode });
      setRunReport(report);
      setLastRunSource(draftCode);
      setActiveWorkspaceTab("results");
    } catch (runnerError: any) {
      setRunReport({
        supported: true,
        allPassed: false,
        passedCount: 0,
        totalCount: unit.tests.length,
        visiblePassedCount: 0,
        visibleTotalCount: unit.tests.filter((item) => item.hidden !== true)
          .length,
        hiddenPassedCount: 0,
        hiddenTotalCount: unit.tests.filter((item) => item.hidden === true)
          .length,
        primaryFunction: null,
        runtimeLabel: text("Browser Challenge", "Challenge trên trình duyệt"),
        message:
          runnerError?.message ||
          text("An error occurred during execution.", "Đã xảy ra lỗi trong lúc chạy."),
        cases: [],
      });
      setLastRunSource(draftCode);
      setActiveWorkspaceTab("results");
    } finally {
      setRunLoading(false);
    }
  }

  return (
    <AcademyPage>
      <section className="space-y-6">
        <AcademyBackLink
          to={`/academy/course/${course.id}`}
          label={text("Back to Course", "Quay lại course")}
        />
        <AcademyPanel tone="primary" padding="p-5 sm:p-6">
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-3">
              <AcademyBadge tone="primary">{course.title}</AcademyBadge>
              <AcademyBadge tone="muted">{unit.module_title}</AcademyBadge>
              <AcademyBadge tone="muted">
                {isPractice
                  ? practiceModeText(unit, text)
                  : text("Theory Lesson", "Bài lý thuyết")}
              </AcademyBadge>
              {unitDone ? (
                <AcademyBadge tone="success">
                  <CheckCircle2 className="h-3 w-3" />
                  {text("Completed", "Hoàn thành")}
                </AcademyBadge>
              ) : null}
            </div>

            <div className="space-y-3">
              <h1 className="font-display text-4xl font-black uppercase tracking-tighter text-text-main sm:text-5xl lg:text-6xl">
                {unit.title}
              </h1>
              <p className="max-w-3xl font-mono text-sm leading-relaxed text-text-muted">
                {isPractice
                  ? text(
                      "Read the brief, work inside the editor, run checks when you need signal, then submit only after the hidden checks pass.",
                      "Đọc brief, làm việc trực tiếp trong editor, chạy checks khi cần tín hiệu, rồi chỉ submit sau khi hidden checks đều pass.",
                    )
                  : text(
                      "Study the material, follow the structure on the page, and mark the unit complete once the concepts are clear.",
                      "Học kỹ nội dung, đi theo cấu trúc trên trang, rồi đánh dấu hoàn thành khi bạn đã nắm chắc các khái niệm.",
                    )}
              </p>
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <AcademyCompactStat
                label={text("Course", "Course")}
                value={`${courseProgressPercent}%`}
                meta={text(
                  `${completedCount}/${course.total_unit_count} units`,
                  `${completedCount}/${course.total_unit_count} unit`,
                )}
              />
              <AcademyCompactStat
                label={text("Module", "Module")}
                value={`${currentModulePercent}%`}
                meta={text(
                  `${currentModuleCompleted}/${currentModuleUnits.length} units`,
                  `${currentModuleCompleted}/${currentModuleUnits.length} unit`,
                )}
              />
              <AcademyCompactStat
                label={text("Sequence", "Thứ tự")}
                value={`${unit_index + 1}/${total_units}`}
                meta={text("Current step", "Bước hiện tại")}
              />
              <AcademyCompactStat
                label={text("Reward", "Thưởng")}
                value={unit.xp_reward ? `${unit.xp_reward} XP` : text("Guided", "Có hướng dẫn")}
                meta={
                  isPractice
                    ? text("Interactive lab", "Lab tương tác")
                    : text("Theory lesson", "Bài lý thuyết")
                }
                valueClassName="text-primary"
              />
            </div>

            <div className="grid gap-3 lg:grid-cols-2">
              <div>
                <div className="mb-2 flex items-center justify-between font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-text-muted">
                  <span>{text("Course progress", "Tiến độ course")}</span>
                  <span>{courseProgressPercent}%</span>
                </div>
                <AcademyProgressBar value={courseProgressPercent} />
              </div>
              <div>
                <div className="mb-2 flex items-center justify-between font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-text-muted">
                  <span>{text("Module progress", "Tiến độ module")}</span>
                  <span>{currentModulePercent}%</span>
                </div>
                <AcademyProgressBar
                  value={currentModulePercent}
                  fillClassName="bg-emerald-500"
                />
              </div>
            </div>

            <div className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-text-muted">
              {text(
                `Session ${studySeconds}s • streak counts after ${ACADEMY_STREAK_COMPLETION_SECONDS}s on a new unit or ${ACADEMY_STREAK_REVIEW_SECONDS}s when reopening a completed one`,
                `Phiên ${studySeconds}s • streak được tính sau ${ACADEMY_STREAK_COMPLETION_SECONDS}s với unit mới hoặc ${ACADEMY_STREAK_REVIEW_SECONDS}s khi mở lại unit đã hoàn thành`,
              )}
            </div>
          </div>
        </AcademyPanel>
      </section>

      {notice ? (
        <AcademyPanel tone="primary">
          <div className="flex items-start gap-3">
            <TerminalSquare className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <p className="text-sm leading-relaxed text-text-main">{notice}</p>
          </div>
        </AcademyPanel>
      ) : null}

      {isPractice ? (
        <div className="grid gap-6 xl:items-start xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="min-w-0 space-y-6 xl:order-1">
            <AcademyPanel>
              <div className="space-y-5">
                <AcademySectionTitle
                  eyebrow={text("Challenge Brief", "Brief challenge")}
                  title={text("Instructions", "Hướng dẫn")}
                  description={text(
                    "Visible checks, core requirements, and the exact brief for the current lab.",
                    "Public checks, yêu cầu cốt lõi và brief đầy đủ cho lab hiện tại.",
                  )}
                  className="mb-0"
                />
                <div className="grid gap-3 md:grid-cols-2">
                  <AcademyStat
                    label={text("Public requirements", "Yêu cầu công khai")}
                    value={publicTests.length}
                    meta={text(
                      "Explicit checks you can reason about",
                      "Các check hiển thị rõ để bạn bám theo",
                    )}
                    className="px-4 py-3"
                    valueClassName="text-2xl"
                  />
                  <AcademyStat
                    label={text("Hidden requirements", "Yêu cầu ẩn")}
                    value={hiddenTests.length}
                    meta={text("Validated by the runner", "Được runner xác thực")}
                    className="px-4 py-3"
                    valueClassName="text-2xl"
                  />
                </div>

                {publicTests.length > 0 ? (
                  <div className="grid gap-3 md:grid-cols-2">
                    {publicTests.map((testCase, index) => (
                      <div
                        key={testCase.id}
                        className="border border-border-main bg-main-bg px-4 py-4 shadow-sm"
                      >
                        <div className="font-mono text-[10px] font-bold uppercase tracking-widest text-text-muted">
                          {text("Public check", "Public check")} {index + 1}
                        </div>
                        <p className="mt-2 font-mono text-sm leading-relaxed text-text-main">
                          {testCase.description}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : null}

                <div className="markdown-body prose-dsuc max-w-none">
                  {renderMd(unit.content_md)}
                </div>
              </div>
            </AcademyPanel>

            <div ref={workspacePanelRef}>
              <AcademyPanel padding="p-0" className="overflow-hidden">
                <div className="border-b border-border-main px-5 py-4 sm:px-6">
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                    <div className="flex flex-wrap items-center gap-2">
                      <WorkspaceSwitch
                        label={text("Editor", "Editor")}
                        active={activeWorkspaceTab === "editor"}
                        onClick={() => setActiveWorkspaceTab("editor")}
                      />
                      {runnerSupported ? (
                        <WorkspaceSwitch
                          label={text("Results", "Kết quả")}
                          active={activeWorkspaceTab === "results"}
                          onClick={() => setActiveWorkspaceTab("results")}
                        />
                      ) : null}
                      {(unit.hints.length > 0 || unit.solution) && (
                        <WorkspaceSwitch
                          label={
                            guidanceOpen
                              ? text("Hide guidance", "Ẩn hướng dẫn")
                              : unit.hints.length > 0
                                ? text(
                                    `Hints ${visibleHints.length}/${unit.hints.length}`,
                                    `Gợi ý ${visibleHints.length}/${unit.hints.length}`,
                                  )
                                : text("Guidance", "Hướng dẫn")
                          }
                          active={guidanceOpen}
                          onClick={() => setGuidanceOpen((current) => !current)}
                        />
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {runnerSupported ? (
                        <button
                          type="button"
                          onClick={() => void handleRunChallenge()}
                          disabled={runLoading}
                          className="inline-flex items-center justify-center gap-2 border-2 border-text-main bg-primary px-4 py-2.5 font-mono text-[10px] font-bold uppercase tracking-widest text-primary-foreground shadow-[2px_2px_0_0_#000] transition-all hover:-translate-y-0.5 hover:-translate-x-0.5 hover:shadow-[4px_4px_0_0_#000] disabled:pointer-events-none disabled:opacity-50 dark:shadow-[2px_2px_0_0_rgba(0,0,0,0.45)] dark:hover:shadow-[4px_4px_0_0_rgba(0,0,0,0.65)]"
                        >
                          {runLoading ? (
                            <LoaderCircle className="h-4 w-4 animate-spin" />
                          ) : (
                            <Play className="h-3.5 w-3.5 fill-current" />
                          )}
                          {runLoading
                            ? text("Running...", "Đang chạy...")
                            : text("Run checks", "Chạy checks")}
                        </button>
                      ) : null}

                      <button
                        type="button"
                        onClick={copyDraft}
                        className="inline-flex items-center justify-center gap-2 border-2 border-text-main bg-surface px-4 py-2.5 font-mono text-[10px] font-bold uppercase tracking-widest text-text-main shadow-[2px_2px_0_0_#000] transition-all hover:-translate-y-0.5 hover:-translate-x-0.5 hover:text-primary hover:shadow-[4px_4px_0_0_#000] dark:shadow-[2px_2px_0_0_rgba(0,0,0,0.45)] dark:hover:shadow-[4px_4px_0_0_rgba(0,0,0,0.65)]"
                      >
                        <ClipboardCopy className="h-3.5 w-3.5" />
                        {text("Copy", "Sao chép")}
                      </button>

                      <button
                        type="button"
                        onClick={resetDraft}
                        className="inline-flex items-center justify-center gap-2 border-2 border-text-main bg-surface px-4 py-2.5 font-mono text-[10px] font-bold uppercase tracking-widest text-text-main shadow-[2px_2px_0_0_#000] transition-all hover:-translate-y-0.5 hover:-translate-x-0.5 hover:text-primary hover:shadow-[4px_4px_0_0_#000] dark:shadow-[2px_2px_0_0_rgba(0,0,0,0.45)] dark:hover:shadow-[4px_4px_0_0_rgba(0,0,0,0.65)]"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        {text("Reset", "Khôi phục")}
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <AcademyBadge tone="muted">{runtimeLabel}</AcademyBadge>
                    {draftDirty ? (
                      <AcademyBadge tone="warning">
                        {text("Modified", "Đã chỉnh sửa")}
                      </AcademyBadge>
                    ) : null}
                    {runReport && !runReportIsFresh ? (
                      <AcademyBadge tone="warning">
                        {text("Needs rerun", "Cần chạy lại")}
                      </AcademyBadge>
                    ) : null}
                    {activeRunReport?.allPassed ? (
                      <AcademyBadge tone="success">
                        {text("All checks passed", "Đã pass toàn bộ checks")}
                      </AcademyBadge>
                    ) : null}
                    {runnerSupported ? (
                      <AcademyBadge tone="muted">
                        {text("Shortcut: Ctrl/Cmd + Enter", "Phím tắt: Ctrl/Cmd + Enter")}
                      </AcademyBadge>
                    ) : null}
                    {unit.hints.length > 0 ? (
                      <AcademyBadge tone="warning">
                        {text(
                          `${visibleHints.length}/${unit.hints.length} hints visible`,
                          `${visibleHints.length}/${unit.hints.length} gợi ý đang hiển thị`,
                        )}
                      </AcademyBadge>
                    ) : null}
                  </div>
                </div>

                {activeWorkspaceTab === "editor" ? (
                  <div className="bg-main-bg px-4 py-4">
                    {guidanceOpen ? (
                      <div className="mb-4 space-y-4 border border-border-main bg-surface px-4 py-4 shadow-sm">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <div className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-text-muted">
                              {text("Guidance", "Hướng dẫn")}
                            </div>
                            <p className="mt-2 max-w-2xl font-mono text-sm leading-relaxed text-text-muted">
                              {text(
                                "Reveal hints progressively. Reference solution stays behind a separate unlock and can be sent back into the editor when needed.",
                                "Mở gợi ý theo từng bước. Lời giải tham chiếu được mở riêng và có thể đẩy ngược lại vào editor khi cần.",
                              )}
                            </p>
                          </div>
                          <div className="grid gap-3 sm:grid-cols-2">
                            <AcademyCompactStat
                              label={text("Hints", "Gợi ý")}
                              value={`${visibleHints.length}/${unit.hints.length}`}
                              meta={text("Revealed so far", "Đã mở đến hiện tại")}
                              className="min-w-[140px]"
                            />
                            <AcademyCompactStat
                              label={text("Solution", "Lời giải")}
                              value={
                                solutionUnlocked
                                  ? text("Open", "Đã mở")
                                  : text("Locked", "Đã khóa")
                              }
                              meta={text("Reference state", "Trạng thái tham chiếu")}
                              className="min-w-[140px]"
                            />
                          </div>
                        </div>

                        {visibleHints.length > 0 ? (
                          <div className="grid gap-3">
                            {visibleHints.map((hint, index) => (
                              <div
                                key={`${index}-${hint.slice(0, 12)}`}
                                className="border border-amber-500/20 bg-amber-500/8 px-4 py-4 shadow-sm"
                              >
                                <div className="mb-2 font-mono text-[10px] font-bold uppercase tracking-widest text-amber-700 dark:text-amber-300">
                                  {text("Hint", "Gợi ý")} {index + 1}
                                </div>
                                <div className="markdown-body prose-dsuc">
                                  {renderMd(hint)}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="border border-border-main bg-main-bg/60 px-4 py-4 font-mono text-sm text-text-muted shadow-sm">
                            {text("No hints have been revealed yet.", "Chưa có gợi ý nào được mở.")}
                          </div>
                        )}

                        <div className="flex flex-col gap-3 sm:flex-row">
                          {canRevealMoreHints ? (
                            <button
                              type="button"
                              onClick={() =>
                                setRevealedHints((currentValue) =>
                                  Math.min(unit.hints.length, currentValue + 1),
                                )
                              }
                              className="inline-flex w-full items-center justify-center gap-2 border-2 border-text-main bg-amber-400/30 px-5 py-3 font-mono text-[11px] font-bold uppercase tracking-widest text-amber-900 shadow-[2px_2px_0_0_#000] transition-all hover:-translate-y-0.5 hover:-translate-x-0.5 hover:shadow-[4px_4px_0_0_#000] dark:shadow-[2px_2px_0_0_rgba(0,0,0,0.45)] dark:text-amber-200 dark:hover:shadow-[4px_4px_0_0_rgba(0,0,0,0.65)]"
                            >
                              <Lightbulb className="h-4 w-4" />
                              {text("Reveal next hint", "Mở gợi ý tiếp theo")}
                            </button>
                          ) : null}

                          {canUnlockSolution ? (
                            <button
                              type="button"
                              onClick={() => setSolutionUnlocked(true)}
                              className="inline-flex w-full items-center justify-center gap-2 border-2 border-text-main bg-surface px-5 py-3 font-mono text-[11px] font-bold uppercase tracking-widest text-text-main shadow-[2px_2px_0_0_#000] transition-all hover:-translate-y-0.5 hover:-translate-x-0.5 hover:text-primary hover:shadow-[4px_4px_0_0_#000] dark:shadow-[2px_2px_0_0_rgba(0,0,0,0.45)] dark:hover:shadow-[4px_4px_0_0_rgba(0,0,0,0.65)]"
                            >
                              <Sparkles className="h-4 w-4" />
                              {text("Unlock reference solution", "Mở lời giải tham chiếu")}
                            </button>
                          ) : null}
                        </div>

                        {solutionUnlocked && unit.solution ? (
                          <div className="space-y-4 border border-primary/20 bg-primary/8 px-4 py-4 shadow-sm">
                            <div className="font-mono text-[10px] font-bold uppercase tracking-widest text-primary">
                              {text("Reference solution", "Lời giải tham chiếu")}
                            </div>
                            <div className="markdown-body prose-dsuc">
                              {renderMd(unit.solution)}
                            </div>
                            <button
                              type="button"
                              onClick={applySolutionToEditor}
                              className="inline-flex w-full items-center justify-center gap-2 border-2 border-text-main bg-primary px-5 py-3 font-mono text-[11px] font-bold uppercase tracking-widest text-primary-foreground shadow-[2px_2px_0_0_#000] transition-all hover:-translate-y-0.5 hover:-translate-x-0.5 hover:shadow-[4px_4px_0_0_#000] dark:shadow-[2px_2px_0_0_rgba(0,0,0,0.45)] dark:hover:shadow-[4px_4px_0_0_rgba(0,0,0,0.65)]"
                            >
                              {text("Apply solution to editor", "Đưa lời giải vào editor")}
                            </button>
                          </div>
                        ) : null}
                      </div>
                    ) : null}

                    <CodeEditorPane
                      value={draftCode}
                      onChange={setDraftCode}
                      language={unit.language || "text"}
                      placeholder={text(
                        "Start typing your solution here...",
                        "Bắt đầu nhập lời giải của bạn tại đây...",
                      )}
                    />
                  </div>
                ) : runnerSupported ? (
                  <div className="space-y-5 bg-main-bg/55 p-5 sm:p-6">
                  {!runReport ? (
                    <div className="flex min-h-[380px] flex-col items-center justify-center text-center">
                      <div className="flex h-16 w-16 items-center justify-center border-2 border-text-main bg-surface shadow-[2px_2px_0_0_#000] dark:shadow-[2px_2px_0_0_rgba(0,0,0,0.45)]">
                        <TerminalSquare className="h-7 w-7 text-text-muted" />
                      </div>
                      <h3 className="mt-5 font-display text-3xl font-black uppercase tracking-tight text-text-main">
                        {text("No test results yet", "Chưa có kết quả test")}
                      </h3>
                      <p className="mt-3 max-w-md font-mono text-sm leading-relaxed text-text-muted">
                        {text(
                          "Run your code to see public and hidden check results. This view is the execution summary, not a second page buried inside the lab.",
                          "Hãy chạy code để xem kết quả public và hidden checks. Đây là phần tổng hợp execution, không phải một trang phụ bị giấu trong lab.",
                        )}
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="grid gap-3 md:grid-cols-4">
                        <AcademyStat
                          label={text("Passed", "Đã pass")}
                          value={`${runReport.passedCount}/${runReport.totalCount}`}
                          meta={
                            runReportIsFresh
                              ? text("Latest run", "Lần chạy mới nhất")
                              : text("Outdated after edits", "Đã cũ sau khi chỉnh sửa")
                          }
                          className="px-4 py-3"
                          valueClassName={`text-2xl ${runReportIsFresh && runReport.allPassed ? "text-emerald-500" : ""}`}
                        />
                        <AcademyStat
                          label={text("Public", "Public")}
                          value={`${runReport.visiblePassedCount}/${runReport.visibleTotalCount}`}
                          meta={text("Visible checks", "Checks hiển thị")}
                          className="px-4 py-3"
                          valueClassName="text-2xl"
                        />
                        <AcademyStat
                          label={text("Hidden", "Hidden")}
                          value={`${runReport.hiddenPassedCount}/${runReport.hiddenTotalCount}`}
                          meta={text("Private checks", "Checks riêng")}
                          className="px-4 py-3"
                          valueClassName="text-2xl"
                        />
                        <AcademyStat
                          label={text("Entry point", "Điểm vào")}
                          value={runReport.primaryFunction || text("Unknown", "Không rõ")}
                          meta={runtimeLabel}
                          className="px-4 py-3"
                          valueClassName="text-base"
                        />
                      </div>

                      <div
                        className={`border px-5 py-4 shadow-sm ${
                          runReportIsFresh
                            ? runReport.allPassed
                              ? "border-emerald-500/20 bg-emerald-500/10"
                              : "border-amber-500/20 bg-amber-500/10"
                            : "border-amber-500/20 bg-amber-500/10"
                        }`}
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <AcademyBadge
                            tone={
                              runReportIsFresh
                                ? runReport.allPassed
                                  ? "success"
                                  : "warning"
                                : "warning"
                            }
                          >
                            {runReportIsFresh
                              ? runReport.allPassed
                                ? text("Ready to submit", "Sẵn sàng submit")
                                : text("Checks failed", "Checks chưa pass")
                              : text("Results outdated", "Kết quả đã cũ")}
                          </AcademyBadge>
                        </div>
                        <p className="mt-3 font-mono text-sm leading-relaxed text-text-main">
                          {runReportIsFresh
                            ? runReport.message
                            : text(
                                "You changed the draft after the last execution. Run checks again to refresh the result summary.",
                                "Bạn đã chỉnh draft sau lần chạy gần nhất. Hãy chạy checks lại để làm mới phần tổng hợp kết quả.",
                              )}
                        </p>
                      </div>

                      <div className="space-y-3">
                        <div className="font-mono text-[10px] font-bold uppercase tracking-widest text-text-muted">
                          {text("Case details", "Chi tiết từng case")}
                        </div>
                        {(runReport.cases || []).length > 0 ? (
                          <div className="space-y-3">
                            {runReport.cases.map((caseItem, index) => (
                              <div
                                key={caseItem.id}
                                className={`border px-5 py-4 shadow-sm ${
                                  caseItem.passed
                                    ? "border-emerald-500/20 bg-emerald-500/8"
                                    : "border-amber-500/20 bg-amber-500/8"
                                }`}
                              >
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                  <div className="flex items-center gap-2">
                                    <AcademyBadge
                                      tone={caseItem.passed ? "success" : "warning"}
                                    >
                                      {caseItem.hidden
                                        ? text(`Hidden ${index + 1}`, `Hidden ${index + 1}`)
                                        : text(`Public ${index + 1}`, `Public ${index + 1}`)}
                                    </AcademyBadge>
                                  </div>
                                  <div
                                    className={`font-mono text-[10px] font-bold uppercase tracking-widest ${
                                      caseItem.passed
                                        ? "text-emerald-600 dark:text-emerald-300"
                                        : "text-amber-700 dark:text-amber-300"
                                    }`}
                                  >
                                    {caseItem.passed
                                      ? text("Passed", "Đã pass")
                                      : text("Needs work", "Cần làm lại")}
                                  </div>
                                </div>
                                <p className="mt-3 font-mono text-sm leading-relaxed text-text-main">
                                  {caseItem.description}
                                </p>
                                {caseItem.error ? (
                                  <div className="mt-4">
                                    <CodeSurface
                                      code={caseItem.error}
                                      language="text"
                                      label="error"
                                      maxHeightClass="max-h-[180px]"
                                    />
                                  </div>
                                ) : null}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="border border-border-main bg-surface px-5 py-4 font-mono text-sm text-text-muted shadow-sm">
                            {text(
                              "The runner did not return structured case data for this lab.",
                              "Runner không trả về dữ liệu case có cấu trúc cho lab này.",
                            )}
                          </div>
                        )}
                      </div>
                    </>
                  )}
                  </div>
                ) : null}
              </AcademyPanel>
            </div>

          </div>

          <aside className="space-y-6 xl:sticky xl:top-24 xl:self-start xl:order-2">
            <AcademyPanel tone="primary">
              <div className="space-y-5">
                <div>
                  <AcademyBadge tone="muted">
                    {text("Challenge overview", "Tổng quan challenge")}
                  </AcademyBadge>
                  <h2 className="mt-4 font-display text-3xl font-black uppercase tracking-tighter text-text-main">
                    {practiceModeText(unit, text)}
                  </h2>
                  <p className="mt-3 font-mono text-sm leading-relaxed text-text-muted">
                    {text(
                      "Visible checks first, hidden checks second, submit last.",
                      "Xem public checks trước, hidden checks sau, submit ở bước cuối cùng.",
                    )}
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                  <AcademyStat
                    label={text("Public checks", "Public checks")}
                    value={publicTests.length}
                    meta={text(
                      "Visible acceptance criteria",
                      "Điều kiện đạt hiển thị công khai",
                    )}
                    className="px-4 py-3"
                    valueClassName="text-2xl"
                  />
                  <AcademyStat
                    label={text("Hidden checks", "Hidden checks")}
                    value={hiddenTests.length}
                    meta={text("Validated on submit", "Được xác thực khi submit")}
                    className="px-4 py-3"
                    valueClassName="text-2xl"
                  />
                  <AcademyStat
                    label={text("Hints", "Gợi ý")}
                    value={unit.hints.length}
                    meta={text(
                      `${visibleHints.length} revealed`,
                      `Đã mở ${visibleHints.length}`,
                    )}
                    className="px-4 py-3"
                    valueClassName="text-2xl"
                  />
                  <AcademyStat
                    label={text("Runtime", "Runtime")}
                    value={runtimeLabel}
                    meta={
                      draftDirty
                        ? text(
                            "Draft changed since last run",
                            "Draft đã thay đổi sau lần chạy gần nhất",
                          )
                        : text(
                            "Draft matches last run",
                            "Draft trùng với lần chạy gần nhất",
                          )
                    }
                    className="px-4 py-3"
                    valueClassName="text-base"
                  />
                </div>

                <div className="border border-border-main bg-main-bg/70 px-4 py-4 shadow-sm">
                  <div className="flex flex-wrap items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-widest text-text-muted">
                    <span className="inline-flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-primary" />
                      {text("Workflow", "Quy trình")}
                    </span>
                  </div>
                  <ol className="mt-3 space-y-2 font-mono text-sm leading-relaxed text-text-muted">
                    <li>{text("1. Read the brief and visible checks.", "1. Đọc brief và các public checks.")}</li>
                    <li>{text("2. Write or edit your solution in the workspace.", "2. Viết hoặc chỉnh lời giải trong workspace.")}</li>
                    <li>{text("3. Run checks with Ctrl/Cmd + Enter.", "3. Chạy checks bằng Ctrl/Cmd + Enter.")}</li>
                    <li>{text("4. Submit only after hidden checks pass.", "4. Chỉ submit sau khi hidden checks đều pass.")}</li>
                  </ol>
                </div>
              </div>
            </AcademyPanel>

            <AcademyPanel>
              <div className="space-y-4">
                <AcademyBadge tone="muted">
                  {currentModule?.title || text("Module", "Module")}
                </AcademyBadge>
                <div>
                  <div className="font-display text-2xl font-black uppercase tracking-tight text-text-main">
                    {text("Module route", "Lộ trình module")}
                  </div>
                  <p className="mt-2 font-mono text-sm leading-relaxed text-text-muted">
                    {currentModule
                      ? text(
                          `${currentModuleCompleted}/${currentModuleUnits.length} lessons completed in this module.`,
                          `Đã hoàn thành ${currentModuleCompleted}/${currentModuleUnits.length} lesson trong module này.`,
                        )
                      : text(
                          "No module information available.",
                          "Hiện chưa có thông tin module.",
                        )}
                  </p>
                </div>
                <AcademyProgressBar
                  value={currentModulePercent}
                  fillClassName="bg-emerald-500"
                />
                <div className="max-h-[360px] space-y-2 overflow-auto pr-1">
                  {currentModuleUnits.map((routeUnit) => {
                    const done = isAcademyV2UnitCompleted(
                      academyProgressState.completedLessons,
                      course.id,
                      routeUnit.id,
                    );
                    const locked = isUnitLocked(
                      academyProgressState.completedLessons,
                      course.id,
                      flatCourseUnits,
                      routeUnit.id,
                    );
                    const current = routeUnit.id === unit.id;

                    return (
                      <button
                        key={routeUnit.id}
                        type="button"
                        disabled={locked}
                        onClick={() =>
                          !locked &&
                          navigate(`/academy/unit/${course.id}/${routeUnit.id}`)
                        }
                        className={`flex w-full items-start gap-3 border px-4 py-3 text-left transition-colors shadow-sm ${
                          current
                            ? "border-primary/30 bg-primary/10"
                            : locked
                              ? "cursor-not-allowed border-border-main bg-main-bg/60 opacity-60"
                              : "border-border-main bg-main-bg/60 hover:border-primary/30 hover:bg-main-bg"
                        }`}
                      >
                        <div
                          className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center border ${
                            current
                              ? "border-primary/20 bg-primary text-primary-foreground"
                              : done
                                ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300"
                                : "border-border-main bg-surface text-text-muted"
                          }`}
                        >
                          {locked ? (
                            <Lock className="h-3.5 w-3.5" />
                          ) : done ? (
                            <CheckCircle2 className="h-3.5 w-3.5" />
                          ) : routeUnit.section === "practice" ? (
                            <Code2 className="h-3.5 w-3.5" />
                          ) : (
                            <BookOpen className="h-3.5 w-3.5" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-text-muted">
                            {routeUnit.section === "practice"
                              ? text("Practice", "Thực hành")
                              : text("Theory", "Lý thuyết")}
                          </div>
                          <div
                            className={`mt-1 line-clamp-2 font-display text-base font-black uppercase tracking-tight ${
                              current ? "text-primary" : "text-text-main"
                            }`}
                          >
                            {routeUnit.title}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </AcademyPanel>

          </aside>
        </div>
      ) : (
        <div className="grid gap-6 xl:items-start xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-6">
            {embedUrl ? (
              <AcademyPanel padding="p-0" className="overflow-hidden">
                <div className="border-b border-border-main px-6 py-4">
                  <AcademyBadge tone="muted">
                    {text("Video lesson", "Bài học video")}
                  </AcademyBadge>
                  <h2 className="mt-3 font-display text-3xl font-black uppercase tracking-tighter text-text-main">
                    {text("Watch tutorial", "Xem hướng dẫn")}
                  </h2>
                </div>
                <div className="relative w-full bg-main-bg pb-[56.25%]">
                  <iframe
                    src={embedUrl}
                    title={unit.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="absolute inset-0 h-full w-full"
                  />
                </div>
              </AcademyPanel>
            ) : null}

            <AcademyPanel>
              <div className="space-y-5">
                <div className="flex flex-wrap items-center gap-3">
                  <AcademyBadge tone="muted">
                    {text("Lesson Notes", "Ghi chú bài học")}
                  </AcademyBadge>
                  <span className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-text-muted">
                    {text("Main reading for this unit", "Nội dung chính của unit này")}
                  </span>
                </div>
                <div className="markdown-body prose-dsuc">
                  {renderMd(unit.content_md)}
                </div>
              </div>
            </AcademyPanel>
          </div>

          <aside className="space-y-6 xl:sticky xl:top-24 xl:self-start">
            {outline.length > 0 ? (
              <AcademyPanel>
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <AcademyBadge tone="muted">
                      {text("Table of contents", "Mục lục")}
                    </AcademyBadge>
                    <span className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-text-muted">
                      {text("Quick jumps", "Đi nhanh")}
                    </span>
                  </div>
                  <div className="border-l-2 border-border-main">
                    {outline.map((item, index) => (
                      <a
                        key={item.id}
                        href={`#${item.id}`}
                        className={`group block border-b border-border-main/70 py-2.5 pr-3 text-sm transition-colors last:border-b-0 hover:bg-main-bg/60 ${outlineIndent(item.level)}`}
                      >
                        <span className="block font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-text-muted">
                          {outlineNumbers[index]}
                        </span>
                        <span className="mt-0.5 block font-display text-base font-black uppercase tracking-tight text-text-main transition-colors group-hover:text-primary">
                          {item.label}
                        </span>
                      </a>
                    ))}
                  </div>
                </div>
              </AcademyPanel>
            ) : null}

            <AcademyPanel>
              <div className="space-y-5">
                <AcademyBadge tone="muted">
                  {currentModule?.title || text("Module", "Module")}
                </AcademyBadge>
                <div>
                  <div className="font-display text-2xl font-black uppercase tracking-tight text-text-main">
                    {text("Module route", "Lộ trình module")}
                  </div>
                  <p className="mt-2 font-mono text-sm leading-relaxed text-text-muted">
                    {currentModule
                      ? text(
                          `${currentModuleCompleted}/${currentModuleUnits.length} lessons completed in this module.`,
                          `Đã hoàn thành ${currentModuleCompleted}/${currentModuleUnits.length} lesson trong module này.`,
                        )
                      : text(
                          "No module information available.",
                          "Hiện chưa có thông tin module.",
                        )}
                  </p>
                </div>
                <AcademyProgressBar
                  value={currentModulePercent}
                  fillClassName="bg-emerald-500"
                />
                <div className="space-y-2">
                  {currentModuleUnits.map((routeUnit) => {
                    const done = isAcademyV2UnitCompleted(
                      academyProgressState.completedLessons,
                      course.id,
                      routeUnit.id,
                    );
                    const locked = isUnitLocked(
                      academyProgressState.completedLessons,
                      course.id,
                      flatCourseUnits,
                      routeUnit.id,
                    );
                    const current = routeUnit.id === unit.id;

                    return (
                      <button
                        key={routeUnit.id}
                        type="button"
                        disabled={locked}
                        onClick={() =>
                          !locked &&
                          navigate(`/academy/unit/${course.id}/${routeUnit.id}`)
                        }
                        className={`flex w-full items-start gap-3 border px-4 py-3 text-left shadow-sm transition-colors ${
                          current
                            ? "border-primary/30 bg-primary/10"
                            : locked
                              ? "cursor-not-allowed border-border-main bg-main-bg/60 opacity-60"
                              : "border-border-main bg-main-bg/60 hover:border-primary/30 hover:bg-main-bg"
                        }`}
                      >
                        <div
                          className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center border ${
                            current
                              ? "border-primary/20 bg-primary text-primary-foreground"
                              : done
                                ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300"
                                : "border-border-main bg-surface text-text-muted"
                          }`}
                        >
                          {locked ? (
                            <Lock className="h-3.5 w-3.5" />
                          ) : done ? (
                            <CheckCircle2 className="h-3.5 w-3.5" />
                          ) : routeUnit.section === "practice" ? (
                            <Code2 className="h-3.5 w-3.5" />
                          ) : (
                            <BookOpen className="h-3.5 w-3.5" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-text-muted">
                            {routeUnit.section === "practice"
                              ? text("Practice", "Thực hành")
                              : text("Theory", "Lý thuyết")}
                          </div>
                          <div
                            className={`mt-1 line-clamp-2 font-display text-base font-black uppercase tracking-tight ${
                              current ? "text-primary" : "text-text-main"
                            }`}
                          >
                            {routeUnit.title}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </AcademyPanel>
          </aside>
        </div>
      )}

      <AcademyPanel tone={unitDone ? "success" : completionBlocked ? "warning" : "primary"}>
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <AcademyBadge tone={unitDone ? "success" : completionBlocked ? "warning" : "primary"}>
              {unitDone
                ? text("Unit completed", "Unit đã hoàn thành")
                : text("Finish this unit", "Hoàn tất unit này")}
            </AcademyBadge>
            <h2 className="mt-4 font-display text-3xl font-black uppercase tracking-tighter text-text-main">
              {unitDone
                ? text("Recorded successfully", "Đã ghi nhận thành công")
                : text("Ready when the unit is truly done", "Sẵn sàng khi unit thật sự hoàn tất")}
            </h2>
            <p className="mt-3 max-w-2xl font-mono text-sm leading-relaxed text-text-muted">
              {unitDone
                ? text(
                    "This unit is already marked complete. You can move on or review the material again.",
                    "Unit này đã được đánh dấu hoàn thành. Bạn có thể đi tiếp hoặc xem lại nội dung bất cứ lúc nào.",
                  )
                : isPractice
                  ? runnerSupported
                    ? text(
                        "The submit action unlocks only after the latest run passes every public and hidden check.",
                        "Nút submit chỉ được mở khi lần chạy gần nhất đã pass toàn bộ public và hidden checks.",
                      )
                    : text(
                        "Mark the unit complete when you have finished the lab.",
                        "Hãy đánh dấu hoàn thành khi bạn đã làm xong lab.",
                      )
                  : text(
                      "Take a final pass over the material, then mark the theory unit complete.",
                      "Hãy đọc lại nội dung lần cuối, rồi đánh dấu hoàn thành bài lý thuyết này.",
                    )}
            </p>
          </div>

          <div className="flex flex-col items-start gap-3 lg:items-end">
            {!unitDone && completionBlocked ? (
              <AcademyBadge tone="warning">
                {runLoading
                  ? text("Running checks...", "Đang chạy checks...")
                  : text("All checks must pass", "Tất cả checks phải pass")}
              </AcademyBadge>
            ) : null}

            {!unitDone ? (
              <button
                type="button"
                onClick={() => void handleComplete()}
                disabled={completionBlocked || runLoading}
                className="inline-flex items-center justify-center gap-2 border-2 border-text-main bg-primary px-5 py-3 font-mono text-[11px] font-bold uppercase tracking-widest text-primary-foreground shadow-[2px_2px_0_0_#000] transition-all hover:-translate-y-0.5 hover:-translate-x-0.5 hover:shadow-[4px_4px_0_0_#000] disabled:pointer-events-none disabled:opacity-50 dark:shadow-[2px_2px_0_0_rgba(0,0,0,0.45)] dark:hover:shadow-[4px_4px_0_0_rgba(0,0,0,0.65)]"
              >
                <CheckCircle2 className="h-4 w-4" />
                {isPractice
                  ? text("Submit lab", "Nộp lab")
                  : text("Mark complete", "Đánh dấu hoàn thành")}
              </button>
            ) : (
              <div className="flex flex-col gap-3 sm:flex-row">
                {next_unit ? (
                  <button
                    type="button"
                    onClick={() => navigate(`/academy/unit/${course.id}/${next_unit.id}`)}
                    className="inline-flex items-center justify-center gap-2 border-2 border-text-main bg-primary px-5 py-3 font-mono text-[11px] font-bold uppercase tracking-widest text-primary-foreground shadow-[2px_2px_0_0_#000] transition-all hover:-translate-y-0.5 hover:-translate-x-0.5 hover:shadow-[4px_4px_0_0_#000] dark:shadow-[2px_2px_0_0_rgba(0,0,0,0.45)] dark:hover:shadow-[4px_4px_0_0_rgba(0,0,0,0.65)]"
                  >
                    {text("Next unit", "Unit tiếp theo")}
                    <ChevronRight className="h-4 w-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => navigate(`/academy/course/${course.id}`)}
                    className="inline-flex items-center justify-center gap-2 border-2 border-text-main bg-surface px-5 py-3 font-mono text-[11px] font-bold uppercase tracking-widest text-text-main shadow-[2px_2px_0_0_#000] transition-all hover:-translate-y-0.5 hover:-translate-x-0.5 hover:text-primary hover:shadow-[4px_4px_0_0_#000] dark:shadow-[2px_2px_0_0_rgba(0,0,0,0.45)] dark:hover:shadow-[4px_4px_0_0_rgba(0,0,0,0.65)]"
                  >
                    {text("Back to course", "Quay lại course")}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </AcademyPanel>

      <div className="grid gap-4 md:grid-cols-2">
        <UnitNavCard
          label={text("Previous", "Trước")}
          unit={previous_unit}
          href={
            previous_unit
              ? `/academy/unit/${course.id}/${previous_unit.id}`
              : "#"
          }
          disabled={!previous_unit}
        />
        <UnitNavCard
          label={text("Next", "Tiếp")}
          unit={next_unit}
          href={next_unit ? `/academy/unit/${course.id}/${next_unit.id}` : "#"}
          disabled={!next_unit}
          align="right"
        />
      </div>
    </AcademyPage>
  );
}

function WorkspaceSwitch({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`border-2 px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-widest transition-all ${
        active
          ? "border-text-main bg-primary text-primary-foreground shadow-[2px_2px_0_0_#000] dark:shadow-[2px_2px_0_0_rgba(0,0,0,0.45)]"
          : "border-text-main bg-main-bg text-text-muted hover:-translate-y-0.5 hover:-translate-x-0.5 hover:text-primary hover:shadow-[2px_2px_0_0_#000] dark:hover:shadow-[2px_2px_0_0_rgba(0,0,0,0.45)]"
      }`}
    >
      {label}
    </button>
  );
}

function UnitNavCard({
  label,
  unit,
  href,
  disabled,
  align = "left",
}: {
  label: string;
  unit: AcademyV2UnitSummary | null;
  href: string;
  disabled: boolean;
  align?: "left" | "right";
}) {
  const { text } = useLocale();

  if (disabled) {
    return (
      <AcademyPanel className="opacity-60">
        <div className={align === "right" ? "text-left md:text-right" : "text-left"}>
          <div className="font-mono text-[10px] font-bold uppercase tracking-[0.24em] text-text-muted">
            {label}
          </div>
          <div className="mt-2 font-display text-2xl font-black uppercase tracking-tighter text-text-muted">
            {text("End of route", "Hết lộ trình")}
          </div>
        </div>
      </AcademyPanel>
    );
  }

  return (
    <Link to={href} className="block h-full">
      <AcademyPanel interactive className="group h-full">
        <div className={align === "right" ? "text-left md:text-right" : "text-left"}>
          <div className="font-mono text-[10px] font-bold uppercase tracking-[0.24em] text-text-muted">
            {label}
          </div>
          <div className="mt-2 font-display text-2xl font-black uppercase tracking-tighter text-text-main transition-colors group-hover:text-primary">
            {unit?.title}
          </div>
          <div className="mt-3 inline-flex border border-border-main bg-main-bg px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-widest text-text-muted shadow-sm">
            {unit?.section === "practice"
              ? text("Interactive lab", "Lab tương tác")
              : text("Theory lesson", "Bài lý thuyết")}
          </div>
        </div>
      </AcademyPanel>
    </Link>
  );
}

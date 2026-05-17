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

function practiceModeText(unit: AcademyV2UnitDetail) {
  if (unit.language === "rust" && unit.deployable) {
    return "Solana Lab";
  }

  if (unit.language === "rust") {
    return "Rust Lab";
  }

  if (unit.language === "typescript") {
    return "TypeScript Challenge";
  }

  return "Practice Challenge";
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
          setError(err.message || "Không thể tải bài học.");
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
  }, [authToken, courseId, reloadNonce, unitId, walletAddress]);

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
          title="Failed to load unit"
          description={error || "The unit could not be loaded. Please try again later."}
          action={
            <div className="flex flex-wrap justify-center gap-4">
              <button
                type="button"
                onClick={() => setReloadNonce((value) => value + 1)}
                className="inline-flex items-center justify-center gap-2 border-2 border-text-main bg-primary px-5 py-3 font-mono text-[11px] font-bold uppercase tracking-widest text-primary-foreground shadow-[2px_2px_0_0_#000] transition-all hover:-translate-y-0.5 hover:-translate-x-0.5 hover:shadow-[4px_4px_0_0_#000] dark:shadow-[2px_2px_0_0_rgba(0,0,0,0.45)] dark:hover:shadow-[4px_4px_0_0_rgba(0,0,0,0.65)]"
              >
                Retry
              </button>
              <Link
                to="/academy"
                className="inline-flex items-center justify-center border-2 border-text-main bg-surface px-5 py-3 font-mono text-[11px] font-bold uppercase tracking-widest text-text-main shadow-[2px_2px_0_0_#000] transition-all hover:-translate-y-0.5 hover:-translate-x-0.5 hover:text-primary hover:shadow-[4px_4px_0_0_#000] dark:shadow-[2px_2px_0_0_rgba(0,0,0,0.45)] dark:hover:shadow-[4px_4px_0_0_rgba(0,0,0,0.65)]"
              >
                Back to Academy
              </Link>
            </div>
          }
        />
      </AcademyPage>
    );
  }

  const { course, unit, previous_unit, next_unit, unit_index, total_units } =
    unitData;
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
        ? "Rust compiler sandbox"
        : "Guided Rust validator"
      : runnerSupported
        ? "Browser challenge runner"
        : "Practice workspace");
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
          ? "The runner is still executing. Wait for the result before completing this unit."
          : "Pass all public and hidden checks before marking this challenge complete.",
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
          ? "Progress synchronized. This study session counted toward your streak."
          : `Progress synchronized. Stay at least ${ACADEMY_STREAK_COMPLETION_SECONDS} seconds in a new unit if you want it to count toward your streak.`
        : "Progress saved locally. The system will attempt to sync next time this lab is loaded.",
    );
  }

  function copyDraft() {
    if (!draftCode) {
      return;
    }

    void navigator.clipboard.writeText(draftCode);
    setNotice("Your code has been copied to clipboard.");
  }

  function resetDraft() {
    setDraftCode(unit.code || "");
    setNotice("Successfully restored the original code of this lab.");
  }

  function applySolutionToEditor() {
    if (!unit.solution) {
      return;
    }

    setDraftCode(unit.solution);
    setActiveWorkspaceTab("editor");
    setGuidanceOpen(false);
    setPendingEditorReveal(true);
    setNotice("Reference solution loaded into the editor.");
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
        runtimeLabel: "Browser Challenge",
        message: runnerError?.message || "An error occurred during execution.",
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
        <AcademyBackLink to={`/academy/course/${course.id}`} label="Back to Course" />

        <AcademyPanel tone="primary" padding="p-5 sm:p-6">
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-3">
              <AcademyBadge tone="primary">{course.title}</AcademyBadge>
              <AcademyBadge tone="muted">{unit.module_title}</AcademyBadge>
              <AcademyBadge tone="muted">
                {isPractice ? practiceModeText(unit) : "Theory Lesson"}
              </AcademyBadge>
              {unitDone ? (
                <AcademyBadge tone="success">
                  <CheckCircle2 className="h-3 w-3" />
                  Completed
                </AcademyBadge>
              ) : null}
            </div>

            <div className="space-y-3">
              <h1 className="font-display text-4xl font-black uppercase tracking-tighter text-text-main sm:text-5xl lg:text-6xl">
                {unit.title}
              </h1>
              <p className="max-w-3xl font-mono text-sm leading-relaxed text-text-muted">
                {isPractice
                  ? "Read the brief, work inside the editor, run checks when you need signal, then submit only after the hidden checks pass."
                  : "Study the material, follow the structure on the page, and mark the unit complete once the concepts are clear."}
              </p>
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <AcademyCompactStat
                label="Course"
                value={`${courseProgressPercent}%`}
                meta={`${completedCount}/${course.total_unit_count} units`}
              />
              <AcademyCompactStat
                label="Module"
                value={`${currentModulePercent}%`}
                meta={`${currentModuleCompleted}/${currentModuleUnits.length} units`}
              />
              <AcademyCompactStat
                label="Sequence"
                value={`${unit_index + 1}/${total_units}`}
                meta="Current step"
              />
              <AcademyCompactStat
                label="Reward"
                value={unit.xp_reward ? `${unit.xp_reward} XP` : "Guided"}
                meta={isPractice ? "Interactive lab" : "Theory lesson"}
                valueClassName="text-primary"
              />
            </div>

            <div className="grid gap-3 lg:grid-cols-2">
              <div>
                <div className="mb-2 flex items-center justify-between font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-text-muted">
                  <span>Course progress</span>
                  <span>{courseProgressPercent}%</span>
                </div>
                <AcademyProgressBar value={courseProgressPercent} />
              </div>
              <div>
                <div className="mb-2 flex items-center justify-between font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-text-muted">
                  <span>Module progress</span>
                  <span>{currentModulePercent}%</span>
                </div>
                <AcademyProgressBar
                  value={currentModulePercent}
                  fillClassName="bg-emerald-500"
                />
              </div>
            </div>

            <div className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-text-muted">
              Session {studySeconds}s • streak counts after{" "}
              {ACADEMY_STREAK_COMPLETION_SECONDS}s on a new unit or{" "}
              {ACADEMY_STREAK_REVIEW_SECONDS}s when reopening a completed one
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
                  eyebrow="Challenge Brief"
                  title="Instructions"
                  description="Visible checks, core requirements, and the exact brief for the current lab."
                  className="mb-0"
                />
                <div className="grid gap-3 md:grid-cols-2">
                  <AcademyStat
                    label="Public requirements"
                    value={publicTests.length}
                    meta="Explicit checks you can reason about"
                    className="px-4 py-3"
                    valueClassName="text-2xl"
                  />
                  <AcademyStat
                    label="Hidden requirements"
                    value={hiddenTests.length}
                    meta="Validated by the runner"
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
                          Public check {index + 1}
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
                        label="Editor"
                        active={activeWorkspaceTab === "editor"}
                        onClick={() => setActiveWorkspaceTab("editor")}
                      />
                      {runnerSupported ? (
                        <WorkspaceSwitch
                          label="Results"
                          active={activeWorkspaceTab === "results"}
                          onClick={() => setActiveWorkspaceTab("results")}
                        />
                      ) : null}
                      {(unit.hints.length > 0 || unit.solution) && (
                        <WorkspaceSwitch
                          label={
                            guidanceOpen
                              ? "Hide guidance"
                              : unit.hints.length > 0
                                ? `Hints ${visibleHints.length}/${unit.hints.length}`
                                : "Guidance"
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
                          {runLoading ? "Running..." : "Run checks"}
                        </button>
                      ) : null}

                      <button
                        type="button"
                        onClick={copyDraft}
                        className="inline-flex items-center justify-center gap-2 border-2 border-text-main bg-surface px-4 py-2.5 font-mono text-[10px] font-bold uppercase tracking-widest text-text-main shadow-[2px_2px_0_0_#000] transition-all hover:-translate-y-0.5 hover:-translate-x-0.5 hover:text-primary hover:shadow-[4px_4px_0_0_#000] dark:shadow-[2px_2px_0_0_rgba(0,0,0,0.45)] dark:hover:shadow-[4px_4px_0_0_rgba(0,0,0,0.65)]"
                      >
                        <ClipboardCopy className="h-3.5 w-3.5" />
                        Copy
                      </button>

                      <button
                        type="button"
                        onClick={resetDraft}
                        className="inline-flex items-center justify-center gap-2 border-2 border-text-main bg-surface px-4 py-2.5 font-mono text-[10px] font-bold uppercase tracking-widest text-text-main shadow-[2px_2px_0_0_#000] transition-all hover:-translate-y-0.5 hover:-translate-x-0.5 hover:text-primary hover:shadow-[4px_4px_0_0_#000] dark:shadow-[2px_2px_0_0_rgba(0,0,0,0.45)] dark:hover:shadow-[4px_4px_0_0_rgba(0,0,0,0.65)]"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        Reset
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <AcademyBadge tone="muted">{runtimeLabel}</AcademyBadge>
                    {draftDirty ? <AcademyBadge tone="warning">Modified</AcademyBadge> : null}
                    {runReport && !runReportIsFresh ? (
                      <AcademyBadge tone="warning">Needs rerun</AcademyBadge>
                    ) : null}
                    {activeRunReport?.allPassed ? (
                      <AcademyBadge tone="success">All checks passed</AcademyBadge>
                    ) : null}
                    {runnerSupported ? (
                      <AcademyBadge tone="muted">Shortcut: Ctrl/Cmd + Enter</AcademyBadge>
                    ) : null}
                    {unit.hints.length > 0 ? (
                      <AcademyBadge tone="warning">
                        {visibleHints.length}/{unit.hints.length} hints visible
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
                              Guidance
                            </div>
                            <p className="mt-2 max-w-2xl font-mono text-sm leading-relaxed text-text-muted">
                              Reveal hints progressively. Reference solution stays behind a separate unlock and can be sent back into the editor when needed.
                            </p>
                          </div>
                          <div className="grid gap-3 sm:grid-cols-2">
                            <AcademyCompactStat
                              label="Hints"
                              value={`${visibleHints.length}/${unit.hints.length}`}
                              meta="Revealed so far"
                              className="min-w-[140px]"
                            />
                            <AcademyCompactStat
                              label="Solution"
                              value={solutionUnlocked ? "Open" : "Locked"}
                              meta="Reference state"
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
                                  Hint {index + 1}
                                </div>
                                <div className="markdown-body prose-dsuc">
                                  {renderMd(hint)}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="border border-border-main bg-main-bg/60 px-4 py-4 font-mono text-sm text-text-muted shadow-sm">
                            No hints have been revealed yet.
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
                              Reveal next hint
                            </button>
                          ) : null}

                          {canUnlockSolution ? (
                            <button
                              type="button"
                              onClick={() => setSolutionUnlocked(true)}
                              className="inline-flex w-full items-center justify-center gap-2 border-2 border-text-main bg-surface px-5 py-3 font-mono text-[11px] font-bold uppercase tracking-widest text-text-main shadow-[2px_2px_0_0_#000] transition-all hover:-translate-y-0.5 hover:-translate-x-0.5 hover:text-primary hover:shadow-[4px_4px_0_0_#000] dark:shadow-[2px_2px_0_0_rgba(0,0,0,0.45)] dark:hover:shadow-[4px_4px_0_0_rgba(0,0,0,0.65)]"
                            >
                              <Sparkles className="h-4 w-4" />
                              Unlock reference solution
                            </button>
                          ) : null}
                        </div>

                        {solutionUnlocked && unit.solution ? (
                          <div className="space-y-4 border border-primary/20 bg-primary/8 px-4 py-4 shadow-sm">
                            <div className="font-mono text-[10px] font-bold uppercase tracking-widest text-primary">
                              Reference solution
                            </div>
                            <div className="markdown-body prose-dsuc">
                              {renderMd(unit.solution)}
                            </div>
                            <button
                              type="button"
                              onClick={applySolutionToEditor}
                              className="inline-flex w-full items-center justify-center gap-2 border-2 border-text-main bg-primary px-5 py-3 font-mono text-[11px] font-bold uppercase tracking-widest text-primary-foreground shadow-[2px_2px_0_0_#000] transition-all hover:-translate-y-0.5 hover:-translate-x-0.5 hover:shadow-[4px_4px_0_0_#000] dark:shadow-[2px_2px_0_0_rgba(0,0,0,0.45)] dark:hover:shadow-[4px_4px_0_0_rgba(0,0,0,0.65)]"
                            >
                              Apply solution to editor
                            </button>
                          </div>
                        ) : null}
                      </div>
                    ) : null}

                    <CodeEditorPane
                      value={draftCode}
                      onChange={setDraftCode}
                      language={unit.language || "text"}
                      placeholder="Start typing your solution here..."
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
                        No test results yet
                      </h3>
                      <p className="mt-3 max-w-md font-mono text-sm leading-relaxed text-text-muted">
                        Run your code to see public and hidden check results. This
                        view is the execution summary, not a second page buried inside the lab.
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="grid gap-3 md:grid-cols-4">
                        <AcademyStat
                          label="Passed"
                          value={`${runReport.passedCount}/${runReport.totalCount}`}
                          meta={runReportIsFresh ? "Latest run" : "Outdated after edits"}
                          className="px-4 py-3"
                          valueClassName={`text-2xl ${runReportIsFresh && runReport.allPassed ? "text-emerald-500" : ""}`}
                        />
                        <AcademyStat
                          label="Public"
                          value={`${runReport.visiblePassedCount}/${runReport.visibleTotalCount}`}
                          meta="Visible checks"
                          className="px-4 py-3"
                          valueClassName="text-2xl"
                        />
                        <AcademyStat
                          label="Hidden"
                          value={`${runReport.hiddenPassedCount}/${runReport.hiddenTotalCount}`}
                          meta="Private checks"
                          className="px-4 py-3"
                          valueClassName="text-2xl"
                        />
                        <AcademyStat
                          label="Entry point"
                          value={runReport.primaryFunction || "Unknown"}
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
                                ? "Ready to submit"
                                : "Checks failed"
                              : "Results outdated"}
                          </AcademyBadge>
                        </div>
                        <p className="mt-3 font-mono text-sm leading-relaxed text-text-main">
                          {runReportIsFresh
                            ? runReport.message
                            : "You changed the draft after the last execution. Run checks again to refresh the result summary."}
                        </p>
                      </div>

                      <div className="space-y-3">
                        <div className="font-mono text-[10px] font-bold uppercase tracking-widest text-text-muted">
                          Case details
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
                                        ? `Hidden ${index + 1}`
                                        : `Public ${index + 1}`}
                                    </AcademyBadge>
                                  </div>
                                  <div
                                    className={`font-mono text-[10px] font-bold uppercase tracking-widest ${
                                      caseItem.passed
                                        ? "text-emerald-600 dark:text-emerald-300"
                                        : "text-amber-700 dark:text-amber-300"
                                    }`}
                                  >
                                    {caseItem.passed ? "Passed" : "Needs work"}
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
                            The runner did not return structured case data for this
                            lab.
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
                  <AcademyBadge tone="muted">Challenge overview</AcademyBadge>
                  <h2 className="mt-4 font-display text-3xl font-black uppercase tracking-tighter text-text-main">
                    {practiceModeText(unit)}
                  </h2>
                  <p className="mt-3 font-mono text-sm leading-relaxed text-text-muted">
                    Visible checks first, hidden checks second, submit last.
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                  <AcademyStat
                    label="Public checks"
                    value={publicTests.length}
                    meta="Visible acceptance criteria"
                    className="px-4 py-3"
                    valueClassName="text-2xl"
                  />
                  <AcademyStat
                    label="Hidden checks"
                    value={hiddenTests.length}
                    meta="Validated on submit"
                    className="px-4 py-3"
                    valueClassName="text-2xl"
                  />
                  <AcademyStat
                    label="Hints"
                    value={unit.hints.length}
                    meta={`${visibleHints.length} revealed`}
                    className="px-4 py-3"
                    valueClassName="text-2xl"
                  />
                  <AcademyStat
                    label="Runtime"
                    value={runtimeLabel}
                    meta={draftDirty ? "Draft changed since last run" : "Draft matches last run"}
                    className="px-4 py-3"
                    valueClassName="text-base"
                  />
                </div>

                <div className="border border-border-main bg-main-bg/70 px-4 py-4 shadow-sm">
                  <div className="flex flex-wrap items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-widest text-text-muted">
                    <span className="inline-flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-primary" />
                      Workflow
                    </span>
                  </div>
                  <ol className="mt-3 space-y-2 font-mono text-sm leading-relaxed text-text-muted">
                    <li>1. Read the brief and visible checks.</li>
                    <li>2. Write or edit your solution in the workspace.</li>
                    <li>3. Run checks with <code>Ctrl/Cmd + Enter</code>.</li>
                    <li>4. Submit only after hidden checks pass.</li>
                  </ol>
                </div>
              </div>
            </AcademyPanel>

            <AcademyPanel>
              <div className="space-y-4">
                <AcademyBadge tone="muted">
                  {currentModule?.title || "Module"}
                </AcademyBadge>
                <div>
                  <div className="font-display text-2xl font-black uppercase tracking-tight text-text-main">
                    Module route
                  </div>
                  <p className="mt-2 font-mono text-sm leading-relaxed text-text-muted">
                    {currentModule
                      ? `${currentModuleCompleted}/${currentModuleUnits.length} lessons completed in this module.`
                      : "No module information available."}
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
                            {routeUnit.section === "practice" ? "Practice" : "Theory"}
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
                  <AcademyBadge tone="muted">Video lesson</AcademyBadge>
                  <h2 className="mt-3 font-display text-3xl font-black uppercase tracking-tighter text-text-main">
                    Watch tutorial
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
                  <AcademyBadge tone="muted">Lesson Notes</AcademyBadge>
                  <span className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-text-muted">
                    Main reading for this unit
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
                    <AcademyBadge tone="muted">Table of contents</AcademyBadge>
                    <span className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-text-muted">
                      Quick jumps
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
                  {currentModule?.title || "Module"}
                </AcademyBadge>
                <div>
                  <div className="font-display text-2xl font-black uppercase tracking-tight text-text-main">
                    Module route
                  </div>
                  <p className="mt-2 font-mono text-sm leading-relaxed text-text-muted">
                    {currentModule
                      ? `${currentModuleCompleted}/${currentModuleUnits.length} lessons completed in this module.`
                      : "No module information available."}
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
                            {routeUnit.section === "practice" ? "Practice" : "Theory"}
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
              {unitDone ? "Unit completed" : "Finish this unit"}
            </AcademyBadge>
            <h2 className="mt-4 font-display text-3xl font-black uppercase tracking-tighter text-text-main">
              {unitDone ? "Recorded successfully" : "Ready when the unit is truly done"}
            </h2>
            <p className="mt-3 max-w-2xl font-mono text-sm leading-relaxed text-text-muted">
              {unitDone
                ? "This unit is already marked complete. You can move on or review the material again."
                : isPractice
                  ? runnerSupported
                    ? "The submit action unlocks only after the latest run passes every public and hidden check."
                    : "Mark the unit complete when you have finished the lab."
                  : "Take a final pass over the material, then mark the theory unit complete."}
            </p>
          </div>

          <div className="flex flex-col items-start gap-3 lg:items-end">
            {!unitDone && completionBlocked ? (
              <AcademyBadge tone="warning">
                {runLoading ? "Running checks..." : "All checks must pass"}
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
                {isPractice ? "Submit lab" : "Mark complete"}
              </button>
            ) : (
              <div className="flex flex-col gap-3 sm:flex-row">
                {next_unit ? (
                  <button
                    type="button"
                    onClick={() => navigate(`/academy/unit/${course.id}/${next_unit.id}`)}
                    className="inline-flex items-center justify-center gap-2 border-2 border-text-main bg-primary px-5 py-3 font-mono text-[11px] font-bold uppercase tracking-widest text-primary-foreground shadow-[2px_2px_0_0_#000] transition-all hover:-translate-y-0.5 hover:-translate-x-0.5 hover:shadow-[4px_4px_0_0_#000] dark:shadow-[2px_2px_0_0_rgba(0,0,0,0.45)] dark:hover:shadow-[4px_4px_0_0_rgba(0,0,0,0.65)]"
                  >
                    Next unit
                    <ChevronRight className="h-4 w-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => navigate(`/academy/course/${course.id}`)}
                    className="inline-flex items-center justify-center gap-2 border-2 border-text-main bg-surface px-5 py-3 font-mono text-[11px] font-bold uppercase tracking-widest text-text-main shadow-[2px_2px_0_0_#000] transition-all hover:-translate-y-0.5 hover:-translate-x-0.5 hover:text-primary hover:shadow-[4px_4px_0_0_#000] dark:shadow-[2px_2px_0_0_rgba(0,0,0,0.45)] dark:hover:shadow-[4px_4px_0_0_rgba(0,0,0,0.65)]"
                  >
                    Back to course
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </AcademyPanel>

      <div className="grid gap-4 md:grid-cols-2">
        <UnitNavCard
          label="Previous"
          unit={previous_unit}
          href={
            previous_unit
              ? `/academy/unit/${course.id}/${previous_unit.id}`
              : "#"
          }
          disabled={!previous_unit}
        />
        <UnitNavCard
          label="Next"
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
  if (disabled) {
    return (
      <AcademyPanel className="opacity-60">
        <div className={align === "right" ? "text-left md:text-right" : "text-left"}>
          <div className="font-mono text-[10px] font-bold uppercase tracking-[0.24em] text-text-muted">
            {label}
          </div>
          <div className="mt-2 font-display text-2xl font-black uppercase tracking-tighter text-text-muted">
            End of route
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
            {unit?.section === "practice" ? "Interactive lab" : "Theory lesson"}
          </div>
        </div>
      </AcademyPanel>
    </Link>
  );
}

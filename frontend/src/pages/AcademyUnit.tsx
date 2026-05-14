import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  AlertTriangle,
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  ClipboardCopy,
  Code2,
  Flame,
  Lightbulb,
  LoaderCircle,
  Lock,
  Sparkles,
  TerminalSquare,
  Play,
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
import { CodeEditorPane, CodeSurface } from "@/components/academy/CodeSurface";
import { renderMd, slugifyMarkdownHeading } from "@/lib/academy/md";
import { fetchAcademyV2Unit } from "@/lib/academy/v2Api";
import { useAcademyProgressState } from "@/lib/academy/useAcademyProgress";
import {
  countCompletedAcademyV2CourseUnits,
  isAcademyV2UnitCompleted,
} from "@/lib/academy/v2Progress";
import { useStore } from "@/store/useStore";

type OutlineItem = {
  id: string;
  label: string;
  level: number;
};

type FlatUnit = AcademyV2UnitSummary & {
  moduleId: string;
  moduleTitle: string;
};

type WorkspaceTab = "editor" | "results" | "hints" | "solution";

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
    return "Thử thách TypeScript";
  }

  return "Thử thách thực hành";
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
  const [showHintsPanel, setShowHintsPanel] = useState(false);
  const [showSolutionPanel, setShowSolutionPanel] = useState(false);

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

  const previewUnit = unitData?.unit ?? null;
  const previewPracticeRunnable =
    !!previewUnit &&
    previewUnit.section === "practice" &&
    canRunAcademyChallenge(previewUnit);

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

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-[1400px] px-4 pb-20 pt-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-4">
          <div className="h-8 w-32 animate-pulse bg-surface" />
          <div className="h-16 w-3/4 animate-pulse bg-surface mt-2" />
          <div className="h-6 w-1/2 animate-pulse bg-surface mt-2" />
        </div>
        <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-6">
            <div className="h-96 w-full animate-pulse bg-surface" />
            <div className="h-64 w-full animate-pulse bg-surface" />
          </div>
          <div className="h-96 w-full animate-pulse bg-surface" />
        </div>
      </div>
    );
  }

  if (!unitData) {
    return (
      <div className="mx-auto mt-12 max-w-2xl bg-white p-12 text-center border-2 border-text-main shadow-[8px_8px_0_0_#000]">
        <div className="mb-6 mx-auto flex h-16 w-16 items-center justify-center bg-destructive/10 text-destructive border-2 border-destructive">
          <AlertTriangle className="h-8 w-8" />
        </div>
        <h1 className="font-heading text-3xl font-bold uppercase tracking-tight text-text-main mb-4">
          Failed to load unit
        </h1>
        <p className="mb-8 text-sm font-medium text-text-muted bg-surface p-4 border-2 border-border-main font-mono">
          {error || "The unit could not be loaded. Please try again later."}
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <button
            type="button"
            onClick={() => setReloadNonce((value) => value + 1)}
            className="inline-flex items-center gap-2 border-2 border-text-main bg-primary px-6 py-3 text-xs font-bold uppercase tracking-widest text-main-bg shadow-[4px_4px_0_0_#000] hover:-translate-y-1 hover:shadow-[8px_8px_0_0_#000] transition-all"
          >
            Retry
          </button>
          <Link
            to="/academy"
            className="inline-flex items-center gap-2 border-2 border-text-main bg-white px-6 py-3 text-xs font-bold uppercase tracking-widest text-text-main shadow-[4px_4px_0_0_#000] hover:-translate-y-1 hover:shadow-[8px_8px_0_0_#000] hover:bg-surface transition-all"
          >
            Back to Academy
          </Link>
        </div>
      </div>
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
  const unitDone = isAcademyV2UnitCompleted(
    progress.state.completedLessons,
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
        ? "Máy ảo biên dịch Rust"
        : "Trình xác thực mã Rust định hướng"
      : runnerSupported
        ? "Trình chạy thử thách trên trình duyệt"
        : "Không gian thực hành");
  const completedCount = countCompletedAcademyV2CourseUnits(
    progress.state.completedLessons,
    course.id,
  );
  const courseProgressPercent =
    course.total_unit_count > 0
      ? Math.round((completedCount / course.total_unit_count) * 100)
      : 0;
  const currentModuleCompleted = currentModule
    ? currentModuleUnits.filter((item) =>
        isAcademyV2UnitCompleted(
          progress.state.completedLessons,
          course.id,
          item.id,
        ),
      ).length
    : 0;
  const currentModulePercent =
    currentModuleUnits.length > 0
      ? Math.round((currentModuleCompleted / currentModuleUnits.length) * 100)
      : 0;

  async function handleComplete() {
    setNotice("");

    if (completionBlocked) {
      setNotice(
        runLoading
          ? "Hệ thống đang chạy bài kiểm tra. Vui lòng đợi kết quả trước khi hoàn thành."
          : "Hãy vượt qua tất cả các bài kiểm tra kể cả ẩn trước khi hoàn thành chặng này.",
      );
      return;
    }

    const saved = await progress.persistUnitCompletion(course.id, unit.id, {
      quizPassed: isPractice,
      xpAwarded: unit.xp_reward,
    });

    setNotice(
      saved
        ? "Progress synchronized. Practice session saved."
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
    } catch (error: any) {
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
        message: error?.message || "An error occurred during execution.",
        cases: [],
      });
      setLastRunSource(draftCode);
      setActiveWorkspaceTab("results");
    } finally {
      setRunLoading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-[1400px] px-4 pb-20 pt-8 sm:px-6 lg:px-8">
      {/* Top Bar / Hero */}
      <div className="mb-8 flex flex-col gap-4">
        <Link
          to={`/academy/course/${course.id}`}
          className="self-start inline-flex items-center gap-2 border-2 border-text-main bg-surface px-4 py-2 text-xs font-bold uppercase tracking-widest font-mono shadow-[2px_2px_0_0_#000] hover:-translate-y-0.5 hover:shadow-[4px_4px_0_0_#000] transition-all text-text-main"
        >
          <ArrowLeft className="w-4 h-4" strokeWidth={2} />
          BACK TO COURSE
        </Link>

        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-block border border-primary/20 bg-primary/10 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-primary">
              {course.title}
            </span>
            <span className="text-border-main text-xs font-bold">/</span>
            <span className="inline-block border border-border-main bg-surface px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-text-muted shadow-[2px_2px_0_0_#000]">
              {unit.module_title}
            </span>
            <span className="text-border-main text-xs font-bold">/</span>
            <span className="inline-block border border-border-main bg-surface px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-text-muted shadow-[2px_2px_0_0_#000]">
              {isPractice ? practiceModeText(unit) : "Lesson"}
            </span>
            {unitDone && (
              <span className="ml-auto inline-flex items-center gap-1 bg-emerald-500/10 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-emerald-600 shadow-[2px_2px_0_0_#000] border border-emerald-500/20">
                <CheckCircle2 className="h-3 w-3" />
                Completed
              </span>
            )}
          </div>

          <h1 className="mt-2 font-heading text-3xl font-bold tracking-tight text-text-main sm:text-4xl lg:text-5xl uppercase">
            {unit.title}
          </h1>
          <p className="mt-2 text-sm font-medium leading-relaxed text-text-muted sm:text-base max-w-3xl">
            {isPractice
              ? "Read the instructions carefully, write your solution in the editor, and pass all the hidden tests to complete this practical lab."
              : "Study the concepts and techniques in this unit. Take your time to understand the materials before moving on."}
          </p>
        </div>
      </div>

      {notice && (
        <div className="mb-6 flex items-center gap-3 border-2 border-primary bg-primary/5 px-4 py-3 text-sm font-mono font-medium text-primary shadow-[4px_4px_0_0_#000]">
          <TerminalSquare className="h-5 w-5 shrink-0" />
          {notice}
        </div>
      )}

      {isPractice && (
        <div className="flex w-full flex-col gap-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <SidebarPanel
              title="Lab Configuration"
              accent="bg-surface"
              headerText="text-text-main"
              footer={practiceModeText(unit)}
            >
              <div className="space-y-0">
                <ProfileRow
                  label="Test Cases"
                  value={String(unit.tests.length)}
                />
                <ProfileRow label="Hints" value={String(unit.hints.length)} />
                <ProfileRow label="Language" value={unit.language || "None"} />
                <ProfileRow
                  label="Build Type"
                  value={unit.build_type || "Standard"}
                />
              </div>
            </SidebarPanel>

            <SidebarPanel
              title={currentModule?.title || "Module"}
              accent="bg-surface"
              headerText="text-text-main"
              footer={
                currentModule
                  ? `${currentModuleCompleted}/${currentModuleUnits.length} lessons completed`
                  : "No module info"
              }
            >
              <div className="mt-4 flex flex-col gap-2 max-h-[160px] overflow-y-auto pr-2">
                {currentModuleUnits.map((routeUnit) => {
                  const done = isAcademyV2UnitCompleted(
                    progress.state.completedLessons,
                    course.id,
                    routeUnit.id,
                  );
                  const locked = isUnitLocked(
                    progress.state.completedLessons,
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
                      className={`flex w-full items-center gap-3 border-2 p-2 text-left transition-all ${
                        current
                          ? "border-primary bg-primary/5 shadow-[2px_2px_0_0_#000]"
                          : locked
                            ? "cursor-not-allowed border-text-main bg-main-bg opacity-60"
                            : done
                              ? "border-text-main bg-surface hover:bg-main-bg hover:shadow-[2px_2px_0_0_#000]"
                              : "border-text-main bg-surface hover:-translate-y-0.5 hover:border-primary/50 hover:bg-main-bg hover:shadow-[2px_2px_0_0_#000]"
                      }`}
                    >
                      <div
                        className={`flex h-6 w-6 shrink-0 items-center justify-center border-2 ${
                          current
                            ? "border-primary bg-primary text-main-bg shadow-[2px_2px_0_0_#000]"
                            : done
                              ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-600"
                              : locked
                                ? "border-text-main bg-surface text-text-muted"
                                : routeUnit.section === "practice"
                                  ? "border-text-main bg-surface text-text-main shadow-[2px_2px_0_0_#000]"
                                  : "border-text-main bg-surface text-text-main shadow-[2px_2px_0_0_#000]"
                        }`}
                      >
                        {locked ? (
                          <Lock className="h-3 w-3" strokeWidth={2} />
                        ) : done ? (
                          <CheckCircle2 className="h-3 w-3" strokeWidth={2} />
                        ) : routeUnit.section === "practice" ? (
                          <Code2 className="h-3 w-3" strokeWidth={2} />
                        ) : (
                          <BookOpen className="h-3 w-3" strokeWidth={2} />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div
                          className={`truncate text-[10px] font-bold uppercase tracking-wider ${current ? "text-primary" : "text-text-main"}`}
                        >
                          {routeUnit.title}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </SidebarPanel>
          </div>

          <section className="flex flex-col border-2 border-text-main bg-surface shadow-[8px_8px_0_0_#000]">
            <div className="mb-4 flex items-center gap-2 border-b-2 border-text-main bg-main-bg pb-3 p-5">
              <div className="border-2 border-text-main bg-primary text-main-bg px-2 py-1 text-[10px] font-bold uppercase tracking-widest shadow-[2px_2px_0_0_#000]">
                Lab Instructions
              </div>
            </div>
            <div className="p-5 pt-0">
              <div className="markdown-body prose-dsuc max-w-none">
                {renderMd(unit.content_md)}
              </div>
            </div>
          </section>
        </div>
      )}

      <div
        className={`flex flex-col gap-8 ${isPractice ? "xl:grid xl:grid-cols-[minmax(0,1fr)_400px]" : "xl:grid xl:grid-cols-[minmax(0,1fr)_320px]"}`}
      >
        <div
          className={`flex min-w-0 flex-col gap-8 ${isPractice ? "flex-1 xl:order-1" : ""}`}
        >
          {!isPractice ? (
            <>
              {embedUrl && (
                <section className="overflow-hidden border-2 border-text-main bg-surface shadow-[4px_4px_0_0_#000]">
                  <div className="border-b-2 border-text-main bg-main-bg px-6 py-4">
                    <div className="mb-1 text-[10px] font-bold uppercase tracking-widest text-text-muted">
                      Video Lesson
                    </div>
                    <h2 className="font-heading text-xl font-black uppercase tracking-tight text-text-main">
                      Watch Tutorial
                    </h2>
                  </div>
                  <div className="relative w-full bg-main-bg pb-[56.25%] text-text-main">
                    <iframe
                      src={embedUrl}
                      title={unit.title}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="absolute inset-0 h-full w-full"
                    />
                  </div>
                </section>
              )}

              <section className="bg-surface border-2 border-text-main p-6 sm:p-10 shadow-[4px_4px_0_0_#000]">
                <div className="mb-8 flex flex-col gap-4 border-b-2 border-border-main pb-8 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <div className="mb-2 inline-block border-2 border-text-main bg-primary px-2 py-1 text-xs font-bold uppercase tracking-widest text-main-bg shadow-[2px_2px_0_0_#000]">
                      Theory Lesson
                    </div>
                    <h2 className="font-heading text-3xl font-black uppercase tracking-tighter text-text-main sm:text-4xl mt-4">
                      Course Content
                    </h2>
                  </div>
                  {outline.length > 0 && (
                    <div className="shrink-0 border-2 border-text-main bg-main-bg px-4 py-2 text-xs font-bold uppercase tracking-widest text-text-main shadow-[2px_2px_0_0_#000]">
                      {outline.length} sections
                    </div>
                  )}
                </div>
                <div className="markdown-body prose-dsuc max-w-[800px]">
                  {renderMd(unit.content_md)}
                </div>
              </section>
            </>
          ) : (
            <>
              <section
                className={`relative flex flex-col border-2 border-text-main bg-main-bg shadow-[8px_8px_0_0_#000] xl:sticky xl:top-24 xl:self-start ${
                  activeWorkspaceTab === "editor" ||
                  activeWorkspaceTab === "results"
                    ? "xl:max-h-[calc(100vh-120px)] overflow-hidden"
                    : ""
                }`}
              >
                <div className="flex flex-col justify-between gap-4 border-b-2 border-text-main bg-surface px-4 py-3 sm:flex-row sm:items-center">
                  <div className="flex flex-wrap items-center gap-2">
                    <LabTabButton
                      label="Editor"
                      active={activeWorkspaceTab === "editor"}
                      onClick={() => setActiveWorkspaceTab("editor")}
                    />
                    {runnerSupported && (
                      <LabTabButton
                        label="Results"
                        active={activeWorkspaceTab === "results"}
                        onClick={() => setActiveWorkspaceTab("results")}
                      />
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 mt-2 sm:mt-0">
                    {unit.hints && unit.hints.length > 0 && (
                      <button
                        onClick={() => setShowHintsPanel(!showHintsPanel)}
                        className={`border-2 border-text-main px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest transition-all ${
                          showHintsPanel
                            ? "bg-amber-400 text-amber-900 shadow-[2px_2px_0_0_#f59e0b] -translate-y-0.5"
                            : "bg-surface text-text-main hover:bg-main-bg hover:-translate-y-0.5 shadow-none hover:shadow-[2px_2px_0_0_#000]"
                        }`}
                      >
                        {showHintsPanel ? "Hide Hints" : "Show Hints"}
                      </button>
                    )}
                    <button
                      onClick={() => setShowSolutionPanel(!showSolutionPanel)}
                      className={`border-2 border-text-main px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest transition-all ${
                        showSolutionPanel
                          ? "bg-primary text-primary-foreground shadow-[2px_2px_0_0_#000] -translate-y-0.5"
                          : "bg-surface text-text-main hover:bg-main-bg hover:-translate-y-0.5 shadow-none hover:shadow-[2px_2px_0_0_#000]"
                      }`}
                    >
                      {showSolutionPanel ? "Hide Solution" : "Solution"}
                    </button>
                  </div>

                  <div className="flex items-center gap-3">
                    {runnerSupported && (
                      <button
                        type="button"
                        onClick={() => void handleRunChallenge()}
                        disabled={runLoading}
                        className="inline-flex items-center gap-2 border-2 border-text-main bg-primary px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-main-bg shadow-[2px_2px_0_0_#000] transition-all hover:-translate-y-0.5 hover:-translate-x-0.5 hover:shadow-[4px_4px_0_0_#000] disabled:pointer-events-none disabled:opacity-50"
                      >
                        {runLoading ? (
                          <LoaderCircle className="h-4 w-4 animate-spin" />
                        ) : (
                          <Play className="h-3 w-3 fill-current" />
                        )}
                        {runLoading ? "Running..." : "Run Checks"}
                      </button>
                    )}

                    {activeWorkspaceTab === "editor" && (
                      <div className="flex items-center border-2 border-text-main bg-main-bg shadow-[2px_2px_0_0_#000]">
                        <button
                          type="button"
                          onClick={copyDraft}
                          className="p-1.5 text-text-muted transition-colors hover:bg-surface hover:text-text-main"
                          title="Copy Code"
                        >
                          <ClipboardCopy className="h-4 w-4" />
                        </button>
                        <div className="w-0.5 h-6 bg-text-main"></div>
                        <button
                          type="button"
                          onClick={resetDraft}
                          className="p-1.5 text-text-muted transition-colors hover:bg-surface hover:text-destructive"
                          title="Reset Code"
                        >
                          <AlertTriangle className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 overflow-x-auto bg-surface px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-text-muted border-b-2 border-text-main">
                  {runnerSupported ? (
                    <span className="flex items-center gap-1 border border-text-main bg-main-bg px-2 py-0.5 text-text-main shadow-[1px_1px_0_0_#000]">
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                      {runtimeLabel} Ready
                    </span>
                  ) : (
                    <span className="border border-text-main bg-main-bg px-2 py-0.5 text-text-main shadow-[1px_1px_0_0_#000]">
                      Interactive Workspace
                    </span>
                  )}

                  {draftDirty && (
                    <span className="border border-text-main bg-main-bg px-2 py-0.5 text-text-main shadow-[1px_1px_0_0_#000]">
                      Modified
                    </span>
                  )}
                  {runReport && !runReportIsFresh && (
                    <span className="border border-text-main bg-amber-500/10 text-amber-700 px-2 py-0.5 shadow-[1px_1px_0_0_#000]">
                      Needs Rerun
                    </span>
                  )}
                  {activeRunReport?.allPassed && (
                    <span className="border border-text-main bg-primary px-2 py-0.5 text-main-bg shadow-[1px_1px_0_0_#000]">
                      All Passed
                    </span>
                  )}
                </div>

                <div className="flex-1 flex flex-col min-h-[600px] overflow-auto">
                  {activeWorkspaceTab === "editor" && (
                    <div className="flex-1 flex flex-col h-full min-h-[700px]">
                      <CodeEditorPane
                        value={draftCode}
                        onChange={setDraftCode}
                        language={unit.language || "text"}
                        placeholder="Start typing your solution here..."
                      />
                    </div>
                  )}

                  {activeWorkspaceTab === "results" && runnerSupported && (
                    <div className="flex-1 flex flex-col min-h-[700px]">
                      {!runReport ? (
                        <div className="flex flex-col flex-1 items-center justify-center p-12 text-center bg-surface">
                          <div className="mb-4 flex h-16 w-16 items-center justify-center border-2 border-text-main bg-white shadow-[4px_4px_0_0_#000]">
                            <TerminalSquare
                              className="h-8 w-8 text-text-muted"
                              strokeWidth={2}
                            />
                          </div>
                          <h3 className="mb-2 font-heading text-xl font-bold uppercase text-text-main">
                            No Test Results Yet
                          </h3>
                          <p className="max-w-sm text-sm font-medium text-text-muted">
                            Run your code to see the test results for public and
                            hidden test cases.
                          </p>
                        </div>
                      ) : (
                        <div className="flex-1 p-6 bg-main-bg">
                          <div className="mb-6 flex items-center justify-between gap-4 border-b border-border-main pb-4">
                            <div className="text-sm font-bold uppercase tracking-widest text-text-main">
                              Execution Results
                            </div>
                            <span
                              className={`border px-2 py-1 text-[10px] font-bold uppercase tracking-widest shadow-[2px_2px_0_0_#000] ${
                                runReportIsFresh
                                  ? runReport.allPassed
                                    ? "border-emerald-500 bg-emerald-500/10 text-emerald-600"
                                    : "border-destructive bg-destructive/10 text-destructive"
                                  : "border-amber-500 bg-amber-500/10 text-amber-700"
                              }`}
                            >
                              {runReportIsFresh
                                ? runReport.allPassed
                                  ? "All Passed"
                                  : "Failed"
                                : "Needs Rerun"}
                            </span>
                          </div>

                          <p className="mb-6 text-sm font-mono leading-relaxed text-text-muted bg-main-bg p-4 border-2 border-text-main shadow-[2px_2px_0_0_#000]">
                            {runReportIsFresh
                              ? runReport.message
                              : "You have modified the code since the last run. Please run the checks again to see updated results."}
                          </p>

                          <div className="mb-6 grid grid-cols-2 gap-4">
                            <div className="border-2 border-text-main bg-main-bg p-4 shadow-[2px_2px_0_0_#000]">
                              <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-text-muted border-b border-text-main pb-2">
                                Passed Tests
                              </div>
                              <div
                                className={`font-heading text-3xl font-black mt-2 ${runReport.allPassed ? "text-emerald-500" : "text-text-main"}`}
                              >
                                {runReport.passedCount}{" "}
                                <span className="text-xl text-text-muted font-bold">
                                  / {runReport.totalCount}
                                </span>
                              </div>
                            </div>
                            <div className="border-2 border-text-main bg-main-bg p-4 shadow-[2px_2px_0_0_#000]">
                              <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-text-muted border-b border-text-main pb-2">
                                Primary Function
                              </div>
                              <div className="mt-3 truncate font-mono text-sm font-bold text-primary">
                                {runReport.primaryFunction || "Unknown"}
                              </div>
                            </div>
                          </div>

                          <div className="space-y-4">
                            <div className="text-xs font-bold uppercase tracking-widest text-text-main">
                              Test Case Details
                            </div>
                            {(runReport.cases || []).length > 0 ? (
                              runReport.cases.map((caseItem, index) => (
                                <div
                                  key={caseItem.id}
                                  className={`border-2 p-4 shadow-[4px_4px_0_0_#000] transition-all ${
                                    caseItem.passed
                                      ? "border-emerald-500 bg-emerald-500/5 text-emerald-600"
                                      : "border-destructive bg-destructive/5 text-destructive"
                                  }`}
                                >
                                  <div className="mb-3 flex items-center justify-between gap-4 border-b border-inherit/30 pb-2">
                                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest flex-1">
                                      {caseItem.passed ? (
                                        <div className="bg-emerald-500/20 p-1 text-emerald-600 border-2 border-emerald-500">
                                          <CheckCircle2
                                            className="h-3 w-3"
                                            strokeWidth={3}
                                          />
                                        </div>
                                      ) : (
                                        <div className="bg-destructive/20 p-1 text-destructive border-2 border-destructive">
                                          <AlertTriangle
                                            className="h-3 w-3"
                                            strokeWidth={3}
                                          />
                                        </div>
                                      )}
                                      {caseItem.hidden
                                        ? `Hidden Test ${index + 1}`
                                        : `Public Test ${index + 1}`}
                                    </div>
                                  </div>
                                  <div className="text-sm font-medium leading-relaxed font-mono">
                                    {caseItem.description}
                                  </div>
                                  {caseItem.error && (
                                    <div className="mt-4">
                                      <CodeSurface
                                        code={caseItem.error}
                                        language="text"
                                        label="error"
                                        maxHeightClass="max-h-[180px]"
                                      />
                                    </div>
                                  )}
                                </div>
                              ))
                            ) : (
                              <div className="border-2 border-dashed border-text-main bg-surface p-4 text-center font-mono text-sm text-text-muted">
                                The runner did not return structured results for
                                this lab.
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

              </section>

              {/* Hints and Solution have been moved to the right column */}
            </>
          )}
        </div>

        <aside
          className={`space-y-8 ${isPractice ? "flex flex-col gap-6 xl:order-2" : "xl:sticky xl:top-24 xl:self-start"}`}
        >
          {!isPractice && outline.length > 0 && (
            <SidebarPanel
              title="Table of Contents"
              accent="bg-surface"
              headerText="text-text-main"
              footer={`${outline.length} sections`}
            >
              <div className="relative ml-2 space-y-3 py-2 pl-4">
                <div className="absolute top-0 bottom-0 left-[3px] w-px bg-border-main" />
                {outline.map((item) => (
                  <a
                    key={item.id}
                    href={`#${item.id}`}
                    className={`relative block py-1 text-sm font-medium text-text-muted transition-colors hover:text-primary before:absolute before:left-[-21px] before:top-[12px] before:h-2 before:w-2 before:rounded-full before:border before:border-border-main before:bg-white hover:before:border-primary ${
                      item.level > 2 ? "pl-4" : "pl-0"
                    }`}
                  >
                    {item.label}
                  </a>
                ))}
              </div>
            </SidebarPanel>
          )}

          {!isPractice && outline.length === 0 && (
            <SidebarPanel
              title="Lab Configuration"
              accent="bg-surface"
              headerText="text-text-main"
              footer={practiceModeText(unit)}
            >
              <div className="space-y-0">
                <ProfileRow
                  label="Test Cases"
                  value={String(unit.tests.length)}
                />
                <ProfileRow label="Hints" value={String(unit.hints.length)} />
                <ProfileRow label="Language" value={unit.language || "None"} />
                <ProfileRow
                  label="Build Type"
                  value={unit.build_type || "Standard"}
                />
              </div>
            </SidebarPanel>
          )}

          {!isPractice && (
            <SidebarPanel
            title={currentModule?.title || "Module"}
            accent="bg-surface"
            headerText="text-text-main"
            footer={
              currentModule
                ? `${currentModuleCompleted}/${currentModuleUnits.length} lessons completed`
                : "No module info"
            }
          >
            <div className="mt-4 space-y-3">
              {currentModuleUnits.map((routeUnit) => {
                const done = isAcademyV2UnitCompleted(
                  progress.state.completedLessons,
                  course.id,
                  routeUnit.id,
                );
                const locked = isUnitLocked(
                  progress.state.completedLessons,
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
                    className={`flex w-full items-center gap-3 border-2 p-3 text-left transition-all ${
                      current
                        ? "border-primary bg-primary/5 shadow-[2px_2px_0_0_#000]"
                        : locked
                          ? "cursor-not-allowed border-text-main bg-main-bg opacity-60"
                          : done
                            ? "border-text-main bg-surface hover:bg-main-bg hover:shadow-[2px_2px_0_0_#000]"
                            : "border-text-main bg-surface hover:-translate-y-0.5 hover:border-primary/50 hover:bg-main-bg hover:shadow-[2px_2px_0_0_#000]"
                    }`}
                  >
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center border-2 ${
                        current
                          ? "border-primary bg-primary text-main-bg shadow-[2px_2px_0_0_#000]"
                          : done
                            ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-600"
                            : locked
                              ? "border-text-main bg-surface text-text-muted"
                              : routeUnit.section === "practice"
                                ? "border-text-main bg-surface text-text-main shadow-[2px_2px_0_0_#000]"
                                : "border-text-main bg-surface text-text-main shadow-[2px_2px_0_0_#000]"
                      }`}
                    >
                      {locked ? (
                        <Lock className="h-4 w-4" strokeWidth={2} />
                      ) : done ? (
                        <CheckCircle2 className="h-4 w-4" strokeWidth={2} />
                      ) : routeUnit.section === "practice" ? (
                        <Code2 className="h-4 w-4" strokeWidth={2} />
                      ) : (
                        <BookOpen className="h-4 w-4" strokeWidth={2} />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div
                        className={`truncate text-xs font-bold uppercase tracking-wider ${current ? "text-primary" : "text-text-main"}`}
                      >
                        {routeUnit.title}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </SidebarPanel>
          )}

          {isPractice && showHintsPanel && unit.hints && unit.hints.length > 0 && (
            <SidebarPanel
              title="Hints"
              accent="bg-surface"
              headerText="text-text-main"
            >
              <div className="space-y-4 font-mono text-sm max-h-[400px] overflow-y-auto">
                {unit.hints.map((hint, i) => (
                  <div key={i} className="border-l-4 border-amber-500 pl-4 py-1">
                    <span className="font-bold uppercase text-[10px] text-amber-700 block mb-1">Hint {i + 1}</span>
                    <div className="markdown-body bg-transparent">
                      {renderMd(hint)}
                    </div>
                  </div>
                ))}
              </div>
            </SidebarPanel>
          )}

          {isPractice && showSolutionPanel && unit.solution && (
            <SidebarPanel
              title="Solution"
              accent="bg-surface"
              headerText="text-text-main"
            >
              <div className="font-mono text-sm space-y-4">
                <div className="markdown-body bg-transparent">
                  {renderMd(unit.solution)}
                </div>
                <button
                  type="button"
                  onClick={() => setDraftCode(unit.solution!)}
                  className="mt-4 border-2 border-emerald-600 bg-emerald-500 text-white px-4 py-2 text-xs font-bold uppercase tracking-widest shadow-[2px_2px_0_0_#059669] hover:-translate-y-0.5 hover:shadow-[4px_4px_0_0_#059669] transition-all w-full"
                >
                  Apply Solution
                </button>
              </div>
            </SidebarPanel>
          )}
        </aside>
      </div>

      <div className="mt-8 flex flex-col md:flex-row items-center justify-between gap-6 border-2 border-text-main bg-surface p-6 shadow-[4px_4px_0_0_#000]">
        <div className="flex-1 text-center md:text-left">
          <h3 className="font-heading text-xl font-black uppercase tracking-tight text-text-main">
            {unitDone ? "Unit Completed" : "Finish This Unit"}
          </h3>
          <p className="max-w-md text-sm font-mono text-text-muted mt-2">
            {unitDone
              ? "Great job! You have finished this unit."
              : isPractice
                ? runnerSupported
                  ? "Pass all tests to unlock the Complete button."
                  : "Click complete below when you are ready."
                : "Take a moment to absorb the material before marking complete."}
          </p>
        </div>

        <div className="flex flex-col items-center md:items-end gap-3">
          {!unitDone && completionBlocked && (
            <div className="flex items-center gap-2 border-2 border-amber-500 bg-amber-400/20 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-amber-900 shadow-[2px_2px_0_0_#f59e0b]">
              <AlertTriangle className="h-3 w-3" strokeWidth={3} />
              {runLoading ? "Running tests..." : "All tests must pass"}
            </div>
          )}

          {!unitDone ? (
            <button
              type="button"
              onClick={() => void handleComplete()}
              disabled={completionBlocked || runLoading}
              className="flex items-center gap-2 border-2 border-text-main bg-primary px-6 py-3 text-sm font-black uppercase tracking-widest text-main-bg shadow-[2px_2px_0_0_#000] transition-all hover:-translate-y-0.5 hover:-translate-x-0.5 hover:shadow-[4px_4px_0_0_#000] disabled:pointer-events-none disabled:opacity-50 disabled:grayscale"
            >
              <CheckCircle2 className="h-4 w-4" strokeWidth={3} />
              {isPractice ? "Submit Lab" : "Mark Complete"}
            </button>
          ) : (
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="flex items-center gap-2 border-2 border-text-main bg-emerald-500/10 px-4 py-2 text-xs font-black uppercase tracking-widest text-emerald-600 shadow-[2px_2px_0_0_#000]">
                <CheckCircle2 className="h-4 w-4" strokeWidth={3} />
                Recorded
              </div>
              {next_unit ? (
                <button
                  type="button"
                  onClick={() =>
                    navigate(`/academy/unit/${course.id}/${next_unit.id}`)
                  }
                  className="flex items-center gap-2 border-2 border-text-main bg-primary px-4 py-2 text-xs font-black uppercase tracking-widest text-main-bg shadow-[2px_2px_0_0_#000] transition-all hover:-translate-y-0.5 hover:-translate-x-0.5 hover:shadow-[4px_4px_0_0_#000]"
                >
                  Next Unit
                  <ChevronRight className="h-4 w-4" strokeWidth={3} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => navigate(`/academy/course/${course.id}`)}
                  className="flex items-center gap-2 border-2 border-text-main bg-main-bg px-4 py-2 text-xs font-black uppercase tracking-widest text-text-main shadow-[2px_2px_0_0_#000] transition-all hover:-translate-y-0.5 hover:-translate-x-0.5 hover:shadow-[4px_4px_0_0_#000] hover:bg-surface"
                >
                  Back to Course
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="mt-8 mb-20 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-t-2 border-text-main pt-6">
        <NavUnitLink
          label="Previous"
          unit={previous_unit}
          href={
            previous_unit
              ? `/academy/unit/${course.id}/${previous_unit.id}`
              : "#"
          }
          disabled={!previous_unit}
          align="left"
        />
        <NavUnitLink
          label="Next"
          unit={next_unit}
          href={next_unit ? `/academy/unit/${course.id}/${next_unit.id}` : "#"}
          disabled={!next_unit}
          align="right"
        />
      </div>
    </div>
  );
}

function SidebarPanel({
  title,
  accent,
  headerText,
  footer,
  children,
}: {
  title: string;
  accent: string;
  headerText: string;
  footer?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`border-2 border-text-main p-6 shadow-[4px_4px_0_0_#000] ${accent}`}
    >
      <div
        className={`mb-4 border-b-2 border-text-main pb-4 text-xs font-black uppercase tracking-widest ${headerText}`}
      >
        {title}
      </div>
      <div>{children}</div>
      {footer && (
        <div
          className={`mt-6 border-t-2 border-text-main pt-4 text-[10px] font-black uppercase tracking-widest ${headerText}`}
        >
          {footer}
        </div>
      )}
    </div>
  );
}

function LabTabButton({
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
      className={`relative px-4 py-2 text-xs font-bold uppercase tracking-widest transition-all ${
        active
          ? "bg-surface text-text-main shadow-[2px_2px_0_0_#000] border-2 border-text-main translate-x-[-1px] translate-y-[-1px]"
          : "bg-main-bg border-2 border-transparent text-text-muted hover:bg-surface/50 hover:text-text-main"
      }`}
    >
      {label}
    </button>
  );
}

function ProfileRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b-2 border-text-main py-3 last:border-b-0 border-dashed">
      <div className="text-[10px] font-bold uppercase tracking-widest text-text-muted">
        {label}
      </div>
      <div className="text-sm font-bold text-text-main">{value}</div>
    </div>
  );
}

function NavUnitLink({
  label,
  unit,
  href,
  disabled,
  align,
}: {
  label: string;
  unit: AcademyV2UnitSummary | null;
  href: string;
  disabled: boolean;
  align: "left" | "right";
}) {
  if (disabled) {
    return (
      <div
        className={`flex w-full flex-col border-2 border-border-main bg-main-bg p-4 opacity-60 shadow-[2px_2px_0_0_var(--border-main)] sm:w-[48%] ${align === "right" ? "items-start sm:items-end sm:text-right" : "items-start"}`}
      >
        <div className="mb-1 text-[10px] font-bold uppercase tracking-widest text-text-muted">
          {label}
        </div>
        <div className="font-heading text-lg font-bold text-text-muted">
          End of Route
        </div>
      </div>
    );
  }

  return (
    <Link
      to={href}
      className={`group flex w-full flex-col border-2 border-text-main bg-main-bg p-4 shadow-[2px_2px_0_0_#000] transition-all hover:bg-surface hover:-translate-y-0.5 hover:-translate-x-0.5 hover:shadow-[4px_4px_0_0_#000] sm:w-[48%] ${align === "right" ? "items-start sm:items-end sm:text-right" : "items-start"}`}
    >
      <div className="mb-1 text-[10px] font-bold uppercase tracking-widest text-text-muted transition-colors group-hover:text-primary">
        {label}
      </div>
      <div className="max-w-full truncate font-heading text-lg font-bold text-text-main transition-colors group-hover:text-primary">
        {unit?.title}
      </div>
      <div className="mt-2 inline-block border-2 border-text-main bg-main-bg px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-text-main shadow-[2px_2px_0_0_#000]">
        {unit?.section === "practice" ? "Interactive Lab" : "Theory Lesson"}
      </div>
    </Link>
  );
}

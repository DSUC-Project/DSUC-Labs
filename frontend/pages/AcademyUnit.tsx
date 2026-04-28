import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
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
} from 'lucide-react';

import type {
  AcademyV2CourseDetail,
  AcademyV2UnitDetail,
  AcademyV2UnitSummary,
} from '@/types';
import {
  canRunAcademyChallenge,
  runAcademyChallenge,
  type ChallengeRunReport,
} from '@/lib/academy/challengeRunner';
import { renderMd, slugifyMarkdownHeading } from '@/lib/academy/md';
import { fetchAcademyV2Unit } from '@/lib/academy/v2Api';
import { useAcademyProgressState } from '@/lib/academy/useAcademyProgress';
import {
  countCompletedAcademyV2CourseUnits,
  isAcademyV2UnitCompleted,
} from '@/lib/academy/v2Progress';
import { useStore } from '@/store/useStore';

type OutlineItem = {
  id: string;
  label: string;
  level: number;
};

type FlatUnit = AcademyV2UnitSummary & {
  moduleId: string;
  moduleTitle: string;
};

type WorkspaceTab = 'editor' | 'results' | 'solution';

function getEmbedUrl(url: string): string | null {
  try {
    const value = new URL(url);
    if (value.hostname === 'www.youtube.com' || value.hostname === 'youtube.com') {
      const video = value.searchParams.get('v');
      return video ? `https://www.youtube.com/embed/${video}` : null;
    }
    if (value.hostname === 'youtu.be') {
      const video = value.pathname.slice(1);
      return video ? `https://www.youtube.com/embed/${video}` : null;
    }
    if (value.hostname === 'vimeo.com' || value.hostname === 'www.vimeo.com') {
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
  return String(md || '')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => /^#{1,4}\s+/.test(line))
    .map((line) => {
      const match = /^(#{1,4})\s+(.+)$/.exec(line);
      if (!match) {
        return null;
      }

      const label = match[2].replace(/[`*_~]/g, '').trim();
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
      }))
  );
}

function isUnitLocked(
  completedLessons: Record<string, boolean>,
  courseId: string,
  flatUnits: FlatUnit[],
  unitId: string
) {
  const flatIndex = flatUnits.findIndex((item) => item.id === unitId);
  const previous = flatIndex > 0 ? flatUnits[flatIndex - 1] : null;

  return previous ? !isAcademyV2UnitCompleted(completedLessons, courseId, previous.id) : false;
}

function practiceModeText(unit: AcademyV2UnitDetail) {
  if (unit.language === 'rust' && unit.deployable) {
    return 'Buildable Solana lab';
  }

  if (unit.language === 'rust') {
    return 'Rust practice lab';
  }

  if (unit.language === 'typescript') {
    return 'TypeScript challenge';
  }

  return 'Practice challenge';
}

export function AcademyUnit() {
  const { courseId = '', unitId = '' } = useParams<{ courseId: string; unitId: string }>();
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
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [draftCode, setDraftCode] = useState('');
  const [revealedHints, setRevealedHints] = useState(1);
  const [reloadNonce, setReloadNonce] = useState(0);
  const [runLoading, setRunLoading] = useState(false);
  const [runReport, setRunReport] = useState<ChallengeRunReport | null>(null);
  const [lastRunSource, setLastRunSource] = useState('');
  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState<WorkspaceTab>('editor');
  const [solutionUnlocked, setSolutionUnlocked] = useState(false);

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

    async function loadUnit() {
      setLoading(true);
      setError('');
      setNotice('');
      try {
        const base = (import.meta as any).env.VITE_API_BASE_URL || '';
        const result = await fetchAcademyV2Unit(
          base,
          courseId,
          unitId,
          authToken || localStorage.getItem('auth_token'),
          walletAddress
        );

        if (!cancelled) {
          setUnitData(result);
          const nextDraft =
            typeof window !== 'undefined'
              ? window.localStorage.getItem(draftKey(courseId, unitId)) || result.unit.code || ''
              : result.unit.code || '';
          setDraftCode(nextDraft);
          setRevealedHints(1);
          setRunReport(null);
          setLastRunSource('');
          setActiveWorkspaceTab('editor');
          setSolutionUnlocked(false);
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err.message || 'Failed to load academy unit.');
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
    if (!unitData || typeof window === 'undefined') {
      return;
    }

    window.localStorage.setItem(draftKey(courseId, unitId), draftCode);
  }, [courseId, draftCode, unitData, unitId]);

  const previewUnit = unitData?.unit ?? null;
  const previewPracticeRunnable =
    !!previewUnit &&
    previewUnit.section === 'practice' &&
    canRunAcademyChallenge(previewUnit);

  useEffect(() => {
    if (!previewUnit || previewUnit.section !== 'practice' || !previewPracticeRunnable || typeof window === 'undefined') {
      return;
    }

    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
        event.preventDefault();
        void handleRunChallenge();
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [draftCode, previewPracticeRunnable, previewUnit?.id]);

  if (loading) {
    return (
      <div className="space-y-6 pb-20">
        <div className="h-64 animate-pulse rounded-[30px] border border-white/10 bg-surface/55" />
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-5">
            <div className="h-96 animate-pulse rounded-[28px] border border-white/10 bg-surface/55" />
            <div className="h-64 animate-pulse rounded-[28px] border border-white/10 bg-surface/55" />
          </div>
          <div className="h-96 animate-pulse rounded-[28px] border border-white/10 bg-surface/55" />
        </div>
      </div>
    );
  }

  if (!unitData) {
    return (
      <div className="rounded-[26px] border border-red-400/35 bg-red-500/10 p-6 text-red-100">
        <div className="text-[10px] font-mono uppercase tracking-[0.28em] text-red-200/80">
          Unit unavailable
        </div>
        <h1 className="mt-3 font-display text-2xl font-black uppercase tracking-[0.1em] text-white">
          Could not open this unit
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-red-100/85">
          {error || 'This unit could not be loaded from the Academy route right now.'}
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

  const { course, unit, previous_unit, next_unit, unit_index, total_units } = unitData;
  const embedUrl = unit.video_url ? getEmbedUrl(unit.video_url) : null;
  const flatCourseUnits = flattenCourseUnits(course);
  const currentModule =
    course.modules.find((module) => module.id === unit.module_id) || null;
  const currentModuleUnits = currentModule
    ? [...currentModule.learn_units, ...currentModule.practice_units].sort(
        (left, right) => Number(left.order || 0) - Number(right.order || 0)
      )
    : [];
  const outline = extractMarkdownOutline(unit.content_md);
  const unitDone = isAcademyV2UnitCompleted(progress.state.completedLessons, course.id, unit.id);
  const isPractice = unit.section === 'practice';
  const draftDirty = draftCode !== (unit.code || '');
  const runnerSupported = isPractice && canRunAcademyChallenge(unit);
  const runReportIsFresh = !!runReport && lastRunSource === draftCode;
  const activeRunReport = runReportIsFresh ? runReport : null;
  const completionBlocked = runnerSupported && !unitDone && (!runReportIsFresh || !runReport?.allPassed);
  const runtimeLabel = activeRunReport?.runtimeLabel
    || runReport?.runtimeLabel
    || (unit.language === 'rust'
      ? unit.build_type === 'buildable'
        ? 'Rust scaffold verifier'
        : 'Guided Rust verifier'
      : runnerSupported
        ? 'Browser challenge runner'
        : 'Guided workspace');
  const completedCount = countCompletedAcademyV2CourseUnits(progress.state.completedLessons, course.id);
  const courseProgressPercent =
    course.total_unit_count > 0 ? Math.round((completedCount / course.total_unit_count) * 100) : 0;
  const currentModuleCompleted = currentModule
    ? currentModuleUnits.filter((item) =>
        isAcademyV2UnitCompleted(progress.state.completedLessons, course.id, item.id)
      ).length
    : 0;
  const currentModulePercent =
    currentModuleUnits.length > 0
      ? Math.round((currentModuleCompleted / currentModuleUnits.length) * 100)
      : 0;

  async function handleComplete() {
    setNotice('');

    if (completionBlocked) {
      setNotice(
        runLoading
          ? 'The current checks are still running. Wait for the result before marking this practice complete.'
          : 'Run the current checks and pass every visible + hidden check before completing this practice.'
      );
      return;
    }

    const saved = await progress.persistUnitCompletion(course.id, unit.id, {
      quizPassed: isPractice,
      xpAwarded: unit.xp_reward,
    });

    setNotice(
      saved
        ? 'Progress synced. Activity was recorded for this unit.'
        : 'Local progress saved. Database sync will retry the next time this unit loads.'
    );
  }

  function copyDraft() {
    if (!draftCode) {
      return;
    }

    void navigator.clipboard.writeText(draftCode);
    setNotice('Draft copied to clipboard.');
  }

  function resetDraft() {
    setDraftCode(unit.code || '');
    setNotice('Starter code restored for this practice unit.');
  }

  async function handleRunChallenge() {
    if (!isPractice || !runnerSupported) {
      return;
    }

    setNotice('');
    setRunLoading(true);
    try {
      const report = await runAcademyChallenge({ ...unit, code: draftCode });
      setRunReport(report);
      setLastRunSource(draftCode);
      setActiveWorkspaceTab('results');
      setNotice(report.message);
    } catch (error: any) {
      setRunReport({
        supported: true,
        allPassed: false,
        passedCount: 0,
        totalCount: unit.tests.length,
        visiblePassedCount: 0,
        visibleTotalCount: unit.tests.filter((item) => item.hidden !== true).length,
        hiddenPassedCount: 0,
        hiddenTotalCount: unit.tests.filter((item) => item.hidden === true).length,
        primaryFunction: null,
        runtimeLabel: 'Browser challenge runner',
        message: error?.message || 'Challenge execution failed.',
        cases: [],
      });
      setLastRunSource(draftCode);
      setActiveWorkspaceTab('results');
      setNotice(error?.message || 'Challenge execution failed.');
    } finally {
      setRunLoading(false);
    }
  }

  const reportCasesById = new Map((activeRunReport?.cases || []).map((item) => [item.id, item]));
  const visibleTests = unit.tests.filter((item) => item.hidden !== true);

  return (
    <div className="space-y-6 pb-20">
      <section className="relative overflow-hidden rounded-[30px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(41,121,255,0.2),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(255,214,0,0.14),transparent_28%),linear-gradient(180deg,rgba(5,10,20,0.95),rgba(7,11,18,0.8))] p-6 shadow-[0_22px_60px_rgba(0,0,0,0.2)] sm:p-8">
        <div className="absolute inset-0 bg-grid-pattern bg-[size:30px_30px] opacity-[0.08]" />
        <div className="relative grid gap-6 lg:grid-cols-[minmax(0,1.3fr)_320px] lg:items-end">
          <div className="space-y-5">
            <Link
              to={`/academy/course/${course.id}`}
              className="inline-flex min-h-10 items-center gap-2 rounded-full border border-white/10 bg-black/20 px-4 text-[11px] font-mono font-bold uppercase tracking-[0.24em] text-cyber-blue transition-colors hover:border-cyber-blue/45 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyber-yellow/80 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Back to course
            </Link>

            <div className="flex flex-wrap gap-2">
              <span className="inline-flex min-h-10 items-center rounded-full border border-cyber-blue/20 bg-cyber-blue/10 px-4 text-[10px] font-mono font-bold uppercase tracking-[0.26em] text-cyber-blue">
                {course.title}
              </span>
              <span className="inline-flex min-h-10 items-center rounded-full border border-white/10 bg-white/5 px-4 text-[10px] font-mono uppercase tracking-[0.22em] text-white/56">
                {unit.module_title}
              </span>
              <span className="inline-flex min-h-10 items-center rounded-full border border-cyber-yellow/20 bg-cyber-yellow/10 px-4 text-[10px] font-mono uppercase tracking-[0.22em] text-cyber-yellow">
                {isPractice ? practiceModeText(unit) : 'Learn unit'}
              </span>
            </div>

            <div>
              <div className="text-[10px] font-mono uppercase tracking-[0.28em] text-white/38">
                Step {Math.max(1, unit_index + 1)} of {total_units}
              </div>
              <h1 className="mt-3 max-w-5xl font-display text-3xl font-black uppercase tracking-[0.1em] text-white sm:text-5xl">
                {unit.title}
              </h1>
              <p className="mt-4 max-w-4xl text-base leading-8 text-white/72">
                {isPractice
                  ? 'Read the brief, work in the editor, then pass the checks before you submit this lab.'
                  : 'Read this lesson cleanly, then move straight into the next practice step while the context is fresh.'}
              </p>
            </div>
          </div>

          <div className="rounded-[26px] border border-cyber-yellow/20 bg-black/22 p-5 shadow-[0_0_24px_rgba(255,214,0,0.07)] backdrop-blur-sm">
            <div className="text-[10px] font-mono uppercase tracking-[0.28em] text-cyber-yellow/78">
              Unit status
            </div>
            <div className="mt-3 font-display text-2xl font-black uppercase tracking-[0.1em] text-white">
              {unitDone ? 'Marked complete' : isPractice ? 'Ready for submission' : 'In progress'}
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <HeroStat
                icon={<BookOpen className="h-4 w-4" aria-hidden="true" />}
                label="Course progress"
                value={`${courseProgressPercent}%`}
              />
              <HeroStat
                icon={<Flame className="h-4 w-4" aria-hidden="true" />}
                label="XP"
                value={String(unit.xp_reward)}
              />
            </div>
          </div>
        </div>
      </section>

      {notice && (
        <div className="rounded-[20px] border border-cyber-blue/30 bg-cyber-blue/10 px-5 py-4 text-sm leading-7 text-cyber-blue">
          {notice}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          {!isPractice ? (
            <>
              {embedUrl && (
                <section className="overflow-hidden rounded-[28px] border border-white/10 bg-surface/72 shadow-[0_18px_50px_rgba(0,0,0,0.18)]">
                  <div className="border-b border-white/8 px-6 py-5">
                    <div className="text-[10px] font-mono uppercase tracking-[0.28em] text-cyber-blue/75">
                      Lesson media
                    </div>
                    <h2 className="mt-2 font-display text-2xl font-black uppercase tracking-[0.1em] text-white">
                      Watch the walkthrough
                    </h2>
                  </div>
                  <div className="relative w-full pb-[56.25%]">
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

              <section className="rounded-[30px] border border-white/10 bg-surface/72 p-6 shadow-[0_18px_50px_rgba(0,0,0,0.18)] sm:p-8 lg:p-10">
                <div className="flex flex-col gap-4 border-b border-white/8 pb-6 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <div className="text-[10px] font-mono uppercase tracking-[0.28em] text-cyber-blue/75">
                      Learn unit
                    </div>
                    <h2 className="mt-2 font-display text-3xl font-black uppercase tracking-[0.1em] text-white">
                      Reading shell
                    </h2>
                  </div>
                  {outline.length > 0 && (
                    <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-mono uppercase tracking-[0.18em] text-white/48">
                      {outline.length} sections in this lesson
                    </div>
                  )}
                </div>
                <div className="mt-8 max-w-none text-base font-sans leading-relaxed sm:text-lg">
                  {renderMd(unit.content_md)}
                </div>
              </section>

              {next_unit && (
                <section className="rounded-[26px] border border-cyber-yellow/20 bg-[linear-gradient(180deg,rgba(255,214,0,0.08),rgba(255,255,255,0.02))] p-5 shadow-[0_14px_36px_rgba(255,214,0,0.06)]">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <div className="text-[10px] font-mono uppercase tracking-[0.26em] text-cyber-yellow/78">
                        Next in route
                      </div>
                      <h3 className="mt-2 font-display text-2xl font-black uppercase tracking-[0.08em] text-white">
                        {next_unit.title}
                      </h3>
                      <p className="mt-3 max-w-2xl text-sm leading-7 text-white/66">
                        {next_unit.section === 'practice'
                          ? 'The next step moves straight into application while this lesson is still fresh.'
                          : 'Continue the concept route before jumping into the next lab.'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => navigate(`/academy/unit/${course.id}/${next_unit.id}`)}
                      className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-cyber-yellow px-5 text-sm font-display font-bold uppercase tracking-[0.16em] text-black transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyber-yellow/80 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                    >
                      Open next unit
                      <ChevronRight className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                </section>
              )}
            </>
          ) : (
            <>
              <section className="rounded-[28px] border border-white/10 bg-surface/72 p-6 shadow-[0_18px_50px_rgba(0,0,0,0.18)]">
                <div className="flex flex-col gap-4 border-b border-white/8 pb-6 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <div className="text-[10px] font-mono uppercase tracking-[0.28em] text-cyber-yellow/75">
                      Practice brief
                    </div>
                    <h2 className="mt-2 font-display text-3xl font-black uppercase tracking-[0.1em] text-white">
                      What you need to build
                    </h2>
                  </div>
                  <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-mono uppercase tracking-[0.18em] text-white/48">
                    {practiceModeText(unit)}
                  </div>
                </div>
                <div className="mt-8 max-w-none text-base font-sans leading-relaxed sm:text-lg">
                  {renderMd(unit.content_md)}
                </div>
              </section>

              <section className="rounded-[28px] border border-white/10 bg-surface/72 p-6 shadow-[0_18px_50px_rgba(0,0,0,0.18)]">
                <div className="flex flex-col gap-4 border-b border-white/8 pb-6 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <div className="text-[10px] font-mono uppercase tracking-[0.28em] text-cyber-blue/75">
                      Challenge checks
                    </div>
                    <h2 className="mt-2 font-display text-3xl font-black uppercase tracking-[0.1em] text-white">
                      Tests and hints
                    </h2>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {runnerSupported && (
                      <button
                        type="button"
                        onClick={() => void handleRunChallenge()}
                        disabled={runLoading}
                        className="inline-flex min-h-10 items-center gap-2 rounded-full bg-cyber-yellow px-4 text-[11px] font-display font-bold uppercase tracking-[0.16em] text-black transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyber-yellow/80 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                      >
                        {runLoading ? (
                          <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
                        ) : (
                          <TerminalSquare className="h-4 w-4" aria-hidden="true" />
                        )}
                        {runLoading ? 'Running checks' : 'Run checks'}
                      </button>
                    )}
                    <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-mono uppercase tracking-[0.18em] text-white/48">
                      {unit.tests.length} tests / {unit.hints.length} hints
                    </div>
                  </div>
                </div>

                {runnerSupported ? (
                  <div
                    className={`mt-6 rounded-[22px] border px-5 py-4 ${
                      runReportIsFresh && runReport?.allPassed
                        ? 'border-emerald-400/28 bg-emerald-500/10'
                        : runReport
                          ? 'border-amber-300/24 bg-amber-500/10'
                          : 'border-cyber-blue/20 bg-cyber-blue/8'
                    }`}
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-white/52">
                          {runtimeLabel}
                        </div>
                        <div className="mt-2 font-display text-xl font-black uppercase tracking-[0.08em] text-white">
                          {activeRunReport?.allPassed
                            ? 'All checks passed'
                            : runReport && !runReportIsFresh
                              ? 'Draft changed after the last run'
                              : activeRunReport
                              ? 'Checks still failing'
                              : 'Run the challenge before submitting'}
                        </div>
                        <p className="mt-2 text-sm leading-7 text-white/64">
                          {runReport && !runReportIsFresh
                            ? 'The editor content changed after the last run. Re-run the browser checks so the result matches the current draft.'
                            : activeRunReport
                              ? activeRunReport.message
                            : runnerSupported
                              ? 'Completion stays locked until the current draft passes every visible and hidden check for this lab.'
                              : 'This practice unit does not expose a runnable verifier yet.'}
                        </p>
                      </div>
                      <div className="grid min-w-[200px] grid-cols-2 gap-3">
                        <HeroStat
                          icon={<CheckCircle2 className="h-4 w-4" aria-hidden="true" />}
                          label="Visible checks"
                          value={
                            activeRunReport
                              ? `${activeRunReport.visiblePassedCount}/${activeRunReport.visibleTotalCount}`
                              : `0/${visibleTests.length}`
                          }
                        />
                        <HeroStat
                          icon={<Sparkles className="h-4 w-4" aria-hidden="true" />}
                          label="Hidden checks"
                          value={
                            activeRunReport
                              ? `${activeRunReport.hiddenPassedCount}/${activeRunReport.hiddenTotalCount}`
                              : `0/${unit.tests.length - visibleTests.length}`
                          }
                        />
                      </div>
                    </div>
                    {runReport && !runReportIsFresh && (
                        <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-amber-300/30 bg-black/18 px-4 py-2 text-[11px] font-mono uppercase tracking-[0.18em] text-amber-100/88">
                          <AlertTriangle className="h-4 w-4" aria-hidden="true" />
                        Draft changed since the last run. Execute the verifier again before completion.
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="mt-6 rounded-[22px] border border-white/10 bg-white/4 px-5 py-4 text-sm leading-7 text-white/62">
                    {unit.language === 'rust'
                      ? 'This is a guided Rust lab. The browser runner is not enabled for Rust yet, so use the brief, hints, and starter code as a structured practice lane for now.'
                      : 'This practice unit does not expose an executable browser runner yet. You can still work through it with the brief, hints, and starter code.'}
                  </div>
                )}

                <div className="mt-6 space-y-3">
                  {unit.tests.length > 0 ? (
                    visibleTests.map((test, index) => {
                      const caseResult = reportCasesById.get(test.id);
                      const statusTone =
                        activeRunReport
                          ? caseResult?.passed
                            ? 'border-emerald-400/28 bg-emerald-500/10'
                            : 'border-red-400/26 bg-red-500/10'
                          : 'border-white/10 bg-black/18';
                      const badgeTone =
                        activeRunReport
                          ? caseResult?.passed
                            ? 'border-emerald-300/30 bg-emerald-400/10 text-emerald-100'
                            : 'border-red-300/30 bg-red-400/10 text-red-100'
                          : 'border-white/10 bg-white/5 text-white/48';

                      return (
                      <div
                        key={test.id}
                        className={`rounded-[18px] border p-4 text-sm leading-7 text-white/68 ${statusTone}`}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="text-[10px] font-mono uppercase tracking-[0.22em] text-cyber-blue/75">
                            Test {index + 1}
                          </div>
                          <div
                            className={`rounded-full border px-3 py-1 text-[10px] font-mono uppercase tracking-[0.18em] ${badgeTone}`}
                          >
                            {activeRunReport
                              ? caseResult?.passed
                                ? 'Passed'
                                : 'Failed'
                              : 'Not run'}
                          </div>
                        </div>
                        <div className="mt-2 font-semibold text-white">{test.description}</div>
                        {test.input && (
                          <div className="mt-2 text-white/52">Input: {test.input}</div>
                        )}
                        {test.expectedOutput && (
                          <div className="mt-2 text-white/52">Expected: {test.expectedOutput}</div>
                        )}
                        {activeRunReport && caseResult?.error && (
                          <div className="mt-3 rounded-[14px] border border-red-400/24 bg-black/18 px-3 py-2 text-xs leading-6 text-red-100/82">
                            {caseResult.error}
                          </div>
                        )}
                      </div>
                    );
                    })
                  ) : (
                    <div className="rounded-[18px] border border-dashed border-white/12 bg-white/4 p-4 text-sm leading-7 text-white/48">
                      This practice unit has no structured test cases attached yet.
                    </div>
                  )}
                </div>

                {unit.tests.length > visibleTests.length && (
                  <div className="mt-4 rounded-[18px] border border-white/10 bg-black/18 p-4 text-sm leading-7 text-white/60">
                    <div className="text-[10px] font-mono uppercase tracking-[0.22em] text-cyber-yellow/76">
                      Hidden checks
                    </div>
                    <div className="mt-2">
                      {activeRunReport
                        ? `${activeRunReport.hiddenPassedCount}/${activeRunReport.hiddenTotalCount} hidden checks passed on the latest run.`
                        : `${unit.tests.length - visibleTests.length} hidden checks will run alongside the visible ones.`}
                    </div>
                  </div>
                )}

                {unit.hints.length > 0 && (
                  <div className="mt-6 rounded-[20px] border border-cyber-yellow/20 bg-cyber-yellow/8 p-5">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-2 text-cyber-yellow">
                        <Lightbulb className="h-4 w-4" aria-hidden="true" />
                        <span className="text-[10px] font-mono uppercase tracking-[0.22em]">Hints</span>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setRevealedHints((value) => Math.min(value + 1, unit.hints.length))
                        }
                        disabled={revealedHints >= unit.hints.length}
                        className="min-h-10 rounded-full border border-cyber-yellow/25 bg-cyber-yellow px-4 text-xs font-display font-bold uppercase tracking-[0.16em] text-black transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyber-yellow/80 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                      >
                        Reveal more
                      </button>
                    </div>
                    <div className="mt-4 space-y-3 text-sm leading-7 text-white/68">
                      {unit.hints.slice(0, revealedHints).map((hint, index) => (
                        <div key={`${hint}-${index}`} className="rounded-[16px] border border-white/8 bg-black/12 p-4">
                          {hint}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </section>

              <section className="rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(20,26,38,0.96),rgba(9,13,20,0.95))] p-5 shadow-[0_18px_50px_rgba(0,0,0,0.22)]">
                <div className="flex flex-col gap-4 border-b border-white/8 pb-5 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="text-[10px] font-mono uppercase tracking-[0.28em] text-cyber-blue/75">
                      Practice workspace
                    </div>
                    <h2 className="mt-2 font-display text-2xl font-black uppercase tracking-[0.1em] text-white">
                      Challenge workbench
                    </h2>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <LabTabButton
                      label="Editor"
                      active={activeWorkspaceTab === 'editor'}
                      onClick={() => setActiveWorkspaceTab('editor')}
                    />
                    <LabTabButton
                      label="Results"
                      active={activeWorkspaceTab === 'results'}
                      onClick={() => setActiveWorkspaceTab('results')}
                    />
                    <LabTabButton
                      label="Solution"
                      active={activeWorkspaceTab === 'solution'}
                      onClick={() => setActiveWorkspaceTab('solution')}
                    />
                    <button
                      type="button"
                      onClick={() => void handleRunChallenge()}
                      disabled={!runnerSupported || runLoading}
                      className="inline-flex min-h-10 items-center gap-2 rounded-full bg-cyber-yellow px-4 text-[11px] font-display font-bold uppercase tracking-[0.16em] text-black transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyber-yellow/80 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                    >
                      {runLoading ? (
                        <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
                      ) : (
                        <TerminalSquare className="h-4 w-4" aria-hidden="true" />
                      )}
                      Run
                    </button>
                    <button
                      type="button"
                      onClick={copyDraft}
                      className="inline-flex min-h-10 items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 text-[11px] font-mono font-bold uppercase tracking-[0.18em] text-white/72 transition-colors hover:border-cyber-blue/35 hover:text-cyber-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyber-yellow/80 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                    >
                      <ClipboardCopy className="h-4 w-4" aria-hidden="true" />
                      Copy
                    </button>
                    <button
                      type="button"
                      onClick={resetDraft}
                      className="inline-flex min-h-10 items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 text-[11px] font-mono font-bold uppercase tracking-[0.18em] text-white/72 transition-colors hover:border-cyber-yellow/35 hover:text-cyber-yellow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyber-yellow/80 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                    >
                      Reset
                    </button>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap items-center gap-2">
                  <StatusPill
                    tone={runnerSupported ? 'blue' : 'neutral'}
                    label={runnerSupported ? `${runtimeLabel} ready` : 'Guided workspace'}
                  />
                  <StatusPill
                    tone={draftDirty ? 'amber' : 'neutral'}
                    label={draftDirty ? 'Custom draft' : 'Starter draft'}
                  />
                  {runReport && !runReportIsFresh && (
                    <StatusPill tone="amber" label="Draft changed since last run" />
                  )}
                  {activeRunReport?.allPassed && <StatusPill tone="green" label="All checks passed" />}
                </div>

                {activeWorkspaceTab === 'editor' && (
                  <div className="mt-5">
                    <div className="rounded-t-[20px] border border-b-0 border-white/10 bg-[#0b0f17] px-5 py-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="text-[10px] font-mono uppercase tracking-[0.22em] text-white/48">
                          Starter code
                        </div>
                        <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-white/34">
                          {unit.language || 'text'}
                        </div>
                      </div>
                    </div>
                    <textarea
                      value={draftCode}
                      onChange={(event) => {
                        setDraftCode(event.target.value);
                      }}
                      spellCheck={false}
                      className="min-h-[540px] w-full rounded-b-[20px] border border-white/10 bg-[#0f141d] p-5 font-mono text-[13px] leading-7 text-slate-100 outline-none transition-colors placeholder:text-slate-500 selection:bg-cyber-blue/25 focus:border-cyber-yellow/30"
                    />
                  </div>
                )}

                {activeWorkspaceTab === 'results' && (
                  <div className="mt-5 rounded-[20px] border border-white/10 bg-[#0f141d] p-5">
                    {!runReport ? (
                      <div className="space-y-3 text-sm leading-7 text-white/62">
                        <div className="text-[10px] font-mono uppercase tracking-[0.22em] text-cyber-blue/75">
                          Run output
                        </div>
                        <div>
                          No run result yet. Execute the browser checks to inspect visible tests, hidden check counts, and error output for this draft.
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <div className="text-[10px] font-mono uppercase tracking-[0.22em] text-cyber-blue/75">
                              Latest run
                            </div>
                            <div className="mt-2 font-display text-xl font-black uppercase tracking-[0.08em] text-white">
                              {runReportIsFresh
                                ? runReport.allPassed
                                  ? 'Current draft passed'
                                  : 'Current draft still failing'
                                : 'Run result is stale'}
                            </div>
                            <p className="mt-2 text-sm leading-7 text-white/62">
                              {runReportIsFresh
                                ? runReport.message
                              : 'The editor changed after this run. Execute checks again to refresh the result for the current draft.'}
                            </p>
                          </div>
                          <div className="grid min-w-[220px] grid-cols-2 gap-3">
                            <HeroStat
                              icon={<CheckCircle2 className="h-4 w-4" aria-hidden="true" />}
                              label="Passed"
                              value={`${runReport.passedCount}/${runReport.totalCount}`}
                            />
                            <HeroStat
                              icon={<TerminalSquare className="h-4 w-4" aria-hidden="true" />}
                              label="Function"
                              value={runReport.primaryFunction || 'Unknown'}
                            />
                          </div>
                        </div>

                        <div className="rounded-[18px] border border-white/10 bg-white/4 p-4">
                          <div className="text-[10px] font-mono uppercase tracking-[0.22em] text-cyber-yellow/76">
                            Test output lane
                          </div>
                          <div className="mt-3 space-y-3">
                            {(runReport.cases || []).length > 0 ? (
                              runReport.cases.map((caseItem, index) => (
                                <div
                                  key={caseItem.id}
                                  className={`rounded-[16px] border px-4 py-3 ${
                                    caseItem.passed
                                      ? 'border-emerald-400/25 bg-emerald-500/10'
                                      : 'border-red-400/24 bg-red-500/10'
                                  }`}
                                >
                                  <div className="flex flex-wrap items-center justify-between gap-3">
                                    <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-white/46">
                                      {caseItem.hidden ? `Hidden check ${index + 1}` : `Visible check ${index + 1}`}
                                    </div>
                                    <div
                                      className={`rounded-full border px-3 py-1 text-[10px] font-mono uppercase tracking-[0.18em] ${
                                        caseItem.passed
                                          ? 'border-emerald-300/30 bg-emerald-400/10 text-emerald-100'
                                          : 'border-red-300/30 bg-red-400/10 text-red-100'
                                      }`}
                                    >
                                      {caseItem.passed ? 'Passed' : 'Failed'}
                                    </div>
                                  </div>
                                  <div className="mt-2 text-sm leading-7 text-white/72">
                                    {caseItem.description}
                                  </div>
                                  {caseItem.error && (
                                    <div className="mt-2 text-xs leading-6 text-red-100/84">
                                      {caseItem.error}
                                    </div>
                                  )}
                                </div>
                              ))
                            ) : (
                              <div className="text-sm leading-7 text-white/56">
                                The runner returned no structured case output for this unit.
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeWorkspaceTab === 'solution' && (
                  <div className="mt-5 rounded-[20px] border border-white/10 bg-[#0f141d] p-5">
                    {!solutionUnlocked ? (
                      <div className="space-y-4">
                        <div>
                          <div className="text-[10px] font-mono uppercase tracking-[0.22em] text-cyber-yellow/76">
                            Reference solution
                          </div>
                          <div className="mt-2 font-display text-xl font-black uppercase tracking-[0.08em] text-white">
                            Hidden to avoid spoilers
                          </div>
                          <p className="mt-2 text-sm leading-7 text-white/62">
                            Reveal the reference solution only when you want to compare approaches or unblock yourself after trying the challenge properly.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSolutionUnlocked(true)}
                          className="inline-flex min-h-11 items-center justify-center rounded-full border border-cyber-yellow/25 bg-cyber-yellow px-5 text-sm font-display font-bold uppercase tracking-[0.16em] text-black transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyber-yellow/80 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                        >
                          Reveal solution
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <div className="text-[10px] font-mono uppercase tracking-[0.22em] text-cyber-yellow/76">
                              Reference solution
                            </div>
                            <div className="mt-2 font-display text-xl font-black uppercase tracking-[0.08em] text-white">
                              Compare your approach
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              if (!unit.solution) {
                                return;
                              }

                              void navigator.clipboard.writeText(unit.solution);
                              setNotice('Reference solution copied to clipboard.');
                            }}
                            disabled={!unit.solution}
                            className="inline-flex min-h-10 items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 text-[11px] font-mono font-bold uppercase tracking-[0.18em] text-white/72 transition-colors hover:border-cyber-blue/35 hover:text-cyber-blue disabled:cursor-not-allowed disabled:opacity-45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyber-yellow/80 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                          >
                            <ClipboardCopy className="h-4 w-4" aria-hidden="true" />
                            Copy solution
                          </button>
                        </div>
                        {unit.solution ? (
                          <pre className="overflow-x-auto rounded-[18px] border border-white/10 bg-[#0b0f17] p-5 font-mono text-[13px] leading-7 text-slate-100">
                            <code>{unit.solution}</code>
                          </pre>
                        ) : (
                          <div className="rounded-[16px] border border-dashed border-white/12 bg-white/4 p-4 text-sm leading-7 text-white/56">
                            This unit does not provide a reference solution yet.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                <div className="mt-5 rounded-[20px] border border-white/10 bg-black/16 p-4 text-sm leading-7 text-white/56">
                  {runnerSupported
                    ? 'Drafts stay in the browser. Re-run checks after each meaningful change before marking the lab complete.'
                    : 'Drafts stay in the browser. Use this workspace as a guided scratchpad for the lab.'}
                </div>
              </section>
            </>
          )}
        </div>

        <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
          {outline.length > 0 ? (
            <SidebarPanel
              title="On this page"
              accent="text-cyber-yellow/72"
              footer={`${outline.length} headings mapped`}
            >
              <div className="space-y-2">
                {outline.map((item) => (
                  <a
                    key={item.id}
                    href={`#${item.id}`}
                    className={`block rounded-[16px] border border-white/8 bg-white/4 px-4 py-3 text-sm text-white/70 transition-colors hover:border-cyber-blue/35 hover:bg-cyber-blue/8 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyber-yellow/80 focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                      item.level > 2 ? 'ml-3' : ''
                    }`}
                  >
                    {item.label}
                  </a>
                ))}
              </div>
            </SidebarPanel>
          ) : (
            <SidebarPanel
              title="Challenge profile"
              accent="text-cyber-yellow/72"
              footer={practiceModeText(unit)}
            >
              <div className="space-y-3 text-sm text-white/66">
                <ProfileRow label="Tests" value={String(unit.tests.length)} />
                <ProfileRow label="Hints" value={String(unit.hints.length)} />
                <ProfileRow label="Language" value={unit.language || 'Not set'} />
                <ProfileRow label="Build type" value={unit.build_type || 'standard'} />
                <ProfileRow label="Deployable" value={unit.deployable ? 'Yes' : 'No'} />
              </div>
            </SidebarPanel>
          )}

          <SidebarPanel
            title="Module route"
            accent="text-cyber-blue/75"
            footer={
              currentModule
                ? `${currentModuleCompleted}/${currentModuleUnits.length} steps complete in ${currentModule.title}`
                : 'No module context'
            }
          >
            <div className="space-y-3">
              {currentModuleUnits.map((routeUnit) => {
                const done = isAcademyV2UnitCompleted(
                  progress.state.completedLessons,
                  course.id,
                  routeUnit.id
                );
                const locked = isUnitLocked(
                  progress.state.completedLessons,
                  course.id,
                  flatCourseUnits,
                  routeUnit.id
                );
                const current = routeUnit.id === unit.id;

                return (
                  <button
                    key={routeUnit.id}
                    type="button"
                    disabled={locked}
                    onClick={() => !locked && navigate(`/academy/unit/${course.id}/${routeUnit.id}`)}
                    className={`flex w-full items-center gap-3 rounded-[18px] border px-4 py-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyber-yellow/80 focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                      current
                        ? 'border-cyber-yellow/30 bg-cyber-yellow/10'
                        : locked
                          ? 'cursor-not-allowed border-white/10 bg-white/4 opacity-55'
                          : done
                            ? 'border-cyber-blue/25 bg-cyber-blue/10 transition-colors hover:bg-cyber-blue/14'
                            : 'border-white/10 bg-white/4 transition-colors hover:border-cyber-blue/35 hover:bg-cyber-blue/8'
                    }`}
                  >
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border ${
                        current
                          ? 'border-cyber-yellow/40 bg-cyber-yellow/12 text-cyber-yellow'
                          : done
                            ? 'border-cyber-blue/35 bg-cyber-blue/12 text-cyber-blue'
                            : locked
                              ? 'border-white/10 bg-background text-white/35'
                              : routeUnit.section === 'practice'
                                ? 'border-cyber-blue/35 bg-cyber-blue/10 text-cyber-blue'
                                : 'border-white/12 bg-white/5 text-white/58'
                      }`}
                    >
                      {locked ? (
                        <Lock className="h-4 w-4" aria-hidden="true" />
                      ) : routeUnit.section === 'practice' ? (
                        <Code2 className="h-4 w-4" aria-hidden="true" />
                      ) : (
                        <BookOpen className="h-4 w-4" aria-hidden="true" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-display text-sm font-black uppercase tracking-[0.08em] text-white">
                        {routeUnit.title}
                      </div>
                      <div className="mt-1 text-[11px] font-mono uppercase tracking-[0.16em] text-white/42">
                        {current ? 'Current step' : done ? 'Completed' : locked ? 'Locked' : routeUnit.section}
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 shrink-0 text-cyber-blue" aria-hidden="true" />
                  </button>
                );
              })}
            </div>
          </SidebarPanel>

          <SidebarPanel
            title={unitDone ? 'Unit complete' : 'Ready to mark complete'}
            accent="text-cyber-yellow/72"
            footer={unitDone ? 'Progress already synced for this step' : 'Complete to write progress + activity'}
          >
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <HeroStat
                  icon={<BookOpen className="h-4 w-4" aria-hidden="true" />}
                  label="Course"
                  value={`${courseProgressPercent}%`}
                />
                <HeroStat
                  icon={isPractice ? <Code2 className="h-4 w-4" aria-hidden="true" /> : <Sparkles className="h-4 w-4" aria-hidden="true" />}
                  label="Module"
                  value={`${currentModulePercent}%`}
                />
              </div>

              <p className="text-sm leading-7 text-white/66">
                {unitDone
                  ? 'This step is already in your progress history. You can move forward or revisit the material from the course route.'
                  : isPractice
                    ? runnerSupported
                      ? 'Run the checks on the current draft first. Completion unlocks only after every visible and hidden browser check passes.'
                      : 'This practice lane is guided for now. Mark it complete when you are done so the next route step unlocks and the activity trail updates in admin.'
                    : 'Once you finish the reading, mark this step complete so the next route step unlocks immediately.'}
              </p>

              {!unitDone ? (
                <button
                  type="button"
                  onClick={() => void handleComplete()}
                  disabled={completionBlocked || runLoading}
                  className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-cyber-yellow px-5 text-sm font-display font-bold uppercase tracking-[0.16em] text-black transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-55 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyber-yellow/80 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                  {isPractice ? 'Complete practice' : 'Complete lesson'}
                </button>
              ) : (
                <div className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full border border-cyber-yellow/25 bg-cyber-yellow/10 px-5 text-sm font-display font-bold uppercase tracking-[0.16em] text-cyber-yellow">
                  <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                  Completion recorded
                </div>
              )}

              {!unitDone && completionBlocked && (
                <div className="rounded-[18px] border border-amber-300/24 bg-amber-500/10 px-4 py-3 text-sm leading-7 text-amber-100/88">
                  {runLoading
                    ? 'Checks are running. Wait for the result before completing this practice.'
                    : 'Completion is locked until the current draft passes every browser check.'}
                </div>
              )}

              {next_unit && (
                <button
                  type="button"
                  onClick={() => navigate(`/academy/unit/${course.id}/${next_unit.id}`)}
                  className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full border border-cyber-blue/30 bg-cyber-blue/10 px-5 text-sm font-display font-bold uppercase tracking-[0.16em] text-cyber-blue transition-colors hover:bg-cyber-blue hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyber-blue/80 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  Next unit
                  <ChevronRight className="h-4 w-4" aria-hidden="true" />
                </button>
              )}
            </div>
          </SidebarPanel>
        </aside>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <NavUnitLink
          label="Previous"
          unit={previous_unit}
          href={previous_unit ? `/academy/unit/${course.id}/${previous_unit.id}` : '#'}
          disabled={!previous_unit}
          align="left"
        />
        <NavUnitLink
          label="Next"
          unit={next_unit}
          href={next_unit ? `/academy/unit/${course.id}/${next_unit.id}` : '#'}
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
  footer,
  children,
}: {
  title: string;
  accent: string;
  footer?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[26px] border border-white/10 bg-surface/72 p-5 shadow-[0_14px_36px_rgba(0,0,0,0.16)]">
      <div className={`text-[10px] font-mono uppercase tracking-[0.28em] ${accent}`}>{title}</div>
      <div className="mt-4">{children}</div>
      {footer && (
        <div className="mt-4 border-t border-white/8 pt-4 text-xs leading-6 text-white/46">{footer}</div>
      )}
    </div>
  );
}

function HeroStat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[20px] border border-white/10 bg-white/5 px-4 py-3">
      <div className="flex items-center gap-2 text-cyber-blue">{icon}</div>
      <div className="mt-2 text-[10px] font-mono uppercase tracking-[0.22em] text-white/40">
        {label}
      </div>
      <div className="mt-2 font-display text-xl font-black text-white">{value}</div>
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
      className={`inline-flex min-h-10 items-center rounded-full border px-4 text-[11px] font-mono font-bold uppercase tracking-[0.18em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyber-yellow/80 focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
        active
          ? 'border-cyber-yellow/30 bg-cyber-yellow/12 text-cyber-yellow'
          : 'border-white/10 bg-white/5 text-white/62 hover:border-cyber-blue/35 hover:text-cyber-blue'
      }`}
    >
      {label}
    </button>
  );
}

function StatusPill({
  tone,
  label,
}: {
  tone: 'blue' | 'amber' | 'green' | 'neutral';
  label: string;
}) {
  const toneClass =
    tone === 'blue'
      ? 'border-cyber-blue/20 bg-cyber-blue/10 text-cyber-blue'
      : tone === 'amber'
        ? 'border-amber-300/24 bg-amber-500/10 text-amber-100'
        : tone === 'green'
          ? 'border-emerald-300/24 bg-emerald-500/10 text-emerald-100'
          : 'border-white/10 bg-white/5 text-white/54';

  return (
    <div
      className={`inline-flex min-h-9 items-center rounded-full border px-4 text-[10px] font-mono uppercase tracking-[0.18em] ${toneClass}`}
    >
      {label}
    </div>
  );
}

function ProfileRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-[16px] border border-white/8 bg-black/14 px-4 py-3">
      <div className="text-[10px] font-mono uppercase tracking-[0.22em] text-white/40">{label}</div>
      <div className="font-display text-sm font-black uppercase tracking-[0.08em] text-white">
        {value}
      </div>
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
  align: 'left' | 'right';
}) {
  const content = (
    <>
      <div className="text-[10px] font-mono uppercase tracking-[0.22em] text-white/38">{label}</div>
      <div className="mt-2 font-display text-lg font-black uppercase tracking-[0.08em] text-white">
        {unit?.title || 'No unit'}
      </div>
      <div className="mt-2 text-sm text-cyber-blue">
        {unit ? `${unit.type} / ${unit.section}` : 'End of sequence'}
      </div>
    </>
  );

  if (disabled) {
    return (
      <div
        className={`w-full rounded-[22px] border border-white/10 bg-surface/45 p-4 opacity-55 sm:w-[48%] ${
          align === 'right' ? 'sm:text-right' : ''
        }`}
      >
        {content}
      </div>
    );
  }

  return (
    <Link
      to={href}
      className={`w-full rounded-[22px] border border-white/10 bg-surface/62 p-4 transition-colors hover:border-cyber-blue/35 hover:bg-cyber-blue/8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyber-yellow/80 focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:w-[48%] ${
        align === 'right' ? 'sm:text-right' : ''
      }`}
    >
      {content}
    </Link>
  );
}

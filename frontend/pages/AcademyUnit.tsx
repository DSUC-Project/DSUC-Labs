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
  Play
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
import { CodeEditorPane, CodeSurface } from '@/components/academy/CodeSurface';
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

type WorkspaceTab = 'instructions' | 'editor' | 'results' | 'solution';

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
    return 'Bài Lab Solana';
  }

  if (unit.language === 'rust') {
    return 'Bài thực hành Rust';
  }

  if (unit.language === 'typescript') {
    return 'Thử thách TypeScript';
  }

  return 'Thử thách thực hành';
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
          setError(err.message || 'Không thể tải bài học.');
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
      <div className="space-y-6 pb-20 mt-10 max-w-[1400px] mx-auto w-full px-4 sm:px-6 lg:px-8">
        <div className="h-64 animate-pulse border-4 border-brutal-black bg-gray-100 shadow-neo" />
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-6">
            <div className="h-96 animate-pulse border-4 border-brutal-black bg-gray-100 shadow-neo" />
            <div className="h-64 animate-pulse border-4 border-brutal-black bg-gray-100 shadow-neo" />
          </div>
          <div className="h-96 animate-pulse border-4 border-brutal-black bg-gray-100 shadow-neo" />
        </div>
      </div>
    );
  }

  if (!unitData) {
    return (
      <div className="mx-auto mt-10 max-w-4xl border-4 border-brutal-black bg-white p-8 text-center shadow-neo">
        <div className="mb-4 inline-flex h-12 w-12 items-center justify-center border-4 border-brutal-black bg-brutal-red text-white shadow-neo-sm">
           <Code2 className="w-6 h-6" />
        </div>
        <h1 className="font-display text-2xl font-black uppercase tracking-tight text-brutal-black">
          Không thể mở bài học này
        </h1>
        <p className="mt-4 border-4 border-brutal-black bg-brutal-yellow/30 p-4 text-sm font-bold text-brutal-black">
          {error || 'Bài học hiện không mở được. Vui lòng thử lại sau.'}
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
           <button
            type="button"
            onClick={() => setReloadNonce((value) => value + 1)}
            className="inline-flex items-center gap-2 border-4 border-brutal-black bg-brutal-blue px-6 py-3 text-sm font-black uppercase tracking-wider text-white transition-all hover:-translate-y-1 hover:bg-brutal-pink hover:text-brutal-black hover:shadow-neo"
          >
            Tải lại
          </button>
          <Link
            to="/academy"
            className="inline-flex items-center gap-2 border-4 border-brutal-black bg-white px-6 py-3 text-sm font-black uppercase tracking-wider text-brutal-black transition-all hover:-translate-y-1 hover:bg-brutal-yellow hover:shadow-neo"
          >
            Về trang chủ Học Viện
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
        ? 'Máy ảo biên dịch Rust'
        : 'Trình xác thực mã Rust định hướng'
      : runnerSupported
        ? 'Trình chạy thử thách trên trình duyệt'
        : 'Không gian thực hành');
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
          ? 'Hệ thống đang chạy bài kiểm tra. Vui lòng đợi kết quả trước khi hoàn thành.'
          : 'Hãy vượt qua tất cả các bài kiểm tra kể cả ẩn trước khi hoàn thành chặng này.'
      );
      return;
    }

    const saved = await progress.persistUnitCompletion(course.id, unit.id, {
      quizPassed: isPractice,
      xpAwarded: unit.xp_reward,
    });

    setNotice(
      saved
        ? 'Tiến độ được đồng bộ. Hoạt động luyện tập đã được lưu lại.'
        : 'Tiến độ đã được lưu cục bộ. Hệ thống sẽ thử bộ lại lần tới khi bài học này được tải.'
    );
  }

  function copyDraft() {
    if (!draftCode) {
      return;
    }

    void navigator.clipboard.writeText(draftCode);
    setNotice('Code của bạn đã được copy vào clipboard.');
  }

  function resetDraft() {
    setDraftCode(unit.code || '');
    setNotice('Khôi phục code gốc của bài học này thành công.');
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
        runtimeLabel: 'Thử thách trên trình duyệt',
        message: error?.message || 'Có lỗi xảy ra trong lúc thực thi.',
        cases: [],
      });
      setLastRunSource(draftCode);
      setActiveWorkspaceTab('results');
      setNotice(error?.message || 'Có lỗi xảy ra trong lúc thực thi.');
    } finally {
      setRunLoading(false);
    }
  }

  return (
    <div className="space-y-12 pb-20 mt-10 max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 w-full">
      <section className="bg-brutal-blue border-4 border-brutal-black p-8 sm:p-12 relative overflow-hidden brutal-card rounded-none shadow-neo-xl">
        <div className="absolute right-0 top-0 w-[500px] h-[500px] bg-brutal-yellow rounded-full border-8 border-brutal-black translate-x-1/2 -translate-y-1/4 pointer-events-none" />

        <div className="relative grid gap-10 lg:grid-cols-[minmax(0,1.3fr)_360px] lg:items-end z-10">
          <div className="space-y-8">
            <Link
              to={`/academy/course/${course.id}`}
              className="inline-flex min-h-12 items-center justify-center gap-3 bg-white border-4 border-brutal-black px-6 py-2 text-sm font-black uppercase tracking-widest text-brutal-black shadow-neo hover:-translate-y-1 hover:shadow-neo-lg transition-all"
            >
               <ArrowLeft className="h-5 w-5" strokeWidth={3} aria-hidden="true" />
               Về lại khóa học
            </Link>

            <div className="flex flex-wrap gap-3">
              <span className="inline-flex items-center justify-center bg-brutal-black px-4 py-2 text-xs font-black uppercase tracking-widest text-white shadow-neo-sm border-2 border-transparent">
                {course.title}
              </span>
              <span className="inline-flex items-center justify-center bg-brutal-yellow px-4 py-2 text-xs font-black uppercase tracking-widest text-brutal-black border-4 border-brutal-black shadow-neo-sm">
                {unit.module_title}
              </span>
              <span className="inline-flex items-center justify-center bg-brutal-pink px-4 py-2 text-xs font-black uppercase tracking-widest text-brutal-black border-4 border-brutal-black shadow-neo-sm">
                {isPractice ? practiceModeText(unit) : 'Bài lý thuyết'}
              </span>
            </div>

            <div className="space-y-6">
              <div className="inline-block text-xs font-black uppercase tracking-widest text-brutal-black bg-white border-2 border-brutal-black px-3 py-1 shadow-neo-sm">
                Bài {Math.max(1, unit_index + 1)} trên {total_units}
              </div>
              <div className="inline-block max-w-5xl border-4 border-brutal-black bg-white px-5 py-4 shadow-neo-sm">
                <h1 className="font-display text-5xl font-black text-brutal-black sm:text-6xl lg:text-7xl leading-none uppercase tracking-tighter">
                  {unit.title}
                </h1>
              </div>
              <p className="mt-6 max-w-4xl text-lg font-bold leading-relaxed text-gray-800 bg-white/90 border-4 border-brutal-black p-5 shadow-neo-sm">
                {isPractice
                  ? 'Hãy đọc kỹ hướng dẫn, thực hành trong trình soạn thảo, và vượt qua tất cả bài kiểm tra để hoàn thành Lab này.'
                  : 'Đọc và nghiên cứu nội dung bài học này, sau đó tiếp tục thực hành ngay để kiểm tra kiến thức.'}
              </p>
            </div>
          </div>

          <div className="bg-white p-8 border-4 border-brutal-black shadow-neo-lg xl:rotate-2 transform">
             <div className="text-[10px] font-black uppercase tracking-widest text-white bg-brutal-blue px-2 py-1 inline-block mb-4 border-2 border-brutal-black shadow-neo-sm">
               Trạng thái
             </div>
             <div className="font-display text-4xl font-black text-brutal-black uppercase tracking-tight mb-8">
                {unitDone ? 'Đã hoàn thành' : isPractice ? 'Sẵn sàng nộp bài' : 'Đang học...'}
             </div>
             <div className="grid grid-cols-2 gap-4">
                 <div className="bg-white border-4 border-brutal-black p-4 text-center shadow-neo-sm">
                   <div className="flex items-center justify-center gap-2 mb-2 text-brutal-black">
                     <BookOpen className="w-5 h-5" strokeWidth={3} />
                     <span className="text-[10px] font-black uppercase tracking-widest">Tiến độ</span>
                   </div>
                   <div className="text-3xl font-black text-brutal-black">{courseProgressPercent}%</div>
                 </div>
                 <div className="bg-brutal-yellow border-4 border-brutal-black p-4 text-center shadow-neo-sm">
                   <div className="flex items-center justify-center gap-2 mb-2 text-brutal-black">
                     <Flame className="w-5 h-5" strokeWidth={3} />
                     <span className="text-[10px] font-black uppercase tracking-widest">Thưởng XP</span>
                   </div>
                   <div className="text-3xl font-black text-brutal-black">+{unit.xp_reward}</div>
                 </div>
             </div>
          </div>
        </div>
      </section>

      {notice && (
        <div className="border-4 border-brutal-black bg-brutal-pink px-6 py-4 text-sm font-black text-brutal-black uppercase tracking-widest flex items-center gap-4 shadow-neo">
          <TerminalSquare className="h-6 w-6" strokeWidth={3} />
          {notice}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          {!isPractice ? (
            <>
              {embedUrl && (
                <section className="overflow-hidden border-4 border-brutal-black bg-white shadow-neo">
                  <div className="border-b-4 border-brutal-black bg-brutal-yellow px-6 py-5">
                    <div className="text-[10px] font-black uppercase tracking-widest text-brutal-black mb-1">
                      Video Bài Học
                    </div>
                    <h2 className="font-display text-3xl font-black text-brutal-black uppercase tracking-tight">
                       Xem hướng dẫn
                    </h2>
                  </div>
                  <div className="relative w-full pb-[56.25%] bg-brutal-black">
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

              <section className="border-4 border-brutal-black bg-white shadow-neo p-6 sm:p-8 lg:p-10 mb-8 mt-8">
                <div className="flex flex-col gap-6 border-b-4 border-brutal-black pb-8 sm:flex-row sm:items-end sm:justify-between mb-8">
                  <div>
                    <div className="inline-block bg-brutal-blue text-white px-2 py-1 text-[10px] font-black uppercase tracking-widest border-2 border-brutal-black shadow-neo-sm mb-3">
                      Bài lý thuyết
                    </div>
                    <h2 className="font-display text-4xl sm:text-5xl font-black text-brutal-black uppercase tracking-tighter decoration-brutal-pink decoration-4 underline underline-offset-8">
                      Nội dung học
                    </h2>
                  </div>
                  {outline.length > 0 && (
                    <div className="bg-brutal-yellow px-4 py-2 text-xs font-black uppercase tracking-wider text-brutal-black border-4 border-brutal-black shadow-neo-sm shrink-0">
                      {outline.length} phần nội dung
                    </div>
                  )}
                </div>
                <div className="prose-dsuc max-w-none">
                  {renderMd(unit.content_md)}
                </div>
              </section>

              {next_unit && (
                <button
                  type="button"
                  onClick={() => navigate(`/academy/unit/${course.id}/${next_unit.id}`)}
                  className="mt-12 mb-8 flex w-full items-center justify-between gap-4 border-4 border-brutal-black bg-brutal-yellow px-6 py-5 text-left shadow-neo transition-all hover:-translate-y-1 hover:shadow-neo-lg"
                >
                  <div className="min-w-0">
                    <div className="mb-2 inline-block border-2 border-brutal-black bg-white px-2 py-1 text-[10px] font-black uppercase tracking-widest text-brutal-black shadow-neo-sm">
                      Tiếp theo trong lộ trình
                    </div>
                    <h3 className="truncate font-display text-2xl font-black uppercase text-brutal-black sm:text-3xl">
                      {next_unit.title}
                    </h3>
                    <p className="mt-2 text-sm font-bold leading-relaxed text-brutal-black">
                      {next_unit.section === 'practice'
                        ? 'Bước kế tiếp là phần thực hành để áp dụng ngay kiến thức vừa học.'
                        : 'Tiếp tục chuỗi bài đọc trước khi sang phần thực hành.'}
                    </p>
                  </div>
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center border-4 border-brutal-black bg-white shadow-neo-sm">
                    <ChevronRight className="h-6 w-6 text-brutal-black" strokeWidth={3} aria-hidden="true" />
                  </div>
                </button>
              )}
            </>
          ) : (
            <div className="grid gap-6 xl:grid-cols-[minmax(0,0.92fr)_minmax(0,1.38fr)]">
              <div className="space-y-6">
                <section className="rounded-[32px] border border-border-main bg-surface p-6 sm:p-8">
                  <div className="flex flex-col gap-4 border-b border-border-main pb-6 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <p className="section-eyebrow">Practice Brief</p>
                      <h2 className="section-title">Instructions</h2>
                    </div>
                    <span className="status-badge status-badge-warning">{practiceModeText(unit)}</span>
                  </div>
                  <div className="prose-dsuc mt-6 max-w-none">
                    {renderMd(unit.content_md)}
                  </div>
                </section>

                {unit.hints.length > 0 ? (
                  <section className="rounded-[32px] border border-border-main bg-surface p-6">
                    <div className="flex items-center justify-between gap-4 border-b border-border-main pb-4">
                      <div>
                        <p className="section-eyebrow">Hints</p>
                        <h2 className="section-title">Need a nudge?</h2>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setRevealedHints((value) => Math.min(value + 1, unit.hints.length))
                        }
                        disabled={revealedHints >= unit.hints.length}
                        className="action-button action-button-ghost"
                      >
                        Reveal More
                      </button>
                    </div>
                    <div className="mt-5 space-y-3">
                      {unit.hints.slice(0, revealedHints).map((hint, index) => (
                        <div
                          key={`${hint}-${index}`}
                          className="rounded-[20px] border border-border-main bg-main-bg px-4 py-3 text-sm leading-7 text-text-main"
                        >
                          {hint}
                        </div>
                      ))}
                    </div>
                  </section>
                ) : null}

                <section className="rounded-[32px] border border-border-main bg-surface p-6">
                  <div className="border-b border-border-main pb-4">
                    <p className="section-eyebrow">Challenge Config</p>
                    <h2 className="section-title">Environment</h2>
                  </div>
                  <div className="mt-4 space-y-0">
                    <ProfileRow label="Test cases" value={String(unit.tests.length)} />
                    <ProfileRow label="Hints" value={String(unit.hints.length)} />
                    <ProfileRow label="Language" value={unit.language || 'Text'} />
                    <ProfileRow label="Build type" value={unit.build_type || 'Standard'} />
                  </div>
                </section>
              </div>

              <div className="space-y-6">
                <section className="overflow-hidden rounded-[32px] border border-border-main bg-surface-elevated shadow-soft-lg">
                  <div className="border-b border-border-main px-4 py-4">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div className="flex flex-wrap gap-2">
                        <span className="status-badge status-badge-info">
                          {unit.language === 'rust' ? 'challenge.rs' : 'challenge.ts'}
                        </span>
                        <span className="status-badge">
                          {runnerSupported ? runtimeLabel : 'Guided practice'}
                        </span>
                        {draftDirty ? <span className="status-badge status-badge-warning">Draft changed</span> : null}
                        {runReport && !runReportIsFresh ? <span className="status-badge status-badge-warning">Run again</span> : null}
                        {activeRunReport?.allPassed ? <span className="status-badge status-badge-success">All tests passed</span> : null}
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <div className="flex gap-2 xl:hidden">
                          <LabTabButton
                            label="Hướng dẫn"
                            active={activeWorkspaceTab === 'instructions'}
                            onClick={() => setActiveWorkspaceTab('instructions')}
                          />
                          <LabTabButton
                            label="Code"
                            active={activeWorkspaceTab === 'editor'}
                            onClick={() => setActiveWorkspaceTab('editor')}
                          />
                          <LabTabButton
                            label="Kết quả"
                            active={activeWorkspaceTab === 'results'}
                            onClick={() => setActiveWorkspaceTab('results')}
                          />
                          <LabTabButton
                            label="Đáp án"
                            active={activeWorkspaceTab === 'solution'}
                            onClick={() => setActiveWorkspaceTab('solution')}
                          />
                        </div>

                        <button
                          type="button"
                          onClick={copyDraft}
                          className="action-button action-button-ghost"
                        >
                          <ClipboardCopy className="h-4 w-4" />
                          Copy
                        </button>
                        <button
                          type="button"
                          onClick={resetDraft}
                          className="action-button action-button-ghost"
                        >
                          <AlertTriangle className="h-4 w-4" />
                          Reset
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveWorkspaceTab('solution');
                            if (!solutionUnlocked) {
                              setSolutionUnlocked(false);
                            }
                          }}
                          className="action-button action-button-secondary"
                        >
                          <Lightbulb className="h-4 w-4" />
                          Solution
                        </button>
                        {runnerSupported ? (
                          <button
                            type="button"
                            onClick={() => void handleRunChallenge()}
                            disabled={runLoading}
                            className="action-button action-button-primary"
                          >
                            {runLoading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4 fill-current" />}
                            {runLoading ? 'Running...' : 'Run Checks'}
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  <div className="p-4 xl:hidden">
                    {activeWorkspaceTab === 'instructions' ? (
                      <div className="prose-dsuc max-w-none rounded-[24px] border border-border-main bg-surface p-4">
                        {renderMd(unit.content_md)}
                      </div>
                    ) : null}

                    {activeWorkspaceTab === 'editor' ? (
                      <CodeEditorPane
                        value={draftCode}
                        onChange={setDraftCode}
                        language={unit.language || 'text'}
                        placeholder="Bắt đầu viết code ở đây..."
                      />
                    ) : null}

                    {activeWorkspaceTab === 'results' ? (
                      <ResultTerminalPanel
                        runReport={runReport}
                        runReportIsFresh={runReportIsFresh}
                        activeRunReport={activeRunReport}
                        runtimeLabel={runtimeLabel}
                      />
                    ) : null}

                    {activeWorkspaceTab === 'solution' ? (
                      <SolutionReferencePanel
                        unit={unit}
                        solutionUnlocked={solutionUnlocked}
                        onUnlock={() => setSolutionUnlocked(true)}
                        onBackToEditor={() => setActiveWorkspaceTab('editor')}
                        onCopySolution={() => {
                          if (unit.solution) {
                            navigator.clipboard.writeText(unit.solution);
                            setNotice('Đáp án đã được copy');
                          }
                        }}
                      />
                    ) : null}
                  </div>

                  <div className="hidden p-4 xl:block">
                    <CodeEditorPane
                      value={draftCode}
                      onChange={setDraftCode}
                      language={unit.language || 'text'}
                      placeholder="Bắt đầu viết code ở đây..."
                    />
                    <div className="mt-4">
                      <ResultTerminalPanel
                        runReport={runReport}
                        runReportIsFresh={runReportIsFresh}
                        activeRunReport={activeRunReport}
                        runtimeLabel={runtimeLabel}
                      />
                    </div>
                    <div className="mt-4">
                      <SolutionReferencePanel
                        unit={unit}
                        solutionUnlocked={solutionUnlocked}
                        onUnlock={() => setSolutionUnlocked(true)}
                        onBackToEditor={() => setActiveWorkspaceTab('editor')}
                        onCopySolution={() => {
                          if (unit.solution) {
                            navigator.clipboard.writeText(unit.solution);
                            setNotice('Đáp án đã được copy');
                          }
                        }}
                      />
                    </div>
                  </div>
                </section>

                <CompletionDockPanel
                  unitDone={unitDone}
                  isPractice={isPractice}
                  nextUnit={next_unit}
                  courseId={course.id}
                  completionBlocked={completionBlocked}
                  runLoading={runLoading}
                  noticeText={
                    unitDone
                      ? 'Completed. You can move forward or review the results again.'
                      : runnerSupported
                        ? 'Pass all visible and hidden tests before marking this unit complete.'
                        : 'Review the instructions, finish your changes, then mark the unit complete.'
                  }
                  onComplete={() => void handleComplete()}
                  onBackToCourse={() => navigate(`/academy/course/${course.id}`)}
                  onNextUnit={
                    next_unit ? () => navigate(`/academy/unit/${course.id}/${next_unit.id}`) : undefined
                  }
                  onReviewResults={() => setActiveWorkspaceTab('results')}
                />
              </div>
            </div>
          )}
        </div>

        <aside className="space-y-8 xl:sticky xl:top-24 xl:self-start">
          {outline.length > 0 ? (
            <SidebarPanel
              title="Mục lục"
              accent="bg-brutal-green"
              headerText="text-brutal-black"
              footer={`${outline.length} danh mục`}
            >
              <div className="space-y-3 pl-4 relative border-l-4 border-brutal-black ml-2 py-2">
                {outline.map((item) => (
                  <a
                    key={item.id}
                    href={`#${item.id}`}
                    className={`block py-1 text-sm font-bold text-gray-800 hover:text-brutal-black transition-colors relative before:absolute before:left-[-22px] before:top-[10px] before:w-3 before:h-3 before:bg-white before:border-2 before:border-brutal-black hover:before:bg-brutal-yellow ${
                      item.level > 2 ? 'pl-4' : 'pl-0'
                    }`}
                  >
                    {item.label}
                  </a>
                ))}
              </div>
            </SidebarPanel>
          ) : (
            <SidebarPanel
              title="Cấu hình thử thách"
              accent="bg-white"
              headerText="text-brutal-black"
              footer={practiceModeText(unit)}
            >
              <div className="space-y-0">
                <ProfileRow label="Số kiểm tra" value={String(unit.tests.length)} />
                <ProfileRow label="Gợi ý" value={String(unit.hints.length)} />
                <ProfileRow label="Ngôn ngữ" value={unit.language || 'Trống'} />
                <ProfileRow label="Kiểu build" value={unit.build_type || 'chuẩn'} />
              </div>
            </SidebarPanel>
          )}

          <SidebarPanel
            title={currentModule?.title || "Chương"}
            accent="bg-white"
            headerText="text-brutal-black"
            footer={
              currentModule
                ? `${currentModuleCompleted}/${currentModuleUnits.length} bài hoàn thành`
                : 'Không có thông tin chương'
            }
          >
            <div className="space-y-3 mt-4">
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
                    className={`flex w-full items-center gap-4 p-3 text-left transition-all border-4 ${
                      current
                        ? 'border-brutal-black bg-brutal-yellow shadow-neo-sm transform -translate-y-1'
                        : locked
                          ? 'cursor-not-allowed border-brutal-black bg-gray-200 opacity-60'
                          : done
                            ? 'border-brutal-black bg-white hover:bg-gray-50 hover:shadow-neo-sm'
                            : 'border-brutal-black bg-white hover:bg-brutal-blue hover:shadow-neo-sm hover:-translate-y-1'
                    }`}
                  >
                    <div
                      className={`flex h-10 w-10 shrink-0 border-2 border-brutal-black items-center justify-center ${
                        current
                          ? 'bg-white text-brutal-black'
                          : done
                            ? 'bg-brutal-green text-brutal-black'
                            : locked
                              ? 'bg-gray-300 text-gray-500'
                              : routeUnit.section === 'practice'
                                ? 'bg-brutal-pink text-brutal-black'
                                : 'bg-brutal-blue text-white'
                      }`}
                    >
                      {locked ? (
                        <Lock className="h-5 w-5" strokeWidth={3} aria-hidden="true" />
                      ) : done ? (
                         <CheckCircle2 className="h-5 w-5" strokeWidth={3} />
                      ) : routeUnit.section === 'practice' ? (
                        <Code2 className="h-5 w-5" strokeWidth={3} aria-hidden="true" />
                      ) : (
                        <BookOpen className="h-5 w-5" strokeWidth={3} aria-hidden="true" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className={`truncate text-xs font-black uppercase ${current ? 'text-brutal-black' : 'text-brutal-black'}`}>
                        {routeUnit.title}
                      </div>
                      <div className="text-[10px] uppercase font-bold tracking-widest text-gray-600 mt-1">
                        {current ? 'Đang học' : done ? 'Hoàn thành' : locked ? 'Đã khóa' : routeUnit.section === 'practice' ? 'Thực hành' : 'Lý thuyết'}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </SidebarPanel>

          <SidebarPanel
            title={unitDone ? 'Đã hoàn tất' : 'Xác nhận hoàn thành'}
            accent={unitDone ? 'bg-brutal-green' : 'bg-brutal-blue text-white'}
            headerText={unitDone ? "text-brutal-black" : "text-white"}
          >
            <div className="space-y-6 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-4 border-4 border-brutal-black text-center shadow-neo-sm">
                   <div className="text-[10px] font-black uppercase tracking-widest text-brutal-black mb-2">Khóa học</div>
                   <div className="font-display font-black text-2xl text-brutal-black">{courseProgressPercent}%</div>
                </div>
                <div className="bg-brutal-yellow p-4 border-4 border-brutal-black text-center shadow-neo-sm">
                   <div className="text-[10px] font-black uppercase tracking-widest text-brutal-black mb-2">Chương</div>
                   <div className="font-display font-black text-2xl text-brutal-black">{currentModulePercent}%</div>
                </div>
              </div>

              <p className={`text-sm font-bold leading-relaxed text-center px-2 py-4 border-4 border-brutal-black ${unitDone ? 'bg-white text-brutal-black' : 'bg-brutal-bg text-brutal-black'}`}>
                {unitDone
                  ? 'Bài học đã lưu dấu. Tiến thẳng lên bài học kế tiếp.'
                  : isPractice
                    ? runnerSupported
                      ? 'Hoàn tất các bước kiểm tra (Run Checks). Bạn cần pass hết các test case mới có thể Nộp bài.'
                      : 'Khi hoàn tất việc thực hành, nhấn Nộp bài để tiếp tục.'
                    : 'Hãy nhấn Hoàn Thành để lưu vào hệ thống.'}
              </p>

              {!unitDone ? (
                <button
                  type="button"
                  onClick={() => void handleComplete()}
                  disabled={completionBlocked || runLoading}
                  className="inline-flex w-full items-center justify-center gap-3 bg-brutal-black px-6 py-4 text-sm font-black uppercase tracking-widest text-white shadow-neo hover:-translate-y-1 hover:shadow-neo-lg transition-all focus-visible:outline-none disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500 disabled:shadow-none border-4 border-brutal-black disabled:border-gray-400"
                >
                  <CheckCircle2 className="h-5 w-5" strokeWidth={3} aria-hidden="true" />
                  {isPractice ? 'Nộp bài thực hành' : 'Xác nhận hoàn thành'}
                </button>
              ) : (
                <div className="inline-flex w-full items-center justify-center gap-3 bg-white px-6 py-4 text-sm font-black tracking-widest uppercase text-brutal-black border-4 border-brutal-black shadow-neo">
                  <CheckCircle2 className="h-6 w-6 text-brutal-green" strokeWidth={3} aria-hidden="true" />
                  Đã ghi nhận điểm
                </div>
              )}

              {!unitDone && completionBlocked && (
                 <div className="px-4 py-3 bg-brutal-yellow border-4 border-brutal-black text-sm text-brutal-black font-black uppercase tracking-wider text-center shadow-neo-sm">
                   <AlertTriangle className="w-5 h-5 inline-block mr-2 -translate-y-0.5" strokeWidth={3} />
                   {runLoading
                     ? 'Đang chấm bài. Vui lòng chờ vài giây.'
                     : 'Yêu cầu vượt qua hết bộ test case.'}
                 </div>
              )}

              {next_unit && (
                <button
                  type="button"
                  onClick={() => navigate(`/academy/unit/${course.id}/${next_unit.id}`)}
                  className="inline-flex w-full items-center justify-center gap-3 bg-brutal-yellow px-6 py-4 text-sm font-black uppercase tracking-widest text-brutal-black shadow-neo hover:-translate-y-1 hover:shadow-neo-lg transition-all focus-visible:outline-none border-4 border-brutal-black mt-4"
                >
                  Bài học tiếp theo
                  <ChevronRight className="h-5 w-5" strokeWidth={3} aria-hidden="true" />
                </button>
              )}
            </div>
          </SidebarPanel>
        </aside>
      </div>

      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between py-10 mt-12 mb-20 border-t-8 border-brutal-black">
         <NavUnitLink
           label="Bài trước"
           unit={previous_unit}
           href={previous_unit ? `/academy/unit/${course.id}/${previous_unit.id}` : '#'}
           disabled={!previous_unit}
           align="left"
         />
         <NavUnitLink
           label="Bài tiếp theo"
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
    <div className="rounded-[28px] border border-border-main bg-surface p-6 shadow-soft-sm">
      <div className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-text-main">
        {title}
      </div>
      <div>{children}</div>
      {footer && (
        <div className="mt-5 border-t border-border-main pt-4 text-xs uppercase tracking-[0.18em] text-text-muted">
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
      className={`rounded-full border px-4 py-2 text-xs uppercase tracking-[0.18em] transition-colors ${
        active
          ? 'border-primary bg-primary text-main-bg'
          : 'border-border-main bg-surface text-text-main hover:bg-main-bg'
      }`}
    >
      {label}
    </button>
  );
}

function ProfileRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border-main py-3 last:border-0">
      <div className="text-xs uppercase tracking-[0.18em] text-text-muted">{label}</div>
      <div className="text-sm font-medium text-text-main">{value}</div>
    </div>
  );
}

function ResultTerminalPanel({
  runReport,
  runReportIsFresh,
  activeRunReport,
  runtimeLabel,
}: {
  runReport: ChallengeRunReport | null;
  runReportIsFresh: boolean;
  activeRunReport: ChallengeRunReport | null;
  runtimeLabel: string;
}) {
  return (
    <div className="overflow-hidden rounded-[24px] border border-border-main bg-[#0d1117]">
      <div className="flex items-center justify-between gap-4 border-b border-white/10 bg-[#161b22] px-4 py-3">
        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-[#9da7b3]">
          <TerminalSquare className="h-4 w-4" />
          Terminal Results
        </div>
        <span className="text-[11px] uppercase tracking-[0.18em] text-[#7f8b99]">{runtimeLabel}</span>
      </div>

      {!runReport ? (
        <div className="px-4 py-6 text-sm text-[#9da7b3]">
          Run checks to populate the terminal output and structured test results.
        </div>
      ) : (
        <div className="space-y-4 px-4 py-5">
          <div className="flex flex-wrap items-center gap-3">
            <span
              className={`rounded-full px-3 py-1 text-xs uppercase tracking-[0.18em] ${
                runReportIsFresh
                  ? runReport.allPassed
                    ? 'bg-emerald-400/15 text-emerald-300'
                    : 'bg-rose-400/15 text-rose-300'
                  : 'bg-amber-400/15 text-amber-300'
              }`}
            >
              {runReportIsFresh
                ? runReport.allPassed
                  ? 'All checks passed'
                  : 'Checks failed'
                : 'Editor changed since last run'}
            </span>
            <span className="text-sm text-[#d0d7de]">
              {activeRunReport?.passedCount ?? runReport.passedCount}/{activeRunReport?.totalCount ?? runReport.totalCount} cases passing
            </span>
          </div>

          <p className="text-sm leading-7 text-[#d0d7de]">
            {runReportIsFresh
              ? runReport.message
              : 'The editor has changed since the last run. Run checks again to validate the current draft.'}
          </p>

          {(runReport.cases || []).length > 0 ? (
            <div className="space-y-3">
              {runReport.cases.map((caseItem, index) => (
                <div
                  key={caseItem.id}
                  className="rounded-[18px] border border-white/10 bg-white/[0.03] px-4 py-3"
                >
                  <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-[#9da7b3]">
                    {caseItem.passed ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-rose-300" />
                    )}
                    {caseItem.hidden ? `Hidden Test ${index + 1}` : `Visible Test ${index + 1}`}
                  </div>
                  <p className="mt-2 text-sm leading-7 text-[#d0d7de]">{caseItem.description}</p>
                  {caseItem.error ? (
                    <div className="mt-3">
                      <CodeSurface
                        code={caseItem.error}
                        language="text"
                        label="stderr"
                        maxHeightClass="max-h-[180px]"
                      />
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-[18px] border border-dashed border-white/15 px-4 py-4 text-sm text-[#9da7b3]">
              Structured test cases were not returned for this run.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SolutionReferencePanel({
  unit,
  solutionUnlocked,
  onUnlock,
  onBackToEditor,
  onCopySolution,
}: {
  unit: AcademyV2UnitDetail;
  solutionUnlocked: boolean;
  onUnlock: () => void;
  onBackToEditor: () => void;
  onCopySolution: () => void;
}) {
  return (
    <div className="rounded-[24px] border border-border-main bg-surface p-5">
      {!solutionUnlocked ? (
        <div className="text-center">
          <p className="section-eyebrow">Reference Solution</p>
          <h3 className="section-title">Try on your own first</h3>
          <p className="section-subtitle">
            Revealing the reference solution does not complete the unit or replace your draft.
          </p>
          <div className="mt-5 flex justify-center">
            <button type="button" onClick={onUnlock} className="action-button action-button-secondary">
              Reveal Solution
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="section-eyebrow">Reference Solution</p>
              <h3 className="section-title">Visible for comparison</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={onBackToEditor} className="action-button action-button-ghost">
                Back to Editor
              </button>
              <button
                type="button"
                disabled={!unit.solution}
                onClick={onCopySolution}
                className="action-button action-button-secondary"
              >
                <ClipboardCopy className="h-4 w-4" />
                Copy Solution
              </button>
            </div>
          </div>
          {unit.solution ? (
            <CodeSurface
              code={unit.solution}
              language={unit.language || 'text'}
              label="reference solution"
              maxHeightClass="max-h-[420px]"
            />
          ) : (
            <div className="rounded-[18px] border border-dashed border-border-main px-4 py-4 text-sm text-text-muted">
              No reference solution is attached to this unit yet.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function CompletionDockPanel({
  unitDone,
  isPractice,
  nextUnit,
  courseId,
  completionBlocked,
  runLoading,
  noticeText,
  onComplete,
  onBackToCourse,
  onNextUnit,
  onReviewResults,
}: {
  unitDone: boolean;
  isPractice: boolean;
  nextUnit: AcademyV2UnitSummary | null;
  courseId: string;
  completionBlocked: boolean;
  runLoading: boolean;
  noticeText: string;
  onComplete: () => void;
  onBackToCourse: () => void;
  onNextUnit?: () => void;
  onReviewResults: () => void;
}) {
  return (
    <div className="rounded-[32px] border border-border-main bg-surface p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="section-eyebrow">{unitDone ? 'Completed' : 'Completion Dock'}</p>
          <h2 className="section-title">{unitDone ? 'Unit complete' : 'Ready to finish?'}</h2>
          <p className="section-subtitle">{noticeText}</p>
        </div>
        <span className={`status-badge ${unitDone ? 'status-badge-success' : 'status-badge-info'}`}>
          {unitDone ? 'Completed' : isPractice ? 'Practice Unit' : 'Content Unit'}
        </span>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        {!unitDone ? (
          <button
            type="button"
            onClick={onComplete}
            disabled={completionBlocked || runLoading}
            className="action-button action-button-primary"
          >
            <CheckCircle2 className="h-4 w-4" />
            {isPractice ? 'Mark Practice Complete' : 'Mark Complete'}
          </button>
        ) : null}

        {nextUnit ? (
          <button type="button" onClick={onNextUnit} className="action-button action-button-secondary">
            Next Unit
            <ChevronRight className="h-4 w-4" />
          </button>
        ) : null}

        <button type="button" onClick={onBackToCourse} className="action-button action-button-ghost">
          Back to Course
        </button>

        {isPractice ? (
          <button type="button" onClick={onReviewResults} className="action-button action-button-ghost">
            Review Results
          </button>
        ) : null}
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
   if (disabled) {
      return (
         <div className={`w-full sm:w-[48%] opacity-60 p-8 border-4 border-brutal-black bg-gray-200 flex flex-col ${align === 'right' ? 'sm:text-right sm:items-end items-start' : 'items-start'}`}>
            <div className="text-xs uppercase font-black tracking-widest text-gray-500 mb-2">{label}</div>
            <div className="font-display font-black text-2xl text-brutal-black">Hết lộ trình</div>
         </div>
      );
   }

   return (
      <Link
        to={href}
        className={`w-full sm:w-[48%] rounded-[28px] border border-border-main bg-surface p-8 transition-colors hover:bg-main-bg ${align === 'right' ? 'sm:text-right sm:items-end items-start' : 'items-start'}`}
      >
        <div className="mb-2 text-xs uppercase tracking-[0.18em] text-text-muted">{label}</div>
        <div className="max-w-full truncate font-heading text-3xl font-semibold text-text-main">
           {unit?.title}
        </div>
        <div className="mt-3 inline-block rounded-full border border-border-main bg-main-bg px-3 py-1 text-xs uppercase tracking-[0.18em] text-text-main">
           {unit?.section === 'practice' ? 'Thực hành' : 'Lý thuyết'}
        </div>
      </Link>
   );
}

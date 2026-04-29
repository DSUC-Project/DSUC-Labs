import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowLeft, ArrowRight, CheckCircle2, Code, Home, Sparkles, Trophy, Terminal } from 'lucide-react';

import type { AcademyTrackCatalog } from '@/types';
import { normalizeAcademyCatalogTrack } from '@/lib/academy/catalog';
import { renderMd } from '@/lib/academy/md';
import {
  loadProgress,
  saveProgress,
  mergeProgressStates,
  markLessonComplete,
  markQuizPassed,
  isLessonCompleted,
  type ProgressState,
} from '@/lib/academy/progress';
import { getChecklist, setChecklist } from '@/lib/academy/checklist';
import { rowsToQuizQuestions } from '@/lib/academy/questions';
import { useStore } from '@/store/useStore';

const CELEBRATION_AUDIO_SRC = '/theme-submit.mp3';

const FIREWORK_PARTICLES = [
  { left: 8, top: 18, x: 54, y: -42, delay: 0.05, color: 'bg-amber-400', size: 'h-2 w-2' },
  { left: 12, top: 78, x: 72, y: 38, delay: 0.18, color: 'bg-pink-400', size: 'h-3 w-3' },
  { left: 20, top: 36, x: -48, y: 54, delay: 0.28, color: 'bg-white', size: 'h-2 w-2' },
  { left: 28, top: 16, x: 36, y: 68, delay: 0.36, color: 'bg-sky-400', size: 'h-2.5 w-2.5' },
  { left: 36, top: 84, x: -58, y: -50, delay: 0.12, color: 'bg-emerald-300', size: 'h-3 w-3' },
  { left: 44, top: 24, x: 76, y: -28, delay: 0.42, color: 'bg-white', size: 'h-2 w-2' },
  { left: 52, top: 68, x: -72, y: 44, delay: 0.22, color: 'bg-cyan-300', size: 'h-2.5 w-2.5' },
  { left: 60, top: 12, x: 62, y: 64, delay: 0.31, color: 'bg-amber-400', size: 'h-3 w-3' },
  { left: 68, top: 80, x: -42, y: -70, delay: 0.48, color: 'bg-fuchsia-400', size: 'h-2.5 w-2.5' },
  { left: 76, top: 30, x: 56, y: 52, delay: 0.15, color: 'bg-sky-400', size: 'h-2 w-2' },
  { left: 84, top: 62, x: -76, y: -36, delay: 0.38, color: 'bg-orange-300', size: 'h-3 w-3' },
  { left: 92, top: 20, x: -58, y: 62, delay: 0.26, color: 'bg-white', size: 'h-2 w-2' },
  { left: 14, top: 52, x: 86, y: -16, delay: 0.62, color: 'bg-pink-300', size: 'h-2.5 w-2.5' },
  { left: 88, top: 88, x: -82, y: -58, delay: 0.58, color: 'bg-cyan-300', size: 'h-3 w-3' },
  { left: 6, top: 44, x: 114, y: 8, delay: 0.7, color: 'bg-violet-300', size: 'h-2 w-2' },
  { left: 96, top: 48, x: -118, y: -6, delay: 0.74, color: 'bg-emerald-300', size: 'h-2 w-2' },
];

const CONFETTI_PIECES = Array.from({ length: 36 }, (_, index) => ({
  left: (index * 17) % 100,
  delay: (index % 12) * 0.08,
  duration: 1.7 + (index % 5) * 0.18,
  rotate: index % 2 === 0 ? 180 : -180,
  color:
    index % 5 === 0
      ? 'bg-amber-400'
      : index % 5 === 1
        ? 'bg-pink-400'
        : index % 5 === 2
          ? 'bg-sky-400'
          : index % 5 === 3
            ? 'bg-emerald-300'
            : 'bg-white',
}));

function rowsToProgressState(rows: any[]): ProgressState {
  const completedLessons: Record<string, boolean> = {};
  const quizPassed: Record<string, boolean> = {};
  const checklist: Record<string, boolean[]> = {};

  let xp = 0;
  let updatedAt = new Date().toISOString();

  for (const row of rows) {
    const key = `${row.track}:${row.lesson_id}`;
    completedLessons[key] = !!row.lesson_completed;
    quizPassed[key] = !!row.quiz_passed;

    if (Array.isArray(row.checklist)) {
      checklist[key] = row.checklist.map((item: unknown) => item === true);
    }

    xp += Number(row.xp_awarded || 0);
    if (row.updated_at && String(row.updated_at) > updatedAt) {
      updatedAt = String(row.updated_at);
    }
  }

  return {
    completedLessons,
    quizPassed,
    checklist,
    xp,
    updatedAt,
  };
}

function sanitizeProgressState(
  state: ProgressState,
  validLessonKeys: Set<string>
): { state: ProgressState; changed: boolean } {
  const completedLessons = Object.fromEntries(
    Object.entries(state.completedLessons || {}).filter(([key]) => validLessonKeys.has(key))
  );
  const quizPassed = Object.fromEntries(
    Object.entries(state.quizPassed || {}).filter(([key]) => validLessonKeys.has(key))
  );
  const checklist = Object.fromEntries(
    Object.entries(state.checklist || {}).filter(([key]) => validLessonKeys.has(key))
  );
  const xp = Object.values(completedLessons).filter(Boolean).length * 100;
  const sanitizedState: ProgressState = {
    completedLessons,
    quizPassed,
    checklist,
    xp,
    updatedAt: state.updatedAt || new Date().toISOString(),
  };

  const changed =
    Object.keys(completedLessons).length !== Object.keys(state.completedLessons || {}).length ||
    Object.keys(quizPassed).length !== Object.keys(state.quizPassed || {}).length ||
    Object.keys(checklist).length !== Object.keys(state.checklist || {}).length ||
    xp !== Number(state.xp || 0);

  return {
    state: sanitizedState,
    changed,
  };
}

function buildAuthHeaders(token: string | null, walletAddress: string | null, includeJson = false) {
  const headers: Record<string, string> = {};
  if (includeJson) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  } else if (walletAddress) {
    headers['x-wallet-address'] = walletAddress;
  }

  return headers;
}

export function AcademyLesson() {
  const params = useParams<{ track: string; lesson: string }>();
  const navigate = useNavigate();
  const { currentUser, walletAddress, authToken, fetchMembers, checkSession } = useStore();

  const track = String(params.track || '').trim();
  const lessonId = String(params.lesson || '').trim();
  if (!track || !lessonId) {
    return (
      <div className="py-20 text-center font-mono text-slate-400 uppercase tracking-widest">
        Không tìm thấy bài học
      </div>
    );
  }

  const identity = useMemo(
    () => ({
      userId: currentUser?.id ?? null,
      walletAddress: walletAddress ?? null,
    }),
    [currentUser?.id, walletAddress]
  );

  const apiBase = (import.meta as any).env.VITE_API_BASE_URL || '';
  const storedAuthToken =
    typeof window !== 'undefined' ? window.localStorage.getItem('auth_token') : null;
  const effectiveAuthToken = authToken || storedAuthToken;
  const authHeaders = useMemo(
    () => buildAuthHeaders(effectiveAuthToken, walletAddress),
    [effectiveAuthToken, walletAddress]
  );
  const jsonHeaders = useMemo(
    () => buildAuthHeaders(effectiveAuthToken, walletAddress, true),
    [effectiveAuthToken, walletAddress]
  );
  const canSyncRemote = !!currentUser;

  const [state, setState] = useState<ProgressState>(() => loadProgress(identity));
  const [trackInfo, setTrackInfo] = useState<AcademyTrackCatalog | null>(null);
  const [catalogLessonKeys, setCatalogLessonKeys] = useState<string[] | null>(null);
  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [busyFinish, setBusyFinish] = useState(false);
  const [err, setErr] = useState('');
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submittedQ, setSubmittedQ] = useState<Record<string, boolean>>({});
  const [currentStep, setCurrentStep] = useState(0);
  const [showCelebration, setShowCelebration] = useState(false);
  const [dbQuestions, setDbQuestions] = useState<ReturnType<typeof rowsToQuizQuestions>>([]);
  const [completionSaveStatus, setCompletionSaveStatus] =
    useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  const celebrationAudioRef = useRef<HTMLAudioElement | null>(null);
  const completionPromiseRef = useRef<Promise<boolean> | null>(null);

  const lessons = trackInfo?.lessons || [];
  const lesson = useMemo(
    () => lessons.find((item) => item.id === lessonId) || null,
    [lessonId, lessons]
  );
  const idx = lessons.findIndex((item) => item.id === lessonId);
  const nextLesson = idx >= 0 && idx < lessons.length - 1 ? lessons[idx + 1] : null;
  const isFinalLessonInTrack = idx >= 0 && idx === lessons.length - 1;
  const trackTitle = trackInfo?.title || track;

  const quiz = dbQuestions;
  const totalSteps = 1 + quiz.length;
  const progressPercentage = totalSteps > 1 ? (currentStep / (totalSteps - 1)) * 100 : 100;
  const lessonDone = isLessonCompleted(state, track, lessonId);
  const checklist = getChecklist(state, track, lessonId);
  const cl0 = checklist[0] ?? true;
  const currentQuizData = currentStep > 0 ? quiz[currentStep - 1] : null;
  const allSubmitted = quiz.every((item) => submittedQ[item.id]);
  const allCorrect = quiz.every((item) => answers[item.id] === item.correctChoiceId);
  const isFinalQuizStep = quiz.length > 0 && currentStep === totalSteps - 1;

  const syncMissingRows = useCallback(
    async (baseline: ProgressState, merged: ProgressState) => {
      if (!canSyncRemote) {
        return true;
      }

      let synced = true;
      const keys = new Set<string>([
        ...Object.keys(merged.completedLessons || {}),
        ...Object.keys(merged.quizPassed || {}),
        ...Object.keys(merged.checklist || {}),
      ]);

      for (const key of keys) {
        const [rowTrack, rowLessonId] = key.split(':');
        if (!rowTrack || !rowLessonId) {
          continue;
        }

        const mergedCompleted = !!merged.completedLessons[key];
        const mergedQuizPassed = !!merged.quizPassed[key];
        const mergedChecklist = merged.checklist?.[key] || [];

        const baselineCompleted = !!baseline.completedLessons[key];
        const baselineQuizPassed = !!baseline.quizPassed[key];
        const baselineChecklist = baseline.checklist?.[key] || [];

        const checklistChanged =
          baselineChecklist.length !== mergedChecklist.length ||
          baselineChecklist.some((value, index) => value !== mergedChecklist[index]);

        const rowChanged =
          baselineCompleted !== mergedCompleted ||
          baselineQuizPassed !== mergedQuizPassed ||
          checklistChanged;

        if (!rowChanged) {
          continue;
        }

        try {
          const response = await fetch(`${apiBase}/api/academy/progress`, {
            method: 'POST',
            headers: jsonHeaders,
            credentials: 'include',
            body: JSON.stringify({
              track: rowTrack,
              lesson_id: rowLessonId,
              lesson_completed: mergedCompleted,
              quiz_passed: mergedQuizPassed,
              checklist: mergedChecklist,
              xp_awarded: mergedCompleted ? 100 : 0,
            }),
          });

          if (!response.ok) {
            const result = await response.json().catch(() => null);
            if (
              response.status === 400 &&
              String(result?.message || '').includes('does not exist in academy catalog')
            ) {
              continue;
            }
            synced = false;
          }
        } catch {
          synced = false;
        }
      }

      return synced;
    },
    [apiBase, canSyncRemote, jsonHeaders]
  );

  const syncCurrentLesson = useCallback(
    async (next: ProgressState, options?: { recordReview?: boolean }) => {
      if (!canSyncRemote) {
        return false;
      }

      const progressKey = `${track}:${lessonId}`;
      const checklistForLesson = next.checklist?.[progressKey] || [];

      try {
        const response = await fetch(`${apiBase}/api/academy/progress`, {
          method: 'POST',
          headers: jsonHeaders,
          credentials: 'include',
          body: JSON.stringify({
            track,
            lesson_id: lessonId,
            lesson_completed: !!next.completedLessons[progressKey],
            quiz_passed: !!next.quizPassed[progressKey],
            checklist: checklistForLesson,
            xp_awarded: next.completedLessons[progressKey] ? 100 : 0,
            record_review: options?.recordReview === true,
          }),
        });

        if (!response.ok) {
          const result = await response.json().catch(() => null);
          throw new Error(result?.message || `Lỗi đồng bộ tiến độ Học viện (${response.status})`);
        }

        return true;
      } catch {
        return false;
      }
    },
    [apiBase, canSyncRemote, jsonHeaders, lessonId, track]
  );

  const persistProgress = useCallback(
    (next: ProgressState) => {
      setState(next);
      saveProgress(identity, next);
      void syncCurrentLesson(next);
    },
    [identity, syncCurrentLesson]
  );

  const persistCompletedLesson = useCallback(async () => {
    if (completionPromiseRef.current) {
      return completionPromiseRef.current;
    }

    const run = async () => {
      setCompletionSaveStatus('saving');
      setBusyFinish(true);

      try {
        const completedQuiz = markQuizPassed(state, track, lessonId);
        const completedLesson = markLessonComplete(completedQuiz, track, lessonId);
        const completedWithChecklist = setChecklist(completedLesson, track, lessonId, [
          cl0,
          true,
          true,
        ]);

        const synced = await syncCurrentLesson(completedWithChecklist, {
          recordReview: true,
        });

        if (!synced) {
          setCompletionSaveStatus('error');
          setErr(
            'LỖI ĐỒNG BỘ: Không thể lưu tiến độ lên hệ thống. Vui lòng thử lại sau.'
          );
          completionPromiseRef.current = null;
          return false;
        }

        setState(completedWithChecklist);
        saveProgress(identity, completedWithChecklist);
        void fetchMembers();
        if (effectiveAuthToken) {
          void checkSession();
        }
        setCompletionSaveStatus('saved');
        return true;
      } finally {
        setBusyFinish(false);
      }
    };

    completionPromiseRef.current = run();
    return completionPromiseRef.current;
  }, [
    checkSession,
    cl0,
    effectiveAuthToken,
    fetchMembers,
    identity,
    lessonId,
    state,
    syncCurrentLesson,
    track,
  ]);

  useEffect(() => {
    setState(loadProgress(identity));
    setAnswers({});
    setSubmittedQ({});
    setErr('');
    setShowCelebration(false);
    setCompletionSaveStatus('idle');
    completionPromiseRef.current = null;
    setCurrentStep(0);
  }, [identity, lessonId, track]);

  useEffect(() => {
    return () => {
      celebrationAudioRef.current?.pause();
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function fetchCatalog() {
      if (!canSyncRemote) {
        setCatalogLessonKeys(null);
        setTrackInfo(null);
        setLoadingCatalog(false);
        setErr('Vui lòng đăng nhập bằng DSUC account để sử dụng Học viện.');
        return;
      }

      setLoadingCatalog(true);
      try {
        const response = await fetch(`${apiBase}/api/academy/catalog`, {
          headers: authHeaders,
          credentials: 'include',
        });
        const result = await response.json().catch(() => null);

        if (!response.ok || !result?.success) {
          throw new Error(result?.message || 'Không thể tải danh sách học viện.');
        }

        const tracks = (result.data || []).map(normalizeAcademyCatalogTrack);
        const nextCatalogLessonKeys = tracks.flatMap((item) =>
          item.lessons.map((catalogLesson) => `${item.id}:${catalogLesson.id}`)
        );
        const foundTrack = tracks.find((item) => item.id === track) || null;
        const foundLesson = foundTrack?.lessons.find((item) => item.id === lessonId) || null;

        if (!cancelled) {
          setCatalogLessonKeys(nextCatalogLessonKeys);
          setTrackInfo(foundTrack);
          if (!foundTrack || !foundLesson) {
            setErr('Không tìm thấy bài học này trong cấu trúc.');
          }
        }
      } catch (error: any) {
        if (!cancelled) {
          setErr(error.message || 'Lỗi tải danh mục học viện.');
          setCatalogLessonKeys(null);
          setTrackInfo(null);
        }
      } finally {
        if (!cancelled) {
          setLoadingCatalog(false);
        }
      }
    }

    void fetchCatalog();
    return () => {
      cancelled = true;
    };
  }, [apiBase, authHeaders, canSyncRemote, lessonId, track]);

  useEffect(() => {
    if (!canSyncRemote || loadingCatalog || catalogLessonKeys === null) {
      return;
    }

    let cancelled = false;

    async function fetchRemoteProgress() {
      try {
        const response = await fetch(`${apiBase}/api/academy/progress`, {
          headers: authHeaders,
          credentials: 'include',
        });

        if (!response.ok) {
          return;
        }

        const result = await response.json();
        if (!result?.success || !result?.data?.rows || cancelled) {
          return;
        }

        const validLessonKeys = new Set(catalogLessonKeys);
        const sanitizedRemote = sanitizeProgressState(
          rowsToProgressState(result.data.rows),
          validLessonKeys
        );
        const sanitizedLocal = sanitizeProgressState(loadProgress(identity), validLessonKeys);
        const mergedState = mergeProgressStates(sanitizedLocal.state, sanitizedRemote.state);
        const backfilled = await syncMissingRows(sanitizedRemote.state, mergedState);

        if (cancelled) {
          return;
        }

        const authoritativeState = backfilled ? mergedState : sanitizedRemote.state;
        setState(authoritativeState);
        saveProgress(identity, authoritativeState);

        if (!backfilled) {
          setErr(
            'LỖI ĐỒNG BỘ: Không đồng bộ quá trình được, hệ thống sẽ sử dụng phiên bản trên máy chủ.'
          );
        }
      } catch {
        // Keep local progress as fallback.
      }
    }

    void fetchRemoteProgress();
    return () => {
      cancelled = true;
    };
  }, [apiBase, authHeaders, canSyncRemote, catalogLessonKeys, identity, loadingCatalog, syncMissingRows]);

  useEffect(() => {
    if (!canSyncRemote || !lesson) {
      setDbQuestions([]);
      return;
    }

    let cancelled = false;

    async function fetchLessonQuestions() {
      try {
        const query = new URLSearchParams({
          track,
          lesson_id: lessonId,
        });
        const response = await fetch(`${apiBase}/api/academy/questions?${query.toString()}`, {
          headers: authHeaders,
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error('Lỗi lấy bài kiểm tra.');
        }

        const result = await response.json();
        if (!cancelled && result?.success && Array.isArray(result.data)) {
          setDbQuestions(rowsToQuizQuestions(result.data));
        }
      } catch {
        if (!cancelled) {
          setDbQuestions([]);
        }
      }
    }

    void fetchLessonQuestions();
    return () => {
      cancelled = true;
    };
  }, [apiBase, authHeaders, canSyncRemote, lesson, lessonId, track]);

  useEffect(() => {
    const nextChecklist = [cl0, quiz.length === 0 ? true : allSubmitted, quiz.length === 0 ? true : allCorrect || lessonDone];
    const previousChecklist = getChecklist(state, track, lessonId);
    const same =
      previousChecklist.length === nextChecklist.length &&
      previousChecklist.every((value, index) => value === nextChecklist[index]);

    if (!same) {
      const updated = setChecklist(state, track, lessonId, nextChecklist);
      persistProgress(updated);
    }
  }, [
    allCorrect,
    allSubmitted,
    cl0,
    lessonDone,
    lessonId,
    persistProgress,
    quiz.length,
    state,
    track,
  ]);

  function isCorrect(questionId: string): boolean {
    const question = quiz.find((item) => item.id === questionId);
    if (!question) {
      return false;
    }

    return answers[questionId] === question.correctChoiceId;
  }

  function submitQuestion(questionId: string) {
    setErr('');
    const correct = isCorrect(questionId);
    const nextSubmittedQ = { ...submittedQ, [questionId]: true };
    setSubmittedQ(nextSubmittedQ);

    if (!correct) {
      setErr('CHƯA ĐÚNG. HÃY ĐỌC THẬT CẨN THẬN VÀ LÀM LẠI.');
      return;
    }

    const finalAnswersCorrect = quiz.every((item) =>
      item.id === questionId ? correct : answers[item.id] === item.correctChoiceId
    );
    const finalQuestionsSubmitted = quiz.every((item) => nextSubmittedQ[item.id]);

    if (isFinalQuizStep && finalQuestionsSubmitted && finalAnswersCorrect) {
      const completion = persistCompletedLesson();

      if (isFinalLessonInTrack) {
        void completion.then((saved) => {
          if (!saved) {
            return;
          }

          setShowCelebration(true);
          const audio = celebrationAudioRef.current;
          if (audio) {
            audio.currentTime = 0;
            audio.volume = 0.72;
            void audio.play().catch(() => undefined);
          }
        });
      }
    }
  }

  async function completeLesson(onComplete?: () => void) {
    setErr('');

    if (completionSaveStatus === 'saved') {
      onComplete?.();
      return true;
    }

    if (quiz.length > 0) {
      if (!allSubmitted) {
        setErr('LỖI: VẪN CÒN CÂU CHƯA NỘP XONG.');
        return false;
      }
      if (!allCorrect) {
        setErr('LỖI: BẠN PHẢI TRẢ LỜI ĐÚNG ĐỂ ĐI TIẾP.');
        return false;
      }
    }

    try {
      const saved = await persistCompletedLesson();
      if (!saved) {
        return false;
      }

      onComplete?.();
      return true;
    } catch {
      return false;
    }
  }

  async function finishLesson() {
    celebrationAudioRef.current?.pause();
    if (celebrationAudioRef.current) {
      celebrationAudioRef.current.currentTime = 0;
    }
    setShowCelebration(false);

    await completeLesson(() => {
      if (nextLesson) {
        navigate(`/academy/community/${track}/${nextLesson.id}`);
      } else {
        navigate(`/academy/community/${track}`);
      }
    });
  }

  async function exitToAcademy() {
    celebrationAudioRef.current?.pause();
    if (celebrationAudioRef.current) {
      celebrationAudioRef.current.currentTime = 0;
    }
    setShowCelebration(false);
    await completeLesson(() => navigate('/academy'));
  }

  if (loadingCatalog) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4">
        <div className="w-12 h-12 border-4 border-sky-200 border-t-sky-600 rounded-full animate-spin"></div>
        <div className="text-sky-600 font-bold uppercase tracking-widest text-sm">Đang tải bài học...</div>
      </div>
    );
  }

  if (!lesson || !trackInfo) {
    return (
      <div className="py-20 text-center text-slate-500 font-bold uppercase tracking-widest bg-white rounded-3xl border border-slate-200 m-8">
        {err || 'Không tìm thấy bài học'}
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20 mt-10 max-w-4xl mx-auto px-4 sm:px-6">
      <audio ref={celebrationAudioRef} src={CELEBRATION_AUDIO_SRC} preload="auto" />
      <CompletionCelebration
        open={showCelebration && isFinalLessonInTrack}
        busy={busyFinish}
        lessonTitle={lesson.title}
        graduationLabel={trackTitle}
        saveStatus={completionSaveStatus}
        trackTitle={trackTitle}
        onFinalize={() => void finishLesson()}
        onExit={() => void exitToAcademy()}
      />

      <div className="sticky top-24 z-50 flex flex-col gap-4 border-4 border-brutal-black bg-white p-4 shadow-neo">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate(`/academy/community/${track}`)}
            className="flex h-12 w-12 items-center justify-center bg-white border-4 border-brutal-black text-brutal-black hover:bg-brutal-yellow transition-colors shadow-neo-sm hover:translate-x-1 hover:translate-y-1 hover:shadow-none brutal-btn"
          >
            <ArrowLeft className="h-6 w-6" strokeWidth={3} />
          </button>

          <div className="relative mx-6 h-6 flex-1 border-4 border-brutal-black bg-gray-200">
            <div
              className="absolute left-0 top-0 h-full bg-brutal-blue border-r-4 border-brutal-black transition-all duration-500 ease-out"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>

          <div className="flex items-center gap-2 bg-brutal-yellow border-4 border-brutal-black px-4 py-2 font-mono text-sm font-black tracking-widest text-brutal-black shadow-neo-sm">
            <Trophy className="h-5 w-5 fill-brutal-black text-brutal-black" />
            <span className="hidden sm:inline">Chuỗi: </span>
            <span className="text-xl font-display text-brutal-black leading-none">{currentUser?.streak || 0}</span>
          </div>
        </div>

        <div className="flex items-center justify-between px-2 font-mono text-[10px] font-black uppercase tracking-widest text-brutal-black">
          <span className="bg-white border-2 border-brutal-black px-3 py-1 shadow-neo-sm shadow-brutal-black/50">{trackTitle}</span>
          <span className="bg-white border-2 border-brutal-black px-3 py-1 shadow-neo-sm shadow-brutal-black/50">
            Bước {currentStep + 1}/{totalSteps}
          </span>
        </div>
      </div>

      <div className="relative flex min-h-[60vh] flex-col border-4 border-brutal-black bg-white p-6 shadow-neo sm:p-10 brutal-card">
        {err && (
          <div className="mb-8 flex items-center gap-3 border-4 border-brutal-black bg-brutal-red px-5 py-4 font-mono text-[13px] font-black uppercase tracking-widest text-white shadow-neo-sm">
            <Terminal size={20} className="shrink-0 text-white" /> {err}
          </div>
        )}

        {currentStep === 0 && (
          <div className="animate-in slide-in-from-right-8 duration-500 fade-in flex-grow">
            <h1 className="mb-6 text-4xl font-display font-black text-brutal-black sm:text-5xl leading-tight uppercase tracking-tighter decoration-brutal-yellow decoration-4 underline underline-offset-8">
              {lesson.title}
            </h1>

            <div className="mb-8 max-w-none text-base font-medium leading-relaxed text-slate-800">
              {renderMd(lesson.content_md)}
            </div>

            {lesson.callouts?.length ? (
              <div className="mb-8 mt-8 grid grid-cols-1 gap-6">
                {lesson.callouts.map((callout, index) => (
                  <div
                    key={`${callout.title}-${index}`}
                    className="relative overflow-hidden border-4 border-brutal-black bg-brutal-pink p-6 shadow-neo-sm"
                  >
                    <div className="mb-3 flex items-center gap-3 font-display text-lg font-black text-brutal-black bg-white border-4 border-brutal-black px-4 py-2 w-fit uppercase tracking-widest">
                      <Terminal size={20} className="text-brutal-black" /> {callout.title || 'Lưu ý'}
                    </div>
                    <div className="relative z-10 text-base font-bold leading-relaxed text-brutal-black bg-white/50 p-4 border-2 border-brutal-black">
                      {callout.body}
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        )}

        {currentStep > 0 && currentQuizData && (() => {
          const submitted = !!submittedQ[currentQuizData.id];
          const correct = answers[currentQuizData.id] === currentQuizData.correctChoiceId;

          return (
            <div className="animate-in slide-in-from-right-8 duration-500 fade-in flex flex-grow flex-col justify-center">
              <h2 className="mb-8 flex items-center gap-3 border-b-4 border-brutal-black pb-4 font-display text-3xl font-black text-brutal-black uppercase tracking-tight">
                <Code className="h-10 w-10 text-brutal-pink" strokeWidth={3} /> CÂU HỎI [{currentStep}/{quiz.length}]
              </h2>

              <h3 className="mb-8 text-xl font-black leading-relaxed text-brutal-black bg-brutal-yellow border-4 border-brutal-black p-6 shadow-neo-sm">
                {currentQuizData.prompt}
              </h3>

              <div className="mb-8 space-y-4 text-base">
                {currentQuizData.choices.map((choice) => {
                  const selected = answers[currentQuizData.id] === choice.id;
                  const isChoiceCorrect = choice.id === currentQuizData.correctChoiceId;

                  let className = 'border-4 border-brutal-black hover:bg-brutal-yellow text-brutal-black bg-white shadow-neo-sm transition-all hover:translate-x-1 hover:translate-y-1 hover:shadow-none font-bold uppercase tracking-wide';
                  if (submitted) {
                    if (isChoiceCorrect) {
                      className =
                        'bg-brutal-green border-4 border-brutal-black text-brutal-black font-black shadow-neo-sm';
                    } else if (selected && !isChoiceCorrect) {
                      className =
                        'bg-brutal-red border-4 border-brutal-black text-white font-black shadow-neo-sm scale-[0.98]';
                    } else {
                      className = 'bg-gray-200 border-4 border-brutal-black text-gray-500 cursor-not-allowed font-medium opacity-80';
                    }
                  } else if (selected) {
                    className = 'border-4 border-brutal-black bg-brutal-blue text-white shadow-none translate-x-1 translate-y-1 font-black uppercase tracking-wide';
                  }

                  return (
                    <button
                      key={choice.id}
                      onClick={() => {
                        setErr('');
                        setAnswers((prevAnswers) => ({ ...prevAnswers, [currentQuizData.id]: choice.id }));
                        if (submittedQ[currentQuizData.id]) {
                          setSubmittedQ((prevSubmitted) => ({ ...prevSubmitted, [currentQuizData.id]: false }));
                        }
                      }}
                      className={`flex w-full cursor-pointer items-start p-5 text-left transition-all sm:items-center ${className}`}
                    >
                      <div
                        className={`mr-4 mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center border-4 transition-colors sm:mt-0 ${
                          submitted && isChoiceCorrect
                            ? 'border-brutal-black bg-brutal-black text-brutal-green'
                            : selected && !submitted
                              ? 'border-brutal-black bg-white text-brutal-blue'
                              : 'border-brutal-black bg-white'
                        }`}
                      >
                         {(submitted && isChoiceCorrect) || (selected && !submitted) ? <CheckCircle2 size={24} strokeWidth={4} /> : null}
                      </div>
                      <span className="leading-relaxed text-lg">{choice.label}</span>
                    </button>
                  );
                })}
              </div>

              {submitted && (
                <div
                  className={`animate-in zoom-in-95 border-4 p-6 duration-300 shadow-neo ${
                    correct
                      ? 'bg-brutal-green border-brutal-black text-brutal-black'
                      : 'bg-brutal-red border-brutal-black text-white'
                  }`}
                >
                  <p className={`mb-3 flex w-fit items-center gap-2 text-sm font-black uppercase tracking-widest border-4 border-brutal-black bg-white px-4 py-2 ${correct ? 'text-brutal-green' : 'text-brutal-red'}`}>
                    <Terminal size={20} strokeWidth={3} />
                    {correct ? 'CHÍNH XÁC' : 'CHƯA ĐÚNG'}
                  </p>
                  <p className="text-lg font-bold leading-relaxed">{currentQuizData.explanation}</p>
                </div>
              )}
            </div>
          );
        })()}

        <div className="mt-auto flex justify-end border-t-4 border-brutal-black pt-8 gap-4 flex-col sm:flex-row">
          {currentStep === 0 ? (
            <button
              onClick={() => {
                if (quiz.length > 0) {
                  setCurrentStep(1);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                } else {
                  void finishLesson();
                }
              }}
              className="flex w-full items-center justify-center gap-3 bg-brutal-blue border-4 border-brutal-black px-8 py-4 text-sm font-black uppercase tracking-widest text-white shadow-neo transition-all hover:bg-brutal-pink hover:translate-x-1 hover:translate-y-1 hover:shadow-none sm:w-auto brutal-btn"
            >
              {quiz.length > 0
                ? 'LÀM BÀI KIỂM TRA'
                : isFinalLessonInTrack
                  ? 'HOÀN THÀNH CHUYÊN ĐỀ'
                  : 'HOÀN THÀNH BÀI HỌC'}{' '}
              <ArrowRight className="h-6 w-6" strokeWidth={3} />
            </button>
          ) : currentQuizData ? (
            (() => {
              const submitted = !!submittedQ[currentQuizData.id];
              const correct = answers[currentQuizData.id] === currentQuizData.correctChoiceId;
              const hasSelected = !!answers[currentQuizData.id];

              if (!submitted || !correct) {
                return (
                  <button
                    onClick={() => submitQuestion(currentQuizData.id)}
                    disabled={!hasSelected}
                    className="flex w-full items-center justify-center gap-3 bg-brutal-black border-4 border-brutal-black px-8 py-4 text-sm font-black uppercase tracking-widest text-white shadow-neo transition-all hover:bg-white hover:text-brutal-black hover:translate-x-1 hover:translate-y-1 hover:shadow-none disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-gray-200 disabled:text-gray-500 disabled:shadow-none sm:w-auto brutal-btn"
                  >
                    XÁC NHẬN CHỌN
                  </button>
                );
              }

              if (currentStep < totalSteps - 1) {
                return (
                  <button
                    onClick={() => {
                      setCurrentStep((prev) => prev + 1);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="flex w-full items-center justify-center gap-3 bg-brutal-yellow border-4 border-brutal-black px-8 py-4 text-sm font-black uppercase tracking-widest text-brutal-black shadow-neo transition-all hover:bg-brutal-blue hover:text-white hover:translate-x-1 hover:translate-y-1 hover:shadow-none sm:w-auto brutal-btn"
                  >
                    CÂU TIẾP THEO <ArrowRight className="h-6 w-6" strokeWidth={3} />
                  </button>
                );
              }

              return (
                <button
                  onClick={() => void finishLesson()}
                  disabled={busyFinish}
                  className="flex w-full items-center justify-center gap-3 bg-brutal-green border-4 border-brutal-black px-8 py-4 text-sm font-black uppercase tracking-widest text-brutal-black shadow-neo transition-all hover:bg-brutal-white hover:text-brutal-black hover:translate-x-1 hover:translate-y-1 hover:shadow-none disabled:opacity-50 sm:w-auto overflow-hidden brutal-btn"
                >
                  {busyFinish
                    ? 'ĐANG LƯU...'
                    : isFinalLessonInTrack
                      ? 'HOÀN THÀNH CHUYÊN ĐỀ'
                      : 'HOÀN THÀNH BÀI HỌC'}{' '}
                  <CheckCircle2 className="h-6 w-6" strokeWidth={3} />
                </button>
              );
            })()
          ) : null}
        </div>
      </div>
    </div>
  );
}

function CompletionCelebration({
  open,
  busy,
  lessonTitle,
  graduationLabel,
  saveStatus,
  trackTitle,
  onFinalize,
  onExit,
}: {
  open: boolean;
  busy: boolean;
  lessonTitle: string;
  graduationLabel: string;
  saveStatus: 'idle' | 'saving' | 'saved' | 'error';
  trackTitle: string;
  onFinalize: () => void;
  onExit: () => void;
}) {
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onExit();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onExit, open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.98 }}
          transition={{ duration: reduceMotion ? 0 : 0.3, ease: 'easeOut' }}
          className="fixed inset-0 z-[10020] flex items-center justify-center overflow-hidden p-4 bg-slate-900/60 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="academy-completion-title"
        >
          {!reduceMotion && (
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
              {CONFETTI_PIECES.map((piece, index) => (
                <motion.span
                  key={`confetti-${index}`}
                  className={`absolute h-4 w-4 rounded-full ${piece.color} shadow-sm`}
                  style={{ left: `${piece.left}%`, top: '-8%' }}
                  initial={{ y: -40, opacity: 0, rotate: 0 }}
                  animate={{
                    y: ['0vh', '112vh'],
                    x: index % 2 === 0 ? [0, 22, -14, 12] : [0, -18, 20, -10],
                    opacity: [0, 1, 1, 0],
                    rotate: [0, piece.rotate, piece.rotate * 1.7],
                  }}
                  transition={{
                    duration: piece.duration,
                    delay: piece.delay,
                    repeat: Infinity,
                    repeatDelay: 0.55,
                    ease: 'easeInOut',
                  }}
                />
              ))}

              {FIREWORK_PARTICLES.map((particle, index) => (
                <motion.span
                  key={`${particle.left}-${particle.top}-${index}`}
                  className={`absolute rounded-full ${particle.size} ${particle.color} shadow-[0_0_10px_currentColor]`}
                  style={{ left: `${particle.left}%`, top: `${particle.top}%` }}
                  initial={{ opacity: 0, scale: 0.2, x: 0, y: 0 }}
                  animate={{
                    opacity: [0, 1, 0],
                    scale: [0.2, 1.4, 0.4],
                    x: particle.x,
                    y: particle.y,
                  }}
                  transition={{
                    duration: 0.95,
                    delay: particle.delay,
                    repeat: Infinity,
                    repeatDelay: 0.45,
                    ease: 'easeOut',
                  }}
                />
              ))}
            </div>
          )}

          <motion.div
            initial={reduceMotion ? false : { y: 18, opacity: 0, scale: 0.96 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { y: 12, opacity: 0, scale: 0.98 }}
            transition={{ duration: reduceMotion ? 0 : 0.34, ease: 'easeOut' }}
            className="relative z-10 w-full max-w-2xl overflow-hidden bg-brutal-pink p-8 sm:p-12 shadow-neo-lg text-center border-4 border-brutal-black brutal-card"
          >
            <motion.div
              animate={reduceMotion ? undefined : { rotate: [-6, 6, -6], scale: [1, 1.08, 1] }}
              transition={{ duration: 1.1, repeat: Infinity, ease: 'easeInOut' }}
              className="mx-auto mb-8 flex h-24 w-24 items-center justify-center bg-brutal-yellow text-brutal-black shadow-neo-sm border-4 border-brutal-black"
            >
              <Sparkles size={48} aria-hidden="true" strokeWidth={3} />
            </motion.div>

            <div className="relative mx-auto mb-6 flex w-fit items-center gap-2 bg-white px-4 py-2 text-[10px] font-black uppercase tracking-widest text-brutal-black border-4 border-brutal-black shadow-neo-sm shadow-brutal-black">
              <span className="h-3 w-3 bg-brutal-green animate-pulse border-2 border-brutal-black" />
              ĐÃ MỞ KHÓA TỐT NGHIỆP
            </div>

            <div className="mb-4 inline-block px-3 py-1 text-sm font-black uppercase tracking-wider text-brutal-black bg-white border-4 border-brutal-black shadow-neo-sm">
              Hoàn thành {trackTitle}
            </div>
            <h2
              id="academy-completion-title"
              className="relative font-display text-4xl font-black text-brutal-black sm:text-5xl uppercase tracking-tighter decoration-brutal-yellow decoration-4 underline underline-offset-8 mt-4"
            >
              Chúc mừng tốt nghiệp!
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-lg font-bold leading-relaxed text-brutal-black bg-white/80 p-4 border-2 border-brutal-black">
              Bạn đã chính thức vượt qua chuyên đề <span className="font-black text-brutal-blue">{graduationLabel}</span> bằng việc hoàn thành bài học cuối cùng{' '}
              <span className="font-black text-brutal-blue">{lessonTitle}</span>. Hãy tiếp tục duy trì thành tích đăng nhập này nhé.
            </p>

            <div className="mx-auto mt-8 w-fit bg-brutal-yellow border-4 border-brutal-black px-6 py-3 text-xs font-black uppercase tracking-widest text-brutal-black shadow-neo-sm">
              {saveStatus === 'saving' && 'Đang lưu tiến trình...'}
              {saveStatus === 'saved' && 'Đã lưu lại thành tích.'}
              {saveStatus === 'error' && 'Không lưu được. Hãy thử lại.'}
              {saveStatus === 'idle' && 'Chuẩn bị lưu dữ liệu.'}
            </div>

            <div className="relative mt-10 grid gap-4 sm:grid-cols-2">
              <button
                type="button"
                onClick={onFinalize}
                disabled={busy}
                className="flex items-center justify-center gap-2 min-h-14 bg-brutal-green px-6 py-4 text-sm font-black uppercase tracking-wider text-brutal-black shadow-neo transition-all hover:bg-brutal-blue hover:text-white hover:translate-x-1 hover:translate-y-1 hover:shadow-none disabled:opacity-50 border-4 border-brutal-black brutal-btn"
              >
                {busy || saveStatus === 'saving' ? 'ĐANG LƯU...' : 'NHẬN CÚP'}
                <CheckCircle2 size={24} strokeWidth={3} />
              </button>
              <button
                type="button"
                onClick={onExit}
                disabled={busy}
                className="flex items-center justify-center min-h-14 bg-white border-4 border-brutal-black px-6 py-4 text-sm font-black uppercase tracking-wider text-brutal-black shadow-neo transition-all hover:bg-brutal-yellow hover:-translate-y-1 hover:shadow-neo-lg disabled:opacity-50 brutal-btn"
              >
                <span className="inline-flex items-center justify-center gap-3">
                  <Home size={24} strokeWidth={3} aria-hidden="true" />
                  Về trang chủ Học Viện
                </span>
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

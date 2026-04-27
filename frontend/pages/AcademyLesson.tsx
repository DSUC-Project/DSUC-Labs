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
  { left: 8, top: 18, x: 54, y: -42, delay: 0.05, color: 'bg-cyber-yellow', size: 'h-2 w-2' },
  { left: 12, top: 78, x: 72, y: 38, delay: 0.18, color: 'bg-pink-400', size: 'h-3 w-3' },
  { left: 20, top: 36, x: -48, y: 54, delay: 0.28, color: 'bg-white', size: 'h-2 w-2' },
  { left: 28, top: 16, x: 36, y: 68, delay: 0.36, color: 'bg-cyber-blue', size: 'h-2.5 w-2.5' },
  { left: 36, top: 84, x: -58, y: -50, delay: 0.12, color: 'bg-lime-300', size: 'h-3 w-3' },
  { left: 44, top: 24, x: 76, y: -28, delay: 0.42, color: 'bg-white', size: 'h-2 w-2' },
  { left: 52, top: 68, x: -72, y: 44, delay: 0.22, color: 'bg-cyan-300', size: 'h-2.5 w-2.5' },
  { left: 60, top: 12, x: 62, y: 64, delay: 0.31, color: 'bg-cyber-yellow', size: 'h-3 w-3' },
  { left: 68, top: 80, x: -42, y: -70, delay: 0.48, color: 'bg-fuchsia-400', size: 'h-2.5 w-2.5' },
  { left: 76, top: 30, x: 56, y: 52, delay: 0.15, color: 'bg-cyber-blue', size: 'h-2 w-2' },
  { left: 84, top: 62, x: -76, y: -36, delay: 0.38, color: 'bg-orange-300', size: 'h-3 w-3' },
  { left: 92, top: 20, x: -58, y: 62, delay: 0.26, color: 'bg-white', size: 'h-2 w-2' },
  { left: 14, top: 52, x: 86, y: -16, delay: 0.62, color: 'bg-pink-300', size: 'h-2.5 w-2.5' },
  { left: 88, top: 88, x: -82, y: -58, delay: 0.58, color: 'bg-cyan-300', size: 'h-3 w-3' },
  { left: 6, top: 44, x: 114, y: 8, delay: 0.7, color: 'bg-violet-300', size: 'h-2 w-2' },
  { left: 96, top: 48, x: -118, y: -6, delay: 0.74, color: 'bg-lime-300', size: 'h-2 w-2' },
];

const CONFETTI_PIECES = Array.from({ length: 36 }, (_, index) => ({
  left: (index * 17) % 100,
  delay: (index % 12) * 0.08,
  duration: 1.7 + (index % 5) * 0.18,
  rotate: index % 2 === 0 ? 180 : -180,
  color:
    index % 5 === 0
      ? 'bg-cyber-yellow'
      : index % 5 === 1
        ? 'bg-pink-400'
        : index % 5 === 2
          ? 'bg-cyber-blue'
          : index % 5 === 3
            ? 'bg-lime-300'
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
      <div className="py-20 text-center font-mono text-white/40 uppercase tracking-widest">
        Lesson not found
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
          throw new Error(result?.message || `Academy progress sync failed (${response.status})`);
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
            'SYNC_ERROR: Academy progress was not written to the database. Please stay signed in and retry.'
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
        setTrackInfo(null);
        setLoadingCatalog(false);
        setErr('Please sign in with a DSUC account to use Academy.');
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
          throw new Error(result?.message || 'Failed to load academy catalog.');
        }

        const tracks = (result.data || []).map(normalizeAcademyCatalogTrack);
        const foundTrack = tracks.find((item) => item.id === track) || null;
        const foundLesson = foundTrack?.lessons.find((item) => item.id === lessonId) || null;

        if (!cancelled) {
          setTrackInfo(foundTrack);
          if (!foundTrack || !foundLesson) {
            setErr('Lesson not found in academy catalog.');
          }
        }
      } catch (error: any) {
        if (!cancelled) {
          setErr(error.message || 'Failed to load academy catalog.');
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
    if (!canSyncRemote) {
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

        const remoteState = rowsToProgressState(result.data.rows);
        const localState = loadProgress(identity);
        const mergedState = mergeProgressStates(localState, remoteState);
        const backfilled = await syncMissingRows(remoteState, mergedState);

        if (cancelled) {
          return;
        }

        const authoritativeState = backfilled ? mergedState : remoteState;
        setState(authoritativeState);
        saveProgress(identity, authoritativeState);

        if (!backfilled) {
          setErr(
            'SYNC_ERROR: Local academy progress could not be written to the database. Remote progress is shown instead.'
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
  }, [apiBase, authHeaders, canSyncRemote, identity, syncMissingRows]);

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
          throw new Error('Failed to load lesson questions.');
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
      setErr('SYS_ERROR: INCORRECT_DATA. RECALIBRATE AND RETRY.');
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
        setErr('ERROR: PENDING_SUBMISSIONS_DETECTED.');
        return false;
      }
      if (!allCorrect) {
        setErr('ERROR: INVALID_PARAMETERS. FIX BEFORE CONTINUING.');
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
        navigate(`/academy/learn/${track}/${nextLesson.id}`);
      } else {
        navigate(`/academy/track/${track}`);
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
      <div className="py-20 text-center font-mono text-white/40 uppercase tracking-widest">
        Loading lesson...
      </div>
    );
  }

  if (!lesson || !trackInfo) {
    return (
      <div className="py-20 text-center font-mono text-white/40 uppercase tracking-widest">
        {err || 'Lesson not found'}
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20 max-w-4xl mx-auto">
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

      <div className="sticky top-24 z-50 flex flex-col gap-4 rounded-lg border border-cyber-blue/30 bg-surface/85 p-4 backdrop-blur-md cyber-clip-bottom shadow-[0_0_20px_rgba(41,121,255,0.1)]">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate(`/academy/track/${track}`)}
            className="flex h-10 w-10 items-center justify-center border border-cyber-blue/50 text-cyber-blue transition-colors hover:bg-cyber-blue hover:text-black"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>

          <div className="relative mx-6 h-2 flex-1 overflow-hidden border border-cyber-blue/20 bg-black">
            <div
              className="absolute left-0 top-0 h-full bg-cyber-blue transition-all duration-500 ease-out shadow-[0_0_10px_rgba(41,121,255,1)]"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>

          <div className="flex items-center gap-2 font-mono text-xs font-bold tracking-widest text-cyber-blue">
            <Trophy className="h-4 w-4 text-cyber-yellow" />
            <span className="hidden sm:inline">STREAK: </span>
            {currentUser?.streak || 0}
          </div>
        </div>

        <div className="flex items-center justify-between px-2 font-mono text-[10px] uppercase tracking-widest text-white/50">
          <span>{trackTitle}</span>
          <span>
            PHASE {currentStep + 1}/{totalSteps}
          </span>
        </div>
      </div>

      <div className="relative flex min-h-[60vh] flex-col border border-white/20 bg-surface/70 p-6 shadow-[0_0_30px_rgba(41,121,255,0.05)] backdrop-blur-xl sm:p-10">
        {err && (
          <div className="mb-6 flex animate-pulse items-center gap-3 border border-red-500/50 bg-red-500/10 px-5 py-4 font-mono text-xs font-bold uppercase tracking-widest text-red-500">
            <Terminal size={14} className="shrink-0" /> {err}
          </div>
        )}

        {currentStep === 0 && (
          <div className="animate-in slide-in-from-right-8 duration-500 fade-in flex-grow">
            <h1 className="mb-6 text-3xl font-display font-bold uppercase tracking-widest text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.2)] sm:text-5xl">
              {lesson.title}
            </h1>

            <div className="prose prose-invert prose-p:text-white/80 prose-headings:font-display prose-headings:font-bold prose-headings:tracking-wider prose-headings:uppercase prose-a:text-cyber-blue prose-a:no-underline hover:prose-a:underline mb-8 max-w-none text-base font-sans leading-relaxed sm:text-lg">
              {renderMd(lesson.content_md)}
            </div>

            {lesson.callouts?.length ? (
              <div className="mb-8 mt-8 grid grid-cols-1 gap-4">
                {lesson.callouts.map((callout, index) => (
                  <div
                    key={`${callout.title}-${index}`}
                    className="relative overflow-hidden border-l-4 border-cyber-blue bg-cyber-blue/5 p-5"
                  >
                    <div className="mb-2 flex items-center gap-2 font-display text-sm font-bold uppercase tracking-widest text-cyber-blue">
                      <Terminal size={14} /> {callout.title || 'NOTE'}
                    </div>
                    <div className="relative z-10 font-mono text-sm leading-relaxed text-white/70 sm:text-base">
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
              <h2 className="mb-8 flex items-center gap-3 border-b border-cyber-blue/20 pb-4 font-display text-2xl font-bold uppercase tracking-widest text-white">
                <Code className="h-5 w-5 text-cyber-blue" /> EXAM_QUERY [{currentStep}/{quiz.length}]
              </h2>

              <h3 className="mb-8 font-mono text-lg font-bold leading-relaxed text-white">
                {currentQuizData.prompt}
              </h3>

              <div className="mb-8 space-y-4 font-mono text-sm">
                {currentQuizData.choices.map((choice) => {
                  const selected = answers[currentQuizData.id] === choice.id;
                  const isChoiceCorrect = choice.id === currentQuizData.correctChoiceId;

                  let className = 'border-white/10 hover:border-cyber-blue/50 text-white/70 bg-black/40';
                  if (submitted) {
                    if (isChoiceCorrect) {
                      className =
                        'bg-cyber-blue/20 border-cyber-blue text-cyber-blue shadow-[0_0_15px_rgba(41,121,255,0.2)]';
                    } else if (selected && !isChoiceCorrect) {
                      className =
                        'bg-cyber-yellow/10 border-cyber-yellow text-cyber-yellow shadow-[0_0_15px_rgba(255,214,0,0.2)]';
                    } else {
                      className = 'opacity-40 bg-black/60 border-white/5';
                    }
                  } else if (selected) {
                    className = 'border-cyber-blue bg-cyber-blue/10 text-white shadow-[0_0_10px_rgba(41,121,255,0.2)]';
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
                      className={`flex w-full cursor-pointer items-start border p-5 text-left text-base transition-all sm:items-center ${className}`}
                    >
                      <div
                        className={`mr-4 mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center border font-bold transition-colors sm:mt-0 ${
                          submitted && isChoiceCorrect
                            ? 'border-cyber-blue bg-cyber-blue'
                            : selected && !submitted
                              ? 'border-cyber-blue bg-cyber-blue'
                              : 'border-white/20'
                        }`}
                      />
                      <span className="leading-relaxed">{choice.label}</span>
                    </button>
                  );
                })}
              </div>

              {submitted && (
                <div
                  className={`animate-in zoom-in-95 border p-6 font-mono text-sm duration-300 ${
                    correct
                      ? 'bg-cyber-blue/10 text-cyber-blue border-cyber-blue shadow-[inset_0_0_20px_rgba(41,121,255,0.1)]'
                      : 'bg-cyber-yellow/10 text-cyber-yellow border-cyber-yellow shadow-[inset_0_0_20px_rgba(255,214,0,0.1)]'
                  }`}
                >
                  <p className="mb-2 flex items-center gap-2 text-lg font-bold uppercase tracking-widest">
                    <Terminal size={20} />
                    {correct ? 'VALID_RESPONSE' : 'INVALID_RESPONSE'}
                  </p>
                  <p className="text-sm leading-relaxed text-white/80 opacity-90">{currentQuizData.explanation}</p>
                </div>
              )}
            </div>
          );
        })()}

        <div className="mt-auto flex justify-end border-t border-cyber-blue/20 pt-8">
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
              className="flex w-full items-center justify-center gap-2 bg-cyber-blue px-8 py-4 font-display text-sm font-bold uppercase tracking-widest text-black shadow-[0_0_15px_rgba(41,121,255,0.4)] transition-all hover:bg-white sm:w-auto"
            >
              {quiz.length > 0
                ? 'START EXAM MODULE'
                : isFinalLessonInTrack
                  ? 'FINALIZE TRACK'
                  : 'FINALIZE MODULE'}{' '}
              <ArrowRight className="h-5 w-5" />
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
                    className="flex w-full items-center justify-center gap-2 border border-cyber-blue bg-black px-8 py-4 font-display text-sm font-bold uppercase tracking-widest text-cyber-blue shadow-[0_0_10px_rgba(41,121,255,0.2)] transition-all hover:bg-cyber-blue hover:text-black disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-black disabled:hover:text-cyber-blue sm:w-auto"
                  >
                    EXECUTE QUERY
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
                    className="flex w-full items-center justify-center gap-2 bg-cyber-blue px-8 py-4 font-display text-sm font-bold uppercase tracking-widest text-black shadow-[0_0_15px_rgba(41,121,255,0.4)] transition-all hover:bg-white sm:w-auto"
                  >
                    NEXT QUERY <ArrowRight className="h-5 w-5" />
                  </button>
                );
              }

              return (
                <button
                  onClick={() => void finishLesson()}
                  disabled={busyFinish}
                  className="flex w-full items-center justify-center gap-2 bg-cyber-blue px-8 py-4 font-display text-sm font-bold uppercase tracking-widest text-black shadow-[0_0_15px_rgba(41,121,255,0.4)] transition-all hover:bg-white disabled:opacity-50 sm:w-auto"
                >
                  {busyFinish
                    ? 'SAVING...'
                    : isFinalLessonInTrack
                      ? 'FINALIZE TRACK'
                      : 'FINALIZE MODULE'}{' '}
                  <CheckCircle2 className="h-5 w-5" />
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
          className="fixed inset-0 z-[10020] flex items-center justify-center overflow-hidden p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="academy-completion-title"
        >
          <div className="absolute inset-0 bg-background/80 backdrop-blur-md" />

          {!reduceMotion && (
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
              {CONFETTI_PIECES.map((piece, index) => (
                <motion.span
                  key={`confetti-${index}`}
                  className={`absolute h-4 w-2 rounded-sm ${piece.color} shadow-[0_0_14px_currentColor]`}
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
                  className={`absolute rounded-full ${particle.size} ${particle.color} shadow-[0_0_22px_currentColor]`}
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

              <motion.div
                className="absolute left-1/2 top-1/2 h-[38rem] w-[38rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-pink-300/25"
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: [0.2, 0.7, 0.2], scale: [0.72, 1.08, 0.72], rotate: [0, 8, 0] }}
                transition={{ duration: 1.25, repeat: Infinity, ease: 'easeInOut' }}
              />
              <motion.div
                className="absolute left-1/2 top-1/2 h-[25rem] w-[25rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyber-yellow/50"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: [0.35, 0.85, 0.35], scale: [0.75, 1.12, 0.75], rotate: [0, -10, 0] }}
                transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}
              />
              <motion.div
                className="absolute left-1/2 top-1/2 h-[16rem] w-[16rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-300/45"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: [0.25, 0.75, 0.25], scale: [0.8, 1.18, 0.8], rotate: [0, 14, 0] }}
                transition={{ duration: 0.82, repeat: Infinity, ease: 'easeInOut' }}
              />
            </div>
          )}

          <motion.div
            initial={reduceMotion ? false : { y: 18, opacity: 0, scale: 0.96 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { y: 12, opacity: 0, scale: 0.98 }}
            transition={{ duration: reduceMotion ? 0 : 0.34, ease: 'easeOut' }}
            className="relative z-10 w-full max-w-2xl overflow-hidden cyber-card border border-cyber-yellow/60 bg-surface/95 p-6 text-center shadow-[0_0_60px_rgba(255,214,0,0.24)] sm:p-8"
          >
            <div className="pointer-events-none absolute -left-16 -top-16 h-36 w-36 rounded-full bg-pink-400/20 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-16 -right-16 h-40 w-40 rounded-full bg-cyan-300/20 blur-3xl" />

            <motion.div
              animate={reduceMotion ? undefined : { rotate: [-6, 6, -6], scale: [1, 1.08, 1] }}
              transition={{ duration: 1.1, repeat: Infinity, ease: 'easeInOut' }}
              className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full border border-cyber-yellow/60 bg-gradient-to-br from-cyber-yellow/25 via-pink-400/20 to-cyber-blue/20 text-cyber-yellow shadow-[0_0_30px_rgba(255,214,0,0.25)]"
            >
              <Sparkles size={34} aria-hidden="true" />
            </motion.div>

            <div className="relative mx-auto mb-4 flex w-fit items-center gap-2 rounded-full border border-pink-300/40 bg-pink-300/10 px-4 py-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.28em] text-pink-200">
              <span className="h-1.5 w-1.5 rounded-full bg-pink-300 shadow-[0_0_10px_rgba(249,168,212,0.8)]" />
              Graduation Unlocked
            </div>

            <div className="mb-3 font-mono text-[10px] font-bold uppercase tracking-[0.35em] text-cyber-blue">
              {trackTitle} cleared
            </div>
            <h2
              id="academy-completion-title"
              className="relative font-display text-3xl font-black uppercase tracking-widest text-white sm:text-5xl"
            >
              {graduationLabel} Graduate
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-white/70 sm:text-base">
              You have graduated <span className="text-cyber-yellow">{graduationLabel}</span> by completing{' '}
              <span className="text-cyber-yellow">{lessonTitle}</span>. Do not forget to review every day to protect your streak and keep your Solana skills sharp.
            </p>

            <div className="mx-auto mt-5 w-fit rounded-full border border-cyber-blue/30 bg-cyber-blue/10 px-4 py-2 font-mono text-xs uppercase tracking-widest text-cyber-blue">
              {saveStatus === 'saving' && 'Saving progress to DSUC Academy...'}
              {saveStatus === 'saved' && 'Progress saved to Academy.'}
              {saveStatus === 'error' && 'Database save failed. Press Finalize to retry.'}
              {saveStatus === 'idle' && 'Preparing Academy progress save.'}
            </div>

            <div className="relative mt-8 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={onFinalize}
                disabled={busy}
                className="min-h-12 bg-cyber-yellow px-6 py-3 font-display text-sm font-bold uppercase tracking-widest text-black transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyber-yellow/80 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-60"
              >
                {busy || saveStatus === 'saving' ? 'SAVING...' : 'FINALIZE TRACK'}
              </button>
              <button
                type="button"
                onClick={onExit}
                disabled={busy}
                className="min-h-12 border border-cyber-blue/50 bg-cyber-blue/10 px-6 py-3 font-display text-sm font-bold uppercase tracking-widest text-cyber-blue transition-colors hover:bg-cyber-blue hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyber-blue/80 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-60"
              >
                <span className="inline-flex items-center justify-center gap-2">
                  <Home size={16} aria-hidden="true" />
                  Exit Academy
                </span>
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

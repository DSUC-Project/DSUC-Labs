import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Code,
  Flame,
  Home,
  Sparkles,
  Trophy,
  Terminal,
} from "lucide-react";

import type { AcademyTrackCatalog } from "@/types";
import { normalizeAcademyCatalogTrack } from "@/lib/academy/catalog";
import { localizeCommunityCatalogTrack } from "@/lib/academy/academyLocale";
import { renderMd } from "@/lib/academy/md";
import {
  loadProgress,
  saveProgress,
  mergeProgressStates,
  markLessonComplete,
  markQuizPassed,
  isLessonCompleted,
  type ProgressState,
} from "@/lib/academy/progress";
import { getChecklist, setChecklist } from "@/lib/academy/checklist";
import {
  ACADEMY_STREAK_COMPLETION_SECONDS,
  ACADEMY_STREAK_REVIEW_SECONDS,
  useAcademyStudyTimer,
} from "@/lib/academy/useAcademyStudyTimer";
import { rowsToQuizQuestions } from "@/lib/academy/questions";
import { useStore } from "@/store/useStore";
import {
  AcademyBadge,
  AcademyPage,
  AcademyPanel,
  AcademyProgressBar,
} from "@/components/academy/AcademyPrimitives";
import { streakTheme } from "@/lib/streakTheme";
import { useLocale } from "@/lib/locale";

const CELEBRATION_AUDIO_SRC = "/theme-submit.mp3";

const FIREWORK_PARTICLES = [
  {
    left: 8,
    top: 18,
    x: 54,
    y: -42,
    delay: 0.05,
    color: "bg-amber-400",
    size: "h-2 w-2",
  },
  {
    left: 12,
    top: 78,
    x: 72,
    y: 38,
    delay: 0.18,
    color: "bg-primary",
    size: "h-3 w-3",
  },
  {
    left: 20,
    top: 36,
    x: -48,
    y: 54,
    delay: 0.28,
    color: "bg-white",
    size: "h-2 w-2",
  },
  {
    left: 28,
    top: 16,
    x: 36,
    y: 68,
    delay: 0.36,
    color: "bg-primary",
    size: "h-2.5 w-2.5",
  },
  {
    left: 36,
    top: 84,
    x: -58,
    y: -50,
    delay: 0.12,
    color: "bg-emerald-300",
    size: "h-3 w-3",
  },
  {
    left: 44,
    top: 24,
    x: 76,
    y: -28,
    delay: 0.42,
    color: "bg-white",
    size: "h-2 w-2",
  },
  {
    left: 52,
    top: 68,
    x: -72,
    y: 44,
    delay: 0.22,
    color: "bg-primary",
    size: "h-2.5 w-2.5",
  },
  {
    left: 60,
    top: 12,
    x: 62,
    y: 64,
    delay: 0.31,
    color: "bg-amber-400",
    size: "h-3 w-3",
  },
  {
    left: 68,
    top: 80,
    x: -42,
    y: -70,
    delay: 0.48,
    color: "bg-amber-300",
    size: "h-2.5 w-2.5",
  },
  {
    left: 76,
    top: 30,
    x: 56,
    y: 52,
    delay: 0.15,
    color: "bg-primary",
    size: "h-2 w-2",
  },
  {
    left: 84,
    top: 62,
    x: -76,
    y: -36,
    delay: 0.38,
    color: "bg-orange-300",
    size: "h-3 w-3",
  },
  {
    left: 92,
    top: 20,
    x: -58,
    y: 62,
    delay: 0.26,
    color: "bg-white",
    size: "h-2 w-2",
  },
  {
    left: 14,
    top: 52,
    x: 86,
    y: -16,
    delay: 0.62,
    color: "bg-primary",
    size: "h-2.5 w-2.5",
  },
  {
    left: 88,
    top: 88,
    x: -82,
    y: -58,
    delay: 0.58,
    color: "bg-primary",
    size: "h-3 w-3",
  },
  {
    left: 6,
    top: 44,
    x: 114,
    y: 8,
    delay: 0.7,
    color: "bg-amber-300",
    size: "h-2 w-2",
  },
  {
    left: 96,
    top: 48,
    x: -118,
    y: -6,
    delay: 0.74,
    color: "bg-emerald-300",
    size: "h-2 w-2",
  },
];

const CONFETTI_PIECES = Array.from({ length: 36 }, (_, index) => ({
  left: (index * 17) % 100,
  delay: (index % 12) * 0.08,
  duration: 1.7 + (index % 5) * 0.18,
  rotate: index % 2 === 0 ? 180 : -180,
  color:
    index % 5 === 0
      ? "bg-amber-400"
      : index % 5 === 1
        ? "bg-primary"
        : index % 5 === 2
          ? "bg-primary"
          : index % 5 === 3
            ? "bg-emerald-300"
            : "bg-white",
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
  validLessonKeys: Set<string>,
): { state: ProgressState; changed: boolean } {
  const completedLessons = Object.fromEntries(
    Object.entries(state.completedLessons || {}).filter(([key]) =>
      validLessonKeys.has(key),
    ),
  );
  const quizPassed = Object.fromEntries(
    Object.entries(state.quizPassed || {}).filter(([key]) =>
      validLessonKeys.has(key),
    ),
  );
  const checklist = Object.fromEntries(
    Object.entries(state.checklist || {}).filter(([key]) =>
      validLessonKeys.has(key),
    ),
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
    Object.keys(completedLessons).length !==
      Object.keys(state.completedLessons || {}).length ||
    Object.keys(quizPassed).length !==
      Object.keys(state.quizPassed || {}).length ||
    Object.keys(checklist).length !==
      Object.keys(state.checklist || {}).length ||
    xp !== Number(state.xp || 0);

  return {
    state: sanitizedState,
    changed,
  };
}

function buildAuthHeaders(
  token: string | null,
  walletAddress: string | null,
  includeJson = false,
) {
  const headers: Record<string, string> = {};
  if (includeJson) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  } else if (walletAddress) {
    headers["x-wallet-address"] = walletAddress;
  }

  return headers;
}

export function AcademyLesson() {
  const { text, isVIE } = useLocale();
  const params = useParams<{ track: string; lesson: string }>();
  const navigate = useNavigate();
  const { currentUser, walletAddress, authToken, fetchMembers, checkSession } =
    useStore();

  const track = String(params.track || "").trim();
  const lessonId = String(params.lesson || "").trim();
  if (!track || !lessonId) {
    return (
      <div className="py-20 text-center font-mono font-bold uppercase tracking-widest text-gray-500">
        {text("Lesson not found", "Không tìm thấy lesson")}
      </div>
    );
  }

  const identity = useMemo(
    () => ({
      userId: currentUser?.id ?? null,
      walletAddress: walletAddress ?? null,
    }),
    [currentUser?.id, walletAddress],
  );

  const apiBase = (import.meta as any).env.VITE_API_BASE_URL || "";
  const storedAuthToken =
    typeof window !== "undefined"
      ? window.localStorage.getItem("auth_token")
      : null;
  const effectiveAuthToken = authToken || storedAuthToken;
  const authHeaders = useMemo(
    () => buildAuthHeaders(effectiveAuthToken, walletAddress),
    [effectiveAuthToken, walletAddress],
  );
  const jsonHeaders = useMemo(
    () => buildAuthHeaders(effectiveAuthToken, walletAddress, true),
    [effectiveAuthToken, walletAddress],
  );
  const canSyncRemote = !!currentUser;

  const [state, setState] = useState<ProgressState>(() =>
    loadProgress(identity),
  );
  const [trackInfo, setTrackInfo] = useState<AcademyTrackCatalog | null>(null);
  const [catalogLessonKeys, setCatalogLessonKeys] = useState<string[] | null>(
    null,
  );
  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [busyFinish, setBusyFinish] = useState(false);
  const [err, setErr] = useState("");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submittedQ, setSubmittedQ] = useState<Record<string, boolean>>({});
  const [currentStep, setCurrentStep] = useState(0);
  const [showCelebration, setShowCelebration] = useState(false);
  const [dbQuestions, setDbQuestions] = useState<
    ReturnType<typeof rowsToQuizQuestions>
  >([]);
  const [completionSaveStatus, setCompletionSaveStatus] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const [reviewRecorded, setReviewRecorded] = useState(false);

  const celebrationAudioRef = useRef<HTMLAudioElement | null>(null);
  const completionPromiseRef = useRef<Promise<boolean> | null>(null);

  const localizedTrackInfo = trackInfo
    ? localizeCommunityCatalogTrack(trackInfo, isVIE)
    : null;
  const lessons = localizedTrackInfo?.lessons || [];
  const lesson = useMemo(
    () => lessons.find((item) => item.id === lessonId) || null,
    [lessonId, lessons],
  );
  const idx = lessons.findIndex((item) => item.id === lessonId);
  const nextLesson =
    idx >= 0 && idx < lessons.length - 1 ? lessons[idx + 1] : null;
  const isFinalLessonInTrack = idx >= 0 && idx === lessons.length - 1;
  const trackTitle = localizedTrackInfo?.title || track;

  const quiz = dbQuestions;
  const totalSteps = 1 + quiz.length;
  const progressPercentage =
    totalSteps > 1 ? (currentStep / (totalSteps - 1)) * 100 : 100;
  const lessonDone = isLessonCompleted(state, track, lessonId);
  const checklist = getChecklist(state, track, lessonId);
  const cl0 = checklist[0] ?? true;
  const currentQuizData = currentStep > 0 ? quiz[currentStep - 1] : null;
  const allSubmitted = quiz.every((item) => submittedQ[item.id]);
  const allCorrect = quiz.every(
    (item) => answers[item.id] === item.correctChoiceId,
  );
  const isFinalQuizStep = quiz.length > 0 && currentStep === totalSteps - 1;
  const { studySeconds, reviewEligible } = useAcademyStudyTimer({
    sessionKey: `${track}:${lessonId}:${currentUser?.id || walletAddress || "guest"}`,
    enabled: !!lessonId,
  });

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
        const [rowTrack, rowLessonId] = key.split(":");
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
          baselineChecklist.some(
            (value, index) => value !== mergedChecklist[index],
          );

        const rowChanged =
          baselineCompleted !== mergedCompleted ||
          baselineQuizPassed !== mergedQuizPassed ||
          checklistChanged;

        if (!rowChanged) {
          continue;
        }

        try {
          const response = await fetch(`${apiBase}/api/academy/progress`, {
            method: "POST",
            headers: jsonHeaders,
            credentials: "include",
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
              String(result?.message || "").includes(
                "does not exist in academy catalog",
              )
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
    [apiBase, canSyncRemote, jsonHeaders],
  );

  const syncCurrentLesson = useCallback(
    async (
      next: ProgressState,
      options?: { recordReview?: boolean; studySeconds?: number },
    ) => {
      if (!canSyncRemote) {
        return false;
      }

      const progressKey = `${track}:${lessonId}`;
      const checklistForLesson = next.checklist?.[progressKey] || [];

      try {
        const response = await fetch(`${apiBase}/api/academy/progress`, {
          method: "POST",
          headers: jsonHeaders,
          credentials: "include",
          body: JSON.stringify({
            track,
            lesson_id: lessonId,
            lesson_completed: !!next.completedLessons[progressKey],
            quiz_passed: !!next.quizPassed[progressKey],
            checklist: checklistForLesson,
            xp_awarded: next.completedLessons[progressKey] ? 100 : 0,
            record_review: options?.recordReview === true,
            study_seconds: Math.max(
              0,
              Math.floor(Number(options?.studySeconds || 0)),
            ),
          }),
        });

        if (!response.ok) {
          const result = await response.json().catch(() => null);
          throw new Error(
            result?.message ||
              `Academy progress sync failed (${response.status})`,
          );
        }

        return true;
      } catch {
        return false;
      }
    },
    [apiBase, canSyncRemote, jsonHeaders, lessonId, track],
  );

  const persistProgress = useCallback(
    (next: ProgressState) => {
      setState(next);
      saveProgress(identity, next);
      void syncCurrentLesson(next);
    },
    [identity, syncCurrentLesson],
  );

  const persistCompletedLesson = useCallback(async () => {
    if (completionPromiseRef.current) {
      return completionPromiseRef.current;
    }

    const run = async () => {
      setCompletionSaveStatus("saving");
      setBusyFinish(true);

      try {
        const completedQuiz = markQuizPassed(state, track, lessonId);
        const completedLesson = markLessonComplete(
          completedQuiz,
          track,
          lessonId,
        );
        const completedWithChecklist = setChecklist(
          completedLesson,
          track,
          lessonId,
          [cl0, true, true],
        );

        const synced = await syncCurrentLesson(completedWithChecklist, {
          recordReview: true,
          studySeconds,
        });

        if (!synced) {
          setCompletionSaveStatus("error");
          setErr(
            text(
              "SYNC ERROR: Unable to save progress to the system. Please try again.",
              "LỖI ĐỒNG BỘ: Không thể lưu tiến độ vào hệ thống. Vui lòng thử lại.",
            ),
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
        setCompletionSaveStatus("saved");
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
    studySeconds,
    syncCurrentLesson,
    track,
  ]);

  useEffect(() => {
    setState(loadProgress(identity));
    setAnswers({});
    setSubmittedQ({});
    setErr("");
    setShowCelebration(false);
    setCompletionSaveStatus("idle");
    completionPromiseRef.current = null;
    setCurrentStep(0);
    setReviewRecorded(false);
  }, [identity, lessonId, track]);

  useEffect(() => {
    if (
      !canSyncRemote ||
      !lessonDone ||
      reviewRecorded ||
      !reviewEligible
    ) {
      return;
    }

    let cancelled = false;

    async function recordReview() {
      const recorded = await syncCurrentLesson(state, {
        recordReview: true,
        studySeconds,
      });

      if (!cancelled && recorded) {
        setReviewRecorded(true);
        void fetchMembers();
        if (effectiveAuthToken) {
          void checkSession();
        }
      }
    }

    void recordReview();
    return () => {
      cancelled = true;
    };
  }, [
    canSyncRemote,
    checkSession,
    effectiveAuthToken,
    fetchMembers,
    lessonDone,
    reviewEligible,
    reviewRecorded,
    state,
    studySeconds,
    syncCurrentLesson,
  ]);

  useEffect(() => {
    return () => {
      celebrationAudioRef.current?.pause();
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function fetchCatalog() {
      setLoadingCatalog(true);
      try {
        const response = await fetch(`${apiBase}/api/academy/catalog`, {
          headers: authHeaders,
          credentials: "include",
        });
        const result = await response.json().catch(() => null);

        if (!response.ok || !result?.success) {
          throw new Error(
            result?.message ||
              text(
                "Unable to load the academy catalog.",
                "Không thể tải danh mục Academy.",
              ),
          );
        }

        const tracks = (result.data || []).map(normalizeAcademyCatalogTrack);
        const nextCatalogLessonKeys = tracks.flatMap((item) =>
          item.lessons.map((catalogLesson) => `${item.id}:${catalogLesson.id}`),
        );
        const foundTrack = tracks.find((item) => item.id === track) || null;
        const foundLesson =
          foundTrack?.lessons.find((item) => item.id === lessonId) || null;

        if (!cancelled) {
          setCatalogLessonKeys(nextCatalogLessonKeys);
          setTrackInfo(foundTrack);
          if (!foundTrack || !foundLesson) {
            setErr(
              text(
                "This lesson could not be found in the academy structure.",
                "Không tìm thấy lesson này trong cấu trúc Academy.",
              ),
            );
          }
        }
      } catch (error: any) {
        if (!cancelled) {
          setErr(
            error.message ||
              text(
                "Failed to load the academy catalog.",
                "Không thể tải danh mục Academy.",
              ),
          );
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
  }, [apiBase, authHeaders, lessonId, text, track]);

  useEffect(() => {
    if (!canSyncRemote || loadingCatalog || catalogLessonKeys === null) {
      return;
    }

    let cancelled = false;

    async function fetchRemoteProgress() {
      try {
        const response = await fetch(`${apiBase}/api/academy/progress`, {
          headers: authHeaders,
          credentials: "include",
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
          validLessonKeys,
        );
        const sanitizedLocal = sanitizeProgressState(
          loadProgress(identity),
          validLessonKeys,
        );
        const mergedState = mergeProgressStates(
          sanitizedLocal.state,
          sanitizedRemote.state,
        );
        const backfilled = await syncMissingRows(
          sanitizedRemote.state,
          mergedState,
        );

        if (cancelled) {
          return;
        }

        const authoritativeState = backfilled
          ? mergedState
          : sanitizedRemote.state;
        setState(authoritativeState);
        saveProgress(identity, authoritativeState);

        if (!backfilled) {
          setErr(
            text(
              "SYNC ERROR: Progress could not be merged, so the server version will be used.",
              "LỖI ĐỒNG BỘ: Không thể hợp nhất tiến độ, nên hệ thống sẽ dùng phiên bản từ server.",
            ),
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
  }, [
    apiBase,
    authHeaders,
    canSyncRemote,
    catalogLessonKeys,
    identity,
    loadingCatalog,
    syncMissingRows,
  ]);

  useEffect(() => {
    if (!lesson) {
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
        const response = await fetch(
          `${apiBase}/api/academy/questions?${query.toString()}`,
          {
            headers: authHeaders,
            credentials: "include",
          },
        );

        if (!response.ok) {
          throw new Error(text("Unable to load the quiz.", "Không thể tải quiz."));
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
  }, [apiBase, authHeaders, lesson, lessonId, text, track]);

  useEffect(() => {
    const nextChecklist = [
      cl0,
      quiz.length === 0 ? true : allSubmitted,
      quiz.length === 0 ? true : allCorrect || lessonDone,
    ];
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
    setErr("");
    const correct = isCorrect(questionId);
    const nextSubmittedQ = { ...submittedQ, [questionId]: true };
    setSubmittedQ(nextSubmittedQ);

    if (!correct) {
      setErr(
        text(
          "Incorrect. Review the material carefully and try again.",
          "Chưa đúng. Hãy xem lại nội dung thật kỹ rồi thử lại.",
        ),
      );
      return;
    }

    const finalAnswersCorrect = quiz.every((item) =>
      item.id === questionId
        ? correct
        : answers[item.id] === item.correctChoiceId,
    );
    const finalQuestionsSubmitted = quiz.every(
      (item) => nextSubmittedQ[item.id],
    );

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
    setErr("");

    if (completionSaveStatus === "saved") {
      onComplete?.();
      return true;
    }

    if (quiz.length > 0) {
      if (!allSubmitted) {
        setErr(
          text(
            "ERROR: Some questions still need to be submitted.",
            "LỖI: Vẫn còn câu hỏi chưa được submit.",
          ),
        );
        return false;
      }
      if (!allCorrect) {
        setErr(
          text(
            "ERROR: You must answer correctly to continue.",
            "LỖI: Bạn phải trả lời đúng để tiếp tục.",
          ),
        );
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
    await completeLesson(() => navigate("/academy"));
  }

  if (loadingCatalog) {
    return (
      <AcademyPage>
        <AcademyPanel className="mx-auto h-72 max-w-5xl animate-pulse" padding="p-0" />
      </AcademyPage>
    );
  }

  if (!lesson || !trackInfo) {
    return (
      <AcademyPage>
        <AcademyPanel className="mx-auto max-w-4xl text-center">
            <div className="py-10 text-sm font-bold uppercase tracking-[0.24em] text-text-muted">
            {err || text("Lesson not found", "Không tìm thấy lesson")}
          </div>
        </AcademyPanel>
      </AcademyPage>
    );
  }

  return (
    <AcademyPage>
      <div className="mx-auto max-w-5xl space-y-6">
      <audio
        ref={celebrationAudioRef}
        src={CELEBRATION_AUDIO_SRC}
        preload="auto"
      />
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

      <AcademyPanel className="sticky top-24 z-40" padding="p-4 sm:p-5">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-4">
            <button
              onClick={() => navigate(`/academy/community/${track}`)}
              className="inline-flex shrink-0 items-center gap-2 border-2 border-text-main bg-surface px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-widest text-text-main shadow-[2px_2px_0_0_#000] transition-all hover:-translate-y-0.5 hover:-translate-x-0.5 hover:text-primary hover:shadow-[4px_4px_0_0_#000] dark:shadow-[2px_2px_0_0_rgba(0,0,0,0.45)] dark:hover:shadow-[4px_4px_0_0_rgba(0,0,0,0.65)] sm:px-4"
            >
              <ArrowLeft className="w-4 h-4" strokeWidth={2} />
              <span className="hidden sm:inline">{text("BACK", "QUAY LẠI")}</span>
            </button>

            <div className="min-w-[96px] text-right">
              <div className="inline-flex items-center gap-2 border border-border-main bg-main-bg px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-text-main shadow-sm">
                <Flame className={`h-4 w-4 ${streakTheme.flame}`} />
                <span className="hidden sm:inline">{text("Streak", "Streak")}</span>
                <span className="font-display text-xl font-black leading-none">
                  {currentUser?.streak || 0}
                </span>
              </div>
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-text-muted">
              <span>{text("Track progress", "Tiến độ track")}</span>
              <span>{Math.round(progressPercentage)}%</span>
            </div>
            <AcademyProgressBar value={progressPercentage} className="h-2.5" />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <AcademyBadge tone="muted">
              {trackTitle}
            </AcademyBadge>
            <AcademyBadge tone="primary">
              {text("Step", "Bước")} {currentStep + 1}/{totalSteps}
            </AcademyBadge>
          </div>

          <div className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-text-muted">
            {text(
              `Session ${studySeconds}s • streak counts after ${ACADEMY_STREAK_COMPLETION_SECONDS}s on a new lesson or ${ACADEMY_STREAK_REVIEW_SECONDS}s when revisiting a completed lesson`,
              `Phiên ${studySeconds}s • streak được tính sau ${ACADEMY_STREAK_COMPLETION_SECONDS}s với lesson mới hoặc ${ACADEMY_STREAK_REVIEW_SECONDS}s khi học lại lesson đã hoàn thành`,
            )}
          </div>
        </div>
      </AcademyPanel>

      <AcademyPanel className="relative min-h-[60vh]" padding="p-5 sm:p-6 md:p-8">
        {err && (
          <div className="mb-6 flex items-center gap-3 border border-primary/20 bg-primary/10 px-5 py-4 font-mono text-sm text-text-main shadow-sm">
            <Terminal size={20} className="shrink-0 text-primary" /> {err}
          </div>
        )}

        {currentStep === 0 && (
          <div className="animate-in slide-in-from-right-8 duration-500 fade-in flex-grow">
            <div className="max-w-[78ch]">
            <div className="mb-8 flex flex-col gap-4 border-b border-border-main pb-8">
              <AcademyBadge tone="primary">
                {text("Community Lesson", "Bài học cộng đồng")}
              </AcademyBadge>
              <h1 className="mt-2 font-display text-5xl font-black uppercase tracking-tighter text-text-main sm:text-6xl">
                {lesson.title}
              </h1>
            </div>

            <div className="mb-8 markdown-body prose-dsuc">
              {renderMd(lesson.content_md)}
            </div>
            </div>

            {lesson.callouts?.length ? (
              <div className="mb-8 mt-8 grid max-w-[78ch] grid-cols-1 gap-4">
                {lesson.callouts.map((callout, index) => (
                  <div
                    key={`${callout.title}-${index}`}
                    className="border border-border-main bg-main-bg/60 p-6 shadow-sm"
                  >
                    <div className="mb-3 flex w-fit items-center gap-3 border border-border-main bg-surface px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.24em] text-text-main shadow-sm">
                      <Terminal size={18} className="text-text-main" />
                      {callout.title || text("Note", "Ghi chú")}
                    </div>
                    <div className="relative z-10 font-sans text-[15px] leading-7 text-text-main/85">
                      {callout.body}
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        )}

        {currentStep > 0 &&
          currentQuizData &&
          (() => {
            const submitted = !!submittedQ[currentQuizData.id];
            const correct =
              answers[currentQuizData.id] === currentQuizData.correctChoiceId;

            return (
              <div className="animate-in slide-in-from-right-8 duration-500 fade-in flex flex-grow flex-col justify-center">
                <div className="mb-6 flex flex-wrap items-center gap-3">
                  <AcademyBadge tone="muted">
                    {text("Question", "Câu hỏi")} {currentStep}/{quiz.length}
                  </AcademyBadge>
                  <AcademyBadge tone="primary">
                    {text("Quiz mode", "Chế độ quiz")}
                  </AcademyBadge>
                </div>

                <h2 className="mb-6 flex items-center gap-3 font-display text-4xl font-black uppercase tracking-tighter text-text-main">
                  <Code className="h-8 w-8 text-primary" strokeWidth={2.8} />
                  {text("Challenge Checkpoint", "Checkpoint challenge")}
                </h2>

                <h3 className="mb-8 border border-border-main bg-main-bg/60 p-6 font-mono text-lg font-bold leading-relaxed text-text-main shadow-sm">
                  {currentQuizData.prompt}
                </h3>

                <div className="mb-8 space-y-4 text-base">
                  {currentQuizData.choices.map((choice) => {
                    const selected = answers[currentQuizData.id] === choice.id;
                    const isChoiceCorrect =
                      choice.id === currentQuizData.correctChoiceId;

                    let className =
                      "border border-border-main bg-surface text-text-main shadow-sm transition-colors hover:border-primary/30 hover:bg-main-bg font-bold";
                    if (submitted) {
                      if (isChoiceCorrect) {
                        className =
                          "border-emerald-500/20 bg-emerald-500/10 text-text-main shadow-sm font-bold";
                      } else if (selected && !isChoiceCorrect) {
                        className =
                          "border-primary bg-primary text-primary-foreground shadow-sm font-bold";
                      } else {
                        className =
                          "border-border-main bg-main-bg text-text-muted shadow-sm cursor-not-allowed font-medium opacity-80";
                      }
                    } else if (selected) {
                      className =
                        "border-primary bg-primary text-primary-foreground shadow-sm font-bold";
                    }

                    return (
                      <button
                        key={choice.id}
                        onClick={() => {
                          setErr("");
                          setAnswers((prevAnswers) => ({
                            ...prevAnswers,
                            [currentQuizData.id]: choice.id,
                          }));
                          if (submittedQ[currentQuizData.id]) {
                            setSubmittedQ((prevSubmitted) => ({
                              ...prevSubmitted,
                              [currentQuizData.id]: false,
                            }));
                          }
                        }}
                        className={`flex w-full cursor-pointer items-start p-5 text-left transition-colors sm:items-center ${className}`}
                      >
                        <div
                          className={`mr-4 mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center border transition-colors sm:mt-0 ${
                            submitted && isChoiceCorrect
                              ? "border-emerald-500/20 bg-emerald-500 text-white"
                              : selected && !submitted
                                ? "border-primary bg-main-bg text-primary"
                                : "border-border-main bg-main-bg"
                          }`}
                        >
                          {(submitted && isChoiceCorrect) ||
                          (selected && !submitted) ? (
                            <CheckCircle2 size={24} strokeWidth={4} />
                          ) : null}
                        </div>
                        <span className="leading-relaxed text-lg">
                          {choice.label}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {submitted && (
                  <div
                    className={`animate-in zoom-in-95 border p-6 duration-300 shadow-sm ${
                      correct
                        ? "border-emerald-500/20 bg-emerald-500/10 text-text-main"
                        : "border-primary bg-primary text-primary-foreground"
                    }`}
                  >
                    <p
                      className={`mb-3 flex w-fit items-center gap-2 border px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.24em] shadow-sm ${correct ? "border-emerald-500/20 bg-surface text-emerald-600 dark:text-emerald-300" : "border-primary/20 bg-main-bg text-primary"}`}
                    >
                      <Terminal size={20} strokeWidth={3} />
                      {correct ? text("Correct", "Đúng") : text("Incorrect", "Sai")}
                    </p>
                    <p className="text-lg font-bold leading-relaxed">
                      {currentQuizData.explanation}
                    </p>
                  </div>
                )}
              </div>
            );
          })()}

        <div className="mt-auto flex flex-col gap-4 border-t border-border-main pt-8 sm:flex-row sm:justify-end">
          {currentStep === 0 ? (
            <button
              onClick={() => {
                if (quiz.length > 0) {
                  setCurrentStep(1);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                } else {
                  void finishLesson();
                }
              }}
              className="flex w-full items-center justify-center gap-3 border-2 border-text-main bg-primary px-8 py-4 font-mono text-[11px] font-bold uppercase tracking-widest text-primary-foreground shadow-[2px_2px_0_0_#000] transition-all hover:-translate-y-0.5 hover:-translate-x-0.5 hover:shadow-[4px_4px_0_0_#000] dark:shadow-[2px_2px_0_0_rgba(0,0,0,0.45)] dark:hover:shadow-[4px_4px_0_0_rgba(0,0,0,0.65)] sm:w-auto"
            >
              {quiz.length > 0
                ? text("Take Quiz", "Làm quiz")
                : isFinalLessonInTrack
                  ? text("Complete Track", "Hoàn thành track")
                  : text("Complete Lesson", "Hoàn thành lesson")}{" "}
              <ArrowRight className="h-6 w-6" strokeWidth={3} />
            </button>
          ) : currentQuizData ? (
            (() => {
              const submitted = !!submittedQ[currentQuizData.id];
              const correct =
                answers[currentQuizData.id] === currentQuizData.correctChoiceId;
              const hasSelected = !!answers[currentQuizData.id];

              if (!submitted || !correct) {
                return (
                  <button
                    onClick={() => submitQuestion(currentQuizData.id)}
                    disabled={!hasSelected}
                    className="flex w-full items-center justify-center gap-3 border-2 border-text-main bg-primary px-8 py-4 font-mono text-[11px] font-bold uppercase tracking-widest text-primary-foreground shadow-[2px_2px_0_0_#000] transition-all hover:-translate-y-0.5 hover:-translate-x-0.5 hover:shadow-[4px_4px_0_0_#000] disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-gray-300 disabled:text-gray-600 dark:shadow-[2px_2px_0_0_rgba(0,0,0,0.45)] dark:hover:shadow-[4px_4px_0_0_rgba(0,0,0,0.65)] sm:w-auto"
                  >
                    {text("Confirm Choice", "Xác nhận lựa chọn")}
                  </button>
                );
              }

              if (currentStep < totalSteps - 1) {
                return (
                  <button
                    onClick={() => {
                      setCurrentStep((prev) => prev + 1);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className="flex w-full items-center justify-center gap-3 border-2 border-text-main bg-surface px-8 py-4 font-mono text-[11px] font-bold uppercase tracking-widest text-text-main shadow-[2px_2px_0_0_#000] transition-all hover:-translate-y-0.5 hover:-translate-x-0.5 hover:text-primary hover:shadow-[4px_4px_0_0_#000] dark:shadow-[2px_2px_0_0_rgba(0,0,0,0.45)] dark:hover:shadow-[4px_4px_0_0_rgba(0,0,0,0.65)] sm:w-auto"
                  >
                    {text("Next Question", "Câu tiếp theo")}{" "}
                    <ArrowRight className="h-6 w-6" strokeWidth={3} />
                  </button>
                );
              }

              return (
                <button
                  onClick={() => void finishLesson()}
                  disabled={busyFinish}
                  className="flex w-full items-center justify-center gap-3 border-2 border-text-main bg-surface px-8 py-4 font-mono text-[11px] font-bold uppercase tracking-widest text-text-main shadow-[2px_2px_0_0_#000] transition-all hover:-translate-y-0.5 hover:-translate-x-0.5 hover:border-primary hover:bg-primary hover:text-primary-foreground disabled:opacity-50 dark:shadow-[2px_2px_0_0_rgba(0,0,0,0.45)] dark:hover:shadow-[4px_4px_0_0_rgba(0,0,0,0.65)] sm:w-auto"
                >
                  {busyFinish
                    ? text("Saving...", "Đang lưu...")
                    : isFinalLessonInTrack
                      ? text("Complete Track", "Hoàn thành track")
                      : text("Complete Lesson", "Hoàn thành lesson")}{" "}
                  <CheckCircle2 className="h-6 w-6" strokeWidth={3} />
                </button>
              );
            })()
          ) : null}
        </div>
      </AcademyPanel>
      </div>
    </AcademyPage>
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
  saveStatus: "idle" | "saving" | "saved" | "error";
  trackTitle: string;
  onFinalize: () => void;
  onExit: () => void;
}) {
  const { text } = useLocale();
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onExit();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onExit, open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.98 }}
          transition={{ duration: reduceMotion ? 0 : 0.3, ease: "easeOut" }}
          className="fixed inset-0 z-[10020] flex items-center justify-center overflow-hidden p-4 bg-black/70 backdrop-blur-sm"
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
                  style={{ left: `${piece.left}%`, top: "-8%" }}
                  initial={{ y: -40, opacity: 0, rotate: 0 }}
                  animate={{
                    y: ["0vh", "112vh"],
                    x: index % 2 === 0 ? [0, 22, -14, 12] : [0, -18, 20, -10],
                    opacity: [0, 1, 1, 0],
                    rotate: [0, piece.rotate, piece.rotate * 1.7],
                  }}
                  transition={{
                    duration: piece.duration,
                    delay: piece.delay,
                    repeat: Infinity,
                    repeatDelay: 0.55,
                    ease: "easeInOut",
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
                    ease: "easeOut",
                  }}
                />
              ))}
            </div>
          )}

          <motion.div
            initial={reduceMotion ? false : { y: 18, opacity: 0, scale: 0.96 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={
              reduceMotion ? { opacity: 0 } : { y: 12, opacity: 0, scale: 0.98 }
            }
            transition={{ duration: reduceMotion ? 0 : 0.34, ease: "easeOut" }}
            className="relative z-10 w-full max-w-2xl border-[3px] border-text-main bg-surface p-8 text-center shadow-[12px_12px_0_0_#000] sm:p-12 dark:shadow-[12px_12px_0_0_rgba(0,0,0,0.58)]"
          >
            <motion.div
              animate={
                reduceMotion
                  ? undefined
                  : { rotate: [-6, 6, -6], scale: [1, 1.08, 1] }
              }
              transition={{
                duration: 1.1,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="mx-auto mb-8 flex h-24 w-24 items-center justify-center border border-primary/20 bg-primary/10 text-primary shadow-sm"
            >
              <Sparkles size={48} aria-hidden="true" strokeWidth={3} />
            </motion.div>

            <div className="relative mx-auto mb-6 flex w-fit items-center gap-2 border border-border-main bg-main-bg px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.24em] text-text-main shadow-sm">
              <span className="h-3 w-3 animate-pulse rounded-full bg-primary" />
              {text("GRADUATION UNLOCKED", "MỞ KHÓA CỘT MỐC TỐT NGHIỆP")}
            </div>

            <div className="mb-4 inline-block border border-border-main bg-main-bg px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.24em] text-text-main shadow-sm">
              {text(`Completed ${trackTitle}`, `Đã hoàn thành ${trackTitle}`)}
            </div>
            <h2
              id="academy-completion-title"
              className="mt-4 font-display text-5xl font-black uppercase tracking-tighter text-text-main sm:text-6xl"
            >
              {text("Congratulations on graduating!", "Chúc mừng bạn đã hoàn thành!")}
            </h2>
            <p className="mx-auto mt-6 max-w-xl border border-border-main bg-main-bg/70 p-5 font-mono text-base font-bold leading-relaxed text-text-main shadow-sm sm:text-lg">
              {text(
                "You have officially completed the track",
                "Bạn đã chính thức hoàn thành track",
              )}{" "}
              <span className="font-bold text-primary">{graduationLabel}</span>{" "}
              {text(
                "by finishing the final lesson",
                "bằng cách hoàn tất lesson cuối cùng",
              )}{" "}
              <span className="font-bold text-primary">{lessonTitle}</span>.{" "}
              {text("Keep up your learning streak!", "Hãy tiếp tục giữ nhịp streak học tập này.")}
            </p>

            <div className="mx-auto mt-8 w-fit border border-border-main bg-surface px-6 py-3 font-mono text-[10px] font-bold uppercase tracking-[0.24em] text-text-main shadow-sm">
              {saveStatus === "saving" &&
                text("Saving progress...", "Đang lưu tiến độ...")}
              {saveStatus === "saved" &&
                text("Progress saved.", "Đã lưu tiến độ.")}
              {saveStatus === "error" &&
                text("Save failed. Please try again.", "Lưu thất bại. Vui lòng thử lại.")}
              {saveStatus === "idle" &&
                text(
                  "Preparing your completion record.",
                  "Đang chuẩn bị bản ghi hoàn thành của bạn.",
                )}
            </div>

            <div className="relative mt-10 grid gap-4 sm:grid-cols-2">
              <button
                type="button"
                onClick={onFinalize}
                disabled={busy}
                className="flex min-h-14 items-center justify-center gap-2 border-2 border-text-main bg-primary px-6 py-4 font-mono text-[11px] font-bold uppercase tracking-widest text-primary-foreground shadow-[2px_2px_0_0_#000] transition-all hover:-translate-y-0.5 hover:-translate-x-0.5 hover:shadow-[4px_4px_0_0_#000] disabled:opacity-50 dark:shadow-[2px_2px_0_0_rgba(0,0,0,0.45)] dark:hover:shadow-[4px_4px_0_0_rgba(0,0,0,0.65)]"
              >
                {busy || saveStatus === "saving"
                  ? text("Saving...", "Đang lưu...")
                  : text("Claim Trophy", "Nhận cột mốc")}
                <CheckCircle2 size={24} strokeWidth={3} />
              </button>
              <button
                type="button"
                onClick={onExit}
                disabled={busy}
                className="flex min-h-14 items-center justify-center border-2 border-text-main bg-surface px-6 py-4 font-mono text-[11px] font-bold uppercase tracking-widest text-text-main shadow-[2px_2px_0_0_#000] transition-all hover:-translate-y-0.5 hover:-translate-x-0.5 hover:text-primary hover:shadow-[4px_4px_0_0_#000] disabled:opacity-50 dark:shadow-[2px_2px_0_0_rgba(0,0,0,0.45)] dark:hover:shadow-[4px_4px_0_0_rgba(0,0,0,0.65)]"
              >
                <span className="inline-flex items-center justify-center gap-3">
                  <Home size={24} strokeWidth={3} aria-hidden="true" />
                  {text("Back to Academy Home", "Quay lại trang chủ Academy")}
                </span>
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

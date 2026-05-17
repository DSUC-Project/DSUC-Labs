import { useCallback, useEffect, useMemo, useState } from "react";

import {
  loadProgress,
  saveProgress,
  mergeProgressStates,
  markLessonComplete,
  markQuizPassed,
  type ProgressIdentity,
  type ProgressState,
} from "./progress";
import { academyV2ProgressTrack } from "./v2Progress";
import { useStore } from "@/store/useStore";

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

type SaveOptions = {
  quizPassed?: boolean;
  xpAwarded?: number;
  studySeconds?: number;
};

function parseProgressKey(key: string) {
  const value = String(key || "");
  const separator = value.lastIndexOf(":");
  if (separator <= 0 || separator >= value.length - 1) {
    return null;
  }

  return {
    track: value.slice(0, separator),
    lessonId: value.slice(separator + 1),
  };
}

export function useAcademyProgressState(params: {
  identity: ProgressIdentity;
  currentUserId: string | null;
  authToken: string | null;
  walletAddress: string | null;
}) {
  const { identity, currentUserId, authToken, walletAddress } = params;
  const fetchMembers = useStore((store) => store.fetchMembers);
  const checkSession = useStore((store) => store.checkSession);
  const isSignedInIdentity = Boolean(identity.userId || currentUserId);
  const [state, setState] = useState<ProgressState>(() =>
    loadProgress(identity),
  );

  const apiBase = (import.meta as any).env.VITE_API_BASE_URL || "";
  const storedAuthToken =
    typeof window !== "undefined"
      ? window.localStorage.getItem("auth_token")
      : null;
  const effectiveAuthToken = authToken || storedAuthToken;
  const hasRemoteAuth = Boolean(effectiveAuthToken || walletAddress);
  const [loading, setLoading] = useState(
    Boolean(currentUserId || hasRemoteAuth),
  );
  const authHeaders = useMemo(
    () => buildAuthHeaders(effectiveAuthToken, walletAddress),
    [effectiveAuthToken, walletAddress],
  );
  const jsonHeaders = useMemo(
    () => buildAuthHeaders(effectiveAuthToken, walletAddress, true),
    [effectiveAuthToken, walletAddress],
  );
  const refreshLearnerState = useCallback(() => {
    void fetchMembers();
    if (effectiveAuthToken) {
      void checkSession();
    }
  }, [checkSession, effectiveAuthToken, fetchMembers]);

  const syncMissingRows = useCallback(
    async (baseline: ProgressState, merged: ProgressState) => {
      const allKeys = new Set<string>([
        ...Object.keys(merged.completedLessons || {}),
        ...Object.keys(merged.quizPassed || {}),
        ...Object.keys(merged.checklist || {}),
      ]);

      let synced = true;

      for (const key of allKeys) {
        const parsed = parseProgressKey(key);
        if (!parsed) {
          continue;
        }

        const mergedCompleted = !!merged.completedLessons[key];
        const mergedQuiz = !!merged.quizPassed[key];
        const mergedChecklist = merged.checklist?.[key] || [];
        const baselineCompleted = !!baseline.completedLessons[key];
        const baselineQuiz = !!baseline.quizPassed[key];
        const baselineChecklist = baseline.checklist?.[key] || [];
        const checklistChanged =
          JSON.stringify(mergedChecklist) !== JSON.stringify(baselineChecklist);

        if (!mergedCompleted && !mergedQuiz && mergedChecklist.length === 0) {
          continue;
        }

        if (
          mergedCompleted === baselineCompleted &&
          mergedQuiz === baselineQuiz &&
          !checklistChanged
        ) {
          continue;
        }

        try {
          const response = await fetch(`${apiBase}/api/academy/progress`, {
            method: "POST",
            headers: jsonHeaders,
            credentials: "include",
            body: JSON.stringify({
              track: parsed.track,
              lesson_id: parsed.lessonId,
              lesson_completed: mergedCompleted,
              quiz_passed: mergedQuiz,
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
    [apiBase, jsonHeaders],
  );

  const postProgressRow = useCallback(
    async (payload: {
      track: string;
      lessonId: string;
      lessonCompleted: boolean;
      quizPassed: boolean;
      checklist: boolean[];
      xpAwarded: number;
      recordReview?: boolean;
      studySeconds?: number;
    }) => {
      if (!hasRemoteAuth) {
        return false;
      }

      try {
        const response = await fetch(`${apiBase}/api/academy/progress`, {
          method: "POST",
          headers: jsonHeaders,
          credentials: "include",
          body: JSON.stringify({
            track: payload.track,
            lesson_id: payload.lessonId,
            lesson_completed: payload.lessonCompleted,
            quiz_passed: payload.quizPassed,
            checklist: payload.checklist,
            xp_awarded: Math.max(0, Number(payload.xpAwarded || 0)),
            record_review: payload.recordReview === true,
            study_seconds: Math.max(
              0,
              Math.floor(Number(payload.studySeconds || 0)),
            ),
          }),
        });

        if (response.ok) {
          refreshLearnerState();
        }

        return response.ok;
      } catch {
        return false;
      }
    },
    [apiBase, hasRemoteAuth, jsonHeaders, refreshLearnerState],
  );

  useEffect(() => {
    setState(loadProgress(identity));
  }, [identity]);

  useEffect(() => {
    if (!currentUserId && !hasRemoteAuth) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function fetchRemoteProgress() {
      setLoading(true);
      try {
        const response = await fetch(`${apiBase}/api/academy/progress`, {
          headers: authHeaders,
          credentials: "include",
        });

        if (!response.ok) {
          return;
        }

        const result = await response.json().catch(() => null);
        if (
          !result?.success ||
          !Array.isArray(result?.data?.rows) ||
          cancelled
        ) {
          return;
        }

        const identityState = loadProgress(identity);
        const guestState = isSignedInIdentity
          ? loadProgress({})
          : ({
              completedLessons: {},
              quizPassed: {},
              checklist: {},
              xp: 0,
              updatedAt: new Date(0).toISOString(),
            } satisfies ProgressState);
        const localState = isSignedInIdentity
          ? mergeProgressStates(guestState, identityState)
          : identityState;
        const remoteState = rowsToProgressState(result.data.rows);
        const mergedState = mergeProgressStates(localState, remoteState);

        if (!cancelled) {
          setState(mergedState);
          saveProgress(identity, mergedState);
          void syncMissingRows(remoteState, mergedState);
        }
      } catch {
        // Keep local progress as fallback.
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void fetchRemoteProgress();
    return () => {
      cancelled = true;
    };
  }, [
    apiBase,
    authHeaders,
    currentUserId,
    hasRemoteAuth,
    identity,
    isSignedInIdentity,
    syncMissingRows,
  ]);

  const persistUnitCompletion = useCallback(
    async (track: string, lessonId: string, options?: SaveOptions) => {
      const progressTrack = academyV2ProgressTrack(track);
      let next = markLessonComplete(state, progressTrack, lessonId);
      if (options?.quizPassed) {
        next = markQuizPassed(next, progressTrack, lessonId);
      }

      setState(next);
      saveProgress(identity, next);

      if (!hasRemoteAuth) {
        return true;
      }

      return postProgressRow({
        track: progressTrack,
        lessonId,
        lessonCompleted: true,
        quizPassed: options?.quizPassed === true,
        checklist: [true, true, options?.quizPassed === true],
        xpAwarded: Math.max(0, Number(options?.xpAwarded ?? 0)),
        recordReview: true,
        studySeconds: options?.studySeconds ?? 0,
      });
    },
    [
      hasRemoteAuth,
      identity,
      postProgressRow,
      state,
    ],
  );

  const recordUnitReview = useCallback(
    async (
      track: string,
      lessonId: string,
      options: {
        quizPassed?: boolean;
        xpAwarded?: number;
        studySeconds?: number;
      },
    ) => {
      const progressTrack = academyV2ProgressTrack(track);
      const progressKey = `${progressTrack}:${lessonId}`;
      const alreadyCompleted = !!state.completedLessons[progressKey];

      if (!alreadyCompleted) {
        return false;
      }

      return postProgressRow({
        track: progressTrack,
        lessonId,
        lessonCompleted: true,
        quizPassed: !!state.quizPassed[progressKey] || options.quizPassed === true,
        checklist:
          state.checklist?.[progressKey] || [
            true,
            true,
            options.quizPassed === true,
          ],
        xpAwarded: Math.max(0, Number(options?.xpAwarded ?? 0)),
        recordReview: true,
        studySeconds: options?.studySeconds ?? 0,
      });
    },
    [postProgressRow, state.checklist, state.completedLessons, state.quizPassed],
  );

  return {
    state,
    loading,
    persistUnitCompletion,
    recordUnitReview,
  };
}

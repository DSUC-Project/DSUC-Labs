import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  loadProgress,
  saveProgress,
  mergeProgressStates,
  markLessonComplete,
  markQuizPassed,
  type ProgressIdentity,
  type ProgressState,
} from './progress';
import { academyV2ProgressTrack } from './v2Progress';

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

type SaveOptions = {
  quizPassed?: boolean;
  xpAwarded?: number;
};

export function useAcademyProgressState(params: {
  identity: ProgressIdentity;
  currentUserId: string | null;
  authToken: string | null;
  walletAddress: string | null;
}) {
  const { identity, currentUserId, authToken, walletAddress } = params;
  const [state, setState] = useState<ProgressState>(() => loadProgress(identity));
  const [loading, setLoading] = useState(Boolean(currentUserId));

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

  useEffect(() => {
    setState(loadProgress(identity));
  }, [identity]);

  useEffect(() => {
    if (!currentUserId) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function fetchRemoteProgress() {
      setLoading(true);
      try {
        const response = await fetch(`${apiBase}/api/academy/progress`, {
          headers: authHeaders,
          credentials: 'include',
        });

        if (!response.ok) {
          return;
        }

        const result = await response.json().catch(() => null);
        if (!result?.success || !Array.isArray(result?.data?.rows) || cancelled) {
          return;
        }

        const localState = loadProgress(identity);
        const remoteState = rowsToProgressState(result.data.rows);
        const mergedState = mergeProgressStates(localState, remoteState);

        if (!cancelled) {
          setState(mergedState);
          saveProgress(identity, mergedState);
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
  }, [apiBase, authHeaders, currentUserId, identity]);

  const persistUnitCompletion = useCallback(
    async (track: string, lessonId: string, options?: SaveOptions) => {
      const progressTrack = academyV2ProgressTrack(track);
      let next = markLessonComplete(state, progressTrack, lessonId);
      if (options?.quizPassed) {
        next = markQuizPassed(next, progressTrack, lessonId);
      }

      setState(next);
      saveProgress(identity, next);

      if (!currentUserId) {
        return true;
      }

      try {
        const response = await fetch(`${apiBase}/api/academy/progress`, {
          method: 'POST',
          headers: jsonHeaders,
          credentials: 'include',
          body: JSON.stringify({
            track: progressTrack,
            lesson_id: lessonId,
            lesson_completed: true,
            quiz_passed: options?.quizPassed === true,
            checklist: [true, true, options?.quizPassed === true],
            xp_awarded: Math.max(0, Number(options?.xpAwarded ?? 0)),
          }),
        });

        return response.ok;
      } catch {
        return false;
      }
    },
    [apiBase, currentUserId, identity, jsonHeaders, state]
  );

  return {
    state,
    loading,
    persistUnitCompletion,
  };
}

import { useEffect, useMemo, useState } from "react";

export const ACADEMY_STREAK_COMPLETION_SECONDS = 15;
export const ACADEMY_STREAK_REVIEW_SECONDS = 30;

export function useAcademyStudyTimer(params: {
  sessionKey: string;
  enabled?: boolean;
}) {
  const { sessionKey, enabled = true } = params;
  const [elapsedMs, setElapsedMs] = useState(0);

  useEffect(() => {
    setElapsedMs(0);
  }, [sessionKey]);

  useEffect(() => {
    if (!enabled || typeof window === "undefined") {
      return;
    }

    let timerId: number | null = null;
    let lastTick = Date.now();

    const clearTimer = () => {
      if (timerId !== null) {
        window.clearInterval(timerId);
        timerId = null;
      }
    };

    const tick = () => {
      const now = Date.now();
      const delta = Math.max(0, now - lastTick);
      lastTick = now;
      setElapsedMs((current) => current + delta);
    };

    const startTimer = () => {
      if (document.hidden || timerId !== null) {
        return;
      }

      lastTick = Date.now();
      timerId = window.setInterval(tick, 1000);
    };

    const stopTimer = () => {
      if (timerId === null) {
        return;
      }

      tick();
      clearTimer();
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopTimer();
      } else {
        startTimer();
      }
    };

    startTimer();
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", stopTimer);
    window.addEventListener("focus", startTimer);

    return () => {
      clearTimer();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", stopTimer);
      window.removeEventListener("focus", startTimer);
    };
  }, [enabled, sessionKey]);

  return useMemo(() => {
    const studySeconds = Math.floor(elapsedMs / 1000);

    return {
      studySeconds,
      completionEligible:
        studySeconds >= ACADEMY_STREAK_COMPLETION_SECONDS,
      reviewEligible: studySeconds >= ACADEMY_STREAK_REVIEW_SECONDS,
    };
  }, [elapsedMs]);
}

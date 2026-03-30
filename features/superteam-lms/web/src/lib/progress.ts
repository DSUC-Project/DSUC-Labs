import type { TrackId } from './curriculum';

export type ProgressState = {
  // key: `${track}:${lessonId}`
  completedLessons: Record<string, boolean>;
  // key: `${track}:${lessonId}`
  quizPassed: Record<string, boolean>;
  // key: `${track}:${lessonId}` -> [step0, step1, ...]
  checklist?: Record<string, boolean[]>;
  // minimal XP model
  xp: number;
  updatedAt: string;
};

const STORAGE_PREFIX = 'st-academy-progress-v1:';

export function progressKey(wallet: string | null) {
  return `${STORAGE_PREFIX}${wallet || 'anon'}`;
}

export function loadProgress(wallet: string | null): ProgressState {
  if (typeof window === 'undefined') {
    return { completedLessons: {}, quizPassed: {}, checklist: {}, xp: 0, updatedAt: new Date().toISOString() };
  }
  const raw = window.localStorage.getItem(progressKey(wallet));
  if (!raw) return { completedLessons: {}, quizPassed: {}, checklist: {}, xp: 0, updatedAt: new Date().toISOString() };
  try {
    const parsed = JSON.parse(raw);
    return {
      completedLessons: parsed.completedLessons || {},
      quizPassed: parsed.quizPassed || {},
      checklist: parsed.checklist || {},
      xp: Number(parsed.xp || 0),
      updatedAt: parsed.updatedAt || new Date().toISOString(),
    };
  } catch {
    return { completedLessons: {}, quizPassed: {}, checklist: {}, xp: 0, updatedAt: new Date().toISOString() };
  }
}

export function saveProgress(wallet: string | null, state: ProgressState) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(progressKey(wallet), JSON.stringify(state));
}

export function markLessonComplete(state: ProgressState, track: TrackId, lessonId: string): ProgressState {
  const key = `${track}:${lessonId}`;
  return {
    ...state,
    completedLessons: { ...state.completedLessons, [key]: true },
    xp: state.xp + 100,
    updatedAt: new Date().toISOString(),
  };
}

export function markQuizPassed(state: ProgressState, track: TrackId, lessonId: string): ProgressState {
  const key = `${track}:${lessonId}`;
  return {
    ...state,
    quizPassed: { ...state.quizPassed, [key]: true },
    updatedAt: new Date().toISOString(),
  };
}

export function isQuizPassed(state: ProgressState, track: TrackId, lessonId: string): boolean {
  return !!state.quizPassed[`${track}:${lessonId}`];
}

export function isLessonCompleted(state: ProgressState, track: TrackId, lessonId: string): boolean {
  return !!state.completedLessons[`${track}:${lessonId}`];
}

import type { TrackId } from './curriculum';

export type ProgressState = {
  // key: `${track}:${lessonId}`
  completedLessons: Record<string, boolean>;
  // key: `${track}:${lessonId}`
  quizPassed: Record<string, boolean>;
  // key: `${track}:${lessonId}` -> [step0, step1, ...]
  checklist?: Record<string, boolean[]>;
  xp: number;
  updatedAt: string;
};

export type ProgressIdentity = {
  userId?: string | null;
  walletAddress?: string | null;
};

const STORAGE_PREFIX = 'st-academy-progress-v2:';

function identityKey(identity: ProgressIdentity) {
  if (identity.userId) {
    return `member:${identity.userId}`;
  }

  if (identity.walletAddress) {
    return `wallet:${identity.walletAddress}`;
  }

  return 'guest';
}

export function progressKey(identity: ProgressIdentity) {
  return `${STORAGE_PREFIX}${identityKey(identity)}`;
}

function emptyState(): ProgressState {
  return {
    completedLessons: {},
    quizPassed: {},
    checklist: {},
    xp: 0,
    updatedAt: new Date().toISOString(),
  };
}

export function loadProgress(identity: ProgressIdentity): ProgressState {
  if (typeof window === 'undefined') {
    return emptyState();
  }

  const raw = window.localStorage.getItem(progressKey(identity));
  if (!raw) {
    return emptyState();
  }

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
    return emptyState();
  }
}

export function saveProgress(identity: ProgressIdentity, state: ProgressState) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(progressKey(identity), JSON.stringify(state));
}

function mergeChecklistSteps(left: boolean[] = [], right: boolean[] = []): boolean[] {
  const max = Math.max(left.length, right.length);
  const merged: boolean[] = [];

  for (let i = 0; i < max; i += 1) {
    merged.push(Boolean(left[i]) || Boolean(right[i]));
  }

  return merged;
}

export function mergeProgressStates(local: ProgressState, remote: ProgressState): ProgressState {
  const completedLessons: Record<string, boolean> = { ...local.completedLessons };
  for (const [key, value] of Object.entries(remote.completedLessons || {})) {
    completedLessons[key] = Boolean(completedLessons[key]) || Boolean(value);
  }

  const quizPassed: Record<string, boolean> = { ...local.quizPassed };
  for (const [key, value] of Object.entries(remote.quizPassed || {})) {
    quizPassed[key] = Boolean(quizPassed[key]) || Boolean(value);
  }

  const checklistKeys = new Set<string>([
    ...Object.keys(local.checklist || {}),
    ...Object.keys(remote.checklist || {}),
  ]);

  const checklist: Record<string, boolean[]> = {};
  for (const key of checklistKeys) {
    checklist[key] = mergeChecklistSteps(local.checklist?.[key], remote.checklist?.[key]);
  }

  const inferredXp = Object.values(completedLessons).filter(Boolean).length * 100;
  const xp = Math.max(Number(local.xp || 0), Number(remote.xp || 0), inferredXp);
  const updatedAt =
    local.updatedAt && remote.updatedAt
      ? (local.updatedAt > remote.updatedAt ? local.updatedAt : remote.updatedAt)
      : local.updatedAt || remote.updatedAt || new Date().toISOString();

  return {
    completedLessons,
    quizPassed,
    checklist,
    xp,
    updatedAt,
  };
}

export function markLessonComplete(state: ProgressState, track: TrackId, lessonId: string): ProgressState {
  const key = `${track}:${lessonId}`;
  const alreadyCompleted = !!state.completedLessons[key];

  return {
    ...state,
    completedLessons: { ...state.completedLessons, [key]: true },
    xp: alreadyCompleted ? state.xp : state.xp + 100,
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

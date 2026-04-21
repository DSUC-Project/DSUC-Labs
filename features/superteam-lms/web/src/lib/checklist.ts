import type { TrackId } from './curriculum';
import type { ProgressState } from './progress';

export type ChecklistItem = {
  id: string;
  label: string;
};

export function checklistKey(track: TrackId, lessonId: string) {
  return `${track}:${lessonId}`;
}

export function getChecklist(state: ProgressState, track: TrackId, lessonId: string): boolean[] {
  const key = checklistKey(track, lessonId);
  const list = state.checklist?.[key];
  return Array.isArray(list) ? list : [];
}

export function setChecklist(state: ProgressState, track: TrackId, lessonId: string, steps: boolean[]): ProgressState {
  const key = checklistKey(track, lessonId);
  return {
    ...state,
    checklist: { ...(state.checklist || {}), [key]: steps },
    updatedAt: new Date().toISOString(),
  };
}

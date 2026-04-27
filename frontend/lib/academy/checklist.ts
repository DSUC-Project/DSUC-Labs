import type { ProgressState } from './progress';

export type ChecklistItem = {
  id: string;
  label: string;
};

export function checklistKey(track: string, lessonId: string) {
  return `${track}:${lessonId}`;
}

export function getChecklist(state: ProgressState, track: string, lessonId: string): boolean[] {
  const key = checklistKey(track, lessonId);
  const list = state.checklist?.[key];
  return Array.isArray(list) ? list : [];
}

export function setChecklist(state: ProgressState, track: string, lessonId: string, steps: boolean[]): ProgressState {
  const key = checklistKey(track, lessonId);
  return {
    ...state,
    checklist: { ...(state.checklist || {}), [key]: steps },
    updatedAt: new Date().toISOString(),
  };
}

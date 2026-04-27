import type { AcademyQuestion, AcademyQuestionChoice } from '@/types';

export type QuizQuestion = {
  id: string;
  prompt: string;
  choices: AcademyQuestionChoice[];
  correctChoiceId: string;
  explanation: string;
};

function normalizeChoices(value: unknown): AcademyQuestionChoice[] {
  const parsed = typeof value === 'string' ? safeJsonParse(value, []) : value;
  if (!Array.isArray(parsed)) {
    return [];
  }

  return parsed
    .map((item: any, index: number) => ({
      id: String(item?.id || String.fromCharCode(97 + index)).trim(),
      label: String(item?.label || '').trim(),
    }))
    .filter((item) => item.id && item.label);
}

function safeJsonParse(value: string, fallback: unknown) {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

export function normalizeAcademyQuestion(row: any): AcademyQuestion {
  return {
    id: String(row.id || ''),
    track: row.track,
    lesson_id: row.lesson_id || row.lessonId || '',
    prompt: row.prompt || '',
    choices: normalizeChoices(row.choices),
    correct_choice_id: row.correct_choice_id || row.correctChoiceId || '',
    explanation: row.explanation || '',
    sort_order: Number(row.sort_order || 0),
    status: row.status || 'Published',
    created_by: row.created_by,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export function academyQuestionToQuizQuestion(row: AcademyQuestion): QuizQuestion {
  return {
    id: row.id,
    prompt: row.prompt,
    choices: row.choices,
    correctChoiceId: row.correct_choice_id,
    explanation: row.explanation,
  };
}

export function rowsToQuizQuestions(rows: any[]): QuizQuestion[] {
  return rows
    .map(normalizeAcademyQuestion)
    .filter((row) => row.status === 'Published')
    .sort((a, b) => a.sort_order - b.sort_order)
    .map(academyQuestionToQuizQuestion);
}

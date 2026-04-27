import type {
  AcademyLessonAdmin,
  AcademyTrackAdmin,
  AcademyTrackCatalog,
} from '@/types';

function safeJsonParse<T>(value: string, fallback: T): T {
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function normalizeCallouts(value: unknown) {
  const parsed = typeof value === 'string' ? safeJsonParse<any[]>(value, []) : value;
  if (!Array.isArray(parsed)) {
    return [];
  }

  return parsed
    .map((item: any) => ({
      title: String(item?.title || '').trim(),
      body: String(item?.body || '').trim(),
    }))
    .filter((item) => item.title || item.body);
}

export function normalizeAcademyTrack(row: any): AcademyTrackAdmin {
  return {
    id: String(row.id || '').trim(),
    title: String(row.title || '').trim(),
    subtitle: String(row.subtitle || '').trim(),
    description: String(row.description || '').trim(),
    status: row.status || 'Published',
    sort_order: Number(row.sort_order || 0),
    created_by: row.created_by,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export function normalizeAcademyLesson(row: any): AcademyLessonAdmin {
  return {
    id: String(row.id || ''),
    track: String(row.track || '').trim(),
    lesson_id: String(row.lesson_id || row.lessonId || '').trim(),
    title: String(row.title || '').trim(),
    minutes: Number(row.minutes || 10),
    content_md: String(row.content_md || row.contentMd || ''),
    callouts: normalizeCallouts(row.callouts),
    status: row.status || 'Published',
    sort_order: Number(row.sort_order || 0),
    created_by: row.created_by,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export function normalizeAcademyCatalogTrack(row: any): AcademyTrackCatalog {
  return {
    id: String(row.id || '').trim(),
    title: String(row.title || '').trim(),
    subtitle: String(row.subtitle || '').trim(),
    description: String(row.description || '').trim(),
    sort_order: Number(row.sort_order || 0),
    lessons: Array.isArray(row.lessons)
      ? row.lessons.map((lesson: any) => ({
          id: String(lesson.id || '').trim(),
          title: String(lesson.title || '').trim(),
          minutes: Number(lesson.minutes || 10),
          content_md: String(lesson.content_md || lesson.contentMd || ''),
          callouts: normalizeCallouts(lesson.callouts),
          sort_order: Number(lesson.sort_order || 0),
        }))
      : [],
  };
}

import { Router, Response } from 'express';
import { db } from '../index';
import {
  authenticateUser,
  AuthRequest,
  requireAcademyAccess,
  requireExecutiveAdmin,
} from '../middleware/auth';
import { calculateLearningStreak } from '../utils/academyStats';

const router = Router();

const QUESTION_STATUSES = new Set(['Draft', 'Published', 'Archived']);
const LESSON_STATUSES = new Set(['Draft', 'Published', 'Archived']);

type AcademyAction =
  | 'started'
  | 'checklist_updated'
  | 'lesson_completed'
  | 'quiz_passed'
  | 'progress_updated'
  | 'lesson_reviewed';

type AcademyQuestionChoice = {
  id: string;
  label: string;
};

function normalizeTrackId(value: unknown) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function normalizeBoolean(value: unknown) {
  return value === true || value === 'true' || value === 1 || value === '1';
}

function normalizeChecklist(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((item) => normalizeBoolean(item));
}

function isNotFoundLookupError(error: any): boolean {
  if (!error) {
    return false;
  }

  const code = String(error.code || '');
  const message = String(error.message || '').toLowerCase();
  const details = String(error.details || '').toLowerCase();

  // Supabase can return not-found from `.single()` as 404 or PGRST116/406.
  return code === '404' || code === 'PGRST116' || message.includes('no rows') || details.includes('0 rows');
}

function checklistEquals(a: unknown, b: unknown) {
  const left = Array.isArray(a) ? a.map((item) => normalizeBoolean(item)) : [];
  const right = Array.isArray(b) ? b.map((item) => normalizeBoolean(item)) : [];

  return (
    left.length === right.length &&
    left.every((value, index) => value === right[index])
  );
}

function buildAcademyAction(existing: any, payload: any, recordReview = false): AcademyAction | null {
  if (!existing) {
    if (payload.quiz_passed) {
      return 'quiz_passed';
    }

    if (payload.lesson_completed) {
      return 'lesson_completed';
    }

    if (Array.isArray(payload.checklist) && payload.checklist.some(Boolean)) {
      return 'checklist_updated';
    }

    return 'started';
  }

  if (!existing.lesson_completed && payload.lesson_completed) {
    return 'lesson_completed';
  }

  if (!existing.quiz_passed && payload.quiz_passed) {
    return 'quiz_passed';
  }

  if (!checklistEquals(existing.checklist, payload.checklist)) {
    return 'checklist_updated';
  }

  if (Number(existing.xp_awarded || 0) !== Number(payload.xp_awarded || 0)) {
    return 'progress_updated';
  }

  if (recordReview && payload.lesson_completed) {
    return 'lesson_reviewed';
  }

  return null;
}

function normalizeQuestionChoices(value: unknown): AcademyQuestionChoice[] {
  const raw = typeof value === 'string' ? safeJsonParse(value, []) : value;
  if (!Array.isArray(raw)) {
    return [];
  }

  return raw
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

function questionPayloadFromBody(body: any, userId?: string) {
  const track = normalizeTrackId(body?.track);
  const lessonId = String(body?.lesson_id || body?.lessonId || '').trim();
  const prompt = String(body?.prompt || '').trim();
  const choices = normalizeQuestionChoices(body?.choices);
  const correctChoiceId = String(body?.correct_choice_id || body?.correctChoiceId || '').trim();
  const explanation = String(body?.explanation || '').trim();
  const status = QUESTION_STATUSES.has(body?.status) ? body.status : 'Published';

  return {
    track,
    lesson_id: lessonId,
    prompt,
    choices,
    correct_choice_id: correctChoiceId,
    explanation,
    sort_order: Number.isFinite(Number(body?.sort_order))
      ? Number(body.sort_order)
      : 0,
    status,
    ...(userId ? { created_by: userId } : {}),
  };
}

function questionPatchFromBody(body: any) {
  const patch: Record<string, any> = {};

  if (body?.track !== undefined) {
    patch.track = normalizeTrackId(body.track);
  }

  if (body?.lesson_id !== undefined || body?.lessonId !== undefined) {
    patch.lesson_id = String(body.lesson_id || body.lessonId || '').trim();
  }

  if (body?.prompt !== undefined) {
    patch.prompt = String(body.prompt || '').trim();
  }

  if (body?.choices !== undefined) {
    patch.choices = normalizeQuestionChoices(body.choices);
  }

  if (body?.correct_choice_id !== undefined || body?.correctChoiceId !== undefined) {
    patch.correct_choice_id = String(body.correct_choice_id || body.correctChoiceId || '').trim();
  }

  if (body?.explanation !== undefined) {
    patch.explanation = String(body.explanation || '').trim();
  }

  if (body?.sort_order !== undefined) {
    patch.sort_order = Number.isFinite(Number(body.sort_order))
      ? Number(body.sort_order)
      : 0;
  }

  if (body?.status !== undefined) {
    patch.status = QUESTION_STATUSES.has(body.status) ? body.status : 'Draft';
  }

  patch.updated_at = new Date().toISOString();

  return patch;
}

function validateQuestionPayload(payload: any) {
  if (!payload.track) {
    return 'track is required';
  }

  if (!payload.lesson_id) {
    return 'lesson_id is required';
  }

  if (!payload.prompt) {
    return 'prompt is required';
  }

  if (!Array.isArray(payload.choices) || payload.choices.length < 2) {
    return 'at least two choices are required';
  }

  if (!payload.correct_choice_id) {
    return 'correct_choice_id is required';
  }

  if (!payload.choices.some((choice: AcademyQuestionChoice) => choice.id === payload.correct_choice_id)) {
    return 'correct_choice_id must match one of the choices';
  }

  return null;
}

function normalizeTrackPayload(body: any, userId?: string) {
  return {
    id: normalizeTrackId(body?.id),
    title: String(body?.title || '').trim(),
    subtitle: String(body?.subtitle || '').trim(),
    description: String(body?.description || '').trim(),
    status: LESSON_STATUSES.has(body?.status) ? body.status : 'Published',
    sort_order: Number.isFinite(Number(body?.sort_order)) ? Number(body.sort_order) : 0,
    ...(userId ? { created_by: userId } : {}),
  };
}

function normalizeTrackPatch(body: any) {
  const patch: Record<string, any> = { updated_at: new Date().toISOString() };

  if (body?.title !== undefined) {
    patch.title = String(body.title || '').trim();
  }
  if (body?.subtitle !== undefined) {
    patch.subtitle = String(body.subtitle || '').trim();
  }
  if (body?.description !== undefined) {
    patch.description = String(body.description || '').trim();
  }
  if (body?.status !== undefined) {
    patch.status = LESSON_STATUSES.has(body.status) ? body.status : 'Draft';
  }
  if (body?.sort_order !== undefined) {
    patch.sort_order = Number.isFinite(Number(body.sort_order)) ? Number(body.sort_order) : 0;
  }

  return patch;
}

function validateTrackPayload(payload: any) {
  if (!payload.id) {
    return 'track id is required';
  }

  if (!payload.title) {
    return 'track title is required';
  }

  return null;
}

function normalizeCallouts(value: unknown) {
  const parsed = typeof value === 'string' ? safeJsonParse(value, []) : value;
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

function normalizeLessonPayload(body: any, userId?: string) {
  return {
    track: normalizeTrackId(body?.track),
    lesson_id: String(body?.lesson_id || body?.lessonId || '').trim(),
    title: String(body?.title || '').trim(),
    minutes: Number.isFinite(Number(body?.minutes)) ? Number(body.minutes) : 10,
    content_md: String(body?.content_md || body?.contentMd || '').trim(),
    callouts: normalizeCallouts(body?.callouts),
    status: LESSON_STATUSES.has(body?.status) ? body.status : 'Published',
    sort_order: Number.isFinite(Number(body?.sort_order)) ? Number(body.sort_order) : 0,
    ...(userId ? { created_by: userId } : {}),
  };
}

function normalizeLessonPatch(body: any) {
  const patch: Record<string, any> = { updated_at: new Date().toISOString() };

  if (body?.track !== undefined) {
    patch.track = normalizeTrackId(body.track);
  }
  if (body?.lesson_id !== undefined || body?.lessonId !== undefined) {
    patch.lesson_id = String(body.lesson_id || body.lessonId || '').trim();
  }
  if (body?.title !== undefined) {
    patch.title = String(body.title || '').trim();
  }
  if (body?.minutes !== undefined) {
    patch.minutes = Number.isFinite(Number(body.minutes)) ? Number(body.minutes) : 10;
  }
  if (body?.content_md !== undefined || body?.contentMd !== undefined) {
    patch.content_md = String(body.content_md || body.contentMd || '').trim();
  }
  if (body?.callouts !== undefined) {
    patch.callouts = normalizeCallouts(body.callouts);
  }
  if (body?.status !== undefined) {
    patch.status = LESSON_STATUSES.has(body.status) ? body.status : 'Draft';
  }
  if (body?.sort_order !== undefined) {
    patch.sort_order = Number.isFinite(Number(body.sort_order)) ? Number(body.sort_order) : 0;
  }

  return patch;
}

function validateLessonPayload(payload: any) {
  if (!payload.track) {
    return 'track is required';
  }
  if (!payload.lesson_id) {
    return 'lesson_id is required';
  }
  if (!payload.title) {
    return 'title is required';
  }
  if (Number(payload.minutes) <= 0) {
    return 'minutes must be greater than 0';
  }
  return null;
}

async function recordAcademyActivity(row: any, action: AcademyAction) {
  const { error } = await db.from('academy_activity').insert([{
    user_id: row.user_id,
    track: row.track,
    lesson_id: row.lesson_id,
    action,
    lesson_completed: row.lesson_completed,
    quiz_passed: row.quiz_passed,
    checklist: row.checklist || [],
    xp_snapshot: row.xp_awarded || 0,
    recorded_at: new Date().toISOString(),
  }]);

  return error;
}

// GET /api/academy/catalog - published tracks + lessons for learner UI
router.get('/catalog', authenticateUser as any, requireAcademyAccess, async (req: AuthRequest, res: Response) => {
  try {
    const [{ data: tracks, error: tracksError }, { data: lessons, error: lessonsError }] =
      await Promise.all([
        db.from('academy_tracks').select('*').eq('status', 'Published').order('sort_order', { ascending: true }),
        db.from('academy_lessons').select('*').eq('status', 'Published').order('sort_order', { ascending: true }),
      ]);

    if (tracksError || lessonsError) {
      return res.status(500).json({
        error: 'Database Error',
        message: tracksError?.message || lessonsError?.message,
      });
    }

    const lessonMap = new Map<string, any[]>();
    for (const lesson of lessons || []) {
      const row = lessonMap.get(lesson.track) || [];
      row.push({
        id: lesson.lesson_id,
        title: lesson.title,
        minutes: Number(lesson.minutes || 10),
        content_md: lesson.content_md || '',
        callouts: Array.isArray(lesson.callouts) ? lesson.callouts : [],
        sort_order: Number(lesson.sort_order || 0),
      });
      lessonMap.set(lesson.track, row);
    }

    const data = (tracks || []).map((track: any) => ({
      id: track.id,
      title: track.title,
      subtitle: track.subtitle || '',
      description: track.description || '',
      sort_order: Number(track.sort_order || 0),
      lessons: (lessonMap.get(track.id) || []).sort(
        (a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0)
      ),
    }));

    res.json({
      success: true,
      data,
      count: data.length,
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
});

// GET /api/academy/admin/tracks - all tracks for admin management
router.get('/admin/tracks', authenticateUser as any, requireExecutiveAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { data, error } = await db
      .from('academy_tracks')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) {
      return res.status(500).json({
        error: 'Database Error',
        message: error.message,
      });
    }

    res.json({
      success: true,
      data: data || [],
      count: data?.length || 0,
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
});

router.post('/admin/tracks', authenticateUser as any, requireExecutiveAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const payload = normalizeTrackPayload(req.body, req.user?.id);
    const validationError = validateTrackPayload(payload);

    if (validationError) {
      return res.status(400).json({
        error: 'Bad Request',
        message: validationError,
      });
    }

    const { data, error } = await db
      .from('academy_tracks')
      .insert([payload])
      .select()
      .single();

    if (error) {
      return res.status(500).json({
        error: 'Database Error',
        message: error.message,
      });
    }

    res.status(201).json({
      success: true,
      data,
      message: 'Track created',
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
});

router.patch('/admin/tracks/:id', authenticateUser as any, requireExecutiveAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const patch = normalizeTrackPatch(req.body);
    if (patch.title !== undefined && !patch.title) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'title cannot be empty',
      });
    }

    const { data, error } = await db
      .from('academy_tracks')
      .update(patch)
      .eq('id', normalizeTrackId(req.params.id))
      .select()
      .single();

    if (error || !data) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Track not found',
      });
    }

    res.json({
      success: true,
      data,
      message: 'Track updated',
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
});

router.delete('/admin/tracks/:id', authenticateUser as any, requireExecutiveAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const trackId = normalizeTrackId(req.params.id);
    const { error } = await db
      .from('academy_tracks')
      .delete()
      .eq('id', trackId);

    if (error) {
      return res.status(500).json({
        error: 'Database Error',
        message: error.message,
      });
    }

    // Keep relational consistency for existing progress/activity rows.
    await db.from('academy_progress').delete().eq('track', trackId);
    await db.from('academy_activity').delete().eq('track', trackId);
    await db.from('academy_questions').delete().eq('track', trackId);
    await db.from('academy_lessons').delete().eq('track', trackId);

    res.json({
      success: true,
      message: 'Track deleted',
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
});

// GET /api/academy/admin/lessons - all lessons for admin management
router.get('/admin/lessons', authenticateUser as any, requireExecutiveAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const track = normalizeTrackId(req.query.track);
    let query = db
      .from('academy_lessons')
      .select('*')
      .order('track', { ascending: true })
      .order('sort_order', { ascending: true });

    if (track) {
      query = query.eq('track', track);
    }

    const { data, error } = await query;
    if (error) {
      return res.status(500).json({
        error: 'Database Error',
        message: error.message,
      });
    }

    res.json({
      success: true,
      data: data || [],
      count: data?.length || 0,
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
});

router.post('/admin/lessons', authenticateUser as any, requireExecutiveAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const payload = normalizeLessonPayload(req.body, req.user?.id);
    const validationError = validateLessonPayload(payload);
    if (validationError) {
      return res.status(400).json({
        error: 'Bad Request',
        message: validationError,
      });
    }

    const { data: track, error: trackError } = await db
      .from('academy_tracks')
      .select('id')
      .eq('id', payload.track)
      .single();

    if (trackError || !track) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'track does not exist',
      });
    }

    const { data, error } = await db
      .from('academy_lessons')
      .insert([payload])
      .select()
      .single();

    if (error) {
      return res.status(500).json({
        error: 'Database Error',
        message: error.message,
      });
    }

    res.status(201).json({
      success: true,
      data,
      message: 'Lesson created',
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
});

router.patch('/admin/lessons/:id', authenticateUser as any, requireExecutiveAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const patch = normalizeLessonPatch(req.body);
    if (patch.track) {
      const { data: track, error: trackError } = await db
        .from('academy_tracks')
        .select('id')
        .eq('id', patch.track)
        .single();
      if (trackError || !track) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'track does not exist',
        });
      }
    }

    const { data, error } = await db
      .from('academy_lessons')
      .update(patch)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error || !data) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Lesson not found',
      });
    }

    res.json({
      success: true,
      data,
      message: 'Lesson updated',
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
});

router.delete('/admin/lessons/:id', authenticateUser as any, requireExecutiveAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { data: lesson, error: fetchError } = await db
      .from('academy_lessons')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (fetchError || !lesson) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Lesson not found',
      });
    }

    const { error } = await db
      .from('academy_lessons')
      .delete()
      .eq('id', req.params.id);

    if (error) {
      return res.status(500).json({
        error: 'Database Error',
        message: error.message,
      });
    }

    await db.from('academy_questions').delete().eq('track', lesson.track).eq('lesson_id', lesson.lesson_id);
    await db.from('academy_progress').delete().eq('track', lesson.track).eq('lesson_id', lesson.lesson_id);
    await db.from('academy_activity').delete().eq('track', lesson.track).eq('lesson_id', lesson.lesson_id);

    res.json({
      success: true,
      message: 'Lesson deleted',
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
});

// GET /api/academy/questions - published quiz questions for academy lessons
router.get('/questions', authenticateUser as any, requireAcademyAccess, async (req: AuthRequest, res: Response) => {
  try {
    const track = normalizeTrackId(req.query.track);
    const lessonId = String(req.query.lesson_id || req.query.lessonId || '').trim();

    let query = db
      .from('academy_questions')
      .select('*')
      .eq('status', 'Published');

    if (track) {
      query = query.eq('track', track);
    }

    if (lessonId) {
      query = query.eq('lesson_id', lessonId);
    }

    const { data, error } = await query.order('sort_order', { ascending: true });

    if (error) {
      return res.status(500).json({
        error: 'Database Error',
        message: error.message,
      });
    }

    res.json({
      success: true,
      data: data || [],
      count: data?.length || 0,
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
});

// GET /api/academy/admin/questions - all academy questions for admins
router.get(
  '/admin/questions',
  authenticateUser as any,
  requireExecutiveAdmin,
  async (req: AuthRequest, res: Response) => {
    try {
      const { data, error } = await db
        .from('academy_questions')
        .select('*')
        .order('track', { ascending: true })
        .order('lesson_id', { ascending: true })
        .order('sort_order', { ascending: true });

      if (error) {
        return res.status(500).json({
          error: 'Database Error',
          message: error.message,
        });
      }

      res.json({
        success: true,
        data: data || [],
        count: data?.length || 0,
      });
    } catch (error: any) {
      res.status(500).json({
        error: 'Internal Server Error',
        message: error.message,
      });
    }
  }
);

// POST /api/academy/admin/questions - create academy question
router.post(
  '/admin/questions',
  authenticateUser as any,
  requireExecutiveAdmin,
  async (req: AuthRequest, res: Response) => {
    try {
      const payload = questionPayloadFromBody(req.body, req.user?.id);
      const validationError = validateQuestionPayload(payload);

      if (validationError) {
        return res.status(400).json({
          error: 'Bad Request',
          message: validationError,
        });
      }

      const { data: lesson, error: lessonError } = await db
        .from('academy_lessons')
        .select('id')
        .eq('track', payload.track)
        .eq('lesson_id', payload.lesson_id)
        .single();

      if (lessonError || !lesson) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'track/lesson_id does not exist in academy catalog',
        });
      }

      const { data, error } = await db
        .from('academy_questions')
        .insert([payload])
        .select()
        .single();

      if (error) {
        return res.status(500).json({
          error: 'Database Error',
          message: error.message,
        });
      }

      res.status(201).json({
        success: true,
        data,
        message: 'Question created',
      });
    } catch (error: any) {
      res.status(500).json({
        error: 'Internal Server Error',
        message: error.message,
      });
    }
  }
);

// PATCH /api/academy/admin/questions/:id - update academy question
router.patch(
  '/admin/questions/:id',
  authenticateUser as any,
  requireExecutiveAdmin,
  async (req: AuthRequest, res: Response) => {
    try {
      const { data: existingQuestion, error: existingQuestionError } = await db
        .from('academy_questions')
        .select('*')
        .eq('id', req.params.id)
        .single();

      if (existingQuestionError || !existingQuestion) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Question not found',
        });
      }

      const patch = questionPatchFromBody(req.body);
      const mergedForValidation = {
        track: patch.track || existingQuestion.track,
        lesson_id: patch.lesson_id || existingQuestion.lesson_id,
        prompt: patch.prompt || req.body?.prompt,
        choices: patch.choices || normalizeQuestionChoices(req.body?.choices),
        correct_choice_id:
          patch.correct_choice_id || req.body?.correct_choice_id || req.body?.correctChoiceId,
      };

      if (patch.track !== undefined && !patch.track) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'track is required',
        });
      }

      if (patch.choices && patch.choices.length < 2) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'at least two choices are required',
        });
      }

      if (patch.track !== undefined || patch.lesson_id !== undefined) {
        const { data: lesson, error: lessonError } = await db
          .from('academy_lessons')
          .select('id')
          .eq('track', mergedForValidation.track)
          .eq('lesson_id', mergedForValidation.lesson_id)
          .single();

        if (lessonError || !lesson) {
          return res.status(400).json({
            error: 'Bad Request',
            message: 'track/lesson_id does not exist in academy catalog',
          });
        }
      }

      if (
        mergedForValidation.correct_choice_id &&
        Array.isArray(mergedForValidation.choices) &&
        mergedForValidation.choices.length > 0 &&
        !mergedForValidation.choices.some(
          (choice: AcademyQuestionChoice) => choice.id === mergedForValidation.correct_choice_id
        )
      ) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'correct_choice_id must match one of the choices',
        });
      }

      const { data, error } = await db
        .from('academy_questions')
        .update(patch)
        .eq('id', req.params.id)
        .select()
        .single();

      if (error) {
        return res.status(500).json({
          error: 'Database Error',
          message: error.message,
        });
      }

      res.json({
        success: true,
        data,
        message: 'Question updated',
      });
    } catch (error: any) {
      res.status(500).json({
        error: 'Internal Server Error',
        message: error.message,
      });
    }
  }
);

// DELETE /api/academy/admin/questions/:id - delete academy question
router.delete(
  '/admin/questions/:id',
  authenticateUser as any,
  requireExecutiveAdmin,
  async (req: AuthRequest, res: Response) => {
    try {
      const { error } = await db
        .from('academy_questions')
        .delete()
        .eq('id', req.params.id);

      if (error) {
        return res.status(500).json({
          error: 'Database Error',
          message: error.message,
        });
      }

      res.json({
        success: true,
        message: 'Question deleted',
      });
    } catch (error: any) {
      res.status(500).json({
        error: 'Internal Server Error',
        message: error.message,
      });
    }
  }
);

// GET /api/academy/admin/overview - aggregated learner progress for admin
router.get(
  '/admin/overview',
  authenticateUser as any,
  requireExecutiveAdmin,
  async (req: AuthRequest, res: Response) => {
    try {
      const [
        { data: members, error: membersError },
        { data: rows, error: rowsError },
        { data: activityRows, error: activityError },
      ] =
        await Promise.all([
          db.from('members').select('*'),
          db.from('academy_progress').select('*'),
          db.from('academy_activity').select('*'),
        ]);

      if (membersError || rowsError || activityError) {
        return res.status(500).json({
          error: 'Database Error',
          message: membersError?.message || rowsError?.message || activityError?.message,
        });
      }

      const rowsByUser = new Map<string, any[]>();
      for (const row of rows || []) {
        const userRows = rowsByUser.get(row.user_id) || [];
        userRows.push(row);
        rowsByUser.set(row.user_id, userRows);
      }

      const activityByUser = new Map<string, any[]>();
      for (const row of activityRows || []) {
        const userRows = activityByUser.get(row.user_id) || [];
        userRows.push(row);
        activityByUser.set(row.user_id, userRows);
      }

      const overview = (members || []).map((member: any) => {
        const userRows = rowsByUser.get(member.id) || [];
        const userActivity = activityByUser.get(member.id) || [];
        const xp = userRows.reduce(
          (sum: number, row: any) => sum + Number(row.xp_awarded || 0),
          0
        );
        const completedLessons = userRows.filter(
          (row: any) => row.lesson_completed
        ).length;
        const quizPassed = userRows.filter((row: any) => row.quiz_passed).length;
        const lastActivity = userRows
          .map((row: any) => row.updated_at)
          .concat(userActivity.map((row: any) => row.recorded_at))
          .filter(Boolean)
          .sort()
          .pop() || null;

        return {
          user_id: member.id,
          name: member.name,
          role: member.role,
          member_type: member.member_type || 'member',
          academy_access: member.academy_access !== false,
          xp,
          completed_lessons: completedLessons,
          quiz_passed: quizPassed,
          streak: calculateLearningStreak(userActivity),
          last_activity: lastActivity,
        };
      });

      res.json({
        success: true,
        data: overview,
        count: overview.length,
      });
    } catch (error: any) {
      res.status(500).json({
        error: 'Internal Server Error',
        message: error.message,
      });
    }
  }
);

router.get(
  '/admin/history',
  authenticateUser as any,
  requireExecutiveAdmin,
  async (req: AuthRequest, res: Response) => {
    try {
      const [{ data: members, error: membersError }, { data: rows, error: rowsError }] =
        await Promise.all([
          db.from('members').select('*'),
          db.from('academy_activity').select('*').order('recorded_at', { ascending: false }),
        ]);

      if (membersError || rowsError) {
        return res.status(500).json({
          error: 'Database Error',
          message: membersError?.message || rowsError?.message,
        });
      }

      const memberMap = new Map<string, any>(
        (members || []).map((member: any) => [member.id, member])
      );

      const history = (rows || []).map((row: any) => {
        const member = memberMap.get(row.user_id);

        return {
          ...row,
          user_name: member?.name || row.user_id,
          role: member?.role || 'Unknown',
          member_type: member?.member_type || 'member',
        };
      });

      res.json({
        success: true,
        data: history,
        count: history.length,
      });
    } catch (error: any) {
      res.status(500).json({
        error: 'Internal Server Error',
        message: error.message,
      });
    }
  }
);

// GET /api/academy/progress - get all progress rows for current user
router.get('/progress', authenticateUser as any, requireAcademyAccess, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User authentication is required',
      });
    }

    const { data, error } = await db
      .from('academy_progress')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('[academy/get-progress] Database error:', error);
      return res.status(500).json({
        error: 'Database Error',
        message: error.message,
      });
    }

    const rows = data || [];
    const xp = rows.reduce((sum: number, row: any) => sum + Number(row.xp_awarded || 0), 0);

    res.json({
      success: true,
      data: {
        user_id: userId,
        xp,
        rows,
      },
    });
  } catch (error: any) {
    console.error('[academy/get-progress] Error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
});

// POST /api/academy/progress - upsert progress row for current user
router.post('/progress', authenticateUser as any, requireAcademyAccess, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User authentication is required',
      });
    }

    const {
      track,
      lesson_id,
      lesson_completed,
      quiz_passed,
      checklist,
      xp_awarded,
      record_review,
    } = req.body || {};

    if (!track || !lesson_id) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'track and lesson_id are required',
      });
    }

    const normalizedTrack = normalizeTrackId(track);
    const normalizedLessonId = String(lesson_id || '').trim();

    const { data: lessonRef, error: lessonRefError } = await db
      .from('academy_lessons')
      .select('id')
      .eq('track', normalizedTrack)
      .eq('lesson_id', normalizedLessonId)
      .single();

    if (lessonRefError || !lessonRef) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'track/lesson_id does not exist in academy catalog',
      });
    }

    const payload = {
      user_id: userId,
      track: normalizedTrack,
      lesson_id: normalizedLessonId,
      lesson_completed: normalizeBoolean(lesson_completed),
      quiz_passed: normalizeBoolean(quiz_passed),
      checklist: normalizeChecklist(checklist),
      xp_awarded: Math.max(0, Number(xp_awarded || 0)),
      updated_at: new Date().toISOString(),
    };

    const { data: existing, error: lookupError } = await db
      .from('academy_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('track', normalizedTrack)
      .eq('lesson_id', normalizedLessonId)
      .single();

    if (lookupError && !isNotFoundLookupError(lookupError)) {
      console.error('[academy/upsert-progress] Lookup error:', lookupError);
      return res.status(500).json({
        error: 'Database Error',
        message: lookupError.message,
      });
    }

    const activityAction = buildAcademyAction(
      existing,
      payload,
      normalizeBoolean(record_review)
    );

    if (existing?.id && !activityAction) {
      return res.json({
        success: true,
        data: existing,
        message: 'Progress already up to date',
      });
    }

    if (existing?.id) {
      const { data: updated, error: updateError } = await db
        .from('academy_progress')
        .update(payload)
        .eq('id', existing.id)
        .select()
        .single();

      if (updateError) {
        console.error('[academy/upsert-progress] Update error:', updateError);
        return res.status(500).json({
          error: 'Database Error',
          message: updateError.message,
        });
      }

      if (activityAction) {
        const activityError = await recordAcademyActivity(updated, activityAction);

        if (activityError) {
          console.error('[academy/upsert-progress] Activity insert error:', activityError);
          return res.status(500).json({
            error: 'Database Error',
            message: activityError.message,
          });
        }
      }

      return res.json({
        success: true,
        data: updated,
        message: 'Progress updated',
      });
    }

    const { data: created, error: insertError } = await db
      .from('academy_progress')
      .insert([payload])
      .select()
      .single();

    if (insertError) {
      console.error('[academy/upsert-progress] Insert error:', insertError);
      return res.status(500).json({
        error: 'Database Error',
        message: insertError.message,
      });
    }

    if (activityAction) {
      const activityError = await recordAcademyActivity(created, activityAction);

      if (activityError) {
        console.error('[academy/upsert-progress] Activity insert error:', activityError);
        return res.status(500).json({
          error: 'Database Error',
          message: activityError.message,
        });
      }
    }

    res.json({
      success: true,
      data: created,
      message: 'Progress created',
    });
  } catch (error: any) {
    console.error('[academy/upsert-progress] Error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
});

export default router;

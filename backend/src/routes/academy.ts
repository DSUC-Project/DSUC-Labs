import { Router, Response } from 'express';
import { db } from '../index';
import { authenticateUser, AuthRequest } from '../middleware/auth';

const router = Router();

const TRACKS = new Set(['genin', 'chunin', 'jonin']);

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

// GET /api/academy/progress - get all progress rows for current user
router.get('/progress', authenticateUser as any, async (req: AuthRequest, res: Response) => {
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
router.post('/progress', authenticateUser as any, async (req: AuthRequest, res: Response) => {
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
    } = req.body || {};

    if (!track || !lesson_id) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'track and lesson_id are required',
      });
    }

    if (!TRACKS.has(track)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'track must be one of genin, chunin, jonin',
      });
    }

    const payload = {
      user_id: userId,
      track,
      lesson_id,
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
      .eq('track', track)
      .eq('lesson_id', lesson_id)
      .single();

    if (lookupError && !isNotFoundLookupError(lookupError)) {
      console.error('[academy/upsert-progress] Lookup error:', lookupError);
      return res.status(500).json({
        error: 'Database Error',
        message: lookupError.message,
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

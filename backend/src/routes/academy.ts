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

function checklistEquals(a: unknown, b: unknown) {
  const left = Array.isArray(a) ? a.map((item) => normalizeBoolean(item)) : [];
  const right = Array.isArray(b) ? b.map((item) => normalizeBoolean(item)) : [];

  return (
    left.length === right.length &&
    left.every((value, index) => value === right[index])
  );
}

function buildAcademyAction(existing: any, payload: any) {
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

  return null;
}

async function recordAcademyActivity(row: any, action: string) {
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

    const activityAction = buildAcademyAction(existing, payload);

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

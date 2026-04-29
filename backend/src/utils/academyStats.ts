import { db } from "../index";

export interface AcademyStats {
  streak: number;
  academy_xp: number;
  completed_lessons: number;
  quiz_passed: number;
  last_activity: string | null;
}

const EMPTY_STATS: AcademyStats = {
  streak: 0,
  academy_xp: 0,
  completed_lessons: 0,
  quiz_passed: 0,
  last_activity: null,
};

const ACADEMY_TIME_ZONE = 'Asia/Ho_Chi_Minh';
const ACADEMY_DATE_FORMATTER = new Intl.DateTimeFormat('en-CA', {
  timeZone: ACADEMY_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

export function academyDateKey(value: Date) {
  const parts = ACADEMY_DATE_FORMATTER.formatToParts(value);
  const year = parts.find((part) => part.type === 'year')?.value || '0000';
  const month = parts.find((part) => part.type === 'month')?.value || '00';
  const day = parts.find((part) => part.type === 'day')?.value || '00';
  return `${year}-${month}-${day}`;
}

function shiftDays(value: Date, days: number) {
  const next = new Date(value);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

export function calculateLearningStreak(rows: any[], now = new Date()) {
  const activeDays = new Set(
    rows
      .map((row) => row?.recorded_at || row?.updated_at || row?.created_at)
      .filter(Boolean)
      .map((value) => academyDateKey(new Date(value)))
  );

  if (activeDays.size === 0) {
    return 0;
  }

  const today = academyDateKey(now);
  const yesterdayDate = shiftDays(now, -1);
  const yesterday = academyDateKey(yesterdayDate);

  if (!activeDays.has(today) && !activeDays.has(yesterday)) {
    return 0;
  }

  let cursor = activeDays.has(today) ? now : yesterdayDate;
  let streak = 0;

  while (activeDays.has(academyDateKey(cursor))) {
    streak += 1;
    cursor = shiftDays(cursor, -1);
  }

  return streak;
}

function emptyStatsByUser(userIds: string[]) {
  return new Map(userIds.map((id) => [id, { ...EMPTY_STATS }]));
}

export async function getAcademyStatsByUserIds(userIds: string[]) {
  const uniqueIds = [...new Set(userIds.filter(Boolean))];
  const statsByUser = emptyStatsByUser(uniqueIds);

  if (uniqueIds.length === 0) {
    return statsByUser;
  }

  try {
    const [
      { data: progressRows, error: progressError },
      { data: activityRows, error: activityError },
    ] = await Promise.all([
      db.from("academy_progress").select("*").in("user_id", uniqueIds),
      db.from("academy_activity").select("*").in("user_id", uniqueIds),
    ]);

    if (progressError) {
      console.warn("[academyStats] academy_progress unavailable:", progressError.message);
    }

    if (activityError) {
      console.warn("[academyStats] academy_activity unavailable:", activityError.message);
    }

    for (const row of progressRows || []) {
      const stats = statsByUser.get(row.user_id);
      if (!stats) continue;

      stats.academy_xp += Number(row.xp_awarded || 0);
      if (row.lesson_completed) stats.completed_lessons += 1;
      if (row.quiz_passed) stats.quiz_passed += 1;

      const updatedAt = row.updated_at || row.created_at;
      if (updatedAt && (!stats.last_activity || updatedAt > stats.last_activity)) {
        stats.last_activity = updatedAt;
      }
    }

    const activityByUser = new Map<string, any[]>();
    for (const row of activityRows || []) {
      const rows = activityByUser.get(row.user_id) || [];
      rows.push(row);
      activityByUser.set(row.user_id, rows);

      const stats = statsByUser.get(row.user_id);
      if (stats && row.recorded_at && (!stats.last_activity || row.recorded_at > stats.last_activity)) {
        stats.last_activity = row.recorded_at;
      }
    }

    for (const [userId, rows] of activityByUser.entries()) {
      const stats = statsByUser.get(userId);
      if (stats) {
        stats.streak = calculateLearningStreak(rows);
      }
    }
  } catch (error: any) {
    console.warn("[academyStats] Failed to calculate academy stats:", error.message);
  }

  return statsByUser;
}

export async function attachAcademyStatsToMembers<T extends { id: string }>(
  members: T[]
) {
  const statsByUser = await getAcademyStatsByUserIds(members.map((member) => member.id));

  return members.map((member) => ({
    ...member,
    ...(statsByUser.get(member.id) || EMPTY_STATS),
  }));
}

export async function attachAcademyStatsToMember<T extends { id: string }>(
  member: T | null | undefined
) {
  if (!member) {
    return member;
  }

  const [memberWithStats] = await attachAcademyStatsToMembers([member]);
  return memberWithStats;
}

const ACADEMY_V2_PROGRESS_PREFIX = 'academy-v2-';

function normalizeValue(value: string) {
  return String(value || '').trim().toLowerCase();
}

export function academyV2ProgressTrack(courseId: string) {
  return `${ACADEMY_V2_PROGRESS_PREFIX}${normalizeValue(courseId)}`;
}

export function academyV2LegacyProgressTrack(courseId: string) {
  return normalizeValue(courseId);
}

export function academyV2ProgressKeyVariants(courseId: string, unitId: string) {
  const normalizedUnitId = normalizeValue(unitId);

  return [
    `${academyV2ProgressTrack(courseId)}:${normalizedUnitId}`,
    `${academyV2LegacyProgressTrack(courseId)}:${normalizedUnitId}`,
  ];
}

export function isAcademyV2UnitCompleted(
  completedLessons: Record<string, boolean>,
  courseId: string,
  unitId: string
) {
  return academyV2ProgressKeyVariants(courseId, unitId).some(
    (key) => completedLessons[key] === true
  );
}

export function countCompletedAcademyV2CourseUnits(
  completedLessons: Record<string, boolean>,
  courseId: string
) {
  const trackedUnitIds = new Set<string>();
  const prefixes = [
    `${academyV2ProgressTrack(courseId)}:`,
    `${academyV2LegacyProgressTrack(courseId)}:`,
  ];

  for (const [key, value] of Object.entries(completedLessons || {})) {
    if (!value) {
      continue;
    }

    const matchedPrefix = prefixes.find((prefix) => key.startsWith(prefix));
    if (!matchedPrefix) {
      continue;
    }

    trackedUnitIds.add(key.slice(matchedPrefix.length));
  }

  return trackedUnitIds.size;
}

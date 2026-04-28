import type {
  AcademyV2CommunityTrack,
  AcademyV2CourseDetail,
  AcademyV2Path,
  AcademyV2UnitDetail,
  AcademyV2UnitSummary,
} from '@/types';
import {
  getAcademyV2CourseLocal,
  getAcademyV2PathsLocal,
  getAcademyV2UnitLocal,
} from '@/lib/academy/v2LocalCatalog';

const ACADEMY_V2_CACHE_VERSION = '2026-04-29-v2';
const CATALOG_TTL_MS = 1000 * 60 * 30;
const COURSE_TTL_MS = 1000 * 60 * 30;
const UNIT_TTL_MS = 1000 * 60 * 10;

type CacheEnvelope<T> = {
  version: string;
  stored_at: number;
  data: T;
};

type AcademyV2UnitResponse = {
  course: AcademyV2CourseDetail;
  unit: AcademyV2UnitDetail;
  previous_unit: AcademyV2UnitSummary | null;
  next_unit: AcademyV2UnitSummary | null;
  unit_index: number;
  total_units: number;
};

function cacheKey(apiBase: string, suffix: string) {
  return `academy-v2-cache:${apiBase || 'same-origin'}:${suffix}`;
}

function readCache<T>(key: string, ttlMs: number): T | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as CacheEnvelope<T>;
    if (
      parsed?.version !== ACADEMY_V2_CACHE_VERSION ||
      !parsed?.stored_at ||
      Date.now() - parsed.stored_at > ttlMs
    ) {
      window.localStorage.removeItem(key);
      return null;
    }

    return parsed.data ?? null;
  } catch {
    return null;
  }
}

function writeCache<T>(key: string, data: T) {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    const envelope: CacheEnvelope<T> = {
      version: ACADEMY_V2_CACHE_VERSION,
      stored_at: Date.now(),
      data,
    };
    window.localStorage.setItem(key, JSON.stringify(envelope));
  } catch {
    // Ignore cache write failures.
  }
}

export function buildAcademyAuthHeaders(token: string | null, walletAddress: string | null) {
  const headers: Record<string, string> = {};

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  } else if (walletAddress) {
    headers['x-wallet-address'] = walletAddress;
  }

  return headers;
}

async function fetchCommunityTrackSummaries(
  apiBase: string,
  token: string | null,
  walletAddress: string | null
) {
  try {
    const response = await fetch(`${apiBase}/api/academy/catalog`, {
      headers: buildAcademyAuthHeaders(token, walletAddress),
      credentials: 'include',
    });
    const result = await response.json().catch(() => null);

    if (!response.ok || !result?.success || !Array.isArray(result?.data)) {
      return [] as AcademyV2CommunityTrack[];
    }

    return (result.data as any[]).map((track) => ({
      id: String(track.id || '').trim(),
      title: String(track.title || '').trim(),
      subtitle: String(track.subtitle || '').trim(),
      description: String(track.description || '').trim(),
      sort_order: Number(track.sort_order || 0),
      lesson_count: Array.isArray(track.lessons) ? track.lessons.length : 0,
      total_minutes: Array.isArray(track.lessons)
        ? track.lessons.reduce(
            (sum: number, lesson: any) => sum + Number(lesson?.minutes || 0),
            0
          )
        : 0,
    }));
  } catch {
    return [] as AcademyV2CommunityTrack[];
  }
}

export async function fetchAcademyV2Catalog(
  apiBase: string,
  token: string | null,
  walletAddress: string | null
) {
  const key = cacheKey(apiBase, 'catalog');
  const cached = readCache<{
    curated_paths: AcademyV2Path[];
    community_tracks: AcademyV2CommunityTrack[];
  }>(key, CATALOG_TTL_MS);

  if (cached) {
    return cached;
  }

  const [curatedPaths, communityTracks] = await Promise.all([
    getAcademyV2PathsLocal(),
    fetchCommunityTrackSummaries(apiBase, token, walletAddress),
  ]);
  const data = {
    curated_paths: curatedPaths as AcademyV2Path[],
    community_tracks: communityTracks,
  };
  writeCache(key, data);
  return data;
}

export async function fetchAcademyV2Course(
  apiBase: string,
  courseId: string,
  token: string | null,
  walletAddress: string | null
) {
  const key = cacheKey(apiBase, `course:${courseId}`);
  const cached = readCache<AcademyV2CourseDetail>(key, COURSE_TTL_MS);
  if (cached) {
    return cached;
  }

  const course = await getAcademyV2CourseLocal(courseId);
  if (!course) {
    throw new Error('Failed to load academy course.');
  }
  writeCache(key, course);
  return course;
}

export async function fetchAcademyV2Unit(
  apiBase: string,
  courseId: string,
  unitId: string,
  token: string | null,
  walletAddress: string | null
) {
  const key = cacheKey(apiBase, `unit:${courseId}:${unitId}`);
  const cached = readCache<AcademyV2UnitResponse>(key, UNIT_TTL_MS);

  if (cached) {
    return cached;
  }

  const [course, unit] = await Promise.all([
    getAcademyV2CourseLocal(courseId),
    getAcademyV2UnitLocal(courseId, unitId),
  ]);
  if (!course || !unit) {
    throw new Error('Failed to load academy unit.');
  }

  const orderedUnits = course.modules
    .flatMap((module) => [...module.learn_units, ...module.practice_units])
    .sort((left, right) => Number(left.order || 0) - Number(right.order || 0));
  const unitIndex = orderedUnits.findIndex((item) => item.id === unit.id);
  const data: AcademyV2UnitResponse = {
    course,
    unit,
    previous_unit: unitIndex > 0 ? orderedUnits[unitIndex - 1] : null,
    next_unit:
      unitIndex >= 0 && unitIndex + 1 < orderedUnits.length ? orderedUnits[unitIndex + 1] : null,
    unit_index: Math.max(0, unitIndex),
    total_units: orderedUnits.length,
  };
  writeCache(key, data);
  return data;
}

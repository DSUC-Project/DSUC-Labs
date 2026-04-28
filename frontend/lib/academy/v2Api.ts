import type {
  AcademyV2CommunityTrack,
  AcademyV2CourseDetail,
  AcademyV2Path,
  AcademyV2UnitDetail,
  AcademyV2UnitSummary,
} from '@/types';

const ACADEMY_V2_CACHE_VERSION = '2026-04-29-v1';
const CATALOG_TTL_MS = 1000 * 60 * 30;
const COURSE_TTL_MS = 1000 * 60 * 30;
const UNIT_TTL_MS = 1000 * 60 * 10;

type CacheEnvelope<T> = {
  version: string;
  stored_at: number;
  data: T;
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

  const response = await fetch(`${apiBase}/api/academy/v2/catalog`, {
    headers: buildAcademyAuthHeaders(token, walletAddress),
    credentials: 'include',
  });
  const result = await response.json().catch(() => null);

  if (!response.ok || !result?.success) {
    throw new Error(result?.message || 'Failed to load Academy v2 catalog.');
  }

  const data = result.data as {
    curated_paths: AcademyV2Path[];
    community_tracks: AcademyV2CommunityTrack[];
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

  const response = await fetch(`${apiBase}/api/academy/v2/course/${courseId}`, {
    headers: buildAcademyAuthHeaders(token, walletAddress),
    credentials: 'include',
  });
  const result = await response.json().catch(() => null);

  if (!response.ok || !result?.success) {
    throw new Error(result?.message || 'Failed to load academy course.');
  }

  const data = result.data as AcademyV2CourseDetail;
  writeCache(key, data);
  return data;
}

export async function fetchAcademyV2Unit(
  apiBase: string,
  courseId: string,
  unitId: string,
  token: string | null,
  walletAddress: string | null
) {
  const key = cacheKey(apiBase, `unit:${courseId}:${unitId}`);
  const cached = readCache<{
    course: AcademyV2CourseDetail;
    unit: AcademyV2UnitDetail;
    previous_unit: AcademyV2UnitSummary | null;
    next_unit: AcademyV2UnitSummary | null;
    unit_index: number;
    total_units: number;
  }>(key, UNIT_TTL_MS);

  if (cached) {
    return cached;
  }

  const query = new URLSearchParams({
    course_id: courseId,
    unit_id: unitId,
  });
  const response = await fetch(`${apiBase}/api/academy/v2/unit?${query.toString()}`, {
    headers: buildAcademyAuthHeaders(token, walletAddress),
    credentials: 'include',
  });
  const result = await response.json().catch(() => null);

  if (!response.ok || !result?.success) {
    throw new Error(result?.message || 'Failed to load academy unit.');
  }

  const data = result.data as {
    course: AcademyV2CourseDetail;
    unit: AcademyV2UnitDetail;
    previous_unit: AcademyV2UnitSummary | null;
    next_unit: AcademyV2UnitSummary | null;
    unit_index: number;
    total_units: number;
  };
  writeCache(key, data);
  return data;
}

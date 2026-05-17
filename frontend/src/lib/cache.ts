const CACHE_PREFIX = "dsuc-cache-v2";

interface CacheEnvelope<T> {
  updatedAt: number;
  data: T;
}

function cacheKey(key: string) {
  if (typeof window === "undefined") {
    return `${CACHE_PREFIX}:server:${key}`;
  }

  const env = (import.meta as any).env;
  const rawApiBase = env?.VITE_API_BASE_URL || window.location.origin;

  try {
    const apiHost = new URL(rawApiBase, window.location.origin).host;
    return `${CACHE_PREFIX}:${apiHost}:${key}`;
  } catch {
    return `${CACHE_PREFIX}:unknown:${key}`;
  }
}

export function readCache<T>(key: string, maxAgeMs: number): T | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(cacheKey(key));
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as CacheEnvelope<T>;
    if (!parsed?.updatedAt || Date.now() - parsed.updatedAt > maxAgeMs) {
      return null;
    }

    return parsed.data;
  } catch {
    return null;
  }
}

export function writeCache<T>(key: string, data: T) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    const payload: CacheEnvelope<T> = {
      updatedAt: Date.now(),
      data,
    };
    window.localStorage.setItem(cacheKey(key), JSON.stringify(payload));
  } catch {
    // Ignore storage failures silently to avoid blocking UX.
  }
}

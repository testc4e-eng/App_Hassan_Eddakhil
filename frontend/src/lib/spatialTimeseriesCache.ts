import type { SpatialTimeseriesResponse } from "@/api/spatial";

type CacheEntry = {
  expiresAt: number;
  value: SpatialTimeseriesResponse;
};

const store = new Map<string, CacheEntry>();
const DEFAULT_TTL_MS = 5 * 60 * 1000;

export function buildSpatialSeriesCacheKey(parts: Record<string, string | number | undefined | null>) {
  return Object.entries(parts)
    .filter(([, value]) => value !== undefined && value !== null && value !== "")
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join("&");
}

export function getCachedSpatialSeries(key: string): SpatialTimeseriesResponse | null {
  const entry = store.get(key);
  if (!entry) return null;
  if (entry.expiresAt <= Date.now()) {
    store.delete(key);
    return null;
  }
  return entry.value;
}

export function setCachedSpatialSeries(
  key: string,
  value: SpatialTimeseriesResponse,
  ttlMs = DEFAULT_TTL_MS
) {
  store.set(key, { value, expiresAt: Date.now() + ttlMs });
}

export function invalidateSpatialSeriesCache(prefix?: string) {
  if (!prefix) {
    store.clear();
    return;
  }
  for (const key of store.keys()) {
    if (key.startsWith(prefix)) store.delete(key);
  }
}

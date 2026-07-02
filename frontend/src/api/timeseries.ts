// frontend/src/api/timeseries.ts
import { apiGet, qs } from "./client";

export type TimeseriesCatalogItem = {
  ts_id: number;
  station_id: number;
  station_code?: string;
  station_name?: string;

  property_id: number;
  property_name: string;
  unit?: string;

  run_id: number;
  scenario_code?: string;
  scenario_name?: string;

  source_type?: string;
  time_step?: string;

  n_measures?: string | number;
  dt_min?: string;
  dt_max?: string;
  v_min?: number;
  v_max?: number;
};

export type TimeseriesAggPoint = {
  period: string;
  avg_value: number;
  min_value: number;
  max_value: number;
  n: number;
};

export type TimeseriesBundleResponse = {
  stationId: number;
  runId: number;
  module: string;
  catalog: TimeseriesCatalogItem[];
  aggregated: Record<string, TimeseriesAggPoint[]>;
};

export type AggregationAvailabilityResponse = {
  daily: boolean;
  monthly: boolean;
  annual: boolean;
};

type TimeseriesQueryKey = string;

const catalogCache = new Map<TimeseriesQueryKey, Promise<TimeseriesCatalogItem[]>>();
const bundleCache = new Map<TimeseriesQueryKey, Promise<TimeseriesBundleResponse>>();

function buildKey(prefix: string, args: Record<string, unknown>): string {
  return `${prefix}:${Object.keys(args)
    .sort()
    .map((key) => `${key}=${String(args[key])}`)
    .join("&")}`;
}

function cacheRequest<T>(
  cache: Map<TimeseriesQueryKey, Promise<T>>,
  key: TimeseriesQueryKey,
  loader: () => Promise<T>
): Promise<T> {
  const existing = cache.get(key);
  if (existing) return existing;

  const promise = loader().catch((err) => {
    cache.delete(key);
    throw err;
  });
  cache.set(key, promise);
  return promise;
}

export const timeseriesApi = {
  health: () => apiGet<any>("/timeseries/health"),

  catalog: (args: { stationId: number; runId: number; module: string }) => {
    const key = buildKey("catalog", args);
    return cacheRequest(catalogCache, key, () => {
      const query = qs(args);
      return apiGet<TimeseriesCatalogItem[]>(`/timeseries/catalog${query}`);
    });
  },

  bundle: (args: {
    stationId: number;
    runId: number;
    module: string;
    agg?: "day" | "month" | "year";
    startDate?: string;
    endDate?: string;
  }) => {
    const key = buildKey("bundle", args);
    return cacheRequest(bundleCache, key, () => {
      const query = qs(args);
      return apiGet<TimeseriesBundleResponse>(`/timeseries/bundle${query}`);
    });
  },

  availability: (args: {
    stationId: number;
    runId: number;
    propertyId: number;
    module: string;
    startDate?: string;
    endDate?: string;
  }) => {
    const query = qs(args);
    return apiGet<AggregationAvailabilityResponse>(`/timeseries/availability${query}`);
  },

  clearCaches: () => {
    catalogCache.clear();
    bundleCache.clear();
  },
};

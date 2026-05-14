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

export const timeseriesApi = {
  health: () => apiGet<any>("/timeseries/health"),

  catalog: (args: { stationId: number; runId: number; module: string }) => {
    const query = qs(args);
    return apiGet<TimeseriesCatalogItem[]>(`/timeseries/catalog${query}`);
  },

  bundle: (args: {
    stationId: number;
    runId: number;
    module: string;
    agg?: "day" | "month" | "year";
  }) => {
    const query = qs(args);
    return apiGet<TimeseriesBundleResponse>(`/timeseries/bundle${query}`);
  },
};

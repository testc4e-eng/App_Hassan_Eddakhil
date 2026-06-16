// src/types/timeseries.types.ts

export type ModuleCode = "climat" | "hydro" | "erosion";
export type Grain = "daily" | "monthly" | "annual";

export interface TsCatalogRow {
  ts_id: number;
  station_id: number;
  station_code?: string;
  station_name?: string;

  property_id: number;
  property_name: string;
  unit?: string;
  standard_name?: string;

  run_id: number;
  scenario_code?: string;
  scenario_name?: string;

  source_type?: string;
  time_step?: string;

  ts_created_at?: Date;

  // enrichis via stats measurements
  n_points?: number;
  start_date?: string; // ISO
  end_date?: string; // ISO
}

export interface TsAggRow {
  ts_id: number;
  period: string; // ISO date string (date_trunc)
  value_avg: number | null;
  value_min: number | null;
  value_max: number | null;
  n_points: number;
}

export interface TimeseriesBundleResponse {
  catalog: TsCatalogRow[];
  aggregates: Record<string, TsAggRow[]>; // key = ts_id
}

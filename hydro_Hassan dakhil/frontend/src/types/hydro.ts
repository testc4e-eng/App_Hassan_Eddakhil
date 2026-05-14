// src/types/hydro.ts

export interface Station {
  station_id: number;
  name: string;
  geom?: string;
  type?: string;
  created_at?: string;
  code?: string;
  isActive?: boolean;
}

export interface Catchment {
  catchment_id: number;
  name: string;
  dam_name: string;
  area_m2: number;
  geom: string;
}

export interface Timeseries {
  ts_id: number;
  station_id: number;
  property_id: number;
  run_id?: number;
  unit?: string;
  catchment_id?: number;
  created_at?: string;

  station_name?: string;
  property_name?: string;
  property_code?: string;

  scenario_code?: string;
  scenario_name?: string;
}

export interface Measurement {
  ts_id: number;
  datetime: string;
  value: number;
  quality_flag?: string;
}

export interface ModelRun {
  run_id: number;
  scenario_code: string;
  scenario_name: string;
  description?: string;
  is_observed: boolean;
  created_at: string;
}

export interface Reservoir {
  reservoir_id: number;
  name: string;
  geom: string;
  created_at: string;
}

// ------------------
// ✅ AvailabilityRow (issu de api.v_timeseries_with_stats_ui / v_catalog_series_modules)
export type TimeStep = "instantaneous" | "daily" | "monthly" | "yearly";

export interface AvailabilityRow {
  ts_id: number;
  module_code: "climat" | "hydro" | "erosion";
  station_id: number;
  station_code: string;
  station_name: string;
  station_label?: string;

  property_id: number;
  property_name: string;
  unit?: string | null;

  run_id: number;
  scenario_code: string;
  scenario_name: string;

  source_type: string; // observed | simulated | ...
  time_step: string; // daily | monthly | yearly | instantaneous
  n_measures: number;

  dt_min?: string | null;
  dt_max?: string | null;

  v_min?: number | null;
  v_max?: number | null;

  created_at?: string;
  period_days?: number;
}

// ------------------
// UI Filters

export interface FilterState {
  stations: number[]; // station_id
  variables: number[]; // property_id
  runId?: number; // model run
  startDate: string;
  endDate: string;
  resolution: "instant" | "day" | "month" | "year";
}

// Réponse API standard
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  count?: number;
  error?: string;
}

// Types pour l'UI
export type ModuleType =
  | "climate"
  | "hydraulic"
  | "sediment"
  | "spatial"
  | "maps"
  | "reports";

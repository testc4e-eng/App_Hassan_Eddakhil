//src/types/hydro.types.ts

export interface Station {
  station_id: number;
  name: string;
  geom: string; // WKT ou GeoJSON
  type: string;
  created_at?: Date;
}

export interface Catchment {
  catchment_id: number;
  name: string;
  dam_name: string;
  area_m2: number;
  geom: string;
}

export interface Reservoir {
  reservoir_id: number;
  name: string;
  geom: string;
  created_at: Date;
}

export interface Timeseries {
  ts_id: number;
  station_id: number;
  property_id: number;
  unit: string;
  model_run_id?: number;
  catchment_id?: number;
  created_at: Date;
}

export interface Measurement {
  ts_id: number;
  datetime: Date;
  value: number;
  quality_flag?: string;
}

export interface LandcoverPeriod {
  lc_period_id: number;
  year: number;
  scenario_code: string;
  description?: string;
  source_data?: string;
}

export interface LandcoverClass {
  class_id: number;
  code: string;
  name_fr: string;
  name_en: string;
  color_hex: string;
}

export interface Landcover {
  lc_id: number;
  lc_period_id: number;
  class_id: number;
  geom: string;
  area_m2?: number;
}

export interface ModelRun {
  run_id: number;
  scenario_code: string;
  scenario_name: string;
  description?: string;
  is_observed: boolean;
  created_at: Date;
}

export interface ObservedProperty {
  property_id: number;
  property_code: string;
  property_name: string;
}

export interface FilterOptions {
  startDate?: string;
  endDate?: string;
  stationIds?: number[];
  catchmentIds?: number[];
  scenarioCode?: string;
  periodId?: number;
  limit?: number;
  offset?: number;
}

export interface SpatialBounds {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}

export type SourceType =
  | "observed"
  | "simulated"
  | "climate_model"
  | "cmip6_historical"
  | "cmip6_future"
  | string;

export type AvailabilityRow = {
  ts_id: number;

  station_id: number;
  station_code: string;
  station_name: string;
  station_label: string;

  property_id: number;
  property_name: string;
  unit: string | null;

  run_id: number;
  scenario_code: string;
  scenario_name: string;

  source_type: SourceType;
  time_step: "daily" | "monthly" | "annual" | string;

  n_measures: number;
  dt_min: string;
  dt_max: string;

  v_min: number | null;
  v_max: number | null;

  created_at: string;
  period_days: number | null;
};

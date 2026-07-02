export type SolidYieldInterval = "day" | "month" | "year";

export interface SolidYieldSubbasinRow {
  subbasin_station_id: number;
  subbasin_id: number;
  station_code: string;
  subbasin_name: string;
  runs_count: number;
  points_count: number;
  min_date: string | null;
  max_date: string | null;
}

export interface SolidYieldAvailabilityRow {
  subbasin_station_id: number;
  subbasin_id: number;
  station_code: string;
  subbasin_name: string;
  run_id: number;
  scenario_code: string;
  scenario_name: string;
  source_type: string;
  property_id: number;
  property_name: string;
  standard_name: string;
  unit: string | null;
  points_count: number;
  min_date: string | null;
  max_date: string | null;
}

export interface SolidYieldSeriesPoint {
  period: string;
  value: number | null;
  n: number;
}

export interface SolidYieldStats {
  min_value: number | null;
  max_value: number | null;
  avg_value: number | null;
  sum_value: number | null;
  n_points: number;
  min_date: string | null;
  max_date: string | null;
}


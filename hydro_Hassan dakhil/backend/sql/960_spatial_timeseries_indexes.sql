-- Spatial / timeseries query performance (idempotent)
CREATE INDEX IF NOT EXISTS idx_measurements_ts_datetime
  ON core.measurements (ts_id, datetime);

CREATE INDEX IF NOT EXISTS idx_timeseries_station_run_property
  ON core.timeseries (station_id, run_id, property_id);

CREATE INDEX IF NOT EXISTS idx_rch_results_scenario_sub_period
  ON access.rch_results (scenario_code, sub_code, period_date);

CREATE INDEX IF NOT EXISTS idx_sub_results_scenario_sub_period
  ON access.sub_results (scenario_code, sub_code, period_date);

CREATE INDEX IF NOT EXISTS idx_station_subbasin_map_active
  ON core.station_subbasin_map (station_id, is_active);

CREATE INDEX IF NOT EXISTS idx_station_reach_map_active
  ON core.station_reach_map (reach_id, is_active);

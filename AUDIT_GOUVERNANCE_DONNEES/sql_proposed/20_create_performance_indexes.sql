-- ============================================================
-- Script de création d'index de performance
-- ============================================================
-- À exécuter pendant une fenêtre de maintenance.

-- Tables SWAT
CREATE INDEX IF NOT EXISTS idx_sub_results_scenario_sub_code_period
  ON access.sub_results (scenario_code, sub_code, period_date);

CREATE INDEX IF NOT EXISTS idx_rch_results_scenario_sub_code_period
  ON access.rch_results (scenario_code, sub_code, period_date);

CREATE INDEX IF NOT EXISTS idx_hru_results_scenario_sub_code_period
  ON access.hru_results (scenario_code, sub_code, period_date);

-- Séries temporelles
CREATE INDEX IF NOT EXISTS idx_measurements_ts_datetime
  ON core.measurements (ts_id, datetime);

CREATE INDEX IF NOT EXISTS idx_measurement_batches_ts_datetime
  ON core.measurement_batches (ts_id, datetime);

-- Lookups spatiaux
CREATE INDEX IF NOT EXISTS idx_subbasin_shapes_subbasin_id
  ON gis.subbasin_shapes (subbasin_id);

CREATE INDEX IF NOT EXISTS idx_reach_shapes_reach_id
  ON gis.reach_shapes (reach_id);

-- Mappings
CREATE INDEX IF NOT EXISTS idx_station_subbasin_map_subbasin_active
  ON core.station_subbasin_map (subbasin_id, is_active);

CREATE INDEX IF NOT EXISTS idx_station_reach_map_reach_active
  ON core.station_reach_map (reach_id, is_active);

-- Statistiques
ANALYZE access.sub_results;
ANALYZE access.rch_results;
ANALYZE access.hru_results;
ANALYZE core.measurements;
ANALYZE core.measurement_batches;

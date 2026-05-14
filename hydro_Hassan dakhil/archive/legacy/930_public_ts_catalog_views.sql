-- 930_public_ts_catalog_views.sql
BEGIN;

-- =========================================================
-- 1) Vue "catalog" simple (compat HydroService si besoin)
-- =========================================================
CREATE OR REPLACE VIEW public.v_ts_catalog AS
SELECT
  ts.ts_id,
  ts.station_id,
  s.station_code,
  s.name AS station_name,

  ts.property_id,
  op.name AS property_name,
  op.unit,
  op.standard_name,

  ts.run_id,
  mr.scenario_code,
  mr.scenario_name,
  mr.is_observed,

  ts.source_type,
  ts.time_step,
  ts.created_at AS ts_created_at
FROM public.timeseries ts
JOIN public.stations s
  ON s.station_id = ts.station_id
JOIN ref.observed_properties op
  ON op.property_id = ts.property_id
JOIN public.model_runs mr
  ON mr.run_id = ts.run_id;

COMMENT ON VIEW public.v_ts_catalog IS
'Catalogue timeseries (station, propriété, scénario/run) basé sur public.timeseries + public.stations + ref.observed_properties + public.model_runs.';


-- =========================================================
-- 2) Vue enrichie attendue par TimeseriesService
--    - inclut n_points, start_date, end_date (depuis measurements)
-- =========================================================
CREATE OR REPLACE VIEW public.v_ts_catalog_enriched AS
WITH meas AS (
  SELECT
    m.ts_id,
    COUNT(*)::bigint AS n_points,
    MIN(m.datetime)  AS start_date,
    MAX(m.datetime)  AS end_date
  FROM public.measurements m
  GROUP BY m.ts_id
)
SELECT
  c.ts_id,
  c.station_id,
  c.station_code,
  c.station_name,

  c.property_id,
  c.property_name,
  c.unit,
  c.standard_name,

  c.run_id,
  c.scenario_code,
  c.scenario_name,

  c.source_type,
  c.time_step,
  c.ts_created_at,

  COALESCE(meas.n_points, 0)::bigint AS n_points,
  meas.start_date,
  meas.end_date
FROM public.v_ts_catalog c
LEFT JOIN meas
  ON meas.ts_id = c.ts_id;

COMMENT ON VIEW public.v_ts_catalog_enriched IS
'Catalogue timeseries enrichi avec statistiques de base (n_points, start_date, end_date) calculées depuis measurements.';

COMMIT;

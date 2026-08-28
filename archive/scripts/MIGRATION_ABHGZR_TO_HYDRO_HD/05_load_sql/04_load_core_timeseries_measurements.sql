-- 04_load_core_timeseries_measurements.sql
-- Load timeseries + measurements from staging.norm_measurements.
-- Non-destructive, idempotent.
-- Param: :load_batch_id

\if :{?load_batch_id}
\echo Using provided load_batch_id = :load_batch_id
\else
SELECT COALESCE(
  (SELECT load_batch_id
   FROM staging.norm_measurements
   ORDER BY inserted_at DESC
   LIMIT 1),
  'NO_BATCH_FOUND'
) AS load_batch_id
\gset
\echo Auto-detected load_batch_id = :load_batch_id
\endif

BEGIN;

-- Ensure surrogate stations for reservoir series (entity_type='reservoir')
-- This keeps compatibility with current core.timeseries(station_id,...).
WITH fallback_catchment AS (
  SELECT c.catchment_id
  FROM core.catchments c
  ORDER BY c.catchment_id
  LIMIT 1
)
INSERT INTO core.stations (
  station_code, name, type_station, station_type_code, catchment_id
)
SELECT DISTINCT
  'RES_' || m.entity_code AS station_code,
  'Reservoir ' || m.entity_code AS name,
  'reservoir_virtual' AS type_station,
  'RESERVOIR' AS station_type_code,
  (SELECT catchment_id FROM fallback_catchment)
FROM staging.norm_measurements m
WHERE m.load_batch_id = :'load_batch_id'
  AND m.entity_type = 'reservoir'
  AND m.entity_code IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM core.stations s
    WHERE s.station_code = 'RES_' || m.entity_code
  );

-- Insert timeseries
WITH observed_run AS (
  SELECT r.run_id
  FROM core.model_runs r
  WHERE upper(r.scenario_code) = 'OBSERVED'
  ORDER BY r.run_id
  LIMIT 1
),
series_seed AS (
  SELECT DISTINCT
    CASE
      WHEN m.entity_type = 'station' THEN m.entity_code
      ELSE 'RES_' || m.entity_code
    END AS station_code,
    m.property_code,
    m.time_step
  FROM staging.norm_measurements m
  WHERE m.load_batch_id = :'load_batch_id'
    AND m.entity_code IS NOT NULL
    AND m.property_code IS NOT NULL
)
INSERT INTO core.timeseries (
  station_id, property_id, run_id, source_type, time_step
)
SELECT
  s.station_id,
  p.property_id,
  (SELECT run_id FROM observed_run),
  'observed' AS source_type,
  x.time_step::time_step
FROM series_seed x
JOIN core.stations s
  ON s.station_code = x.station_code
JOIN ref.observed_properties p
  ON upper(p.standard_name) = upper(x.property_code)
WHERE NOT EXISTS (
  SELECT 1
  FROM core.timeseries t
  WHERE t.station_id = s.station_id
    AND t.property_id = p.property_id
    AND t.run_id = (SELECT run_id FROM observed_run)
    AND t.source_type = 'observed'
    AND t.time_step = x.time_step::time_step
);

-- Insert measurements
WITH observed_run AS (
  SELECT r.run_id
  FROM core.model_runs r
  WHERE upper(r.scenario_code) = 'OBSERVED'
  ORDER BY r.run_id
  LIMIT 1
),
resolved AS (
  SELECT
    m.*,
    s.station_id,
    p.property_id
  FROM staging.norm_measurements m
  JOIN core.stations s
    ON s.station_code = CASE WHEN m.entity_type = 'station' THEN m.entity_code ELSE 'RES_' || m.entity_code END
  JOIN ref.observed_properties p
    ON upper(p.standard_name) = upper(m.property_code)
  WHERE m.load_batch_id = :'load_batch_id'
),
resolved_ts AS (
  SELECT
    t.ts_id,
    r.datetime_utc,
    AVG(r.value)::double precision AS value
  FROM resolved r
  JOIN core.timeseries t
    ON t.station_id = r.station_id
   AND t.property_id = r.property_id
   AND t.run_id = (SELECT run_id FROM observed_run)
   AND t.source_type = 'observed'
   AND t.time_step = r.time_step::time_step
  GROUP BY t.ts_id, r.datetime_utc
)
INSERT INTO core.measurements (ts_id, datetime, value, quality_flag)
SELECT
  ts_id,
  datetime_utc,
  value,
  1::smallint AS quality_flag
FROM resolved_ts x
WHERE NOT EXISTS (
  SELECT 1
  FROM core.measurements m
  WHERE m.ts_id = x.ts_id
    AND m.datetime = x.datetime_utc
);

COMMIT;

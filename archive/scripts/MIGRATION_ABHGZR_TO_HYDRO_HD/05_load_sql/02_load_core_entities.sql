-- 02_load_core_entities.sql
-- Load catchments/reservoirs/stations from normalized staging.
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

-- Catchments
INSERT INTO core.catchments (name, dam_name, area_m2, geom)
SELECT
  n.name,
  n.dam_name,
  CASE WHEN n.geom IS NOT NULL THEN ST_Area(n.geom::geography) ELSE NULL END AS area_m2,
  n.geom
FROM staging.norm_catchments n
WHERE n.load_batch_id = :'load_batch_id'
  AND n.name IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM core.catchments c
    WHERE lower(c.name) = lower(n.name)
  );

-- Fallback catchment to attach stations/reservoirs if not directly mapped
WITH fallback_catchment AS (
  SELECT c.catchment_id
  FROM core.catchments c
  ORDER BY c.catchment_id
  LIMIT 1
)
INSERT INTO core.reservoirs (name, geom, catchment_id, reservoir_code, commune_code)
SELECT
  r.name,
  r.geom,
  (SELECT catchment_id FROM fallback_catchment),
  r.reservoir_code,
  r.commune_code
FROM staging.norm_reservoirs r
WHERE r.load_batch_id = :'load_batch_id'
  AND r.reservoir_code IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM core.reservoirs x
    WHERE x.reservoir_code = r.reservoir_code
  );

WITH fallback_catchment AS (
  SELECT c.catchment_id
  FROM core.catchments c
  ORDER BY c.catchment_id
  LIMIT 1
)
INSERT INTO core.stations (
  station_code,
  name,
  type_station,
  station_type_code,
  commune_code,
  geom,
  altitude_m,
  catchment_id
)
SELECT
  s.station_code,
  s.station_name,
  s.type_station,
  s.station_type_code,
  s.commune_code,
  s.geom,
  s.altitude_m,
  (SELECT catchment_id FROM fallback_catchment)
FROM staging.norm_stations s
WHERE s.load_batch_id = :'load_batch_id'
  AND s.station_code IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM core.stations x
    WHERE x.station_code = s.station_code
  );

COMMIT;

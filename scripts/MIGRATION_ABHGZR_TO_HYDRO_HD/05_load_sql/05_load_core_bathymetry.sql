-- 05_load_core_bathymetry.sql
-- Load reservoir bathymetry from staging.norm_reservoir_bathymetry.
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

INSERT INTO core.reservoir_bathymetry (
  reservoir_id, level_m, volume_hm3, area_km2, source
)
SELECT
  r.reservoir_id,
  b.level_m,
  b.volume_hm3,
  b.area_km2,
  COALESCE(b.source, 'ABHGZR_SOURCE')
FROM staging.norm_reservoir_bathymetry b
JOIN core.reservoirs r
  ON r.reservoir_code = b.reservoir_code
WHERE b.load_batch_id = :'load_batch_id'
  AND b.level_m IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM core.reservoir_bathymetry x
    WHERE x.reservoir_id = r.reservoir_id
      AND x.level_m = b.level_m
      AND COALESCE(x.volume_hm3, -1) = COALESCE(b.volume_hm3, -1)
      AND COALESCE(x.area_km2, -1) = COALESCE(b.area_km2, -1)
  );

COMMIT;

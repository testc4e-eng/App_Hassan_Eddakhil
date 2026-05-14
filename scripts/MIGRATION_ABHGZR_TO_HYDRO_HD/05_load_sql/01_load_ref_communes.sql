-- 01_load_ref_communes.sql
-- Load communes from staging.norm_communes -> ref.communes
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

INSERT INTO ref.communes (
  commune_id,
  code_commune,
  name_fr,
  name_ar,
  milieu,
  code_region,
  region_name_fr,
  code_province,
  province_name_fr,
  code_cercle,
  cercle_name_fr,
  cercle_name_ar,
  area_m2,
  geom
)
WITH max_id AS (
  SELECT COALESCE(MAX(c.commune_id), 0) AS base_id
  FROM ref.communes c
),
seed AS (
  SELECT
    n.*,
    ROW_NUMBER() OVER (ORDER BY n.commune_code, n.source_pk) AS rn
  FROM staging.norm_communes n
  WHERE n.load_batch_id = :'load_batch_id'
    AND n.commune_code IS NOT NULL
    AND NOT EXISTS (
      SELECT 1
      FROM ref.communes c
      WHERE c.code_commune = n.commune_code
    )
)
SELECT
  (SELECT base_id FROM max_id) + s.rn,
  s.commune_code,
  s.name_fr,
  s.name_ar,
  s.milieu,
  s.code_region,
  s.region_name_fr,
  s.code_province,
  s.province_name_fr,
  s.code_cercle,
  s.cercle_name_fr,
  s.cercle_name_ar,
  CASE WHEN s.geom IS NOT NULL THEN ST_Area(s.geom::geography) ELSE NULL END AS area_m2,
  s.geom
FROM seed s;

COMMIT;

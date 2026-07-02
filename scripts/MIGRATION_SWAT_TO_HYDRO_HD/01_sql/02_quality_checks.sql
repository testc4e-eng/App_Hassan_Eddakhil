-- Vérification couverture entités
SELECT 'subbasin_shapes_count' AS metric, COUNT(*)::int AS value FROM gis.subbasin_shapes
UNION ALL
SELECT 'reach_shapes_count', COUNT(*)::int FROM gis.reach_shapes
UNION ALL
SELECT 'swat_sub_norm_distinct', COUNT(DISTINCT subbasin_id)::int FROM staging.swat_sub_norm
UNION ALL
SELECT 'swat_rch_norm_distinct', COUNT(DISTINCT reach_id)::int FROM staging.swat_rch_norm;

-- Contrôle dates
SELECT
  'swat_rch_norm_period' AS metric,
  MIN(obs_date)::text AS date_min,
  MAX(obs_date)::text AS date_max,
  COUNT(*)::int AS rows
FROM staging.swat_rch_norm
UNION ALL
SELECT
  'swat_sub_norm_period',
  MIN(obs_date)::text,
  MAX(obs_date)::text,
  COUNT(*)::int
FROM staging.swat_sub_norm;

-- Contrôle doublons métier
SELECT
  station_id,
  run_id,
  obs_date,
  COUNT(*)::int AS n
FROM staging.swat_sub_norm
GROUP BY station_id, run_id, obs_date
HAVING COUNT(*) > 1
ORDER BY n DESC
LIMIT 20;

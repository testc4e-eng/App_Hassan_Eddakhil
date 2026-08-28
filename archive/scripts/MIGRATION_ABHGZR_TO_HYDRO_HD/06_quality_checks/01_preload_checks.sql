-- 01_preload_checks.sql
-- Run after ETL raw load, before normalization/final load.
-- Param: :load_batch_id

\if :{?load_batch_id}
\echo Using provided load_batch_id = :load_batch_id
\else
SELECT COALESCE(
  (SELECT load_batch_id
   FROM staging.migration_batches
   WHERE mode = 'commit' AND status = 'success'
   ORDER BY started_at DESC
   LIMIT 1),
  'NO_BATCH_FOUND'
) AS load_batch_id
\gset
\echo Auto-detected load_batch_id = :load_batch_id
\endif

-- Raw counts by table
SELECT 'raw_adm_communes_abhgzr' AS table_name, COUNT(*)::bigint AS rows
FROM staging.raw_adm_communes_abhgzr WHERE load_batch_id = :'load_batch_id'
UNION ALL
SELECT 'raw_bassin_abhgzr', COUNT(*)::bigint
FROM staging.raw_bassin_abhgzr WHERE load_batch_id = :'load_batch_id'
UNION ALL
SELECT 'raw_barrages_abhgzr', COUNT(*)::bigint
FROM staging.raw_barrages_abhgzr WHERE load_batch_id = :'load_batch_id'
UNION ALL
SELECT 'raw_stations_abhgzr', COUNT(*)::bigint
FROM staging.raw_stations_abhgzr WHERE load_batch_id = :'load_batch_id'
UNION ALL
SELECT 'raw_mesures_precipitations_jr', COUNT(*)::bigint
FROM staging.raw_mesures_precipitations_jr WHERE load_batch_id = :'load_batch_id'
UNION ALL
SELECT 'raw_mesures_debits_jr', COUNT(*)::bigint
FROM staging.raw_mesures_debits_jr WHERE load_batch_id = :'load_batch_id'
UNION ALL
SELECT 'raw_mesures_temperature_jr_pn', COUNT(*)::bigint
FROM staging.raw_mesures_temperature_jr_pn WHERE load_batch_id = :'load_batch_id'
UNION ALL
SELECT 'raw_mesures_lachers_barrages', COUNT(*)::bigint
FROM staging.raw_mesures_lachers_barrages WHERE load_batch_id = :'load_batch_id'
UNION ALL
SELECT 'raw_mesures_temperature_m', COUNT(*)::bigint
FROM staging.raw_mesures_temperature_m WHERE load_batch_id = :'load_batch_id'
UNION ALL
SELECT 'raw_mesures_evaporation_m', COUNT(*)::bigint
FROM staging.raw_mesures_evaporation_m WHERE load_batch_id = :'load_batch_id'
UNION ALL
SELECT 'raw_mesures_humidite_relative_m', COUNT(*)::bigint
FROM staging.raw_mesures_humidite_relative_m WHERE load_batch_id = :'load_batch_id'
UNION ALL
SELECT 'raw_mesures_vitesse_vent_m', COUNT(*)::bigint
FROM staging.raw_mesures_vitesse_vent_m WHERE load_batch_id = :'load_batch_id'
UNION ALL
SELECT 'raw_bathymetries_barrages_abhgzr', COUNT(*)::bigint
FROM staging.raw_bathymetries_barrages_abhgzr WHERE load_batch_id = :'load_batch_id'
ORDER BY table_name;

-- Basic key integrity in raw
SELECT 'stations without commune_code' AS check_name, COUNT(*)::bigint AS issue_count
FROM staging.raw_stations_abhgzr
WHERE load_batch_id = :'load_batch_id'
  AND (code_commune IS NULL OR trim(code_commune) = '')
UNION ALL
SELECT 'measurements without station_code (daily)', COUNT(*)::bigint
FROM staging.raw_mesures_precipitations_jr
WHERE load_batch_id = :'load_batch_id'
  AND (ire_station IS NULL OR trim(ire_station) = '')
UNION ALL
SELECT 'lachers without reservoir_code', COUNT(*)::bigint
FROM staging.raw_mesures_lachers_barrages
WHERE load_batch_id = :'load_batch_id'
  AND (ire_barrage IS NULL OR trim(ire_barrage) = '');

-- Geometry raw null rates
SELECT 'raw_adm_communes geom null' AS check_name,
       COUNT(*) FILTER (WHERE geom_ewkt IS NULL)::bigint AS issue_count
FROM staging.raw_adm_communes_abhgzr
WHERE load_batch_id = :'load_batch_id'
UNION ALL
SELECT 'raw_bassin geom null',
       COUNT(*) FILTER (WHERE geom_ewkt IS NULL)::bigint
FROM staging.raw_bassin_abhgzr
WHERE load_batch_id = :'load_batch_id'
UNION ALL
SELECT 'raw_barrages geom null',
       COUNT(*) FILTER (WHERE geom_ewkt IS NULL)::bigint
FROM staging.raw_barrages_abhgzr
WHERE load_batch_id = :'load_batch_id'
UNION ALL
SELECT 'raw_stations geom null',
       COUNT(*) FILTER (WHERE geom_ewkt IS NULL)::bigint
FROM staging.raw_stations_abhgzr
WHERE load_batch_id = :'load_batch_id';

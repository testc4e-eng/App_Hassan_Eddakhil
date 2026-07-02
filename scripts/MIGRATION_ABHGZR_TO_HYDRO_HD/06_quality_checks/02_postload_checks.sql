-- 02_postload_checks.sql
-- Run after final load.
-- Param: :load_batch_id

\if :{?load_batch_id}
\echo Using provided load_batch_id = :load_batch_id
\else
SELECT COALESCE(MAX(load_batch_id), 'NO_BATCH_FOUND') AS load_batch_id
FROM staging.norm_measurements
\gset
\echo Auto-detected load_batch_id = :load_batch_id
\endif

-- Normalized counts
SELECT 'norm_communes' AS table_name, COUNT(*)::bigint AS rows
FROM staging.norm_communes WHERE load_batch_id = :'load_batch_id'
UNION ALL
SELECT 'norm_catchments', COUNT(*)::bigint
FROM staging.norm_catchments WHERE load_batch_id = :'load_batch_id'
UNION ALL
SELECT 'norm_reservoirs', COUNT(*)::bigint
FROM staging.norm_reservoirs WHERE load_batch_id = :'load_batch_id'
UNION ALL
SELECT 'norm_stations', COUNT(*)::bigint
FROM staging.norm_stations WHERE load_batch_id = :'load_batch_id'
UNION ALL
SELECT 'norm_measurements', COUNT(*)::bigint
FROM staging.norm_measurements WHERE load_batch_id = :'load_batch_id'
UNION ALL
SELECT 'norm_reservoir_bathymetry', COUNT(*)::bigint
FROM staging.norm_reservoir_bathymetry WHERE load_batch_id = :'load_batch_id'
ORDER BY table_name;

-- Orphan checks on target
SELECT 'core.stations without commune reference' AS check_name,
       COUNT(*)::bigint AS issue_count
FROM core.stations s
LEFT JOIN ref.communes c ON c.code_commune = s.commune_code
WHERE s.commune_code IS NOT NULL
  AND c.code_commune IS NULL
UNION ALL
SELECT 'core.timeseries without station', COUNT(*)::bigint
FROM core.timeseries t
LEFT JOIN core.stations s ON s.station_id = t.station_id
WHERE s.station_id IS NULL
UNION ALL
SELECT 'core.timeseries without property', COUNT(*)::bigint
FROM core.timeseries t
LEFT JOIN ref.observed_properties p ON p.property_id = t.property_id
WHERE p.property_id IS NULL
UNION ALL
SELECT 'core.measurements without timeseries', COUNT(*)::bigint
FROM core.measurements m
LEFT JOIN core.timeseries t ON t.ts_id = m.ts_id
WHERE t.ts_id IS NULL
UNION ALL
SELECT 'core.reservoir_bathymetry without reservoir', COUNT(*)::bigint
FROM core.reservoir_bathymetry b
LEFT JOIN core.reservoirs r ON r.reservoir_id = b.reservoir_id
WHERE r.reservoir_id IS NULL;

-- Geometry quality on inserted entities
SELECT 'core.stations invalid geom' AS check_name,
       COUNT(*) FILTER (WHERE geom IS NOT NULL AND NOT ST_IsValid(geom))::bigint AS issue_count
FROM core.stations
UNION ALL
SELECT 'core.reservoirs invalid geom',
       COUNT(*) FILTER (WHERE geom IS NOT NULL AND NOT ST_IsValid(geom))::bigint
FROM core.reservoirs
UNION ALL
SELECT 'core.catchments invalid geom',
       COUNT(*) FILTER (WHERE geom IS NOT NULL AND NOT ST_IsValid(geom))::bigint
FROM core.catchments;

-- Value quality checks
SELECT 'humidity out of [0,100]' AS check_name,
       COUNT(*)::bigint AS issue_count
FROM core.measurements m
JOIN core.timeseries t ON t.ts_id = m.ts_id
JOIN ref.observed_properties p ON p.property_id = t.property_id
WHERE p.standard_name = 'HUMIDITY_REL'
  AND (m.value < 0 OR m.value > 100)
UNION ALL
SELECT 'negative precipitation', COUNT(*)::bigint
FROM core.measurements m
JOIN core.timeseries t ON t.ts_id = m.ts_id
JOIN ref.observed_properties p ON p.property_id = t.property_id
WHERE p.standard_name = 'PRECIPITATION'
  AND m.value < 0
UNION ALL
SELECT 'negative streamflow', COUNT(*)::bigint
FROM core.measurements m
JOIN core.timeseries t ON t.ts_id = m.ts_id
JOIN ref.observed_properties p ON p.property_id = t.property_id
WHERE p.standard_name = 'STREAMFLOW'
  AND m.value < 0;

-- 03_reconciliation_checks.sql
-- Reconciliation source -> staging -> target.
-- Run on target DB for staging/target side.
-- For source side, execute the commented block on source DB and compare.
-- Param: :load_batch_id

-- Staging reconciliation per entity
SELECT 'stations' AS metric,
       (SELECT COUNT(*) FROM staging.raw_stations_abhgzr WHERE load_batch_id = :'load_batch_id') AS raw_count,
       (SELECT COUNT(*) FROM staging.norm_stations WHERE load_batch_id = :'load_batch_id') AS norm_count,
       (SELECT COUNT(*) FROM core.stations WHERE station_code IN (
          SELECT station_code FROM staging.norm_stations WHERE load_batch_id = :'load_batch_id'
       )) AS target_count
UNION ALL
SELECT 'reservoirs',
       (SELECT COUNT(*) FROM staging.raw_barrages_abhgzr WHERE load_batch_id = :'load_batch_id'),
       (SELECT COUNT(*) FROM staging.norm_reservoirs WHERE load_batch_id = :'load_batch_id'),
       (SELECT COUNT(*) FROM core.reservoirs WHERE reservoir_code IN (
          SELECT reservoir_code FROM staging.norm_reservoirs WHERE load_batch_id = :'load_batch_id'
       ))
UNION ALL
SELECT 'communes',
       (SELECT COUNT(*) FROM staging.raw_adm_communes_abhgzr WHERE load_batch_id = :'load_batch_id'),
       (SELECT COUNT(*) FROM staging.norm_communes WHERE load_batch_id = :'load_batch_id'),
       (SELECT COUNT(*) FROM ref.communes WHERE code_commune IN (
          SELECT commune_code FROM staging.norm_communes WHERE load_batch_id = :'load_batch_id'
       ))
UNION ALL
SELECT 'measurements',
       (
         (SELECT COUNT(*) FROM staging.raw_mesures_precipitations_jr WHERE load_batch_id = :'load_batch_id') +
         (SELECT COUNT(*) FROM staging.raw_mesures_debits_jr WHERE load_batch_id = :'load_batch_id') +
         (SELECT COUNT(*) * 3 FROM staging.raw_mesures_temperature_jr_pn WHERE load_batch_id = :'load_batch_id') +
         (SELECT COUNT(*) * 3 FROM staging.raw_mesures_temperature_m WHERE load_batch_id = :'load_batch_id') +
         (SELECT COUNT(*) FROM staging.raw_mesures_evaporation_m WHERE load_batch_id = :'load_batch_id') +
         (SELECT COUNT(*) FROM staging.raw_mesures_humidite_relative_m WHERE load_batch_id = :'load_batch_id') +
         (SELECT COUNT(*) FROM staging.raw_mesures_vitesse_vent_m WHERE load_batch_id = :'load_batch_id') +
         (SELECT COUNT(*) * 2 FROM staging.raw_mesures_lachers_barrages WHERE load_batch_id = :'load_batch_id')
       )::bigint AS raw_count,
       (SELECT COUNT(*) FROM staging.norm_measurements WHERE load_batch_id = :'load_batch_id') AS norm_count,
       (
         SELECT COUNT(*)
         FROM core.measurements m
         JOIN core.timeseries t ON t.ts_id = m.ts_id
         JOIN core.model_runs r ON r.run_id = t.run_id
         WHERE upper(r.scenario_code) = 'OBSERVED'
       ) AS target_count;

-- Potential duplicates in normalized measurements functional key
SELECT entity_type, entity_code, property_code, datetime_utc, time_step, COUNT(*) AS n
FROM staging.norm_measurements
WHERE load_batch_id = :'load_batch_id'
GROUP BY entity_type, entity_code, property_code, datetime_utc, time_step
HAVING COUNT(*) > 1
ORDER BY n DESC, entity_type, entity_code, property_code, datetime_utc;

-- Source-side queries to run on source DB for independent comparison:
-- SELECT 'stations_abhgzr', COUNT(*) FROM public.stations_abhgzr;
-- SELECT 'barrages_abhgzr', COUNT(*) FROM public.barrages_abhgzr;
-- SELECT 'adm_communes_abhgzr', COUNT(*) FROM public.adm_communes_abhgzr;
-- SELECT 'mesures_precipitations_jr', COUNT(*) FROM public.mesures_precipitations_jr;
-- SELECT 'mesures_debits_jr', COUNT(*) FROM public.mesures_debits_jr;
-- SELECT 'mesures_temperature_jr_pn', COUNT(*) FROM public.mesures_temperature_jr_pn;
-- SELECT 'mesures_temperature_m', COUNT(*) FROM public.mesures_temperature_m;
-- SELECT 'mesures_evaporation_m', COUNT(*) FROM public.mesures_evaporation_m;
-- SELECT 'mesures_humidite_relative_m', COUNT(*) FROM public.mesures_humidite_relative_m;
-- SELECT 'mesures_vitesse_vent_m', COUNT(*) FROM public.mesures_vitesse_vent_m;
-- SELECT 'mesures_lachers_barrages', COUNT(*) FROM public.mesures_lachers_barrages;


-- 02_normalize_staging.sql
-- Normalize raw staging data into typed normalized staging tables.
-- Non-destructive: INSERT only.
-- Param expected: :load_batch_id

-- Example in psql:
-- \set load_batch_id '20260420T1500Z_abhgzr'
-- \i 02_normalize_staging.sql

BEGIN;
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

-- Communes
INSERT INTO staging.norm_communes (
  commune_code, name_fr, name_ar, milieu,
  code_region, region_name_fr, code_province, province_name_fr,
  code_cercle, cercle_name_fr, cercle_name_ar, geom,
  source_table, source_pk, load_batch_id
)
SELECT
  trim(code_commune),
  commune_fr,
  commune_ar,
  lower(trim(milieu)),
  code_region,
  nom_region,
  code_province,
  nom_province,
  code_cercle,
  cercle_fr,
  cercle_ar,
  ST_Multi(
    CASE
      WHEN ST_SRID(g) = 0 THEN ST_Transform(ST_SetSRID(g, 26191), 4326)
      WHEN ST_SRID(g) <> 4326 THEN ST_Transform(g, 4326)
      ELSE g
    END
  )::geometry(MultiPolygon, 4326),
  source_table,
  source_pk,
  load_batch_id
FROM (
  SELECT r.*,
         ST_GeomFromEWKT(r.geom_ewkt)::geometry AS g
  FROM staging.raw_adm_communes_abhgzr r
  WHERE r.load_batch_id = :'load_batch_id'
) s
WHERE g IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM staging.norm_communes n
    WHERE n.load_batch_id = s.load_batch_id
      AND n.source_table = s.source_table
      AND n.source_pk = s.source_pk
  );

-- Catchment (single basin source)
INSERT INTO staging.norm_catchments (
  catchment_code, name, dam_name, geom,
  source_table, source_pk, load_batch_id
)
SELECT
  concat('BASIN_', id_bassin::text),
  nom_bassin,
  NULL::text,
  ST_Multi(
    CASE
      WHEN ST_SRID(g) = 0 THEN ST_Transform(ST_SetSRID(g, 26191), 4326)
      WHEN ST_SRID(g) <> 4326 THEN ST_Transform(g, 4326)
      ELSE g
    END
  )::geometry(MultiPolygon, 4326),
  source_table,
  source_pk,
  load_batch_id
FROM (
  SELECT r.*,
         ST_GeomFromEWKT(r.geom_ewkt)::geometry AS g
  FROM staging.raw_bassin_abhgzr r
  WHERE r.load_batch_id = :'load_batch_id'
) s
WHERE g IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM staging.norm_catchments n
    WHERE n.load_batch_id = s.load_batch_id
      AND n.source_table = s.source_table
      AND n.source_pk = s.source_pk
  );

-- Reservoirs
INSERT INTO staging.norm_reservoirs (
  reservoir_code, name, commune_code, type_barrage, geom,
  source_table, source_pk, load_batch_id
)
SELECT
  trim(ire_barrage),
  nom_barrage,
  trim(code_commune),
  type_barrage,
  CASE
    WHEN g IS NOT NULL THEN
      (
        CASE
          WHEN ST_SRID(g) = 0 THEN ST_Transform(ST_SetSRID(g, 26191), 4326)
          WHEN ST_SRID(g) <> 4326 THEN ST_Transform(g, 4326)
          ELSE g
        END
      )::geometry(Point, 4326)
    ELSE NULL::geometry(Point, 4326)
  END,
  source_table,
  source_pk,
  load_batch_id
FROM (
  SELECT r.*,
         CASE
           WHEN r.geom_ewkt IS NOT NULL THEN ST_GeomFromEWKT(r.geom_ewkt)::geometry
           ELSE NULL::geometry
         END AS g
  FROM staging.raw_barrages_abhgzr r
  WHERE r.load_batch_id = :'load_batch_id'
) s
WHERE NOT EXISTS (
  SELECT 1
  FROM staging.norm_reservoirs n
  WHERE n.load_batch_id = s.load_batch_id
    AND n.source_table = s.source_table
    AND n.source_pk = s.source_pk
);

-- Stations
INSERT INTO staging.norm_stations (
  station_code, station_name, type_station, station_type_code, commune_code,
  altitude_m, source_attrs, geom, source_table, source_pk, load_batch_id
)
SELECT
  trim(ire_station),
  COALESCE(NULLIF(nom_station_fr, ''), nom_station_ar, trim(ire_station)),
  type_station,
  upper(regexp_replace(COALESCE(type_station, 'UNKNOWN'), '[^A-Za-z0-9]+', '_', 'g')),
  trim(code_commune),
  coord_z,
  jsonb_build_object(
    'num_poste', num_poste,
    'oued', oued,
    'date_m_s', date_m_s,
    'etat_fonct', etat_fonct,
    'mode_fonct', mode_fonct,
    'mesures_station', mesures_station,
    'coord_x', coord_x,
    'coord_y', coord_y,
    'observation', observation
  ),
  CASE
    WHEN g IS NOT NULL THEN
      (
        CASE
          WHEN ST_SRID(g) = 0 THEN ST_Transform(ST_SetSRID(g, 26191), 4326)
          WHEN ST_SRID(g) <> 4326 THEN ST_Transform(g, 4326)
          ELSE g
        END
      )::geometry(Point, 4326)
    ELSE NULL::geometry(Point, 4326)
  END,
  source_table,
  source_pk,
  load_batch_id
FROM (
  SELECT r.*,
         CASE
           WHEN r.geom_ewkt IS NOT NULL THEN ST_GeomFromEWKT(r.geom_ewkt)::geometry
           ELSE NULL::geometry
         END AS g
  FROM staging.raw_stations_abhgzr r
  WHERE r.load_batch_id = :'load_batch_id'
) s
WHERE NOT EXISTS (
  SELECT 1
  FROM staging.norm_stations n
  WHERE n.load_batch_id = s.load_batch_id
    AND n.source_table = s.source_table
    AND n.source_pk = s.source_pk
);

-- Bathymetry normalize
INSERT INTO staging.norm_reservoir_bathymetry (
  reservoir_code, level_m, volume_hm3, area_km2, source,
  source_table, source_pk, load_batch_id
)
SELECT
  trim(ire_barrage),
  cote_mngm,
  volumr_mm3,     -- unit to be validated in business QA
  surface_km2,
  'ABHGZR_SOURCE',
  source_table,
  source_pk,
  load_batch_id
FROM staging.raw_bathymetries_barrages_abhgzr r
WHERE r.load_batch_id = :'load_batch_id'
  AND NOT EXISTS (
    SELECT 1
    FROM staging.norm_reservoir_bathymetry n
    WHERE n.load_batch_id = r.load_batch_id
      AND n.source_table = r.source_table
      AND n.source_pk = r.source_pk
  );

-- Measurements normalize helper expression inline:
-- NULLIF(replace(regexp_replace(value_txt, '[^0-9,.-]+', '', 'g'), ',', '.'), '')::numeric

INSERT INTO staging.norm_measurements (
  entity_type, entity_code, property_code, datetime_utc, time_step, value,
  source_table, source_pk, load_batch_id
)
SELECT * FROM (
  -- Daily precipitation
  SELECT 'station', trim(ire_station), 'PRECIPITATION',
         date_jr::timestamptz, 'daily', precipitation_jr::numeric,
         source_table, source_pk, load_batch_id
  FROM staging.raw_mesures_precipitations_jr
  WHERE load_batch_id = :'load_batch_id'

  UNION ALL
  -- Daily discharge
  SELECT 'station', trim(ire_station), 'STREAMFLOW',
         date_jr::timestamptz, 'daily', debit_jr::numeric,
         source_table, source_pk, load_batch_id
  FROM staging.raw_mesures_debits_jr
  WHERE load_batch_id = :'load_batch_id'

  UNION ALL
  -- Daily temperature max/min/mean
  SELECT 'station', trim(ire_station), 'TMAX',
         date_jr::timestamptz, 'daily', temp_jr_max::numeric,
         source_table, source_pk || ':max', load_batch_id
  FROM staging.raw_mesures_temperature_jr_pn
  WHERE load_batch_id = :'load_batch_id'

  UNION ALL
  SELECT 'station', trim(ire_station), 'TMIN',
         date_jr::timestamptz, 'daily', temp_jr_min::numeric,
         source_table, source_pk || ':min', load_batch_id
  FROM staging.raw_mesures_temperature_jr_pn
  WHERE load_batch_id = :'load_batch_id'

  UNION ALL
  SELECT 'station', trim(ire_station), 'TMEAN',
         date_jr::timestamptz, 'daily', temp_jr_moy::numeric,
         source_table, source_pk || ':mean', load_batch_id
  FROM staging.raw_mesures_temperature_jr_pn
  WHERE load_batch_id = :'load_batch_id'

  UNION ALL
  -- Monthly temperature fields (text -> numeric)
  SELECT 'station', trim(ire_station), 'TMIN',
         date_m::timestamptz, 'monthly',
         NULLIF(replace(regexp_replace(temperature_min, '[^0-9,.-]+', '', 'g'), ',', '.'), '')::numeric,
         source_table, source_pk || ':min', load_batch_id
  FROM staging.raw_mesures_temperature_m
  WHERE load_batch_id = :'load_batch_id'

  UNION ALL
  SELECT 'station', trim(ire_station), 'TMAX',
         date_m::timestamptz, 'monthly',
         NULLIF(replace(regexp_replace(temperature_max, '[^0-9,.-]+', '', 'g'), ',', '.'), '')::numeric,
         source_table, source_pk || ':max', load_batch_id
  FROM staging.raw_mesures_temperature_m
  WHERE load_batch_id = :'load_batch_id'

  UNION ALL
  SELECT 'station', trim(ire_station), 'TMEAN',
         date_m::timestamptz, 'monthly',
         NULLIF(replace(regexp_replace(temperature_moy, '[^0-9,.-]+', '', 'g'), ',', '.'), '')::numeric,
         source_table, source_pk || ':mean', load_batch_id
  FROM staging.raw_mesures_temperature_m
  WHERE load_batch_id = :'load_batch_id'

  UNION ALL
  -- Monthly humidity
  SELECT 'station', trim(ire_station), 'HUMIDITY_REL',
         date_m::timestamptz, 'monthly',
         NULLIF(replace(regexp_replace(humidite_relative_m, '[^0-9,.-]+', '', 'g'), ',', '.'), '')::numeric,
         source_table, source_pk, load_batch_id
  FROM staging.raw_mesures_humidite_relative_m
  WHERE load_batch_id = :'load_batch_id'

  UNION ALL
  -- Monthly evaporation
  SELECT 'station', trim(ire_station), 'EVAPORATION',
         date_m::timestamptz, 'monthly',
         NULLIF(replace(regexp_replace(evaporation_m, '[^0-9,.-]+', '', 'g'), ',', '.'), '')::numeric,
         source_table, source_pk, load_batch_id
  FROM staging.raw_mesures_evaporation_m
  WHERE load_batch_id = :'load_batch_id'

  UNION ALL
  -- Monthly wind
  SELECT 'station', trim(ire_station), 'WIND_SPEED',
         date_m::timestamptz, 'monthly',
         NULLIF(replace(regexp_replace(vitesse_moy_m, '[^0-9,.-]+', '', 'g'), ',', '.'), '')::numeric,
         source_table, source_pk, load_batch_id
  FROM staging.raw_mesures_vitesse_vent_m
  WHERE load_batch_id = :'load_batch_id'

  UNION ALL
  -- Daily reservoir inflow/restitution
  SELECT 'reservoir', trim(ire_barrage), 'INFLOW_M3',
         date_jr::timestamptz, 'daily',
         NULLIF(replace(regexp_replace(apports_m3, '[^0-9,.-]+', '', 'g'), ',', '.'), '')::numeric,
         source_table, source_pk || ':apports', load_batch_id
  FROM staging.raw_mesures_lachers_barrages
  WHERE load_batch_id = :'load_batch_id'

  UNION ALL
  SELECT 'reservoir', trim(ire_barrage), 'RESTITUTION_M3',
         date_jr::timestamptz, 'daily',
         NULLIF(replace(regexp_replace(restitution_m3, '[^0-9,.-]+', '', 'g'), ',', '.'), '')::numeric,
         source_table, source_pk || ':restitution', load_batch_id
  FROM staging.raw_mesures_lachers_barrages
  WHERE load_batch_id = :'load_batch_id'
) m(entity_type, entity_code, property_code, datetime_utc, time_step, value, source_table, source_pk, load_batch_id)
WHERE m.value IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM staging.norm_measurements n
    WHERE n.load_batch_id = m.load_batch_id
      AND n.source_table = m.source_table
      AND n.source_pk = m.source_pk
  );

COMMIT;

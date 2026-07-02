-- 01_create_staging_tables.sql
-- Non-destructive staging initialization on target DB (hydro_hd_1714).

BEGIN;

CREATE SCHEMA IF NOT EXISTS staging;

CREATE TABLE IF NOT EXISTS staging.migration_batches (
  load_batch_id text PRIMARY KEY,
  source_db text NOT NULL,
  target_db text NOT NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  mode text NOT NULL,
  status text NOT NULL DEFAULT 'running',
  note text
);

CREATE TABLE IF NOT EXISTS staging.migration_events (
  event_id bigserial PRIMARY KEY,
  load_batch_id text NOT NULL,
  event_time timestamptz NOT NULL DEFAULT now(),
  level text NOT NULL,
  step text NOT NULL,
  table_name text,
  message text,
  row_count bigint
);

-- Raw source tables with technical columns
CREATE TABLE IF NOT EXISTS staging.raw_adm_communes_abhgzr (
  id_com integer,
  code_region text,
  nom_region text,
  code_province text,
  nom_province text,
  code_cercle text,
  cercle_fr text,
  cercle_ar text,
  code_commune text,
  commune_fr text,
  commune_ar text,
  milieu text,
  geom_ewkt text,
  source_table text NOT NULL DEFAULT 'public.adm_communes_abhgzr',
  source_pk text,
  load_batch_id text NOT NULL,
  inserted_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS staging.raw_bassin_abhgzr (
  id_bassin integer,
  nom_bassin text,
  geom_ewkt text,
  source_table text NOT NULL DEFAULT 'public.bassin_abhgzr',
  source_pk text,
  load_batch_id text NOT NULL,
  inserted_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS staging.raw_barrages_abhgzr (
  id_brg integer,
  code_commune text,
  ire_barrage text,
  nom_barrage text,
  type_barrage text,
  coord_x double precision,
  coord_y double precision,
  geom_ewkt text,
  source_table text NOT NULL DEFAULT 'public.barrages_abhgzr',
  source_pk text,
  load_batch_id text NOT NULL,
  inserted_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS staging.raw_stations_abhgzr (
  id_station integer,
  code_commune text,
  ire_station text,
  num_poste integer,
  nom_station_fr text,
  nom_station_ar text,
  oued text,
  date_m_s text,
  etat_fonct text,
  mode_fonct text,
  type_station text,
  mesures_station text,
  coord_x double precision,
  coord_y double precision,
  coord_z double precision,
  observation text,
  geom_ewkt text,
  source_table text NOT NULL DEFAULT 'public.stations_abhgzr',
  source_pk text,
  load_batch_id text NOT NULL,
  inserted_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS staging.raw_mesures_precipitations_jr (
  id_precipitation integer,
  ire_station text,
  date_jr date,
  precipitation_jr double precision,
  source_table text NOT NULL DEFAULT 'public.mesures_precipitations_jr',
  source_pk text,
  load_batch_id text NOT NULL,
  inserted_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS staging.raw_mesures_debits_jr (
  id_debit integer,
  ire_station text,
  date_jr date,
  debit_jr double precision,
  source_table text NOT NULL DEFAULT 'public.mesures_debits_jr',
  source_pk text,
  load_batch_id text NOT NULL,
  inserted_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS staging.raw_mesures_temperature_jr_pn (
  id_temp integer,
  ire_station text,
  date_jr date,
  temp_jr_max double precision,
  temp_jr_min double precision,
  temp_jr_moy double precision,
  source_table text NOT NULL DEFAULT 'public.mesures_temperature_jr_pn',
  source_pk text,
  load_batch_id text NOT NULL,
  inserted_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS staging.raw_mesures_lachers_barrages (
  id_lachers integer,
  ire_barrage text,
  date_jr date,
  apports_m3 text,
  restitution_m3 text,
  source_table text NOT NULL DEFAULT 'public.mesures_lachers_barrages',
  source_pk text,
  load_batch_id text NOT NULL,
  inserted_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS staging.raw_mesures_temperature_m (
  id_temp_m integer,
  ire_station text,
  date_m date,
  temperature_min text,
  temperature_max text,
  temperature_moy text,
  source_table text NOT NULL DEFAULT 'public.mesures_temperature_m',
  source_pk text,
  load_batch_id text NOT NULL,
  inserted_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS staging.raw_mesures_evaporation_m (
  id_evapo_m integer,
  ire_station text,
  date_m date,
  evaporation_m text,
  source_table text NOT NULL DEFAULT 'public.mesures_evaporation_m',
  source_pk text,
  load_batch_id text NOT NULL,
  inserted_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS staging.raw_mesures_humidite_relative_m (
  id_hum_m integer,
  ire_station text,
  date_m date,
  humidite_relative_m text,
  source_table text NOT NULL DEFAULT 'public.mesures_humidite_relative_m',
  source_pk text,
  load_batch_id text NOT NULL,
  inserted_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS staging.raw_mesures_vitesse_vent_m (
  id_vent_m integer,
  ire_station text,
  date_m date,
  vitesse_moy_m text,
  source_table text NOT NULL DEFAULT 'public.mesures_vitesse_vent_m',
  source_pk text,
  load_batch_id text NOT NULL,
  inserted_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS staging.raw_bathymetries_barrages_abhgzr (
  id_cote integer,
  ire_barrage text,
  cote_mngm double precision,
  volumr_mm3 double precision,
  surface_km2 double precision,
  source_table text NOT NULL DEFAULT 'public.bathymetries_barrages_abhgzr',
  source_pk text,
  load_batch_id text NOT NULL,
  inserted_at timestamptz NOT NULL DEFAULT now()
);

-- Normalized staging tables
CREATE TABLE IF NOT EXISTS staging.norm_communes (
  commune_code text,
  name_fr text,
  name_ar text,
  milieu text,
  code_region text,
  region_name_fr text,
  code_province text,
  province_name_fr text,
  code_cercle text,
  cercle_name_fr text,
  cercle_name_ar text,
  geom geometry(MultiPolygon,4326),
  source_table text,
  source_pk text,
  load_batch_id text,
  inserted_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS staging.norm_catchments (
  catchment_code text,
  name text,
  dam_name text,
  geom geometry(MultiPolygon,4326),
  source_table text,
  source_pk text,
  load_batch_id text,
  inserted_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS staging.norm_reservoirs (
  reservoir_code text,
  name text,
  commune_code text,
  type_barrage text,
  geom geometry(Point,4326),
  source_table text,
  source_pk text,
  load_batch_id text,
  inserted_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS staging.norm_stations (
  station_code text,
  station_name text,
  type_station text,
  station_type_code text,
  commune_code text,
  altitude_m double precision,
  source_attrs jsonb,
  geom geometry(Point,4326),
  source_table text,
  source_pk text,
  load_batch_id text,
  inserted_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS staging.norm_measurements (
  entity_type text,          -- 'station' | 'reservoir'
  entity_code text,          -- station_code or reservoir_code
  property_code text,        -- precipitation, streamflow, tmax, tmin, ...
  datetime_utc timestamptz,
  time_step text,            -- day | month
  value numeric,
  source_table text,
  source_pk text,
  load_batch_id text,
  inserted_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS staging.norm_reservoir_bathymetry (
  reservoir_code text,
  level_m double precision,
  volume_hm3 double precision,
  area_km2 double precision,
  source text,
  source_table text,
  source_pk text,
  load_batch_id text,
  inserted_at timestamptz DEFAULT now()
);

COMMIT;


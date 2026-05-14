BEGIN;

CREATE SCHEMA IF NOT EXISTS staging;

CREATE TABLE IF NOT EXISTS core.data_batches (
  batch_id text PRIMARY KEY,
  source text NOT NULL,
  source_file text,
  imported_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'running',
  row_count integer NOT NULL DEFAULT 0,
  run_id integer REFERENCES core.model_runs(run_id),
  scenario_code text,
  notes text
);

CREATE TABLE IF NOT EXISTS core.measurement_batches (
  ts_id integer NOT NULL,
  datetime timestamptz NOT NULL,
  batch_id text NOT NULL REFERENCES core.data_batches(batch_id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (ts_id, datetime, batch_id),
  FOREIGN KEY (ts_id, datetime) REFERENCES core.measurements(ts_id, datetime) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS core.swat_entity_map (
  entity_type text NOT NULL CHECK (entity_type IN ('sub','rch')),
  swat_code integer NOT NULL,
  subbasin_id integer,
  reach_id integer,
  station_id integer REFERENCES core.stations(station_id),
  mapping_method text NOT NULL DEFAULT 'manual',
  confidence numeric(5,2) NOT NULL DEFAULT 1.00,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (entity_type, swat_code)
);

CREATE TABLE IF NOT EXISTS staging.swat_rch_raw (
  raw_id bigserial PRIMARY KEY,
  batch_id text NOT NULL,
  source_import_id bigint,
  scenario_code text,
  swat_rch integer,
  swat_sub integer,
  year integer,
  mon integer,
  yyyyddd integer,
  period_date date,
  flow_out double precision,
  sed_out double precision,
  source_file text,
  raw_record jsonb,
  inserted_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS staging.swat_sub_raw (
  raw_id bigserial PRIMARY KEY,
  batch_id text NOT NULL,
  source_import_id bigint,
  scenario_code text,
  swat_sub integer,
  year integer,
  mon integer,
  yyyyddd integer,
  period_date date,
  syldt_ha double precision,
  source_file text,
  raw_record jsonb,
  inserted_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS staging.swat_rch_norm (
  norm_id bigserial PRIMARY KEY,
  batch_id text NOT NULL,
  scenario_code text,
  run_id integer,
  reach_id integer,
  subbasin_id integer,
  station_code text,
  station_id integer,
  obs_date date,
  flow_m3s double precision,
  sed_tons double precision,
  mapping_method text,
  mapping_confidence numeric(5,2),
  inserted_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS staging.swat_sub_norm (
  norm_id bigserial PRIMARY KEY,
  batch_id text NOT NULL,
  scenario_code text,
  run_id integer,
  subbasin_id integer,
  station_code text,
  station_id integer,
  obs_date date,
  syldt_ha double precision,
  mapping_method text,
  mapping_confidence numeric(5,2),
  inserted_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_swat_rch_raw_batch ON staging.swat_rch_raw(batch_id);
CREATE INDEX IF NOT EXISTS idx_swat_sub_raw_batch ON staging.swat_sub_raw(batch_id);
CREATE INDEX IF NOT EXISTS idx_swat_rch_norm_batch ON staging.swat_rch_norm(batch_id);
CREATE INDEX IF NOT EXISTS idx_swat_sub_norm_batch ON staging.swat_sub_norm(batch_id);
CREATE INDEX IF NOT EXISTS idx_swat_entity_map_lookup ON core.swat_entity_map(entity_type, swat_code) WHERE is_active;
CREATE INDEX IF NOT EXISTS idx_measurement_batches_batch ON core.measurement_batches(batch_id);

COMMIT;

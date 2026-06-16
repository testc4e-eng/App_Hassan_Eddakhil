-- Sequences
CREATE SEQUENCE IF NOT EXISTS "access"."import_runs_import_id_seq"
    AS bigint
    INCREMENT BY 1
    MINVALUE 1
    MAXVALUE 9223372036854775807
    START WITH 1
    CACHE 1
    NO CYCLE;

CREATE SEQUENCE IF NOT EXISTS "audit"."qc_issues_qc_issue_id_seq"
    AS bigint
    INCREMENT BY 1
    MINVALUE 1
    MAXVALUE 9223372036854775807
    START WITH 1
    CACHE 1
    NO CYCLE;

CREATE SEQUENCE IF NOT EXISTS "audit"."qc_runs_qc_run_id_seq"
    AS bigint
    INCREMENT BY 1
    MINVALUE 1
    MAXVALUE 9223372036854775807
    START WITH 1
    CACHE 1
    NO CYCLE;

CREATE SEQUENCE IF NOT EXISTS "auth"."audit_log_audit_id_seq"
    AS bigint
    INCREMENT BY 1
    MINVALUE 1
    MAXVALUE 9223372036854775807
    START WITH 1
    CACHE 1
    NO CYCLE;

CREATE SEQUENCE IF NOT EXISTS "auth"."permissions_permission_id_seq"
    AS bigint
    INCREMENT BY 1
    MINVALUE 1
    MAXVALUE 9223372036854775807
    START WITH 1
    CACHE 1
    NO CYCLE;

CREATE SEQUENCE IF NOT EXISTS "auth"."roles_role_id_seq"
    AS bigint
    INCREMENT BY 1
    MINVALUE 1
    MAXVALUE 9223372036854775807
    START WITH 1
    CACHE 1
    NO CYCLE;

CREATE SEQUENCE IF NOT EXISTS "auth"."users_user_id_seq"
    AS bigint
    INCREMENT BY 1
    MINVALUE 1
    MAXVALUE 9223372036854775807
    START WITH 1
    CACHE 1
    NO CYCLE;

CREATE SEQUENCE IF NOT EXISTS "core"."catchments_catchment_id_seq"
    AS integer
    INCREMENT BY 1
    MINVALUE 1
    MAXVALUE 2147483647
    START WITH 1
    CACHE 1
    NO CYCLE;

CREATE SEQUENCE IF NOT EXISTS "core"."catchments_catchment_id_seq1"
    AS integer
    INCREMENT BY 1
    MINVALUE 1
    MAXVALUE 2147483647
    START WITH 1
    CACHE 1
    NO CYCLE;

CREATE SEQUENCE IF NOT EXISTS "core"."model_runs_run_id_seq"
    AS integer
    INCREMENT BY 1
    MINVALUE 1
    MAXVALUE 2147483647
    START WITH 1
    CACHE 1
    NO CYCLE;

CREATE SEQUENCE IF NOT EXISTS "core"."model_runs_run_id_seq1"
    AS integer
    INCREMENT BY 1
    MINVALUE 1
    MAXVALUE 2147483647
    START WITH 1
    CACHE 1
    NO CYCLE;

CREATE SEQUENCE IF NOT EXISTS "core"."reaches_reach_id_seq"
    AS integer
    INCREMENT BY 1
    MINVALUE 1
    MAXVALUE 2147483647
    START WITH 1
    CACHE 1
    NO CYCLE;

CREATE SEQUENCE IF NOT EXISTS "core"."reaches_reach_id_seq1"
    AS integer
    INCREMENT BY 1
    MINVALUE 1
    MAXVALUE 2147483647
    START WITH 1
    CACHE 1
    NO CYCLE;

CREATE SEQUENCE IF NOT EXISTS "core"."reservoir_bathymetry_bathy_id_seq"
    AS integer
    INCREMENT BY 1
    MINVALUE 1
    MAXVALUE 2147483647
    START WITH 1
    CACHE 1
    NO CYCLE;

CREATE SEQUENCE IF NOT EXISTS "core"."reservoirs_reservoir_id_seq"
    AS integer
    INCREMENT BY 1
    MINVALUE 1
    MAXVALUE 2147483647
    START WITH 1
    CACHE 1
    NO CYCLE;

CREATE SEQUENCE IF NOT EXISTS "core"."reservoirs_reservoir_id_seq1"
    AS integer
    INCREMENT BY 1
    MINVALUE 1
    MAXVALUE 2147483647
    START WITH 1
    CACHE 1
    NO CYCLE;

CREATE SEQUENCE IF NOT EXISTS "core"."rivers_river_id_seq"
    AS integer
    INCREMENT BY 1
    MINVALUE 1
    MAXVALUE 2147483647
    START WITH 1
    CACHE 1
    NO CYCLE;

CREATE SEQUENCE IF NOT EXISTS "core"."rivers_river_id_seq1"
    AS integer
    INCREMENT BY 1
    MINVALUE 1
    MAXVALUE 2147483647
    START WITH 1
    CACHE 1
    NO CYCLE;

CREATE SEQUENCE IF NOT EXISTS "core"."station_reach_map_id_seq"
    AS bigint
    INCREMENT BY 1
    MINVALUE 1
    MAXVALUE 9223372036854775807
    START WITH 1
    CACHE 1
    NO CYCLE;

CREATE SEQUENCE IF NOT EXISTS "core"."stations_station_id_seq"
    AS integer
    INCREMENT BY 1
    MINVALUE 1
    MAXVALUE 2147483647
    START WITH 1
    CACHE 1
    NO CYCLE;

CREATE SEQUENCE IF NOT EXISTS "core"."stations_station_id_seq1"
    AS integer
    INCREMENT BY 1
    MINVALUE 1
    MAXVALUE 2147483647
    START WITH 1
    CACHE 1
    NO CYCLE;

CREATE SEQUENCE IF NOT EXISTS "core"."subbasins_subbasin_id_seq"
    AS integer
    INCREMENT BY 1
    MINVALUE 1
    MAXVALUE 2147483647
    START WITH 1
    CACHE 1
    NO CYCLE;

CREATE SEQUENCE IF NOT EXISTS "core"."subbasins_subbasin_id_seq1"
    AS integer
    INCREMENT BY 1
    MINVALUE 1
    MAXVALUE 2147483647
    START WITH 1
    CACHE 1
    NO CYCLE;

CREATE SEQUENCE IF NOT EXISTS "core"."timeseries_ts_id_seq"
    AS integer
    INCREMENT BY 1
    MINVALUE 1
    MAXVALUE 2147483647
    START WITH 1
    CACHE 1
    NO CYCLE;

CREATE SEQUENCE IF NOT EXISTS "core"."timeseries_ts_id_seq1"
    AS integer
    INCREMENT BY 1
    MINVALUE 1
    MAXVALUE 2147483647
    START WITH 1
    CACHE 1
    NO CYCLE;

CREATE SEQUENCE IF NOT EXISTS "geo"."landcover_lc_id_seq"
    AS integer
    INCREMENT BY 1
    MINVALUE 1
    MAXVALUE 2147483647
    START WITH 1
    CACHE 1
    NO CYCLE;

CREATE SEQUENCE IF NOT EXISTS "geo"."landcover_lc_id_seq1"
    AS integer
    INCREMENT BY 1
    MINVALUE 1
    MAXVALUE 2147483647
    START WITH 1
    CACHE 1
    NO CYCLE;

CREATE SEQUENCE IF NOT EXISTS "ref"."landcover_classes_class_id_seq"
    AS integer
    INCREMENT BY 1
    MINVALUE 1
    MAXVALUE 2147483647
    START WITH 1
    CACHE 1
    NO CYCLE;

CREATE SEQUENCE IF NOT EXISTS "ref"."landcover_classes_class_id_seq1"
    AS integer
    INCREMENT BY 1
    MINVALUE 1
    MAXVALUE 2147483647
    START WITH 1
    CACHE 1
    NO CYCLE;

CREATE SEQUENCE IF NOT EXISTS "ref"."landcover_periods_lc_period_id_seq"
    AS integer
    INCREMENT BY 1
    MINVALUE 1
    MAXVALUE 2147483647
    START WITH 1
    CACHE 1
    NO CYCLE;

CREATE SEQUENCE IF NOT EXISTS "ref"."landcover_periods_lc_period_id_seq1"
    AS integer
    INCREMENT BY 1
    MINVALUE 1
    MAXVALUE 2147483647
    START WITH 1
    CACHE 1
    NO CYCLE;

CREATE SEQUENCE IF NOT EXISTS "ref"."observed_properties_property_id_seq"
    AS integer
    INCREMENT BY 1
    MINVALUE 1
    MAXVALUE 2147483647
    START WITH 1
    CACHE 1
    NO CYCLE;

CREATE SEQUENCE IF NOT EXISTS "ref"."observed_properties_property_id_seq1"
    AS integer
    INCREMENT BY 1
    MINVALUE 1
    MAXVALUE 2147483647
    START WITH 1
    CACHE 1
    NO CYCLE;

CREATE SEQUENCE IF NOT EXISTS "staging"."limite_raw_gid_seq"
    AS integer
    INCREMENT BY 1
    MINVALUE 1
    MAXVALUE 2147483647
    START WITH 1
    CACHE 1
    NO CYCLE;

CREATE SEQUENCE IF NOT EXISTS "staging"."migration_events_event_id_seq"
    AS bigint
    INCREMENT BY 1
    MINVALUE 1
    MAXVALUE 9223372036854775807
    START WITH 1
    CACHE 1
    NO CYCLE;

CREATE SEQUENCE IF NOT EXISTS "staging"."reseau_hydro_import_raw_gid_seq"
    AS integer
    INCREMENT BY 1
    MINVALUE 1
    MAXVALUE 2147483647
    START WITH 1
    CACHE 1
    NO CYCLE;

CREATE SEQUENCE IF NOT EXISTS "staging"."reseau_hydrologie_raw_gid_seq"
    AS integer
    INCREMENT BY 1
    MINVALUE 1
    MAXVALUE 2147483647
    START WITH 1
    CACHE 1
    NO CYCLE;

CREATE SEQUENCE IF NOT EXISTS "staging"."station_meteo_raw_gid_seq"
    AS integer
    INCREMENT BY 1
    MINVALUE 1
    MAXVALUE 2147483647
    START WITH 1
    CACHE 1
    NO CYCLE;

CREATE SEQUENCE IF NOT EXISTS "staging"."swat_rch_norm_norm_id_seq"
    AS bigint
    INCREMENT BY 1
    MINVALUE 1
    MAXVALUE 9223372036854775807
    START WITH 1
    CACHE 1
    NO CYCLE;

CREATE SEQUENCE IF NOT EXISTS "staging"."swat_rch_raw_raw_id_seq"
    AS bigint
    INCREMENT BY 1
    MINVALUE 1
    MAXVALUE 9223372036854775807
    START WITH 1
    CACHE 1
    NO CYCLE;

CREATE SEQUENCE IF NOT EXISTS "staging"."swat_sub_norm_norm_id_seq"
    AS bigint
    INCREMENT BY 1
    MINVALUE 1
    MAXVALUE 9223372036854775807
    START WITH 1
    CACHE 1
    NO CYCLE;

CREATE SEQUENCE IF NOT EXISTS "staging"."swat_sub_raw_raw_id_seq"
    AS bigint
    INCREMENT BY 1
    MINVALUE 1
    MAXVALUE 9223372036854775807
    START WITH 1
    CACHE 1
    NO CYCLE;

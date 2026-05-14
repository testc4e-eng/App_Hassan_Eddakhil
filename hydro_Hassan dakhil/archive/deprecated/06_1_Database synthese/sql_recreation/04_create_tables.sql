-- Tables and foreign tables
CREATE TABLE IF NOT EXISTS "access"."import_runs" (
    "import_id" bigint DEFAULT nextval('access.import_runs_import_id_seq'::regclass) NOT NULL,
    "source_path" text NOT NULL,
    "source_checksum" text,
    "scenario_code" text DEFAULT 'SWAT_OUTPUT'::text NOT NULL,
    "source_format" text DEFAULT 'mdb'::text NOT NULL,
    "started_at" timestamp with time zone DEFAULT now() NOT NULL,
    "finished_at" timestamp with time zone,
    "status" text DEFAULT 'ready'::text NOT NULL,
    "total_rows" integer DEFAULT 0 NOT NULL,
    "notes" text
);

CREATE TABLE IF NOT EXISTS "access"."rch_results" (
    "import_id" bigint NOT NULL,
    "scenario_code" text DEFAULT 'SWAT_OUTPUT'::text NOT NULL,
    "sub_code" integer NOT NULL,
    "period_date" date NOT NULL,
    "year" integer NOT NULL,
    "mon" integer NOT NULL,
    "area_km2" double precision,
    "flow_in_cms" double precision,
    "flow_out_cms" double precision,
    "evap_cms" double precision,
    "tloss_cms" double precision,
    "sed_in_tons" double precision,
    "sed_out_tons" double precision,
    "sedconc_mg_kg" double precision,
    "orgn_in_kg" double precision,
    "orgn_out_kg" double precision,
    "orgp_in_kg" double precision,
    "orgp_out_kg" double precision,
    "no3_in_kg" double precision,
    "no3_out_kg" double precision,
    "nh4_in_kg" double precision,
    "nh4_out_kg" double precision,
    "no2_in_kg" double precision,
    "no2_out_kg" double precision,
    "minp_in_kg" double precision,
    "minp_out_kg" double precision,
    "chla_in_kg" double precision,
    "chla_out_kg" double precision,
    "cbod_in_kg" double precision,
    "cbod_out_kg" double precision,
    "disox_in_kg" double precision,
    "disox_out_kg" double precision,
    "solpst_in_mg" double precision,
    "solpst_out_mg" double precision,
    "sorpst_in_mg" double precision,
    "sorpst_out_mg" double precision,
    "reactpt_mg" double precision,
    "volpst_mg" double precision,
    "settlpst_mg" double precision,
    "resusppst_mg" double precision,
    "difusepst_mg" double precision,
    "reachbedpst_mg" double precision,
    "burypst_mg" double precision,
    "bed_pst_mg" double precision,
    "bactp_out_ct" double precision,
    "bactlp_out_ct" double precision,
    "cmetal1_kg" double precision,
    "cmetal2_kg" double precision,
    "cmetal3_kg" double precision,
    "tot_n_kg" double precision,
    "tot_p_kg" double precision,
    "no3conc_mg_l" double precision,
    "wtmp_deg_c" double precision,
    "yyyyddd" integer,
    "source_row_num" integer,
    "source_file" text
);

CREATE TABLE IF NOT EXISTS "access"."sub_results" (
    "import_id" bigint NOT NULL,
    "scenario_code" text DEFAULT 'SWAT_OUTPUT'::text NOT NULL,
    "sub_code" integer NOT NULL,
    "period_date" date NOT NULL,
    "year" integer NOT NULL,
    "mon" integer NOT NULL,
    "area_km2" double precision,
    "precip_mm" double precision,
    "snowmelt_mm" double precision,
    "pet_mm" double precision,
    "et_mm" double precision,
    "sw_mm" double precision,
    "perc_mm" double precision,
    "surq_mm" double precision,
    "gw_q_mm" double precision,
    "wyld_mm" double precision,
    "syld_t_ha" double precision,
    "orgn_kg_ha" double precision,
    "orgp_hg_ha" double precision,
    "nsurq_kg_ha" double precision,
    "solp_kg_ha" double precision,
    "sedp_kg_ha" double precision,
    "lat_q_mm" double precision,
    "lat_q_no3_kg_ha" double precision,
    "gwno3_kg_ha" double precision,
    "chola_mic_l" double precision,
    "cbodu_mg_l" double precision,
    "doxq_mg_l" double precision,
    "tno3_kg_ha" double precision,
    "yyyyddd" integer,
    "source_row_num" integer,
    "source_file" text
);

CREATE TABLE IF NOT EXISTS "access"."variable_dictionary" (
    "source_table" text NOT NULL,
    "variable_code" text NOT NULL,
    "variable_label" text NOT NULL,
    "definition" text,
    "unit" text,
    "entity_type" text NOT NULL,
    "module_code" text NOT NULL,
    "display_order" integer DEFAULT 0 NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL
);

CREATE TABLE IF NOT EXISTS "audit"."qc_issues" (
    "qc_issue_id" bigint DEFAULT nextval('audit.qc_issues_qc_issue_id_seq'::regclass) NOT NULL,
    "qc_run_id" bigint,
    "severity" text NOT NULL,
    "object_type" text NOT NULL,
    "object_name" text NOT NULL,
    "issue_code" text NOT NULL,
    "issue_detail" jsonb DEFAULT '{}'::jsonb NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "audit"."qc_runs" (
    "qc_run_id" bigint DEFAULT nextval('audit.qc_runs_qc_run_id_seq'::regclass) NOT NULL,
    "run_at" timestamp with time zone DEFAULT now() NOT NULL,
    "run_by" text,
    "notes" text
);

CREATE TABLE IF NOT EXISTS "auth"."audit_log" (
    "audit_id" bigint DEFAULT nextval('auth.audit_log_audit_id_seq'::regclass) NOT NULL,
    "at" timestamp with time zone DEFAULT now() NOT NULL,
    "user_id" bigint,
    "action" text NOT NULL,
    "object_type" text,
    "object_name" text,
    "payload" jsonb DEFAULT '{}'::jsonb NOT NULL
);

CREATE TABLE IF NOT EXISTS "auth"."permissions" (
    "permission_id" bigint DEFAULT nextval('auth.permissions_permission_id_seq'::regclass) NOT NULL,
    "perm_code" text NOT NULL,
    "description" text
);

CREATE TABLE IF NOT EXISTS "auth"."role_permissions" (
    "role_id" bigint NOT NULL,
    "permission_id" bigint NOT NULL
);

CREATE TABLE IF NOT EXISTS "auth"."roles" (
    "role_id" bigint DEFAULT nextval('auth.roles_role_id_seq'::regclass) NOT NULL,
    "role_name" text NOT NULL,
    "description" text
);

CREATE TABLE IF NOT EXISTS "auth"."user_roles" (
    "user_id" bigint NOT NULL,
    "role_id" bigint NOT NULL
);

CREATE TABLE IF NOT EXISTS "auth"."users" (
    "user_id" bigint DEFAULT nextval('auth.users_user_id_seq'::regclass) NOT NULL,
    "username" text NOT NULL,
    "email" text,
    "full_name" text,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "core"."catchments" (
    "catchment_id" integer GENERATED BY DEFAULT AS IDENTITY NOT NULL,
    "name" text NOT NULL,
    "dam_name" text,
    "area_m2" double precision,
    "geom" geometry(MultiPolygon,4326)
);

CREATE TABLE IF NOT EXISTS "core"."data_batches" (
    "batch_id" text NOT NULL,
    "source" text NOT NULL,
    "source_file" text,
    "imported_at" timestamp with time zone DEFAULT now() NOT NULL,
    "status" text DEFAULT 'running'::text NOT NULL,
    "row_count" integer DEFAULT 0 NOT NULL,
    "run_id" integer,
    "scenario_code" text,
    "notes" text
);

CREATE TABLE IF NOT EXISTS "core"."measurement_batches" (
    "ts_id" integer NOT NULL,
    "datetime" timestamp with time zone NOT NULL,
    "batch_id" text NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "core"."measurements" (
    "ts_id" integer NOT NULL,
    "datetime" timestamp with time zone NOT NULL,
    "value" double precision,
    "quality_flag" smallint
);

CREATE TABLE IF NOT EXISTS "core"."model_runs" (
    "run_id" integer GENERATED BY DEFAULT AS IDENTITY NOT NULL,
    "scenario_code" text NOT NULL,
    "scenario_name" text NOT NULL,
    "description" text,
    "is_observed" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "core"."reaches" (
    "reach_id" integer GENERATED BY DEFAULT AS IDENTITY NOT NULL,
    "reach_code" integer,
    "subbasin_id" integer NOT NULL,
    "catchment_id" integer NOT NULL,
    "length_m" double precision,
    "slope_pct" double precision,
    "width_m" double precision,
    "depth_m" double precision,
    "min_elev_m" double precision,
    "max_elev_m" double precision,
    "qm_annual_mean_m3s" double precision,
    "sedout_annual_mean_t_yr" double precision,
    "geom" geometry(MultiLineString,4326),
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "river_id" integer
);

CREATE TABLE IF NOT EXISTS "core"."reservoir_bathymetry" (
    "bathy_id" integer DEFAULT nextval('core.reservoir_bathymetry_bathy_id_seq'::regclass) NOT NULL,
    "reservoir_id" integer NOT NULL,
    "level_m" numeric NOT NULL,
    "volume_hm3" numeric,
    "area_km2" numeric,
    "source" text,
    "created_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "core"."reservoirs" (
    "reservoir_id" integer GENERATED BY DEFAULT AS IDENTITY NOT NULL,
    "name" text NOT NULL,
    "geom" geometry(Point,4326),
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "catchment_id" integer,
    "reach_id" integer,
    "reservoir_code" text,
    "commune_code" text
);

CREATE TABLE IF NOT EXISTS "core"."rivers" (
    "river_id" integer GENERATED BY DEFAULT AS IDENTITY NOT NULL,
    "river_code" text,
    "name_fr" text,
    "name_en" text,
    "basin_name" text,
    "remarks" text
);

CREATE TABLE IF NOT EXISTS "core"."station_reach_map" (
    "id" bigint DEFAULT nextval('core.station_reach_map_id_seq'::regclass) NOT NULL,
    "station_id" integer NOT NULL,
    "reach_id" integer NOT NULL,
    "station_code" text,
    "reach_code" text,
    "mapping_method" text NOT NULL,
    "distance_m" double precision,
    "confidence_score" numeric(5,4),
    "is_primary" boolean DEFAULT true NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "simulated_station_id" integer,
    "notes" text,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "core"."stations" (
    "station_id" integer GENERATED BY DEFAULT AS IDENTITY NOT NULL,
    "station_code" text NOT NULL,
    "name" text NOT NULL,
    "type_station" text,
    "station_type_code" text,
    "commune_code" text,
    "geom" geometry(Point,4326),
    "altitude_m" numeric,
    "start_date" date,
    "end_date" date,
    "catchment_id" integer,
    "reach_id" integer
);

CREATE TABLE IF NOT EXISTS "core"."subbasin_metrics_annual" (
    "subbasin_id" bigint NOT NULL,
    "property_id" bigint NOT NULL,
    "run_id" bigint NOT NULL,
    "year" integer NOT NULL,
    "value" double precision NOT NULL,
    "quality_flag" text,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "core"."subbasins" (
    "subbasin_id" integer GENERATED BY DEFAULT AS IDENTITY NOT NULL,
    "catchment_id" integer NOT NULL,
    "subbasin_code" integer NOT NULL,
    "name" text,
    "area_m2" double precision,
    "spec_deg_base_t_ha_yr" double precision,
    "spec_deg_slope1_t_ha_yr" double precision,
    "spec_deg_slope2_t_ha_yr" double precision,
    "spec_deg_slope3_t_ha_yr" double precision,
    "spec_deg_buffer_t_ha_yr" double precision,
    "sediment_yield_tot_t_ha" double precision,
    "geom" geometry(MultiPolygon,4326),
    "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "core"."swat_entity_map" (
    "entity_type" text NOT NULL,
    "swat_code" integer NOT NULL,
    "subbasin_id" integer,
    "reach_id" integer,
    "station_id" integer,
    "mapping_method" text DEFAULT 'manual'::text NOT NULL,
    "confidence" numeric(5,2) DEFAULT 1.00 NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "core"."timeseries" (
    "ts_id" integer GENERATED BY DEFAULT AS IDENTITY NOT NULL,
    "station_id" integer,
    "property_id" integer,
    "run_id" integer,
    "source_type" text NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "time_step" time_step DEFAULT 'daily'::time_step NOT NULL
);

CREATE TABLE IF NOT EXISTS "geo"."landcover" (
    "lc_id" integer GENERATED BY DEFAULT AS IDENTITY NOT NULL,
    "lc_period_id" integer NOT NULL,
    "class_id" integer NOT NULL,
    "geom" geometry(Polygon,4326)
);

CREATE TABLE IF NOT EXISTS "gis"."meteo_stations" (
    "station_id" integer NOT NULL,
    "station_code" text,
    "name" text NOT NULL,
    "type_station" text,
    "station_type_code" text,
    "catchment_id" integer,
    "source_attrs" jsonb DEFAULT '{}'::jsonb NOT NULL,
    "geom" geometry(Point,4326) NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "gis"."reach_shapes" (
    "reach_id" integer NOT NULL,
    "reach_code" integer,
    "subbasin_id" integer,
    "catchment_id" integer NOT NULL,
    "length_m" double precision,
    "slope_pct" double precision,
    "source_attrs" jsonb DEFAULT '{}'::jsonb NOT NULL,
    "geom" geometry(MultiLineString,4326) NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "gis"."reach_shapes_backup_20260422_144537" (
    "reach_id" integer,
    "reach_code" integer,
    "subbasin_id" integer,
    "catchment_id" integer,
    "length_m" double precision,
    "slope_pct" double precision,
    "source_attrs" jsonb,
    "geom" geometry(MultiLineString,4326),
    "created_at" timestamp with time zone
);

CREATE TABLE IF NOT EXISTS "gis"."subbasin_shapes" (
    "subbasin_id" integer NOT NULL,
    "catchment_id" integer NOT NULL,
    "subbasin_code" integer,
    "name" text NOT NULL,
    "area_m2" double precision,
    "source_attrs" jsonb DEFAULT '{}'::jsonb NOT NULL,
    "geom" geometry(MultiPolygon,4326) NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE FOREIGN TABLE "old_hd"."adm_communes_abhgzr" (
    "id_com" integer NOT NULL,
    "code_region" character varying(3),
    "nom_region" character varying(60),
    "code_province" character varying(5),
    "nom_province" character varying(50),
    "code_cercle" character varying(15),
    "cercle_fr" character varying(50),
    "cercle_ar" character varying(50),
    "code_commune" character varying(9) NOT NULL,
    "commune_fr" character varying(50),
    "commune_ar" character varying(50),
    "milieu" character varying(20),
    "geom" geometry(MultiPolygon,4326)
) SERVER "old_hd_srv" OPTIONS (schema_name 'public', table_name 'adm_communes_abhgzr');

CREATE FOREIGN TABLE "old_hd"."barrages_abhgzr" (
    "id_brg" integer NOT NULL,
    "code_commune" text,
    "ire_barrage" text NOT NULL,
    "nom_barrage" text,
    "type_barrage" text,
    "coord_x" double precision,
    "coord_y" double precision,
    "geom" geometry(Point,4326)
) SERVER "old_hd_srv" OPTIONS (schema_name 'public', table_name 'barrages_abhgzr');

CREATE FOREIGN TABLE "old_hd"."bassin_abhgzr" (
    "id_bassin" integer,
    "nom_bassin" text,
    "geom" geometry(MultiPolygon,4326)
) SERVER "old_hd_srv" OPTIONS (schema_name 'public', table_name 'bassin_abhgzr');

CREATE FOREIGN TABLE "old_hd"."bathymetries_barrages_abhgzr" (
    "id_cote" integer NOT NULL,
    "ire_barrage" text,
    "cote_mngm" double precision,
    "volumr_mm3" double precision,
    "surface_km2" double precision
) SERVER "old_hd_srv" OPTIONS (schema_name 'public', table_name 'bathymetries_barrages_abhgzr');

CREATE FOREIGN TABLE "old_hd"."mesures_debits_jr" (
    "id_debit" integer NOT NULL,
    "ire_station" text,
    "date_jr" date,
    "debit_jr" double precision
) SERVER "old_hd_srv" OPTIONS (schema_name 'public', table_name 'mesures_debits_jr');

CREATE FOREIGN TABLE "old_hd"."mesures_evaporation_m" (
    "id_evapo_m" integer NOT NULL,
    "ire_station" text,
    "date_m" date,
    "evaporation_m" text
) SERVER "old_hd_srv" OPTIONS (schema_name 'public', table_name 'mesures_evaporation_m');

CREATE FOREIGN TABLE "old_hd"."mesures_humidite_relative_m" (
    "id_hum_m" integer NOT NULL,
    "ire_station" text,
    "date_m" date,
    "humidite_relative_m" text
) SERVER "old_hd_srv" OPTIONS (schema_name 'public', table_name 'mesures_humidite_relative_m');

CREATE FOREIGN TABLE "old_hd"."mesures_lachers_barrages" (
    "id_lachers" integer NOT NULL,
    "ire_barrage" text,
    "date_jr" date,
    "apports_m3" text,
    "restitution_m3" text
) SERVER "old_hd_srv" OPTIONS (schema_name 'public', table_name 'mesures_lachers_barrages');

CREATE FOREIGN TABLE "old_hd"."mesures_precipitations_jr" (
    "id_precipitation" integer NOT NULL,
    "ire_station" text,
    "date_jr" date,
    "precipitation_jr" double precision
) SERVER "old_hd_srv" OPTIONS (schema_name 'public', table_name 'mesures_precipitations_jr');

CREATE FOREIGN TABLE "old_hd"."mesures_temperature_jr_pn" (
    "id_temp" integer NOT NULL,
    "ire_station" text,
    "date_jr" date,
    "temp_jr_max" double precision,
    "temp_jr_min" double precision,
    "temp_jr_moy" double precision
) SERVER "old_hd_srv" OPTIONS (schema_name 'public', table_name 'mesures_temperature_jr_pn');

CREATE FOREIGN TABLE "old_hd"."mesures_temperature_m" (
    "id_temp_m" integer NOT NULL,
    "ire_station" text,
    "date_m" date,
    "temperature_min" text,
    "temperature_max" text,
    "temperature_moy" text
) SERVER "old_hd_srv" OPTIONS (schema_name 'public', table_name 'mesures_temperature_m');

CREATE FOREIGN TABLE "old_hd"."mesures_vitesse_vent_m" (
    "id_vent_m" integer NOT NULL,
    "ire_station" text,
    "date_m" date,
    "vitesse_moy_m" text
) SERVER "old_hd_srv" OPTIONS (schema_name 'public', table_name 'mesures_vitesse_vent_m');

CREATE FOREIGN TABLE "old_hd"."stations_abhgzr" (
    "id_station" integer NOT NULL,
    "code_commune" text,
    "ire_station" text NOT NULL,
    "num_poste" integer,
    "nom_station_fr" text,
    "nom_station_ar" text,
    "oued" text,
    "date_m_s" text,
    "etat_fonct" text,
    "mode_fonct" text,
    "type_station" text,
    "mesures_station" text,
    "coord_x" double precision,
    "coord_y" double precision,
    "coord_z" double precision,
    "observation" text,
    "geom" geometry(Point,4326)
) SERVER "old_hd_srv" OPTIONS (schema_name 'public', table_name 'stations_abhgzr');

CREATE TABLE IF NOT EXISTS "public"."module_properties" (
    "module_code" text NOT NULL,
    "property_id" integer NOT NULL,
    "is_enabled" boolean DEFAULT true NOT NULL,
    "sort_order" integer DEFAULT 100 NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "public"."property_module_override" (
    "property_id" integer NOT NULL,
    "module" text NOT NULL,
    "submodule" text
);

CREATE TABLE IF NOT EXISTS "public"."users" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL,
    "full_name" character varying(150) NOT NULL,
    "email" character varying(150) NOT NULL,
    "password_hash" text NOT NULL,
    "role" character varying(20) NOT NULL,
    "status" character varying(20) DEFAULT 'ACTIVE'::character varying NOT NULL,
    "last_login" timestamp without time zone,
    "created_at" timestamp without time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp without time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "ref"."communes" (
    "commune_id" integer NOT NULL,
    "code_commune" text NOT NULL,
    "name_fr" text NOT NULL,
    "name_ar" text,
    "milieu" text,
    "code_region" text NOT NULL,
    "region_name_fr" text NOT NULL,
    "code_province" text,
    "province_name_fr" text,
    "code_cercle" text,
    "cercle_name_fr" text,
    "cercle_name_ar" text,
    "area_m2" double precision,
    "geom" geometry(MultiPolygon,4326) NOT NULL,
    "created_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "ref"."landcover_classes" (
    "class_id" integer GENERATED BY DEFAULT AS IDENTITY NOT NULL,
    "code" integer NOT NULL,
    "name_fr" text,
    "name_en" text,
    "color_hex" text
);

CREATE TABLE IF NOT EXISTS "ref"."landcover_periods" (
    "lc_period_id" integer GENERATED BY DEFAULT AS IDENTITY NOT NULL,
    "year" integer,
    "scenario_code" text,
    "description" text,
    "source_data" text
);

CREATE TABLE IF NOT EXISTS "ref"."observed_properties" (
    "property_id" integer GENERATED BY DEFAULT AS IDENTITY NOT NULL,
    "name" text NOT NULL,
    "unit" text NOT NULL,
    "standard_name" text,
    "description" text
);

CREATE TABLE IF NOT EXISTS "ref"."property_domain_membership" (
    "property_id" bigint NOT NULL,
    "domain_code" text NOT NULL,
    "display_order" integer DEFAULT 100 NOT NULL,
    "is_enabled" boolean DEFAULT true NOT NULL,
    "allow_observed" boolean DEFAULT true NOT NULL,
    "allow_simulated" boolean DEFAULT true NOT NULL,
    "default_agg" text DEFAULT 'monthly'::text NOT NULL
);

CREATE TABLE IF NOT EXISTS "ref"."property_domains" (
    "domain_code" text NOT NULL,
    "label" text NOT NULL,
    "description" text
);

CREATE TABLE IF NOT EXISTS "staging"."limite_raw" (
    "gid" integer DEFAULT nextval('staging.limite_raw_gid_seq'::regclass) NOT NULL,
    "subbasin" integer,
    "area" numeric,
    "slo1" numeric,
    "len1" numeric,
    "sll" numeric,
    "csl" numeric,
    "wid1" numeric,
    "dep1" numeric,
    "lat" numeric,
    "long_" numeric,
    "elev" numeric,
    "elevmin" numeric,
    "elevmax" numeric,
    "bname" character varying(80),
    "shape_len" numeric,
    "shape_area" numeric,
    "hydroid" integer,
    "outletid" integer,
    "sur" character varying(50),
    "per" character varying(50),
    "geom" geometry(MultiPolygon,4326)
);

CREATE TABLE IF NOT EXISTS "staging"."migration_batches" (
    "load_batch_id" text NOT NULL,
    "source_db" text NOT NULL,
    "target_db" text NOT NULL,
    "started_at" timestamp with time zone DEFAULT now() NOT NULL,
    "finished_at" timestamp with time zone,
    "mode" text NOT NULL,
    "status" text DEFAULT 'running'::text NOT NULL,
    "note" text
);

CREATE TABLE IF NOT EXISTS "staging"."migration_events" (
    "event_id" bigint DEFAULT nextval('staging.migration_events_event_id_seq'::regclass) NOT NULL,
    "load_batch_id" text NOT NULL,
    "event_time" timestamp with time zone DEFAULT now() NOT NULL,
    "level" text NOT NULL,
    "step" text NOT NULL,
    "table_name" text,
    "message" text,
    "row_count" bigint
);

CREATE TABLE IF NOT EXISTS "staging"."norm_catchments" (
    "catchment_code" text,
    "name" text,
    "dam_name" text,
    "geom" geometry(MultiPolygon,4326),
    "source_table" text,
    "source_pk" text,
    "load_batch_id" text,
    "inserted_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "staging"."norm_communes" (
    "commune_code" text,
    "name_fr" text,
    "name_ar" text,
    "milieu" text,
    "code_region" text,
    "region_name_fr" text,
    "code_province" text,
    "province_name_fr" text,
    "code_cercle" text,
    "cercle_name_fr" text,
    "cercle_name_ar" text,
    "geom" geometry(MultiPolygon,4326),
    "source_table" text,
    "source_pk" text,
    "load_batch_id" text,
    "inserted_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "staging"."norm_measurements" (
    "entity_type" text,
    "entity_code" text,
    "property_code" text,
    "datetime_utc" timestamp with time zone,
    "time_step" text,
    "value" numeric,
    "source_table" text,
    "source_pk" text,
    "load_batch_id" text,
    "inserted_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "staging"."norm_reservoir_bathymetry" (
    "reservoir_code" text,
    "level_m" double precision,
    "volume_hm3" double precision,
    "area_km2" double precision,
    "source" text,
    "source_table" text,
    "source_pk" text,
    "load_batch_id" text,
    "inserted_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "staging"."norm_reservoirs" (
    "reservoir_code" text,
    "name" text,
    "commune_code" text,
    "type_barrage" text,
    "geom" geometry(Point,4326),
    "source_table" text,
    "source_pk" text,
    "load_batch_id" text,
    "inserted_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "staging"."norm_stations" (
    "station_code" text,
    "station_name" text,
    "type_station" text,
    "station_type_code" text,
    "commune_code" text,
    "altitude_m" double precision,
    "source_attrs" jsonb,
    "geom" geometry(Point,4326),
    "source_table" text,
    "source_pk" text,
    "load_batch_id" text,
    "inserted_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "staging"."raw_adm_communes_abhgzr" (
    "id_com" integer,
    "code_region" text,
    "nom_region" text,
    "code_province" text,
    "nom_province" text,
    "code_cercle" text,
    "cercle_fr" text,
    "cercle_ar" text,
    "code_commune" text,
    "commune_fr" text,
    "commune_ar" text,
    "milieu" text,
    "geom_ewkt" text,
    "source_table" text DEFAULT 'public.adm_communes_abhgzr'::text NOT NULL,
    "source_pk" text,
    "load_batch_id" text NOT NULL,
    "inserted_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "staging"."raw_barrages_abhgzr" (
    "id_brg" integer,
    "code_commune" text,
    "ire_barrage" text,
    "nom_barrage" text,
    "type_barrage" text,
    "coord_x" double precision,
    "coord_y" double precision,
    "geom_ewkt" text,
    "source_table" text DEFAULT 'public.barrages_abhgzr'::text NOT NULL,
    "source_pk" text,
    "load_batch_id" text NOT NULL,
    "inserted_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "staging"."raw_bassin_abhgzr" (
    "id_bassin" integer,
    "nom_bassin" text,
    "geom_ewkt" text,
    "source_table" text DEFAULT 'public.bassin_abhgzr'::text NOT NULL,
    "source_pk" text,
    "load_batch_id" text NOT NULL,
    "inserted_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "staging"."raw_bathymetries_barrages_abhgzr" (
    "id_cote" integer,
    "ire_barrage" text,
    "cote_mngm" double precision,
    "volumr_mm3" double precision,
    "surface_km2" double precision,
    "source_table" text DEFAULT 'public.bathymetries_barrages_abhgzr'::text NOT NULL,
    "source_pk" text,
    "load_batch_id" text NOT NULL,
    "inserted_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "staging"."raw_mesures_debits_jr" (
    "id_debit" integer,
    "ire_station" text,
    "date_jr" date,
    "debit_jr" double precision,
    "source_table" text DEFAULT 'public.mesures_debits_jr'::text NOT NULL,
    "source_pk" text,
    "load_batch_id" text NOT NULL,
    "inserted_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "staging"."raw_mesures_evaporation_m" (
    "id_evapo_m" integer,
    "ire_station" text,
    "date_m" date,
    "evaporation_m" text,
    "source_table" text DEFAULT 'public.mesures_evaporation_m'::text NOT NULL,
    "source_pk" text,
    "load_batch_id" text NOT NULL,
    "inserted_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "staging"."raw_mesures_humidite_relative_m" (
    "id_hum_m" integer,
    "ire_station" text,
    "date_m" date,
    "humidite_relative_m" text,
    "source_table" text DEFAULT 'public.mesures_humidite_relative_m'::text NOT NULL,
    "source_pk" text,
    "load_batch_id" text NOT NULL,
    "inserted_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "staging"."raw_mesures_lachers_barrages" (
    "id_lachers" integer,
    "ire_barrage" text,
    "date_jr" date,
    "apports_m3" text,
    "restitution_m3" text,
    "source_table" text DEFAULT 'public.mesures_lachers_barrages'::text NOT NULL,
    "source_pk" text,
    "load_batch_id" text NOT NULL,
    "inserted_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "staging"."raw_mesures_precipitations_jr" (
    "id_precipitation" integer,
    "ire_station" text,
    "date_jr" date,
    "precipitation_jr" double precision,
    "source_table" text DEFAULT 'public.mesures_precipitations_jr'::text NOT NULL,
    "source_pk" text,
    "load_batch_id" text NOT NULL,
    "inserted_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "staging"."raw_mesures_temperature_jr_pn" (
    "id_temp" integer,
    "ire_station" text,
    "date_jr" date,
    "temp_jr_max" double precision,
    "temp_jr_min" double precision,
    "temp_jr_moy" double precision,
    "source_table" text DEFAULT 'public.mesures_temperature_jr_pn'::text NOT NULL,
    "source_pk" text,
    "load_batch_id" text NOT NULL,
    "inserted_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "staging"."raw_mesures_temperature_m" (
    "id_temp_m" integer,
    "ire_station" text,
    "date_m" date,
    "temperature_min" text,
    "temperature_max" text,
    "temperature_moy" text,
    "source_table" text DEFAULT 'public.mesures_temperature_m'::text NOT NULL,
    "source_pk" text,
    "load_batch_id" text NOT NULL,
    "inserted_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "staging"."raw_mesures_vitesse_vent_m" (
    "id_vent_m" integer,
    "ire_station" text,
    "date_m" date,
    "vitesse_moy_m" text,
    "source_table" text DEFAULT 'public.mesures_vitesse_vent_m'::text NOT NULL,
    "source_pk" text,
    "load_batch_id" text NOT NULL,
    "inserted_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "staging"."raw_stations_abhgzr" (
    "id_station" integer,
    "code_commune" text,
    "ire_station" text,
    "num_poste" integer,
    "nom_station_fr" text,
    "nom_station_ar" text,
    "oued" text,
    "date_m_s" text,
    "etat_fonct" text,
    "mode_fonct" text,
    "type_station" text,
    "mesures_station" text,
    "coord_x" double precision,
    "coord_y" double precision,
    "coord_z" double precision,
    "observation" text,
    "geom_ewkt" text,
    "source_table" text DEFAULT 'public.stations_abhgzr'::text NOT NULL,
    "source_pk" text,
    "load_batch_id" text NOT NULL,
    "inserted_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "staging"."reseau_hydro_import_raw" (
    "gid" integer DEFAULT nextval('staging.reseau_hydro_import_raw_gid_seq'::regclass) NOT NULL,
    "subbasin" integer,
    "subbasinr" integer,
    "areac" numeric,
    "len2" numeric,
    "slo2" numeric,
    "wid2" numeric,
    "dep2" numeric,
    "minel" numeric,
    "maxel" numeric,
    "shape_len" numeric,
    "hydroid" integer,
    "outletid" integer,
    "geom" geometry(MultiLineString,32630)
);

CREATE TABLE IF NOT EXISTS "staging"."reseau_hydrologie_raw" (
    "gid" integer DEFAULT nextval('staging.reseau_hydrologie_raw_gid_seq'::regclass) NOT NULL,
    "linkno" integer,
    "dslinkno" integer,
    "uslinkno1" integer,
    "uslinkno2" integer,
    "dsnodeid" double precision,
    "strmorder" integer,
    "length" double precision,
    "magnitude" integer,
    "dscontarea" double precision,
    "strmdrop" double precision,
    "slope" double precision,
    "straightl" double precision,
    "uscontarea" double precision,
    "wsno" integer,
    "doutend" double precision,
    "doutstart" double precision,
    "doutmid" double precision,
    "geom" geometry(MultiLineString,4326)
);

CREATE TABLE IF NOT EXISTS "staging"."station_meteo_raw" (
    "gid" integer DEFAULT nextval('staging.station_meteo_raw_gid_seq'::regclass) NOT NULL,
    "objectid" double precision,
    "?????" character varying(254),
    "nom_fr" character varying(50),
    "lat" numeric,
    "long" numeric,
    "geom" geometry(Point,4326)
);

CREATE TABLE IF NOT EXISTS "staging"."swat_rch_norm" (
    "norm_id" bigint DEFAULT nextval('staging.swat_rch_norm_norm_id_seq'::regclass) NOT NULL,
    "batch_id" text NOT NULL,
    "scenario_code" text,
    "run_id" integer,
    "reach_id" integer,
    "subbasin_id" integer,
    "station_code" text,
    "station_id" integer,
    "obs_date" date,
    "flow_m3s" double precision,
    "sed_tons" double precision,
    "mapping_method" text,
    "mapping_confidence" numeric(5,2),
    "inserted_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "staging"."swat_rch_raw" (
    "raw_id" bigint DEFAULT nextval('staging.swat_rch_raw_raw_id_seq'::regclass) NOT NULL,
    "batch_id" text NOT NULL,
    "source_import_id" bigint,
    "scenario_code" text,
    "swat_rch" integer,
    "swat_sub" integer,
    "year" integer,
    "mon" integer,
    "yyyyddd" integer,
    "period_date" date,
    "flow_out" double precision,
    "sed_out" double precision,
    "source_file" text,
    "raw_record" jsonb,
    "inserted_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "staging"."swat_sub_norm" (
    "norm_id" bigint DEFAULT nextval('staging.swat_sub_norm_norm_id_seq'::regclass) NOT NULL,
    "batch_id" text NOT NULL,
    "scenario_code" text,
    "run_id" integer,
    "subbasin_id" integer,
    "station_code" text,
    "station_id" integer,
    "obs_date" date,
    "syldt_ha" double precision,
    "mapping_method" text,
    "mapping_confidence" numeric(5,2),
    "inserted_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "staging"."swat_sub_raw" (
    "raw_id" bigint DEFAULT nextval('staging.swat_sub_raw_raw_id_seq'::regclass) NOT NULL,
    "batch_id" text NOT NULL,
    "source_import_id" bigint,
    "scenario_code" text,
    "swat_sub" integer,
    "year" integer,
    "mon" integer,
    "yyyyddd" integer,
    "period_date" date,
    "syldt_ha" double precision,
    "source_file" text,
    "raw_record" jsonb,
    "inserted_at" timestamp with time zone DEFAULT now() NOT NULL
);

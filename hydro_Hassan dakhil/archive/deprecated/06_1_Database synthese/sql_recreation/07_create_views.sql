-- Views and materialized views
CREATE OR REPLACE VIEW "api"."v_catalog_properties" AS
SELECT m.domain_code,
    p.property_id,
    p.name,
    p.unit,
    p.standard_name,
    m.display_order,
    m.default_agg,
    m.allow_observed,
    m.allow_simulated
   FROM ref.property_domain_membership m
     JOIN ref.observed_properties p ON p.property_id = m.property_id
  WHERE m.is_enabled = true;

CREATE OR REPLACE VIEW "api"."v_dashboard_catchment_counts" AS
SELECT c.catchment_id,
    c.name AS catchment_name,
    count(DISTINCT r.reservoir_id) AS n_reservoirs,
    count(DISTINCT sb.subbasin_id) AS n_subbasins,
    count(DISTINCT re.reach_id) AS n_reaches,
    count(DISTINCT st.station_id) AS n_stations,
    count(DISTINCT ts.ts_id) AS n_timeseries,
    count(m.*) AS n_measurements
   FROM core.catchments c
     LEFT JOIN core.reservoirs r ON r.catchment_id = c.catchment_id
     LEFT JOIN core.subbasins sb ON sb.catchment_id = c.catchment_id
     LEFT JOIN core.reaches re ON re.catchment_id = c.catchment_id
     LEFT JOIN core.stations st ON st.catchment_id = c.catchment_id
     LEFT JOIN core.timeseries ts ON ts.station_id = st.station_id
     LEFT JOIN core.measurements m ON m.ts_id = ts.ts_id
  GROUP BY c.catchment_id, c.name;

CREATE OR REPLACE VIEW "api"."v_dashboard_national_counts" AS
SELECT ( SELECT count(*) AS count
           FROM core.catchments) AS n_catchments,
    ( SELECT count(*) AS count
           FROM core.reservoirs) AS n_reservoirs,
    ( SELECT count(*) AS count
           FROM core.subbasins) AS n_subbasins,
    ( SELECT count(*) AS count
           FROM core.reaches) AS n_reaches,
    ( SELECT count(*) AS count
           FROM core.rivers) AS n_rivers,
    ( SELECT count(*) AS count
           FROM core.stations) AS n_stations,
    ( SELECT count(*) AS count
           FROM core.timeseries) AS n_timeseries,
    ( SELECT count(*) AS count
           FROM core.measurements) AS n_measurements;

CREATE OR REPLACE VIEW "api"."v_dashboard_reservoir_counts" AS
SELECT res.reservoir_id,
    res.reservoir_code,
    res.name AS reservoir_name,
    res.catchment_id,
    c.name AS catchment_name,
    res.reach_id,
    count(DISTINCT b.bathy_id) AS n_bathy_points
   FROM core.reservoirs res
     LEFT JOIN core.catchments c ON c.catchment_id = res.catchment_id
     LEFT JOIN core.reservoir_bathymetry b ON b.reservoir_id = res.reservoir_id
  GROUP BY res.reservoir_id, res.reservoir_code, res.name, res.catchment_id, c.name, res.reach_id;

CREATE OR REPLACE VIEW "api"."v_erosion_subbasins_annual" AS
SELECT sb.subbasin_id,
    sb.name AS subbasin_name,
    sb.catchment_id,
    sb.geom,
    m.property_id,
    p.name AS property_name,
    p.unit AS property_unit,
    p.standard_name,
    m.run_id,
    r.scenario_code,
    r.scenario_name,
    m.year,
    m.value,
    m.quality_flag
   FROM core.subbasins sb
     JOIN core.subbasin_metrics_annual m ON m.subbasin_id = sb.subbasin_id
     JOIN ref.observed_properties p ON p.property_id = m.property_id
     LEFT JOIN core.model_runs r ON r.run_id = m.run_id
  WHERE (p.property_id IN ( SELECT property_domain_membership.property_id
           FROM ref.property_domain_membership
          WHERE property_domain_membership.domain_code = 'erosion'::text AND property_domain_membership.is_enabled = true));

CREATE OR REPLACE VIEW "api"."v_measurements_annual" AS
SELECT ts_id,
    date_trunc('year'::text, datetime)::date AS year,
    count(*) AS n,
    avg(value) AS value_avg,
    min(value) AS value_min,
    max(value) AS value_max
   FROM core.measurements m
  GROUP BY ts_id, (date_trunc('year'::text, datetime)::date);

CREATE OR REPLACE VIEW "api"."v_measurements_annual_agg" AS
SELECT ts_id,
    date_trunc('year'::text, datetime)::date AS year,
    count(*) AS n,
    avg(value) AS value_avg,
    min(value) AS value_min,
    max(value) AS value_max
   FROM core.measurements m
  GROUP BY ts_id, (date_trunc('year'::text, datetime)::date);

CREATE OR REPLACE VIEW "api"."v_measurements_daily" AS
SELECT ts_id,
    date_trunc('day'::text, datetime)::date AS day,
    count(*) AS n,
    avg(value) AS value_avg,
    min(value) AS value_min,
    max(value) AS value_max
   FROM core.measurements m
  GROUP BY ts_id, (date_trunc('day'::text, datetime)::date);

CREATE OR REPLACE VIEW "api"."v_measurements_latest" AS
SELECT m.ts_id,
    m.datetime,
    m.value,
    m.quality_flag
   FROM core.measurements m
     JOIN ( SELECT measurements.ts_id,
            max(measurements.datetime) AS max_dt
           FROM core.measurements
          GROUP BY measurements.ts_id) x ON x.ts_id = m.ts_id AND x.max_dt = m.datetime;

CREATE OR REPLACE VIEW "api"."v_measurements_monthly" AS
SELECT ts_id,
    date_trunc('month'::text, datetime)::date AS month,
    count(*) AS n,
    avg(value) AS value_avg,
    min(value) AS value_min,
    max(value) AS value_max
   FROM core.measurements m
  GROUP BY ts_id, (date_trunc('month'::text, datetime)::date);

CREATE OR REPLACE VIEW "api"."v_measurements_monthly_agg" AS
SELECT ts_id,
    date_trunc('month'::text, datetime)::date AS month,
    count(*) AS n,
    avg(value) AS value_avg,
    min(value) AS value_min,
    max(value) AS value_max
   FROM core.measurements m
  GROUP BY ts_id, (date_trunc('month'::text, datetime)::date);

CREATE OR REPLACE VIEW "api"."v_qc_property_domain_tovalidate" AS
WITH base AS (
         SELECT p.property_id,
            p.name,
            p.standard_name,
            lower(COALESCE(p.name, ''::text)) AS name_l,
            lower(COALESCE(p.standard_name, ''::text)) AS std_l
           FROM ref.observed_properties p
        ), membership AS (
         SELECT property_domain_membership.property_id,
            count(*) AS n_domains
           FROM ref.property_domain_membership
          GROUP BY property_domain_membership.property_id
        )
 SELECT b.property_id,
    b.name,
    b.standard_name,
    COALESCE(m.n_domains, 0::bigint) AS n_domains,
        CASE
            WHEN COALESCE(m.n_domains, 0::bigint) = 0 THEN 'UNCLASSIFIED'::text
            WHEN COALESCE(m.n_domains, 0::bigint) > 1 THEN 'MULTI_DOMAIN'::text
            WHEN b.name_l ~* '(temp|précip|precip|vent|humidity|évap|evap)'::text AND b.name_l ~* '(débit|debit|flow|discharge|volume|niveau|lâcher|release)'::text THEN 'AMBIGUOUS'::text
            ELSE 'OK'::text
        END AS qc_status,
    b.name_l,
    b.std_l
   FROM base b
     LEFT JOIN membership m ON m.property_id = b.property_id
  WHERE COALESCE(m.n_domains, 0::bigint) = 0 OR COALESCE(m.n_domains, 0::bigint) > 1 OR b.name_l ~* '(temp|précip|precip|vent|humidity|évap|evap)'::text AND b.name_l ~* '(débit|debit|flow|discharge|volume|niveau|lâcher|release)'::text;

CREATE OR REPLACE VIEW "api"."v_timeseries_enriched" AS
SELECT t.ts_id,
    t.station_id,
    s.station_code,
    s.name AS station_name,
    s.type_station,
    s.station_type_code,
    s.commune_code,
    s.catchment_id,
    s.reach_id,
    t.property_id,
    p.name AS property_name,
    p.unit AS property_unit,
    p.standard_name AS property_standard_name,
    t.run_id,
    r.scenario_code,
    r.scenario_name,
    r.is_observed,
    t.source_type,
    t.time_step,
    t.created_at
   FROM core.timeseries t
     LEFT JOIN core.stations s ON s.station_id = t.station_id
     LEFT JOIN ref.observed_properties p ON p.property_id = t.property_id
     LEFT JOIN core.model_runs r ON r.run_id = t.run_id;

CREATE OR REPLACE VIEW "api"."v_catalog_scenarios" AS
SELECT DISTINCT m.domain_code,
    r.run_id,
    r.scenario_code,
    r.scenario_name,
    r.is_observed
   FROM core.model_runs r
     JOIN api.v_timeseries_enriched te ON te.run_id = r.run_id
     JOIN ref.property_domain_membership m ON m.property_id = te.property_id AND m.is_enabled = true;

CREATE OR REPLACE VIEW "api"."v_catalog_series" AS
SELECT m.domain_code,
    te.station_id,
    te.property_id,
    te.ts_id,
    te.run_id,
    te.scenario_code,
    te.scenario_name,
    te.is_observed,
    te.source_type,
    te.time_step
   FROM api.v_timeseries_enriched te
     JOIN ref.property_domain_membership m ON m.property_id = te.property_id AND m.is_enabled = true;

CREATE OR REPLACE VIEW "api"."v_catalog_stations" AS
SELECT DISTINCT m.domain_code,
    s.station_id,
    s.station_code,
    s.name,
    s.type_station,
    s.station_type_code,
    s.commune_code,
    s.catchment_id,
    s.reach_id,
    s.geom
   FROM core.stations s
     JOIN api.v_timeseries_enriched te ON te.station_id = s.station_id
     JOIN ref.property_domain_membership m ON m.property_id = te.property_id AND m.is_enabled = true;

CREATE OR REPLACE VIEW "api"."v_compare_monthly" AS
SELECT te.station_id,
    te.property_id,
    te.ts_id,
    te.scenario_code,
    te.is_observed,
    ma.month,
    ma.value_avg,
    ma.value_min,
    ma.value_max,
    ma.n
   FROM api.v_timeseries_enriched te
     JOIN api.v_measurements_monthly ma ON ma.ts_id = te.ts_id;

CREATE OR REPLACE VIEW "api"."v_map_catchments_annual" AS
SELECT mship.domain_code,
    c.catchment_id,
    c.name AS catchment_name,
    c.geom,
    te.property_id,
    te.property_name,
    te.scenario_code,
    te.is_observed,
    a.year,
    avg(a.value_avg) AS catchment_value_avg
   FROM core.catchments c
     JOIN core.stations s ON s.catchment_id = c.catchment_id
     JOIN api.v_timeseries_enriched te ON te.station_id = s.station_id
     JOIN ref.property_domain_membership mship ON mship.property_id = te.property_id AND mship.is_enabled = true
     JOIN api.v_measurements_annual a ON a.ts_id = te.ts_id
  GROUP BY mship.domain_code, c.catchment_id, c.name, c.geom, te.property_id, te.property_name, te.scenario_code, te.is_observed, a.year;

CREATE OR REPLACE VIEW "api"."v_map_stations_latest" AS
SELECT mship.domain_code,
    s.station_id,
    s.station_code,
    s.name AS station_name,
    s.catchment_id,
    s.reach_id,
    s.commune_code,
    s.geom,
    te.property_id,
    te.property_name,
    te.property_unit,
    te.scenario_code,
    te.is_observed,
    ml.datetime,
    ml.value
   FROM core.stations s
     JOIN api.v_timeseries_enriched te ON te.station_id = s.station_id
     JOIN ref.property_domain_membership mship ON mship.property_id = te.property_id AND mship.is_enabled = true
     LEFT JOIN api.v_measurements_latest ml ON ml.ts_id = te.ts_id;

CREATE OR REPLACE VIEW "api"."v_series_stats" AS
SELECT mship.domain_code,
    te.ts_id,
    te.station_id,
    te.property_id,
    te.scenario_code,
    te.is_observed,
    count(m.*) AS n,
    min(m.datetime) AS dt_min,
    max(m.datetime) AS dt_max,
    min(m.value) AS v_min,
    max(m.value) AS v_max,
    avg(m.value) AS v_avg
   FROM api.v_timeseries_enriched te
     JOIN ref.property_domain_membership mship ON mship.property_id = te.property_id AND mship.is_enabled = true
     LEFT JOIN core.measurements m ON m.ts_id = te.ts_id
  GROUP BY mship.domain_code, te.ts_id, te.station_id, te.property_id, te.scenario_code, te.is_observed;

CREATE OR REPLACE VIEW "audit"."v_qc_measurements_duplicates" AS
SELECT ts_id,
    datetime,
    count(*) AS n_duplicates
   FROM core.measurements
  GROUP BY ts_id, datetime
 HAVING count(*) > 1;

CREATE OR REPLACE VIEW "audit"."v_qc_measurements_orphans" AS
SELECT m.ts_id,
    count(*) AS n_rows
   FROM core.measurements m
     LEFT JOIN core.timeseries t ON t.ts_id = m.ts_id
  WHERE t.ts_id IS NULL
  GROUP BY m.ts_id;

CREATE OR REPLACE VIEW "audit"."v_qc_null_geometry" AS
SELECT 'core.catchments'::text AS table_name,
    count(*) AS n_null_geom
   FROM core.catchments
  WHERE catchments.geom IS NULL
UNION ALL
 SELECT 'core.reservoirs'::text AS table_name,
    count(*) AS n_null_geom
   FROM core.reservoirs
  WHERE reservoirs.geom IS NULL
UNION ALL
 SELECT 'core.stations'::text AS table_name,
    count(*) AS n_null_geom
   FROM core.stations
  WHERE stations.geom IS NULL
UNION ALL
 SELECT 'core.subbasins'::text AS table_name,
    count(*) AS n_null_geom
   FROM core.subbasins
  WHERE subbasins.geom IS NULL
UNION ALL
 SELECT 'core.reaches'::text AS table_name,
    count(*) AS n_null_geom
   FROM core.reaches
  WHERE reaches.geom IS NULL
UNION ALL
 SELECT 'geo.landcover'::text AS table_name,
    count(*) AS n_null_geom
   FROM geo.landcover
  WHERE landcover.geom IS NULL
UNION ALL
 SELECT 'ref.communes'::text AS table_name,
    count(*) AS n_null_geom
   FROM ref.communes
  WHERE communes.geom IS NULL;

CREATE OR REPLACE VIEW "audit"."v_qc_timeseries_duplicates" AS
SELECT station_id,
    property_id,
    run_id,
    source_type,
    time_step,
    count(*) AS n_duplicates,
    array_agg(ts_id ORDER BY ts_id) AS ts_ids
   FROM core.timeseries
  GROUP BY station_id, property_id, run_id, source_type, time_step
 HAVING count(*) > 1;

CREATE OR REPLACE VIEW "audit"."v_qc_timeseries_without_measurements" AS
SELECT t.ts_id,
    t.station_id,
    t.property_id,
    t.run_id,
    t.source_type,
    t.time_step
   FROM core.timeseries t
     LEFT JOIN core.measurements m ON m.ts_id = t.ts_id
  WHERE m.ts_id IS NULL;

CREATE OR REPLACE VIEW "public"."catchments" AS
SELECT catchment_id,
    name,
    dam_name,
    area_m2,
    geom
   FROM core.catchments;

CREATE OR REPLACE VIEW "public"."communes" AS
SELECT commune_id,
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
    geom,
    created_at
   FROM ref.communes;

CREATE OR REPLACE VIEW "public"."landcover" AS
SELECT lc_id,
    lc_period_id,
    class_id,
    geom
   FROM geo.landcover;

CREATE OR REPLACE VIEW "public"."landcover_classes" AS
SELECT class_id,
    code,
    name_fr,
    name_en,
    color_hex
   FROM ref.landcover_classes;

CREATE OR REPLACE VIEW "public"."landcover_periods" AS
SELECT lc_period_id,
    year,
    scenario_code,
    description,
    source_data
   FROM ref.landcover_periods;

CREATE OR REPLACE VIEW "public"."measurements" AS
SELECT ts_id,
    datetime,
    value,
    quality_flag
   FROM core.measurements;

CREATE OR REPLACE VIEW "public"."model_runs" AS
SELECT run_id,
    scenario_code,
    scenario_name,
    description,
    is_observed,
    created_at
   FROM core.model_runs;

CREATE OR REPLACE VIEW "public"."observed_properties" AS
SELECT property_id,
    name,
    unit,
    standard_name,
    description
   FROM ref.observed_properties;

CREATE OR REPLACE VIEW "public"."reaches" AS
SELECT reach_id,
    reach_code,
    subbasin_id,
    catchment_id,
    length_m,
    slope_pct,
    width_m,
    depth_m,
    min_elev_m,
    max_elev_m,
    qm_annual_mean_m3s,
    sedout_annual_mean_t_yr,
    geom,
    created_at,
    river_id
   FROM core.reaches;

CREATE OR REPLACE VIEW "public"."reservoir_bathymetry" AS
SELECT bathy_id,
    reservoir_id,
    level_m,
    volume_hm3,
    area_km2,
    source,
    created_at
   FROM core.reservoir_bathymetry;

CREATE OR REPLACE VIEW "public"."reservoirs" AS
SELECT reservoir_id,
    name,
    geom,
    created_at,
    catchment_id,
    reach_id,
    reservoir_code,
    commune_code
   FROM core.reservoirs;

CREATE OR REPLACE VIEW "public"."rivers" AS
SELECT river_id,
    river_code,
    name_fr,
    name_en,
    basin_name,
    remarks
   FROM core.rivers;

CREATE OR REPLACE VIEW "public"."stations" AS
SELECT station_id,
    station_code,
    name,
    type_station,
    station_type_code,
    commune_code,
    geom,
    altitude_m,
    start_date,
    end_date,
    catchment_id,
    reach_id
   FROM core.stations;

CREATE OR REPLACE VIEW "public"."subbasins" AS
SELECT subbasin_id,
    catchment_id,
    subbasin_code,
    name,
    area_m2,
    spec_deg_base_t_ha_yr,
    spec_deg_slope1_t_ha_yr,
    spec_deg_slope2_t_ha_yr,
    spec_deg_slope3_t_ha_yr,
    spec_deg_buffer_t_ha_yr,
    sediment_yield_tot_t_ha,
    geom,
    created_at
   FROM core.subbasins;

CREATE OR REPLACE VIEW "public"."timeseries" AS
SELECT ts_id,
    station_id,
    property_id,
    run_id,
    source_type,
    created_at,
    time_step
   FROM core.timeseries;

CREATE OR REPLACE VIEW "public"."v_catchments_geo" AS
SELECT catchment_id,
    name AS catchment_name,
    dam_name,
    area_m2,
    area_m2 / 10000.0::double precision AS area_ha,
    geom
   FROM core.catchments c;

CREATE OR REPLACE VIEW "public"."v_map_station" AS
SELECT station_id,
    station_code
   FROM core.stations s;

CREATE OR REPLACE VIEW "public"."v_property_catalog" AS
SELECT property_id,
    name,
    unit,
    standard_name,
    description,
        CASE
            WHEN (lower(standard_name) = ANY (ARRAY['air_temperature'::text, 'air_temperature_maximum'::text, 'air_temperature_minimum'::text, 'relative_humidity'::text, 'precipitation_amount'::text, 'wind_speed'::text])) OR lower(name) ~~ '%temperature%'::text OR lower(name) ~~ '%humidity%'::text OR lower(name) ~~ '%precip%'::text OR lower(name) ~~ '%wind%'::text OR lower(name) ~~ '%evap%'::text OR lower(standard_name) ~~ '%evap%'::text THEN 'climat'::text
            WHEN (lower(standard_name) = ANY (ARRAY['water_volume_transport_in_river_channel'::text, 'outflow_from_reservoir'::text, 'reservoir_bathymetry'::text])) OR lower(name) ~~ '%streamflow%'::text OR lower(name) ~~ '%debit%'::text OR lower(name) ~~ '%release%'::text OR lower(name) ~~ '%lacher%'::text OR lower(name) ~~ '%bathy%'::text OR lower(name) ~~ '%bathym%'::text THEN 'hydro'::text
            WHEN lower(standard_name) = 'suspended_sediment_load'::text OR lower(name) ~~ '%sediment%'::text OR lower(name) ~~ '%eros%'::text THEN 'erosion'::text
            ELSE 'autre'::text
        END AS module,
        CASE
            WHEN lower(name) ~~ '%max%'::text THEN 'max'::text
            WHEN lower(name) ~~ '%min%'::text THEN 'min'::text
            WHEN lower(name) ~~ '%mean%'::text OR lower(name) ~~ '%moy%'::text THEN 'mean'::text
            ELSE NULL::text
        END AS stat_hint
   FROM ref.observed_properties p;

CREATE OR REPLACE VIEW "public"."v_property_catalog_final" AS
SELECT p.property_id,
    p.name,
    p.unit,
    p.standard_name,
    p.description,
    p.module,
    p.stat_hint,
    COALESCE(o.module, p.module) AS module_final,
    o.submodule
   FROM v_property_catalog p
     LEFT JOIN property_module_override o USING (property_id);

CREATE OR REPLACE VIEW "public"."v_property_module" AS
SELECT property_id,
    name AS property_name,
    unit,
    standard_name,
        CASE
            WHEN lower(name) ~~ '%precip%'::text OR standard_name = 'precipitation_amount'::text THEN 'climat'::text
            WHEN lower(name) ~~ '%temperature%'::text THEN 'climat'::text
            WHEN lower(name) ~~ '%humidity%'::text OR standard_name = 'relative_humidity'::text THEN 'climat'::text
            WHEN lower(name) ~~ '%evap%'::text OR standard_name = 'evaporation'::text THEN 'climat'::text
            WHEN lower(name) ~~ '%wind%'::text OR standard_name = 'wind_speed'::text THEN 'climat'::text
            WHEN lower(name) ~~ '%streamflow%'::text OR standard_name = 'water_volume_transport_in_river_channel'::text THEN 'hydro'::text
            WHEN lower(name) ~~ '%release%'::text OR standard_name = 'outflow_from_reservoir'::text THEN 'hydro'::text
            WHEN lower(name) ~~ '%bathy%'::text OR standard_name = 'reservoir_bathymetry'::text THEN 'hydro'::text
            WHEN lower(name) ~~ '%sediment%'::text OR standard_name = 'suspended_sediment_load'::text THEN 'erosion'::text
            ELSE 'autre'::text
        END AS module_code
   FROM ref.observed_properties op;

CREATE OR REPLACE VIEW "public"."v_property_agg_rule" AS
SELECT property_id,
    property_name,
    standard_name,
    module_code,
        CASE
            WHEN standard_name = 'precipitation_amount'::text THEN 'sum'::text
            WHEN standard_name = 'suspended_sediment_load'::text THEN 'sum'::text
            WHEN standard_name = ANY (ARRAY['air_temperature'::text, 'relative_humidity'::text, 'wind_speed'::text]) THEN 'avg'::text
            WHEN standard_name = ANY (ARRAY['water_volume_transport_in_river_channel'::text, 'outflow_from_reservoir'::text]) THEN 'avg'::text
            WHEN standard_name = 'evaporation'::text THEN 'sum'::text
            WHEN standard_name = 'reservoir_bathymetry'::text THEN 'last'::text
            ELSE 'avg'::text
        END AS agg_method
   FROM v_property_module pm;

CREATE OR REPLACE VIEW "public"."v_reaches_geo" AS
SELECT r.reach_id,
    r.reach_code,
    r.subbasin_id,
    sb.name AS subbasin_name,
    r.catchment_id,
    c.name AS catchment_name,
    r.river_id,
    rv.name_fr AS river_name,
    r.length_m,
    r.slope_pct,
    r.width_m,
    r.depth_m,
    r.min_elev_m,
    r.max_elev_m,
    r.qm_annual_mean_m3s,
    r.sedout_annual_mean_t_yr,
    r.geom
   FROM core.reaches r
     LEFT JOIN core.subbasins sb ON sb.subbasin_id = r.subbasin_id
     LEFT JOIN core.catchments c ON c.catchment_id = r.catchment_id
     LEFT JOIN core.rivers rv ON rv.river_id = r.river_id;

CREATE OR REPLACE VIEW "public"."v_reservoirs_geo" AS
SELECT r.reservoir_id,
    r.name AS reservoir_name,
    r.catchment_id,
    c.name AS catchment_name,
    r.reach_id,
    rc.reach_code,
    r.created_at,
    min(b.level_m) AS min_level_m,
    max(b.level_m) AS max_level_m,
    max(b.volume_hm3) AS max_volume_hm3,
    max(b.area_km2) AS max_area_km2,
    r.geom
   FROM core.reservoirs r
     LEFT JOIN core.catchments c ON c.catchment_id = r.catchment_id
     LEFT JOIN core.reaches rc ON rc.reach_id = r.reach_id
     LEFT JOIN core.reservoir_bathymetry b ON b.reservoir_id = r.reservoir_id
  GROUP BY r.reservoir_id, r.name, r.catchment_id, c.name, r.reach_id, rc.reach_code, r.created_at, r.geom;

CREATE OR REPLACE VIEW "public"."v_stations_geo" AS
SELECT s.station_id,
    s.station_code,
    s.name AS station_name,
    s.type_station,
    s.station_type_code,
    s.commune_code,
    s.altitude_m,
    s.start_date,
    s.end_date,
    s.catchment_id,
    c.name AS catchment_name,
    c.dam_name,
    s.reach_id,
    rch.reach_code,
    rch.river_id,
    rv.name_fr AS river_name,
    s.geom
   FROM core.stations s
     LEFT JOIN core.catchments c ON c.catchment_id = s.catchment_id
     LEFT JOIN core.reaches rch ON rch.reach_id = s.reach_id
     LEFT JOIN core.rivers rv ON rv.river_id = rch.river_id;

CREATE OR REPLACE VIEW "public"."v_stats_bathymetry" AS
SELECT 13 AS property_id,
    'Reservoir Bathymetry'::text AS property_name,
    r.reservoir_id,
    r.name AS reservoir_name,
    count(b.*) AS n_points,
    min(b.level_m) AS min_level_m,
    max(b.level_m) AS max_level_m,
    min(b.volume_hm3) AS min_volume_hm3,
    max(b.volume_hm3) AS max_volume_hm3,
    min(b.area_km2) AS min_area_km2,
    max(b.area_km2) AS max_area_km2
   FROM core.reservoir_bathymetry b
     JOIN core.reservoirs r ON r.reservoir_id = b.reservoir_id
  GROUP BY r.reservoir_id, r.name;

CREATE OR REPLACE VIEW "public"."v_stats_bathymetry_global" AS
SELECT 13 AS property_id,
    'Reservoir Bathymetry'::text AS property_name,
    count(b.*) AS n_points,
    count(DISTINCT reservoir_id) AS n_reservoirs,
    min(level_m) AS min_level_m,
    max(level_m) AS max_level_m,
    min(volume_hm3) AS min_volume_hm3,
    max(volume_hm3) AS max_volume_hm3,
    min(area_km2) AS min_area_km2,
    max(area_km2) AS max_area_km2
   FROM core.reservoir_bathymetry b;

CREATE OR REPLACE VIEW "public"."v_stats_property_station_timestep" AS
SELECT ts.property_id,
    p.name AS property_name,
    ts.time_step,
    ts.station_id,
    s.station_code,
    s.name AS station_name,
    count(m.*) AS n_measurements,
    min(m.datetime) AS first_datetime,
    max(m.datetime) AS last_datetime
   FROM core.measurements m
     JOIN core.timeseries ts ON ts.ts_id = m.ts_id
     JOIN ref.observed_properties p ON p.property_id = ts.property_id
     JOIN core.stations s ON s.station_id = ts.station_id
  GROUP BY ts.property_id, p.name, ts.time_step, ts.station_id, s.station_code, s.name;

CREATE OR REPLACE VIEW "public"."v_stats_evaporation" AS
SELECT property_id,
    property_name,
    time_step,
    station_id,
    station_code,
    station_name,
    n_measurements,
    first_datetime,
    last_datetime
   FROM v_stats_property_station_timestep
  WHERE property_id = 10;

CREATE OR REPLACE VIEW "public"."v_stats_humidity" AS
SELECT property_id,
    property_name,
    time_step,
    station_id,
    station_code,
    station_name,
    n_measurements,
    first_datetime,
    last_datetime
   FROM v_stats_property_station_timestep
  WHERE property_id = 12;

CREATE OR REPLACE VIEW "public"."v_stats_lachers" AS
SELECT property_id,
    property_name,
    time_step,
    station_id,
    station_code,
    station_name,
    n_measurements,
    first_datetime,
    last_datetime
   FROM v_stats_property_station_timestep
  WHERE property_id = 8;

CREATE OR REPLACE VIEW "public"."v_stats_precipitation" AS
SELECT property_id,
    property_name,
    time_step,
    station_id,
    station_code,
    station_name,
    n_measurements,
    first_datetime,
    last_datetime
   FROM v_stats_property_station_timestep
  WHERE property_id = 1;

CREATE OR REPLACE VIEW "public"."v_stats_property_timestep" AS
SELECT ts.property_id,
    p.name AS property_name,
    ts.time_step,
    count(m.*) AS n_measurements,
    count(DISTINCT ts.station_id) AS n_stations,
    min(m.datetime) AS first_datetime,
    max(m.datetime) AS last_datetime
   FROM core.measurements m
     JOIN core.timeseries ts ON ts.ts_id = m.ts_id
     JOIN ref.observed_properties p ON p.property_id = ts.property_id
  GROUP BY ts.property_id, p.name, ts.time_step;

CREATE OR REPLACE VIEW "public"."v_stats_evaporation_global" AS
SELECT property_id,
    property_name,
    time_step,
    n_measurements,
    n_stations,
    first_datetime,
    last_datetime
   FROM v_stats_property_timestep
  WHERE property_id = 10;

CREATE OR REPLACE VIEW "public"."v_stats_humidity_global" AS
SELECT property_id,
    property_name,
    time_step,
    n_measurements,
    n_stations,
    first_datetime,
    last_datetime
   FROM v_stats_property_timestep
  WHERE property_id = 12;

CREATE OR REPLACE VIEW "public"."v_stats_lachers_global" AS
SELECT property_id,
    property_name,
    time_step,
    n_measurements,
    n_stations,
    first_datetime,
    last_datetime
   FROM v_stats_property_timestep
  WHERE property_id = 8;

CREATE OR REPLACE VIEW "public"."v_stats_precipitation_global" AS
SELECT property_id,
    property_name,
    time_step,
    n_measurements,
    n_stations,
    first_datetime,
    last_datetime
   FROM v_stats_property_timestep
  WHERE property_id = 1;

CREATE OR REPLACE VIEW "public"."v_stats_sediment_load" AS
SELECT property_id,
    property_name,
    time_step,
    station_id,
    station_code,
    station_name,
    n_measurements,
    first_datetime,
    last_datetime
   FROM v_stats_property_station_timestep
  WHERE property_id = 9;

CREATE OR REPLACE VIEW "public"."v_stats_sediment_load_global" AS
SELECT property_id,
    property_name,
    time_step,
    n_measurements,
    n_stations,
    first_datetime,
    last_datetime
   FROM v_stats_property_timestep
  WHERE property_id = 9;

CREATE OR REPLACE VIEW "public"."v_stats_streamflow" AS
SELECT property_id,
    property_name,
    time_step,
    station_id,
    station_code,
    station_name,
    n_measurements,
    first_datetime,
    last_datetime
   FROM v_stats_property_station_timestep
  WHERE property_id = 2;

CREATE OR REPLACE VIEW "public"."v_stats_streamflow_global" AS
SELECT property_id,
    property_name,
    time_step,
    n_measurements,
    n_stations,
    first_datetime,
    last_datetime
   FROM v_stats_property_timestep
  WHERE property_id = 2;

CREATE OR REPLACE VIEW "public"."v_stats_temperature_all" AS
SELECT property_id,
    property_name,
    time_step,
    station_id,
    station_code,
    station_name,
    n_measurements,
    first_datetime,
    last_datetime
   FROM v_stats_property_station_timestep
  WHERE property_id = ANY (ARRAY[3, 4, 5]);

CREATE OR REPLACE VIEW "public"."v_stats_temperature_all_global" AS
SELECT property_id,
    property_name,
    time_step,
    n_measurements,
    n_stations,
    first_datetime,
    last_datetime
   FROM v_stats_property_timestep
  WHERE property_id = ANY (ARRAY[3, 4, 5]);

CREATE OR REPLACE VIEW "public"."v_stats_temperature_max" AS
SELECT property_id,
    property_name,
    time_step,
    station_id,
    station_code,
    station_name,
    n_measurements,
    first_datetime,
    last_datetime
   FROM v_stats_property_station_timestep
  WHERE property_id = 3;

CREATE OR REPLACE VIEW "public"."v_stats_temperature_max_global" AS
SELECT property_id,
    property_name,
    time_step,
    n_measurements,
    n_stations,
    first_datetime,
    last_datetime
   FROM v_stats_property_timestep
  WHERE property_id = 3;

CREATE OR REPLACE VIEW "public"."v_stats_temperature_mean" AS
SELECT property_id,
    property_name,
    time_step,
    station_id,
    station_code,
    station_name,
    n_measurements,
    first_datetime,
    last_datetime
   FROM v_stats_property_station_timestep
  WHERE property_id = 5;

CREATE OR REPLACE VIEW "public"."v_stats_temperature_mean_global" AS
SELECT property_id,
    property_name,
    time_step,
    n_measurements,
    n_stations,
    first_datetime,
    last_datetime
   FROM v_stats_property_timestep
  WHERE property_id = 5;

CREATE OR REPLACE VIEW "public"."v_stats_temperature_min" AS
SELECT property_id,
    property_name,
    time_step,
    station_id,
    station_code,
    station_name,
    n_measurements,
    first_datetime,
    last_datetime
   FROM v_stats_property_station_timestep
  WHERE property_id = 4;

CREATE OR REPLACE VIEW "public"."v_stats_temperature_min_global" AS
SELECT property_id,
    property_name,
    time_step,
    n_measurements,
    n_stations,
    first_datetime,
    last_datetime
   FROM v_stats_property_timestep
  WHERE property_id = 4;

CREATE OR REPLACE VIEW "public"."v_stats_wind_speed" AS
SELECT property_id,
    property_name,
    time_step,
    station_id,
    station_code,
    station_name,
    n_measurements,
    first_datetime,
    last_datetime
   FROM v_stats_property_station_timestep
  WHERE property_id = 7;

CREATE OR REPLACE VIEW "public"."v_stats_wind_speed_global" AS
SELECT property_id,
    property_name,
    time_step,
    n_measurements,
    n_stations,
    first_datetime,
    last_datetime
   FROM v_stats_property_timestep
  WHERE property_id = 7;

CREATE OR REPLACE VIEW "public"."v_subbasins_geo" AS
SELECT sb.subbasin_id,
    sb.subbasin_code,
    sb.name AS subbasin_name,
    sb.catchment_id,
    c.name AS catchment_name,
    sb.area_m2,
    sb.area_m2 / 10000.0::double precision AS area_ha,
    sb.spec_deg_base_t_ha_yr,
    sb.spec_deg_slope1_t_ha_yr,
    sb.spec_deg_slope2_t_ha_yr,
    sb.spec_deg_slope3_t_ha_yr,
    sb.spec_deg_buffer_t_ha_yr,
    sb.sediment_yield_tot_t_ha,
    sb.geom
   FROM core.subbasins sb
     JOIN core.catchments c ON c.catchment_id = sb.catchment_id;

CREATE OR REPLACE VIEW "public"."v_ts_catalog" AS
SELECT ts.ts_id,
    ts.station_id,
    s.station_code,
    s.name AS station_name,
    s.type_station,
    s.station_type_code,
    s.commune_code,
    s.altitude_m,
    s.start_date,
    s.end_date,
    s.catchment_id,
    c.name AS catchment_name,
    c.dam_name,
    ts.property_id,
    p.name AS property_name,
    p.unit,
    p.standard_name,
    ts.run_id,
    r.scenario_code,
    r.scenario_name,
    r.is_observed,
    ts.source_type,
    ts.time_step,
    ts.created_at AS ts_created_at
   FROM core.timeseries ts
     JOIN core.stations s ON s.station_id = ts.station_id
     LEFT JOIN core.catchments c ON c.catchment_id = s.catchment_id
     JOIN ref.observed_properties p ON p.property_id = ts.property_id
     JOIN core.model_runs r ON r.run_id = ts.run_id;

CREATE OR REPLACE VIEW "public"."v_measurements_full" AS
SELECT m.ts_id,
    v.station_id,
    v.station_code,
    v.station_name,
    v.type_station,
    v.property_id,
    v.property_name,
    v.unit,
    v.run_id,
    v.scenario_code,
    v.scenario_name,
    v.is_observed,
    v.source_type,
    v.time_step,
    m.datetime,
    m.value,
    m.quality_flag
   FROM core.measurements m
     JOIN v_ts_catalog v ON v.ts_id = m.ts_id;

CREATE OR REPLACE VIEW "public"."v_ts_catalog_enriched" AS
SELECT c.ts_id,
    c.station_id,
    c.station_code,
    c.station_name,
    c.property_id,
    c.property_name,
    c.unit,
    c.standard_name,
    c.run_id,
    c.scenario_code,
    c.scenario_name,
    c.source_type,
    c.time_step,
    c.ts_created_at,
    ms.n_points,
    ms.start_date,
    ms.end_date
   FROM v_ts_catalog c
     LEFT JOIN LATERAL ( SELECT count(*) AS n_points,
            min(m.datetime) AS start_date,
            max(m.datetime) AS end_date
           FROM core.measurements m
          WHERE m.ts_id = c.ts_id) ms ON true;

CREATE OR REPLACE VIEW "public"."v_values_bathymetry" AS
SELECT b.reservoir_id,
    r.name AS reservoir_name,
    r.catchment_id,
    c.name AS catchment_name,
    b.level_m,
    b.volume_hm3,
    b.area_km2
   FROM core.reservoir_bathymetry b
     JOIN core.reservoirs r ON r.reservoir_id = b.reservoir_id
     LEFT JOIN core.catchments c ON c.catchment_id = r.catchment_id
  ORDER BY r.reservoir_id, b.level_m;

CREATE OR REPLACE VIEW "public"."v_values_measurements" AS
SELECT m.ts_id,
    ts.station_id,
    s.station_code,
    s.name AS station_name,
    s.type_station,
    s.station_type_code,
    s.commune_code,
    s.altitude_m,
    s.catchment_id,
    c.name AS catchment_name,
    c.dam_name,
    ts.property_id,
    p.name AS property_name,
    p.unit,
    p.standard_name,
    ts.run_id,
    r.scenario_code,
    r.scenario_name,
    r.is_observed,
    ts.source_type,
    ts.time_step,
    m.datetime,
    m.value,
    m.quality_flag
   FROM core.measurements m
     JOIN core.timeseries ts ON ts.ts_id = m.ts_id
     JOIN core.stations s ON s.station_id = ts.station_id
     LEFT JOIN core.catchments c ON c.catchment_id = s.catchment_id
     JOIN ref.observed_properties p ON p.property_id = ts.property_id
     JOIN core.model_runs r ON r.run_id = ts.run_id;

CREATE OR REPLACE VIEW "public"."v_values_annual" AS
SELECT station_id,
    station_code,
    station_name,
    property_id,
    property_name,
    unit,
    run_id,
    scenario_code,
    time_step,
    date_part('year'::text, datetime)::integer AS year,
    count(*) AS n_values,
    sum(value) AS sum_value,
    avg(value) AS mean_value,
    min(value) AS min_value,
    max(value) AS max_value
   FROM v_values_measurements v
  GROUP BY station_id, station_code, station_name, property_id, property_name, unit, run_id, scenario_code, time_step, (date_part('year'::text, datetime))
  ORDER BY station_id, property_id, (date_part('year'::text, datetime));

CREATE OR REPLACE VIEW "public"."v_values_evaporation_annual" AS
SELECT station_id,
    station_code,
    station_name,
    property_id,
    property_name,
    unit,
    run_id,
    scenario_code,
    time_step,
    year,
    n_values,
    sum_value,
    mean_value,
    min_value,
    max_value
   FROM v_values_annual
  WHERE (property_id IN ( SELECT observed_properties.property_id
           FROM ref.observed_properties
          WHERE upper(observed_properties.standard_name) = 'EVAPORATION'::text));

CREATE OR REPLACE VIEW "public"."v_values_evaporation_obs" AS
SELECT ts_id,
    station_id,
    station_code,
    station_name,
    type_station,
    station_type_code,
    commune_code,
    altitude_m,
    catchment_id,
    catchment_name,
    dam_name,
    property_id,
    property_name,
    unit,
    standard_name,
    run_id,
    scenario_code,
    scenario_name,
    is_observed,
    source_type,
    time_step,
    datetime,
    value,
    quality_flag
   FROM v_values_measurements
  WHERE (property_id IN ( SELECT observed_properties.property_id
           FROM ref.observed_properties
          WHERE upper(observed_properties.standard_name) = 'EVAPORATION'::text)) AND is_observed = true AND source_type = 'observed'::text;

CREATE OR REPLACE VIEW "public"."v_values_humidity_annual" AS
SELECT station_id,
    station_code,
    station_name,
    property_id,
    property_name,
    unit,
    run_id,
    scenario_code,
    time_step,
    year,
    n_values,
    sum_value,
    mean_value,
    min_value,
    max_value
   FROM v_values_annual
  WHERE (property_id IN ( SELECT observed_properties.property_id
           FROM ref.observed_properties
          WHERE upper(observed_properties.standard_name) = 'HUMIDITY_REL'::text));

CREATE OR REPLACE VIEW "public"."v_values_humidity_obs" AS
SELECT ts_id,
    station_id,
    station_code,
    station_name,
    type_station,
    station_type_code,
    commune_code,
    altitude_m,
    catchment_id,
    catchment_name,
    dam_name,
    property_id,
    property_name,
    unit,
    standard_name,
    run_id,
    scenario_code,
    scenario_name,
    is_observed,
    source_type,
    time_step,
    datetime,
    value,
    quality_flag
   FROM v_values_measurements
  WHERE (property_id IN ( SELECT observed_properties.property_id
           FROM ref.observed_properties
          WHERE upper(observed_properties.standard_name) = 'HUMIDITY_REL'::text)) AND is_observed = true AND source_type = 'observed'::text;

CREATE OR REPLACE VIEW "public"."v_values_lachers_annual" AS
SELECT station_id,
    station_code,
    station_name,
    property_id,
    property_name,
    unit,
    run_id,
    scenario_code,
    time_step,
    year,
    n_values,
    sum_value,
    mean_value,
    min_value,
    max_value
   FROM v_values_annual
  WHERE (property_id IN ( SELECT observed_properties.property_id
           FROM ref.observed_properties
          WHERE upper(observed_properties.standard_name) = ANY (ARRAY['INFLOW_M3'::text, 'RESTITUTION_M3'::text])));

CREATE OR REPLACE VIEW "public"."v_values_lachers_obs" AS
SELECT ts_id,
    station_id,
    station_code,
    station_name,
    type_station,
    station_type_code,
    commune_code,
    altitude_m,
    catchment_id,
    catchment_name,
    dam_name,
    property_id,
    property_name,
    unit,
    standard_name,
    run_id,
    scenario_code,
    scenario_name,
    is_observed,
    source_type,
    time_step,
    datetime,
    value,
    quality_flag
   FROM v_values_measurements
  WHERE (property_id IN ( SELECT observed_properties.property_id
           FROM ref.observed_properties
          WHERE upper(observed_properties.standard_name) = ANY (ARRAY['INFLOW_M3'::text, 'RESTITUTION_M3'::text]))) AND is_observed = true AND source_type = 'observed'::text;

CREATE OR REPLACE VIEW "public"."v_values_monthly" AS
SELECT station_id,
    station_code,
    station_name,
    property_id,
    property_name,
    unit,
    run_id,
    scenario_code,
    time_step,
    date_part('year'::text, datetime)::integer AS year,
    date_part('month'::text, datetime)::integer AS month,
    count(*) AS n_values,
    sum(value) AS sum_value,
    avg(value) AS mean_value,
    min(value) AS min_value,
    max(value) AS max_value
   FROM v_values_measurements v
  GROUP BY station_id, station_code, station_name, property_id, property_name, unit, run_id, scenario_code, time_step, (date_part('year'::text, datetime)), (date_part('month'::text, datetime))
  ORDER BY station_id, property_id, (date_part('year'::text, datetime)), (date_part('month'::text, datetime));

CREATE OR REPLACE VIEW "public"."v_values_evaporation_monthly" AS
SELECT station_id,
    station_code,
    station_name,
    property_id,
    property_name,
    unit,
    run_id,
    scenario_code,
    time_step,
    year,
    month,
    n_values,
    sum_value,
    mean_value,
    min_value,
    max_value
   FROM v_values_monthly
  WHERE (property_id IN ( SELECT observed_properties.property_id
           FROM ref.observed_properties
          WHERE upper(observed_properties.standard_name) = 'EVAPORATION'::text));

CREATE OR REPLACE VIEW "public"."v_values_humidity_monthly" AS
SELECT station_id,
    station_code,
    station_name,
    property_id,
    property_name,
    unit,
    run_id,
    scenario_code,
    time_step,
    year,
    month,
    n_values,
    sum_value,
    mean_value,
    min_value,
    max_value
   FROM v_values_monthly
  WHERE (property_id IN ( SELECT observed_properties.property_id
           FROM ref.observed_properties
          WHERE upper(observed_properties.standard_name) = 'HUMIDITY_REL'::text));

CREATE OR REPLACE VIEW "public"."v_values_lachers_monthly" AS
SELECT station_id,
    station_code,
    station_name,
    property_id,
    property_name,
    unit,
    run_id,
    scenario_code,
    time_step,
    year,
    month,
    n_values,
    sum_value,
    mean_value,
    min_value,
    max_value
   FROM v_values_monthly
  WHERE (property_id IN ( SELECT observed_properties.property_id
           FROM ref.observed_properties
          WHERE upper(observed_properties.standard_name) = ANY (ARRAY['INFLOW_M3'::text, 'RESTITUTION_M3'::text])));

CREATE OR REPLACE VIEW "public"."v_values_precipitation_annual" AS
SELECT station_id,
    station_code,
    station_name,
    property_id,
    property_name,
    unit,
    run_id,
    scenario_code,
    time_step,
    year,
    n_values,
    sum_value,
    mean_value,
    min_value,
    max_value
   FROM v_values_annual
  WHERE (property_id IN ( SELECT observed_properties.property_id
           FROM ref.observed_properties
          WHERE upper(observed_properties.standard_name) = 'PRECIPITATION'::text));

CREATE OR REPLACE VIEW "public"."v_values_precipitation_monthly" AS
SELECT station_id,
    station_code,
    station_name,
    property_id,
    property_name,
    unit,
    run_id,
    scenario_code,
    time_step,
    year,
    month,
    n_values,
    sum_value,
    mean_value,
    min_value,
    max_value
   FROM v_values_monthly
  WHERE (property_id IN ( SELECT observed_properties.property_id
           FROM ref.observed_properties
          WHERE upper(observed_properties.standard_name) = 'PRECIPITATION'::text));

CREATE OR REPLACE VIEW "public"."v_values_precipitation_obs" AS
SELECT ts_id,
    station_id,
    station_code,
    station_name,
    type_station,
    station_type_code,
    commune_code,
    altitude_m,
    catchment_id,
    catchment_name,
    dam_name,
    property_id,
    property_name,
    unit,
    standard_name,
    run_id,
    scenario_code,
    scenario_name,
    is_observed,
    source_type,
    time_step,
    datetime,
    value,
    quality_flag
   FROM v_values_measurements
  WHERE (property_id IN ( SELECT observed_properties.property_id
           FROM ref.observed_properties
          WHERE upper(observed_properties.standard_name) = 'PRECIPITATION'::text)) AND is_observed = true AND source_type = 'observed'::text;

CREATE OR REPLACE VIEW "public"."v_values_sediment_load_annual" AS
SELECT station_id,
    station_code,
    station_name,
    property_id,
    property_name,
    unit,
    run_id,
    scenario_code,
    time_step,
    year,
    n_values,
    sum_value,
    mean_value,
    min_value,
    max_value
   FROM v_values_annual
  WHERE (property_id IN ( SELECT observed_properties.property_id
           FROM ref.observed_properties
          WHERE upper(observed_properties.standard_name) = 'SEDIMENT_LOAD'::text));

CREATE OR REPLACE VIEW "public"."v_values_sediment_load_monthly" AS
SELECT station_id,
    station_code,
    station_name,
    property_id,
    property_name,
    unit,
    run_id,
    scenario_code,
    time_step,
    year,
    month,
    n_values,
    sum_value,
    mean_value,
    min_value,
    max_value
   FROM v_values_monthly
  WHERE (property_id IN ( SELECT observed_properties.property_id
           FROM ref.observed_properties
          WHERE upper(observed_properties.standard_name) = 'SEDIMENT_LOAD'::text));

CREATE OR REPLACE VIEW "public"."v_values_sediment_load_obs" AS
SELECT ts_id,
    station_id,
    station_code,
    station_name,
    type_station,
    station_type_code,
    commune_code,
    altitude_m,
    catchment_id,
    catchment_name,
    dam_name,
    property_id,
    property_name,
    unit,
    standard_name,
    run_id,
    scenario_code,
    scenario_name,
    is_observed,
    source_type,
    time_step,
    datetime,
    value,
    quality_flag
   FROM v_values_measurements
  WHERE (property_id IN ( SELECT observed_properties.property_id
           FROM ref.observed_properties
          WHERE upper(observed_properties.standard_name) = 'SEDIMENT_LOAD'::text)) AND is_observed = true AND source_type = 'observed'::text;

CREATE OR REPLACE VIEW "public"."v_values_streamflow_annual" AS
SELECT station_id,
    station_code,
    station_name,
    property_id,
    property_name,
    unit,
    run_id,
    scenario_code,
    time_step,
    year,
    n_values,
    sum_value,
    mean_value,
    min_value,
    max_value
   FROM v_values_annual
  WHERE (property_id IN ( SELECT observed_properties.property_id
           FROM ref.observed_properties
          WHERE upper(observed_properties.standard_name) = 'STREAMFLOW'::text));

CREATE OR REPLACE VIEW "public"."v_values_streamflow_monthly" AS
SELECT station_id,
    station_code,
    station_name,
    property_id,
    property_name,
    unit,
    run_id,
    scenario_code,
    time_step,
    year,
    month,
    n_values,
    sum_value,
    mean_value,
    min_value,
    max_value
   FROM v_values_monthly
  WHERE (property_id IN ( SELECT observed_properties.property_id
           FROM ref.observed_properties
          WHERE upper(observed_properties.standard_name) = 'STREAMFLOW'::text));

CREATE OR REPLACE VIEW "public"."v_values_streamflow_obs" AS
SELECT ts_id,
    station_id,
    station_code,
    station_name,
    type_station,
    station_type_code,
    commune_code,
    altitude_m,
    catchment_id,
    catchment_name,
    dam_name,
    property_id,
    property_name,
    unit,
    standard_name,
    run_id,
    scenario_code,
    scenario_name,
    is_observed,
    source_type,
    time_step,
    datetime,
    value,
    quality_flag
   FROM v_values_measurements
  WHERE (property_id IN ( SELECT observed_properties.property_id
           FROM ref.observed_properties
          WHERE upper(observed_properties.standard_name) = 'STREAMFLOW'::text)) AND is_observed = true AND source_type = 'observed'::text;

CREATE OR REPLACE VIEW "public"."v_values_temperature_all_obs" AS
SELECT ts_id,
    station_id,
    station_code,
    station_name,
    type_station,
    station_type_code,
    commune_code,
    altitude_m,
    catchment_id,
    catchment_name,
    dam_name,
    property_id,
    property_name,
    unit,
    standard_name,
    run_id,
    scenario_code,
    scenario_name,
    is_observed,
    source_type,
    time_step,
    datetime,
    value,
    quality_flag
   FROM v_values_measurements
  WHERE (property_id IN ( SELECT observed_properties.property_id
           FROM ref.observed_properties
          WHERE upper(observed_properties.standard_name) = ANY (ARRAY['TMAX'::text, 'TMIN'::text, 'TMEAN'::text]))) AND is_observed = true AND source_type = 'observed'::text;

CREATE OR REPLACE VIEW "public"."v_values_temperature_max_annual" AS
SELECT station_id,
    station_code,
    station_name,
    property_id,
    property_name,
    unit,
    run_id,
    scenario_code,
    time_step,
    year,
    n_values,
    sum_value,
    mean_value,
    min_value,
    max_value
   FROM v_values_annual
  WHERE (property_id IN ( SELECT observed_properties.property_id
           FROM ref.observed_properties
          WHERE upper(observed_properties.standard_name) = 'TMAX'::text));

CREATE OR REPLACE VIEW "public"."v_values_temperature_max_monthly" AS
SELECT station_id,
    station_code,
    station_name,
    property_id,
    property_name,
    unit,
    run_id,
    scenario_code,
    time_step,
    year,
    month,
    n_values,
    sum_value,
    mean_value,
    min_value,
    max_value
   FROM v_values_monthly
  WHERE (property_id IN ( SELECT observed_properties.property_id
           FROM ref.observed_properties
          WHERE upper(observed_properties.standard_name) = 'TMAX'::text));

CREATE OR REPLACE VIEW "public"."v_values_temperature_max_obs" AS
SELECT ts_id,
    station_id,
    station_code,
    station_name,
    type_station,
    station_type_code,
    commune_code,
    altitude_m,
    catchment_id,
    catchment_name,
    dam_name,
    property_id,
    property_name,
    unit,
    standard_name,
    run_id,
    scenario_code,
    scenario_name,
    is_observed,
    source_type,
    time_step,
    datetime,
    value,
    quality_flag
   FROM v_values_measurements
  WHERE (property_id IN ( SELECT observed_properties.property_id
           FROM ref.observed_properties
          WHERE upper(observed_properties.standard_name) = 'TMAX'::text)) AND is_observed = true AND source_type = 'observed'::text;

CREATE OR REPLACE VIEW "public"."v_values_temperature_mean_annual" AS
SELECT station_id,
    station_code,
    station_name,
    property_id,
    property_name,
    unit,
    run_id,
    scenario_code,
    time_step,
    year,
    n_values,
    sum_value,
    mean_value,
    min_value,
    max_value
   FROM v_values_annual
  WHERE (property_id IN ( SELECT observed_properties.property_id
           FROM ref.observed_properties
          WHERE upper(observed_properties.standard_name) = 'TMEAN'::text));

CREATE OR REPLACE VIEW "public"."v_values_temperature_mean_monthly" AS
SELECT station_id,
    station_code,
    station_name,
    property_id,
    property_name,
    unit,
    run_id,
    scenario_code,
    time_step,
    year,
    month,
    n_values,
    sum_value,
    mean_value,
    min_value,
    max_value
   FROM v_values_monthly
  WHERE (property_id IN ( SELECT observed_properties.property_id
           FROM ref.observed_properties
          WHERE upper(observed_properties.standard_name) = 'TMEAN'::text));

CREATE OR REPLACE VIEW "public"."v_values_temperature_mean_obs" AS
SELECT ts_id,
    station_id,
    station_code,
    station_name,
    type_station,
    station_type_code,
    commune_code,
    altitude_m,
    catchment_id,
    catchment_name,
    dam_name,
    property_id,
    property_name,
    unit,
    standard_name,
    run_id,
    scenario_code,
    scenario_name,
    is_observed,
    source_type,
    time_step,
    datetime,
    value,
    quality_flag
   FROM v_values_measurements
  WHERE (property_id IN ( SELECT observed_properties.property_id
           FROM ref.observed_properties
          WHERE upper(observed_properties.standard_name) = 'TMEAN'::text)) AND is_observed = true AND source_type = 'observed'::text;

CREATE OR REPLACE VIEW "public"."v_values_temperature_min_annual" AS
SELECT station_id,
    station_code,
    station_name,
    property_id,
    property_name,
    unit,
    run_id,
    scenario_code,
    time_step,
    year,
    n_values,
    sum_value,
    mean_value,
    min_value,
    max_value
   FROM v_values_annual
  WHERE (property_id IN ( SELECT observed_properties.property_id
           FROM ref.observed_properties
          WHERE upper(observed_properties.standard_name) = 'TMIN'::text));

CREATE OR REPLACE VIEW "public"."v_values_temperature_min_monthly" AS
SELECT station_id,
    station_code,
    station_name,
    property_id,
    property_name,
    unit,
    run_id,
    scenario_code,
    time_step,
    year,
    month,
    n_values,
    sum_value,
    mean_value,
    min_value,
    max_value
   FROM v_values_monthly
  WHERE (property_id IN ( SELECT observed_properties.property_id
           FROM ref.observed_properties
          WHERE upper(observed_properties.standard_name) = 'TMIN'::text));

CREATE OR REPLACE VIEW "public"."v_values_temperature_min_obs" AS
SELECT ts_id,
    station_id,
    station_code,
    station_name,
    type_station,
    station_type_code,
    commune_code,
    altitude_m,
    catchment_id,
    catchment_name,
    dam_name,
    property_id,
    property_name,
    unit,
    standard_name,
    run_id,
    scenario_code,
    scenario_name,
    is_observed,
    source_type,
    time_step,
    datetime,
    value,
    quality_flag
   FROM v_values_measurements
  WHERE (property_id IN ( SELECT observed_properties.property_id
           FROM ref.observed_properties
          WHERE upper(observed_properties.standard_name) = 'TMIN'::text)) AND is_observed = true AND source_type = 'observed'::text;

CREATE OR REPLACE VIEW "public"."v_values_wind_speed_annual" AS
SELECT station_id,
    station_code,
    station_name,
    property_id,
    property_name,
    unit,
    run_id,
    scenario_code,
    time_step,
    year,
    n_values,
    sum_value,
    mean_value,
    min_value,
    max_value
   FROM v_values_annual
  WHERE (property_id IN ( SELECT observed_properties.property_id
           FROM ref.observed_properties
          WHERE upper(observed_properties.standard_name) = 'WIND_SPEED'::text));

CREATE OR REPLACE VIEW "public"."v_values_wind_speed_monthly" AS
SELECT station_id,
    station_code,
    station_name,
    property_id,
    property_name,
    unit,
    run_id,
    scenario_code,
    time_step,
    year,
    month,
    n_values,
    sum_value,
    mean_value,
    min_value,
    max_value
   FROM v_values_monthly
  WHERE (property_id IN ( SELECT observed_properties.property_id
           FROM ref.observed_properties
          WHERE upper(observed_properties.standard_name) = 'WIND_SPEED'::text));

CREATE OR REPLACE VIEW "public"."v_values_wind_speed_obs" AS
SELECT ts_id,
    station_id,
    station_code,
    station_name,
    type_station,
    station_type_code,
    commune_code,
    altitude_m,
    catchment_id,
    catchment_name,
    dam_name,
    property_id,
    property_name,
    unit,
    standard_name,
    run_id,
    scenario_code,
    scenario_name,
    is_observed,
    source_type,
    time_step,
    datetime,
    value,
    quality_flag
   FROM v_values_measurements
  WHERE (property_id IN ( SELECT observed_properties.property_id
           FROM ref.observed_properties
          WHERE upper(observed_properties.standard_name) = 'WIND_SPEED'::text)) AND is_observed = true AND source_type = 'observed'::text;

CREATE MATERIALIZED VIEW "api"."mv_dashboard_catchment_counts" AS
SELECT catchment_id,
    catchment_name,
    n_reservoirs,
    n_subbasins,
    n_reaches,
    n_stations,
    n_timeseries,
    n_measurements
   FROM api.v_dashboard_catchment_counts
WITH NO DATA;

CREATE MATERIALIZED VIEW "api"."mv_dashboard_reservoir_counts" AS
SELECT reservoir_id,
    reservoir_code,
    reservoir_name,
    catchment_id,
    catchment_name,
    reach_id,
    n_bathy_points
   FROM api.v_dashboard_reservoir_counts
WITH NO DATA;

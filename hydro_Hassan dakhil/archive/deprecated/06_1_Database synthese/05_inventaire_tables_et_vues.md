# Inventaire des tables et vues

## public
### Tables
- module_properties (10 lignes, mixte)
- property_module_override (0 lignes, mixte)
- spatial_ref_sys (8500 lignes, mixte)
- users (2 lignes, référentielle)
### Vues
- catchments
- communes
- geography_columns
- geometry_columns
- landcover
- landcover_classes
- landcover_periods
- measurements
- model_runs
- observed_properties
- reaches
- reservoir_bathymetry
- reservoirs
- rivers
- stations
- subbasins
- timeseries
- v_catchments_geo
- v_map_station
- v_measurements_full
- v_property_agg_rule
- v_property_catalog
- v_property_catalog_final
- v_property_module
- v_reaches_geo
- v_reservoirs_geo
- v_stations_geo
- v_stats_bathymetry
- v_stats_bathymetry_global
- v_stats_evaporation
- v_stats_evaporation_global
- v_stats_humidity
- v_stats_humidity_global
- v_stats_lachers
- v_stats_lachers_global
- v_stats_precipitation
- v_stats_precipitation_global
- v_stats_property_station_timestep
- v_stats_property_timestep
- v_stats_sediment_load
- v_stats_sediment_load_global
- v_stats_streamflow
- v_stats_streamflow_global
- v_stats_temperature_all
- v_stats_temperature_all_global
- v_stats_temperature_max
- v_stats_temperature_max_global
- v_stats_temperature_mean
- v_stats_temperature_mean_global
- v_stats_temperature_min
- v_stats_temperature_min_global
- v_stats_wind_speed
- v_stats_wind_speed_global
- v_subbasins_geo
- v_ts_catalog
- v_ts_catalog_enriched
- v_values_annual
- v_values_bathymetry
- v_values_evaporation_annual
- v_values_evaporation_monthly
- v_values_evaporation_obs
- v_values_humidity_annual
- v_values_humidity_monthly
- v_values_humidity_obs
- v_values_lachers_annual
- v_values_lachers_monthly
- v_values_lachers_obs
- v_values_measurements
- v_values_monthly
- v_values_precipitation_annual
- v_values_precipitation_monthly
- v_values_precipitation_obs
- v_values_sediment_load_annual
- v_values_sediment_load_monthly
- v_values_sediment_load_obs
- v_values_streamflow_annual
- v_values_streamflow_monthly
- v_values_streamflow_obs
- v_values_temperature_all_obs
- v_values_temperature_max_annual
- v_values_temperature_max_monthly
- v_values_temperature_max_obs
- v_values_temperature_mean_annual
- v_values_temperature_mean_monthly
- v_values_temperature_mean_obs
- v_values_temperature_min_annual
- v_values_temperature_min_monthly
- v_values_temperature_min_obs
- v_values_wind_speed_annual
- v_values_wind_speed_monthly
- v_values_wind_speed_obs

## access
### Tables
- import_runs (2 lignes, mixte)
- rch_results (345510 lignes, mixte)
- sub_results (345510 lignes, mixte)
- variable_dictionary (0 lignes, mixte)

## api
### Vues
- v_catalog_properties
- v_catalog_scenarios
- v_catalog_series
- v_catalog_stations
- v_compare_monthly
- v_dashboard_catchment_counts
- v_dashboard_national_counts
- v_dashboard_reservoir_counts
- v_erosion_subbasins_annual
- v_map_catchments_annual
- v_map_stations_latest
- v_measurements_annual
- v_measurements_annual_agg
- v_measurements_daily
- v_measurements_latest
- v_measurements_monthly
- v_measurements_monthly_agg
- v_qc_property_domain_tovalidate
- v_series_stats
- v_timeseries_enriched
### Vues matérialisées
- mv_dashboard_catchment_counts
- mv_dashboard_reservoir_counts

## audit
### Tables
- qc_issues (0 lignes, métier/transactionnelle)
- qc_runs (0 lignes, métier/transactionnelle)
### Vues
- v_qc_measurements_duplicates
- v_qc_measurements_orphans
- v_qc_null_geometry
- v_qc_timeseries_duplicates
- v_qc_timeseries_without_measurements

## auth
### Tables
- audit_log (0 lignes, métier/transactionnelle)
- permissions (0 lignes, référentielle)
- role_permissions (0 lignes, mixte)
- roles (0 lignes, référentielle)
- user_roles (0 lignes, mixte)
- users (0 lignes, référentielle)

## core
### Tables
- catchments (1 lignes, référentielle)
- data_batches (1 lignes, mixte)
- measurement_batches (1036530 lignes, mixte)
- measurements (1386240 lignes, métier/transactionnelle)
- model_runs (2 lignes, métier/transactionnelle)
- reaches (0 lignes, référentielle)
- reservoir_bathymetry (4401 lignes, métier/transactionnelle)
- reservoirs (12 lignes, référentielle)
- rivers (0 lignes, référentielle)
- station_reach_map (15 lignes, mixte)
- stations (102 lignes, référentielle)
- subbasin_metrics_annual (0 lignes, métier/transactionnelle)
- subbasins (0 lignes, référentielle)
- swat_entity_map (0 lignes, mixte)
- timeseries (155 lignes, métier/transactionnelle)

## geo
### Tables
- landcover (0 lignes, mixte)

## gis
### Tables
- meteo_stations (5 lignes, mixte)
- reach_shapes (33 lignes, mixte)
- reach_shapes_backup_20260422_144537 (33 lignes, mixte)
- subbasin_shapes (33 lignes, mixte)

## old_hd
### Tables
- adm_communes_abhgzr (N/A lignes, mixte)
- barrages_abhgzr (N/A lignes, mixte)
- bassin_abhgzr (N/A lignes, mixte)
- bathymetries_barrages_abhgzr (N/A lignes, mixte)
- mesures_debits_jr (N/A lignes, mixte)
- mesures_evaporation_m (N/A lignes, mixte)
- mesures_humidite_relative_m (N/A lignes, mixte)
- mesures_lachers_barrages (N/A lignes, mixte)
- mesures_precipitations_jr (N/A lignes, mixte)
- mesures_temperature_jr_pn (N/A lignes, mixte)
- mesures_temperature_m (N/A lignes, mixte)
- mesures_vitesse_vent_m (N/A lignes, mixte)
- stations_abhgzr (N/A lignes, mixte)

## pg_temp_1

## pg_temp_19

## pg_temp_20

## pg_temp_21

## pg_temp_23

## pg_temp_39

## pg_temp_57

## pg_temp_59

## pg_temp_60

## pg_temp_78

## pg_temp_79

## pg_temp_97

## pg_temp_98

## ref
### Tables
- communes (86 lignes, référentielle)
- landcover_classes (0 lignes, référentielle)
- landcover_periods (0 lignes, référentielle)
- observed_properties (13 lignes, référentielle)
- property_domain_membership (10 lignes, mixte)
- property_domains (3 lignes, référentielle)

## staging
### Tables
- limite_raw (33 lignes, mixte)
- migration_batches (3 lignes, mixte)
- migration_events (42 lignes, mixte)
- norm_catchments (3 lignes, mixte)
- norm_communes (258 lignes, mixte)
- norm_measurements (1049166 lignes, mixte)
- norm_reservoir_bathymetry (13203 lignes, mixte)
- norm_reservoirs (36 lignes, mixte)
- norm_stations (105 lignes, mixte)
- raw_adm_communes_abhgzr (258 lignes, mixte)
- raw_barrages_abhgzr (36 lignes, mixte)
- raw_bassin_abhgzr (3 lignes, mixte)
- raw_bathymetries_barrages_abhgzr (13203 lignes, mixte)
- raw_mesures_debits_jr (235587 lignes, mixte)
- raw_mesures_evaporation_m (6768 lignes, mixte)
- raw_mesures_humidite_relative_m (3060 lignes, mixte)
- raw_mesures_lachers_barrages (59583 lignes, mixte)
- raw_mesures_precipitations_jr (328821 lignes, mixte)
- raw_mesures_temperature_jr_pn (130392 lignes, mixte)
- raw_mesures_temperature_m (6084 lignes, mixte)
- raw_mesures_vitesse_vent_m (1368 lignes, mixte)
- raw_stations_abhgzr (105 lignes, mixte)
- reseau_hydro_import_raw (33 lignes, mixte)
- reseau_hydrologie_raw (33 lignes, mixte)
- station_meteo_raw (5 lignes, mixte)
- swat_rch_norm (345510 lignes, mixte)
- swat_rch_raw (345510 lignes, mixte)
- swat_sub_norm (345510 lignes, mixte)
- swat_sub_raw (345510 lignes, mixte)

## Tables vides
- access.variable_dictionary
- audit.qc_issues
- audit.qc_runs
- auth.audit_log
- auth.permissions
- auth.role_permissions
- auth.roles
- auth.user_roles
- auth.users
- core.reaches
- core.rivers
- core.subbasin_metrics_annual
- core.subbasins
- core.swat_entity_map
- geo.landcover
- public.property_module_override
- ref.landcover_classes
- ref.landcover_periods
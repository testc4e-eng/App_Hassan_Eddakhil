# Architecture de la base

## Schémas et rôle métier

### public
Couche d’exposition et de vues métier plus tables techniques partagées.
- Tables: `module_properties`, `property_module_override`, `spatial_ref_sys`, `users`
- Vues: `catchments`, `communes`, `geography_columns`, `geometry_columns`, `landcover`, `landcover_classes`, `landcover_periods`, `measurements`, `model_runs`, `observed_properties`, `reaches`, `reservoir_bathymetry`, `reservoirs`, `rivers`, `stations`, `subbasins`, `timeseries`, `v_catchments_geo`, `v_map_station`, `v_measurements_full`, `v_property_agg_rule`, `v_property_catalog`, `v_property_catalog_final`, `v_property_module`, `v_reaches_geo`, `v_reservoirs_geo`, `v_stations_geo`, `v_stats_bathymetry`, `v_stats_bathymetry_global`, `v_stats_evaporation`, `v_stats_evaporation_global`, `v_stats_humidity`, `v_stats_humidity_global`, `v_stats_lachers`, `v_stats_lachers_global`, `v_stats_precipitation`, `v_stats_precipitation_global`, `v_stats_property_station_timestep`, `v_stats_property_timestep`, `v_stats_sediment_load`, `v_stats_sediment_load_global`, `v_stats_streamflow`, `v_stats_streamflow_global`, `v_stats_temperature_all`, `v_stats_temperature_all_global`, `v_stats_temperature_max`, `v_stats_temperature_max_global`, `v_stats_temperature_mean`, `v_stats_temperature_mean_global`, `v_stats_temperature_min`, `v_stats_temperature_min_global`, `v_stats_wind_speed`, `v_stats_wind_speed_global`, `v_subbasins_geo`, `v_ts_catalog`, `v_ts_catalog_enriched`, `v_values_annual`, `v_values_bathymetry`, `v_values_evaporation_annual`, `v_values_evaporation_monthly`, `v_values_evaporation_obs`, `v_values_humidity_annual`, `v_values_humidity_monthly`, `v_values_humidity_obs`, `v_values_lachers_annual`, `v_values_lachers_monthly`, `v_values_lachers_obs`, `v_values_measurements`, `v_values_monthly`, `v_values_precipitation_annual`, `v_values_precipitation_monthly`, `v_values_precipitation_obs`, `v_values_sediment_load_annual`, `v_values_sediment_load_monthly`, `v_values_sediment_load_obs`, `v_values_streamflow_annual`, `v_values_streamflow_monthly`, `v_values_streamflow_obs`, `v_values_temperature_all_obs`, `v_values_temperature_max_annual`, `v_values_temperature_max_monthly`, `v_values_temperature_max_obs`, `v_values_temperature_mean_annual`, `v_values_temperature_mean_monthly`, `v_values_temperature_mean_obs`, `v_values_temperature_min_annual`, `v_values_temperature_min_monthly`, `v_values_temperature_min_obs`, `v_values_wind_speed_annual`, `v_values_wind_speed_monthly`, `v_values_wind_speed_obs`

### access
Schéma fonctionnel.
- Tables: `import_runs`, `rch_results`, `sub_results`, `variable_dictionary`

### api
Vues d’API et agrégations pour consommation applicative.
- Vues: `v_catalog_properties`, `v_catalog_scenarios`, `v_catalog_series`, `v_catalog_stations`, `v_compare_monthly`, `v_dashboard_catchment_counts`, `v_dashboard_national_counts`, `v_dashboard_reservoir_counts`, `v_erosion_subbasins_annual`, `v_map_catchments_annual`, `v_map_stations_latest`, `v_measurements_annual`, `v_measurements_annual_agg`, `v_measurements_daily`, `v_measurements_latest`, `v_measurements_monthly`, `v_measurements_monthly_agg`, `v_qc_property_domain_tovalidate`, `v_series_stats`, `v_timeseries_enriched`
- Vues matérialisées: `mv_dashboard_catchment_counts`, `mv_dashboard_reservoir_counts`

### audit
Contrôle qualité et traçabilité des contrôles.
- Tables: `qc_issues`, `qc_runs`
- Vues: `v_qc_measurements_duplicates`, `v_qc_measurements_orphans`, `v_qc_null_geometry`, `v_qc_timeseries_duplicates`, `v_qc_timeseries_without_measurements`

### auth
Gestion des accès, rôles et journalisation.
- Tables: `audit_log`, `permissions`, `role_permissions`, `roles`, `user_roles`, `users`

### core
Noyau hydrologique et temporel.
- Tables: `catchments`, `data_batches`, `measurement_batches`, `measurements`, `model_runs`, `reaches`, `reservoir_bathymetry`, `reservoirs`, `rivers`, `station_reach_map`, `stations`, `subbasin_metrics_annual`, `subbasins`, `swat_entity_map`, `timeseries`

### geo
Objets géographiques et occupation du sol.
- Tables: `landcover`

### gis
Schéma fonctionnel.
- Tables: `meteo_stations`, `reach_shapes`, `reach_shapes_backup_20260422_144537`, `subbasin_shapes`

### old_hd
Couche FDW vers l’ancien socle HD.
- Tables: `adm_communes_abhgzr`, `barrages_abhgzr`, `bassin_abhgzr`, `bathymetries_barrages_abhgzr`, `mesures_debits_jr`, `mesures_evaporation_m`, `mesures_humidite_relative_m`, `mesures_lachers_barrages`, `mesures_precipitations_jr`, `mesures_temperature_jr_pn`, `mesures_temperature_m`, `mesures_vitesse_vent_m`, `stations_abhgzr`

### pg_temp_1
Schéma fonctionnel.

### pg_temp_19
Schéma fonctionnel.

### pg_temp_20
Schéma fonctionnel.

### pg_temp_21
Schéma fonctionnel.

### pg_temp_23
Schéma fonctionnel.

### pg_temp_39
Schéma fonctionnel.

### pg_temp_57
Schéma fonctionnel.

### pg_temp_59
Schéma fonctionnel.

### pg_temp_60
Schéma fonctionnel.

### pg_temp_78
Schéma fonctionnel.

### pg_temp_79
Schéma fonctionnel.

### pg_temp_97
Schéma fonctionnel.

### pg_temp_98
Schéma fonctionnel.

### ref
Référentiels et dictionnaires de domaine.
- Tables: `communes`, `landcover_classes`, `landcover_periods`, `observed_properties`, `property_domain_membership`, `property_domains`

### staging
Schéma fonctionnel.
- Tables: `limite_raw`, `migration_batches`, `migration_events`, `norm_catchments`, `norm_communes`, `norm_measurements`, `norm_reservoir_bathymetry`, `norm_reservoirs`, `norm_stations`, `raw_adm_communes_abhgzr`, `raw_barrages_abhgzr`, `raw_bassin_abhgzr`, `raw_bathymetries_barrages_abhgzr`, `raw_mesures_debits_jr`, `raw_mesures_evaporation_m`, `raw_mesures_humidite_relative_m`, `raw_mesures_lachers_barrages`, `raw_mesures_precipitations_jr`, `raw_mesures_temperature_jr_pn`, `raw_mesures_temperature_m`, `raw_mesures_vitesse_vent_m`, `raw_stations_abhgzr`, `reseau_hydro_import_raw`, `reseau_hydrologie_raw`, `station_meteo_raw`, `swat_rch_norm`, `swat_rch_raw`, `swat_sub_norm`, `swat_sub_raw`

## Chaîne fonctionnelle probable

1. Les référentiels du schéma `ref` décrivent les domaines métiers et les classes de données.
2. Le noyau `core` porte les objets hydrologiques, temporels et transactionnels.
3. Le schéma `geo` ajoute les couches géographiques et les données d'occupation du sol.
4. Le schéma `audit` calcule les contrôles qualité et les anomalies.
5. Le schéma `api` expose les vues agrégées et enrichies pour le front.
6. Le schéma `old_hd` conserve une compatibilité de lecture avec l'ancien modèle via FDW.
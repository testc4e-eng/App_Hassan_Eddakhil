# AUDIT GLOBAL BASE DE DONNÉES — `hydro_hd`

Rapport généré le **2026-08-10** à **11:48**. Audit effectué en **lecture seule**.

Aucune suppression, aucune modification de schéma, aucune migration et aucune écriture SQL n’ont été réalisées.

## 1. Base auditée

- BASE AUDITÉE : `hydro_hd`
- HOST configuré : `host.docker.internal`
- PORT configuré : `5432`
- USER : `postgres`
- VERSION POSTGRESQL : `PostgreSQL 17.8 on x86_64-windows, compiled by msvc-19.44.35222, 64-bit`
- POSTGIS : `POSTGIS="3.5.3 3.5.3" [EXTENSION] PGSQL="170" GEOS="3.13.1-CAPI-1.19.2" PROJ="8.2.1 NETWORK_ENABLED=OFF URL_ENDPOINT=https://cdn.proj.org USER_WRITABLE_DIRECTORY=C:\Windows\ServiceProfiles\NetworkService\AppData\Local/proj DATABASE_PATH=C:\Program Files\PostgreSQL\17\share\contrib\postgis-3.5\proj\proj.db" (compiled against PROJ 8.2.1) LIBXML="2.12.5" LIBJSON="0.12" LIBPROTOBUF="1.2.1" WAGYU="0.5.0 (Internal)"`
- TAILLE TOTALE BASE : `5379 MB` (5640410803 octets)
- NOTE DE CONNEXION : audit SQL exécuté sur `localhost:5432` car `host.docker.internal:5432` refuse la session shell locale via `pg_hba`; cela pointe vers la même instance PostgreSQL locale utilisée par la plateforme.

## 2. Synthèse chiffrée

- Nombre schémas locaux inventoriés : **11**
- Nombre tables : **89**
- Nombre vues : **116**
- Nombre matviews : **3**
- Nombre tables vides : **23**
- Nombre tables potentiellement inutilisées : **44**
- Nombre groupes de tables redondantes : **7**
- Nombre groupes doublons : **1522121**
- Nombre lignes dupliquées : **5065051**
- Nombre données orphelines détectées : **0**
- Nombre géométries invalides : **445**
- Nombre schémas actifs : **4**
- Nombre schémas partiellement utilisés : **4**
- Nombre schémas suspects : **2**

## 3. Inventaire des schémas

Le comptage principal couvre les schémas locaux contenant des tables, vues ou matviews. Le schéma FDW legacy `old_hd` est documenté séparément car il contient des **foreign tables** et non des tables locales auditées.

| Schéma | Tables | Vues | MatViews | Taille | Lignes approx. | Rôle apparent | Statut |
|---|---:|---:|---:|---:|---:|---|---|
| access | 7 | 0 | 0 | 4240 MB | 7 361 808 | Import SWAT / tables sources runtime et fallback | ACTIF PARTIELLEMENT |
| api | 0 | 20 | 3 | 56 kB | n/d | Couche de vues d?API | ACTIF |
| audit | 11 | 5 | 0 | 274 MB | 691 046 | Sauvegardes et contr?le qualit? | LEGACY POTENTIEL |
| auth | 6 | 0 | 0 | 32 kB | n/d | Authentification et autorisations | À VÉRIFIER |
| core | 16 | 0 | 0 | 419 MB | 4 810 510 | Donn?es m?tier principales | ACTIF |
| geo | 1 | 0 | 0 | 8192 bytes | n/d | Donn?es g?ographiques th?matiques | LEGACY POTENTIEL |
| gis | 4 | 0 | 0 | 3680 kB | 36 | R?f?rentiel g?ospatial op?rationnel | ACTIF PARTIELLEMENT |
| hydro | 4 | 0 | 0 | 160 kB | 3 | Compatibilit? / objets hydro sp?cialis?s | ACTIF PARTIELLEMENT |
| public | 4 | 91 | 0 | 7184 kB | 8 406 | Vues legacy/exposition SQL | ACTIF PARTIELLEMENT |
| ref | 6 | 0 | 0 | 840 kB | 81 | R?f?rentiels m?tier | ACTIF |
| staging | 30 | 0 | 0 | 424 MB | 2 845 436 | Staging / migration / import | STAGING |

Schéma externe complémentaire :

| Schéma | Type | Objets | Usage | Statut |
|---|---|---:|---|---|
| old_hd | FDW / foreign tables | 13 | dépendance historique `old_hd_srv`, aucune référence runtime active détectée dans le backend/frontend courant | LEGACY POTENTIEL |

## 4. Inventaire complet des tables

| Schéma | Table | Lignes | Taille totale | PK | FK | Indexes | Cols | Dernière activité | Réf code ? | Réf vue ? | Statut |
|---|---|---:|---:|---|---|---|---:|---|---|---|---|
| access | hru_results | 65 209 | 26 MB | — | 0 | 1 | 34 | 2026-07-27T03:58:08.763462-07:00 | OUI (1) | OUI (1) | ACTIF PARTIELLEMENT |
| access | import_runs | 90 | 72 kB | — | 0 | 0 | 16 | 2026-07-27T03:59:45.907270-07:00 | OUI (3) | NON (0) | ACTIF PARTIELLEMENT |
| access | rch_results | 3 637 835 | 2432 MB | — | 0 | 0 | 67 | 2026-07-27T04:24:32.853924-07:00 | OUI (12) | OUI (1) | ACTIF PARTIELLEMENT |
| access | scenario_metadata | 8 248 | 3368 kB | — | 0 | 0 | 27 | 2026-07-27T04:00:48.434610-07:00 | OUI (2) | NON (0) | ACTIF PARTIELLEMENT |
| access | sub_results | 3 637 835 | 1774 MB | — | 0 | 1 | 42 | 2026-07-27T06:25:15.112702-07:00 | OUI (11) | OUI (1) | ACTIF PARTIELLEMENT |
| access | variable_dictionary | 0 | 8192 bytes | — | 0 | 0 | 19 | n/d | OUI (3) | NON (0) | ACTIF PARTIELLEMENT |
| access | weather_inputs | 13 900 | 5672 kB | — | 0 | 0 | 33 | 2026-07-27T04:00:49.011815-07:00 | NON (0) | OUI (1) | ACTIF PARTIELLEMENT |
| audit | gis_reach_shapes_backup_2026 | 33 | 680 kB | — | 0 | 0 | 9 | n/d | NON (0) | NON (0) | LEGACY POTENTIEL |
| audit | gis_subbasin_shapes_backup_2026 | 33 | 960 kB | — | 0 | 0 | 8 | n/d | NON (0) | NON (0) | LEGACY POTENTIEL |
| audit | nv_limite | 19 | 2136 kB | ogc_fid | 0 | 2 | 20 | n/d | NON (0) | NON (0) | LEGACY POTENTIEL |
| audit | nv_stream | 19 | 840 kB | ogc_fid | 0 | 2 | 14 | n/d | NON (0) | NON (0) | LEGACY POTENTIEL |
| audit | qc_issues | 0 | 8192 bytes | — | 0 | 0 | 8 | n/d | NON (0) | NON (0) | LEGACY POTENTIEL |
| audit | qc_runs | 0 | 8192 bytes | — | 0 | 0 | 4 | n/d | NON (0) | NON (0) | LEGACY POTENTIEL |
| audit | station_reach_map_backup_2026 | 0 | 8192 bytes | — | 0 | 0 | 14 | n/d | NON (0) | NON (0) | LEGACY POTENTIEL |
| audit | station_subbasin_map_backup_2026 | 0 | 8192 bytes | — | 0 | 0 | 16 | n/d | NON (0) | NON (0) | LEGACY POTENTIEL |
| audit | swat_entity_map_backup_2026 | 38 | 16 kB | — | 0 | 0 | 10 | n/d | NON (0) | NON (0) | LEGACY POTENTIEL |
| audit | swat_output_archive_rch | 345 510 | 169 MB | — | 0 | 0 | 67 | 2026-07-27T04:04:27.394986-07:00 | NON (0) | NON (0) | LEGACY POTENTIEL |
| audit | swat_output_archive_sub | 345 510 | 100 MB | — | 0 | 0 | 42 | 2026-07-27T04:03:01.616095-07:00 | NON (0) | NON (0) | LEGACY POTENTIEL |
| auth | audit_log | 0 | 8192 bytes | — | 0 | 0 | 7 | n/d | NON (0) | NON (0) | NON UTILISÉ POTENTIEL |
| auth | permissions | 0 | 8192 bytes | — | 0 | 0 | 3 | n/d | NON (0) | NON (0) | NON UTILISÉ POTENTIEL |
| auth | role_permissions | 0 | 0 bytes | — | 0 | 0 | 2 | n/d | NON (0) | NON (0) | NON UTILISÉ POTENTIEL |
| auth | roles | 0 | 8192 bytes | — | 0 | 0 | 3 | n/d | NON (0) | NON (0) | NON UTILISÉ POTENTIEL |
| auth | user_roles | 0 | 0 bytes | — | 0 | 0 | 2 | n/d | NON (0) | NON (0) | NON UTILISÉ POTENTIEL |
| auth | users | 0 | 8192 bytes | — | 0 | 0 | 6 | n/d | NON (0) | NON (0) | NON UTILISÉ POTENTIEL |
| core | catchments | 33 | 952 kB | — | 0 | 0 | 5 | n/d | OUI (3) | OUI (14) | ACTIF |
| core | data_batches | 1 | 32 kB | batch_id | 0 | 1 | 9 | n/d | OUI (1) | NON (0) | ACTIF |
| core | measurement_batches | 1 036 530 | 85 MB | — | 0 | 1 | 4 | 2026-08-10T02:48:15.566924-07:00 | OUI (2) | NON (0) | ACTIF |
| core | measurements | 3 773 400 | 330 MB | — | 0 | 1 | 4 | 2026-07-27T05:52:56.037911-07:00 | OUI (10) | OUI (18) | ACTIF |
| core | model_runs | 10 | 16 kB | — | 0 | 0 | 6 | n/d | OUI (8) | OUI (7) | ACTIF |
| core | reaches | 33 | 672 kB | — | 0 | 0 | 15 | n/d | NON (0) | OUI (7) | ACTIF |
| core | reservoir_bathymetry | 4 401 | 400 kB | — | 0 | 0 | 7 | 2026-07-27T04:01:56.625361-07:00 | OUI (3) | OUI (6) | ACTIF |
| core | reservoirs | 12 | 16 kB | — | 0 | 0 | 8 | n/d | OUI (5) | OUI (8) | ACTIF |
| core | rivers | 0 | 8192 bytes | — | 0 | 0 | 6 | n/d | NON (0) | OUI (4) | ACTIF |
| core | station_reach_map | 5 | 32 kB | — | 0 | 1 | 14 | n/d | OUI (4) | NON (0) | ACTIF |
| core | station_subbasin_map | 5 | 120 kB | — | 0 | 4 | 16 | 2026-08-10T02:52:03.295442-07:00 | OUI (5) | NON (0) | ACTIF |
| core | stations | 102 | 64 kB | — | 0 | 1 | 12 | 2026-07-27T04:01:56.452744-07:00 | OUI (14) | OUI (13) | ACTIF |
| core | subbasin_metrics_annual | 0 | 8192 bytes | — | 0 | 0 | 7 | n/d | NON (0) | OUI (1) | ACTIF |
| core | subbasins | 33 | 952 kB | — | 0 | 0 | 13 | n/d | NON (0) | OUI (7) | ACTIF |
| core | swat_entity_map | 38 | 48 kB | entity_type, entity_type, swat_code, swat_code | 0 | 2 | 10 | n/d | OUI (1) | NON (0) | ACTIF |
| core | timeseries | 383 | 120 kB | — | 0 | 2 | 7 | 2026-07-27T04:01:56.466856-07:00 | OUI (9) | OUI (11) | ACTIF |
| geo | landcover | 0 | 8192 bytes | — | 0 | 0 | 4 | n/d | NON (0) | OUI (2) | À VÉRIFIER |
| gis | meteo_stations | 5 | 16 kB | — | 0 | 0 | 9 | n/d | OUI (1) | NON (0) | ACTIF PARTIELLEMENT |
| gis | reach_shapes | 19 | 840 kB | — | 0 | 1 | 9 | n/d | OUI (4) | NON (0) | ACTIF PARTIELLEMENT |
| gis | reach_shapes_backup_20260422_144537 | 33 | 688 kB | — | 0 | 0 | 9 | n/d | NON (0) | NON (0) | NON UTILISÉ POTENTIEL |
| gis | subbasin_shapes | 19 | 2136 kB | — | 0 | 1 | 8 | n/d | OUI (6) | NON (0) | ACTIF PARTIELLEMENT |
| hydro | bathymetry_campaigns | 6 | 64 kB | campaign_id | 0 | 3 | 16 | n/d | OUI (2) | NON (0) | ACTIF PARTIELLEMENT |
| hydro | siltation_evolution | 0 | 32 kB | evolution_id | 0 | 3 | 12 | n/d | OUI (3) | NON (0) | STRUCTURE NÉCESSAIRE |
| hydro | siltation_hsv | 0 | 32 kB | hsv_id | 0 | 3 | 12 | n/d | OUI (2) | NON (0) | STRUCTURE NÉCESSAIRE |
| hydro | siltation_indicators | 0 | 32 kB | indicator_id | 0 | 3 | 21 | n/d | OUI (2) | NON (0) | STRUCTURE NÉCESSAIRE |
| public | module_properties | 10 | 16 kB | — | 0 | 0 | 5 | n/d | OUI (4) | NON (0) | ACTIF PARTIELLEMENT |
| public | property_module_override | 0 | 8192 bytes | — | 0 | 0 | 3 | n/d | NON (0) | OUI (1) | ACTIF PARTIELLEMENT |
| public | spatial_ref_sys | 8 500 | 7144 kB | srid | 0 | 1 | 5 | 2026-07-27T03:58:06.116028-07:00 | NON (0) | NON (0) | TECHNIQUE |
| public | users | 3 | 16 kB | — | 0 | 0 | 9 | n/d | OUI (3) | NON (0) | ACTIF PARTIELLEMENT |
| ref | communes | 86 | 776 kB | — | 0 | 0 | 15 | 2026-07-27T04:01:56.734631-07:00 | NON (0) | OUI (2) | ACTIF |
| ref | landcover_classes | 0 | 8192 bytes | — | 0 | 0 | 5 | n/d | NON (0) | OUI (1) | ACTIF |
| ref | landcover_periods | 0 | 8192 bytes | — | 0 | 0 | 5 | n/d | NON (0) | OUI (1) | ACTIF |
| ref | observed_properties | 13 | 16 kB | — | 0 | 0 | 5 | n/d | OUI (9) | OUI (42) | ACTIF |
| ref | property_domain_membership | 10 | 16 kB | — | 0 | 0 | 7 | n/d | NON (0) | OUI (9) | ACTIF |
| ref | property_domains | 3 | 16 kB | — | 0 | 0 | 3 | n/d | NON (0) | NON (0) | À VÉRIFIER |
| staging | limite_raw | 33 | 984 kB | — | 0 | 0 | 22 | n/d | NON (0) | NON (0) | STAGING |
| staging | migration_batches | 3 | 16 kB | — | 0 | 0 | 8 | n/d | OUI (1) | NON (0) | STAGING |
| staging | migration_events | 42 | 16 kB | — | 0 | 0 | 8 | n/d | NON (0) | NON (0) | STAGING |
| staging | norm_catchments | 3 | 240 kB | — | 0 | 0 | 8 | n/d | NON (0) | NON (0) | STAGING |
| staging | norm_communes | 258 | 1904 kB | — | 0 | 0 | 16 | 2026-07-27T04:01:57.495424-07:00 | NON (0) | NON (0) | STAGING |
| staging | norm_measurements | 1 049 166 | 156 MB | — | 0 | 0 | 10 | 2026-07-27T04:04:55.322243-07:00 | OUI (1) | NON (0) | STAGING |
| staging | norm_reservoir_bathymetry | 13 203 | 2048 kB | — | 0 | 0 | 9 | 2026-07-27T04:02:07.062081-07:00 | NON (0) | NON (0) | STAGING |
| staging | norm_reservoirs | 36 | 16 kB | — | 0 | 0 | 9 | n/d | NON (0) | NON (0) | STAGING |
| staging | norm_stations | 105 | 80 kB | — | 0 | 0 | 12 | 2026-07-27T04:02:07.106845-07:00 | NON (0) | NON (0) | STAGING |
| staging | raw_adm_communes_abhgzr | 258 | 2816 kB | — | 0 | 0 | 17 | 2026-07-27T04:02:07.163868-07:00 | NON (0) | NON (0) | STAGING |
| staging | raw_barrages_abhgzr | 36 | 16 kB | — | 0 | 0 | 12 | n/d | NON (0) | NON (0) | STAGING |
| staging | raw_bassin_abhgzr | 3 | 448 kB | — | 0 | 0 | 7 | n/d | NON (0) | NON (0) | STAGING |
| staging | raw_bathymetries_barrages_abhgzr | 13 203 | 1968 kB | — | 0 | 0 | 9 | 2026-07-27T04:02:07.823676-07:00 | NON (0) | NON (0) | STAGING |
| staging | raw_mesures_debits_jr | 235 587 | 28 MB | — | 0 | 0 | 8 | 2026-07-27T04:02:34.700550-07:00 | NON (0) | NON (0) | STAGING |
| staging | raw_mesures_evaporation_m | 6 768 | 856 kB | — | 0 | 0 | 8 | 2026-07-27T04:02:16.833381-07:00 | NON (0) | NON (0) | STAGING |
| staging | raw_mesures_humidite_relative_m | 3 060 | 424 kB | — | 0 | 0 | 8 | 2026-07-27T04:02:17.051910-07:00 | NON (0) | NON (0) | STAGING |
| staging | raw_mesures_lachers_barrages | 59 583 | 8296 kB | — | 0 | 0 | 9 | 2026-07-27T04:02:20.090095-07:00 | NON (0) | NON (0) | STAGING |
| staging | raw_mesures_precipitations_jr | 328 821 | 43 MB | — | 0 | 0 | 8 | 2026-07-27T04:03:22.844920-07:00 | NON (0) | NON (0) | STAGING |
| staging | raw_mesures_temperature_jr_pn | 130 392 | 19 MB | — | 0 | 0 | 10 | 2026-07-27T04:02:38.720916-07:00 | NON (0) | NON (0) | STAGING |
| staging | raw_mesures_temperature_m | 6 084 | 824 kB | — | 0 | 0 | 10 | 2026-07-27T04:02:39.220862-07:00 | NON (0) | NON (0) | STAGING |
| staging | raw_mesures_vitesse_vent_m | 1 368 | 208 kB | — | 0 | 0 | 8 | 2026-07-27T04:02:39.336522-07:00 | NON (0) | NON (0) | STAGING |
| staging | raw_stations_abhgzr | 105 | 64 kB | — | 0 | 0 | 21 | 2026-07-27T04:02:39.374068-07:00 | NON (0) | NON (0) | STAGING |
| staging | reseau_hydro_import_raw | 33 | 416 kB | — | 0 | 0 | 14 | n/d | NON (0) | NON (0) | STAGING |
| staging | reseau_hydrologie_raw | 33 | 672 kB | — | 0 | 0 | 19 | n/d | NON (0) | NON (0) | STAGING |
| staging | station_meteo_raw | 5 | 16 kB | — | 0 | 0 | 7 | n/d | NON (0) | NON (0) | STAGING |
| staging | swat_mdb_imports | 80 | 72 kB | — | 0 | 0 | 19 | 2026-07-27T04:02:39.442559-07:00 | NON (0) | NON (0) | STAGING |
| staging | swat_rch_norm | 997 405 | 149 MB | — | 0 | 1 | 14 | 2026-07-27T04:05:25.601155-07:00 | OUI (1) | NON (0) | STAGING |
| staging | swat_rch_raw | 0 | 32 kB | — | 0 | 1 | 15 | 2026-07-27T04:23:01.217359-07:00 | OUI (1) | NON (0) | STAGING |
| staging | swat_sub_norm | 0 | 5568 kB | — | 0 | 1 | 12 | 2026-08-10T02:47:52.599653-07:00 | OUI (1) | NON (0) | STAGING |
| staging | swat_sub_raw | 0 | 2624 kB | — | 0 | 1 | 13 | 2026-08-10T02:48:50.434801-07:00 | OUI (1) | NON (0) | STAGING |

### Annexe — colonnes par table

<details><summary>access (7 tables)</summary>

- `access.hru_results` : `id` bigint, `import_id` bigint, `import_batch_id` bigint, `source_path` text, `source_file` text, `source_hash` text, `scenario_code` text, `time_step` text, `table_source` text, `station_id` integer, `station_subbasin_map_id` bigint, `sub_code` integer, `reach_id` integer, `reach_code` integer, `hru_code` integer, `period_date` date, `record_key` text, `hru_name` text, `area_ha` double precision, `elevation_m` double precision, `slope_pct` double precision, `precip_mm` double precision, `evap_mm` double precision, `et_mm` double precision, `runoff_mm` double precision, `water_yield_mm` double precision, `sediment_yield_t_ha` double precision, `soil_loss_t_ha` double precision, `gw_q_mm` double precision, `n_loss_kg_ha` double precision, `p_loss_kg_ha` double precision, `source_row_num` integer, `import_date` timestamp with time zone, `raw_record` jsonb
- `access.import_runs` : `import_id` bigint, `source_path` text, `source_checksum` text, `scenario_code` text, `source_format` text, `started_at` timestamp with time zone, `finished_at` timestamp with time zone, `status` text, `total_rows` integer, `notes` text, `import_batch_id` bigint, `source_file` text, `source_hash` text, `time_step` text, `table_source` text, `source_family` text
- `access.rch_results` : `import_id` bigint, `scenario_code` text, `sub_code` integer, `period_date` date, `year` integer, `mon` integer, `area_km2` double precision, `flow_in_cms` double precision, `flow_out_cms` double precision, `evap_cms` double precision, `tloss_cms` double precision, `sed_in_tons` double precision, `sed_out_tons` double precision, `sedconc_mg_kg` double precision, `orgn_in_kg` double precision, `orgn_out_kg` double precision, `orgp_in_kg` double precision, `orgp_out_kg` double precision, `no3_in_kg` double precision, `no3_out_kg` double precision, `nh4_in_kg` double precision, `nh4_out_kg` double precision, `no2_in_kg` double precision, `no2_out_kg` double precision, `minp_in_kg` double precision, `minp_out_kg` double precision, `chla_in_kg` double precision, `chla_out_kg` double precision, `cbod_in_kg` double precision, `cbod_out_kg` double precision, `disox_in_kg` double precision, `disox_out_kg` double precision, `solpst_in_mg` double precision, `solpst_out_mg` double precision, `sorpst_in_mg` double precision, `sorpst_out_mg` double precision, `reactpt_mg` double precision, `volpst_mg` double precision, `settlpst_mg` double precision, `resusppst_mg` double precision, `difusepst_mg` double precision, `reachbedpst_mg` double precision, `burypst_mg` double precision, `bed_pst_mg` double precision, `bactp_out_ct` double precision, `bactlp_out_ct` double precision, `cmetal1_kg` double precision, `cmetal2_kg` double precision, `cmetal3_kg` double precision, `tot_n_kg` double precision, `tot_p_kg` double precision, `no3conc_mg_l` double precision, `wtmp_deg_c` double precision, `yyyyddd` integer, `source_row_num` integer, `source_file` text, `import_batch_id` bigint, `source_path` text, `source_hash` text, `time_step` text, `table_source` text, `station_id` integer, `station_subbasin_map_id` bigint, `reach_id` integer, `reach_code` integer, `import_date` timestamp with time zone, `raw_record` jsonb
- `access.scenario_metadata` : `id` bigint, `import_id` bigint, `import_batch_id` bigint, `source_path` text, `source_file` text, `source_hash` text, `scenario_code` text, `time_step` text, `table_source` text, `source_table` text, `record_key` text, `station_id` integer, `station_subbasin_map_id` bigint, `sub_code` integer, `reach_id` integer, `hru_code` integer, `parameter_group` text, `parameter_code` text, `parameter_name` text, `parameter_value_text` text, `parameter_value_num` numeric, `parameter_value_bool` boolean, `parameter_unit` text, `period_date` date, `source_row_num` integer, `import_date` timestamp with time zone, `raw_record` jsonb
- `access.sub_results` : `import_id` bigint, `scenario_code` text, `sub_code` integer, `period_date` date, `year` integer, `mon` integer, `area_km2` double precision, `precip_mm` double precision, `snowmelt_mm` double precision, `pet_mm` double precision, `et_mm` double precision, `sw_mm` double precision, `perc_mm` double precision, `surq_mm` double precision, `gw_q_mm` double precision, `wyld_mm` double precision, `syld_t_ha` double precision, `orgn_kg_ha` double precision, `orgp_hg_ha` double precision, `nsurq_kg_ha` double precision, `solp_kg_ha` double precision, `sedp_kg_ha` double precision, `lat_q_mm` double precision, `lat_q_no3_kg_ha` double precision, `gwno3_kg_ha` double precision, `chola_mic_l` double precision, `cbodu_mg_l` double precision, `doxq_mg_l` double precision, `tno3_kg_ha` double precision, `yyyyddd` integer, `source_row_num` integer, `source_file` text, `import_batch_id` bigint, `source_path` text, `source_hash` text, `time_step` text, `table_source` text, `station_id` integer, `station_subbasin_map_id` bigint, `reach_code` integer, `import_date` timestamp with time zone, `raw_record` jsonb
- `access.variable_dictionary` : `source_table` text, `variable_code` text, `variable_label` text, `definition` text, `unit` text, `entity_type` text, `module_code` text, `display_order` integer, `is_active` boolean, `source_file` text, `source_hash` text, `scenario_code` text, `time_step` text, `table_source` text, `import_batch_id` bigint, `import_id` bigint, `import_date` timestamp with time zone, `source_row_num` integer, `raw_record` jsonb
- `access.weather_inputs` : `id` bigint, `import_id` bigint, `import_batch_id` bigint, `source_path` text, `source_file` text, `source_hash` text, `scenario_code` text, `time_step` text, `table_source` text, `source_table` text, `record_key` text, `station_id` integer, `station_subbasin_map_id` bigint, `station_code` text, `station_name` text, `sub_code` integer, `reach_code` integer, `hru_code` integer, `period_date` date, `year` integer, `mon` integer, `day` integer, `precip_mm` double precision, `tmax_c` double precision, `tmin_c` double precision, `tmean_c` double precision, `solar_mj_m2` double precision, `wind_m_s` double precision, `rh_pct` double precision, `pet_mm` double precision, `source_row_num` integer, `import_date` timestamp with time zone, `raw_record` jsonb

</details>

<details><summary>audit (11 tables)</summary>

- `audit.gis_reach_shapes_backup_2026` : `reach_id` integer, `reach_code` integer, `subbasin_id` integer, `catchment_id` integer, `length_m` double precision, `slope_pct` double precision, `source_attrs` jsonb, `geom` USER-DEFINED, `created_at` timestamp with time zone
- `audit.gis_subbasin_shapes_backup_2026` : `subbasin_id` integer, `catchment_id` integer, `subbasin_code` integer, `name` text, `area_m2` double precision, `source_attrs` jsonb, `geom` USER-DEFINED, `created_at` timestamp with time zone
- `audit.nv_limite` : `ogc_fid` integer, `wkb_geometry` USER-DEFINED, `subbasin` numeric, `area` double precision, `slo1` numeric, `len1` numeric, `sll` numeric, `csl` numeric, `wid1` numeric, `dep1` numeric, `lat` numeric, `long_` numeric, `elev` numeric, `elevmin` numeric, `elevmax` numeric, `bname` character varying, `shape_len` numeric, `shape_area` double precision, `hydroid` numeric, `outletid` numeric
- `audit.nv_stream` : `ogc_fid` integer, `wkb_geometry` USER-DEFINED, `subbasin` numeric, `areac` double precision, `len2` numeric, `slo2` numeric, `wid2` numeric, `dep2` numeric, `minel` numeric, `maxel` numeric, `shape_len` numeric, `hydroid` numeric, `outletid` numeric, `station` character varying
- `audit.qc_issues` : `qc_issue_id` bigint, `qc_run_id` bigint, `severity` text, `object_type` text, `object_name` text, `issue_code` text, `issue_detail` jsonb, `created_at` timestamp with time zone
- `audit.qc_runs` : `qc_run_id` bigint, `run_at` timestamp with time zone, `run_by` text, `notes` text
- `audit.station_reach_map_backup_2026` : `id` bigint, `station_id` integer, `reach_id` integer, `station_code` text, `reach_code` text, `mapping_method` text, `distance_m` double precision, `confidence_score` numeric, `is_primary` boolean, `is_active` boolean, `simulated_station_id` integer, `notes` text, `created_at` timestamp with time zone, `updated_at` timestamp with time zone
- `audit.station_subbasin_map_backup_2026` : `id` bigint, `station_id` integer, `station_code` text, `station_name` text, `nv_station_name` text, `subbasin_id` integer, `hydro_id` integer, `outlet_id` integer, `source_layer` text, `mapping_method` text, `confidence_score` numeric, `is_primary` boolean, `is_active` boolean, `notes` text, `created_at` timestamp with time zone, `updated_at` timestamp with time zone
- `audit.swat_entity_map_backup_2026` : `entity_type` text, `swat_code` integer, `subbasin_id` integer, `reach_id` integer, `station_id` integer, `mapping_method` text, `confidence` numeric, `is_active` boolean, `created_at` timestamp with time zone, `updated_at` timestamp with time zone
- `audit.swat_output_archive_rch` : `import_id` bigint, `scenario_code` text, `sub_code` integer, `period_date` date, `year` integer, `mon` integer, `area_km2` double precision, `flow_in_cms` double precision, `flow_out_cms` double precision, `evap_cms` double precision, `tloss_cms` double precision, `sed_in_tons` double precision, `sed_out_tons` double precision, `sedconc_mg_kg` double precision, `orgn_in_kg` double precision, `orgn_out_kg` double precision, `orgp_in_kg` double precision, `orgp_out_kg` double precision, `no3_in_kg` double precision, `no3_out_kg` double precision, `nh4_in_kg` double precision, `nh4_out_kg` double precision, `no2_in_kg` double precision, `no2_out_kg` double precision, `minp_in_kg` double precision, `minp_out_kg` double precision, `chla_in_kg` double precision, `chla_out_kg` double precision, `cbod_in_kg` double precision, `cbod_out_kg` double precision, `disox_in_kg` double precision, `disox_out_kg` double precision, `solpst_in_mg` double precision, `solpst_out_mg` double precision, `sorpst_in_mg` double precision, `sorpst_out_mg` double precision, `reactpt_mg` double precision, `volpst_mg` double precision, `settlpst_mg` double precision, `resusppst_mg` double precision, `difusepst_mg` double precision, `reachbedpst_mg` double precision, `burypst_mg` double precision, `bed_pst_mg` double precision, `bactp_out_ct` double precision, `bactlp_out_ct` double precision, `cmetal1_kg` double precision, `cmetal2_kg` double precision, `cmetal3_kg` double precision, `tot_n_kg` double precision, `tot_p_kg` double precision, `no3conc_mg_l` double precision, `wtmp_deg_c` double precision, `yyyyddd` integer, `source_row_num` integer, `source_file` text, `import_batch_id` bigint, `source_path` text, `source_hash` text, `time_step` text, `table_source` text, `station_id` integer, `station_subbasin_map_id` bigint, `reach_id` integer, `reach_code` integer, `import_date` timestamp with time zone, `raw_record` jsonb
- `audit.swat_output_archive_sub` : `import_id` bigint, `scenario_code` text, `sub_code` integer, `period_date` date, `year` integer, `mon` integer, `area_km2` double precision, `precip_mm` double precision, `snowmelt_mm` double precision, `pet_mm` double precision, `et_mm` double precision, `sw_mm` double precision, `perc_mm` double precision, `surq_mm` double precision, `gw_q_mm` double precision, `wyld_mm` double precision, `syld_t_ha` double precision, `orgn_kg_ha` double precision, `orgp_hg_ha` double precision, `nsurq_kg_ha` double precision, `solp_kg_ha` double precision, `sedp_kg_ha` double precision, `lat_q_mm` double precision, `lat_q_no3_kg_ha` double precision, `gwno3_kg_ha` double precision, `chola_mic_l` double precision, `cbodu_mg_l` double precision, `doxq_mg_l` double precision, `tno3_kg_ha` double precision, `yyyyddd` integer, `source_row_num` integer, `source_file` text, `import_batch_id` bigint, `source_path` text, `source_hash` text, `time_step` text, `table_source` text, `station_id` integer, `station_subbasin_map_id` bigint, `reach_code` integer, `import_date` timestamp with time zone, `raw_record` jsonb

</details>

<details><summary>auth (6 tables)</summary>

- `auth.audit_log` : `audit_id` bigint, `at` timestamp with time zone, `user_id` bigint, `action` text, `object_type` text, `object_name` text, `payload` jsonb
- `auth.permissions` : `permission_id` bigint, `perm_code` text, `description` text
- `auth.role_permissions` : `role_id` bigint, `permission_id` bigint
- `auth.roles` : `role_id` bigint, `role_name` text, `description` text
- `auth.user_roles` : `user_id` bigint, `role_id` bigint
- `auth.users` : `user_id` bigint, `username` text, `email` text, `full_name` text, `is_active` boolean, `created_at` timestamp with time zone

</details>

<details><summary>core (16 tables)</summary>

- `core.catchments` : `catchment_id` integer, `name` text, `dam_name` text, `area_m2` double precision, `geom` USER-DEFINED
- `core.data_batches` : `batch_id` text, `source` text, `source_file` text, `imported_at` timestamp with time zone, `status` text, `row_count` integer, `run_id` integer, `scenario_code` text, `notes` text
- `core.measurement_batches` : `ts_id` integer, `datetime` timestamp with time zone, `batch_id` text, `created_at` timestamp with time zone
- `core.measurements` : `ts_id` integer, `datetime` timestamp with time zone, `value` double precision, `quality_flag` smallint
- `core.model_runs` : `run_id` integer, `scenario_code` text, `scenario_name` text, `description` text, `is_observed` boolean, `created_at` timestamp with time zone
- `core.reaches` : `reach_id` integer, `reach_code` integer, `subbasin_id` integer, `catchment_id` integer, `length_m` double precision, `slope_pct` double precision, `width_m` double precision, `depth_m` double precision, `min_elev_m` double precision, `max_elev_m` double precision, `qm_annual_mean_m3s` double precision, `sedout_annual_mean_t_yr` double precision, `geom` USER-DEFINED, `created_at` timestamp with time zone, `river_id` integer
- `core.reservoir_bathymetry` : `bathy_id` integer, `reservoir_id` integer, `level_m` numeric, `volume_hm3` numeric, `area_km2` numeric, `source` text, `created_at` timestamp with time zone
- `core.reservoirs` : `reservoir_id` integer, `name` text, `geom` USER-DEFINED, `created_at` timestamp with time zone, `catchment_id` integer, `reach_id` integer, `reservoir_code` text, `commune_code` text
- `core.rivers` : `river_id` integer, `river_code` text, `name_fr` text, `name_en` text, `basin_name` text, `remarks` text
- `core.station_reach_map` : `id` bigint, `station_id` integer, `reach_id` integer, `station_code` text, `reach_code` text, `mapping_method` text, `distance_m` double precision, `confidence_score` numeric, `is_primary` boolean, `is_active` boolean, `simulated_station_id` integer, `notes` text, `created_at` timestamp with time zone, `updated_at` timestamp with time zone
- `core.station_subbasin_map` : `id` bigint, `station_id` integer, `station_code` text, `station_name` text, `nv_station_name` text, `subbasin_id` integer, `hydro_id` integer, `outlet_id` integer, `source_layer` text, `mapping_method` text, `confidence_score` numeric, `is_primary` boolean, `is_active` boolean, `notes` text, `created_at` timestamp with time zone, `updated_at` timestamp with time zone
- `core.stations` : `station_id` integer, `station_code` text, `name` text, `type_station` text, `station_type_code` text, `commune_code` text, `geom` USER-DEFINED, `altitude_m` numeric, `start_date` date, `end_date` date, `catchment_id` integer, `reach_id` integer
- `core.subbasin_metrics_annual` : `subbasin_id` bigint, `property_id` bigint, `run_id` bigint, `year` integer, `value` double precision, `quality_flag` text, `created_at` timestamp with time zone
- `core.subbasins` : `subbasin_id` integer, `catchment_id` integer, `subbasin_code` integer, `name` text, `area_m2` double precision, `spec_deg_base_t_ha_yr` double precision, `spec_deg_slope1_t_ha_yr` double precision, `spec_deg_slope2_t_ha_yr` double precision, `spec_deg_slope3_t_ha_yr` double precision, `spec_deg_buffer_t_ha_yr` double precision, `sediment_yield_tot_t_ha` double precision, `geom` USER-DEFINED, `created_at` timestamp with time zone
- `core.swat_entity_map` : `entity_type` text, `swat_code` integer, `subbasin_id` integer, `reach_id` integer, `station_id` integer, `mapping_method` text, `confidence` numeric, `is_active` boolean, `created_at` timestamp with time zone, `updated_at` timestamp with time zone
- `core.timeseries` : `ts_id` integer, `station_id` integer, `property_id` integer, `run_id` integer, `source_type` text, `created_at` timestamp with time zone, `time_step` USER-DEFINED

</details>

<details><summary>geo (1 tables)</summary>

- `geo.landcover` : `lc_id` integer, `lc_period_id` integer, `class_id` integer, `geom` USER-DEFINED

</details>

<details><summary>gis (4 tables)</summary>

- `gis.meteo_stations` : `station_id` integer, `station_code` text, `name` text, `type_station` text, `station_type_code` text, `catchment_id` integer, `source_attrs` jsonb, `geom` USER-DEFINED, `created_at` timestamp with time zone
- `gis.reach_shapes` : `reach_id` integer, `reach_code` integer, `subbasin_id` integer, `catchment_id` integer, `length_m` double precision, `slope_pct` double precision, `source_attrs` jsonb, `geom` USER-DEFINED, `created_at` timestamp with time zone
- `gis.reach_shapes_backup_20260422_144537` : `reach_id` integer, `reach_code` integer, `subbasin_id` integer, `catchment_id` integer, `length_m` double precision, `slope_pct` double precision, `source_attrs` jsonb, `geom` USER-DEFINED, `created_at` timestamp with time zone
- `gis.subbasin_shapes` : `subbasin_id` integer, `catchment_id` integer, `subbasin_code` integer, `name` text, `area_m2` double precision, `source_attrs` jsonb, `geom` USER-DEFINED, `created_at` timestamp with time zone

</details>

<details><summary>hydro (4 tables)</summary>

- `hydro.bathymetry_campaigns` : `campaign_id` bigint, `dam_code` text, `dam_name` text, `measurement_year` integer, `campaign_year` integer, `normal_level_m` numeric, `volume_mhm3` numeric, `silted_since_previous_mhm3` numeric, `annual_siltation_rate_mhm3` numeric, `cumulative_silted_mhm3` numeric, `source_file` text, `source_sheet` text, `source_row` integer, `metadata` jsonb, `created_at` timestamp with time zone, `updated_at` timestamp with time zone
- `hydro.siltation_evolution` : `evolution_id` bigint, `dam_code` text, `dam_name` text, `year` integer, `annual_silted_mhm3` numeric, `cumulative_silted_mhm3` numeric, `annual_rate_mhm3` numeric, `source_sheet` text, `source_row` integer, `metadata` jsonb, `created_at` timestamp with time zone, `updated_at` timestamp with time zone
- `hydro.siltation_hsv` : `hsv_id` bigint, `dam_code` text, `dam_name` text, `campaign_year` integer, `level_m` numeric, `surface_km2` numeric, `volume_mhm3` numeric, `source_sheet` text, `source_row` integer, `metadata` jsonb, `created_at` timestamp with time zone, `updated_at` timestamp with time zone
- `hydro.siltation_indicators` : `indicator_id` bigint, `dam_code` text, `dam_name` text, `reference_code` text, `source_file` text, `source_sheet` text, `baseline_year` integer, `current_year` integer, `volume_initial_mhm3` numeric, `volume_current_mhm3` numeric, `volume_silted_mhm3` numeric, `loss_percent` numeric, `tea_mhm3_per_year` numeric, `ter_percent_per_year` numeric, `duration_years` numeric, `trapping_efficiency_percent` numeric, `basin_area_km2` numeric, `specific_erosion_m3_km2_year` numeric, `metadata` jsonb, `created_at` timestamp with time zone, `updated_at` timestamp with time zone

</details>

<details><summary>public (4 tables)</summary>

- `public.module_properties` : `module_code` text, `property_id` integer, `is_enabled` boolean, `sort_order` integer, `created_at` timestamp with time zone
- `public.property_module_override` : `property_id` integer, `module` text, `submodule` text
- `public.spatial_ref_sys` : `srid` integer, `auth_name` character varying, `auth_srid` integer, `srtext` character varying, `proj4text` character varying
- `public.users` : `id` uuid, `full_name` character varying, `email` character varying, `password_hash` text, `role` character varying, `status` character varying, `last_login` timestamp without time zone, `created_at` timestamp without time zone, `updated_at` timestamp without time zone

</details>

<details><summary>ref (6 tables)</summary>

- `ref.communes` : `commune_id` integer, `code_commune` text, `name_fr` text, `name_ar` text, `milieu` text, `code_region` text, `region_name_fr` text, `code_province` text, `province_name_fr` text, `code_cercle` text, `cercle_name_fr` text, `cercle_name_ar` text, `area_m2` double precision, `geom` USER-DEFINED, `created_at` timestamp with time zone
- `ref.landcover_classes` : `class_id` integer, `code` integer, `name_fr` text, `name_en` text, `color_hex` text
- `ref.landcover_periods` : `lc_period_id` integer, `year` integer, `scenario_code` text, `description` text, `source_data` text
- `ref.observed_properties` : `property_id` integer, `name` text, `unit` text, `standard_name` text, `description` text
- `ref.property_domain_membership` : `property_id` bigint, `domain_code` text, `display_order` integer, `is_enabled` boolean, `allow_observed` boolean, `allow_simulated` boolean, `default_agg` text
- `ref.property_domains` : `domain_code` text, `label` text, `description` text

</details>

<details><summary>staging (30 tables)</summary>

- `staging.limite_raw` : `gid` integer, `subbasin` integer, `area` numeric, `slo1` numeric, `len1` numeric, `sll` numeric, `csl` numeric, `wid1` numeric, `dep1` numeric, `lat` numeric, `long_` numeric, `elev` numeric, `elevmin` numeric, `elevmax` numeric, `bname` character varying, `shape_len` numeric, `shape_area` numeric, `hydroid` integer, `outletid` integer, `sur` character varying, `per` character varying, `geom` USER-DEFINED
- `staging.migration_batches` : `load_batch_id` text, `source_db` text, `target_db` text, `started_at` timestamp with time zone, `finished_at` timestamp with time zone, `mode` text, `status` text, `note` text
- `staging.migration_events` : `event_id` bigint, `load_batch_id` text, `event_time` timestamp with time zone, `level` text, `step` text, `table_name` text, `message` text, `row_count` bigint
- `staging.norm_catchments` : `catchment_code` text, `name` text, `dam_name` text, `geom` USER-DEFINED, `source_table` text, `source_pk` text, `load_batch_id` text, `inserted_at` timestamp with time zone
- `staging.norm_communes` : `commune_code` text, `name_fr` text, `name_ar` text, `milieu` text, `code_region` text, `region_name_fr` text, `code_province` text, `province_name_fr` text, `code_cercle` text, `cercle_name_fr` text, `cercle_name_ar` text, `geom` USER-DEFINED, `source_table` text, `source_pk` text, `load_batch_id` text, `inserted_at` timestamp with time zone
- `staging.norm_measurements` : `entity_type` text, `entity_code` text, `property_code` text, `datetime_utc` timestamp with time zone, `time_step` text, `value` numeric, `source_table` text, `source_pk` text, `load_batch_id` text, `inserted_at` timestamp with time zone
- `staging.norm_reservoir_bathymetry` : `reservoir_code` text, `level_m` double precision, `volume_hm3` double precision, `area_km2` double precision, `source` text, `source_table` text, `source_pk` text, `load_batch_id` text, `inserted_at` timestamp with time zone
- `staging.norm_reservoirs` : `reservoir_code` text, `name` text, `commune_code` text, `type_barrage` text, `geom` USER-DEFINED, `source_table` text, `source_pk` text, `load_batch_id` text, `inserted_at` timestamp with time zone
- `staging.norm_stations` : `station_code` text, `station_name` text, `type_station` text, `station_type_code` text, `commune_code` text, `altitude_m` double precision, `source_attrs` jsonb, `geom` USER-DEFINED, `source_table` text, `source_pk` text, `load_batch_id` text, `inserted_at` timestamp with time zone
- `staging.raw_adm_communes_abhgzr` : `id_com` integer, `code_region` text, `nom_region` text, `code_province` text, `nom_province` text, `code_cercle` text, `cercle_fr` text, `cercle_ar` text, `code_commune` text, `commune_fr` text, `commune_ar` text, `milieu` text, `geom_ewkt` text, `source_table` text, `source_pk` text, `load_batch_id` text, `inserted_at` timestamp with time zone
- `staging.raw_barrages_abhgzr` : `id_brg` integer, `code_commune` text, `ire_barrage` text, `nom_barrage` text, `type_barrage` text, `coord_x` double precision, `coord_y` double precision, `geom_ewkt` text, `source_table` text, `source_pk` text, `load_batch_id` text, `inserted_at` timestamp with time zone
- `staging.raw_bassin_abhgzr` : `id_bassin` integer, `nom_bassin` text, `geom_ewkt` text, `source_table` text, `source_pk` text, `load_batch_id` text, `inserted_at` timestamp with time zone
- `staging.raw_bathymetries_barrages_abhgzr` : `id_cote` integer, `ire_barrage` text, `cote_mngm` double precision, `volumr_mm3` double precision, `surface_km2` double precision, `source_table` text, `source_pk` text, `load_batch_id` text, `inserted_at` timestamp with time zone
- `staging.raw_mesures_debits_jr` : `id_debit` integer, `ire_station` text, `date_jr` date, `debit_jr` double precision, `source_table` text, `source_pk` text, `load_batch_id` text, `inserted_at` timestamp with time zone
- `staging.raw_mesures_evaporation_m` : `id_evapo_m` integer, `ire_station` text, `date_m` date, `evaporation_m` text, `source_table` text, `source_pk` text, `load_batch_id` text, `inserted_at` timestamp with time zone
- `staging.raw_mesures_humidite_relative_m` : `id_hum_m` integer, `ire_station` text, `date_m` date, `humidite_relative_m` text, `source_table` text, `source_pk` text, `load_batch_id` text, `inserted_at` timestamp with time zone
- `staging.raw_mesures_lachers_barrages` : `id_lachers` integer, `ire_barrage` text, `date_jr` date, `apports_m3` text, `restitution_m3` text, `source_table` text, `source_pk` text, `load_batch_id` text, `inserted_at` timestamp with time zone
- `staging.raw_mesures_precipitations_jr` : `id_precipitation` integer, `ire_station` text, `date_jr` date, `precipitation_jr` double precision, `source_table` text, `source_pk` text, `load_batch_id` text, `inserted_at` timestamp with time zone
- `staging.raw_mesures_temperature_jr_pn` : `id_temp` integer, `ire_station` text, `date_jr` date, `temp_jr_max` double precision, `temp_jr_min` double precision, `temp_jr_moy` double precision, `source_table` text, `source_pk` text, `load_batch_id` text, `inserted_at` timestamp with time zone
- `staging.raw_mesures_temperature_m` : `id_temp_m` integer, `ire_station` text, `date_m` date, `temperature_min` text, `temperature_max` text, `temperature_moy` text, `source_table` text, `source_pk` text, `load_batch_id` text, `inserted_at` timestamp with time zone
- `staging.raw_mesures_vitesse_vent_m` : `id_vent_m` integer, `ire_station` text, `date_m` date, `vitesse_moy_m` text, `source_table` text, `source_pk` text, `load_batch_id` text, `inserted_at` timestamp with time zone
- `staging.raw_stations_abhgzr` : `id_station` integer, `code_commune` text, `ire_station` text, `num_poste` integer, `nom_station_fr` text, `nom_station_ar` text, `oued` text, `date_m_s` text, `etat_fonct` text, `mode_fonct` text, `type_station` text, `mesures_station` text, `coord_x` double precision, `coord_y` double precision, `coord_z` double precision, `observation` text, `geom_ewkt` text, `source_table` text, `source_pk` text, `load_batch_id` text, `inserted_at` timestamp with time zone
- `staging.reseau_hydro_import_raw` : `gid` integer, `subbasin` integer, `subbasinr` integer, `areac` numeric, `len2` numeric, `slo2` numeric, `wid2` numeric, `dep2` numeric, `minel` numeric, `maxel` numeric, `shape_len` numeric, `hydroid` integer, `outletid` integer, `geom` USER-DEFINED
- `staging.reseau_hydrologie_raw` : `gid` integer, `linkno` integer, `dslinkno` integer, `uslinkno1` integer, `uslinkno2` integer, `dsnodeid` double precision, `strmorder` integer, `length` double precision, `magnitude` integer, `dscontarea` double precision, `strmdrop` double precision, `slope` double precision, `straightl` double precision, `uscontarea` double precision, `wsno` integer, `doutend` double precision, `doutstart` double precision, `doutmid` double precision, `geom` USER-DEFINED
- `staging.station_meteo_raw` : `gid` integer, `objectid` double precision, `?????` character varying, `nom_fr` character varying, `lat` numeric, `long` numeric, `geom` USER-DEFINED
- `staging.swat_mdb_imports` : `id` bigint, `import_batch_id` bigint, `source_path` text, `source_file` text, `source_hash` text, `scenario_code` text, `time_step` text, `table_source` text, `source_family` text, `source_rows` integer, `target_rows` integer, `error_rows` integer, `status` text, `validation_status` text, `dedupe_status` text, `import_date` timestamp with time zone, `started_at` timestamp with time zone, `finished_at` timestamp with time zone, `notes` text
- `staging.swat_rch_norm` : `norm_id` bigint, `batch_id` text, `scenario_code` text, `run_id` integer, `reach_id` integer, `subbasin_id` integer, `station_code` text, `station_id` integer, `obs_date` date, `flow_m3s` double precision, `sed_tons` double precision, `mapping_method` text, `mapping_confidence` numeric, `inserted_at` timestamp with time zone
- `staging.swat_rch_raw` : `raw_id` bigint, `batch_id` text, `source_import_id` bigint, `scenario_code` text, `swat_rch` integer, `swat_sub` integer, `year` integer, `mon` integer, `yyyyddd` integer, `period_date` date, `flow_out` double precision, `sed_out` double precision, `source_file` text, `raw_record` jsonb, `inserted_at` timestamp with time zone
- `staging.swat_sub_norm` : `norm_id` bigint, `batch_id` text, `scenario_code` text, `run_id` integer, `subbasin_id` integer, `station_code` text, `station_id` integer, `obs_date` date, `syldt_ha` double precision, `mapping_method` text, `mapping_confidence` numeric, `inserted_at` timestamp with time zone
- `staging.swat_sub_raw` : `raw_id` bigint, `batch_id` text, `source_import_id` bigint, `scenario_code` text, `swat_sub` integer, `year` integer, `mon` integer, `yyyyddd` integer, `period_date` date, `syldt_ha` double precision, `source_file` text, `raw_record` jsonb, `inserted_at` timestamp with time zone

</details>

## 5. Tables vides

| Table | Référence backend | Référence vue | Référence script | Fonction supposée | Décision |
|---|---|---|---|---|---|
| access.variable_dictionary | OUI (1) | NON (0) | OUI (2) | dictionnaire de variables d’import | À VÉRIFIER |
| audit.qc_issues | NON (0) | NON (0) | NON (0) | archive, sauvegarde ou contrôle qualité | À VÉRIFIER |
| audit.qc_runs | NON (0) | NON (0) | NON (0) | archive, sauvegarde ou contrôle qualité | À VÉRIFIER |
| audit.station_reach_map_backup_2026 | NON (0) | NON (0) | NON (0) | archive, sauvegarde ou contrôle qualité | POTENTIELLEMENT INUTILE |
| audit.station_subbasin_map_backup_2026 | NON (0) | NON (0) | NON (0) | archive, sauvegarde ou contrôle qualité | POTENTIELLEMENT INUTILE |
| auth.audit_log | NON (0) | NON (0) | NON (0) | modèle auth/RBAC non branché | POTENTIELLEMENT INUTILE |
| auth.permissions | NON (0) | NON (0) | NON (0) | modèle auth/RBAC non branché | POTENTIELLEMENT INUTILE |
| auth.role_permissions | NON (0) | NON (0) | NON (0) | modèle auth/RBAC non branché | POTENTIELLEMENT INUTILE |
| auth.roles | NON (0) | NON (0) | NON (0) | modèle auth/RBAC non branché | POTENTIELLEMENT INUTILE |
| auth.user_roles | NON (0) | NON (0) | NON (0) | modèle auth/RBAC non branché | POTENTIELLEMENT INUTILE |
| auth.users | NON (0) | NON (0) | NON (0) | modèle auth/RBAC non branché | POTENTIELLEMENT INUTILE |
| core.rivers | NON (0) | OUI (4) | NON (0) | coeur métier / référentiel principal | À VÉRIFIER |
| core.subbasin_metrics_annual | NON (0) | OUI (1) | NON (0) | coeur métier / référentiel principal | À VÉRIFIER |
| geo.landcover | NON (0) | OUI (2) | NON (0) | donnée géographique thématique | À VÉRIFIER |
| hydro.siltation_evolution | OUI (3) | NON (0) | NON (0) | module hydro / siltation | STRUCTURE NÉCESSAIRE |
| hydro.siltation_hsv | OUI (2) | NON (0) | NON (0) | module hydro / siltation | STRUCTURE NÉCESSAIRE |
| hydro.siltation_indicators | OUI (2) | NON (0) | NON (0) | module hydro / siltation | STRUCTURE NÉCESSAIRE |
| public.property_module_override | NON (0) | OUI (1) | NON (0) | table d’exposition / support runtime | CONSERVER |
| ref.landcover_classes | NON (0) | OUI (1) | NON (0) | référentiel métier | À VÉRIFIER |
| ref.landcover_periods | NON (0) | OUI (1) | NON (0) | référentiel métier | À VÉRIFIER |
| staging.swat_rch_raw | OUI (1) | NON (0) | NON (0) | zone d’atterrissage / normalisation import | STAGING |
| staging.swat_sub_norm | OUI (1) | NON (0) | NON (0) | zone d’atterrissage / normalisation import | STAGING |
| staging.swat_sub_raw | OUI (1) | NON (0) | NON (0) | zone d’atterrissage / normalisation import | STAGING |

## 6. Utilisation des schémas

| Schéma | Utilisation backend | Utilisation scripts | Utilisation vues | Utilisation runtime | Statut |
|---|---|---|---|---|---|
| access | 13 fichier(s) | 5 fichier(s) | 1 vue(s) dépendantes | oui | ACTIF PARTIELLEMENT |
| api | 6 fichier(s) | 0 fichier(s) | 23 vue(s) dépendantes | oui | ACTIF |
| audit | 0 fichier(s) | 1 fichier(s) | 5 vue(s) dépendantes | non | LEGACY POTENTIEL |
| auth | 2 fichier(s) | 0 fichier(s) | 0 vue(s) dépendantes | indirecte via contrôleurs, mais les tables `auth.*` ne sont pas consommées; `public.users` porte le runtime | À VÉRIFIER |
| core | 12 fichier(s) | 5 fichier(s) | 47 vue(s) dépendantes | oui | ACTIF |
| geo | 0 fichier(s) | 0 fichier(s) | 2 vue(s) dépendantes | non | LEGACY POTENTIEL |
| gis | 6 fichier(s) | 1 fichier(s) | 0 vue(s) dépendantes | oui | ACTIF PARTIELLEMENT |
| hydro | 6 fichier(s) | 3 fichier(s) | 0 vue(s) dépendantes | oui | ACTIF PARTIELLEMENT |
| public | 13 fichier(s) | 3 fichier(s) | 91 vue(s) dépendantes | oui | ACTIF PARTIELLEMENT |
| ref | 5 fichier(s) | 3 fichier(s) | 52 vue(s) dépendantes | oui | ACTIF |
| staging | 2 fichier(s) | 0 fichier(s) | 0 vue(s) dépendantes | oui | STAGING |

### Schémas actifs

- `core`
- `api`
- `ref`

### Schémas partiellement utilisés

- `access`
- `gis`
- `hydro`
- `public`
- `staging`

### Schémas legacy / historiques

- `audit`
- `old_hd`

### Schémas potentiellement non utilisés / à vérifier

- `auth`
- `geo`

## 7. Mapping application → base

| Module | API | Service backend | Table/Vue | Schéma |
|---|---|---|---|---|
| Dashboard | /api/v1/catalog/* ; /api/v1/timeseries/* | catalog.service.ts ; timeseries.service.ts | public.v_ts_catalog_enriched ; public.module_properties ; ref.observed_properties | public ; ref |
| Climat | /api/v1/timeseries/* | timeseries.service.ts | core.measurements ; core.timeseries ; core.stations ; public.measurements ; public.v_values_* | core ; public |
| Hydrologie | /api/v1/hydro/* | hydro.service.ts ; hydroSwatSeries.service.ts | public.stations ; public.reservoirs ; core.reservoir_bathymetry ; access.rch_results ; api.mv_scenario_catalog | public ; core ; access ; api |
| Sédiments | /api/v1/solid-yield/* ; /api/v1/hydro/swat/* | solidYield.service.ts ; erosionSwatSeries.service.ts | access.sub_results ; access.rch_results ; core.station_subbasin_map ; public.v_ts_catalog_enriched | access ; core ; public |
| Transport solide Reach | /api/v1/thematic/reach/* | thematicReach.service.ts | access.rch_results ; gis.reach_shapes ; core.reaches | access ; gis ; core |
| SWAT | POST/GET /api/v1/hydro/swat/* | swatIngestion.service.ts | staging.swat_* ; access.import_runs ; access.rch_results ; access.sub_results ; core.swat_entity_map ; public.v_ts_catalog_enriched | staging ; access ; core ; public |
| Data Scan | /api/v1/data-scan/* | dataScan.service.ts | staging.migration_batches ; staging.norm_measurements ; core.measurements ; core.timeseries ; core.stations ; ref.observed_properties | staging ; core ; ref |
| Cartographie | /api/v1/spatial/* ; /api/v1/maps/* | spatial.service.ts ; maps.service.ts | gis.subbasin_shapes ; gis.reach_shapes ; core.reservoirs ; public.catchments ; public.stations ; api.mv_*catalog (fallback) | gis ; core ; public ; api |
| Programme d’intervention | frontend statique | aucun service DB | aucune table DB consommée | — |
| Siltation | /api/v1/siltation/* | siltation.service.ts | hydro.bathymetry_campaigns ; core.reservoir_bathymetry ; hydro.siltation_evolution ; hydro.siltation_hsv ; hydro.siltation_indicators | hydro ; core |
| Admin | /api/v1/admin/* ; /api/v1/auth/* | users.service.ts ; auth.service.ts | public.users | public |

## 8. Tables sans consommateur application

| Table/Vue | Schéma | Nombre de lignes | Références code | Références vues | Références script | Fonction apparente | Statut |
|---|---|---:|---|---|---|---|---|
| audit.gis_reach_shapes_backup_2026 | audit | 33 | 0 | 0 | 0 | archive, sauvegarde ou contrôle qualité | HISTORIQUE |
| audit.gis_subbasin_shapes_backup_2026 | audit | 33 | 0 | 0 | 0 | archive, sauvegarde ou contrôle qualité | HISTORIQUE |
| audit.nv_limite | audit | 19 | 0 | 0 | 0 | archive, sauvegarde ou contrôle qualité | HISTORIQUE |
| audit.nv_stream | audit | 19 | 0 | 0 | 0 | archive, sauvegarde ou contrôle qualité | HISTORIQUE |
| audit.qc_issues | audit | 0 | 0 | 0 | 0 | archive, sauvegarde ou contrôle qualité | HISTORIQUE |
| audit.qc_runs | audit | 0 | 0 | 0 | 0 | archive, sauvegarde ou contrôle qualité | HISTORIQUE |
| audit.station_reach_map_backup_2026 | audit | 0 | 0 | 0 | 0 | archive, sauvegarde ou contrôle qualité | HISTORIQUE |
| audit.station_subbasin_map_backup_2026 | audit | 0 | 0 | 0 | 0 | archive, sauvegarde ou contrôle qualité | HISTORIQUE |
| audit.swat_entity_map_backup_2026 | audit | 38 | 0 | 0 | 0 | archive, sauvegarde ou contrôle qualité | HISTORIQUE |
| audit.swat_output_archive_rch | audit | 345 510 | 0 | 0 | 0 | archive, sauvegarde ou contrôle qualité | HISTORIQUE |
| audit.swat_output_archive_sub | audit | 345 510 | 0 | 0 | 0 | archive, sauvegarde ou contrôle qualité | HISTORIQUE |
| auth.audit_log | auth | 0 | 0 | 0 | 0 | modèle auth/RBAC non branché | HISTORIQUE |
| auth.permissions | auth | 0 | 0 | 0 | 0 | modèle auth/RBAC non branché | HISTORIQUE |
| auth.role_permissions | auth | 0 | 0 | 0 | 0 | modèle auth/RBAC non branché | HISTORIQUE |
| auth.roles | auth | 0 | 0 | 0 | 0 | modèle auth/RBAC non branché | HISTORIQUE |
| auth.user_roles | auth | 0 | 0 | 0 | 0 | modèle auth/RBAC non branché | HISTORIQUE |
| auth.users | auth | 0 | 0 | 0 | 0 | modèle auth/RBAC non branché | HISTORIQUE |
| gis.reach_shapes_backup_20260422_144537 | gis | 33 | 0 | 0 | 0 | référentiel géospatial | HISTORIQUE |
| public.spatial_ref_sys | public | 8 500 | 0 | 0 | 0 | table technique PostGIS | TECHNIQUE |
| ref.property_domains | ref | 3 | 0 | 0 | 0 | référentiel métier | À VÉRIFIER |
| staging.limite_raw | staging | 33 | 0 | 0 | 0 | zone d’atterrissage / normalisation import | STAGING |
| staging.migration_events | staging | 42 | 0 | 0 | 0 | zone d’atterrissage / normalisation import | STAGING |
| staging.norm_catchments | staging | 3 | 0 | 0 | 0 | zone d’atterrissage / normalisation import | STAGING |
| staging.norm_communes | staging | 258 | 0 | 0 | 0 | zone d’atterrissage / normalisation import | STAGING |
| staging.norm_reservoir_bathymetry | staging | 13 203 | 0 | 0 | 0 | zone d’atterrissage / normalisation import | STAGING |
| staging.norm_reservoirs | staging | 36 | 0 | 0 | 0 | zone d’atterrissage / normalisation import | STAGING |
| staging.norm_stations | staging | 105 | 0 | 0 | 0 | zone d’atterrissage / normalisation import | STAGING |
| staging.raw_adm_communes_abhgzr | staging | 258 | 0 | 0 | 0 | zone d’atterrissage / normalisation import | STAGING |
| staging.raw_barrages_abhgzr | staging | 36 | 0 | 0 | 0 | zone d’atterrissage / normalisation import | STAGING |
| staging.raw_bassin_abhgzr | staging | 3 | 0 | 0 | 0 | zone d’atterrissage / normalisation import | STAGING |
| staging.raw_bathymetries_barrages_abhgzr | staging | 13 203 | 0 | 0 | 0 | zone d’atterrissage / normalisation import | STAGING |
| staging.raw_mesures_debits_jr | staging | 235 587 | 0 | 0 | 0 | zone d’atterrissage / normalisation import | STAGING |
| staging.raw_mesures_evaporation_m | staging | 6 768 | 0 | 0 | 0 | zone d’atterrissage / normalisation import | STAGING |
| staging.raw_mesures_humidite_relative_m | staging | 3 060 | 0 | 0 | 0 | zone d’atterrissage / normalisation import | STAGING |
| staging.raw_mesures_lachers_barrages | staging | 59 583 | 0 | 0 | 0 | zone d’atterrissage / normalisation import | STAGING |
| staging.raw_mesures_precipitations_jr | staging | 328 821 | 0 | 0 | 0 | zone d’atterrissage / normalisation import | STAGING |
| staging.raw_mesures_temperature_jr_pn | staging | 130 392 | 0 | 0 | 0 | zone d’atterrissage / normalisation import | STAGING |
| staging.raw_mesures_temperature_m | staging | 6 084 | 0 | 0 | 0 | zone d’atterrissage / normalisation import | STAGING |
| staging.raw_mesures_vitesse_vent_m | staging | 1 368 | 0 | 0 | 0 | zone d’atterrissage / normalisation import | STAGING |
| staging.raw_stations_abhgzr | staging | 105 | 0 | 0 | 0 | zone d’atterrissage / normalisation import | STAGING |
| staging.reseau_hydro_import_raw | staging | 33 | 0 | 0 | 0 | zone d’atterrissage / normalisation import | STAGING |
| staging.reseau_hydrologie_raw | staging | 33 | 0 | 0 | 0 | zone d’atterrissage / normalisation import | STAGING |
| staging.station_meteo_raw | staging | 5 | 0 | 0 | 0 | zone d’atterrissage / normalisation import | STAGING |
| staging.swat_mdb_imports | staging | 80 | 0 | 0 | 0 | zone d’atterrissage / normalisation import | STAGING |

## 9. Doublons stations

| Table | Clé | Groupes doublons | Lignes concernées | Exemple |
|---|---|---:|---:|---|
| staging.norm_stations | station_code | 35 | 105 | `station_code` dupliqué dans la zone de normalisation |

## 10. Doublons scénarios

| Valeur A | Valeur B | Table | Similarité | Conclusion |
|---|---|---|---|---|
| SWAT_OUTPUT | SWAT_OUTPUT_01 | access.import_runs / core.model_runs | Très forte | Incohérence réelle de codification du même scénario technique |
| OBSERVED | — | core.model_runs uniquement | N/A | run observé canonique, pas de doublon détecté |
| scenario_1 | scenario_1 | core/access | Identique | conforme |
| scenario_2 | scenario_2 | core/access | Identique | conforme |
| scenario_3 | scenario_3 | core/access | Identique | conforme |
| scenario_4 | scenario_4 | core/access | Identique | conforme |
| ssp126 | ssp126 | core/access | Identique | conforme |
| ssp245 | ssp245 | core/access | Identique | conforme |
| ssp585 | ssp585 | core/access | Identique | conforme |
| etat_actuel | etat_actuel | core/access | Identique | conforme |

## 11. Doublons reaches

| Table | Clé | Groupes doublons | Lignes concernées | Conclusion |
|---|---|---:|---:|---|
| core.reaches | `reach_id / reach_code / géométrie` | 0 | 0 | aucun doublon interne détecté |
| core.reaches ↔ audit.gis_reach_shapes_backup_2026 ↔ gis.reach_shapes_backup_20260422_144537 | `reach_id` | 33 IDs communs | 33 lignes par copie | redondance inter-schémas forte, probablement backup/legacy |

## 12. Doublons sous-bassins

| Table | Clé | Groupes doublons | Lignes concernées | Conclusion |
|---|---|---:|---:|---|
| core.subbasins | `subbasin_id / code / géométrie` | 0 | 0 | aucun doublon interne détecté |
| core.subbasins ↔ audit.gis_subbasin_shapes_backup_2026 | `subbasin_id` | 33 IDs communs | 33 lignes par copie | redondance inter-schémas forte, probablement backup/legacy |

## 13. Doublons séries temporelles

| Table | Clé métier | Total | Unique | Doublons | % |
|---|---|---:|---:|---:|---:|
| core.timeseries | station_id+property_id+run_id+source_type+time_step | 383 | 383 | 0 | 0.00 |
| core.measurements | ts_id+datetime | 3 773 400 | 3 773 400 | 0 | 0.00 |
| core.measurement_batches | ts_id+datetime+batch_id | 1 036 530 | 1 036 530 | 0 | 0.00 |

## 14. Doublons SWAT

| Table | Clé métier | Total | Groupes suspects | Lignes concernées | % lignes | Conclusion |
|---|---|---:|---:|---:|---:|---|
| access.rch_results | scenario_code+period_date+entity | 3 637 835 | 812 288 | 2 421 493 | 66.56 | clé approximative utile pour suspicion forte, à confirmer avant correction |
| access.sub_results | scenario_code+period_date+entity | 3 637 835 | 709 798 | 2 643 453 | 72.67 | clé approximative utile pour suspicion forte, à confirmer avant correction |

## 15. Tables potentiellement redondantes

| Table A | Table B | Similarité structure | Similarité données | Usage A | Usage B | Conclusion |
|---|---|---|---|---|---|---|
| access.rch_results | audit.swat_output_archive_rch | forte | forte | résultats SWAT runtime et fallback | aucun consommateur direct détecté | archive / backup probable ou doublon technique |
| access.sub_results | audit.swat_output_archive_sub | forte | forte | résultats SWAT runtime et fallback | aucun consommateur direct détecté | archive / backup probable ou doublon technique |
| audit.gis_reach_shapes_backup_2026 | gis.reach_shapes, gis.reach_shapes_backup_20260422_144537 | forte | forte | aucun consommateur direct détecté | copies secondaires | backup / redondance legacy probable |
| audit.gis_subbasin_shapes_backup_2026 | gis.subbasin_shapes | forte | forte | aucun consommateur direct détecté | référentiel géospatial | archive / backup probable ou doublon technique |
| audit.station_reach_map_backup_2026 | core.station_reach_map | forte | forte | aucun consommateur direct détecté | coeur métier / référentiel principal | archive / backup probable ou doublon technique |
| audit.station_subbasin_map_backup_2026 | core.station_subbasin_map | forte | forte | aucun consommateur direct détecté | coeur métier / référentiel principal | archive / backup probable ou doublon technique |
| audit.swat_entity_map_backup_2026 | core.swat_entity_map | forte | forte | aucun consommateur direct détecté | coeur métier / référentiel principal | archive / backup probable ou doublon technique |

## 16. Redondances entre schémas

| Couple de schémas | Nature | Lecture | Conclusion |
|---|---|---|---|
| core ↔ public | exposition SQL / vues miroir | normale | CONSERVER |
| access ↔ api | api/matviews et fallback sur résultats SWAT | normale partielle | CONSERVER |
| access ↔ audit | archives SWAT dupliquées | legacy probable | AUDITER PLUS |
| gis ↔ audit | backups de géométrie | legacy probable | AUDITER PLUS |
| core ↔ audit | backups de tables de mapping | legacy probable | AUDITER PLUS |
| staging ↔ core | pipeline d’import vers tables métier | normale technique | CONSERVER PARTIELLEMENT |
| hydro ↔ core | tables siltation / bathymétrie dérivée | à vérifier | AUDITER PLUS |

## 17. Données orphelines

| Table | Relation | Orphelins | Exemple | Gravité |
|---|---|---:|---|---|
| Ensemble des relations testées | `measurements→timeseries`, `timeseries→stations`, `timeseries→model_runs`, mappings station/reach/subbasin, références station dans `access.*` | 0 | aucun | faible à ce stade |

## 18. Clés étrangères manquantes

Aucune FK réelle n’existe sur les 89 tables métiers auditées. 200 colonnes `*_id` ou équivalentes ont été relevées comme **candidates FK implicites**.

| Table | Colonnes candidates relevées | Commentaire |
|---|---:|---|
| access.hru_results | 6 | relation implicite présente dans le SQL/code mais non contrainte en base |
| access.scenario_metadata | 6 | relation implicite présente dans le SQL/code mais non contrainte en base |
| api.v_timeseries_enriched | 6 | relation implicite présente dans le SQL/code mais non contrainte en base |
| access.rch_results | 5 | relation implicite présente dans le SQL/code mais non contrainte en base |
| access.weather_inputs | 5 | relation implicite présente dans le SQL/code mais non contrainte en base |
| audit.station_subbasin_map_backup_2026 | 5 | relation implicite présente dans le SQL/code mais non contrainte en base |
| audit.swat_output_archive_rch | 5 | relation implicite présente dans le SQL/code mais non contrainte en base |
| core.station_subbasin_map | 5 | relation implicite présente dans le SQL/code mais non contrainte en base |
| access.sub_results | 4 | relation implicite présente dans le SQL/code mais non contrainte en base |
| api.v_catalog_series | 4 | relation implicite présente dans le SQL/code mais non contrainte en base |
| api.v_erosion_subbasins_annual | 4 | relation implicite présente dans le SQL/code mais non contrainte en base |
| api.v_map_stations_latest | 4 | relation implicite présente dans le SQL/code mais non contrainte en base |
| audit.station_reach_map_backup_2026 | 4 | relation implicite présente dans le SQL/code mais non contrainte en base |
| audit.swat_output_archive_sub | 4 | relation implicite présente dans le SQL/code mais non contrainte en base |
| audit.v_qc_timeseries_without_measurements | 4 | relation implicite présente dans le SQL/code mais non contrainte en base |
| core.reaches | 4 | relation implicite présente dans le SQL/code mais non contrainte en base |
| core.station_reach_map | 4 | relation implicite présente dans le SQL/code mais non contrainte en base |
| core.timeseries | 4 | relation implicite présente dans le SQL/code mais non contrainte en base |
| api.v_catalog_stations | 3 | relation implicite présente dans le SQL/code mais non contrainte en base |
| api.v_compare_monthly | 3 | relation implicite présente dans le SQL/code mais non contrainte en base |

## 19. NULLs anormaux

| Table | Colonne | Total | NULL | % | Normal ? |
|---|---|---:|---:|---:|---|
| access.hru_results | hru_name | 65 209 | 65 209 | 100.00 | NON |
| access.hru_results | reach_code | 65 209 | 65 209 | 100.00 | NON |
| access.hru_results | reach_id | 65 209 | 65 209 | 100.00 | NON |
| access.hru_results | runoff_mm | 65 209 | 65 209 | 100.00 | NON |
| access.rch_results | reach_code | 3 637 835 | 3 637 835 | 100.00 | NON |
| access.rch_results | reach_id | 3 637 835 | 3 637 835 | 100.00 | NON |
| access.scenario_metadata | parameter_code | 8 248 | 8 248 | 100.00 | NON |
| access.scenario_metadata | parameter_name | 8 248 | 8 248 | 100.00 | NON |
| access.scenario_metadata | parameter_value_bool | 8 248 | 8 248 | 100.00 | NON |
| access.scenario_metadata | parameter_value_num | 8 248 | 8 248 | 100.00 | NON |
| access.scenario_metadata | parameter_value_text | 8 248 | 8 248 | 100.00 | NON |
| access.scenario_metadata | reach_id | 8 248 | 8 248 | 100.00 | NON |
| access.sub_results | reach_code | 3 637 835 | 3 637 835 | 100.00 | NON |
| access.weather_inputs | hru_code | 13 900 | 13 900 | 100.00 | NON |
| access.weather_inputs | reach_code | 13 900 | 13 900 | 100.00 | NON |
| access.weather_inputs | station_code | 13 900 | 13 900 | 100.00 | NON |
| access.weather_inputs | station_name | 13 900 | 13 900 | 100.00 | NON |
| audit.nv_limite | bname | 19 | 19 | 100.00 | NON |
| audit.swat_entity_map_backup_2026 | station_id | 38 | 38 | 100.00 | NON |
| audit.swat_output_archive_rch | import_batch_id | 345 510 | 345 510 | 100.00 | NON |
| audit.swat_output_archive_rch | reach_code | 345 510 | 345 510 | 100.00 | NON |
| audit.swat_output_archive_rch | reach_id | 345 510 | 345 510 | 100.00 | NON |
| audit.swat_output_archive_rch | station_id | 345 510 | 345 510 | 100.00 | NON |
| audit.swat_output_archive_rch | station_subbasin_map_id | 345 510 | 345 510 | 100.00 | NON |
| audit.swat_output_archive_sub | import_batch_id | 345 510 | 345 510 | 100.00 | NON |
| audit.swat_output_archive_sub | reach_code | 345 510 | 345 510 | 100.00 | NON |
| audit.swat_output_archive_sub | station_id | 345 510 | 345 510 | 100.00 | NON |
| audit.swat_output_archive_sub | station_subbasin_map_id | 345 510 | 345 510 | 100.00 | NON |
| core.catchments | dam_name | 33 | 33 | 100.00 | NON |
| core.reaches | river_id | 33 | 33 | 100.00 | NON |

## 20. PostGIS

| Table | Colonne | SRID | Invalides | Vides | NULL | Doublons |
|---|---|---:|---:|---:|---:|---:|
| api.v_catalog_stations | geom | 4326 | 0 | 0 | 1 | 6 |
| api.v_erosion_subbasins_annual | geom | n/d | 0 | 0 | 0 | 0 |
| api.v_map_catchments_annual | geom | 4326 | 412 | 0 | 0 | 411 |
| api.v_map_stations_latest | geom | 4326 | 0 | 0 | 2 | 48 |
| audit.gis_reach_shapes_backup_2026 | geom | 4326 | 1 | 0 | 0 | 0 |
| audit.gis_subbasin_shapes_backup_2026 | geom | 4326 | 3 | 0 | 0 | 0 |
| audit.nv_limite | wkb_geometry | 4326 | 2 | 0 | 0 | 0 |
| audit.nv_stream | wkb_geometry | 4326 | 0 | 0 | 0 | 0 |
| core.catchments | geom | 4326 | 3 | 0 | 0 | 0 |
| core.reaches | geom | 4326 | 1 | 0 | 0 | 0 |
| core.reservoirs | geom | 4326 | 0 | 0 | 0 | 0 |
| core.stations | geom | 4326 | 0 | 0 | 68 | 68 |
| core.subbasins | geom | 4326 | 3 | 0 | 0 | 0 |
| geo.landcover | geom | n/d | 0 | 0 | 0 | 0 |
| gis.meteo_stations | geom | 4326 | 0 | 0 | 0 | 0 |
| gis.reach_shapes | geom | 4326 | 0 | 0 | 0 | 0 |
| gis.reach_shapes_backup_20260422_144537 | geom | 4326 | 1 | 0 | 0 | 0 |
| gis.subbasin_shapes | geom | 4326 | 0 | 0 | 0 | 0 |
| old_hd.adm_communes_abhgzr | geom | could not connect to server "old_hd_srv" DETAIL:  connection to server at "localhost" (::1), port 5432 failed: FATAL:  database "bd_hassdakh" does not exist | 0 | 0 | 0 | 0 |
| old_hd.barrages_abhgzr | geom | could not connect to server "old_hd_srv" DETAIL:  connection to server at "localhost" (::1), port 5432 failed: FATAL:  database "bd_hassdakh" does not exist | 0 | 0 | 0 | 0 |
| old_hd.bassin_abhgzr | geom | could not connect to server "old_hd_srv" DETAIL:  connection to server at "localhost" (::1), port 5432 failed: FATAL:  database "bd_hassdakh" does not exist | 0 | 0 | 0 | 0 |
| old_hd.stations_abhgzr | geom | could not connect to server "old_hd_srv" DETAIL:  connection to server at "localhost" (::1), port 5432 failed: FATAL:  database "bd_hassdakh" does not exist | 0 | 0 | 0 | 0 |
| public.catchments | geom | 4326 | 3 | 0 | 0 | 0 |
| public.communes | geom | 4326 | 0 | 0 | 0 | 0 |
| public.landcover | geom | n/d | 0 | 0 | 0 | 0 |
| public.reaches | geom | 4326 | 1 | 0 | 0 | 0 |
| public.reservoirs | geom | 4326 | 0 | 0 | 0 | 0 |
| public.stations | geom | 4326 | 0 | 0 | 68 | 68 |
| public.subbasins | geom | 4326 | 3 | 0 | 0 | 0 |
| public.v_catchments_geo | geom | 4326 | 3 | 0 | 0 | 0 |
| public.v_reaches_geo | geom | 4326 | 1 | 0 | 0 | 0 |
| public.v_reservoirs_geo | geom | 4326 | 0 | 0 | 0 | 0 |
| public.v_stations_geo | geom | 4326 | 0 | 0 | 68 | 68 |
| public.v_subbasins_geo | geom | 4326 | 3 | 0 | 0 | 0 |
| ref.communes | geom | 4326 | 0 | 0 | 0 | 0 |
| staging.limite_raw | geom | 4326 | 3 | 0 | 0 | 0 |
| staging.norm_catchments | geom | 4326 | 0 | 0 | 0 | 2 |
| staging.norm_communes | geom | 4326 | 0 | 0 | 0 | 172 |
| staging.norm_reservoirs | geom | 4326 | 0 | 0 | 0 | 24 |
| staging.norm_stations | geom | 4326 | 0 | 0 | 3 | 71 |
| staging.reseau_hydro_import_raw | geom | 32630 | 1 | 0 | 0 | 0 |
| staging.reseau_hydrologie_raw | geom | 4326 | 1 | 0 | 0 | 0 |
| staging.station_meteo_raw | geom | 4326 | 0 | 0 | 0 | 0 |

## 21. Vues

| Vue | Sources | Lignes | Consommateur | Statut |
|---|---|---:|---|---|
| api.v_catalog_properties | ref.observed_properties, ref.property_domain_membership | 10 | backend 1 | ACTIVE |
| api.v_catalog_scenarios | api.v_timeseries_enriched, core.model_runs, ref.property_domain_membership | 3 | aucune | À VÉRIFIER |
| api.v_catalog_series | api.v_timeseries_enriched, ref.property_domain_membership | 56 | aucune | À VÉRIFIER |
| api.v_catalog_stations | api.v_timeseries_enriched, core.stations, ref.property_domain_membership | 14 | aucune | À VÉRIFIER |
| api.v_compare_monthly | api.v_measurements_monthly, api.v_timeseries_enriched | 131800 | aucune | NON UTILISÉE POTENTIELLE |
| api.v_dashboard_catchment_counts | core.catchments, core.measurements, core.reaches, core.reservoirs, core.stations (+2) | 33 | aucune | NON UTILISÉE POTENTIELLE |
| api.v_dashboard_national_counts | core.catchments, core.measurements, core.reaches, core.reservoirs, core.rivers (+3) | 1 | aucune | NON UTILISÉE POTENTIELLE |
| api.v_dashboard_reservoir_counts | core.catchments, core.reservoir_bathymetry, core.reservoirs | 12 | aucune | NON UTILISÉE POTENTIELLE |
| api.v_erosion_subbasins_annual | core.model_runs, core.subbasin_metrics_annual, core.subbasins, ref.observed_properties, ref.property_domain_membership | 0 | aucune | NON UTILISÉE POTENTIELLE |
| api.v_map_catchments_annual | api.v_measurements_annual, api.v_timeseries_enriched, core.catchments, core.stations, ref.property_domain_membership | 412 | aucune | À VÉRIFIER |
| api.v_map_stations_latest | api.v_measurements_latest, api.v_timeseries_enriched, core.stations, ref.property_domain_membership | 56 | aucune | À VÉRIFIER |
| api.v_measurements_annual | core.measurements | 11485 | aucune | À VÉRIFIER |
| api.v_measurements_annual_agg | core.measurements | 11485 | aucune | À VÉRIFIER |
| api.v_measurements_daily | core.measurements | 3773400 | aucune | À VÉRIFIER |
| api.v_measurements_latest | core.measurements | 383 | aucune | À VÉRIFIER |
| api.v_measurements_monthly | core.measurements | 131800 | aucune | À VÉRIFIER |
| api.v_measurements_monthly_agg | core.measurements | 131800 | aucune | À VÉRIFIER |
| api.v_qc_property_domain_tovalidate | ref.observed_properties, ref.property_domain_membership | 3 | aucune | NON UTILISÉE POTENTIELLE |
| api.v_series_stats | api.v_timeseries_enriched, core.measurements, ref.property_domain_membership | 56 | aucune | NON UTILISÉE POTENTIELLE |
| api.v_timeseries_enriched | core.model_runs, core.stations, core.timeseries, ref.observed_properties | 383 | aucune | NON UTILISÉE POTENTIELLE |
| audit.v_qc_measurements_duplicates | core.measurements | 0 | aucune | LEGACY |
| audit.v_qc_measurements_orphans | core.measurements, core.timeseries | 0 | aucune | LEGACY |
| audit.v_qc_null_geometry | core.catchments, core.reaches, core.reservoirs, core.stations, core.subbasins (+2) | 7 | aucune | LEGACY |
| audit.v_qc_timeseries_duplicates | core.timeseries | 0 | aucune | LEGACY |
| audit.v_qc_timeseries_without_measurements | core.measurements, core.timeseries | 0 | aucune | LEGACY |
| public.catchments | core.catchments | 33 | backend 1 | ACTIVE |
| public.communes | ref.communes | 86 | aucune | NON UTILISÉE POTENTIELLE |
| public.geography_columns | — | 0 | aucune | NON UTILISÉE POTENTIELLE |
| public.geometry_columns | — | 43 | backend 2 | ACTIVE |
| public.landcover | geo.landcover | 0 | backend 1 | ACTIVE |
| public.landcover_classes | ref.landcover_classes | 0 | aucune | NON UTILISÉE POTENTIELLE |
| public.landcover_periods | ref.landcover_periods | 0 | aucune | NON UTILISÉE POTENTIELLE |
| public.measurements | core.measurements | 3773400 | backend 3 | ACTIVE |
| public.model_runs | core.model_runs | 10 | backend 6 | ACTIVE |
| public.observed_properties | ref.observed_properties | 13 | backend 1, scripts backend 1 | ACTIVE |
| public.reaches | core.reaches | 33 | aucune | À VÉRIFIER |
| public.reservoir_bathymetry | core.reservoir_bathymetry | 4401 | backend 1 | ACTIVE |
| public.reservoirs | core.reservoirs | 12 | backend 1 | ACTIVE |
| public.rivers | core.rivers | 0 | aucune | NON UTILISÉE POTENTIELLE |
| public.stations | core.stations | 102 | backend 3, scripts backend 1 | ACTIVE |
| public.subbasins | core.subbasins | 33 | aucune | À VÉRIFIER |
| public.timeseries | core.timeseries | 383 | backend 4, scripts backend 1 | ACTIVE |
| public.v_catchments_geo | core.catchments | 33 | aucune | NON UTILISÉE POTENTIELLE |
| public.v_map_station | core.stations | 102 | aucune | NON UTILISÉE POTENTIELLE |
| public.v_measurements_full | core.measurements, public.v_ts_catalog | 3773400 | aucune | NON UTILISÉE POTENTIELLE |
| public.v_property_agg_rule | public.v_property_module | 13 | aucune | NON UTILISÉE POTENTIELLE |
| public.v_property_catalog | ref.observed_properties | 13 | aucune | NON UTILISÉE POTENTIELLE |
| public.v_property_catalog_final | public.property_module_override, public.v_property_catalog | 13 | aucune | NON UTILISÉE POTENTIELLE |
| public.v_property_module | ref.observed_properties | 13 | aucune | NON UTILISÉE POTENTIELLE |
| public.v_reaches_geo | core.catchments, core.reaches, core.rivers, core.subbasins | 33 | aucune | NON UTILISÉE POTENTIELLE |
| public.v_reservoirs_geo | core.catchments, core.reaches, core.reservoir_bathymetry, core.reservoirs | 12 | aucune | NON UTILISÉE POTENTIELLE |
| public.v_stations_geo | core.catchments, core.reaches, core.rivers, core.stations | 102 | aucune | NON UTILISÉE POTENTIELLE |
| public.v_stats_bathymetry | core.reservoir_bathymetry, core.reservoirs | 1 | aucune | NON UTILISÉE POTENTIELLE |
| public.v_stats_bathymetry_global | core.reservoir_bathymetry | 1 | aucune | NON UTILISÉE POTENTIELLE |
| public.v_stats_evaporation | public.v_stats_property_station_timestep | 0 | aucune | NON UTILISÉE POTENTIELLE |
| public.v_stats_evaporation_global | public.v_stats_property_timestep | 0 | aucune | NON UTILISÉE POTENTIELLE |
| public.v_stats_humidity | public.v_stats_property_station_timestep | 0 | aucune | NON UTILISÉE POTENTIELLE |
| public.v_stats_humidity_global | public.v_stats_property_timestep | 0 | aucune | NON UTILISÉE POTENTIELLE |
| public.v_stats_lachers | public.v_stats_property_station_timestep | 0 | aucune | NON UTILISÉE POTENTIELLE |
| public.v_stats_lachers_global | public.v_stats_property_timestep | 0 | aucune | NON UTILISÉE POTENTIELLE |
| public.v_stats_precipitation | public.v_stats_property_station_timestep | 0 | aucune | NON UTILISÉE POTENTIELLE |
| public.v_stats_precipitation_global | public.v_stats_property_timestep | 0 | aucune | NON UTILISÉE POTENTIELLE |
| public.v_stats_property_station_timestep | core.measurements, core.stations, core.timeseries, ref.observed_properties | 155 | aucune | NON UTILISÉE POTENTIELLE |
| public.v_stats_property_timestep | core.measurements, core.timeseries, ref.observed_properties | 16 | aucune | NON UTILISÉE POTENTIELLE |
| public.v_stats_sediment_load | public.v_stats_property_station_timestep | 0 | aucune | NON UTILISÉE POTENTIELLE |
| public.v_stats_sediment_load_global | public.v_stats_property_timestep | 0 | aucune | NON UTILISÉE POTENTIELLE |
| public.v_stats_streamflow | public.v_stats_property_station_timestep | 0 | aucune | NON UTILISÉE POTENTIELLE |
| public.v_stats_streamflow_global | public.v_stats_property_timestep | 0 | aucune | NON UTILISÉE POTENTIELLE |
| public.v_stats_temperature_all | public.v_stats_property_station_timestep | 0 | aucune | NON UTILISÉE POTENTIELLE |
| public.v_stats_temperature_all_global | public.v_stats_property_timestep | 0 | aucune | NON UTILISÉE POTENTIELLE |
| public.v_stats_temperature_max | public.v_stats_property_station_timestep | 0 | aucune | NON UTILISÉE POTENTIELLE |
| public.v_stats_temperature_max_global | public.v_stats_property_timestep | 0 | aucune | NON UTILISÉE POTENTIELLE |
| public.v_stats_temperature_mean | public.v_stats_property_station_timestep | 0 | aucune | NON UTILISÉE POTENTIELLE |
| public.v_stats_temperature_mean_global | public.v_stats_property_timestep | 0 | aucune | NON UTILISÉE POTENTIELLE |
| public.v_stats_temperature_min | public.v_stats_property_station_timestep | 0 | aucune | NON UTILISÉE POTENTIELLE |
| public.v_stats_temperature_min_global | public.v_stats_property_timestep | 0 | aucune | NON UTILISÉE POTENTIELLE |
| public.v_stats_wind_speed | public.v_stats_property_station_timestep | 0 | aucune | NON UTILISÉE POTENTIELLE |
| public.v_stats_wind_speed_global | public.v_stats_property_timestep | 0 | aucune | NON UTILISÉE POTENTIELLE |
| public.v_subbasins_geo | core.catchments, core.subbasins | 33 | aucune | NON UTILISÉE POTENTIELLE |
| public.v_ts_catalog | core.catchments, core.model_runs, core.stations, core.timeseries, ref.observed_properties | 383 | backend 7, scripts 1 | ACTIVE |
| public.v_ts_catalog_enriched | core.measurements, public.v_ts_catalog | 383 | backend 6, scripts 1 | ACTIVE |
| public.v_values_annual | public.v_values_measurements | 11485 | aucune | À VÉRIFIER |
| public.v_values_bathymetry | core.catchments, core.reservoir_bathymetry, core.reservoirs | 4401 | backend 1 | ACTIVE |
| public.v_values_evaporation_annual | public.v_values_annual, ref.observed_properties | 182 | aucune | À VÉRIFIER |
| public.v_values_evaporation_monthly | public.v_values_monthly, ref.observed_properties | 2031 | aucune | À VÉRIFIER |
| public.v_values_evaporation_obs | public.v_values_measurements, ref.observed_properties | 2031 | aucune | À VÉRIFIER |
| public.v_values_humidity_annual | public.v_values_annual, ref.observed_properties | 87 | aucune | À VÉRIFIER |
| public.v_values_humidity_monthly | public.v_values_monthly, ref.observed_properties | 928 | aucune | À VÉRIFIER |
| public.v_values_humidity_obs | public.v_values_measurements, ref.observed_properties | 928 | aucune | À VÉRIFIER |
| public.v_values_lachers_annual | public.v_values_annual, ref.observed_properties | 72 | aucune | À VÉRIFIER |
| public.v_values_lachers_monthly | public.v_values_monthly, ref.observed_properties | 855 | aucune | À VÉRIFIER |
| public.v_values_lachers_obs | public.v_values_measurements, ref.observed_properties | 25993 | aucune | À VÉRIFIER |
| public.v_values_measurements | core.catchments, core.measurements, core.model_runs, core.stations, core.timeseries (+1) | 3773400 | aucune | À VÉRIFIER |
| public.v_values_monthly | public.v_values_measurements | 131800 | aucune | À VÉRIFIER |
| public.v_values_precipitation_annual | public.v_values_annual, ref.observed_properties | 304 | aucune | À VÉRIFIER |
| public.v_values_precipitation_monthly | public.v_values_monthly, ref.observed_properties | 3536 | aucune | À VÉRIFIER |
| public.v_values_precipitation_obs | public.v_values_measurements, ref.observed_properties | 107627 | aucune | À VÉRIFIER |
| public.v_values_sediment_load_annual | public.v_values_annual, ref.observed_properties | 0 | aucune | À VÉRIFIER |
| public.v_values_sediment_load_monthly | public.v_values_monthly, ref.observed_properties | 0 | aucune | À VÉRIFIER |
| public.v_values_sediment_load_obs | public.v_values_measurements, ref.observed_properties | 0 | aucune | À VÉRIFIER |
| public.v_values_streamflow_annual | public.v_values_annual, ref.observed_properties | 218 | aucune | À VÉRIFIER |
| public.v_values_streamflow_monthly | public.v_values_monthly, ref.observed_properties | 2562 | aucune | À VÉRIFIER |
| public.v_values_streamflow_obs | public.v_values_measurements, ref.observed_properties | 77950 | aucune | À VÉRIFIER |
| public.v_values_temperature_all_obs | public.v_values_measurements, ref.observed_properties | 134817 | aucune | À VÉRIFIER |
| public.v_values_temperature_max_annual | public.v_values_annual, ref.observed_properties | 285 | aucune | À VÉRIFIER |
| public.v_values_temperature_max_monthly | public.v_values_monthly, ref.observed_properties | 3199 | aucune | À VÉRIFIER |
| public.v_values_temperature_max_obs | public.v_values_measurements, ref.observed_properties | 45235 | aucune | À VÉRIFIER |
| public.v_values_temperature_mean_annual | public.v_values_annual, ref.observed_properties | 217 | aucune | À VÉRIFIER |
| public.v_values_temperature_mean_monthly | public.v_values_monthly, ref.observed_properties | 2408 | aucune | À VÉRIFIER |
| public.v_values_temperature_mean_obs | public.v_values_measurements, ref.observed_properties | 44444 | aucune | À VÉRIFIER |
| public.v_values_temperature_min_annual | public.v_values_annual, ref.observed_properties | 275 | aucune | À VÉRIFIER |
| public.v_values_temperature_min_monthly | public.v_values_monthly, ref.observed_properties | 3102 | aucune | À VÉRIFIER |
| public.v_values_temperature_min_obs | public.v_values_measurements, ref.observed_properties | 45138 | aucune | À VÉRIFIER |
| public.v_values_wind_speed_annual | public.v_values_annual, ref.observed_properties | 35 | aucune | À VÉRIFIER |
| public.v_values_wind_speed_monthly | public.v_values_monthly, ref.observed_properties | 364 | aucune | À VÉRIFIER |
| public.v_values_wind_speed_obs | public.v_values_measurements, ref.observed_properties | 364 | aucune | À VÉRIFIER |

## 22. Vues non utilisées (consommateur direct non détecté)

| Vue | Type | Lignes | Statut |
|---|---|---:|---|
| api.mv_dashboard_catchment_counts | matview | n/d | À VÉRIFIER |
| api.mv_dashboard_reservoir_counts | matview | 12 | À VÉRIFIER |
| api.v_catalog_scenarios | view | 3 | À VÉRIFIER |
| api.v_catalog_series | view | 56 | À VÉRIFIER |
| api.v_catalog_stations | view | 14 | À VÉRIFIER |
| api.v_compare_monthly | view | 131800 | NON UTILISÉE POTENTIELLE |
| api.v_dashboard_catchment_counts | view | 33 | NON UTILISÉE POTENTIELLE |
| api.v_dashboard_national_counts | view | 1 | NON UTILISÉE POTENTIELLE |
| api.v_dashboard_reservoir_counts | view | 12 | NON UTILISÉE POTENTIELLE |
| api.v_erosion_subbasins_annual | view | 0 | NON UTILISÉE POTENTIELLE |
| api.v_map_catchments_annual | view | 412 | À VÉRIFIER |
| api.v_map_stations_latest | view | 56 | À VÉRIFIER |
| api.v_measurements_annual | view | 11485 | À VÉRIFIER |
| api.v_measurements_annual_agg | view | 11485 | À VÉRIFIER |
| api.v_measurements_daily | view | 3773400 | À VÉRIFIER |
| api.v_measurements_latest | view | 383 | À VÉRIFIER |
| api.v_measurements_monthly | view | 131800 | À VÉRIFIER |
| api.v_measurements_monthly_agg | view | 131800 | À VÉRIFIER |
| api.v_qc_property_domain_tovalidate | view | 3 | NON UTILISÉE POTENTIELLE |
| api.v_series_stats | view | 56 | NON UTILISÉE POTENTIELLE |
| api.v_timeseries_enriched | view | 383 | NON UTILISÉE POTENTIELLE |
| audit.v_qc_measurements_duplicates | view | 0 | LEGACY |
| audit.v_qc_measurements_orphans | view | 0 | LEGACY |
| audit.v_qc_null_geometry | view | 7 | LEGACY |
| audit.v_qc_timeseries_duplicates | view | 0 | LEGACY |
| audit.v_qc_timeseries_without_measurements | view | 0 | LEGACY |
| public.communes | view | 86 | NON UTILISÉE POTENTIELLE |
| public.geography_columns | view | 0 | NON UTILISÉE POTENTIELLE |
| public.landcover_classes | view | 0 | NON UTILISÉE POTENTIELLE |
| public.landcover_periods | view | 0 | NON UTILISÉE POTENTIELLE |
| public.reaches | view | 33 | À VÉRIFIER |
| public.rivers | view | 0 | NON UTILISÉE POTENTIELLE |
| public.subbasins | view | 33 | À VÉRIFIER |
| public.v_catchments_geo | view | 33 | NON UTILISÉE POTENTIELLE |
| public.v_map_station | view | 102 | NON UTILISÉE POTENTIELLE |
| public.v_measurements_full | view | 3773400 | NON UTILISÉE POTENTIELLE |
| public.v_property_agg_rule | view | 13 | NON UTILISÉE POTENTIELLE |
| public.v_property_catalog | view | 13 | NON UTILISÉE POTENTIELLE |
| public.v_property_catalog_final | view | 13 | NON UTILISÉE POTENTIELLE |
| public.v_property_module | view | 13 | NON UTILISÉE POTENTIELLE |
| public.v_reaches_geo | view | 33 | NON UTILISÉE POTENTIELLE |
| public.v_reservoirs_geo | view | 12 | NON UTILISÉE POTENTIELLE |
| public.v_stations_geo | view | 102 | NON UTILISÉE POTENTIELLE |
| public.v_stats_bathymetry | view | 1 | NON UTILISÉE POTENTIELLE |
| public.v_stats_bathymetry_global | view | 1 | NON UTILISÉE POTENTIELLE |
| public.v_stats_evaporation | view | 0 | NON UTILISÉE POTENTIELLE |
| public.v_stats_evaporation_global | view | 0 | NON UTILISÉE POTENTIELLE |
| public.v_stats_humidity | view | 0 | NON UTILISÉE POTENTIELLE |
| public.v_stats_humidity_global | view | 0 | NON UTILISÉE POTENTIELLE |
| public.v_stats_lachers | view | 0 | NON UTILISÉE POTENTIELLE |
| public.v_stats_lachers_global | view | 0 | NON UTILISÉE POTENTIELLE |
| public.v_stats_precipitation | view | 0 | NON UTILISÉE POTENTIELLE |
| public.v_stats_precipitation_global | view | 0 | NON UTILISÉE POTENTIELLE |
| public.v_stats_property_station_timestep | view | 155 | NON UTILISÉE POTENTIELLE |
| public.v_stats_property_timestep | view | 16 | NON UTILISÉE POTENTIELLE |
| public.v_stats_sediment_load | view | 0 | NON UTILISÉE POTENTIELLE |
| public.v_stats_sediment_load_global | view | 0 | NON UTILISÉE POTENTIELLE |
| public.v_stats_streamflow | view | 0 | NON UTILISÉE POTENTIELLE |
| public.v_stats_streamflow_global | view | 0 | NON UTILISÉE POTENTIELLE |
| public.v_stats_temperature_all | view | 0 | NON UTILISÉE POTENTIELLE |
| public.v_stats_temperature_all_global | view | 0 | NON UTILISÉE POTENTIELLE |
| public.v_stats_temperature_max | view | 0 | NON UTILISÉE POTENTIELLE |
| public.v_stats_temperature_max_global | view | 0 | NON UTILISÉE POTENTIELLE |
| public.v_stats_temperature_mean | view | 0 | NON UTILISÉE POTENTIELLE |
| public.v_stats_temperature_mean_global | view | 0 | NON UTILISÉE POTENTIELLE |
| public.v_stats_temperature_min | view | 0 | NON UTILISÉE POTENTIELLE |
| public.v_stats_temperature_min_global | view | 0 | NON UTILISÉE POTENTIELLE |
| public.v_stats_wind_speed | view | 0 | NON UTILISÉE POTENTIELLE |
| public.v_stats_wind_speed_global | view | 0 | NON UTILISÉE POTENTIELLE |
| public.v_subbasins_geo | view | 33 | NON UTILISÉE POTENTIELLE |
| public.v_values_annual | view | 11485 | À VÉRIFIER |
| public.v_values_evaporation_annual | view | 182 | À VÉRIFIER |
| public.v_values_evaporation_monthly | view | 2031 | À VÉRIFIER |
| public.v_values_evaporation_obs | view | 2031 | À VÉRIFIER |
| public.v_values_humidity_annual | view | 87 | À VÉRIFIER |
| public.v_values_humidity_monthly | view | 928 | À VÉRIFIER |
| public.v_values_humidity_obs | view | 928 | À VÉRIFIER |
| public.v_values_lachers_annual | view | 72 | À VÉRIFIER |
| public.v_values_lachers_monthly | view | 855 | À VÉRIFIER |
| public.v_values_lachers_obs | view | 25993 | À VÉRIFIER |
| public.v_values_measurements | view | 3773400 | À VÉRIFIER |
| public.v_values_monthly | view | 131800 | À VÉRIFIER |
| public.v_values_precipitation_annual | view | 304 | À VÉRIFIER |
| public.v_values_precipitation_monthly | view | 3536 | À VÉRIFIER |
| public.v_values_precipitation_obs | view | 107627 | À VÉRIFIER |
| public.v_values_sediment_load_annual | view | 0 | À VÉRIFIER |
| public.v_values_sediment_load_monthly | view | 0 | À VÉRIFIER |
| public.v_values_sediment_load_obs | view | 0 | À VÉRIFIER |
| public.v_values_streamflow_annual | view | 218 | À VÉRIFIER |
| public.v_values_streamflow_monthly | view | 2562 | À VÉRIFIER |
| public.v_values_streamflow_obs | view | 77950 | À VÉRIFIER |
| public.v_values_temperature_all_obs | view | 134817 | À VÉRIFIER |
| public.v_values_temperature_max_annual | view | 285 | À VÉRIFIER |
| public.v_values_temperature_max_monthly | view | 3199 | À VÉRIFIER |
| public.v_values_temperature_max_obs | view | 45235 | À VÉRIFIER |
| public.v_values_temperature_mean_annual | view | 217 | À VÉRIFIER |
| public.v_values_temperature_mean_monthly | view | 2408 | À VÉRIFIER |
| public.v_values_temperature_mean_obs | view | 44444 | À VÉRIFIER |
| public.v_values_temperature_min_annual | view | 275 | À VÉRIFIER |
| public.v_values_temperature_min_monthly | view | 3102 | À VÉRIFIER |
| public.v_values_temperature_min_obs | view | 45138 | À VÉRIFIER |
| public.v_values_wind_speed_annual | view | 35 | À VÉRIFIER |
| public.v_values_wind_speed_monthly | view | 364 | À VÉRIFIER |
| public.v_values_wind_speed_obs | view | 364 | À VÉRIFIER |

## 23. Vues matérialisées

| MatView | Dernier refresh | Taille | Source | Utilisateur | Endpoint / service | Statut |
|---|---|---:|---|---|---|---|
| api.mv_dashboard_catchment_counts | non disponible dans le catalogue standard | 8192 bytes | api.v_dashboard_catchment_counts | postgres | aucune | non peuplée (`relispopulated = false`) |
| api.mv_dashboard_reservoir_counts | non disponible dans le catalogue standard | 24 kB | api.v_dashboard_reservoir_counts | postgres | aucune | peuplée |
| api.mv_scenario_catalog | non disponible dans le catalogue standard | 24 kB | access.hru_results, access.rch_results, access.sub_results, access.weather_inputs, core.model_runs | postgres | backend 2 | peuplée |

Matviews attendues par le backend mais absentes :

- `api.mv_hydro_station_timeseries`
- `api.mv_hydro_station_stats`
- `api.mv_hydro_subbasin_metrics_annual`
- `api.mv_station_catalog`
- `api.mv_barrage_catalog`
- `api.mv_basin_catalog`
- `api.mv_subbasin_catalog`
- `api.mv_reach_catalog`

## 24. Indexes

- Aucun index dupliqué détecté dans les statistiques extraites.
- 23 tables sur 89 possèdent au moins un index explicite.
- Plusieurs tables volumineuses restent sans index explicite exploitable sur les clés métier ou de jointure.

| Table | Lignes | Taille | Lecture |
|---|---:|---:|---|
| access.rch_results | 3 637 835 | 2432 MB | table critique sans index explicite détecté |
| audit.swat_output_archive_rch | 345 510 | 169 MB | archive volumineuse sans index |
| staging.norm_measurements | 1 049 166 | 156 MB | staging volumineux sans index |
| audit.swat_output_archive_sub | 345 510 | 100 MB | archive volumineuse sans index |
| staging.raw_mesures_precipitations_jr | 328 821 | 43 MB | staging volumineux sans index |
| staging.raw_mesures_debits_jr | 235 587 | 28 MB | staging volumineux sans index |

## 25. Contraintes

- PRIMARY KEY : **9**
- FOREIGN KEY : **0**
- UNIQUE : **4**
- CHECK : **379**
- Tables sans PK : **80 / 89**
- Tables sans FK : **89 / 89**

Tables portant une PK :

- `audit.nv_limite`
- `audit.nv_stream`
- `core.data_batches`
- `core.swat_entity_map`
- `hydro.bathymetry_campaigns`
- `hydro.siltation_evolution`
- `hydro.siltation_hsv`
- `hydro.siltation_indicators`
- `public.spatial_ref_sys`

## 26. Staging

| Table staging | Lignes | Taille | Source / rôle | Utilisée par import actuel ? | Statut |
|---|---:|---:|---|---|---|
| limite_raw | 33 | 984 kB | zone d’atterrissage / normalisation import | NON (aucune réf directe) | STAGING |
| migration_batches | 3 | 16 kB | zone d’atterrissage / normalisation import | OUI | STAGING |
| migration_events | 42 | 16 kB | zone d’atterrissage / normalisation import | NON (aucune réf directe) | STAGING |
| norm_catchments | 3 | 240 kB | zone d’atterrissage / normalisation import | NON (aucune réf directe) | STAGING |
| norm_communes | 258 | 1904 kB | zone d’atterrissage / normalisation import | NON (aucune réf directe) | STAGING |
| norm_measurements | 1 049 166 | 156 MB | zone d’atterrissage / normalisation import | OUI | STAGING |
| norm_reservoir_bathymetry | 13 203 | 2048 kB | zone d’atterrissage / normalisation import | NON (aucune réf directe) | STAGING |
| norm_reservoirs | 36 | 16 kB | zone d’atterrissage / normalisation import | NON (aucune réf directe) | STAGING |
| norm_stations | 105 | 80 kB | zone d’atterrissage / normalisation import | NON (aucune réf directe) | STAGING |
| raw_adm_communes_abhgzr | 258 | 2816 kB | zone d’atterrissage / normalisation import | NON (aucune réf directe) | STAGING |
| raw_barrages_abhgzr | 36 | 16 kB | zone d’atterrissage / normalisation import | NON (aucune réf directe) | STAGING |
| raw_bassin_abhgzr | 3 | 448 kB | zone d’atterrissage / normalisation import | NON (aucune réf directe) | STAGING |
| raw_bathymetries_barrages_abhgzr | 13 203 | 1968 kB | zone d’atterrissage / normalisation import | NON (aucune réf directe) | STAGING |
| raw_mesures_debits_jr | 235 587 | 28 MB | zone d’atterrissage / normalisation import | NON (aucune réf directe) | STAGING |
| raw_mesures_evaporation_m | 6 768 | 856 kB | zone d’atterrissage / normalisation import | NON (aucune réf directe) | STAGING |
| raw_mesures_humidite_relative_m | 3 060 | 424 kB | zone d’atterrissage / normalisation import | NON (aucune réf directe) | STAGING |
| raw_mesures_lachers_barrages | 59 583 | 8296 kB | zone d’atterrissage / normalisation import | NON (aucune réf directe) | STAGING |
| raw_mesures_precipitations_jr | 328 821 | 43 MB | zone d’atterrissage / normalisation import | NON (aucune réf directe) | STAGING |
| raw_mesures_temperature_jr_pn | 130 392 | 19 MB | zone d’atterrissage / normalisation import | NON (aucune réf directe) | STAGING |
| raw_mesures_temperature_m | 6 084 | 824 kB | zone d’atterrissage / normalisation import | NON (aucune réf directe) | STAGING |
| raw_mesures_vitesse_vent_m | 1 368 | 208 kB | zone d’atterrissage / normalisation import | NON (aucune réf directe) | STAGING |
| raw_stations_abhgzr | 105 | 64 kB | zone d’atterrissage / normalisation import | NON (aucune réf directe) | STAGING |
| reseau_hydro_import_raw | 33 | 416 kB | zone d’atterrissage / normalisation import | NON (aucune réf directe) | STAGING |
| reseau_hydrologie_raw | 33 | 672 kB | zone d’atterrissage / normalisation import | NON (aucune réf directe) | STAGING |
| station_meteo_raw | 5 | 16 kB | zone d’atterrissage / normalisation import | NON (aucune réf directe) | STAGING |
| swat_mdb_imports | 80 | 72 kB | zone d’atterrissage / normalisation import | NON (aucune réf directe) | STAGING |
| swat_rch_norm | 997 405 | 149 MB | zone d’atterrissage / normalisation import | OUI | STAGING |
| swat_rch_raw | 0 | 32 kB | zone d’atterrissage / normalisation import | OUI | STAGING |
| swat_sub_norm | 0 | 5568 kB | zone d’atterrissage / normalisation import | OUI | STAGING |
| swat_sub_raw | 0 | 2624 kB | zone d’atterrissage / normalisation import | OUI | STAGING |

## 27. Tables historiques / legacy

| Objet | Type | Lignes | Réf directes | Lecture |
|---|---|---:|---:|---|
| audit.gis_reach_shapes_backup_2026 | table | 33 | 0 | LEGACY POTENTIEL |
| audit.gis_subbasin_shapes_backup_2026 | table | 33 | 0 | LEGACY POTENTIEL |
| audit.nv_limite | table | 19 | 0 | LEGACY POTENTIEL |
| audit.nv_stream | table | 19 | 0 | LEGACY POTENTIEL |
| audit.qc_issues | table | 0 | 0 | LEGACY POTENTIEL |
| audit.qc_runs | table | 0 | 0 | LEGACY POTENTIEL |
| audit.station_reach_map_backup_2026 | table | 0 | 0 | LEGACY POTENTIEL |
| audit.station_subbasin_map_backup_2026 | table | 0 | 0 | LEGACY POTENTIEL |
| audit.swat_entity_map_backup_2026 | table | 38 | 0 | LEGACY POTENTIEL |
| audit.swat_output_archive_rch | table | 345510 | 0 | LEGACY POTENTIEL |
| audit.swat_output_archive_sub | table | 345510 | 0 | LEGACY POTENTIEL |
| audit.v_qc_measurements_duplicates | vue | 0 | 0 | LEGACY |
| audit.v_qc_measurements_orphans | vue | 0 | 0 | LEGACY |
| audit.v_qc_null_geometry | vue | 7 | 0 | LEGACY |
| audit.v_qc_timeseries_duplicates | vue | 0 | 0 | LEGACY |
| audit.v_qc_timeseries_without_measurements | vue | 0 | 0 | LEGACY |
| auth.audit_log | table | 0 | 0 | NON UTILISÉ POTENTIEL |
| auth.permissions | table | 0 | 0 | NON UTILISÉ POTENTIEL |
| auth.role_permissions | table | 0 | 0 | NON UTILISÉ POTENTIEL |
| auth.roles | table | 0 | 0 | NON UTILISÉ POTENTIEL |
| auth.user_roles | table | 0 | 0 | NON UTILISÉ POTENTIEL |
| auth.users | table | 0 | 0 | NON UTILISÉ POTENTIEL |
| gis.reach_shapes_backup_20260422_144537 | table | 33 | 0 | NON UTILISÉ POTENTIEL |
| public.v_stats_temperature_all | vue | 0 | 0 | NON UTILISÉE POTENTIELLE |
| public.v_stats_temperature_all_global | vue | 0 | 0 | NON UTILISÉE POTENTIELLE |
| public.v_stats_temperature_max | vue | 0 | 0 | NON UTILISÉE POTENTIELLE |
| public.v_stats_temperature_max_global | vue | 0 | 0 | NON UTILISÉE POTENTIELLE |
| public.v_stats_temperature_mean | vue | 0 | 0 | NON UTILISÉE POTENTIELLE |
| public.v_stats_temperature_mean_global | vue | 0 | 0 | NON UTILISÉE POTENTIELLE |
| public.v_stats_temperature_min | vue | 0 | 0 | NON UTILISÉE POTENTIELLE |
| public.v_stats_temperature_min_global | vue | 0 | 0 | NON UTILISÉE POTENTIELLE |
| public.v_values_temperature_all_obs | vue | 134817 | 0 | À VÉRIFIER |
| public.v_values_temperature_max_annual | vue | 285 | 0 | À VÉRIFIER |
| public.v_values_temperature_max_monthly | vue | 3199 | 0 | À VÉRIFIER |
| public.v_values_temperature_max_obs | vue | 45235 | 0 | À VÉRIFIER |
| public.v_values_temperature_mean_annual | vue | 217 | 0 | À VÉRIFIER |
| public.v_values_temperature_mean_monthly | vue | 2408 | 0 | À VÉRIFIER |
| public.v_values_temperature_mean_obs | vue | 44444 | 0 | À VÉRIFIER |
| public.v_values_temperature_min_annual | vue | 275 | 0 | À VÉRIFIER |
| public.v_values_temperature_min_monthly | vue | 3102 | 0 | À VÉRIFIER |
| public.v_values_temperature_min_obs | vue | 45138 | 0 | À VÉRIFIER |
| staging.limite_raw | table | 33 | 0 | STAGING |
| staging.migration_batches | table | 3 | 1 | STAGING |
| staging.migration_events | table | 42 | 0 | STAGING |
| staging.norm_catchments | table | 3 | 0 | STAGING |
| staging.norm_communes | table | 258 | 0 | STAGING |
| staging.norm_measurements | table | 1049166 | 1 | STAGING |
| staging.norm_reservoir_bathymetry | table | 13203 | 0 | STAGING |
| staging.norm_reservoirs | table | 36 | 0 | STAGING |
| staging.norm_stations | table | 105 | 0 | STAGING |
| staging.raw_adm_communes_abhgzr | table | 258 | 0 | STAGING |
| staging.raw_barrages_abhgzr | table | 36 | 0 | STAGING |
| staging.raw_bassin_abhgzr | table | 3 | 0 | STAGING |
| staging.raw_bathymetries_barrages_abhgzr | table | 13203 | 0 | STAGING |
| staging.raw_mesures_debits_jr | table | 235587 | 0 | STAGING |
| staging.raw_mesures_evaporation_m | table | 6768 | 0 | STAGING |
| staging.raw_mesures_humidite_relative_m | table | 3060 | 0 | STAGING |
| staging.raw_mesures_lachers_barrages | table | 59583 | 0 | STAGING |
| staging.raw_mesures_precipitations_jr | table | 328821 | 0 | STAGING |
| staging.raw_mesures_temperature_jr_pn | table | 130392 | 0 | STAGING |
| staging.raw_mesures_temperature_m | table | 6084 | 0 | STAGING |
| staging.raw_mesures_vitesse_vent_m | table | 1368 | 0 | STAGING |
| staging.raw_stations_abhgzr | table | 105 | 0 | STAGING |
| staging.reseau_hydro_import_raw | table | 33 | 0 | STAGING |
| staging.reseau_hydrologie_raw | table | 33 | 0 | STAGING |
| staging.station_meteo_raw | table | 5 | 0 | STAGING |
| staging.swat_mdb_imports | table | 80 | 0 | STAGING |
| staging.swat_rch_norm | table | 997405 | 1 | STAGING |
| staging.swat_rch_raw | table | 0 | 1 | STAGING |
| staging.swat_sub_norm | table | 0 | 1 | STAGING |
| staging.swat_sub_raw | table | 0 | 1 | STAGING |

## 28. Plus grosses tables

| Rang | Table | Lignes | Taille data | Index | Total |
|---:|---|---:|---:|---:|---:|
| 1 | access.rch_results | 3 637 835 | 2431 MB | 0 bytes | 2432 MB |
| 2 | access.sub_results | 3 637 835 | 1683 MB | 90 MB | 1774 MB |
| 3 | core.measurements | 3 773 400 | 210 MB | 120 MB | 330 MB |
| 4 | audit.swat_output_archive_rch | 345 510 | 169 MB | 0 bytes | 169 MB |
| 5 | staging.norm_measurements | 1 049 166 | 156 MB | 0 bytes | 156 MB |
| 6 | staging.swat_rch_norm | 997 405 | 142 MB | 7008 kB | 149 MB |
| 7 | audit.swat_output_archive_sub | 345 510 | 100 MB | 0 bytes | 100 MB |
| 8 | core.measurement_batches | 1 036 530 | 76 MB | 9784 kB | 85 MB |
| 9 | staging.raw_mesures_precipitations_jr | 328 821 | 43 MB | 0 bytes | 43 MB |
| 10 | staging.raw_mesures_debits_jr | 235 587 | 28 MB | 0 bytes | 28 MB |
| 11 | access.hru_results | 65 209 | 25 MB | 488 kB | 26 MB |
| 12 | staging.raw_mesures_temperature_jr_pn | 130 392 | 19 MB | 0 bytes | 19 MB |
| 13 | staging.raw_mesures_lachers_barrages | 59 583 | 8256 kB | 0 bytes | 8296 kB |
| 14 | public.spatial_ref_sys | 8 500 | 6896 kB | 208 kB | 7144 kB |
| 15 | access.weather_inputs | 13 900 | 5632 kB | 0 bytes | 5672 kB |
| 16 | staging.swat_sub_norm | 0 | 0 bytes | 5544 kB | 5568 kB |
| 17 | access.scenario_metadata | 8 248 | 3328 kB | 0 bytes | 3368 kB |
| 18 | staging.raw_adm_communes_abhgzr | 258 | 128 kB | 0 bytes | 2816 kB |
| 19 | staging.swat_sub_raw | 0 | 0 bytes | 2600 kB | 2624 kB |
| 20 | audit.nv_limite | 19 | 8192 bytes | 24 kB | 2136 kB |

## 29. Comparaison données actives vs fallback

| Service/API | Source principale | Fallback | Nb lignes source | Nb lignes fallback | Encore nécessaire ? |
|---|---|---|---:|---:|---|
| HydroService / stations | api.mv_station_catalog (absente) | public.stations | 0 | 102 | OUI |
| HydroService / barrages | api.mv_barrage_catalog (absente) | public.reservoirs | 0 | 12 | OUI |
| HydroSwatSeries / StationSimulation | api.mv_hydro_station_timeseries + api.mv_hydro_station_stats (absentes) | access.rch_results + core.station_subbasin_map + public.v_ts_catalog_enriched | 0 | 3 637 835 | OUI |
| ErosionSwatSeries | api.mv_hydro_station_timeseries + api.mv_hydro_station_stats (absentes) | access.sub_results / access.rch_results + public.v_ts_catalog_enriched | 0 | 3 637 835 | OUI |
| SpatialService / catalogues cartes | api.mv_basin_catalog / mv_subbasin_catalog / mv_reach_catalog / mv_station_catalog / mv_barrage_catalog (absentes) | core.*, public.*, gis.* | 0 | 19 à 102 | OUI |
| SiltationService | hydro.siltation_* (tables prévues mais vides) | calcul dynamique via hydro.bathymetry_campaigns + core.reservoir_bathymetry | 0 | 6 / 4 401 | OUI, mais incohérent |

## 30. Détection des tables potentiellement obsolètes

| Table | Lignes | Référence backend | Référence script | Référence vue | Statut | Niveau |
|---|---:|---|---|---|---|---|
| audit.gis_reach_shapes_backup_2026 | 33 | NON (0) | NON (0) | NON (0) | HISTORIQUE | NIVEAU A — probablement obsolète |
| audit.gis_subbasin_shapes_backup_2026 | 33 | NON (0) | NON (0) | NON (0) | HISTORIQUE | NIVEAU A — probablement obsolète |
| audit.nv_limite | 19 | NON (0) | NON (0) | NON (0) | HISTORIQUE | NIVEAU B — suspecte |
| audit.nv_stream | 19 | NON (0) | NON (0) | NON (0) | HISTORIQUE | NIVEAU B — suspecte |
| audit.qc_issues | 0 | NON (0) | NON (0) | NON (0) | HISTORIQUE | NIVEAU B — suspecte |
| audit.qc_runs | 0 | NON (0) | NON (0) | NON (0) | HISTORIQUE | NIVEAU B — suspecte |
| audit.station_reach_map_backup_2026 | 0 | NON (0) | NON (0) | NON (0) | HISTORIQUE | NIVEAU A — probablement obsolète |
| audit.station_subbasin_map_backup_2026 | 0 | NON (0) | NON (0) | NON (0) | HISTORIQUE | NIVEAU A — probablement obsolète |
| audit.swat_entity_map_backup_2026 | 38 | NON (0) | NON (0) | NON (0) | HISTORIQUE | NIVEAU A — probablement obsolète |
| audit.swat_output_archive_rch | 345 510 | NON (0) | NON (0) | NON (0) | HISTORIQUE | NIVEAU A — probablement obsolète |
| audit.swat_output_archive_sub | 345 510 | NON (0) | NON (0) | NON (0) | HISTORIQUE | NIVEAU A — probablement obsolète |
| auth.audit_log | 0 | NON (0) | NON (0) | NON (0) | HISTORIQUE | NIVEAU A — probablement obsolète |
| auth.permissions | 0 | NON (0) | NON (0) | NON (0) | HISTORIQUE | NIVEAU A — probablement obsolète |
| auth.role_permissions | 0 | NON (0) | NON (0) | NON (0) | HISTORIQUE | NIVEAU A — probablement obsolète |
| auth.roles | 0 | NON (0) | NON (0) | NON (0) | HISTORIQUE | NIVEAU A — probablement obsolète |
| auth.user_roles | 0 | NON (0) | NON (0) | NON (0) | HISTORIQUE | NIVEAU A — probablement obsolète |
| auth.users | 0 | NON (0) | NON (0) | NON (0) | HISTORIQUE | NIVEAU A — probablement obsolète |
| gis.reach_shapes_backup_20260422_144537 | 33 | NON (0) | NON (0) | NON (0) | HISTORIQUE | NIVEAU C — à conserver |
| public.spatial_ref_sys | 8 500 | NON (0) | NON (0) | NON (0) | TECHNIQUE | NIVEAU C — à conserver technique |
| ref.property_domains | 3 | NON (0) | NON (0) | NON (0) | À VÉRIFIER | NIVEAU B — suspecte |
| staging.limite_raw | 33 | NON (0) | NON (0) | NON (0) | STAGING | NIVEAU B — résidu d’import à confirmer |
| staging.migration_events | 42 | NON (0) | NON (0) | NON (0) | STAGING | NIVEAU B — résidu d’import à confirmer |
| staging.norm_catchments | 3 | NON (0) | NON (0) | NON (0) | STAGING | NIVEAU B — résidu d’import à confirmer |
| staging.norm_communes | 258 | NON (0) | NON (0) | NON (0) | STAGING | NIVEAU B — résidu d’import à confirmer |
| staging.norm_reservoir_bathymetry | 13 203 | NON (0) | NON (0) | NON (0) | STAGING | NIVEAU B — résidu d’import à confirmer |
| staging.norm_reservoirs | 36 | NON (0) | NON (0) | NON (0) | STAGING | NIVEAU B — résidu d’import à confirmer |
| staging.norm_stations | 105 | NON (0) | NON (0) | NON (0) | STAGING | NIVEAU B — résidu d’import à confirmer |
| staging.raw_adm_communes_abhgzr | 258 | NON (0) | NON (0) | NON (0) | STAGING | NIVEAU B — résidu d’import à confirmer |
| staging.raw_barrages_abhgzr | 36 | NON (0) | NON (0) | NON (0) | STAGING | NIVEAU B — résidu d’import à confirmer |
| staging.raw_bassin_abhgzr | 3 | NON (0) | NON (0) | NON (0) | STAGING | NIVEAU B — résidu d’import à confirmer |
| staging.raw_bathymetries_barrages_abhgzr | 13 203 | NON (0) | NON (0) | NON (0) | STAGING | NIVEAU B — résidu d’import à confirmer |
| staging.raw_mesures_debits_jr | 235 587 | NON (0) | NON (0) | NON (0) | STAGING | NIVEAU B — résidu d’import à confirmer |
| staging.raw_mesures_evaporation_m | 6 768 | NON (0) | NON (0) | NON (0) | STAGING | NIVEAU B — résidu d’import à confirmer |
| staging.raw_mesures_humidite_relative_m | 3 060 | NON (0) | NON (0) | NON (0) | STAGING | NIVEAU B — résidu d’import à confirmer |
| staging.raw_mesures_lachers_barrages | 59 583 | NON (0) | NON (0) | NON (0) | STAGING | NIVEAU B — résidu d’import à confirmer |
| staging.raw_mesures_precipitations_jr | 328 821 | NON (0) | NON (0) | NON (0) | STAGING | NIVEAU B — résidu d’import à confirmer |
| staging.raw_mesures_temperature_jr_pn | 130 392 | NON (0) | NON (0) | NON (0) | STAGING | NIVEAU B — résidu d’import à confirmer |
| staging.raw_mesures_temperature_m | 6 084 | NON (0) | NON (0) | NON (0) | STAGING | NIVEAU B — résidu d’import à confirmer |
| staging.raw_mesures_vitesse_vent_m | 1 368 | NON (0) | NON (0) | NON (0) | STAGING | NIVEAU B — résidu d’import à confirmer |
| staging.raw_stations_abhgzr | 105 | NON (0) | NON (0) | NON (0) | STAGING | NIVEAU B — résidu d’import à confirmer |
| staging.reseau_hydro_import_raw | 33 | NON (0) | NON (0) | NON (0) | STAGING | NIVEAU B — résidu d’import à confirmer |
| staging.reseau_hydrologie_raw | 33 | NON (0) | NON (0) | NON (0) | STAGING | NIVEAU B — résidu d’import à confirmer |
| staging.station_meteo_raw | 5 | NON (0) | NON (0) | NON (0) | STAGING | NIVEAU B — résidu d’import à confirmer |
| staging.swat_mdb_imports | 80 | NON (0) | NON (0) | NON (0) | STAGING | NIVEAU B — résidu d’import à confirmer |

## 31. Score par schéma

| Schéma | Utilisation | Importance métier | Redondance | Risque de suppression |
|---|---|---|---|---|
| access | 8/10 | 8/10 | MOYENNE | ÉLEVÉ |
| api | 7/10 | 7/10 | FAIBLE | ÉLEVÉ |
| audit | 2/10 | 2/10 | FORTE | MOYEN |
| auth | 2/10 | 3/10 | FAIBLE | MOYEN |
| core | 10/10 | 10/10 | FAIBLE | ÉLEVÉ |
| geo | 1/10 | 1/10 | FAIBLE | FAIBLE |
| gis | 6/10 | 7/10 | MOYENNE | ÉLEVÉ |
| hydro | 5/10 | 7/10 | MOYENNE | ÉLEVÉ |
| public | 8/10 | 8/10 | MOYENNE | ÉLEVÉ |
| ref | 7/10 | 7/10 | FAIBLE | ÉLEVÉ |
| staging | 4/10 | 6/10 | FORTE | MOYEN |
| old_hd | 0/10 | 1/10 | FAIBLE | FAIBLE |

## 32. Tableau final — schémas

| Schéma | Tables | Utilisé par plateforme | Usage | Décision recommandée |
|---|---:|---|---|---|
| access | 7 | OUI | tables SWAT actives et fallback runtime | CONSERVER PARTIELLEMENT |
| api | 0 | OUI | couche de vues / matviews d’API | CONSERVER |
| audit | 11 | NON | sauvegardes, archives et QC | POTENTIELLEMENT LEGACY |
| auth | 6 | OUI | modèle auth/RBAC non branché en production DB | AUDITER PLUS |
| core | 16 | OUI | coeur métier observé et référentiels principaux | CONSERVER |
| geo | 1 | NON | couche géographique thématique vide | AUDITER PLUS |
| gis | 4 | OUI | formes spatiales opérationnelles | CONSERVER PARTIELLEMENT |
| hydro | 4 | OUI | objets hydro/siltation partiellement utilisés | AUDITER PLUS |
| public | 4 | OUI | vues d’exposition et fallback SQL | CONSERVER PARTIELLEMENT |
| ref | 6 | OUI | référentiels métier actifs | CONSERVER |
| staging | 30 | OUI | pipeline d’import, normalisation et résidus | CONSERVER PARTIELLEMENT |
| old_hd | 13 FT | NON (runtime courant) | foreign tables FDW historiques | POTENTIELLEMENT LEGACY |

## 33. Tableau final — tables

| Table | Lignes | Utilisation | Doublons | Statut | Décision |
|---|---:|---|---|---|---|
| access.hru_results | 65 209 | table d’import / staging SWAT | n.d. | ACTIF PARTIELLEMENT | CONSERVER |
| access.import_runs | 90 | journal des imports SWAT | n.d. | ACTIF PARTIELLEMENT | CONSERVER |
| access.rch_results | 3 637 835 | résultats SWAT runtime et fallback | 812 288 groupes suspects | ACTIF PARTIELLEMENT | CONSERVER |
| access.scenario_metadata | 8 248 | table d’import / staging SWAT | n.d. | ACTIF PARTIELLEMENT | CONSERVER |
| access.sub_results | 3 637 835 | résultats SWAT runtime et fallback | 709 798 groupes suspects | ACTIF PARTIELLEMENT | CONSERVER |
| access.variable_dictionary | 0 | dictionnaire de variables d’import | n.d. | ACTIF PARTIELLEMENT | CONSERVER |
| access.weather_inputs | 13 900 | table d’import / staging SWAT | n.d. | ACTIF PARTIELLEMENT | CONSERVER |
| audit.gis_reach_shapes_backup_2026 | 33 | aucun consommateur direct détecté | redondant avec gis.reach_shapes, gis.reach_shapes_backup_20260422_144537 | LEGACY POTENTIEL | AUDITER PLUS |
| audit.gis_subbasin_shapes_backup_2026 | 33 | aucun consommateur direct détecté | redondant avec gis.subbasin_shapes | LEGACY POTENTIEL | AUDITER PLUS |
| audit.nv_limite | 19 | aucun consommateur direct détecté | n.d. | LEGACY POTENTIEL | AUDITER PLUS |
| audit.nv_stream | 19 | aucun consommateur direct détecté | n.d. | LEGACY POTENTIEL | AUDITER PLUS |
| audit.qc_issues | 0 | aucun consommateur direct détecté | n.d. | LEGACY POTENTIEL | AUDITER PLUS |
| audit.qc_runs | 0 | aucun consommateur direct détecté | n.d. | LEGACY POTENTIEL | AUDITER PLUS |
| audit.station_reach_map_backup_2026 | 0 | aucun consommateur direct détecté | redondant avec core.station_reach_map | LEGACY POTENTIEL | AUDITER PLUS |
| audit.station_subbasin_map_backup_2026 | 0 | aucun consommateur direct détecté | redondant avec core.station_subbasin_map | LEGACY POTENTIEL | AUDITER PLUS |
| audit.swat_entity_map_backup_2026 | 38 | aucun consommateur direct détecté | redondant avec core.swat_entity_map | LEGACY POTENTIEL | AUDITER PLUS |
| audit.swat_output_archive_rch | 345 510 | aucun consommateur direct détecté | redondant avec access.rch_results | LEGACY POTENTIEL | AUDITER PLUS |
| audit.swat_output_archive_sub | 345 510 | aucun consommateur direct détecté | redondant avec access.sub_results | LEGACY POTENTIEL | AUDITER PLUS |
| auth.audit_log | 0 | aucun consommateur direct détecté | n.d. | NON UTILISÉ POTENTIEL | AUDITER PLUS |
| auth.permissions | 0 | aucun consommateur direct détecté | n.d. | NON UTILISÉ POTENTIEL | AUDITER PLUS |
| auth.role_permissions | 0 | aucun consommateur direct détecté | n.d. | NON UTILISÉ POTENTIEL | AUDITER PLUS |
| auth.roles | 0 | aucun consommateur direct détecté | n.d. | NON UTILISÉ POTENTIEL | AUDITER PLUS |
| auth.user_roles | 0 | aucun consommateur direct détecté | n.d. | NON UTILISÉ POTENTIEL | AUDITER PLUS |
| auth.users | 0 | aucun consommateur direct détecté | n.d. | NON UTILISÉ POTENTIEL | AUDITER PLUS |
| core.catchments | 33 | coeur métier / référentiel principal | n.d. | ACTIF | CONSERVER |
| core.data_batches | 1 | coeur métier / référentiel principal | n.d. | ACTIF | CONSERVER |
| core.measurement_batches | 1 036 530 | coeur métier / référentiel principal | aucun doublon métier détecté | ACTIF | CONSERVER |
| core.measurements | 3 773 400 | coeur métier / référentiel principal | aucun doublon métier détecté | ACTIF | CONSERVER |
| core.model_runs | 10 | coeur métier / référentiel principal | n.d. | ACTIF | CONSERVER |
| core.reaches | 33 | coeur métier / référentiel principal | aucun doublon métier détecté | ACTIF | CONSERVER |
| core.reservoir_bathymetry | 4 401 | coeur métier / référentiel principal | n.d. | ACTIF | CONSERVER |
| core.reservoirs | 12 | coeur métier / référentiel principal | n.d. | ACTIF | CONSERVER |
| core.rivers | 0 | coeur métier / référentiel principal | n.d. | ACTIF | CONSERVER |
| core.station_reach_map | 5 | coeur métier / référentiel principal | redondant avec audit.station_reach_map_backup_2026 | ACTIF | CONSERVER |
| core.station_subbasin_map | 5 | coeur métier / référentiel principal | redondant avec audit.station_subbasin_map_backup_2026 | ACTIF | CONSERVER |
| core.stations | 102 | coeur métier / référentiel principal | n.d. | ACTIF | CONSERVER |
| core.subbasin_metrics_annual | 0 | coeur métier / référentiel principal | n.d. | ACTIF | CONSERVER |
| core.subbasins | 33 | coeur métier / référentiel principal | aucun doublon métier détecté | ACTIF | CONSERVER |
| core.swat_entity_map | 38 | coeur métier / référentiel principal | redondant avec audit.swat_entity_map_backup_2026 | ACTIF | CONSERVER |
| core.timeseries | 383 | coeur métier / référentiel principal | aucun doublon métier détecté | ACTIF | CONSERVER |
| geo.landcover | 0 | donnée géographique thématique | n.d. | À VÉRIFIER | AUDITER PLUS |
| gis.meteo_stations | 5 | référentiel géospatial | n.d. | ACTIF PARTIELLEMENT | CONSERVER PARTIELLEMENT |
| gis.reach_shapes | 19 | référentiel géospatial | redondant avec audit.gis_reach_shapes_backup_2026, gis.reach_shapes_backup_20260422_144537 | ACTIF PARTIELLEMENT | CONSERVER PARTIELLEMENT |
| gis.reach_shapes_backup_20260422_144537 | 33 | aucun consommateur direct détecté | redondant avec audit.gis_reach_shapes_backup_2026, gis.reach_shapes | NON UTILISÉ POTENTIEL | AUDITER PLUS |
| gis.subbasin_shapes | 19 | référentiel géospatial | redondant avec audit.gis_subbasin_shapes_backup_2026 | ACTIF PARTIELLEMENT | CONSERVER PARTIELLEMENT |
| hydro.bathymetry_campaigns | 6 | module hydro / siltation | n.d. | ACTIF PARTIELLEMENT | CONSERVER |
| hydro.siltation_evolution | 0 | module hydro / siltation | n.d. | STRUCTURE NÉCESSAIRE | CONSERVER |
| hydro.siltation_hsv | 0 | module hydro / siltation | n.d. | STRUCTURE NÉCESSAIRE | CONSERVER |
| hydro.siltation_indicators | 0 | module hydro / siltation | n.d. | STRUCTURE NÉCESSAIRE | CONSERVER |
| public.module_properties | 10 | table d’exposition / support runtime | n.d. | ACTIF PARTIELLEMENT | CONSERVER PARTIELLEMENT |
| public.property_module_override | 0 | table d’exposition / support runtime | n.d. | ACTIF PARTIELLEMENT | CONSERVER PARTIELLEMENT |
| public.spatial_ref_sys | 8 500 | aucun consommateur direct détecté | n.d. | TECHNIQUE | CONSERVER |
| public.users | 3 | table d’exposition / support runtime | n.d. | ACTIF PARTIELLEMENT | CONSERVER PARTIELLEMENT |
| ref.communes | 86 | référentiel métier | n.d. | ACTIF | CONSERVER |
| ref.landcover_classes | 0 | référentiel métier | n.d. | ACTIF | CONSERVER |
| ref.landcover_periods | 0 | référentiel métier | n.d. | ACTIF | CONSERVER |
| ref.observed_properties | 13 | référentiel métier | n.d. | ACTIF | CONSERVER |
| ref.property_domain_membership | 10 | référentiel métier | n.d. | ACTIF | CONSERVER |
| ref.property_domains | 3 | aucun consommateur direct détecté | n.d. | À VÉRIFIER | AUDITER PLUS |
| staging.limite_raw | 33 | aucun consommateur direct détecté | n.d. | STAGING | AUDITER PLUS |
| staging.migration_batches | 3 | zone d’atterrissage / normalisation import | n.d. | STAGING | AUDITER PLUS |
| staging.migration_events | 42 | aucun consommateur direct détecté | n.d. | STAGING | AUDITER PLUS |
| staging.norm_catchments | 3 | aucun consommateur direct détecté | n.d. | STAGING | AUDITER PLUS |
| staging.norm_communes | 258 | aucun consommateur direct détecté | n.d. | STAGING | AUDITER PLUS |
| staging.norm_measurements | 1 049 166 | zone d’atterrissage / normalisation import | n.d. | STAGING | AUDITER PLUS |
| staging.norm_reservoir_bathymetry | 13 203 | aucun consommateur direct détecté | n.d. | STAGING | AUDITER PLUS |
| staging.norm_reservoirs | 36 | aucun consommateur direct détecté | n.d. | STAGING | AUDITER PLUS |
| staging.norm_stations | 105 | aucun consommateur direct détecté | 35 groupes station_code | STAGING | AUDITER PLUS |
| staging.raw_adm_communes_abhgzr | 258 | aucun consommateur direct détecté | n.d. | STAGING | AUDITER PLUS |
| staging.raw_barrages_abhgzr | 36 | aucun consommateur direct détecté | n.d. | STAGING | AUDITER PLUS |
| staging.raw_bassin_abhgzr | 3 | aucun consommateur direct détecté | n.d. | STAGING | AUDITER PLUS |
| staging.raw_bathymetries_barrages_abhgzr | 13 203 | aucun consommateur direct détecté | n.d. | STAGING | AUDITER PLUS |
| staging.raw_mesures_debits_jr | 235 587 | aucun consommateur direct détecté | n.d. | STAGING | AUDITER PLUS |
| staging.raw_mesures_evaporation_m | 6 768 | aucun consommateur direct détecté | n.d. | STAGING | AUDITER PLUS |
| staging.raw_mesures_humidite_relative_m | 3 060 | aucun consommateur direct détecté | n.d. | STAGING | AUDITER PLUS |
| staging.raw_mesures_lachers_barrages | 59 583 | aucun consommateur direct détecté | n.d. | STAGING | AUDITER PLUS |
| staging.raw_mesures_precipitations_jr | 328 821 | aucun consommateur direct détecté | n.d. | STAGING | AUDITER PLUS |
| staging.raw_mesures_temperature_jr_pn | 130 392 | aucun consommateur direct détecté | n.d. | STAGING | AUDITER PLUS |
| staging.raw_mesures_temperature_m | 6 084 | aucun consommateur direct détecté | n.d. | STAGING | AUDITER PLUS |
| staging.raw_mesures_vitesse_vent_m | 1 368 | aucun consommateur direct détecté | n.d. | STAGING | AUDITER PLUS |
| staging.raw_stations_abhgzr | 105 | aucun consommateur direct détecté | n.d. | STAGING | AUDITER PLUS |
| staging.reseau_hydro_import_raw | 33 | aucun consommateur direct détecté | n.d. | STAGING | AUDITER PLUS |
| staging.reseau_hydrologie_raw | 33 | aucun consommateur direct détecté | n.d. | STAGING | AUDITER PLUS |
| staging.station_meteo_raw | 5 | aucun consommateur direct détecté | n.d. | STAGING | AUDITER PLUS |
| staging.swat_mdb_imports | 80 | aucun consommateur direct détecté | n.d. | STAGING | AUDITER PLUS |
| staging.swat_rch_norm | 997 405 | zone d’atterrissage / normalisation import | n.d. | STAGING | AUDITER PLUS |
| staging.swat_rch_raw | 0 | zone d’atterrissage / normalisation import | n.d. | STAGING | AUDITER PLUS |
| staging.swat_sub_norm | 0 | zone d’atterrissage / normalisation import | n.d. | STAGING | AUDITER PLUS |
| staging.swat_sub_raw | 0 | zone d’atterrissage / normalisation import | n.d. | STAGING | AUDITER PLUS |

## 34. Listes simples

### Schémas actifs à conserver

- `core`
- `api`
- `ref`

### Schémas partiellement utilisés

- `access`
- `public`
- `gis`
- `hydro`
- `staging`

### Schémas potentiellement non utilisés

- `audit`
- `auth`
- `geo`
- `old_hd`

### Tables potentiellement obsolètes

- `audit.gis_reach_shapes_backup_2026`
- `audit.gis_subbasin_shapes_backup_2026`
- `audit.nv_limite`
- `audit.nv_stream`
- `audit.qc_issues`
- `audit.qc_runs`
- `audit.station_reach_map_backup_2026`
- `audit.station_subbasin_map_backup_2026`
- `audit.swat_entity_map_backup_2026`
- `audit.swat_output_archive_rch`
- `audit.swat_output_archive_sub`
- `auth.audit_log`
- `auth.permissions`
- `auth.role_permissions`
- `auth.roles`
- `auth.user_roles`
- `auth.users`
- `gis.reach_shapes_backup_20260422_144537`
- `public.spatial_ref_sys`
- `ref.property_domains`
- `staging.limite_raw`
- `staging.migration_events`
- `staging.norm_catchments`
- `staging.norm_communes`
- `staging.norm_reservoir_bathymetry`
- `staging.norm_reservoirs`
- `staging.norm_stations`
- `staging.raw_adm_communes_abhgzr`
- `staging.raw_barrages_abhgzr`
- `staging.raw_bassin_abhgzr`
- `staging.raw_bathymetries_barrages_abhgzr`
- `staging.raw_mesures_debits_jr`
- `staging.raw_mesures_evaporation_m`
- `staging.raw_mesures_humidite_relative_m`
- `staging.raw_mesures_lachers_barrages`
- `staging.raw_mesures_precipitations_jr`
- `staging.raw_mesures_temperature_jr_pn`
- `staging.raw_mesures_temperature_m`
- `staging.raw_mesures_vitesse_vent_m`
- `staging.raw_stations_abhgzr`
- `staging.reseau_hydro_import_raw`
- `staging.reseau_hydrologie_raw`
- `staging.station_meteo_raw`
- `staging.swat_mdb_imports`

### Tables avec doublons

- `staging.norm_stations`
- `access.rch_results`
- `access.sub_results`

### Tables avec données orphelines

- aucune donnée orpheline détectée sur les relations testées

### Tables vides à vérifier

- `access.variable_dictionary`
- `audit.qc_issues`
- `audit.qc_runs`
- `audit.station_reach_map_backup_2026`
- `audit.station_subbasin_map_backup_2026`
- `auth.audit_log`
- `auth.permissions`
- `auth.role_permissions`
- `auth.roles`
- `auth.user_roles`
- `auth.users`
- `core.rivers`
- `core.subbasin_metrics_annual`
- `geo.landcover`
- `hydro.siltation_evolution`
- `hydro.siltation_hsv`
- `hydro.siltation_indicators`
- `public.property_module_override`
- `ref.landcover_classes`
- `ref.landcover_periods`
- `staging.swat_rch_raw`
- `staging.swat_sub_norm`
- `staging.swat_sub_raw`

## 35. Priorités

### DB0 — CRITIQUE

- **Absence quasi totale de contraintes relationnelles** : 80 tables sans PK et 89 tables sans FK, y compris des tables métier majeures.
- **Incohérence de codification des scénarios** : `SWAT_OUTPUT` vs `SWAT_OUTPUT_01` entre `access.import_runs` et `core.model_runs`.
- **Suspicion forte de doublons SWAT** dans `access.rch_results` et `access.sub_results` sur les clés métier approchées.
- **Module siltation partiellement incohérent** : les tables `hydro.siltation_*` sont vides alors que le service reste actif.

### DB1 — IMPORTANT

- **Fallbacks runtime encore indispensables** car plusieurs matviews/catalogues attendus par le backend sont absents.
- **Schéma `old_hd` FDW cassé/legacy** : 13 foreign tables, serveur externe historique, aucune référence runtime active détectée.
- **Redondances fortes** entre `audit.*` et `access/core/gis` (archives et backups).
- **`auth.*` vide alors que le runtime utilise `public.users`**.

### DB2 — NETTOYAGE

- 23 tables vides à revoir sans conclusion automatique de suppression.
- 44 tables sans consommateur direct détecté, principalement `audit.*`, `auth.*` et `staging.*`.
- 104 vues sans consommateur direct détecté, à requalifier avant toute suppression.

### DB3 — OPTIMISATION

- Correction de géométries invalides (445 occurrences agrégées sur les colonnes analysées).
- Revue de stratégie d’indexation sur les plus grosses tables sans index explicite.
- Formalisation des FK implicites et homogénéisation des conventions de scénarios.

## 36. Recommandations

1. Geler toute suppression de schéma/table avant décision dédiée sur `audit`, `auth`, `geo`, `old_hd` et `staging`.
2. Traiter en premier l’alignement des scénarios `SWAT_OUTPUT` / `SWAT_OUTPUT_01`.
3. Qualifier précisément les doublons SWAT sur une clé métier finale avant correction de données.
4. Cartographier les endpoints qui dépendent encore des fallbacks `public.*` et `access.*`.
5. Décider explicitement du sort du schéma `old_hd` FDW hors runtime courant.
6. Auditer séparément `auth.*` vs `public.users` avant toute refonte auth.
7. Préparer une phase dédiée “contraintes + index” après validation métier.

## 37. Point d’arrêt

ARRÊT ICI.

- Aucun schéma supprimé.
- Aucune table supprimée.
- Aucune vue supprimée.
- Aucune ligne modifiée.
- Aucune FK créée.
- Aucun index créé.
- Aucune correction de doublon appliquée.

# RAPPORT PROTECTION DONNEES FONCTIONNELLES - HASSAN ADDAKHIL

- Date/heure : 2026-08-26T10:17:16+00:00
- Base officielle : `hydro_hd`
- Backend : `http://127.0.0.1:5007`
- Frontend : `http://127.0.0.1:8090`

## 1. Resume executif

- Baseline fonctionnelle creee en lecture seule.
- Backup valide : NON.
- Scenarios visibles proteges : OBSERVED, etat_actuel, ssp126, ssp245, ssp585, scenario_1, scenario_2, scenario_3, scenario_4.
- Stations protegees : 101 / 102.
- Reaches runtime proteges : 19 ; subbasins runtime proteges : 19.
- Timeseries cataloguees : 383 ; points de mesure proteges : 3773400.

## 2. Etat de reference

| Champ | Valeur |
| --- | --- |
| Date/heure | 2026-08-26T10:17:16+00:00 |
| Branche Git | ilh_dev_20-07 |
| Commit Git | ef62eae98af1c9991ee2287b969cf53f2051db88 |
| Backend actif | OUI |
| Frontend actif | NON |
| Version DB | PostgreSQL 17.8 on x86_64-windows, compiled by msvc-19.44.35222, 64-bit |
| Taille DB | 5374 MB (5634873011 bytes) |
| Status Git | 218 entree(s) modifiee(s) |

## 3. Backup de protection

| Champ | Valeur |
| --- | --- |
| Chemin | D:\3- Projets\App_Hassan_Addakhil\backups\hydro_hd_before_dq_corrections_20260810_1339.dump |
| Present | NON |
| Type fichier | NON |
| Taille |  |
| pg_restore --list | KO |
| Derniere modification |  |

## 4. Modules fonctionnels proteges

| Module | Route frontend | API | Service backend | Tables / vues | Scenarios | Variables | Statut |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Accueil | /, /home |  | AuthContext / protected route |  |  |  | ACTIVE |
| Dashboard | /dashboard | /api/v1/catalog/modules, /api/v1/catalog/runs | catalog.service.ts, HydroDataContext | public.v_ts_catalog_enriched, core.model_runs | OBSERVED, etat_actuel, ssp126, ssp245, ssp585, scenario_1, scenario_2, scenario_3, scenario_4 | PRECIPITATION, TMAX, TMIN, TMEAN, HUMIDITY_REL, EVAPORATION, WIND_SPEED, STREAMFLOW, SWAT_FLOW_M3S, SWAT_SED_IN_TONS, SWAT_SED_TONS, SWAT_SED_CONC_MG_KG, SWAT_SYLDT_HA | ACTIVE |
| Climat | /dashboard?section=climate | /api/v1/catalog/modules/climat/properties, /api/v1/catalog/modules/climat/stations, /api/v1/catalog/availability?module=climat, /api/v1/spatial/stations/:id/climate | catalog.service.ts, timeseries.service.ts, spatial.service.ts | public.v_ts_catalog_enriched, core.timeseries, core.measurements, core.stations | OBSERVED | PRECIPITATION, TMAX, TMIN, TMEAN, HUMIDITY_REL, EVAPORATION, WIND_SPEED | ACTIVE |
| Hydrologie | /dashboard?section=hydraulic | /api/v1/hydro/*, /api/v1/catalog/availability?module=hydro, /api/v1/stations/:stationId/simulations, /api/v1/spatial/stations/:id/timeseries | hydro.service.ts, timeseries.service.ts, stationSimulation.service.ts, catalog.service.ts | public.v_ts_catalog_enriched, core.timeseries, core.measurements, core.station_subbasin_map, access.sub_results | OBSERVED, etat_actuel, ssp126, ssp245, ssp585, scenario_1, scenario_2, scenario_3, scenario_4 | STREAMFLOW, SWAT_FLOW_M3S | ACTIVE |
| Sediments | /dashboard?section=sediment | /api/v1/solid-yield/*, /api/v1/spatial/reaches/:reachId/timeseries, /api/v1/maps/thematic/reaches, /api/v1/maps/thematic/subbasins | solidYield.service.ts, erosionSwatSeries.service.ts, spatial.service.ts | access.rch_results, access.sub_results, core.station_subbasin_map, gis.reach_shapes, gis.subbasin_shapes | etat_actuel, ssp126, ssp245, ssp585, scenario_1, scenario_2, scenario_3, scenario_4 | SWAT_SED_IN_TONS, SWAT_SED_TONS, SWAT_SED_CONC_MG_KG, SWAT_SYLDT_HA | ACTIVE |
| Transport solide Reach | /dashboard?section=sediment | /api/v1/spatial/reaches, /api/v1/spatial/reaches/:reachId/timeseries | spatial.service.ts, erosionSwatSeries.service.ts | gis.reach_shapes, access.rch_results | etat_actuel, ssp126, ssp245, ssp585, scenario_1, scenario_2, scenario_3, scenario_4 | FLOW_IN, FLOW_OUT, SED_IN, SED_OUT | ACTIVE |
| Estimation Q -> Qs | /dashboard?section=sediment |  | frontend only - sedimentFlowEstimation.ts |  |  | Q, Qs, R2, confidence range | ACTIVE |
| Cartographie | /dashboard?section=maps | /api/v1/maps/*, /api/v1/spatial/project-hassan-addakhil | maps.service.ts, spatial.service.ts | gis.reach_shapes, gis.subbasin_shapes, gis.meteo_stations, core.stations | OBSERVED, etat_actuel, ssp126, ssp245, ssp585, scenario_1, scenario_2, scenario_3, scenario_4 | PRECIPITATION, TMAX, TMIN, TMEAN, HUMIDITY_REL, EVAPORATION, WIND_SPEED, STREAMFLOW, SWAT_FLOW_M3S, SWAT_SED_IN_TONS, SWAT_SED_TONS, SWAT_SED_CONC_MG_KG, SWAT_SYLDT_HA | ACTIVE |
| Analyse spatiale | /dashboard?section=spatial | /api/v1/spatial/* | spatial.service.ts | gis.reach_shapes, gis.subbasin_shapes, gis.meteo_stations, core.stations, access.rch_results, access.sub_results | OBSERVED, etat_actuel, ssp126, ssp245, ssp585, scenario_1, scenario_2, scenario_3, scenario_4 | PRECIPITATION, TMAX, TMIN, TMEAN, HUMIDITY_REL, EVAPORATION, WIND_SPEED, STREAMFLOW, SWAT_FLOW_M3S, SWAT_SED_IN_TONS, SWAT_SED_TONS, SWAT_SED_CONC_MG_KG, SWAT_SYLDT_HA | ACTIVE |
| SWAT | /dashboard/data/ingestion-swat | /api/v1/hydro/swat/* | swatIngestion.service.ts, access.service.ts | access.rch_results, access.sub_results, core.model_runs, core.swat_entity_map | etat_actuel, ssp126, ssp245, ssp585, scenario_1, scenario_2, scenario_3, scenario_4, SWAT_OUTPUT, SWAT_OUTPUT_01 | availability, batches, flow, sediment, yield | ACTIVE |
| Data Scan | /dashboard?section=dataScan | /api/v1/data-scan/*, /api/v1/scan/* | dataScan.service.ts | public.v_ts_catalog_enriched, core.stations, core.measurements, gis.reach_shapes, gis.subbasin_shapes | OBSERVED, etat_actuel, ssp126, ssp245, ssp585, scenario_1, scenario_2, scenario_3, scenario_4 | PRECIPITATION, TMAX, TMIN, TMEAN, HUMIDITY_REL, EVAPORATION, WIND_SPEED, STREAMFLOW, SWAT_FLOW_M3S, SWAT_SED_IN_TONS, SWAT_SED_TONS, SWAT_SED_CONC_MG_KG, SWAT_SYLDT_HA | ACTIVE |
| Programme d'intervention | /dashboard/intervention-program |  | frontend static data only | frontend/public/data/hassan/intervention-program, src/features/intervention-program/data/interventionProgram.data.ts |  | budget, axes, actions, priority zones | ACTIVE |
| Siltation / Envasement | /dashboard?section=sediment | /api/v1/siltation/* | siltation.service.ts | hydro.bathymetry_campaigns, core.reservoir_bathymetry, core.reservoirs |  | volume_mhm3, annual_siltation_rate_mhm3, level_m | ACTIVE |
| Admin | /admin, /admin/users, /admin/database | /api/auth/*, /api/admin/*, /api/v1/admin/* | authRoutes.ts, adminRoutes.ts, adminDbConfig.routes.ts | app settings, users |  |  | ACTIVE |
| Rapports / Exports | /dashboard?section=reports | /api/v1/siltation/export/* | ReportsModule.tsx, siltation.service.ts | public.v_ts_catalog_enriched, hydro.bathymetry_campaigns, core.reservoir_bathymetry | OBSERVED, etat_actuel, ssp126, ssp245, ssp585, scenario_1, scenario_2, scenario_3, scenario_4 | PRECIPITATION, TMAX, TMIN, TMEAN, HUMIDITY_REL, EVAPORATION, WIND_SPEED, STREAMFLOW, SWAT_FLOW_M3S, SWAT_SED_IN_TONS, SWAT_SED_TONS, SWAT_SED_CONC_MG_KG, SWAT_SYLDT_HA | ACTIVE |

## 5. PROTECTED_DATA

| Categorie | Valeur |
| --- | --- |
| Stations visibles | 75 |
| Stations avec mesures | 75 |
| Stations filtrees projet | 2, 3, 24, 29, 35 |
| Scenarios visibles | OBSERVED, etat_actuel, ssp126, ssp245, ssp585, scenario_1, scenario_2, scenario_3, scenario_4 |
| Scenarios techniques | SWAT_OUTPUT, SWAT_OUTPUT_01 |
| Runtime reaches | 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19 |
| Runtime subbasins | 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19 |
| Variables visibles | PRECIPITATION, TMAX, TMIN, TMEAN, HUMIDITY_REL, EVAPORATION, WIND_SPEED, STREAMFLOW, SWAT_FLOW_M3S, SWAT_SED_IN_TONS, SWAT_SED_TONS, SWAT_SED_CONC_MG_KG, SWAT_SYLDT_HA |
| Timeseries IDs | 383 |
| Bathymetrie campagnes | 6 |
| Bathymetrie points | 4401 |

## 6. Baseline des stations

| Indicateur | Valeur |
| --- | --- |
| Total stations | 102 |
| Stations visibles catalogues | 75 |
| Stations avec mesures | 75 |
| Stations observees | 9 |
| Stations SWAT | 66 |
| Stations spatiales | 34 |
| Stations filtrees volontairement | 5 |
| Stations protegees | 101 |

| station_id | code | nom | type | utilisee par module | protegee |
| --- | --- | --- | --- | --- | --- |
| 1 | hammat_my_ali_cherif | Hammat My Ali Cherif | UNKNOWN | Analyse spatiale, Cartographie, Climat, Data Scan, Rapports / Exports | OUI |
| 2 | 1508/38 | FOUM TILLICHT | hydrologique | Analyse spatiale, Cartographie, Climat, Data Scan, Hydrologie, Rapports / Exports | OUI |
| 3 | 31/38 | Zaouiet Sidi Hamza | hydrologique | Analyse spatiale, Cartographie, Climat, Data Scan, Hydrologie, Rapports / Exports | OUI |
| 4 | bouanane | Bouanane | UNKNOWN | Analyse spatiale, Cartographie | OUI |
| 5 | tazouguert | Tazouguert | UNKNOWN | Analyse spatiale, Cartographie | OUI |
| 6 | bge_kaddoussa | Bge Kaddoussa | UNKNOWN | Analyse spatiale, Cartographie | OUI |
| 7 | pont_jorf | Pont Jorf | UNKNOWN | Analyse spatiale, Cartographie | OUI |
| 8 | amouguer_taghia | Amouguer Taghia | UNKNOWN | Analyse spatiale, Cartographie | OUI |
| 9 | assoul | Assoul | UNKNOWN | Analyse spatiale, Cartographie | OUI |
| 10 | aghbalou_n_kerdous | Aghbalou N'Kerdous | UNKNOWN | Analyse spatiale, Cartographie | OUI |
| 11 | bge_timkit | Bge Timkit | UNKNOWN | Analyse spatiale, Cartographie | OUI |
| 12 | taouz | Taouz | UNKNOWN | Analyse spatiale, Cartographie, Climat, Data Scan, Rapports / Exports | OUI |
| 13 | centre_merzouga | Centre Merzouga | UNKNOWN | Analyse spatiale, Cartographie | OUI |
| 14 | ait_boujane | Ait Boujane | UNKNOWN | Analyse spatiale, Cartographie | OUI |
| 15 | tamettoucht | Tamettoucht | UNKNOWN | Analyse spatiale, Cartographie | OUI |
| 16 | amont_n_kob | Amont N'Kob | UNKNOWN | Analyse spatiale, Cartographie | OUI |
| 17 | pont_arfoud | Pont Arfoud | UNKNOWN | Analyse spatiale, Cartographie, Climat, Data Scan, Rapports / Exports | OUI |
| 18 | errachidia_se | Errachidia (SE) | UNKNOWN |  | NON |
| 19 | centre_sidi_ayad | Centre Sidi Ayad | UNKNOWN | Analyse spatiale, Cartographie | OUI |
| 20 | imider | Imider | UNKNOWN | Analyse spatiale, Cartographie | OUI |
| 21 | mellaha | Mellaha | UNKNOWN | Analyse spatiale, Cartographie | OUI |
| 22 | tazarine | Tazarine | UNKNOWN | Analyse spatiale, Cartographie | OUI |
| 23 | tit_n_aissa | Tit N'Aissa | UNKNOWN | Analyse spatiale, Cartographie | OUI |
| 24 | 1585/38 | MZIZEL | hydrologique | Analyse spatiale, Cartographie, Climat, Data Scan, Hydrologie, Rapports / Exports | OUI |
| 25 | outerbat | Outerbat | UNKNOWN | Analyse spatiale, Cartographie | OUI |
| 26 | ferkla | Ferkla | UNKNOWN | Analyse spatiale, Cartographie | OUI |
| 27 | aoufous | Aoufous | UNKNOWN | Analyse spatiale, Cartographie | OUI |
| 28 | tadighoust | Tadighoust | UNKNOWN | Analyse spatiale, Cartographie | OUI |
| 29 | 867/48 | FOUM ZAABEL | hydrologique | Analyse spatiale, Cartographie, Climat, Data Scan, Hydrologie, Rapports / Exports | OUI |
| 30 | oued_lahmer | Oued Lahmer | UNKNOWN | Analyse spatiale, Cartographie | OUI |
| 31 | adachar | Adachar | UNKNOWN | Analyse spatiale, Cartographie | OUI |
| 32 | amin_ntaghit | Amin Ntaghit | UNKNOWN | Analyse spatiale, Cartographie | OUI |
| 33 | nzala | Nzala | UNKNOWN | Analyse spatiale, Cartographie | OUI |
| 34 | meroutcha | Meroutcha | UNKNOWN | Analyse spatiale, Cartographie | OUI |
| 35 | 1940/48 | Barrage Hassan Addakhil | hydrologique | Analyse spatiale, Cartographie, Climat, Data Scan, Hydrologie, Rapports / Exports | OUI |
| 39 | RES_1940/48 | Reservoir 1940/48 | reservoir_virtual |  | OUI |
| 40 | swat_rch_1 | SWAT reach 1 | SWAT | Analyse spatiale, Data Scan, Hydrologie, Rapports / Exports, SWAT, Sediments | OUI |
| 41 | swat_rch_10 | SWAT reach 10 | SWAT | Analyse spatiale, Data Scan, Hydrologie, Rapports / Exports, SWAT, Sediments | OUI |
| 42 | swat_rch_11 | SWAT reach 11 | SWAT | Analyse spatiale, Data Scan, Hydrologie, Rapports / Exports, SWAT, Sediments | OUI |
| 43 | swat_rch_12 | SWAT reach 12 | SWAT | Analyse spatiale, Data Scan, Hydrologie, Rapports / Exports, SWAT, Sediments | OUI |
| 44 | swat_rch_13 | SWAT reach 13 | SWAT | Analyse spatiale, Data Scan, Hydrologie, Rapports / Exports, SWAT, Sediments | OUI |
| 45 | swat_rch_14 | SWAT reach 14 | SWAT | Analyse spatiale, Data Scan, Hydrologie, Rapports / Exports, SWAT, Sediments | OUI |
| 46 | swat_rch_15 | SWAT reach 15 | SWAT | Analyse spatiale, Data Scan, Hydrologie, Rapports / Exports, SWAT, Sediments | OUI |
| 47 | swat_rch_16 | SWAT reach 16 | SWAT | Analyse spatiale, Data Scan, Hydrologie, Rapports / Exports, SWAT, Sediments | OUI |
| 48 | swat_rch_17 | SWAT reach 17 | SWAT | Analyse spatiale, Data Scan, Hydrologie, Rapports / Exports, SWAT, Sediments | OUI |
| 49 | swat_rch_18 | SWAT reach 18 | SWAT | Analyse spatiale, Data Scan, Hydrologie, Rapports / Exports, SWAT, Sediments | OUI |
| 50 | swat_rch_19 | SWAT reach 19 | SWAT | Analyse spatiale, Data Scan, Hydrologie, Rapports / Exports, SWAT, Sediments | OUI |
| 51 | swat_rch_2 | SWAT reach 2 | SWAT | Analyse spatiale, Data Scan, Hydrologie, Rapports / Exports, SWAT, Sediments | OUI |
| 52 | swat_rch_20 | SWAT reach 20 | SWAT | Analyse spatiale, Data Scan, Hydrologie, Rapports / Exports, SWAT, Sediments | OUI |
| 53 | swat_rch_21 | SWAT reach 21 | SWAT | Analyse spatiale, Data Scan, Hydrologie, Rapports / Exports, SWAT, Sediments | OUI |
| 54 | swat_rch_22 | SWAT reach 22 | SWAT | Analyse spatiale, Data Scan, Hydrologie, Rapports / Exports, SWAT, Sediments | OUI |
| 55 | swat_rch_23 | SWAT reach 23 | SWAT | Analyse spatiale, Data Scan, Hydrologie, Rapports / Exports, SWAT, Sediments | OUI |
| 56 | swat_rch_24 | SWAT reach 24 | SWAT | Analyse spatiale, Data Scan, Hydrologie, Rapports / Exports, SWAT, Sediments | OUI |
| 57 | swat_rch_25 | SWAT reach 25 | SWAT | Analyse spatiale, Data Scan, Hydrologie, Rapports / Exports, SWAT, Sediments | OUI |
| 58 | swat_rch_26 | SWAT reach 26 | SWAT | Analyse spatiale, Data Scan, Hydrologie, Rapports / Exports, SWAT, Sediments | OUI |
| 59 | swat_rch_27 | SWAT reach 27 | SWAT | Analyse spatiale, Data Scan, Hydrologie, Rapports / Exports, SWAT, Sediments | OUI |
| 60 | swat_rch_28 | SWAT reach 28 | SWAT | Analyse spatiale, Data Scan, Hydrologie, Rapports / Exports, SWAT, Sediments | OUI |
| 61 | swat_rch_29 | SWAT reach 29 | SWAT | Analyse spatiale, Data Scan, Hydrologie, Rapports / Exports, SWAT, Sediments | OUI |
| 62 | swat_rch_3 | SWAT reach 3 | SWAT | Analyse spatiale, Data Scan, Hydrologie, Rapports / Exports, SWAT, Sediments | OUI |
| 63 | swat_rch_30 | SWAT reach 30 | SWAT | Analyse spatiale, Data Scan, Hydrologie, Rapports / Exports, SWAT, Sediments | OUI |
| 64 | swat_rch_31 | SWAT reach 31 | SWAT | Analyse spatiale, Data Scan, Hydrologie, Rapports / Exports, SWAT, Sediments | OUI |
| 65 | swat_rch_32 | SWAT reach 32 | SWAT | Analyse spatiale, Data Scan, Hydrologie, Rapports / Exports, SWAT, Sediments | OUI |
| 66 | swat_rch_33 | SWAT reach 33 | SWAT | Analyse spatiale, Data Scan, Hydrologie, Rapports / Exports, SWAT, Sediments | OUI |
| 67 | swat_rch_4 | SWAT reach 4 | SWAT | Analyse spatiale, Data Scan, Hydrologie, Rapports / Exports, SWAT, Sediments | OUI |
| 68 | swat_rch_5 | SWAT reach 5 | SWAT | Analyse spatiale, Data Scan, Hydrologie, Rapports / Exports, SWAT, Sediments | OUI |
| 69 | swat_rch_6 | SWAT reach 6 | SWAT | Analyse spatiale, Data Scan, Hydrologie, Rapports / Exports, SWAT, Sediments | OUI |
| 70 | swat_rch_7 | SWAT reach 7 | SWAT | Analyse spatiale, Data Scan, Hydrologie, Rapports / Exports, SWAT, Sediments | OUI |
| 71 | swat_rch_8 | SWAT reach 8 | SWAT | Analyse spatiale, Data Scan, Hydrologie, Rapports / Exports, SWAT, Sediments | OUI |
| 72 | swat_rch_9 | SWAT reach 9 | SWAT | Analyse spatiale, Data Scan, Hydrologie, Rapports / Exports, SWAT, Sediments | OUI |
| 73 | swat_sub_1 | SWAT subbasin 1 | SWAT | Analyse spatiale, Rapports / Exports, SWAT, Sediments | OUI |
| 74 | swat_sub_10 | SWAT subbasin 10 | SWAT | Analyse spatiale, Rapports / Exports, SWAT, Sediments | OUI |
| 75 | swat_sub_11 | SWAT subbasin 11 | SWAT | Analyse spatiale, Rapports / Exports, SWAT, Sediments | OUI |
| 76 | swat_sub_12 | SWAT subbasin 12 | SWAT | Analyse spatiale, Rapports / Exports, SWAT, Sediments | OUI |
| 77 | swat_sub_13 | SWAT subbasin 13 | SWAT | Analyse spatiale, Rapports / Exports, SWAT, Sediments | OUI |
| 78 | swat_sub_14 | SWAT subbasin 14 | SWAT | Analyse spatiale, Rapports / Exports, SWAT, Sediments | OUI |
| 79 | swat_sub_15 | SWAT subbasin 15 | SWAT | Analyse spatiale, Rapports / Exports, SWAT, Sediments | OUI |
| 80 | swat_sub_16 | SWAT subbasin 16 | SWAT | Analyse spatiale, Rapports / Exports, SWAT, Sediments | OUI |
| 81 | swat_sub_17 | SWAT subbasin 17 | SWAT | Analyse spatiale, Rapports / Exports, SWAT, Sediments | OUI |
| 82 | swat_sub_18 | SWAT subbasin 18 | SWAT | Analyse spatiale, Rapports / Exports, SWAT, Sediments | OUI |
| 83 | swat_sub_19 | SWAT subbasin 19 | SWAT | Analyse spatiale, Rapports / Exports, SWAT, Sediments | OUI |
| 84 | swat_sub_2 | SWAT subbasin 2 | SWAT | Analyse spatiale, Rapports / Exports, SWAT, Sediments | OUI |
| 85 | swat_sub_20 | SWAT subbasin 20 | SWAT | Analyse spatiale, Rapports / Exports, SWAT, Sediments | OUI |
| 86 | swat_sub_21 | SWAT subbasin 21 | SWAT | Analyse spatiale, Rapports / Exports, SWAT, Sediments | OUI |
| 87 | swat_sub_22 | SWAT subbasin 22 | SWAT | Analyse spatiale, Rapports / Exports, SWAT, Sediments | OUI |
| 88 | swat_sub_23 | SWAT subbasin 23 | SWAT | Analyse spatiale, Rapports / Exports, SWAT, Sediments | OUI |
| 89 | swat_sub_24 | SWAT subbasin 24 | SWAT | Analyse spatiale, Rapports / Exports, SWAT, Sediments | OUI |
| 90 | swat_sub_25 | SWAT subbasin 25 | SWAT | Analyse spatiale, Rapports / Exports, SWAT, Sediments | OUI |
| 91 | swat_sub_26 | SWAT subbasin 26 | SWAT | Analyse spatiale, Rapports / Exports, SWAT, Sediments | OUI |
| 92 | swat_sub_27 | SWAT subbasin 27 | SWAT | Analyse spatiale, Rapports / Exports, SWAT, Sediments | OUI |
| 93 | swat_sub_28 | SWAT subbasin 28 | SWAT | Analyse spatiale, Rapports / Exports, SWAT, Sediments | OUI |
| 94 | swat_sub_29 | SWAT subbasin 29 | SWAT | Analyse spatiale, Rapports / Exports, SWAT, Sediments | OUI |
| 95 | swat_sub_3 | SWAT subbasin 3 | SWAT | Analyse spatiale, Rapports / Exports, SWAT, Sediments | OUI |
| 96 | swat_sub_30 | SWAT subbasin 30 | SWAT | Analyse spatiale, Rapports / Exports, SWAT, Sediments | OUI |
| 97 | swat_sub_31 | SWAT subbasin 31 | SWAT | Analyse spatiale, Rapports / Exports, SWAT, Sediments | OUI |
| 98 | swat_sub_32 | SWAT subbasin 32 | SWAT | Analyse spatiale, Rapports / Exports, SWAT, Sediments | OUI |
| 99 | swat_sub_33 | SWAT subbasin 33 | SWAT | Analyse spatiale, Rapports / Exports, SWAT, Sediments | OUI |
| 100 | swat_sub_4 | SWAT subbasin 4 | SWAT | Analyse spatiale, Rapports / Exports, SWAT, Sediments | OUI |
| 101 | swat_sub_5 | SWAT subbasin 5 | SWAT | Analyse spatiale, Rapports / Exports, SWAT, Sediments | OUI |
| 102 | swat_sub_6 | SWAT subbasin 6 | SWAT | Analyse spatiale, Rapports / Exports, SWAT, Sediments | OUI |
| 103 | swat_sub_7 | SWAT subbasin 7 | SWAT | Analyse spatiale, Rapports / Exports, SWAT, Sediments | OUI |
| 104 | swat_sub_8 | SWAT subbasin 8 | SWAT | Analyse spatiale, Rapports / Exports, SWAT, Sediments | OUI |
| 105 | swat_sub_9 | SWAT subbasin 9 | SWAT | Analyse spatiale, Rapports / Exports, SWAT, Sediments | OUI |

## 7. Baseline des scenarios

| Scenario | Visible frontend | Source DB | Protege |
| --- | --- | --- | --- |
| OBSERVED | OUI | GET /api/v1/catalog/runs | OUI |
| etat_actuel | OUI | GET /api/v1/catalog/runs | OUI |
| ssp126 | OUI | GET /api/v1/catalog/runs | OUI |
| ssp245 | OUI | GET /api/v1/catalog/runs | OUI |
| ssp585 | OUI | GET /api/v1/catalog/runs | OUI |
| scenario_1 | OUI | GET /api/v1/catalog/runs | OUI |
| scenario_2 | OUI | GET /api/v1/catalog/runs | OUI |
| scenario_3 | OUI | GET /api/v1/catalog/runs | OUI |
| scenario_4 | OUI | GET /api/v1/catalog/runs | OUI |
| SWAT_OUTPUT | NON | legacy / technique | OUI |
| SWAT_OUTPUT_01 | NON | legacy / technique | OUI |

## 8. Baseline reaches / subbasins

| Entite | Core | Runtime | Source | Protegee |
| --- | --- | --- | --- | --- |
| reaches | 33 | 19 | core.reaches + gis.reach_shapes | OUI |
| subbasins | 33 | 19 | core.subbasins + gis.subbasin_shapes | OUI |

## 9. Baseline des variables

| property_id | code | nom | unite | module | source | series | mesures |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 29 | PRECIPITATION |  | mm | climat | public.v_ts_catalog_enriched | 8 | 107627.0 |
| 24 | TMAX |  | degC | climat | public.v_ts_catalog_enriched | 10 | 45235.0 |
| 22 | TMIN |  | degC | climat | public.v_ts_catalog_enriched | 10 | 45138.0 |
| 21 | TMEAN |  | degC | climat | public.v_ts_catalog_enriched | 9 | 44444.0 |
| 30 | HUMIDITY_REL |  | % | climat | public.v_ts_catalog_enriched | 4 | 928.0 |
| 28 | EVAPORATION |  | mm | climat | public.v_ts_catalog_enriched | 6 | 2031.0 |
| 23 | WIND_SPEED |  | m/s | climat | public.v_ts_catalog_enriched | 2 | 364.0 |
| 26 | STREAMFLOW |  | m3/s | hydro | public.v_ts_catalog_enriched | 5 | 77950.0 |
| 31 | SWAT_FLOW_M3S |  | m3/s | hydro | public.v_ts_catalog_enriched | 109 | 1141230.0 |
| 91010 | SWAT_SED_IN_TONS |  | tons | erosion | public.v_ts_catalog_enriched | 0 | 0.0 |
| 32 | SWAT_SED_TONS |  | tons | erosion | public.v_ts_catalog_enriched | 109 | 1141230.0 |
| 91011 | SWAT_SED_CONC_MG_KG |  | mg/kg | erosion | public.v_ts_catalog_enriched | 0 | 0.0 |
| 33 | SWAT_SYLDT_HA |  | t/ha | erosion | public.v_ts_catalog_enriched | 109 | 1141230.0 |

## 10. Baseline timeseries

| Indicateur | Valeur |
| --- | --- |
| Nombre de timeseries | 383 |
| Timeseries avec points | 383 |
| Points mesures | 3773400 |
| Points catalogue | 3773400 |

| ts_id | station_id | property_id | run_id | source_type | time_step | min date | max date | mesures | signature |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 113 | 35 | 29 | 1 | observed | daily | 1982-09-01T00:00:00-07:00 | 2025-09-30T00:00:00-07:00 | 15736 | 4c3b91aaa0d014d2 |
| 114 | 29 | 26 | 1 | observed | daily | 1970-05-05T00:00:00-07:00 | 2015-08-31T00:00:00-07:00 | 16544 | fe6e2025a2edcebe |
| 115 | 2 | 26 | 1 | observed | daily | 1974-09-01T00:00:00-07:00 | 2023-08-31T00:00:00-07:00 | 17897 | 76adea8970938ae4 |
| 116 | 3 | 29 | 1 | observed | daily | 1982-09-01T00:00:00-07:00 | 2025-08-31T00:00:00-07:00 | 15706 | 1162fac9f6afef81 |
| 117 | 35 | 21 | 1 | observed | monthly | 1982-09-01T00:00:00-07:00 | 2023-08-01T00:00:00-07:00 | 249 | 772412a8fe587bea |
| 118 | 17 | 22 | 1 | observed | monthly | 1982-12-01T00:00:00-08:00 | 2025-07-01T00:00:00-07:00 | 480 | fd6406f880c0c6d1 |
| 119 | 12 | 22 | 1 | observed | monthly | 1982-12-01T00:00:00-08:00 | 2025-07-01T00:00:00-07:00 | 507 | dc24b328c63490ea |
| 120 | 29 | 23 | 1 | observed | monthly | 1982-12-01T00:00:00-08:00 | 2016-11-01T00:00:00-07:00 | 342 | 1423f141918b2ebc |
| 121 | 35 | 24 | 1 | observed | monthly | 1982-12-01T00:00:00-08:00 | 2023-08-01T00:00:00-07:00 | 400 | dd8d908b485b5923 |
| 122 | 24 | 29 | 1 | observed | daily | 1982-09-01T00:00:00-07:00 | 2025-08-31T00:00:00-07:00 | 15706 | 7e323b19c9df3b9e |
| 123 | 29 | 22 | 1 | observed | monthly | 1982-12-01T00:00:00-08:00 | 2015-03-01T00:00:00-08:00 | 362 | 9956bf8ee0fbdbf4 |
| 124 | 39 | 25 | 1 | observed | daily | 1971-06-01T00:00:00-07:00 | 2025-10-15T00:00:00-07:00 | 19861 | 14a4bdfedaf336fa |
| 125 | 39 | 27 | 1 | observed | daily | 2009-01-01T00:00:00-08:00 | 2025-10-15T00:00:00-07:00 | 6132 | 24b00e8b50cb0e73 |
| 126 | 17 | 28 | 1 | observed | monthly | 1982-09-01T00:00:00-07:00 | 2025-08-01T00:00:00-07:00 | 501 | bb4ea56fd3c0c02e |
| 127 | 17 | 30 | 1 | observed | monthly | 1996-11-01T00:00:00-08:00 | 2025-07-01T00:00:00-07:00 | 338 | 384d4d90f730f8ce |
| 128 | 2 | 21 | 1 | observed | daily | 1992-01-01T00:00:00-08:00 | 2015-12-31T00:00:00-08:00 | 8766 | ab908f94c52e56cf |
| 129 | 29 | 21 | 1 | observed | daily | 1992-01-01T00:00:00-08:00 | 2015-12-31T00:00:00-08:00 | 8766 | ba8c3e278e203367 |
| 130 | 1 | 24 | 1 | observed | monthly | 2023-10-01T00:00:00-07:00 | 2025-07-01T00:00:00-07:00 | 22 | 6f8b46cbc2b811f4 |
| 131 | 24 | 22 | 1 | observed | daily | 1992-01-01T00:00:00-08:00 | 2015-12-31T00:00:00-08:00 | 8766 | 8655fc6758c3a96d |
| 132 | 1 | 21 | 1 | observed | monthly | 2023-10-01T00:00:00-07:00 | 2025-07-01T00:00:00-07:00 | 21 | 5141dbdb89c5d6a4 |
| 133 | 29 | 28 | 1 | observed | monthly | 1982-09-01T00:00:00-07:00 | 2023-03-01T00:00:00-08:00 | 419 | 4c6af6ee4caaa65b |
| 134 | 2 | 28 | 1 | observed | monthly | 2013-05-01T00:00:00-07:00 | 2023-08-01T00:00:00-07:00 | 122 | 7f4dfd1f2fd36496 |
| 135 | 35 | 22 | 1 | observed | daily | 1992-09-01T00:00:00-07:00 | 2015-08-31T00:00:00-07:00 | 8400 | e5b316b8bb27b81a |
| 136 | 2 | 24 | 1 | observed | daily | 1992-01-01T00:00:00-08:00 | 2015-12-31T00:00:00-08:00 | 8766 | f149f45be18a0cde |
| 137 | 29 | 24 | 1 | observed | daily | 1992-01-01T00:00:00-08:00 | 2015-12-31T00:00:00-08:00 | 8766 | fd38e592e39552d5 |
| 138 | 12 | 28 | 1 | observed | monthly | 1982-09-01T00:00:00-07:00 | 2025-08-01T00:00:00-07:00 | 505 | 7c54dbf2c6652dfc |
| 139 | 12 | 30 | 1 | observed | monthly | 1996-11-01T00:00:00-08:00 | 2025-07-01T00:00:00-07:00 | 336 | be3166ca6f8b5b98 |
| 140 | 3 | 22 | 1 | observed | daily | 1992-01-01T00:00:00-08:00 | 2015-12-31T00:00:00-08:00 | 8766 | a0e09338d8aa4bdf |
| 141 | 1 | 29 | 1 | observed | daily | 2023-04-01T00:00:00-07:00 | 2025-08-31T00:00:00-07:00 | 884 | 6ccd4b520a952d4c |
| 142 | 12 | 24 | 1 | observed | monthly | 1982-12-01T00:00:00-08:00 | 2025-07-01T00:00:00-07:00 | 504 | f6703236628c7b5c |
| 143 | 17 | 29 | 1 | observed | daily | 1982-09-01T00:00:00-07:00 | 2025-08-31T00:00:00-07:00 | 15706 | c3420c78eb5c534e |
| 144 | 35 | 22 | 1 | observed | monthly | 1982-11-01T00:00:00-08:00 | 2023-08-01T00:00:00-07:00 | 305 | befef6de53f27304 |
| 145 | 17 | 21 | 1 | observed | monthly | 1982-09-01T00:00:00-07:00 | 2025-07-01T00:00:00-07:00 | 334 | 194fcd75fbd255b9 |
| 146 | 29 | 24 | 1 | observed | monthly | 1982-12-01T00:00:00-08:00 | 2015-03-01T00:00:00-08:00 | 385 | 51206798a4d93158 |
| 147 | 24 | 26 | 1 | observed | daily | 1985-09-01T00:00:00-07:00 | 2023-08-31T00:00:00-07:00 | 13879 | 2ec9160cf15a9608 |
| 148 | 12 | 21 | 1 | observed | monthly | 1982-09-01T00:00:00-07:00 | 2025-07-01T00:00:00-07:00 | 376 | 00b2dd94816bba6d |
| 149 | 2 | 29 | 1 | observed | daily | 1982-09-01T00:00:00-07:00 | 2024-08-31T00:00:00-07:00 | 15341 | fde94b859ece3c27 |
| 150 | 29 | 29 | 1 | observed | daily | 1982-09-01T00:00:00-07:00 | 2023-03-31T00:00:00-07:00 | 12842 | 4b593b0e3411e60a |
| 151 | 35 | 26 | 1 | observed | daily | 1992-09-01T00:00:00-07:00 | 2015-08-31T00:00:00-07:00 | 8400 | 53bd455826e00203 |
| 152 | 1 | 28 | 1 | observed | monthly | 2023-04-01T00:00:00-07:00 | 2025-08-01T00:00:00-07:00 | 29 | b60fa4aaffdbea9e |
| 153 | 1 | 30 | 1 | observed | monthly | 2023-10-01T00:00:00-07:00 | 2025-07-01T00:00:00-07:00 | 22 | efb8326f39c64274 |
| 154 | 3 | 26 | 1 | observed | daily | 1965-03-03T00:00:00-08:00 | 2023-08-31T00:00:00-07:00 | 21230 | 2daf4e93aa98d478 |
| 155 | 17 | 24 | 1 | observed | monthly | 1982-12-01T00:00:00-08:00 | 2025-07-01T00:00:00-07:00 | 460 | 88c976ad257b42ca |
| 156 | 12 | 29 | 1 | observed | daily | 1982-09-01T00:00:00-07:00 | 2025-08-31T00:00:00-07:00 | 15706 | d6a8e433451f72bf |
| 157 | 35 | 24 | 1 | observed | daily | 1992-09-01T00:00:00-07:00 | 2015-08-31T00:00:00-07:00 | 8400 | 780926dbdeade33e |
| 158 | 2 | 22 | 1 | observed | daily | 1992-01-01T00:00:00-08:00 | 2015-12-31T00:00:00-08:00 | 8766 | e72c1838045f46b8 |
| 159 | 35 | 30 | 1 | observed | monthly | 1996-11-01T00:00:00-08:00 | 2023-08-01T00:00:00-07:00 | 232 | 6bbf17534e1712c2 |
| 160 | 29 | 22 | 1 | observed | daily | 1992-01-01T00:00:00-08:00 | 2015-12-31T00:00:00-08:00 | 8766 | 96bb8d12db6351da |
| 161 | 35 | 28 | 1 | observed | monthly | 1982-09-01T00:00:00-07:00 | 2025-09-01T00:00:00-07:00 | 455 | 7d587dd652f9a74c |
| 162 | 24 | 21 | 1 | observed | daily | 1992-01-01T00:00:00-08:00 | 2015-12-31T00:00:00-08:00 | 8766 | ba71829f9895f581 |
| 163 | 3 | 24 | 1 | observed | daily | 1992-01-01T00:00:00-08:00 | 2015-12-31T00:00:00-08:00 | 8766 | 89cb6632bd2fa4b1 |
| 164 | 35 | 21 | 1 | observed | daily | 1992-09-01T00:00:00-07:00 | 2015-08-31T00:00:00-07:00 | 8400 | 8a87902c04152135 |
| 165 | 1 | 22 | 1 | observed | monthly | 2023-10-01T00:00:00-07:00 | 2025-07-01T00:00:00-07:00 | 20 | 119d335bb1497a6a |
| 166 | 1 | 23 | 1 | observed | monthly | 2023-11-01T00:00:00-07:00 | 2025-08-01T00:00:00-07:00 | 22 | 0e0be666e55cb717 |
| 167 | 3 | 21 | 1 | observed | daily | 1992-01-01T00:00:00-08:00 | 2015-12-31T00:00:00-08:00 | 8766 | beb19ec4eaa6666d |
| 168 | 24 | 24 | 1 | observed | daily | 1992-01-01T00:00:00-08:00 | 2015-12-31T00:00:00-08:00 | 8766 | 6caf67dbce9df146 |
| 169 | 40 | 31 | 2 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | f47b842d92c37486 |
| 170 | 40 | 32 | 2 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | f75a828681821868 |
| 171 | 41 | 31 | 2 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | e1375ff8b103790c |
| 172 | 41 | 32 | 2 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 4886309c082f1fa9 |
| 173 | 42 | 31 | 2 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | a3b78577456abc65 |
| 174 | 42 | 32 | 2 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 868734372e468e0d |
| 175 | 43 | 31 | 2 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | ad0a6325004f60d3 |
| 176 | 43 | 32 | 2 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | a94473f38d7baee3 |
| 177 | 44 | 31 | 2 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | d1805542ca53fe05 |
| 178 | 44 | 32 | 2 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 5b8bdec2473d1036 |
| 179 | 45 | 31 | 2 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 781b52ebda891b94 |
| 180 | 45 | 32 | 2 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 8fe931e4e899aa05 |
| 181 | 46 | 31 | 2 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 04e0e97f9ddaa845 |
| 182 | 46 | 32 | 2 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 28a34ccd322dd708 |
| 183 | 47 | 31 | 2 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | f811f13890a70f6d |
| 184 | 47 | 32 | 2 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | f102e1b8736cf5cc |
| 185 | 48 | 31 | 2 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 5a18a33ccddc2760 |
| 186 | 48 | 32 | 2 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | acc8087249f1c65a |
| 187 | 49 | 31 | 2 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 78321a3466dc6c17 |
| 188 | 49 | 32 | 2 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 0b4f6d71faeaf130 |
| 189 | 50 | 31 | 2 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 830493d5e4495cfb |
| 190 | 50 | 32 | 2 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 88cc35217eef8d94 |
| 191 | 51 | 31 | 2 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 97814ad6532ccd92 |
| 192 | 51 | 32 | 2 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | ed24a4e00f21b061 |
| 193 | 52 | 31 | 2 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | dacbb5a80dfbb5e9 |
| 194 | 52 | 32 | 2 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 78b17ef413ddce64 |
| 195 | 53 | 31 | 2 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 8cadb40ac8e62c58 |
| 196 | 53 | 32 | 2 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 40af140662ca03bd |
| 197 | 54 | 31 | 2 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 40d2fb83e3fab3fb |
| 198 | 54 | 32 | 2 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 578b0b54a00d062e |
| 199 | 55 | 31 | 2 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 5538a8b9dd758e08 |
| 200 | 55 | 32 | 2 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 2dab31b0345ad2d6 |
| 201 | 56 | 31 | 2 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | fb237d6528b1fb7d |
| 202 | 56 | 32 | 2 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 6ce3442f5a1b5fdd |
| 203 | 57 | 31 | 2 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 2f42a7a1361ff394 |
| 204 | 57 | 32 | 2 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 2b1d7ce0d11046e4 |
| 205 | 58 | 31 | 2 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 97bd5ad7cefacd94 |
| 206 | 58 | 32 | 2 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 9e8d3d6e5b3dc604 |
| 207 | 59 | 31 | 2 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 8a0b2e03120d3ab4 |
| 208 | 59 | 32 | 2 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 2603511965fe71a8 |
| 209 | 60 | 31 | 2 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 9f37e7f26e076334 |
| 210 | 60 | 32 | 2 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 8bcb529a10a8b6ee |
| 211 | 61 | 31 | 2 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | d05726a281a3ff22 |
| 212 | 61 | 32 | 2 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 48ffa73df2e1b8e4 |
| 213 | 62 | 31 | 2 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | d9fbd166362cf460 |
| 214 | 62 | 32 | 2 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 762b7d07078de171 |
| 215 | 63 | 31 | 2 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | df27115d076028ae |
| 216 | 63 | 32 | 2 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 5fdee913645ffabc |
| 217 | 64 | 31 | 2 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | c0f054e9d7e9ef1f |
| 218 | 64 | 32 | 2 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 5b32282568bd7ff1 |
| 219 | 65 | 31 | 2 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | f5cbea90044926fa |
| 220 | 65 | 32 | 2 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | a852863a87c86c8f |
| 221 | 66 | 31 | 2 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 6c8aea597207c8ce |
| 222 | 66 | 32 | 2 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 04673171f4d5c498 |
| 223 | 67 | 31 | 2 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 39ede43d6b717232 |
| 224 | 67 | 32 | 2 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | ce77e44f877c0076 |
| 225 | 68 | 31 | 2 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 0ac275197f1a7779 |
| 226 | 68 | 32 | 2 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | b3b281c09de851b8 |
| 227 | 69 | 31 | 2 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 34cea813493f2389 |
| 228 | 69 | 32 | 2 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 9481c2afbfe960e9 |
| 229 | 70 | 31 | 2 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 2720a555c027589b |
| 230 | 70 | 32 | 2 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 0be5cf630239a9e8 |
| 231 | 71 | 31 | 2 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 7154a4066e239b50 |
| 232 | 71 | 32 | 2 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 6092dcdb254d65ba |
| 233 | 72 | 31 | 2 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 441ecb42e5d5dd01 |
| 234 | 72 | 32 | 2 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 2aa1872801d35dc1 |
| 235 | 73 | 33 | 2 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 8f5bc80aa5d3098a |
| 236 | 74 | 33 | 2 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 9192e709c5b7f99a |
| 237 | 75 | 33 | 2 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 1d39a7975ab81267 |
| 238 | 76 | 33 | 2 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 4dd02db9ff4823a9 |
| 239 | 77 | 33 | 2 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 61d9e053ad398f51 |
| 240 | 78 | 33 | 2 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | e28eeb2845c409a4 |
| 241 | 79 | 33 | 2 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 7f09b109478877f2 |
| 242 | 80 | 33 | 2 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 1451a44d5ca04f62 |
| 243 | 81 | 33 | 2 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | e4b5fc9c5d7507af |
| 244 | 82 | 33 | 2 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | eddfef5d738e2c96 |
| 245 | 83 | 33 | 2 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 204f3bc699dc6f05 |
| 246 | 84 | 33 | 2 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 9602283318580360 |
| 247 | 85 | 33 | 2 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | cc01aec7a540ef1f |
| 248 | 86 | 33 | 2 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 183677bb8e8be734 |
| 249 | 87 | 33 | 2 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 0a466d3df5301b5e |
| 250 | 88 | 33 | 2 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 69e605a85e299639 |
| 251 | 89 | 33 | 2 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 30aca4b66c736f00 |
| 252 | 90 | 33 | 2 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | d2f84577180c3321 |
| 253 | 91 | 33 | 2 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | d8a35d9df28674b6 |
| 254 | 92 | 33 | 2 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 4de945a93d9527a9 |
| 255 | 93 | 33 | 2 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | bade1a25a61dbac6 |
| 256 | 94 | 33 | 2 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 0e9247e0820c7606 |
| 257 | 95 | 33 | 2 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 00a98d10ca2edd48 |
| 258 | 96 | 33 | 2 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 6d69218f3ec73d5c |
| 259 | 97 | 33 | 2 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 93e7ac69604665d0 |
| 260 | 98 | 33 | 2 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 19f4313bdf3cf0be |
| 261 | 99 | 33 | 2 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 3ae2c557e2d03916 |
| 262 | 100 | 33 | 2 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 44aef9288d3ceaf8 |
| 263 | 101 | 33 | 2 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 9a10e5a25a8cfd4b |
| 264 | 102 | 33 | 2 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 5bea2897abed48aa |
| 265 | 103 | 33 | 2 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 221c4f91d00a5ad3 |
| 266 | 104 | 33 | 2 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 07035cd03a4675d7 |
| 267 | 105 | 33 | 2 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 5831b4b46d931a98 |
| 268 | 73 | 33 | 7 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 0085b7b380532713 |
| 269 | 40 | 31 | 7 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 511929c81d9895c3 |
| 270 | 40 | 32 | 7 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 24b648c15fbc4ab2 |
| 271 | 84 | 33 | 7 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 8778175c22b70a70 |
| 272 | 51 | 31 | 7 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 76fed85c92d65a5c |
| 273 | 51 | 32 | 7 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 8891b1599339222f |
| 274 | 95 | 33 | 7 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 1bd233003d25c5e2 |
| 275 | 62 | 31 | 7 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 40f26c406c7a7bd3 |
| 276 | 62 | 32 | 7 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 63c8bc955aa7bc2e |
| 277 | 100 | 33 | 7 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 1d09e1fcc95828a1 |
| 278 | 67 | 31 | 7 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 58e1e7ca3cd1801a |
| 279 | 67 | 32 | 7 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 331d66dd3259326f |
| 280 | 101 | 33 | 7 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 403c69b06befa3b4 |
| 281 | 68 | 31 | 7 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 08a44e1b08db0521 |
| 282 | 68 | 32 | 7 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | cc0b0a283b28fdb3 |
| 283 | 102 | 33 | 7 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 2dcd0e167f3b660e |
| 284 | 69 | 31 | 7 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 748c37459f00e6c7 |
| 285 | 69 | 32 | 7 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | e4c4062c2c516876 |
| 286 | 103 | 33 | 7 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | ebb866dc5cd72c5a |
| 287 | 70 | 31 | 7 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 8acb382868754155 |
| 288 | 70 | 32 | 7 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 20430ff66747575b |
| 289 | 104 | 33 | 7 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | b250e5b53a868e17 |
| 290 | 71 | 31 | 7 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | b1ffc12b9ba874b4 |
| 291 | 71 | 32 | 7 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 488a57e098276be2 |
| 292 | 105 | 33 | 7 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 55abdad730d1c437 |
| 293 | 72 | 31 | 7 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | db7776f55c846514 |
| 294 | 72 | 32 | 7 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 7e3dbcd92f727d9a |
| 295 | 74 | 33 | 7 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 298d60740caf07c5 |
| 296 | 41 | 31 | 7 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 39b36dece4baf8f4 |
| 297 | 41 | 32 | 7 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 9956b812ddba9459 |
| 298 | 75 | 33 | 7 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | df38fc4bbc396ca2 |
| 299 | 42 | 31 | 7 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 45ddf55050cd31ed |
| 300 | 42 | 32 | 7 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 34a59c03ba919e67 |
| 301 | 76 | 33 | 7 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | c5f89295e4d929f8 |
| 302 | 43 | 31 | 7 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 5466fd39d606efc9 |
| 303 | 43 | 32 | 7 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 9449be124284dc0b |
| 304 | 77 | 33 | 7 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | c1836abf7a32a0a9 |
| 305 | 44 | 31 | 7 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 5675a4d5aec6ae2c |
| 306 | 44 | 32 | 7 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | a6d0d15fd3bb9711 |
| 307 | 78 | 33 | 7 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 2eeecf9f9a3d1b8f |
| 308 | 45 | 31 | 7 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | c131776201a566d3 |
| 309 | 45 | 32 | 7 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 8c60bf82d0ece1ba |
| 310 | 79 | 33 | 7 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 2805beafc0fa17ab |
| 311 | 46 | 31 | 7 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 225a6fdee02a0d18 |
| 312 | 46 | 32 | 7 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | ba9dec4caa6dd75b |
| 313 | 80 | 33 | 7 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 22756b6e1fcc049b |
| 314 | 47 | 31 | 7 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 9679438bf7fd5f0b |
| 315 | 47 | 32 | 7 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 84cfb1342b976d1f |
| 316 | 81 | 33 | 7 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 68d212c941c8a55d |
| 317 | 48 | 31 | 7 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 01c4fce815ba6045 |
| 318 | 48 | 32 | 7 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 95da3f7bef1d790b |
| 319 | 82 | 33 | 7 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 8a8e696fb4c27412 |
| 320 | 49 | 31 | 7 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 6ec148fa0b40a030 |
| 321 | 49 | 32 | 7 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 15084e079a56b171 |
| 322 | 83 | 33 | 7 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 79de22fed5553e09 |
| 323 | 50 | 31 | 7 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 9d025b9ba76d2b1c |
| 324 | 50 | 32 | 7 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 21c1ea7923f62fc9 |
| 325 | 73 | 33 | 8 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 96086b9981db4906 |
| 326 | 40 | 31 | 8 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | b663dbb36c68f7c3 |
| 327 | 40 | 32 | 8 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 280482a92862e99d |
| 328 | 84 | 33 | 8 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 020ca2647f9a74c0 |
| 329 | 51 | 31 | 8 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | f8f45c693900a030 |
| 330 | 51 | 32 | 8 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | cb4d444c32cf995f |
| 331 | 95 | 33 | 8 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 814d6f5e082edb26 |
| 332 | 62 | 31 | 8 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | dd9151a51508beda |
| 333 | 62 | 32 | 8 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 7621da186f429274 |
| 334 | 100 | 33 | 8 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 1015d164761e28e1 |
| 335 | 67 | 31 | 8 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 1565181c030a1376 |
| 336 | 67 | 32 | 8 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | e47f5a9e281db309 |
| 337 | 101 | 33 | 8 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 6e1e335f2eab559a |
| 338 | 68 | 31 | 8 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | f0762eaee78b82f4 |
| 339 | 68 | 32 | 8 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 76e720a33fb5d61a |
| 340 | 102 | 33 | 8 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | d703056dc39ac081 |
| 341 | 69 | 31 | 8 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | e09af40db5f1758b |
| 342 | 69 | 32 | 8 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 11e797dab5b999bd |
| 343 | 103 | 33 | 8 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | e4ee55039afa3611 |
| 344 | 70 | 31 | 8 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | daf94f6a71e4adaa |
| 345 | 70 | 32 | 8 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | fa8a440a2e4d3edb |
| 346 | 104 | 33 | 8 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | d0cf7745dd18918a |
| 347 | 71 | 31 | 8 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 181989c90731be8e |
| 348 | 71 | 32 | 8 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 89bc14d8618801e5 |
| 349 | 105 | 33 | 8 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 460f7987c6c07689 |
| 350 | 72 | 31 | 8 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 60ba388c93d6ca08 |
| 351 | 72 | 32 | 8 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | d6c2c050c4fa7df4 |
| 352 | 74 | 33 | 8 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 6f84d7143fd3b928 |
| 353 | 41 | 31 | 8 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | a5f449e9094defe8 |
| 354 | 41 | 32 | 8 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | a739200e53d6b787 |
| 355 | 75 | 33 | 8 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 9234a2814ff092a2 |
| 356 | 42 | 31 | 8 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 2621f4147f4224e2 |
| 357 | 42 | 32 | 8 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 7bf3c0e83767eacb |
| 358 | 76 | 33 | 8 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 44f71dcf64b1d1dd |
| 359 | 43 | 31 | 8 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 6a4aa599c9c86909 |
| 360 | 43 | 32 | 8 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 71a39858e4bbfc6a |
| 361 | 77 | 33 | 8 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 59c084f06d641cbb |
| 362 | 44 | 31 | 8 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | aeb3fbe99aefc9cc |
| 363 | 44 | 32 | 8 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 65a38953ae5e63aa |
| 364 | 78 | 33 | 8 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 125a72044fc9c384 |
| 365 | 45 | 31 | 8 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 01df5ebb85987bc8 |
| 366 | 45 | 32 | 8 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 8eab2b2868850c6c |
| 367 | 79 | 33 | 8 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 2b71b44935005bd4 |
| 368 | 46 | 31 | 8 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | f68bc6d010797d04 |
| 369 | 46 | 32 | 8 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 26ce2dbe7aa6d34b |
| 370 | 80 | 33 | 8 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 07da8c66123ae59b |
| 371 | 47 | 31 | 8 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 08f1eb6ee11d8eef |
| 372 | 47 | 32 | 8 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 6791405ecd2333b4 |
| 373 | 81 | 33 | 8 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 07e6b15efd79b58b |
| 374 | 48 | 31 | 8 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 8c819b95685e62f0 |
| 375 | 48 | 32 | 8 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 26c3d2d636c028fe |
| 376 | 82 | 33 | 8 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 82998f74279244ad |
| 377 | 49 | 31 | 8 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | efd4668b4dd9b2cf |
| 378 | 49 | 32 | 8 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | f56fc18693272b30 |
| 379 | 83 | 33 | 8 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 3f1a2129fdfa5093 |
| 380 | 50 | 31 | 8 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 66b423d96c35c3b6 |
| 381 | 50 | 32 | 8 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | d0e78c520a265885 |
| 382 | 73 | 33 | 9 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 3477888cd15b1d24 |
| 383 | 40 | 31 | 9 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 6349e6922eecad13 |
| 384 | 40 | 32 | 9 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 8cf02d8b1f8385dd |
| 385 | 84 | 33 | 9 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | b7558ae1c74fce19 |
| 386 | 51 | 31 | 9 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 8a806db9166b8319 |
| 387 | 51 | 32 | 9 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 28927c80809de3d6 |
| 388 | 95 | 33 | 9 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 34fda72f3096adb8 |
| 389 | 62 | 31 | 9 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | e19c187389b65171 |
| 390 | 62 | 32 | 9 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 1f8a4175f7e26695 |
| 391 | 100 | 33 | 9 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | bcf1908810d9b8d6 |
| 392 | 67 | 31 | 9 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | a89625e834b0aede |
| 393 | 67 | 32 | 9 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | ade35c0640b9a765 |
| 394 | 101 | 33 | 9 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | e5f5b2e1a4701967 |
| 395 | 68 | 31 | 9 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 6a54168a3a86a1a7 |
| 396 | 68 | 32 | 9 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | e7bdcd8c2a115533 |
| 397 | 102 | 33 | 9 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | cc7ac025d0d16258 |
| 398 | 69 | 31 | 9 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | c1c3c49074925c4f |
| 399 | 69 | 32 | 9 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | c3fe2b20c9d0b672 |
| 400 | 103 | 33 | 9 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 640ad354361271c9 |
| 401 | 70 | 31 | 9 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 407501ad9427c532 |
| 402 | 70 | 32 | 9 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 969fb95fd1a5b915 |
| 403 | 104 | 33 | 9 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 033ee72da72a9003 |
| 404 | 71 | 31 | 9 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | b2b70b9e860f102a |
| 405 | 71 | 32 | 9 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 9c1db802b6588ea9 |
| 406 | 105 | 33 | 9 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 11f7711fa8d4f6f4 |
| 407 | 72 | 31 | 9 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 560f63c3258a3def |
| 408 | 72 | 32 | 9 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 6957081142ad50fe |
| 409 | 74 | 33 | 9 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 5f75e1b0a614d89a |
| 410 | 41 | 31 | 9 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 8e764e1b53aaf0b0 |
| 411 | 41 | 32 | 9 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 8dd6534af439ca62 |
| 412 | 75 | 33 | 9 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 375e5618a02101dc |
| 413 | 42 | 31 | 9 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | a9331eec272d5450 |
| 414 | 42 | 32 | 9 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | d8fb3315f9e55ee6 |
| 415 | 76 | 33 | 9 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 6a70a61101762bce |
| 416 | 43 | 31 | 9 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 3b213c62f7ccc9c3 |
| 417 | 43 | 32 | 9 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 2493137cacc04a62 |
| 418 | 77 | 33 | 9 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 6dd1345c3792c649 |
| 419 | 44 | 31 | 9 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 4c813d59070bddc6 |
| 420 | 44 | 32 | 9 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 67ae655df60f2272 |
| 421 | 78 | 33 | 9 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 256ea5c96da70f5e |
| 422 | 45 | 31 | 9 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | eb691bf8b8274538 |
| 423 | 45 | 32 | 9 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | f3d94777d4dcd96a |
| 424 | 79 | 33 | 9 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 6cd5d8e4d43994c0 |
| 425 | 46 | 31 | 9 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | d7990d2e80e4d7b7 |
| 426 | 46 | 32 | 9 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | db9b77cbf9897780 |
| 427 | 80 | 33 | 9 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 1078a2162b21a662 |
| 428 | 47 | 31 | 9 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 737d559594e1fd64 |
| 429 | 47 | 32 | 9 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 05493e86efcb72ca |
| 430 | 81 | 33 | 9 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | ba95f1d5a8973e7e |
| 431 | 48 | 31 | 9 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | c2d71a4b903c06d9 |
| 432 | 48 | 32 | 9 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 486053a03f5e3bf9 |
| 433 | 82 | 33 | 9 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 285a12d685926a18 |
| 434 | 49 | 31 | 9 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 3eff69f12497c147 |
| 435 | 49 | 32 | 9 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | ddcfaf48b2c4fdbb |
| 436 | 83 | 33 | 9 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 5f1cc074f9aa0d56 |
| 437 | 50 | 31 | 9 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | ae8810c20dbbb4a4 |
| 438 | 50 | 32 | 9 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 27facd561ac39ba6 |
| 439 | 73 | 33 | 10 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 59a9fadf0325c1c9 |
| 440 | 40 | 31 | 10 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 788ec14570ac5abf |
| 441 | 40 | 32 | 10 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 7429ff5b94c03be2 |
| 442 | 84 | 33 | 10 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 3c0a611387c2e604 |
| 443 | 51 | 31 | 10 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | e9c735fec76b66e0 |
| 444 | 51 | 32 | 10 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | da9ca7aca8decb33 |
| 445 | 95 | 33 | 10 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 97a30b2b11ef5a16 |
| 446 | 62 | 31 | 10 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 90a53b324f9dd09f |
| 447 | 62 | 32 | 10 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 4e0fd32690f4ee00 |
| 448 | 100 | 33 | 10 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 48b39b68d697f209 |
| 449 | 67 | 31 | 10 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 67f25a18608232eb |
| 450 | 67 | 32 | 10 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | a15e8df710a67cef |
| 451 | 101 | 33 | 10 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | a42687c98874f29f |
| 452 | 68 | 31 | 10 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 1c5f62a9e7ed8b7c |
| 453 | 68 | 32 | 10 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 6b7602bbfba13f55 |
| 454 | 102 | 33 | 10 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | cf7d153f05c93f24 |
| 455 | 69 | 31 | 10 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 7e5659209186745a |
| 456 | 69 | 32 | 10 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 5eac4af137ee9b68 |
| 457 | 103 | 33 | 10 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | c399af38343eaf66 |
| 458 | 70 | 31 | 10 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 0faa6b467f5b9e68 |
| 459 | 70 | 32 | 10 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 8c994c542aae1148 |
| 460 | 104 | 33 | 10 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 0b26333ba468ba72 |
| 461 | 71 | 31 | 10 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 65c89ec5cdd8aca4 |
| 462 | 71 | 32 | 10 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 84c3c573deb0b137 |
| 463 | 105 | 33 | 10 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | a5fe4e8f07cd5fdd |
| 464 | 72 | 31 | 10 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | e9f2dd9f33af2acf |
| 465 | 72 | 32 | 10 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | d65ddf0f5385b954 |
| 466 | 74 | 33 | 10 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 20e6065649118242 |
| 467 | 41 | 31 | 10 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | be8ebc66ea2f8756 |
| 468 | 41 | 32 | 10 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | b1b6cbd31c99a2fe |
| 469 | 75 | 33 | 10 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | b9c88da91eff2f19 |
| 470 | 42 | 31 | 10 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 11287479faa66de3 |
| 471 | 42 | 32 | 10 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 911137670c0b4050 |
| 472 | 76 | 33 | 10 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 4341f4b640bf5e0c |
| 473 | 43 | 31 | 10 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 36afc2e15144530d |
| 474 | 43 | 32 | 10 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 6a47ac878fca8f94 |
| 475 | 77 | 33 | 10 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 897e0c996c733ca3 |
| 476 | 44 | 31 | 10 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 7e98be0d271d3943 |
| 477 | 44 | 32 | 10 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 6e861f11bfc36912 |
| 478 | 78 | 33 | 10 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | c039d4f4b43fe0fa |
| 479 | 45 | 31 | 10 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 398723e0016d0a90 |
| 480 | 45 | 32 | 10 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 672897702b3acf7d |
| 481 | 79 | 33 | 10 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | d9b45f17aff546db |
| 482 | 46 | 31 | 10 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | fa5a98bd6f665ee0 |
| 483 | 46 | 32 | 10 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 81f90985099426e1 |
| 484 | 80 | 33 | 10 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | fdd2205b3dde8f16 |
| 485 | 47 | 31 | 10 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | ab459569678caed9 |
| 486 | 47 | 32 | 10 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 7aa3190d90eab4de |
| 487 | 81 | 33 | 10 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 6c8302e3b11c4f1a |
| 488 | 48 | 31 | 10 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | b9589a4c7e80336e |
| 489 | 48 | 32 | 10 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 86ac3c82b30daff2 |
| 490 | 82 | 33 | 10 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | b12fb249e3c657e5 |
| 491 | 49 | 31 | 10 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 4821f85c44dcc1fa |
| 492 | 49 | 32 | 10 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | cbfa62d0919b8c5a |
| 493 | 83 | 33 | 10 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 34ab04016e804cda |
| 494 | 50 | 31 | 10 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | f9ab7f79780ae789 |
| 495 | 50 | 32 | 10 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 9af1838664300b1c |

## 11. Baseline SWAT

### access.rch_results

| Scenario | Time step | Lignes | Sous-entites | Min date | Max date |
| --- | --- | --- | --- | --- | --- |
| etat_actuel | daily | 198930 | 19 | 1995-01-01 | 2023-08-31 |
| etat_actuel | monthly | 198930 | 19 | 1995-01-01 | 2023-08-31 |
| etat_actuel | yearly | 198930 | 19 | 1995-01-01 | 2023-08-31 |
| scenario_1 | daily | 198930 | 19 | 1995-01-01 | 2023-08-31 |
| scenario_1 | yearly | 551 | 19 | 1995-01-01 | 2023-01-01 |
| scenario_2 | daily | 198930 | 19 | 1995-01-01 | 2023-08-31 |
| scenario_2 | yearly | 551 | 19 | 1995-01-01 | 2023-01-01 |
| scenario_3 | daily | 198930 | 19 | 1995-01-01 | 2023-08-31 |
| scenario_3 | yearly | 551 | 19 | 1995-01-01 | 2023-01-01 |
| scenario_4 | daily | 198930 | 19 | 1995-01-01 | 2023-08-31 |
| scenario_4 | yearly | 551 | 19 | 1995-01-01 | 2023-01-01 |
| ssp126 | daily | 344660 | 19 | 1995-01-01 | 2059-12-31 |
| ssp126 | monthly | 203718 | 19 | 1995-01-01 | 2059-12-01 |
| ssp126 | yearly | 199329 | 19 | 1995-01-01 | 2059-01-01 |
| ssp245 | daily | 344660 | 19 | 1995-01-01 | 2059-12-31 |
| ssp245 | monthly | 203718 | 19 | 1995-01-01 | 2059-12-01 |
| ssp245 | yearly | 199329 | 19 | 1995-01-01 | 2059-01-01 |
| ssp585 | daily | 344660 | 19 | 1995-01-01 | 2059-12-31 |
| ssp585 | monthly | 203718 | 19 | 1995-01-01 | 2059-12-01 |
| ssp585 | yearly | 199329 | 19 | 1995-01-01 | 2059-01-01 |

### access.sub_results

| Scenario | Time step | Lignes | Sous-entites | Min date | Max date |
| --- | --- | --- | --- | --- | --- |
| etat_actuel | daily | 198930 | 19 | 1995-01-01 | 2023-08-31 |
| etat_actuel | monthly | 198930 | 19 | 1995-01-01 | 2023-08-31 |
| etat_actuel | yearly | 198930 | 19 | 1995-01-01 | 2023-08-31 |
| scenario_1 | daily | 198930 | 19 | 1995-01-01 | 2023-08-31 |
| scenario_1 | yearly | 551 | 19 | 1995-01-01 | 2023-01-01 |
| scenario_2 | daily | 198930 | 19 | 1995-01-01 | 2023-08-31 |
| scenario_2 | yearly | 551 | 19 | 1995-01-01 | 2023-01-01 |
| scenario_3 | daily | 198930 | 19 | 1995-01-01 | 2023-08-31 |
| scenario_3 | yearly | 551 | 19 | 1995-01-01 | 2023-01-01 |
| scenario_4 | daily | 198930 | 19 | 1995-01-01 | 2023-08-31 |
| scenario_4 | yearly | 551 | 19 | 1995-01-01 | 2023-01-01 |
| ssp126 | daily | 344660 | 19 | 1995-01-01 | 2059-12-31 |
| ssp126 | monthly | 203718 | 19 | 1995-01-01 | 2059-12-01 |
| ssp126 | yearly | 199329 | 19 | 1995-01-01 | 2059-01-01 |
| ssp245 | daily | 344660 | 19 | 1995-01-01 | 2059-12-31 |
| ssp245 | monthly | 203718 | 19 | 1995-01-01 | 2059-12-01 |
| ssp245 | yearly | 199329 | 19 | 1995-01-01 | 2059-01-01 |
| ssp585 | daily | 344660 | 19 | 1995-01-01 | 2059-12-31 |
| ssp585 | monthly | 203718 | 19 | 1995-01-01 | 2059-12-01 |
| ssp585 | yearly | 199329 | 19 | 1995-01-01 | 2059-01-01 |

## 12. Baseline cartographique

| Couche | Features | SRID | BBox | Source runtime | Module consommateur |
| --- | --- | --- | --- | --- | --- |
| gis.reach_shapes | 19 | 4326 |  | database runtime | Cartographie, Analyse spatiale, Sediments |
| gis.subbasin_shapes | 19 | 4326 |  | database runtime | Cartographie, Analyse spatiale, Sediments |
| gis.meteo_stations | 5 | 4326 |  | database runtime | Climat, Cartographie, Analyse spatiale |
| core.stations | 34 | 4326 |  | database runtime | Cartographie, Analyse spatiale, Hydrologie |
| hydro_Hassan dakhil/frontend/public/data/hassan/nv_stream.geojson | 19 | 4326 | [-5.351546356272964, 31.997012438784385, -4.238118295972147, 32.527379533572486] | frontend fallback file | Analyse spatiale, Sediments |
| hydro_Hassan dakhil/frontend/public/data/hassan/subbasin_hru_summary.geojson | 19 | 4326 | [-5.462193875233378, 31.996899406228412, -4.152605921162008, 32.615689355302855] | frontend fallback file | Analyse spatiale, Sediments |

## 13. Baseline hydrologie

| Station | Variable | Scenario | Periode | Points | Min | Max | Moyenne | Signature |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1508/38 | STREAMFLOW | OBSERVED | 1974-09-01T00:00:00-07:00 -> 2023-08-31T00:00:00-07:00 | 17897 | 0.0 | 379.0 | 1.8002393138514912 | 76adea8970938ae4 |
| 31/38 | STREAMFLOW | OBSERVED | 1965-03-03T00:00:00-08:00 -> 2023-08-31T00:00:00-07:00 | 21230 | 0.0 | 150.0 | 1.8376533207724761 | 2daf4e93aa98d478 |
| 1585/38 | STREAMFLOW | OBSERVED | 1985-09-01T00:00:00-07:00 -> 2023-08-31T00:00:00-07:00 | 13879 | 0.0 | 212.0 | 1.6346992578716038 | 2ec9160cf15a9608 |
| 867/48 | STREAMFLOW | OBSERVED | 1970-05-05T00:00:00-07:00 -> 2015-08-31T00:00:00-07:00 | 16544 | 0.0 | 594.0 | 4.226935142649929 | fe6e2025a2edcebe |
| 1940/48 | STREAMFLOW | OBSERVED | 1992-09-01T00:00:00-07:00 -> 2015-08-31T00:00:00-07:00 | 8400 | 0.0 | 25.4 | 1.2840675000000041 | 53bd455826e00203 |

## 14. Baseline climat

| Station | Variable | Scenario | Periode | Points | Min | Max | Moyenne | Signature |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| hammat_my_ali_cherif | TMEAN | OBSERVED | 2023-10-01T00:00:00-07:00 -> 2025-07-01T00:00:00-07:00 | 21 | 0.0 | 31.7 | 16.84285714285714 | 5141dbdb89c5d6a4 |
| hammat_my_ali_cherif | TMIN | OBSERVED | 2023-10-01T00:00:00-07:00 -> 2025-07-01T00:00:00-07:00 | 20 | -5.6 | 22.4 | 6.19 | 119d335bb1497a6a |
| hammat_my_ali_cherif | WIND_SPEED | OBSERVED | 2023-11-01T00:00:00-07:00 -> 2025-08-01T00:00:00-07:00 | 22 | 1.19 | 3.33 | 1.7372727272727273 | 0e0be666e55cb717 |
| hammat_my_ali_cherif | TMAX | OBSERVED | 2023-10-01T00:00:00-07:00 -> 2025-07-01T00:00:00-07:00 | 22 | 18.4 | 43.2 | 30.736363636363635 | 6f8b46cbc2b811f4 |
| hammat_my_ali_cherif | EVAPORATION | OBSERVED | 2023-04-01T00:00:00-07:00 -> 2025-08-01T00:00:00-07:00 | 29 | 94.6 | 553.9 | 306.8834482758621 | b60fa4aaffdbea9e |
| hammat_my_ali_cherif | PRECIPITATION | OBSERVED | 2023-04-01T00:00:00-07:00 -> 2025-08-31T00:00:00-07:00 | 884 | 0.0 | 52.0 | 0.5720588235294118 | 6ccd4b520a952d4c |

## 15. Baseline sediments

| Domaine | Scenario | Time step | Entite | Lignes | Periode | Min | Max | Moyenne | Signature |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| reach_sediment | etat_actuel | daily | 1 | 10470 | 1995-01-01 -> 2023-08-31 | 0.0 | 10.62 | 0.33919884898758373 | c08dca543c59f47b |
| reach_sediment | ssp245 | monthly | 1 | 10722 | 1995-01-01 -> 2059-12-01 | 0.0 | 10.62 | 0.36031998684014194 | 46f36ea9d420fc85 |
| solid_yield | etat_actuel | daily | 1 | 10470 | 1995-01-01 -> 2023-08-31 | 2.57e-13 | 7.31 | 0.02164572298231918 | e9b1d7f93daa1623 |
| solid_yield | ssp245 | monthly | 1 | 10722 | 1995-01-01 -> 2059-12-01 | 0.0 | 17.738 | 0.033554627832949234 | 332056c5dffd4c73 |
| q_to_qs_client |  |  | 5 |  | None -> None |  |  |  | 511608327c6f880c |

## 16. Baseline bathymetrie / siltation

| Bloc | Valeur |
| --- | --- |
| Campagnes bathymetrie | {'campaign_count': 6, 'min_measurement_year': 1990, 'max_measurement_year': 2022, 'min_campaign_year': 1990, 'max_campaign_year': 2022, 'min_volume_mhm3': 287.566412, 'max_volume_mhm3': 346.77905} |
| Points reservoir_bathymetry | {'point_count': 4401, 'reservoir_count': 1, 'min_level_m': 1081.0, 'max_level_m': 1125.0, 'min_volume_hm3': 0.0, 'max_volume_hm3': 331.58} |
| Tables siltation | {'indicators_count': 0, 'hsv_count': 0, 'evolution_count': 0} |
| API summary | {'url': 'http://127.0.0.1:5007/api/v1/siltation/summary', 'ok': True, 'status': 200, 'bytes': 703, 'hash': '2539c943f4f3e076', 'item_count': 6, 'payload_type': 'dict', 'data_preview': None} |
| API availability | {'url': 'http://127.0.0.1:5007/api/v1/siltation/availability', 'ok': True, 'status': 200, 'bytes': 209, 'hash': 'b377345617341fb4', 'item_count': 6, 'payload_type': 'dict', 'data_preview': None} |
| API bathymetry campaigns | {'url': 'http://127.0.0.1:5007/api/v1/siltation/bathymetry-campaigns', 'ok': True, 'status': 200, 'bytes': 2942, 'hash': '96169d76bbb90651', 'item_count': 6, 'payload_type': 'dict', 'data_preview': None} |

## 17. Baseline API

| Endpoint | HTTP | Bytes | Items | Hash | Type |
| --- | --- | --- | --- | --- | --- |
| backend_root | 200 | 59 | 3 | 1c48b32a7977b970 | dict |
| health | 200 | 140 | 6 | 023fda477234986f | dict |
| catalog_modules | 200 | 110 | 3 | 4f3ce98aaf6a3425 | list |
| catalog_runs | 200 | 1844 | 9 | 5f92fece1d1cfe62 | list |
| catalog_climat_properties | 200 | 1171 | 7 | 4d185efb020c3696 | list |
| catalog_hydro_properties | 200 | 422 | 2 | bfd4436e03842eb9 | list |
| catalog_erosion_properties | 200 | 939 | 4 | 8052998634755a89 | list |
| catalog_climat_stations | 200 | 671 | 8 | 759a03e2f9516911 | list |
| catalog_hydro_stations | 200 | 437 | 5 | ee070aa1991cad24 | list |
| catalog_erosion_stations | 200 | 69 | 0 | 1b8712e93074c374 | list |
| catalog_availability_climat | 200 | 11989 | 30 | 4eef512b718ac88e | list |
| catalog_availability_hydro | 200 | 23090 | 45 | 180379674b06cf2a | list |
| catalog_availability_erosion | 200 | 21938 | 40 | c1d9586363fc93ea | list |
| hydro_stations | 200 | 1167 | 5 | 012729dd157cddb6 | list |
| spatial_reaches | 200 | 1318578 | 19 | 5fa26d605398853f | FeatureCollection |
| spatial_subbasins | 200 | 3510108 | 19 | 7697a9b6222db9f4 | FeatureCollection |
| swat_summary | 200 | 232 | 7 | 734ddcc2076b55ac | dict |
| swat_availability | 200 | 160437 | 383 | 2328b481603c51e5 | list |
| solid_yield_subbasins | 200 | 3682 | 19 | 5c2f55d932bcd4df | list |
| solid_yield_availability | 200 | 65495 | 152 | b5b2cdaf37c6eb63 | list |
| siltation_summary | 200 | 703 | 6 | 2539c943f4f3e076 | dict |
| siltation_availability | 200 | 209 | 6 | b377345617341fb4 | dict |
| siltation_bathymetry_campaigns | 200 | 2942 | 6 | 96169d76bbb90651 | dict |
| data_scan_summary | 200 | 441 | 13 | 67afb83b91ac0e41 | dict |
| data_scan_periods_global | 200 | 12593 | 5 | 098498f3e601d450 | dict |
| frontend_root | 404 | 0 | 0 | e3b0c44298fc1c14 |  |

## 18. Regles de non-regression

| Code | Regle |
| --- | --- |
| RULE-01 | A visible scenario must not disappear. |
| RULE-02 | A functional station must not lose its protected data. |
| RULE-03 | A protected timeseries must not lose measurement volume. |
| RULE-04 | Runtime reaches and subbasins must not decrease without validation. |
| RULE-05 | SWAT daily, monthly, yearly datasets must remain distinct. |
| RULE-06 | Map layers must not lose features. |
| RULE-07 | Protected business statistics must not change without a documented cause. |
| RULE-08 | Protected endpoints must not break their contract. |
| RULE-09 | Every future data correction must be compared to this baseline. |
| RULE-10 | If a protected regression is detected: immediate rollback. |

## 19. Artefacts

- Baseline JSON : `D:\3- Projets\App_Hassan_Addakhil\Support_Doc_HD\Phase Performance\BASELINE_PERFORMANCE_SNAPSHOT_20260826_01.json`
- Script de comparaison : `D:\3- Projets\App_Hassan_Addakhil\scripts\quality\compare-functional-baseline.py`

## 20. Limites

- Baseline prise en lecture seule a partir de l'etat courant du backend, du frontend et de la base officielle.
- Le rapport conserve les signatures de protection, pas les mesures detaillees ligne par ligne.
- Toute correction future devra etre comparee a cette baseline avant validation.

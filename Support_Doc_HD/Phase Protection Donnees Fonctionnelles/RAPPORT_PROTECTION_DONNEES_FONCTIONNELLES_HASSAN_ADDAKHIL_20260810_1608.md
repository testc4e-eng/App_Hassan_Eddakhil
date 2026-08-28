# RAPPORT PROTECTION DONNEES FONCTIONNELLES - HASSAN ADDAKHIL

- Date/heure : 2026-08-10T16:09:06+00:00
- Base officielle : `hydro_hd`
- Backend : `http://127.0.0.1:5007`
- Frontend : `http://127.0.0.1:8090`

## 1. Resume executif

- Baseline fonctionnelle creee en lecture seule.
- Backup valide : OUI.
- Scenarios visibles proteges : OBSERVED, etat_actuel, ssp126, ssp245, ssp585, scenario_1, scenario_2, scenario_3, scenario_4.
- Stations protegees : 101 / 102.
- Reaches runtime proteges : 19 ; subbasins runtime proteges : 19.
- Timeseries cataloguees : 383 ; points de mesure proteges : 3773400.

## 2. Etat de reference

| Champ | Valeur |
| --- | --- |
| Date/heure | 2026-08-10T16:09:06+00:00 |
| Branche Git | ilh_dev_20-07 |
| Commit Git | 99c1089e9f0588fdbd8e8872302295cb88bbdaf6 |
| Backend actif | OUI |
| Frontend actif | OUI |
| Version DB | PostgreSQL 17.8 on x86_64-windows, compiled by msvc-19.44.35222, 64-bit |
| Taille DB | 5379 MB (5640410803 bytes) |
| Status Git | 207 entree(s) modifiee(s) |

## 3. Backup de protection

| Champ | Valeur |
| --- | --- |
| Chemin | D:\3- Projets\App_Hassan_Addakhil\backups\hydro_hd_before_dq_corrections_20260810_1339.dump |
| Present | OUI |
| Type fichier | OUI |
| Taille | 533241661 |
| pg_restore --list | OK |
| Derniere modification | 2026-08-10T13:41:45+00:00 |

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
| scenario_1 | OUI | GET /api/v1/catalog/runs | OUI |
| scenario_2 | OUI | GET /api/v1/catalog/runs | OUI |
| scenario_3 | OUI | GET /api/v1/catalog/runs | OUI |
| scenario_4 | OUI | GET /api/v1/catalog/runs | OUI |
| ssp126 | OUI | GET /api/v1/catalog/runs | OUI |
| ssp245 | OUI | GET /api/v1/catalog/runs | OUI |
| ssp585 | OUI | GET /api/v1/catalog/runs | OUI |
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
| 113 | 35 | 29 | 1 | observed | daily | 1982-09-01T00:00:00-07:00 | 2025-09-30T00:00:00-07:00 | 15736 | b4525213b0ca2977 |
| 114 | 29 | 26 | 1 | observed | daily | 1970-05-05T00:00:00-07:00 | 2015-08-31T00:00:00-07:00 | 16544 | 807cd0d3230c87f3 |
| 115 | 2 | 26 | 1 | observed | daily | 1974-09-01T00:00:00-07:00 | 2023-08-31T00:00:00-07:00 | 17897 | 2bb6ff9484d1cac4 |
| 116 | 3 | 29 | 1 | observed | daily | 1982-09-01T00:00:00-07:00 | 2025-08-31T00:00:00-07:00 | 15706 | 8918866b4a9c544f |
| 117 | 35 | 21 | 1 | observed | monthly | 1982-09-01T00:00:00-07:00 | 2023-08-01T00:00:00-07:00 | 249 | f215bac16311b83b |
| 118 | 17 | 22 | 1 | observed | monthly | 1982-12-01T00:00:00-08:00 | 2025-07-01T00:00:00-07:00 | 480 | f269ffcc1d64a7c7 |
| 119 | 12 | 22 | 1 | observed | monthly | 1982-12-01T00:00:00-08:00 | 2025-07-01T00:00:00-07:00 | 507 | 0c32a6b943980df1 |
| 120 | 29 | 23 | 1 | observed | monthly | 1982-12-01T00:00:00-08:00 | 2016-11-01T00:00:00-07:00 | 342 | 52587b33852be613 |
| 121 | 35 | 24 | 1 | observed | monthly | 1982-12-01T00:00:00-08:00 | 2023-08-01T00:00:00-07:00 | 400 | 2e5cf9faab6c5a67 |
| 122 | 24 | 29 | 1 | observed | daily | 1982-09-01T00:00:00-07:00 | 2025-08-31T00:00:00-07:00 | 15706 | 41cad30233305cc0 |
| 123 | 29 | 22 | 1 | observed | monthly | 1982-12-01T00:00:00-08:00 | 2015-03-01T00:00:00-08:00 | 362 | 15f71e28e928ed11 |
| 124 | 39 | 25 | 1 | observed | daily | 1971-06-01T00:00:00-07:00 | 2025-10-15T00:00:00-07:00 | 19861 | fecc62421184cba9 |
| 125 | 39 | 27 | 1 | observed | daily | 2009-01-01T00:00:00-08:00 | 2025-10-15T00:00:00-07:00 | 6132 | 08f23f225c853f5a |
| 126 | 17 | 28 | 1 | observed | monthly | 1982-09-01T00:00:00-07:00 | 2025-08-01T00:00:00-07:00 | 501 | dcc033bfeb646120 |
| 127 | 17 | 30 | 1 | observed | monthly | 1996-11-01T00:00:00-08:00 | 2025-07-01T00:00:00-07:00 | 338 | 1c2696a5c4ae95dd |
| 128 | 2 | 21 | 1 | observed | daily | 1992-01-01T00:00:00-08:00 | 2015-12-31T00:00:00-08:00 | 8766 | 8f18ed241a56c169 |
| 129 | 29 | 21 | 1 | observed | daily | 1992-01-01T00:00:00-08:00 | 2015-12-31T00:00:00-08:00 | 8766 | 5f1a01df2d5cf07d |
| 130 | 1 | 24 | 1 | observed | monthly | 2023-10-01T00:00:00-07:00 | 2025-07-01T00:00:00-07:00 | 22 | 88a213a09fc25acc |
| 131 | 24 | 22 | 1 | observed | daily | 1992-01-01T00:00:00-08:00 | 2015-12-31T00:00:00-08:00 | 8766 | 9b0f88ec2573c69f |
| 132 | 1 | 21 | 1 | observed | monthly | 2023-10-01T00:00:00-07:00 | 2025-07-01T00:00:00-07:00 | 21 | dac4aafd2f0f93f4 |
| 133 | 29 | 28 | 1 | observed | monthly | 1982-09-01T00:00:00-07:00 | 2023-03-01T00:00:00-08:00 | 419 | c6b3387dc52584ef |
| 134 | 2 | 28 | 1 | observed | monthly | 2013-05-01T00:00:00-07:00 | 2023-08-01T00:00:00-07:00 | 122 | 19ffdde8d55ab89b |
| 135 | 35 | 22 | 1 | observed | daily | 1992-09-01T00:00:00-07:00 | 2015-08-31T00:00:00-07:00 | 8400 | 9b0eecfc2ebfb842 |
| 136 | 2 | 24 | 1 | observed | daily | 1992-01-01T00:00:00-08:00 | 2015-12-31T00:00:00-08:00 | 8766 | eea8a38e6340b07b |
| 137 | 29 | 24 | 1 | observed | daily | 1992-01-01T00:00:00-08:00 | 2015-12-31T00:00:00-08:00 | 8766 | 3c9c2dc300aa61ec |
| 138 | 12 | 28 | 1 | observed | monthly | 1982-09-01T00:00:00-07:00 | 2025-08-01T00:00:00-07:00 | 505 | d26323a83c93c36a |
| 139 | 12 | 30 | 1 | observed | monthly | 1996-11-01T00:00:00-08:00 | 2025-07-01T00:00:00-07:00 | 336 | 458897e38ce2d51e |
| 140 | 3 | 22 | 1 | observed | daily | 1992-01-01T00:00:00-08:00 | 2015-12-31T00:00:00-08:00 | 8766 | 922a3391d43880f4 |
| 141 | 1 | 29 | 1 | observed | daily | 2023-04-01T00:00:00-07:00 | 2025-08-31T00:00:00-07:00 | 884 | c6cefa6c75fc9a50 |
| 142 | 12 | 24 | 1 | observed | monthly | 1982-12-01T00:00:00-08:00 | 2025-07-01T00:00:00-07:00 | 504 | e0a6087934a21c53 |
| 143 | 17 | 29 | 1 | observed | daily | 1982-09-01T00:00:00-07:00 | 2025-08-31T00:00:00-07:00 | 15706 | 06dece2742ef1342 |
| 144 | 35 | 22 | 1 | observed | monthly | 1982-11-01T00:00:00-08:00 | 2023-08-01T00:00:00-07:00 | 305 | 0071a0b4311344d3 |
| 145 | 17 | 21 | 1 | observed | monthly | 1982-09-01T00:00:00-07:00 | 2025-07-01T00:00:00-07:00 | 334 | f62ae5ab533a150a |
| 146 | 29 | 24 | 1 | observed | monthly | 1982-12-01T00:00:00-08:00 | 2015-03-01T00:00:00-08:00 | 385 | 87311bf09466362c |
| 147 | 24 | 26 | 1 | observed | daily | 1985-09-01T00:00:00-07:00 | 2023-08-31T00:00:00-07:00 | 13879 | 21d19d789a0107b7 |
| 148 | 12 | 21 | 1 | observed | monthly | 1982-09-01T00:00:00-07:00 | 2025-07-01T00:00:00-07:00 | 376 | ff42481995fffc35 |
| 149 | 2 | 29 | 1 | observed | daily | 1982-09-01T00:00:00-07:00 | 2024-08-31T00:00:00-07:00 | 15341 | f2e7315051c85ea3 |
| 150 | 29 | 29 | 1 | observed | daily | 1982-09-01T00:00:00-07:00 | 2023-03-31T00:00:00-07:00 | 12842 | 46b81f1c0187c670 |
| 151 | 35 | 26 | 1 | observed | daily | 1992-09-01T00:00:00-07:00 | 2015-08-31T00:00:00-07:00 | 8400 | af0c4e42f1a15ea1 |
| 152 | 1 | 28 | 1 | observed | monthly | 2023-04-01T00:00:00-07:00 | 2025-08-01T00:00:00-07:00 | 29 | dfaf9fc495253769 |
| 153 | 1 | 30 | 1 | observed | monthly | 2023-10-01T00:00:00-07:00 | 2025-07-01T00:00:00-07:00 | 22 | f64b9907f11a898a |
| 154 | 3 | 26 | 1 | observed | daily | 1965-03-03T00:00:00-08:00 | 2023-08-31T00:00:00-07:00 | 21230 | 35477411e974d7e8 |
| 155 | 17 | 24 | 1 | observed | monthly | 1982-12-01T00:00:00-08:00 | 2025-07-01T00:00:00-07:00 | 460 | 8a9bdf5b3f9a9c63 |
| 156 | 12 | 29 | 1 | observed | daily | 1982-09-01T00:00:00-07:00 | 2025-08-31T00:00:00-07:00 | 15706 | 3e1e3a4841086d4e |
| 157 | 35 | 24 | 1 | observed | daily | 1992-09-01T00:00:00-07:00 | 2015-08-31T00:00:00-07:00 | 8400 | f02e554a612af71a |
| 158 | 2 | 22 | 1 | observed | daily | 1992-01-01T00:00:00-08:00 | 2015-12-31T00:00:00-08:00 | 8766 | 9b04436e0dde1478 |
| 159 | 35 | 30 | 1 | observed | monthly | 1996-11-01T00:00:00-08:00 | 2023-08-01T00:00:00-07:00 | 232 | 41b440d12ba47391 |
| 160 | 29 | 22 | 1 | observed | daily | 1992-01-01T00:00:00-08:00 | 2015-12-31T00:00:00-08:00 | 8766 | 6626af8ddccfc34e |
| 161 | 35 | 28 | 1 | observed | monthly | 1982-09-01T00:00:00-07:00 | 2025-09-01T00:00:00-07:00 | 455 | 60f18ef28dbf4c36 |
| 162 | 24 | 21 | 1 | observed | daily | 1992-01-01T00:00:00-08:00 | 2015-12-31T00:00:00-08:00 | 8766 | d903d90774ed6e94 |
| 163 | 3 | 24 | 1 | observed | daily | 1992-01-01T00:00:00-08:00 | 2015-12-31T00:00:00-08:00 | 8766 | 20fbdc725f23a699 |
| 164 | 35 | 21 | 1 | observed | daily | 1992-09-01T00:00:00-07:00 | 2015-08-31T00:00:00-07:00 | 8400 | 122ee6636b839644 |
| 165 | 1 | 22 | 1 | observed | monthly | 2023-10-01T00:00:00-07:00 | 2025-07-01T00:00:00-07:00 | 20 | 119d335bb1497a6a |
| 166 | 1 | 23 | 1 | observed | monthly | 2023-11-01T00:00:00-07:00 | 2025-08-01T00:00:00-07:00 | 22 | 25da309ffaa6fc0f |
| 167 | 3 | 21 | 1 | observed | daily | 1992-01-01T00:00:00-08:00 | 2015-12-31T00:00:00-08:00 | 8766 | dd267d9b6697a2c1 |
| 168 | 24 | 24 | 1 | observed | daily | 1992-01-01T00:00:00-08:00 | 2015-12-31T00:00:00-08:00 | 8766 | f5a4fb598d270704 |
| 169 | 40 | 31 | 2 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | df454caf6b296415 |
| 170 | 40 | 32 | 2 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 40bb4ce10bb2919d |
| 171 | 41 | 31 | 2 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 5201a4b036946f33 |
| 172 | 41 | 32 | 2 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | ffbc8d8422e7a223 |
| 173 | 42 | 31 | 2 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 72f8635ca609d177 |
| 174 | 42 | 32 | 2 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | b7fc0d946944fc7a |
| 175 | 43 | 31 | 2 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 65389c4a27e8dc12 |
| 176 | 43 | 32 | 2 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 0e56e7df3bddd5ba |
| 177 | 44 | 31 | 2 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 3f915ab72ecfe1d2 |
| 178 | 44 | 32 | 2 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 3269b62e97f68bb8 |
| 179 | 45 | 31 | 2 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 855fff918d087b88 |
| 180 | 45 | 32 | 2 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 7c33328301173f10 |
| 181 | 46 | 31 | 2 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 7ff3b6f6660f2f7d |
| 182 | 46 | 32 | 2 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 9cf93277f2672c4c |
| 183 | 47 | 31 | 2 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | c06f3913368798f8 |
| 184 | 47 | 32 | 2 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 4720dec5c1222677 |
| 185 | 48 | 31 | 2 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 589f2a2051481bec |
| 186 | 48 | 32 | 2 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 2790d1865a541ba8 |
| 187 | 49 | 31 | 2 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 03d93a539147cbab |
| 188 | 49 | 32 | 2 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | b914884608da7ea9 |
| 189 | 50 | 31 | 2 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 09e78b80b8e1adfc |
| 190 | 50 | 32 | 2 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | d6632293b4cd5474 |
| 191 | 51 | 31 | 2 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | e3f39cfd24b4a698 |
| 192 | 51 | 32 | 2 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | c4648275fbf94ae2 |
| 193 | 52 | 31 | 2 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | dc8d62f17e7e2a0d |
| 194 | 52 | 32 | 2 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 5427dd05bfe9c694 |
| 195 | 53 | 31 | 2 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 126bb68e186ffc7f |
| 196 | 53 | 32 | 2 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 785ce4ec2009aa08 |
| 197 | 54 | 31 | 2 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 2dcddd6f93958b70 |
| 198 | 54 | 32 | 2 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | c459863b9627ea7d |
| 199 | 55 | 31 | 2 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 86a9d30e2290419b |
| 200 | 55 | 32 | 2 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 5f330f9f55ba9535 |
| 201 | 56 | 31 | 2 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 21444fe99d6f9c02 |
| 202 | 56 | 32 | 2 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | bf985a39e97efe58 |
| 203 | 57 | 31 | 2 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 0d7ca5ae29d73161 |
| 204 | 57 | 32 | 2 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 87fc67d955bdb076 |
| 205 | 58 | 31 | 2 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 5746657c8a715149 |
| 206 | 58 | 32 | 2 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 8f4740574b472d75 |
| 207 | 59 | 31 | 2 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | d9e10259277d456e |
| 208 | 59 | 32 | 2 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 6853eb5e059b5ff1 |
| 209 | 60 | 31 | 2 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 32bd6c34ce59b67a |
| 210 | 60 | 32 | 2 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | ccddd39f636be92e |
| 211 | 61 | 31 | 2 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 5200d363521befaa |
| 212 | 61 | 32 | 2 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | f938c5247714d823 |
| 213 | 62 | 31 | 2 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 782aa0d1966271fc |
| 214 | 62 | 32 | 2 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 744670b40e7a5a11 |
| 215 | 63 | 31 | 2 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | e5e7fc38d383789a |
| 216 | 63 | 32 | 2 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | c24c4cc4b3757fd6 |
| 217 | 64 | 31 | 2 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 34bbf11e98b5ca8c |
| 218 | 64 | 32 | 2 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 84cd6f9963564c6b |
| 219 | 65 | 31 | 2 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 0ac1584a24088d4c |
| 220 | 65 | 32 | 2 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 208dec9a9548db9d |
| 221 | 66 | 31 | 2 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | e63369735a49f74c |
| 222 | 66 | 32 | 2 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | a474f9913b6c621e |
| 223 | 67 | 31 | 2 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 42666f8bfaa6d4f0 |
| 224 | 67 | 32 | 2 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 85c2a63a93148e55 |
| 225 | 68 | 31 | 2 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 24ae1859001f19e6 |
| 226 | 68 | 32 | 2 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | ffbf6abd644553cf |
| 227 | 69 | 31 | 2 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 18f49855caedd77c |
| 228 | 69 | 32 | 2 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | ac75519033aa25f8 |
| 229 | 70 | 31 | 2 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 3ded01e99f2c0942 |
| 230 | 70 | 32 | 2 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | f7602150eb1dc0b0 |
| 231 | 71 | 31 | 2 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 45c8167f2bb8505d |
| 232 | 71 | 32 | 2 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 4d19b9a1531bc7d3 |
| 233 | 72 | 31 | 2 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 9b860330d582fc26 |
| 234 | 72 | 32 | 2 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | bbc4090c075533bd |
| 235 | 73 | 33 | 2 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 8f5bc80aa5d3098a |
| 236 | 74 | 33 | 2 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 24b8ce59744e2cd8 |
| 237 | 75 | 33 | 2 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 473a3bc57621d135 |
| 238 | 76 | 33 | 2 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | d26a727a1e170f09 |
| 239 | 77 | 33 | 2 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | e99cfd30088c2708 |
| 240 | 78 | 33 | 2 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 627deff7c1d6199b |
| 241 | 79 | 33 | 2 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 8fd06a1602f3c532 |
| 242 | 80 | 33 | 2 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 5fa29e46b89c3d75 |
| 243 | 81 | 33 | 2 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | aa9659190bfdc17d |
| 244 | 82 | 33 | 2 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | cfc383b498507d2e |
| 245 | 83 | 33 | 2 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 533f93f7032778a2 |
| 246 | 84 | 33 | 2 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | dc01f03626ff00a3 |
| 247 | 85 | 33 | 2 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 45878d23e2b1030b |
| 248 | 86 | 33 | 2 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | bede19bed96176a4 |
| 249 | 87 | 33 | 2 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 287e2df342684873 |
| 250 | 88 | 33 | 2 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | ebe43949f1a52082 |
| 251 | 89 | 33 | 2 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | f9ecb089039b8230 |
| 252 | 90 | 33 | 2 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 421e7941c6671088 |
| 253 | 91 | 33 | 2 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 20b44fbdc52bfc23 |
| 254 | 92 | 33 | 2 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 4491083fd3780799 |
| 255 | 93 | 33 | 2 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 12246eba4c25299c |
| 256 | 94 | 33 | 2 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | ca8a945fa110386d |
| 257 | 95 | 33 | 2 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 99cd626485472a95 |
| 258 | 96 | 33 | 2 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | fdbe353c8040d83a |
| 259 | 97 | 33 | 2 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | dbe8a1f8d3881fdd |
| 260 | 98 | 33 | 2 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 3b21bb50a7c968dc |
| 261 | 99 | 33 | 2 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 6c08cf080947c1c7 |
| 262 | 100 | 33 | 2 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 51efb145b97b8eb2 |
| 263 | 101 | 33 | 2 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 1ac2158ad85d06b0 |
| 264 | 102 | 33 | 2 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | cd50390bd465fd26 |
| 265 | 103 | 33 | 2 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 83d43f2d318431e3 |
| 266 | 104 | 33 | 2 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 5a6c5d3f6b73e8c5 |
| 267 | 105 | 33 | 2 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 5e40d63477cd1c7b |
| 268 | 73 | 33 | 7 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | bb35e8263a3226fc |
| 269 | 40 | 31 | 7 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | a3ee03530c348170 |
| 270 | 40 | 32 | 7 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | c1b0b3a2a471bfa8 |
| 271 | 84 | 33 | 7 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 4076a4e321a4f355 |
| 272 | 51 | 31 | 7 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | e66b1843a7b4c5a1 |
| 273 | 51 | 32 | 7 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 03f2586facc30cde |
| 274 | 95 | 33 | 7 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 92627d2b631606bf |
| 275 | 62 | 31 | 7 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 4d1be514f38bdff6 |
| 276 | 62 | 32 | 7 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 171ff93705e186de |
| 277 | 100 | 33 | 7 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | bd74f5e278c2d59a |
| 278 | 67 | 31 | 7 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | d1725ef91f483ac6 |
| 279 | 67 | 32 | 7 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | d688dfe07e700135 |
| 280 | 101 | 33 | 7 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | b605617cb074bc9c |
| 281 | 68 | 31 | 7 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | c20dea697d18f2b0 |
| 282 | 68 | 32 | 7 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | e229023a165629c5 |
| 283 | 102 | 33 | 7 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | d68c3cb4d1c3dc72 |
| 284 | 69 | 31 | 7 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | c656497be66d29ae |
| 285 | 69 | 32 | 7 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | b22e1771f1b37b8b |
| 286 | 103 | 33 | 7 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | d43576126564c823 |
| 287 | 70 | 31 | 7 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 018b9cca974849b8 |
| 288 | 70 | 32 | 7 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | d561f36be1be2e08 |
| 289 | 104 | 33 | 7 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | ca543a95d2781b98 |
| 290 | 71 | 31 | 7 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 9d31e7546f926516 |
| 291 | 71 | 32 | 7 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 875949f3d8d9afa4 |
| 292 | 105 | 33 | 7 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 214c61b7c95f1cc5 |
| 293 | 72 | 31 | 7 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | bed3acdcbf068f6f |
| 294 | 72 | 32 | 7 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 3d29617e0c3cdbb6 |
| 295 | 74 | 33 | 7 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 7ee76dc03e74c168 |
| 296 | 41 | 31 | 7 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 93304a9105148915 |
| 297 | 41 | 32 | 7 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 2aa42f2c4328791d |
| 298 | 75 | 33 | 7 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | fa75fbee3efcd08c |
| 299 | 42 | 31 | 7 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | d87c70d1db233358 |
| 300 | 42 | 32 | 7 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 5415d7652d47f0e6 |
| 301 | 76 | 33 | 7 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 27f8fad27fb9320b |
| 302 | 43 | 31 | 7 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 83867ade7a7e16de |
| 303 | 43 | 32 | 7 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 275decf0104cc63d |
| 304 | 77 | 33 | 7 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | e2f3fe71c038d41e |
| 305 | 44 | 31 | 7 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 9ec7c22976a25e68 |
| 306 | 44 | 32 | 7 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 5f1e74ac6de8849e |
| 307 | 78 | 33 | 7 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 966275ffeec95525 |
| 308 | 45 | 31 | 7 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 69285c3f860c3896 |
| 309 | 45 | 32 | 7 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 6f06d07e443d5321 |
| 310 | 79 | 33 | 7 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 7427d472f13ff1e3 |
| 311 | 46 | 31 | 7 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 67253528c9da0088 |
| 312 | 46 | 32 | 7 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 79dc97ff5961d315 |
| 313 | 80 | 33 | 7 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | ed8f6134980c37f4 |
| 314 | 47 | 31 | 7 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 5b8a1b1eaa77de63 |
| 315 | 47 | 32 | 7 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 58c74df8c64d3532 |
| 316 | 81 | 33 | 7 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | dcd0c1bcb4b452d9 |
| 317 | 48 | 31 | 7 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | cef6f7086f071caf |
| 318 | 48 | 32 | 7 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 89d89877fc09d42e |
| 319 | 82 | 33 | 7 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 68a4d5431da95d23 |
| 320 | 49 | 31 | 7 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | a2db99da7b2f10e8 |
| 321 | 49 | 32 | 7 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | b9c98db4b5893f7b |
| 322 | 83 | 33 | 7 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | d8b6188101b94fd0 |
| 323 | 50 | 31 | 7 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | f137152e21c30e9a |
| 324 | 50 | 32 | 7 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 439394e6a8d9110a |
| 325 | 73 | 33 | 8 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 761080bb903a8aad |
| 326 | 40 | 31 | 8 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 01baccf0a77604d9 |
| 327 | 40 | 32 | 8 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | e724d888cd7e0bb5 |
| 328 | 84 | 33 | 8 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 41d3c3c43955156f |
| 329 | 51 | 31 | 8 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 7afbbc7ea8eae6a3 |
| 330 | 51 | 32 | 8 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 45d3c74e8a2cd68b |
| 331 | 95 | 33 | 8 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 1b6d47307a13386f |
| 332 | 62 | 31 | 8 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | e1a17abb8a282ee8 |
| 333 | 62 | 32 | 8 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | f0f01a76eaa1acee |
| 334 | 100 | 33 | 8 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | d65408a7fe1f3844 |
| 335 | 67 | 31 | 8 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | e5bbcd89da67d06b |
| 336 | 67 | 32 | 8 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 545928fa7b22cf6c |
| 337 | 101 | 33 | 8 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | ad47ab7cb7552236 |
| 338 | 68 | 31 | 8 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 9b570df1c7e1c1c5 |
| 339 | 68 | 32 | 8 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 0c9d05cb04c1f01e |
| 340 | 102 | 33 | 8 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 0702f5362b527277 |
| 341 | 69 | 31 | 8 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 724c2df7eef5ac67 |
| 342 | 69 | 32 | 8 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 848edc9344dc2009 |
| 343 | 103 | 33 | 8 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | ca3d26210a4ef992 |
| 344 | 70 | 31 | 8 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | ef3419faa8646d0d |
| 345 | 70 | 32 | 8 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 02f77080cc5c4ce8 |
| 346 | 104 | 33 | 8 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 25f98978d1a38bdf |
| 347 | 71 | 31 | 8 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | eb524e4bd8c5bb0e |
| 348 | 71 | 32 | 8 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | c66542e18d48476b |
| 349 | 105 | 33 | 8 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 7ddff31272ffea63 |
| 350 | 72 | 31 | 8 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 44c41d8c3d7d92a6 |
| 351 | 72 | 32 | 8 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 5e3b2966c8470f8c |
| 352 | 74 | 33 | 8 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | f83f7de28f83fc81 |
| 353 | 41 | 31 | 8 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | e6573d1c37c1c8bb |
| 354 | 41 | 32 | 8 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 79a743fd120f7c97 |
| 355 | 75 | 33 | 8 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | fb1dc351e9132552 |
| 356 | 42 | 31 | 8 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | e18e17e609bbc326 |
| 357 | 42 | 32 | 8 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 1cd43c7b9ccc4f6b |
| 358 | 76 | 33 | 8 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 424f33e652681e18 |
| 359 | 43 | 31 | 8 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | b34f0f8282ec1cb7 |
| 360 | 43 | 32 | 8 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 54461366110f9b44 |
| 361 | 77 | 33 | 8 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | c9ebb0ba9a46073b |
| 362 | 44 | 31 | 8 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 6703b4e17d4e59c8 |
| 363 | 44 | 32 | 8 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | cc6d8d6405ae47ee |
| 364 | 78 | 33 | 8 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 796ceb9cd7d84207 |
| 365 | 45 | 31 | 8 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 3cea63b6cfa0596d |
| 366 | 45 | 32 | 8 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 49c88ae5f009f739 |
| 367 | 79 | 33 | 8 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 215f6f9f283d31f7 |
| 368 | 46 | 31 | 8 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 107b7f05979f27b7 |
| 369 | 46 | 32 | 8 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 250d2c497445fb06 |
| 370 | 80 | 33 | 8 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 7451e9275d6026a1 |
| 371 | 47 | 31 | 8 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 00ff4a3d33efe842 |
| 372 | 47 | 32 | 8 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | f0c5f14051c0d77b |
| 373 | 81 | 33 | 8 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 308d296d62ea4aa6 |
| 374 | 48 | 31 | 8 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | c9f4ddfdf58a822c |
| 375 | 48 | 32 | 8 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 074f7587c4a30c70 |
| 376 | 82 | 33 | 8 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | d2c7717d406cc121 |
| 377 | 49 | 31 | 8 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | e134f2bcce802404 |
| 378 | 49 | 32 | 8 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | bcd5b2a009d7e4ce |
| 379 | 83 | 33 | 8 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | f6aecbedd75ebd1a |
| 380 | 50 | 31 | 8 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 7868175934e6f74f |
| 381 | 50 | 32 | 8 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 21fb003b68e4e1f9 |
| 382 | 73 | 33 | 9 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 4611b13f539957e3 |
| 383 | 40 | 31 | 9 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 74a74a18ccd0db6c |
| 384 | 40 | 32 | 9 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | b543b5a41bdb09d4 |
| 385 | 84 | 33 | 9 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 6f500821643c90ba |
| 386 | 51 | 31 | 9 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | de83fe34c8ace7a0 |
| 387 | 51 | 32 | 9 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | ef3e382d387c5144 |
| 388 | 95 | 33 | 9 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 7e9efd493723a2a5 |
| 389 | 62 | 31 | 9 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 2744f021e545cc41 |
| 390 | 62 | 32 | 9 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 955b850f14167fa7 |
| 391 | 100 | 33 | 9 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 0b4b1e8fabce7375 |
| 392 | 67 | 31 | 9 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 5fe962aa6eceb3f1 |
| 393 | 67 | 32 | 9 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 2528a9ac200248de |
| 394 | 101 | 33 | 9 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 4688d18ccbd3a8de |
| 395 | 68 | 31 | 9 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | c8444635a3e0c5dc |
| 396 | 68 | 32 | 9 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | ddc4c56a9511fca7 |
| 397 | 102 | 33 | 9 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 78080160231530e0 |
| 398 | 69 | 31 | 9 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 7726ab716a37ddd2 |
| 399 | 69 | 32 | 9 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 67b514483e0e3622 |
| 400 | 103 | 33 | 9 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | e0a1538ea0a4b686 |
| 401 | 70 | 31 | 9 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 0fde3730e66d63d8 |
| 402 | 70 | 32 | 9 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 825219ef9bf8892b |
| 403 | 104 | 33 | 9 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | afe13ccb63062f8c |
| 404 | 71 | 31 | 9 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 220830c60680f4a3 |
| 405 | 71 | 32 | 9 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 7ef285293726fa50 |
| 406 | 105 | 33 | 9 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | bdfc22fe1372858d |
| 407 | 72 | 31 | 9 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 814014defbfc884d |
| 408 | 72 | 32 | 9 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 4ad3a418595457ce |
| 409 | 74 | 33 | 9 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | b3c2d1bee376cb85 |
| 410 | 41 | 31 | 9 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | a5113e2acd2945c5 |
| 411 | 41 | 32 | 9 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 672196a78724230b |
| 412 | 75 | 33 | 9 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | bd0ec2865a92865a |
| 413 | 42 | 31 | 9 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | c0c41aae9064e5e7 |
| 414 | 42 | 32 | 9 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | fc6d53bfef95b986 |
| 415 | 76 | 33 | 9 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | db57d1f776c8fb8b |
| 416 | 43 | 31 | 9 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 867c491010c6a58f |
| 417 | 43 | 32 | 9 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 1400980abeb3bd8e |
| 418 | 77 | 33 | 9 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 247782c209a41b11 |
| 419 | 44 | 31 | 9 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 6b72f90b3082b9e4 |
| 420 | 44 | 32 | 9 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 808d887c56719ea7 |
| 421 | 78 | 33 | 9 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 35316ee35518d1a0 |
| 422 | 45 | 31 | 9 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 5f1252b18f4f7a23 |
| 423 | 45 | 32 | 9 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | ebafb097dbe418db |
| 424 | 79 | 33 | 9 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 4f52a76b0393925e |
| 425 | 46 | 31 | 9 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | e5252e1957b4f21f |
| 426 | 46 | 32 | 9 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 73f169ae49f26f3e |
| 427 | 80 | 33 | 9 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | ded3d7919cd136a5 |
| 428 | 47 | 31 | 9 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 0c405dc88f923bbc |
| 429 | 47 | 32 | 9 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | ce42722b8c670fec |
| 430 | 81 | 33 | 9 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 13fedbe721e0dbf4 |
| 431 | 48 | 31 | 9 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | b4c0c6c671506d1f |
| 432 | 48 | 32 | 9 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 556b67ebb19cc502 |
| 433 | 82 | 33 | 9 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | bfa00542e99c7835 |
| 434 | 49 | 31 | 9 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 7c0e713d51b68da6 |
| 435 | 49 | 32 | 9 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 987fc53d445ca816 |
| 436 | 83 | 33 | 9 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 93f2d9478e30e294 |
| 437 | 50 | 31 | 9 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | b6f205296adc8e9c |
| 438 | 50 | 32 | 9 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 515db707e6fb8d84 |
| 439 | 73 | 33 | 10 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 6a7f869570a72d49 |
| 440 | 40 | 31 | 10 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 6715d1bd84021498 |
| 441 | 40 | 32 | 10 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 09305f02863898c3 |
| 442 | 84 | 33 | 10 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 5f2c6d4dd46f0062 |
| 443 | 51 | 31 | 10 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 2ee079f7a79190dc |
| 444 | 51 | 32 | 10 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 91fa713d75d2e4fe |
| 445 | 95 | 33 | 10 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 55704d62354cbe9b |
| 446 | 62 | 31 | 10 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 8773420f98929d5f |
| 447 | 62 | 32 | 10 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 58bfa725004bd588 |
| 448 | 100 | 33 | 10 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 31b3d422543707a9 |
| 449 | 67 | 31 | 10 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | b7fc83c34883ac6b |
| 450 | 67 | 32 | 10 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 6273836e03096ce7 |
| 451 | 101 | 33 | 10 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 43347c51ae4a001a |
| 452 | 68 | 31 | 10 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 84811b34bffc7151 |
| 453 | 68 | 32 | 10 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 2f13351c5007177f |
| 454 | 102 | 33 | 10 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 2de73005a3cc1d69 |
| 455 | 69 | 31 | 10 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 76447e8a0dd141f7 |
| 456 | 69 | 32 | 10 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | c8e6fbe5fbd8c444 |
| 457 | 103 | 33 | 10 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 6e429a21ec86105a |
| 458 | 70 | 31 | 10 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | f903a7e71ebe2692 |
| 459 | 70 | 32 | 10 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 27bcc143cebfc4ac |
| 460 | 104 | 33 | 10 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | f6f031100b971fcf |
| 461 | 71 | 31 | 10 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 4ac0041f1e22d687 |
| 462 | 71 | 32 | 10 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | a8c3ef160fec607e |
| 463 | 105 | 33 | 10 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 380f6373f9637586 |
| 464 | 72 | 31 | 10 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | d7e1c32fec129651 |
| 465 | 72 | 32 | 10 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 6962f99c05a5b4a6 |
| 466 | 74 | 33 | 10 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | f20d016bd2d18633 |
| 467 | 41 | 31 | 10 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | b79a8974dc77135d |
| 468 | 41 | 32 | 10 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 68e969fadc78ea86 |
| 469 | 75 | 33 | 10 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 5d8bf5bad60fbb77 |
| 470 | 42 | 31 | 10 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 9e8e5123d7083bea |
| 471 | 42 | 32 | 10 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 931b82beeeb36015 |
| 472 | 76 | 33 | 10 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | a6d39863d4e63179 |
| 473 | 43 | 31 | 10 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | edcc447d0f0429fa |
| 474 | 43 | 32 | 10 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 4589f7c1a61b002e |
| 475 | 77 | 33 | 10 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | ee505588a176dbab |
| 476 | 44 | 31 | 10 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | b3add73b1ffa0783 |
| 477 | 44 | 32 | 10 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 002c653dc4523fcb |
| 478 | 78 | 33 | 10 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 9a7743651751d547 |
| 479 | 45 | 31 | 10 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | fe94a2fe6b3000a8 |
| 480 | 45 | 32 | 10 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 36dc08b6ec6f3167 |
| 481 | 79 | 33 | 10 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 0ff102a7d695ca49 |
| 482 | 46 | 31 | 10 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | e40f0b35debd392e |
| 483 | 46 | 32 | 10 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | c150538d5597fa86 |
| 484 | 80 | 33 | 10 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 3a769009b2fdd59b |
| 485 | 47 | 31 | 10 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 9b56d8a5780fcee6 |
| 486 | 47 | 32 | 10 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 136466fe80728b2b |
| 487 | 81 | 33 | 10 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | ca1e2faa091e39eb |
| 488 | 48 | 31 | 10 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 6f05bb2df82701ce |
| 489 | 48 | 32 | 10 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 6467653544acdb9a |
| 490 | 82 | 33 | 10 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 70e18f2651c3b223 |
| 491 | 49 | 31 | 10 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 5a482f73496e1b5a |
| 492 | 49 | 32 | 10 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 6596a2e2bc60e1a4 |
| 493 | 83 | 33 | 10 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 889cad6038cd835d |
| 494 | 50 | 31 | 10 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | bd15774cb70224bc |
| 495 | 50 | 32 | 10 | simulated | daily | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10470 | 44b81c66ec3699e0 |

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
| 1508/38 | STREAMFLOW | OBSERVED | 1974-09-01T00:00:00-07:00 -> 2023-08-31T00:00:00-07:00 | 17897 | 0.0 | 379.0 | 1.80023931385148 | 2bb6ff9484d1cac4 |
| 31/38 | STREAMFLOW | OBSERVED | 1965-03-03T00:00:00-08:00 -> 2023-08-31T00:00:00-07:00 | 21230 | 0.0 | 150.0 | 1.837653320772479 | 35477411e974d7e8 |
| 1585/38 | STREAMFLOW | OBSERVED | 1985-09-01T00:00:00-07:00 -> 2023-08-31T00:00:00-07:00 | 13879 | 0.0 | 212.0 | 1.634699257871611 | 21d19d789a0107b7 |
| 867/48 | STREAMFLOW | OBSERVED | 1970-05-05T00:00:00-07:00 -> 2015-08-31T00:00:00-07:00 | 16544 | 0.0 | 594.0 | 4.226935142649902 | 807cd0d3230c87f3 |
| 1940/48 | STREAMFLOW | OBSERVED | 1992-09-01T00:00:00-07:00 -> 2015-08-31T00:00:00-07:00 | 8400 | 0.0 | 25.4 | 1.2840675000000032 | af0c4e42f1a15ea1 |

## 14. Baseline climat

| Station | Variable | Scenario | Periode | Points | Min | Max | Moyenne | Signature |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| hammat_my_ali_cherif | TMEAN | OBSERVED | 2023-10-01T00:00:00-07:00 -> 2025-07-01T00:00:00-07:00 | 21 | 0.0 | 31.7 | 16.84285714285714 | dac4aafd2f0f93f4 |
| hammat_my_ali_cherif | TMIN | OBSERVED | 2023-10-01T00:00:00-07:00 -> 2025-07-01T00:00:00-07:00 | 20 | -5.6 | 22.4 | 6.19 | 119d335bb1497a6a |
| hammat_my_ali_cherif | WIND_SPEED | OBSERVED | 2023-11-01T00:00:00-07:00 -> 2025-08-01T00:00:00-07:00 | 22 | 1.19 | 3.33 | 1.7372727272727273 | 25da309ffaa6fc0f |
| hammat_my_ali_cherif | TMAX | OBSERVED | 2023-10-01T00:00:00-07:00 -> 2025-07-01T00:00:00-07:00 | 22 | 18.4 | 43.2 | 30.736363636363635 | 88a213a09fc25acc |
| hammat_my_ali_cherif | EVAPORATION | OBSERVED | 2023-04-01T00:00:00-07:00 -> 2025-08-01T00:00:00-07:00 | 29 | 94.6 | 553.9 | 306.8834482758621 | dfaf9fc495253769 |
| hammat_my_ali_cherif | PRECIPITATION | OBSERVED | 2023-04-01T00:00:00-07:00 -> 2025-08-31T00:00:00-07:00 | 884 | 0.0 | 52.0 | 0.5720588235294118 | c6cefa6c75fc9a50 |

## 15. Baseline sediments

| Domaine | Scenario | Time step | Entite | Lignes | Periode | Min | Max | Moyenne | Signature |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| reach_sediment | etat_actuel | daily | 1 | 10470 | 1995-01-01 -> 2023-08-31 | 0.0 | 10.62 | 0.3391988489875837 | 811fe07d395d2981 |
| reach_sediment | ssp245 | monthly | 1 | 10722 | 1995-01-01 -> 2059-12-01 | 0.0 | 10.62 | 0.36031998684014194 | 46f36ea9d420fc85 |
| solid_yield | etat_actuel | daily | 1 | 10470 | 1995-01-01 -> 2023-08-31 | 2.57e-13 | 7.31 | 0.021645722982319128 | 813e670e445ae90e |
| solid_yield | ssp245 | monthly | 1 | 10722 | 1995-01-01 -> 2059-12-01 | 0.0 | 17.738 | 0.03355462783294918 | fe726020587380f2 |
| q_to_qs_client |  |  | 5 |  | None -> None |  |  |  | 511608327c6f880c |

## 16. Baseline bathymetrie / siltation

| Bloc | Valeur |
| --- | --- |
| Campagnes bathymetrie | {'campaign_count': 6, 'min_measurement_year': 1990, 'max_measurement_year': 2022, 'min_campaign_year': 1990, 'max_campaign_year': 2022, 'min_volume_mhm3': 287.566412, 'max_volume_mhm3': 346.77905} |
| Points reservoir_bathymetry | {'point_count': 4401, 'reservoir_count': 1, 'min_level_m': 1081.0, 'max_level_m': 1125.0, 'min_volume_hm3': 0.0, 'max_volume_hm3': 331.58} |
| Tables siltation | {'indicators_count': 0, 'hsv_count': 0, 'evolution_count': 0} |
| API summary | {'url': 'http://127.0.0.1:5007/api/v1/siltation/summary', 'ok': True, 'status': 200, 'bytes': 703, 'hash': '0b8fbcd9b52eead4', 'item_count': 6, 'payload_type': 'dict', 'data_preview': None} |
| API availability | {'url': 'http://127.0.0.1:5007/api/v1/siltation/availability', 'ok': True, 'status': 200, 'bytes': 209, 'hash': 'b377345617341fb4', 'item_count': 6, 'payload_type': 'dict', 'data_preview': None} |
| API bathymetry campaigns | {'url': 'http://127.0.0.1:5007/api/v1/siltation/bathymetry-campaigns', 'ok': True, 'status': 200, 'bytes': 2942, 'hash': '96169d76bbb90651', 'item_count': 6, 'payload_type': 'dict', 'data_preview': None} |

## 17. Baseline API

| Endpoint | HTTP | Bytes | Items | Hash | Type |
| --- | --- | --- | --- | --- | --- |
| backend_root | 200 | 577 | 4 | b0ea6065df8a582f | dict |
| health | 200 | 3230 | 8 | 957f8ffc7662cdbb | dict |
| catalog_modules | 200 | 110 | 3 | 4f3ce98aaf6a3425 | list |
| catalog_runs | 200 | 3751 | 17 | 7e1e72564651a66d | list |
| catalog_climat_properties | 200 | 1171 | 7 | 4d185efb020c3696 | list |
| catalog_hydro_properties | 200 | 422 | 2 | bfd4436e03842eb9 | list |
| catalog_erosion_properties | 200 | 939 | 4 | 8052998634755a89 | list |
| catalog_climat_stations | 200 | 671 | 8 | 759a03e2f9516911 | list |
| catalog_hydro_stations | 200 | 67 | 0 | 3364fcaa1a085927 | list |
| catalog_erosion_stations | 200 | 69 | 0 | 1b8712e93074c374 | list |
| catalog_availability_climat | 200 | 11989 | 30 | 4eef512b718ac88e | list |
| catalog_availability_hydro | 200 | 23090 | 45 | 180379674b06cf2a | list |
| catalog_availability_erosion | 200 | 21938 | 40 | c1d9586363fc93ea | list |
| hydro_stations | 200 | 1167 | 5 | 012729dd157cddb6 | list |
| spatial_reaches | 200 | 1318587 | 19 | 6655b77310cec61d | FeatureCollection |
| spatial_subbasins | 200 | 3510108 | 19 | 7697a9b6222db9f4 | FeatureCollection |
| swat_summary | 200 | 232 | 7 | 734ddcc2076b55ac | dict |
| swat_availability | 200 | 160437 | 383 | 2328b481603c51e5 | list |
| solid_yield_subbasins | 200 | 3682 | 19 | 5c2f55d932bcd4df | list |
| solid_yield_availability | 200 | 65495 | 152 | b5b2cdaf37c6eb63 | list |
| siltation_summary | 200 | 703 | 6 | 0b8fbcd9b52eead4 | dict |
| siltation_availability | 200 | 209 | 6 | b377345617341fb4 | dict |
| siltation_bathymetry_campaigns | 200 | 2942 | 6 | 96169d76bbb90651 | dict |
| data_scan_summary | 200 | 441 | 13 | db0099b5e26bcb74 | dict |
| data_scan_periods_global | 200 | 12812 | 5 | 55631283718d18b7 | dict |
| frontend_root | 200 | 1902 | 0 | 5616dd046190bf4f |  |

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

- Baseline JSON : `D:\3- Projets\App_Hassan_Addakhil\Support_Doc_HD\Phase Protection Donnees Fonctionnelles\PROTECTED_FUNCTIONAL_DATA_BASELINE_20260810_1608.json`
- Script de comparaison : `D:\3- Projets\App_Hassan_Addakhil\scripts\quality\compare-functional-baseline.py`

## 20. Limites

- Baseline prise en lecture seule a partir de l'etat courant du backend, du frontend et de la base officielle.
- Le rapport conserve les signatures de protection, pas les mesures detaillees ligne par ligne.
- Toute correction future devra etre comparee a cette baseline avant validation.

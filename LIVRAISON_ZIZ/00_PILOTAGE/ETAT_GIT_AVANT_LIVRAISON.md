# ETAT GIT AVANT LIVRAISON ZIZ

Date de reference : 2026-08-27

Mode d'execution : lecture seule

## 1. Referentiel

- Chemin du depot : `D:/3- Projets/App_Hassan_Addakhil`
- Branche active : `ilh_dev_20-07`
- HEAD : `ef62eae98af1c9991ee2287b969cf53f2051db88`
- Dernier commit : `ef62eae98af1c9991ee2287b969cf53f2051db88`
- Date du dernier commit : `2026-08-13T09:29:44Z`
- Message du dernier commit : `chore: finalise stabilisation et securisation Hassan Addakhil`
- Tags sur HEAD : aucun
- Avance sur la branche distante : la branche locale est en avance de `1` commit sur `origin/ilh_dev_20-07`
- Git LFS : des marqueurs `filter=lfs diff=lfs merge=lfs` sont presents dans `.gitattributes` sur :
  - `hydro_Hassan dakhil/backend/sql/*.sql`
  - `hydro_Hassan dakhil/backend/scripts/fix_hassan_addakhil_campaigns.sql`
- Verification `git lfs ls-files` : commande en echec dans l'environnement courant avec erreur `sh.exe: fatal error - couldn't create signal pipe, Win32 error 5`
- Sous-modules : aucun sous-module detecte
- Fichier `.gitmodules` : absent

## 2. Remote Git

Remotes configures, sans credentials divulgues :

```text
origin  https://github.com/testc4e-eng/App_Hassan_Eddakhil.git (fetch)
origin  https://github.com/testc4e-eng/App_Hassan_Eddakhil.git (push)
```

## 3. Etat du working tree

### Modifications non indexees

Nombre detecte : `80`

```text
.env.example
.gitattributes
.gitignore
Support_Doc_HD/RAPPORT_PREPARATION_LIVRAISON_GIT_HASSAN_ADDAKHIL_20260813.md
docker-compose.yml
hydro_Hassan dakhil/backend/.env.example
hydro_Hassan dakhil/backend/Dockerfile
hydro_Hassan dakhil/backend/scripts/diagnose.js
hydro_Hassan dakhil/backend/scripts/seed-users.js
hydro_Hassan dakhil/backend/server.ts
hydro_Hassan dakhil/backend/src/app.ts
hydro_Hassan dakhil/backend/src/config/database.config.ts
hydro_Hassan dakhil/backend/src/config/env.ts
hydro_Hassan dakhil/backend/src/constants/swatScenarios.ts
hydro_Hassan dakhil/backend/src/controllers/hydroController.ts
hydro_Hassan dakhil/backend/src/controllers/siltation.controller.ts
hydro_Hassan dakhil/backend/src/controllers/spatialController.ts
hydro_Hassan dakhil/backend/src/controllers/stationSimulationController.ts
hydro_Hassan dakhil/backend/src/controllers/timeseriesController.ts
hydro_Hassan dakhil/backend/src/routes/catalogAvailability.ts
hydro_Hassan dakhil/backend/src/routes/solidYieldRoutes.ts
hydro_Hassan dakhil/backend/src/routes/spatialRoutes.ts
hydro_Hassan dakhil/backend/src/routes/swatRoutes.ts
hydro_Hassan dakhil/backend/src/routes/timeseriesRoutes.ts
hydro_Hassan dakhil/backend/src/services/access.service.ts
hydro_Hassan dakhil/backend/src/services/adminDbConfig.service.ts
hydro_Hassan dakhil/backend/src/services/advancedSpatial.service.ts
hydro_Hassan dakhil/backend/src/services/catalog.service.ts
hydro_Hassan dakhil/backend/src/services/database.service.ts
hydro_Hassan dakhil/backend/src/services/erosionSwatSeries.service.ts
hydro_Hassan dakhil/backend/src/services/hydro.service.ts
hydro_Hassan dakhil/backend/src/services/hydroSwatSeries.service.ts
hydro_Hassan dakhil/backend/src/services/maps.service.ts
hydro_Hassan dakhil/backend/src/services/solidYield.service.ts
hydro_Hassan dakhil/backend/src/services/spatial.service.ts
hydro_Hassan dakhil/backend/src/services/stationSimulation.service.ts
hydro_Hassan dakhil/backend/src/services/swatIngestion.service.ts
hydro_Hassan dakhil/backend/src/services/timeseries.service.ts
hydro_Hassan dakhil/backend/tests/http/app.test.ts
hydro_Hassan dakhil/frontend/Dockerfile
hydro_Hassan dakhil/frontend/nginx.conf
hydro_Hassan dakhil/frontend/src/App.tsx
hydro_Hassan dakhil/frontend/src/api/hydro.ts
hydro_Hassan dakhil/frontend/src/api/spatial.ts
hydro_Hassan dakhil/frontend/src/api/timeseries.ts
hydro_Hassan dakhil/frontend/src/components/charts/MultiScenarioTimeSeriesChart.tsx
hydro_Hassan dakhil/frontend/src/components/charts/TimeSeriesChart.tsx
hydro_Hassan dakhil/frontend/src/components/dashboard/DashboardSidebar.tsx
hydro_Hassan dakhil/frontend/src/components/dashboard/DashboardSidebarV2.tsx
hydro_Hassan dakhil/frontend/src/components/dashboard/FilterBar.tsx
hydro_Hassan dakhil/frontend/src/components/dashboard/analytics/AnalyticsStatsRow.tsx
hydro_Hassan dakhil/frontend/src/components/dashboard/modules/BathymetryRecap.tsx
hydro_Hassan dakhil/frontend/src/components/dashboard/modules/DataManagementModule.tsx
hydro_Hassan dakhil/frontend/src/components/dashboard/modules/RecapitulatifEnvasement.tsx
hydro_Hassan dakhil/frontend/src/components/dashboard/modules/ReportsModule.tsx
hydro_Hassan dakhil/frontend/src/components/dashboard/modules/SolidYieldModuleV2.tsx
hydro_Hassan dakhil/frontend/src/components/dashboard/modules/SpatialInspectorPanel.tsx
hydro_Hassan dakhil/frontend/src/components/dashboard/modules/SpatialModule.tsx
hydro_Hassan dakhil/frontend/src/components/dashboard/modules/StationSimulationComparison.tsx
hydro_Hassan dakhil/frontend/src/components/dashboard/modules/data-management/SwatIngestionPage.tsx
hydro_Hassan dakhil/frontend/src/components/dashboard/modules/sediments/ReachSedimentDashboard.tsx
hydro_Hassan dakhil/frontend/src/components/dashboard/modules/sediments/sedimentFlowEstimation.ts
hydro_Hassan dakhil/frontend/src/components/map/HydroMap.tsx
hydro_Hassan dakhil/frontend/src/components/map/ThematicLegend.tsx
hydro_Hassan dakhil/frontend/src/components/map/ThematicReachLayer.tsx
hydro_Hassan dakhil/frontend/src/components/map/ThematicSubbasinLayer.tsx
hydro_Hassan dakhil/frontend/src/components/tables/DataTable.tsx
hydro_Hassan dakhil/frontend/src/constants/swatScenarios.ts
hydro_Hassan dakhil/frontend/src/data/reportAssets.ts
hydro_Hassan dakhil/frontend/src/i18n/en.json
hydro_Hassan dakhil/frontend/src/i18n/fr.json
hydro_Hassan dakhil/frontend/src/lib/thematicColors.ts
hydro_Hassan dakhil/frontend/src/pages/Dashboard.tsx
hydro_Hassan dakhil/frontend/src/pages/admin/DatabaseConfigPage.tsx
hydro_Hassan dakhil/frontend/src/services/swatDataService.ts
hydro_Hassan dakhil/scripts/analyze_database.py
scripts/swat-import/analyze_mdb.ps1
scripts/swat-import/import_etat_actuel_bundle.ps1
scripts/swat-import/import_swat_output.ps1
scripts/swat-import/mapping.config.json
```

### Modifications indexees

Nombre detecte : `0`

`git diff --cached --name-status` est vide.

### Suppressions

Nombre detecte : `116`

```text
AUDIT_GOUVERNANCE_DONNEES/00_index.md
AUDIT_GOUVERNANCE_DONNEES/16_audit_scenarios_swat_ingestion.md
AUDIT_GOUVERNANCE_DONNEES/17_rapport_final_post_ingestion_reboisement.md
AUDIT_GOUVERNANCE_DONNEES/DEMO_0607_FINAL_UX_FIXES.md
AUDIT_GOUVERNANCE_DONNEES/DEMO_0607_NOTES.md
AUDIT_GOUVERNANCE_DONNEES/EXECUTION_REPORT.md
AUDIT_GOUVERNANCE_DONNEES/dashboard_reboisement_buffer_zone.png
AUDIT_GOUVERNANCE_DONNEES/db_rch_summary.csv
AUDIT_GOUVERNANCE_DONNEES/db_sub_summary.csv
AUDIT_GOUVERNANCE_DONNEES/demo_dashboard_data_management.png
AUDIT_GOUVERNANCE_DONNEES/demo_dashboard_hydraulic.png
AUDIT_GOUVERNANCE_DONNEES/demo_dashboard_initial.png
AUDIT_GOUVERNANCE_DONNEES/demo_dashboard_reports.png
AUDIT_GOUVERNANCE_DONNEES/demo_dashboard_sediment.png
AUDIT_GOUVERNANCE_DONNEES/demo_home_page.png
AUDIT_GOUVERNANCE_DONNEES/screenshots/after_fix_19_entities.png
AUDIT_GOUVERNANCE_DONNEES/screenshots/final_dashboard_19_entities.png
AUDIT_GOUVERNANCE_DONNEES/screenshots/thematic_map_test.png
AUDIT_GOUVERNANCE_DONNEES/sql/fix_station_barrage_hassan_addakhil_0607.sql
AUDIT_GOUVERNANCE_DONNEES/sql_proposed/10_archive_swat_output.sql
AUDIT_GOUVERNANCE_DONNEES/sql_proposed/11_replace_geometry_19.sql
AUDIT_GOUVERNANCE_DONNEES/sql_proposed/12_refresh_api_catalogs.sql
AUDIT_GOUVERNANCE_DONNEES/sql_proposed/13_fix_swat_entity_map.sql
AUDIT_GOUVERNANCE_DONNEES/sql_proposed/14_regenerate_station_maps.sql
AUDIT_GOUVERNANCE_DONNEES/sql_proposed/20_create_performance_indexes.sql
AUDIT_GOUVERNANCE_DONNEES/swat_output_mdb_audit.csv
AUDIT_GOUVERNANCE_DONNEES/swat_output_mdb_audit_fixed.csv
RAPPORT_FINAL_NETTOYAGE_SECURITE_STABILISATION_HASSAN_ADDAKHIL_20260812_1610.md
README.md
STABILIZATION_REPORT_ILH_0107.md
audit_mdb_metadata.ps1
fast_export_table.ps1
fast_ingest_scenarios.py
hydro_Hassan dakhil/backend/src/controllers/catalogRoutes.ts
hydro_Hassan dakhil/backend/src/middleware/validateRequest.ts
hydro_Hassan dakhil/backend/src/models/hydro.models.ts
hydro_Hassan dakhil/backend/src/models/spatial.models.ts
hydro_Hassan dakhil/backend/src/routes/index.ts
hydro_Hassan dakhil/backend/src/utils/logger.ts
hydro_Hassan dakhil/backend/src/utils/queryBuilder.ts
hydro_Hassan dakhil/frontend/src/components/NavLink.tsx
hydro_Hassan dakhil/frontend/src/components/TestAPI.tsx
hydro_Hassan dakhil/frontend/src/components/TestConnection.tsx
hydro_Hassan dakhil/frontend/src/components/access/AccessDashboard.tsx
hydro_Hassan dakhil/frontend/src/components/admin/AdminSidebar.tsx
hydro_Hassan dakhil/frontend/src/components/dashboard/modules/ErosionSedimentsModule.tsx
hydro_Hassan dakhil/frontend/src/components/dashboard/modules/ErosionSedimentsModuleV2.tsx
hydro_Hassan dakhil/frontend/src/components/dashboard/modules/ErosionSedimentsModuleV3.tsx
hydro_Hassan dakhil/frontend/src/components/dashboard/modules/SimulatedDataModule.tsx
hydro_Hassan dakhil/frontend/src/components/dashboard/modules/SimulatedDataModuleV2.tsx
hydro_Hassan dakhil/frontend/src/components/dashboard/modules/SolidYieldModule.tsx
hydro_Hassan dakhil/frontend/src/components/dashboard/modules/reports/ReportStepIndicator.tsx
hydro_Hassan dakhil/frontend/src/components/layout/Header.tsx
hydro_Hassan dakhil/frontend/src/components/layout/ModuleSidebar.tsx
hydro_Hassan dakhil/frontend/src/components/ui/use-toast.ts
hydro_Hassan dakhil/frontend/src/constants/siltationCampaigns.ts
hydro_Hassan dakhil/frontend/src/constants/specificDegradationThematicMaps.ts
hydro_Hassan dakhil/frontend/src/lib/spatialTimeseriesCache.ts
hydro_Hassan dakhil/frontend/src/pages/AccessDashboardPage.tsx
hydro_Hassan dakhil/frontend/src/services/accessApi.ts
ingest_scenario_daily.ps1
scripts/MIGRATION_ABHGZR_TO_HYDRO_HD/00_inventory/README.md
scripts/MIGRATION_ABHGZR_TO_HYDRO_HD/00_inventory/geometry_quality_source.json
scripts/MIGRATION_ABHGZR_TO_HYDRO_HD/00_inventory/geometry_quality_target.json
scripts/MIGRATION_ABHGZR_TO_HYDRO_HD/00_inventory/source_inventory.json
scripts/MIGRATION_ABHGZR_TO_HYDRO_HD/00_inventory/source_key_columns.json
scripts/MIGRATION_ABHGZR_TO_HYDRO_HD/00_inventory/target_inventory.json
scripts/MIGRATION_ABHGZR_TO_HYDRO_HD/00_inventory/target_key_columns.json
scripts/MIGRATION_ABHGZR_TO_HYDRO_HD/01_inspection_sql/01_inventory.sql
scripts/MIGRATION_ABHGZR_TO_HYDRO_HD/01_inspection_sql/02_columns_pk_fk_indexes.sql
scripts/MIGRATION_ABHGZR_TO_HYDRO_HD/01_inspection_sql/03_geometry_srid_quality.sql
scripts/MIGRATION_ABHGZR_TO_HYDRO_HD/01_inspection_sql/04_view_dependencies.sql
scripts/MIGRATION_ABHGZR_TO_HYDRO_HD/01_inspection_sql/05_usage_probe_target.sql
scripts/MIGRATION_ABHGZR_TO_HYDRO_HD/01_inspection_sql/06_semantic_columns.sql
scripts/MIGRATION_ABHGZR_TO_HYDRO_HD/02_mapping/mapping_source_to_target.csv
scripts/MIGRATION_ABHGZR_TO_HYDRO_HD/03_staging_sql/01_create_staging_tables.sql
scripts/MIGRATION_ABHGZR_TO_HYDRO_HD/03_staging_sql/02_normalize_staging.sql
scripts/MIGRATION_ABHGZR_TO_HYDRO_HD/04_etl_python/README.md
scripts/MIGRATION_ABHGZR_TO_HYDRO_HD/04_etl_python/etl_migrate_abhgzr.py
scripts/MIGRATION_ABHGZR_TO_HYDRO_HD/04_etl_python/requirements.txt
scripts/MIGRATION_ABHGZR_TO_HYDRO_HD/05_load_sql/01_load_ref_communes.sql
scripts/MIGRATION_ABHGZR_TO_HYDRO_HD/05_load_sql/02_load_core_entities.sql
scripts/MIGRATION_ABHGZR_TO_HYDRO_HD/05_load_sql/03_load_ref_properties_model_run.sql
scripts/MIGRATION_ABHGZR_TO_HYDRO_HD/05_load_sql/04_load_core_timeseries_measurements.sql
scripts/MIGRATION_ABHGZR_TO_HYDRO_HD/05_load_sql/05_load_core_bathymetry.sql
scripts/MIGRATION_ABHGZR_TO_HYDRO_HD/05_load_sql/06_refresh_public_value_views.sql
scripts/MIGRATION_ABHGZR_TO_HYDRO_HD/05_load_sql/07_seed_module_properties.sql
scripts/MIGRATION_ABHGZR_TO_HYDRO_HD/05_load_sql/README.md
scripts/MIGRATION_ABHGZR_TO_HYDRO_HD/06_quality_checks/01_preload_checks.sql
scripts/MIGRATION_ABHGZR_TO_HYDRO_HD/06_quality_checks/02_postload_checks.sql
scripts/MIGRATION_ABHGZR_TO_HYDRO_HD/06_quality_checks/03_reconciliation_checks.sql
scripts/MIGRATION_ABHGZR_TO_HYDRO_HD/07_reports/COMPARAISON_BDD_SOURCE_CIBLE.md
scripts/MIGRATION_ABHGZR_TO_HYDRO_HD/07_reports/MAPPING_SOURCE_TO_TARGET.md
scripts/MIGRATION_ABHGZR_TO_HYDRO_HD/07_reports/PLAN_MIGRATION.md
scripts/MIGRATION_ABHGZR_TO_HYDRO_HD/07_reports/RAPPORT_INSPECTION_CIBLE.md
scripts/MIGRATION_ABHGZR_TO_HYDRO_HD/07_reports/RAPPORT_INSPECTION_SOURCE.md
scripts/MIGRATION_ABHGZR_TO_HYDRO_HD/07_reports/RISQUES_ET_GARDE_FOUS.md
scripts/MIGRATION_ABHGZR_TO_HYDRO_HD/08_safe_run/commit_run.ps1
scripts/MIGRATION_ABHGZR_TO_HYDRO_HD/08_safe_run/dry_run.ps1
scripts/MIGRATION_ABHGZR_TO_HYDRO_HD/08_safe_run/run_full_migration.ps1
scripts/MIGRATION_ABHGZR_TO_HYDRO_HD/08_safe_run/runbook.md
scripts/MIGRATION_ABHGZR_TO_HYDRO_HD/README.md
scripts/MIGRATION_SWAT_TO_HYDRO_HD/01_sql/01_create_swat_infra.sql
scripts/MIGRATION_SWAT_TO_HYDRO_HD/01_sql/02_quality_checks.sql
scripts/MIGRATION_SWAT_TO_HYDRO_HD/02_python/swat_etl_pipeline.py
scripts/MIGRATION_SWAT_TO_HYDRO_HD/03_docs/MAPPING_SWAT_TO_HYDRO.md
scripts/MIGRATION_SWAT_TO_HYDRO_HD/README.md
scripts/access-import/README.md
scripts/access-import/analyze_access.ps1
scripts/access-import/import_access.ps1
scripts/access-import/mapping.config.json
scripts/generate-project-documentation.cjs
scripts/generate_db_diagnostic.cjs
sync_core_manual.py
sync_core_scenarios.sql
test_fast_export.py
```

### Nouveaux fichiers non suivis

Nombre detecte : `212`

Presence constatee dans les zones suivantes :

- `.editorconfig`
- `LIVRAISON_ZIZ/...`
- `Support_Doc_HD/...`
- `archive/...`
- `hydro_Hassan dakhil/backend/...`
- `hydro_Hassan dakhil/frontend/...`
- `scripts/quality/...`

Liste representative et structurante des non suivis constates :

```text
.editorconfig
LIVRAISON_ZIZ/00_PILOTAGE/CHECKLIST_LIVRAISON.md
LIVRAISON_ZIZ/00_PILOTAGE/README_LIVRAISON.md
LIVRAISON_ZIZ/00_PILOTAGE/VERSION.txt
LIVRAISON_ZIZ/01_AUDIT/AUDIT_STRUCTURE_PROJET.md
LIVRAISON_ZIZ/09_INVENTAIRE/INVENTAIRE_FICHIERS.md
Support_Doc_HD/Audit Chemins/RAPPORT_AUDIT_CHEMINS_HASSAN_ADDAKHIL_20260827.md
Support_Doc_HD/Phase Audit Qualit\303\251 du code/AUDIT_QUALITE_CODE_HASSAN_ADDAKHIL.md
Support_Doc_HD/Phase Audit Qualit\303\251 du code/RAPPORT_Q0_GARDE_FOUS_QUALITE_HASSAN_ADDAKHIL_20260810_1030.md
Support_Doc_HD/Phase Audit Securite/AUDIT_PASSI_01_ARCHITECTURE_SECURITE_HASSAN_ADDAKHIL.md
Support_Doc_HD/Phase Audit Securite/AUDIT_PASSI_02_CONFIGURATION_HARDENING_HASSAN_ADDAKHIL.md
Support_Doc_HD/Phase Audit Securite/AUDIT_PASSI_03_CODE_SOURCE_OWASP_HASSAN_ADDAKHIL.md
Support_Doc_HD/Phase Audit Securite/AUDIT_SECURITE_FICHIERS_HASSAN_ADDAKHIL.md
Support_Doc_HD/Phase Audit Securite/BASELINE_SECURITE_CURRENT_20260826_01.json
Support_Doc_HD/Phase Audit Securite/BASELINE_SECURITE_CURRENT_20260826_01.md
Support_Doc_HD/Phase Audit Securite/MATRICE_RISQUES_SECURITE_PASSI_HASSAN_ADDAKHIL.md
Support_Doc_HD/Phase Audit Securite/RAPPORT_APPLICATION_CORRECTIONS_SECURITE_HASSAN_ADDAKHIL.md
Support_Doc_HD/Phase Audit Securite/RAPPORT_FINAL_SECURITE_PASSI_HASSAN_ADDAKHIL.md
Support_Doc_HD/Phase Audit Securite/RAPPORT_TESTS_SECURITE_HASSAN_ADDAKHIL.md
Support_Doc_HD/Phase Audit Securite/RAPPORT_VALIDATION_FINALE_SECURITE_HASSAN_ADDAKHIL_20260826.md
Support_Doc_HD/Phase Audit Securite/SEC_FINAL_BASELINE_20260826.json
Support_Doc_HD/Phase Audit Securite/SEC_FINAL_BASELINE_20260826.md
Support_Doc_HD/Phase Audit de la BD/ARCHITECTURE_DONNEES_SWAT_CORE_ACCESS.md
Support_Doc_HD/Phase Audit de la BD/AUDIT DES DONN\303\211ES M\303\211TIER/AUDIT_DONNEES_METIER_HASSAN_ADDAKHIL_20260810_1306.md
Support_Doc_HD/Phase Audit de la BD/AUDIT DES DONN\303\211ES M\303\211TIER/AUDIT_DONNEES_METIER_HASSAN_ADDAKHIL_20260810_1311.md
Support_Doc_HD/Phase Audit de la BD/AUDIT DES DONN\303\211ES M\303\211TIER/AUDIT_DONNEES_METIER_HASSAN_ADDAKHIL_20260810_1318.md
Support_Doc_HD/Phase Audit de la BD/AUDIT DES DONN\303\211ES M\303\211TIER/PLAN_CORRECTION_DONNEES_METIER_HASSAN_ADDAKHIL.md
Support_Doc_HD/Phase Audit de la BD/AUDIT_BASE_DONNEES_HYDRO_HD_20260810_1148.md
Support_Doc_HD/Phase Audit de la BD/AUDIT_DQ4_STATIONS_GEOMETRIES_HASSAN_ADDAKHIL_20260810_1415.md
Support_Doc_HD/Phase Audit de la BD/AUDIT_DQ5_REACHES_SUBBASINS_MAPPING_SWAT_HASSAN_ADDAKHIL_20260810_1518.md
Support_Doc_HD/Phase Audit de la BD/AUDIT_DQ6_TIMESERIES_HASSAN_ADDAKHIL_20260810_1705.md
Support_Doc_HD/Phase Audit de la BD/AUDIT_FINAL_NETTOYAGE_STRUCTUREL_HYDRO_HD_20260811_1104.md
Support_Doc_HD/Phase Audit de la BD/PLAN_CORRECTION_DQ6_TIMESERIES_HASSAN_ADDAKHIL.md
Support_Doc_HD/Phase Audit de la BD/RAPPORT_DQ1_DQ2_BASELINE_SCENARIOS_SWAT_20260810_1401.md
Support_Doc_HD/Phase Audit de la BD/RAPPORT_DQ6A_CATALOGUE_SCENARIOS_HASSAN_ADDAKHIL_20260811_0926.md
Support_Doc_HD/Phase Audit de la BD/RAPPORT_DQ6B_CORE_ACCESS_PROPRIETES_DYNAMIQUES_HASSAN_ADDAKHIL_20260811_1037.md
Support_Doc_HD/Phase Audit de la BD/RAPPORT_NETTOYAGE_DB_LOT1_HYDRO_HD_20260811_1237.md
Support_Doc_HD/Phase Audit de la BD/RAPPORT_NETTOYAGE_DB_LOT2A_NV_STREAM_HYDRO_HD_20260811_1255.md
Support_Doc_HD/Phase Audit de la BD/RAPPORT_NETTOYAGE_DB_LOT2B_LEGACY_HYDRO_HD_20260812_1325.md
Support_Doc_HD/Phase Audit de la BD/RAPPORT_NETTOYAGE_DB_LOT3A_VUES_API_HYDRO_HD_20260812_1412.md
Support_Doc_HD/Phase Audit de la BD/RAPPORT_RETABLISSEMENT_BACKEND_5007_20260811_1139.md
Support_Doc_HD/Phase Audit de la BD/VALIDATION_LOT2_ARCHIVES_BACKUPS_HYDRO_HD.md
Support_Doc_HD/Phase Audit de la BD/VALIDATION_LOT3_VUES_MATVIEWS_HYDRO_HD_20260812_1248.md
Support_Doc_HD/Phase Audit de la BD/VALIDATION_MANUELLE_OBJETS_LEGACY_LOT2_HYDRO_HD.md
Support_Doc_HD/Phase Nettoyage des Warnings et Erreurs/RAPPORT_Q0_WARNINGS_ERREURS_HASSAN_ADDAKHIL_20260810_1117.md
Support_Doc_HD/Phase Nettoyage et Stabilisation/BASELINE_DEBUG_5007_20260811_1133.json
Support_Doc_HD/Phase Nettoyage et Stabilisation/BASELINE_RESTORE_BACKEND_5007_20260811_1133.json
Support_Doc_HD/Phase Nettoyage et Stabilisation/BASELINE_RESTORE_BACKEND_5007_20260811_1133.md
Support_Doc_HD/Phase Nettoyage et Stabilisation/LOT1_POSTCHECK_BASELINE_20260811_1147.json
Support_Doc_HD/Phase Nettoyage et Stabilisation/LOT1_POSTCHECK_BASELINE_20260811_1147.md
Support_Doc_HD/Phase Nettoyage et Stabilisation/LOT1_PRECHECK_BASELINE_20260811_1143.json
Support_Doc_HD/Phase Nettoyage et Stabilisation/LOT2A_POSTCHECK_BASELINE_20260811_1255.json
Support_Doc_HD/Phase Nettoyage et Stabilisation/LOT2A_POSTCHECK_BASELINE_20260811_1255.md
Support_Doc_HD/Phase Nettoyage et Stabilisation/LOT2A_PRECHECK_BASELINE_20260811_1254.json
Support_Doc_HD/Phase Nettoyage et Stabilisation/LOT2_POSTCHECK_BASELINE_20260811_1249.json
Support_Doc_HD/Phase Nettoyage et Stabilisation/LOT2_POSTCHECK_BASELINE_20260811_1249.md
Support_Doc_HD/Phase Nettoyage et Stabilisation/LOT2_PRECHECK_BASELINE_20260811_1240.json
Support_Doc_HD/Phase Nettoyage et Stabilisation/RAPPORT_NETTOYAGE_FINAL_HASSAN_ADDAKHIL_20260810_0952.md
Support_Doc_HD/Phase Nettoyage et Stabilisation/VALIDATION_LOT1_NETTOYAGE_HYDRO_HD.md
Support_Doc_HD/Phase Performance/AUDIT_ENV_CREDENTIALS_HASSAN_ADDAKHIL_20260826.md
Support_Doc_HD/Phase Performance/AUDIT_PERFORMANCE_API_DASHBOARDS_HASSAN_ADDAKHIL_20260826.md
Support_Doc_HD/Phase Performance/BASELINE_CLOTURE_20260826_POST.json
Support_Doc_HD/Phase Performance/BASELINE_CLOTURE_20260826_POST.md
Support_Doc_HD/Phase Performance/BASELINE_CONFIG_SEC_20260826_POST.json
Support_Doc_HD/Phase Performance/BASELINE_CONFIG_SEC_20260826_POST.md
Support_Doc_HD/Phase Performance/BASELINE_CONFIG_SEC_20260826_PRE.json
Support_Doc_HD/Phase Performance/BASELINE_CONFIG_SEC_20260826_PRE.md
Support_Doc_HD/Phase Performance/BASELINE_PERFORMANCE_APRES_VALIDATION_20260826_02.md
Support_Doc_HD/Phase Performance/BASELINE_PERFORMANCE_AVANT_OPTIMISATION_20260826_01.md
Support_Doc_HD/Phase Performance/BASELINE_PERFORMANCE_SNAPSHOT_20260826_01.json
Support_Doc_HD/Phase Performance/BASELINE_PERFORMANCE_SNAPSHOT_20260826_02.json
Support_Doc_HD/Phase Performance/RAPPORT_CLOTURE_PERFORMANCE_CREDENTIALS_WARMUP_HASSAN_ADDAKHIL_20260826.md
Support_Doc_HD/Phase Performance/RAPPORT_FINAL_CONFIG_SEC_PERFORMANCE_HASSAN_ADDAKHIL_20260826.md
Support_Doc_HD/Phase Performance/RAPPORT_FINAL_PERFORMANCE_HASSAN_ADDAKHIL_20260826.md
Support_Doc_HD/Phase Performance/RAPPORT_SECURISATION_ENV_CREDENTIALS_HASSAN_ADDAKHIL_20260826.md
Support_Doc_HD/Phase Performance/RAPPORT_STABILISATION_WARMUP_HASSAN_ADDAKHIL_20260826.md
Support_Doc_HD/Phase Protection Donnees Fonctionnelles/BASELINE_SECURITE_20260826_01.json
Support_Doc_HD/Phase Protection Donnees Fonctionnelles/BASELINE_SECURITE_20260826_01.md
Support_Doc_HD/Phase Protection Donnees Fonctionnelles/PROTECTED_FUNCTIONAL_DATA_BASELINE_20260810_1608.json
Support_Doc_HD/Phase Protection Donnees Fonctionnelles/RAPPORT_PROTECTION_DONNEES_FONCTIONNELLES_HASSAN_ADDAKHIL_20260810_1608.md
Support_Doc_HD/Phase Protection Donnees Fonctionnelles/VALIDATION_LOT1_BASELINE_REPORT_20260811.md
Support_Doc_HD/Phase Protection Donnees Fonctionnelles/VALIDATION_LOT1_BASELINE_SNAPSHOT_20260811.json
Support_Doc_HD/Phase S\303\251curit\303\251/BASELINE_AVANT_AUDIT_SECURITE.md
Support_Doc_HD/Phase Tests Minimal/RAPPORT_Q0_TESTS_MINIMAUX_HASSAN_ADDAKHIL_20260810_1050.md
Support_Doc_HD/Phase Validation Final/LOT3_VIEWS_MATVIEWS_INVENTORY.tsv
Support_Doc_HD/Phase Validation Final/LOT3_VIEWS_MATVIEWS_INVENTORY_PRINT.txt
Support_Doc_HD/Phase Validation Final/LOT3_VIEWS_MATVIEWS_INVENTORY_RAW.json
Support_Doc_HD/Phase Validation Final/VALIDATION_FINALE_LOT2B_OBJETS_LEGACY_HYDRO_HD_20260812_1156.md
Support_Doc_HD/RAPPORT_FINAL_NETTOYAGE_SECURITE_STABILISATION_HASSAN_ADDAKHIL_20260812_1610.md
Support_Doc_HD/RAPPORT_GLOBAL_CLOTURE_STABILISATION_SECURISATION_HASSAN_ADDAKHIL_20260813.md
Support_Doc_HD/Rapport & Support/Architecture_Base_de_Donnees_Hydro_Data_Intelligence.docx
Support_Doc_HD/Rapport & Support/Dictionnaire de Donnees - Hydro-Data Intelligence.docx
Support_Doc_HD/Rapport & Support/Guide d'utilisation de la plateforme Hydro-Data Intelligence.docx
Support_Doc_HD/Rapport & Support/Rapport_provisoire_Mission_IV_SAD.docx
Support_Doc_HD/Rapport & Support/Support de formation-Hydro-Data Inelligence.docx
Support_Doc_HD/VALIDATION_LOT3B_PUBLIC_STATS_VALUES_HYDRO_HD_20260812_1448.md
archive/fast_export_table.ps1
archive/fast_ingest_scenarios.py
archive/scripts/MIGRATION_ABHGZR_TO_HYDRO_HD/00_inventory/README.md
archive/scripts/MIGRATION_ABHGZR_TO_HYDRO_HD/00_inventory/geometry_quality_source.json
archive/scripts/MIGRATION_ABHGZR_TO_HYDRO_HD/00_inventory/geometry_quality_target.json
archive/scripts/MIGRATION_ABHGZR_TO_HYDRO_HD/00_inventory/source_inventory.json
archive/scripts/MIGRATION_ABHGZR_TO_HYDRO_HD/00_inventory/source_key_columns.json
archive/scripts/MIGRATION_ABHGZR_TO_HYDRO_HD/00_inventory/target_inventory.json
archive/scripts/MIGRATION_ABHGZR_TO_HYDRO_HD/00_inventory/target_key_columns.json
archive/scripts/MIGRATION_ABHGZR_TO_HYDRO_HD/01_inspection_sql/01_inventory.sql
archive/scripts/MIGRATION_ABHGZR_TO_HYDRO_HD/01_inspection_sql/02_columns_pk_fk_indexes.sql
archive/scripts/MIGRATION_ABHGZR_TO_HYDRO_HD/01_inspection_sql/03_geometry_srid_quality.sql
archive/scripts/MIGRATION_ABHGZR_TO_HYDRO_HD/01_inspection_sql/04_view_dependencies.sql
archive/scripts/MIGRATION_ABHGZR_TO_HYDRO_HD/01_inspection_sql/05_usage_probe_target.sql
archive/scripts/MIGRATION_ABHGZR_TO_HYDRO_HD/01_inspection_sql/06_semantic_columns.sql
archive/scripts/MIGRATION_ABHGZR_TO_HYDRO_HD/02_mapping/mapping_source_to_target.csv
archive/scripts/MIGRATION_ABHGZR_TO_HYDRO_HD/03_staging_sql/01_create_staging_tables.sql
archive/scripts/MIGRATION_ABHGZR_TO_HYDRO_HD/03_staging_sql/02_normalize_staging.sql
archive/scripts/MIGRATION_ABHGZR_TO_HYDRO_HD/04_etl_python/README.md
archive/scripts/MIGRATION_ABHGZR_TO_HYDRO_HD/04_etl_python/etl_migrate_abhgzr.py
archive/scripts/MIGRATION_ABHGZR_TO_HYDRO_HD/04_etl_python/requirements.txt
archive/scripts/MIGRATION_ABHGZR_TO_HYDRO_HD/05_load_sql/01_load_ref_communes.sql
archive/scripts/MIGRATION_ABHGZR_TO_HYDRO_HD/05_load_sql/02_load_core_entities.sql
archive/scripts/MIGRATION_ABHGZR_TO_HYDRO_HD/05_load_sql/03_load_ref_properties_model_run.sql
archive/scripts/MIGRATION_ABHGZR_TO_HYDRO_HD/05_load_sql/04_load_core_timeseries_measurements.sql
archive/scripts/MIGRATION_ABHGZR_TO_HYDRO_HD/05_load_sql/05_load_core_bathymetry.sql
archive/scripts/MIGRATION_ABHGZR_TO_HYDRO_HD/05_load_sql/06_refresh_public_value_views.sql
archive/scripts/MIGRATION_ABHGZR_TO_HYDRO_HD/05_load_sql/07_seed_module_properties.sql
archive/scripts/MIGRATION_ABHGZR_TO_HYDRO_HD/05_load_sql/README.md
archive/scripts/MIGRATION_ABHGZR_TO_HYDRO_HD/06_quality_checks/01_preload_checks.sql
archive/scripts/MIGRATION_ABHGZR_TO_HYDRO_HD/06_quality_checks/02_postload_checks.sql
archive/scripts/MIGRATION_ABHGZR_TO_HYDRO_HD/06_quality_checks/03_reconciliation_checks.sql
archive/scripts/MIGRATION_ABHGZR_TO_HYDRO_HD/07_reports/COMPARAISON_BDD_SOURCE_CIBLE.md
archive/scripts/MIGRATION_ABHGZR_TO_HYDRO_HD/07_reports/MAPPING_SOURCE_TO_TARGET.md
archive/scripts/MIGRATION_ABHGZR_TO_HYDRO_HD/07_reports/PLAN_MIGRATION.md
archive/scripts/MIGRATION_ABHGZR_TO_HYDRO_HD/07_reports/RAPPORT_INSPECTION_CIBLE.md
archive/scripts/MIGRATION_ABHGZR_TO_HYDRO_HD/07_reports/RAPPORT_INSPECTION_SOURCE.md
archive/scripts/MIGRATION_ABHGZR_TO_HYDRO_HD/07_reports/RISQUES_ET_GARDE_FOUS.md
archive/scripts/MIGRATION_ABHGZR_TO_HYDRO_HD/08_safe_run/commit_run.ps1
archive/scripts/MIGRATION_ABHGZR_TO_HYDRO_HD/08_safe_run/dry_run.ps1
archive/scripts/MIGRATION_ABHGZR_TO_HYDRO_HD/08_safe_run/run_full_migration.ps1
archive/scripts/MIGRATION_ABHGZR_TO_HYDRO_HD/08_safe_run/runbook.md
archive/scripts/MIGRATION_ABHGZR_TO_HYDRO_HD/README.md
archive/scripts/MIGRATION_SWAT_TO_HYDRO_HD/01_sql/01_create_swat_infra.sql
archive/scripts/MIGRATION_SWAT_TO_HYDRO_HD/01_sql/02_quality_checks.sql
archive/scripts/MIGRATION_SWAT_TO_HYDRO_HD/02_python/swat_etl_pipeline.py
archive/scripts/MIGRATION_SWAT_TO_HYDRO_HD/03_docs/MAPPING_SWAT_TO_HYDRO.md
archive/scripts/MIGRATION_SWAT_TO_HYDRO_HD/README.md
archive/scripts/access-import/README.md
archive/scripts/access-import/analyze_access.ps1
archive/scripts/access-import/import_access.ps1
archive/scripts/access-import/mapping.config.json
archive/scripts/generate-project-documentation.cjs
archive/scripts/generate_db_diagnostic.cjs
archive/scripts/swat-import/README.md
archive/scripts/swat-import/analyze_mdb.ps1
archive/scripts/swat-import/etat_actuel_sync_payload.json
archive/scripts/swat-import/extract_apport_hassan_excel.py
archive/scripts/swat-import/import_etat_actuel_bundle.ps1
archive/scripts/swat-import/import_swat_output.ps1
archive/scripts/swat-import/logs/.gitkeep
archive/scripts/swat-import/mapping.config.json
archive/scripts/swat-import/replace_observed_debit_station_1940_48.sql
archive/scripts/swat-import/reports/daily/swat_mdb_analysis.md
archive/scripts/swat-import/reports/daily/swat_mdb_inventory.json
archive/scripts/swat-import/reports/default/swat_mdb_analysis.md
archive/scripts/swat-import/reports/default/swat_mdb_inventory.json
archive/scripts/swat-import/reports/etat_actuel/swat_mdb_analysis.md
archive/scripts/swat-import/reports/etat_actuel/swat_mdb_inventory.json
archive/scripts/swat-import/reports/etat_actuel_annual/swat_mdb_analysis.md
archive/scripts/swat-import/reports/etat_actuel_annual/swat_mdb_inventory.json
archive/scripts/swat-import/reports/etat_actuel_monthly/swat_mdb_analysis.md
archive/scripts/swat-import/reports/etat_actuel_monthly/swat_mdb_inventory.json
archive/scripts/swat-import/reports/monthly/swat_mdb_analysis.md
archive/scripts/swat-import/reports/monthly/swat_mdb_inventory.json
archive/scripts/swat-import/reports/yearly/swat_mdb_analysis.md
archive/scripts/swat-import/reports/yearly/swat_mdb_inventory.json
archive/scripts/swat-import/sync_core_etat_actuel.sql
archive/scripts/swat-import/sync_syldt_scenarios_from_legacy.sql
archive/scripts/swat-import/verify_etat_actuel.sql
archive/stabilization_backups/20260807_1704/.env.example
archive/stabilization_backups/20260807_1704/docker-compose.yml
archive/stabilization_backups/20260807_1704/hydro_Hassan dakhil/backend/.env.example
archive/stabilization_backups/20260807_1704/hydro_Hassan dakhil/backend/src/services/swatIngestion.service.ts
archive/stabilization_backups/20260807_1704/hydro_Hassan dakhil/frontend/src/components/dashboard/modules/data-management/SwatIngestionPage.tsx
archive/stabilization_backups/20260810_0916/hydro_Hassan dakhil/backend/.env.example
archive/stabilization_backups/20260810_0916/hydro_Hassan dakhil/frontend/src/components/dashboard/modules/SimulatedDataModule.tsx
archive/stabilization_backups/20260810_0916/hydro_Hassan dakhil/frontend/src/components/dashboard/modules/data-management/SwatIngestionPage.tsx
archive/stabilization_backups/20260810_0916/scripts/swat-import/analyze_mdb.ps1
archive/stabilization_backups/20260810_0916/scripts/swat-import/import_swat_output.ps1
archive/stabilization_backups/20260810_0916/scripts/swat-import/mapping.config.json
archive/sync_core_manual.py
hydro_Hassan dakhil/backend/scripts/load-env.js
hydro_Hassan dakhil/backend/scripts/reset-user-password.js
hydro_Hassan dakhil/backend/src/config/loadEnv.ts
hydro_Hassan dakhil/backend/src/constants/swatDataSources.ts
hydro_Hassan dakhil/frontend/public/data/hassan/Classification des zones prioritaires et Programme des  interventions anti-\303\251rosives/programme d'intervention prioritaire.pdf
hydro_Hassan dakhil/frontend/public/data/hassan/intervention-program/figures/figure-61-specific-degradation.png
hydro_Hassan dakhil/frontend/public/data/hassan/intervention-program/figures/figure-63-distance-classes.png
hydro_Hassan dakhil/frontend/public/data/hassan/intervention-program/figures/figure-64-priority-zones.png
hydro_Hassan dakhil/frontend/public/data/hassan/reports/20260703_Mission III_Vdefinitive_remani\303\251eV3.pdf
hydro_Hassan dakhil/frontend/src/features/intervention-program/components/ActionDetailsDrawer.tsx
hydro_Hassan dakhil/frontend/src/features/intervention-program/components/BudgetDistributionChart.tsx
hydro_Hassan dakhil/frontend/src/features/intervention-program/components/InterventionAxisCard.tsx
hydro_Hassan dakhil/frontend/src/features/intervention-program/components/InterventionKpiCard.tsx
hydro_Hassan dakhil/frontend/src/features/intervention-program/components/InterventionTimeline.tsx
hydro_Hassan dakhil/frontend/src/features/intervention-program/components/PriorityMapCard.tsx
hydro_Hassan dakhil/frontend/src/features/intervention-program/components/PriorityMatrix.tsx
hydro_Hassan dakhil/frontend/src/features/intervention-program/components/ProgramSourceDocuments.tsx
hydro_Hassan dakhil/frontend/src/features/intervention-program/data/interventionProgram.data.ts
hydro_Hassan dakhil/frontend/src/features/intervention-program/index.ts
hydro_Hassan dakhil/frontend/src/features/intervention-program/pages/InterventionProgramDashboard.tsx
hydro_Hassan dakhil/frontend/src/features/intervention-program/types/interventionProgram.types.ts
hydro_Hassan dakhil/frontend/src/features/intervention-program/utils/interventionProgram.utils.ts
hydro_Hassan dakhil/frontend/src/lib/display.ts
scripts/quality/compare-functional-baseline.py
```

Remarque :

- La liste ci-dessus couvre les zones et fichiers non suivis structurants observes au moment de la baseline.
- Le `git status --short --untracked-files=all` releve `212` entrees non suivies au total.

## 4. Resume

- Fichiers modifies non indexes : `80`
- Fichiers indexes : `0`
- Fichiers supprimes : `116`
- Fichiers non suivis : `212`
- Total des entrees visibles par `git status --short --untracked-files=all` : `408`
- Resume `git diff --stat` : `196 files changed, 3584 insertions(+), 52261 deletions(-)`

## 5. Risques pour la livraison

- De nombreuses modifications, suppressions et creations existaient deja avant toute correction specifique a la livraison Ziz.
- Ces fichiers ne devront pas etre attribues a tort aux travaux de livraison.
- Les fichiers deja presents dans `LIVRAISON_ZIZ` avant cette mission doivent etre consideres comme preexistants a cette baseline.
- Les fichiers sensibles `.env` existent dans le projet source et dans certaines archives. Ils ne doivent jamais etre ajoutes par erreur a un commit.
- Le fichier `hydro_hd.sql` est volumineux et les archives/backups/documentations peuvent aussi contenir des fichiers lourds. Le risque de commit ou de manipulation accidentelle de gros fichiers est reel.
- La branche locale etant deja en avance de `1` commit sur la branche distante, toute attribution de changement futur doit s'appuyer sur cette baseline.
- Les messages Git de normalisation `LF -> CRLF` indiquent un risque de bruit supplementaire dans les futurs diffs.
- La presence declarative de Git LFS dans `.gitattributes` impose une verification complementaire avant toute operation Git ulterieure sur les fichiers SQL concernes.

## 6. Recommandation

- Conserver ce rapport comme baseline documentaire de reference pendant toute la preparation de livraison.
- Utiliser systematiquement cette reference de branche et de HEAD pour distinguer les travaux Ziz des changements preexistants.
- Avant chaque nouvelle etape de livraison, relancer uniquement des commandes Git de lecture et comparer les ecarts avec ce rapport.
- Ne jamais attribuer aux travaux de livraison un fichier deja liste ici comme modifie, supprime ou non suivi.
- Continuer a produire la documentation de livraison dans `LIVRAISON_ZIZ` en identifiant clairement ce qui est cree apres cette baseline.

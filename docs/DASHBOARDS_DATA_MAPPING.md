# DASHBOARDS_DATA_MAPPING

Document genere a partir du code actuellement present dans le depot `hydro_Hassan dakhil`.

Document de niveau detaille a lire avec :

- [README.md](/D:/3-%20Projets/hassanAddakhil/docs/README.md)
- [PROJECT_BASELINE_2026-06-29.md](/D:/3-%20Projets/hassanAddakhil/docs/PROJECT_BASELINE_2026-06-29.md)

Regles de lecture :

- "Consomme" = appel confirme dans le frontend actuel.
- "Conditionnel" = chemin execute seulement si `relationExists(...)` retourne vrai.
- "Non trouve dans le code actuel" = aucun composant, endpoint, DDL ou service correspondant n'a ete trouve pendant l'analyse.
- Quand la DDL d'une vue materialisee n'est pas dans le depot, les colonnes listees ci-dessous sont inferrees depuis les `SELECT` du code.

## Methode d'analyse suivie

1. Scan du frontend pour trouver les dashboards et leurs appels API.
2. Scan des API/services frontend (`src/api/*`, `src/services/*`, `HydroDataContext`).
3. Scan des routes, controllers et services backend correspondants.
4. Scan des requetes SQL dans les services backend.
5. Scan des scripts SQL et des DDL disponibles dans `backend/sql` et `scripts/*`.
6. Comparaison entre objets SQL reels utilises et objets dont la definition est effectivement presente dans le depot.

## Vue d'ensemble

| Dashboard | Entree frontend confirmee | Endpoints principaux consommes | Services backend principaux | Objets SQL dominants |
| --- | --- | --- | --- | --- |
| Analyse Spatiale | `frontend/src/components/dashboard/modules/SpatialModule.tsx` | `/api/v1/spatial/*` | `spatial.service.ts`, `timeseries.service.ts`, `erosionSwatSeries.service.ts` | `gis.subbasin_shapes`, `gis.reach_shapes`, `core.stations`, `core.reservoirs`, `access.rch_results`, `public.v_ts_catalog_enriched`, `api.mv_*` conditionnels |
| Dashboard general | `frontend/src/pages/Dashboard.tsx` + `HydroDataContext.tsx` | `/api/v1/catalog/runs`, `/api/v1/spatial/stations` | `catalog.service.ts`, `spatial.service.ts` | `public.model_runs`, `api.mv_scenario_catalog` conditionnelle, `core.stations`, `gis.meteo_stations`, `api.mv_station_catalog` conditionnelle |
| Suivi Climat | `frontend/src/components/dashboard/modules/ClimateModule.tsx` | `/api/v1/catalog/*`, `/api/v1/timeseries/*`, `/api/v1/spatial/stations` | `catalog.service.ts`, `timeseries.service.ts` | `public.module_properties`, `ref.observed_properties`, `public.v_ts_catalog_enriched`, `public.timeseries`, `public.measurements`, `public.model_runs` |
| Suivi Hydrologique | `frontend/src/components/dashboard/modules/HydraulicModule.tsx` | `/api/v1/catalog/*`, `/api/v1/timeseries/*`, `/api/v1/spatial/stations` | `catalog.service.ts`, `timeseries.service.ts`, `hydroSwatSeries.service.ts` | `public.v_ts_catalog_enriched`, `public.timeseries`, `public.measurements`, `core.station_subbasin_map`, `access.rch_results`, `api.mv_hydro_station_stats`, `api.mv_hydro_station_timeseries` |
| Sediments | `frontend/src/components/dashboard/modules/sediments/SedimentsDashboard.tsx` | `/api/v1/siltation/*`, `/api/v1/solid-yield/*`, `/api/v1/spatial/*` | `siltation.service.ts`, `solidYield.service.ts`, `erosionSwatSeries.service.ts`, `spatial.service.ts` | `hydro.siltation_*`, `access.sub_results`, `access.rch_results`, `public.v_ts_catalog_enriched`, `api.mv_hydro_station_stats`, `api.mv_hydro_station_timeseries`, `core.station_subbasin_map` |

---

## Analyse Spatiale

### 1. Objectif fonctionnel

Le module `Analyse Spatiale` sert a :

- afficher les couches spatiales du projet Hassan Addakhil (barrages, bassin, sous-bassins, reaches, stations) ;
- filtrer et zoomer sur les objets cartographiques ;
- inspecter les series temporelles associees a un sous-bassin, un reach ou une station ;
- exporter une image PNG de la carte.

### 2. Composants frontend utilises

- Page principale :
  - `hydro_Hassan dakhil/frontend/src/pages/Dashboard.tsx`
- Module principal :
  - `hydro_Hassan dakhil/frontend/src/components/dashboard/modules/SpatialModule.tsx`
- Carte :
  - `hydro_Hassan dakhil/frontend/src/components/map/HydroMap.tsx`
- Panneau d'inspection :
  - `hydro_Hassan dakhil/frontend/src/components/dashboard/modules/SpatialInspectorPanel.tsx`
  - `hydro_Hassan dakhil/frontend/src/components/dashboard/modules/SpatialTimeseriesPanel.tsx`
- API/types/config/helpers associes :
  - `hydro_Hassan dakhil/frontend/src/api/spatial.ts`
  - `hydro_Hassan dakhil/frontend/src/types/spatial.ts`
  - `hydro_Hassan dakhil/frontend/src/constants/projectStations.ts`
  - `hydro_Hassan dakhil/frontend/src/config/basemaps.ts`
  - `hydro_Hassan dakhil/frontend/src/lib/stationLabels.ts`
- Export :
  - export PNG gere dans `SpatialModule.tsx` et execute dans `HydroMap.tsx`

### 3. Endpoints API consommes

| Methode | URL | Parametres utilises | Exemple d'appel | Role |
| --- | --- | --- | --- | --- |
| `GET` | `/api/v1/spatial/project-hassan-addakhil` | aucun | `/api/v1/spatial/project-hassan-addakhil` | charge le paquet cartographique du projet (stations, bassin, sous-bassins, reaches, barrages) |
| `GET` | `/api/v1/spatial/basins` | aucun | `/api/v1/spatial/basins` | charge les bassins globaux en mode `raw_database` |
| `GET` | `/api/v1/spatial/barrages` | aucun | `/api/v1/spatial/barrages` | charge les barrages |
| `GET` | `/api/v1/spatial/subbasins` | `catchmentId`, `barrageId` | `/api/v1/spatial/subbasins?catchmentId=1` | charge les sous-bassins selon le filtre cartographique |
| `GET` | `/api/v1/spatial/reaches` | `subbasinId`, `catchmentId` | `/api/v1/spatial/reaches?catchmentId=1` | charge les reaches avec leurs metadonnees de synthese |
| `GET` | `/api/v1/spatial/stations` | `catchmentId` | `/api/v1/spatial/stations?catchmentId=1` | charge les stations |
| `GET` | `/api/v1/spatial/subbasins/:subbasinId/timeseries` | `variable`, `scenario`, `aggregation`, `startDate`, `endDate` | `/api/v1/spatial/subbasins/18/timeseries?variable=SYLDT&scenario=etat_actuel&aggregation=year` | serie temporelle du sous-bassin selectionne |
| `GET` | `/api/v1/spatial/reaches/:reachId/timeseries` | `variable`, `scenarioCode`, `interval`, `startDate`, `endDate` | `/api/v1/spatial/reaches/7/timeseries?variable=SED_OUT&scenarioCode=SWAT_OUTPUT&interval=year` | serie temporelle reach (sediments ou debit) |
| `GET` | `/api/v1/spatial/stations/:stationId/timeseries` | `variable`, `scenario`, `aggregation`, `startDate`, `endDate` | `/api/v1/spatial/stations/2/timeseries?variable=debit_simulated&scenario=SWAT_OUTPUT&aggregation=day` | serie temporelle hydro d'une station |
| `GET` | `/api/v1/spatial/stations/:stationId/climate` | `variable`, `scenario`, `aggregation`, `startDate`, `endDate` | `/api/v1/spatial/stations/24/climate?variable=precipitation&aggregation=day` | serie temporelle climat d'une station |

### 4. Services backend utilises

- Routes / controllers :
  - `hydro_Hassan dakhil/backend/src/routes/spatialRoutes.ts`
  - `hydro_Hassan dakhil/backend/src/controllers/spatialController.ts`
- Services principaux :
  - `hydro_Hassan dakhil/backend/src/services/spatial.service.ts`
- Services indirects utilises par les endpoints de series :
  - `hydro_Hassan dakhil/backend/src/services/timeseries.service.ts`
  - `hydro_Hassan dakhil/backend/src/services/erosionSwatSeries.service.ts`
- Helpers :
  - `hydro_Hassan dakhil/backend/src/services/database.service.ts`
  - `hydro_Hassan dakhil/backend/src/utils/deduplicate.ts`
- Repositories :
  - Non trouve dans le code actuel.

### 5. Tables et vues PostgreSQL utilisees

- `api.mv_station_catalog` (conditionnel, DDL non trouvee dans le depot)
  - Role : source optimisee pour les stations spatiales.
  - Colonnes referencees : `station_id`, `station_name`, `station_code`, `type_station`, `station_type_code`, `catchment_id`, `geometry`.
  - Type de donnees stockees : catalogue spatial des stations avec geometrie deja exposee.

- `api.mv_subbasin_catalog` (conditionnel, DDL non trouvee dans le depot)
  - Role : source optimisee des sous-bassins.
  - Colonnes referencees : `subbasin_id`, `catchment_id`, `subbasin_code`, `name`, `area_m2`, `area_km2`, `perimeter_km`, `centroid_lat`, `centroid_lng`, `geometry`.
  - Type de donnees stockees : catalogue spatial enrichi des sous-bassins.

- `api.mv_barrage_catalog` (conditionnel, DDL non trouvee dans le depot)
  - Role : source optimisee des barrages.
  - Colonnes referencees : `reservoir_id`, `name`, `geometry`.
  - Type de donnees stockees : catalogue spatial des barrages.

- `gis.subbasin_shapes`
  - Role : geometrie de reference des sous-bassins et base du bassin projet derive.
  - Colonnes importantes : `subbasin_id`, `catchment_id`, `subbasin_code`, `name`, `area_m2`, `geom`.
  - Type de donnees stockees : polygones de sous-bassins.

- `gis.reach_shapes`
  - Role : geometrie des reaches et lien reach -> sous-bassin / bassin.
  - Colonnes importantes : `reach_id`, `reach_code`, `subbasin_id`, `catchment_id`, `length_m`, `slope_pct`, `geom`.
  - Type de donnees stockees : lignes de reseau hydrographique.

- `core.stations`
  - Role : metadonnees station et resolution des pseudo-stations `swat_sub_*`.
  - Colonnes importantes : `station_id`, `station_code`, `name`, `type_station`, `station_type_code`, `catchment_id`, `geom`.
  - Type de donnees stockees : stations observees et stations synthetiques SWAT.

- `gis.meteo_stations`
  - Role : source de fallback pour les stations meteo dans `getStations()`.
  - Colonnes importantes : `station_id`, `station_code`, `name`, `type_station`, `station_type_code`, `catchment_id`, `geom`.
  - Type de donnees stockees : stations meteo spatiales.

- `core.reservoirs`
  - Role : barrages / reservoirs et rattachement au bassin projet.
  - Colonnes importantes : `reservoir_id`, `name`, `catchment_id`, `geom`.
  - Type de donnees stockees : points / polygones reservoirs selon le modele.

- `core.catchments`
  - Role : bassins utilises par `getBasins()`.
  - Colonnes importantes : `catchment_id`, `name`, `geom`, `area_m2`.
  - Type de donnees stockees : polygones de bassins.

- `public.catchments`
  - Role : fallback utilise dans `getProjectHassanAddakhil()` et dans `getStations(catchmentId)`.
  - Colonnes importantes : `catchment_id`, `geom`.
  - Type de donnees stockees : polygones de bassins.
  - Remarque : coexistence `core.catchments` / `public.catchments` confirmee dans le code.

- `access.rch_results`
  - Role : resume des reaches et series temporelles `FLOW_*`, `SED_*`.
  - Colonnes importantes : `sub_code`, `scenario_code`, `period_date`, `year`, `area_km2`, `flow_out_cms`, `flow_in_cms`, `sed_out_tons`, `sed_in_tons`.
  - Type de donnees stockees : sorties SWAT par reach.

- `public.v_ts_catalog_enriched`
  - Role : catalogue des series observees / chargees en base classique, reutilise pour les stations hydro et climat.
  - Colonnes importantes : `ts_id`, `station_id`, `station_code`, `station_name`, `property_id`, `property_name`, `unit`, `standard_name`, `run_id`, `scenario_code`, `scenario_name`, `source_type`, `time_step`, `n_points`, `start_date`, `end_date`.
  - Type de donnees stockees : catalogue de series temporelles enrichi.
  - DDL trouvee uniquement dans `hydro_Hassan dakhil/archive/legacy/930_public_ts_catalog_views.sql`.

- `api.mv_hydro_station_timeseries` (conditionnel, DDL non trouvee dans le depot)
  - Role : source optimisee des series hydro/erosion pour les endpoints station/sous-bassin.
  - Colonnes referencees : `station_id`, `subbasin_id`, `run_id`, `scenario_code`, `time_step`, `source_table`, `period_date`, `flow_out_cms`, `wyld_mm`, `syld_t_ha`, `surq_mm`, `gw_q_mm`.
  - Type de donnees stockees : series agregees ou pre-calculees pour les dashboards.

### 6. Variables utilisees

- Objets spatiaux :
  - barrages
  - bassins
  - sous-bassins
  - reaches
  - stations
- Sous-bassin :
  - `SYLDT`
- Reach :
  - `SED_OUT`
  - `SED_IN`
  - `FLOW_OUT`
  - `FLOW_IN`
- Station hydro :
  - `debit_observed`
  - `debit_simulated`
- Station climat :
  - `precipitation`
  - `temperature_min`
  - `temperature_max`
  - `temperature_mean`

### 7. Relations entre donnees

- `core.reservoirs.catchment_id` -> bassin projet Hassan Addakhil.
- `gis.subbasin_shapes.catchment_id` -> bassin.
- `gis.reach_shapes.subbasin_id` -> sous-bassin.
- `access.rch_results.sub_code` -> `gis.reach_shapes.subbasin_id` ou reach equivalent selon le mapping retenu par le code.
- `core.stations.station_code = 'swat_sub_<id>'` -> sous-bassin logique.
- `core.station_reach_map.station_id` -> station observee ; `reach_id` -> reach ; `simulated_station_id` -> pseudo-station SWAT de reach.
- `public.v_ts_catalog_enriched.station_id` -> station ; `property_id` -> variable ; `run_id` -> scenario.

### 8. Requetes SQL principales

1. Chargement du bassin projet derive depuis les sous-bassins :

```sql
SELECT
  $catchmentId AS id,
  ST_AsGeoJSON(ST_Union(sb.geom)) AS geometry,
  SUM(sb.area_m2) AS area_m2
FROM gis.subbasin_shapes sb
WHERE sb.catchment_id = $catchmentId;
```

2. Resume des reaches :

```sql
WITH rch_summary AS (
  SELECT
    sub_code,
    scenario_code,
    MIN(year) AS period_start,
    MAX(year) AS period_end,
    AVG(flow_out_cms) AS flow_out_cms,
    AVG(sed_out_tons) AS sed_out_tons
  FROM access.rch_results
  WHERE scenario_code = 'etat_actuel'
  GROUP BY sub_code, scenario_code
)
SELECT ...
FROM gis.reach_shapes r
LEFT JOIN rch_summary rs
  ON rs.sub_code = COALESCE(r.subbasin_id, r.reach_id, r.reach_code);
```

3. Serie reach :

```sql
SELECT
  date_trunc($interval, period_date::timestamp)::date::text AS period,
  AVG(flow_out_cms) AS flow_out_cms,
  AVG(sed_out_tons) AS sed_out_tons
FROM access.rch_results
WHERE sub_code = $subCode
  AND scenario_code = $scenarioCode
  AND period_date BETWEEN $startDate AND $endDate
GROUP BY period
ORDER BY period;
```

4. Serie station climat / hydro :

```sql
-- Le service spatial appelle timeseriesService.getCatalog()
-- puis getAggregationAvailability()
-- puis getBundle().
SELECT
  date_trunc($agg, m.datetime) AS period,
  AVG(m.value) AS avg_value
FROM public.measurements m
JOIN public.timeseries t ON t.ts_id = m.ts_id
WHERE t.station_id = $stationId
  AND t.run_id = $runId
  AND t.property_id = $propertyId
GROUP BY 1
ORDER BY 1;
```

### 9. Problemes detectes

- `SpatialService.getProjectHassanAddakhil()` verifie l'existence de `api.mv_basin_catalog` et `api.mv_reach_catalog`, mais ne les requete pas effectivement. Le bassin projet reste reconstruit depuis `gis.subbasin_shapes`, et les reaches passent par `getReaches()` donc par `gis.reach_shapes` + `access.rch_results`.
- Des constantes projet sont hardcodees :
  - `PROJECT_BASIN_ID = 1`
  - `HASSAN_ADDAKHIL_STATION_IDS = [2, 3, 24, 29, 35]`
  - `catchmentId = 1` dans certains appels.
- Incoherence de schemas :
  - `getBasins()` utilise `core.catchments`
  - `getProjectHassanAddakhil()` fallback et `getStations(catchmentId)` utilisent `public.catchments`
- Les definitions SQL de `api.mv_station_catalog`, `api.mv_subbasin_catalog`, `api.mv_barrage_catalog`, `api.mv_basin_catalog`, `api.mv_reach_catalog`, `api.mv_hydro_station_timeseries` ne sont pas dans le depot actuel.
- Les panneaux du module spatial melangent les scenarios par defaut :
  - sous-bassin -> `etat_actuel`
  - reach / station simulee -> `SWAT_OUTPUT`

### 10. Recommandations

- Supprimer les verifications de vues non utilisees ou brancher reellement `api.mv_basin_catalog` et `api.mv_reach_catalog`.
- Remplacer les IDs projet hardcodes par une configuration unique cote backend.
- Harmoniser le schema de reference (`core.catchments` ou `public.catchments`, pas les deux).
- Versionner la DDL des vues materialisees `api.mv_*`.
- Uniformiser les codes scenario par defaut dans tous les sous-panneaux du module spatial.

---

## Dashboard general

### 1. Objectif fonctionnel

Aucun module metier distinct nomme `Dashboard general` n'a ete trouve dans le code actuel.

La partie la plus proche est le shell partage :

- routage vers la bonne section ;
- chargement initial des scenarios et des stations ;
- navigation commune (navbar + sidebar + header).

### 2. Composants frontend utilises

- `hydro_Hassan dakhil/frontend/src/App.tsx`
- `hydro_Hassan dakhil/frontend/src/pages/Dashboard.tsx`
- `hydro_Hassan dakhil/frontend/src/components/dashboard/DashboardSidebarV2.tsx`
- `hydro_Hassan dakhil/frontend/src/components/layout/Navbar.tsx`
- `hydro_Hassan dakhil/frontend/src/contexts/HydroDataContext.tsx`

### 3. Endpoints API consommes

| Methode | URL | Parametres utilises | Exemple d'appel | Role |
| --- | --- | --- | --- | --- |
| `GET` | `/api/v1/catalog/runs` | aucun | `/api/v1/catalog/runs` | charge la liste partagee des runs / scenarios |
| `GET` | `/api/v1/spatial/stations` | aucun dans le shell actuel | `/api/v1/spatial/stations` | charge la liste partagee des stations de reference |

Remarque :

- `/api/v1/catalog/modules/:moduleCode/properties`
- `/api/v1/catalog/availability`

ne sont pas appeles par le shell lui-meme ; ils sont consommes par les modules climat / hydro / sediments.

### 4. Services backend utilises

- Routes / controllers :
  - `hydro_Hassan dakhil/backend/src/routes/catalogRoutes.ts`
  - `hydro_Hassan dakhil/backend/src/routes/spatialRoutes.ts`
  - `hydro_Hassan dakhil/backend/src/controllers/catalogController.ts`
  - `hydro_Hassan dakhil/backend/src/controllers/spatialController.ts`
- Services :
  - `hydro_Hassan dakhil/backend/src/services/catalog.service.ts`
  - `hydro_Hassan dakhil/backend/src/services/spatial.service.ts`
- Helpers :
  - `hydro_Hassan dakhil/backend/src/services/database.service.ts`
  - `hydro_Hassan dakhil/backend/src/utils/deduplicate.ts`
- Repositories :
  - Non trouve dans le code actuel.

### 5. Tables et vues PostgreSQL utilisees

- `api.mv_scenario_catalog` (conditionnel, DDL non trouvee dans le depot)
  - Role : catalogue de scenarios deja filtres par `is_visible`.
  - Colonnes referencees : `run_id`, `scenario_code`, `scenario_name`, `description`, `is_observed`, `created_at`, `is_visible`.
  - Type de donnees stockees : metadonnees de scenarios.

- `public.model_runs`
  - Role : fallback principal des runs.
  - Colonnes importantes : `run_id`, `scenario_code`, `scenario_name`, `description`, `is_observed`, `created_at`.
  - Type de donnees stockees : catalogue des runs observes et simules.

- `access.scenario_metadata` (conditionnel, DDL non trouvee dans le depot)
  - Role : filtre d'existence pour decider quels scenarios simules exposer dans `getRuns()`.
  - Colonnes referencees : `scenario_code`.
  - Type de donnees stockees : metadonnees scenarios SWAT.

- `api.mv_station_catalog` (conditionnel, DDL non trouvee dans le depot)
  - Role : source optimisee des stations partagees.
  - Colonnes referencees : `station_id`, `station_name`, `station_code`, `type_station`, `station_type_code`, `catchment_id`, `geometry`.
  - Type de donnees stockees : catalogue spatial station.

- `core.stations`
  - Role : fallback principal pour les stations partagees.
  - Colonnes importantes : `station_id`, `station_code`, `name`, `type_station`, `station_type_code`, `catchment_id`, `geom`.
  - Type de donnees stockees : stations observees et synthetiques.

- `gis.meteo_stations`
  - Role : complete la liste des stations en fallback.
  - Colonnes importantes : `station_id`, `station_code`, `name`, `type_station`, `station_type_code`, `catchment_id`, `geom`.
  - Type de donnees stockees : stations meteo spatiales.

### 6. Variables utilisees

- Aucune variable metier directe.
- Metadonnees consommees :
  - `scenario_code`
  - `scenario_name`
  - `is_observed`
  - `station_id`
  - `station_code`
  - `station_name`

### 7. Relations entre donnees

- `public.model_runs.run_id` -> scenario expose dans la navigation partagee.
- `core.stations.station_id` -> station exposee dans les filtres partages des autres dashboards.
- `core.stations.catchment_id` -> rattachement territorial des stations.

### 8. Requetes SQL principales

1. Runs :

```sql
SELECT run_id, scenario_code, scenario_name, description, is_observed, created_at
FROM public.model_runs
WHERE is_observed = true
   OR scenario_code = ANY($canonicalSwatScenarios)
   OR EXISTS (
     SELECT 1
     FROM access.scenario_metadata sm
     WHERE sm.scenario_code = public.model_runs.scenario_code
   );
```

2. Stations partagees :

```sql
SELECT station_id, station_code, name, type_station, station_type_code, catchment_id, geom
FROM core.stations
UNION ALL
SELECT station_id, station_code, name, type_station, station_type_code, catchment_id, geom
FROM gis.meteo_stations;
```

### 9. Problemes detectes

- Aucun composant metier separe `Dashboard general` n'existe dans le code actuel ; la demande fonctionnelle et la structure technique ne sont pas alignees.
- `CatalogService.getRuns()` expose des runs SWAT virtuels (`run_id` 101..108) meme si les donnees sous-jacentes peuvent venir d'un seul import de type `SWAT_OUTPUT`.
- Les DDL de `api.mv_scenario_catalog` et `api.mv_station_catalog` ne sont pas versionnees dans le depot actuel.

### 10. Recommandations

- Soit creer un vrai module `Dashboard general`, soit renommer ce besoin en `Shell partage du dashboard`.
- Versionner la DDL des vues optionnelles `api.mv_scenario_catalog` et `api.mv_station_catalog`.
- Documenter explicitement le contrat des runs SWAT virtuels (101..108) exposes au frontend.

---

## Suivi Climat

### 1. Objectif fonctionnel

Le dashboard `Suivi Climat` permet de :

- choisir une station, un scenario, une ou plusieurs variables climat ;
- borner une periode ;
- afficher un graphe temporel ;
- afficher des statistiques sur la periode ;
- afficher un tableau exportable.

### 2. Composants frontend utilises

- Page principale :
  - `hydro_Hassan dakhil/frontend/src/pages/Dashboard.tsx`
- Module :
  - `hydro_Hassan dakhil/frontend/src/components/dashboard/modules/ClimateModule.tsx`
- Filtres :
  - `hydro_Hassan dakhil/frontend/src/components/dashboard/FilterBar.tsx`
  - `hydro_Hassan dakhil/frontend/src/components/dashboard/analytics/AnalyticsFilterPanel.tsx`
- Graphiques :
  - `hydro_Hassan dakhil/frontend/src/components/charts/TimeSeriesChart.tsx`
  - `hydro_Hassan dakhil/frontend/src/components/dashboard/analytics/AnalyticsChartCard.tsx`
- Statistiques :
  - `hydro_Hassan dakhil/frontend/src/components/dashboard/analytics/AnalyticsStatsRow.tsx`
- Tableaux :
  - `hydro_Hassan dakhil/frontend/src/components/dashboard/analytics/AnalyticsDataTable.tsx`
  - `hydro_Hassan dakhil/frontend/src/components/tables/DataTable.tsx`
- Dialogues / agrandissement :
  - `hydro_Hassan dakhil/frontend/src/components/dashboard/analytics/ExpandableDialog.tsx`
- Exports :
  - `hydro_Hassan dakhil/frontend/src/components/charts/ChartExportMenu.tsx`
  - `hydro_Hassan dakhil/frontend/src/lib/chartExport.ts`
- Services / contexte :
  - `hydro_Hassan dakhil/frontend/src/api/timeseries.ts`
  - `hydro_Hassan dakhil/frontend/src/api/hydro.ts`
  - `hydro_Hassan dakhil/frontend/src/contexts/HydroDataContext.tsx`

### 3. Endpoints API consommes

| Methode | URL | Parametres utilises | Exemple d'appel | Role |
| --- | --- | --- | --- | --- |
| `GET` | `/api/v1/catalog/runs` | aucun | `/api/v1/catalog/runs` | charge les scenarios partages |
| `GET` | `/api/v1/spatial/stations` | aucun | `/api/v1/spatial/stations` | charge les stations partagees |
| `GET` | `/api/v1/catalog/modules/climat/properties` | aucun | `/api/v1/catalog/modules/climat/properties` | charge le catalogue de variables climat |
| `GET` | `/api/v1/catalog/availability` | `module=climat` | `/api/v1/catalog/availability?module=climat` | charge les combinaisons station / run / variable / time_step disponibles |
| `GET` | `/api/v1/timeseries/availability` | `stationId`, `runId`, `propertyId`, `module`, `startDate`, `endDate` | `/api/v1/timeseries/availability?stationId=24&runId=1&propertyId=10&module=climat&startDate=2020-01-01&endDate=2020-12-31` | dit si l'agregation `day/month/year` existe pour la selection |
| `GET` | `/api/v1/timeseries/date-range` | `stationId`, `runId`, `propertyId`, `module` | `/api/v1/timeseries/date-range?stationId=24&runId=1&propertyId=10&module=climat` | calcule les bornes reelles de dates |
| `GET` | `/api/v1/timeseries/bundle` | `stationId`, `runId`, `module`, `agg`, `startDate`, `endDate` | `/api/v1/timeseries/bundle?stationId=24&runId=1&module=climat&agg=day&startDate=2020-01-01&endDate=2020-12-31` | renvoie le catalogue et les series agregees utilises par le graphe, les stats et le tableau |

### 4. Services backend utilises

- Routes / controllers :
  - `hydro_Hassan dakhil/backend/src/routes/catalogRoutes.ts`
  - `hydro_Hassan dakhil/backend/src/routes/catalogAvailability.ts`
  - `hydro_Hassan dakhil/backend/src/routes/timeseriesRoutes.ts`
  - `hydro_Hassan dakhil/backend/src/routes/spatialRoutes.ts`
  - `hydro_Hassan dakhil/backend/src/controllers/catalogController.ts`
  - `hydro_Hassan dakhil/backend/src/controllers/timeseriesController.ts`
  - `hydro_Hassan dakhil/backend/src/controllers/spatialController.ts`
- Services :
  - `hydro_Hassan dakhil/backend/src/services/catalog.service.ts`
  - `hydro_Hassan dakhil/backend/src/services/timeseries.service.ts`
- Helpers :
  - `hydro_Hassan dakhil/backend/src/services/database.service.ts`
  - `hydro_Hassan dakhil/backend/src/utils/deduplicate.ts`
- Repositories :
  - Non trouve dans le code actuel.

### 5. Tables et vues PostgreSQL utilisees

- `public.module_properties`
  - Role : configuration des variables visibles et ordre de tri par module.
  - Colonnes importantes : `module_code`, `property_id`, `is_enabled`, `sort_order`.
  - Type de donnees stockees : mapping module -> variables.
  - DDL de creation de table : non trouvee dans le code actuel.
  - Seed trouvee : `scripts/MIGRATION_ABHGZR_TO_HYDRO_HD/05_load_sql/07_seed_module_properties.sql`.

- `ref.observed_properties`
  - Role : dictionnaire des variables observees.
  - Colonnes importantes : `property_id`, `name`, `unit`, `standard_name`.
  - Type de donnees stockees : definitions de variables metier.

- `public.v_ts_catalog_enriched`
  - Role : catalogue enrichi des series climat exposees au frontend.
  - Colonnes importantes : `ts_id`, `station_id`, `station_code`, `station_name`, `property_id`, `property_name`, `unit`, `standard_name`, `run_id`, `scenario_code`, `scenario_name`, `source_type`, `time_step`, `n_points`, `start_date`, `end_date`.
  - Type de donnees stockees : catalogue de series avec bornes et cardinalite.

- `public.timeseries`
  - Role : identite des series temporelles.
  - Colonnes importantes : `ts_id`, `station_id`, `property_id`, `run_id`, `source_type`, `time_step`, `created_at`.
  - Type de donnees stockees : metadonnees de series.

- `public.measurements`
  - Role : valeurs numeriques reelles des series.
  - Colonnes importantes : `ts_id`, `datetime`, `value`.
  - Type de donnees stockees : mesures horodatees.

- `public.model_runs`
  - Role : scenarios / runs pour les donnees observees et chargees.
  - Colonnes importantes : `run_id`, `scenario_code`, `scenario_name`, `is_observed`, `created_at`.
  - Type de donnees stockees : catalogue de runs.

- `api.mv_scenario_catalog` (conditionnel, DDL non trouvee dans le depot)
  - Role : variante optimisee / filtree pour `getRuns()`.
  - Colonnes referencees : `run_id`, `scenario_code`, `scenario_name`, `description`, `is_observed`, `created_at`, `is_visible`.

- `api.mv_station_catalog` (conditionnel, DDL non trouvee dans le depot)
  - Role : variante optimisee / spatiale pour la liste de stations partagee.
  - Colonnes referencees : `station_id`, `station_name`, `station_code`, `type_station`, `station_type_code`, `catchment_id`, `geometry`.

- `core.stations` et `gis.meteo_stations`
  - Role : fallback station si `api.mv_station_catalog` n'existe pas.
  - Colonnes importantes : `station_id`, `station_code`, `name`, `type_station`, `station_type_code`, `catchment_id`, `geom`.

### 6. Variables utilisees

Variables climat effectivement exposees par le code :

- `PRECIPITATION`
- `TMAX`
- `TMIN`
- `TMEAN`
- `HUMIDITY_REL`
- `EVAPORATION`
- `WIND_SPEED`

Remarque importante :

- le dashboard n'est pas limite a precipitation / temperature min / temperature max / temperature mean ;
- le frontend affiche toute variable climat visible par `isVariableVisibleForModule()` et chargee dans `module_properties` / `availability`.

### 7. Relations entre donnees

- `public.module_properties.property_id` -> `ref.observed_properties.property_id`
- `public.timeseries.station_id` -> station
- `public.timeseries.property_id` -> variable climat
- `public.timeseries.run_id` -> `public.model_runs.run_id`
- `public.measurements.ts_id` -> `public.timeseries.ts_id`

### 8. Requetes SQL principales

1. Variables du module climat :

```sql
SELECT
  mp.module_code,
  mp.property_id,
  mp.is_enabled,
  mp.sort_order,
  p.name,
  p.unit,
  p.standard_name
FROM public.module_properties mp
JOIN ref.observed_properties p ON p.property_id = mp.property_id
WHERE mp.module_code = 'climat'
  AND mp.is_enabled = true
ORDER BY sort_order, property_id;
```

2. Disponibilite climat :

```sql
SELECT
  c.ts_id,
  c.station_id,
  c.property_id,
  c.run_id,
  c.time_step,
  c.n_points,
  c.start_date,
  c.end_date
FROM public.v_ts_catalog_enriched c
WHERE EXISTS (
  SELECT 1
  FROM public.module_properties mp
  WHERE mp.property_id = c.property_id
    AND mp.module_code = 'climat'
    AND mp.is_enabled = true
);
```

3. Bundle climat :

```sql
SELECT
  date_trunc($agg, m.datetime) AS period,
  AVG(m.value) AS avg_value,
  MIN(m.value) AS min_value,
  MAX(m.value) AS max_value,
  COUNT(*) AS n
FROM public.measurements m
JOIN public.timeseries t ON t.ts_id = m.ts_id
WHERE t.station_id = $stationId
  AND t.run_id = $runId
  AND t.property_id = $propertyId
  AND m.datetime BETWEEN $startDate AND $endDate
GROUP BY 1
ORDER BY 1;
```

### 9. Problemes detectes

- Le scope climat est plus large que les 4 variables citees dans la demande : le code expose aussi `HUMIDITY_REL`, `EVAPORATION` et `WIND_SPEED` si elles sont seedes / disponibles.
- `catalog/availability` est une route generique qui construit aussi une union de series SWAT mappees par reach, meme pour le module climat ; ces lignes sont ensuite filtrees cote frontend parce que `standard_name` commence par `SWAT_`.
- Les DDL de `api.mv_scenario_catalog` et `api.mv_station_catalog` ne sont pas dans le depot actuel.

### 10. Recommandations

- Si le perimetre metier du dashboard doit rester limite a precipitation / temperature min / temperature max / temperature mean, remplacer la logique "tout sauf SWAT" par une whitelist explicite.
- Specialiser `catalog/availability` pour eviter le surcout de la branche SWAT sur le module climat.
- Versionner la DDL des vues optionnelles `api.mv_scenario_catalog` et `api.mv_station_catalog`.

---

## Suivi Hydrologique

### 1. Objectif fonctionnel

Le dashboard `Suivi Hydrologique` permet de :

- choisir une station et un scenario ;
- afficher une serie simple ou une comparaison multi-scenarios ;
- afficher des statistiques et un tableau agrege ;
- afficher un bloc nomme `Comparaison station / simulation`.

### 2. Composants frontend utilises

- Page principale :
  - `hydro_Hassan dakhil/frontend/src/pages/Dashboard.tsx`
- Module :
  - `hydro_Hassan dakhil/frontend/src/components/dashboard/modules/HydraulicModule.tsx`
- Filtres :
  - `hydro_Hassan dakhil/frontend/src/components/dashboard/FilterBar.tsx`
  - `hydro_Hassan dakhil/frontend/src/components/dashboard/analytics/AnalyticsFilterPanel.tsx`
- Graphiques :
  - `hydro_Hassan dakhil/frontend/src/components/charts/TimeSeriesChart.tsx`
  - `hydro_Hassan dakhil/frontend/src/components/charts/ScenarioComparisonChart.tsx`
  - `hydro_Hassan dakhil/frontend/src/components/charts/MultiScenarioTimeSeriesChart.tsx`
  - `hydro_Hassan dakhil/frontend/src/components/dashboard/analytics/AnalyticsChartCard.tsx`
- Statistiques :
  - `hydro_Hassan dakhil/frontend/src/components/dashboard/analytics/AnalyticsStatsRow.tsx`
- Tableaux :
  - `hydro_Hassan dakhil/frontend/src/components/dashboard/analytics/AnalyticsDataTable.tsx`
  - `hydro_Hassan dakhil/frontend/src/components/tables/DataTable.tsx`
- Bloc de comparaison :
  - `hydro_Hassan dakhil/frontend/src/components/dashboard/modules/StationSimulationComparison.tsx`
- Dialogues / export :
  - `hydro_Hassan dakhil/frontend/src/components/dashboard/analytics/ExpandableDialog.tsx`
  - `hydro_Hassan dakhil/frontend/src/components/charts/ChartExportMenu.tsx`
  - `hydro_Hassan dakhil/frontend/src/lib/chartExport.ts`
- Services / contexte :
  - `hydro_Hassan dakhil/frontend/src/api/timeseries.ts`
  - `hydro_Hassan dakhil/frontend/src/api/hydro.ts`
  - `hydro_Hassan dakhil/frontend/src/contexts/HydroDataContext.tsx`

### 3. Endpoints API consommes

| Methode | URL | Parametres utilises | Exemple d'appel | Role |
| --- | --- | --- | --- | --- |
| `GET` | `/api/v1/catalog/runs` | aucun | `/api/v1/catalog/runs` | charge les scenarios partages |
| `GET` | `/api/v1/spatial/stations` | aucun | `/api/v1/spatial/stations` | charge les stations partagees |
| `GET` | `/api/v1/catalog/modules/hydro/properties` | aucun | `/api/v1/catalog/modules/hydro/properties` | charge les variables hydrologiques visibles |
| `GET` | `/api/v1/catalog/availability` | `module=hydro` | `/api/v1/catalog/availability?module=hydro` | charge les combinaisons station / run / variable / time_step disponibles |
| `GET` | `/api/v1/timeseries/availability` | `stationId`, `runId`, `propertyId`, `module`, `startDate`, `endDate` | `/api/v1/timeseries/availability?stationId=2&runId=101&propertyId=31&module=hydro` | expose la disponibilite `day/month/year` |
| `GET` | `/api/v1/timeseries/date-range` | `stationId`, `runId`, `propertyId`, `module` | `/api/v1/timeseries/date-range?stationId=2&runId=101&propertyId=31&module=hydro` | calcule les bornes reelles |
| `GET` | `/api/v1/timeseries/bundle` | `stationId`, `runId`, `module`, `agg`, `startDate`, `endDate` | `/api/v1/timeseries/bundle?stationId=2&runId=101&module=hydro&agg=day` | renvoie catalogue + series agregees pour graphe, tableau et stats |

Endpoint apparent mais non consomme par le dashboard actuel :

- `GET /api/v1/stations/:stationId/simulations`

Le wrapper existe dans `frontend/src/api/hydro.ts`, mais aucun composant du dashboard hydrologique ne l'appelle.

### 4. Services backend utilises

- Routes / controllers :
  - `hydro_Hassan dakhil/backend/src/routes/catalogRoutes.ts`
  - `hydro_Hassan dakhil/backend/src/routes/catalogAvailability.ts`
  - `hydro_Hassan dakhil/backend/src/routes/timeseriesRoutes.ts`
  - `hydro_Hassan dakhil/backend/src/routes/spatialRoutes.ts`
  - `hydro_Hassan dakhil/backend/src/routes/stationSimulationRoutes.ts` (present mais non consomme par le frontend actuel)
  - `hydro_Hassan dakhil/backend/src/controllers/catalogController.ts`
  - `hydro_Hassan dakhil/backend/src/controllers/timeseriesController.ts`
  - `hydro_Hassan dakhil/backend/src/controllers/spatialController.ts`
  - `hydro_Hassan dakhil/backend/src/controllers/stationSimulationController.ts` (non consomme par le frontend actuel)
- Services :
  - `hydro_Hassan dakhil/backend/src/services/catalog.service.ts`
  - `hydro_Hassan dakhil/backend/src/services/timeseries.service.ts`
  - `hydro_Hassan dakhil/backend/src/services/hydroSwatSeries.service.ts`
  - `hydro_Hassan dakhil/backend/src/services/stationSimulation.service.ts` (non consomme par le frontend actuel)
- Helpers :
  - `hydro_Hassan dakhil/backend/src/services/database.service.ts`
  - `hydro_Hassan dakhil/backend/src/utils/deduplicate.ts`
- Repositories :
  - Non trouve dans le code actuel.

### 5. Tables et vues PostgreSQL utilisees

- `public.v_ts_catalog_enriched`
  - Role : catalogue observe + catalogue classique utilise dans `catalog/availability` et dans les chemins legacy de `timeseries.service.ts`.
  - Colonnes importantes : `ts_id`, `station_id`, `property_id`, `run_id`, `standard_name`, `source_type`, `time_step`, `n_points`, `start_date`, `end_date`.

- `public.timeseries`
  - Role : identite des series observees / classiques.
  - Colonnes importantes : `ts_id`, `station_id`, `property_id`, `run_id`, `source_type`, `time_step`.

- `public.measurements`
  - Role : valeurs observees agregees par `date_trunc`.
  - Colonnes importantes : `ts_id`, `datetime`, `value`.

- `public.model_runs`
  - Role : resolution des runs classiques / observes et support des bundles legacy.
  - Colonnes importantes : `run_id`, `scenario_code`, `scenario_name`, `is_observed`, `created_at`.

- `public.module_properties`
  - Role : variables visibles cote dashboard.
  - Colonnes importantes : `module_code`, `property_id`, `is_enabled`, `sort_order`.

- `ref.observed_properties`
  - Role : dictionnaire observe utilise pour les proprietes legacy.
  - Colonnes importantes : `property_id`, `name`, `unit`, `standard_name`.

- `core.station_subbasin_map`
  - Role : mapping station observee -> sous-bassin SWAT.
  - Colonnes importantes : `station_id`, `station_code`, `station_name`, `nv_station_name`, `subbasin_id`, `hydro_id`, `outlet_id`, `source_layer`, `mapping_method`, `confidence_score`, `is_primary`, `is_active`.
  - Type de donnees stockees : table de correspondance metier / spatiale.
  - DDL : creee dynamiquement dans `backend/src/services/stationSimulation.service.ts`.

- `access.rch_results`
  - Role : source SWAT de fallback pour le debit simule.
  - Colonnes importantes : `sub_code`, `scenario_code`, `period_date`, `flow_out_cms`.
  - Type de donnees stockees : sorties SWAT par reach.

- `api.mv_hydro_station_stats` (conditionnel, DDL non trouvee dans le depot)
  - Role : source optimisee de disponibilite hydro simulee.
  - Colonnes referencees : `station_id`, `station_code`, `station_name`, `run_id`, `scenario_code`, `scenario_name`, `time_step`, `property_id`, `property_name`, `unit`, `standard_name`, `n_measures`, `dt_min`, `dt_max`, `v_min`, `v_max`, `created_at`.
  - Type de donnees stockees : stats de disponibilite par station / scenario / variable / pas de temps.

- `api.mv_hydro_station_timeseries` (conditionnel, DDL non trouvee dans le depot)
  - Role : source optimisee des series hydro simulees.
  - Colonnes referencees : `station_id`, `scenario_code`, `time_step`, `source_table`, `period_date`, `flow_out_cms`.
  - Type de donnees stockees : series hydro pre-calculees.

- `api.mv_scenario_catalog`, `api.mv_station_catalog`
  - Role : metadata partagées chargees via le shell.
  - DDL : non trouvee dans le code actuel.

### 6. Variables utilisees

Variables confirmees dans le dashboard :

- observe :
  - `STREAMFLOW`
- simule :
  - `SWAT_FLOW_M3S`

Variable visible cote frontend mais non rattachee a un composant dedie du dashboard actuel :

- `reservoir_bathymetry`

### 7. Relations entre donnees

- `public.timeseries.station_id` -> station observee.
- `public.timeseries.property_id` -> variable observee (par ex. `STREAMFLOW`).
- `core.station_subbasin_map.station_id` -> station observee.
- `core.station_subbasin_map.subbasin_id` -> `access.rch_results.sub_code`.
- `public.model_runs.run_id` -> scenario observe / legacy.
- `hydroSwatSeriesService` cree des runs SWAT virtuels (`101..108`) via `NORMALIZED_SWAT_SCENARIOS`.

### 8. Requetes SQL principales

1. Disponibilite hydro simulee via vue materialisee :

```sql
SELECT
  station_id,
  station_code,
  station_name,
  run_id,
  scenario_code,
  scenario_name,
  time_step,
  property_id,
  n_measures,
  dt_min,
  dt_max
FROM api.mv_hydro_station_stats
WHERE scenario_code = ANY($canonicalScenarios);
```

2. Fallback hydro simule sans vue materialisee :

```sql
WITH source AS (
  SELECT
    sim.station_id,
    sim.station_code,
    sim.name AS station_name,
    2 AS run_id,
    'etat_actuel' AS scenario_code,
    r.period_date,
    r.flow_out_cms
  FROM access.rch_results r
  JOIN core.station_subbasin_map m
    ON m.subbasin_id = r.sub_code
   AND m.is_active = true
  JOIN core.stations sim
    ON sim.station_id = m.station_id
  WHERE r.scenario_code = $scenarioCode
)
SELECT
  station_id,
  COUNT(*) AS n_measures,
  MIN(period_date) AS dt_min,
  MAX(period_date) AS dt_max
FROM source
GROUP BY station_id;
```

3. Bundle observe legacy :

```sql
SELECT
  date_trunc($agg, m.datetime) AS period,
  AVG(m.value) AS avg_value
FROM public.measurements m
JOIN public.timeseries t ON t.ts_id = m.ts_id
WHERE t.station_id = $stationId
  AND t.run_id = $runId
  AND t.property_id = $propertyId
GROUP BY 1
ORDER BY 1;
```

4. Bundle simule via vue materialisee ou fallback SWAT :

```sql
SELECT
  period_date::text AS period_date,
  AVG(flow_out_cms)::double precision AS value
FROM api.mv_hydro_station_timeseries
WHERE station_id = $stationId
  AND scenario_code = $scenarioCode
  AND time_step = $timeStep
  AND source_table = 'rch'
GROUP BY period_date
ORDER BY period_date;
```

### 9. Problemes detectes

- `hydroSwatSeriesService.expandVirtualScenarioRows()` duplique la meme disponibilite issue du fallback `etat_actuel` sur tous les scenarios normalises (`etat_actuel`, `ssp126`, `ssp245`, `ssp585`, `scenario_1..4`) quand `api.mv_hydro_station_stats` est absente ou vide.
- `StationSimulationComparison.tsx` n'utilise pas `hydroApi.getStationSimulations()` ; le composant affiche simplement un `TimeSeriesChart`. Le backend `stationSimulationRoutes.ts` / `stationSimulation.service.ts` est donc present mais non consomme par le dashboard actuel.
- `moduleVariables.ts` rend `reservoir_bathymetry` visible pour `hydro`, mais aucun composant du dashboard hydrologique actuel n'appelle `hydroApi.getBathymetry()` ni n'utilise `BathymetryRecap.tsx`.

### 10. Recommandations

- Remplacer la duplication `expandVirtualScenarioRows()` par une vraie resolution scenario -> donnees ou masquer les scenarios non importes.
- Connecter `StationSimulationComparison` a `/api/v1/stations/:stationId/simulations` si la comparaison observe/simule detaillee est attendue.
- Supprimer `reservoir_bathymetry` de la whitelist ou brancher un vrai composant bathymetrie dans le dashboard hydrologique.

---

## Sediments

### 1. Objectif fonctionnel

Le dashboard `Sediments` regroupe 3 sous-dashboards :

- `Evaluation d'envasement`
- `Degradation specifique`
- `Transport solide Reach`

### 2. Composants frontend utilises

- Conteneur :
  - `hydro_Hassan dakhil/frontend/src/components/dashboard/modules/sediments/SedimentsDashboard.tsx`
- Envasement :
  - `hydro_Hassan dakhil/frontend/src/components/dashboard/modules/sediments/EnvasementDashboard.tsx`
  - `hydro_Hassan dakhil/frontend/src/components/dashboard/modules/RecapitulatifEnvasement.tsx`
- Degradation specifique :
  - `hydro_Hassan dakhil/frontend/src/components/dashboard/modules/sediments/SpecificDegradationDashboard.tsx`
  - `hydro_Hassan dakhil/frontend/src/components/dashboard/modules/SolidYieldModuleV2.tsx`
  - `hydro_Hassan dakhil/frontend/src/services/solidYieldService.ts`
- Reach :
  - `hydro_Hassan dakhil/frontend/src/components/dashboard/modules/sediments/ReachSedimentDashboard.tsx`
- API / services frontend :
  - `hydro_Hassan dakhil/frontend/src/api/siltation.ts`
  - `hydro_Hassan dakhil/frontend/src/api/spatial.ts`
- Exports :
  - `hydro_Hassan dakhil/frontend/src/components/charts/ChartExportMenu.tsx`
  - `hydro_Hassan dakhil/frontend/src/lib/chartExport.ts`
  - exports PDF/Excel directs via `window.open(...)` dans `RecapitulatifEnvasement.tsx`

### 3. Endpoints API consommes

| Sous-dashboard | Methode | URL | Parametres utilises | Exemple d'appel | Role |
| --- | --- | --- | --- | --- | --- |
| Envasement | `GET` | `/api/v1/siltation/summary` | `damCode` | `/api/v1/siltation/summary?damCode=HASSAN_ADDAKHIL` | charge les KPI barrage |
| Envasement | `GET` | `/api/v1/siltation/hsv` | `damCode` | `/api/v1/siltation/hsv?damCode=HASSAN_ADDAKHIL` | charge les courbes HSV |
| Envasement | `GET` | `/api/v1/siltation/evolution` | `damCode` | `/api/v1/siltation/evolution?damCode=HASSAN_ADDAKHIL` | charge l'evolution annuelle / cumulative |
| Envasement | `GET` | `/api/v1/siltation/availability` | `damCode` | `/api/v1/siltation/availability?damCode=HASSAN_ADDAKHIL` | charge les annees / campagnes disponibles |
| Envasement | `GET` | `/api/v1/siltation/export/excel` | `damCode` | `/api/v1/siltation/export/excel?damCode=HASSAN_ADDAKHIL` | export Excel |
| Envasement | `GET` | `/api/v1/siltation/export/pdf` | `damCode` | `/api/v1/siltation/export/pdf?damCode=HASSAN_ADDAKHIL` | export PDF |
| Envasement | `GET` | `/api/v1/spatial/project-hassan-addakhil` | aucun | `/api/v1/spatial/project-hassan-addakhil` | charge la mini-carte barrage / bassin |
| Degradation specifique | `GET` | `/api/v1/solid-yield/subbasins` | aucun | `/api/v1/solid-yield/subbasins` | charge la liste de sous-bassins exposes |
| Degradation specifique | `GET` | `/api/v1/solid-yield/availability` | `subbasinStationId` | `/api/v1/solid-yield/availability?subbasinStationId=2018` | charge la disponibilite par sous-bassin / scenario |
| Degradation specifique | `GET` | `/api/v1/solid-yield/timeseries` | `subbasinStationId`, `runId`, `interval`, `startDate`, `endDate` | `/api/v1/solid-yield/timeseries?subbasinStationId=2018&runId=101&interval=year` | charge la serie `SYLDT_HA` |
| Degradation specifique | `GET` | `/api/v1/solid-yield/stats` | `subbasinStationId`, `runId`, `startDate`, `endDate` | `/api/v1/solid-yield/stats?subbasinStationId=2018&runId=101` | charge les stats `SYLDT_HA` |
| Reach | `GET` | `/api/v1/spatial/reaches` | `catchmentId` | `/api/v1/spatial/reaches?catchmentId=1` | charge la liste / geometrie des reaches |
| Reach | `GET` | `/api/v1/spatial/reaches/:reachId/timeseries` | `scenarioCode`, `interval`, `startDate`, `endDate` | `/api/v1/spatial/reaches/7/timeseries?scenarioCode=SWAT_OUTPUT&interval=year` | charge la serie reach `SED_OUT` |

Endpoints existants non consommes par le dashboard actuel :

- `/api/v1/siltation/indicators`
- `/api/v1/siltation/bathymetry`
- `/api/v1/solid-yield/debug/diagnostic`

### 4. Services backend utilises

- Routes / controllers :
  - `hydro_Hassan dakhil/backend/src/routes/siltationRoutes.ts`
  - `hydro_Hassan dakhil/backend/src/routes/solidYieldRoutes.ts`
  - `hydro_Hassan dakhil/backend/src/routes/spatialRoutes.ts`
  - `hydro_Hassan dakhil/backend/src/controllers/siltation.controller.ts`
  - `hydro_Hassan dakhil/backend/src/controllers/solidYield.controller.ts`
  - `hydro_Hassan dakhil/backend/src/controllers/spatialController.ts`
- Services :
  - `hydro_Hassan dakhil/backend/src/services/siltation.service.ts`
  - `hydro_Hassan dakhil/backend/src/services/solidYield.service.ts`
  - `hydro_Hassan dakhil/backend/src/services/erosionSwatSeries.service.ts`
  - `hydro_Hassan dakhil/backend/src/services/spatial.service.ts`
- Helpers :
  - `hydro_Hassan dakhil/backend/src/services/database.service.ts`
  - `hydro_Hassan dakhil/backend/src/utils/ttlCache.ts`
  - `hydro_Hassan dakhil/backend/src/utils/deduplicate.ts`
- Repositories :
  - Non trouve dans le code actuel.

### 5. Tables et vues PostgreSQL utilisees

- `hydro.siltation_indicators`
  - Role : KPI barrage d'envasement.
  - Colonnes importantes : `dam_code`, `dam_name`, `baseline_year`, `current_year`, `volume_initial_mhm3`, `volume_current_mhm3`, `volume_silted_mhm3`, `loss_percent`, `tea_mhm3_per_year`, `ter_percent_per_year`, `duration_years`, `metadata`.
  - Type de donnees stockees : indicateurs de synthese.
  - DDL : `hydro_Hassan dakhil/backend/sql/create_siltation_schema.sql`

- `hydro.siltation_hsv`
  - Role : courbes hauteur-surface-volume.
  - Colonnes importantes : `dam_code`, `campaign_year`, `level_m`, `surface_km2`, `volume_mhm3`, `source_sheet`, `metadata`.
  - Type de donnees stockees : points HSV.
  - DDL : `hydro_Hassan dakhil/backend/sql/create_siltation_schema.sql`

- `hydro.siltation_evolution`
  - Role : historique annuel / cumulatif d'envasement.
  - Colonnes importantes : `dam_code`, `year`, `annual_silted_mhm3`, `cumulative_silted_mhm3`, `annual_rate_mhm3`, `source_sheet`, `metadata`.
  - Type de donnees stockees : serie annuelle de sedimentation.
  - DDL : `hydro_Hassan dakhil/backend/sql/create_siltation_schema.sql`

- `public.v_ts_catalog_enriched`
  - Role : l'une des sources possibles de disponibilite `SYLDT_HA`.
  - Colonnes importantes : `station_id`, `station_code`, `station_name`, `run_id`, `scenario_code`, `source_type`, `time_step`, `property_id`, `standard_name`, `n_points`, `start_date`, `end_date`.
  - Type de donnees stockees : catalogue enrichi.

- `api.mv_hydro_station_stats` (conditionnel, DDL non trouvee dans le depot)
  - Role : disponibilite simulee erosion / solid yield.
  - Colonnes referencees : `station_id`, `subbasin_id`, `station_code`, `station_name`, `run_id`, `scenario_code`, `scenario_name`, `source_table`, `time_step`, `property_id`, `property_name`, `standard_name`, `unit`, `n_measures`, `dt_min`, `dt_max`.
  - Type de donnees stockees : stats de disponibilite hydro/erosion.

- `api.mv_hydro_station_timeseries` (conditionnel, DDL non trouvee dans le depot)
  - Role : source optimisee pour `SYLDT_HA` et les variables reach.
  - Colonnes referencees : `subbasin_id`, `station_id`, `run_id`, `scenario_code`, `time_step`, `source_table`, `period_date`, `syld_t_ha`, `flow_out_cms`, `sed_out_tons`, `sed_in_tons`, `sedconc_mg_kg`, `wyld_mm`, `surq_mm`, `gw_q_mm`.
  - Type de donnees stockees : series pre-calculees hydro/erosion.

- `access.sub_results`
  - Role : fallback principal des series `SYLDT_HA`.
  - Colonnes importantes : `sub_code`, `scenario_code`, `period_date`, `year`, `syld_t_ha`, `wyld_mm`, `surq_mm`, `gw_q_mm`.
  - Type de donnees stockees : sorties SWAT par sous-bassin.

- `access.rch_results`
  - Role : source des reaches `SED_OUT`, `SED_IN`, `SED_CONC`, `FLOW_*`.
  - Colonnes importantes : `sub_code`, `scenario_code`, `period_date`, `year`, `sed_in_tons`, `sed_out_tons`, `sedconc_mg_kg`, `flow_out_cms`, `flow_in_cms`, `area_km2`.
  - Type de donnees stockees : sorties SWAT par reach.

- `core.station_subbasin_map`
  - Role : mapping station -> sous-bassin pour solid yield et reach fallback.
  - Colonnes importantes : `station_id`, `station_code`, `subbasin_id`, `is_active`, `mapping_method`, `confidence_score`.
  - Type de donnees stockees : table de correspondance metier.

- `core.station_reach_map`
  - Role : mapping station observee -> reach.
  - Colonnes importantes : `station_id`, `reach_id`, `station_code`, `reach_code`, `mapping_method`, `distance_m`, `confidence_score`, `simulated_station_id`, `is_primary`, `is_active`.
  - Type de donnees stockees : table de correspondance station/reach.
  - DDL : `hydro_Hassan dakhil/backend/sql/940_station_reach_map.sql`

- `core.stations`
  - Role : noms / codes de stations observees et pseudo-stations SWAT.
  - Colonnes importantes : `station_id`, `station_code`, `name`, `catchment_id`, `geom`.

- `gis.subbasin_shapes`, `gis.reach_shapes`, `core.reservoirs`
  - Role : mini-carte envasement et geographies reach / sous-bassin.

### 6. Variables utilisees

- Envasement :
  - `volume_initial_mhm3`
  - `volume_current_mhm3`
  - `volume_silted_mhm3`
  - `loss_percent`
  - `tea_mhm3_per_year`
  - `ter_percent_per_year`
  - `duration_years`
  - `level_m`
  - `surface_km2`
  - `volume_mhm3`
  - `annual_silted_mhm3`
  - `cumulative_silted_mhm3`
  - `annual_rate_mhm3`

- Degradation specifique :
  - `SYLDT`
  - `SWAT_SYLDT_HA`
  - `syld_t_ha`

- Reach transport solide :
  - `SED_OUT`
  - `SED_IN` (support backend present)
  - `FLOW_OUT` (support backend present)
  - `FLOW_IN` (support backend present)
  - `SWAT_SED_TONS`
  - `SWAT_SED_IN_TONS`
  - `SWAT_SED_CONC_MG_KG`

### 7. Relations entre donnees

- `hydro.siltation_* .dam_code` -> meme barrage (`HASSAN_ADDAKHIL`) pour KPI, HSV et evolution.
- `core.stations.station_code = 'swat_sub_<id>'` -> sous-bassin logique.
- `core.station_subbasin_map.subbasin_id` -> `access.sub_results.sub_code`.
- `core.station_subbasin_map.subbasin_id` -> `access.rch_results.sub_code` pour retrouver les reaches lies a une station.
- `gis.reach_shapes.subbasin_id` -> reach -> sous-bassin.
- `public.model_runs` / `core.model_runs` -> scenario simule.

### 8. Requetes SQL principales

1. KPI d'envasement :

```sql
SELECT *
FROM hydro.siltation_indicators
WHERE dam_code = $1
ORDER BY updated_at DESC;
```

2. Courbes HSV :

```sql
SELECT *
FROM hydro.siltation_hsv
WHERE dam_code = $1
ORDER BY campaign_year, level_m;
```

3. Evolution annuelle :

```sql
SELECT
  year,
  annual_silted_mhm3,
  cumulative_silted_mhm3,
  annual_rate_mhm3
FROM hydro.siltation_evolution
WHERE dam_code = $1
  AND year IS NOT NULL
  AND year <> 0
ORDER BY year;
```

4. Serie `SYLDT_HA` via vue materialisee :

```sql
SELECT
  date_trunc($interval, period_date::timestamp)::date::text AS period,
  AVG(syld_t_ha) AS value,
  COUNT(*) AS n
FROM api.mv_hydro_station_timeseries
WHERE subbasin_id = $subbasinId
  AND run_id = $runId
  AND time_step = $timeStep
  AND source_table = 'sub'
GROUP BY 1
ORDER BY 1;
```

5. Fallback `SYLDT_HA` depuis `access.sub_results` :

```sql
SELECT
  date_trunc($interval, s.period_date::timestamp)::date::text AS period,
  AVG(s.syld_t_ha) AS value,
  COUNT(*) AS n
FROM access.sub_results s
WHERE s.sub_code = $subbasinId
  AND s.scenario_code = 'etat_actuel'
GROUP BY 1
ORDER BY 1;
```

6. Serie reach :

```sql
SELECT
  date_trunc($interval, period_date::timestamp)::date::text AS period,
  AVG(sed_out_tons) AS sed_out_tons,
  AVG(sed_in_tons) AS sed_in_tons,
  AVG(flow_out_cms) AS flow_out_cms
FROM access.rch_results
WHERE sub_code = $subCode
  AND scenario_code = $scenarioCode
GROUP BY 1
ORDER BY 1;
```

### 9. Problemes detectes

- `erosionSwatSeriesService.getSubbasinSeries()` et `getSubbasinStats()` forcent `scenario_code = 'etat_actuel'` dans le fallback `access.sub_results`, meme si l'utilisateur a selectionne un autre `runId` / scenario et meme si le frontend propose plusieurs scenarios.
- `ReachSedimentDashboard.tsx` hardcode :
  - `catchmentId = 1`
  - `scenarioCode = 'SWAT_OUTPUT'`
  alors que `SpatialService.getReaches()` construit sa synthese sur `scenario_code = 'etat_actuel'`.
- `scripts/MIGRATION_ABHGZR_TO_HYDRO_HD/05_load_sql/07_seed_module_properties.sql` seed encore `erosion` avec `INFLOW_M3` et `RESTITUTION_M3`, alors que le code frontend/backend actuel travaille sur `SWAT_SED_TONS`, `SWAT_SED_IN_TONS`, `SWAT_SED_CONC_MG_KG`, `SWAT_SYLDT_HA`.
- `solidYield.service.ts` contient une `catalogCte` definie mais non utilisee.
- Les endpoints `/api/v1/siltation/indicators` et `/api/v1/siltation/bathymetry` existent mais ne sont pas consommes par le dashboard actuel.

### 10. Recommandations

- Corriger le fallback `access.sub_results` pour propager le scenario selectionne au lieu de figer `etat_actuel`.
- Harmoniser les codes scenario `SWAT_OUTPUT` / `etat_actuel` / `scenario_*` entre frontend, services et donnees.
- Mettre a jour le seed `module_properties` du module `erosion` pour refleter les variables sedimentaires actuelles.
- Supprimer la `catalogCte` morte ou l'utiliser reellement.
- Nettoyer la surface API siltation si certains endpoints ne doivent plus etre exposes.

---

## Objets SQL references sans DDL trouvee dans le depot

Les objets ci-dessous sont references dans le code des dashboards analyses, mais leur definition SQL n'a pas ete trouvee dans le depot actuel :

- `api.mv_scenario_catalog`
- `api.mv_station_catalog`
- `api.mv_subbasin_catalog`
- `api.mv_barrage_catalog`
- `api.mv_basin_catalog`
- `api.mv_reach_catalog`
- `api.mv_hydro_station_stats`
- `api.mv_hydro_station_timeseries`
- `access.scenario_metadata`

## Objets dont une definition SQL a ete trouvee

- `hydro.siltation_indicators`
  - `hydro_Hassan dakhil/backend/sql/create_siltation_schema.sql`
- `hydro.siltation_hsv`
  - `hydro_Hassan dakhil/backend/sql/create_siltation_schema.sql`
- `hydro.siltation_evolution`
  - `hydro_Hassan dakhil/backend/sql/create_siltation_schema.sql`
- `core.station_reach_map`
  - `hydro_Hassan dakhil/backend/sql/940_station_reach_map.sql`
- `core.station_subbasin_map`
  - cree dynamiquement dans `hydro_Hassan dakhil/backend/src/services/stationSimulation.service.ts`
- `public.v_ts_catalog_enriched`
  - definition trouvee dans `hydro_Hassan dakhil/archive/legacy/930_public_ts_catalog_views.sql`
- `public.module_properties`
  - seed trouve dans `scripts/MIGRATION_ABHGZR_TO_HYDRO_HD/05_load_sql/07_seed_module_properties.sql`
  - creation de table non trouvee dans le code actuel

## Synthese des incoherences confirmees

- Le shell partage n'a pas de vrai module `Dashboard general`.
- Le module spatial melange `core.catchments` et `public.catchments`.
- Le module spatial verifie des vues materialisees (`api.mv_basin_catalog`, `api.mv_reach_catalog`) sans les utiliser effectivement.
- Le module hydrologique duplique les donnees `etat_actuel` sur tous les scenarios SWAT virtuels si les vues materialisees hydro sont absentes.
- Le composant `StationSimulationComparison` ne consomme pas l'endpoint backend du meme besoin.
- Le module sediments force `etat_actuel` dans le fallback `SYLDT_HA`.
- Le seed SQL historique de `module_properties` n'est plus aligne avec le code sediments actuel.

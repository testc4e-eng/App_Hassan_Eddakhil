# VALIDATION LOT 3 — VUES / MATERIALIZED VIEWS OBSOLÈTES — `hydro_hd`

- **Date / heure** : 2026-08-12 12:48
- **Référence LOT 2B** : `RAPPORT_NETTOYAGE_DB_LOT2B_LEGACY_HYDRO_HD_20260812_1325.md`
- **Mode** : validation seule
- **PostgreSQL modifié** : **NON**
- **DROP VIEW / DROP MATERIALIZED VIEW** : **NON**

Point d’arrêt : aucune suppression. Attente de validation utilisateur.

---

## 0. Méthode

1. Inventaire live `pg_class` / `pg_depend` / `pg_rewrite` sur `api`, `public`, `audit`.
2. Recherche des noms dans `hydro_Hassan dakhil/backend/src`, `frontend/src`, `backend/sql`, `backend/tests`, `scripts`, `docker`.
3. Test `DROP sans CASCADE` = **OUI** seulement si **0** vue / matview / fonction dépendante.
4. Export DDL (lecture `pg_dump -s` / `pg_get_viewdef`) vers `backups/lot3_views_20260812_1248/`.
5. Baseline fonctionnelle vs post-LOT 2B. Aucune écriture DB.

Classification :

| Code | Sens |
| --- | --- |
| **A** | Conserver absolument (runtime, Docker, ou liste protégée) |
| **B** | Conserver temporairement (script / synonyme / fallback) |
| **C** | Supprimable sans dépendance SQL (DROP simple possible) |
| **D** | Supprimable seulement après ses dépendants legacy (CASCADE requis aujourd’hui) |
| **E** | À validation manuelle (usage hors code possible : QC, SIG, SQL ad hoc) |

Une absence de référence code **ne suffit pas** à classer C si une autre vue conservée en dépend, ou si un usage manuel est plausible.

---

## 1. Pré-check / baseline

| Contrôle | Résultat |
| --- | --- |
| Backend `5007` `/api/v1/hydro/health` | HTTP **200** |
| Frontend `8090` | HTTP **200** |
| `/api/v1/catalog/runs` | **9** scénarios |
| `core.timeseries` | **383** |
| `core.measurements` | **3 773 400** |
| Stations visibles | **75** |
| `gis.reach_shapes` / `gis.subbasin_shapes` | **19 / 19** |

Baseline : `backups/lot3_views_20260812_1248/LOT3_PRECHECK.json`  
Compare vs `LOT2B_DROP_POSTCHECK.json` : **WARNING** (hash `spatial_reaches` et `data_scan_periods_global` uniquement). **0 REGRESSION.** Volumes identiques.

Audit en lecture seule → l’état après = l’état avant. Pas de seconde snapshot (inutile).

---

## 2. Inventaire live

| Schéma | VIEW | MATVIEW | Total |
| --- | ---: | ---: | ---: |
| `api` | 20 | 3 | 23 |
| `audit` | 5 | 0 | 5 |
| `public` | 91 | 0 | 91 |
| **Total** | **116** | **3** | **119** |

Owner : `postgres` pour tous.  
Objets dont `DROP` sans CASCADE échouerait : **14**.

---

## 3. Objets protégés (A) — preuves code

| Objet | Preuve |
| --- | --- |
| `api.mv_scenario_catalog` | `catalog.service.ts` L214–225 ; `hydro.service.ts` L417–420 ; test `catalog.service.test.ts` ; `docker/db/init/10-restore-dump.sh` L25–26 `REFRESH` |
| `api.v_catalog_properties` | `hydro.service.ts` L206 |
| `public.v_ts_catalog` | `catalogAvailability.ts` L68 ; `erosionSwatSeries.service.ts` L591, L2261 |
| `public.v_ts_catalog_enriched` | `catalog.service.ts`, `timeseries.service.ts`, `hydro.service.ts`, `solidYield.service.ts`, `swatIngestion.service.ts`, `erosionSwatSeries.service.ts` ; `scripts/quality/compare-functional-baseline.py` ; `scripts/swat-import/verify_etat_actuel.sql` |
| `public.measurements` | `timeseries.service.ts` L292+ ; `hydro.service.ts` L239+ ; `stationSimulation.service.ts` L552 |
| `public.timeseries` | `hydro.service.ts` L204 ; `stationSimulation.service.ts` L527 |
| `public.stations` | `hydro.service.ts` L69, L113 ; `spatial.service.ts` L706 |
| `public.model_runs` | `catalog.service.ts` L242 ; `hydro.service.ts` L442 ; `hydroSwatSeries.service.ts` ; `stationSimulation.service.ts` ; `timeseries.service.ts` L271 |
| `public.reservoirs` | `hydro.service.ts` L308 |
| `public.reservoir_bathymetry` | `hydro.service.ts` L366–382 |
| `public.v_values_bathymetry` | `hydro.service.ts` L319–334 |
| `public.catchments` | `spatial.service.ts` L670, L1601 |
| `public.landcover` | `hydro.service.ts` L493 |
| `public.geometry_columns` | `dataScan.service.ts` L1052 ; `dataScan.queries.ts` L35, L116 |
| `public.geography_columns` | vue PostGIS système ; liste protégée |

`public.v_ts_catalog` a 2 dépendants (`v_ts_catalog_enriched`, `v_measurements_full`) → **DROP sans CASCADE impossible**. À conserver.

---

## 4. Matviews absentes attendues par le backend

Le backend teste `relationExists` puis se rabat sur `public.*` / `core.*` / `access.*`. **Ne pas supprimer ces fallbacks.**

| Objet attendu | Présent dans `hydro_hd` | Consommateurs (si présent) |
| --- | --- | --- |
| `api.mv_barrage_catalog` | **ABSENT** | `spatial.service.ts` L440, L553, L603 ; `hydro.service.ts` L289 |
| `api.mv_basin_catalog` | **ABSENT** | `spatial.service.ts` L549 |
| `api.mv_hydro_station_stats` | **ABSENT** | `erosionSwatSeries.service.ts`, `hydroSwatSeries.service.ts` |
| `api.mv_hydro_station_timeseries` | **ABSENT** | `erosionSwatSeries.service.ts`, `hydroSwatSeries.service.ts`, `stationSimulation.service.ts` |
| `api.mv_reach_catalog` | **ABSENT** | `spatial.service.ts` L551 |
| `api.mv_station_catalog` | **ABSENT** | `hydro.service.ts` L32, L90 ; `spatial.service.ts` L552, L1552 |
| `api.mv_subbasin_catalog` | **ABSENT** | `spatial.service.ts` L550, L572, L828 |

Aucune compensation créée. Aucun fallback retiré.

---

## 5. Backup des définitions

Dossier : `backups/lot3_views_20260812_1248/`

| Fichier | Contenu | CREATE |
| --- | --- | --- |
| `api_views.sql` | 20 vues `api.v_*` | 20 VIEW |
| `materialized_views.sql` | 3 matviews `api.mv_*` existantes | 3 MATVIEW (aucun index) |
| `audit_views.sql` | 5 vues QC | 5 VIEW |
| `public_legacy_views.sql` | 71 vues legacy (stats/values/property/geo + 2 isolées) | 71 VIEW |
| `README.txt` | inventaire d’export | — |
| `LOT3_PRECHECK.json` / `.md` | baseline | — |

Protégés **non** dumpés : `v_ts_catalog`, `v_ts_catalog_enriched`, `v_values_bathymetry`, wrappers `public.measurements` / `timeseries` / `stations` / `model_runs` / `reservoirs` / `reservoir_bathymetry` / `catchments` / `landcover` / `geometry_columns` / `geography_columns`.

---

## 6. Dépendances — ordre inverse pour un futur nettoyage

**Règle :** un objet CASCADE=YES n’est **jamais** « suppression simple ».

### Graphes API (hors protégés)

```
v_timeseries_enriched
  ├─ v_catalog_scenarios
  ├─ v_catalog_series
  ├─ v_catalog_stations          ← script analyze_database.py
  ├─ v_compare_monthly ← v_measurements_monthly
  ├─ v_map_catchments_annual ← v_measurements_annual
  ├─ v_map_stations_latest ← v_measurements_latest
  └─ v_series_stats

v_dashboard_catchment_counts → mv_dashboard_catchment_counts
v_dashboard_reservoir_counts → mv_dashboard_reservoir_counts
```

Ordre futur (feuilles → racines), **si** validé :

1. `api.mv_dashboard_catchment_counts`, `api.mv_dashboard_reservoir_counts`
2. Feuilles API sans enfant : `v_catalog_scenarios`, `v_catalog_series`, `v_compare_monthly`, `v_dashboard_national_counts`, `v_erosion_subbasins_annual`, `v_map_catchments_annual`, `v_map_stations_latest`, `v_measurements_annual_agg`, `v_measurements_daily`, `v_measurements_monthly_agg`, `v_qc_property_domain_tovalidate`, `v_series_stats`  
   (`v_catalog_stations` seulement après décision script)
3. `v_dashboard_catchment_counts`, `v_dashboard_reservoir_counts`, `v_measurements_annual`, `v_measurements_latest`, `v_measurements_monthly`
4. `v_timeseries_enriched`

### Graphes public stats / values

```
v_stats_property_station_timestep → 11 v_stats_* (station)
v_stats_property_timestep         → 11 v_stats_*_global

v_values_measurements
  ├─ v_values_annual   → 10 *_annual
  ├─ v_values_monthly  → 10 *_monthly
  └─ 11 *_obs
```

Ordre futur : feuilles `v_stats_*` / `v_values_*` → hubs → **jamais** `v_values_bathymetry`.

### public property

1. `v_property_agg_rule`, `v_property_catalog_final`
2. `v_property_module`, `v_property_catalog`

### audit

Les 5 vues QC n’ont **aucun** dépendant. DROP simple possible **après** validation métier QC.

---

## 7. Tableau consolidé

Légende Runtime = utilisé par backend actuel. Backend = référence dans `backend/src` (ou Docker). Dépendants = vues/matviews entrantes.

### 7.1 `api` (23)

| Vue | Type | Runtime | Dépendants | Backend | Supprimable sans CASCADE | Décision | Risque |
| --- | --- | --- | ---: | --- | --- | --- | --- |
| `api.mv_scenario_catalog` | MATVIEW 24 kB | OUI | 0 | OUI + Docker REFRESH | OUI (mais **A**) | **A** | Critique catalogue |
| `api.v_catalog_properties` | VIEW | OUI | 0 | OUI | OUI (mais **A**) | **A** | Hydro timeseries |
| `api.mv_dashboard_catchment_counts` | MATVIEW 8 kB | NON | 0 | NON | **OUI** | **C** | Faible |
| `api.mv_dashboard_reservoir_counts` | MATVIEW 24 kB | NON | 0 | NON | **OUI** | **C** | Faible |
| `api.v_catalog_scenarios` | VIEW | NON | 0 | NON | **OUI** | **C** | Catalogue API non branché |
| `api.v_catalog_series` | VIEW | NON | 0 | NON (commentaire frontend seulement) | **OUI** | **C** | Faible |
| `api.v_catalog_stations` | VIEW | NON | 0 | NON | **OUI** | **B** | `hydro_Hassan dakhil/scripts/analyze_database.py` |
| `api.v_compare_monthly` | VIEW | NON | 0 | NON | **OUI** | **C** | Faible |
| `api.v_dashboard_catchment_counts` | VIEW | NON | 1 | NON | **NON** | **D** | Source de la matview dashboard |
| `api.v_dashboard_national_counts` | VIEW | NON | 0 | NON | **OUI** | **C** | Faible |
| `api.v_dashboard_reservoir_counts` | VIEW | NON | 1 | NON | **NON** | **D** | Source de la matview dashboard |
| `api.v_erosion_subbasins_annual` | VIEW | NON | 0 | NON | **OUI** | **C** | Runtime érosion = `gis` + `access` |
| `api.v_map_catchments_annual` | VIEW | NON | 0 | NON | **OUI** | **C** | Cartes = `gis.*` |
| `api.v_map_stations_latest` | VIEW | NON | 0 | NON | **OUI** | **C** | Faible |
| `api.v_measurements_annual` | VIEW | NON | 1 | NON | **NON** | **D** | Requis par `v_map_catchments_annual` |
| `api.v_measurements_annual_agg` | VIEW | NON | 0 | NON | **OUI** | **C** | Faible |
| `api.v_measurements_daily` | VIEW | NON | 0 | NON | **OUI** | **C** | Faible |
| `api.v_measurements_latest` | VIEW | NON | 1 | NON | **NON** | **D** | Requis par `v_map_stations_latest` |
| `api.v_measurements_monthly` | VIEW | NON | 1 | NON | **NON** | **D** | Requis par `v_compare_monthly` |
| `api.v_measurements_monthly_agg` | VIEW | NON | 0 | NON | **OUI** | **C** | Faible |
| `api.v_qc_property_domain_tovalidate` | VIEW | NON | 0 | NON | **OUI** | **C** | Faible |
| `api.v_series_stats` | VIEW | NON | 0 | NON | **OUI** | **C** | Faible |
| `api.v_timeseries_enriched` | VIEW | NON | 7 | NON | **NON** | **D** | Hub de 7 vues API legacy |

### 7.2 `audit` (5)

| Vue | Type | Runtime | Dépendants | Backend | Sans CASCADE | Décision | Risque |
| --- | --- | --- | ---: | --- | --- | --- | --- |
| `audit.v_qc_measurements_duplicates` | VIEW | NON | 0 | NON | OUI | **E** | QC manuel possible |
| `audit.v_qc_measurements_orphans` | VIEW | NON | 0 | NON | OUI | **E** | QC manuel |
| `audit.v_qc_null_geometry` | VIEW | NON | 0 | NON | OUI | **E** | QC géométries |
| `audit.v_qc_timeseries_duplicates` | VIEW | NON | 0 | NON | OUI | **E** | QC manuel |
| `audit.v_qc_timeseries_without_measurements` | VIEW | NON | 0 | NON | OUI | **E** | QC manuel |

### 7.3 `public` — protégés et synonymes

| Vue | Type | Runtime | Dépendants | Backend | Sans CASCADE | Décision | Risque |
| --- | --- | --- | ---: | --- | --- | --- | --- |
| `public.v_ts_catalog` | VIEW | OUI | 2 | OUI | **NON** | **A** | Parent de `v_ts_catalog_enriched` |
| `public.v_ts_catalog_enriched` | VIEW | OUI | 0 | OUI + scripts | OUI (mais **A**) | **A** | Catalogue runtime |
| `public.v_values_bathymetry` | VIEW | OUI | 0 | OUI | OUI (mais **A**) | **A** | Siltation / bathymétrie |
| `public.measurements` | VIEW | OUI | 0 | OUI | — | **A** | Synonyme `core.measurements` |
| `public.timeseries` | VIEW | OUI | 0 | OUI | — | **A** | |
| `public.stations` | VIEW | OUI | 0 | OUI | — | **A** | |
| `public.model_runs` | VIEW | OUI | 0 | OUI | — | **A** | |
| `public.reservoirs` | VIEW | OUI | 0 | OUI | — | **A** | |
| `public.reservoir_bathymetry` | VIEW | OUI | 0 | OUI | — | **A** | |
| `public.catchments` | VIEW | OUI | 0 | OUI | — | **A** | |
| `public.landcover` | VIEW | OUI | 0 | OUI | — | **A** | |
| `public.geometry_columns` | VIEW | OUI | 0 | OUI Data Scan | — | **A** | PostGIS |
| `public.geography_columns` | VIEW | SYS | 0 | Protégé | — | **A** | PostGIS |
| `public.reaches` | VIEW | NON | 0 | NON | OUI | **B** | Runtime spatial = `gis.reach_shapes` |
| `public.subbasins` | VIEW | NON | 0 | NON | OUI | **B** | Runtime = `gis.subbasin_shapes` |
| `public.rivers` | VIEW | NON | 0 | NON | OUI | **B** | Synonyme `core.rivers` |
| `public.communes` | VIEW | NON | 0 | NON | OUI | **B** | Synonyme `ref.communes` |
| `public.observed_properties` | VIEW | NON | 0 | NON | OUI | **B** | Synonyme `ref.observed_properties` |
| `public.landcover_classes` | VIEW | NON | 0 | NON | OUI | **B** | Peut servir avec `landcover` |
| `public.landcover_periods` | VIEW | NON | 0 | NON | OUI | **B** | Idem |

### 7.4 `public` — geo / isolées

| Vue | Type | Runtime | Dép. | Backend | Sans CASCADE | Décision | Risque |
| --- | --- | --- | ---: | --- | --- | --- | --- |
| `public.v_catchments_geo` | VIEW | NON | 0 | NON | OUI | **E** | Possible usage SIG externe |
| `public.v_reaches_geo` | VIEW | NON | 0 | NON | OUI | **E** | SIG |
| `public.v_reservoirs_geo` | VIEW | NON | 0 | NON | OUI | **E** | SIG |
| `public.v_stations_geo` | VIEW | NON | 0 | NON | OUI | **E** | SIG |
| `public.v_subbasins_geo` | VIEW | NON | 0 | NON | OUI | **E** | SIG |
| `public.v_map_station` | VIEW | NON | 0 | NON | OUI | **E** | Alias stations |
| `public.v_measurements_full` | VIEW | NON | 0 | NON | OUI | **C** | Dépend de `v_ts_catalog` (pas l’inverse critique) |

### 7.5 `public.v_property_*`

| Vue | Dép. | Sans CASCADE | Décision |
| --- | ---: | --- | --- |
| `public.v_property_agg_rule` | 0 | OUI | **C** |
| `public.v_property_catalog_final` | 0 | OUI | **C** |
| `public.v_property_catalog` | 1 | **NON** | **D** |
| `public.v_property_module` | 1 | **NON** | **D** |

Aucune référence backend/frontend/scripts.

### 7.6 `public.v_stats_*` (26)

Feuilles (11 station + 11 global + 2 bathymétrie) : **0 dépendant**, DROP simple → **C**  
Hubs :

| Vue | Dép. | Sans CASCADE | Décision |
| --- | ---: | --- | --- |
| `public.v_stats_property_station_timestep` | 11 | **NON** | **D** |
| `public.v_stats_property_timestep` | 11 | **NON** | **D** |

Feuilles C :  
`v_stats_evaporation`, `_humidity`, `_lachers`, `_precipitation`, `_sediment_load`, `_streamflow`, `_temperature_all/max/mean/min`, `_wind_speed` et leurs `*_global` ; `v_stats_bathymetry`, `v_stats_bathymetry_global`.

Aucune référence backend. Bathymétrie **métier** runtime = `v_values_bathymetry` + `public.reservoir_bathymetry`, pas `v_stats_bathymetry`.

### 7.7 `public.v_values_*` (sauf bathymétrie)

Hubs **D** :

| Vue | Dép. | Sans CASCADE |
| --- | ---: | --- |
| `public.v_values_measurements` | 13 | **NON** |
| `public.v_values_annual` | 10 | **NON** |
| `public.v_values_monthly` | 10 | **NON** |

Feuilles **C** (0 dépendant) : 10 `*_annual` + 10 `*_monthly` + 11 `*_obs` (evaporation, humidity, lachers, precipitation, sediment_load, streamflow, temperature_*, wind_speed).

`public.v_values_bathymetry` = **A** (voir §7.3).

---

## 8. Synthèse demandée

VUES À CONSERVER (**A**) :

- `api.mv_scenario_catalog`
- `api.v_catalog_properties`
- `public.v_ts_catalog`
- `public.v_ts_catalog_enriched`
- `public.v_values_bathymetry`
- `public.measurements`, `public.timeseries`, `public.stations`, `public.model_runs`
- `public.reservoirs`, `public.reservoir_bathymetry`, `public.catchments`, `public.landcover`
- `public.geometry_columns`, `public.geography_columns`

VUES À CONSERVER TEMPORAIREMENT (**B**) :

- `api.v_catalog_stations` (script `analyze_database.py`)
- `public.reaches`, `public.subbasins`, `public.rivers`, `public.communes`
- `public.observed_properties`, `public.landcover_classes`, `public.landcover_periods`

VUES SUPPRIMABLES SANS DÉPENDANCE (**C**, DROP simple possible, **non exécuté**) :

**API :**  
`mv_dashboard_catchment_counts`, `mv_dashboard_reservoir_counts`,  
`v_catalog_scenarios`, `v_catalog_series`, `v_compare_monthly`, `v_dashboard_national_counts`,  
`v_erosion_subbasins_annual`, `v_map_catchments_annual`, `v_map_stations_latest`,  
`v_measurements_annual_agg`, `v_measurements_daily`, `v_measurements_monthly_agg`,  
`v_qc_property_domain_tovalidate`, `v_series_stats`

**Public isolées / property leaves / stats leaves / values leaves :**  
`v_measurements_full`, `v_property_agg_rule`, `v_property_catalog_final`,  
toutes les feuilles `v_stats_*` listées §7.6, toutes les feuilles `v_values_*` listées §7.7

VUES À SUPPRIMER DANS UN ORDRE DE DÉPENDANCE (**D**) :

1. Après les feuilles API : `api.v_dashboard_catchment_counts`, `api.v_dashboard_reservoir_counts`, `api.v_measurements_annual`, `api.v_measurements_latest`, `api.v_measurements_monthly`, puis `api.v_timeseries_enriched`
2. Après les feuilles stats : `public.v_stats_property_station_timestep`, `public.v_stats_property_timestep`
3. Après les feuilles values : `public.v_values_annual`, `public.v_values_monthly`, puis `public.v_values_measurements`
4. Après les feuilles property : `public.v_property_module`, `public.v_property_catalog`

MATVIEWS SUPPRIMABLES (**C**, existantes hors catalogue) :

- `api.mv_dashboard_catchment_counts`
- `api.mv_dashboard_reservoir_counts`

**Ne pas** classer `api.mv_scenario_catalog` comme supprimable.

VUES À VALIDATION MANUELLE (**E**) :

- 5 vues `audit.v_qc_*`
- 5 vues `public.v_*_geo`
- `public.v_map_station`

POSTGRESQL MODIFIÉ :  
**NON**

BASELINE :  
**WARNING** (hash déjà connus) — 383 / 3 773 400 / 75 / 9 / 19 / 19 — **pas de régression**

---

## 9. Point d’arrêt

Aucun `DROP`.  
Pas de `staging`.  
Pas de `old_hd`.  
Pas de `auth`.

Attente de validation avant toute suppression de vues.

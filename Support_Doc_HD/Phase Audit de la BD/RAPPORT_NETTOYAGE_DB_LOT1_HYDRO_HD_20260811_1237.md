# RAPPORT NETTOYAGE DB LOT 1 - HYDRO_HD

Date : 2026-08-11  
Heure : 12:37

## Portee

Intervention limitee au `LOT 1` demande sur la base officielle `hydro_hd`.

Base officielle application :

- `hydro_hd`
- backend Docker Hassan : `DB_HOST=host.docker.internal`
- port DB applique par l'application : `5432`

Tables protegees touchees :

- `NON`

## Backup

Backup reutilise :

- `D:\3- Projets\App_Hassan_Addakhil\backups\hydro_hd_before_dq_corrections_20260810_1339.dump`

Validation `pg_restore --list` :

- `OK`
- dump PostgreSQL custom valide
- aucune ecrasement du backup

## Baseline avant suppression

Verifications avant `DROP` :

- backend `http://127.0.0.1:5007/api/v1/hydro/health` -> `HTTP 200`
- base backend active -> `hydro_hd`
- `core.timeseries = 383`
- `core.measurements = 3773400`
- stations visibles = `75`
- scenarios visibles = `9`
- `gis.reach_shapes = 19`
- `gis.subbasin_shapes = 19`

Snapshot avant lot 1 :

- `Support_Doc_HD/Phase Nettoyage et Stabilisation/LOT1_PRECHECK_BASELINE_20260811_1143.json`

## Revalidation des 4 tables

Tables revalidees avant suppression :

- `audit.qc_issues`
- `audit.qc_runs`
- `audit.station_reach_map_backup_2026`
- `audit.station_subbasin_map_backup_2026`

Resultat technique avant suppression pour chacune :

- `count(*) = 0`
- FK entrantes = `0`
- FK sortantes = `0`
- vues dependantes = `0`
- matviews dependantes = `0`
- fonctions dependantes = `0`
- triggers = `0`
- indexes supplementaires = `0`
- references runtime code/scripts/docker = `0`

## Suppression executee

Transaction appliquee sans `CASCADE` :

```sql
BEGIN;
DROP TABLE audit.qc_issues;
DROP TABLE audit.qc_runs;
DROP TABLE audit.station_reach_map_backup_2026;
DROP TABLE audit.station_subbasin_map_backup_2026;
COMMIT;
```

Resultat :

- `COMMIT` execute
- verification post-suppression :
  - `to_regclass(...) = NULL`
  - aucune des 4 tables n'apparait encore dans `pg_tables`

Tables supprimees :

- `audit.qc_issues`
- `audit.qc_runs`
- `audit.station_reach_map_backup_2026`
- `audit.station_subbasin_map_backup_2026`

## Tests post-suppression

API backend :

- `GET /api/v1/hydro/health` -> `200`
- `GET /api/v1/catalog/runs` -> `200`
- `GET /api/v1/catalog/availability?module=hydro` -> `200`
- `GET /api/v1/catalog/availability?module=climat` -> `200`
- `GET /api/v1/hydro/swat/summary` -> `200`
- `GET /api/v1/spatial/reaches` -> `200`
- `GET /api/v1/spatial/subbasins` -> `200`
- `GET /api/v1/data-scan/summary` -> `200`

Checks projet :

- backend `npm run check` -> `OK`
  - type-check `OK`
  - lint `OK`
  - tests `29 passed`
  - build `OK`
- frontend `npm run check` -> `OK`
  - type-check `OK`
  - lint `OK` avec warnings non bloquants
  - tests `16 passed`
  - build `OK`
- frontend runtime `http://127.0.0.1:8090` -> `HTTP 200`

## Baseline apres suppression

Comparaison avant/apres lot 1 :

- commande utilisee :
  - `scripts/quality/compare-functional-baseline.py --backend-url http://127.0.0.1:5007 --frontend-url http://127.0.0.1:8090 --compare LOT1_PRECHECK_BASELINE_20260811_1143.json ...`
- resultat : `COMPARE STATUS: OK`

Fichiers generes :

- `Support_Doc_HD/Phase Nettoyage et Stabilisation/LOT1_POSTCHECK_BASELINE_20260811_1147.json`
- `Support_Doc_HD/Phase Nettoyage et Stabilisation/LOT1_POSTCHECK_BASELINE_20260811_1147.md`

Indicateurs fonctionnels apres suppression :

- timeseries = `383`
- measurements = `3773400`
- stations visibles = `75`
- scenarios visibles = `9`
- reaches = `19`
- subbasins = `19`

Regression fonctionnelle :

- `NON`

## Lot 2

Lot 2 non execute.

Objets seulement a preparer plus tard avec export individuel obligatoire :

- `audit.gis_reach_shapes_backup_2026`
- `audit.gis_subbasin_shapes_backup_2026`
- `audit.nv_limite`
- `audit.nv_stream`
- `audit.swat_entity_map_backup_2026`
- `audit.swat_output_archive_rch`
- `audit.swat_output_archive_sub`
- `gis.reach_shapes_backup_20260422_144537`

## Resultat final

Tables supprimees :

- `audit.qc_issues`
- `audit.qc_runs`
- `audit.station_reach_map_backup_2026`
- `audit.station_subbasin_map_backup_2026`

Tables protegees touchees :

- `NON`

Timeseries :

- `383`

Measurements :

- `3773400`

Stations visibles :

- `75`

Scenarios :

- `9`

Reaches :

- `19`

Subbasins :

- `19`

Backend :

- `OK`

Frontend :

- `OK`

Baseline :

- `OK`

Regression fonctionnelle :

- `NON`

PostgreSQL :

- `NETTOYAGE LOT 1 UNIQUEMENT`

Prochaine etape :

- `VALIDATION LOT 2 - ARCHIVES / BACKUPS`

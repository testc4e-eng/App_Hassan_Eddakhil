# RAPPORT NETTOYAGE DB LOT 2A - NV_STREAM - HYDRO_HD

Date : 2026-08-11  
Heure : 12:55

## Objet supprime

- `audit.nv_stream`

## Portee

Suppression controlee limitee a :

- `audit.nv_stream`

Objets explicitement non touches :

- `audit.swat_output_archive_rch`
- `audit.swat_output_archive_sub`
- `audit.gis_reach_shapes_backup_2026`
- `audit.gis_subbasin_shapes_backup_2026`
- `audit.nv_limite`
- `audit.swat_entity_map_backup_2026`
- `gis.reach_shapes_backup_20260422_144537`

Tables protegees touchees :

- `NON`

## Verification de l'export

Export valide :

- `D:\3- Projets\App_Hassan_Addakhil\backups\lot2_legacy_20260811_1241\audit.nv_stream.dump`

Verification :

- fichier existe : `OUI`
- taille > 0 : `OUI` (`702458` octets)
- `pg_restore --list` : `OK`
- objet present dans le dump : `OUI`
- nombre de lignes source au moment de la validation : `19`

Export :

- `OK`

## Baseline avant suppression

Snapshot avant :

- `Support_Doc_HD/Phase Nettoyage et Stabilisation/LOT2A_PRECHECK_BASELINE_20260811_1254.json`

Etat avant suppression :

- `core.timeseries = 383`
- `core.measurements = 3773400`
- stations visibles = `75`
- scenarios visibles = `9`
- reaches runtime = `19`
- subbasins runtime = `19`
- backend `5007` = `HTTP 200`
- frontend `8090` = `HTTP 200`

## Revalidation de audit.nv_stream

Verification technique juste avant suppression :

- runtime = `NON`
- backend = `NON`
- scripts = `NON`
- vues dependantes = `0`
- matviews dependantes = `0`
- FK entrantes = `0`
- FK sortantes = `0`
- triggers = `0`
- fonctions dependantes = `0`

Verification des equivalents actifs :

- le frontend consomme `hydro_Hassan dakhil/frontend/public/data/hassan/nv_stream.geojson`
- `nv_stream.geojson` contient `19` features
- `gis.reach_shapes` contient les `19` geometries equivalentes
- `19/19` geometries correspondent (`ST_Equals = 19`)
- attributs essentiels preserves dans `source_attrs` :
  - `hydroid = 19/19`
  - `outletid = 19/19`
  - `station = 19/19`

Aucune difference nouvelle detectee :

- `NON`

## Suppression executee

Transaction appliquee sans `CASCADE` :

```sql
BEGIN;
DROP TABLE audit.nv_stream;
COMMIT;
```

Resultat :

- `BEGIN`
- `DROP TABLE`
- `COMMIT`

PostgreSQL modifie :

- `OUI - uniquement audit.nv_stream`

## Post-check

Verification principale :

- `to_regclass('audit.nv_stream') IS NULL` : `OUI`

Verification objets lot 2 restants :

- `audit.gis_reach_shapes_backup_2026` : existe encore
- `audit.gis_subbasin_shapes_backup_2026` : existe encore
- `audit.nv_limite` : existe encore
- `audit.swat_entity_map_backup_2026` : existe encore
- `audit.swat_output_archive_rch` : existe encore
- `audit.swat_output_archive_sub` : existe encore
- `gis.reach_shapes_backup_20260422_144537` : existe encore

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
  - tests : `29 passed`
  - build : `OK`
- frontend `npm run check` -> `OK`
  - tests : `16 passed`
  - build : `OK`
  - lint : warnings non bloquants deja connus

## Baseline apres suppression

Snapshots :

- avant : `Support_Doc_HD/Phase Nettoyage et Stabilisation/LOT2A_PRECHECK_BASELINE_20260811_1254.json`
- apres : `Support_Doc_HD/Phase Nettoyage et Stabilisation/LOT2A_POSTCHECK_BASELINE_20260811_1255.json`
- rapport compare : `Support_Doc_HD/Phase Nettoyage et Stabilisation/LOT2A_POSTCHECK_BASELINE_20260811_1255.md`

Resultat comparaison :

- `COMPARE STATUS: OK`

Indicateurs finaux :

- `core.timeseries = 383`
- `core.measurements = 3773400`
- stations visibles = `75`
- scenarios visibles = `9`
- reaches runtime = `19`
- subbasins runtime = `19`

Baseline :

- `OK`

Regression :

- `NON`

## Conclusion

Objet supprime :

- `audit.nv_stream`

Export :

- `OK`

PostgreSQL modifie :

- `OUI - uniquement audit.nv_stream`

Tables protegees touchees :

- `NON`

Baseline :

- `OK`

Regression :

- `NON`

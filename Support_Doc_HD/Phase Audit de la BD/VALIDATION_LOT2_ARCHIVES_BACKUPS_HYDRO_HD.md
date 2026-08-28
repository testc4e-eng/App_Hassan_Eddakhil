# VALIDATION LOT 2 - ARCHIVES / BACKUPS LEGACY - HYDRO_HD

Date : 2026-08-11  
Heure : 12:49

## Contexte

Base officielle :

- `hydro_hd`
- application Hassan : backend `http://127.0.0.1:5007`

Objectif de ce lot :

- exporter en securite les objets legacy du lot 2 ;
- verifier s'ils sont reellement remplaçables par leur source active ;
- ne faire **aucun DROP** ;
- ne modifier **aucune donnee PostgreSQL**.

PostgreSQL modifie :

- `NON`

## Baseline avant export

Snapshot avant export :

- `Support_Doc_HD/Phase Nettoyage et Stabilisation/LOT2_PRECHECK_BASELINE_20260811_1240.json`

Verification metier avant export :

- `core.timeseries = 383`
- `core.measurements = 3773400`
- stations visibles = `75`
- scenarios visibles = `9`
- reaches runtime = `19`
- subbasins runtime = `19`
- backend `GET /api/v1/hydro/health` = `200`
- frontend `http://127.0.0.1:8090` = `200`

## Dossier d'export

Exports crees dans :

- `D:\3- Projets\App_Hassan_Addakhil\backups\lot2_legacy_20260811_1241`

Format utilise :

- `pg_dump -Fc -t schema.table`

## Validation des exports

| Objet | Export | Taille | pg_restore OK | Lignes |
| --- | --- | ---: | --- | ---: |
| `audit.gis_reach_shapes_backup_2026` | `audit.gis_reach_shapes_backup_2026.dump` | 558522 | OK | 33 |
| `audit.gis_subbasin_shapes_backup_2026` | `audit.gis_subbasin_shapes_backup_2026.dump` | 809343 | OK | 33 |
| `audit.nv_limite` | `audit.nv_limite.dump` | 1834993 | OK | 19 |
| `audit.nv_stream` | `audit.nv_stream.dump` | 702458 | OK | 19 |
| `audit.swat_entity_map_backup_2026` | `audit.swat_entity_map_backup_2026.dump` | 2560 | OK | 38 |
| `audit.swat_output_archive_rch` | `audit.swat_output_archive_rch.dump` | 22835154 | OK | 345510 |
| `audit.swat_output_archive_sub` | `audit.swat_output_archive_sub.dump` | 14376984 | OK | 345510 |
| `gis.reach_shapes_backup_20260422_144537` | `gis.reach_shapes_backup_20260422_144537.dump` | 558905 | OK | 33 |

Tous les dumps :

- existent ;
- ont une taille `> 0` ;
- passent `pg_restore --list` ;
- contiennent bien l'objet attendu.

## Analyse objet par objet

### 1. `audit.gis_reach_shapes_backup_2026`

OBJET :

- `audit.gis_reach_shapes_backup_2026`

TYPE :

- `table`

LIGNES :

- `33`

TAILLE :

- `680 kB`

RUNTIME :

- `NON`

BACKEND :

- `NON`

SCRIPTS :

- `NON`

VUES DEPENDANTES :

- `0`

FK :

- `0`

TRIGGERS :

- `0`

SOURCE ACTIVE EQUIVALENTE :

- `gis.reach_shapes`
- `core.reaches`

PREUVE DE REMPLACEMENT :

- runtime actif `gis.reach_shapes` = `19` lignes seulement ;
- backup = `33` lignes ;
- `reach_code` backup = `200001..200033` ;
- `reach_code` runtime = `1..19` ;
- `19` lignes du backup tombent dans des subbasins runtime `1..19`, mais `0` geometrie exacte ne matche le runtime ;
- `14` entites du backup n'existent nulle part dans la couche runtime active.

RISQUE :

- la table contient une geometrie legacy non reconstruite par la source active.

Decision :

- `A VALIDER`

### 2. `audit.gis_subbasin_shapes_backup_2026`

OBJET :

- `audit.gis_subbasin_shapes_backup_2026`

TYPE :

- `table`

LIGNES :

- `33`

TAILLE :

- `960 kB`

RUNTIME :

- `NON`

BACKEND :

- `NON`

SCRIPTS :

- `NON`

VUES DEPENDANTES :

- `0`

FK :

- `0`

TRIGGERS :

- `0`

SOURCE ACTIVE EQUIVALENTE :

- `gis.subbasin_shapes`
- `core.subbasins`

PREUVE DE REMPLACEMENT :

- runtime actif `gis.subbasin_shapes` = `19` lignes ;
- backup = `33` lignes ;
- backup `subbasin_code = 1..33` ;
- runtime `subbasin_code = 1..19` ;
- `14` codes existent uniquement dans le backup ;
- sur les `19` codes communs, `0` geometrie exacte ne matche la couche runtime.

RISQUE :

- la table contient un jeu geometrique legacy plus large que le runtime actif.

Decision :

- `A VALIDER`

### 3. `audit.nv_limite`

OBJET :

- `audit.nv_limite`

TYPE :

- `table`

LIGNES :

- `19`

TAILLE :

- `2136 kB`

RUNTIME :

- `NON`

BACKEND :

- `NON`

SCRIPTS :

- `NON`

VUES DEPENDANTES :

- `0`

FK :

- `0`

TRIGGERS :

- `0`

SOURCE ACTIVE EQUIVALENTE :

- `gis.subbasin_shapes`
- `core.subbasins`

PREUVE DE REMPLACEMENT :

- `19` lignes archive vs `19` subbasins runtime ;
- couverture codes `1..19` complete des deux cotes ;
- `17/19` geometries sont exactement egales a `gis.subbasin_shapes` ;
- les attributs `hydroid`, `outletid`, `area`, `slo1` sont preservés `19/19` dans `gis.subbasin_shapes.source_attrs`.

RISQUE :

- la couche active est tres proche, mais `2` geometries ne sont pas strictement identiques au backup ;
- la suppression sans validation ferait perdre une copie brute de la couche source.

Decision :

- `A VALIDER`

### 4. `audit.nv_stream`

OBJET :

- `audit.nv_stream`

TYPE :

- `table`

LIGNES :

- `19`

TAILLE :

- `840 kB`

RUNTIME :

- `NON` pour la table SQL elle-meme

BACKEND :

- `NON` pour la table SQL

SCRIPTS :

- `NON` pour la table SQL

VUES DEPENDANTES :

- `0`

FK :

- `0`

TRIGGERS :

- `0`

SOURCE ACTIVE EQUIVALENTE :

- `hydro_Hassan dakhil/frontend/public/data/hassan/nv_stream.geojson`
- `gis.reach_shapes`

PREUVE DE REMPLACEMENT :

- `nv_stream.geojson` contient `19` features ;
- comparaison exacte table SQL vs GeoJSON sur `(subbasin, hydroid, outletid, station)` = `ExactMatch: True` ;
- `gis.reach_shapes` matche `19/19` geometries exactes ;
- `gis.reach_shapes.source_attrs` preserve `hydroid`, `outletid`, `station` avec `19/19` valeurs identiques ;
- le frontend consomme le GeoJSON actif, pas la table SQL.

RISQUE :

- faible ;
- export cree et runtime deja couvert par des sources actives equivalentes.

Decision :

- `EXPORTER PUIS SUPPRIMER`

### 5. `audit.swat_entity_map_backup_2026`

OBJET :

- `audit.swat_entity_map_backup_2026`

TYPE :

- `table`

LIGNES :

- `38`

TAILLE :

- `16 kB`

RUNTIME :

- `NON`

BACKEND :

- `NON`

SCRIPTS :

- `NON`

VUES DEPENDANTES :

- `0`

FK :

- `0`

TRIGGERS :

- `0`

SOURCE ACTIVE EQUIVALENTE :

- `core.swat_entity_map`

PREUVE DE REMPLACEMENT :

- meme couverture structurelle : `38` lignes archive, `38` lignes actives ;
- meme couverture `entity_type + swat_code` : `38` correspondances ;
- mais seulement `2/38` lignes pointent vers la meme cible (`subbasin_id / reach_id / station_id`) ;
- backup = `gis_match`, `confidence 0.90` ;
- actif = `manual`, `confidence 1.00`.

RISQUE :

- la table garde un etat pre-correction du mapping SWAT ;
- elle n'est pas remplaçable par la table active actuelle.

Decision :

- `A VALIDER`

### 6. `audit.swat_output_archive_rch`

OBJET :

- `audit.swat_output_archive_rch`

TYPE :

- `table`

LIGNES :

- `345510`

TAILLE :

- `169 MB`

RUNTIME :

- `NON`

BACKEND :

- `NON`

SCRIPTS :

- `NON`

VUES DEPENDANTES :

- `0`

FK :

- `0`

TRIGGERS :

- `0`

SOURCE ACTIVE EQUIVALENTE :

- `access.rch_results`

PREUVE DE REMPLACEMENT :

- archive = scenario unique `SWAT_OUTPUT` ;
- runtime actif = `8` scenarios et aucun `SWAT_OUTPUT` ;
- archive `time_step = NULL`, `table_source = NULL` ;
- actif = `{daily, monthly, yearly}` et `table_source = {rch}` ;
- test de recouvrement vers `access.rch_results` scenario `etat_actuel/monthly` : `20923 / 345510` lignes seulement retrouvent un match partiel.

RISQUE :

- l'archive contient un jeu brut SWAT non remplace par la table active normalisee.

Decision :

- `CONSERVER`

### 7. `audit.swat_output_archive_sub`

OBJET :

- `audit.swat_output_archive_sub`

TYPE :

- `table`

LIGNES :

- `345510`

TAILLE :

- `100 MB`

RUNTIME :

- `NON`

BACKEND :

- `NON`

SCRIPTS :

- `NON`

VUES DEPENDANTES :

- `0`

FK :

- `0`

TRIGGERS :

- `0`

SOURCE ACTIVE EQUIVALENTE :

- `access.sub_results`

PREUVE DE REMPLACEMENT :

- archive = scenario unique `SWAT_OUTPUT` ;
- runtime actif = `8` scenarios et aucun `SWAT_OUTPUT` ;
- archive `time_step = NULL`, `table_source = NULL` ;
- actif = `{daily, monthly, yearly}` et `table_source = {sub}` ;
- test de recouvrement vers `access.sub_results` scenario `etat_actuel/monthly` : `0 / 345510` match sur l'echantillon de cles/valeurs teste.

RISQUE :

- la table garde un archive brut unique non remplace dans le runtime.

Decision :

- `CONSERVER`

### 8. `gis.reach_shapes_backup_20260422_144537`

OBJET :

- `gis.reach_shapes_backup_20260422_144537`

TYPE :

- `table`

LIGNES :

- `33`

TAILLE :

- `688 kB`

RUNTIME :

- `NON`

BACKEND :

- `NON`

SCRIPTS :

- `NON`

VUES DEPENDANTES :

- `0`

FK :

- `0`

TRIGGERS :

- `0`

SOURCE ACTIVE EQUIVALENTE :

- `gis.reach_shapes`

PREUVE DE REMPLACEMENT :

- backup = `33` lignes ;
- `reach_code` backup = `{112..284}` ;
- runtime `reach_code` = `{1..19}` ;
- aucun recouvrement direct des codes runtime ;
- le backup n'est pas identique a `audit.gis_reach_shapes_backup_2026` ;
- il s'agit d'un autre snapshot geometrique legacy.

RISQUE :

- suppression prematurée d'un snapshot ancien a codification differente, non reconstruit par le runtime.

Decision :

- `A VALIDER`

## Synthese des decisions

Objets supprimables apres export :

- `audit.nv_stream`

Objets a conserver :

- `audit.swat_output_archive_rch`
- `audit.swat_output_archive_sub`

Objets a validation :

- `audit.gis_reach_shapes_backup_2026`
- `audit.gis_subbasin_shapes_backup_2026`
- `audit.nv_limite`
- `audit.swat_entity_map_backup_2026`
- `gis.reach_shapes_backup_20260422_144537`

## Baseline apres export

Snapshot apres export :

- `Support_Doc_HD/Phase Nettoyage et Stabilisation/LOT2_POSTCHECK_BASELINE_20260811_1249.json`

Comparaison avant/apres export :

- `COMPARE STATUS: WARNING`

Detail :

- aucune regression sur :
  - scenarios
  - reaches runtime
  - subbasins runtime
  - stations protegees
  - timeseries
  - groupes SWAT
  - couches protegees
- warnings uniquement sur des `payload hash` API :
  - `spatial_reaches`
  - `data_scan_summary`
  - `data_scan_periods_global`

Verification metier post-export :

- `core.timeseries = 383`
- `core.measurements = 3773400`
- stations visibles = `75`
- scenarios visibles = `9`
- reaches runtime = `19`
- subbasins runtime = `19`

Verdict baseline :

- `WARNING`

Interpretation :

- aucune donnee fonctionnelle n'a bouge ;
- warnings limites a des variations de hash de payload API ;
- aucune ecriture PostgreSQL n'a ete faite.

## Conclusion

Objets analyses :

- `audit.gis_reach_shapes_backup_2026`
- `audit.gis_subbasin_shapes_backup_2026`
- `audit.nv_limite`
- `audit.nv_stream`
- `audit.swat_entity_map_backup_2026`
- `audit.swat_output_archive_rch`
- `audit.swat_output_archive_sub`
- `gis.reach_shapes_backup_20260422_144537`

Exports crees :

- `8`

Exports valides :

- `8 / 8`

Objets supprimables apres export :

- `audit.nv_stream`

Objets a conserver :

- `audit.swat_output_archive_rch`
- `audit.swat_output_archive_sub`

Objets a validation :

- `audit.gis_reach_shapes_backup_2026`
- `audit.gis_subbasin_shapes_backup_2026`
- `audit.nv_limite`
- `audit.swat_entity_map_backup_2026`
- `gis.reach_shapes_backup_20260422_144537`

PostgreSQL modifie :

- `NON`

Baseline :

- `WARNING`

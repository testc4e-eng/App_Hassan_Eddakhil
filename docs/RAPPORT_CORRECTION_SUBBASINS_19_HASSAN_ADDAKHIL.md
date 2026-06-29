# Rapport de correction - Sous-bassins Hassan Addakhil

Date : 2026-06-24

## Objectif

Corriger l'incohérence entre les sources métier SIG/SWAT et l'application Hydro-Data Intelligence :

- Source Access/QGIS : 19 sous-bassins et 19 tronçons.
- Application avant correction : 33 sous-bassins/tronçons affichés.
- Résultat attendu : toutes les couches spatiales et les filtres métier doivent utiliser les 19 entités validées.

## Sources vérifiées

Répertoire source :

`D:\3- Projets\hassanAddakhil\hassan dakhil\Shp`

Fichiers identifiés :

- `Limite de sous bassin\NV-limite.shp`
  - Type : polygones de sous-bassins
  - Projection source : EPSG:32630
  - Nombre d'entités : 19
  - Champ métier principal : `Subbasin`

- `Reseau hydrographique\NV-Stream.shp`
  - Type : lignes/tronçons hydrographiques
  - Projection source : EPSG:32630
  - Nombre d'entités : 19
  - Champ métier principal : `Subbasin`

## Sauvegardes réalisées

Dump SQL externe :

`D:\3- Projets\hassanAddakhil\.codex-artifacts\backups\subbasins_19_fix_20260624_173304.sql`

Tables de sauvegarde internes :

- `gis.subbasin_shapes_backup_before_19_fix` : 33 lignes
- `gis.reach_shapes_backup_before_19_fix` : 33 lignes
- `core.subbasins_backup_before_19_fix` : 0 ligne
- `core.reaches_backup_before_19_fix` : 0 ligne
- `core.station_subbasin_map_backup_before_19_fix` : 5 lignes
- `core.station_reach_map_backup_before_19_fix` : 15 lignes
- `core.swat_entity_map_backup_before_19_fix` : 0 ligne

## Corrections base de données

Les shapefiles source ont été convertis en GeoJSON puis importés dans :

- `staging.nv_limite_import` : 19 lignes
- `staging.nv_stream_import` : 19 lignes

Tables corrigées :

- `gis.subbasin_shapes` : remplacée par les 19 sous-bassins de `NV-limite.shp`
- `gis.reach_shapes` : remplacée par les 19 tronçons de `NV-Stream.shp`
- `core.subbasins` : recréée avec 19 sous-bassins
- `core.reaches` : recréée avec 19 tronçons

Contraintes corrigées :

- Suppression de `uq_subbasins_catchment`, qui empêchait plusieurs sous-bassins dans un même bassin.
- Suppression de `uq_reaches_catchment`, qui empêchait plusieurs tronçons dans un même bassin.

Relations stations/tronçons :

- `core.station_reach_map` : 10 relations actives conservées.
- 5 anciennes relations pointant vers des tronçons inexistants après correction ont été désactivées.

## Correction backend

Fichier modifié :

`D:\3- Projets\hassanAddakhil\hydro_Hassan dakhil\backend\src\services\erosionSwatSeries.service.ts`

Correction appliquée :

- Les disponibilités SWAT/sédiments sont maintenant filtrées sur les entités spatiales valides.
- Les `swat_sub_*` sont acceptés uniquement si l'ID existe dans `gis.subbasin_shapes`.
- Les `swat_rch_*` sont acceptés uniquement si l'ID existe dans `gis.reach_shapes`.
- Les listes de filtres ne proposent donc plus `swat_sub_20..33` ni `swat_rch_20..33`.

Cette correction ne supprime pas les données SWAT historiques brutes ; elle empêche seulement l'interface d'exposer des entités sans géométrie validée.

## Validation base de données

Résultat après correction :

| Table | Count | Min ID | Max ID |
|---|---:|---:|---:|
| `gis.subbasin_shapes` | 19 | 1 | 19 |
| `gis.reach_shapes` | 19 | 1 | 19 |
| `core.subbasins` | 19 | 1 | 19 |
| `core.reaches` | 19 | 1 | 19 |

## Validation API

Endpoints testés :

- `GET /api/v1/spatial/project-hassan-addakhil`
  - stations : 5
  - bassins : 1
  - sous-bassins : 19
  - tronçons : 19
  - barrages : 1

- `GET /api/v1/spatial/subbasins?catchmentId=1`
  - sous-bassins : 19

- `GET /api/v1/spatial/reaches?catchmentId=1`
  - tronçons : 19

- `GET /api/v1/solid-yield/subbasins`
  - sous-bassins : 19
  - max `subbasin_id` : 19

- `GET /api/v1/catalog/availability?module=erosion`
  - aucun `swat_sub_*` ou `swat_rch_*` avec ID supérieur à 19

- `GET /api/v1/catalog/availability?module=hydro`
  - aucun `swat_sub_*` ou `swat_rch_*` avec ID supérieur à 19

- `GET /api/v1/solid-yield/availability`
  - aucun `swat_sub_*` ou `swat_rch_*` avec ID supérieur à 19

## Builds et redéploiement

Backend :

- `npm run build` : OK
- `docker compose up -d --build backend` : OK
- conteneur `hydro-hassan-dev1606-backend` : healthy

Frontend :

- `npx tsc -b --pretty false` : OK
- `npx vite build --logLevel info` : OK

Warnings frontend non bloquants :

- `caniuse-lite` ancien.
- Certains chunks dépassent 500 kB après minification.

## Cause racine

La base active utilisait des couches spatiales et/ou imports SWAT générant 33 entités, alors que les sources métier validées dans Access/QGIS contiennent 19 sous-bassins et 19 tronçons.

En plus, les catalogues de filtres sédiments s'appuyaient sur les stations virtuelles SWAT sans vérifier leur présence dans les couches spatiales officielles. Cela permettait à l'interface de proposer des entités inexistantes sur la carte.

## Résultat final

Le module Analyse Spatiale et les filtres liés aux sédiments sont maintenant alignés sur la source officielle :

- 19 sous-bassins
- 19 tronçons hydrographiques
- 5 stations projet
- 1 barrage
- aucun sous-bassin/tronçon fantôme 20-33 dans les endpoints testés

## Point d'attention

Le schéma `staging` a été recréé pendant l'import temporaire des shapefiles. Les tables de production et les sauvegardes critiques ont été conservées, mais si le projet utilisait des tables temporaires historiques dans `staging`, elles devront être régénérées depuis leurs scripts d'import.

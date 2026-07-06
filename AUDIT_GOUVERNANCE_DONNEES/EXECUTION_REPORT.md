# Rapport d'exécution — Résolution du mismatch 33 → 19 entités

## Date d'exécution

2026-07-03

## Objectif

Résoudre le mismatch entre l'ancien découpage à 33 sous-bassins/reaches et le nouveau découpage métier à 19 entités, et corriger le mapping SWAT ↔ entités métier.

## Actions réalisées

### 1. Backup complet de la base

```sh
pg_dump -U postgres -Fc hydro_hd_1714 > backups/hydro_hd_rollback_20260703_143152.dump
```

Taille : 391 MB

### 2. Import des nouveaux shapefiles

- Source : `data HD/Shp/Limite de sous bassin/NV-limite.shp` (19 polygones, EPSG:32630)
- Source : `data HD/Shp/Reseau hydrographique/NV-Stream.shp` (19 lignes, EPSG:32630)
- Destination : `audit.nv_limite` et `audit.nv_stream` (EPSG:4326)
- Méthode : `ogr2ogr -f PGDump -t_srs EPSG:4326 -nlt PROMOTE_TO_MULTI`

Validation post-import :
- `audit.nv_limite` : 19 entités, 17 valides initialement (2 self-intersections corrigées par `ST_MakeValid`)
- `audit.nv_stream` : 19 entités, toutes valides

### 3. Remplacement des couches SIG actives

Script exécuté : `AUDIT_GOUVERNANCE_DONNEES/sql_proposed/11_replace_geometry_19.sql`

Résultat :
- `gis.subbasin_shapes` : 19 entités valides
- `gis.reach_shapes` : 19 entités valides
- Sauvegardes créées dans `audit.gis_subbasin_shapes_backup_2026` et `audit.gis_reach_shapes_backup_2026`

### 4. Correction de `core.swat_entity_map`

Script exécuté : `AUDIT_GOUVERNANCE_DONNEES/sql_proposed/13_fix_swat_entity_map.sql`

Résultat :
- 19 mappings `sub` : `swat_code` 1..19 → `subbasin_id` 1..19
- 19 mappings `rch` : `swat_code` 1..19 → `subbasin_id` 1..19, `reach_id` 1..19
- Sauvegarde créée dans `audit.swat_entity_map_backup_2026`

### 5. Rafraîchissement des caches

Script exécuté : `AUDIT_GOUVERNANCE_DONNEES/sql_proposed/12_refresh_api_catalogs.sql`

Vues matérialisées rafraîchies :
- `api.mv_scenario_catalog`
- `api.mv_dashboard_catchment_counts`
- `api.mv_dashboard_reservoir_counts`

`ANALYZE` exécuté sur `gis.subbasin_shapes`, `gis.reach_shapes`, `core.swat_entity_map`.

## Vérifications

### Base de données

| Couche | Entités | Valides | IDs |
|--------|--------:|--------:|-----|
| `gis.subbasin_shapes` | 19 | 19 | 1..19 |
| `gis.reach_shapes` | 19 | 19 | 1..19 |
| `audit.nv_limite` | 19 | 19 | 1..19 |
| `audit.nv_stream` | 19 | 19 | 1..19 |

### Interface utilisateur

- Connexion réussie avec `c4e.africa@gmail.com`.
- Module **Analyse Spatiale** affiche désormais :
  - **19 sous-bassin(s)**
  - **19 tronçon(s)**
- La carte thématique **Vulnérabilité sous-bassins** se charge sans erreur console ni erreur backend.

### Logs backend

Aucune erreur 500 détectée après les modifications.

## Captures d'écran

- `AUDIT_GOUVERNANCE_DONNEES/screenshots/after_fix_19_entities.png` : interface affichant 19 sous-bassins / 19 tronçons
- `AUDIT_GOUVERNANCE_DONNEES/screenshots/thematic_map_test.png` : test de la carte thématique

## Fichiers créés/modifiés

- `AUDIT_GOUVERNANCE_DONNEES/sql_proposed/11_replace_geometry_19.sql`
- `AUDIT_GOUVERNANCE_DONNEES/sql_proposed/12_refresh_api_catalogs.sql`
- `AUDIT_GOUVERNANCE_DONNEES/sql_proposed/13_fix_swat_entity_map.sql`
- `AUDIT_GOUVERNANCE_DONNEES/screenshots/after_fix_19_entities.png`
- `AUDIT_GOUVERNANCE_DONNEES/screenshots/thematic_map_test.png`
- `backups/hydro_hd_rollback_20260703_143152.dump`
- Tables en base : `audit.nv_limite`, `audit.nv_stream`, `audit.gis_subbasin_shapes_backup_2026`, `audit.gis_reach_shapes_backup_2026`, `audit.swat_entity_map_backup_2026`

## Reste à faire

1. **Index de performance** : créer les index sur `access.sub_results` / `access.rch_results` pour améliorer les temps de réponse des cartes thématiques (script `20_create_performance_indexes.sql`).
2. **Mappings stations** : regénérer `core.station_subbasin_map` et `core.station_reach_map` pour couvrir les 19 entités (script `14_regenerate_station_maps.sql`).
3. **Scénario `SWAT_OUTPUT`** : archiver puis supprimer les 293 160 lignes orphelines (script `10_archive_swat_output.sql`).
4. **Nettoyage** : supprimer les tables de backup internes après une période de stabilité.

## Rollback

En cas de problème :

```sh
pg_restore --clean --if-exists --no-owner --no-privileges \
  -h localhost -p 5436 -U postgres -d hydro_hd_1714 \
  backups/hydro_hd_rollback_20260703_143152.dump
```

Ou rollback ciblé des couches SIG :

```sql
BEGIN;
TRUNCATE gis.subbasin_shapes;
INSERT INTO gis.subbasin_shapes SELECT * FROM audit.gis_subbasin_shapes_backup_2026;
TRUNCATE gis.reach_shapes;
INSERT INTO gis.reach_shapes SELECT * FROM audit.gis_reach_shapes_backup_2026;
COMMIT;
```

## Index de performance créés

Date d'exécution : 2026-07-03

### Index créés

| Schéma | Table | Index | Taille |
|--------|-------|-------|--------:|
| access | sub_results | idx_sub_results_scenario_sub_code_period | 73 MB |
| access | rch_results | idx_rch_results_scenario_sub_code_period | 73 MB |
| access | hru_results | idx_hru_results_scenario_sub_code_period | 488 kB |
| core | measurements | idx_measurements_ts_datetime | 42 MB |
| core | measurement_batches | idx_measurement_batches_ts_datetime | 31 MB |
| gis | subbasin_shapes | idx_subbasin_shapes_subbasin_id | 16 kB |
| gis | reach_shapes | idx_reach_shapes_reach_id | 16 kB |
| core | station_subbasin_map | idx_station_subbasin_map_subbasin_active | 16 kB |
| core | station_reach_map | idx_station_reach_map_reach_active | 16 kB |

### Impact mesuré

| Requête | Avant index | Après index |
|---------|------------:|------------:|
| Série temporelle par sous-bassin (`sub_code = 8`) | Non mesuré (seq scan) | **3,7 ms** |
| Carte thématique globale (vulnérabilité) | 687 ms | 410 ms (avec colonne `year`) |

> **Note** : la requête thématique globale reste coûteuse car elle agrège ~600k lignes. L'optimiseur choisit un seq scan parallèle car le volume filtré est important. Les index apportent un gain majeur sur les requêtes ponctuelles (séries temporelles par entité) qui sont les plus fréquentes dans l'interface.

### Recommandation complémentaire

Pour accélérer davantage la carte thématique globale, envisager de pré-calculer les agrégats annuels dans une table dédiée ou une vue matérialisée, par exemple :

```sql
CREATE TABLE access.sub_results_annual AS
SELECT scenario_code, sub_code, year, SUM(syld_t_ha) AS yearly_sum
FROM access.sub_results
GROUP BY scenario_code, sub_code, year;

CREATE INDEX idx_sub_results_annual_scenario_sub_year
  ON access.sub_results_annual (scenario_code, sub_code, year);
```

## Suppression du scénario SWAT_OUTPUT

Date d'exécution : 2026-07-03

### Actions réalisées

- Archivage des 345 510 lignes `sub_results` dans `audit.swat_output_archive_sub`
- Archivage des 345 510 lignes `rch_results` dans `audit.swat_output_archive_rch`
- Suppression des lignes dans `access.sub_results` et `access.rch_results`
- `VACUUM ANALYZE` sur les deux tables
- Rafraîchissement de `api.mv_scenario_catalog`

### Scénarios restants

| Scénario | `sub_results` | `rch_results` |
|----------|--------------:|--------------:|
| `etat_actuel` | 596 790 | 596 790 |
| `scenario_1` | 551 | 551 |
| `scenario_2` | 551 | 551 |
| `scenario_3` | 551 | 551 |
| `scenario_4` | 551 | 551 |
| `ssp126` | 747 707 | 747 707 |
| `ssp245` | 747 707 | 747 707 |
| `ssp585` | 747 707 | 747 707 |

> Aucun scénario actif n'a été impacté.

## Regénération des mappings stations / entités

Date d'exécution : 2026-07-03

### Source

Colonne `Station` du shapefile `NV-Stream.shp` :
- Tronçon 8  → Zaouia sidi hamza  → Station Zaouiet Sidi Hamza (id 3)
- Tronçon 10 → M'zizel            → Station MZIZEL (id 24)
- Tronçon 15 → Foum Tillicht      → Station FOUM TILLICHT (id 2)
- Tronçon 17 → Foum Zaabel        → Station FOUM ZAABEL (id 29)
- Tronçon 19 → Bge hassan addakhil → Station AVAL BARAGE HASSAN ADDAKHEL (id 35)

### Résultat

| Mapping | Lignes | IDs couverts |
|---------|--------:|--------------|
| `core.station_subbasin_map` | 5 | {8, 10, 15, 17, 19} |
| `core.station_reach_map` | 5 | {8, 10, 15, 17, 19} |

> Principe appliqué : **tronçon n° = sous-bassin n°**, conformément au shapefile métier.

### Sauvegardes

- `audit.station_subbasin_map_backup_2026`
- `audit.station_reach_map_backup_2026`

## Test final interface

- Aucune erreur console détectée.
- Endpoint `/spatial/subbasins/:subbasinId/timeseries` fonctionne (ex: sous-bassin 9, scénario `etat_actuel`, variable `SYLDT`, 29 points retournés).
- Capture finale : `AUDIT_GOUVERNANCE_DONNEES/screenshots/final_dashboard_19_entities.png`

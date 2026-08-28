# MIGRATION_ABHGZR_TO_HYDRO_HD

Migration controlee des donnees depuis `bdd_erosion_abhgzr_20-04-26` (source) vers `hydro_hd` (cible), sans action destructive.

## Objectif

- Inspecter les 2 bases (structure, types, PK/FK, indexes, spatial, volumes).
- Cartographier source -> cible.
- Charger en 3 couches: `staging raw` -> `staging normalize` -> `core/ref`.
- Garantir un mode `dry-run`, un mode `commit`, des logs et des controles qualite.

## Principes de securite

- Aucun `DROP`, `TRUNCATE`, `DELETE` massif.
- Aucun `ALTER` destructif.
- Chargement idempotent (`INSERT ... WHERE NOT EXISTS` / `ON CONFLICT DO NOTHING` selon cas).
- Journalisation par batch (`load_batch_id`).
- Scripts rejouables et transactionnels.

## Arborescence

- `00_inventory`: inventaires JSON des 2 bases (captures d'inspection).
- `01_inspection_sql`: SQL d'audit structurel.
- `02_mapping`: mapping source -> cible.
- `03_staging_sql`: creation/normalisation des tables staging.
- `04_etl_python`: ETL source -> staging (dry-run/commit).
- `05_load_sql`: chargement final staging -> core/ref.
- `06_quality_checks`: controles pre/post chargement.
- `07_reports`: rapports d'inspection, plan et risques.
- `08_safe_run`: exemples env + runbook.

## Execution recommandee

1. Lire `07_reports/PLAN_MIGRATION.md`.
2. Renseigner `08_safe_run/.env.migration.example` dans un vrai `.env.migration`.
3. Lancer les inspections SQL (`01_inspection_sql/*`).
4. Creer la couche staging (`03_staging_sql/01_create_staging_tables.sql`).
5. Lancer ETL en `dry-run`, puis en `commit`.
6. Executer normalisation staging (`03_staging_sql/02_normalize_staging.sql`).
7. Executer chargement final (`05_load_sql/*`) dans l'ordre.
8. Executer controles qualite (`06_quality_checks/*`).

## Hypotheses cle

- Base source: schema unique `public`, donnees meteo/hydro et entites admin/barrage/station.
- Base cible: modele metier cible dans `core/ref/geo/gis/public`.
- Les vues `public.*` et `api.*` de la cible consomment principalement `core.*`.
- `core.*` est structurellement pret mais encore faiblement alimente.

## Limites connues

- Les geometries source ont des metadonnees SRID parfois non strictes (`geometry_columns` peut remonter `0`).
- Plusieurs mesures source mensuelles sont en texte (conversion numerique necessaire avec regles de qualite).
- Le schema `old_hd` de la cible depend du FDW `old_hd_srv` (connectivite externe potentiellement indisponible).


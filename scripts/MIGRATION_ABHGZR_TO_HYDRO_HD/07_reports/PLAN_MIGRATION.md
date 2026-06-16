# PLAN_MIGRATION

## Strategie generale (3 couches)

1. Atterrissage `staging.raw_*`
2. Normalisation `staging.norm_*`
3. Chargement final `ref/core` (sans ecraser l'existant)

## Ordre d'execution recommande

1. Inspection:
- `01_inspection_sql/01_inventory.sql`
- `01_inspection_sql/02_columns_pk_fk_indexes.sql`
- `01_inspection_sql/03_geometry_srid_quality.sql`
- `01_inspection_sql/04_view_dependencies.sql`

2. Initialisation staging:
- `03_staging_sql/01_create_staging_tables.sql`

3. ETL source -> staging raw:
- `04_etl_python/etl_migrate_abhgzr.py --dry-run`
- puis `--commit` apres validation

4. Normalisation:
- `03_staging_sql/02_normalize_staging.sql`

5. Chargement final:
- `05_load_sql/01_load_ref_communes.sql`
- `05_load_sql/02_load_core_entities.sql`
- `05_load_sql/03_load_ref_properties_model_run.sql`
- `05_load_sql/04_load_core_timeseries_measurements.sql`
- `05_load_sql/05_load_core_bathymetry.sql`

6. Qualite/validation:
- `06_quality_checks/01_preload_checks.sql`
- `06_quality_checks/02_postload_checks.sql`
- `06_quality_checks/03_reconciliation_checks.sql`

## Regles de migration

- Aucun ecrasement des donnees existantes.
- Idempotence par cles metier.
- Toute insertion tracee avec `load_batch_id`.
- `dry-run` obligatoire avant `commit`.
- Unites et types normalises avant insertion dans `core`.

## Mapping metier cible

- Communes source -> `ref.communes`
- Stations source -> `core.stations`
- Barrages source -> `core.reservoirs`
- Bassin source -> `core.catchments`
- Bathymetrie source -> `core.reservoir_bathymetry`
- Mesures source -> couple `core.timeseries` + `core.measurements`

## Gestion temporelle

- Journalier:
- `date_jr` -> `core.measurements.datetime`
- `time_step = 'day'`
- Mensuel:
- `date_m` -> `core.measurements.datetime`
- `time_step = 'month'`

## Gestion geometrique

- Staging: stockage brut en `geom_ewkt` texte.
- Normalisation: `ST_GeomFromEWKT` ou fallback `ST_SetSRID(...,26191)` puis `ST_Transform(...,4326)`.
- Validation: `ST_IsValid`, controle SRID, taux null geometrie.

## Ambiguites documentees (et non inventees)

- `core.catchments` attend `area_m2` et `dam_name` (pas fournis explicitement par source).
- Les mesures mensuelles/lachers sont texte en source -> parsing prudent requis.
- `core.model_runs` peut etre vide; un run `OBSERVED` est cree de facon idempotente si absent.


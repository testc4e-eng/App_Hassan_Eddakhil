# Intégration SWAT -> hydro_hd_1714

Ce dossier contient les livrables d'intégration SWAT non destructifs.

## Contenu

- `01_sql/01_create_swat_infra.sql`  
  Crée les tables techniques (`staging.swat_*`, `core.data_batches`, `core.measurement_batches`, `core.swat_entity_map`).
- `01_sql/02_quality_checks.sql`  
  Contrôles de cohérence post-chargement.
- `02_python/swat_etl_pipeline.py`  
  ETL Python (lecture MDB -> staging -> normalisation -> chargement).
- `03_docs/MAPPING_SWAT_TO_HYDRO.md`  
  Mapping métier SWAT vers entités DB.

## Principe

1. Importer MDB vers `access.rch_results` et `access.sub_results`.
2. Charger brut dans `staging.swat_rch_raw` / `staging.swat_sub_raw`.
3. Normaliser dans `staging.swat_rch_norm` / `staging.swat_sub_norm`.
4. Alimenter `core.timeseries` / `core.measurements` en `source_type='simulated'`.
5. Tracer par `batch_id` dans `core.data_batches` + `core.measurement_batches`.

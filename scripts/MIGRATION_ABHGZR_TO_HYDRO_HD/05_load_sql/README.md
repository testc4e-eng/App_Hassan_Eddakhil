# 05_load_sql

Ordre d'execution:

1. `01_load_ref_communes.sql`
2. `02_load_core_entities.sql`
3. `03_load_ref_properties_model_run.sql`
4. `04_load_core_timeseries_measurements.sql`
5. `05_load_core_bathymetry.sql`

Scripts parametrables avec `:load_batch_id` (psql).

Exemple:

```sql
\set load_batch_id '20260420T1500Z_abhgzr'
\i 01_load_ref_communes.sql
```


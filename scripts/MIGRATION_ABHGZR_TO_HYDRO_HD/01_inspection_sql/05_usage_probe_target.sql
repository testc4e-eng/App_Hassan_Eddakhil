-- 05_usage_probe_target.sql
-- Usage: run on target DB (read-only).
-- Purpose: verify presence/population of objects used by backend/frontend.

WITH required_objects(schema_name, object_name) AS (
  VALUES
    ('public','stations'),
    ('public','catchments'),
    ('public','timeseries'),
    ('public','measurements'),
    ('public','reservoirs'),
    ('public','landcover'),
    ('public','v_ts_catalog_enriched'),
    ('public','module_properties'),
    ('api','v_catalog_series'),
    ('api','v_catalog_properties'),
    ('api','v_catalog_stations'),
    ('api','v_series_stats'),
    ('core','stations'),
    ('core','catchments'),
    ('core','timeseries'),
    ('core','measurements'),
    ('gis','subbasin_shapes'),
    ('gis','reach_shapes'),
    ('gis','meteo_stations')
)
SELECT r.schema_name,
       r.object_name,
       CASE WHEN c.oid IS NULL THEN 'missing' ELSE 'present' END AS status,
       c.relkind
FROM required_objects r
LEFT JOIN pg_class c
  ON c.relname = r.object_name
LEFT JOIN pg_namespace n
  ON n.oid = c.relnamespace
 AND n.nspname = r.schema_name
ORDER BY r.schema_name, r.object_name;


-- 04_view_dependencies.sql
-- Usage: run on target DB (read-only).

SELECT src_ns.nspname AS src_schema,
       src.relname AS src_view,
       dep_ns.nspname AS dep_schema,
       dep.relname AS dep_object,
       dep.relkind AS dep_relkind
FROM pg_depend d
JOIN pg_rewrite rw ON rw.oid = d.objid
JOIN pg_class src ON src.oid = rw.ev_class
JOIN pg_namespace src_ns ON src_ns.oid = src.relnamespace
JOIN pg_class dep ON dep.oid = d.refobjid
JOIN pg_namespace dep_ns ON dep_ns.oid = dep.relnamespace
WHERE src.relkind IN ('v', 'm')
  AND src_ns.nspname NOT IN ('pg_catalog', 'information_schema')
ORDER BY src_ns.nspname, src.relname, dep_ns.nspname, dep.relname;

-- Focus views used by app:
SELECT src_ns.nspname AS src_schema,
       src.relname AS src_view,
       dep_ns.nspname AS dep_schema,
       dep.relname AS dep_object
FROM pg_depend d
JOIN pg_rewrite rw ON rw.oid = d.objid
JOIN pg_class src ON src.oid = rw.ev_class
JOIN pg_namespace src_ns ON src_ns.oid = src.relnamespace
JOIN pg_class dep ON dep.oid = d.refobjid
JOIN pg_namespace dep_ns ON dep_ns.oid = dep.relnamespace
WHERE src.relkind IN ('v', 'm')
  AND (
    (src_ns.nspname = 'public' AND src.relname IN ('stations','catchments','timeseries','measurements','v_ts_catalog_enriched'))
    OR
    (src_ns.nspname = 'api' AND src.relname LIKE 'v_catalog_%')
  )
ORDER BY src_ns.nspname, src.relname, dep_ns.nspname, dep.relname;


-- 01_inventory.sql
-- Usage: run on source OR target DB (read-only).

SELECT current_database() AS db, current_user AS usr, version() AS version, now() AS inspected_at;

SELECT pg_database_size(current_database()) AS db_bytes,
       pg_size_pretty(pg_database_size(current_database())) AS db_size_pretty;

SELECT extname, extversion
FROM pg_extension
ORDER BY extname;

SELECT nspname AS schema_name
FROM pg_namespace
WHERE nspname NOT IN ('pg_catalog', 'information_schema')
  AND nspname NOT LIKE 'pg_toast%'
ORDER BY nspname;

SELECT n.nspname AS schema_name,
       c.relname AS relation_name,
       c.relkind,
       CASE c.relkind
         WHEN 'r' THEN 'table'
         WHEN 'p' THEN 'partitioned table'
         WHEN 'f' THEN 'foreign table'
         WHEN 'v' THEN 'view'
         WHEN 'm' THEN 'materialized view'
         WHEN 'S' THEN 'sequence'
         ELSE c.relkind::text
       END AS relation_kind,
       c.reltuples::bigint AS est_rows,
       pg_total_relation_size(c.oid) AS total_bytes,
       pg_size_pretty(pg_total_relation_size(c.oid)) AS total_size_pretty
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname NOT IN ('pg_catalog', 'information_schema')
  AND n.nspname NOT LIKE 'pg_toast%'
  AND c.relkind IN ('r', 'p', 'f', 'v', 'm', 'S')
ORDER BY n.nspname, c.relkind, c.relname;


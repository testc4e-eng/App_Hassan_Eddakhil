-- 06_semantic_columns.sql
-- Detect likely key/date/value/code columns by naming pattern.

SELECT table_schema,
       table_name,
       column_name,
       data_type,
       CASE
         WHEN column_name = 'id' OR column_name LIKE '%_id' THEN 'identifier'
         WHEN column_name LIKE '%code%' THEN 'code'
         WHEN column_name LIKE '%date%' OR column_name LIKE '%time%' THEN 'datetime'
         WHEN data_type IN ('smallint','integer','bigint','numeric','real','double precision','decimal') THEN 'numeric_candidate'
         WHEN udt_name IN ('geometry','geography') THEN 'geometry'
         ELSE 'other'
       END AS semantic_hint
FROM information_schema.columns
WHERE table_schema NOT IN ('pg_catalog','information_schema')
  AND table_schema NOT LIKE 'pg_toast%'
ORDER BY table_schema, table_name, ordinal_position;


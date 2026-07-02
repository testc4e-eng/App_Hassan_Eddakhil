-- 02_columns_pk_fk_indexes.sql
-- Usage: run on source OR target DB (read-only).

SELECT c.table_schema AS schema_name,
       c.table_name,
       c.ordinal_position,
       c.column_name,
       c.data_type,
       c.udt_name,
       format_type(a.atttypid, a.atttypmod) AS formatted_type,
       c.is_nullable,
       c.column_default
FROM information_schema.columns c
JOIN pg_class cls ON cls.relname = c.table_name
JOIN pg_namespace n ON n.nspname = c.table_schema AND n.oid = cls.relnamespace
JOIN pg_attribute a ON a.attrelid = cls.oid
                   AND a.attname = c.column_name
                   AND a.attnum > 0
                   AND NOT a.attisdropped
WHERE c.table_schema NOT IN ('pg_catalog', 'information_schema')
  AND c.table_schema NOT LIKE 'pg_toast%'
ORDER BY c.table_schema, c.table_name, c.ordinal_position;

SELECT n.nspname AS schema_name,
       c.relname AS table_name,
       con.conname,
       con.contype,
       CASE con.contype
         WHEN 'p' THEN 'primary key'
         WHEN 'f' THEN 'foreign key'
         WHEN 'u' THEN 'unique'
         WHEN 'c' THEN 'check'
         WHEN 'x' THEN 'exclusion'
         ELSE con.contype::text
       END AS constraint_kind,
       pg_get_constraintdef(con.oid, true) AS definition
FROM pg_constraint con
JOIN pg_class c ON c.oid = con.conrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname NOT IN ('pg_catalog', 'information_schema')
  AND n.nspname NOT LIKE 'pg_toast%'
ORDER BY n.nspname, c.relname, con.contype, con.conname;

SELECT schemaname AS schema_name,
       tablename AS table_name,
       indexname,
       indexdef
FROM pg_indexes
WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
ORDER BY schemaname, tablename, indexname;


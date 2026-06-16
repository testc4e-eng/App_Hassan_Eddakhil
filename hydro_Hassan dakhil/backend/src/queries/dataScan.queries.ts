export const NON_SYSTEM_SCHEMA_FILTER = `
  n.nspname NOT IN ('pg_catalog', 'information_schema')
  AND n.nspname NOT LIKE 'pg_toast%'
  AND n.nspname NOT LIKE 'pg_temp_%'
`;

export const SUMMARY_BASE_QUERY = `
WITH user_objects AS (
  SELECT n.nspname AS schema_name, c.relkind
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE ${NON_SYSTEM_SCHEMA_FILTER}
),
obj_counts AS (
  SELECT
    COUNT(*) FILTER (WHERE relkind = 'r')::int AS tables_count,
    COUNT(*) FILTER (WHERE relkind = 'v')::int AS views_count,
    COUNT(*) FILTER (WHERE relkind = 'S')::int AS sequences_count
  FROM user_objects
),
constraints AS (
  SELECT
    COUNT(*) FILTER (WHERE contype = 'p')::int AS pk_count,
    COUNT(*) FILTER (WHERE contype = 'f')::int AS fk_count
  FROM pg_constraint
),
rows_est AS (
  SELECT COALESCE(SUM(GREATEST(c.reltuples, 0)), 0)::bigint AS total_estimated_rows
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE c.relkind = 'r' AND ${NON_SYSTEM_SCHEMA_FILTER}
),
geometry_tables AS (
  SELECT COUNT(DISTINCT (f_table_schema || '.' || f_table_name))::int AS geometry_tables_count
  FROM public.geometry_columns
),
columns_total AS (
  SELECT COUNT(*)::int AS total_columns
  FROM information_schema.columns
  WHERE table_schema NOT IN ('pg_catalog', 'information_schema')
)
SELECT
  current_database() AS database_name,
  pg_size_pretty(pg_database_size(current_database())) AS database_size,
  (SELECT tables_count FROM obj_counts) AS tables_count,
  (SELECT views_count FROM obj_counts) AS views_count,
  (SELECT sequences_count FROM obj_counts) AS sequences_count,
  (SELECT pk_count FROM constraints) AS pk_count,
  (SELECT fk_count FROM constraints) AS fk_count,
  (SELECT total_estimated_rows FROM rows_est) AS total_estimated_rows,
  (SELECT geometry_tables_count FROM geometry_tables) AS geometry_tables_count,
  (SELECT total_columns FROM columns_total) AS total_columns
`;

export const SCHEMAS_QUERY = `
SELECT nspname
FROM pg_namespace n
WHERE ${NON_SYSTEM_SCHEMA_FILTER}
ORDER BY nspname
`;

export const EXTENSIONS_QUERY = `
SELECT extname
FROM pg_extension
ORDER BY extname
`;

export const TABLES_OVERVIEW_QUERY = `
WITH base AS (
  SELECT
    t.table_schema AS schema_name,
    t.table_name,
    t.table_type
  FROM information_schema.tables t
  WHERE t.table_schema NOT IN ('pg_catalog', 'information_schema')
),
col_stats AS (
  SELECT
    c.table_schema AS schema_name,
    c.table_name,
    COUNT(*)::int AS columns_count,
    COUNT(*) FILTER (
      WHERE c.data_type IN ('date', 'timestamp without time zone', 'timestamp with time zone')
         OR c.udt_name IN ('date', 'timestamp', 'timestamptz')
    )::int AS date_columns_count
  FROM information_schema.columns c
  WHERE c.table_schema NOT IN ('pg_catalog', 'information_schema')
  GROUP BY c.table_schema, c.table_name
),
rows_est AS (
  SELECT
    n.nspname AS schema_name,
    c.relname AS table_name,
    GREATEST(c.reltuples, 0)::bigint AS estimated_rows
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE c.relkind IN ('r', 'v') AND ${NON_SYSTEM_SCHEMA_FILTER}
),
pk_fk AS (
  SELECT
    tc.table_schema AS schema_name,
    tc.table_name,
    COUNT(*) FILTER (WHERE tc.constraint_type = 'PRIMARY KEY')::int AS pk_count,
    COUNT(*) FILTER (WHERE tc.constraint_type = 'FOREIGN KEY')::int AS fk_count
  FROM information_schema.table_constraints tc
  WHERE tc.table_schema NOT IN ('pg_catalog', 'information_schema')
  GROUP BY tc.table_schema, tc.table_name
),
geom AS (
  SELECT
    f_table_schema AS schema_name,
    f_table_name AS table_name,
    COUNT(*)::int AS geometry_columns_count,
    COALESCE(array_agg(DISTINCT srid) FILTER (WHERE srid IS NOT NULL), '{}'::int[]) AS srid_list,
    COALESCE(array_agg(DISTINCT type) FILTER (WHERE type IS NOT NULL), '{}'::text[]) AS geometry_types
  FROM public.geometry_columns
  GROUP BY f_table_schema, f_table_name
)
SELECT
  b.schema_name,
  b.table_name,
  b.table_type,
  COALESCE(r.estimated_rows, 0)::bigint AS estimated_rows,
  COALESCE(c.columns_count, 0)::int AS columns_count,
  (COALESCE(g.geometry_columns_count, 0) > 0) AS has_geometry,
  (COALESCE(c.date_columns_count, 0) > 0) AS has_date,
  COALESCE(p.pk_count, 0)::int AS pk_count,
  COALESCE(p.fk_count, 0)::int AS fk_count,
  COALESCE(g.srid_list, '{}'::int[]) AS srid_list,
  COALESCE(g.geometry_types, '{}'::text[]) AS geometry_types
FROM base b
LEFT JOIN col_stats c
  ON c.schema_name = b.schema_name
 AND c.table_name = b.table_name
LEFT JOIN rows_est r
  ON r.schema_name = b.schema_name
 AND r.table_name = b.table_name
LEFT JOIN pk_fk p
  ON p.schema_name = b.schema_name
 AND p.table_name = b.table_name
LEFT JOIN geom g
  ON g.schema_name = b.schema_name
 AND g.table_name = b.table_name
`;

export const FK_RELATIONS_QUERY = `
SELECT
  src_ns.nspname AS source_schema,
  src.relname AS source_table,
  src_att.attname AS source_column,
  tgt_ns.nspname AS target_schema,
  tgt.relname AS target_table,
  tgt_att.attname AS target_column
FROM pg_constraint c
JOIN pg_class src ON src.oid = c.conrelid
JOIN pg_namespace src_ns ON src_ns.oid = src.relnamespace
JOIN pg_class tgt ON tgt.oid = c.confrelid
JOIN pg_namespace tgt_ns ON tgt_ns.oid = tgt.relnamespace
JOIN LATERAL unnest(c.conkey) WITH ORDINALITY AS src_keys(attnum, ord) ON true
JOIN LATERAL unnest(c.confkey) WITH ORDINALITY AS tgt_keys(attnum, ord) ON tgt_keys.ord = src_keys.ord
JOIN pg_attribute src_att ON src_att.attrelid = src.oid AND src_att.attnum = src_keys.attnum
JOIN pg_attribute tgt_att ON tgt_att.attrelid = tgt.oid AND tgt_att.attnum = tgt_keys.attnum
WHERE c.contype = 'f'
  AND src_ns.nspname NOT IN ('pg_catalog', 'information_schema')
  AND tgt_ns.nspname NOT IN ('pg_catalog', 'information_schema')
ORDER BY source_schema, source_table, source_column
`;

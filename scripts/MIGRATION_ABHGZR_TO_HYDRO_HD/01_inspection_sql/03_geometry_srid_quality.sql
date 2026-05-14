-- 03_geometry_srid_quality.sql
-- Usage: run on source OR target DB (read-only).
-- For heavy tables, run per schema/table if needed.

SELECT f_table_schema AS schema_name,
       f_table_name AS table_name,
       f_geometry_column AS geom_col,
       type AS geom_type,
       srid
FROM geometry_columns
ORDER BY f_table_schema, f_table_name, f_geometry_column;

-- Generic quality probe (read-only):
-- Replace <schema>, <table>, <geom_col> and execute.
--
-- SELECT '<schema>' AS schema_name,
--        '<table>' AS table_name,
--        '<geom_col>' AS geom_col,
--        COUNT(*)::bigint AS total_rows,
--        COUNT(*) FILTER (WHERE "<geom_col>" IS NOT NULL)::bigint AS non_null_rows,
--        COUNT(*) FILTER (WHERE "<geom_col>" IS NOT NULL AND NOT ST_IsValid("<geom_col>"::geometry))::bigint AS invalid_rows,
--        MIN(CASE WHEN "<geom_col>" IS NOT NULL THEN ST_SRID("<geom_col>"::geometry) END)::int AS srid_min,
--        MAX(CASE WHEN "<geom_col>" IS NOT NULL THEN ST_SRID("<geom_col>"::geometry) END)::int AS srid_max,
--        MIN(CASE WHEN "<geom_col>" IS NOT NULL THEN GeometryType("<geom_col>"::geometry) END)::text AS geom_type
-- FROM "<schema>"."<table>";

-- Functions and triggers
CREATE OR REPLACE FUNCTION public.api_get_ts_agg(p_station_id integer, p_run_id integer, p_module text, p_grain text)
 RETURNS TABLE(ts_id integer, property_id integer, property_name text, unit text, period_start timestamp with time zone, value double precision)
 LANGUAGE sql
 STABLE
AS $function$
  WITH selected_ts AS (
    SELECT
      e.ts_id, e.property_id, e.property_name, e.unit, e.standard_name,
      r.agg_method
    FROM public.v_ts_catalog_enriched e
    JOIN public.v_property_agg_rule r ON r.property_id = e.property_id
    WHERE e.station_id = p_station_id
      AND e.run_id     = p_run_id
      AND r.module_code = p_module
  ),
  base AS (
    SELECT
      st.ts_id,
      st.property_id,
      st.property_name,
      st.unit,
      st.agg_method,
      CASE
        WHEN p_grain = 'monthly' THEN date_trunc('month', m.datetime)
        WHEN p_grain = 'annual'  THEN date_trunc('year',  m.datetime)
        ELSE date_trunc('month', m.datetime)
      END AS period_start,
      m.datetime,
      m.value
    FROM selected_ts st
    JOIN public.measurements m ON m.ts_id = st.ts_id
    -- option qualité (à adapter à ta logique)
    WHERE (m.quality_flag IS NULL OR m.quality_flag = 0)
  )
  SELECT
    b.ts_id,
    b.property_id,
    b.property_name,
    b.unit,
    b.period_start,
    CASE
      WHEN b.agg_method = 'sum'  THEN sum(b.value)
      WHEN b.agg_method = 'avg'  THEN avg(b.value)
      WHEN b.agg_method = 'last' THEN (array_agg(b.value ORDER BY b.datetime DESC))[1]
      ELSE avg(b.value)
    END AS value
  FROM base b
  GROUP BY b.ts_id, b.property_id, b.property_name, b.unit, b.period_start, b.agg_method
  ORDER BY b.property_name, b.ts_id, b.period_start;
$function$;

CREATE OR REPLACE FUNCTION public.api_get_ts_catalog(p_station_id integer, p_run_id integer, p_module text)
 RETURNS TABLE(ts_id integer, property_id integer, property_name text, unit text, standard_name text, source_type text, time_step text, n_points bigint, start_date timestamp with time zone, end_date timestamp with time zone, agg_method text)
 LANGUAGE sql
 STABLE
AS $function$
  SELECT
    e.ts_id,
    e.property_id,
    e.property_name,
    e.unit,
    e.standard_name,
    e.source_type,
    e.time_step::text,
    COALESCE(e.n_points, 0) AS n_points,
    e.start_date,
    e.end_date,
    r.agg_method
  FROM public.v_ts_catalog_enriched e
  JOIN public.v_property_agg_rule r ON r.property_id = e.property_id
  WHERE e.station_id = p_station_id
    AND e.run_id     = p_run_id
    AND r.module_code = p_module
  ORDER BY e.property_name, e.ts_id;
$function$;

CREATE OR REPLACE FUNCTION public.to_numeric_clean(txt text)
 RETURNS numeric
 LANGUAGE sql
 IMMUTABLE
AS $function$
    SELECT NULLIF(
               regexp_replace(
                   replace(trim(txt), ',', '.'),
                   '[^0-9\.\-]+',      -- on garde chiffres, point, signe -
                   '',
                   'g'
               ),
               ''
           )::numeric;
$function$;



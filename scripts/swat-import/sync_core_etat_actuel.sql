BEGIN;

DO $$
DECLARE
  v_next_id integer;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM ref.observed_properties WHERE standard_name = 'SWAT_FLOW_M3S'
  ) THEN
    SELECT COALESCE(MAX(property_id), 0) + 1 INTO v_next_id FROM ref.observed_properties;
    INSERT INTO ref.observed_properties(property_id, name, unit, standard_name, description)
    VALUES (
      v_next_id,
      'SWAT Flow Out',
      'm3/s',
      'SWAT_FLOW_M3S',
      'SWAT simulated flow out at reach outlet (FLOW_OUT).'
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM ref.observed_properties WHERE standard_name = 'SWAT_SED_TONS'
  ) THEN
    SELECT COALESCE(MAX(property_id), 0) + 1 INTO v_next_id FROM ref.observed_properties;
    INSERT INTO ref.observed_properties(property_id, name, unit, standard_name, description)
    VALUES (
      v_next_id,
      'SWAT Sediment Out',
      'tons',
      'SWAT_SED_TONS',
      'SWAT simulated sediment out at reach outlet (SED_OUT).'
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM ref.observed_properties WHERE standard_name = 'SWAT_SYLDT_HA'
  ) THEN
    SELECT COALESCE(MAX(property_id), 0) + 1 INTO v_next_id FROM ref.observed_properties;
    INSERT INTO ref.observed_properties(property_id, name, unit, standard_name, description)
    VALUES (
      v_next_id,
      'SWAT Sediment Yield',
      't/ha',
      'SWAT_SYLDT_HA',
      'SWAT simulated sediment yield by subbasin (SYLDT_HA).'
    );
  END IF;
END $$;

WITH ctx AS (
  SELECT
    (SELECT run_id FROM core.model_runs WHERE scenario_code = 'etat_actuel' ORDER BY run_id LIMIT 1) AS run_id,
    (SELECT property_id FROM ref.observed_properties WHERE standard_name = 'SWAT_FLOW_M3S' LIMIT 1) AS flow_pid,
    (SELECT property_id FROM ref.observed_properties WHERE standard_name = 'SWAT_SED_TONS' LIMIT 1) AS sed_pid,
    (SELECT property_id FROM ref.observed_properties WHERE standard_name = 'SWAT_SYLDT_HA' LIMIT 1) AS syldt_pid
)
DELETE FROM core.measurements m
USING core.timeseries t, core.stations s, ctx
WHERE m.ts_id = t.ts_id
  AND t.run_id = ctx.run_id
  AND t.source_type = 'simulated'
  AND t.property_id IN (ctx.flow_pid, ctx.sed_pid, ctx.syldt_pid)
  AND t.station_id = s.station_id
  AND (s.station_code LIKE 'swat_rch_%' OR s.station_code LIKE 'swat_sub_%');

WITH ctx AS (
  SELECT
    (SELECT run_id FROM core.model_runs WHERE scenario_code = 'etat_actuel' ORDER BY run_id LIMIT 1) AS run_id,
    (SELECT property_id FROM ref.observed_properties WHERE standard_name = 'SWAT_FLOW_M3S' LIMIT 1) AS flow_pid,
    (SELECT property_id FROM ref.observed_properties WHERE standard_name = 'SWAT_SED_TONS' LIMIT 1) AS sed_pid,
    (SELECT property_id FROM ref.observed_properties WHERE standard_name = 'SWAT_SYLDT_HA' LIMIT 1) AS syldt_pid
)
DELETE FROM core.timeseries t
USING core.stations s, ctx
WHERE t.run_id = ctx.run_id
  AND t.source_type = 'simulated'
  AND t.property_id IN (ctx.flow_pid, ctx.sed_pid, ctx.syldt_pid)
  AND t.station_id = s.station_id
  AND (s.station_code LIKE 'swat_rch_%' OR s.station_code LIKE 'swat_sub_%');

WITH ctx AS (
  SELECT
    (SELECT run_id FROM core.model_runs WHERE scenario_code = 'etat_actuel' ORDER BY run_id LIMIT 1) AS run_id,
    (SELECT property_id FROM ref.observed_properties WHERE standard_name = 'SWAT_FLOW_M3S' LIMIT 1) AS flow_pid,
    (SELECT property_id FROM ref.observed_properties WHERE standard_name = 'SWAT_SED_TONS' LIMIT 1) AS sed_pid,
    (SELECT property_id FROM ref.observed_properties WHERE standard_name = 'SWAT_SYLDT_HA' LIMIT 1) AS syldt_pid
),
ts_candidates AS (
  SELECT DISTINCT
    st.station_id,
    ctx.flow_pid AS property_id,
    ctx.run_id
  FROM access.rch_results r
  CROSS JOIN ctx
  JOIN core.stations st
    ON st.station_code = ('swat_rch_' || r.sub_code::text)
  WHERE r.scenario_code = 'etat_actuel'
    AND r.flow_out_cms IS NOT NULL
  UNION ALL
  SELECT DISTINCT
    st.station_id,
    ctx.sed_pid AS property_id,
    ctx.run_id
  FROM access.rch_results r
  CROSS JOIN ctx
  JOIN core.stations st
    ON st.station_code = ('swat_rch_' || r.sub_code::text)
  WHERE r.scenario_code = 'etat_actuel'
    AND r.sed_out_tons IS NOT NULL
  UNION ALL
  SELECT DISTINCT
    st.station_id,
    ctx.syldt_pid AS property_id,
    ctx.run_id
  FROM access.sub_results s
  CROSS JOIN ctx
  JOIN core.stations st
    ON st.station_code = ('swat_sub_' || s.sub_code::text)
  WHERE s.scenario_code = 'etat_actuel'
    AND s.syld_t_ha IS NOT NULL
),
mx AS (
  SELECT COALESCE(MAX(ts_id), 0) AS max_id
  FROM core.timeseries
)
INSERT INTO core.timeseries(ts_id, station_id, property_id, run_id, source_type, time_step, created_at)
SELECT
  mx.max_id + ROW_NUMBER() OVER (ORDER BY c.station_id, c.property_id),
  c.station_id,
  c.property_id,
  c.run_id,
  'simulated',
  'daily',
  now()
FROM ts_candidates c
CROSS JOIN mx;

WITH ctx AS (
  SELECT
    (SELECT run_id FROM core.model_runs WHERE scenario_code = 'etat_actuel' ORDER BY run_id LIMIT 1) AS run_id,
    (SELECT property_id FROM ref.observed_properties WHERE standard_name = 'SWAT_FLOW_M3S' LIMIT 1) AS flow_pid,
    (SELECT property_id FROM ref.observed_properties WHERE standard_name = 'SWAT_SED_TONS' LIMIT 1) AS sed_pid,
    (SELECT property_id FROM ref.observed_properties WHERE standard_name = 'SWAT_SYLDT_HA' LIMIT 1) AS syldt_pid
),
flow_rows AS (
  SELECT
    t.ts_id,
    (r.period_date::timestamp AT TIME ZONE 'UTC') AS datetime,
    r.flow_out_cms::double precision AS value
  FROM access.rch_results r
  CROSS JOIN ctx
  JOIN core.stations st
    ON st.station_code = ('swat_rch_' || r.sub_code::text)
  JOIN core.timeseries t
    ON t.station_id = st.station_id
   AND t.property_id = ctx.flow_pid
   AND t.run_id = ctx.run_id
   AND t.source_type = 'simulated'
   AND t.time_step = 'daily'
  WHERE r.scenario_code = 'etat_actuel'
    AND r.flow_out_cms IS NOT NULL
    AND r.period_date IS NOT NULL
),
sed_rows AS (
  SELECT
    t.ts_id,
    (r.period_date::timestamp AT TIME ZONE 'UTC') AS datetime,
    r.sed_out_tons::double precision AS value
  FROM access.rch_results r
  CROSS JOIN ctx
  JOIN core.stations st
    ON st.station_code = ('swat_rch_' || r.sub_code::text)
  JOIN core.timeseries t
    ON t.station_id = st.station_id
   AND t.property_id = ctx.sed_pid
   AND t.run_id = ctx.run_id
   AND t.source_type = 'simulated'
   AND t.time_step = 'daily'
  WHERE r.scenario_code = 'etat_actuel'
    AND r.sed_out_tons IS NOT NULL
    AND r.period_date IS NOT NULL
),
syldt_rows AS (
  SELECT
    t.ts_id,
    (s.period_date::timestamp AT TIME ZONE 'UTC') AS datetime,
    s.syld_t_ha::double precision AS value
  FROM access.sub_results s
  CROSS JOIN ctx
  JOIN core.stations st
    ON st.station_code = ('swat_sub_' || s.sub_code::text)
  JOIN core.timeseries t
    ON t.station_id = st.station_id
   AND t.property_id = ctx.syldt_pid
   AND t.run_id = ctx.run_id
   AND t.source_type = 'simulated'
   AND t.time_step = 'daily'
  WHERE s.scenario_code = 'etat_actuel'
    AND s.syld_t_ha IS NOT NULL
    AND s.period_date IS NOT NULL
),
all_rows AS (
  SELECT * FROM flow_rows
  UNION ALL
  SELECT * FROM sed_rows
  UNION ALL
  SELECT * FROM syldt_rows
)
INSERT INTO core.measurements(ts_id, datetime, value, quality_flag)
SELECT ts_id, datetime, value, NULL::smallint
FROM all_rows
ON CONFLICT (ts_id, datetime) DO UPDATE
SET value = EXCLUDED.value;

COMMIT;


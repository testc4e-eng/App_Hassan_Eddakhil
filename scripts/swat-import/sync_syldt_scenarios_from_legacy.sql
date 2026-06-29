BEGIN;

DO $$
DECLARE
  v_source_run_id integer;
  v_syldt_pid integer;
  v_next_run_id integer;
  v_target record;
  v_scenario_code text;
  v_scenario_name text;
BEGIN
  SELECT run_id
  INTO v_source_run_id
  FROM core.model_runs
  WHERE scenario_code = 'SWAT_OUTPUT_01'
  ORDER BY run_id
  LIMIT 1;

  IF v_source_run_id IS NULL THEN
    RAISE EXCEPTION 'Source run SWAT_OUTPUT_01 not found.';
  END IF;

  SELECT property_id
  INTO v_syldt_pid
  FROM ref.observed_properties
  WHERE standard_name = 'SWAT_SYLDT_HA'
  LIMIT 1;

  IF v_syldt_pid IS NULL THEN
    RAISE EXCEPTION 'Property SWAT_SYLDT_HA not found.';
  END IF;

  FOR v_target IN
    SELECT *
    FROM (VALUES
      ('ssp126', 'Scénario changement climatique SSP126'),
      ('ssp245', 'Scénario changement climatique SSP245'),
      ('ssp585', 'Scénario changement climatique SSP585'),
      ('scenario_1', 'Scénario changement spatial 1'),
      ('scenario_2', 'Scénario changement spatial 2'),
      ('scenario_3', 'Scénario changement spatial 3'),
      ('scenario_4', 'Scénario changement spatial 4')
    ) AS x(scenario_code, scenario_name)
  LOOP
    v_scenario_code := v_target.scenario_code;
    v_scenario_name := v_target.scenario_name;
    IF NOT EXISTS (
      SELECT 1 FROM core.model_runs WHERE scenario_code = v_scenario_code
    ) THEN
      SELECT COALESCE(MAX(run_id), 0) + 1
      INTO v_next_run_id
      FROM core.model_runs;

      INSERT INTO core.model_runs(run_id, scenario_code, scenario_name, description, is_observed)
      VALUES (
        v_next_run_id,
        v_scenario_code,
        v_scenario_name,
        'Imported simulated SYLDT_HA for 19 subbasins',
        false
      );
    END IF;
  END LOOP;

  WITH target_runs AS (
    SELECT run_id
    FROM core.model_runs
    WHERE scenario_code IN ('ssp126', 'ssp245', 'ssp585', 'scenario_1', 'scenario_2', 'scenario_3', 'scenario_4')
  ),
  target_ts AS (
    SELECT t.ts_id
    FROM core.timeseries t
    JOIN core.stations st ON st.station_id = t.station_id
    JOIN target_runs tr ON tr.run_id = t.run_id
    WHERE t.source_type = 'simulated'
      AND t.property_id = v_syldt_pid
      AND st.station_code LIKE 'swat_sub_%'
      AND EXISTS (
        SELECT 1
        FROM gis.subbasin_shapes sb
        WHERE sb.subbasin_id = NULLIF(replace(st.station_code, 'swat_sub_', ''), '')::int
      )
  )
  DELETE FROM core.measurements m
  USING target_ts x
  WHERE m.ts_id = x.ts_id;

  WITH target_runs AS (
    SELECT run_id
    FROM core.model_runs
    WHERE scenario_code IN ('ssp126', 'ssp245', 'ssp585', 'scenario_1', 'scenario_2', 'scenario_3', 'scenario_4')
  )
  DELETE FROM core.timeseries t
  USING core.stations st, target_runs tr
  WHERE t.run_id = tr.run_id
    AND t.source_type = 'simulated'
    AND t.property_id = v_syldt_pid
    AND t.station_id = st.station_id
    AND st.station_code LIKE 'swat_sub_%'
    AND EXISTS (
      SELECT 1
      FROM gis.subbasin_shapes sb
      WHERE sb.subbasin_id = NULLIF(replace(st.station_code, 'swat_sub_', ''), '')::int
    );

  WITH target_runs AS (
    SELECT run_id
    FROM core.model_runs
    WHERE scenario_code IN ('ssp126', 'ssp245', 'ssp585', 'scenario_1', 'scenario_2', 'scenario_3', 'scenario_4')
  ),
  source_ts AS (
    SELECT DISTINCT st.station_id, st.station_code
    FROM core.timeseries t
    JOIN core.stations st ON st.station_id = t.station_id
    WHERE t.run_id = v_source_run_id
      AND t.source_type = 'simulated'
      AND t.property_id = v_syldt_pid
      AND st.station_code LIKE 'swat_sub_%'
      AND EXISTS (
        SELECT 1
        FROM gis.subbasin_shapes sb
        WHERE sb.subbasin_id = NULLIF(replace(st.station_code, 'swat_sub_', ''), '')::int
      )
  ),
  candidates AS (
    SELECT tr.run_id, s.station_id
    FROM target_runs tr
    CROSS JOIN source_ts s
  ),
  mx AS (
    SELECT COALESCE(MAX(ts_id), 0) AS max_id
    FROM core.timeseries
  )
  INSERT INTO core.timeseries(ts_id, station_id, property_id, run_id, source_type, time_step, created_at)
  SELECT
    mx.max_id + ROW_NUMBER() OVER (ORDER BY c.run_id, c.station_id),
    c.station_id,
    v_syldt_pid,
    c.run_id,
    'simulated',
    'daily',
    now()
  FROM candidates c
  CROSS JOIN mx;

  WITH target_runs AS (
    SELECT run_id
    FROM core.model_runs
    WHERE scenario_code IN ('ssp126', 'ssp245', 'ssp585', 'scenario_1', 'scenario_2', 'scenario_3', 'scenario_4')
  ),
  source_values AS (
    SELECT
      st.station_code,
      m.datetime,
      m.value
    FROM core.measurements m
    JOIN core.timeseries t ON t.ts_id = m.ts_id
    JOIN core.stations st ON st.station_id = t.station_id
    WHERE t.run_id = v_source_run_id
      AND t.source_type = 'simulated'
      AND t.property_id = v_syldt_pid
      AND st.station_code LIKE 'swat_sub_%'
      AND EXISTS (
        SELECT 1
        FROM gis.subbasin_shapes sb
        WHERE sb.subbasin_id = NULLIF(replace(st.station_code, 'swat_sub_', ''), '')::int
      )
  ),
  target_ts AS (
    SELECT
      t.ts_id,
      st.station_code,
      t.run_id
    FROM core.timeseries t
    JOIN core.stations st ON st.station_id = t.station_id
    JOIN target_runs tr ON tr.run_id = t.run_id
    WHERE t.source_type = 'simulated'
      AND t.property_id = v_syldt_pid
      AND st.station_code LIKE 'swat_sub_%'
      AND EXISTS (
        SELECT 1
        FROM gis.subbasin_shapes sb
        WHERE sb.subbasin_id = NULLIF(replace(st.station_code, 'swat_sub_', ''), '')::int
      )
  )
  INSERT INTO core.measurements(ts_id, datetime, value, quality_flag)
  SELECT
    t.ts_id,
    s.datetime,
    s.value,
    NULL::smallint
  FROM target_ts t
  JOIN source_values s
    ON s.station_code = t.station_code
  ON CONFLICT (ts_id, datetime) DO UPDATE
  SET value = EXCLUDED.value;
END $$;

COMMIT;

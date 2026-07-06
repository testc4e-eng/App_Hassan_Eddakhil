-- Synchronize core.timeseries/core.measurements for scenario_1-4 Daily data
-- Run with psql -v scenario='scenario_1'

DO $$
DECLARE
  v_scenario text := current_setting('my.scenario');
  v_run_name text;
  v_run_id integer;
  v_batch_id text := 'MANUAL_SYNC_' || upper(v_scenario) || '_' || to_char(now(), 'YYYYMMDD_HH24MISS');
  v_flow_prop integer := 31;
  v_sed_prop integer := 32;
  v_syld_prop integer := 33;
  v_sub_station_id integer;
  v_rch_station_id integer;
  v_ts_id integer;
  v_count integer;
BEGIN
  -- Determine run name
  v_run_name := CASE v_scenario
    WHEN 'scenario_1' THEN 'Scénario 1 reboisement'
    WHEN 'scenario_2' THEN 'Scénario 2 reboisement'
    WHEN 'scenario_3' THEN 'Scénario 3 reboisement'
    WHEN 'scenario_4' THEN 'Scénario 4 reboisement'
    ELSE v_scenario
  END;

  -- Ensure model_run
  SELECT run_id INTO v_run_id
  FROM core.model_runs
  WHERE scenario_code = v_scenario
  LIMIT 1;

  IF v_run_id IS NULL THEN
    INSERT INTO core.model_runs (run_id, scenario_code, scenario_name, description, is_observed)
    SELECT COALESCE(MAX(run_id), 0) + 1, v_scenario, v_run_name,
           'SWAT simulated run (' || v_scenario || ')', false
    FROM core.model_runs
    RETURNING run_id INTO v_run_id;
  ELSE
    UPDATE core.model_runs
    SET scenario_name = v_run_name,
        description = 'SWAT simulated run (' || v_scenario || ')',
        is_observed = false
    WHERE run_id = v_run_id;
  END IF;

  -- Create data_batch
  INSERT INTO core.data_batches (batch_id, source, source_file, imported_at, status, row_count, run_id, scenario_code, notes)
  VALUES (v_batch_id, 'MANUAL_SYNC', 'fast_ingest_scenarios.py', now(), 'finished', 0, v_run_id, v_scenario, 'Direct core sync after Access ingestion')
  ON CONFLICT (batch_id) DO NOTHING;

  -- Create synthetic stations and timeseries for subbasins (19 subbasins × 1 variable SYLDT)
  FOR i IN 1..19 LOOP
    -- Ensure station
    SELECT station_id INTO v_sub_station_id
    FROM core.stations
    WHERE station_code = 'swat_sub_' || i;

    IF v_sub_station_id IS NULL THEN
      INSERT INTO core.stations (station_id, station_code, name, type_station, station_type_code, catchment_id)
      SELECT COALESCE(MAX(station_id), 0) + 1, 'swat_sub_' || i, 'SWAT subbasin ' || i, 'SWAT', 'SWAT_SUBBASIN', s.catchment_id
      FROM gis.subbasin_shapes s
      WHERE s.subbasin_id = i
      RETURNING station_id INTO v_sub_station_id;
    END IF;

    -- Ensure timeseries for SYLDT
    SELECT ts_id INTO v_ts_id
    FROM core.timeseries
    WHERE station_id = v_sub_station_id
      AND property_id = v_syld_prop
      AND run_id = v_run_id
      AND source_type = 'simulated'
      AND time_step = 'daily'
    LIMIT 1;

    IF v_ts_id IS NULL THEN
      INSERT INTO core.timeseries (ts_id, station_id, property_id, run_id, source_type, time_step, created_at)
      SELECT COALESCE(MAX(ts_id), 0) + 1, v_sub_station_id, v_syld_prop, v_run_id, 'simulated', 'daily', now()
      FROM core.timeseries
      RETURNING ts_id INTO v_ts_id;
    END IF;
  END LOOP;

  -- Create synthetic stations and timeseries for reaches (19 reaches × 2 variables FLOW, SED)
  FOR i IN 1..19 LOOP
    -- Ensure station
    SELECT station_id INTO v_rch_station_id
    FROM core.stations
    WHERE station_code = 'swat_rch_' || i;

    IF v_rch_station_id IS NULL THEN
      INSERT INTO core.stations (station_id, station_code, name, type_station, station_type_code, catchment_id, reach_id)
      SELECT COALESCE(MAX(station_id), 0) + 1, 'swat_rch_' || i, 'SWAT reach ' || i, 'SWAT', 'SWAT_REACH', r.catchment_id, r.reach_id
      FROM gis.reach_shapes r
      WHERE r.reach_id = i
      RETURNING station_id INTO v_rch_station_id;
    END IF;

    -- Ensure timeseries for FLOW
    SELECT ts_id INTO v_ts_id
    FROM core.timeseries
    WHERE station_id = v_rch_station_id
      AND property_id = v_flow_prop
      AND run_id = v_run_id
      AND source_type = 'simulated'
      AND time_step = 'daily'
    LIMIT 1;

    IF v_ts_id IS NULL THEN
      INSERT INTO core.timeseries (ts_id, station_id, property_id, run_id, source_type, time_step, created_at)
      SELECT COALESCE(MAX(ts_id), 0) + 1, v_rch_station_id, v_flow_prop, v_run_id, 'simulated', 'daily', now()
      FROM core.timeseries
      RETURNING ts_id INTO v_ts_id;
    END IF;

    -- Ensure timeseries for SED
    SELECT ts_id INTO v_ts_id
    FROM core.timeseries
    WHERE station_id = v_rch_station_id
      AND property_id = v_sed_prop
      AND run_id = v_run_id
      AND source_type = 'simulated'
      AND time_step = 'daily'
    LIMIT 1;

    IF v_ts_id IS NULL THEN
      INSERT INTO core.timeseries (ts_id, station_id, property_id, run_id, source_type, time_step, created_at)
      SELECT COALESCE(MAX(ts_id), 0) + 1, v_rch_station_id, v_sed_prop, v_run_id, 'simulated', 'daily', now()
      FROM core.timeseries
      RETURNING ts_id INTO v_ts_id;
    END IF;
  END LOOP;

  -- Insert SYLDT measurements
  INSERT INTO core.measurements (ts_id, datetime, value, quality_flag)
  SELECT t.ts_id, (s.period_date::timestamp AT TIME ZONE 'UTC') AT TIME ZONE 'UTC', s.syld_t_ha, NULL::smallint
  FROM access.sub_results s
  JOIN core.timeseries t ON t.run_id = v_run_id AND t.source_type = 'simulated' AND t.time_step = 'daily'
  JOIN core.stations st ON st.station_id = t.station_id AND st.station_code = 'swat_sub_' || s.sub_code
  WHERE s.scenario_code = v_scenario
    AND s.time_step = 'daily'
    AND s.syld_t_ha IS NOT NULL
    AND s.period_date IS NOT NULL
    AND t.property_id = v_syld_prop
  ON CONFLICT (ts_id, datetime) DO UPDATE SET value = EXCLUDED.value;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE 'Inserted/updated % SYLDT measurements for %', v_count, v_scenario;

  -- Insert FLOW measurements
  INSERT INTO core.measurements (ts_id, datetime, value, quality_flag)
  SELECT t.ts_id, (r.period_date::timestamp AT TIME ZONE 'UTC') AT TIME ZONE 'UTC', r.flow_out_cms, NULL::smallint
  FROM access.rch_results r
  JOIN core.timeseries t ON t.run_id = v_run_id AND t.source_type = 'simulated' AND t.time_step = 'daily'
  JOIN core.stations st ON st.station_id = t.station_id AND st.station_code = 'swat_rch_' || r.sub_code
  WHERE r.scenario_code = v_scenario
    AND r.time_step = 'daily'
    AND r.flow_out_cms IS NOT NULL
    AND r.period_date IS NOT NULL
    AND t.property_id = v_flow_prop
  ON CONFLICT (ts_id, datetime) DO UPDATE SET value = EXCLUDED.value;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE 'Inserted/updated % FLOW measurements for %', v_count, v_scenario;

  -- Insert SED measurements
  INSERT INTO core.measurements (ts_id, datetime, value, quality_flag)
  SELECT t.ts_id, (r.period_date::timestamp AT TIME ZONE 'UTC') AT TIME ZONE 'UTC', r.sed_out_tons, NULL::smallint
  FROM access.rch_results r
  JOIN core.timeseries t ON t.run_id = v_run_id AND t.source_type = 'simulated' AND t.time_step = 'daily'
  JOIN core.stations st ON st.station_id = t.station_id AND st.station_code = 'swat_rch_' || r.sub_code
  WHERE r.scenario_code = v_scenario
    AND r.time_step = 'daily'
    AND r.sed_out_tons IS NOT NULL
    AND r.period_date IS NOT NULL
    AND t.property_id = v_sed_prop
  ON CONFLICT (ts_id, datetime) DO UPDATE SET value = EXCLUDED.value;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE 'Inserted/updated % SED measurements for %', v_count, v_scenario;

  -- Update data_batches row count
  UPDATE core.data_batches
  SET row_count = (
    SELECT COUNT(*) FROM core.measurements m
    JOIN core.timeseries t ON t.ts_id = m.ts_id
    WHERE t.run_id = v_run_id
  )
  WHERE batch_id = v_batch_id;

END $$;

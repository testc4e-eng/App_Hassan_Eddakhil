BEGIN;

CREATE TEMP TABLE tmp_target_scenarios_sub_8_10_15_17 (
  scenario_code text NOT NULL,
  sub_code integer NOT NULL,
  period_date date NOT NULL,
  year integer NOT NULL,
  mon integer NOT NULL,
  yyyyddd integer,
  flow_out_cms double precision,
  sed_out_tons double precision
) ON COMMIT DROP;

\copy tmp_target_scenarios_sub_8_10_15_17 (scenario_code, sub_code, period_date, year, mon, yyyyddd, flow_out_cms, sed_out_tons) FROM '.codex-artifacts/targeted_scenarios_sub_8_10_15_17.csv' CSV HEADER

-- Safety guard: this script must never touch Hassan Addakhel (sub_code = 19).
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM tmp_target_scenarios_sub_8_10_15_17
    WHERE sub_code = 19
  ) THEN
    RAISE EXCEPTION 'CSV contains forbidden sub_code 19 (Hassan Addakhel). Aborting.';
  END IF;
END $$;

-- Update only flow + temporal keys on existing rows.
UPDATE access.rch_results AS r
SET
  year = t.year,
  mon = t.mon,
  yyyyddd = t.yyyyddd,
  flow_out_cms = t.flow_out_cms,
  source_file = 'targeted_excel_replace_sub_8_10_15_17_2026-06-30'
FROM tmp_target_scenarios_sub_8_10_15_17 AS t
WHERE r.scenario_code = t.scenario_code
  AND r.sub_code = t.sub_code
  AND r.period_date = t.period_date
  AND t.sub_code IN (8, 10, 15, 17)
  AND t.scenario_code IN ('ssp126', 'ssp245', 'ssp585', 'scenario_1', 'scenario_2', 'scenario_3', 'scenario_4');

-- Insert only missing dates; keep SED untouched when a previous value exists for same key.
INSERT INTO access.rch_results (
  import_id,
  scenario_code,
  sub_code,
  period_date,
  year,
  mon,
  flow_out_cms,
  sed_out_tons,
  yyyyddd,
  source_file
)
SELECT
  COALESCE(
    (
      SELECT import_id
      FROM access.rch_results
      WHERE scenario_code = 'etat_actuel'
        AND sub_code = t.sub_code
      ORDER BY import_id DESC
      LIMIT 1
    ),
    (SELECT MAX(import_id) FROM access.import_runs)
  ) AS import_id,
  t.scenario_code,
  t.sub_code,
  t.period_date,
  t.year,
  t.mon,
  t.flow_out_cms,
  r_prev.sed_out_tons,
  t.yyyyddd,
  'targeted_excel_replace_sub_8_10_15_17_2026-06-30' AS source_file
FROM tmp_target_scenarios_sub_8_10_15_17 AS t
LEFT JOIN access.rch_results AS r_prev
  ON r_prev.scenario_code = t.scenario_code
  AND r_prev.sub_code = t.sub_code
  AND r_prev.period_date = t.period_date
WHERE t.sub_code IN (8, 10, 15, 17)
  AND t.scenario_code IN ('ssp126', 'ssp245', 'ssp585', 'scenario_1', 'scenario_2', 'scenario_3', 'scenario_4')
  AND NOT EXISTS (
    SELECT 1
    FROM access.rch_results AS r_exists
    WHERE r_exists.scenario_code = t.scenario_code
      AND r_exists.sub_code = t.sub_code
      AND r_exists.period_date = t.period_date
  );

COMMIT;

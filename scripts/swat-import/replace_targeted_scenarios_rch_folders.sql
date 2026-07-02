BEGIN;

CREATE TEMP TABLE tmp_target_scenarios_rch (
  scenario_code text NOT NULL,
  sub_code integer NOT NULL,
  period_date date NOT NULL,
  year integer NOT NULL,
  mon integer NOT NULL,
  yyyyddd integer,
  flow_out_cms double precision,
  sed_out_tons double precision
) ON COMMIT DROP;

\copy tmp_target_scenarios_rch (scenario_code, sub_code, period_date, year, mon, yyyyddd, flow_out_cms, sed_out_tons) FROM '.codex-artifacts/targeted_scenarios_rch_folders.csv' CSV HEADER

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM tmp_target_scenarios_rch WHERE sub_code = 19) THEN
    RAISE EXCEPTION 'CSV contains forbidden sub_code 19 (Hassan Addakhel / Reach 19). Aborting.';
  END IF;
END $$;

-- Replace scenario rows for Reach 1..18 only. SUB/Reach 19 is never touched.
DELETE FROM access.rch_results AS r
WHERE r.sub_code BETWEEN 1 AND 18
  AND r.scenario_code IN (
    'ssp126', 'ssp245', 'ssp585',
    'scenario_1', 'scenario_2', 'scenario_3', 'scenario_4'
  );

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
  (SELECT MAX(import_id) FROM access.import_runs) AS import_id,
  t.scenario_code,
  t.sub_code,
  t.period_date,
  t.year,
  t.mon,
  CASE WHEN t.sub_code IN (8, 10, 15, 17) THEN t.flow_out_cms ELSE NULL END AS flow_out_cms,
  t.sed_out_tons,
  t.yyyyddd,
  'targeted_rch_folders_2026-06-30' AS source_file
FROM tmp_target_scenarios_rch AS t
WHERE t.sub_code BETWEEN 1 AND 18
  AND t.scenario_code IN (
    'ssp126', 'ssp245', 'ssp585',
    'scenario_1', 'scenario_2', 'scenario_3', 'scenario_4'
  );

COMMIT;

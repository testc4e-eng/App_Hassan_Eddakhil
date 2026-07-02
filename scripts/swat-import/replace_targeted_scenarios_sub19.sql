BEGIN;

CREATE TEMP TABLE tmp_target_scenarios_sub19 (
  scenario_code text NOT NULL,
  sub_code integer NOT NULL,
  period_date date NOT NULL,
  year integer NOT NULL,
  mon integer NOT NULL,
  yyyyddd integer,
  flow_out_cms double precision,
  sed_out_tons double precision
) ON COMMIT DROP;

\copy tmp_target_scenarios_sub19 (scenario_code, sub_code, period_date, year, mon, yyyyddd, flow_out_cms, sed_out_tons) FROM '.codex-artifacts/targeted_scenarios_sub19.csv' CSV HEADER

DELETE FROM access.rch_results
WHERE sub_code = 19
  AND scenario_code IN ('ssp126', 'ssp245', 'ssp585', 'scenario_1', 'scenario_2', 'scenario_3', 'scenario_4');

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
        AND sub_code = 19
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
  t.sed_out_tons,
  t.yyyyddd,
  'targeted_excel_replace_2026-06-30' AS source_file
FROM tmp_target_scenarios_sub19 t;

COMMIT;

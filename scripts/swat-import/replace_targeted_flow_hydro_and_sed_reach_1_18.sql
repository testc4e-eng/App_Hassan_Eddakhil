BEGIN;

CREATE TEMP TABLE tmp_target_flow_sed (
  scenario_code text NOT NULL,
  sub_code integer NOT NULL,
  period_date date NOT NULL,
  year integer NOT NULL,
  mon integer NOT NULL,
  yyyyddd integer,
  flow_out_cms double precision,
  sed_out_tons double precision
) ON COMMIT DROP;

\copy tmp_target_flow_sed (scenario_code, sub_code, period_date, year, mon, yyyyddd, flow_out_cms, sed_out_tons) FROM '.codex-artifacts/targeted_flow_sed_sub_1_18.csv' CSV HEADER

-- Hard safety guards: never touch SUB 19 and only allowed scenarios.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM tmp_target_flow_sed
    WHERE sub_code = 19
  ) THEN
    RAISE EXCEPTION 'SUB 19 is forbidden for this import.';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM tmp_target_flow_sed
    WHERE scenario_code NOT IN ('ssp126', 'ssp245', 'ssp585', 'scenario_1', 'scenario_2', 'scenario_3', 'scenario_4')
  ) THEN
    RAISE EXCEPTION 'Unexpected scenario code found in import payload.';
  END IF;
END $$;

-- 1) Update existing rows (no deletion).
UPDATE access.rch_results AS r
SET
  year = t.year,
  mon = t.mon,
  yyyyddd = t.yyyyddd,
  flow_out_cms = CASE
    WHEN t.sub_code IN (8, 10, 15, 17) THEN t.flow_out_cms
    ELSE r.flow_out_cms
  END,
  sed_out_tons = CASE
    WHEN t.sub_code BETWEEN 1 AND 18 THEN t.sed_out_tons
    ELSE r.sed_out_tons
  END,
  source_file = 'targeted_flow_hydro_sub_8_10_15_17_sed_reach_1_18_2026-06-30'
FROM tmp_target_flow_sed AS t
WHERE r.scenario_code = t.scenario_code
  AND r.sub_code = t.sub_code
  AND r.period_date = t.period_date
  AND t.sub_code BETWEEN 1 AND 18
  AND t.scenario_code IN ('ssp126', 'ssp245', 'ssp585', 'scenario_1', 'scenario_2', 'scenario_3', 'scenario_4');

-- 2) Insert missing rows for SUB 1..18 with strict variable scope:
--    - FLOW populated only for hydrology subs 8/10/15/17
--    - SED populated for all subs 1..18
CREATE TEMP TABLE tmp_existing_keys AS
SELECT scenario_code, sub_code, period_date
FROM access.rch_results
WHERE sub_code BETWEEN 1 AND 18
  AND scenario_code IN ('ssp126', 'ssp245', 'ssp585', 'scenario_1', 'scenario_2', 'scenario_3', 'scenario_4');

CREATE INDEX idx_tmp_existing_keys
  ON tmp_existing_keys (scenario_code, sub_code, period_date);

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
  CASE
    WHEN t.sub_code IN (8, 10, 15, 17) THEN t.flow_out_cms
    ELSE NULL
  END AS flow_out_cms,
  t.sed_out_tons,
  t.yyyyddd,
  'targeted_flow_hydro_sub_8_10_15_17_sed_reach_1_18_2026-06-30' AS source_file
FROM tmp_target_flow_sed AS t
LEFT JOIN tmp_existing_keys AS k
  ON k.scenario_code = t.scenario_code
  AND k.sub_code = t.sub_code
  AND k.period_date = t.period_date
WHERE t.sub_code BETWEEN 1 AND 18
  AND t.scenario_code IN ('ssp126', 'ssp245', 'ssp585', 'scenario_1', 'scenario_2', 'scenario_3', 'scenario_4')
  AND k.scenario_code IS NULL;

COMMIT;

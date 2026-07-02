"""Import Données_Hydro RCH folder scenarios in batches (one scenario at a time)."""

from __future__ import annotations

import csv
import os
import subprocess
import sys
import tempfile
from pathlib import Path

SCENARIOS = [
    "ssp126",
    "ssp245",
    "ssp585",
    "scenario_1",
    "scenario_2",
    "scenario_3",
    "scenario_4",
]

BATCH_SQL = """
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

\\copy tmp_target_scenarios_rch (scenario_code, sub_code, period_date, year, mon, yyyyddd, flow_out_cms, sed_out_tons) FROM '{csv_path}' CSV HEADER

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM tmp_target_scenarios_rch WHERE sub_code = 19) THEN
    RAISE EXCEPTION 'CSV contains forbidden sub_code 19. Aborting.';
  END IF;
END $$;

DELETE FROM access.rch_results
WHERE sub_code BETWEEN 1 AND 18
  AND scenario_code = '{scenario_code}';

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
WHERE t.sub_code BETWEEN 1 AND 18;

COMMIT;
"""


def load_rows(csv_path: Path) -> list[dict[str, str]]:
    with csv_path.open("r", encoding="utf-8", newline="") as handle:
        return list(csv.DictReader(handle))


def write_rows(rows: list[dict[str, str]], out_path: Path) -> None:
    if not rows:
        return
    fieldnames = list(rows[0].keys())
    with out_path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)


def run_psql(sql_path: Path) -> None:
    env = os.environ.copy()
    env.setdefault("PGPASSWORD", "c4e@test@2025")
    cmd = [
        "psql",
        "-h",
        "localhost",
        "-p",
        "5435",
        "-U",
        "postgres",
        "-d",
        "hydro_hd_1714",
        "-v",
        "ON_ERROR_STOP=1",
        "-f",
        str(sql_path),
    ]
    print("Running:", " ".join(cmd))
    subprocess.run(cmd, check=True, env=env)


def main() -> int:
    if len(sys.argv) != 2:
        print("Usage: import_rch_folders_batch.py <targeted_scenarios_rch_folders.csv>")
        return 1

    source_csv = Path(sys.argv[1])
    if not source_csv.exists():
        print(f"Missing CSV: {source_csv}")
        return 2

    rows = load_rows(source_csv)
    by_scenario: dict[str, list[dict[str, str]]] = {code: [] for code in SCENARIOS}
    for row in rows:
        code = row["scenario_code"]
        if code in by_scenario:
            by_scenario[code].append(row)

    with tempfile.TemporaryDirectory(prefix="rch_import_") as tmpdir:
        tmp = Path(tmpdir)
        for scenario_code in SCENARIOS:
            batch_rows = by_scenario[scenario_code]
            if not batch_rows:
                print(f"SKIP {scenario_code}: no rows")
                continue

            batch_csv = tmp / f"{scenario_code}.csv"
            write_rows(batch_rows, batch_csv)
            sql_text = BATCH_SQL.format(
                csv_path=str(batch_csv).replace("\\", "/"),
                scenario_code=scenario_code,
            )
            sql_path = tmp / f"{scenario_code}.sql"
            sql_path.write_text(sql_text, encoding="utf-8")

            print(f"Importing {scenario_code}: {len(batch_rows)} rows")
            run_psql(sql_path)
            print(f"Done {scenario_code}")

    print("All scenario batches imported.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

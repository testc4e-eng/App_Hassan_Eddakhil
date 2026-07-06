#!/usr/bin/env python3
"""
Fast ingestion of SWATOutput.mdb Daily files for scenario_1-4.
Uses PowerShell + System.Data.OleDb for fast export, then psql COPY.
"""
import csv
import datetime
import os
import subprocess
import sys
from pathlib import Path

BASE_DIR = Path("C:/dev/Barrage-Hassan Dakhil/Hassan Addakhil/App_Hassan_Eddakhil-dev_ilh_0107")
MDB_ROOT = Path("C:/dev/Barrage-Hassan Dakhil/data HD/Modèle Bge HAD")
WORK_DIR = BASE_DIR / "scripts" / "swat-import" / "work_fast_ingest"
PGHOST = "127.0.0.1"
PGPORT = "5436"
PGDATABASE = "hydro_hd_1714"
PGUSER = "postgres"
PGPASSWORD = "local_test_password"

SCENARIOS = [
    ("scenario_1", "Scénario 1"),
    ("scenario_2", "Scénario 2"),
    ("scenario_3", "Scénario 3"),
    ("scenario_4", "Scénario 4"),
]

SUB_COLUMNS_MDB = [
    "SUB", "YEAR", "MON", "AREAkm2", "PRECIPmm", "SNOWMELTmm", "PETmm", "ETmm",
    "SWmm", "PERCmm", "SURQmm", "GW_Qmm", "WYLDmm", "SYLDt_ha", "ORGNkg_ha",
    "ORGPhg_ha", "NSURQkg_ha", "SOLPkg_ha", "SEDPkg_ha", "LAT_Qmm",
    "LAT_Q_NO3kg_ha", "GWNO3kg_ha", "CHOLAmic/L", "CBODUmg/L", "DOXQmg/L",
    "TNO3kg/ha", "YYYYDDD"
]

RCH_COLUMNS_MDB = [
    "SUB", "YEAR", "MON", "AREAkm2", "FLOW_INcms", "FLOW_OUTcms", "EVAPcms",
    "TLOSScms", "SED_INtons", "SED_OUTtons", "SEDCONCmg_kg", "ORGN_INkg",
    "ORGN_OUTkg", "ORGP_INkg", "ORGP_OUTkg", "NO3_INkg", "NO3_OUTkg",
    "NH4_INkg", "NH4_OUTkg", "NO2_INkg", "NO2_OUTkg", "MINP_INkg",
    "MINP_OUTkg", "CHLA_INkg", "CHLA_OUTkg", "CBOD_INkg", "CBOD_OUTkg",
    "DISOX_INkg", "DISOX_OUTkg", "SOLPST_INmg", "SOLPST_OUTmg", "SORPST_INmg",
    "SORPST_OUTmg", "REACTPTmg", "VOLPSTmg", "SETTLPST_mg", "RESUSP_PSTmg",
    "DIFUSEPSTmg", "REACHBEDPSTmg", "BURYPSTmg", "BED_PSTmg", "BACTP_OUTct",
    "BACTLP_OUTct", "CMETAL1kg", "CMETAL2kg", "CMETAL3kg", "TOT_Nkg", "TOT_Pkg",
    "NO3CONCmg/l", "WTMPdegc", "YYYYDDD"
]

SUB_COLUMNS_PG = [
    "scenario_code", "time_step", "sub_code", "period_date", "year", "mon",
    "area_km2", "precip_mm", "snowmelt_mm", "pet_mm", "et_mm", "sw_mm",
    "perc_mm", "surq_mm", "gw_q_mm", "wyld_mm", "syld_t_ha", "orgn_kg_ha",
    "orgp_hg_ha", "nsurq_kg_ha", "solp_kg_ha", "sedp_kg_ha", "lat_q_mm",
    "lat_q_no3_kg_ha", "gwno3_kg_ha", "chola_mic_l", "cbodu_mg_l", "doxq_mg_l",
    "tno3_kg_ha", "yyyyddd", "source_row_num", "source_file"
]

RCH_COLUMNS_PG = [
    "scenario_code", "time_step", "sub_code", "period_date", "year", "mon",
    "area_km2", "flow_in_cms", "flow_out_cms", "evap_cms", "tloss_cms",
    "sed_in_tons", "sed_out_tons", "sedconc_mg_kg", "orgn_in_kg", "orgn_out_kg",
    "orgp_in_kg", "orgp_out_kg", "no3_in_kg", "no3_out_kg", "nh4_in_kg",
    "nh4_out_kg", "no2_in_kg", "no2_out_kg", "minp_in_kg", "minp_out_kg",
    "chla_in_kg", "chla_out_kg", "cbod_in_kg", "cbod_out_kg", "disox_in_kg",
    "disox_out_kg", "solpst_in_mg", "solpst_out_mg", "sorpst_in_mg",
    "sorpst_out_mg", "reactpt_mg", "volpst_mg", "settlpst_mg", "resusppst_mg",
    "difusepst_mg", "reachbedpst_mg", "burypst_mg", "bed_pst_mg",
    "bactp_out_ct", "bactlp_out_ct", "cmetal1_kg", "cmetal2_kg", "cmetal3_kg",
    "tot_n_kg", "tot_p_kg", "no3conc_mg_l", "wtmp_deg_c", "yyyyddd",
    "source_row_num", "source_file"
]


def to_period_date(year_val: str, mon_val: str, yyyyddd_val: str) -> str:
    """Convert SWAT date fields to ISO date string."""
    if yyyyddd_val:
        yd = int(yyyyddd_val)
        year = yd // 1000
        doy = yd % 1000
        dt = datetime.date(year, 1, 1) + datetime.timedelta(days=doy - 1)
        return dt.isoformat()
    if year_val and mon_val:
        return f"{int(year_val):04d}-{int(mon_val):02d}-01"
    if year_val:
        return f"{int(year_val):04d}-01-01"
    return ""


def export_table(mdb_path: Path, table_name: str, output_csv: Path) -> int:
    """Export a table from Access MDB to pipe-delimited CSV using PowerShell."""
    script_path = BASE_DIR / "fast_export_table.ps1"
    cmd = [
        "powershell", "-NoProfile", "-ExecutionPolicy", "Bypass", "-File", str(script_path),
        "-MdbPath", str(mdb_path),
        "-TableName", table_name,
        "-OutputCsv", str(output_csv),
        "-Delimiter", "|",
    ]
    print(f"Exporting {table_name} from {mdb_path.name}...")
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        print("STDOUT:", result.stdout)
        print("STDERR:", result.stderr)
        raise RuntimeError(f"Export failed for {table_name}: {result.stderr}")
    print(result.stdout.strip())
    return 0


def transform_csv(input_csv: Path, output_csv: Path, scenario_code: str, table: str, columns_mdb: list, columns_pg: list):
    """Transform exported CSV to PostgreSQL target format."""
    print(f"Transforming {input_csv.name} -> {output_csv.name}")
    col_map = {name: idx for idx, name in enumerate(columns_mdb)}
    source_file = input_csv.name

    with open(input_csv, "r", encoding="utf-8-sig", newline="") as f_in, \
         open(output_csv, "w", encoding="utf-8", newline="") as f_out:
        reader = csv.reader(f_in, delimiter="|")
        writer = csv.writer(f_out, delimiter="|", quoting=csv.QUOTE_MINIMAL)

        header = next(reader)
        # Verify header
        if header != columns_mdb:
            # Some columns may have trailing spaces or different casing; normalize
            header = [h.strip() for h in header]

        writer.writerow(columns_pg)
        row_num = 0
        for row in reader:
            row_num += 1
            get = lambda name: row[col_map[name]] if name in col_map and col_map[name] < len(row) else ""
            year_val = get("YEAR")
            mon_val = get("MON")
            yyyyddd_val = get("YYYYDDD")
            period_date = to_period_date(year_val, mon_val, yyyyddd_val)

            if table == "sub":
                out_row = [
                    scenario_code,
                    "daily",
                    get("SUB"),
                    period_date,
                    year_val,
                    mon_val,
                    get("AREAkm2"),
                    get("PRECIPmm"),
                    get("SNOWMELTmm"),
                    get("PETmm"),
                    get("ETmm"),
                    get("SWmm"),
                    get("PERCmm"),
                    get("SURQmm"),
                    get("GW_Qmm"),
                    get("WYLDmm"),
                    get("SYLDt_ha"),
                    get("ORGNkg_ha"),
                    get("ORGPhg_ha"),
                    get("NSURQkg_ha"),
                    get("SOLPkg_ha"),
                    get("SEDPkg_ha"),
                    get("LAT_Qmm"),
                    get("LAT_Q_NO3kg_ha"),
                    get("GWNO3kg_ha"),
                    get("CHOLAmic/L"),
                    get("CBODUmg/L"),
                    get("DOXQmg/L"),
                    get("TNO3kg/ha"),
                    yyyyddd_val,
                    str(row_num),
                    source_file,
                ]
            else:
                out_row = [
                    scenario_code,
                    "daily",
                    get("SUB"),
                    period_date,
                    year_val,
                    mon_val,
                    get("AREAkm2"),
                    get("FLOW_INcms"),
                    get("FLOW_OUTcms"),
                    get("EVAPcms"),
                    get("TLOSScms"),
                    get("SED_INtons"),
                    get("SED_OUTtons"),
                    get("SEDCONCmg_kg"),
                    get("ORGN_INkg"),
                    get("ORGN_OUTkg"),
                    get("ORGP_INkg"),
                    get("ORGP_OUTkg"),
                    get("NO3_INkg"),
                    get("NO3_OUTkg"),
                    get("NH4_INkg"),
                    get("NH4_OUTkg"),
                    get("NO2_INkg"),
                    get("NO2_OUTkg"),
                    get("MINP_INkg"),
                    get("MINP_OUTkg"),
                    get("CHLA_INkg"),
                    get("CHLA_OUTkg"),
                    get("CBOD_INkg"),
                    get("CBOD_OUTkg"),
                    get("DISOX_INkg"),
                    get("DISOX_OUTkg"),
                    get("SOLPST_INmg"),
                    get("SOLPST_OUTmg"),
                    get("SORPST_INmg"),
                    get("SORPST_OUTmg"),
                    get("REACTPTmg"),
                    get("VOLPSTmg"),
                    get("SETTLPST_mg"),
                    get("RESUSP_PSTmg"),
                    get("DIFUSEPSTmg"),
                    get("REACHBEDPSTmg"),
                    get("BURYPSTmg"),
                    get("BED_PSTmg"),
                    get("BACTP_OUTct"),
                    get("BACTLP_OUTct"),
                    get("CMETAL1kg"),
                    get("CMETAL2kg"),
                    get("CMETAL3kg"),
                    get("TOT_Nkg"),
                    get("TOT_Pkg"),
                    get("NO3CONCmg/l"),
                    get("WTMPdegc"),
                    yyyyddd_val,
                    str(row_num),
                    source_file,
                ]
            writer.writerow(out_row)

    print(f"Wrote {row_num} rows to {output_csv}")


def run_psql_file(sql_file: Path) -> None:
    """Execute a SQL file via psql."""
    env = os.environ.copy()
    env["PGPASSWORD"] = PGPASSWORD
    cmd = [
        "psql", "-h", PGHOST, "-p", PGPORT, "-U", PGUSER, "-d", PGDATABASE,
        "-v", "ON_ERROR_STOP=1", "-f", str(sql_file)
    ]
    print(f"Running psql {sql_file.name}...")
    result = subprocess.run(cmd, env=env, capture_output=True, text=True)
    if result.returncode != 0:
        print("STDOUT:", result.stdout)
        print("STDERR:", result.stderr)
        raise RuntimeError(f"psql failed: {result.stderr}")
    print(result.stdout.strip())


def build_import_sql(scenario_code: str, sub_csv: Path, rch_csv: Path, sql_file: Path) -> None:
    """Build the SQL file for importing one scenario."""
    sql = f"""
BEGIN;

INSERT INTO access.import_runs (source_path, source_checksum, scenario_code, source_format, status)
VALUES ('{sub_csv.name}', NULL, '{scenario_code}', 'mdb', 'running')
RETURNING import_id;

-- Staging for sub
DROP TABLE IF EXISTS stg_sub;
CREATE TEMP TABLE stg_sub (
  scenario_code text,
  time_step text,
  sub_code integer,
  period_date date,
  year integer,
  mon integer,
  area_km2 double precision,
  precip_mm double precision,
  snowmelt_mm double precision,
  pet_mm double precision,
  et_mm double precision,
  sw_mm double precision,
  perc_mm double precision,
  surq_mm double precision,
  gw_q_mm double precision,
  wyld_mm double precision,
  syld_t_ha double precision,
  orgn_kg_ha double precision,
  orgp_hg_ha double precision,
  nsurq_kg_ha double precision,
  solp_kg_ha double precision,
  sedp_kg_ha double precision,
  lat_q_mm double precision,
  lat_q_no3_kg_ha double precision,
  gwno3_kg_ha double precision,
  chola_mic_l double precision,
  cbodu_mg_l double precision,
  doxq_mg_l double precision,
  tno3_kg_ha double precision,
  yyyyddd integer,
  source_row_num integer,
  source_file text
);

\copy stg_sub FROM '{sub_csv}' WITH (FORMAT csv, HEADER true, ENCODING 'UTF8', DELIMITER '|');

INSERT INTO access.sub_results (
  import_id, scenario_code, time_step, sub_code, period_date, year, mon,
  area_km2, precip_mm, snowmelt_mm, pet_mm, et_mm, sw_mm, perc_mm, surq_mm,
  gw_q_mm, wyld_mm, syld_t_ha, orgn_kg_ha, orgp_hg_ha, nsurq_kg_ha,
  solp_kg_ha, sedp_kg_ha, lat_q_mm, lat_q_no3_kg_ha, gwno3_kg_ha,
  chola_mic_l, cbodu_mg_l, doxq_mg_l, tno3_kg_ha, yyyyddd, source_row_num,
  source_file, table_source
)
SELECT
  currval('access.import_runs_import_id_seq'),
  scenario_code, time_step, sub_code, period_date, year, mon,
  area_km2, precip_mm, snowmelt_mm, pet_mm, et_mm, sw_mm, perc_mm, surq_mm,
  gw_q_mm, wyld_mm, syld_t_ha, orgn_kg_ha, orgp_hg_ha, nsurq_kg_ha,
  solp_kg_ha, sedp_kg_ha, lat_q_mm, lat_q_no3_kg_ha, gwno3_kg_ha,
  chola_mic_l, cbodu_mg_l, doxq_mg_l, tno3_kg_ha, yyyyddd, source_row_num,
  source_file, 'sub'
FROM stg_sub
ON CONFLICT (scenario_code, time_step, sub_code, period_date) DO UPDATE
SET
  import_id = EXCLUDED.import_id,
  year = EXCLUDED.year,
  mon = EXCLUDED.mon,
  area_km2 = EXCLUDED.area_km2,
  precip_mm = EXCLUDED.precip_mm,
  snowmelt_mm = EXCLUDED.snowmelt_mm,
  pet_mm = EXCLUDED.pet_mm,
  et_mm = EXCLUDED.et_mm,
  sw_mm = EXCLUDED.sw_mm,
  perc_mm = EXCLUDED.perc_mm,
  surq_mm = EXCLUDED.surq_mm,
  gw_q_mm = EXCLUDED.gw_q_mm,
  wyld_mm = EXCLUDED.wyld_mm,
  syld_t_ha = EXCLUDED.syld_t_ha,
  orgn_kg_ha = EXCLUDED.orgn_kg_ha,
  orgp_hg_ha = EXCLUDED.orgp_hg_ha,
  nsurq_kg_ha = EXCLUDED.nsurq_kg_ha,
  solp_kg_ha = EXCLUDED.solp_kg_ha,
  sedp_kg_ha = EXCLUDED.sedp_kg_ha,
  lat_q_mm = EXCLUDED.lat_q_mm,
  lat_q_no3_kg_ha = EXCLUDED.lat_q_no3_kg_ha,
  gwno3_kg_ha = EXCLUDED.gwno3_kg_ha,
  chola_mic_l = EXCLUDED.chola_mic_l,
  cbodu_mg_l = EXCLUDED.cbodu_mg_l,
  doxq_mg_l = EXCLUDED.doxq_mg_l,
  tno3_kg_ha = EXCLUDED.tno3_kg_ha,
  yyyyddd = EXCLUDED.yyyyddd,
  source_row_num = EXCLUDED.source_row_num,
  source_file = EXCLUDED.source_file,
  table_source = EXCLUDED.table_source;

-- Staging for rch
DROP TABLE IF EXISTS stg_rch;
CREATE TEMP TABLE stg_rch (
  scenario_code text,
  time_step text,
  sub_code integer,
  period_date date,
  year integer,
  mon integer,
  area_km2 double precision,
  flow_in_cms double precision,
  flow_out_cms double precision,
  evap_cms double precision,
  tloss_cms double precision,
  sed_in_tons double precision,
  sed_out_tons double precision,
  sedconc_mg_kg double precision,
  orgn_in_kg double precision,
  orgn_out_kg double precision,
  orgp_in_kg double precision,
  orgp_out_kg double precision,
  no3_in_kg double precision,
  no3_out_kg double precision,
  nh4_in_kg double precision,
  nh4_out_kg double precision,
  no2_in_kg double precision,
  no2_out_kg double precision,
  minp_in_kg double precision,
  minp_out_kg double precision,
  chla_in_kg double precision,
  chla_out_kg double precision,
  cbod_in_kg double precision,
  cbod_out_kg double precision,
  disox_in_kg double precision,
  disox_out_kg double precision,
  solpst_in_mg double precision,
  solpst_out_mg double precision,
  sorpst_in_mg double precision,
  sorpst_out_mg double precision,
  reactpt_mg double precision,
  volpst_mg double precision,
  settlpst_mg double precision,
  resusppst_mg double precision,
  difusepst_mg double precision,
  reachbedpst_mg double precision,
  burypst_mg double precision,
  bed_pst_mg double precision,
  bactp_out_ct double precision,
  bactlp_out_ct double precision,
  cmetal1_kg double precision,
  cmetal2_kg double precision,
  cmetal3_kg double precision,
  tot_n_kg double precision,
  tot_p_kg double precision,
  no3conc_mg_l double precision,
  wtmp_deg_c double precision,
  yyyyddd integer,
  source_row_num integer,
  source_file text
);

\copy stg_rch FROM '{rch_csv}' WITH (FORMAT csv, HEADER true, ENCODING 'UTF8', DELIMITER '|');

INSERT INTO access.rch_results (
  import_id, scenario_code, time_step, sub_code, period_date, year, mon,
  area_km2, flow_in_cms, flow_out_cms, evap_cms, tloss_cms, sed_in_tons,
  sed_out_tons, sedconc_mg_kg, orgn_in_kg, orgn_out_kg, orgp_in_kg,
  orgp_out_kg, no3_in_kg, no3_out_kg, nh4_in_kg, nh4_out_kg, no2_in_kg,
  no2_out_kg, minp_in_kg, minp_out_kg, chla_in_kg, chla_out_kg, cbod_in_kg,
  cbod_out_kg, disox_in_kg, disox_out_kg, solpst_in_mg, solpst_out_mg,
  sorpst_in_mg, sorpst_out_mg, reactpt_mg, volpst_mg, settlpst_mg,
  resusppst_mg, difusepst_mg, reachbedpst_mg, burypst_mg, bed_pst_mg,
  bactp_out_ct, bactlp_out_ct, cmetal1_kg, cmetal2_kg, cmetal3_kg,
  tot_n_kg, tot_p_kg, no3conc_mg_l, wtmp_deg_c, yyyyddd, source_row_num,
  source_file, table_source
)
SELECT
  currval('access.import_runs_import_id_seq'),
  scenario_code, time_step, sub_code, period_date, year, mon,
  area_km2, flow_in_cms, flow_out_cms, evap_cms, tloss_cms, sed_in_tons,
  sed_out_tons, sedconc_mg_kg, orgn_in_kg, orgn_out_kg, orgp_in_kg,
  orgp_out_kg, no3_in_kg, no3_out_kg, nh4_in_kg, nh4_out_kg, no2_in_kg,
  no2_out_kg, minp_in_kg, minp_out_kg, chla_in_kg, chla_out_kg, cbod_in_kg,
  cbod_out_kg, disox_in_kg, disox_out_kg, solpst_in_mg, solpst_out_mg,
  sorpst_in_mg, sorpst_out_mg, reactpt_mg, volpst_mg, settlpst_mg,
  resusppst_mg, difusepst_mg, reachbedpst_mg, burypst_mg, bed_pst_mg,
  bactp_out_ct, bactlp_out_ct, cmetal1_kg, cmetal2_kg, cmetal3_kg,
  tot_n_kg, tot_p_kg, no3conc_mg_l, wtmp_deg_c, yyyyddd, source_row_num,
  source_file, 'rch'
FROM stg_rch
ON CONFLICT (scenario_code, time_step, sub_code, period_date) DO UPDATE
SET
  import_id = EXCLUDED.import_id,
  year = EXCLUDED.year,
  mon = EXCLUDED.mon,
  area_km2 = EXCLUDED.area_km2,
  flow_in_cms = EXCLUDED.flow_in_cms,
  flow_out_cms = EXCLUDED.flow_out_cms,
  evap_cms = EXCLUDED.evap_cms,
  tloss_cms = EXCLUDED.tloss_cms,
  sed_in_tons = EXCLUDED.sed_in_tons,
  sed_out_tons = EXCLUDED.sed_out_tons,
  sedconc_mg_kg = EXCLUDED.sedconc_mg_kg,
  orgn_in_kg = EXCLUDED.orgn_in_kg,
  orgn_out_kg = EXCLUDED.orgn_out_kg,
  orgp_in_kg = EXCLUDED.orgp_in_kg,
  orgp_out_kg = EXCLUDED.orgp_out_kg,
  no3_in_kg = EXCLUDED.no3_in_kg,
  no3_out_kg = EXCLUDED.no3_out_kg,
  nh4_in_kg = EXCLUDED.nh4_in_kg,
  nh4_out_kg = EXCLUDED.nh4_out_kg,
  no2_in_kg = EXCLUDED.no2_in_kg,
  no2_out_kg = EXCLUDED.no2_out_kg,
  minp_in_kg = EXCLUDED.minp_in_kg,
  minp_out_kg = EXCLUDED.minp_out_kg,
  chla_in_kg = EXCLUDED.chla_in_kg,
  chla_out_kg = EXCLUDED.chla_out_kg,
  cbod_in_kg = EXCLUDED.cbod_in_kg,
  cbod_out_kg = EXCLUDED.cbod_out_kg,
  disox_in_kg = EXCLUDED.disox_in_kg,
  disox_out_kg = EXCLUDED.disox_out_kg,
  solpst_in_mg = EXCLUDED.solpst_in_mg,
  solpst_out_mg = EXCLUDED.solpst_out_mg,
  sorpst_in_mg = EXCLUDED.sorpst_in_mg,
  sorpst_out_mg = EXCLUDED.sorpst_out_mg,
  reactpt_mg = EXCLUDED.reactpt_mg,
  volpst_mg = EXCLUDED.volpst_mg,
  settlpst_mg = EXCLUDED.settlpst_mg,
  resusppst_mg = EXCLUDED.resusppst_mg,
  difusepst_mg = EXCLUDED.difusepst_mg,
  reachbedpst_mg = EXCLUDED.reachbedpst_mg,
  burypst_mg = EXCLUDED.burypst_mg,
  bed_pst_mg = EXCLUDED.bed_pst_mg,
  bactp_out_ct = EXCLUDED.bactp_out_ct,
  bactlp_out_ct = EXCLUDED.bactlp_out_ct,
  cmetal1_kg = EXCLUDED.cmetal1_kg,
  cmetal2_kg = EXCLUDED.cmetal2_kg,
  cmetal3_kg = EXCLUDED.cmetal3_kg,
  tot_n_kg = EXCLUDED.tot_n_kg,
  tot_p_kg = EXCLUDED.tot_p_kg,
  no3conc_mg_l = EXCLUDED.no3conc_mg_l,
  wtmp_deg_c = EXCLUDED.wtmp_deg_c,
  yyyyddd = EXCLUDED.yyyyddd,
  source_row_num = EXCLUDED.source_row_num,
  source_file = EXCLUDED.source_file,
  table_source = EXCLUDED.table_source;

WITH counts AS (
  SELECT
    (SELECT COUNT(*) FROM access.sub_results WHERE import_id = currval('access.import_runs_import_id_seq')) AS sub_rows,
    (SELECT COUNT(*) FROM access.rch_results WHERE import_id = currval('access.import_runs_import_id_seq')) AS rch_rows
)
UPDATE access.import_runs
SET status = 'finished', finished_at = now(), total_rows = counts.sub_rows + counts.rch_rows
FROM counts
WHERE import_id = currval('access.import_runs_import_id_seq');

COMMIT;
"""
    sql_file.write_text(sql, encoding="utf-8")


def ingest_scenario(scenario_code: str, scenario_label: str) -> None:
    mdb_path = MDB_ROOT / f"Scénarios_d’atténuation_d’érosion_(reboissement)/{scenario_label}/SWAT_HAD/Scenarios/Daily/TablesOut/SWATOutput.mdb"
    work = WORK_DIR / scenario_code
    work.mkdir(parents=True, exist_ok=True)

    raw_sub = work / "sub_raw.csv"
    raw_rch = work / "rch_raw.csv"
    final_sub = work / "sub_final.csv"
    final_rch = work / "rch_final.csv"
    sql_file = work / "import.sql"

    export_table(mdb_path, "sub", raw_sub)
    export_table(mdb_path, "rch", raw_rch)

    transform_csv(raw_sub, final_sub, scenario_code, "sub", SUB_COLUMNS_MDB, SUB_COLUMNS_PG)
    transform_csv(raw_rch, final_rch, scenario_code, "rch", RCH_COLUMNS_MDB, RCH_COLUMNS_PG)

    build_import_sql(scenario_code, final_sub, final_rch, sql_file)
    run_psql_file(sql_file)


def main():
    WORK_DIR.mkdir(parents=True, exist_ok=True)
    for scenario_code, scenario_label in SCENARIOS:
        print(f"\n=== Ingesting {scenario_code} ===")
        ingest_scenario(scenario_code, scenario_label)
    print("\nAll scenarios ingested successfully.")


if __name__ == "__main__":
    if len(sys.argv) > 1:
        requested = sys.argv[1]
        found = [(code, label) for code, label in SCENARIOS if code == requested]
        if not found:
            print(f"Unknown scenario: {requested}. Available: {', '.join(c for c, _ in SCENARIOS)}")
            sys.exit(1)
        WORK_DIR.mkdir(parents=True, exist_ok=True)
        for scenario_code, scenario_label in found:
            print(f"\n=== Ingesting {scenario_code} ===")
            ingest_scenario(scenario_code, scenario_label)
        print("\nDone.")
    else:
        main()

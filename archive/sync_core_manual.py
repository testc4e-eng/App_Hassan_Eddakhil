#!/usr/bin/env python3
"""
Manual synchronization of core.timeseries/core.measurements for scenario_1-4 Daily data.
Uses psycopg2 with COPY for fast inserts.
"""
import io
import os
import psycopg2
from datetime import datetime, timezone


def env_first(*names: str, default: str) -> str:
    for name in names:
        value = os.getenv(name)
        if value:
            return value
    return default


DB_CONFIG = {
    "host": env_first("HDI_DB_HOST", "DB_HOST", default="127.0.0.1"),
    "port": env_first("HDI_DB_PORT", "DB_PORT", default="5436"),
    "dbname": env_first("HDI_DB_NAME", "DB_NAME", default="hydro_hd"),
    "user": env_first("HDI_DB_USER", "DB_USER", default="postgres"),
    "password": env_first("HDI_DB_PASSWORD", "DB_PASSWORD", default="local_test_password"),
}

PROPERTY_IDS = {
    "flow": 31,
    "sed": 32,
    "syldt": 33,
}

SCENARIOS = {
    "scenario_1": "Scénario 1 reboisement",
    "scenario_2": "Scénario 2 reboisement",
    "scenario_3": "Scénario 3 reboisement",
    "scenario_4": "Scénario 4 reboisement",
}


def ensure_model_run(cur, scenario_code, run_name):
    cur.execute(
        "SELECT run_id FROM core.model_runs WHERE scenario_code = %s LIMIT 1",
        (scenario_code,),
    )
    row = cur.fetchone()
    if row:
        run_id = row[0]
        cur.execute(
            "UPDATE core.model_runs SET scenario_name = %s, description = %s, is_observed = false WHERE run_id = %s",
            (run_name, f"SWAT simulated run ({scenario_code})", run_id),
        )
        return run_id

    cur.execute("SELECT COALESCE(MAX(run_id), 0) + 1 FROM core.model_runs")
    run_id = cur.fetchone()[0]
    cur.execute(
        "INSERT INTO core.model_runs (run_id, scenario_code, scenario_name, description, is_observed) VALUES (%s, %s, %s, %s, %s)",
        (run_id, scenario_code, run_name, f"SWAT simulated run ({scenario_code})", False),
    )
    return run_id


def ensure_station(cur, station_code, name, station_type, catchment_table, entity_id_col, entity_id):
    cur.execute(
        "SELECT station_id FROM core.stations WHERE station_code = %s",
        (station_code,),
    )
    row = cur.fetchone()
    if row:
        return row[0]

    cur.execute("SELECT COALESCE(MAX(station_id), 0) + 1 FROM core.stations")
    station_id = cur.fetchone()[0]

    cur.execute(
        f"SELECT catchment_id FROM {catchment_table} WHERE {entity_id_col} = %s",
        (entity_id,),
    )
    catchment_row = cur.fetchone()
    catchment_id = catchment_row[0] if catchment_row else None

    if station_type == "SWAT_SUBBASIN":
        cur.execute(
            "INSERT INTO core.stations (station_id, station_code, name, type_station, station_type_code, catchment_id) VALUES (%s, %s, %s, %s, %s, %s)",
            (station_id, station_code, name, "SWAT", station_type, catchment_id),
        )
    else:
        cur.execute(
            "INSERT INTO core.stations (station_id, station_code, name, type_station, station_type_code, catchment_id, reach_id) VALUES (%s, %s, %s, %s, %s, %s, %s)",
            (station_id, station_code, name, "SWAT", station_type, catchment_id, entity_id),
        )
    return station_id


def ensure_timeseries(cur, station_id, property_id, run_id):
    cur.execute(
        "SELECT ts_id FROM core.timeseries WHERE station_id = %s AND property_id = %s AND run_id = %s AND source_type = 'simulated' AND time_step = 'daily'",
        (station_id, property_id, run_id),
    )
    row = cur.fetchone()
    if row:
        return row[0]

    cur.execute("SELECT COALESCE(MAX(ts_id), 0) + 1 FROM core.timeseries")
    ts_id = cur.fetchone()[0]
    cur.execute(
        "INSERT INTO core.timeseries (ts_id, station_id, property_id, run_id, source_type, time_step, created_at) VALUES (%s, %s, %s, %s, %s, %s, now())",
        (ts_id, station_id, property_id, run_id, "simulated", "daily"),
    )
    return ts_id


def sync_measurements_copy(conn, cur, scenario_code, source_table, value_cols):
    """
    source_table: 'access.sub_results' or 'access.rch_results'
    value_cols: list of (column_name, property_key, station_prefix)
    """
    # Build a mapping ts_id -> station_code pattern
    # We need to join with access table and produce CSV: ts_id,datetime,value
    for col_name, prop_key, station_prefix in value_cols:
        print(f"  Syncing {col_name} from {source_table}...", flush=True)

        # Build staging
        cur.execute("""
            CREATE TEMP TABLE IF NOT EXISTS tmp_measurements (
                ts_id integer,
                datetime timestamptz,
                value double precision
            ) ON COMMIT DROP;
        """)
        cur.execute("TRUNCATE tmp_measurements")

        # Stream rows into COPY using a separate cursor
        cur.execute(f"""
            SELECT t.ts_id, a.period_date, a.{col_name}
            FROM {source_table} a
            JOIN core.timeseries t
              ON t.run_id = (SELECT run_id FROM core.model_runs WHERE scenario_code = %s LIMIT 1)
             AND t.source_type = 'simulated'
             AND t.time_step = 'daily'
             AND t.property_id = %s
            JOIN core.stations s
              ON s.station_id = t.station_id
             AND s.station_code = %s || a.sub_code
            WHERE a.scenario_code = %s
              AND a.time_step = 'daily'
              AND a.{col_name} IS NOT NULL
              AND a.period_date IS NOT NULL
            ORDER BY t.ts_id, a.period_date
        """, (scenario_code, PROPERTY_IDS[prop_key], station_prefix, scenario_code))

        cur_copy = conn.cursor()
        buffer = io.StringIO()
        count = 0
        for ts_id, period_date, value in cur:
            dt = datetime.combine(period_date, datetime.min.time(), tzinfo=timezone.utc)
            buffer.write(f"{ts_id}\t{dt.isoformat()}\t{value}\n")
            count += 1
            if count % 50000 == 0:
                buffer.seek(0)
                cur_copy.copy_from(buffer, 'tmp_measurements', columns=('ts_id', 'datetime', 'value'))
                buffer = io.StringIO()
                print(f"    loaded {count} rows", flush=True)

        if count % 50000 != 0 or count == 0:
            buffer.seek(0)
            cur_copy.copy_from(buffer, 'tmp_measurements', columns=('ts_id', 'datetime', 'value'))
        cur_copy.close()

        print(f"  Total {col_name} rows: {count}", flush=True)

        # Upsert into core.measurements
        cur.execute("""
            INSERT INTO core.measurements (ts_id, datetime, value, quality_flag)
            SELECT ts_id, datetime, value, NULL::smallint
            FROM tmp_measurements
            ON CONFLICT (ts_id, datetime) DO UPDATE SET value = EXCLUDED.value
        """)
        upserted = cur.rowcount
        print(f"  Upserted {upserted} {col_name} measurements", flush=True)


def sync_scenario(conn, scenario_code, run_name):
    print(f"\n=== Syncing {scenario_code} ===", flush=True)
    cur = conn.cursor()

    run_id = ensure_model_run(cur, scenario_code, run_name)
    print(f"run_id = {run_id}", flush=True)

    # Create stations and timeseries
    ts_ids = {}
    for i in range(1, 20):
        # sub station for SYLDT
        sub_station_id = ensure_station(cur, f"swat_sub_{i}", f"SWAT subbasin {i}", "SWAT_SUBBASIN", "gis.subbasin_shapes", "subbasin_id", i)
        ts_ids[("sub", i, "syldt")] = ensure_timeseries(cur, sub_station_id, PROPERTY_IDS["syldt"], run_id)

        # rch station for FLOW and SED
        rch_station_id = ensure_station(cur, f"swat_rch_{i}", f"SWAT reach {i}", "SWAT_REACH", "gis.reach_shapes", "reach_id", i)
        ts_ids[("rch", i, "flow")] = ensure_timeseries(cur, rch_station_id, PROPERTY_IDS["flow"], run_id)
        ts_ids[("rch", i, "sed")] = ensure_timeseries(cur, rch_station_id, PROPERTY_IDS["sed"], run_id)

    conn.commit()
    print("Stations and timeseries ready", flush=True)

    # Sync measurements using COPY
    sync_measurements_copy(
        conn, cur, scenario_code,
        "access.sub_results",
        [("syld_t_ha", "syldt", "swat_sub_")]
    )
    conn.commit()

    sync_measurements_copy(
        conn, cur, scenario_code,
        "access.rch_results",
        [("flow_out_cms", "flow", "swat_rch_"), ("sed_out_tons", "sed", "swat_rch_")]
    )
    conn.commit()

    cur.close()


def main():
    conn = psycopg2.connect(**DB_CONFIG)
    conn.autocommit = False
    try:
        for scenario_code, run_name in SCENARIOS.items():
            sync_scenario(conn, scenario_code, run_name)
    finally:
        conn.close()
    print("\nAll scenarios synchronized.", flush=True)


if __name__ == "__main__":
    print("STARTING sync_core_manual.py", flush=True)
    main()

#!/usr/bin/env python
"""
ETL source -> target staging (non-destructive).

Modes:
- dry-run: inspect and count rows only, no target write.
- commit : insert into staging.raw_* with load_batch_id traceability.
"""

from __future__ import annotations

import argparse
import datetime as dt
import os
import sys
import uuid
from dataclasses import dataclass
from typing import Iterable, Sequence

import psycopg


@dataclass(frozen=True)
class TableSpec:
    source_table: str
    target_table: str
    source_columns: Sequence[str]
    source_pk_column: str
    geom_column: str | None = None

    @property
    def source_schema(self) -> str:
        return self.source_table.split(".")[0]

    @property
    def source_name(self) -> str:
        return self.source_table.split(".")[1]


SPECS: list[TableSpec] = [
    TableSpec(
        source_table="public.adm_communes_abhgzr",
        target_table="staging.raw_adm_communes_abhgzr",
        source_columns=[
            "id_com",
            "code_region",
            "nom_region",
            "code_province",
            "nom_province",
            "code_cercle",
            "cercle_fr",
            "cercle_ar",
            "code_commune",
            "commune_fr",
            "commune_ar",
            "milieu",
        ],
        source_pk_column="id_com",
        geom_column="geom",
    ),
    TableSpec("public.bassin_abhgzr", "staging.raw_bassin_abhgzr", ["id_bassin", "nom_bassin"], "id_bassin", "geom"),
    TableSpec(
        "public.barrages_abhgzr",
        "staging.raw_barrages_abhgzr",
        ["id_brg", "code_commune", "ire_barrage", "nom_barrage", "type_barrage", "coord_x", "coord_y"],
        "id_brg",
        "geom",
    ),
    TableSpec(
        "public.stations_abhgzr",
        "staging.raw_stations_abhgzr",
        [
            "id_station",
            "code_commune",
            "ire_station",
            "num_poste",
            "nom_station_fr",
            "nom_station_ar",
            "oued",
            "date_m_s",
            "etat_fonct",
            "mode_fonct",
            "type_station",
            "mesures_station",
            "coord_x",
            "coord_y",
            "coord_z",
            "observation",
        ],
        "id_station",
        "geom",
    ),
    TableSpec(
        "public.mesures_precipitations_jr",
        "staging.raw_mesures_precipitations_jr",
        ["id_precipitation", "ire_station", "date_jr", "precipitation_jr"],
        "id_precipitation",
    ),
    TableSpec(
        "public.mesures_debits_jr",
        "staging.raw_mesures_debits_jr",
        ["id_debit", "ire_station", "date_jr", "debit_jr"],
        "id_debit",
    ),
    TableSpec(
        "public.mesures_temperature_jr_pn",
        "staging.raw_mesures_temperature_jr_pn",
        ["id_temp", "ire_station", "date_jr", "temp_jr_max", "temp_jr_min", "temp_jr_moy"],
        "id_temp",
    ),
    TableSpec(
        "public.mesures_lachers_barrages",
        "staging.raw_mesures_lachers_barrages",
        ["id_lachers", "ire_barrage", "date_jr", "apports_m3", "restitution_m3"],
        "id_lachers",
    ),
    TableSpec(
        "public.mesures_temperature_m",
        "staging.raw_mesures_temperature_m",
        ["id_temp_m", "ire_station", "date_m", "temperature_min", "temperature_max", "temperature_moy"],
        "id_temp_m",
    ),
    TableSpec(
        "public.mesures_evaporation_m",
        "staging.raw_mesures_evaporation_m",
        ["id_evapo_m", "ire_station", "date_m", "evaporation_m"],
        "id_evapo_m",
    ),
    TableSpec(
        "public.mesures_humidite_relative_m",
        "staging.raw_mesures_humidite_relative_m",
        ["id_hum_m", "ire_station", "date_m", "humidite_relative_m"],
        "id_hum_m",
    ),
    TableSpec(
        "public.mesures_vitesse_vent_m",
        "staging.raw_mesures_vitesse_vent_m",
        ["id_vent_m", "ire_station", "date_m", "vitesse_moy_m"],
        "id_vent_m",
    ),
    TableSpec(
        "public.bathymetries_barrages_abhgzr",
        "staging.raw_bathymetries_barrages_abhgzr",
        ["id_cote", "ire_barrage", "cote_mngm", "volumr_mm3", "surface_km2"],
        "id_cote",
    ),
]


def env(name: str, default: str | None = None) -> str:
    value = os.getenv(name, default)
    if value is None:
        raise RuntimeError(f"Missing env variable: {name}")
    return value


def make_conn(prefix: str) -> psycopg.Connection:
    return psycopg.connect(
        host=env(f"{prefix}_DB_HOST"),
        port=int(env(f"{prefix}_DB_PORT")),
        dbname=env(f"{prefix}_DB_NAME"),
        user=env(f"{prefix}_DB_USER"),
        password=env(f"{prefix}_DB_PASSWORD"),
        sslmode="require" if env(f"{prefix}_DB_SSL", "false").lower() == "true" else "prefer",
    )


def build_select_sql(spec: TableSpec) -> str:
    cols = [f'"{c}"' for c in spec.source_columns]
    if spec.geom_column:
        cols.append(f'CASE WHEN "{spec.geom_column}" IS NULL THEN NULL ELSE ST_AsEWKT("{spec.geom_column}") END AS geom_ewkt')
    cols.append(f'"{spec.source_pk_column}"::text AS source_pk')
    return f'SELECT {", ".join(cols)} FROM "{spec.source_schema}"."{spec.source_name}"'


def build_insert_sql(spec: TableSpec) -> tuple[str, list[str]]:
    target_cols = list(spec.source_columns)
    if spec.geom_column:
        target_cols.append("geom_ewkt")
    target_cols.extend(["source_table", "source_pk", "load_batch_id"])
    placeholders = ", ".join(["%s"] * len(target_cols))
    sql = f'INSERT INTO {spec.target_table} ({", ".join(target_cols)}) VALUES ({placeholders})'
    return sql, target_cols


def log(msg: str) -> None:
    print(f"[{dt.datetime.utcnow().isoformat()}Z] {msg}")


def insert_event(cur: psycopg.Cursor, batch_id: str, level: str, step: str, table_name: str | None, message: str, row_count: int | None = None) -> None:
    cur.execute(
        """
        INSERT INTO staging.migration_events(load_batch_id, level, step, table_name, message, row_count)
        VALUES (%s, %s, %s, %s, %s, %s)
        """,
        (batch_id, level, step, table_name, message, row_count),
    )


def iter_rows(cur: psycopg.Cursor, fetch_size: int = 2000) -> Iterable[list]:
    while True:
        rows = cur.fetchmany(fetch_size)
        if not rows:
            break
        yield rows


def run_table(spec: TableSpec, src: psycopg.Connection, tgt: psycopg.Connection | None, batch_id: str, dry_run: bool) -> int:
    select_sql = build_select_sql(spec)
    insert_sql, _ = build_insert_sql(spec)

    total = 0
    with src.cursor(name=f"src_{spec.source_name}") as src_cur:
        src_cur.execute(select_sql)
        for chunk in iter_rows(src_cur):
            total += len(chunk)
            if not dry_run and tgt is not None:
                payload = []
                for row in chunk:
                    row = list(row)
                    source_pk = row.pop()  # last selected field
                    row.extend([spec.source_table, source_pk, batch_id])
                    payload.append(tuple(row))
                with tgt.cursor() as tgt_cur:
                    tgt_cur.executemany(insert_sql, payload)
    return total


def main() -> int:
    parser = argparse.ArgumentParser(description="ABHGZR -> hydro_hd_1714 ETL (staging).")
    parser.add_argument("--mode", choices=["dry-run", "commit"], required=True)
    parser.add_argument("--batch-id", default=None, help="Optional batch id. Auto-generated if omitted.")
    args = parser.parse_args()

    dry_run = args.mode == "dry-run"
    batch_id = args.batch_id or f"{dt.datetime.utcnow().strftime('%Y%m%dT%H%M%SZ')}_{uuid.uuid4().hex[:8]}"

    log(f"Starting ETL mode={args.mode} batch={batch_id}")

    src = make_conn("SRC")
    tgt = None if dry_run else make_conn("TGT")

    try:
        if not dry_run and tgt is not None:
            with tgt.cursor() as cur:
                cur.execute(
                    """
                    INSERT INTO staging.migration_batches(load_batch_id, source_db, target_db, mode, status, note)
                    VALUES (%s, %s, %s, %s, 'running', %s)
                    ON CONFLICT (load_batch_id) DO NOTHING
                    """,
                    (batch_id, env("SRC_DB_NAME"), env("TGT_DB_NAME"), args.mode, "ABHGZR controlled load"),
                )
            tgt.commit()

        table_counts: dict[str, int] = {}
        for spec in SPECS:
            log(f"Processing {spec.source_table} -> {spec.target_table}")
            count = run_table(spec, src=src, tgt=tgt, batch_id=batch_id, dry_run=dry_run)
            table_counts[spec.source_table] = count
            log(f"Rows processed: {count}")

            if not dry_run and tgt is not None:
                with tgt.cursor() as cur:
                    insert_event(cur, batch_id, "INFO", "extract_load", spec.target_table, "table loaded", count)
                tgt.commit()

        total_rows = sum(table_counts.values())
        log(f"Completed. Total rows processed: {total_rows}")

        if not dry_run and tgt is not None:
            with tgt.cursor() as cur:
                cur.execute(
                    """
                    UPDATE staging.migration_batches
                    SET finished_at = now(), status = 'success'
                    WHERE load_batch_id = %s
                    """,
                    (batch_id,),
                )
                insert_event(cur, batch_id, "INFO", "finalize", None, f"success total_rows={total_rows}", total_rows)
            tgt.commit()

        print("SUMMARY")
        print(f"batch_id={batch_id}")
        for table, c in table_counts.items():
            print(f"{table}={c}")
        return 0
    except Exception as exc:
        log(f"ERROR: {exc}")
        if not dry_run and tgt is not None:
            with tgt.cursor() as cur:
                cur.execute(
                    """
                    UPDATE staging.migration_batches
                    SET finished_at = now(), status = 'failed', note = %s
                    WHERE load_batch_id = %s
                    """,
                    (str(exc)[:1000], batch_id),
                )
                insert_event(cur, batch_id, "ERROR", "fatal", None, str(exc), None)
            tgt.commit()
        return 1
    finally:
        src.close()
        if tgt is not None:
            tgt.close()


if __name__ == "__main__":
    sys.exit(main())


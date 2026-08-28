"""Analyse automatique de la base PostgreSQL Hydro-Data Intelligence.

Usage:
  python scripts/analyze_database.py

Ou avec variables d'environnement:
  DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD, DB_SSL

Sorties:
  outputs/stations_inventory.csv
  outputs/station_parameters.csv
  outputs/timeseries_analysis.csv
  outputs/availability_matrix.csv
  outputs/hydro_database_analysis.xlsx
  outputs/DATABASE_ANALYSIS.md
  outputs/availability_heatmap.png
"""

from __future__ import annotations

import argparse
import logging
import math
import os
import re
from datetime import datetime
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Iterable, Optional

import numpy as np
import pandas as pd
from sqlalchemy import create_engine, inspect, text
from sqlalchemy.engine import Engine

try:
    import matplotlib.pyplot as plt
    import seaborn as sns
except Exception:  # pragma: no cover - optional visual dependency
    plt = None
    sns = None


ROOT = Path(__file__).resolve().parents[1]
BACKEND_ENV = ROOT / "backend" / ".env"
OUTPUT_DIR = ROOT / "outputs"

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
LOGGER = logging.getLogger("hydro-db-analyzer")


def env_first(*names: str, default: str) -> str:
    for name in names:
        value = os.getenv(name)
        if value:
            return value
    return default


@dataclass(frozen=True)
class DbConfig:
    host: str = "localhost"
    port: int = 5432
    dbname: str = "hydro_hd"
    user: str = "postgres"
    password: str = ""
    ssl: bool = False


def load_env_file(path: Path) -> None:
    if not path.exists():
        return
    for raw_line in path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))


def get_db_config(env_file: Path = BACKEND_ENV) -> DbConfig:
    load_env_file(env_file)
    return DbConfig(
        host=os.getenv("DB_HOST", "localhost"),
        port=int(os.getenv("DB_PORT", "5432")),
        dbname=env_first("HDI_DB_NAME", "DB_NAME", default="hydro_hd"),
        user=os.getenv("DB_USER", "postgres"),
        password=os.getenv("DB_PASSWORD", ""),
        ssl=str(os.getenv("DB_SSL", "false")).lower() in {"1", "true", "yes", "on"},
    )


def make_engine(cfg: DbConfig) -> Engine:
    from urllib.parse import quote_plus

    sslmode = "require" if cfg.ssl else "disable"
    url = (
        f"postgresql+psycopg2://{quote_plus(cfg.user)}:{quote_plus(cfg.password)}"
        f"@{cfg.host}:{cfg.port}/{cfg.dbname}?sslmode={sslmode}"
    )
    return create_engine(url, future=True, pool_pre_ping=True)


def ensure_output_dir() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)


def table_exists(inspector: Any, schema: str, table: str) -> bool:
    try:
        return inspector.has_table(table, schema=schema)
    except Exception:
        return False


def view_exists(inspector: Any, schema: str, view: str) -> bool:
    try:
        views = inspector.get_view_names(schema=schema)
        return view in views
    except Exception:
        return False


def get_table_columns(inspector: Any, schema: str, table: str) -> list[str]:
    try:
        cols = inspector.get_columns(table, schema=schema)
        return [c["name"] for c in cols]
    except Exception:
        return []


def read_sql_df(engine: Engine, sql: str, params: Optional[dict[str, Any]] = None) -> pd.DataFrame:
    with engine.connect() as conn:
        return pd.read_sql_query(text(sql), conn, params=params)


def read_table_df(engine: Engine, schema: str, table: str, columns: Optional[Iterable[str]] = None) -> pd.DataFrame:
    inspector = inspect(engine)
    cols = get_table_columns(inspector, schema, table)
    if not cols:
        return pd.DataFrame()

    if columns is None:
        select_cols = cols
    else:
        select_cols = [c for c in columns if c in cols]
        if not select_cols:
            select_cols = cols

    select_parts = [f'"{c}"' if c.lower() != c else c for c in select_cols]

    if "geom" in cols:
        select_parts.extend(
            [
                "ST_AsText(geom) AS geom_wkt",
                "CASE WHEN geom IS NOT NULL AND GeometryType(geom) IN ('POINT', 'ST_Point') THEN ST_X(geom) END AS longitude",
                "CASE WHEN geom IS NOT NULL AND GeometryType(geom) IN ('POINT', 'ST_Point') THEN ST_Y(geom) END AS latitude",
            ]
        )

    sql = f'SELECT {", ".join(select_parts)} FROM {schema}.{table}'
    try:
        return read_sql_df(engine, sql)
    except Exception as exc:
        LOGGER.warning("Impossible de lire %s.%s (%s).", schema, table, exc)
        return pd.DataFrame()


def parse_ts_step(step: Any) -> Optional[str]:
    value = str(step or "").strip().lower()
    if not value:
        return None
    if "annual" in value or "year" in value:
        return "yearly"
    if "month" in value:
        return "monthly"
    if "day" in value:
        return "daily"
    if "hour" in value or "instant" in value or "minute" in value:
        return "daily"
    return None


def infer_granularity(time_step: Any, start_date: Any, end_date: Any, n_points: Any = None) -> str:
    step = parse_ts_step(time_step)
    if step:
        return step

    start = pd.to_datetime(start_date, errors="coerce")
    end = pd.to_datetime(end_date, errors="coerce")
    if pd.isna(start) or pd.isna(end):
        return "daily"

    if start.day == 1 and start.month == 1 and end.day == 1 and end.month == 1:
        return "yearly"

    if start.day == 1 and end.day == 1:
        return "monthly"

    if isinstance(n_points, (int, float)) and n_points <= 1:
        if start.day == 1 and start.month == 1:
            return "yearly"
        if start.day == 1:
            return "monthly"

    return "daily"


def fmt_date(value: Any, mode: str) -> str:
    dt = pd.to_datetime(value, errors="coerce")
    if pd.isna(dt):
        return "" if value is None else str(value)
    if mode == "yearly":
        return f"{dt.year}"
    if mode == "monthly":
        return f"{dt.month:02d}/{dt.year}"
    return dt.strftime("%d/%m/%Y")


def expected_period_count(start_date: Any, end_date: Any, mode: str) -> Optional[int]:
    start = pd.to_datetime(start_date, errors="coerce")
    end = pd.to_datetime(end_date, errors="coerce")
    if pd.isna(start) or pd.isna(end):
        return None
    if mode == "yearly":
        return int(end.year - start.year + 1)
    if mode == "monthly":
        return int((end.year - start.year) * 12 + (end.month - start.month) + 1)
    return int((end.normalize() - start.normalize()).days + 1)


def percentile_exprs() -> str:
    return """
        PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY value) AS q1,
        PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY value) AS median_value,
        PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY value) AS q3
    """


def load_catalog(engine: Engine, inspector: Any) -> pd.DataFrame:
    if view_exists(inspector, "public", "v_ts_catalog_enriched"):
        try:
            df = read_sql_df(engine, "SELECT * FROM public.v_ts_catalog_enriched")
            if not df.empty:
                for col in ["station_code", "station_name", "scenario_code", "scenario_name", "source_type", "time_step", "n_points", "start_date", "end_date"]:
                    if col not in df.columns:
                        df[col] = np.nan
                if "is_observed" not in df.columns:
                    df["is_observed"] = np.nan
                return df
        except Exception as exc:
            LOGGER.warning("Lecture de public.v_ts_catalog_enriched impossible (%s).", exc)

    if table_exists(inspector, "public", "timeseries"):
        sql = """
            SELECT
              ts.ts_id,
              ts.station_id,
              s.station_code,
              s.name AS station_name,
              ts.property_id,
              op.name AS property_name,
              op.unit,
              op.standard_name,
              ts.run_id,
              mr.scenario_code,
              mr.scenario_name,
              mr.is_observed,
              ts.source_type,
              ts.time_step,
              COUNT(m.datetime) OVER (PARTITION BY ts.ts_id) AS n_points,
              MIN(m.datetime) OVER (PARTITION BY ts.ts_id) AS start_date,
              MAX(m.datetime) OVER (PARTITION BY ts.ts_id) AS end_date
            FROM public.timeseries ts
            JOIN public.stations s ON s.station_id = ts.station_id
            JOIN ref.observed_properties op ON op.property_id = ts.property_id
            JOIN public.model_runs mr ON mr.run_id = ts.run_id
            LEFT JOIN public.measurements m ON m.ts_id = ts.ts_id
        """
        try:
            df = read_sql_df(engine, sql)
            if not df.empty:
                return df.drop_duplicates(subset=["ts_id"])
        except Exception as exc:
            LOGGER.warning("Lecture du catalogue brut impossible (%s).", exc)
    return pd.DataFrame()


def load_measurement_stats(engine: Engine, inspector: Any) -> pd.DataFrame:
    if not table_exists(inspector, "public", "measurements"):
        return pd.DataFrame()

    sql = f"""
        WITH quantiles AS (
            SELECT
              ts_id,
              {percentile_exprs()}
            FROM public.measurements
            WHERE value IS NOT NULL
            GROUP BY ts_id
        )
        SELECT
          m.ts_id,
          COUNT(*) AS raw_rows,
          COUNT(m.value) AS valid_values,
          COUNT(*) - COUNT(m.value) AS null_values,
          MIN(m.datetime) AS measurement_start,
          MAX(m.datetime) AS measurement_end,
          MIN(m.value) AS min_value,
          MAX(m.value) AS max_value,
          AVG(m.value) AS mean_value,
          SUM(m.value) AS sum_value,
          COALESCE(q.q1, NULL) AS q1,
          COALESCE(q.median_value, NULL) AS median_value,
          COALESCE(q.q3, NULL) AS q3
        FROM public.measurements m
        LEFT JOIN quantiles q ON q.ts_id = m.ts_id
        GROUP BY m.ts_id, q.q1, q.median_value, q.q3
    """
    try:
        return read_sql_df(engine, sql)
    except Exception as exc:
        LOGGER.warning("Agrégation des mesures impossible (%s).", exc)
        return pd.DataFrame()


def load_stations(engine: Engine, inspector: Any) -> pd.DataFrame:
    if view_exists(inspector, "api", "v_catalog_stations"):
        try:
            df = read_sql_df(
                engine,
                """
                SELECT *
                FROM api.v_catalog_stations
                """,
            )
            if not df.empty:
                return df
        except Exception as exc:
            LOGGER.warning("Lecture api.v_catalog_stations impossible (%s).", exc)

    if table_exists(inspector, "public", "stations"):
        cols = get_table_columns(inspector, "public", "stations")
        select_cols = [
            c
            for c in [
                "station_id",
                "station_code",
                "name",
                "type_station",
                "station_type_code",
                "altitude_m",
                "start_date",
                "end_date",
                "catchment_id",
                "reach_id",
            ]
            if c in cols
        ]
        if "geom" in cols:
            select_cols.append(
                "ST_AsText(geom) AS geom_wkt"
            )
            select_cols.append(
                "CASE WHEN geom IS NOT NULL AND GeometryType(geom) IN ('POINT', 'ST_Point') THEN ST_X(geom) END AS longitude"
            )
            select_cols.append(
                "CASE WHEN geom IS NOT NULL AND GeometryType(geom) IN ('POINT', 'ST_Point') THEN ST_Y(geom) END AS latitude"
            )
        if not select_cols:
            select_cols = ["*"]
        sql = f"SELECT {', '.join(select_cols)} FROM public.stations"
        try:
            return read_sql_df(engine, sql)
        except Exception as exc:
            LOGGER.warning("Lecture de public.stations impossible (%s).", exc)
    return pd.DataFrame()


def load_catchments(engine: Engine, inspector: Any) -> pd.DataFrame:
    if table_exists(inspector, "core", "catchments"):
        try:
            return read_sql_df(engine, "SELECT catchment_id, name, dam_name FROM core.catchments")
        except Exception:
            pass
    return pd.DataFrame()


def enrich_timeseries(catalog: pd.DataFrame, stats: pd.DataFrame) -> pd.DataFrame:
    if catalog.empty:
        return catalog.copy()

    df = catalog.copy()
    if not stats.empty:
        df = df.merge(stats, on="ts_id", how="left")
    else:
        df["raw_rows"] = np.nan
        df["valid_values"] = np.nan
        df["null_values"] = np.nan
        df["measurement_start"] = pd.NaT
        df["measurement_end"] = pd.NaT
        df["min_value"] = np.nan
        df["max_value"] = np.nan
        df["mean_value"] = np.nan
        df["sum_value"] = np.nan
        df["q1"] = np.nan
        df["median_value"] = np.nan
        df["q3"] = np.nan

    df["granularity"] = df.apply(
        lambda r: infer_granularity(r.get("time_step"), r.get("start_date"), r.get("end_date"), r.get("n_points")),
        axis=1,
    )
    df["period_expected"] = df.apply(
        lambda r: expected_period_count(r.get("start_date"), r.get("end_date"), r["granularity"]),
        axis=1,
    )
    df["missing_points_estimate"] = df["period_expected"] - df["valid_values"].fillna(0)
    df["missing_points_estimate"] = df["missing_points_estimate"].clip(lower=0)
    df["null_ratio"] = np.where(
        df["raw_rows"].fillna(0) > 0,
        df["null_values"].fillna(0) / df["raw_rows"].fillna(0),
        np.nan,
    )
    df["coverage_ratio"] = np.where(
        df["period_expected"].fillna(0) > 0,
        df["valid_values"].fillna(0) / df["period_expected"].fillna(0),
        np.nan,
    )
    df["date_start_fmt"] = df.apply(lambda r: fmt_date(r.get("start_date"), r["granularity"]), axis=1)
    df["date_end_fmt"] = df.apply(lambda r: fmt_date(r.get("end_date"), r["granularity"]), axis=1)
    df["granularity_label"] = df["granularity"].map(
        {"daily": "journalière", "monthly": "mensuelle", "yearly": "annuelle"}
    )
    return df


def build_stations_inventory(stations: pd.DataFrame, ts_df: pd.DataFrame, catchments: pd.DataFrame) -> pd.DataFrame:
    if stations.empty:
        return pd.DataFrame()

    df = stations.copy()
    if "station_name" not in df.columns and "name" in df.columns:
        df["station_name"] = df["name"]
    if "type_station" not in df.columns and "station_type_code" in df.columns:
        df["type_station"] = df["station_type_code"]

    agg = (
        ts_df.groupby("station_id")
        .agg(
            total_series=("ts_id", "count"),
            total_parameters=("property_id", "nunique"),
            total_measurements=("valid_values", "sum"),
            first_date=("start_date", "min"),
            last_date=("end_date", "max"),
            dominant_granularity=("granularity", lambda s: s.mode().iat[0] if not s.mode().empty else "daily"),
        )
        .reset_index()
    )
    df = df.merge(agg, on="station_id", how="left")

    if not catchments.empty and "catchment_id" in df.columns:
        df = df.merge(catchments, on="catchment_id", how="left", suffixes=("", "_catchment"))

    if "geom_wkt" in df.columns:
        pass

    for col in ["total_series", "total_parameters", "total_measurements"]:
        if col in df.columns:
            df[col] = df[col].fillna(0).astype(int)

    df["coverage_status"] = np.select(
        [
            df["total_series"].fillna(0) == 0,
            df["total_series"].fillna(0) > 0,
        ],
        ["sans données", "avec données"],
        default="inconnu",
    )
    return df


def build_station_parameters(ts_df: pd.DataFrame) -> pd.DataFrame:
    if ts_df.empty:
        return pd.DataFrame()

    grouped = (
        ts_df.groupby(
            ["station_id", "station_code", "station_name", "property_id", "property_name", "unit"],
            dropna=False,
        )
        .agg(
            n_series=("ts_id", "count"),
            n_points=("valid_values", "sum"),
            first_date=("start_date", "min"),
            last_date=("end_date", "max"),
            dominant_granularity=("granularity", lambda s: s.mode().iat[0] if not s.mode().empty else "daily"),
            runs=("scenario_name", lambda s: "; ".join(sorted({str(v) for v in s.dropna().unique()}))),
        )
        .reset_index()
        .sort_values(["station_name", "property_name"])
    )
    return grouped


def build_timeseries_analysis(ts_df: pd.DataFrame) -> pd.DataFrame:
    if ts_df.empty:
        return pd.DataFrame()

    out = ts_df.copy()
    out["date_start_fmt"] = out.apply(lambda r: fmt_date(r.get("start_date"), r["granularity"]), axis=1)
    out["date_end_fmt"] = out.apply(lambda r: fmt_date(r.get("end_date"), r["granularity"]), axis=1)
    out["missing_classification"] = np.select(
        [
            out["raw_rows"].fillna(0) == 0,
            out["valid_values"].fillna(0) <= 3,
            out["null_ratio"].fillna(0) > 0.3,
            out["coverage_ratio"].fillna(1) < 0.5,
        ],
        ["vide", "quasi vide", "beaucoup de nulles", "couverture faible"],
        default="ok",
    )
    out["series_status"] = np.select(
        [
            out["raw_rows"].fillna(0) == 0,
            out["valid_values"].fillna(0) <= 3,
        ],
        ["vide", "faible"],
        default="exploitable",
    )
    return out


def build_anomalies(ts_df: pd.DataFrame) -> pd.DataFrame:
    if ts_df.empty:
        return pd.DataFrame(columns=["severity", "ts_id", "station_name", "property_name", "issue", "details"])

    rows: list[dict[str, Any]] = []
    for _, r in ts_df.iterrows():
        ts_id = r.get("ts_id")
        station_name = r.get("station_name") or r.get("name") or ""
        property_name = r.get("property_name") or ""
        valid_values = float(r.get("valid_values") or 0)
        raw_rows = float(r.get("raw_rows") or 0)
        null_ratio = float(r.get("null_ratio") or 0)
        coverage = float(r.get("coverage_ratio") or 0)
        missing = float(r.get("missing_points_estimate") or 0)
        q1 = r.get("q1")
        q3 = r.get("q3")
        min_value = r.get("min_value")
        max_value = r.get("max_value")

        if raw_rows == 0:
            rows.append(
                {
                    "severity": "high",
                    "ts_id": ts_id,
                    "station_name": station_name,
                    "property_name": property_name,
                    "issue": "serie_vide",
                    "details": "Aucune mesure disponible.",
                }
            )
            continue

        if valid_values <= 3:
            rows.append(
                {
                    "severity": "medium",
                    "ts_id": ts_id,
                    "station_name": station_name,
                    "property_name": property_name,
                    "issue": "quasi_vide",
                    "details": f"Seulement {int(valid_values)} valeurs valides.",
                }
            )

        if null_ratio > 0.3:
            rows.append(
                {
                    "severity": "medium",
                    "ts_id": ts_id,
                    "station_name": station_name,
                    "property_name": property_name,
                    "issue": "null_ratio_eleve",
                    "details": f"Taux de nulles: {null_ratio:.1%}.",
                }
            )

        if coverage < 0.5 and not math.isnan(coverage):
            rows.append(
                {
                    "severity": "medium",
                    "ts_id": ts_id,
                    "station_name": station_name,
                    "property_name": property_name,
                    "issue": "couverture_faible",
                    "details": f"Couverture estimée: {coverage:.1%}.",
                }
            )

        if missing > 0:
            rows.append(
                {
                    "severity": "low",
                    "ts_id": ts_id,
                    "station_name": station_name,
                    "property_name": property_name,
                    "issue": "trous_temporels_estimes",
                    "details": f"Environ {int(missing)} périodes manquantes estimées.",
                }
            )

        if pd.notna(q1) and pd.notna(q3) and pd.notna(min_value) and pd.notna(max_value):
            iqr = float(q3) - float(q1)
            lower = float(q1) - 1.5 * iqr
            upper = float(q3) + 1.5 * iqr
            if float(min_value) < lower or float(max_value) > upper:
                rows.append(
                    {
                        "severity": "low",
                        "ts_id": ts_id,
                        "station_name": station_name,
                        "property_name": property_name,
                        "issue": "valeurs_aberrantes_probables",
                        "details": f"Bornes IQR [{lower:.2f}, {upper:.2f}] ; min={float(min_value):.2f}, max={float(max_value):.2f}.",
                    }
                )

        if r.get("granularity") == "monthly":
            if pd.to_datetime(r.get("start_date"), errors="coerce").day != 1 or pd.to_datetime(r.get("end_date"), errors="coerce").day != 1:
                rows.append(
                    {
                        "severity": "low",
                        "ts_id": ts_id,
                        "station_name": station_name,
                        "property_name": property_name,
                        "issue": "incoherence_granularite",
                        "details": "Granularité mensuelle détectée mais dates non alignées au premier du mois.",
                    }
                )
        if r.get("granularity") == "yearly":
            start = pd.to_datetime(r.get("start_date"), errors="coerce")
            end = pd.to_datetime(r.get("end_date"), errors="coerce")
            if (pd.notna(start) and (start.month != 1 or start.day != 1)) or (pd.notna(end) and (end.month != 1 or end.day != 1)):
                rows.append(
                    {
                        "severity": "low",
                        "ts_id": ts_id,
                        "station_name": station_name,
                        "property_name": property_name,
                        "issue": "incoherence_granularite",
                        "details": "Granularité annuelle détectée mais dates non alignées au 1er janvier.",
                    }
                )

    return pd.DataFrame(rows)


def write_csv(df: pd.DataFrame, path: Path) -> None:
    df.to_csv(path, index=False, encoding="utf-8-sig")


def write_heatmap(matrix: pd.DataFrame, path: Path) -> None:
    if matrix.empty or plt is None or sns is None:
        return
    plt.figure(figsize=(max(10, 0.35 * matrix.shape[1] + 8), max(6, 0.35 * matrix.shape[0] + 4)))
    sns.heatmap(matrix.fillna(0), cmap="YlGnBu", linewidths=0.2, linecolor="white")
    plt.title("Disponibilité stations x paramètres")
    plt.xlabel("Paramètres")
    plt.ylabel("Stations")
    plt.tight_layout()
    plt.savefig(path, dpi=180)
    plt.close()


def safe_sheet_name(name: str) -> str:
    return re.sub(r"[\[\]\*:/\\\?]", " ", name)[:31]


def write_excel(path: Path, sheets: dict[str, pd.DataFrame]) -> None:
    def sanitize_excel_df(df: pd.DataFrame) -> pd.DataFrame:
        if df.empty:
            return df
        out = df.copy()

        def strip_tz(value: Any) -> Any:
            if isinstance(value, pd.Timestamp):
                return value.tz_localize(None) if value.tzinfo is not None else value.to_pydatetime()
            if isinstance(value, datetime) and value.tzinfo is not None:
                return value.replace(tzinfo=None)
            return value

        return out.map(strip_tz)

    target = path
    try:
        with pd.ExcelWriter(target, engine="openpyxl") as writer:
            for sheet_name, df in sheets.items():
                sanitize_excel_df(df).to_excel(writer, sheet_name=safe_sheet_name(sheet_name), index=False)
    except PermissionError:
        fallback = path.with_name(f"{path.stem}_{datetime.now().strftime('%Y%m%d_%H%M%S')}{path.suffix}")
        LOGGER.warning("Fichier Excel verrouillé, écriture dans %s", fallback)
        with pd.ExcelWriter(fallback, engine="openpyxl") as writer:
            for sheet_name, df in sheets.items():
                sanitize_excel_df(df).to_excel(writer, sheet_name=safe_sheet_name(sheet_name), index=False)


def write_markdown(path: Path, summary: dict[str, Any], stations: pd.DataFrame, ts_df: pd.DataFrame, anomalies: pd.DataFrame) -> None:
    lines: list[str] = []
    lines.append("# Database Analysis")
    lines.append("")
    lines.append("## Global summary")
    lines.append(f"- Stations: {summary.get('stations', 0)}")
    lines.append(f"- Parameters: {summary.get('parameters', 0)}")
    lines.append(f"- Time series: {summary.get('series', 0)}")
    lines.append(f"- Valid measurements: {summary.get('valid_values', 0)}")
    lines.append(f"- Global period: {summary.get('global_start', '')} -> {summary.get('global_end', '')}")
    lines.append(f"- Stations without data: {summary.get('stations_without_data', 0)}")
    lines.append("")

    lines.append("## Top stations")
    top_stations = stations.sort_values(["total_series", "total_measurements"], ascending=False).head(10)
    for _, r in top_stations.iterrows():
        station_label = r.get("station_name", r.get("name", ""))
        lines.append(
            f"- {station_label} : {int(r.get('total_series', 0))} series, "
            f"{int(r.get('total_parameters', 0))} parameters, {int(r.get('total_measurements', 0))} values"
        )
    lines.append("")

    lines.append("## Top parameters")
    if not ts_df.empty:
        top_params = (
            ts_df.groupby(["property_name", "unit"], dropna=False)
            .agg(series=("ts_id", "count"), values=("valid_values", "sum"))
            .reset_index()
            .sort_values(["series", "values"], ascending=False)
            .head(10)
        )
        for _, r in top_params.iterrows():
            unit = f" ({r['unit']})" if pd.notna(r.get("unit")) and str(r.get("unit")).strip() else ""
            values = int(r["values"]) if pd.notna(r["values"]) else 0
            lines.append(f"- {r['property_name']}{unit} : {int(r['series'])} series, {values} values")
    lines.append("")

    lines.append("## Stations without data")
    if "total_series" in stations.columns:
        no_data = stations[stations["total_series"].fillna(0) == 0]
    else:
        no_data = pd.DataFrame()
    if no_data.empty:
        lines.append("- None")
    else:
        for _, r in no_data.iterrows():
            lines.append(f"- {r.get('station_name', r.get('name', ''))}")
    lines.append("")

    lines.append("## Anomalies")
    if anomalies.empty:
        lines.append("- None")
    else:
        counts = anomalies["issue"].value_counts()
        for issue, count in counts.items():
            lines.append(f"- {issue} : {int(count)}")
    lines.append("")

    lines.append("## Temporal coverage")
    if not ts_df.empty:
        for granularity, label in [("daily", "daily"), ("monthly", "monthly"), ("yearly", "yearly")]:
            subset = ts_df[ts_df["granularity"] == granularity]
            lines.append(f"- {label} : {len(subset)} series")
    lines.append("")

    path.write_text("\n".join(lines), encoding="utf-8")


def main() -> int:
    parser = argparse.ArgumentParser(description="Analyse automatique de la base PostgreSQL Hydro-Data Intelligence")
    parser.add_argument("--output-dir", type=Path, default=OUTPUT_DIR)
    parser.add_argument("--env-file", type=Path, default=BACKEND_ENV)
    args = parser.parse_args()

    output_dir = args.output_dir
    env_file = args.env_file
    output_dir.mkdir(parents=True, exist_ok=True)

    cfg = get_db_config(env_file)
    LOGGER.info("Connexion à %s:%s/%s", cfg.host, cfg.port, cfg.dbname)
    engine = make_engine(cfg)
    inspector = inspect(engine)

    stations = load_stations(engine, inspector)
    catchments = load_catchments(engine, inspector)
    catalog = load_catalog(engine, inspector)
    stats = load_measurement_stats(engine, inspector)
    ts_df = enrich_timeseries(catalog, stats)

    if not stations.empty and not ts_df.empty and "station_name" not in stations.columns and "name" in stations.columns:
        stations["station_name"] = stations["name"]

    station_inventory = build_stations_inventory(stations, ts_df, catchments)
    station_parameters = build_station_parameters(ts_df)
    timeseries_analysis = build_timeseries_analysis(ts_df)
    anomalies = build_anomalies(timeseries_analysis)

    availability_matrix = pd.DataFrame()
    if not ts_df.empty:
        availability_matrix = pd.pivot_table(
            ts_df,
            index="station_name",
            columns="property_name",
            values="valid_values",
            aggfunc="sum",
            fill_value=0,
        ).sort_index()

    global_summary = {
        "stations": int(stations["station_id"].nunique() if "station_id" in stations.columns else len(stations)),
        "parameters": int(ts_df["property_id"].nunique() if "property_id" in ts_df.columns else 0),
        "series": int(ts_df["ts_id"].nunique() if "ts_id" in ts_df.columns else 0),
        "valid_values": int(ts_df["valid_values"].fillna(0).sum()) if not ts_df.empty else 0,
        "global_start": fmt_date(ts_df["start_date"].min(), "daily") if not ts_df.empty else "",
        "global_end": fmt_date(ts_df["end_date"].max(), "daily") if not ts_df.empty else "",
        "stations_without_data": int((station_inventory.get("total_series", 0).fillna(0) == 0).sum()) if not station_inventory.empty else 0,
    }

    # Exports CSV
    write_csv(station_inventory, output_dir / "stations_inventory.csv")
    write_csv(station_parameters, output_dir / "station_parameters.csv")
    write_csv(timeseries_analysis, output_dir / "timeseries_analysis.csv")
    write_csv(availability_matrix.reset_index(), output_dir / "availability_matrix.csv")

    # Excel
    sheets = {
        "Stations": station_inventory,
        "Paramètres": station_parameters,
        "Séries temporelles": timeseries_analysis,
        "Statistiques": timeseries_analysis[
            [
                "ts_id",
                "station_name",
                "property_name",
                "granularity",
                "raw_rows",
                "valid_values",
                "null_values",
                "min_value",
                "max_value",
                "mean_value",
                "sum_value",
                "coverage_ratio",
            ]
        ]
        if not timeseries_analysis.empty
        else pd.DataFrame(),
        "Anomalies": anomalies,
        "Disponibilité": availability_matrix.reset_index(),
    }
    write_excel(output_dir / "hydro_database_analysis.xlsx", sheets)

    # Markdown
    write_markdown(output_dir / "DATABASE_ANALYSIS.md", global_summary, station_inventory, timeseries_analysis, anomalies)

    # Heatmap PNG
    if not availability_matrix.empty:
        write_heatmap(availability_matrix, output_dir / "availability_heatmap.png")

    # Console summary
    LOGGER.info("Analyse terminée.")
    LOGGER.info("Stations: %s", global_summary["stations"])
    LOGGER.info("Séries: %s", global_summary["series"])
    LOGGER.info("Paramètres: %s", global_summary["parameters"])
    LOGGER.info("Exports: %s", output_dir)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

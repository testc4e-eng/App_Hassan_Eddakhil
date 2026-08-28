#!/usr/bin/env python3
from __future__ import annotations

import argparse
import datetime as dt
import hashlib
import json
import os
import pathlib
import re
import subprocess
import sys
import urllib.error
import urllib.parse
import urllib.request
from decimal import Decimal
from typing import Any

import psycopg2
from psycopg2.extras import RealDictCursor


ROOT = pathlib.Path(__file__).resolve().parents[2]
PROJECT_ENV_PATH = ROOT / ".env"
BACKEND_ENV_PATH = ROOT / "hydro_Hassan dakhil" / "backend" / ".env"
BACKUP_PATH = ROOT / "backups" / "hydro_hd_before_dq_corrections_20260810_1339.dump"
FRONTEND_ROOT = ROOT / "hydro_Hassan dakhil" / "frontend"

PROJECT_STATION_IDS = [2, 3, 24, 29, 35]
VISIBLE_SWAT_SCENARIOS = [
    "etat_actuel",
    "ssp126",
    "ssp245",
    "ssp585",
    "scenario_1",
    "scenario_2",
    "scenario_3",
    "scenario_4",
]
TECHNICAL_SWAT_SCENARIOS = ["SWAT_OUTPUT", "SWAT_OUTPUT_01"]
CLIMATE_CODES = {
    "PRECIPITATION",
    "TMAX",
    "TMIN",
    "TMEAN",
    "HUMIDITY_REL",
    "EVAPORATION",
    "WIND_SPEED",
}
HYDRO_CODES = {"STREAMFLOW", "SWAT_FLOW_M3S", "reservoir_bathymetry"}
EROSION_CODES = {
    "SWAT_SED_IN_TONS",
    "SWAT_SED_TONS",
    "SWAT_SED_CONC_MG_KG",
    "SWAT_SYLDT_HA",
}

NON_REGRESSION_RULES = [
    ("RULE-01", "A visible scenario must not disappear."),
    ("RULE-02", "A functional station must not lose its protected data."),
    ("RULE-03", "A protected timeseries must not lose measurement volume."),
    ("RULE-04", "Runtime reaches and subbasins must not decrease without validation."),
    ("RULE-05", "SWAT daily, monthly, yearly datasets must remain distinct."),
    ("RULE-06", "Map layers must not lose features."),
    ("RULE-07", "Protected business statistics must not change without a documented cause."),
    ("RULE-08", "Protected endpoints must not break their contract."),
    ("RULE-09", "Every future data correction must be compared to this baseline."),
    ("RULE-10", "If a protected regression is detected: immediate rollback."),
]


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Create or compare a functional protection baseline for Hassan Addakhil."
    )
    parser.add_argument("--snapshot-out", help="Path to write the JSON snapshot.")
    parser.add_argument("--report-out", help="Path to write the Markdown report.")
    parser.add_argument("--compare", help="Existing baseline JSON to compare against.")
    parser.add_argument("--backend-url", help="Backend base URL, default http://127.0.0.1:<port>.")
    parser.add_argument("--frontend-url", help="Frontend base URL, default http://127.0.0.1:<port>.")
    parser.add_argument("--db-host")
    parser.add_argument("--db-port")
    parser.add_argument("--db-name")
    parser.add_argument("--db-user")
    parser.add_argument("--db-password")
    parser.add_argument("--timeout-seconds", type=int, default=90)
    return parser.parse_args()


def read_env_file(path: pathlib.Path) -> dict[str, str]:
    if not path.exists():
        return {}
    data: dict[str, str] = {}
    for raw_line in path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        data[key.strip()] = value.strip()
    return data


def merge_env(args: argparse.Namespace) -> dict[str, str]:
    project_env = read_env_file(PROJECT_ENV_PATH)
    backend_env = read_env_file(BACKEND_ENV_PATH)
    merged = {**project_env, **backend_env}
    overrides = {
        "DB_HOST": args.db_host,
        "DB_PORT": args.db_port,
        "DB_NAME": args.db_name,
        "DB_USER": args.db_user,
        "DB_PASSWORD": args.db_password,
    }
    for key, value in overrides.items():
        if value:
            merged[key] = value
    return merged


def now_iso() -> str:
    return dt.datetime.now().astimezone().isoformat(timespec="seconds")


def now_stamp() -> str:
    return dt.datetime.now().astimezone().strftime("%Y%m%d_%H%M")


def run_command(args: list[str], cwd: pathlib.Path | None = None) -> tuple[int, str, str]:
    completed = subprocess.run(
        args,
        cwd=str(cwd) if cwd else None,
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
        check=False,
    )
    return completed.returncode, completed.stdout.strip(), completed.stderr.strip()


def stable_hash(value: Any) -> str:
    if isinstance(value, (bytes, bytearray)):
        payload = bytes(value)
    else:
        payload = json.dumps(as_plain(value), sort_keys=True, ensure_ascii=True, separators=(",", ":")).encode(
            "utf-8"
        )
    return hashlib.sha256(payload).hexdigest()[:16]


def round_or_none(value: Any, digits: int = 8) -> float | None:
    if value is None:
        return None
    return round(float(value), digits)


def as_plain(value: Any) -> Any:
    if isinstance(value, dict):
        return {str(key): as_plain(inner) for key, inner in value.items()}
    if isinstance(value, (list, tuple, set)):
        return [as_plain(item) for item in value]
    if isinstance(value, Decimal):
        return float(value)
    if isinstance(value, (dt.datetime, dt.date)):
        return value.isoformat()
    return value


def markdown_escape(value: Any) -> str:
    if value is None:
        return ""
    text = str(value)
    return text.replace("|", "\\|").replace("\n", "<br>")


def markdown_table(headers: list[str], rows: list[list[Any]]) -> str:
    lines = [
        "| " + " | ".join(headers) + " |",
        "| " + " | ".join(["---"] * len(headers)) + " |",
    ]
    for row in rows:
        lines.append("| " + " | ".join(markdown_escape(cell) for cell in row) + " |")
    return "\n".join(lines)


def fetch_json(url: str, timeout_seconds: int) -> dict[str, Any]:
    request = urllib.request.Request(url, headers={"Accept": "application/json"})
    try:
        with urllib.request.urlopen(request, timeout=timeout_seconds) as response:
            body = response.read()
            status = response.getcode()
    except urllib.error.HTTPError as error:
        body = error.read()
        status = error.code
    except Exception as error:  # pragma: no cover - defensive
        return {
            "url": url,
            "ok": False,
            "status": None,
            "bytes": 0,
            "hash": None,
            "item_count": None,
            "payload_type": None,
            "error": str(error),
        }

    text = body.decode("utf-8", errors="replace")
    try:
        parsed = json.loads(text)
    except json.JSONDecodeError:
        parsed = None

    payload = parsed.get("data") if isinstance(parsed, dict) and "data" in parsed else parsed
    summary = summarize_payload(payload)
    return {
        "url": url,
        "ok": status is not None and 200 <= status < 300,
        "status": status,
        "bytes": len(body),
        "hash": stable_hash(parsed if parsed is not None else body),
        "item_count": summary["item_count"],
        "payload_type": summary["payload_type"],
        "data_preview": summary.get("data_preview"),
        "json": as_plain(parsed),
    }


def summarize_payload(payload: Any) -> dict[str, Any]:
    if payload is None:
        return {"payload_type": None, "item_count": 0}
    if isinstance(payload, list):
        return {"payload_type": "list", "item_count": len(payload)}
    if isinstance(payload, dict):
        if payload.get("type") == "FeatureCollection":
            features = payload.get("features") or []
            return {
                "payload_type": "FeatureCollection",
                "item_count": len(features),
                "data_preview": {"geometry_types": sorted({feature.get("geometry", {}).get("type") for feature in features if isinstance(feature, dict)})},
            }
        if "campaigns" in payload and isinstance(payload["campaigns"], list):
            return {"payload_type": "dict", "item_count": len(payload["campaigns"])}
        if "scenarios" in payload and isinstance(payload["scenarios"], list):
            return {"payload_type": "dict", "item_count": len(payload["scenarios"])}
        if "years" in payload and isinstance(payload["years"], list):
            return {"payload_type": "dict", "item_count": len(payload["years"])}
        return {"payload_type": "dict", "item_count": len(payload)}
    return {"payload_type": type(payload).__name__, "item_count": None}


def make_backend_url(args: argparse.Namespace, env: dict[str, str]) -> str:
    if args.backend_url:
        return args.backend_url.rstrip("/")
    port = env.get("BACKEND_EXPOSE_PORT", "5007")
    return f"http://127.0.0.1:{port}"


def make_frontend_url(args: argparse.Namespace, env: dict[str, str]) -> str:
    if args.frontend_url:
        return args.frontend_url.rstrip("/")
    port = env.get("FRONTEND_EXPOSE_PORT", "8090")
    return f"http://127.0.0.1:{port}"


def db_connect(env: dict[str, str]):
    return psycopg2.connect(
        host=env["DB_HOST"],
        port=env["DB_PORT"],
        dbname=env["DB_NAME"],
        user=env["DB_USER"],
        password=env["DB_PASSWORD"],
    )


def fetch_all(conn, sql: str, params: tuple[Any, ...] | None = None) -> list[dict[str, Any]]:
    with conn.cursor(cursor_factory=RealDictCursor) as cursor:
        cursor.execute(sql, params)
        return [as_plain(row) for row in cursor.fetchall()]


def fetch_one(conn, sql: str, params: tuple[Any, ...] | None = None) -> dict[str, Any]:
    with conn.cursor(cursor_factory=RealDictCursor) as cursor:
        cursor.execute(sql, params)
        row = cursor.fetchone()
        return as_plain(row) if row is not None else {}


def parse_box_wkt(value: str | None) -> list[float] | None:
    if not value or not value.startswith("BOX(") or not value.endswith(")"):
        return None
    body = value[4:-1]
    try:
        first, second = body.split(",", 1)
        min_x, min_y = [float(part) for part in first.split()]
        max_x, max_y = [float(part) for part in second.split()]
    except Exception:
        return None
    return [min_x, min_y, max_x, max_y]


def docker_snapshot() -> list[dict[str, Any]]:
    code, stdout, stderr = run_command(["docker", "ps", "--format", "{{json .}}"])
    if code != 0:
        return [{"error": stderr or "docker ps failed"}]
    rows: list[dict[str, Any]] = []
    for line in stdout.splitlines():
        line = line.strip()
        if not line:
            continue
        try:
            rows.append(json.loads(line))
        except json.JSONDecodeError:
            rows.append({"raw": line})
    return rows


def git_state() -> dict[str, Any]:
    branch = run_command(["git", "branch", "--show-current"], ROOT)[1]
    commit = run_command(["git", "rev-parse", "HEAD"], ROOT)[1]
    status = run_command(["git", "status", "--short"], ROOT)[1].splitlines()
    return {
        "branch": branch,
        "commit": commit,
        "status_entries": status,
        "status_count": len(status),
    }


def validate_backup(timeout_seconds: int) -> dict[str, Any]:
    info: dict[str, Any] = {
        "path": str(BACKUP_PATH),
        "exists": BACKUP_PATH.exists(),
        "is_file": BACKUP_PATH.is_file(),
    }
    if not BACKUP_PATH.exists():
        info["ok"] = False
        return info

    stat = BACKUP_PATH.stat()
    info["size_bytes"] = stat.st_size
    info["modified_at"] = dt.datetime.fromtimestamp(stat.st_mtime).astimezone().isoformat(timespec="seconds")
    code, stdout, stderr = run_command(["pg_restore", "--list", str(BACKUP_PATH)])
    info["pg_restore_ok"] = code == 0
    info["pg_restore_error"] = stderr or None
    info["pg_restore_preview"] = "\n".join(stdout.splitlines()[:8]) if stdout else None
    info["ok"] = bool(info["exists"] and info["is_file"] and info["pg_restore_ok"])
    return info


def collect_reference_state(conn, env: dict[str, str], backend_url: str, frontend_url: str, timeout_seconds: int) -> dict[str, Any]:
    db_meta = fetch_one(
        conn,
        """
        SELECT
          current_database() AS db_name,
          version() AS db_version,
          pg_database_size(current_database()) AS db_size_bytes,
          pg_size_pretty(pg_database_size(current_database())) AS db_size_pretty
        """,
    )
    backend_health = fetch_json(f"{backend_url}/api/v1/hydro/health", timeout_seconds)
    frontend_root = fetch_json(frontend_url, timeout_seconds)
    return {
        "generated_at": now_iso(),
        "official_database": env.get("DB_NAME", "hydro_hd"),
        "backend_target": f"{env.get('DB_HOST')}:{env.get('DB_PORT')}/{env.get('DB_NAME')}",
        "git": git_state(),
        "docker_ps": docker_snapshot(),
        "backend_active": backend_health.get("ok", False),
        "frontend_active": frontend_root.get("ok", False),
        "db": db_meta,
        "backend_health": strip_json_payload(backend_health),
        "frontend_probe": strip_json_payload(frontend_root),
    }


def strip_json_payload(result: dict[str, Any]) -> dict[str, Any]:
    cleaned = {key: value for key, value in result.items() if key != "json"}
    return as_plain(cleaned)


def collect_station_inventory(conn) -> dict[str, Any]:
    rows = fetch_all(
        conn,
        """
        WITH catalog AS (
          SELECT
            station_id,
            ARRAY_AGG(DISTINCT standard_name ORDER BY standard_name) FILTER (WHERE standard_name IS NOT NULL) AS standard_names,
            ARRAY_AGG(DISTINCT scenario_code ORDER BY scenario_code) FILTER (WHERE scenario_code IS NOT NULL) AS scenarios,
            COUNT(DISTINCT ts_id) AS ts_count,
            COALESCE(SUM(n_points), 0) AS n_points
          FROM public.v_ts_catalog_enriched
          GROUP BY station_id
        )
        SELECT
          s.station_id,
          s.station_code,
          s.name,
          COALESCE(s.type_station, s.station_type_code, 'UNKNOWN') AS station_type,
          s.station_type_code,
          s.catchment_id,
          s.reach_id,
          (s.geom IS NOT NULL) AS has_geom,
          COALESCE(c.standard_names, ARRAY[]::text[]) AS standard_names,
          COALESCE(c.scenarios, ARRAY[]::text[]) AS scenarios,
          COALESCE(c.ts_count, 0) AS ts_count,
          COALESCE(c.n_points, 0) AS n_points
        FROM core.stations s
        LEFT JOIN catalog c ON c.station_id = s.station_id
        ORDER BY s.station_id
        """,
    )

    protected_rows: list[dict[str, Any]] = []
    visible_station_ids: list[int] = []
    observed_station_ids: list[int] = []
    swat_station_ids: list[int] = []
    spatial_station_ids: list[int] = []
    filtered_station_ids: list[int] = []

    for row in rows:
        variables = set(row["standard_names"] or [])
        modules: set[str] = set()
        if row["has_geom"]:
            modules.update({"Analyse spatiale", "Cartographie"})
            spatial_station_ids.append(int(row["station_id"]))
        if variables & CLIMATE_CODES:
            modules.update({"Climat", "Data Scan", "Rapports / Exports"})
        if variables & {"STREAMFLOW", "SWAT_FLOW_M3S"} or row.get("station_type_code") == "HYDROLOGIQUE":
            modules.update({"Hydrologie", "Data Scan", "Rapports / Exports"})
        if variables & EROSION_CODES:
            modules.update({"Sediments", "Rapports / Exports"})
        if row.get("station_type_code") in {"SWAT_REACH", "SWAT_SUBBASIN"}:
            modules.update({"SWAT", "Analyse spatiale", "Sediments"})
            swat_station_ids.append(int(row["station_id"]))
        if int(row["station_id"]) in PROJECT_STATION_IDS:
            modules.update({"Hydrologie", "Cartographie", "Analyse spatiale", "Data Scan"})
            filtered_station_ids.append(int(row["station_id"]))
        if row["ts_count"] > 0:
            visible_station_ids.append(int(row["station_id"]))
        if "OBSERVED" in (row["scenarios"] or []):
            observed_station_ids.append(int(row["station_id"]))

        protected = bool(modules or row["ts_count"] > 0 or row["has_geom"])
        enriched = {
            "station_id": row["station_id"],
            "code": row["station_code"],
            "name": row["name"],
            "type": row["station_type"],
            "station_type_code": row["station_type_code"],
            "used_by_modules": sorted(modules),
            "protected": protected,
            "ts_count": row["ts_count"],
            "n_points": row["n_points"],
            "scenarios": row["scenarios"],
            "standard_names": row["standard_names"],
            "has_geom": row["has_geom"],
        }
        protected_rows.append(enriched)

    protected_count = sum(1 for row in protected_rows if row["protected"])
    summary = {
        "total_stations": len(protected_rows),
        "visible_in_catalog": len(sorted(set(visible_station_ids))),
        "with_measures": len(sorted(set(visible_station_ids))),
        "observed_stations": len(sorted(set(observed_station_ids))),
        "swat_stations": len(sorted(set(swat_station_ids))),
        "spatial_stations": len(sorted(set(spatial_station_ids))),
        "voluntarily_filtered_stations": len(sorted(set(filtered_station_ids))),
        "project_station_ids": PROJECT_STATION_IDS,
        "protected_station_rows": protected_count,
    }
    return {
        "summary": summary,
        "rows": protected_rows,
        "protected_station_ids": [row["station_id"] for row in protected_rows if row["protected"]],
    }


def collect_scenarios(conn, api_endpoints: dict[str, dict[str, Any]]) -> dict[str, Any]:
    catalog_runs = api_endpoints["catalog_runs"].get("json") or {}
    run_rows = catalog_runs.get("data", []) if isinstance(catalog_runs, dict) else []
    unique_codes = []
    seen = set()
    for row in run_rows:
        code = row.get("scenario_code")
        if code and code not in seen:
            unique_codes.append(code)
            seen.add(code)

    technical_model_runs = fetch_all(
        conn,
        "SELECT * FROM core.model_runs WHERE scenario_code = ANY(%s) ORDER BY run_id",
        (TECHNICAL_SWAT_SCENARIOS,),
    )
    availability_payload = api_endpoints["swat_availability"].get("json") or {}
    availability_rows = availability_payload.get("data", []) if isinstance(availability_payload, dict) else []
    availability_codes = sorted({row.get("scenarioCode") or row.get("scenario_code") for row in availability_rows if isinstance(row, dict)})

    technical_sources = []
    source_files = [
        ROOT / "hydro_Hassan dakhil" / "backend" / "src" / "constants" / "swatScenarios.ts",
        ROOT / "scripts" / "swat-import" / "mapping.config.json",
    ]
    for path in source_files:
        if path.exists():
            content = path.read_text(encoding="utf-8", errors="replace")
            present_codes = [code for code in TECHNICAL_SWAT_SCENARIOS if code in content]
            if present_codes:
                technical_sources.append({"path": str(path), "codes": present_codes})

    visible_rows = []
    for code in unique_codes:
        visible_rows.append(
            {
                "scenario": code,
                "visible_frontend": True,
                "source": "GET /api/v1/catalog/runs",
                "protected": code in (["OBSERVED"] + VISIBLE_SWAT_SCENARIOS),
            }
        )

    technical_rows = []
    for code in TECHNICAL_SWAT_SCENARIOS:
        technical_rows.append(
            {
                "scenario": code,
                "visible_frontend": False,
                "source": "legacy / technical",
                "protected": True,
                "present_in_model_runs": any(row.get("scenario_code") == code for row in technical_model_runs),
                "present_in_swat_availability": code in availability_codes,
            }
        )

    return {
        "visible_run_rows": run_rows,
        "visible_rows": visible_rows,
        "unique_visible_scenarios": unique_codes,
        "protected_visible_scenarios": ["OBSERVED"] + VISIBLE_SWAT_SCENARIOS,
        "technical_scenarios": technical_rows,
        "technical_model_runs": technical_model_runs,
        "technical_sources": technical_sources,
    }


def collect_reaches_subbasins(conn) -> dict[str, Any]:
    summary = fetch_one(
        conn,
        """
        SELECT
          (SELECT COUNT(*) FROM core.reaches) AS core_reaches,
          (SELECT COUNT(*) FROM core.subbasins) AS core_subbasins,
          (SELECT COUNT(*) FROM gis.reach_shapes) AS runtime_reaches,
          (SELECT COUNT(*) FROM gis.subbasin_shapes) AS runtime_subbasins,
          (SELECT ARRAY_AGG(reach_id ORDER BY reach_id) FROM gis.reach_shapes) AS runtime_reach_ids,
          (SELECT ARRAY_AGG(subbasin_id ORDER BY subbasin_id) FROM gis.subbasin_shapes) AS runtime_subbasin_ids
        """
    )
    swat_map_counts = fetch_all(
        conn,
        """
        SELECT entity_type, COUNT(*) AS row_count
        FROM core.swat_entity_map
        GROUP BY entity_type
        ORDER BY entity_type
        """
    )
    return {
        "summary": summary,
        "swat_entity_map_counts": swat_map_counts,
        "rows": [
            {
                "entity": "reaches",
                "core": summary.get("core_reaches"),
                "runtime": summary.get("runtime_reaches"),
                "source": "core.reaches + gis.reach_shapes",
                "protected": True,
            },
            {
                "entity": "subbasins",
                "core": summary.get("core_subbasins"),
                "runtime": summary.get("runtime_subbasins"),
                "source": "core.subbasins + gis.subbasin_shapes",
                "protected": True,
            },
        ],
    }


def collect_variable_inventory(conn, api_endpoints: dict[str, dict[str, Any]]) -> dict[str, Any]:
    mapping = {
        "climat": api_endpoints["catalog_climat_properties"].get("json", {}).get("data", []),
        "hydro": api_endpoints["catalog_hydro_properties"].get("json", {}).get("data", []),
        "erosion": api_endpoints["catalog_erosion_properties"].get("json", {}).get("data", []),
    }
    variables: list[dict[str, Any]] = []
    for module, rows in mapping.items():
        for row in rows:
            property_id = row.get("property_id")
            stats = fetch_one(
                conn,
                """
                SELECT
                  COUNT(*) AS series_count,
                  COALESCE(SUM(n_points), 0) AS measurement_count,
                  ARRAY_AGG(DISTINCT scenario_code ORDER BY scenario_code) FILTER (WHERE scenario_code IS NOT NULL) AS scenarios
                FROM public.v_ts_catalog_enriched
                WHERE property_id = %s
                """,
                (property_id,),
            )
            variables.append(
                {
                    "property_id": property_id,
                    "code": row.get("standard_name"),
                    "name": row.get("property_name"),
                    "unit": row.get("unit"),
                    "module": module,
                    "source": "public.v_ts_catalog_enriched",
                    "series_count": stats.get("series_count", 0),
                    "measurement_count": stats.get("measurement_count", 0),
                    "scenarios": stats.get("scenarios") or [],
                }
            )
    return {"rows": variables}


def collect_timeseries(conn) -> dict[str, Any]:
    rows = fetch_all(
        conn,
        """
        WITH measurement_stats AS (
          SELECT
            m.ts_id,
            COUNT(m.datetime) AS measured_points,
            COUNT(m.value) AS non_null_points,
            MIN(m.datetime) AS measured_start_date,
            MAX(m.datetime) AS measured_end_date,
            MIN(m.value) AS min_value,
            MAX(m.value) AS max_value,
            AVG(m.value) AS avg_value
          FROM core.measurements m
          GROUP BY m.ts_id
        )
        SELECT
          v.ts_id,
          v.station_id,
          v.station_code,
          v.station_name,
          v.property_id,
          v.property_name,
          v.unit,
          v.standard_name,
          v.run_id,
          v.scenario_code,
          v.scenario_name,
          v.source_type,
          v.time_step,
          v.n_points AS catalog_points,
          v.start_date AS catalog_start_date,
          v.end_date AS catalog_end_date,
          COALESCE(ms.measured_points, 0) AS measured_points,
          COALESCE(ms.non_null_points, 0) AS non_null_points,
          ms.measured_start_date,
          ms.measured_end_date,
          ms.min_value,
          ms.max_value,
          ms.avg_value
        FROM public.v_ts_catalog_enriched v
        LEFT JOIN measurement_stats ms ON ms.ts_id = v.ts_id
        ORDER BY v.ts_id
        """
    )
    for row in rows:
        row["signature"] = stable_hash(
            {
                "ts_id": row["ts_id"],
                "station_id": row["station_id"],
                "property_id": row["property_id"],
                "run_id": row["run_id"],
                "source_type": row["source_type"],
                "time_step": row["time_step"],
                "measured_points": row["measured_points"],
                "measured_start_date": row["measured_start_date"],
                "measured_end_date": row["measured_end_date"],
                "min_value": round_or_none(row["min_value"]),
                "max_value": round_or_none(row["max_value"]),
                "avg_value": round_or_none(row["avg_value"]),
            }
        )
    summary = {
        "timeseries_count": len(rows),
        "timeseries_with_points": sum(1 for row in rows if row["measured_points"] > 0),
        "measurement_points_total": sum(int(row["measured_points"] or 0) for row in rows),
        "catalog_points_total": sum(int(row["catalog_points"] or 0) for row in rows),
    }
    return {"summary": summary, "rows": rows}


def collect_swat_baseline(conn) -> dict[str, Any]:
    rch_groups = fetch_all(
        conn,
        """
        SELECT
          scenario_code,
          time_step,
          sub_code,
          COUNT(*) AS row_count,
          MIN(period_date) AS min_date,
          MAX(period_date) AS max_date,
          COUNT(flow_in_cms) AS flow_in_non_null,
          COUNT(flow_out_cms) AS flow_out_non_null,
          COUNT(sed_in_tons) AS sed_in_non_null,
          COUNT(sed_out_tons) AS sed_out_non_null,
          MIN(flow_out_cms) AS flow_out_min,
          MAX(flow_out_cms) AS flow_out_max,
          AVG(flow_out_cms) AS flow_out_avg
        FROM access.rch_results
        GROUP BY scenario_code, time_step, sub_code
        ORDER BY scenario_code, time_step, sub_code
        """
    )
    sub_groups = fetch_all(
        conn,
        """
        SELECT
          scenario_code,
          time_step,
          sub_code,
          COUNT(*) AS row_count,
          MIN(period_date) AS min_date,
          MAX(period_date) AS max_date,
          COUNT(precip_mm) AS precip_non_null,
          COUNT(wyld_mm) AS wyld_non_null,
          COUNT(syld_t_ha) AS syld_non_null,
          MIN(wyld_mm) AS wyld_min,
          MAX(wyld_mm) AS wyld_max,
          AVG(wyld_mm) AS wyld_avg,
          MIN(syld_t_ha) AS syld_min,
          MAX(syld_t_ha) AS syld_max,
          AVG(syld_t_ha) AS syld_avg
        FROM access.sub_results
        GROUP BY scenario_code, time_step, sub_code
        ORDER BY scenario_code, time_step, sub_code
        """
    )
    rch_summary = fetch_all(
        conn,
        """
        SELECT
          scenario_code,
          time_step,
          COUNT(*) AS row_count,
          COUNT(DISTINCT sub_code) AS sub_entity_count,
          MIN(period_date) AS min_date,
          MAX(period_date) AS max_date
        FROM access.rch_results
        GROUP BY scenario_code, time_step
        ORDER BY scenario_code, time_step
        """
    )
    sub_summary = fetch_all(
        conn,
        """
        SELECT
          scenario_code,
          time_step,
          COUNT(*) AS row_count,
          COUNT(DISTINCT sub_code) AS sub_entity_count,
          MIN(period_date) AS min_date,
          MAX(period_date) AS max_date
        FROM access.sub_results
        GROUP BY scenario_code, time_step
        ORDER BY scenario_code, time_step
        """
    )
    return {
        "rch_groups": rch_groups,
        "sub_groups": sub_groups,
        "rch_summary": rch_summary,
        "sub_summary": sub_summary,
    }


def collect_db_layer(conn, schema: str, table: str, consumers: list[str], runtime_source: str) -> dict[str, Any]:
    row = fetch_one(
        conn,
        f"""
        SELECT
          COUNT(*) AS feature_count,
          MIN(ST_SRID(geom)) AS srid,
          ST_AsText(ST_Extent(geom)) AS extent_wkt,
          ARRAY_AGG(DISTINCT ST_GeometryType(geom) ORDER BY ST_GeometryType(geom)) AS geometry_types
        FROM {schema}.{table}
        WHERE geom IS NOT NULL
        """
    )
    return {
        "layer": f"{schema}.{table}",
        "feature_count": row.get("feature_count", 0),
        "srid": row.get("srid"),
        "bbox": parse_box_wkt(row.get("extent_wkt")),
        "geometry_types": row.get("geometry_types") or [],
        "runtime_source": runtime_source,
        "consumers": consumers,
    }


def iter_geojson_positions(node: Any):
    if isinstance(node, (list, tuple)) and len(node) >= 2 and all(isinstance(value, (int, float)) for value in node[:2]):
        yield float(node[0]), float(node[1])
        return
    if isinstance(node, (list, tuple)):
        for item in node:
            yield from iter_geojson_positions(item)


def collect_geojson_layer(path: pathlib.Path, consumers: list[str]) -> dict[str, Any]:
    payload = json.loads(path.read_text(encoding="utf-8"))
    features = payload.get("features") or []
    geometry_types = sorted(
        {feature.get("geometry", {}).get("type") for feature in features if isinstance(feature, dict)}
    )
    xs: list[float] = []
    ys: list[float] = []
    for feature in features:
        geometry = feature.get("geometry") if isinstance(feature, dict) else None
        if not geometry:
            continue
        for x, y in iter_geojson_positions(geometry.get("coordinates")):
            xs.append(x)
            ys.append(y)
    bbox = [min(xs), min(ys), max(xs), max(ys)] if xs and ys else None
    return {
        "layer": str(path.relative_to(ROOT)).replace("\\", "/"),
        "feature_count": len(features),
        "srid": 4326,
        "bbox": bbox,
        "geometry_types": geometry_types,
        "runtime_source": "frontend fallback file",
        "consumers": consumers,
    }


def collect_cartography(conn) -> dict[str, Any]:
    layers = [
        collect_db_layer(conn, "gis", "reach_shapes", ["Cartographie", "Analyse spatiale", "Sediments"], "database runtime"),
        collect_db_layer(conn, "gis", "subbasin_shapes", ["Cartographie", "Analyse spatiale", "Sediments"], "database runtime"),
        collect_db_layer(conn, "gis", "meteo_stations", ["Climat", "Cartographie", "Analyse spatiale"], "database runtime"),
        collect_db_layer(conn, "core", "stations", ["Cartographie", "Analyse spatiale", "Hydrologie"], "database runtime"),
        collect_geojson_layer(FRONTEND_ROOT / "public" / "data" / "hassan" / "nv_stream.geojson", ["Analyse spatiale", "Sediments"]),
        collect_geojson_layer(
            FRONTEND_ROOT / "public" / "data" / "hassan" / "subbasin_hru_summary.geojson",
            ["Analyse spatiale", "Sediments"],
        ),
    ]
    return {"layers": layers}


def pick_series(rows: list[dict[str, Any]], standard_names: set[str], limit: int, project_only: bool = False) -> list[dict[str, Any]]:
    filtered = [
        row
        for row in rows
        if row.get("standard_name") in standard_names and (not project_only or row.get("station_id") in PROJECT_STATION_IDS)
    ]
    filtered.sort(
        key=lambda row: (
            0 if row.get("source_type") == "observed" else 1,
            str(row.get("scenario_code") or ""),
            int(row.get("station_id") or 0),
            int(row.get("property_id") or 0),
            int(row.get("ts_id") or 0),
        )
    )
    return filtered[:limit]


def collect_sediment_representative_rows(swat_baseline: dict[str, Any]) -> list[dict[str, Any]]:
    picks: list[dict[str, Any]] = []
    preferred_rch = [
        ("etat_actuel", "daily", 1),
        ("ssp245", "monthly", 1),
    ]
    preferred_sub = [
        ("etat_actuel", "daily", 1),
        ("ssp245", "monthly", 1),
    ]
    for scenario_code, time_step, sub_code in preferred_rch:
        match = next(
            (
                row
                for row in swat_baseline["rch_groups"]
                if row["scenario_code"] == scenario_code and row["time_step"] == time_step and row["sub_code"] == sub_code
            ),
            None,
        )
        if match:
            picks.append(
                {
                    "domain": "reach_sediment",
                    "scenario_code": scenario_code,
                    "time_step": time_step,
                    "sub_code": sub_code,
                    "row_count": match["row_count"],
                    "min_date": match["min_date"],
                    "max_date": match["max_date"],
                    "min_value": match["flow_out_min"],
                    "max_value": match["flow_out_max"],
                    "avg_value": match["flow_out_avg"],
                    "signature": stable_hash(match),
                }
            )
    for scenario_code, time_step, sub_code in preferred_sub:
        match = next(
            (
                row
                for row in swat_baseline["sub_groups"]
                if row["scenario_code"] == scenario_code and row["time_step"] == time_step and row["sub_code"] == sub_code
            ),
            None,
        )
        if match:
            picks.append(
                {
                    "domain": "solid_yield",
                    "scenario_code": scenario_code,
                    "time_step": time_step,
                    "sub_code": sub_code,
                    "row_count": match["row_count"],
                    "min_date": match["min_date"],
                    "max_date": match["max_date"],
                    "min_value": match["syld_min"],
                    "max_value": match["syld_max"],
                    "avg_value": match["syld_avg"],
                    "signature": stable_hash(match),
                }
            )
    return picks


def collect_bathymetry_siltation(conn, api_endpoints: dict[str, dict[str, Any]]) -> dict[str, Any]:
    campaigns = fetch_one(
        conn,
        """
        SELECT
          COUNT(*) AS campaign_count,
          MIN(measurement_year) AS min_measurement_year,
          MAX(measurement_year) AS max_measurement_year,
          MIN(campaign_year) AS min_campaign_year,
          MAX(campaign_year) AS max_campaign_year,
          MIN(volume_mhm3) AS min_volume_mhm3,
          MAX(volume_mhm3) AS max_volume_mhm3
        FROM hydro.bathymetry_campaigns
        WHERE dam_code = 'HASSAN_ADDAKHIL'
        """
    )
    bathymetry = fetch_one(
        conn,
        """
        SELECT
          COUNT(*) AS point_count,
          COUNT(DISTINCT reservoir_id) AS reservoir_count,
          MIN(level_m) AS min_level_m,
          MAX(level_m) AS max_level_m,
          MIN(volume_hm3) AS min_volume_hm3,
          MAX(volume_hm3) AS max_volume_hm3
        FROM core.reservoir_bathymetry
        """
    )
    siltation_tables = fetch_one(
        conn,
        """
        SELECT
          (SELECT COUNT(*) FROM hydro.siltation_indicators) AS indicators_count,
          (SELECT COUNT(*) FROM hydro.siltation_hsv) AS hsv_count,
          (SELECT COUNT(*) FROM hydro.siltation_evolution) AS evolution_count
        """
    )
    return {
        "campaigns": campaigns,
        "reservoir_bathymetry": bathymetry,
        "siltation_tables": siltation_tables,
        "api_summary": strip_json_payload(api_endpoints["siltation_summary"]),
        "api_availability": strip_json_payload(api_endpoints["siltation_availability"]),
        "api_bathymetry_campaigns": strip_json_payload(api_endpoints["siltation_bathymetry_campaigns"]),
    }


def collect_api_endpoints(backend_url: str, frontend_url: str, timeout_seconds: int) -> dict[str, dict[str, Any]]:
    urls = {
        "backend_root": f"{backend_url}/",
        "health": f"{backend_url}/api/v1/hydro/health",
        "catalog_modules": f"{backend_url}/api/v1/catalog/modules",
        "catalog_runs": f"{backend_url}/api/v1/catalog/runs",
        "catalog_climat_properties": f"{backend_url}/api/v1/catalog/modules/climat/properties",
        "catalog_hydro_properties": f"{backend_url}/api/v1/catalog/modules/hydro/properties",
        "catalog_erosion_properties": f"{backend_url}/api/v1/catalog/modules/erosion/properties",
        "catalog_climat_stations": f"{backend_url}/api/v1/catalog/modules/climat/stations?runId=1",
        "catalog_hydro_stations": f"{backend_url}/api/v1/catalog/modules/hydro/stations?runId=3",
        "catalog_erosion_stations": f"{backend_url}/api/v1/catalog/modules/erosion/stations?runId=3",
        "catalog_availability_climat": f"{backend_url}/api/v1/catalog/availability?module=climat",
        "catalog_availability_hydro": f"{backend_url}/api/v1/catalog/availability?module=hydro",
        "catalog_availability_erosion": f"{backend_url}/api/v1/catalog/availability?module=erosion",
        "hydro_stations": f"{backend_url}/api/v1/hydro/stations?limit=5",
        "spatial_reaches": f"{backend_url}/api/v1/spatial/reaches",
        "spatial_subbasins": f"{backend_url}/api/v1/spatial/subbasins",
        "swat_summary": f"{backend_url}/api/v1/hydro/swat/summary",
        "swat_availability": f"{backend_url}/api/v1/hydro/swat/availability",
        "solid_yield_subbasins": f"{backend_url}/api/v1/solid-yield/subbasins",
        "solid_yield_availability": f"{backend_url}/api/v1/solid-yield/availability",
        "siltation_summary": f"{backend_url}/api/v1/siltation/summary",
        "siltation_availability": f"{backend_url}/api/v1/siltation/availability",
        "siltation_bathymetry_campaigns": f"{backend_url}/api/v1/siltation/bathymetry-campaigns",
        "data_scan_summary": f"{backend_url}/api/v1/data-scan/summary",
        "data_scan_periods_global": f"{backend_url}/api/v1/data-scan/periods/global",
        "frontend_root": frontend_url,
    }
    return {key: fetch_json(url, timeout_seconds) for key, url in urls.items()}


def build_modules(snapshot: dict[str, Any]) -> list[dict[str, Any]]:
    scenario_codes = snapshot["scenarios"]["protected_visible_scenarios"]
    climate_variables = [row["code"] for row in snapshot["variables"]["rows"] if row["module"] == "climat"]
    hydro_variables = [row["code"] for row in snapshot["variables"]["rows"] if row["module"] == "hydro"]
    erosion_variables = [row["code"] for row in snapshot["variables"]["rows"] if row["module"] == "erosion"]
    return [
        {
            "module": "Accueil",
            "frontend_route": "/, /home",
            "api": [],
            "backend_service": ["AuthContext / protected route"],
            "tables_views": [],
            "scenarios": [],
            "variables": [],
            "status": "ACTIVE",
        },
        {
            "module": "Dashboard",
            "frontend_route": "/dashboard",
            "api": ["/api/v1/catalog/modules", "/api/v1/catalog/runs"],
            "backend_service": ["catalog.service.ts", "HydroDataContext"],
            "tables_views": ["public.v_ts_catalog_enriched", "core.model_runs"],
            "scenarios": scenario_codes,
            "variables": climate_variables + hydro_variables + erosion_variables,
            "status": "ACTIVE",
        },
        {
            "module": "Climat",
            "frontend_route": "/dashboard?section=climate",
            "api": [
                "/api/v1/catalog/modules/climat/properties",
                "/api/v1/catalog/modules/climat/stations",
                "/api/v1/catalog/availability?module=climat",
                "/api/v1/spatial/stations/:id/climate",
            ],
            "backend_service": ["catalog.service.ts", "timeseries.service.ts", "spatial.service.ts"],
            "tables_views": ["public.v_ts_catalog_enriched", "core.timeseries", "core.measurements", "core.stations"],
            "scenarios": ["OBSERVED"],
            "variables": climate_variables,
            "status": "ACTIVE",
        },
        {
            "module": "Hydrologie",
            "frontend_route": "/dashboard?section=hydraulic",
            "api": [
                "/api/v1/hydro/*",
                "/api/v1/catalog/availability?module=hydro",
                "/api/v1/stations/:stationId/simulations",
                "/api/v1/spatial/stations/:id/timeseries",
            ],
            "backend_service": ["hydro.service.ts", "timeseries.service.ts", "stationSimulation.service.ts", "catalog.service.ts"],
            "tables_views": [
                "public.v_ts_catalog_enriched",
                "core.timeseries",
                "core.measurements",
                "core.station_subbasin_map",
                "access.sub_results",
            ],
            "scenarios": scenario_codes,
            "variables": hydro_variables,
            "status": "ACTIVE",
        },
        {
            "module": "Sediments",
            "frontend_route": "/dashboard?section=sediment",
            "api": [
                "/api/v1/solid-yield/*",
                "/api/v1/spatial/reaches/:reachId/timeseries",
                "/api/v1/maps/thematic/reaches",
                "/api/v1/maps/thematic/subbasins",
            ],
            "backend_service": ["solidYield.service.ts", "erosionSwatSeries.service.ts", "spatial.service.ts"],
            "tables_views": ["access.rch_results", "access.sub_results", "core.station_subbasin_map", "gis.reach_shapes", "gis.subbasin_shapes"],
            "scenarios": VISIBLE_SWAT_SCENARIOS,
            "variables": erosion_variables,
            "status": "ACTIVE",
        },
        {
            "module": "Transport solide Reach",
            "frontend_route": "/dashboard?section=sediment",
            "api": ["/api/v1/spatial/reaches", "/api/v1/spatial/reaches/:reachId/timeseries"],
            "backend_service": ["spatial.service.ts", "erosionSwatSeries.service.ts"],
            "tables_views": ["gis.reach_shapes", "access.rch_results"],
            "scenarios": VISIBLE_SWAT_SCENARIOS,
            "variables": ["FLOW_IN", "FLOW_OUT", "SED_IN", "SED_OUT"],
            "status": "ACTIVE",
        },
        {
            "module": "Estimation Q -> Qs",
            "frontend_route": "/dashboard?section=sediment",
            "api": [],
            "backend_service": ["frontend only - sedimentFlowEstimation.ts"],
            "tables_views": [],
            "scenarios": [],
            "variables": ["Q", "Qs", "R2", "confidence range"],
            "status": "ACTIVE",
        },
        {
            "module": "Cartographie",
            "frontend_route": "/dashboard?section=maps",
            "api": ["/api/v1/maps/*", "/api/v1/spatial/project-hassan-addakhil"],
            "backend_service": ["maps.service.ts", "spatial.service.ts"],
            "tables_views": ["gis.reach_shapes", "gis.subbasin_shapes", "gis.meteo_stations", "core.stations"],
            "scenarios": scenario_codes,
            "variables": climate_variables + hydro_variables + erosion_variables,
            "status": "ACTIVE",
        },
        {
            "module": "Analyse spatiale",
            "frontend_route": "/dashboard?section=spatial",
            "api": ["/api/v1/spatial/*"],
            "backend_service": ["spatial.service.ts"],
            "tables_views": [
                "gis.reach_shapes",
                "gis.subbasin_shapes",
                "gis.meteo_stations",
                "core.stations",
                "access.rch_results",
                "access.sub_results",
            ],
            "scenarios": scenario_codes,
            "variables": climate_variables + hydro_variables + erosion_variables,
            "status": "ACTIVE",
        },
        {
            "module": "SWAT",
            "frontend_route": "/dashboard/data/ingestion-swat",
            "api": ["/api/v1/hydro/swat/*"],
            "backend_service": ["swatIngestion.service.ts", "access.service.ts"],
            "tables_views": ["access.rch_results", "access.sub_results", "core.model_runs", "core.swat_entity_map"],
            "scenarios": VISIBLE_SWAT_SCENARIOS + TECHNICAL_SWAT_SCENARIOS,
            "variables": ["availability", "batches", "flow", "sediment", "yield"],
            "status": "ACTIVE",
        },
        {
            "module": "Data Scan",
            "frontend_route": "/dashboard?section=dataScan",
            "api": ["/api/v1/data-scan/*", "/api/v1/scan/*"],
            "backend_service": ["dataScan.service.ts"],
            "tables_views": ["public.v_ts_catalog_enriched", "core.stations", "core.measurements", "gis.reach_shapes", "gis.subbasin_shapes"],
            "scenarios": scenario_codes,
            "variables": climate_variables + hydro_variables + erosion_variables,
            "status": "ACTIVE",
        },
        {
            "module": "Programme d'intervention",
            "frontend_route": "/dashboard/intervention-program",
            "api": [],
            "backend_service": ["frontend static data only"],
            "tables_views": ["frontend/public/data/hassan/intervention-program", "src/features/intervention-program/data/interventionProgram.data.ts"],
            "scenarios": [],
            "variables": ["budget", "axes", "actions", "priority zones"],
            "status": "ACTIVE",
        },
        {
            "module": "Siltation / Envasement",
            "frontend_route": "/dashboard?section=sediment",
            "api": ["/api/v1/siltation/*"],
            "backend_service": ["siltation.service.ts"],
            "tables_views": ["hydro.bathymetry_campaigns", "core.reservoir_bathymetry", "core.reservoirs"],
            "scenarios": [],
            "variables": ["volume_mhm3", "annual_siltation_rate_mhm3", "level_m"],
            "status": "ACTIVE",
        },
        {
            "module": "Admin",
            "frontend_route": "/admin, /admin/users, /admin/database",
            "api": ["/api/auth/*", "/api/admin/*", "/api/v1/admin/*"],
            "backend_service": ["authRoutes.ts", "adminRoutes.ts", "adminDbConfig.routes.ts"],
            "tables_views": ["app settings", "users"],
            "scenarios": [],
            "variables": [],
            "status": "ACTIVE",
        },
        {
            "module": "Rapports / Exports",
            "frontend_route": "/dashboard?section=reports",
            "api": ["/api/v1/siltation/export/*"],
            "backend_service": ["ReportsModule.tsx", "siltation.service.ts"],
            "tables_views": ["public.v_ts_catalog_enriched", "hydro.bathymetry_campaigns", "core.reservoir_bathymetry"],
            "scenarios": scenario_codes,
            "variables": climate_variables + hydro_variables + erosion_variables,
            "status": "ACTIVE",
        },
    ]


def collect_protected_data(snapshot: dict[str, Any]) -> dict[str, Any]:
    cartography_layers = snapshot["cartography"]["layers"]
    swat_mapping = snapshot["reaches_subbasins"]["swat_entity_map_counts"]
    return {
        "stations_visible": snapshot["stations"]["summary"]["visible_in_catalog"],
        "stations_with_measures": snapshot["stations"]["summary"]["with_measures"],
        "stations_project_filtered": PROJECT_STATION_IDS,
        "scenarios_visible": snapshot["scenarios"]["protected_visible_scenarios"],
        "scenarios_technical": [row["scenario"] for row in snapshot["scenarios"]["technical_scenarios"]],
        "reaches_runtime_ids": snapshot["reaches_subbasins"]["summary"]["runtime_reach_ids"],
        "subbasins_runtime_ids": snapshot["reaches_subbasins"]["summary"]["runtime_subbasin_ids"],
        "variables_visible": [row["code"] for row in snapshot["variables"]["rows"]],
        "timeseries_ids": [row["ts_id"] for row in snapshot["timeseries"]["rows"]],
        "swat_group_counts": {
            "rch_groups": len(snapshot["swat"]["rch_groups"]),
            "sub_groups": len(snapshot["swat"]["sub_groups"]),
            "swat_entity_map": swat_mapping,
        },
        "map_layers": [
            {
                "layer": row["layer"],
                "feature_count": row["feature_count"],
                "bbox": row["bbox"],
            }
            for row in cartography_layers
        ],
        "bathymetry_campaigns": snapshot["bathymetry_siltation"]["campaigns"]["campaign_count"],
        "reservoir_bathymetry_points": snapshot["bathymetry_siltation"]["reservoir_bathymetry"]["point_count"],
    }


def collect_representative_samples(snapshot: dict[str, Any]) -> dict[str, Any]:
    timeseries_rows = snapshot["timeseries"]["rows"]
    hydrology = []
    for row in pick_series(timeseries_rows, {"STREAMFLOW", "SWAT_FLOW_M3S"}, 6, project_only=True):
        hydrology.append(
            {
                "station_id": row["station_id"],
                "station_code": row["station_code"],
                "variable": row["standard_name"],
                "scenario": row["scenario_code"],
                "period_start": row["measured_start_date"],
                "period_end": row["measured_end_date"],
                "point_count": row["measured_points"],
                "min_value": row["min_value"],
                "max_value": row["max_value"],
                "avg_value": row["avg_value"],
                "signature": row["signature"],
            }
        )
    climate = []
    for row in pick_series(timeseries_rows, CLIMATE_CODES, 6, project_only=False):
        climate.append(
            {
                "station_id": row["station_id"],
                "station_code": row["station_code"],
                "variable": row["standard_name"],
                "scenario": row["scenario_code"],
                "period_start": row["measured_start_date"],
                "period_end": row["measured_end_date"],
                "point_count": row["measured_points"],
                "min_value": row["min_value"],
                "max_value": row["max_value"],
                "avg_value": row["avg_value"],
                "signature": row["signature"],
            }
        )
    sediments = collect_sediment_representative_rows(snapshot["swat"])
    q_to_qs_file = FRONTEND_ROOT / "src" / "components" / "dashboard" / "modules" / "sediments" / "sedimentFlowEstimation.ts"
    q_to_qs_text = q_to_qs_file.read_text(encoding="utf-8", errors="replace")
    q_to_qs_rule_count = q_to_qs_text.count("coefficient:")
    sediments.append(
        {
            "domain": "q_to_qs_client",
            "source": str(q_to_qs_file),
            "rule_count": q_to_qs_rule_count,
            "signature": stable_hash({"rule_count": q_to_qs_rule_count}),
        }
    )
    return {
        "hydrology": hydrology,
        "climate": climate,
        "sediments": sediments,
    }


def collect_snapshot(args: argparse.Namespace) -> dict[str, Any]:
    env = merge_env(args)
    backend_url = make_backend_url(args, env)
    frontend_url = make_frontend_url(args, env)
    api_endpoints = collect_api_endpoints(backend_url, frontend_url, args.timeout_seconds)
    with db_connect(env) as conn:
        snapshot: dict[str, Any] = {
            "meta": {
                "generated_at": now_iso(),
                "root": str(ROOT),
                "backend_url": backend_url,
                "frontend_url": frontend_url,
                "official_database": env.get("DB_NAME"),
                "compare_script": str(pathlib.Path(__file__).resolve()),
            },
            "reference_state": collect_reference_state(conn, env, backend_url, frontend_url, args.timeout_seconds),
            "backup": validate_backup(args.timeout_seconds),
            "api_endpoints": {key: strip_json_payload(value) for key, value in api_endpoints.items()},
            "stations": collect_station_inventory(conn),
            "scenarios": {},
            "reaches_subbasins": collect_reaches_subbasins(conn),
            "variables": collect_variable_inventory(conn, api_endpoints),
            "timeseries": collect_timeseries(conn),
            "swat": collect_swat_baseline(conn),
            "cartography": collect_cartography(conn),
            "bathymetry_siltation": collect_bathymetry_siltation(conn, api_endpoints),
        }
        snapshot["scenarios"] = collect_scenarios(conn, api_endpoints)
        snapshot["modules"] = build_modules(snapshot)
        snapshot["protected_data"] = collect_protected_data(snapshot)
        snapshot["representative_samples"] = collect_representative_samples(snapshot)
        snapshot["non_regression_rules"] = [{"code": code, "rule": rule} for code, rule in NON_REGRESSION_RULES]
    return as_plain(snapshot)


def write_json(path: pathlib.Path, payload: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(as_plain(payload), indent=2, ensure_ascii=False), encoding="utf-8")


def write_report(path: pathlib.Path, snapshot: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)

    reference = snapshot["reference_state"]
    backup = snapshot["backup"]
    stations_summary = snapshot["stations"]["summary"]
    reaches_summary = snapshot["reaches_subbasins"]["summary"]
    timeseries_summary = snapshot["timeseries"]["summary"]

    lines: list[str] = []
    lines.append("# RAPPORT PROTECTION DONNEES FONCTIONNELLES - HASSAN ADDAKHIL")
    lines.append("")
    lines.append(f"- Date/heure : {snapshot['meta']['generated_at']}")
    lines.append(f"- Base officielle : `{snapshot['meta']['official_database']}`")
    lines.append(f"- Backend : `{snapshot['meta']['backend_url']}`")
    lines.append(f"- Frontend : `{snapshot['meta']['frontend_url']}`")
    lines.append("")
    lines.append("## 1. Resume executif")
    lines.append("")
    lines.append("- Baseline fonctionnelle creee en lecture seule.")
    lines.append(f"- Backup valide : {'OUI' if backup.get('ok') else 'NON'}.")
    lines.append(f"- Scenarios visibles proteges : {', '.join(snapshot['scenarios']['protected_visible_scenarios'])}.")
    lines.append(
        f"- Stations protegees : {stations_summary['protected_station_rows']} / {stations_summary['total_stations']}."
    )
    lines.append(
        f"- Reaches runtime proteges : {reaches_summary['runtime_reaches']} ; subbasins runtime proteges : {reaches_summary['runtime_subbasins']}."
    )
    lines.append(
        f"- Timeseries cataloguees : {timeseries_summary['timeseries_count']} ; points de mesure proteges : {timeseries_summary['measurement_points_total']}."
    )
    lines.append("")
    lines.append("## 2. Etat de reference")
    lines.append("")
    lines.append(
        markdown_table(
            ["Champ", "Valeur"],
            [
                ["Date/heure", snapshot["meta"]["generated_at"]],
                ["Branche Git", reference["git"]["branch"]],
                ["Commit Git", reference["git"]["commit"]],
                ["Backend actif", "OUI" if reference["backend_active"] else "NON"],
                ["Frontend actif", "OUI" if reference["frontend_active"] else "NON"],
                ["Version DB", reference["db"]["db_version"]],
                ["Taille DB", f"{reference['db']['db_size_pretty']} ({reference['db']['db_size_bytes']} bytes)"],
                ["Status Git", f"{reference['git']['status_count']} entree(s) modifiee(s)"],
            ],
        )
    )
    lines.append("")
    lines.append("## 3. Backup de protection")
    lines.append("")
    lines.append(
        markdown_table(
            ["Champ", "Valeur"],
            [
                ["Chemin", backup.get("path")],
                ["Present", "OUI" if backup.get("exists") else "NON"],
                ["Type fichier", "OUI" if backup.get("is_file") else "NON"],
                ["Taille", backup.get("size_bytes")],
                ["pg_restore --list", "OK" if backup.get("pg_restore_ok") else "KO"],
                ["Derniere modification", backup.get("modified_at")],
            ],
        )
    )
    lines.append("")
    lines.append("## 4. Modules fonctionnels proteges")
    lines.append("")
    lines.append(
        markdown_table(
            ["Module", "Route frontend", "API", "Service backend", "Tables / vues", "Scenarios", "Variables", "Statut"],
            [
                [
                    row["module"],
                    row["frontend_route"],
                    ", ".join(row["api"]),
                    ", ".join(row["backend_service"]),
                    ", ".join(row["tables_views"]),
                    ", ".join(row["scenarios"]),
                    ", ".join(row["variables"]),
                    row["status"],
                ]
                for row in snapshot["modules"]
            ],
        )
    )
    lines.append("")
    lines.append("## 5. PROTECTED_DATA")
    lines.append("")
    lines.append(
        markdown_table(
            ["Categorie", "Valeur"],
            [
                ["Stations visibles", snapshot["protected_data"]["stations_visible"]],
                ["Stations avec mesures", snapshot["protected_data"]["stations_with_measures"]],
                ["Stations filtrees projet", ", ".join(str(value) for value in snapshot["protected_data"]["stations_project_filtered"])],
                ["Scenarios visibles", ", ".join(snapshot["protected_data"]["scenarios_visible"])],
                ["Scenarios techniques", ", ".join(snapshot["protected_data"]["scenarios_technical"])],
                ["Runtime reaches", ", ".join(str(value) for value in snapshot["protected_data"]["reaches_runtime_ids"])],
                ["Runtime subbasins", ", ".join(str(value) for value in snapshot["protected_data"]["subbasins_runtime_ids"])],
                ["Variables visibles", ", ".join(snapshot["protected_data"]["variables_visible"])],
                ["Timeseries IDs", len(snapshot["protected_data"]["timeseries_ids"])],
                ["Bathymetrie campagnes", snapshot["protected_data"]["bathymetry_campaigns"]],
                ["Bathymetrie points", snapshot["protected_data"]["reservoir_bathymetry_points"]],
            ],
        )
    )
    lines.append("")
    lines.append("## 6. Baseline des stations")
    lines.append("")
    lines.append(
        markdown_table(
            ["Indicateur", "Valeur"],
            [
                ["Total stations", stations_summary["total_stations"]],
                ["Stations visibles catalogues", stations_summary["visible_in_catalog"]],
                ["Stations avec mesures", stations_summary["with_measures"]],
                ["Stations observees", stations_summary["observed_stations"]],
                ["Stations SWAT", stations_summary["swat_stations"]],
                ["Stations spatiales", stations_summary["spatial_stations"]],
                ["Stations filtrees volontairement", stations_summary["voluntarily_filtered_stations"]],
                ["Stations protegees", stations_summary["protected_station_rows"]],
            ],
        )
    )
    lines.append("")
    lines.append(
        markdown_table(
            ["station_id", "code", "nom", "type", "utilisee par module", "protegee"],
            [
                [
                    row["station_id"],
                    row["code"],
                    row["name"],
                    row["type"],
                    ", ".join(row["used_by_modules"]),
                    "OUI" if row["protected"] else "NON",
                ]
                for row in snapshot["stations"]["rows"]
            ],
        )
    )
    lines.append("")
    lines.append("## 7. Baseline des scenarios")
    lines.append("")
    lines.append(
        markdown_table(
            ["Scenario", "Visible frontend", "Source DB", "Protege"],
            [
                [row["scenario"], "OUI" if row["visible_frontend"] else "NON", row["source"], "OUI" if row["protected"] else "NON"]
                for row in snapshot["scenarios"]["visible_rows"]
            ]
            + [
                [row["scenario"], "NON", "legacy / technique", "OUI"]
                for row in snapshot["scenarios"]["technical_scenarios"]
            ],
        )
    )
    lines.append("")
    lines.append("## 8. Baseline reaches / subbasins")
    lines.append("")
    lines.append(
        markdown_table(
            ["Entite", "Core", "Runtime", "Source", "Protegee"],
            [
                [row["entity"], row["core"], row["runtime"], row["source"], "OUI" if row["protected"] else "NON"]
                for row in snapshot["reaches_subbasins"]["rows"]
            ],
        )
    )
    lines.append("")
    lines.append("## 9. Baseline des variables")
    lines.append("")
    lines.append(
        markdown_table(
            ["property_id", "code", "nom", "unite", "module", "source", "series", "mesures"],
            [
                [
                    row["property_id"],
                    row["code"],
                    row["name"],
                    row["unit"],
                    row["module"],
                    row["source"],
                    row["series_count"],
                    row["measurement_count"],
                ]
                for row in snapshot["variables"]["rows"]
            ],
        )
    )
    lines.append("")
    lines.append("## 10. Baseline timeseries")
    lines.append("")
    lines.append(
        markdown_table(
            ["Indicateur", "Valeur"],
            [
                ["Nombre de timeseries", timeseries_summary["timeseries_count"]],
                ["Timeseries avec points", timeseries_summary["timeseries_with_points"]],
                ["Points mesures", timeseries_summary["measurement_points_total"]],
                ["Points catalogue", timeseries_summary["catalog_points_total"]],
            ],
        )
    )
    lines.append("")
    lines.append(
        markdown_table(
            ["ts_id", "station_id", "property_id", "run_id", "source_type", "time_step", "min date", "max date", "mesures", "signature"],
            [
                [
                    row["ts_id"],
                    row["station_id"],
                    row["property_id"],
                    row["run_id"],
                    row["source_type"],
                    row["time_step"],
                    row["measured_start_date"],
                    row["measured_end_date"],
                    row["measured_points"],
                    row["signature"],
                ]
                for row in snapshot["timeseries"]["rows"]
            ],
        )
    )
    lines.append("")
    lines.append("## 11. Baseline SWAT")
    lines.append("")
    lines.append("### access.rch_results")
    lines.append("")
    lines.append(
        markdown_table(
            ["Scenario", "Time step", "Lignes", "Sous-entites", "Min date", "Max date"],
            [
                [row["scenario_code"], row["time_step"], row["row_count"], row["sub_entity_count"], row["min_date"], row["max_date"]]
                for row in snapshot["swat"]["rch_summary"]
            ],
        )
    )
    lines.append("")
    lines.append("### access.sub_results")
    lines.append("")
    lines.append(
        markdown_table(
            ["Scenario", "Time step", "Lignes", "Sous-entites", "Min date", "Max date"],
            [
                [row["scenario_code"], row["time_step"], row["row_count"], row["sub_entity_count"], row["min_date"], row["max_date"]]
                for row in snapshot["swat"]["sub_summary"]
            ],
        )
    )
    lines.append("")
    lines.append("## 12. Baseline cartographique")
    lines.append("")
    lines.append(
        markdown_table(
            ["Couche", "Features", "SRID", "BBox", "Source runtime", "Module consommateur"],
            [
                [
                    row["layer"],
                    row["feature_count"],
                    row["srid"],
                    row["bbox"],
                    row["runtime_source"],
                    ", ".join(row["consumers"]),
                ]
                for row in snapshot["cartography"]["layers"]
            ],
        )
    )
    lines.append("")
    lines.append("## 13. Baseline hydrologie")
    lines.append("")
    lines.append(
        markdown_table(
            ["Station", "Variable", "Scenario", "Periode", "Points", "Min", "Max", "Moyenne", "Signature"],
            [
                [
                    row["station_code"],
                    row["variable"],
                    row["scenario"],
                    f"{row['period_start']} -> {row['period_end']}",
                    row["point_count"],
                    row["min_value"],
                    row["max_value"],
                    row["avg_value"],
                    row["signature"],
                ]
                for row in snapshot["representative_samples"]["hydrology"]
            ],
        )
    )
    lines.append("")
    lines.append("## 14. Baseline climat")
    lines.append("")
    lines.append(
        markdown_table(
            ["Station", "Variable", "Scenario", "Periode", "Points", "Min", "Max", "Moyenne", "Signature"],
            [
                [
                    row["station_code"],
                    row["variable"],
                    row["scenario"],
                    f"{row['period_start']} -> {row['period_end']}",
                    row["point_count"],
                    row["min_value"],
                    row["max_value"],
                    row["avg_value"],
                    row["signature"],
                ]
                for row in snapshot["representative_samples"]["climate"]
            ],
        )
    )
    lines.append("")
    lines.append("## 15. Baseline sediments")
    lines.append("")
    lines.append(
        markdown_table(
            ["Domaine", "Scenario", "Time step", "Entite", "Lignes", "Periode", "Min", "Max", "Moyenne", "Signature"],
            [
                [
                    row.get("domain"),
                    row.get("scenario_code"),
                    row.get("time_step"),
                    row.get("sub_code") or row.get("rule_count"),
                    row.get("row_count"),
                    f"{row.get('min_date')} -> {row.get('max_date')}",
                    row.get("min_value"),
                    row.get("max_value"),
                    row.get("avg_value"),
                    row.get("signature"),
                ]
                for row in snapshot["representative_samples"]["sediments"]
            ],
        )
    )
    lines.append("")
    lines.append("## 16. Baseline bathymetrie / siltation")
    lines.append("")
    lines.append(
        markdown_table(
            ["Bloc", "Valeur"],
            [
                ["Campagnes bathymetrie", snapshot["bathymetry_siltation"]["campaigns"]],
                ["Points reservoir_bathymetry", snapshot["bathymetry_siltation"]["reservoir_bathymetry"]],
                ["Tables siltation", snapshot["bathymetry_siltation"]["siltation_tables"]],
                ["API summary", snapshot["bathymetry_siltation"]["api_summary"]],
                ["API availability", snapshot["bathymetry_siltation"]["api_availability"]],
                ["API bathymetry campaigns", snapshot["bathymetry_siltation"]["api_bathymetry_campaigns"]],
            ],
        )
    )
    lines.append("")
    lines.append("## 17. Baseline API")
    lines.append("")
    lines.append(
        markdown_table(
            ["Endpoint", "HTTP", "Bytes", "Items", "Hash", "Type"],
            [
                [
                    key,
                    value.get("status"),
                    value.get("bytes"),
                    value.get("item_count"),
                    value.get("hash"),
                    value.get("payload_type"),
                ]
                for key, value in snapshot["api_endpoints"].items()
            ],
        )
    )
    lines.append("")
    lines.append("## 18. Regles de non-regression")
    lines.append("")
    lines.append(
        markdown_table(
            ["Code", "Regle"],
            [[row["code"], row["rule"]] for row in snapshot["non_regression_rules"]],
        )
    )
    lines.append("")
    lines.append("## 19. Artefacts")
    lines.append("")
    lines.append(f"- Baseline JSON : `{snapshot['output_paths']['baseline_json']}`")
    lines.append(f"- Script de comparaison : `{snapshot['meta']['compare_script']}`")
    lines.append("")
    lines.append("## 20. Limites")
    lines.append("")
    lines.append("- Baseline prise en lecture seule a partir de l'etat courant du backend, du frontend et de la base officielle.")
    lines.append("- Le rapport conserve les signatures de protection, pas les mesures detaillees ligne par ligne.")
    lines.append("- Toute correction future devra etre comparee a cette baseline avant validation.")

    path.write_text("\n".join(lines) + "\n", encoding="utf-8")


def compare_lists(baseline_values: list[Any], current_values: list[Any]) -> tuple[list[Any], list[Any]]:
    baseline_set = set(baseline_values)
    current_set = set(current_values)
    missing = sorted(baseline_set - current_set)
    extra = sorted(current_set - baseline_set)
    return missing, extra


def compare_station_rows(baseline_rows: list[dict[str, Any]], current_rows: list[dict[str, Any]]) -> list[tuple[str, str, str]]:
    current_by_id = {row["station_id"]: row for row in current_rows}
    results: list[tuple[str, str, str]] = []
    for row in baseline_rows:
        if not row.get("protected"):
            continue
        current = current_by_id.get(row["station_id"])
        if not current:
            results.append(("REGRESSION", f"station:{row['station_id']}", "Protected station disappeared from inventory."))
            continue
        if int(current.get("n_points") or 0) < int(row.get("n_points") or 0):
            results.append(
                (
                    "REGRESSION",
                    f"station:{row['station_id']}",
                    f"Protected station lost measurement volume ({current.get('n_points')} < {row.get('n_points')}).",
                )
            )
    if not results:
        results.append(("OK", "stations", "Protected station inventory preserved."))
    return results


def compare_timeseries_rows(baseline_rows: list[dict[str, Any]], current_rows: list[dict[str, Any]]) -> list[tuple[str, str, str]]:
    current_by_id = {row["ts_id"]: row for row in current_rows}
    results: list[tuple[str, str, str]] = []
    for row in baseline_rows:
        current = current_by_id.get(row["ts_id"])
        if not current:
            results.append(("REGRESSION", f"timeseries:{row['ts_id']}", "Protected timeseries disappeared."))
            continue
        baseline_points = int(row.get("measured_points") or 0)
        current_points = int(current.get("measured_points") or 0)
        if current_points < baseline_points:
            results.append(
                (
                    "REGRESSION",
                    f"timeseries:{row['ts_id']}",
                    f"Measurement count decreased ({current_points} < {baseline_points}).",
                )
            )
        baseline_end = str(row.get("measured_end_date") or "")
        current_end = str(current.get("measured_end_date") or "")
        baseline_start = str(row.get("measured_start_date") or "")
        current_start = str(current.get("measured_start_date") or "")
        if baseline_start and current_start and current_start > baseline_start:
            results.append(("REGRESSION", f"timeseries:{row['ts_id']}", "Start date moved forward."))
        if baseline_end and current_end and current_end < baseline_end:
            results.append(("REGRESSION", f"timeseries:{row['ts_id']}", "End date moved backward."))
        baseline_min = round_or_none(row.get("min_value"))
        baseline_max = round_or_none(row.get("max_value"))
        baseline_avg = round_or_none(row.get("avg_value"))
        current_min = round_or_none(current.get("min_value"))
        current_max = round_or_none(current.get("max_value"))
        current_avg = round_or_none(current.get("avg_value"))
        if (baseline_min, baseline_max, baseline_avg) != (current_min, current_max, current_avg):
            results.append(("WARNING", f"timeseries:{row['ts_id']}", "Signature changed while point count stayed stable."))
    if not results:
        results.append(("OK", "timeseries", "Protected timeseries signatures and volumes preserved."))
    return results


def compare_swat_groups(key_name: str, baseline_rows: list[dict[str, Any]], current_rows: list[dict[str, Any]]) -> list[tuple[str, str, str]]:
    current_by_key = {
        (row["scenario_code"], row["time_step"], row["sub_code"]): row
        for row in current_rows
    }
    results: list[tuple[str, str, str]] = []
    for row in baseline_rows:
        key = (row["scenario_code"], row["time_step"], row["sub_code"])
        current = current_by_key.get(key)
        if not current:
            results.append(("REGRESSION", f"{key_name}:{key}", "Protected SWAT group disappeared."))
            continue
        if int(current.get("row_count") or 0) < int(row.get("row_count") or 0):
            results.append(("REGRESSION", f"{key_name}:{key}", "SWAT row count decreased."))
        baseline_min = str(row.get("min_date") or "")
        current_min = str(current.get("min_date") or "")
        baseline_max = str(row.get("max_date") or "")
        current_max = str(current.get("max_date") or "")
        if baseline_min and current_min and current_min > baseline_min:
            results.append(("REGRESSION", f"{key_name}:{key}", "SWAT min date moved forward."))
        if baseline_max and current_max and current_max < baseline_max:
            results.append(("REGRESSION", f"{key_name}:{key}", "SWAT max date moved backward."))
    if not results:
        results.append(("OK", key_name, "Protected SWAT groups preserved."))
    return results


def compare_layers(baseline_rows: list[dict[str, Any]], current_rows: list[dict[str, Any]]) -> list[tuple[str, str, str]]:
    current_by_layer = {row["layer"]: row for row in current_rows}
    results: list[tuple[str, str, str]] = []
    for row in baseline_rows:
        current = current_by_layer.get(row["layer"])
        if not current:
            results.append(("REGRESSION", f"layer:{row['layer']}", "Protected layer disappeared."))
            continue
        if int(current.get("feature_count") or 0) < int(row.get("feature_count") or 0):
            results.append(("REGRESSION", f"layer:{row['layer']}", "Feature count decreased."))
        elif current.get("feature_count") != row.get("feature_count"):
            results.append(("WARNING", f"layer:{row['layer']}", "Feature count changed."))
    if not results:
        results.append(("OK", "layers", "Protected cartographic layers preserved."))
    return results


def compare_api_endpoints(baseline_rows: dict[str, dict[str, Any]], current_rows: dict[str, dict[str, Any]]) -> list[tuple[str, str, str]]:
    results: list[tuple[str, str, str]] = []
    volatile_hash_keys = {"backend_root", "health", "frontend_root", "siltation_summary"}
    for key, baseline in baseline_rows.items():
        current = current_rows.get(key)
        if not current:
            results.append(("REGRESSION", f"api:{key}", "Protected endpoint disappeared from probe set."))
            continue
        baseline_status = baseline.get("status")
        current_status = current.get("status")
        if baseline_status != current_status:
            results.append(("REGRESSION", f"api:{key}", f"HTTP status changed ({current_status} != {baseline_status})."))
            continue
        baseline_items = baseline.get("item_count")
        current_items = current.get("item_count")
        if baseline_items is not None and current_items is not None and current_items != baseline_items:
            level = "REGRESSION" if current_items < baseline_items else "WARNING"
            results.append((level, f"api:{key}", f"Item count changed ({current_items} != {baseline_items})."))
            continue
        baseline_hash = baseline.get("hash")
        current_hash = current.get("hash")
        if key not in volatile_hash_keys and baseline_hash != current_hash:
            results.append(("WARNING", f"api:{key}", "Endpoint payload hash changed."))
    if not results:
        results.append(("OK", "api", "Protected endpoint probes preserved."))
    return results


def compare_snapshots(baseline: dict[str, Any], current: dict[str, Any]) -> tuple[str, list[tuple[str, str, str]]]:
    results: list[tuple[str, str, str]] = []

    missing_scenarios, extra_scenarios = compare_lists(
        baseline["scenarios"]["protected_visible_scenarios"],
        current["scenarios"]["protected_visible_scenarios"],
    )
    if missing_scenarios:
        results.append(("REGRESSION", "scenarios", f"Visible protected scenarios disappeared: {', '.join(missing_scenarios)}."))
    else:
        results.append(("OK", "scenarios", "Protected visible scenarios preserved."))
    if extra_scenarios:
        results.append(("WARNING", "scenarios", f"Additional visible scenarios detected: {', '.join(extra_scenarios)}."))

    baseline_runtime = baseline["reaches_subbasins"]["summary"]
    current_runtime = current["reaches_subbasins"]["summary"]
    if int(current_runtime["runtime_reaches"]) < int(baseline_runtime["runtime_reaches"]):
        results.append(("REGRESSION", "runtime_reaches", "Runtime reach count decreased."))
    else:
        results.append(("OK", "runtime_reaches", "Runtime reach count preserved or increased."))
    if int(current_runtime["runtime_subbasins"]) < int(baseline_runtime["runtime_subbasins"]):
        results.append(("REGRESSION", "runtime_subbasins", "Runtime subbasin count decreased."))
    else:
        results.append(("OK", "runtime_subbasins", "Runtime subbasin count preserved or increased."))

    results.extend(compare_station_rows(baseline["stations"]["rows"], current["stations"]["rows"]))
    results.extend(compare_timeseries_rows(baseline["timeseries"]["rows"], current["timeseries"]["rows"]))
    results.extend(compare_swat_groups("rch", baseline["swat"]["rch_groups"], current["swat"]["rch_groups"]))
    results.extend(compare_swat_groups("sub", baseline["swat"]["sub_groups"], current["swat"]["sub_groups"]))
    results.extend(compare_layers(baseline["cartography"]["layers"], current["cartography"]["layers"]))
    results.extend(compare_api_endpoints(baseline["api_endpoints"], current["api_endpoints"]))

    if any(level == "REGRESSION" for level, _, _ in results):
        status = "REGRESSION"
    elif any(level == "WARNING" for level, _, _ in results):
        status = "WARNING"
    else:
        status = "OK"
    return status, results


def main() -> int:
    args = parse_args()
    if not args.snapshot_out and not args.compare:
        print("Nothing to do. Use --snapshot-out and/or --compare.", file=sys.stderr)
        return 1

    snapshot = collect_snapshot(args)

    if args.snapshot_out:
        snapshot_path = pathlib.Path(args.snapshot_out).resolve()
        snapshot["output_paths"] = {
            "baseline_json": str(snapshot_path),
            "report_markdown": str(pathlib.Path(args.report_out).resolve()) if args.report_out else None,
        }
        write_json(snapshot_path, snapshot)

    if args.report_out:
        report_path = pathlib.Path(args.report_out).resolve()
        if "output_paths" not in snapshot:
            snapshot["output_paths"] = {
                "baseline_json": str(pathlib.Path(args.snapshot_out).resolve()) if args.snapshot_out else None,
                "report_markdown": str(report_path),
            }
        write_report(report_path, snapshot)

    if args.compare:
        baseline = json.loads(pathlib.Path(args.compare).read_text(encoding="utf-8"))
        status, results = compare_snapshots(baseline, snapshot)
        print(f"COMPARE STATUS: {status}")
        for level, code, message in results:
            print(f"{level}: {code}: {message}")
        return 2 if status == "REGRESSION" else 0

    return 0


if __name__ == "__main__":
    raise SystemExit(main())

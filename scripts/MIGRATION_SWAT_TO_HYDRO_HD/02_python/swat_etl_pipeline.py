"""
ETL SWAT de référence (lecture seule côté source MDB, chargement contrôlé côté PostgreSQL).

Usage:
  python swat_etl_pipeline.py --dry-run
  python swat_etl_pipeline.py --commit
"""

from __future__ import annotations

import argparse
import os
from dataclasses import dataclass
from datetime import datetime, timezone


@dataclass
class Config:
    src_mdb_path: str
    pg_host: str
    pg_port: int
    pg_db: str
    pg_user: str
    pg_password: str
    dry_run: bool


def load_config(dry_run: bool) -> Config:
    return Config(
        src_mdb_path=os.getenv(
            "SWAT_MDB_PATH",
            r"C:\dev\Projects\hydro_HD\Données_Bge_Hassan_Addakhil\Access\SWATOutput.mdb",
        ),
        pg_host=os.getenv("DB_HOST", "localhost"),
        pg_port=int(os.getenv("DB_PORT", "5432")),
        pg_db=os.getenv("DB_NAME", "hydro_hd_1714"),
        pg_user=os.getenv("DB_USER", "postgres"),
        pg_password=os.getenv("DB_PASSWORD", "postgres"),
        dry_run=dry_run,
    )


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--commit", action="store_true")
    args = parser.parse_args()

    dry_run = args.dry_run or not args.commit
    cfg = load_config(dry_run)
    batch = datetime.now(timezone.utc).strftime("SWAT_%Y%m%d_%H%M%S")

    print("[INFO] SWAT ETL pipeline")
    print(f"[INFO] batch={batch} dry_run={cfg.dry_run}")
    print(f"[INFO] source_mdb={cfg.src_mdb_path}")
    print(f"[INFO] postgres={cfg.pg_host}:{cfg.pg_port}/{cfg.pg_db}")
    print("[INFO] Ce script est un squelette sécurisé; l'ingestion opérationnelle est exposée via /api/v1/hydro/swat/import.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

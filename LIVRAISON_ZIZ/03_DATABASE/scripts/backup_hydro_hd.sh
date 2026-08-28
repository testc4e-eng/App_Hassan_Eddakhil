#!/usr/bin/env bash
set -euo pipefail

fail() {
  printf 'ERROR: %s\n' "$1" >&2
  exit 1
}

require_command() {
  command -v "$1" >/dev/null 2>&1 || fail "Missing required command: $1"
}

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
DEFAULT_BACKUP_DIR="$(cd -- "${SCRIPT_DIR}/.." && pwd)/backup"

BACKUP_DIR="${BACKUP_DIR:-$DEFAULT_BACKUP_DIR}"
DB_NAME="${HDI_DB_NAME:-${PGDATABASE:-${POSTGRES_DB:-hydro_hd}}}"
DB_HOST="${PGHOST:-${DB_HOST:-localhost}}"
DB_PORT="${PGPORT:-${DB_PORT:-5432}}"
DB_USER="${PGUSER:-${DB_USER:-${POSTGRES_USER:-postgres}}}"

if [ -n "${PGPASSWORD:-}" ]; then
  export PGPASSWORD
elif [ -n "${DB_PASSWORD:-}" ]; then
  export PGPASSWORD="${DB_PASSWORD}"
elif [ -n "${POSTGRES_PASSWORD:-}" ]; then
  export PGPASSWORD="${POSTGRES_PASSWORD}"
fi

require_command pg_dump
require_command pg_restore

timestamp="$(date '+%Y%m%d_%H%M')"
output_file="${BACKUP_DIR}/${DB_NAME}_${timestamp}.dump"

umask 077
mkdir -p "${BACKUP_DIR}"

printf 'Creating PostgreSQL custom backup for %s on %s:%s\n' "${DB_NAME}" "${DB_HOST}" "${DB_PORT}"

pg_dump \
  --format=custom \
  --file "${output_file}" \
  --host "${DB_HOST}" \
  --port "${DB_PORT}" \
  --username "${DB_USER}" \
  "${DB_NAME}"

pg_restore --list "${output_file}" >/dev/null

printf 'Backup created: %s\n' "${output_file}"

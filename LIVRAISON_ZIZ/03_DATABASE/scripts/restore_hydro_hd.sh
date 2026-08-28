#!/usr/bin/env bash
set -euo pipefail

fail() {
  printf 'ERROR: %s\n' "$1" >&2
  exit 1
}

require_command() {
  command -v "$1" >/dev/null 2>&1 || fail "Missing required command: $1"
}

usage() {
  cat <<'EOF'
Usage:
  restore_hydro_hd.sh /path/to/hydro_hd.dump

Required environment:
  HDI_DB_NAME or PGDATABASE or POSTGRES_DB
  PGHOST/DB_HOST as needed
  PGPORT/DB_PORT as needed
  PGUSER/DB_USER/POSTGRES_USER as needed
  PGPASSWORD/DB_PASSWORD/POSTGRES_PASSWORD as needed

Safety:
  The script asks for explicit confirmation before restoring.
  For non-interactive execution, export RESTORE_CONFIRM=RESTORE.
EOF
}

[ "${1:-}" = "--help" ] && usage && exit 0
[ $# -ge 1 ] || { usage >&2; exit 1; }

DUMP_FILE="$1"
TARGET_DB="${TARGET_DB_NAME:-${HDI_DB_NAME:-${PGDATABASE:-${POSTGRES_DB:-}}}}"
DB_HOST="${PGHOST:-${DB_HOST:-localhost}}"
DB_PORT="${PGPORT:-${DB_PORT:-5432}}"
DB_USER="${PGUSER:-${DB_USER:-${POSTGRES_USER:-postgres}}}"

[ -n "${TARGET_DB}" ] || fail "No target database configured. Set TARGET_DB_NAME, HDI_DB_NAME, PGDATABASE or POSTGRES_DB."
[ -f "${DUMP_FILE}" ] || fail "Dump file not found: ${DUMP_FILE}"
[ "${TARGET_DB}" != "postgres" ] || fail "Refusing to restore into the postgres maintenance database."

if [ -n "${PGPASSWORD:-}" ]; then
  export PGPASSWORD
elif [ -n "${DB_PASSWORD:-}" ]; then
  export PGPASSWORD="${DB_PASSWORD}"
elif [ -n "${POSTGRES_PASSWORD:-}" ]; then
  export PGPASSWORD="${POSTGRES_PASSWORD}"
fi

require_command pg_restore
require_command psql

pg_restore --list "${DUMP_FILE}" >/dev/null 2>&1 || fail "Unreadable dump for pg_restore: ${DUMP_FILE}"

printf 'Restore target: %s@%s:%s/%s\n' "${DB_USER}" "${DB_HOST}" "${DB_PORT}" "${TARGET_DB}"
printf 'Dump source: %s\n' "${DUMP_FILE}"
printf 'This operation will replace objects inside the target database.\n'

if [ "${RESTORE_CONFIRM:-}" != "RESTORE" ]; then
  if [ ! -t 0 ]; then
    fail "Interactive confirmation required. Re-run in a TTY or export RESTORE_CONFIRM=RESTORE."
  fi

  printf 'Type RESTORE to continue: '
  read -r confirmation
  [ "${confirmation}" = "RESTORE" ] || fail "Restore aborted by user."
fi

pg_restore \
  --verbose \
  --exit-on-error \
  --clean \
  --if-exists \
  --no-owner \
  --no-privileges \
  --host "${DB_HOST}" \
  --port "${DB_PORT}" \
  --username "${DB_USER}" \
  --dbname "${TARGET_DB}" \
  "${DUMP_FILE}"

if psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${TARGET_DB}" -Atqc "SELECT to_regclass('api.mv_scenario_catalog') IS NOT NULL" | grep -qx 't'; then
  printf 'Refreshing materialized view api.mv_scenario_catalog...\n'
  psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${TARGET_DB}" -c "REFRESH MATERIALIZED VIEW api.mv_scenario_catalog;"
else
  printf 'Materialized view api.mv_scenario_catalog not present, skipping refresh.\n'
fi

printf 'Restore completed on database %s\n' "${TARGET_DB}"

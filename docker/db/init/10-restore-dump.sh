#!/bin/sh
set -eu

DUMP_PATH="${HYDRO_HD_RESTORE_DUMP_PATH:-/backup/hydro_hd.dump}"
TARGET_DB="${POSTGRES_DB:?POSTGRES_DB is required}"
TARGET_USER="${POSTGRES_USER:?POSTGRES_USER is required}"

if [ ! -f "$DUMP_PATH" ]; then
  echo "No dump found at $DUMP_PATH, skipping restore."
  exit 0
fi

if ! pg_restore --list "$DUMP_PATH" >/dev/null 2>&1; then
  echo "Dump at $DUMP_PATH is not a readable PostgreSQL archive for pg_restore."
  exit 1
fi

echo "Restoring PostgreSQL dump from $DUMP_PATH into $TARGET_DB"
pg_restore \
  --verbose \
  --exit-on-error \
  --clean \
  --if-exists \
  --no-owner \
  --no-privileges \
  --username "$TARGET_USER" \
  --dbname "$TARGET_DB" \
  "$DUMP_PATH"

if psql -U "$TARGET_USER" -d "$TARGET_DB" -Atqc "SELECT to_regclass('api.mv_scenario_catalog') IS NOT NULL" | grep -qx 't'; then
  echo "Refreshing materialized view api.mv_scenario_catalog..."
  psql -U "$TARGET_USER" -d "$TARGET_DB" -c "REFRESH MATERIALIZED VIEW api.mv_scenario_catalog;"
else
  echo "Materialized view api.mv_scenario_catalog not present, skipping refresh."
fi

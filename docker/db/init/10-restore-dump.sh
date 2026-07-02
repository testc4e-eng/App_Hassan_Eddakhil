#!/bin/sh
set -eu

DUMP_PATH="/backup/hydro_hd.dump"

if [ ! -f "$DUMP_PATH" ]; then
  echo "No dump found at $DUMP_PATH, skipping restore."
  exit 0
fi

echo "Restoring PostgreSQL dump from $DUMP_PATH into $POSTGRES_DB"
pg_restore \
  --verbose \
  --clean \
  --if-exists \
  --no-owner \
  --no-privileges \
  --username "$POSTGRES_USER" \
  --dbname "$POSTGRES_DB" \
  "$DUMP_PATH"

# Refresh materialized views that may be unpopulated after a binary restore.
# Catalog views are required by the backend health-check and catalog APIs.
echo "Refreshing materialized views..."
psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "REFRESH MATERIALIZED VIEW api.mv_scenario_catalog;"
psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "REFRESH MATERIALIZED VIEW CONCURRENTLY api.mv_scenario_catalog;" || true

param(
  [string]$EnvFile = ".env.migration"
)

$ErrorActionPreference = "Stop"

Write-Host "==> Loading env from $EnvFile"
Get-Content $EnvFile | ForEach-Object {
  if ($_ -match '^(?<k>[^#=]+)=(?<v>.*)$') {
    [System.Environment]::SetEnvironmentVariable($Matches.k.Trim(), $Matches.v.Trim(), "Process")
  }
}

if (-not $env:TGT_DB_HOST -or -not $env:TGT_DB_NAME -or -not $env:TGT_DB_USER) {
  throw "Missing target DB env variables in $EnvFile"
}
if (-not $env:SRC_DB_HOST -or -not $env:SRC_DB_NAME -or -not $env:SRC_DB_USER) {
  throw "Missing source DB env variables in $EnvFile"
}

$env:PGPASSWORD = $env:TGT_DB_PASSWORD

Write-Host "==> 1) Create staging structures"
psql -v ON_ERROR_STOP=1 -h $env:TGT_DB_HOST -p $env:TGT_DB_PORT -U $env:TGT_DB_USER -d $env:TGT_DB_NAME -f "..\03_staging_sql\01_create_staging_tables.sql"

Write-Host "==> 2) ETL commit source -> staging.raw_*"
python "..\04_etl_python\etl_migrate_abhgzr.py" --mode commit

Write-Host "==> 3) Resolve latest successful batch_id"
$batchId = psql -t -A -h $env:TGT_DB_HOST -p $env:TGT_DB_PORT -U $env:TGT_DB_USER -d $env:TGT_DB_NAME -c "SELECT load_batch_id FROM staging.migration_batches WHERE mode='commit' AND status='success' ORDER BY started_at DESC LIMIT 1;"
$batchId = $batchId.Trim()
if ([string]::IsNullOrWhiteSpace($batchId)) {
  throw "No successful batch found in staging.migration_batches"
}
Write-Host "   batch_id = $batchId"

Write-Host "==> 4) Normalize staging"
psql -v ON_ERROR_STOP=1 -h $env:TGT_DB_HOST -p $env:TGT_DB_PORT -U $env:TGT_DB_USER -d $env:TGT_DB_NAME -v load_batch_id=$batchId -f "..\03_staging_sql\02_normalize_staging.sql"

Write-Host "==> 5) Load core/ref"
psql -v ON_ERROR_STOP=1 -h $env:TGT_DB_HOST -p $env:TGT_DB_PORT -U $env:TGT_DB_USER -d $env:TGT_DB_NAME -v load_batch_id=$batchId -f "..\05_load_sql\01_load_ref_communes.sql"
psql -v ON_ERROR_STOP=1 -h $env:TGT_DB_HOST -p $env:TGT_DB_PORT -U $env:TGT_DB_USER -d $env:TGT_DB_NAME -v load_batch_id=$batchId -f "..\05_load_sql\02_load_core_entities.sql"
psql -v ON_ERROR_STOP=1 -h $env:TGT_DB_HOST -p $env:TGT_DB_PORT -U $env:TGT_DB_USER -d $env:TGT_DB_NAME -f "..\05_load_sql\03_load_ref_properties_model_run.sql"
psql -v ON_ERROR_STOP=1 -h $env:TGT_DB_HOST -p $env:TGT_DB_PORT -U $env:TGT_DB_USER -d $env:TGT_DB_NAME -v load_batch_id=$batchId -f "..\05_load_sql\04_load_core_timeseries_measurements.sql"
psql -v ON_ERROR_STOP=1 -h $env:TGT_DB_HOST -p $env:TGT_DB_PORT -U $env:TGT_DB_USER -d $env:TGT_DB_NAME -v load_batch_id=$batchId -f "..\05_load_sql\05_load_core_bathymetry.sql"

Write-Host "==> 6) Refresh thematic views and seed module mapping"
psql -v ON_ERROR_STOP=1 -h $env:TGT_DB_HOST -p $env:TGT_DB_PORT -U $env:TGT_DB_USER -d $env:TGT_DB_NAME -f "..\05_load_sql\06_refresh_public_value_views.sql"
psql -v ON_ERROR_STOP=1 -h $env:TGT_DB_HOST -p $env:TGT_DB_PORT -U $env:TGT_DB_USER -d $env:TGT_DB_NAME -f "..\05_load_sql\07_seed_module_properties.sql"

Write-Host "==> 7) Quality checks"
psql -v ON_ERROR_STOP=1 -h $env:TGT_DB_HOST -p $env:TGT_DB_PORT -U $env:TGT_DB_USER -d $env:TGT_DB_NAME -f "..\06_quality_checks\01_preload_checks.sql"
psql -v ON_ERROR_STOP=1 -h $env:TGT_DB_HOST -p $env:TGT_DB_PORT -U $env:TGT_DB_USER -d $env:TGT_DB_NAME -f "..\06_quality_checks\02_postload_checks.sql"
psql -v ON_ERROR_STOP=1 -h $env:TGT_DB_HOST -p $env:TGT_DB_PORT -U $env:TGT_DB_USER -d $env:TGT_DB_NAME -v load_batch_id=$batchId -f "..\06_quality_checks\03_reconciliation_checks.sql"

Write-Host "==> DONE"
Write-Host "Batch loaded: $batchId"

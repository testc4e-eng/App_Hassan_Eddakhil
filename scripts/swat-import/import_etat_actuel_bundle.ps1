param(
  [string]$BaseDir = "",
  [string]$PgHost = "127.0.0.1",
  [int]$PgPort = 5435,
  [string]$PgDatabase = "hydro_hd_1714",
  [string]$PgUser = "postgres",
  [string]$PgPassword = "c4e@test@2025",
  [string]$ApiBase = "http://127.0.0.1:5006/api/v1",
  [switch]$SkipCoreSync
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$scriptDir = Split-Path -Parent $PSCommandPath
$reportsDir = Join-Path $scriptDir "reports"
$mappingPath = Join-Path $scriptDir "mapping.config.json"
$importScript = Join-Path $scriptDir "import_swat_output.ps1"
$analyzeScript = Join-Path $scriptDir "analyze_mdb.ps1"

function Invoke-Import {
  param(
    [string]$MdbPath,
    [string]$ScenarioCode,
    [string]$Mode
  )

  if (-not (Test-Path $MdbPath)) {
    throw "Fichier MDB introuvable: $MdbPath"
  }

  powershell -ExecutionPolicy Bypass -File $analyzeScript `
    -MdbPath $MdbPath `
    -OutputDir (Join-Path $reportsDir $ScenarioCode)

  powershell -ExecutionPolicy Bypass -File $importScript `
    -MdbPath $MdbPath `
    -PgHost $PgHost `
    -PgPort $PgPort `
    -PgDatabase $PgDatabase `
    -PgUser $PgUser `
    -PgPassword $PgPassword `
    -MappingPath $mappingPath `
    -ScenarioCode $ScenarioCode `
    -Mode $Mode
}

if (-not $BaseDir) {
  $repoRoot = Split-Path (Split-Path $scriptDir -Parent) -Parent
  $dailyCandidate = Get-ChildItem -Path $repoRoot -Recurse -File -Filter "SWATOutput.mdb" |
    Where-Object { $_.FullName -match "\\Scenarios\\Daily\\TablesOut\\SWATOutput\.mdb$" } |
    Select-Object -First 1
  if (-not $dailyCandidate) {
    throw "Impossible de localiser automatiquement le dossier Scenarios."
  }
  $BaseDir = Split-Path (Split-Path (Split-Path $dailyCandidate.FullName -Parent) -Parent) -Parent
}

$dailyMdb = Join-Path $BaseDir "Daily\TablesOut\SWATOutput.mdb"
$monthlyMdb = Join-Path $BaseDir "Monthly\TablesOut\SWATOutput.mdb"
$yearlyMdb = Join-Path $BaseDir "Yealy\TablesOut\SWATOutput.mdb"

Invoke-Import -MdbPath $dailyMdb -ScenarioCode "etat_actuel" -Mode "replace"
Invoke-Import -MdbPath $monthlyMdb -ScenarioCode "etat_actuel_monthly" -Mode "replace"
Invoke-Import -MdbPath $yearlyMdb -ScenarioCode "etat_actuel_annual" -Mode "replace"

if (-not $SkipCoreSync) {
  $env:PGPASSWORD = $PgPassword
  psql -h $PgHost -p $PgPort -U $PgUser -d $PgDatabase -v ON_ERROR_STOP=1 -c @"
WITH target_ts AS (
  SELECT t.ts_id
  FROM core.timeseries t
  JOIN core.model_runs mr ON mr.run_id = t.run_id
  WHERE t.source_type = 'simulated'
    AND mr.scenario_code = 'etat_actuel'
),
deleted_measurements AS (
  DELETE FROM core.measurements m
  USING target_ts tt
  WHERE m.ts_id = tt.ts_id
  RETURNING m.ts_id
)
DELETE FROM core.measurement_batches mb
USING target_ts tt
WHERE mb.ts_id = tt.ts_id;

DELETE FROM core.timeseries t
USING core.model_runs mr
WHERE t.run_id = mr.run_id
  AND t.source_type = 'simulated'
  AND mr.scenario_code = 'etat_actuel';
"@ | Out-Null

  $payload = @{
    scenarioCode = "etat_actuel"
    runCode = "etat_actuel"
    runName = "Scénario état actuel"
    importMode = "skipAccess"
    dryRun = $false
  } | ConvertTo-Json

  Invoke-RestMethod -Method Post `
    -Uri "$ApiBase/hydro/swat/import" `
    -ContentType "application/json" `
    -Body $payload | Out-Null
}

Write-Host "Import Etat actuel termine."

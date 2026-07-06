#Requires -Version 5.1
param(
  [Parameter(Mandatory=$true)]
  [int]$ScenarioNumber
)

$ErrorActionPreference = "Stop"

$scenarioCode = "scenario_$ScenarioNumber"
$mdbPath = "C:\dev\Barrage-Hassan Dakhil\data HD\Modèle Bge HAD\Scénarios_d’atténuation_d’érosion_(reboissement)\Scénario $ScenarioNumber\SWAT_HAD\Scenarios\Daily\TablesOut\SWATOutput.mdb"
$workDir = Join-Path $PSScriptRoot "scripts\swat-import\work_scenario_$ScenarioNumber"
$logDir = Join-Path $PSScriptRoot "scripts\swat-import\logs"

if (-not (Test-Path $workDir)) { New-Item -ItemType Directory -Path $workDir | Out-Null }
if (-not (Test-Path $logDir)) { New-Item -ItemType Directory -Path $logDir | Out-Null }

$importScript = Join-Path $PSScriptRoot "scripts\swat-import\import_swat_output.ps1"

Write-Host "Ingesting $scenarioCode from: $mdbPath"
Write-Host "WorkDir: $workDir"

& $importScript `
  -MdbPath $mdbPath `
  -PgHost "127.0.0.1" `
  -PgPort 5436 `
  -PgDatabase "hydro_hd_1714" `
  -PgUser "postgres" `
  -PgPassword "local_test_password" `
  -ScenarioCode $scenarioCode `
  -Mode "import" `
  -WorkDir $workDir `
  -LogDir $logDir

Write-Host "$scenarioCode ingestion completed."

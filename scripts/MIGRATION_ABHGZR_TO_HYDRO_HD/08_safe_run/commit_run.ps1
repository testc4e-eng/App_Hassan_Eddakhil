param(
  [string]$EnvFile = ".env.migration",
  [string]$BatchId = ""
)

Get-Content $EnvFile | ForEach-Object {
  if ($_ -match '^(?<k>[^#=]+)=(?<v>.*)$') {
    [System.Environment]::SetEnvironmentVariable($Matches.k.Trim(), $Matches.v.Trim(), 'Process')
  }
}

if ([string]::IsNullOrWhiteSpace($BatchId)) {
  python "..\\04_etl_python\\etl_migrate_abhgzr.py" --mode commit
} else {
  python "..\\04_etl_python\\etl_migrate_abhgzr.py" --mode commit --batch-id $BatchId
}


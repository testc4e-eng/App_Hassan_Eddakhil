param(
  [string]$EnvFile = ".env.migration"
)

Get-Content $EnvFile | ForEach-Object {
  if ($_ -match '^(?<k>[^#=]+)=(?<v>.*)$') {
    [System.Environment]::SetEnvironmentVariable($Matches.k.Trim(), $Matches.v.Trim(), 'Process')
  }
}

python "..\\04_etl_python\\etl_migrate_abhgzr.py" --mode dry-run


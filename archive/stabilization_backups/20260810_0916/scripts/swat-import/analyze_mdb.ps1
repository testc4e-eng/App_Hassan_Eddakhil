param(
  [string]$MdbPath = "",
  [string]$OutputDir = ""
)

$ErrorActionPreference = "Stop"

function Resolve-MdbPath {
  param([string]$Path)
  if ($Path -and (Test-Path $Path)) {
    return (Resolve-Path $Path).Path
  }

  $repoRoot = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
  $candidate = Get-ChildItem -Path $repoRoot -Recurse -Filter "SWATOutput.mdb" -File | Select-Object -First 1
  if ($candidate) { return $candidate.FullName }

  throw "Impossible de trouver SWATOutput.mdb."
}

function New-AdoConnection {
  param([string]$Path)
  $conn = New-Object -ComObject ADODB.Connection
  $conn.ConnectionString = "Provider=Microsoft.ACE.OLEDB.12.0;Data Source=$Path;Persist Security Info=False;"
  $conn.Open()
  return $conn
}

function Close-ComObject {
  param($Object)
  if ($null -ne $Object) {
    try { $Object.Close() } catch {}
    try { [void][System.Runtime.InteropServices.Marshal]::ReleaseComObject($Object) } catch {}
  }
}

function Get-UserTables {
  param($Conn)
  $rs = $Conn.OpenSchema(20)
  $tables = @()
  while (-not $rs.EOF) {
    $name = [string]$rs.Fields.Item("TABLE_NAME").Value
    $type = [string]$rs.Fields.Item("TABLE_TYPE").Value
    if ($type -eq "TABLE" -and -not $name.StartsWith("MSys")) { $tables += $name }
    $rs.MoveNext()
  }
  Close-ComObject $rs
  return $tables | Sort-Object
}

function Get-Columns {
  param($Conn, [string]$TableName)
  $rs = New-Object -ComObject ADODB.Recordset
  $rs.Open("SELECT TOP 1 * FROM [$TableName]", $Conn)
  $cols = @()
  for ($i = 0; $i -lt $rs.Fields.Count; $i++) {
    $f = $rs.Fields.Item($i)
    $cols += [pscustomobject]@{
      name = [string]$f.Name
      type = [int]$f.Type
      size = [int]$f.DefinedSize
    }
  }
  Close-ComObject $rs
  return $cols
}

function Get-Count {
  param($Conn, [string]$TableName)
  $rs = New-Object -ComObject ADODB.Recordset
  $rs.Open("SELECT COUNT(*) AS n FROM [$TableName]", $Conn)
  $n = [int64]$rs.Fields.Item(0).Value
  Close-ComObject $rs
  return $n
}

function Get-Preview {
  param($Conn, [string]$TableName, [int]$Limit = 5)
  $rs = New-Object -ComObject ADODB.Recordset
  $rs.Open("SELECT TOP $Limit * FROM [$TableName]", $Conn)
  $rows = @()
  while (-not $rs.EOF) {
    $row = [ordered]@{}
    foreach ($f in $rs.Fields) { $row[$f.Name] = $f.Value }
    $rows += [pscustomobject]$row
    $rs.MoveNext()
  }
  Close-ComObject $rs
  return $rows
}

$defaultReportsDir = Join-Path $PSScriptRoot "reports"
if (-not $OutputDir) { $OutputDir = $defaultReportsDir }
if (-not (Test-Path $OutputDir)) { New-Item -ItemType Directory -Path $OutputDir | Out-Null }

$MdbPath = Resolve-MdbPath -Path $MdbPath

$conn = New-AdoConnection -Path $MdbPath
$tables = Get-UserTables -Conn $conn

$inventory = foreach ($table in $tables) {
  [pscustomobject]@{
    table_name = $table
    row_count = Get-Count -Conn $conn -TableName $table
    columns = Get-Columns -Conn $conn -TableName $table
    preview = Get-Preview -Conn $conn -TableName $table -Limit 5
  }
}

$inventory | ConvertTo-Json -Depth 8 | Set-Content -Encoding UTF8 (Join-Path $OutputDir "swat_mdb_inventory.json")

$summary = @"
# SWATOutput.mdb - Analyse

- Fichier: $MdbPath
- Tables: $($tables.Count)
- Tables principales: sub, rch
- Tables dictionnaire: tbl*Def

## Lecture metier

sub et rch sont les series temporelles SWAT.
YEAR + YYYYDDD est utilise pour construire la date.
"@

$summary | Set-Content -Encoding UTF8 (Join-Path $OutputDir "swat_mdb_analysis.md")

Close-ComObject $conn
Write-Host "Analyse terminée."
exit 0

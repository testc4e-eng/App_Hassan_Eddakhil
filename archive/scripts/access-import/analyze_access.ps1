param(
  [string]$MdbPath = "C:\dev\Projects\hydro_HD\Données_Bge_Hassan_Addakhil\Access\SWATOutput.mdb",
  [string]$OutputDir = "C:\dev\Projects\hydro_HD\DATABASE_DOCUMENTATION\access_audit"
)

$ErrorActionPreference = "Stop"

function New-AdoConnection {
  param([string]$Path)
  $conn = New-Object -ComObject ADODB.Connection
  $conn.ConnectionString = "Provider=Microsoft.ACE.OLEDB.12.0;Data Source=$Path;Persist Security Info=False;"
  $conn.Open()
  return $conn
}

function Get-UserTables {
  param($Conn)
  $rs = $Conn.OpenSchema(20)
  $tables = @()
  while (-not $rs.EOF) {
    $name = [string]$rs.Fields.Item("TABLE_NAME").Value
    $type = [string]$rs.Fields.Item("TABLE_TYPE").Value
    if ($type -eq "TABLE" -and -not $name.StartsWith("MSys")) {
      $tables += $name
    }
    $rs.MoveNext()
  }
  $rs.Close()
  return $tables | Sort-Object
}

function Get-TableColumns {
  param($Conn, [string]$TableName)
  $rs = New-Object -ComObject ADODB.Recordset
  $rs.Open("SELECT TOP 1 * FROM [$TableName]", $Conn)
  $cols = @()
  for ($i = 0; $i -lt $rs.Fields.Count; $i++) {
    $f = $rs.Fields.Item($i)
    $cols += [pscustomobject]@{
      name = [string]$f.Name
      type = [int]$f.Type
      definedSize = [int]$f.DefinedSize
      precision = [int]$f.Precision
      numericScale = [int]$f.NumericScale
    }
  }
  $rs.Close()
  return $cols
}

function Get-TableCount {
  param($Conn, [string]$TableName)
  $rs = New-Object -ComObject ADODB.Recordset
  $rs.Open("SELECT COUNT(*) AS n FROM [$TableName]", $Conn)
  $n = [int64]$rs.Fields.Item(0).Value
  $rs.Close()
  return $n
}

function Get-TablePreview {
  param($Conn, [string]$TableName, [int]$Limit = 5)
  $rs = New-Object -ComObject ADODB.Recordset
  $rs.Open("SELECT TOP $Limit * FROM [$TableName]", $Conn)
  $rows = @()
  while (-not $rs.EOF) {
    $row = [ordered]@{}
    foreach ($f in $rs.Fields) {
      $row[$f.Name] = if ($null -eq $f.Value) { $null } else { $f.Value }
    }
    $rows += [pscustomobject]$row
    $rs.MoveNext()
  }
  $rs.Close()
  return $rows
}

if (-not (Test-Path $OutputDir)) {
  New-Item -ItemType Directory -Path $OutputDir | Out-Null
}

$conn = New-AdoConnection -Path $MdbPath
$tables = Get-UserTables -Conn $conn

$inventory = @()
foreach ($t in $tables) {
  $cols = Get-TableColumns -Conn $conn -TableName $t
  $count = Get-TableCount -Conn $conn -TableName $t
  $preview = Get-TablePreview -Conn $conn -TableName $t -Limit 5

  $inventory += [pscustomobject]@{
    table_name = $t
    row_count = $count
    column_count = $cols.Count
    columns = $cols
    preview = $preview
  }
}

$jsonPath = Join-Path $OutputDir "access_tables_inventory.json"
$inventory | ConvertTo-Json -Depth 6 | Set-Content -Encoding UTF8 $jsonPath

$summaryPath = Join-Path $OutputDir "access_schema_summary.md"
$summary = @"
# SWATOutput.mdb - Synthese Technique

- Source: `$MdbPath`
- Tables utilisateur détectées: $($tables.Count)

## Lecture

La base a été lue via `Microsoft.ACE.OLEDB.12.0`.
Les tables `rch` et `sub` contiennent les sorties temporelles principales.
Les tables `tbl*Def` sont des dictionnaires métier / aide à la lecture des variables.
"@
$summary | Set-Content -Encoding UTF8 $summaryPath

$mappingPath = Join-Path $OutputDir "access_mapping_proposal.md"
$mapping = @"
# Proposition de mapping Access -> PostgreSQL

- `sub` -> séries temporelles de sous-bassins
- `rch` -> séries temporelles de reaches / sorties aval
- `tbl*Def` -> dictionnaire de variables SWAT

Les variables hydrologiques alimentent le module Hydrologique.
Les variables de sédiments alimentent le module Érosion / Sédiments.
Les variables de qualité d'eau peuvent être exposées dans un module dédié ou dans les rapports.
"@
$mapping | Set-Content -Encoding UTF8 $mappingPath

$conn.Close()

Write-Host "Audit Access terminé."
Write-Host "Inventaire: $jsonPath"
Write-Host "Synthèse: $summaryPath"
Write-Host "Mapping: $mappingPath"

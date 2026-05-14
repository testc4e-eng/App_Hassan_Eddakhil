param(
  [string]$MdbPath = "C:\dev\Projects\hydro_HD\Données_Bge_Hassan_Addakhil\Access\SWATOutput.mdb",
  [string]$PgHost = "localhost",
  [int]$PgPort = 5432,
  [string]$PgDatabase = "hydro_hd_1714",
  [string]$PgUser = "postgres",
  [string]$PgPassword = "",
  [string]$MappingPath = "C:\dev\Projects\hydro_HD\scripts\access-import\mapping.config.json",
  [string]$WorkDir = "C:\dev\Projects\hydro_HD\scripts\access-import\work",
  [ValidateSet("preview","import","reload")]
  [string]$Mode = "preview"
)

$ErrorActionPreference = "Stop"

function New-AdoConnection {
  param([string]$Path)
  $conn = New-Object -ComObject ADODB.Connection
  $conn.ConnectionString = "Provider=Microsoft.ACE.OLEDB.12.0;Data Source=$Path;Persist Security Info=False;"
  $conn.Open()
  return $conn
}

function Invoke-Psql {
  param([string]$SqlText, [switch]$Capture)
  $sqlFile = Join-Path $WorkDir ([guid]::NewGuid().ToString() + ".sql")
  Set-Content -Encoding UTF8 -Path $sqlFile -Value $SqlText
  $env:PGPASSWORD = $PgPassword
  $args = @("-h", $PgHost, "-p", $PgPort, "-U", $PgUser, "-d", $PgDatabase, "-v", "ON_ERROR_STOP=1", "-f", $sqlFile)
  if ($Capture) {
    return & psql.exe @args
  }
  & psql.exe @args | Out-Null
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

function Get-Recordset {
  param($Conn, [string]$TableName)
  $rs = New-Object -ComObject ADODB.Recordset
  $rs.CursorLocation = 3
  $rs.Open("SELECT * FROM [$TableName]", $Conn)
  return $rs
}

function To-PeriodDate {
  param($Year, $Yyyyddd, $Mon)
  if ($null -ne $Yyyyddd -and [int]$Yyyyddd -gt 0) {
    $y = [int]($Yyyyddd / 1000)
    $doy = [int]($Yyyyddd % 1000)
    return (Get-Date -Year $y -Month 1 -Day 1).AddDays($doy - 1).ToString("yyyy-MM-dd")
  }
  if ($null -ne $Year -and $null -ne $Mon) {
    $month = [math]::Max(1, [math]::Min(12, [int]$Mon))
    return (Get-Date -Year ([int]$Year) -Month $month -Day 1).ToString("yyyy-MM-dd")
  }
  return $null
}

function Write-CsvForResultTable {
  param(
    $Conn,
    [string]$SourceTable,
    [hashtable]$ColumnMap,
    [string[]]$OutputColumns,
    [string]$CsvPath,
    [string]$ScenarioCode
  )

  $rs = Get-Recordset -Conn $Conn -TableName $SourceTable
  $writer = New-Object System.IO.StreamWriter($CsvPath, $false, [System.Text.Encoding]::UTF8)
  try {
    $writer.WriteLine(($OutputColumns -join ","))
    $rowNum = 0
    while (-not $rs.EOF) {
      $rowNum++
      $values = @()
      foreach ($col in $OutputColumns) {
        switch ($col) {
          "scenario_code" { $values += $ScenarioCode; continue }
          "period_date" {
            $period = To-PeriodDate -Year $rs.Fields.Item("YEAR").Value -Yyyyddd $rs.Fields.Item("YYYYDDD").Value -Mon $rs.Fields.Item("MON").Value
            $values += $period
            continue
          }
          "source_row_num" { $values += $rowNum; continue }
          "source_file" { $values += $MdbPath; continue }
        }
        $src = $ColumnMap[$col]
        $val = $null
        if ($src -and $rs.Fields[$src]) { $val = $rs.Fields.Item($src).Value }
        if ($null -eq $val -or $val -eq "") {
          $values += ""
        } else {
          $s = [string]$val
          if ($s.Contains('"')) { $s = $s.Replace('"','""') }
          if ($s.Contains(',') -or $s.Contains('"') -or $s.Contains("`n") -or $s.Contains("`r")) {
            $s = '"' + $s + '"'
          }
          $values += $s
        }
      }
      $writer.WriteLine(($values -join ","))
      $rs.MoveNext()
    }
  } finally {
    $writer.Close()
    $rs.Close()
  }
}

function Write-CsvForDefTable {
  param(
    $Conn,
    [string]$SourceTable,
    [string]$CsvPath
  )
  $rs = Get-Recordset -Conn $Conn -TableName $SourceTable
  $writer = New-Object System.IO.StreamWriter($CsvPath, $false, [System.Text.Encoding]::UTF8)
  try {
    $headers = @()
    for ($i=0; $i -lt $rs.Fields.Count; $i++) { $headers += ([string]$rs.Fields.Item($i).Name).ToLower().Replace(' ','_') }
    $writer.WriteLine(($headers -join ","))
    while (-not $rs.EOF) {
      $values = @()
      foreach ($f in $rs.Fields) {
        $val = $f.Value
        if ($null -eq $val -or $val -eq "") { $values += "" }
        else {
          $s = [string]$val
          if ($s.Contains('"')) { $s = $s.Replace('"','""') }
          if ($s.Contains(',') -or $s.Contains('"') -or $s.Contains("`n") -or $s.Contains("`r")) { $s = '"' + $s + '"' }
          $values += $s
        }
      }
      $writer.WriteLine(($values -join ","))
      $rs.MoveNext()
    }
  } finally {
    $writer.Close()
    $rs.Close()
  }
}

function Write-VariableDictionaryCsv {
  param(
    $Conn,
    [string]$SourceTable,
    [string]$CsvPath,
    [hashtable]$Meta
  )
  $rs = Get-Recordset -Conn $Conn -TableName $SourceTable
  $writer = New-Object System.IO.StreamWriter($CsvPath, $false, [System.Text.Encoding]::UTF8)
  try {
    $writer.WriteLine("source_table,variable_code,variable_label,definition,unit,entity_type,module_code,display_order,is_active")
    $order = 0
    while (-not $rs.EOF) {
      $order++
      $name = [string]$rs.Fields.Item(0).Value
      $definition = [string]$rs.Fields.Item(1).Value
      $rows = @(
        $SourceTable,
        $name,
        $name,
        $definition,
        "",
        $Meta.entity_type,
        $Meta.module_code,
        $order,
        "true"
      )
      $escaped = foreach ($v in $rows) {
        $s = [string]$v
        if ($s.Contains('"')) { $s = $s.Replace('"','""') }
        if ($s.Contains(',') -or $s.Contains('"') -or $s.Contains("`n") -or $s.Contains("`r")) { $s = '"' + $s + '"' }
        $s
      }
      $writer.WriteLine(($escaped -join ","))
      $rs.MoveNext()
    }
  } finally {
    $writer.Close()
    $rs.Close()
  }
}

if (-not (Test-Path $WorkDir)) {
  New-Item -ItemType Directory -Path $WorkDir | Out-Null
}

$cfg = Get-Content $MappingPath -Raw | ConvertFrom-Json
$conn = New-AdoConnection -Path $MdbPath

if ($Mode -eq "preview") {
  Write-Host "Preview Access import for $MdbPath"
  foreach ($t in $cfg.tables) {
    $rs = Get-Recordset -Conn $conn -TableName $t.sourceTable
    $count = 0
    while (-not $rs.EOF) { $count++; $rs.MoveNext() }
    $rs.Close()
    Write-Host ("{0}: {1} rows" -f $t.sourceTable, $count)
  }
  $conn.Close()
  exit 0
}

$scenario = [string]$cfg.scenarioCode
$importRow = Invoke-Psql -Capture -SqlText @"
INSERT INTO access.import_runs (source_path, source_checksum, scenario_code, source_format, status)
VALUES ('$MdbPath', NULL, '$scenario', 'mdb', 'running')
RETURNING import_id;
"@
$importId = ($importRow | Select-String -Pattern '^\d+$').Matches.Value | Select-Object -First 1
if (-not $importId) { throw "Unable to create import run" }

if ($Mode -eq "reload") {
  Invoke-Psql -SqlText @"
TRUNCATE access.sub_results, access.rch_results, access.variable_dictionary;
"@
}

foreach ($table in $cfg.tables) {
  $csv = Join-Path $WorkDir ($table.sourceTable + ".csv")
  $cols = [string[]]$table.columns
  $map = @{}
  foreach ($c in $cols) {
    switch ($c) {
      "scenario_code" { continue }
      "period_date" { continue }
      "source_row_num" { continue }
      "source_file" { continue }
      default { $map[$c] = $c.ToUpper() }
    }
  }

  Write-Host "Exporting $($table.sourceTable) -> $csv"
  Write-CsvForResultTable -Conn $conn -SourceTable $table.sourceTable -ColumnMap $map -OutputColumns $cols -CsvPath $csv -ScenarioCode $scenario

  $sql = @"
BEGIN;
CREATE TEMP TABLE stg (LIKE $($table.targetTable) INCLUDING DEFAULTS);
TRUNCATE stg;
\copy stg ($([string]::Join(", ", $cols))) FROM '$csv' WITH (FORMAT csv, HEADER true, ENCODING 'UTF8');
INSERT INTO $($table.targetTable) (
  import_id, $([string]::Join(", ", ($cols | Where-Object { $_ -ne 'scenario_code' })))
)
SELECT
  $importId,
  $([string]::Join(", ", ($cols | ForEach-Object { if ($_ -eq 'scenario_code') { '$scenario' } else { $_ } })))
FROM stg
ON CONFLICT ($([string]::Join(", ", $table.keyColumns))) DO UPDATE
SET
  $((($cols | Where-Object { $_ -notin @('scenario_code','source_file','source_row_num') }) | ForEach-Object { "$_ = EXCLUDED.$_" }) -join ",`n  ");
COMMIT;
"@
  Invoke-Psql -SqlText $sql
}

$defMap = @{
  "tblRchDef" = @{ module_code = "hydro"; entity_type = "rch" }
  "tblSubDef" = @{ module_code = "hydro"; entity_type = "sub" }
  "tblSedDef" = @{ module_code = "erosion"; entity_type = "rch" }
  "tblWqlDef" = @{ module_code = "hydro"; entity_type = "rch" }
  "tblDepDef" = @{ module_code = "hydro"; entity_type = "rch" }
  "tblVelDef" = @{ module_code = "hydro"; entity_type = "rch" }
  "tblMgtdef" = @{ module_code = "hydro"; entity_type = "sub" }
  "tblHruDef" = @{ module_code = "hydro"; entity_type = "sub" }
  "tblPotDef" = @{ module_code = "hydro"; entity_type = "sub" }
  "tblRsvDef" = @{ module_code = "hydro"; entity_type = "rch" }
  "tblSnwDef" = @{ module_code = "climat"; entity_type = "sub" }
  "tblSwrDef" = @{ module_code = "hydro"; entity_type = "sub" }
  "tblSnuDef" = @{ module_code = "hydro"; entity_type = "sub" }
  "tblWtrDef" = @{ module_code = "hydro"; entity_type = "sub" }
}

foreach ($defTable in $cfg.definitions) {
  $meta = $defMap[$defTable]
  if ($null -eq $meta) { $meta = @{ module_code = "hydro"; entity_type = "sub" } }

  $csv = Join-Path $WorkDir ($defTable + ".csv")
  Write-Host "Exporting $defTable -> $csv"
  Write-VariableDictionaryCsv -Conn $conn -SourceTable $defTable -CsvPath $csv -Meta $meta

  $sql = @"
BEGIN;
\copy access.variable_dictionary (source_table, variable_code, variable_label, definition, unit, entity_type, module_code, display_order, is_active) FROM '$csv' WITH (FORMAT csv, HEADER true, ENCODING 'UTF8');
COMMIT;
"@
  Invoke-Psql -SqlText $sql
}

$conn.Close()

Invoke-Psql -SqlText @"
UPDATE access.import_runs
SET status = 'finished', finished_at = now(), total_rows = (
  SELECT COALESCE(SUM(ct), 0) FROM (
    SELECT COUNT(*) AS ct FROM access.sub_results WHERE import_id = $importId
    UNION ALL
    SELECT COUNT(*) AS ct FROM access.rch_results WHERE import_id = $importId
  ) s
)
WHERE import_id = $importId;
"@

Write-Host "Import SWAT terminé. import_id=$importId"

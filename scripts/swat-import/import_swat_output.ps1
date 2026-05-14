param(
  [string]$MdbPath = "",
  [string]$PgHost = "localhost",
  [int]$PgPort = 5432,
  [string]$PgDatabase = "hydro_hd_1714",
  [string]$PgUser = "postgres",
  [string]$PgPassword = "",
  [string]$MappingPath = "C:\dev\Projects\hydro_HD\scripts\swat-import\mapping.config.json",
  [string]$WorkDir = "C:\dev\Projects\hydro_HD\scripts\swat-import\work",
  [string]$LogDir = "C:\dev\Projects\hydro_HD\scripts\swat-import\logs",
  [ValidateSet("preview","import","reload")]
  [string]$Mode = "preview"
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

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

function Write-Log {
  param([string]$Message)
  $line = "{0} {1}" -f (Get-Date).ToString("s"), $Message
  $line | Tee-Object -FilePath (Join-Path $LogDir "swat_import.log") -Append
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

function Invoke-Psql {
  param(
    [string]$SqlText,
    [switch]$Raw
  )
  $tmp = Join-Path $WorkDir ("{0}.sql" -f ([guid]::NewGuid().ToString()))
  Set-Content -Encoding UTF8 -Path $tmp -Value $SqlText
  $env:PGPASSWORD = $PgPassword
  $args = @("-h", $PgHost, "-p", $PgPort, "-U", $PgUser, "-d", $PgDatabase, "-v", "ON_ERROR_STOP=1", "-f", $tmp)
  if ($Raw) { & psql.exe @args } else { & psql.exe @args | Out-Null }
}

function Invoke-PsqlScalar {
  param([string]$SqlText)
  $env:PGPASSWORD = $PgPassword
  $args = @("-h", $PgHost, "-p", $PgPort, "-U", $PgUser, "-d", $PgDatabase, "-t", "-A", "-q", "-c", $SqlText)
  $out = & psql.exe @args
  return ($out | Where-Object { $_.Trim() }) | Select-Object -First 1
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
  param([object]$Year, [object]$Yyyyddd)
  if ($null -ne $Yyyyddd -and [int]$Yyyyddd -gt 0) {
    $y = [int]($Yyyyddd / 1000)
    $doy = [int]($Yyyyddd % 1000)
    return (Get-Date -Year $y -Month 1 -Day 1).AddDays($doy - 1).ToString("yyyy-MM-dd")
  }
  if ($null -ne $Year) {
    return (Get-Date -Year ([int]$Year) -Month 1 -Day 1).ToString("yyyy-MM-dd")
  }
  return $null
}

function Escape-Csv {
  param([object]$Value)
  if ($null -eq $Value) { return "" }
  $s = [string]$Value
  if ($s.Contains('"')) { $s = $s.Replace('"','""') }
  if ($s.Contains(',') -or $s.Contains('"') -or $s.Contains("`n") -or $s.Contains("`r")) { $s = '"' + $s + '"' }
  return $s
}

function Export-ResultCsv {
  param(
    $Conn,
    [string]$SourceTable,
    [hashtable]$FieldMap,
    [string[]]$OutputColumns,
    [string]$CsvPath,
    [string]$ScenarioCode,
    [string]$SourceFile
  )
  $rs = Get-Recordset -Conn $Conn -TableName $SourceTable
  $writer = New-Object System.IO.StreamWriter($CsvPath, $false, [System.Text.Encoding]::UTF8)
  try {
    $writer.WriteLine(($OutputColumns -join ","))
    $rowNum = 0
    while (-not $rs.EOF) {
      $rowNum++
      $line = foreach ($col in $OutputColumns) {
        switch ($col) {
          "scenario_code" { Escape-Csv $ScenarioCode; continue }
          "period_date" { Escape-Csv (To-PeriodDate -Year $rs.Fields.Item("YEAR").Value -Yyyyddd $rs.Fields.Item("YYYYDDD").Value); continue }
          "source_row_num" { Escape-Csv $rowNum; continue }
          "source_file" { Escape-Csv $SourceFile; continue }
        }
        $src = $FieldMap[$col]
        if ($src) { Escape-Csv $rs.Fields.Item($src).Value } else { "" }
      }
      $writer.WriteLine(($line -join ","))
      $rs.MoveNext()
    }
  } finally {
    $writer.Close()
    Close-ComObject $rs
  }
}

function Normalize-ResultCsv {
  param(
    [string]$CsvPath,
    [int]$ExpectedColumnCount
  )
  if (-not (Test-Path $CsvPath)) { return }
  $lines = [System.IO.File]::ReadAllLines($CsvPath, [System.Text.Encoding]::UTF8)
  if ($lines.Length -lt 2) { return }

  $headerCols = $lines[0].Split(",").Count
  if ($ExpectedColumnCount -le 0) { $ExpectedColumnCount = $headerCols }
  if ($headerCols -ne $ExpectedColumnCount) { return }

  $out = New-Object System.Collections.Generic.List[string]
  $out.Add($lines[0])

  for ($i = 1; $i -lt $lines.Length; $i++) {
    $line = $lines[$i]
    if ([string]::IsNullOrWhiteSpace($line)) { continue }
    $cols = $line.Split(",")
    if ($cols.Count -eq ($ExpectedColumnCount + 4)) {
      # Access export can inject 4 empty slots for some MDB layouts; remove stable offsets.
      $remove = [System.Collections.Generic.HashSet[int]]::new()
      [void]$remove.Add(1)
      [void]$remove.Add(4)
      [void]$remove.Add($cols.Count - 3)
      [void]$remove.Add($cols.Count - 1)

      $fixed = New-Object System.Collections.Generic.List[string]
      for ($j = 0; $j -lt $cols.Count; $j++) {
        if (-not $remove.Contains($j)) { $fixed.Add($cols[$j]) }
      }
      $cols = $fixed.ToArray()
    }
    if ($cols.Count -ne $ExpectedColumnCount) {
      throw "CSV colonne mismatch dans $CsvPath ligne $($i+1): attendu=$ExpectedColumnCount, obtenu=$($cols.Count)"
    }
    $out.Add(($cols -join ","))
  }

  [System.IO.File]::WriteAllLines($CsvPath, $out, [System.Text.Encoding]::UTF8)
}

function Export-VariableDictionaryCsv {
  param(
    $Conn,
    [string]$SourceTable,
    [string]$CsvPath,
    [string]$ModuleCode,
    [string]$EntityType
  )
  $rs = Get-Recordset -Conn $Conn -TableName $SourceTable
  $writer = New-Object System.IO.StreamWriter($CsvPath, $false, [System.Text.Encoding]::UTF8)
  try {
    $writer.WriteLine("source_table,variable_code,variable_label,definition,unit,entity_type,module_code,display_order,is_active")
    $order = 0
  while (-not $rs.EOF) {
      $order++
      $code = [string]$rs.Fields.Item(0).Value
      $definition = if ($rs.Fields.Count -gt 1) { [string]$rs.Fields.Item(1).Value } else { "" }
      $rows = @(
        $SourceTable,
        $code,
        $code,
        $definition,
        "",
        $EntityType,
        $ModuleCode,
        $order,
        "true"
      )
      $writer.WriteLine((($rows | ForEach-Object { Escape-Csv $_ }) -join ","))
      $rs.MoveNext()
    }
  } finally {
    $writer.Close()
    Close-ComObject $rs
  }
}

function Import-WithStaging {
  param(
    [string]$TargetTable,
    [string[]]$Columns,
    [string]$CsvPath,
    [string]$ConflictColumns,
    [string[]]$UpdateColumns,
    [string]$ImportId,
    [string]$TempDefinition
  )
  $updateSql = ($UpdateColumns | ForEach-Object { "  $_ = EXCLUDED.$_" }) -join ",`n"
  $insertColumns = "import_id, " + ($Columns -join ", ")
  $selectColumns = ($Columns | ForEach-Object { if ($_ -eq "scenario_code") { "scenario_code" } else { $_ } }) -join ", "
  $sql = @"
BEGIN;
$TempDefinition
\copy stg ($($Columns -join ", ")) FROM '$CsvPath' WITH (FORMAT csv, HEADER true, ENCODING 'UTF8');
INSERT INTO $TargetTable ($insertColumns)
SELECT $ImportId, $selectColumns
FROM stg
ON CONFLICT ($ConflictColumns) DO UPDATE
SET
$updateSql;
COMMIT;
"@
  Invoke-Psql -SqlText $sql
}

if (-not (Test-Path $WorkDir)) { New-Item -ItemType Directory -Path $WorkDir | Out-Null }
if (-not (Test-Path $LogDir)) { New-Item -ItemType Directory -Path $LogDir | Out-Null }

$MdbPath = Resolve-MdbPath -Path $MdbPath
$cfg = Get-Content $MappingPath -Raw | ConvertFrom-Json
$sourceFile = [System.IO.Path]::GetFileName($MdbPath)
$scenarioCode = [string]$cfg.scenarioCode
$conn = New-AdoConnection -Path $MdbPath
$tables = Get-UserTables -Conn $conn

if ($Mode -eq "preview") {
  Write-Log "Preview du fichier Access: $MdbPath"
  foreach ($t in $cfg.tables) {
    if ($tables -contains $t.sourceTable) {
      $rs = Get-Recordset -Conn $conn -TableName $t.sourceTable
      $count = 0
      while (-not $rs.EOF) { $count++; $rs.MoveNext() }
      $rs.Close()
      Write-Log ("{0}: {1} lignes" -f $t.sourceTable, $count)
    } else {
      Write-Log ("Table absente: {0}" -f $t.sourceTable)
    }
  }
  foreach ($def in $cfg.definitions) {
    Write-Log ("Definition: {0} -> module={1}, entity={2}" -f $def.sourceTable, $def.moduleCode, $def.entityType)
  }
  Close-ComObject $conn
  exit 0
}

try {
  $sourceHash = (Get-FileHash -Algorithm SHA256 -Path $MdbPath).Hash
} catch {
  $sourceHash = $null
  Write-Log "Checksum indisponible, fichier probablement ouvert dans Access."
}
$importId = Invoke-PsqlScalar @"
INSERT INTO access.import_runs (source_path, source_checksum, scenario_code, source_format, status)
VALUES ('$sourceFile', '$sourceHash', '$scenarioCode', 'mdb', 'running')
RETURNING import_id;
"@
if (-not $importId) { throw "Impossible de créer access.import_runs" }
Write-Log "Import Access démarré, import_id=$importId"

if ($Mode -eq "reload") {
  Invoke-Psql -SqlText @"
TRUNCATE access.sub_results, access.rch_results, access.variable_dictionary RESTART IDENTITY;
"@
}

foreach ($table in $cfg.tables) {
  if (-not ($tables -contains $table.sourceTable)) {
    Write-Log ("Table source introuvable: {0}" -f $table.sourceTable)
    continue
  }

  $csvPath = Join-Path $WorkDir ($table.sourceTable + ".csv")
  $fieldMap = @{}
  foreach ($kv in $table.sourceColumns.PSObject.Properties) { $fieldMap[$kv.Value] = $kv.Name }

  Write-Log ("Export {0} -> {1}" -f $table.sourceTable, $csvPath)
  Export-ResultCsv -Conn $conn -SourceTable $table.sourceTable -FieldMap $fieldMap -OutputColumns $table.columns -CsvPath $csvPath -ScenarioCode $scenarioCode -SourceFile $sourceFile
  Normalize-ResultCsv -CsvPath $csvPath -ExpectedColumnCount $table.columns.Count

  $tempDef = if ($table.sourceTable -eq "sub") {
@"
CREATE TEMP TABLE stg (
  scenario_code text,
  sub_code integer,
  period_date date,
  year integer,
  mon integer,
  area_km2 double precision,
  precip_mm double precision,
  snowmelt_mm double precision,
  pet_mm double precision,
  et_mm double precision,
  sw_mm double precision,
  perc_mm double precision,
  surq_mm double precision,
  gw_q_mm double precision,
  wyld_mm double precision,
  syld_t_ha double precision,
  orgn_kg_ha double precision,
  orgp_hg_ha double precision,
  nsurq_kg_ha double precision,
  solp_kg_ha double precision,
  sedp_kg_ha double precision,
  lat_q_mm double precision,
  lat_q_no3_kg_ha double precision,
  gwno3_kg_ha double precision,
  chola_mic_l double precision,
  cbodu_mg_l double precision,
  doxq_mg_l double precision,
  tno3_kg_ha double precision,
  yyyyddd integer,
  source_row_num integer,
  source_file text
);
"@
  } else {
@"
CREATE TEMP TABLE stg (
  scenario_code text,
  sub_code integer,
  period_date date,
  year integer,
  mon integer,
  area_km2 double precision,
  flow_in_cms double precision,
  flow_out_cms double precision,
  evap_cms double precision,
  tloss_cms double precision,
  sed_in_tons double precision,
  sed_out_tons double precision,
  sedconc_mg_kg double precision,
  orgn_in_kg double precision,
  orgn_out_kg double precision,
  orgp_in_kg double precision,
  orgp_out_kg double precision,
  no3_in_kg double precision,
  no3_out_kg double precision,
  nh4_in_kg double precision,
  nh4_out_kg double precision,
  no2_in_kg double precision,
  no2_out_kg double precision,
  minp_in_kg double precision,
  minp_out_kg double precision,
  chla_in_kg double precision,
  chla_out_kg double precision,
  cbod_in_kg double precision,
  cbod_out_kg double precision,
  disox_in_kg double precision,
  disox_out_kg double precision,
  solpst_in_mg double precision,
  solpst_out_mg double precision,
  sorpst_in_mg double precision,
  sorpst_out_mg double precision,
  reactpt_mg double precision,
  volpst_mg double precision,
  settlpst_mg double precision,
  resusppst_mg double precision,
  difusepst_mg double precision,
  reachbedpst_mg double precision,
  burypst_mg double precision,
  bed_pst_mg double precision,
  bactp_out_ct double precision,
  bactlp_out_ct double precision,
  cmetal1_kg double precision,
  cmetal2_kg double precision,
  cmetal3_kg double precision,
  tot_n_kg double precision,
  tot_p_kg double precision,
  no3conc_mg_l double precision,
  wtmp_deg_c double precision,
  yyyyddd integer,
  source_row_num integer,
  source_file text
);
"@
  }

  $updateColumns = $table.columns | Where-Object { $_ -notin @("scenario_code", "sub_code", "period_date") }
  Import-WithStaging -TargetTable $table.targetTable -Columns $table.columns -CsvPath $csvPath -ConflictColumns ($table.keyColumns -join ", ") -UpdateColumns $updateColumns -ImportId $importId -TempDefinition $tempDef
  Write-Log ("Import OK: {0}" -f $table.sourceTable)
}

foreach ($def in $cfg.definitions) {
  if (-not ($tables -contains $def.sourceTable)) { continue }
  $csvPath = Join-Path $WorkDir ($def.sourceTable + ".csv")
  Write-Log ("Export dictionnaire {0}" -f $def.sourceTable)
  Export-VariableDictionaryCsv -Conn $conn -SourceTable $def.sourceTable -CsvPath $csvPath -ModuleCode $def.moduleCode -EntityType $def.entityType

  $sql = @"
BEGIN;
CREATE TEMP TABLE stg (
  source_table text,
  variable_code text,
  variable_label text,
  definition text,
  unit text,
  entity_type text,
  module_code text,
  display_order integer,
  is_active boolean
);
\copy stg (source_table, variable_code, variable_label, definition, unit, entity_type, module_code, display_order, is_active) FROM '$csvPath' WITH (FORMAT csv, HEADER true, ENCODING 'UTF8');
INSERT INTO access.variable_dictionary (source_table, variable_code, variable_label, definition, unit, entity_type, module_code, display_order, is_active)
SELECT DISTINCT ON (source_table, variable_code)
  source_table, variable_code, variable_label, definition, unit, entity_type, module_code, display_order, is_active
FROM stg
ORDER BY source_table, variable_code, display_order
ON CONFLICT (source_table, variable_code) DO UPDATE
SET
  variable_label = EXCLUDED.variable_label,
  definition = EXCLUDED.definition,
  unit = EXCLUDED.unit,
  entity_type = EXCLUDED.entity_type,
  module_code = EXCLUDED.module_code,
  display_order = EXCLUDED.display_order,
  is_active = EXCLUDED.is_active;
COMMIT;
"@
  Invoke-Psql -SqlText $sql
}

$totalRows = Invoke-PsqlScalar @"
SELECT COALESCE((SELECT COUNT(*) FROM access.sub_results WHERE import_id = $importId), 0)
     + COALESCE((SELECT COUNT(*) FROM access.rch_results WHERE import_id = $importId), 0);
"@

Invoke-Psql -SqlText @"
UPDATE access.import_runs
SET status = 'finished', finished_at = now(), total_rows = $totalRows
WHERE import_id = $importId;
"@

Close-ComObject $conn
Write-Log "Import terminé import_id=$importId total_rows=$totalRows"
exit 0

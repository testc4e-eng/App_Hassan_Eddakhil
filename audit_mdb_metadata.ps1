#Requires -Version 5.1
<#
.SYNOPSIS
    Audit metadata for all SWATOutput.mdb files under "data HD/Modèle Bge HAD".
#>
$root = 'C:\dev\Barrage-Hassan Dakhil\data HD\Modèle Bge HAD'
$outDir = 'C:\dev\Barrage-Hassan Dakhil\Hassan Addakhil\App_Hassan_Eddakhil-dev_ilh_0107\AUDIT_GOUVERNANCE_DONNEES'
$csvPath = Join-Path $outDir 'swat_output_mdb_audit.csv'

function Write-Log($msg) {
    $ts = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
    "$ts $msg" | Tee-Object -FilePath (Join-Path $outDir 'swat_output_mdb_audit.log') -Append
}

function Get-ScenarioName($path) {
    if ($path -match 'Scenarios_Changement_Climatique[\\/]?(\w+)') {
        return $matches[1]
    }
    if ($path -match 'Sc.narios_d.att.nuation_d.rosion_.reboissement.[\\/]?Sc.nario\s+(\d+)') {
        return "scenario_$($matches[1])"
    }
    return 'unknown'
}

function Get-Aggregation($path) {
    if ($path -match 'Scenarios[\\/](Daily|Monthly|Yearly)[\\/]TablesOut') {
        return $matches[1]
    }
    return 'unknown'
}

function Test-ColumnExists($conn, $tableName, $columnName) {
    $rs = $conn.OpenSchema(4, @($null, $null, $tableName, $columnName)) # 4 = adSchemaColumns
    $exists = -not $rs.EOF
    $rs.Close()
    [System.Runtime.Interopservices.Marshal]::ReleaseComObject($rs) | Out-Null
    return $exists
}

Write-Log "Starting audit. Root: $root"

$mdbFiles = Get-ChildItem -Path $root -Recurse -Filter 'SWATOutput.mdb' | Sort-Object FullName
Write-Log "Found $($mdbFiles.Count) MDB files"

$results = @()

foreach ($mdb in $mdbFiles) {
    $mdbPath = $mdb.FullName
    $scenario = Get-ScenarioName $mdbPath
    $aggregation = Get-Aggregation $mdbPath
    Write-Log "Processing: $mdbPath (scenario=$scenario, aggregation=$aggregation)"

    try {
        $connStr = 'Provider=Microsoft.ACE.OLEDB.12.0;Data Source="' + $mdbPath + '";Persist Security Info=False;'
        $conn = New-Object -ComObject ADODB.Connection
        $conn.Open($connStr)

        foreach ($table in @('sub', 'rch')) {
            try {
                $schemaRs = $conn.OpenSchema(20, @($null, $null, $table))
                $tableExists = $schemaRs.EOF -eq $false
                $schemaRs.Close()
                [System.Runtime.Interopservices.Marshal]::ReleaseComObject($schemaRs) | Out-Null

                if (-not $tableExists) {
                    Write-Log "  [$table] does not exist"
                    continue
                }

                $rs = New-Object -ComObject ADODB.Recordset
                $rs.Open("SELECT COUNT(*) AS cnt FROM [$table]", $conn, 3, 1, 1)
                $rowCount = $rs.Fields('cnt').Value
                $rs.Close()
                [System.Runtime.Interopservices.Marshal]::ReleaseComObject($rs) | Out-Null

                $rs = New-Object -ComObject ADODB.Recordset
                $rs.Open("SELECT SUB FROM [$table] GROUP BY SUB", $conn, 3, 1, 1)
                $distinctSub = 0
                while (-not $rs.EOF) { $distinctSub++; $rs.MoveNext() }
                $rs.Close()
                [System.Runtime.Interopservices.Marshal]::ReleaseComObject($rs) | Out-Null

                $hasYyyyddd = Test-ColumnExists $conn $table 'YYYYDDD'
                $dateInfo = ''
                if ($hasYyyyddd) {
                    $rs = New-Object -ComObject ADODB.Recordset
                    $rs.Open("SELECT MIN(YYYYDDD) AS min_yd, MAX(YYYYDDD) AS max_yd FROM [$table]", $conn, 3, 1, 1)
                    $minYd = $rs.Fields('min_yd').Value
                    $maxYd = $rs.Fields('max_yd').Value
                    $rs.Close()
                    [System.Runtime.Interopservices.Marshal]::ReleaseComObject($rs) | Out-Null
                    $dateInfo = "yd=$minYd..$maxYd"
                } else {
                    $rs = New-Object -ComObject ADODB.Recordset
                    $rs.Open("SELECT MIN(YEAR) AS min_y, MAX(YEAR) AS max_y FROM [$table]", $conn, 3, 1, 1)
                    $minY = $rs.Fields('min_y').Value
                    $maxY = $rs.Fields('max_y').Value
                    $rs.Close()
                    [System.Runtime.Interopservices.Marshal]::ReleaseComObject($rs) | Out-Null
                    $dateInfo = "year=$minY..$maxY"
                }

                $results += [PSCustomObject]@{
                    Scenario      = $scenario
                    Aggregation   = $aggregation
                    MdbPath       = $mdbPath
                    Table         = $table
                    RowCount      = $rowCount
                    DistinctSub   = $distinctSub
                    DateInfo      = $dateInfo
                }

                Write-Log "  [$table] rows=$rowCount distinct_sub=$distinctSub $dateInfo"
            }
            catch {
                Write-Log "  ERROR [$table] : $_"
            }
        }

        $conn.Close()
        [System.Runtime.Interopservices.Marshal]::ReleaseComObject($conn) | Out-Null
    }
    catch {
        Write-Log "  ERROR connecting to MDB : $_"
    }
}

$results | Export-Csv -Path $csvPath -NoTypeInformation -Encoding UTF8
Write-Log "Audit saved to: $csvPath with $($results.Count) rows"
$results | Format-Table -AutoSize | Out-String | ForEach-Object { Write-Log $_ }

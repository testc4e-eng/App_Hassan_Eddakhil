#Requires -Version 5.1
param(
  [Parameter(Mandatory=$true)]
  [string]$MdbPath,
  [Parameter(Mandatory=$true)]
  [string]$TableName,
  [Parameter(Mandatory=$true)]
  [string]$OutputCsv,
  [string]$Delimiter = "|"
)

$ErrorActionPreference = "Stop"

$connStr = "Provider=Microsoft.ACE.OLEDB.12.0;Data Source=$MdbPath;Persist Security Info=False;"
$conn = New-Object System.Data.OleDb.OleDbConnection($connStr)
$conn.Open()

$adapter = New-Object System.Data.OleDb.OleDbDataAdapter("SELECT * FROM [$TableName]", $conn)
$table = New-Object System.Data.DataTable
[void]$adapter.Fill($table)
$conn.Close()

$writer = [System.IO.StreamWriter]::new($OutputCsv, $false, [System.Text.Encoding]::UTF8)
try {
  # Write header
  $headers = $table.Columns | ForEach-Object { $_.ColumnName }
  $writer.WriteLine(($headers -join $Delimiter))

  foreach ($row in $table.Rows) {
    $values = foreach ($col in $table.Columns) {
      $val = $row[$col]
      if ($val -eq $null -or $val -is [System.DBNull]) {
        ""
      } else {
        $s = [string]$val
        # Escape delimiter and quotes
        if ($s.Contains($Delimiter) -or $s.Contains('"') -or $s.Contains("`n") -or $s.Contains("`r")) {
          $s = $s.Replace('"', '""')
          '"' + $s + '"'
        } else {
          $s
        }
      }
    }
    $writer.WriteLine(($values -join $Delimiter))
  }
} finally {
  $writer.Close()
}

Write-Host "Exported $($table.Rows.Count) rows to $OutputCsv"

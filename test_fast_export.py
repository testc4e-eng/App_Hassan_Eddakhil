import subprocess
import sys

mdb_path = r"C:\dev\Barrage-Hassan Dakhil\data HD\Modèle Bge HAD\Scénarios_d’atténuation_d’érosion_(reboissement)\Scénario 1\SWAT_HAD\Scenarios\Daily\TablesOut\SWATOutput.mdb"
output_csv = r"scripts\swat-import\work_scenario_1\sub_fast.csv"

cmd = [
    "powershell", "-NoProfile", "-ExecutionPolicy", "Bypass", "-File", "fast_export_table.ps1",
    "-MdbPath", mdb_path,
    "-TableName", "sub",
    "-OutputCsv", output_csv,
]

result = subprocess.run(cmd, capture_output=True, text=True)
print("STDOUT:", result.stdout)
print("STDERR:", result.stderr)
print("Return code:", result.returncode)

# SWAT Import Pipeline

Pipeline PowerShell pour analyser et ingérer `SWATOutput.mdb` dans PostgreSQL `hydro_hd_1714`.

## Fichiers

- `analyze_mdb.ps1` : inventaire des tables, colonnes, comptages et aperçu.
- `import_swat_output.ps1` : export Access -> CSV -> `psql \copy`.
- `mapping.config.json` : mapping source -> PostgreSQL.

## Utilisation

Prévisualisation:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\swat-import\analyze_mdb.ps1
powershell -ExecutionPolicy Bypass -File .\scripts\swat-import\import_swat_output.ps1 -Mode preview
```

Import:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\swat-import\import_swat_output.ps1 -Mode import
```

Reload complet:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\swat-import\import_swat_output.ps1 -Mode reload
```

## Notes

- `YEAR + YYYYDDD` construit la date journalière.
- `MON` n’est pas utilisé comme mois civil.
- Les séries `sub` et `rch` alimentent le schéma `access`.
- Les variables SWAT sont stockées dans `access.variable_dictionary`.

# SWAT Import Pipeline

Pipeline PowerShell pour analyser et ingérer `SWATOutput.mdb` dans PostgreSQL `hydro_hd_1714`.

## Fichiers

- `analyze_mdb.ps1` : inventaire des tables, colonnes, comptages et aperçu.
- `import_swat_output.ps1` : export Access -> CSV -> `psql \copy`.
- `import_etat_actuel_bundle.ps1` : import complet des MDB Daily/Monthly/Yearly pour le scénario État actuel.
- `mapping.config.json` : mapping source -> PostgreSQL.
- `verify_etat_actuel.sql` : requêtes de contrôle COUNT/MIN/MAX après import.

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

Import complet "État actuel" (Daily + Monthly + Yearly + synchro core):

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\swat-import\import_etat_actuel_bundle.ps1
```

## Notes

- `YEAR + YYYYDDD` construit la date journalière.
- `MON` n’est pas utilisé comme mois civil.
- Les séries `sub` et `rch` alimentent le schéma `access`.
- Les variables SWAT sont stockées dans `access.variable_dictionary`.

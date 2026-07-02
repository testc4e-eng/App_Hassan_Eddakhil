# Access Import Pipeline

Ce dossier contient le pipeline d'audit et d'import du fichier `SWATOutput.mdb`.

## Scripts

- `analyze_access.ps1` : inventaire automatique des tables Access, des colonnes, des volumes et d'exemples.
- `import_access.ps1` : import CSV -> PostgreSQL avec calcul de `period_date` et upsert par clé naturelle.
- `mapping.config.json` : description des tables source, des tables cibles et des colonnes exportées.

## Modes

### Audit

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\access-import\analyze_access.ps1
```

### Import de test

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\access-import\import_access.ps1 -Mode preview
```

### Import réel

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\access-import\import_access.ps1 -Mode import
```

### Rechargement complet

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\access-import\import_access.ps1 -Mode reload
```

## Hypothèses

- `sub` et `rch` sont des séries SWAT journalières.
- La date métier est reconstruite depuis `YEAR` + `YYYYDDD`.
- Les tables `tbl*Def` alimentent le dictionnaire de variables utilisé par le backend.


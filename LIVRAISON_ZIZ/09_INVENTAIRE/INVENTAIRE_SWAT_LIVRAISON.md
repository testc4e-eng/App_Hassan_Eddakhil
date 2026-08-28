# INVENTAIRE SWAT LIVRAISON

Date : 2026-08-27

Projet source : `D:\3- Projets\App_Hassan_Addakhil`

## Inventaire principal

| Element | Type | Fonction | Runtime normal | Import seulement | Windows requis | Linux compatible | Decision livraison |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `scripts/swat-import/analyze_mdb.ps1` | PowerShell | Inventaire tables/colonnes/comptages d'un MDB | Non | Oui | Oui | Non | `A LIVRER` dans `SWAT_ADMIN_WINDOWS` |
| `scripts/swat-import/import_swat_output.ps1` | PowerShell | Import MDB -> `access.*` avec modes `preview/import/reload/replace` | Non | Oui | Oui | Non | `A LIVRER` dans `SWAT_ADMIN_WINDOWS` |
| `scripts/swat-import/import_etat_actuel_bundle.ps1` | PowerShell | Orchestration Daily/Monthly/Yearly + appel API de sync | Non | Oui | Oui | Non | `A LIVRER` dans `SWAT_ADMIN_WINDOWS` |
| `scripts/swat-import/mapping.config.json` | JSON | Mapping source MDB -> tables PostgreSQL | Non | Oui | Indirect | Indirect | `A LIVRER` avec les scripts admin |
| `scripts/swat-import/README.md` | Markdown | Notice du pipeline SWAT | Non | Oui | Non | Oui | `A LIVRER` |
| `scripts/swat-import/verify_etat_actuel.sql` | SQL | Verification post-import | Non | Oui | Non | Oui | `OPTIONNEL` |
| `scripts/swat-import/sync_core_etat_actuel.sql` | SQL | Resynchronisation `access.*` -> `core.*` pour `etat_actuel` | Non | Oui | Non | Oui | `OPTIONNEL` expert |
| `scripts/swat-import/sync_syldt_scenarios_from_legacy.sql` | SQL | Duplication `SYLDT_HA` vers scenarios cibles | Non | Oui | Non | Oui | `OPTIONNEL` expert |
| `scripts/swat-import/etat_actuel_sync_payload.json` | JSON | Exemple de payload d'appel API | Non | Oui | Non | Oui | `OPTIONNEL` |
| `scripts/swat-import/extract_apport_hassan_excel.py` | Python | Extraction XLSX -> CSV de donnees observees | Non | Non | Non | Oui | `OPTIONNEL` maintenance |
| `scripts/swat-import/replace_observed_debit_station_1940_48.sql` | SQL | Correction ponctuelle d'une serie observee | Non | Non | Non | Partiellement | `A EXCLURE` du package standard |
| `scripts/swat-import/reports/*` | Rapports generes | Sorties d'analyse MDB historiques | Non | Non | Non | Oui | `A EXCLURE` |
| `scripts/swat-import/logs/*` | Temporaire | Logs d'execution | Non | Non | Non | Oui | `A EXCLURE` |
| `scripts/swat-import/work/*` | Temporaire | Fichiers intermediaires | Non | Non | Non | Oui | `A EXCLURE` |
| `archive/scripts/swat-import/*` | Archive | Ancienne copie du pipeline SWAT | Non | Non | Non | Oui | `A EXCLURE` |
| `hydro_Hassan dakhil/backend/src/services/swatIngestion.service.ts` | Backend TS | Orchestration import, normalisation, lecture SWAT | Oui | Oui | Pour import MDB reel seulement | Oui avec `skipAccess` | `A LIVRER` dans le package serveur |
| `hydro_Hassan dakhil/backend/src/routes/swatRoutes.ts` | Backend TS | Endpoints SWAT lecture/import/admin | Oui | Oui | Non | Oui | `A LIVRER` dans le package serveur |
| `hydro_Hassan dakhil/backend/src/services/access.service.ts` | Backend TS | Lecture `access.*` pour consultation et audit | Oui | Non | Non | Oui | `A LIVRER` dans le package serveur |
| `hydro_Hassan dakhil/frontend/src/components/dashboard/modules/data-management/SwatIngestionPage.tsx` | Frontend TSX | Ecran technique d'import SWAT | Non pour metier quotidien | Oui | Pour import MDB reel seulement | Oui mais usage limite | `A LIVRER` avec limitation documentee |
| `hydro_Hassan dakhil/frontend/src/components/dashboard/modules/data-management/useSwatDataManagement.ts` | Frontend TSX | Chargement summary/batches/availability/data | Oui | Oui | Non | Oui | `A LIVRER` avec vigilance role admin |

## Classification fonctionnelle

### RUNTIME OBLIGATOIRE

- `hydro_Hassan dakhil/backend/src/services/swatIngestion.service.ts`
- `hydro_Hassan dakhil/backend/src/routes/swatRoutes.ts`
- `hydro_Hassan dakhil/backend/src/services/access.service.ts`
- services backend de lecture SWAT depuis PostgreSQL

### ADMINISTRATION

- `scripts/swat-import/analyze_mdb.ps1`
- `scripts/swat-import/import_swat_output.ps1`
- `scripts/swat-import/import_etat_actuel_bundle.ps1`
- `scripts/swat-import/mapping.config.json`
- `scripts/swat-import/verify_etat_actuel.sql`
- `scripts/swat-import/etat_actuel_sync_payload.json`

### IMPORT SWAT

- `scripts/swat-import/analyze_mdb.ps1`
- `scripts/swat-import/import_swat_output.ps1`
- `scripts/swat-import/import_etat_actuel_bundle.ps1`
- `scripts/swat-import/sync_core_etat_actuel.sql`
- `scripts/swat-import/sync_syldt_scenarios_from_legacy.sql`

### MAINTENANCE

- `scripts/swat-import/extract_apport_hassan_excel.py`
- `scripts/swat-import/replace_observed_debit_station_1940_48.sql`

### HISTORIQUE / ARCHIVE

- `archive/scripts/swat-import/*`

### INUTILE POUR LIVRAISON

- `scripts/swat-import/logs/*`
- `scripts/swat-import/work/*`
- `scripts/swat-import/reports/*`

## Scripts a livrer

- `analyze_mdb.ps1`
- `import_swat_output.ps1`
- `import_etat_actuel_bundle.ps1`
- `mapping.config.json`
- `README.md`

## Scripts optionnels

- `verify_etat_actuel.sql`
- `sync_core_etat_actuel.sql`
- `sync_syldt_scenarios_from_legacy.sql`
- `etat_actuel_sync_payload.json`
- `extract_apport_hassan_excel.py`

## Elements a exclure

- `replace_observed_debit_station_1940_48.sql`
- `scripts/swat-import/logs/*`
- `scripts/swat-import/work/*`
- `scripts/swat-import/reports/*`
- `archive/scripts/swat-import/*`

## Conclusion

- Aucun fichier `.mdb` n'est present dans le depot.
- Les fichiers MDB sont des sources d'import externes.
- Le package serveur Linux Ziz n'a pas besoin des outils Windows/MDB pour l'exploitation normale.
- Les outils SWAT doivent etre packages a part dans `SWAT_ADMIN_WINDOWS`.

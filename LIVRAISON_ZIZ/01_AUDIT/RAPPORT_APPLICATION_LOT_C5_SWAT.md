# RAPPORT APPLICATION LOT C5 - SWAT

Date : 2026-08-27

Projet source : `D:\3- Projets\App_Hassan_Addakhil`

Baseline Git attendue :

- Branche : `ilh_dev_20-07`
- HEAD : `ef62eae98af1c9991ee2287b969cf53f2051db88`

## 1. Objectif

Determiner si le serveur Linux Ziz peut faire fonctionner la plateforme normale sans dependance Windows, PowerShell ou Microsoft Access/MDB, et separer proprement les fonctions SWAT d'administration/import du runtime applicatif standard.

## 2. Etat initial

- Les lots C1 a C4 sont deja valides.
- Le runtime cible est `frontend + backend + PostgreSQL/PostGIS` sur serveur Linux Docker.
- Le perimetre SWAT est present a la fois dans :
  - `scripts/swat-import`
  - `archive/scripts/swat-import`
  - `hydro_Hassan dakhil/backend/src`
  - `hydro_Hassan dakhil/frontend/src`
- Aucun fichier `.mdb` n'est present dans le depot.
- Les scripts SWAT cherchent des fichiers externes `SWATOutput.mdb`.

## 3. Architecture SWAT actuelle

Architecture observee dans le code :

```text
SWATOutput.mdb externe
        |
        v
PowerShell + ACE/OLEDB + psql
        |
        v
PostgreSQL schema access
  - access.import_runs
  - access.rch_results
  - access.sub_results
  - access.variable_dictionary
        |
        v
Backend Node/TypeScript
  - staging.*
  - core.timeseries
  - core.measurements
  - public.v_ts_catalog_enriched
        |
        v
Frontend
  - consultation
  - data management
  - import admin SWAT
```

Conclusion :

- Les fichiers MDB servent de source d'import.
- Le runtime applicatif lit ensuite PostgreSQL, pas les fichiers MDB.

## 4. Dependances Windows

Dependances techniques detectees :

- `Microsoft.ACE.OLEDB.12.0` via COM `ADODB.Connection`
- PowerShell
- `powershell.exe`
- `psql.exe`
- chemins de recherche SWAT externes de type Windows

Preuves principales :

- `scripts/swat-import/analyze_mdb.ps1:73-74` ouvre le MDB via `ADODB.Connection` et `Microsoft.ACE.OLEDB.12.0`
- `scripts/swat-import/import_swat_output.ps1:96-97` ouvre le MDB via ACE/OLEDB
- `hydro_Hassan dakhil/backend/src/services/swatIngestion.service.ts:136` declare explicitement que les modes MDB sont supportes uniquement sur backend Windows local
- `hydro_Hassan dakhil/backend/src/services/swatIngestion.service.ts:156` lance `powershell.exe`
- `hydro_Hassan dakhil/frontend/src/components/dashboard/modules/data-management/SwatIngestionPage.tsx:249-251` affiche `import/reload/preview (backend Windows local uniquement)`
- `hydro_Hassan dakhil/frontend/src/components/dashboard/modules/data-management/SwatIngestionPage.tsx:266` rappelle que seul `skipAccess` est supporte sous Docker/Linux

Conclusion :

- L'import SWAT/MDB actuel depend de Windows.
- Cette dependance est volontairement explicite dans le code backend et frontend.

## 5. Dependances MDB

Les scripts cherchent des fichiers `SWATOutput.mdb` dans plusieurs emplacements :

- `SWAT_MDB_PATH`
- `SWAT_DATA_ROOT`
- `HASSAN_DATA_ROOT`
- sous-dossiers `Daily\TablesOut`, `Monthly\TablesOut`, `Yealy\TablesOut`
- sous-dossiers `Scenarios\Daily\TablesOut`, `Scenarios\Monthly\TablesOut`, `Scenarios\Yealy\TablesOut`

Preuves :

- `scripts/swat-import/analyze_mdb.ps1:34-42`
- `scripts/swat-import/import_swat_output.ps1:51-59`
- `scripts/swat-import/import_etat_actuel_bundle.ps1:75-77`

Etat du depot :

- Aucun fichier `.mdb` n'a ete trouve dans `D:\3- Projets\App_Hassan_Addakhil`.
- Les rapports SWAT references dans `scripts/swat-import/reports/*` pointent vers des chemins externes `D:\...SWATOutput.mdb`.

Reponse demandee :

### Apres que les donnees SWAT ont ete importees dans `hydro_hd`, la plateforme a-t-elle encore besoin des fichiers MDB pour afficher et analyser les donnees ?

Reponse :

- `Non`.
- Le code actif de consultation lit uniquement PostgreSQL :
  - `access.rch_results`
  - `access.sub_results`
  - `core.timeseries`
  - `core.measurements`
  - `public.v_ts_catalog_enriched`
- Aucune lecture de MDB n'est effectuee dans les ecrans metier normaux.

## 6. Fonctions runtime

Fonctions compatibles avec le runtime Linux apres import des donnees :

- consultation SWAT de synthese via `/api/v1/hydro/swat/summary`
- consultation disponibilite via `/api/v1/hydro/swat/availability`
- consultation de points via `/api/v1/hydro/swat/data`
- consultation par sous-bassins, reaches, variables, series et statistiques
- comparaison station / simulation
- cartographie thematique sediment et degradation

Preuves backend :

- `hydro_Hassan dakhil/backend/src/services/swatIngestion.service.ts:1063-1112` lit `public.v_ts_catalog_enriched`
- `hydro_Hassan dakhil/backend/src/services/swatIngestion.service.ts:1266` lit `core.measurements`
- `hydro_Hassan dakhil/backend/src/services/thematicReach.service.ts:85` lit `access.rch_results`
- `hydro_Hassan dakhil/backend/src/services/thematicSubbasin.service.ts:85` lit `access.sub_results`
- `hydro_Hassan dakhil/backend/src/services/stationSimulation.service.ts` utilise `api.mv_hydro_station_timeseries`, `access.sub_results` et `core.measurements`
- `hydro_Hassan dakhil/backend/src/constants/swatDataSources.ts` documente des sources `HYBRIDE`, `MATERIALIZED` et `DYNAMIC`, mais toujours dans PostgreSQL

Conclusion :

- Le runtime SWAT n'est pas "core only".
- Il est bien "PostgreSQL only" apres import.
- Certaines vues lisent `core.*`, d'autres lisent encore `access.*`.

## 7. Fonctions ingestion

Fonctions relevant de l'administration technique :

- analyse d'un MDB
- import Access vers `access.*`
- recharge complete `reload`
- remplacement cible `replace`
- synchronisation `Etat actuel`
- duplication legacy `SYLDT_HA`
- suppression ciblee de donnees SWAT deja normalisees

Preuves :

- `scripts/swat-import/analyze_mdb.ps1` : analyse du MDB et ecriture de rapports
- `scripts/swat-import/import_swat_output.ps1:383` insere dans `access.import_runs`
- `scripts/swat-import/import_swat_output.ps1:393` fait `TRUNCATE access.sub_results, access.rch_results, access.variable_dictionary`
- `scripts/swat-import/import_swat_output.ps1:397-398` fait `DELETE` par scenario
- `scripts/swat-import/import_etat_actuel_bundle.ps1:94-103` supprime des donnees `core.measurements`, `core.measurement_batches` et `core.timeseries`
- `scripts/swat-import/import_etat_actuel_bundle.ps1:118` appelle l'API backend d'import
- `hydro_Hassan dakhil/backend/src/services/swatIngestion.service.ts:1368-1379` supprime des donnees normalisees via `deleteByFilter`

Conclusion :

- Le perimetre ingestion est admin/technique.
- Il ne doit pas faire partie du runtime serveur Linux standard.

## 8. Frontend

Constats :

- La page `/dashboard/data/ingestion-swat` est protegee par `ProtectedRoute`, pas par `AdminRoute`.
- Le module `Data Management` presente l'ingestion SWAT comme module "Disponible".
- La page elle-meme affiche deja que les modes MDB reels sont Windows-only.
- Le hook `useSwatDataManagement` charge `summary`, `batches` et `availability` en `Promise.all`.
- Or `batches` est protege cote backend par role `ADMIN`.

Implication :

- Un utilisateur authentifie non admin peut ouvrir l'ecran SWAT, mais il peut rencontrer une erreur de chargement si l'appel `batches` est refuse.

Preuves :

- `hydro_Hassan dakhil/frontend/src/App.tsx:64-68`
- `hydro_Hassan dakhil/frontend/src/components/dashboard/modules/data-management/DataManagementHub.tsx`
- `hydro_Hassan dakhil/frontend/src/components/dashboard/modules/data-management/SwatIngestionPage.tsx:249-266`
- `hydro_Hassan dakhil/frontend/src/components/dashboard/modules/data-management/useSwatDataManagement.ts:64-67`

Decision C5 :

- Pas de modification UI appliquee pendant ce lot.
- Limitation documentee.
- Recommandation future possible : message UI plus explicite ou restriction front admin-only.

## 9. Backend

Constats :

- `POST /hydro/swat/import` : admin uniquement
- `GET /hydro/swat/batches` : admin uniquement
- `DELETE /hydro/swat/delete-by-filter` : admin uniquement
- `GET /hydro/swat/summary` : public authentifie ou public applicatif selon routage
- `GET /hydro/swat/availability` : lecture
- `GET /hydro/swat/data` : lecture
- les autres endpoints SWAT de consultation sont en lecture

Preuves :

- `hydro_Hassan dakhil/backend/src/routes/swatRoutes.ts:7-12`

Interpretation :

- L'architecture logicielle separe deja les actions destructives/techniques des actions de consultation.
- Le backend assume explicitement l'usage `skipAccess` sous Docker/Linux.

## 10. Chemins locaux

| Fichier | Ligne | Dependance | Usage | Bloquant runtime Linux | Decision |
| --- | ---: | --- | --- | --- | --- |
| `scripts/swat-import/analyze_mdb.ps1` | 73-74 | `ADODB` + `Microsoft.ACE.OLEDB.12.0` | Lecture MDB | Oui pour analyse MDB | Garder dans package Windows admin |
| `scripts/swat-import/import_swat_output.ps1` | 96-97 | `ADODB` + `Microsoft.ACE.OLEDB.12.0` | Import MDB vers PostgreSQL | Oui pour import MDB | Garder dans package Windows admin |
| `scripts/swat-import/import_swat_output.ps1` | 75 | Recherche recursive `SWATOutput.mdb` | Localisation source MDB | Oui pour import MDB | Garder, documenter source externe |
| `scripts/swat-import/import_etat_actuel_bundle.ps1` | 66 | Recherche recursive `SWATOutput.mdb` | Localisation scenario Daily | Oui pour import MDB | Garder dans package Windows admin |
| `scripts/swat-import/import_etat_actuel_bundle.ps1` | 75-77 | `Daily/Monthly/Yealy/.../SWATOutput.mdb` | Import bundle Etat actuel | Oui pour import MDB | Garder, verifier le dossier source reel |
| `scripts/swat-import/replace_observed_debit_station_1940_48.sql` | 8 | `D:/3- Projets/...csv` | Recharge CSV observe | Non pour runtime normal, mais non portable | Exclure du package Ziz standard |
| `hydro_Hassan dakhil/backend/src/services/swatIngestion.service.ts` | 136 | Backend Windows local | Blocage explicite des modes MDB sous Linux | Oui pour import MDB | Conserver comme preuve d'isolation |
| `hydro_Hassan dakhil/backend/src/services/swatIngestion.service.ts` | 156 | `powershell.exe` | Execution script d'import | Oui pour import MDB | Conserver cote source, pas package Linux |
| `hydro_Hassan dakhil/frontend/src/components/dashboard/modules/data-management/SwatIngestionPage.tsx` | 249-251 | Mention Windows local | UX d'import | Non pour runtime, Oui pour import direct | Documenter |
| `hydro_Hassan dakhil/frontend/src/components/dashboard/modules/data-management/SwatIngestionPage.tsx` | 266 | `skipAccess` uniquement sous Docker/Linux | UX d'information | Non | Documenter |

## 11. Scripts actifs

Perimetre actif principal : `scripts/swat-import`

| Element | Type | Fonction | Runtime normal | Import seulement | Windows requis | Linux compatible | Decision livraison |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `scripts/swat-import/analyze_mdb.ps1` | PowerShell | Analyse MDB et generation rapports | Non | Oui | Oui | Non | RUNTIME : non. Livrer dans `SWAT_ADMIN_WINDOWS` |
| `scripts/swat-import/import_swat_output.ps1` | PowerShell | Import MDB vers `access.*` | Non | Oui | Oui | Non | Livrer dans `SWAT_ADMIN_WINDOWS` |
| `scripts/swat-import/import_etat_actuel_bundle.ps1` | PowerShell | Orchestration Daily/Monthly/Yearly + sync backend | Non | Oui | Oui | Non | Livrer dans `SWAT_ADMIN_WINDOWS` |
| `scripts/swat-import/mapping.config.json` | JSON | Mapping tables/colonnes MDB -> PostgreSQL | Non | Oui | Indirect | Indirect | Livrer avec les scripts Windows |
| `scripts/swat-import/verify_etat_actuel.sql` | SQL | Verification post-import | Non | Oui | Non | Oui | Optionnel, utile pour validation admin |
| `scripts/swat-import/sync_core_etat_actuel.sql` | SQL | Resynchronisation `access` -> `core` pour `etat_actuel` | Non | Oui | Non | Oui | Optionnel expert, pas runtime normal |
| `scripts/swat-import/sync_syldt_scenarios_from_legacy.sql` | SQL | Duplication legacy `SYLDT_HA` vers scenarios cibles | Non | Oui | Non | Oui | Optionnel expert / maintenance |
| `scripts/swat-import/etat_actuel_sync_payload.json` | JSON | Exemple de payload API | Non | Oui | Non | Oui | Optionnel |
| `scripts/swat-import/extract_apport_hassan_excel.py` | Python | Extraction XLSX -> CSV observe | Non | Non | Non | Oui | Optionnel maintenance, hors coeur SWAT MDB |
| `scripts/swat-import/replace_observed_debit_station_1940_48.sql` | SQL | Correction manuelle de debit observe | Non | Non | Non | Partiellement, chemin actuel non portable | Exclure du package standard |
| `scripts/swat-import/reports/*` | Rapports generes | Inventaires et analyses MDB | Non | Non | Non | Oui | Exclure du package final standard |
| `scripts/swat-import/logs/*` | Temporaire | Logs d'execution | Non | Non | Non | Oui | Exclure |
| `scripts/swat-import/work/*` | Temporaire | Fichiers intermediaires CSV/SQL | Non | Non | Non | Oui | Exclure |
| `scripts/swat-import/README.md` | Documentation | Mode d'emploi du pipeline | Non | Oui | Non | Oui | Livrer avec `SWAT_ADMIN_WINDOWS` |

## 12. Scripts historiques

Perimetre historique : `archive/scripts/swat-import`

Constats :

- meme structure generale que `scripts/swat-import`
- copies plus anciennes ou variantes historiques
- rapports dupliques sous `archive/scripts/swat-import/reports/*`

Decision :

- `archive/ = EXCLU DU PACKAGE FINAL`
- aucune preuve ne justifie une remise a Ziz dans le package serveur
- conserver seulement comme reference interne du depot

## 13. Architecture cible

Architecture C5 retenue :

```text
                SERVEUR ZIZ LINUX
                       |
              Frontend / Backend
                       |
                   hydro_hd
                       ^
                       |
              donnees deja importees

           POSTE ADMIN WINDOWS
                       |
             fichiers SWAT / MDB
                       |
              scripts PowerShell
                       |
                   import
                       |
                       v
                    hydro_hd
```

Evaluation :

- Techniquement realiste avec le projet actuel : `Oui`
- Conforme au code backend : `Oui`
- Conforme au frontend : `Oui`

## 14. Limitation serveur Linux

Verdict technique :

- le serveur Linux Ziz peut faire tourner la plateforme normale sans outils MDB/Access
- l'import SWAT/MDB n'est pas portable en l'etat sur Linux
- l'import doit etre maintenu comme outil d'administration separe

Formulation retenue :

- `RUNTIME ZIZ LINUX PORTABLE - IMPORT SWAT/MDB MAINTENU COMME OUTIL D'ADMINISTRATION WINDOWS`

## 15. Package Windows recommande

Package distinct recommande :

```text
SWAT_ADMIN_WINDOWS/
  README.md
  analyze_mdb.ps1
  import_swat_output.ps1
  import_etat_actuel_bundle.ps1
  mapping.config.json
  verify_etat_actuel.sql
  sync_core_etat_actuel.sql
  sync_syldt_scenarios_from_legacy.sql
  etat_actuel_sync_payload.json
```

Elements optionnels a part :

- `extract_apport_hassan_excel.py`

Elements a ne pas livrer par defaut :

- `replace_observed_debit_station_1940_48.sql`
- `logs/`
- `work/`
- `reports/`
- tout `archive/scripts/swat-import`

## 16. Securite

Constats :

- aucun mot de passe en dur n'a ete releve dans le perimetre SWAT actif
- les scripts PowerShell lisent les credentials via :
  - `PGPASSWORD`
  - `DB_PASSWORD`
  - `POSTGRES_PASSWORD`
- le backend lit la configuration DB via variables d'environnement

Preuves :

- `scripts/swat-import/import_etat_actuel_bundle.ps1:22-24`
- `scripts/swat-import/import_swat_output.ps1:117-124`
- `hydro_Hassan dakhil/backend/src/config/database.config.ts`
- `hydro_Hassan dakhil/backend/src/config/loadEnv.ts`

Point de vigilance :

- `-PgPassword` existe comme parametre de script ; il faut privilegier les variables d'environnement et eviter l'historique shell.

## 17. Risques

- aucun fichier MDB n'est livre dans le depot ; l'import depend d'une source externe fournie separement
- le nom de dossier `Yealy` dans les scripts doit correspondre au stockage reel des exports SWAT
- certaines consultations SWAT utilisent encore `access.*` directement ; il faudra conserver ces tables dans la base livree
- l'ecran frontend SWAT est visible a tout utilisateur authentifie, alors que certaines actions sont admin-only
- le module frontend peut rencontrer une erreur de chargement pour un non-admin a cause de l'appel `batches`
- plusieurs scripts de maintenance sont destructifs pour les donnees cibles et doivent rester reserves a l'administration

## 18. Decision finale

Decision :

- Le perimetre SWAT est clairement separable du runtime Linux
- Les fichiers MDB sont des sources d'import uniquement
- Le serveur Linux Ziz peut fonctionner sans PowerShell ni Access une fois les donnees chargees dans `hydro_hd`
- Les outils SWAT Windows doivent etre livres dans un package distinct d'administration

## 19. Matrice fonctionnelle

| Fonction | Serveur Linux Ziz | Poste Windows admin | Commentaire |
| --- | --- | --- | --- |
| Consultation hydrologique | Oui | Oui | Le runtime lit PostgreSQL et l'UI web ; aucune lecture MDB au runtime |
| Consultation climat | Oui | Oui | Aucune dependance MDB/Access detectee dans les modules de consultation |
| Sediments | Oui | Oui | Disponible via `access.*`, `core.*` et vues PostgreSQL deja alimentees |
| Scenarios SWAT deja importes | Oui | Oui | Lecture via backend depuis PostgreSQL |
| Import nouveau MDB | Non | Oui | Necessite PowerShell Windows + ACE/OLEDB + source MDB |
| Analyse MDB | Non | Oui | `analyze_mdb.ps1` depend de COM Access/ACE |
| Synchronisation SWAT | Non | Oui | Bundle PowerShell / SQL / API backend, reserve a l'administration |

## Conclusion C5

- Aucun import reel n'a ete execute pendant ce lot
- Aucune donnee n'a ete modifiee
- Aucun secret n'a ete divulgue
- Aucune correction C1/C2/C3/C4 n'a ete modifiee pendant C5

Verdict prefere et confirme par le code :

- `RUNTIME ZIZ LINUX PORTABLE - IMPORT SWAT/MDB MAINTENU COMME OUTIL D'ADMINISTRATION WINDOWS`

# Audit des chemins Hassan Addakhil

## Racine officielle

PROJECT_ROOT = `D:\3- Projets\App_Hassan_Addakhil`

`git rev-parse --show-toplevel` retourne :

`D:/3- Projets/App_Hassan_Addakhil`

Verdict : la racine Git réelle correspond bien à la racine officielle, avec seulement une variation de séparateurs Windows (`\` vs `/`).

## Résumé

- Chemins `C:\` trouvés : 8 occurrences
- Chemins `D:\` trouvés : nombreux, majoritairement dans documentation/support JSON/MD
- Chemins absolus runtime problématiques : 8 occurrences dans 3 fichiers actifs
- Chemins legacy : oui, surtout dans `archive/` et `Support_Doc_HD/`
- Chemins documentation uniquement : très nombreux
- Chemins Docker internes valides : oui (`/app`, `/docker-entrypoint-initdb.d`, `/backup/hydro_hd.dump`, `/var/lib/postgresql/data`)

## Tableau détaillé

| Fichier | Ligne | Chemin | Type | Actif | Risque | Correction recommandée |
|---|---:|---|---|---|---|---|
| `hydro_Hassan dakhil/backend/src/config/hassanDataRoot.ts` | 10 | `path.resolve(process.cwd(), "..", "hassan dakhil")` | ACTIVE_RUNTIME | OUI | ÉLEVÉ | Remplacer à terme par variable d'environnement obligatoire ou fallback relatif fiable documenté |
| `hydro_Hassan dakhil/backend/src/services/advancedSpatial.service.ts` | 47 | `frontend/public/data/swat-advanced` via `getProjectRoot()` | ACTIVE_RUNTIME | OUI | FAIBLE | Correct si backend lancé depuis son répertoire attendu ; conserver, documenter |
| `hydro_Hassan dakhil/backend/src/services/advancedSpatial.service.ts` | 60-68 | sous-arbres `Scenarios_etat_actuel/...` et `Modèle Bge HAD/...` sous `HASSAN_DATA_ROOT` | ACTIVE_RUNTIME | OUI | MOYEN | Conserver mais fiabiliser la config de `HASSAN_DATA_ROOT` |
| `hydro_Hassan dakhil/backend/src/services/swatIngestion.service.ts` | 124-127 | résolutions relatives vers `scripts/swat-import/import_swat_output.ps1` | ACTIVE_RUNTIME | OUI | FAIBLE | Correct ; garder cette logique relative |
| `scripts/swat-import/import_swat_output.ps1` | 64-85 | `SWAT_MDB_PATH`, `SWAT_DATA_ROOT`, `HASSAN_DATA_ROOT` + recherche repo | ACTIVE_RUNTIME | OUI | MOYEN | Correct, mais dépend d'env absente aujourd'hui |
| `scripts/swat-import/analyze_mdb.ps1` | 47-68 | mêmes variables/fallbacks MDB | DEV_ONLY | NON | FAIBLE | Conserver pour diagnostic, documenter |
| `docker-compose.yml` | 13-14 | `./docker/db/init`, `${HYDRO_HD_DUMP_PATH:-./hydro_hd.sql}` → `/backup/hydro_hd.dump` | ACTIVE_RUNTIME | OUI | FAIBLE | Correct, portable, conserver |
| `docker-compose.yml` | 31-44 | `DB_HOST=host.docker.internal`, ports, env | ACTIVE_RUNTIME | OUI | MOYEN | Correct pour Windows Docker Desktop ; documenter pour livraison autre machine |
| `hydro_Hassan dakhil/frontend/src/api/spatial.ts` | 292-296 | `/data/hassan/subbasin_hru_summary.geojson`, `/data/hassan/nv_stream.geojson` | ACTIVE_RUNTIME | OUI | FAIBLE | Correct, chemins web relatifs racine |
| `hydro_Hassan dakhil/frontend/src/data/specificDegradationThematicMaps.ts` | 11 | `/data/hassan/degradation-maps/specific` | ACTIVE_RUNTIME | OUI | FAIBLE | Correct |
| `hydro_Hassan dakhil/frontend/src/data/reportAssets.ts` | 19,28,70 | `/data/hassan/report-maps`, `/data/hassan/reports`, PDF public | ACTIVE_RUNTIME | OUI | FAIBLE | Correct |
| `hydro_Hassan dakhil/frontend/src/features/intervention-program/data/interventionProgram.data.ts` | 17 | `public/data/hassan/...pdf` | ACTIVE_RUNTIME | OUI | FAIBLE | Tolérable mais hétérogène ; préférer uniformiser plus tard vers URL web `/data/...` |
| `hydro_Hassan dakhil/frontend/src/features/intervention-program/data/interventionProgram.data.ts` | 20,23 | `/data/hassan/...` | ACTIVE_RUNTIME | OUI | FAIBLE | Correct |
| `hydro_Hassan dakhil/backend/scripts/import_bathy_had.ts` | 38 | `D:/3- Projets/hassanAddakhil/bathy_HAD.xlsx` | DEV_ONLY | NON runtime app | ÉLEVÉ | Remplacer plus tard par variable d'env ou chemin relatif, sinon script non portable |
| `hydro_Hassan dakhil/backend/sql/seed_bathymetry_campaigns_had.sql` | 10-15 | `D:/3- Projets/hassanAddakhil/bathy_HAD.xlsx` | LEGACY | NON runtime | MOYEN | Ne pas exécuter tel quel sur autre machine ; documenter ou neutraliser plus tard |
| `scripts/swat-import/replace_observed_debit_station_1940_48.sql` | 8 | `D:/3- Projets/hassanAddakhil/scripts/swat-import/work/apport_hassan_addakhil_observed.csv` | LEGACY | NON runtime courant | MOYEN | À rendre paramétrable avant réutilisation |
| `archive/scripts/swat-import/mapping.config.json` | 2 | `C:\dev\Projects\hydro_HD\...SWATOutput.mdb` | LEGACY | NON | FAIBLE | Archive uniquement |
| `archive/fast_ingest_scenarios.py` | 21-22 | `C:/dev/Barrage-Hassan Dakhil/...` | LEGACY | NON | FAIBLE | Archive uniquement |
| `Support_Doc_HD/...json` | multiples | `D:\3- Projets\CHATBOT\...`, `D:\3- Projets\Plateformae-...`, `D:/Ollama/...` | GENERATED / DOCUMENTATION | NON | FAIBLE | Conserver comme preuve historique, pas comme config active |

## Chemins critiques

### 1. `HASSAN_DATA_ROOT` non fiabilisé

Le backend journalise encore :

- `[HASSAN_DATA_ROOT] configured` ou
- `[HASSAN_DATA_ROOT] missing`

Sources confirmées :

- `hydro_Hassan dakhil/backend/server.ts`
- `hydro_Hassan dakhil/backend/src/services/advancedSpatial.service.ts`
- `hydro_Hassan dakhil/backend/src/config/hassanDataRoot.ts`
- `scripts/swat-import/import_swat_output.ps1`
- `scripts/swat-import/analyze_mdb.ps1`

Constat :

- `HASSAN_DATA_ROOT` n’est présent ni dans `.env.example`, ni dans `hydro_Hassan dakhil/backend/.env.example`, ni dans les `.env` scannés.
- le fallback actuel est `path.resolve(process.cwd(), "..", "hassan dakhil")`.
- ce fallback dépend fortement du répertoire de lancement du backend.
- en Docker, `docker-compose.yml` ne transmet ni `HASSAN_DATA_ROOT`, ni `SWAT_DATA_ROOT`, ni `SWAT_MDB_PATH`.

Impact :

- spatial avancé : fragile si la donnée n’est pas exactement au bon endroit ;
- SWAT import PowerShell : dépend d’une config locale Windows externe ;
- portabilité : partielle.

### 2. scripts legacy avec chemins `D:/...` codés en dur

Occurrences actives hors documentation/archive :

- `hydro_Hassan dakhil/backend/scripts/import_bathy_had.ts`
- `hydro_Hassan dakhil/backend/sql/seed_bathymetry_campaigns_had.sql`
- `scripts/swat-import/replace_observed_debit_station_1940_48.sql`

Ces chemins pointent vers l’ancien emplacement :

`D:/3- Projets/hassanAddakhil/...`

Ils ne bloquent pas le runtime principal actuel, mais ils bloquent la réutilisation portable de ces scripts.

## HASSAN_DATA_ROOT

- Déclaration : aucune déclaration trouvée dans les `.env*` scannés
- Chargement : `hydro_Hassan dakhil/backend/src/config/loadEnv.ts`
- Utilisation :
  - `hydro_Hassan dakhil/backend/server.ts`
  - `hydro_Hassan dakhil/backend/src/services/advancedSpatial.service.ts`
  - `scripts/swat-import/import_swat_output.ps1`
  - `scripts/swat-import/analyze_mdb.ps1`
- Obligatoire :
  - pour le backend général : NON
  - pour spatial avancé / découverte SWAT MDB : OUI en pratique si le fallback ne correspond pas au disque
- Fallback actuel :
  - backend TS : `../hassan dakhil`
  - scripts PowerShell : candidats `SWAT_MDB_PATH`, `SWAT_DATA_ROOT`, `HASSAN_DATA_ROOT`, puis recherche récursive de `SWATOutput.mdb` dans le repo
- Docker :
  - non transmis actuellement
- Backend local :
  - peut le recevoir via `.env` backend ou racine, mais aucune valeur n’a été trouvée dans les fichiers audités

Verdict `HASSAN_DATA_ROOT` : `WARNING`

## SWAT

Éléments actifs :

- `hydro_Hassan dakhil/backend/src/services/swatIngestion.service.ts`
- `scripts/swat-import/import_swat_output.ps1`
- `scripts/swat-import/analyze_mdb.ps1`

Chemins actifs observés :

- script PS1 résolu par chemins relatifs depuis `process.cwd()` / `__dirname`
- MDB résolu dynamiquement via :
  - `SWAT_MDB_PATH`
  - `SWAT_DATA_ROOT`
  - `HASSAN_DATA_ROOT`
  - recherche repo

Chemins legacy observés :

- `archive/scripts/swat-import/mapping.config.json`
- `archive/scripts/access-import/mapping.config.json`
- rapports `scripts/swat-import/reports/...`

Verdict SWAT :

- runtime actuel local Windows : utilisable si variables/chemins externes sont fournis
- Docker : `skipAccess` compatible, import MDB complet non portable en l’état

## Docker

Chemins hôte valides et portables :

- `./docker/db/init`
- `./hydro_hd.sql`
- `./hydro_Hassan dakhil/backend`
- `./hydro_Hassan dakhil/frontend`

Chemins conteneur valides :

- `/var/lib/postgresql/data`
- `/docker-entrypoint-initdb.d`
- `/backup/hydro_hd.dump`
- `/app`

Point d’attention :

- le backend Docker pointe vers `host.docker.internal:5432`, donc la base officielle reste la base hôte Windows, pas la base du conteneur `db`.
- cela ne relève pas d’un mauvais chemin filesystem, mais d’une architecture hybride qui doit être documentée pour la livraison.

Verdict Docker : `OK` sur les chemins internes, `WARNING` sur la dépendance à l’hôte Windows.

## Frontend

Constat :

- aucune référence active à un chemin Windows absolu `C:\` ou `D:\`.
- les ressources statiques utilisent des chemins web ou relatifs au dossier public :
  - `/data/hassan/...`
  - `public/data/hassan/...`

Point mineur :

- `hydro_Hassan dakhil/frontend/src/features/intervention-program/data/interventionProgram.data.ts` mélange `public/data/...` et `/data/...`.
- ce n’est pas un chemin machine, donc pas un blocage de portabilité système ; c’est surtout une hétérogénéité applicative.

Verdict Frontend : `OK`

## Backend

Constat :

- la plupart des résolutions sont relatives et correctes :
  - `path.resolve(__dirname, ...)`
  - `path.resolve(process.cwd(), ...)`
  - chargement `.env` via racine workspace + backend local
- les seuls chemins vraiment non portables trouvés dans le code backend actif concernent des scripts de bathymétrie et un SQL de seed historique.

Verdict Backend : `WARNING`

## Scripts

Scripts actifs corrects :

- `scripts/swat-import/import_swat_output.ps1`
- `scripts/swat-import/analyze_mdb.ps1`
- `scripts/quality/compare-functional-baseline.py`

Scripts non portables ou legacy :

- `hydro_Hassan dakhil/backend/scripts/import_bathy_had.ts`
- `scripts/swat-import/replace_observed_debit_station_1940_48.sql`
- scripts archivés sous `archive/`

Verdict Scripts : `WARNING`

## Portabilité

Question :

Si le projet est copié vers `E:\Applications\App_Hassan_Addakhil`, peut-il fonctionner après configuration du `.env` ?

Réponse :

`PARTIELLEMENT`

Raisons :

1. le frontend et le backend principal sont globalement portables ;
2. Docker utilise des volumes relatifs corrects ;
3. la restauration DB Docker est portable car `HYDRO_HD_DUMP_PATH` est relatif par défaut ;
4. mais `HASSAN_DATA_ROOT` n’est pas fiabilisé ni documenté comme variable obligatoire ;
5. les imports SWAT MDB complets dépendent encore de données externes Windows non montées dans Docker ;
6. quelques scripts/SQL annexes conservent des chemins `D:/3- Projets/hassanAddakhil/...` codés en dur.

Blocages principaux à corriger dans une phase ultérieure :

- déclarer/documenter `HASSAN_DATA_ROOT` ;
- rendre paramétrables les scripts bathymétrie / SQL legacy ;
- clarifier la stratégie de données SWAT externes hors repo ;
- documenter la dépendance `host.docker.internal` si la base officielle reste hors conteneur.

## Verdict final

- Aucune modification PostgreSQL
- Aucun changement métier
- Aucun commit
- Aucun push

Le projet ne présente pas de dépendance active générale à un ancien dossier Windows dans le frontend runtime.

Les risques réels sont concentrés sur :

- la donnée externe Hassan/SWAT (`HASSAN_DATA_ROOT`, `SWAT_DATA_ROOT`, `SWAT_MDB_PATH`) ;
- quelques scripts de maintenance/import non portables ;
- l’architecture Docker/backend qui dépend encore de la base hôte Windows via `host.docker.internal`.

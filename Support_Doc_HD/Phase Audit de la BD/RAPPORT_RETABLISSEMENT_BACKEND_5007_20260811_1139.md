# RAPPORT RETABLISSEMENT BACKEND 5007 - HASSAN ADDAKHIL

Date : 2026-08-11  
Heure : 11:39

## Cause

- Le backend Hassan attendu sur `127.0.0.1:5007` n'etait plus expose parce que le conteneur officiel `hydro-hassan-ilh0107-backend` etait arrete : `Exited (255)`.
- Les ports visibles appartenaient a d'autres services :
  - `5007` : aucun listener Hassan actif au debut de l'intervention.
  - `5008` : `hydro-chatbot-backend`.
  - `8000` : `plateformae-automatisation-vpn-et-donn-es-dgm-dev-backend-1`.
- La configuration officielle Hassan reste :
  - backend host : `5007`
  - base : `hydro_hd`
  - host DB : `host.docker.internal`
  - port DB : `5432`

## Methode de retablissement

- Verification de la configuration Docker et `.env` : le projet Hassan attend bien `5007 -> 5000` pour le backend.
- Verification du code de demarrage : `hydro_Hassan dakhil/backend/server.ts` appelait `stationSimulationService.initializeMappings()` au boot, ce qui peut provoquer des ecritures PostgreSQL.
- Correction minimale et reversible appliquee dans `hydro_Hassan dakhil/backend/server.ts` :
  - ajout de `ENABLE_STATION_MAPPING_INIT`
  - ajout de `ENABLE_STARTUP_WARMUPS`
  - comportement par defaut conserve
- Rebuild Docker du backend Hassan uniquement.
- Relance controlee du backend Hassan uniquement via Docker, sans dependance DB Docker :

```powershell
docker compose run -d --build --no-deps --service-ports `
  -e ENABLE_STATION_MAPPING_INIT=false `
  -e ENABLE_STARTUP_WARMUPS=false `
  backend
```

- Conteneur actif final :
  - `app_hassan_addakhil-backend-run-27bd0399e7ce`
  - mapping : `0.0.0.0:5007 -> 5000/tcp`

## Validation backend

Backend 5007 : `OK`  
Methode de lancement : `Docker`

Health :

- `GET http://127.0.0.1:5007/api/v1/hydro/health` -> `HTTP 200`

API controlees :

- `/api/v1/catalog/runs` -> `HTTP 200`
- `/api/v1/catalog/availability?module=hydro` -> `HTTP 200`
- `/api/v1/catalog/availability?module=climat` -> `HTTP 200`
- `/api/v1/hydro/swat/summary` -> `HTTP 200`
- `/api/v1/spatial/reaches` -> `HTTP 200`
- `/api/v1/spatial/subbasins` -> `HTTP 200`
- `/api/v1/data-scan/summary` -> `HTTP 200`

Catalog runs :

- `9` scenarios visibles
- liste :
  - `OBSERVED`
  - `etat_actuel`
  - `ssp126`
  - `ssp245`
  - `ssp585`
  - `scenario_1`
  - `scenario_2`
  - `scenario_3`
  - `scenario_4`

## Base utilisee

Base utilisee : `hydro_hd`

Preuves :

- variables Docker du backend actif :
  - `DB_HOST=host.docker.internal`
  - `DB_PORT=5432`
  - `DB_NAME=hydro_hd`
  - `HDI_DB_NAME=hydro_hd`
- `GET /api/v1/data-scan/summary` retourne `database_name = hydro_hd`

## Controle non-ecriture PostgreSQL

PostgreSQL modifie : `NON`

Preuve :

- `core.station_subbasin_map` avant et apres lancement :
  - `count = 5`
  - `max(updated_at) = 2026-08-11 03:37:08.002359-07`
- Le backend actif a ete lance avec :
  - `ENABLE_STATION_MAPPING_INIT=false`
  - `ENABLE_STARTUP_WARMUPS=false`

## Baseline

Mesures verifiees apres retablissement :

- `383` timeseries
- `3 773 400` measurements
- `75` stations visibles
- `9` scenarios
- `19` reaches
- `19` subbasins

Statut baseline : `WARNING`

Justification :

- Le snapshot courant `BASELINE_DEBUG_5007_20260811_1133.json` confirme les bons compteurs metier et `HTTP 200` sur toutes les probes backend.
- La comparaison avec `Support_Doc_HD/Phase Protection Donnees Fonctionnelles/VALIDATION_LOT1_BASELINE_SNAPSHOT_20260811.json` renvoie un faux `REGRESSION` car ce fichier de reference avait deja ete capture avec :
  - probes backend `5007` en `status = null`
  - `frontend_root` sur `http://127.0.0.1:8081`
- Il s'agit donc d'une incoherence du fichier de reference, pas d'une regression du backend retabli.

Fichiers produits pendant la verification :

- `Support_Doc_HD/Phase Nettoyage et Stabilisation/BASELINE_DEBUG_5007_20260811_1133.json`
- `Support_Doc_HD/Phase Nettoyage et Stabilisation/BASELINE_RESTORE_BACKEND_5007_20260811_1133.json`
- `Support_Doc_HD/Phase Nettoyage et Stabilisation/BASELINE_RESTORE_BACKEND_5007_20260811_1133.md`

## Etat des ports

| Port | Service / conteneur | Projet | Role |
| --- | --- | --- | --- |
| 5007 | `app_hassan_addakhil-backend-run-27bd0399e7ce` | Hassan Addakhil | backend actif retabli |
| 5008 | `hydro-chatbot-backend` | Hydro Chatbot | autre projet |
| 8000 | `plateformae-automatisation-vpn-et-donn-es-dgm-dev-backend-1` | Plateforme automatisation | autre projet |

## Note frontend

- Une tentative de relance du frontend Hassan a ete faite uniquement pour completer la baseline globale.
- Le conteneur `hydro-hassan-ilh0107-frontend` sort avec :
  - `host not found in upstream "backend" in /etc/nginx/conf.d/default.conf:35`
- Aucune correction frontend n'a ete poursuivie ici, car l'objectif de cette intervention etait uniquement le backend `5007`.

## Resultat final

Cause :

- backend Hassan officiel arrete ; `5007` non expose ; `5008` et `8000` occupes par d'autres projets.

Backend 5007 :

- `OK`

Health :

- `OK`

Base utilisee :

- `hydro_hd`

Scenarios visibles :

- `9`

Baseline :

- `WARNING` a cause d'une reference de comparaison incoherente
- compteurs metier attendus confirmes

PostgreSQL modifie :

- `NON`

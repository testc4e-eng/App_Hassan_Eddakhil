# Hassan Addakhil Hydro-Data Intelligence

Base de travail du projet Hassan Addakhil pour le suivi climat, hydrologique, sediments, cartographie spatiale, reporting et gestion des donnees.

## Vue d'ensemble

Le depot est organise autour de trois briques principales :

- `hydro_Hassan dakhil/frontend` : application React/Vite qui expose les dashboards.
- `hydro_Hassan dakhil/backend` : API Express/TypeScript qui sert les catalogues, les series temporelles, les modules spatiaux et les exports.
- `docker-compose.yml` : environnement local standard avec PostgreSQL/PostGIS, backend et frontend.

## Modules fonctionnels actuellement exposes

Depuis `hydro_Hassan dakhil/frontend/src/pages/Dashboard.tsx`, le dashboard principal active les sections suivantes :

- `spatial` : Analyse Spatiale
- `climate` : Suivi Climat
- `hydraulic` : Suivi Hydrologique
- `sediment` : module Sediments avec 3 sous-vues
- `simulatedData` : Gestion de donnee / ingestion
- `dataScan` : Scan de donnees
- `reports` : Rapport & Export
- `maps` : module cartographique secondaire

Le module Sediments, monte depuis `hydro_Hassan dakhil/frontend/src/components/dashboard/modules/sediments/SedimentsDashboard.tsx`, contient aujourd'hui :

- Evaluation d'envasement
- Degradation specifique
- Transport solide Reach

## Architecture runtime locale

Le fichier `docker-compose.yml` expose la pile locale suivante :

- `db` : `postgis/postgis:17-3.5`, port local par defaut `5435`
- `backend` : API Express, port local par defaut `5006`
- `frontend` : application web servie par Nginx, port local par defaut `8089`

Le backend est initialise depuis `hydro_Hassan dakhil/backend/server.ts` et branche les routes dans `hydro_Hassan dakhil/backend/src/app.ts`.

## Domaines API exposes

Les familles d'API actuellement montees sont :

- `/api/v1/catalog`
- `/api/v1/timeseries`
- `/api/v1/spatial`
- `/api/v1/hydro`
- `/api/v1/solid-yield`
- `/api/v1/siltation`
- `/api/v1/data-scan`
- `/api/v1/scan`
- `/api/v1/maps`
- `/api/v1/stations/*/simulations`
- `/api/auth`
- `/api/admin`

## Donnees et scripts

Le depot contient aussi :

- `scripts/swat-import` : scripts de synchronisation/import SWAT et etat actuel
- `hydro_Hassan dakhil/backend/sql` : SQL de schema, verification et indexation
- `hydro_Hassan dakhil/backend/scripts` : scripts TypeScript d'audit/import metier
- `Scenarios`, `Donnee-etat actuel`, fichiers Excel et actifs de travail : sources metier et intrants locaux

## Documentation

La documentation projet a ete remise a plat autour des fichiers suivants :

- [docs/README.md](docs/README.md) : index documentaire
- [docs/PROJECT_BASELINE_2026-06-29.md](docs/PROJECT_BASELINE_2026-06-29.md) : baseline fonctionnelle et technique du projet au 29 juin 2026
- [docs/DASHBOARDS_DATA_MAPPING.md](docs/DASHBOARDS_DATA_MAPPING.md) : cartographie detaillee dashboard -> frontend -> API -> backend -> SQL

## Lancement local

### Docker

```powershell
docker compose up -d --build
```

Acces par defaut :

- Frontend : `http://localhost:8089`
- Backend : `http://localhost:5006`
- PostgreSQL : `localhost:5435`

### Frontend seul

```powershell
cd "D:\3- Projets\hassanAddakhil\hydro_Hassan dakhil\frontend"
npm install
npm run dev
```

### Backend seul

```powershell
cd "D:\3- Projets\hassanAddakhil\hydro_Hassan dakhil\backend"
npm install
npm run dev
```

## Regle de maintenance documentaire

Apres toute modification importante du fonctionnel, des flux de donnees ou des dashboards :

- mettre a jour la baseline projet si l'architecture ou les modules actifs changent ;
- mettre a jour `docs/DASHBOARDS_DATA_MAPPING.md` si les composants, endpoints, services ou objets SQL changent ;
- conserver les rapports ponctuels dans `docs/` comme historique, sans les utiliser comme reference principale.

# Project Baseline - 2026-06-29

Document de reference etabli le 29 juin 2026 a partir de l'etat courant du depot `D:\3- Projets\hassanAddakhil`.

## 1. Objectif de cette baseline

Cette baseline sert a reposer une base documentaire unique apres plusieurs phases de changements sur :

- les dashboards ;
- les modules sediments et spatiaux ;
- les imports et scripts metier ;
- les routes backend et les APIs frontend ;
- les rapports techniques deja produits dans `docs/`.

Elle ne remplace pas les rapports historiques. Elle fixe simplement la lecture de l'etat actuel du projet.

## 2. Perimetre actuellement present dans le code

### Frontend actif

Le point d'entree applicatif est `hydro_Hassan dakhil/frontend/src/App.tsx`.

Les routes utilisateur actuellement exposees sont :

- `/`
- `/home`
- `/login`
- `/dashboard`
- `/dashboard/data/ingestion-sentinel`
- `/dashboard/data/ingestion-observee`
- `/dashboard/data/ingestion-swat`
- `/contact`
- `/admin`
- `/admin/users`
- `/change-password`

Le dashboard principal est monte depuis `hydro_Hassan dakhil/frontend/src/pages/Dashboard.tsx`.

### Modules actuellement montes dans le dashboard

Depuis `MODULE_COMPONENTS` dans `Dashboard.tsx`, les sections actives sont :

| Section URL | Module frontend actif | Role |
| --- | --- | --- |
| `spatial` | `SpatialModule` | analyse spatiale et inspection cartographique |
| `climate` | `ClimateModule` | suivi climat |
| `hydraulic` | `HydraulicModule` | suivi hydrologique |
| `sediment` | `SedimentsDashboard` | envasement, degradation specifique, transport reach |
| `simulatedData` | `DataManagementModule` | gestion de donnee / ingestion |
| `dataScan` | `ScanDeDonneesPage` | scan de donnees |
| `reports` | `ReportsModule` | rapport et export |
| `maps` | `MapsModule` | cartographie secondaire |

### Module Sediments actuellement monte

Le composant `hydro_Hassan dakhil/frontend/src/components/dashboard/modules/sediments/SedimentsDashboard.tsx` expose 3 sous-vues :

- `envasement`
- `specific`
- `reach`

Sous-composants actifs :

- `EnvasementDashboard`
- `SpecificDegradationDashboard`
- `ReachSedimentDashboard`

## 3. Architecture technique actuelle

### Pile locale Docker

Le fichier `docker-compose.yml` definit :

| Service | Image / build | Port local par defaut | Role |
| --- | --- | --- | --- |
| `db` | `postgis/postgis:17-3.5` | `5435` | stockage PostgreSQL/PostGIS |
| `backend` | build `hydro_Hassan dakhil/backend` | `5006` | API Express/TypeScript |
| `frontend` | build `hydro_Hassan dakhil/frontend` | `8089` | interface web servie par Nginx |

### Backend

Le serveur est lance depuis `hydro_Hassan dakhil/backend/server.ts`.

Le montage principal des middlewares et routes est dans `hydro_Hassan dakhil/backend/src/app.ts`.

Familles de routes actuellement montees :

- `hydroRoutes`
- `timeseriesRoutes`
- `catalogRoutes`
- `catalogAvailabilityRouter`
- `spatialRoutes`
- `mapsRoutes`
- `swatRoutes`
- `stationSimulationRoutes`
- `solidYieldRoutes`
- `siltationRoutes`
- `dataScanRoutes`
- `authRoutes`
- `adminRoutes`

Services backend visibles dans `backend/src/services` :

- `catalog.service.ts`
- `timeseries.service.ts`
- `spatial.service.ts`
- `hydro.service.ts`
- `hydroSwatSeries.service.ts`
- `erosionSwatSeries.service.ts`
- `solidYield.service.ts`
- `siltation.service.ts`
- `stationSimulation.service.ts`
- `swatIngestion.service.ts`
- `dataScan.service.ts`
- `maps.service.ts`
- `auth.service.ts`
- `users.service.ts`
- services auxiliaires (`database.service.ts`, `adaptive.service.ts`, `advancedSpatial.service.ts`)

### Frontend

Le frontend est un projet React/Vite/TypeScript avec :

- React 18
- React Router
- TanStack Query
- Recharts
- Leaflet / React Leaflet
- shadcn/ui + Tailwind
- i18next

Le fichier `hydro_Hassan dakhil/frontend/package.json` reste la reference des dependances et scripts.

## 4. Domaines de donnees actuellement couverts

## Climat

- module frontend : `ClimateModule`
- APIs principales : `catalog`, `timeseries`, `spatial/stations`
- usage : series par station, variables climatiques, comparaison de scenarios

## Hydrologie

- module frontend : `HydraulicModule`
- APIs principales : `catalog`, `timeseries`, `hydro`, `spatial/stations`
- usage : debit observe/simule, statistiques et comparaison de scenarios

## Sediments

- modules frontend : `SedimentsDashboard`, `SolidYieldModuleV2`, `RecapitulatifEnvasement`, `ReachSedimentDashboard`
- APIs principales : `solid-yield`, `siltation`, `spatial/reaches`, `spatial/subbasins`
- usage :
  - degradation specifique par sous-bassin
  - envasement barrage
  - transport solide par reach

## Spatial

- module frontend : `SpatialModule`
- APIs principales : `spatial/*`
- usage :
  - carte projet Hassan Addakhil
  - sous-bassins, reaches, stations, barrages, bassin
  - inspection de series temporelles associees aux objets spatiaux

## Reporting et scan

- `ReportsModule` : exports et consolidation
- `ScanDeDonneesPage` / `dataScanRoutes` : diagnostic de disponibilite et periodes

## 5. Objets de schema et scripts presents dans le depot

### SQL visibles dans `backend/sql`

Le dossier `hydro_Hassan dakhil/backend/sql` contient notamment :

- `940_station_reach_map.sql`
- `941_station_reach_map_quality.sql`
- `950_users_auth.sql`
- `960_spatial_timeseries_indexes.sql`
- `create_siltation_schema.sql`
- `cleanup_official_siltation_campaigns.sql`
- `create_bathymetry_campaigns_schema.sql`
- `seed_bathymetry_campaigns_had.sql`
- `verify_bathymetry_campaigns.sql`
- `verify_siltation_campaigns.sql`

### Scripts backend metier

Le dossier `backend/scripts` contient au moins :

- audit/import envasement Hassan Addakhil
- audit/import bathymetrie HAD
- scripts de correction SQL metier

### Scripts de migration / synchronisation

Le dossier `scripts/` contient :

- `swat-import`
- `MIGRATION_SWAT_TO_HYDRO_HD`
- `MIGRATION_ABHGZR_TO_HYDRO_HD`
- `access-import`

Ces repertoires doivent etre consideres comme la zone de travail ETL/migration du projet.

## 6. Etat documentaire apres remise a plat

La documentation est maintenant structuree en 3 niveaux :

### Niveau 1 - Orientation

- [../README.md](../README.md)
- [README.md](README.md)

### Niveau 2 - Reference projet

- [PROJECT_BASELINE_2026-06-29.md](PROJECT_BASELINE_2026-06-29.md)

### Niveau 3 - Cartographie technique detaillee

- [DASHBOARDS_DATA_MAPPING.md](DASHBOARDS_DATA_MAPPING.md)

### Rapports historiques conserves

Les rapports dates dans `docs/` restent disponibles comme historique d'audit/correction mais ne doivent plus servir seuls comme base de lecture de l'etat courant.

## 7. Ce qui est considere comme source de verite

Pour la suite du projet :

- le code actif monte dans `App.tsx`, `Dashboard.tsx` et `backend/src/app.ts` est la source de verite runtime ;
- `PROJECT_BASELINE_2026-06-29.md` est la source de verite documentaire de haut niveau ;
- `DASHBOARDS_DATA_MAPPING.md` est la source de verite documentaire detaillee pour les dashboards et les flux de donnees ;
- les rapports ponctuels restent des traces historiques.

## 8. Points d'attention

- Le depot contient un tres grand nombre de fichiers modifies et non suivis : cette baseline documente l'etat observe, pas un release tag propre.
- Plusieurs modules existent en plusieurs generations (`V2`, `V3`, anciens composants, archives). Seuls les composants effectivement montes par les routes et le dashboard principal doivent etre consideres comme actifs.
- Le `frontend/README.md` d'origine etait un boilerplate Lovable ; il ne suffisait plus pour decrire l'application reelle.

## 9. Regle de mise a jour recommandee

Lors d'un prochain changement important :

1. mettre a jour la baseline si le perimetre actif change ;
2. mettre a jour `DASHBOARDS_DATA_MAPPING.md` si les flux dashboard/API/SQL changent ;
3. produire un rapport ponctuel seulement si une correction ou un audit merite une trace separee.

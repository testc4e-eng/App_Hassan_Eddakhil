# Vision globale du projet Hydro-Data Intelligence

## 1. Objectif du site
Hydro-Data Intelligence est un portail web d’analyse hydrologique centré sur le barrage Hassan Addakhil.

Le site sert a:
- centraliser les donnees hydro, climat, erosion, spatial et reports
- consulter les series temporelles et leurs statistiques
- verifier la qualite et la disponibilite des donnees dans la base
- naviguer dans les objets geographiques liees au bassin, aux sous-bassins, aux stations et aux retenues
- exposer un dashboard metier pour l’exploitation et la lecture rapide des donnees

## 2. Architecture generale
Le projet est compose de trois grandes couches:

### Frontend
Application React/Vite situee dans `frontend/`.

Roles principaux:
- afficher les modules metiers
- appeler l’API backend
- presenter les donnees en tableaux, cartes, cartes de synthese et graphiques
- gerer la navigation utilisateur

### Backend
API Node.js/Express situee dans `backend/`.

Roles principaux:
- recevoir les requetes du frontend
- interroger PostgreSQL
- normaliser les reponses JSON
- executer les controles de qualite et les vues de synthese

### Base de donnees
PostgreSQL est la source de verite du projet.

Elle contient:
- les tables metier
- les vues de catalogue
- les couches spatiales
- les donnees de mesure
- les tables d’import et de normalisation
- les objets utilises par le scan de donnees

## 3. Configuration de connexion base de donnees
Le backend lit sa configuration dans `backend/.env`.

Variables utilisees:
- `DB_HOST`
- `DB_PORT`
- `DB_NAME`
- `DB_USER`
- `DB_PASSWORD`
- `DB_SSL`

Exemple:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=hydro_hd_1714
DB_USER=postgres
DB_PASSWORD=<mot_de_passe>
DB_SSL=false
```

Important:
- le mot de passe ne doit pas etre diffuse dans la documentation
- la doc doit decrire la presence du secret, pas sa valeur

## 4. Stack technique
### Frontend
- React 18
- TypeScript
- Vite
- Tailwind CSS
- shadcn-ui
- React Router
- TanStack Query
- i18next

### Backend
- Node.js
- Express
- TypeScript
- PostgreSQL via `pg`
- `helmet`
- `cors`
- `compression`
- `express-rate-limit`
- `zod`

## 5. Composants principaux du frontend
### Pages visibles
- `/` -> page d’accueil
- `/dashboard` -> cockpit principal
- `/contact` -> contact
- page 404 -> fallback

### Modules du dashboard
Le dashboard regroupe les parties suivantes:
- climat
- hydraulique
- erosion et sediments
- spatial
- cartes
- donnees simulees
- scan de donnees
- reports

### Composants importants
- `Navbar` pour la navigation principale
- `DashboardSidebarV2` pour la navigation par module
- `HydroDataContext` pour le chargement des catalogues de base
- `ScanDeDonneesPage` pour l’audit de la base

## 6. Ce que le frontend consomme

### 6.1 Chargement du catalogue principal
Le contexte `HydroDataContext` charge au demarrage:
- les runs via `/api/v1/catalog/runs`
- les stations via `/api/v1/spatial/stations`
- les proprietes par module via `/api/v1/catalog/modules/:moduleCode/properties`
- la disponibilite par module via `/api/v1/catalog/availability`

Ces donnees alimentent:
- les listes de stations du dashboard
- les choix de runs/scenarios
- les filtres de variables
- les apercus de disponibilite

### 6.2 Dashboard metier
Le dashboard principal affiche:
- l’etat de chargement du catalogue
- le nombre de runs
- le nombre de variables chargees
- le nombre de stations dans le catalogue
- le cache de disponibilite

Il orchestre ensuite les modules:
- `climat`
- `hydraulic`
- `sediment`
- `spatial`
- `maps`
- `simulatedData`
- `dataScan`
- `reports`

### 6.3 Scan de donnees
La page `ScanDeDonneesPage` consomme les endpoints:
- `/api/v1/data-scan/summary`
- `/api/v1/data-scan/tables`
- `/api/v1/data-scan/tables/:schema/:table`
- `/api/v1/data-scan/anomalies`
- `/api/v1/data-scan/relations`
- `/api/v1/data-scan/periods/global`
- `/api/v1/data-scan/periods/by-variable`
- `/api/v1/data-scan/periods/by-entity`
- `/api/v1/data-scan/periods/by-entity-variable-source`
- `/api/v1/data-scan/data-availability`

Le scan sert a:
- inventorier les tables et vues
- mesurer les periodes reelles
- detecter les anomalies
- montrer les relations entre objets
- exporter un resume JSON ou CSV

### 6.4 Cartes et spatial
Le module spatial consomme:
- `/api/v1/spatial/basins`
- `/api/v1/spatial/barrages`
- `/api/v1/spatial/subbasins`
- `/api/v1/spatial/reaches`
- `/api/v1/spatial/stations`

Le module cartes consomme:
- `/api/v1/maps/stations-values`

### 6.5 Series temporelles
Les donnees de series sont lues via:
- `/api/v1/timeseries/catalog`
- `/api/v1/timeseries/bundle`
- `/api/v1/timeseries/:tsId/aggregate`

Ces endpoints servent a:
- selectionner les series disponibles par station, run et module
- afficher des agregations jour/mois/an
- produire des graphiques de suivi

### 6.6 Acces aux donnees
Le module access consomme:
- `/api/v1/access/summary`
- `/api/v1/access/variables`
- `/api/v1/access/import-runs`
- `/api/v1/access/entities`
- `/api/v1/access/timeseries`
- `/api/v1/access/stats`

Il sert a visualiser la provenance des donnees et leur structure d’acces.

### 6.7 Donnees SWAT et erosion
Le backend expose aussi:
- `/api/v1/hydro/swat/*`
- `/api/v1/solid-yield/*`

Ces routes sont liees a l’import, l’etat, la disponibilite et les statistiques des donnees simulees ou derivees.

## 7. Ce que le backend expose

### 7.1 Hydrologie
Routes principales:
- `/api/v1/hydro/health`
- `/api/v1/hydro/stats`
- `/api/v1/hydro/stations`
- `/api/v1/hydro/stations/:id`
- `/api/v1/hydro/catchments`
- `/api/v1/hydro/catchments/:id`
- `/api/v1/hydro/timeseries`
- `/api/v1/hydro/timeseries/catalog`
- `/api/v1/hydro/timeseries/:tsId/measurements`
- `/api/v1/hydro/timeseries/:tsId/measurements/aggregated`
- `/api/v1/hydro/landcover`
- `/api/v1/hydro/catchments/:catchmentId/landcover-summary`
- `/api/v1/hydro/reservoirs`
- `/api/v1/hydro/model-runs`
- `/api/v1/hydro/spatial/features`

### 7.2 Timeseries
- `/api/v1/timeseries/health`
- `/api/v1/timeseries/catalog`
- `/api/v1/timeseries/bundle`
- `/api/v1/timeseries/:tsId/aggregate`

### 7.3 Catalogue
- `/api/v1/catalog/modules`
- `/api/v1/catalog/modules/:moduleCode/properties`
- `/api/v1/catalog/runs`
- `/api/v1/catalog/modules/:moduleCode/stations`
- `/api/v1/catalog/availability`

### 7.4 Spatial
- `/api/v1/spatial/barrages`
- `/api/v1/spatial/basins`
- `/api/v1/spatial/subbasins`
- `/api/v1/spatial/reaches`
- `/api/v1/spatial/stations`

### 7.5 Data scan
- `/api/v1/data-scan/summary`
- `/api/v1/data-scan/tables`
- `/api/v1/data-scan/tables/:schema/:table`
- `/api/v1/data-scan/anomalies`
- `/api/v1/data-scan/relations`
- `/api/v1/data-scan/periods/global`
- `/api/v1/data-scan/periods/by-variable`
- `/api/v1/data-scan/periods/by-entity`
- `/api/v1/data-scan/periods/by-entity-variable-source`
- `/api/v1/data-scan/data-availability`

### 7.6 Access
- `/api/v1/access/health`
- `/api/v1/access/summary`
- `/api/v1/access/tables`
- `/api/v1/access/variables`
- `/api/v1/access/import-runs`
- `/api/v1/access/entities`
- `/api/v1/access/timeseries`
- `/api/v1/access/stats`

### 7.7 Maps
- `/api/v1/maps/stations-values`

### 7.8 SWAT et solid yield
- `/api/v1/hydro/swat/import`
- `/api/v1/hydro/swat/summary`
- `/api/v1/hydro/swat/batches`
- `/api/v1/hydro/swat/availability`
- `/api/v1/hydro/swat/data`
- `/api/v1/hydro/swat/delete-by-filter`
- `/api/v1/hydro/swat/subbasins`
- `/api/v1/hydro/swat/reaches`
- `/api/v1/hydro/swat/variables`
- `/api/v1/hydro/swat/timeseries`
- `/api/v1/hydro/swat/stats`
- `/api/v1/solid-yield/subbasins`
- `/api/v1/solid-yield/availability`
- `/api/v1/solid-yield/timeseries`
- `/api/v1/solid-yield/stats`

## 8. Vue globale des donnees de la base

### 8.1 Schemas identifies
D’apres le code, la base utilise au minimum les schemas suivants:
- `public`
- `core`
- `ref`
- `gis`
- `staging`
- `api`

Le scan de donnees recense aussi tous les objets utilisateur hors schemas systeme.

### 8.2 Objets metier principaux
#### Stations
Represente les stations de mesure et stations metier.

Tables/vues utilisees:
- `public.stations`
- `core.stations`
- `gis.meteo_stations`

Champs metier importants:
- identifiant
- code station
- nom
- type
- bassin de rattachement
- geometrie

#### Bassins / catchments
Represente les bassins versants ou entites equivalentes.

Tables/vues utilisees:
- `public.catchments`
- `core.catchments`

Champs metier importants:
- identifiant bassin
- nom
- nom du barrage associe
- surface
- geometrie

#### Retenues / reservoirs
Tables utilisees:
- `public.reservoirs`
- `core.reservoirs`

Champs importants:
- identifiant
- nom
- code si present
- geometrie
- bassin associe

#### Series temporelles
Tables principales:
- `public.timeseries`
- `public.measurements`

Relations fonctionnelles:
- une serie appartient a une station
- une serie reference une propriete/variable
- une serie reference un run/scenario
- une serie contient plusieurs mesures

#### Runs / scenarios
Table utilisee:
- `public.model_runs`

Champs importants:
- `run_id`
- `scenario_code`
- `scenario_name`
- `description`
- `is_observed`
- `created_at`

#### Proprietes / variables
Tables utilisees:
- `ref.observed_properties`
- `public.module_properties`
- vues de catalogue comme `public.v_ts_catalog_enriched`

Role:
- definir les variables disponibles
- rattacher les variables aux modules
- organiser l’ordre d’affichage

#### Spatial
Tables/couches utilisees:
- `gis.subbasin_shapes`
- `gis.reach_shapes`
- `gis.meteo_stations`
- `core.station_reach_map`

Role:
- geometries des sous-bassins
- geometries des reaches
- liaisons stations/reaches
- filtrage spatial

#### Landcover
Table utilisee:
- `public.landcover`

Role:
- couverture du sol
- analyse par periode et par bassin

#### Donnees normalisees et imports
Tables mentionnees par le scan:
- `staging.norm_measurements`
- `staging.migration_batches`

Role:
- conserver les flux d’import
- garder une trace des lots importes
- alimenter les vues de disponibilite et de provenance

### 8.3 Vues de catalogue et d’aide
Vues et objets utilises par le backend:
- `public.v_ts_catalog_enriched`
- `api.v_catalog_properties`
- `api.v_catalog_series_modules`
- `api.v_timeseries_with_stats_ui`
- `api.v_catalog_module_properties`

Role:
- exposer des catalogues pre-calcules
- simplifier les filtres du frontend
- fournir les min/max, nombre de points et dates de serie

## 9. Flux de donnees par grand usage

### 9.1 Consultation du dashboard
1. Le frontend charge le contexte `HydroDataContext`.
2. Il recupere les runs, stations, proprietes et disponibilites.
3. Le dashboard construit les listes de modules et les compteurs.
4. Les modules internes consomment ensuite les routes specialisees.

### 9.2 Consultation des series temporelles
1. L’utilisateur choisit un module, une station et un run.
2. Le frontend appelle le catalogue de series.
3. Le backend filtre selon le module et le run.
4. Les mesures ou agregations sont ensuite recuperees pour affichage.

### 9.3 Audit des donnees
1. L’utilisateur ouvre le scan de donnees.
2. Le frontend interroge le backend pour le resume, les tables, les anomalies et les periodes.
3. Le backend lit les metadonnees PostgreSQL et calcule les indicateurs.
4. Le frontend permet l’exploration detaillee et l’export.

### 9.4 Spatial et cartographie
1. Le frontend interroge les couches geographiques.
2. Le backend lit les geometries depuis PostGIS.
3. Les objets sont rendus en GeoJSON ou en FeatureCollection.
4. Les cartes peuvent superposer bassins, sous-bassins, reaches, stations et retenues.

## 10. Lecture fonctionnelle des modules

### Climat
Module de lecture des donnees climatologiques et variables associees.

### Hydraulique
Module de suivi des debits, niveaux ou grandeurs hydrauliques.

### Erosion / sediments
Module d’analyse des sediments, pertes solides, effets SWAT et variables d’erosion.

### Spatial
Module de lecture cartographique des entites geographiques.

### Maps
Module de cartographie et de valeurs stationnelles sur la carte.

### Simulated data
Module oriente vers les series simulees et les runs associes.

### Data scan
Module d’audit technique et metier de la base.

### Reports
Module de restitution, synthese et export.

## 11. Points techniques a connaitre
- Le backend utilise CORS restreint par liste d’origines.
- Un rate limiting est actif sur `/api`.
- Les reponses suivent le format JSON `{ success, data, error }` sur la plupart des routes metier.
- Le frontend peut fonctionner via proxy Vite ou via `VITE_API_BASE`.
- Certaines fonctions du code sont encore des placeholders ou des mocks temporaires.

## 12. Parties partiellement implementees ou a verifier
D’apres le code actuel, plusieurs zones doivent etre surveillees:
- `getDashboardStats()` renvoie encore des valeurs neutres dans certains services.
- certaines fonctions mappee sur les donnees stations utilisent encore des valeurs mockees
- `getLandcoverSummary()` est encore vide dans une partie du service
- certaines routes SWAT/solid yield peuvent evoluer selon le schema reel

## 13. Ce qu’il faut retenir
La structure du projet est la suivante:
- le frontend est le cockpit
- le backend est la couche d’acces aux donnees et de calcul
- PostgreSQL/PostGIS est le coeur de la donnee
- les catalogues et vues servent a relier station, run, variable, module et periode
- le scan de donnees permet de verifier la sante globale de la base

## 14. Recommandation pour la suite
Pour aller encore plus loin, il serait utile de produire 3 documents complementaires:
- un dictionnaire des tables et vues
- un schema relationnel simplifie
- un guide d’utilisation fonctionnel par module


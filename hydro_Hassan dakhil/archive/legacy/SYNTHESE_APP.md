# Synthèse de l’application Hydro-Data Intelligence

## 1) Objectif de l’application
Hydro-Data Intelligence est une application web de pilotage et d’analyse hydrologique autour du barrage Hassan Addakhil.  
Elle centralise plusieurs modules métiers (climat, hydrologie, érosion, spatial, scan de données, reporting) dans une interface dashboard unique.

## 2) Stack technique

### Frontend
- React 18 + TypeScript
- Vite
- Tailwind CSS
- shadcn/ui (composants UI basés sur Radix)
- React Router
- TanStack Query
- i18next (FR/EN)

### Backend
- Node.js + Express + TypeScript
- PostgreSQL via `pg`
- Middlewares sécurité/perf: `helmet`, `cors`, `compression`, `express-rate-limit`
- Validation: `zod`

## 3) Architecture générale

### Structure principale
- `frontend/` : application web React
- `backend/` : API REST Express
- `app web/` : scripts/outils annexes
- fichiers SQL à la racine : objets DB, vues API, mapping

### Flux de fonctionnement
1. L’utilisateur ouvre le dashboard (frontend).
2. Le frontend appelle les endpoints backend (`/api/v1/...`).
3. Le backend interroge PostgreSQL.
4. Les résultats sont formatés en JSON et affichés dans les modules.

## 4) Modules fonctionnels (Dashboard)
Les sections visibles dans la sidebar:
- Suivi Climat (`climate`)
- Suivi Hydrologique (`hydraulic`)
- Suivi Érosion / Sédiments (`sediment`)
- Analyse Spatiale (`spatial`)
- Gestion de données simulées (`simulatedData`)
- Scan de données (`dataScan`)
- Rapports & Export (`reports`)

## 5) Focus module “Scan de données”
Le module **Scan de données** permet de contrôler la qualité et la disponibilité des données:
- Résumé global (KPI base de données)
- Liste des tables + filtres
- Anomalies détectées
- Relations entre tables
- Périodes globales, par variable, par entité
- Détail table/échantillons
- Export CSV / JSON

### Filtre Entités (ajout récent)
Dans l’onglet **Entités**, un filtre UI permet:
- `Toutes les entités`
- `Avec données` (`points > 0`)
- `Sans données` (`points === 0`)

Ce filtre est **affiché uniquement dans l’onglet Entités**.

## 6) Endpoints API principaux
Base API: `/api/v1`

- `/hydro`
- `/timeseries`
- `/catalog`
- `/catalog/availability`
- `/spatial`
- `/maps`
- `/access`
- `/hydro/swat`
- `/solid-yield`
- `/data-scan` (et alias `/scan`)

Exemples scan:
- `GET /api/v1/data-scan/summary`
- `GET /api/v1/data-scan/tables`
- `GET /api/v1/data-scan/periods/by-entity`
- `GET /api/v1/data-scan/data-availability`

## 7) Démarrage local

### Backend
```bash
cd "hydro_Hassan dakhil/backend"
npm install
npm run dev
```
Port par défaut: `5000` (voir `PORT` dans `.env`).

### Frontend
```bash
cd "hydro_Hassan dakhil/frontend"
npm install
npm run dev
```
Le frontend utilise `VITE_API_BASE` (par défaut `/api/v1` pour certains services).

## 8) Configuration importante
- `backend/.env`
  - `PORT`
  - `CORS_ORIGIN`
  - variables de connexion PostgreSQL
- `frontend/.env`
  - `VITE_API_BASE` (ex: `http://localhost:5000/api/v1`)

## 9) Organisation du code (repères utiles)
- Frontend pages: `frontend/src/pages`
- Modules dashboard: `frontend/src/components/dashboard/modules`
- Services API frontend: `frontend/src/services` et `frontend/src/api`
- Backend routes: `backend/src/routes`
- Backend services: `backend/src/services`
- Types partagés frontend: `frontend/src/types`

## 10) Résumé opérationnel
L’application fonctionne comme un cockpit data hydro:
- visualisation multi-modules
- interrogation temps réel des données API
- contrôle qualité de la base via le scan
- export des résultats pour exploitation externe


# Matrice de validation fonctionnelle R4

Date : 2026-08-28  
Projet Docker R4 : `hassan-ziz-r4-validation-20260828`  
Stack de validation : images `1.0.0` + `docker-compose.ziz.yml` + dump officiel assaini

| Module | Fonction | Test | Résultat | Gravité anomalie |
| --- | --- | --- | --- | --- |
| Auth | Login valide | `POST /api/auth/login` avec compte R4 temporaire | OK | Aucune |
| Auth | Login invalide | `POST /api/auth/login` avec mot de passe erroné | OK, erreur contrôlée `401` | Aucune |
| Auth | Route protégée sans token | `GET /api/auth/me` et `GET /api/admin/users` sans token | OK, accès refusé `401` | Aucune |
| Dashboard | KPI et catalogue | `GET /api/v1/hydro/stats`, `/api/v1/catalog/modules`, `/api/v1/catalog/runs`, `/api/v1/catalog/availability?module=hydro` | OK | Aucune |
| Climat | Stations et séries | `GET /api/v1/spatial/stations`, `/stations/1/climate?variable=precipitation&aggregation=year` | OK, données annuelles non vides | Aucune |
| Hydrologie | Stations et séries | `GET /api/v1/hydro/stations?limit=5`, `/stations/2/simulations?scenarioCode=etat_actuel&view=paired` | OK, comparaison observé/simulé exploitable | Aucune |
| Sédiments | Consultation module | `GET /api/v1/solid-yield/subbasins`, `/availability`, `/timeseries`, `/stats` | OK | Aucune |
| Transport solide Reach | Série, stats et graphe | `GET /api/v1/spatial/reaches/1/timeseries?scenarioCode=etat_actuel&interval=year` + contrôle code UI | OK, max réel `33.067`, logique d’axe Y cohérente | Aucune |
| Envasement | KPI Vi/Vf/Ve/% perte/TEA/TER | `GET /api/v1/siltation/summary`, `/indicators` | PARTIEL, bathymétrie présente mais indicateurs absents | IMPORTANT |
| Envasement | Courbes HSV et campagnes | `GET /api/v1/siltation/hsv`, `/bathymetry-campaigns`, `/period-volumes` | OK | Aucune |
| Dégradation spécifique | Assets et couches thématiques | `GET /api/v1/maps/thematic/subbasins/vulnerability?scenario=etat_actuel` + assets `/data/hassan/degradation-maps/*` | OK | Aucune |
| SWAT consultation | Synthèse et consultation | `GET /api/v1/hydro/swat/summary`, `/availability`, `/reaches`, `/subbasins`, `/data` | OK | Aucune |
| Cartographie | Couches projet et couches spatiales | `GET /api/v1/spatial/project-hassan-addakhil`, `/basins`, `/subbasins`, `/reaches`, `/barrages` | OK | Aucune |
| Spatial | Analyse et disponibilité scénarios | `GET /api/v1/spatial/subbasins/1/scenarios-availability`, `/reaches/1/scenarios-availability` | OK | Aucune |
| Programme intervention | Données et assets statiques | Contrôle code + assets `/data/hassan/intervention-program/*` et PDF programme | OK | Aucune |
| Rapports/export | Exports sédimentation | Export `.xlsx` et `.pdf` non vides | OK | Aucune |
| Administration | Fonctions sûres Linux | `GET /api/v1/admin/db-config`, `GET /api/admin/users` avec token admin R4 | OK | Aucune |

Tests automatisés complémentaires :

| Module | Fonction | Test | Résultat | Gravité anomalie |
| --- | --- | --- | --- | --- |
| Backend | Type-check | `npm run type-check` | OK | Aucune |
| Backend | Tests | `npm run test:run` | OK, `31/31` | Aucune |
| Frontend | Type-check | `npm run type-check` | OK | Aucune |
| Frontend | Tests | `npm run test:run` | OK, `16/16` | Aucune |

## R4-FIX - ENVASEMENT

| Module | Fonction | Test | Résultat | Gravité anomalie |
| --- | --- | --- | --- | --- |
| Envasement | Problème initial | `GET /api/v1/siltation/indicators` sur release `1.0.0` | VIDE, alors que `hydro.bathymetry_campaigns` est la source métier attendue | IMPORTANT |
| Envasement | Cause exacte | Audit code + DB + documentation projet | Endpoint `/indicators` encore branché sur `hydro.siltation_indicators` vide, alors que `summary` et les docs prévoient un calcul dynamique depuis `hydro.bathymetry_campaigns` | Confirmée |
| Envasement | Correction backend | Unification du calcul des KPI pour `/indicators` et `summary` | OK en code source, sans frontend modifié | Aucune |
| Envasement | Tests unitaires ciblés | `tests/services/siltation.service.test.ts` | OK, `4/4` nouveaux tests, total backend `35/35` | Aucune |
| Envasement | Validation runtime R4-FIX | Stack `hassan-ziz-r4fix-20260831` avec dump officiel restauré | VALIDÉ, DB/backend/frontend healthy, `/indicators` et `/summary` retournent les KPI attendus | Aucune |
| Envasement | Vérification dump officiel | `hydro_hd_v1.0.0.dump` contrôlé en lecture seule | OK, SHA256 conforme et `6` campagnes `HASSAN_ADDAKHIL` présentes dans `hydro.bathymetry_campaigns` | Aucune |
| Envasement | Recréation runtime R4-FIX | Suppression du volume temporaire, recréation DB et restauration de `hydro_hd_v1.0.0.dump` | VALIDÉ, 6 campagnes bathymétriques restaurées pour `HASSAN_ADDAKHIL` | Aucune |
| Envasement | Reprise Docker locale | Docker Desktop relancé puis stack R4-FIX revalidé | VALIDÉ, services healthy et logs sans erreur bloquante | Aucune |
| Global | R4-RETEST non-régression | Climat, Hydrologie, Spatial, Solid Yield, frontend et logs backend | VALIDÉ, APIs fonctionnelles, frontend HTTP 200 et aucune erreur bloquante | Aucune |
| Docker release | Image backend officielle `1.0.0` | `hassan-addakhil-backend:1.0.0` retestée après bascule du tag | VALIDÉ, backend healthy et API Envasement retourne les KPI attendus | Aucune |

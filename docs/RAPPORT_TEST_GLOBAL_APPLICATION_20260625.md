# Rapport de test global - Hydro-Data Intelligence

Date : 2026-06-25

## Objet

Verifier l'application apres signalement d'un probleme dans le module `Suivi Hydrologique > Recapitulatif d'Envasement` :

- la mini-carte barrage affichait `Carte indisponible`;
- un test global de l'application et des APIs etait demande.

## Correction appliquee

Fichier modifie :

`D:\3- Projets\hassanAddakhil\hydro_Hassan dakhil\frontend\src\components\dashboard\modules\RecapitulatifEnvasement.tsx`

Cause racine :

- l'API spatiale retourne le contour du bassin en `MultiPolygon`;
- le composant frontend ne savait lire correctement qu'un `Polygon`;
- l'extraction des coordonnees retournait donc une liste vide, ce qui declenchait `Carte indisponible`.

Correction :

- la fonction `toLatLngRing` gere maintenant les structures GeoJSON `Polygon` et `MultiPolygon`;
- verification avec les donnees live : le contour bassin extrait contient 32 543 points.

## Deploiement

Services Docker verifies :

| Service | Etat |
|---|---|
| `hydro-hassan-dev1606-db` | healthy |
| `hydro-hassan-dev1606-backend` | healthy |
| `hydro-hassan-dev1606-frontend` | healthy |

Commandes executees :

- `npx tsc -b --pretty false`
- `docker compose up -d --build frontend`

Build frontend :

- TypeScript OK
- Vite build OK
- Warning non bloquant : `caniuse-lite` ancien
- Warning non bloquant : certains chunks depassent 500 kB

## Tests frontend

| Test | Resultat |
|---|---|
| `GET http://localhost:8089/dashboard` | 200 OK |
| Frontend Nginx | healthy |
| Mini-carte barrage | correction de parsing `MultiPolygon` appliquee |

Note : la verification visuelle directe par navigateur automatise n'etait pas disponible dans cette session, mais la cause technique a ete confirmee par l'API live et le parsing corrige retourne bien des coordonnees valides.

## Tests API principaux

| Endpoint | Resultat | Donnees observees |
|---|---:|---|
| `/api/v1/hydro/health` | 200 | OK |
| `/api/v1/hydro/stats` | 200 | OK |
| `/api/v1/hydro/stations` | 200 | 34 stations globales |
| `/api/v1/hydro/catchments` | 200 | 1 bassin |
| `/api/v1/hydro/reservoirs` | 200 | 12 reservoirs/barrages globaux |
| `/api/v1/hydro/bathymetry` | 200 | 4401 lignes |
| `/api/v1/hydro/model-runs` | 200 | 1 run |
| `/api/v1/catalog/modules` | 200 | 3 modules |
| `/api/v1/catalog/runs` | 200 | 9 scenarios/runs |
| `/api/v1/catalog/modules/hydro/properties` | 200 | 2 variables |
| `/api/v1/catalog/modules/erosion/properties` | 200 | 4 variables |
| `/api/v1/catalog/modules/hydro/stations?runId=1` | 200 | 5 stations |
| `/api/v1/catalog/availability?module=hydro` | 200 | 45 disponibilites |
| `/api/v1/catalog/availability?module=erosion` | 200 | 76 disponibilites |

## Tests spatial

| Endpoint | Resultat | Donnees observees |
|---|---:|---|
| `/api/v1/spatial/project-hassan-addakhil` | 200 | 19 sous-bassins, 19 reaches, 5 stations |
| `/api/v1/spatial/basins` | 200 | 1 bassin |
| `/api/v1/spatial/subbasins?catchmentId=1` | 200 | 19 sous-bassins |
| `/api/v1/spatial/reaches?catchmentId=1` | 200 | 19 reaches |
| `/api/v1/spatial/stations?catchmentId=1` | 200 | 34 stations globales |
| `/api/v1/spatial/barrages?catchmentId=1` | 200 | 12 barrages/reservoirs globaux |

Point d'attention :

- les endpoints generiques `spatial/stations` et `spatial/barrages` retournent encore les entites globales;
- l'ecran Analyse Spatiale utilise l'endpoint projet qui retourne correctement 5 stations et 1 barrage dans le perimetre Hassan Addakhil.

## Tests envasement / bathymetrie

| Endpoint | Resultat | Donnees observees |
|---|---:|---|
| `/api/v1/siltation/summary` | 200 | KPI disponibles |
| `/api/v1/siltation/indicators` | 200 | 1 ligne |
| `/api/v1/siltation/hsv` | 200 | 13 203 lignes |
| `/api/v1/siltation/evolution` | 200 | 34 lignes |
| `/api/v1/siltation/bathymetry` | 200 | OK |
| `/api/v1/siltation/export/excel` | 200 | fichier Excel genere |
| `/api/v1/siltation/export/pdf` | 200 | fichier PDF genere |

## Tests sediments

| Endpoint | Resultat | Donnees observees |
|---|---:|---|
| `/api/v1/solid-yield/subbasins` | 200 | 19 sous-bassins |
| `/api/v1/solid-yield/availability` | 200 | 171 disponibilites |

Les filtres sediments restent alignes sur les 19 sous-bassins valides.

## Tests data-scan

| Endpoint | Resultat |
|---|---:|
| `/api/v1/data-scan/summary` | 200 |
| `/api/v1/data-scan/tables` | 200 |
| `/api/v1/data-scan/anomalies` | 200 |
| `/api/v1/data-scan/periods/global` | 200 |
| `/api/v1/data-scan/data-availability` | 200 |

## Tests securite

| Endpoint | Resultat | Interpretation |
|---|---:|---|
| `/api/auth/me` sans token | 401 | attendu |

## Logs

Backend :

- demarrage OK;
- connexion DB OK;
- warmup caches OK;
- aucune erreur critique detectee dans les logs recents.

Frontend :

- Nginx demarre correctement;
- `/dashboard` retourne 200;
- aucune erreur Nginx detectee dans les logs recents.

## Conclusion

Etat global : OK apres correction.

La mini-carte etait indisponible a cause d'un mauvais parsing frontend des geometries `MultiPolygon`. La correction est appliquee, compilee et deployee. Les tests API principaux, spatial, envasement, sediments, data-scan et exports sont passes.

Anomalies non bloquantes a suivre :

- `spatial/stations?catchmentId=1` et `spatial/barrages?catchmentId=1` retournent les donnees globales; a harmoniser si ces endpoints sont utilises directement ailleurs que via `project-hassan-addakhil`.
- warnings Vite de taille de chunks; optimisation possible plus tard par lazy-loading/code-splitting.
- `caniuse-lite` a mettre a jour ulterieurement.

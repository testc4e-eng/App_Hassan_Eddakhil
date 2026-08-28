# RAPPORT DQ6-B CORE / ACCESS / PROPRIETES DYNAMIQUES

- `ETAPE`: `DQ6-B`
- `DATE`: `2026-08-11`
- `HEURE`: `10:37:37 +00:00`
- `POSTGRESQL MODIFIE`: `NON`
- `FALLBACKS SUPPRIMES`: `0`

## Resume executif

DQ6-B a formalise l'architecture hybride SWAT sans modifier PostgreSQL et sans materialiser de nouvelles donnees.

Le resultat est :

- une couche metier explicite partagee dans `hydro_Hassan dakhil/backend/src/constants/swatDataSources.ts` ;
- les proprietes dynamiques `SWAT_SED_IN_TONS` et `SWAT_SED_CONC_MG_KG` documentees et centralisees ;
- les services critiques SWAT alignes sur les memes definitions de scenarios/proprietes/fallbacks ;
- les checks backend et frontend valides ;
- les invariants proteges confirmes :
  - `383` timeseries
  - `3 773 400` measurements
  - `75` stations visibles
  - `9` scenarios metier visibles
  - `19` reaches runtime
  - `19` subbasins runtime

## Architecture core/access avant

Avant DQ6-B :

- les scenarios SWAT visibles etaient disperses dans plusieurs services ;
- les proprietes SWAT etaient definies plusieurs fois ;
- les regles `core` / `access` / `dynamic` etaient implicites ;
- la logique de fallback et les alias `101..108` etaient corrects mais peu formalises.

## Architecture apres

Apres DQ6-B :

- les scenarios visibles et leurs alias internes sont centralises ;
- les proprietes SWAT visibles sont decrites dans une seule source metier ;
- les proprietes dynamiques sont distinguees des proprietes materialisees ;
- `catalog.service.ts`, `timeseries.service.ts`, `hydroSwatSeries.service.ts`, `erosionSwatSeries.service.ts`, `solidYield.service.ts` et `spatial.service.ts` consomment les memes definitions partagees ;
- aucun comportement fonctionnel n'a ete retire ;
- aucun fallback n'a ete supprime.

## Propriete dynamiques stabilisees

### `SWAT_SED_IN_TONS`

- source : `access.rch_results.sed_in_tons`
- domaine : `sediments`
- mode : `DYNAMIC`
- materialisation core : `NON`

### `SWAT_SED_CONC_MG_KG`

- source : `access.rch_results.sedconc_mg_kg`
- domaine : `sediments`
- mode : `DYNAMIC`
- materialisation core : `NON`

## Couche metier creee

- `OUI`
- fichier : `hydro_Hassan dakhil/backend/src/constants/swatDataSources.ts`

## Services analyses

- `catalog.service.ts`
- `timeseries.service.ts`
- `hydroSwatSeries.service.ts`
- `erosionSwatSeries.service.ts`
- `solidYield.service.ts`
- `spatial.service.ts`
- `stationSimulation.service.ts`

## Fichiers modifies pour DQ6-B

- `hydro_Hassan dakhil/backend/src/constants/swatDataSources.ts`
- `hydro_Hassan dakhil/backend/src/services/catalog.service.ts`
- `hydro_Hassan dakhil/backend/src/services/hydroSwatSeries.service.ts`
- `hydro_Hassan dakhil/backend/src/services/erosionSwatSeries.service.ts`
- `hydro_Hassan dakhil/backend/src/services/timeseries.service.ts`
- `hydro_Hassan dakhil/backend/src/services/solidYield.service.ts`
- `hydro_Hassan dakhil/backend/src/services/spatial.service.ts`
- `hydro_Hassan dakhil/backend/tests/constants/swatDataSources.test.ts`
- `hydro_Hassan dakhil/backend/tests/services/hydroSwatSeries.service.test.ts`
- `hydro_Hassan dakhil/backend/tests/services/erosionSwatSeries.service.test.ts`

## Checks realises

### Backend

- commande : `npm run check`
- resultat : `OK`

### Frontend

- commande : `npm run check`
- resultat : `OK`
- remarque : `34 warnings ESLint existants, 0 erreur`

### Validation runtime temporaire sur le port 5007

Contexte :

- le rebuild Docker backend a ete tente ;
- le daemon Docker local est ensuite devenu indisponible ;
- pour ne pas toucher a PostgreSQL et continuer DQ6-B, la validation runtime a ete faite sur une instance locale temporaire du backend liee a `127.0.0.1:5007`.

Resultats verifies :

- `GET /api/v1/catalog/runs` -> `9` scenarios visibles
- `GET /api/v1/catalog/modules/hydro/stations?runId=3` -> `5`
- `GET /api/v1/catalog/modules/hydro/stations?runId=101` -> `5`
- `GET /api/v1/catalog/modules/erosion/stations?runId=7` -> `33`
- `GET /api/v1/catalog/modules/erosion/stations?runId=105` -> `33`
- `GET /api/v1/catalog/availability?module=hydro` -> `OK`
- `GET /api/v1/catalog/availability?module=erosion` -> `OK`
- `GET /api/v1/hydro/swat/availability` -> `OK`
- `GET /api/v1/spatial/reaches` -> `19` features
- `GET /api/v1/data-scan/summary` -> `OK`

### Payloads SWAT catalog verifies apres centralisation

`catalog/modules/hydro/properties`

- `STREAMFLOW`
- `SWAT_FLOW_M3S`

`catalog/modules/erosion/properties`

- `SWAT_SED_IN_TONS`
- `SWAT_SED_TONS`
- `SWAT_SED_CONC_MG_KG`
- `SWAT_SYLDT_HA`

## Donnees protegees

- `Timeseries`: `383`
- `Measurements`: `3 773 400`
- `Stations visibles`: `75`
- `Scenarios metier visibles`: `9`
- `Reaches runtime`: `19`
- `Subbasins runtime`: `19`

Verdict :

- `Aucune baisse detectee`

## Baseline

Commande utilisee pendant la validation temporaire :

- `python scripts/quality/compare-functional-baseline.py --snapshot-out ... --compare Support_Doc_HD/Phase Protection Donnees Fonctionnelles/PROTECTED_FUNCTIONAL_DATA_BASELINE_20260810_1608.json --backend-url http://127.0.0.1:5007 --frontend-url http://127.0.0.1:8090`

Statut observe :

- `WARNING`

Lecture du resultat :

- difference attendue DQ6-A / baseline historique :
  - `catalog_runs`: `9` au lieu de `17`
  - `catalog_hydro_stations`: `5` au lieu de `0`
- invariants proteges :
  - `OK`
- stations protegees :
  - `OK`
- timeseries protegees :
  - `OK`
- groupes SWAT proteges :
  - `OK`
- couches cartographiques protegees :
  - `OK`

Conclusion baseline :

- aucune nouvelle regression metier bloquante n'a ete introduite par DQ6-B ;
- la baseline historique continue de signaler l'ecart deja attendu depuis DQ6-A.

## Regression fonctionnelle

- `NON`
- reserve :
  - l'ancienne baseline continue a remonter l'ecart historique DQ6-A sur `catalog_runs`
  - quelques variations de hash non bloquantes ont ete observees pendant la comparaison historique, sans baisse de compteurs ni perte d'acces aux modules verifies

## Documentation technique associee

- `Support_Doc_HD/Phase Audit de la BD/ARCHITECTURE_DONNEES_SWAT_CORE_ACCESS.md`

## Point d'arret

DQ6-B est termine.

Ne pas enchainer automatiquement sur :

- `DQ6-C`
- `DQ6-D`
- `DQ6-E`
- `DQ6-F`
- `DQ6-G`
- `DQ6-H`
- `DQ6-I`

Prochaine etape attendue :

- `DQ6-C — Qualification climat`

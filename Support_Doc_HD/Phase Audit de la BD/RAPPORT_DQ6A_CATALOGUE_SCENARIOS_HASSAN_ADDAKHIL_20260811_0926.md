# RAPPORT DQ6-A - CATALOGUE DES SCENARIOS

Date : 2026-08-11
Heure debut : 09:11:36
Heure fin : 09:26:50

ETAPE :
DQ6-A - Catalogue scenario

## 1. Perimetre

Correction appliquee uniquement dans la couche applicative.

- PostgreSQL modifie : NON
- Tables modifiees : AUCUNE
- Vues modifiees : AUCUNE
- Docker modifie : NON
- Frontend modifie : NON

Validation runtime :

- l'instance deja active sur `http://127.0.0.1:5007` servait encore l'ancienne version du backend ;
- les validations HTTP post-correction ont donc ete executees sur une instance backend ephemere issue du code corrige, demarree temporairement sur `http://127.0.0.1:5012`, puis arretee ;
- aucun volume PostgreSQL n'a ete touche.

## 2. Catalogue avant

| scenario_code | run_id | reel/virtuel | visible |
| --- | ---: | --- | --- |
| OBSERVED | 1 | reel | OUI |
| etat_actuel | 3 | reel | OUI |
| scenario_1 | 7 | reel | OUI |
| scenario_2 | 8 | reel | OUI |
| scenario_3 | 9 | reel | OUI |
| scenario_4 | 10 | reel | OUI |
| ssp126 | 4 | reel | OUI |
| ssp245 | 5 | reel | OUI |
| ssp585 | 6 | reel | OUI |
| etat_actuel | 101 | virtuel | OUI |
| ssp126 | 102 | virtuel | OUI |
| ssp245 | 103 | virtuel | OUI |
| ssp585 | 104 | virtuel | OUI |
| scenario_1 | 105 | virtuel | OUI |
| scenario_2 | 106 | virtuel | OUI |
| scenario_3 | 107 | virtuel | OUI |
| scenario_4 | 108 | virtuel | OUI |

Scenarios visibles avant : 17

Doublons avant :

- etat_actuel : `3` + `101`
- ssp126 : `4` + `102`
- ssp245 : `5` + `103`
- ssp585 : `6` + `104`
- scenario_1 : `7` + `105`
- scenario_2 : `8` + `106`
- scenario_3 : `9` + `107`
- scenario_4 : `10` + `108`

## 3. Catalogue apres

| scenario_code | run_id | reel/virtuel | visible |
| --- | ---: | --- | --- |
| OBSERVED | 1 | reel | OUI |
| etat_actuel | 3 | reel | OUI |
| ssp126 | 4 | reel | OUI |
| ssp245 | 5 | reel | OUI |
| ssp585 | 6 | reel | OUI |
| scenario_1 | 7 | reel | OUI |
| scenario_2 | 8 | reel | OUI |
| scenario_3 | 9 | reel | OUI |
| scenario_4 | 10 | reel | OUI |

Scenarios visibles apres : 9

Doublons apres :

- aucun doublon visible par `scenario_code`

RUNS REELS VISIBLES :

- `1`
- `3`
- `4`
- `5`
- `6`
- `7`
- `8`
- `9`
- `10`

ALIASES VIRTUELS VISIBLES :
NON

ALIASES VIRTUELS ENCORE SUPPORTES EN INTERNE :
OUI

Preuves de compatibilite interne verifiees sur le backend corrige :

- `GET /api/v1/catalog/modules/hydro/stations?runId=3` -> `count = 5`
- `GET /api/v1/catalog/modules/hydro/stations?runId=101` -> `count = 5`
- `GET /api/v1/catalog/modules/erosion/stations?runId=7` -> `count = 33`
- `GET /api/v1/catalog/modules/erosion/stations?runId=105` -> `count = 33`

## 4. Fichiers modifies

- `hydro_Hassan dakhil/backend/src/services/catalog.service.ts`
- `hydro_Hassan dakhil/backend/src/services/hydroSwatSeries.service.ts`
- `hydro_Hassan dakhil/backend/src/services/erosionSwatSeries.service.ts`
- `hydro_Hassan dakhil/backend/tests/services/catalog.service.test.ts`
- `hydro_Hassan dakhil/backend/tests/services/hydroSwatSeries.service.test.ts`
- `hydro_Hassan dakhil/backend/tests/services/erosionSwatSeries.service.test.ts`

## 5. Controle technique

Backend :

- `npm run type-check` -> OK
- `npm run lint` -> OK
- `npm run test:run` -> OK
- `npm run build` -> OK
- `npm run check` -> OK

Frontend :

- `npm run check` -> OK
- resultat detaille : `0 erreur`, `34 warnings` existants non lies a DQ6-A

Tests ajoutes :

- catalogue visible sans doublons et sans alias exposes
- compatibilite run canonique hydro -> availability virtuelle
- compatibilite alias hydro `101`
- compatibilite alias erosion `105`

## 6. Donnees protegees

POSTGRESQL MODIFIE :
NON

TIMESERIES :
383

MEASUREMENTS :
3773400

Constat baseline :

- scenarios proteges preserves
- runtime reaches preserves
- runtime subbasins preserves
- stations protegees preservees
- timeseries preservees
- groupes SWAT `rch` preserves
- groupes SWAT `sub` preserves
- couches cartographiques preservees

## 7. Baseline

Baseline avant modification (instance active `5007`) :

- statut outil : `WARNING`
- warnings preexistants :
  - `api:spatial_reaches`
  - `api:data_scan_periods_global`

Baseline apres correction (instance ephemere `5012`) :

- statut outil : `REGRESSION`

Explication :

- cette regression est attendue au sens du script de comparaison, car DQ6-A change volontairement le contrat visible de `catalog_runs` ;
- le script detecte aussi comme variation fonctionnelle positive le passage de `catalog_hydro_stations` pour `runId=3` de `0` a `5`.

Variations attendues :

- `api:catalog_runs` : `17 -> 9`
- `api:catalog_hydro_stations` : `0 -> 5`

Variations non attendues detectees :

- aucune perte de scenario protege
- aucune perte de station protegee
- aucune perte de timeseries
- aucune perte de measurements

Interpretation DQ6-A :

- correction applicative validee ;
- changement visible intentionnel ;
- absence de regression de donnees.

## 8. Resultat final

DOUBLONS SUPPRIMES DU CATALOGUE :
8

RESULTAT FINAL :

- un seul scenario visible par `scenario_code`
- vrais `run_id` exposes
- aliases `101..108` conserves uniquement pour compatibilite interne
- aucune donnee PostgreSQL modifiee
- aucune perte de timeseries
- aucune perte de measurements

Point d'attention restant :

- l'instance backend longue duree sur `5007` doit etre redemarree pour servir cette version corrigee.

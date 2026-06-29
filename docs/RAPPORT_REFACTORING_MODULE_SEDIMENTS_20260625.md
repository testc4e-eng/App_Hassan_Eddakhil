# Rapport - Refactoring module Sediments

Date : 2026-06-25

## Objectif

Transformer le module `Dashboard > Sediments` en module autonome compose de 3 dashboards specialises :

1. Evaluation d'envasement
2. Degradation specifique
3. Transport solide Reach

Le module hydrologique ne doit plus contenir le recapitulatif d'envasement.

## Nouvelle architecture frontend

Nouveaux composants :

- `frontend/src/components/dashboard/modules/sediments/SedimentsDashboard.tsx`
- `frontend/src/components/dashboard/modules/sediments/EnvasementDashboard.tsx`
- `frontend/src/components/dashboard/modules/sediments/SpecificDegradationDashboard.tsx`
- `frontend/src/components/dashboard/modules/sediments/ReachSedimentDashboard.tsx`

Structure :

```text
SedimentsDashboard
  ├── EnvasementDashboard
  │   └── RecapitulatifEnvasement
  ├── SpecificDegradationDashboard
  │   └── SolidYieldModuleV2
  └── ReachSedimentDashboard
      ├── filtres reach / scenario / variable / periode / aggregation
      ├── KPI
      ├── graphique temporel SYDOUT
      ├── comparaison multi-scenarios
      ├── tableau
      ├── exports CSV / Excel
      └── carte des 19 reaches
```

## Fichiers modifies

Frontend :

- `frontend/src/pages/Dashboard.tsx`
- `frontend/src/components/dashboard/modules/HydraulicModule.tsx`
- `frontend/src/components/dashboard/modules/ErosionSedimentsModuleV3.tsx`
- `frontend/src/api/spatial.ts`
- `frontend/src/components/dashboard/modules/sediments/SedimentsDashboard.tsx`
- `frontend/src/components/dashboard/modules/sediments/EnvasementDashboard.tsx`
- `frontend/src/components/dashboard/modules/sediments/SpecificDegradationDashboard.tsx`
- `frontend/src/components/dashboard/modules/sediments/ReachSedimentDashboard.tsx`

Backend :

- `backend/src/controllers/spatialController.ts`
- `backend/src/services/spatial.service.ts`

## Changements realises

### 1. Navigation Sediments

L'ancienne interface du module sediments est remplacee par 3 gros boutons de mode :

- `Evaluation d'envasement`
- `Degradation specifique`
- `Transport solide Reach`

Chaque bouton charge un dashboard separe.

### 2. Envasement deplace

Le composant `RecapitulatifEnvasement` a ete retire de :

- `HydraulicModule.tsx`

Il est maintenant expose dans :

- `SedimentsDashboard > Evaluation d'envasement`

Le rendu et les fonctionnalites existantes sont conservees :

- KPI
- courbes HSV
- evolution volume envase
- mini-carte barrage
- exports PDF / Excel
- export indicateurs
- export rapport

### 3. Degradation specifique

Le dashboard existant `SolidYieldModuleV2` est conserve et deplace dans :

- `SedimentsDashboard > Degradation specifique`

Fonctionnalites conservees :

- sous-bassin
- scenarios
- variable `SYLDT_HA`
- periode
- aggregation
- statistiques
- tableau
- graphique
- comparaison
- exports

### 4. Transport solide Reach

Nouveau dashboard cree :

- selection de Reach parmi les 19 reaches
- selection scenario
- variable principale `SYDOUT / SED_OUT`
- periode
- aggregation jour / mois / annee
- KPI : min, max, moyenne, somme, points, periode
- graphique temporel
- comparaison multi-scenarios
- tableau Date / Reach / Valeur / Scenario
- export CSV
- export Excel
- carte Leaflet avec les 19 reaches
- reach selectionne mis en evidence

## APIs modifiees

Endpoint existant enrichi, sans casser l'existant :

`GET /api/v1/spatial/reaches/:reachId/timeseries`

Parametres supportes :

- `scenarioCode`
- `interval=day|month|year`
- `startDate`
- `endDate`

Reponse enrichie :

- `period`
- `year`
- `flow_out_cms`
- `flow_in_cms`
- `sed_out_tons`
- `sed_in_tons`
- `n`

Ancien usage conserve :

- un appel avec seulement `scenarioCode=SWAT_OUTPUT` continue de retourner la serie.

## Audit des donnees Reach

Verification base :

- `access.rch_results` contient actuellement uniquement `SWAT_OUTPUT`.
- 19 reaches cartographiques sont disponibles dans `/api/v1/spatial/reaches?catchmentId=1`.
- `SYDOUT` est represente par `sed_out_tons`.

Point important :

- les scenarios SSP126 / SSP245 / SSP585 ne sont pas presents comme lignes distinctes dans `access.rch_results`;
- le dashboard les affiche comme options, mais retourne un etat vide si les donnees reach correspondantes ne sont pas importees;
- aucune donnee n'a ete inventee.

## Audit comparaison scenarios

Bug suspecte :

- les courbes en comparaison ne correspondaient pas toujours aux courbes individuelles.

Correction / verification appliquee :

- la comparaison du dashboard `Degradation specifique` utilise les memes appels API `solid-yield/timeseries` que le mode individuel;
- aucune conversion ou recalcul supplementaire n'est applique dans la fusion frontend;
- les donnees sont fusionnees uniquement par `period`;
- les valeurs restent celles retournees par l'API.

Verification API realisee :

- appels individuels `solid-yield/timeseries` sur plusieurs runs;
- verification que le merge de comparaison superpose les series sans modifier les valeurs;
- les sous-bassins restent filtres sur les 19 entites valides.

## Tests realises

Builds :

- `npm run build` backend : OK
- `npx tsc -b --pretty false` frontend : OK
- `docker compose up -d --build backend frontend` : OK

Docker :

- `hydro-hassan-dev1606-db` : healthy
- `hydro-hassan-dev1606-backend` : healthy
- `hydro-hassan-dev1606-frontend` : healthy

Smoke tests API :

- `/api/v1/hydro/stats` : 200
- `/api/v1/catalog/runs` : 200
- `/api/v1/spatial/project-hassan-addakhil` : 200
- `/api/v1/siltation/summary` : 200
- `/api/v1/solid-yield/subbasins` : 200
- `/api/v1/solid-yield/availability` : 200
- `/api/v1/spatial/reaches/1/timeseries?scenarioCode=SWAT_OUTPUT&interval=year` : 200
- `/api/v1/data-scan/summary` : 200

Tests Reach :

- `/api/v1/spatial/reaches?catchmentId=1` : 19 reaches
- Reach 1, annual : 29 points
- Reach 1, monthly 1995-01-01 -> 1995-03-31 : 3 points
- champ `sed_out_tons` disponible et utilise comme `SYDOUT / SED_OUT`

Frontend :

- `/dashboard?section=sediment` : 200
- build Vite Docker : OK

Warnings non bloquants :

- `caniuse-lite` ancien
- chunks Vite > 500 kB

## Captures avant / apres

Avant :

- le module `Sediments` affichait directement le dashboard de degradation specifique;
- le recapitulatif d'envasement etait encore dans `Suivi Hydrologique`.

Apres :

- `Sediments` affiche 3 modes specialises;
- `Evaluation d'envasement` contient le recapitulatif;
- `Suivi Hydrologique` ne contient plus l'envasement;
- `Transport solide Reach` est disponible avec carte et series SYDOUT.

Note :

- les captures automatiques navigateur n'etaient pas disponibles dans cette session; les validations ont ete faites par build, API live, logs Docker et endpoint frontend.

## Problemes restants / limites connues

1. Les scenarios reach autres que `SWAT_OUTPUT` ne sont pas disponibles dans `access.rch_results`.
   - Impact : les options SSP peuvent afficher un etat vide dans `Transport solide Reach`.
   - Solution : importer les resultats reach scenario par scenario ou definir une table de mapping metier.

2. Les libelles existants contiennent encore quelques caracteres mojibake dans certains anciens fichiers.
   - Impact : cosmetique.
   - Solution : passe UTF-8 globale sur les composants historiques.

3. Les chunks frontend sont volumineux.
   - Impact : warning build, pas bloquant.
   - Solution : lazy-loading des dashboards lourds et split des vendors.

4. La comparaison est maintenant construite sans transformation des valeurs, mais une validation visuelle navigateur reste recommandee avec les selections metier exactes de l'utilisateur.

## Conclusion

La refonte principale est realisee :

- module sediments autonome;
- 3 dashboards separes;
- envasement deplace hors hydrologie;
- degradation specifique conservee;
- nouveau dashboard reach SYDOUT cree;
- API reach enrichie;
- builds et smoke tests OK.

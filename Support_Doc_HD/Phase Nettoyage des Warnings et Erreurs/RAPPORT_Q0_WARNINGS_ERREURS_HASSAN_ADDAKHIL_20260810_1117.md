# RAPPORT Q0-C — WARNINGS ET ERREURS SILENCIEUSES

Date : 2026-08-10
Heure début : 11:03
Heure fin : 11:17:35

## Résumé

WARNINGS FRONTEND AVANT : 64

WARNINGS FRONTEND APRÈS : 34

WARNINGS BACKEND AVANT : 11

WARNINGS BACKEND APRÈS : 0

WARNINGS SUPPRIMÉS : 41

ERREURS SILENCIEUSES TRAITÉES : 11

WARNINGS CONSERVÉS VOLONTAIREMENT : 34

FRONTEND CHECK : OK

BACKEND CHECK : OK

LOGIQUE MÉTIER MODIFIÉE : NON

## Warnings supprimés

- Frontend :
  - suppression des `@typescript-eslint/no-unused-vars` triviaux sur `FilterBar`, `RecapitulatifEnvasement`, `SolidYieldModuleV2`, `SpatialInspectorPanel`, `SpatialModule`, `ReachSedimentDashboard`, `HydroMap`, `ThematicLegend`, `ThematicReachLayer`, `ThematicSubbasinLayer`, `BudgetDistributionChart`, `InterventionProgramDashboard`
  - suppression d'un warning `react-refresh/only-export-components` trivial dans `DataManagementModule`
- Backend :
  - suppression de tous les `@typescript-eslint/no-unused-vars` restants
  - nettoyage de petits helpers locaux morts dans les services SWAT sans impact runtime

## Erreurs silencieuses traitées

- `frontend/src/components/dashboard/FilterBar.tsx`
  - échec silencieux de `loadAvailability(moduleCode)` remplacé par `console.warn` ciblé
  - échec silencieux de `loadModuleProperties(moduleCode)` remplacé par `console.warn` ciblé
  - échec silencieux du chargement d'`aggregationAvailability` remplacé par `console.warn` ciblé
  - échec silencieux du chargement de la plage de dates remplacé par `console.warn` ciblé
- `frontend/src/components/map/HydroMap.tsx`
  - 7 blocs `catch {}` de nettoyage Leaflet remplacés par `console.debug` ciblés

## Fichiers modifiés

- `hydro_Hassan dakhil/frontend/src/components/dashboard/FilterBar.tsx`
- `hydro_Hassan dakhil/frontend/src/components/dashboard/modules/DataManagementModule.tsx`
- `hydro_Hassan dakhil/frontend/src/components/dashboard/modules/RecapitulatifEnvasement.tsx`
- `hydro_Hassan dakhil/frontend/src/components/dashboard/modules/SolidYieldModuleV2.tsx`
- `hydro_Hassan dakhil/frontend/src/components/dashboard/modules/SpatialInspectorPanel.tsx`
- `hydro_Hassan dakhil/frontend/src/components/dashboard/modules/SpatialModule.tsx`
- `hydro_Hassan dakhil/frontend/src/components/dashboard/modules/sediments/ReachSedimentDashboard.tsx`
- `hydro_Hassan dakhil/frontend/src/components/map/HydroMap.tsx`
- `hydro_Hassan dakhil/frontend/src/components/map/ThematicLegend.tsx`
- `hydro_Hassan dakhil/frontend/src/components/map/ThematicReachLayer.tsx`
- `hydro_Hassan dakhil/frontend/src/components/map/ThematicSubbasinLayer.tsx`
- `hydro_Hassan dakhil/frontend/src/features/intervention-program/components/BudgetDistributionChart.tsx`
- `hydro_Hassan dakhil/frontend/src/features/intervention-program/pages/InterventionProgramDashboard.tsx`
- `hydro_Hassan dakhil/backend/src/middleware/errorHandler.ts`
- `hydro_Hassan dakhil/backend/src/services/access.service.ts`
- `hydro_Hassan dakhil/backend/src/services/erosionSwatSeries.service.ts`
- `hydro_Hassan dakhil/backend/src/services/hydro.service.ts`
- `hydro_Hassan dakhil/backend/src/services/hydroSwatSeries.service.ts`
- `hydro_Hassan dakhil/backend/src/services/maps.service.ts`
- `hydro_Hassan dakhil/backend/src/services/timeseries.service.ts`

## Faux positifs restaurés

- Aucun

## Warnings restants

| Fichier | Règle | Nombre | Pourquoi non corrigé | Phase future |
|---|---|---:|---|---|
| `src/components/charts/MultiScenarioTimeSeriesChart.tsx` | `react-hooks/exhaustive-deps` | 2 | Effets liés à plusieurs collections dérivées, correction pouvant changer le recalcul des séries | Q1 React Hooks |
| `src/components/charts/TimeSeriesChart.tsx` | `react-hooks/exhaustive-deps` | 2 | Risque de modifier le déclenchement des effets/callbacks métier du graphe | Q1 React Hooks |
| `src/components/dashboard/FilterBar.tsx` | `react-hooks/exhaustive-deps` | 4 | Dépendances sensibles sur chargement, agrégation et variables filtrées | Q1 React Hooks |
| `src/components/dashboard/modules/SolidYieldModuleV2.tsx` | `react-hooks/exhaustive-deps` | 2 | Module métier SWAT/sédiments, correction à valider avec scénarios réels | Q1 React Hooks |
| `src/components/dashboard/modules/SpatialInspectorPanel.tsx` | `react-hooks/exhaustive-deps` | 9 | Sélection cartographique complexe, expressions dérivées et risque de boucles | Q1 React Hooks |
| `src/components/dashboard/modules/SpatialModule.tsx` | `react-hooks/exhaustive-deps` | 2 | Hotspot cartographique monolithique explicitement hors refactor Q0-C | Q1 Refactor Spatial |
| `src/components/tables/DataTable.tsx` | `react-hooks/exhaustive-deps` | 3 | Dépendances calculées depuis la sélection, correction non triviale | Q1 React Hooks |
| `src/components/ui/badge.tsx` | `react-refresh/only-export-components` | 1 | Fichier UI partagé type shadcn, extraction purement structurelle | Q1 Frontend Structure |
| `src/components/ui/button.tsx` | `react-refresh/only-export-components` | 1 | Fichier UI partagé type shadcn, extraction purement structurelle | Q1 Frontend Structure |
| `src/components/ui/form.tsx` | `react-refresh/only-export-components` | 1 | Fichier UI partagé type shadcn, extraction purement structurelle | Q1 Frontend Structure |
| `src/components/ui/navigation-menu.tsx` | `react-refresh/only-export-components` | 1 | Fichier UI partagé type shadcn, extraction purement structurelle | Q1 Frontend Structure |
| `src/components/ui/sidebar.tsx` | `react-refresh/only-export-components` | 1 | Fichier UI partagé type shadcn, extraction purement structurelle | Q1 Frontend Structure |
| `src/components/ui/sonner.tsx` | `react-refresh/only-export-components` | 1 | Fichier UI partagé type shadcn, extraction purement structurelle | Q1 Frontend Structure |
| `src/components/ui/toggle.tsx` | `react-refresh/only-export-components` | 1 | Fichier UI partagé type shadcn, extraction purement structurelle | Q1 Frontend Structure |
| `src/contexts/AuthContext.tsx` | `react-refresh/only-export-components` | 1 | Provider et hook exportés dans le même fichier | Q1 Frontend Structure |
| `src/contexts/HydroDataContext.tsx` | `react-hooks/exhaustive-deps` | 1 | Ajouter `loadStations` peut modifier le rythme de chargement des stations | Q1 React Hooks |
| `src/contexts/HydroDataContext.tsx` | `react-refresh/only-export-components` | 1 | Provider, hook et types cohabitent dans le même fichier | Q1 Frontend Structure |

## Vérifications exécutées

- Frontend :
  - `npm run lint`
  - `npm run type-check`
  - `npm run test:run`
  - `npm run build`
  - `npm run check`
- Backend :
  - `npm run lint`
  - `npm run type-check`
  - `npm run test:run`
  - `npm run build`
  - `npm run check`

## Résultat final

- Phase Q0-C validée
- Aucune régression détectée par les checks automatisés disponibles
- Tous les warnings triviaux backend ont été supprimés
- Les warnings frontend restants sont structurels et documentés pour Q1

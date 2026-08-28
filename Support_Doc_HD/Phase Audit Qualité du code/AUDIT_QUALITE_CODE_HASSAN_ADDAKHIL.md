# AUDIT QUALITE CODE - PROJET HASSAN ADDAKHIL

Date: 2026-08-10
Branche analysee: `ilh_dev_20-07`
HEAD: `99c1089e9f0588fdbd8e8872302295cb88bbdaf6`
Mode: audit uniquement, sans refactorisation ni modification applicative

## 1. Resume executif

Le projet est fonctionnel et compile sur son etat actuel, mais la qualite structurelle reste heterogene.

Points positifs constates:

- build frontend OK ;
- build backend OK ;
- `npm run type-check` backend OK ;
- aucun cycle d'import confirme dans le code applicatif ;
- la structure generale frontend/backend reste lisible a l'echelle du depot ;
- des briques utiles existent deja: `api/http.ts`, `DatabaseService`, helpers d'env, scripts d'encodage UTF-8.

Points de dette majeurs:

- plusieurs composants React sont devenus trop gros et multi-responsabilites ;
- plusieurs services backend concentrent SQL, logique metier, fallback schema, mapping et orchestration ;
- la couche API frontend est fragmentee ;
- le routage backend n'est pas totalement propre (`catalogAvailability.ts` contient de la logique metier et SQL) ;
- le typage TypeScript est encore fragile dans certains hotspots ;
- la gestion d'erreurs est incoherente et parfois silencieuse ;
- les controles qualite automatiques sont incomplets: pas de tests applicatifs, lint frontend mal configure, lint backend indisponible ;
- le frontend build passe, mais genere de gros bundles, ce qui signale des frontieres de modules encore trop larges.

Diagnostic global:

- projet fonctionnel: OUI
- projet maintenable a moyen terme sans reprise qualite: NON
- refonte urgente: NON
- campagne de refactorisation progressive et priorisee: OUI

## 2. Perimetre

Analyse couverte:

- frontend React/TypeScript ;
- backend Express/TypeScript ;
- requetes SQL et logique PostGIS embarquees ;
- Dockerfiles, `docker-compose.yml`, `.env.example`, `backend/.env.example` ;
- scripts npm disponibles ;
- couplage, duplication, structure, typage, erreurs, testabilite, documentation.

Verification outillage realisee pendant cet audit:

- `hydro_Hassan dakhil/frontend`: `npm run build` OK ;
- `hydro_Hassan dakhil/backend`: `npm run build` OK ;
- `hydro_Hassan dakhil/backend`: `npm run type-check` OK ;
- `hydro_Hassan dakhil/frontend`: `npm run lint` KO, script ESLint incompatible avec la configuration flat config actuelle ;
- `hydro_Hassan dakhil/backend`: `npm run lint` KO, `eslint` n'est pas disponible dans l'environnement/package backend.

## 3. Scores

| Domaine | Score | Justification |
|---|---:|---|
| Frontend | 5.5/10 | L'application fonctionne, mais plusieurs composants critiques depassent 1000 lignes et concentrent etat, appels API, transformation et rendu. |
| Backend | 5.5/10 | Le schema route/controller/service existe, mais plusieurs services sont trop larges et certains contournent la separation des couches. |
| TypeScript | 4.5/10 | Les hotspots les plus sensibles utilisent encore beaucoup de `any`, `as any` et des envelopes de donnees trop permissives. |
| Architecture | 5/10 | L'architecture generale est saine sur le papier, mais des exceptions importantes la fragilisent. |
| Lisibilite | 5/10 | Plusieurs fichiers restent lisibles localement, mais les plus gros blocs sont devenus difficiles a parcourir et raisonner. |
| Maintenabilite | 4.5/10 | Le risque de regression est surtout lie aux gros composants/services et aux duplications de logique. |
| Testabilite | 2/10 | Aucun test applicatif detecte, injection de dependances quasi absente, effets de bord nombreux. |
| Gestion erreurs | 5/10 | Certains points sont propres (`AppError`, `httpGet`), mais des erreurs sont encore masquees ou relancees sans contexte metier stable. |
| SQL | 4.5/10 | SQL puissant mais trop embarque dans les services, avec quelques `SELECT *` et des requetes longues difficiles a maintenir. |
| Configuration | 6/10 | La configuration est partiellement centralisee, mais les defaults sont encore disperses entre compose, env, services et frontend. |

## 4. Qualite structurelle

### Frontend

Schema cible attendu: `page -> composant -> hook/service -> API`

Constat:

- respect partiel ;
- plusieurs composants portent encore la logique metier et les appels reseau ;
- le contexte global `HydroDataContext.tsx` prend des responsabilites qui devraient vivre dans des hooks/services ;
- la couche API est dupliquee entre `api/*`, `services/*` et certains composants/contexts.

Problemes majeurs:

- `hydro_Hassan dakhil/frontend/src/components/dashboard/FilterBar.tsx`
  PROBLEME: logique de filtrage, orchestration d'options, gestion des periodes, appels de chargement, validation des selections et rendu UI dans un seul composant.
  IMPACT: lecture difficile, fort risque de regression sur l'UX de filtrage.
  RECOMMANDATION: extraire hooks de derivation et services d'orchestration.

- `hydro_Hassan dakhil/frontend/src/components/dashboard/modules/SpatialModule.tsx`
  PROBLEME: etat carte + chargement couches + orchestration catalogues + interactions inspecteur + layout.
  IMPACT: couplage fort entre cartographie et logique de donnees.
  RECOMMANDATION: separer hooks de chargement spatial, etat de selection, et panneaux UI.

- `hydro_Hassan dakhil/frontend/src/components/map/HydroMap.tsx`
  PROBLEME: utilitaires geo, styles, export, mesure, popups, panes, zoom, rendu Leaflet dans le meme fichier.
  IMPACT: fichier critique, difficile a tester, typage faible.
  RECOMMANDATION: isoler helpers geometry/popup/export et composants Leaflet secondaires.

### Backend

Schema cible attendu: `route -> controller -> service -> DB`

Constat:

- globalement present ;
- controllers encore tres repetitifs ;
- services riches mais parfois trop vastes ;
- une rupture claire existe dans `routes/catalogAvailability.ts`.

Problemes majeurs:

- `hydro_Hassan dakhil/backend/src/routes/catalogAvailability.ts`
  PROBLEME: route contenant SQL, normalisation module, deduplication, fusion observed/simulated et filtrage.
  IMPACT: couche HTTP couplee au metier et a la DB.
  RECOMMANDATION: deplacer le SQL et la fusion dans un service dedie.

- `hydro_Hassan dakhil/backend/src/controllers/hydroController.ts`
  PROBLEME: controller long, parsing manuel repete, services instancies directement.
  IMPACT: code difficile a tester et a standardiser.
  RECOMMANDATION: partager validation/reponse et introduire une couche d'injection simple.

- `hydro_Hassan dakhil/backend/src/services/hydro.service.ts`
  PROBLEME: fallback schema, hydrologie, bathymetrie, scenarios, GIS et placeholders dans un seul service.
  IMPACT: responsabilite trop large.
  RECOMMANDATION: scinder par sous-domaines fonctionnels.

## 5. Fichiers trop longs

| Fichier | Lignes | Fonctions approx. | Responsabilites approx. | Complexite apparente | Classement |
|---|---:|---:|---:|---|---|
| `backend/src/services/erosionSwatSeries.service.ts` | 2689 | 20+ | 6+ | tres elevee | CRITIQUE |
| `frontend/src/components/dashboard/FilterBar.tsx` | 1774 | 10+ helpers + 1 composant principal | 5+ | tres elevee | CRITIQUE |
| `frontend/src/components/dashboard/modules/SpatialModule.tsx` | 1686 | 4+ composants/fonctions majeurs | 6+ | tres elevee | CRITIQUE |
| `frontend/src/components/map/HydroMap.tsx` | 1632 | 20+ | 7+ | tres elevee | CRITIQUE |
| `backend/src/services/spatial.service.ts` | 1589 | 20+ | 6+ | tres elevee | CRITIQUE |
| `frontend/src/components/dashboard/modules/SolidYieldModuleV2.tsx` | 1575 | 4+ | 5+ | elevee | A DECOUPER |
| `backend/src/services/swatIngestion.service.ts` | 1398 | 15+ | 7+ | elevee | A DECOUPER |
| `frontend/src/features/intervention-program/data/interventionProgram.data.ts` | 1322 | faible | 1 | faible | ACCEPTABLE |
| `backend/src/services/dataScan.service.ts` | 1273 | 15+ | 5+ | elevee | A DECOUPER |
| `backend/src/services/hydroSwatSeries.service.ts` | 1044 | 12+ | 4+ | elevee | A SURVEILLER |
| `frontend/src/features/intervention-program/pages/InterventionProgramDashboard.tsx` | 1010 | 1 composant principal | 3 | moyenne | A SURVEILLER |
| `frontend/src/components/dashboard/modules/sediments/ReachSedimentDashboard.tsx` | 1000 | 10+ | 5 | elevee | A DECOUPER |
| `backend/src/services/timeseries.service.ts` | 888 | 10+ | 4 | moyenne/elevee | A SURVEILLER |
| `backend/src/services/stationSimulation.service.ts` | 853 | 8+ | 4 | moyenne/elevee | A SURVEILLER |
| `frontend/src/components/dashboard/modules/SpatialInspectorPanel.tsx` | 841 | 1 composant principal | 3 | elevee | A SURVEILLER |
| `frontend/src/components/charts/TimeSeriesChart.tsx` | 778 | 8+ | 4 | elevee | A DECOUPER |

## 6. Fonctions trop longues

| Fichier | Fonction | Taille approx. | Probleme | Recommandation |
|---|---|---:|---|---|
| `frontend/src/components/dashboard/FilterBar.tsx` | `FilterBar` | ~1619 lignes | logique metier + orchestration de chargement + UI | extraire hooks de filtres, derivees et periodes |
| `frontend/src/components/dashboard/modules/SpatialModule.tsx` | `OperationalSpatialModule` | ~1452 lignes | carte, couches, chargements, selection, layout | separer data hooks, map state, side panels |
| `frontend/src/components/dashboard/modules/SolidYieldModuleV2.tsx` | `SolidYieldModuleV2` | ~1195 lignes | filtre, stats, export, chart, table | isoler hooks et sous-composants de presentation |
| `frontend/src/components/map/HydroMap.tsx` | `HydroMap` | ~700 lignes | rendu map + styles + events + export | scinder en couches Leaflet specialisees |
| `frontend/src/components/dashboard/modules/sediments/ReachSedimentDashboard.tsx` | `ReachSedimentDashboard` | ~650 lignes | scenario, chart, export, pagination, map | extraire data model et export |
| `frontend/src/components/charts/TimeSeriesChart.tsx` | `TimeSeriesChart` | ~585 lignes | transformation de serie + chart + export | sortir transformation/export dans utilitaires |
| `backend/src/services/erosionSwatSeries.service.ts` | `getSubbasinAvailabilityFromCatalog` | ~260 lignes | SQL + mapping + filtrage | deplacer SQL vers module requetes |
| `backend/src/services/erosionSwatSeries.service.ts` | `getSubbasinAvailabilityFromMatView` | ~290 lignes | fallback et transformation complexes | separer acquisition et mapping |
| `backend/src/services/spatial.service.ts` | `getProjectHassanAddakhil` | ~237 lignes | recupere et agrege plusieurs objets GIS | decomposer par entite spatiale |
| `backend/src/services/dataScan.service.ts` | `getDataAvailability` | ~348 lignes | SQL, heuristiques, formatage de synthese | decouper par type de vue |
| `backend/src/services/swatIngestion.service.ts` | `ensureInfrastructure` | ~118 lignes | DDL embarque dans service ETL | sortir dans migration/apply step dediee |
| `backend/src/services/swatIngestion.service.ts` | `upsertTimeseriesAndMeasurements` | ~140+ lignes | persistance, mapping et consolidation | isoler repository + mapper |

## 7. Complexite cyclomatique et hotspots

### Q0 - Critique

- `frontend/src/components/map/HydroMap.tsx`
- `frontend/src/components/dashboard/FilterBar.tsx`
- `frontend/src/components/dashboard/modules/SpatialModule.tsx`
- `backend/src/services/erosionSwatSeries.service.ts`
- `backend/src/services/spatial.service.ts`

### Q1 - Elevee

- `frontend/src/components/dashboard/modules/SolidYieldModuleV2.tsx`
- `frontend/src/components/dashboard/modules/sediments/ReachSedimentDashboard.tsx`
- `frontend/src/components/charts/TimeSeriesChart.tsx`
- `backend/src/services/swatIngestion.service.ts`
- `backend/src/services/dataScan.service.ts`
- `backend/src/services/hydroSwatSeries.service.ts`
- `backend/src/controllers/hydroController.ts`
- `backend/src/controllers/timeseriesController.ts`

### Q2 - Moyenne

- `backend/src/services/timeseries.service.ts`
- `backend/src/services/stationSimulation.service.ts`
- `frontend/src/components/dashboard/modules/SpatialInspectorPanel.tsx`
- `frontend/src/contexts/HydroDataContext.tsx`
- `frontend/src/api/spatial.ts`

### Q3 - Faible

- petits composants UI ;
- utilitaires simples ;
- fichiers data purs.

## 8. Duplication de code

| Zone A | Zone B | Similarite | Risque | Mutualisation recommandee |
|---|---|---|---|---|
| `backend/src/services/erosionSwatSeries.service.ts` | `backend/src/services/hydroSwatSeries.service.ts` | tres forte | divergence de regles et correctifs oublies | base commune SWAT series + mappers par module |
| `frontend/src/api/http.ts` + `api/client.ts` | `frontend/src/services/swatDataService.ts`, `solidYieldService.ts`, `dataScanService.ts`, `api/auth.ts`, `api/thematicMaps.ts`, `api/adminDbConfig.ts`, `HydroDataContext.tsx` | forte | gestion erreurs et base URL incoherentes | une seule couche HTTP/REST partagee |
| `frontend/src/components/charts/TimeSeriesChart.tsx` | `frontend/src/components/charts/MultiScenarioTimeSeriesChart.tsx` | forte | export/transformation dupliques | utilitaires series/export CSV communs |
| `frontend/src/components/tables/DataTable.tsx` | `frontend/src/components/dashboard/modules/SpatialTimeseriesPanel.tsx` | forte | duplication export tabulaire | helper `csvExport` commun |
| `frontend/src/components/dashboard/modules/SolidYieldModuleV2.tsx` | `frontend/src/components/dashboard/modules/sediments/ReachSedimentDashboard.tsx` | moyenne/forte | blobs/export/formatage repetes | utilitaires export et formatage mutualises |
| `backend/src/controllers/hydroController.ts` | `timeseriesController.ts`, `spatialController.ts`, `solidYield.controller.ts`, `swatController.ts`, `dataScan.controller.ts` | forte | validations et try/catch repetes | helpers de parsing/reponse/erreur |
| `backend/src/services/hydro.service.ts` | `spatial.service.ts`, `catalog.service.ts`, `stationSimulation.service.ts` | moyenne | fallback schema disperses | service/repository de disponibilite schema |
| `frontend/src/components/dashboard/FilterBar.tsx` | `frontend/src/contexts/HydroDataContext.tsx` | moyenne | logique de catalogues et de selection recalculee | hooks de catalogues et derivees |
| `backend/src/services/swatIngestion.service.ts` | scripts SWAT d'infrastructure et services series | moyenne | regles SWAT dispersees | documentation technique + contrats inter-modules |
| `frontend/src/pages/Dashboard.tsx` | `frontend/src/components/admin/AdminLayout.tsx` via `DashboardSidebarV2.tsx` | faible/moyenne | navigation liee a un composant historique `V2` | consolidation navigation shared layout |

## 9. Responsabilite unique

### Cas principaux

FICHIER: `frontend/src/components/dashboard/FilterBar.tsx`  
RESPONSABILITES: chargement disponibilite, chargement variables, derivees de station, derivees de scenario, derivees de date, validation selection, debug, rendu.  
PROBLEME: trop de logique metier dans un composant d'interface.  
DECOUPAGE FUTUR PROPOSE: `useFilterCatalogs`, `useFilterDateBounds`, `useFilterSelection`, composant UI fin.

FICHIER: `frontend/src/components/map/HydroMap.tsx`  
RESPONSABILITES: styles, popups, export PNG, mesure, zoom, panes, rendu couches.  
PROBLEME: composant carte monolithique.  
DECOUPAGE FUTUR PROPOSE: `mapGeometry.ts`, `mapPopups.ts`, `MapExportControl`, `MeasureTool`, `MapLayers`.

FICHIER: `frontend/src/components/dashboard/modules/SpatialModule.tsx`  
RESPONSABILITES: chargement couches, catalogues, selection d'entites, etat panneau, rendu module.  
PROBLEME: orchestration trop large.  
DECOUPAGE FUTUR PROPOSE: hooks de chargement spatial + presenter containers.

FICHIER: `backend/src/services/swatIngestion.service.ts`  
RESPONSABILITES: resolution de script, execution PowerShell, DDL, staging, normalisation, batch, disponibilite, suppression.  
PROBLEME: service ETL/infrastructure tres couple.  
DECOUPAGE FUTUR PROPOSE: `SwatScriptRunner`, `SwatInfrastructureRepository`, `SwatNormalizer`, `SwatBatchService`.

FICHIER: `backend/src/services/hydro.service.ts`  
RESPONSABILITES: stations, catchments, timeseries, mesures, bathymetrie, scenarios, stats.  
PROBLEME: agrandissement organique du service.  
DECOUPAGE FUTUR PROPOSE: `HydroCatalogService`, `HydroBathymetryService`, `HydroMeasurementService`.

FICHIER: `backend/src/services/dataScan.service.ts`  
RESPONSABILITES: inventaire, heuristiques, anomalies, periodes, details tables, stats.  
PROBLEME: metier data-scan trop concentre.  
DECOUPAGE FUTUR PROPOSE: `DataScanSummaryService`, `DataScanDetailService`, `DataScanMetadataRepository`.

FICHIER: `backend/src/routes/catalogAvailability.ts`  
RESPONSABILITES: HTTP, SQL, fusion de jeux observed/simulated, filtrage final.  
PROBLEME: rupture d'architecture.  
DECOUPAGE FUTUR PROPOSE: route fine + controller + service de fusion catalogues.

## 10. Dette TypeScript

### Fichiers les plus concernes

- `frontend/src/components/map/HydroMap.tsx`
  - 84 occurrences de `any`
  - 48 castings `as any`
  - helpers Leaflet/GeoJSON peu modelises

- `frontend/src/components/dashboard/FilterBar.tsx`
  - 19 occurrences de `any`
  - 15 castings `as any`
  - listes de lignes d'availability trop faiblement typees

- `backend/src/services/hydro.service.ts`
  - 16 occurrences de `any`
  - methodes exposant encore des retours generiques

- `frontend/src/components/charts/MultiScenarioTimeSeriesChart.tsx`
  - 10 occurrences de `any`
  - formes de donnees multiples mal alignees

- `backend/src/services/spatial.service.ts`
  - 9 occurrences de `any`
  - aggregation/rendu spatial melangent plusieurs formes de payload

- `frontend/src/contexts/HydroDataContext.tsx`
  - 6 occurrences de `any`
  - `getApiBase` utilise `(import.meta as any).env`

- `backend/src/services/database.service.ts`
  - generiques `query<T = any>` et `params?: any[]`
  - dette utile au depart, mais trop large pour un service central

- `frontend/src/services/solidYieldService.ts`
  - `(import.meta as any).env`
  - couche API parallele non alignee avec `httpGet`

Conclusion TypeScript:

- le probleme principal n'est pas le volume global du projet ;
- le probleme principal est la concentration du typage faible dans les fichiers les plus critiques.

## 11. Null / undefined

Zones fragiles identifiees:

- `frontend/src/components/map/HydroMap.tsx`
  - optional chaining tres dense (`223` occurrences approx.) ;
  - plusieurs `catch {}` silencieux ;
  - symptome: modeles de donnees trop permissifs et erreurs masquees.

- `frontend/src/components/dashboard/FilterBar.tsx`
  - `.catch(() => {})` sur chargement disponibilite/proprietes ;
  - derivees de selections dependantes de lignes potentiellement incompletes.

- `frontend/src/contexts/HydroDataContext.tsx`
  - nombreux fallbacks et caches refs pour contenir des chargements concurrents ;
  - robuste en runtime, mais difficile a raisonner.

- `backend/src/services/hydro.service.ts`
  - fallback de relation et de schema qui multiplie les branches conditionnelles ;
  - robustesse utile, lisibilite degradee.

## 12. Gestion des erreurs

| Fichier | Type erreur | Probleme | Impact | Recommandation |
|---|---|---|---|---|
| `frontend/src/components/map/HydroMap.tsx` | `catch {}` silencieux | erreurs masquees a plusieurs endroits | bugs UI difficilement reproduisibles | journaliser ou remonter un etat d'erreur controle |
| `frontend/src/components/dashboard/FilterBar.tsx` | promesses ignorees | `loadAvailability(...).catch(() => {})` | echec de chargement non visible | centraliser les erreurs de chargement |
| `frontend/src/services/solidYieldService.ts` | `throw new Error(await res.text())` | pas de status ni contexte | debug API difficile | reutiliser `ApiError`/`httpGet` |
| `frontend/src/services/swatDataService.ts` | erreur generique | message standard peu contextualise | diagnostic metier faible | enrichir l'enveloppe d'erreur |
| `backend/src/services/database.service.ts` | rethrow generique | perte de contexte SQL/technique structure | debugging incomplet | renvoyer une erreur structuree ou `AppError` technique |
| `backend/src/routes/catalogAvailability.ts` | `catch (error: any)` | route gere directement erreur DB/metier | dilution des responsabilites | remonter via service/controller |
| `backend/src/controllers/hydroController.ts` | repetitivite `try/catch` | logique d'erreur dispersée | incoherence possible des reponses | helper controller standard |
| `backend/src/controllers/timeseriesController.ts` | validation manuelle + debug | erreurs et codes HTTP repetes | maintenance plus couteuse | middleware de validation |
| `backend/src/services/erosionSwatSeries.service.ts` | cascades de fallback | utile mais tres complexe a tracer | comportement difficile a auditer | tracer fallbacks via logger structure |
| `backend/src/services/swatIngestion.service.ts` | melange erreurs OS/DB/metier | service centralise trop de modes d'echec | debugging sensible | separer erreurs par sous-couche |

## 13. Logging

Constat:

- usage direct de `console.log`, `console.warn`, `console.error`, `console.debug` encore frequent ;
- logs de debug applicatif presents dans des controllers et composants critiques ;
- pas de logger structure central actif ;
- `DatabaseService` logue les slow queries, ce qui est utile, mais via `console.warn`.

Zones a surveiller:

- `backend/server.ts`
- `backend/src/controllers/spatialController.ts`
- `backend/src/controllers/timeseriesController.ts`
- `backend/src/controllers/solidYield.controller.ts`
- `backend/src/services/database.service.ts`
- `frontend/src/components/dashboard/modules/SpatialModule.tsx`
- `frontend/src/components/map/HydroMap.tsx`

Recommendation:

- conserver le principe de slow query logging ;
- introduire plus tard un logger central leger avant toute extension de logs.

## 14. Qualite des routes API

Etat global:

- routes principales coherentes et regroupes par domaine ;
- prefixes toutefois melanges: `/api/v1/*`, `/api/auth`, `/api/admin` ;
- alias fonctionnels mais redondants: `/api/v1/data-scan` et `/api/v1/scan`.

Observations:

- `app.ts` reste raisonnable en taille mais concentre aussi la politique CORS, rate limiting, endpoints racine et montage global ;
- `catalogAvailability.ts` est la principale anomalie architecturale ;
- validation de parametres encore largement manuelle ;
- pas de couche de schema validation unifiee visible ;
- pagination/contrats de reponse corrects sur certaines routes, plus artisanaux sur d'autres.

## 15. Qualite des controllers

Controllers a surveiller:

- `backend/src/controllers/hydroController.ts`
  - long et multi-entrees ;
  - parsing manuel repete ;
  - instancie `AdaptiveHydroService` et `SpatialService` directement.

- `backend/src/controllers/timeseriesController.ts`
  - relativement plus fin ;
  - mais validation et debug repetes.

- `backend/src/controllers/spatialController.ts`
  - fin sur certains endpoints ;
  - repetition de gardes et `console.debug`.

Etat general:

- la plupart des controllers sont surtout repetitifs plus que conceptuellement mauvais ;
- ils gagneraient beaucoup avec une petite couche commune de validation/reponse.

## 16. Qualite des services

| Service | Responsabilites | Complexite | Duplication | Couplage | Testabilite | Recommandation |
|---|---|---|---|---|---|---|
| `erosionSwatSeries.service.ts` | catalogues, series, stats, fallback access/matview/catalog | tres elevee | forte avec `hydroSwatSeries` | tres fort DB/schema | faible | priorite Q0 |
| `spatial.service.ts` | GIS, project geojson, reaches, stations, availabilities | tres elevee | moyenne | fort DB/PostGIS | faible | priorite Q0 |
| `swatIngestion.service.ts` | script, infra, staging, normalisation, import, delete | tres elevee | moyenne | tres fort OS/DB/env | tres faible | priorite Q0 |
| `hydro.service.ts` | stations, catchments, mesures, bathymetrie, scenarios | elevee | moyenne | fort DB/schema | faible | priorite Q1 |
| `dataScan.service.ts` | inventaire, anomalies, periodes, stats tables | elevee | faible | fort DB dynamique | faible | priorite Q1 |
| `hydroSwatSeries.service.ts` | disponibilite et series hydro SWAT | elevee | forte avec erosion | fort DB/schema | faible | priorite Q1 |
| `timeseries.service.ts` | facade/agregation cross-domain | moyenne/elevee | moyenne | fort vers autres services | faible | priorite Q1 |
| `solidYield.service.ts` | disponibilite/statistiques series solide | moyenne | faible | moyen/fort DB | moyenne/faible | priorite Q2 |
| `siltation.service.ts` | lecture et exports siltation | moyenne | faible | moyen DB | moyenne/faible | priorite Q2 |

## 17. Qualite SQL

Constats principaux:

- `backend/src/services/swatIngestion.service.ts` concentre le plus de SQL et de DDL embarques ;
- `backend/src/services/erosionSwatSeries.service.ts`, `spatial.service.ts`, `dataScan.service.ts`, `hydro.service.ts` portent des requetes longues et metier ;
- `backend/src/queries/dataScan.queries.ts` montre qu'un decouplage des requetes est possible, mais encore peu etendu.

Occurrences `SELECT *` reperees:

- `backend/src/services/access.service.ts`
- `backend/src/services/dataScan.service.ts`
- `backend/src/services/erosionSwatSeries.service.ts`
- `backend/src/services/hydroSwatSeries.service.ts`
- `backend/src/services/siltation.service.ts`
- `backend/src/services/stationSimulation.service.ts`
- `backend/src/services/swatIngestion.service.ts`

Risques:

- maintenabilite difficile lors des changements de schema ;
- contrats de colonnes peu explicites ;
- lecture lourde pour les services hybrides SQL + mapping.

Recommandations:

- sortir les grosses requetes vers modules `queries/*` ou repositories ;
- reduire `SELECT *` ;
- documenter les vues/materialized views critiques ;
- expliciter les alias de colonnes dans les hotspots SWAT/GIS.

## 18. Hotspots React

### Composants critiques

- `frontend/src/components/dashboard/FilterBar.tsx`
- `frontend/src/components/dashboard/modules/SpatialModule.tsx`
- `frontend/src/components/map/HydroMap.tsx`
- `frontend/src/components/dashboard/modules/SolidYieldModuleV2.tsx`
- `frontend/src/components/dashboard/modules/sediments/ReachSedimentDashboard.tsx`
- `frontend/src/components/charts/TimeSeriesChart.tsx`
- `frontend/src/components/dashboard/modules/SpatialInspectorPanel.tsx`
- `frontend/src/contexts/HydroDataContext.tsx`

Problemes recurrents:

- appels API directs hors couche partagee ;
- trop de `useEffect` ;
- etat derive stocke localement ;
- logique metier dans les composants ;
- export CSV/Blob duplique ;
- composants difficilement decoupables sans plan.

Signal supplementaire issu du build frontend:

- chunk `index-*.js` ~974.82 kB ;
- chunk `ui-vendor-*.js` ~587.96 kB ;
- warning Vite sur la taille des chunks.

Ce point est surtout un symptome de structure/modularisation plus qu'un sujet de performance pure dans cet audit.

## 19. useEffect

| Fichier | Nombre approx. | Responsabilites | Risque | Opportunite |
|---|---:|---|---|---|
| `frontend/src/components/dashboard/modules/SolidYieldModuleV2.tsx` | 16 | chargement, derivees, synchronisation UI | dependencies fragiles | extraire hooks metier |
| `frontend/src/components/dashboard/FilterBar.tsx` | 13 | chargement, recalcul d'options, sync selection | regressions de filtres | `useFilterCatalogs` |
| `frontend/src/components/map/HydroMap.tsx` | 10 | map state, resize, selection, export | effets difficiles a simuler | decoupage controles Leaflet |
| `frontend/src/components/dashboard/modules/SpatialModule.tsx` | 10 | couches, catalogues, selection, layout | couplage fort | hooks par source spatiale |
| `frontend/src/components/dashboard/modules/sediments/ReachSedimentDashboard.tsx` | 6 | chargement scenario/serie | coherence metier fragile | hook de donnees reach |
| `frontend/src/contexts/HydroDataContext.tsx` | 5 | cache refs et bootstrap catalogues | concurrence et ordre de chargement | hooks de ressources catalogues |
| `frontend/src/components/dashboard/modules/SpatialInspectorPanel.tsx` | 5 | synchronisation panneau | complexite interne | presenter + hook |

## 20. Gestion d'etat

Observations:

- `HydroDataContext.tsx` est trop large pour rester longtemps stable ;
- des donnees de catalogues sont chargees/filtrees a plusieurs niveaux ;
- `SpatialModule.tsx` maintient beaucoup d'etat local derive ;
- `FilterBar.tsx` reconstruit plusieurs vues derivees depuis `availabilityByModule` ;
- la couche cartographique transporte beaucoup d'etat transitoire qui pourrait etre mieux segmente.

Risques:

- etat derive stocke inutilement ;
- chargements multiples du meme concept ;
- forte sensibilite a l'ordre des effets React ;
- debugging plus difficile en cas de selection incoherente.

## 21. Appels API frontend

Etat actuel:

- base saine presente avec `frontend/src/api/http.ts` et `frontend/src/api/client.ts` ;
- mais plusieurs couches paralleles continuent d'exister.

Wrappers/fetchers identifies:

- `frontend/src/api/http.ts`
- `frontend/src/api/client.ts`
- `frontend/src/api/auth.ts`
- `frontend/src/api/spatial.ts`
- `frontend/src/api/thematicMaps.ts`
- `frontend/src/api/adminDbConfig.ts`
- `frontend/src/services/swatDataService.ts`
- `frontend/src/services/solidYieldService.ts`
- `frontend/src/services/dataScanService.ts`
- `frontend/src/contexts/HydroDataContext.tsx`

Problemes:

- base URL pas totalement unifiee (`/api/v1`, `/api`, `VITE_API_BASE`, `VITE_API_BASE_URL`) ;
- gestion d'erreurs differente selon les modules ;
- `AbortSignal` utilise uniquement sur certaines zones ;
- types d'enveloppes heterogenes.

Recommendation:

- une seule couche HTTP + helpers de query string + mapping d'erreur ;
- services metier minces au-dessus ;
- zero `fetch` direct dans les composants hors cas exceptionnel.

## 22. Nommage

Incoherences principales:

- restes `V2` explicites:
  - `frontend/src/components/dashboard/DashboardSidebarV2.tsx`
  - `frontend/src/components/dashboard/modules/SolidYieldModuleV2.tsx`

- anglais/francais melanges dans le code et les noms de domaines ;
- `hydro.service.ts` couvre plus que l'hydrologie stricte ;
- `OperationalSpatialModule` puis `SpatialModule` en facade: nommage acceptable mais redondant.

Recommandation:

- normaliser plus tard par domaine, pas en operation cosmetique globale.

## 23. Magic values

Magic values a extraire a terme:

- origines CORS hardcodees dans `backend/src/app.ts` ;
- scenario codes canoniques hardcodes dans `backend/src/services/hydro.service.ts` ;
- defaults API base dupliques dans le frontend ;
- certains textes de fichiers exportes et noms CSV directement dans les composants.

Constantes metier acceptables:

- mappings de stations projet ;
- labels SWAT ;
- couleurs thematiques quand elles vivent deja dans des constantes dediees.

## 24. Commentaires / TODO / documentation inline

TODO/FIXME actifs detectes:

- `backend/src/services/maps.service.ts`
  - TODO de branchement DB restant

Constat:

- peu de TODO explicites ;
- la dette n'est donc pas visible par commentaires, mais par concentration de logique ;
- plusieurs hotspots auraient besoin de documentation technique minimale plus que de commentaires ligne a ligne.

## 25. Testabilite

Constat principal:

- aucun test applicatif detecte (`APP_TEST_COUNT = 0` hors `node_modules`) ;
- pas de suites unitaires, integration ou e2e visibles ;
- les services instancient souvent directement `DatabaseService` ;
- les controllers instancient parfois directement les services ;
- nombreux effets de bord: DB, `fetch`, `spawn`, filesystem, env vars.

Freins majeurs aux tests:

- `SwatIngestionService` couple a PowerShell/filesystem/DB ;
- services sans injection de dependances ;
- composants React monolithiques ;
- absence de contrats de mock standardises pour les couches API.

## 26. Couplage

Couplages forts identifies:

- `backend/src/services/swatIngestion.service.ts` <-> OS Windows <-> PowerShell <-> schema DB ;
- `backend/src/services/erosionSwatSeries.service.ts` <-> vues/materialized views/fallback schema ;
- `backend/src/services/spatial.service.ts` <-> PostGIS + conventions projet Hassan Addakhil ;
- `frontend/src/components/dashboard/modules/SpatialModule.tsx` <-> cartographie + API spatiale + UI panneaux ;
- `frontend/src/contexts/HydroDataContext.tsx` <-> catalogues + labels scenario + filtres projet.

## 27. Imports circulaires

Resultat:

- aucun cycle d'import confirme dans le code applicatif frontend/backend.

Conclusion:

- le couplage est fort, mais il n'est pas actuellement manifeste par des cycles d'import.

## 28. Dependances entre modules metier

Evaluation:

- Hydrologie, Climat, Sediments, SWAT et Cartographie restent relies via les catalogues et la selection projet ;
- la dependance la plus sensible est entre les modules SWAT et les couches hydro/erosion qui reutilisent des patterns proches sans base commune ;
- `Data Scan` est relativement autonome, mais son service est lui aussi tres large.

Dependances non souhaitables a reduire:

- duplication hydro/erosion SWAT ;
- logique de selection projet dissipee entre frontend, services et catalogues ;
- cartographie dependante de plus d'une source de donnees et de plusieurs conventions implicites.

## 29. Configuration

Points positifs:

- `backend/src/config/env.ts` fournit deja des helpers simples et utiles ;
- `.env.example` et `backend/.env.example` existent ;
- Dockerfiles sont relativement sobres.

Points faibles:

- defaults disperses entre `docker-compose.yml`, `app.ts`, services frontend et `.env.example` ;
- `frontend` utilise a la fois `VITE_API_BASE`, `VITE_API_BASE_URL` et parfois `/api` ;
- `backend/src/app.ts` contient encore des defaults CORS hardcodes ;
- `DatabaseService` et plusieurs services lisent directement `process.env`.

Diagnostic:

- configuration exploitable ;
- centralisation inachevee.

## 30. Documentation du code

Fonctions/modules qui meritent une documentation technique minimale en priorite:

- `backend/src/services/erosionSwatSeries.service.ts`
- `backend/src/services/hydroSwatSeries.service.ts`
- `backend/src/services/swatIngestion.service.ts`
- `backend/src/services/spatial.service.ts`
- `backend/src/services/dataScan.service.ts`
- `frontend/src/components/dashboard/FilterBar.tsx`
- `frontend/src/components/map/HydroMap.tsx`
- `frontend/src/components/dashboard/modules/SpatialModule.tsx`

Documentation minimale attendue plus tard:

- source des donnees ;
- prerequis schema/vue ;
- conventions de scenario ;
- flux d'appel ;
- hypotheses de fallback ;
- contrats d'entree/sortie.

## 31. Priorites Q0-Q3

### Q0 - Critique

- reparer les hotspots structurels React: `FilterBar.tsx`, `SpatialModule.tsx`, `HydroMap.tsx`
- reprendre les gros services backend: `erosionSwatSeries.service.ts`, `spatial.service.ts`, `swatIngestion.service.ts`
- sortir la logique metier/SQL de `routes/catalogAvailability.ts`
- remettre en etat les garde-fous qualite: lint frontend, lint backend, strategie de tests minimale
- supprimer les erreurs silencieuses dans `HydroMap.tsx` et `FilterBar.tsx`

### Q1 - Important

- decouper `SolidYieldModuleV2.tsx`, `ReachSedimentDashboard.tsx`, `HydroDataContext.tsx`
- rationaliser `hydro.service.ts`, `dataScan.service.ts`, `hydroSwatSeries.service.ts`, `timeseries.service.ts`
- unifier la couche API frontend
- introduire une base commune pour les services SWAT hydro/erosion

### Q2 - Moyen

- reduire les `any` et `as any` dans les hotspots ;
- sortir les helpers CSV/export ;
- factoriser parsing/validation controllers ;
- centraliser la configuration frontend/backend ;
- reduire les gros chunks frontend.

### Q3 - Mineur

- normaliser le nommage `V2` ;
- clarifier certaines constantes ;
- enrichir la documentation technique.

## 32. Plan d'amelioration

### Phase Q1 - Hotspots critiques

OBJECTIF: stabiliser les fichiers les plus risqués.  
FICHIERS CIBLES: `FilterBar.tsx`, `SpatialModule.tsx`, `HydroMap.tsx`, `erosionSwatSeries.service.ts`, `spatial.service.ts`, `swatIngestion.service.ts`, `catalogAvailability.ts`.  
RISQUE: eleve.  
GAIN: fort.  
ORDRE: 1.  
TESTS FUTURS: smoke tests frontend, endpoints critiques, non-regression catalogues/spatial/SWAT.

### Phase Q2 - Gros fichiers / grosses fonctions

OBJECTIF: decouper les blocs monolithiques sans changer le comportement.  
FICHIERS CIBLES: `SolidYieldModuleV2.tsx`, `ReachSedimentDashboard.tsx`, `TimeSeriesChart.tsx`, `hydro.service.ts`, `dataScan.service.ts`.  
RISQUE: moyen/eleve.  
GAIN: fort.  
ORDRE: 2.  
TESTS FUTURS: snapshots de donnees, tests sur derivees et exports.

### Phase Q3 - Duplication

OBJECTIF: mutualiser les utilitaires et patterns dupliques.  
FICHIERS CIBLES: couche API frontend, services SWAT hydro/erosion, utilitaires CSV/export, helpers controllers.  
RISQUE: moyen.  
GAIN: fort.  
ORDRE: 3.  
TESTS FUTURS: tests unitaires utilitaires, tests d'integration sur services communs.

### Phase Q4 - TypeScript

OBJECTIF: reduire le typage faible dans les hotspots.  
FICHIERS CIBLES: `HydroMap.tsx`, `FilterBar.tsx`, `HydroDataContext.tsx`, `hydro.service.ts`, `database.service.ts`, `solidYieldService.ts`.  
RISQUE: moyen.  
GAIN: moyen/fort.  
ORDRE: 4.  
TESTS FUTURS: type-check frontend/backend et contrats de payload.

### Phase Q5 - Gestion erreurs

OBJECTIF: uniformiser les erreurs techniques/metier.  
FICHIERS CIBLES: services frontend, `database.service.ts`, controllers, `HydroMap.tsx`, `FilterBar.tsx`.  
RISQUE: moyen.  
GAIN: fort sur le debug.  
ORDRE: 5.  
TESTS FUTURS: cas d'erreurs API, fallbacks, erreurs DB.

### Phase Q6 - React

OBJECTIF: sortir la logique metier des composants.  
FICHIERS CIBLES: `FilterBar.tsx`, `SpatialModule.tsx`, `SolidYieldModuleV2.tsx`, `ReachSedimentDashboard.tsx`, `HydroDataContext.tsx`.  
RISQUE: moyen/eleve.  
GAIN: fort.  
ORDRE: 6.  
TESTS FUTURS: hooks tests, composants presentational tests, verification UX principale.

### Phase Q7 - Backend services

OBJECTIF: clarifier services, repositories et orchestration.  
FICHIERS CIBLES: `hydro.service.ts`, `spatial.service.ts`, `timeseries.service.ts`, `hydroSwatSeries.service.ts`, `erosionSwatSeries.service.ts`, `dataScan.service.ts`, `swatIngestion.service.ts`.  
RISQUE: eleve.  
GAIN: tres fort.  
ORDRE: 7.  
TESTS FUTURS: integration DB sur endpoints principaux.

### Phase Q8 - SQL

OBJECTIF: sortir/reduire le SQL embarque et les `SELECT *`.  
FICHIERS CIBLES: services SWAT, hydro, spatial, data-scan, station-simulation, siltation, access.  
RISQUE: moyen.  
GAIN: moyen/fort.  
ORDRE: 8.  
TESTS FUTURS: comparaison resultats avant/apres par endpoint.

### Phase Q9 - Configuration

OBJECTIF: centraliser les defaults et variables d'environnement.  
FICHIERS CIBLES: `docker-compose.yml`, `.env.example`, `backend/.env.example`, `backend/src/config/env.ts`, `frontend/src/api/*`, `backend/src/app.ts`.  
RISQUE: moyen.  
GAIN: moyen.  
ORDRE: 9.  
TESTS FUTURS: demarrage local + Docker + verification CORS/API base.

### Phase Q10 - Testabilite

OBJECTIF: introduire un filet de securite minimal.  
FICHIERS CIBLES: setup frontend/backend, services utilitaires, endpoints critiques.  
RISQUE: faible/moyen.  
GAIN: tres fort.  
ORDRE: 10.  
TESTS FUTURS: unitaires utilitaires, integration backend, smoke frontend.

### Phase Q11 - Documentation

OBJECTIF: documenter les hotspots metier et techniques.  
FICHIERS CIBLES: services SWAT, spatial, hydro, data-scan, gros composants React.  
RISQUE: faible.  
GAIN: moyen/fort.  
ORDRE: 11.  
TESTS FUTURS: revue humaine et onboarding.

### Phase Q12 - Validation finale

OBJECTIF: verifier que la reprise qualite n'a pas degrade le fonctionnel.  
FICHIERS CIBLES: ensemble des domaines touches.  
RISQUE: moyen.  
GAIN: indispensable.  
ORDRE: 12.  
TESTS FUTURS: build, lint, type-check, smoke tests modules metier.

## 33. Checklist finale

- [x] audit realise sans refactoriser le code existant
- [x] frontend analyse
- [x] backend analyse
- [x] SQL/PostGIS analyses
- [x] Docker/configuration analyses
- [x] gros fichiers identifies
- [x] fonctions complexes identifiees
- [x] duplications restantes identifiees
- [x] dette TypeScript identifiee
- [x] erreurs silencieuses identifiees
- [x] useEffect hotspots identifies
- [x] couplage analyse
- [x] imports circulaires recherches
- [x] score de qualite fourni
- [x] plan d'amelioration priorise fourni

## 34. Tableau final

| ID | Priorite | Domaine | Fichier | Probleme | Impact | Recommandation |
|---|---|---|---|---|---|---|
| A01 | Q0 | Frontend/React | `frontend/src/components/dashboard/FilterBar.tsx` | composant monolithique multi-responsabilites | regressions filtres et maintenance lente | extraire hooks metier et composants fins |
| A02 | Q0 | Frontend/React | `frontend/src/components/dashboard/modules/SpatialModule.tsx` | orchestration carte/donnees/UI trop concentree | couplage fort et lecture difficile | separer data hooks, selection et presentation |
| A03 | Q0 | Frontend/TypeScript | `frontend/src/components/map/HydroMap.tsx` | 84 `any`, 48 `as any`, `catch {}` silencieux | bugs cartes difficiles a tracer | typer GeoJSON/Leaflet et sortir helpers |
| A04 | Q0 | Backend/Service | `backend/src/services/erosionSwatSeries.service.ts` | service geant et tres conditionnel | risque fort de regression SWAT erosion | creer base commune SWAT + repositories |
| A05 | Q0 | Backend/Service | `backend/src/services/spatial.service.ts` | SQL/PostGIS/metier/mapping melanges | hotspot cartographie critique | scinder par sous-domaine spatial |
| A06 | Q0 | Backend/Service | `backend/src/services/swatIngestion.service.ts` | ETL + infra + script + DB dans un seul service | faible testabilite et couplage fort | decomposer runner/infrastructure/normalizer |
| A07 | Q0 | Backend/Architecture | `backend/src/routes/catalogAvailability.ts` | logique metier et SQL dans la route | rupture route/controller/service | deplacer SQL + fusion dans un service dedie |
| A08 | Q0 | Outillage | `frontend/package.json` / `backend/package.json` | lint inutilisable ou absent | pas de garde-fou qualite fiable | corriger scripts lint et dependances |
| A09 | Q0 | Qualite globale | depot applicatif | aucun test applicatif | regression non maitrisee | introduire une base de tests smoke/integration |
| A10 | Q0 | Frontend/API | `frontend/src/api/*`, `services/*`, `HydroDataContext.tsx` | couche API fragmentee | erreurs incoherentes et duplication | unifier autour de `http.ts` |
| A11 | Q1 | Frontend/React | `frontend/src/components/dashboard/modules/SolidYieldModuleV2.tsx` | 1575 lignes et 16 `useEffect` | evolution couteuse | decoupage hook + view + export utils |
| A12 | Q1 | Frontend/React | `frontend/src/components/dashboard/modules/sediments/ReachSedimentDashboard.tsx` | logique chart/export/map concentree | maintenance difficile | separer data model et presentation |
| A13 | Q1 | Frontend/State | `frontend/src/contexts/HydroDataContext.tsx` | contexte trop large et fetch direct | etat global fragile | extraire hooks de ressources catalogues |
| A14 | Q1 | Backend/Service | `backend/src/services/hydro.service.ts` | service trop generique | comprehension faible du domaine | scinder en sous-services hydro/bathy/catalog |
| A15 | Q1 | Backend/Service | `backend/src/services/dataScan.service.ts` | 1273 lignes et heuristiques melangees | faible lisibilite | separer summary/detail/metadata |
| A16 | Q1 | Backend/Service | `backend/src/services/hydroSwatSeries.service.ts` | duplication forte avec erosion SWAT | maintenance en double | mutualiser socle commun |
| A17 | Q1 | Backend/Controller | `backend/src/controllers/hydroController.ts` | parsing et erreurs repetes | standardisation difficile | helper controller/validation commun |
| A18 | Q2 | SQL | plusieurs services backend | `SELECT *` restants et grosses requetes inline | rigidite schema et maintenance | expliciter colonnes et sortir requetes |
| A19 | Q2 | Configuration | `app.ts`, `.env.example`, `api/*`, `docker-compose.yml` | defaults disperses | demarrage et comportement moins previsible | centraliser les sources de verite |
| A20 | Q2 | Frontend/UX structure | build frontend | chunks tres lourds | symptome de modularisation inachevee | introduire code-splitting cible apres refactor structurel |

## 35. Decision simple

### Top 10 fichiers a ameliorer

1. `backend/src/services/erosionSwatSeries.service.ts`
2. `frontend/src/components/dashboard/FilterBar.tsx`
3. `frontend/src/components/dashboard/modules/SpatialModule.tsx`
4. `frontend/src/components/map/HydroMap.tsx`
5. `backend/src/services/spatial.service.ts`
6. `backend/src/services/swatIngestion.service.ts`
7. `frontend/src/components/dashboard/modules/SolidYieldModuleV2.tsx`
8. `backend/src/services/dataScan.service.ts`
9. `backend/src/services/hydro.service.ts`
10. `backend/src/routes/catalogAvailability.ts`

### Top 10 fonctions a refactoriser

1. `FilterBar`
2. `OperationalSpatialModule`
3. `SolidYieldModuleV2`
4. `HydroMap`
5. `ReachSedimentDashboard`
6. `TimeSeriesChart`
7. `getSubbasinAvailabilityFromCatalog`
8. `getSubbasinAvailabilityFromMatView`
9. `getProjectHassanAddakhil`
10. `getDataAvailability`

### Top 10 duplications

1. socle SWAT hydro vs erosion
2. wrappers HTTP frontend paralleles
3. `csvEscape` repete
4. `downloadBlob`/Blob CSV repete
5. parsing query/controllers repete
6. logique de fallback schema `relationExists(...)`
7. derivation catalogues frontend
8. gestion d'erreurs frontend service par service
9. conventions API base dupliquees
10. navigation `V2`/layouts partages partiellement

### Top 10 risques de maintenabilite

1. monolithes React critiques
2. service SWAT erosion geant
3. service spatial geant
4. service ingestion SWAT geant
5. route avec SQL/metier embarques
6. typage faible dans la cartographie
7. erreurs silencieuses frontend
8. absence de tests applicatifs
9. lint non operationnel
10. fragmentation de la couche API frontend

### Quick wins

- remettre en etat les scripts lint ;
- supprimer les `catch {}` silencieux ;
- centraliser `API_BASE` et la gestion d'erreurs HTTP ;
- extraire un helper CSV/export unique ;
- documenter les services SWAT/spatial/hydro ;
- remplacer les `SELECT *` les plus simples.

### Ameliorations long terme

- introduire repositories/queries modules ;
- base commune SWAT hydro/erosion ;
- hooks metier React par domaine ;
- injection de dependances minimale backend ;
- suite de tests integration backend + smoke frontend ;
- decoupage cartographie et filtres en sous-modules stables.

## Conclusion

Le projet est stabilise fonctionnellement, mais pas encore stabilise qualitativement.

La priorite n'est pas une re-ecriture globale. La bonne strategie est une reprise progressive en trois vagues:

1. restaurer les garde-fous qualite et traiter les hotspots Q0 ;
2. decouper les gros composants/services Q1 ;
3. mutualiser, typer et documenter.

Le rapport conclut donc a une dette technique importante mais rattrapable, a condition de travailler par lots petits, testes et centres sur les zones critiques identifiees ci-dessus.

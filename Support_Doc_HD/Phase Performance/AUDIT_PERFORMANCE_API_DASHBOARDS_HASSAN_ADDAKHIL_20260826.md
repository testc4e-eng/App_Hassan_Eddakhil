# AUDIT PERFORMANCE API / DASHBOARDS — HASSAN ADDAKHIL

- Date : 2026-08-26
- Base officielle : `hydro_hd`
- Backend ciblé : `http://127.0.0.1:5007`
- Frontend ciblé : `http://127.0.0.1:8090`
- Mode : lecture seule pour l'audit, sans modification de la logique métier ni des données PostgreSQL

## 1. Pré-check

- Backend `5007` : HTTP `200`
- Frontend `8090` : HTTP `200`
- Docker : non vérifiable sur ce poste pendant cette phase
- Baseline métier protégée : conforme
  - `383` timeseries
  - `3 773 400` measurements
  - `75` stations visibles
  - `9` scénarios visibles
  - `19` reaches runtime
  - `19` subbasins runtime

## 2. Mesures API

| Endpoint | Module | Min (s) | Moy. (s) | Max (s) | Payload | HTTP | Classe |
| --- | --- | ---: | ---: | ---: | ---: | --- | --- |
| `/api/v1/hydro/health` | plateforme | 0.120 | 0.120 | 0.120 | 140 B | 200 | API légère |
| `/api/v1/catalog/runs` | dashboard | 0.008 | 0.008 | 0.008 | 1.8 KB | 200 | API légère |
| `/api/v1/catalog/availability?module=hydro` | hydrologie | 0.044 | 0.044 | 0.044 | 23.1 KB | 200 | API légère |
| `/api/v1/catalog/availability?module=climat` | climat | 0.073 | 0.073 | 0.073 | 12.0 KB | 200 | API légère |
| `/api/v1/hydro/swat/summary` | SWAT | 0.010 | 0.010 | 0.010 | 232 B | 200 | API légère |
| `/api/v1/hydro/swat/availability` | SWAT | 0.017 | 0.017 | 0.017 | 156.7 KB | 200 | API légère |
| `/api/v1/spatial/reaches` | spatial | 0.135 | 0.135 | 0.135 | 1.26 MB | 200 | API légère / payload moyen |
| `/api/v1/spatial/subbasins` | spatial | 0.715 | 0.715 | 0.715 | 3.35 MB | 200 | API légère / payload moyen |
| `/api/v1/data-scan/summary` | data scan | 0.003 | 0.003 | 0.003 | 441 B | 200 | API légère |
| `/api/v1/spatial/project-hassan-addakhil` | cartographie | 1.357 | 1.613 | 2.114 | 5.47 MB | 200 | API légère / payload lourd |
| `/api/v1/spatial/stations` | dashboard | 0.004 | 0.005 | 0.008 | 7.7 KB | 200 | API légère |
| `/api/v1/maps/stations-values` | cartographie | 0.002 | 0.003 | 0.004 | 269 B | 200 | API légère |
| `/api/v1/solid-yield/availability` | sédiments | 0.008 | 3.015 | 9.019 | 63.5 KB | 200 | API moyenne à surveiller |
| `/api/v1/data-scan/tables` | data scan | 0.004 | 0.009 | 0.017 | 59.4 KB | 200 | API légère |
| `/api/v1/data-scan/anomalies` | data scan | 0.005 | 0.008 | 0.012 | 54.6 KB | 200 | API légère |
| `/api/v1/data-scan/relations` | data scan | 0.002 | 0.010 | 0.027 | 932 B | 200 | API légère |
| `/api/v1/data-scan/periods/global` | data scan | 0.004 | 0.004 | 0.004 | 12.2 KB | 200 | API légère |

## 3. Points saillants

- Aucune API runtime testée n'est > `5 s` en charge chaude.
- Aucune API runtime testée n'est > `10 s`.
- Le plus gros payload utilisateur mesuré est `/api/v1/spatial/project-hassan-addakhil` avec `5.47 MB`.
- Les endpoints `spatial/reaches` et `spatial/subbasins` sont rapides mais envoient des GeoJSON volumineux.
- `solid-yield/availability` montre une variabilité marquée entre appels, compatible avec un premier calcul coûteux puis cache chaud.

## 4. Monitoring dashboard par dashboard

| Dashboard | Nb appels au chargement | Appels parallèles | Appels séquentiels | Plus lent / plus lourd | Temps total estimé | Statut |
| --- | ---: | --- | --- | --- | --- | --- |
| Dashboard principal | 2 | `catalog/runs` + `spatial/stations` | non | `catalog/runs` | < 1 s | OK |
| Climat | 5 | `catalog/availability`, `catalog/properties`, puis `stats`, `bundle`, `table` après filtres | oui | `bundle/table` selon filtre | < 5 s à chaud | OK |
| Hydrologie | 6 à 7 | idem Climat + comparaison station/simulation | partiel | `bundle/table` ou comparaison scénarios | < 5 s à chaud | OK |
| Sédiments — Transport solide Reach | 2 init + séries à la demande | `spatial/reaches`, puis `spatial/reaches/:id/timeseries` | oui | `reach timeseries` | dépend sélection | OK |
| Sédiments — Dégradation spécifique | 2 init + disponibilité + séries/stats | sous-bassins puis disponibilité puis séries | oui | `solid-yield/availability` | jusqu'à ~9 s au pire à froid | À surveiller |
| Cartographie | 2 | contexte `spatial/stations` + `maps/stations-values` | non | payload projet spatial si bascule projet | < 2 s | OK |
| Analyse spatiale | 5 à 8 | `basins`, `barrages`, `subbasins`, `stations`, `reaches`, `project-hassan-addakhil`, fichiers GeoJSON locaux | oui | `project-hassan-addakhil` (`5.47 MB`) | ~2 à 4 s à chaud | OK |
| SWAT / ingestion | 3 init | `swat/summary`, `swat/batches`, `swat/availability` | non | `swat/availability` | < 1 s hors auth stricte | OK |
| Data Scan | 9 | chargement en `Promise.all(...)` | détail table ensuite | somme des 9 appels, aucun isolément lent | ~1 s à chaud | OK |
| Programme intervention | 0 API | n/a | n/a | aucun | immédiat | OK |
| Admin DB | 1 init + 1 test manuel | non | oui | `admin/db-config/test` manuel | faible | OK |
| Rapports / Exports | 0 API au catalogue | n/a | export manuel ensuite | fichiers statiques / export ciblé | immédiat | OK |

## 5. Appels redondants confirmés

### Cas 1

- Fichier : `frontend/src/components/dashboard/modules/ClimateModule.tsx`
- Composants impliqués : `FilterBar`, `AnalyticsStatsRow`, `TimeSeriesChart`, `AnalyticsDataTable`
- Cause : le dashboard sépare correctement disponibilité, statistiques, courbe et tableau en appels distincts
- Diagnostic : ce n'est pas un doublon fautif, mais une architecture normale
- Correction possible : aucune sans changer la logique ou fusionner des contrats API
- Risque de correction : moyen

### Cas 2

- Fichier : `frontend/src/components/dashboard/modules/HydraulicModule.tsx`
- Composants impliqués : `FilterBar`, `AnalyticsStatsRow`, `TimeSeriesChart` ou `ScenarioComparisonChart`, `AnalyticsDataTable`
- Cause : mêmes données fonctionnelles servies sous formes différentes
- Diagnostic : pas de doublon confirmé à supprimer
- Correction possible : aucune sûre dans cette phase
- Risque : moyen

### Cas 3

- Fichier : `frontend/src/components/dashboard/modules/SpatialModule.tsx`
- Cause : plusieurs useEffect orchestrent les couches spatiales et les modes carte/projet
- Diagnostic : plusieurs fetchs existent, mais ils ciblent des couches différentes ou des vues distinctes
- Correction possible : seulement après instrumentation plus fine en navigateur
- Risque : moyen

## 6. Analyse backend / SQL

- Le backend compresse déjà les réponses HTTP via `compression()`.
- Le backend journalise déjà les requêtes lentes via `DatabaseService` et `SLOW_QUERY_LOG_MS`.
- Les logs montrent surtout des lenteurs au démarrage pendant les warmups, pas pendant l'usage chaud normal.

### Requêtes lentes observées dans les logs de warmup

- comptages sur `access.rch_results`
- comptages sur `access.sub_results`
- requêtes d'availability basées sur `WITH run_map AS (...)`

### Diagnostic

- la plateforme fait un préchauffage agressif au démarrage via `backend/server.ts`
- ces warmups frappent des tables SWAT volumineuses
- l'expérience utilisateur à chaud reste bonne après préchauffage

## 7. Payloads lourds

| Endpoint | Payload | Qualification | Commentaire |
| --- | ---: | --- | --- |
| `/api/v1/spatial/project-hassan-addakhil` | 5.47 MB | lourd | principal candidat si un futur allègement devient nécessaire |
| `/api/v1/spatial/subbasins` | 3.35 MB | moyen | acceptable actuellement |
| `/api/v1/spatial/reaches` | 1.26 MB | moyen | acceptable actuellement |
| `/api/v1/hydro/swat/availability` | 156.7 KB | léger | pas de sujet de payload |

## 8. Cache

### Cache déjà présent

- frontend `timeseriesApi`: cache promesse sur `catalog` et `bundle`
- frontend `spatial.ts`: cache promesse sur couches et timeseries sans `AbortSignal`
- `HydroDataContext`: déduplication des chargements `runs`, `stations`, `availability`, `properties`
- backend : warmup + caches TTL sur plusieurs services SWAT / solid yield / data scan / spatial

### Verdict cache

- le projet dispose déjà d'un filet de cache raisonnable
- aucun nouveau cache n'a été ajouté dans cette phase

## 9. Optimisations appliquées

- Aucune optimisation de code ou SQL appliquée dans cette phase.

### Justification

- aucune API critique `> 10 s` n'a été confirmée côté runtime chaud
- aucune régression fonctionnelle ne devait être risquée pour un gain marginal
- les points sensibles restants demandent soit une vraie instrumentation navigateur, soit une décision produit sur la réduction des payloads spatiaux

## 10. Recommandations pour une phase suivante

1. Instrumenter en navigateur les temps réels de montage de `SpatialModule` pour distinguer cold-start, cache chaud et coût rendu Leaflet.
2. Étudier un mode allégé pour `/api/v1/spatial/project-hassan-addakhil` si la carte projet devient un goulot confirmé côté UX.
3. Étudier la variabilité de `/api/v1/solid-yield/availability` avec traces ciblées avant toute modification.
4. Si besoin, rendre le warmup backend configurable par environnement sans toucher à la logique métier.

## 11. Verdict

- Performance backend à chaud : `OK`
- Performance frontend fonctionnelle : `OK`
- Point à surveiller : `solid-yield/availability`
- Point structurel à surveiller : payload spatial projet
- Régression métier détectée : `NON`

# Analyse et plan d'implémentation — Dashboard carto & améliorations Hassan Addakhil

**Date** : 19 juin 2026  
**Version analysée** : `C:/dev/Barrage-Hassan Dakhil/App_Hassan_Eddakhil_dev_1606` (`origin/dev-16/06/2026`)  
**Objectif** : analyser l'état actuel et proposer un plan d'implémentation pour les exigences métier exprimées en réunion.

---

## 1. Exigences métier récapitulatives

| # | Exigence | Priorité |
|---|---|---|
| 1 | Le dashboard carto doit être le dashboard principal et le 1er dans la barre latérale | Haute |
| 2 | L'affichage par défaut du dash carto doit être le bassin Hassan Addakhil avec zoom sur le bassin | Haute |
| 3 | Renommer la couche "base de données brute" en "bassin ABHGZR" | Haute |
| 4 | Introduire un mode carte thématique : dégradation spécifique par sous-bassin (moyenne/cumul annuel), sédiments sortants par reach, débit simulé par reach | Haute |
| 5 | Corriger le décalage du réseau hydro vers le haut sur l'image satellite | Haute |
| 6 | Supprimer le menu "Apport solide" dans le dashboard érosion, garder seulement "Sédiments" | Moyenne |
| 7 | Ajouter un onglet "Données temps réel" dans le dashboard ingestion, en construction | Moyenne |

---

## 2. État actuel — constats

### 2.1 Dashboard et navigation ✅ déjà en partie correct

- `Dashboard.tsx` ouvre déjà sur `spatial` par défaut (`useState<DashboardSection>("spatial")`).
- `DashboardSidebarV2.tsx` place déjà "Cartographie → Analyse Spatiale" en premier.
- Le mode spatial démarre en `project_hassan_addakhil` avec `PROJECT_BASIN_ID = 1` sélectionné.
- Le bassin projet "Bassin versant du barrage Hassan Addakhil" est présélectionné.

**Mais** :
- `DashboardSidebar.tsx` (ancienne version) est encore présent mais non utilisé → code mort.
- Le changement de section ne met pas à jour l'URL (`?section=`) → impossible de partager un lien direct.
- Le module `maps` existe dans le mapping mais est vide.

### 2.2 Module spatial ✅ fonctionnel mais perfectible

**Fichiers clés** :
- `frontend/src/components/dashboard/modules/SpatialModule.tsx` (1119 lignes)
- `frontend/src/components/map/HydroMap.tsx` (1414 lignes)
- `frontend/src/lib/stationLabels.ts`
- `frontend/src/contexts/HydroDataContext.tsx`

**Modes d'affichage actuels** :
- `project_hassan_addakhil` : filtre sur le bassin ID 1 + barrage Hassan Addakhil.
- `raw_database` : affiche toutes les entités de la BDD.

**Problèmes identifiés** :
- `SpatialModule.tsx` et `HydroMap.tsx` sont très volumineux et monolithiques.
- Beaucoup de `as any` dans `HydroMap.tsx`.
- Centre/zoom codés en dur (`[31.6, -6.9]`, zoom 7) au lieu d'être calculés sur l'emprise du bassin.
- Pane `hruPane` et `subBasinsPane` partagent le même z-index 402.
- `fetchSubbasinHruSummary` existe mais n'est pas utilisé.
- Pas de gestion d'erreur visible pour les chargements de couches.

### 2.3 Labels et alias ✅ nettoyés mais pas uniformisés

- `stationLabels.ts` fournit `formatStationDisplayName` et `formatSubbasinDisplayName`.
- `HydroDataContext.tsx` construit `station_label` pour les stations.
- **Mais** certains composants reconstruisent des labels manuellement :
  - `SpatialInspectorPanel.tsx` L. 141, 156
  - `ModuleSidebar.tsx` affiche `station_name` + `station_code` séparément
  - `FilterBar.tsx` réapplique `cleanStationLabel` sur un label déjà nettoyé

### 2.4 Décalage réseau hydro ⚠️ à investiguer

- Le fond satellite Esri (`World_Imagery`) et les tuiles d'étiquettes sont en Web Mercator.
- Les couches GeoJSON (sous-bassins, reaches, stations) viennent de PostgreSQL/PostGIS en EPSG:4326 converties en GeoJSON.
- **Hypothèses possibles** :
  1. Les géométries source sont en EPSG:32630 et n'ont pas été reprojetées correctement en WGS84.
  2. Les reaches utilisent un autre SRID que les autres couches.
  3. Le pane des étiquettes ou le `offset` des tuiles crée une illusion de décalage.
  4. Les données `gis.reach_shapes` ont un décalage systématique dans la source shapefile.

**Vérification proposée** : comparer dans QGIS les couches `gis.reach_shapes`, `gis.subbasin_shapes` et le fond satellite Esri pour localiser le décalage.

### 2.5 Carte thématique ❌ inexistante

- `/api/v1/maps/stations-values` est **entièrement mocké** (`maps.service.ts`).
- Aucun endpoint ne joint géométrie + résultats simulés.
- Les données existent pourtant en base :
  - Dégradation spécifique : `access.sub_results.syld_t_ha` + `gis.subbasin_shapes`
  - Sédiments sortants : `access.rch_results.sed_out_tons` + `gis.reach_shapes`
  - Débit simulé : `access.rch_results.flow_out_cms` + `gis.reach_shapes`

### 2.6 Module érosion ⚠️ onglet Apport solide à retirer

- `ErosionSedimentsModuleV3.tsx` affiche deux onglets : "Sédiments" et "Apport solide".
- Retirer l'onglet "Apport solide" implique de supprimer le `TabsTrigger solidYield`, le type union, et le rendu conditionnel.
- Il existe aussi `ErosionSedimentsModule.tsx`, `ErosionSedimentsModuleV2.tsx` et `SolidYieldModule.tsx` qui ne sont pas utilisés → code mort.

### 2.7 Module ingestion ⚠️ pas structuré en onglets

- `SimulatedDataModuleV2.tsx` empile verticalement les sections.
- `SimulatedDataModule.tsx` (V1) existe mais n'est pas utilisé → code mort.
- Ajouter un onglet "Données temps réel" nécessite d'introduire un composant `Tabs`.

### 2.8 Backend — dette technique

- `timeseries.service.ts` fait 522 lignes et duplique la logique legacy/hydro/erosion.
- `app.ts` embarque des origines CORS dev en dur.
- `server.ts` et `app.ts` montent `/api/v1/maps` (corrigé dans dev_1606 d'après l'audit).
- Pas de service dédié à la cartographie thématique.
- `advancedSpatial.service.ts` dépend du filesystem et de `ogr2ogr`.

### 2.9 Base de données — opportunités

- Vues matérialisées existantes : `api.mv_subbasin_catalog`, `api.mv_reach_catalog`, `api.mv_solid_yield_timeseries`, `api.mv_hydro_station_timeseries`.
- `core.subbasins` et `core.reaches` sont vides ; privilégier `gis.subbasin_shapes` et `gis.reach_shapes`.
- `core.station_subbasin_map` est créée par le backend, non présente dans les scripts SQL de recreation.

---

## 3. Plan d'implémentation

### Lot 1 — Corrections rapides frontend (1-2 jours)

#### 1.1 Dashboard et navigation
- [ ] Supprimer `DashboardSidebar.tsx` (code mort).
- [ ] Synchroniser l'URL avec la section active (`?section=`) dans `Dashboard.tsx` / `DashboardSidebarV2.tsx`.
- [ ] Vérifier que `spatial` reste le module par défaut.

#### 1.2 Renommage couche "base de données brute"
- [ ] Dans `SpatialModule.tsx`, remplacer le label de `raw_database` par "bassin ABHGZR" (i18n `fr.json` / `en.json`).

#### 1.3 Zoom par défaut sur le bassin Hassan Addakhil
- [ ] Calculer l'emprise du bassin projet à partir des données chargées (`AutoMapView` ou useMemo).
- [ ] Utiliser `fitBounds` au chargement initial avec `padding` et `maxZoom`.
- [ ] Conserver le centre/zoom hardcodés comme fallback uniquement.

#### 1.4 Uniformisation des labels
- [ ] Utiliser `station_label` partout (`ModuleSidebar.tsx`, `SpatialInspectorPanel.tsx`).
- [ ] Ajouter `subbasin_label` dans `HydroDataContext.tsx` pour les sous-bassins.
- [ ] Supprimer les reconstructions manuelles `"${code} - ${name}"`.

#### 1.5 Module érosion
- [ ] Dans `ErosionSedimentsModuleV3.tsx`, supprimer l'onglet "Apport solide".
- [ ] Supprimer les imports de `SolidYieldModuleV2` si non utilisés ailleurs.
- [ ] Nettoyer `ErosionSedimentsModule.tsx`, `ErosionSedimentsModuleV2.tsx`, `SolidYieldModule.tsx`.
- [ ] Mettre à jour `fr.json` / `en.json`.

#### 1.6 Module ingestion
- [ ] Refactoriser `SimulatedDataModuleV2.tsx` avec un composant `Tabs`.
- [ ] Créer `RealtimeDataModule.tsx` (placeholder "en construction").
- [ ] Ajouter l'onglet "Données temps réel".
- [ ] Supprimer `SimulatedDataModule.tsx` (V1).

### Lot 2 — Cartographie thématique backend (2-3 jours)

#### 2.1 Nouveau service `thematicMaps.service.ts`
Créer un service qui expose :
- `getSubbasinThematicData(variable, runId, startDate, endDate, agg)`
- `getReachThematicData(variable, runId, startDate, endDate, agg)`
- `getThematicVariables()`
- `getThematicScenarios()`
- `getThematicDateRange(entityType, variable, runId)`

Variables supportées initialement :
| Entité | Variable | Source | Colonne | Agrégation |
|---|---|---|---|---|
| Sub-bassin | Dégradation spécifique | `access.sub_results` | `syld_t_ha` | AVG, SUM |
| Reach | Sédiments sortants | `access.rch_results` | `sed_out_tons` | AVG, SUM |
| Reach | Débit simulé | `access.rch_results` | `flow_out_cms` | AVG, MAX |

#### 2.2 Nouveaux endpoints
- [ ] `GET /api/v1/maps/thematic/subbasins`
- [ ] `GET /api/v1/maps/thematic/reaches`
- [ ] `GET /api/v1/maps/thematic/variables`
- [ ] `GET /api/v1/maps/thematic/scenarios`
- [ ] `GET /api/v1/maps/thematic/date-range`

Format de réponse : GeoJSON FeatureCollection avec `properties.value`, `properties.valueMin`, `properties.valueMax`, etc.

#### 2.3 Remplacer le mock `MapsService`
- [ ] Brancher `maps.service.ts` sur `thematicMaps.service.ts`.
- [ ] Conserver temporairement `GET /maps/stations-values` si utilisé par le front, ou le déprécier.

#### 2.4 Vues matérialisées d'agrégation (optionnel mais recommandé)
- [ ] Créer `api.mv_thematic_subbasin_annual`.
- [ ] Créer `api.mv_thematic_reach_annual`.
- [ ] Ajouter les scripts dans `backend/sql/` ou `database/migrations/`.

### Lot 3 — Cartographie thématique frontend (2-3 jours)

#### 3.1 Panneau de contrôle thématique
- [ ] Ajouter dans `SpatialModule.tsx` un mode "Thématique" aux côtés de "Projet" et "Brut".
- [ ] Sélecteurs : entité (sous-bassin / reach), variable, scénario, année, type d'agrégation (moyenne / cumul).
- [ ] Légende colorimétrique dynamique (chloroplethe pour sous-bassins, couleur de ligne pour reaches).

#### 3.2 Affichage des couches thématiques
- [ ] Sous-bassins : colorer les polygones selon `syld_t_ha` (échelle Jaune → Rouge par exemple).
- [ ] Reaches : colorer les lignes selon `sed_out_tons` ou `flow_out_cms`.
- [ ] Utiliser `L.geoJSON` avec `style` fonction de la valeur.

#### 3.3 Interactions
- [ ] Tooltip au survol affichant nom + valeur.
- [ ] Clic sur entité : zoom + détail dans le panneau latéral.

### Lot 4 — Décalage réseau hydro (1-2 jours)

#### 4.1 Diagnostic
- [ ] Exporter `gis.reach_shapes`, `gis.subbasin_shapes` et le fond satellite dans QGIS.
- [ ] Vérifier le SRID de chaque couche.
- [ ] Mesurer le décalage en mètres.

#### 4.2 Correction
- [ ] Si les reaches sont en EPSG:32630 : reprojeter en WGS84 lors de l'insertion.
- [ ] Si la source shapefile est décalée : corriger la source et réimporter.
- [ ] Ajouter un script de vérification de cohérence spatiale.

### Lot 5 — Refactoring et dette technique (2-3 jours)

#### 5.1 Backend
- [ ] Extraire la CTE `station_catalog` commune dans un helper SQL.
- [ ] Fusionner `getLegacyBundle` et `aggregate` dans `timeseries.service.ts`.
- [ ] Externaliser les origines CORS dans `.env`.
- [ ] Supprimer la redondance `/api/v1/scan` vs `/api/v1/data-scan`.

#### 5.2 Frontend
- [ ] Découper `SpatialModule.tsx` en hooks/sous-composants.
- [ ] Découper `HydroMap.tsx` (couches, contrôles, popups).
- [ ] Réduire les `as any`.
- [ ] Activer `strict: true` progressivement.

### Lot 6 — Tests et validation (1-2 jours)

#### 6.1 Tests manuels
- [ ] Build backend et frontend OK.
- [ ] Docker compose up OK.
- [ ] Dashboard s'ouvre sur Analyse Spatiale.
- [ ] Bassin Hassan Addakhil centré et zoomé.
- [ ] Couche "bassin ABHGZR" correctement nommée.
- [ ] Carte thématique affiche les valeurs avec légende.
- [ ] Module érosion n'a plus l'onglet Apport solide.
- [ ] Module ingestion a l'onglet Données temps réel en construction.

#### 6.2 Tests automatisés (base)
- [ ] Ajouter Vitest/Jest backend pour `thematicMaps.service.ts`.
- [ ] Ajouter tests composants frontend critiques (optionnel).

---

## 4. Risques et points d'attention

| Risque | Mitigation |
|---|---|
| Données `access.sub_results` / `access.rch_results` volumineuses | Utiliser des vues matérialisées et indexer `sub_code`, `scenario_code`, `period_date`. |
| Incohérence SRID / décalage réseau | Diagnostic QGIS avant correction ; ne pas modifier les données sans validation. |
| `core.subbasins` vide | Toujours privilégier `gis.subbasin_shapes` pour la cartographie. |
| Module spatial déjà très gros | Refactoriser progressivement, en extrayant d'abord le panneau thématique. |
| Breaking change pour l'API maps existante | Garder `GET /maps/stations-values` temporairement ou versionner `/maps/v2/thematic`. |

---

## 5. Estimation globale

| Lot | Durée estimée |
|---|---|
| Lot 1 — Corrections rapides frontend | 1-2 jours |
| Lot 2 — Cartographie thématique backend | 2-3 jours |
| Lot 3 — Cartographie thématique frontend | 2-3 jours |
| Lot 4 — Décalage réseau hydro | 1-2 jours |
| Lot 5 — Refactoring dette technique | 2-3 jours |
| Lot 6 — Tests et validation | 1-2 jours |
| **Total** | **9-15 jours** |

---

## 6. Prochaine action recommandée

Commencer par le **Lot 1** (corrections rapides frontend) car il répond immédiatement à plusieurs exigences métier sans dépendance backend. En parallèle, préparer le **Lot 2** (backend thématique) qui est le plus gros morceau technique.

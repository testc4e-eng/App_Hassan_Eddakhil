# Notes de démonstration — Branche `dev/ilh-0107-demo-client`

**Date** : 2026-07-06  
**Objectif** : Préparer une démonstration client à distance en intégrant les nouveaux dashboards de `origin/dev_ilh_0107_livraison_it_light` tout en préservant la base stabilisée.

---

## Résumé des opérations

1. **Backup DB** : `backups/hydro_hd_0607.dump` (702 MB)
2. **Branche créée** : `dev/ilh-0107-demo-client` à partir de `dev/ilh-0107-stabilized`
3. **Intégration sélective** des apports de `origin/dev_ilh_0107_livraison_it_light`
4. **Build validé** : backend + frontend
5. **Stack Docker redémarrée** : DB `5436`, backend `5007`, frontend `8090`
6. **Données DB complétées** : création des tables `hydro.bathymetry_campaigns` et `hydro.siltation_*` + insertion des campagnes bathymétriques

---

## Décisions de merge

### Fichiers / fonctionnalités intégrées depuis la livraison

- Nouveaux modules frontend :
  - `BathymetryRecap.tsx`
  - `RecapitulatifEnvasement.tsx`
  - `ReportsModule.tsx` (réécrit pour afficher PDF et cartes thématiques)
  - `SpatialInspectorPanel.tsx`
  - `StationSimulationComparison.tsx`
  - `DataManagementModule.tsx` et sous-pages d'ingestion
  - Composants `sediments/` : `ReachSedimentDashboard`, `ReachStaticMapDialog`, etc.
  - Composants `reports/` : `AssetPreviewModal`, `LazyImage`, `ThematicMapCard`
- Assets statiques :
  - Cartes thématiques dans `public/data/hassan/report-maps/`
  - Cartes de dégradation spécifique dans `public/data/hassan/degradation-maps/`
  - Rapports PDF dans `public/data/hassan/reports/`
  - Logos `logo.png`, `logo2.png`
- Améliorations UI :
  - `Dashboard.tsx`, `DashboardSidebarV2.tsx`, `Navbar.tsx`, `Home.tsx`
  - `HydraulicModule.tsx`, `ClimateModule.tsx`, `AnalyticsStatsRow.tsx`
  - `FilterBar.tsx`, `AnalyticsFilterPanel.tsx`, `ModuleSidebar.tsx`
  - `index.css`, traductions `i18n/fr.json` et `i18n/en.json`
- Constantes utilitaires :
  - `scenarioColors.ts`, `reachStaticMap.ts`, `specificDegradationThematicMaps.ts`

### Fichiers / fonctionnalités préservées de la branche stabilisée

- Structure `hydro_Hassan dakhil/backend` + `hydro_Hassan dakhil/frontend`
- `docker-compose.yml`, Dockerfiles, configuration DB
- Ports : `5436`, `5007`, `8090`
- Routes cartes thématiques : `/api/v1/maps/thematic/subbasins`, `/api/v1/maps/thematic/reaches`
- Page admin DB config : `/admin/database`
- Composants cartes thématiques : `ThematicSubbasinPanel`, `ThematicReachPanel`, `ThematicLegend`, `ThematicSubbasinLayer`, `ThematicReachLayer`
- Scripts d'ingestion SWAT : `fast_ingest_scenarios.py`, `sync_core_manual.py`, etc.
- Référentiel `core.swat_entity_map` corrigé à **19 SUB / 19 RCH**

### Fichiers restaurés à la version stabilisée

- `hydro_Hassan dakhil/backend/src/app.ts`
- `hydro_Hassan dakhil/backend/src/services/access.service.ts`
- `hydro_Hassan dakhil/frontend/src/App.tsx`
- `hydro_Hassan dakhil/frontend/src/components/admin/AdminLayout.tsx`
- `hydro_Hassan dakhil/frontend/src/pages/AdminDashboard.tsx`
- `hydro_Hassan dakhil/frontend/src/components/map/HydroMap.tsx`
- `hydro_Hassan dakhil/frontend/src/components/dashboard/modules/SpatialModule.tsx`
- Dockerfiles, `nginx.conf`, fichiers SQL LFS

### Correction apportée manuellement

- Création de `hydro_Hassan dakhil/frontend/src/data/specificDegradationThematicMaps.ts` (fichier source manquant dans la livraison) pour alimenter la section "Cartes thématiques de dégradation spécifique".

---

## Validation DB

```sql
SELECT entity_type, COUNT(DISTINCT swat_code) AS nb_entities, MAX(swat_code) AS max_code
FROM core.swat_entity_map
WHERE is_active
GROUP BY entity_type;
```

Résultat :

| entity_type | nb_entities | max_code |
|-------------|-------------|----------|
| rch         | 19          | 19       |
| sub         | 19          | 19       |

✅ Référentiel SWAT conforme.

---

## Tests fonctionnels réalisés

| Module | Statut | Notes |
|--------|--------|-------|
| Page d'accueil | ✅ | Nouvelle présentation statique |
| Analyse Spatiale | ✅ | Carte + cartes thématiques 19 sous-bassins / 19 reaches |
| Suivi Hydrologique | ✅ | Scénarios reboisement affichés, comparaison observé/simulé |
| Sédiments | ✅ | Envasement, HSV, mini-carte après création tables `hydro.*` |
| Rapport & Carte | ✅ | 2 rapports PDF + 11 cartes thématiques |
| Gestion de données | ✅ | KPI ingestion, modules d'ingestion |

Captures d'écran : voir `demo_*.png` dans ce dossier.

---

## Points de vigilance pour la démo

1. **Route `/scenarios`** : retourne toujours 404 (page non implémentée). Utiliser le dashboard pour naviguer entre les scénarios.
2. **Données siltation** : les tables `hydro.siltation_indicators`, `hydro.siltation_hsv`, `hydro.siltation_evolution` sont créées mais vides. Seule la section "Récapitulatif d'Envasement" dispose de données (campagnes bathymétriques).
3. **Performance** : le bundle frontend fait ~810 kB ; le build génère un avertissement de chunk > 500 kB mais fonctionne.
4. **Git LFS** : les fichiers SQL trackés par LFS (`940_*`, `941_*`, `950_*`) ont été laissés inchangés via `git update-index --assume-unchanged` pour éviter les conflits de pointeurs.

---

## Commandes utiles

```bash
# Lancer la stack
cd "C:/dev/Barrage-Hassan Dakhil/Hassan Addakhil/App_Hassan_Eddakhil-dev_ilh_0107"
docker compose up -d

# URLs
Frontend : http://127.0.0.1:8090
Backend  : http://127.0.0.1:5007
DB       : localhost:5436
```

---

## Livrables

- `backups/hydro_hd_0607.dump`
- Branche `dev/ilh-0107-demo-client`
- `AUDIT_GOUVERNANCE_DONNEES/DEMO_0607_NOTES.md`
- Captures d'écran `demo_*.png`

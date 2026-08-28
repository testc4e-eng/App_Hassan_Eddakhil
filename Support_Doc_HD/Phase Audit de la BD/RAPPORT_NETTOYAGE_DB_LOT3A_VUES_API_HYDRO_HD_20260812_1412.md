# RAPPORT NETTOYAGE DB LOT 3A — VUES API ISOLÉES — `hydro_hd`

- **Date / heure** : 2026-08-12 ~14:12
- **Référence validation** : `VALIDATION_LOT3_VUES_MATVIEWS_HYDRO_HD_20260812_1248.md`
- **Base** : `hydro_hd`
- **CASCADE** : **NON**
- **Tables / vues protégées touchées** : **NON**

---

## 1. Pré-check

| Contrôle | Résultat |
| --- | --- |
| Backend `5007` health | HTTP **200** |
| Frontend `8090` | HTTP **200** |
| Database | `hydro_hd` |
| Timeseries | **383** |
| Measurements | **3 773 400** |
| Stations visibles | **75** |
| Scénarios | **9** |
| Reaches / subbasins | **19 / 19** |

Références backend/scripts des 14 objets : **0**.  
Dépendants SQL (vues / matviews / fonctions) : **0**.

---

## 2. DDL backup

Dossier : `backups/lot3_views_20260812_1248/`

- `api_views.sql` : 13 890 octets — 12 `CREATE VIEW` des objets ciblés présents
- `materialized_views.sql` : 3 633 octets — 2 `CREATE MATERIALIZED VIEW` présentes

**DDL backup : OK**

---

## 3. Baseline avant

Fichiers : `backups/lot3a_drop_20260812/LOT3A_DROP_PRECHECK.json` (+ `.md`)

Compare vs post-LOT 2B : **WARNING** (hash `spatial_reaches`, `data_scan_periods_global`). **0 REGRESSION.** Compteurs métier identiques.

---

## 4. Suppression

Transaction unique, **sans CASCADE** : **COMMIT**.

Objets supprimés :

- `api.mv_dashboard_catchment_counts`
- `api.mv_dashboard_reservoir_counts`
- `api.v_catalog_scenarios`
- `api.v_catalog_series`
- `api.v_compare_monthly`
- `api.v_dashboard_national_counts`
- `api.v_erosion_subbasins_annual`
- `api.v_map_catchments_annual`
- `api.v_map_stations_latest`
- `api.v_measurements_annual_agg`
- `api.v_measurements_daily`
- `api.v_measurements_monthly_agg`
- `api.v_qc_property_domain_tovalidate`
- `api.v_series_stats`

---

## 5. Post-check

Les 14 objets : `to_regclass` = **NULL**.

Toujours présents :

- `api.mv_scenario_catalog`
- `api.v_catalog_properties`
- `api.v_catalog_stations`
- `api.v_timeseries_enriched`
- `api.v_measurements_annual`
- `api.v_measurements_latest`
- `api.v_measurements_monthly`
- `api.v_dashboard_catchment_counts`
- `api.v_dashboard_reservoir_counts`

Invariants : 383 / 3 773 400 / 75 / 9 / 19 / 19.

---

## 6. Tests API

Tous HTTP **200** : health, catalog/runs (9), availability hydro/climat, swat/summary, spatial reaches/subbasins (19/19), data-scan/summary, frontend 8090.

---

## 7. Checks code

| Cible | Résultat |
| --- | --- |
| Backend `npm run check` | **OK** (exit 0, 29 tests) |
| Frontend `npm run check` | **OK** (exit 0, 16 tests, 34 warnings déjà connus) |

---

## 8. Baseline après

Fichiers : `backups/lot3a_drop_20260812/LOT3A_DROP_POSTCHECK.json` (+ `.md`)

Compare POST vs PRE LOT 3A : **WARNING**

```
OK: scenarios / runtime_reaches / runtime_subbasins / stations / timeseries / rch / sub / layers
WARNING: api:data_scan_summary (hash)
WARNING: api:data_scan_periods_global (hash)
```

**REGRESSION : aucune**

Le hash `data_scan_summary` change de façon **attendue** : Data Scan recense les vues, et 14 objets API ont disparu. Compteurs métier inchangés.

---

## 9. Synthèse

Objets supprimés :  
14 (2 matviews + 12 views) — liste §4

DDL backup :  
**OK**

CASCADE :  
**NON**

Tables/vues protégées touchées :  
**NON**

Timeseries : **383**  
Measurements : **3773400**  
Stations : **75**  
Scénarios : **9**  
Reaches runtime : **19**  
Subbasins runtime : **19**

Backend : **OK**  
Frontend : **OK**  
Baseline : **WARNING** (hash uniquement)  
Régression fonctionnelle : **NON**

---

## 10. Point d’arrêt

LOT 3A terminé.

Non commencé :

- LOT 3B public stats/values
- audit QC
- geo views
- staging
- old_hd
- auth

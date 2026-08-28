# RAPPORT NETTOYAGE DB LOT 2B — OBJETS LEGACY — `hydro_hd`

- **Date / heure** : 2026-08-12 ~13:25
- **Référence validation** : `VALIDATION_FINALE_LOT2B_OBJETS_LEGACY_HYDRO_HD_20260812_1156.md`
- **Base** : `hydro_hd` (`localhost:5432`, même instance que `host.docker.internal:5432`)
- **CASCADE** : **NON**
- **PostgreSQL modifié** : **OUI** (5 `DROP TABLE` uniquement)
- **Tables protégées touchées** : **NON**

---

## 1. Pré-check

| Contrôle | Résultat |
| --- | --- |
| Backend `http://127.0.0.1:5007/api/v1/hydro/health` | HTTP **200**, `database=connected` |
| Frontend `http://127.0.0.1:8090` | HTTP **200** |
| Database | `hydro_hd` |
| `core.timeseries` | **383** |
| `core.measurements` | **3 773 400** |
| Stations visibles | **75** |
| Scénarios `/catalog/runs` | **9** |
| `gis.reach_shapes` | **19** |
| `gis.subbasin_shapes` | **19** |

Environnement **GO**.

---

## 2. Dumps

Dossier : `backups/lot2_legacy_20260811_1241/`

| Dump | Taille | `pg_restore --list` |
| --- | ---: | --- |
| `audit.gis_reach_shapes_backup_2026.dump` | 558 522 | OK |
| `audit.gis_subbasin_shapes_backup_2026.dump` | 809 343 | OK |
| `audit.nv_limite.dump` | 1 834 993 | OK |
| `audit.swat_entity_map_backup_2026.dump` | 2 560 | OK |
| `gis.reach_shapes_backup_20260422_144537.dump` | 558 905 | OK |

**Dumps : OK**

---

## 3. Revalidation live avant DROP

Pour les 5 objets :

- références backend / scripts (hors backups, archive, Support_Doc_HD, md) : **0**
- FK entrantes / sortantes : **0**
- vues / matviews dépendantes : **0**
- triggers métier : **0**
- fonctions dépendantes : **0**

Seuls objets attachés (droppés avec la table) : toast, type composite, et pour `nv_limite` PK + gist + séquence `nv_limite_ogc_fid_seq`.

---

## 4. Baseline avant

Fichiers :

- `backups/lot2b_drop_20260812/LOT2B_DROP_PRECHECK.json`
- `backups/lot2b_drop_20260812/LOT2B_DROP_PRECHECK.md`

Compare vs validation post-LOT2B (`LOT2B_POSTCHECK_BASELINE.json`) :

- **8 OK** (scénarios, reaches, subbasins, stations, timeseries, SWAT rch/sub, layers)
- **2 WARNING** hash déjà connus : `spatial_reaches`, `data_scan_periods_global`
- **0 REGRESSION**

Volumes : 383 / 3 773 400 / 75 / 9 / 19 / 19.

La REGRESSION historique DQ6-A `catalog_runs` 9 ≠ 17 n’est **pas** une nouvelle régression (compare ici vs état courant validé, déjà à 9).

---

## 5. Suppression

Transaction unique, **sans CASCADE** :

```sql
BEGIN;
DROP TABLE audit.gis_reach_shapes_backup_2026;
DROP TABLE audit.gis_subbasin_shapes_backup_2026;
DROP TABLE audit.nv_limite;
DROP TABLE audit.swat_entity_map_backup_2026;
DROP TABLE gis.reach_shapes_backup_20260422_144537;
COMMIT;
```

Résultat : **COMMIT**. Aucune erreur. Pas de `ROLLBACK`.

---

## 6. Post-check SQL

`to_regclass(...)` des 5 objets : **NULL** (absents).

Toujours présents :

| Objet | Constat |
| --- | --- |
| `core.reaches` | présent, **33** |
| `core.subbasins` | présent, **33** |
| `core.swat_entity_map` | présent, **38** |
| `gis.reach_shapes` | présent, **19** |
| `gis.subbasin_shapes` | présent, **19** |
| `gis.meteo_stations` | présent |
| `audit.swat_output_archive_rch` | présent, 345 510 |
| `audit.swat_output_archive_sub` | présent, 345 510 |

---

## 7. Données protégées après

| Indicateur | Valeur |
| --- | ---: |
| Timeseries | **383** |
| Measurements | **3 773 400** |
| Stations | **75** |
| Scénarios | **9** |
| Reaches runtime | **19** |
| Subbasins runtime | **19** |
| Core reaches | **33** |
| Core subbasins | **33** |
| SWAT entity map | **38** |

Aucune baisse.

---

## 8. Tests API

| Endpoint | Statut |
| --- | --- |
| `GET /api/v1/hydro/health` | **200** |
| `GET /api/v1/catalog/runs` | **200**, count **9** |
| `GET /api/v1/catalog/availability?module=hydro` | **200**, count 45 |
| `GET /api/v1/catalog/availability?module=climat` | **200**, count 30 |
| `GET /api/v1/hydro/swat/summary` | **200** |
| `GET /api/v1/spatial/reaches` | **200**, **19** features |
| `GET /api/v1/spatial/subbasins` | **200**, **19** features |
| `GET /api/v1/data-scan/summary` | **200** |
| Frontend `http://127.0.0.1:8090` | **200** |

Tous fonctionnels.

---

## 9. Checks code

| Cible | Commande | Résultat |
| --- | --- | --- |
| Backend | `npm run check` | **OK** (exit 0) — type-check, lint, 29 tests / 10 fichiers, build |
| Frontend | `npm run check` | **OK** (exit 0) — type-check, lint 0 erreur / 34 warnings déjà connus, 16 tests, build |

---

## 10. Baseline après

Fichiers :

- `backups/lot2b_drop_20260812/LOT2B_DROP_POSTCHECK.json`
- `backups/lot2b_drop_20260812/LOT2B_DROP_POSTCHECK.md`

Compare **POST vs PRE LOT 2B DROP** :

```
OK: scenarios
OK: runtime_reaches
OK: runtime_subbasins
OK: stations
OK: timeseries
OK: rch
OK: sub
OK: layers
WARNING: api:spatial_reaches (hash)
WARNING: api:data_scan_summary (hash)
WARNING: api:data_scan_periods_global (hash)
```

**COMPARE STATUS : WARNING**  
**REGRESSION : aucune**  
**Régression fonctionnelle : NON**

Les WARNING sont des hash de payload. Compteurs protégés identiques.  
`data_scan_summary` change de hash de façon **attendue** : l’inventaire Data Scan recense les tables, et 5 tables legacy ont disparu. Ce n’est pas une perte métier (timeseries, stations, scénarios, GIS runtime inchangés).

---

## 11. Synthèse demandée

Tables supprimées :

- `audit.gis_reach_shapes_backup_2026`
- `audit.gis_subbasin_shapes_backup_2026`
- `audit.nv_limite`
- `audit.swat_entity_map_backup_2026`
- `gis.reach_shapes_backup_20260422_144537`

Dumps :  
**OK**

CASCADE :  
**NON**

Tables protégées touchées :  
**NON**

Timeseries :  
**383**

Measurements :  
**3773400**

Stations :  
**75**

Scénarios :  
**9**

Reaches runtime :  
**19**

Subbasins runtime :  
**19**

Core reaches :  
**33**

Core subbasins :  
**33**

SWAT entity map :  
**38**

Backend :  
**OK**

Frontend :  
**OK**

Baseline :  
**WARNING** (hash uniquement, compteurs identiques)

Régression fonctionnelle :  
**NON**

---

## 12. Point d’arrêt

LOT 2B terminé.

Non commencé :

- staging
- vues
- old_hd
- auth

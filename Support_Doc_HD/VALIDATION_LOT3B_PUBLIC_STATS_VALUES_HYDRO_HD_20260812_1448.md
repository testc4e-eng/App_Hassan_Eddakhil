# VALIDATION LOT 3B — VUES PUBLIC STATS / VALUES — `hydro_hd`

- **Date / heure** : 2026-08-12 14:48
- **Référence LOT 3A** : `RAPPORT_NETTOYAGE_DB_LOT3A_VUES_API_HYDRO_HD_20260812_1412.md`
- **Mode** : validation seule
- **PostgreSQL modifié** : **NON**
- **DROP** : **NON**

Point d’arrêt : aucun DROP. Attente de validation avant exécution.

---

## 0. Méthode

1. Inventaire live `pg_depend` / `pg_rewrite` sur `public.v_stats_%` et `public.v_values_%`.
2. Recherche code : `backend/src`, `frontend/src`, `scripts`, `tests`, `docker`, `backend/sql`.
3. Confirmation DDL `backups/lot3_views_20260812_1248/public_legacy_views.sql` + export ciblé.
4. Baseline vs post-LOT 3A. Aucune écriture DB.

Classification :

| Code | Sens |
| --- | --- |
| **A** | Conserver (hors périmètre de suppression ou runtime) |
| **C** | Supprimable feuille (0 dépendant, DROP sans CASCADE) |
| **D** | Supprimable seulement après ses dépendants |
| **E** | À validation manuelle |

---

## 1. Pré-check

| Contrôle | Résultat |
| --- | --- |
| Backend `5007` health | HTTP **200** |
| Frontend `8090` | HTTP **200** |
| `/catalog/runs` | **9** |
| Database | `hydro_hd` |
| Timeseries | **383** |
| Measurements | **3 773 400** |
| Stations visibles | **75** |
| Reaches / subbasins | **19 / 19** |

---

## 2. Backup DDL

`backups/lot3_views_20260812_1248/public_legacy_views.sql` : **OK** (44 976 octets).

- 26 `CREATE VIEW public.v_stats_*`
- 34 `CREATE VIEW public.v_values_*` (hors `v_values_bathymetry`, volontairement non dumpé dans ce fichier legacy)

Export complémentaire :

`backups/lot3b_stats_values_20260812_1348/`

| Fichier | Contenu |
| --- | --- |
| `stats_views.sql` | 26 vues stats, 0 DROP |
| `values_views.sql` | 34 vues values (sans bathymetry), 0 DROP |
| `README.txt` | périmètre |
| `LOT3B_DEPENDENCIES.json` | graphe live |
| `LOT3B_PRECHECK.json` / `.md` | baseline |

Aucune vue du périmètre manquante dans les backups.

---

## 3. Recherche code

| Zone | `v_stats_*` | `v_values_*` hors bathymetry | `v_values_bathymetry` |
| --- | --- | --- | --- |
| `backend/src` | **0** | **0** | **OUI** — `hydro.service.ts` L319–334 |
| `frontend/src` | 0 | 0 | 0 |
| `scripts/` (actifs) | 0 | 0 | 0 |
| `backend/tests` | 0 | 0 | 0 |
| `docker/` | 0 | 0 | 0 |
| `backend/sql` | 0 | 0 | 0 |

Seule occurrence `v_values_*` dans le code actif : la vue **protégée** `public.v_values_bathymetry`.

Des scripts **archivés** (`archive/scripts/MIGRATION_ABHGZR_TO_HYDRO_HD/05_load_sql/06_refresh_public_value_views.sql`) recréent historiquement les feuilles values. Ils ne sont pas dans le runtime. Risque : relancer cette archive recréerait les vues. **Ne pas les exécuter** lors du futur DROP.

---

## 4. Graphe STATS (live)

```
public.v_stats_property_station_timestep
  ├─ v_stats_evaporation
  ├─ v_stats_humidity
  ├─ v_stats_lachers
  ├─ v_stats_precipitation
  ├─ v_stats_sediment_load
  ├─ v_stats_streamflow
  ├─ v_stats_temperature_all
  ├─ v_stats_temperature_max
  ├─ v_stats_temperature_mean
  ├─ v_stats_temperature_min
  └─ v_stats_wind_speed

public.v_stats_property_timestep
  ├─ v_stats_evaporation_global
  ├─ v_stats_humidity_global
  ├─ v_stats_lachers_global
  ├─ v_stats_precipitation_global
  ├─ v_stats_sediment_load_global
  ├─ v_stats_streamflow_global
  ├─ v_stats_temperature_all_global
  ├─ v_stats_temperature_max_global
  ├─ v_stats_temperature_mean_global
  ├─ v_stats_temperature_min_global
  └─ v_stats_wind_speed_global

Hors hub (feuilles isolées) :
  v_stats_bathymetry          → core.reservoir_bathymetry, core.reservoirs
  v_stats_bathymetry_global   → core.reservoir_bathymetry
```

`v_stats_bathymetry*` **ne dépend pas** de `v_values_bathymetry` et **n’est pas** utilisée par le runtime.

Ordre futur (sans CASCADE) :

1. 11 feuilles station + 11 feuilles global + 2 bathymétrie stats
2. `v_stats_property_station_timestep`
3. `v_stats_property_timestep`

---

## 5. Graphe VALUES (live)

`public.v_values_bathymetry` : **hors graphe**. Sources = `core.catchments`, `core.reservoir_bathymetry`, `core.reservoirs`. **0** lien vers les hubs values.

```
public.v_values_measurements
  ├─ public.v_values_annual
  │    ├─ v_values_evaporation_annual
  │    ├─ v_values_humidity_annual
  │    ├─ v_values_lachers_annual
  │    ├─ v_values_precipitation_annual
  │    ├─ v_values_sediment_load_annual
  │    ├─ v_values_streamflow_annual
  │    ├─ v_values_temperature_max_annual
  │    ├─ v_values_temperature_mean_annual
  │    ├─ v_values_temperature_min_annual
  │    └─ v_values_wind_speed_annual
  ├─ public.v_values_monthly
  │    ├─ v_values_evaporation_monthly
  │    ├─ v_values_humidity_monthly
  │    ├─ v_values_lachers_monthly
  │    ├─ v_values_precipitation_monthly
  │    ├─ v_values_sediment_load_monthly
  │    ├─ v_values_streamflow_monthly
  │    ├─ v_values_temperature_max_monthly
  │    ├─ v_values_temperature_mean_monthly
  │    ├─ v_values_temperature_min_monthly
  │    └─ v_values_wind_speed_monthly
  └─ feuilles obs
       ├─ v_values_evaporation_obs
       ├─ v_values_humidity_obs
       ├─ v_values_lachers_obs
       ├─ v_values_precipitation_obs
       ├─ v_values_sediment_load_obs
       ├─ v_values_streamflow_obs
       ├─ v_values_temperature_all_obs
       ├─ v_values_temperature_max_obs
       ├─ v_values_temperature_mean_obs
       ├─ v_values_temperature_min_obs
       └─ v_values_wind_speed_obs
```

Feuilles annual : **10**  
Feuilles monthly : **10**  
Feuilles obs : **11**

Ordre futur :

1. 31 feuilles annual / monthly / obs
2. `v_values_annual`, `v_values_monthly`
3. `v_values_measurements`

**Jamais** `v_values_bathymetry`.

---

## 6. Tableau de classification

RUNTIME = usage backend actuel. Type C = feuille, D = hub.

### Stats

| Vue | Runtime | Dépendants | Type | Décision | Risque |
| --- | --- | ---: | --- | --- | --- |
| `public.v_stats_property_station_timestep` | NON | 11 | hub | **D** | CASCADE si DROP trop tôt |
| `public.v_stats_property_timestep` | NON | 11 | hub | **D** | Idem |
| `public.v_stats_evaporation` | NON | 0 | feuille | **C** | Faible |
| `public.v_stats_humidity` | NON | 0 | feuille | **C** | Faible |
| `public.v_stats_lachers` | NON | 0 | feuille | **C** | Faible |
| `public.v_stats_precipitation` | NON | 0 | feuille | **C** | Faible |
| `public.v_stats_sediment_load` | NON | 0 | feuille | **C** | Faible |
| `public.v_stats_streamflow` | NON | 0 | feuille | **C** | Faible |
| `public.v_stats_temperature_all` | NON | 0 | feuille | **C** | Faible |
| `public.v_stats_temperature_max` | NON | 0 | feuille | **C** | Faible |
| `public.v_stats_temperature_mean` | NON | 0 | feuille | **C** | Faible |
| `public.v_stats_temperature_min` | NON | 0 | feuille | **C** | Faible |
| `public.v_stats_wind_speed` | NON | 0 | feuille | **C** | Faible |
| `public.v_stats_evaporation_global` | NON | 0 | feuille | **C** | Faible |
| `public.v_stats_humidity_global` | NON | 0 | feuille | **C** | Faible |
| `public.v_stats_lachers_global` | NON | 0 | feuille | **C** | Faible |
| `public.v_stats_precipitation_global` | NON | 0 | feuille | **C** | Faible |
| `public.v_stats_sediment_load_global` | NON | 0 | feuille | **C** | Faible |
| `public.v_stats_streamflow_global` | NON | 0 | feuille | **C** | Faible |
| `public.v_stats_temperature_all_global` | NON | 0 | feuille | **C** | Faible |
| `public.v_stats_temperature_max_global` | NON | 0 | feuille | **C** | Faible |
| `public.v_stats_temperature_mean_global` | NON | 0 | feuille | **C** | Faible |
| `public.v_stats_temperature_min_global` | NON | 0 | feuille | **C** | Faible |
| `public.v_stats_wind_speed_global` | NON | 0 | feuille | **C** | Faible |
| `public.v_stats_bathymetry` | NON | 0 | isolée | **C** | Distincte de `v_values_bathymetry` |
| `public.v_stats_bathymetry_global` | NON | 0 | isolée | **C** | Distincte de `v_values_bathymetry` |

### Values

| Vue | Runtime | Dépendants | Type | Décision | Risque |
| --- | --- | ---: | --- | --- | --- |
| `public.v_values_bathymetry` | **OUI** | 0 | protégée | **A** | `hydro.service.ts` — **NE PAS DROPPER** |
| `public.v_values_measurements` | NON | 13 | hub | **D** | CASCADE si trop tôt |
| `public.v_values_annual` | NON | 10 | hub | **D** | |
| `public.v_values_monthly` | NON | 10 | hub | **D** | |
| `public.v_values_evaporation_annual` | NON | 0 | feuille | **C** | Faible |
| `public.v_values_humidity_annual` | NON | 0 | feuille | **C** | Faible |
| `public.v_values_lachers_annual` | NON | 0 | feuille | **C** | Faible |
| `public.v_values_precipitation_annual` | NON | 0 | feuille | **C** | Faible |
| `public.v_values_sediment_load_annual` | NON | 0 | feuille | **C** | Faible |
| `public.v_values_streamflow_annual` | NON | 0 | feuille | **C** | Faible |
| `public.v_values_temperature_max_annual` | NON | 0 | feuille | **C** | Faible |
| `public.v_values_temperature_mean_annual` | NON | 0 | feuille | **C** | Faible |
| `public.v_values_temperature_min_annual` | NON | 0 | feuille | **C** | Faible |
| `public.v_values_wind_speed_annual` | NON | 0 | feuille | **C** | Faible |
| `public.v_values_evaporation_monthly` | NON | 0 | feuille | **C** | Faible |
| `public.v_values_humidity_monthly` | NON | 0 | feuille | **C** | Faible |
| `public.v_values_lachers_monthly` | NON | 0 | feuille | **C** | Faible |
| `public.v_values_precipitation_monthly` | NON | 0 | feuille | **C** | Faible |
| `public.v_values_sediment_load_monthly` | NON | 0 | feuille | **C** | Faible |
| `public.v_values_streamflow_monthly` | NON | 0 | feuille | **C** | Faible |
| `public.v_values_temperature_max_monthly` | NON | 0 | feuille | **C** | Faible |
| `public.v_values_temperature_mean_monthly` | NON | 0 | feuille | **C** | Faible |
| `public.v_values_temperature_min_monthly` | NON | 0 | feuille | **C** | Faible |
| `public.v_values_wind_speed_monthly` | NON | 0 | feuille | **C** | Faible |
| `public.v_values_evaporation_obs` | NON | 0 | feuille | **C** | Faible |
| `public.v_values_humidity_obs` | NON | 0 | feuille | **C** | Faible |
| `public.v_values_lachers_obs` | NON | 0 | feuille | **C** | Faible |
| `public.v_values_precipitation_obs` | NON | 0 | feuille | **C** | Faible |
| `public.v_values_sediment_load_obs` | NON | 0 | feuille | **C** | Faible |
| `public.v_values_streamflow_obs` | NON | 0 | feuille | **C** | Faible |
| `public.v_values_temperature_all_obs` | NON | 0 | feuille | **C** | Faible |
| `public.v_values_temperature_max_obs` | NON | 0 | feuille | **C** | Faible |
| `public.v_values_temperature_mean_obs` | NON | 0 | feuille | **C** | Faible |
| `public.v_values_temperature_min_obs` | NON | 0 | feuille | **C** | Faible |
| `public.v_values_wind_speed_obs` | NON | 0 | feuille | **C** | Faible |

**E : aucune** dans ce périmètre (graphe clair, 0 usage runtime hors bathymetry).

---

## 7. Plan SQL futur — **NE PAS EXÉCUTER**

Transaction unique envisagée, **sans CASCADE**. Si une erreur : `ROLLBACK`.

```sql
BEGIN;

-- Étape 1 — feuilles stats (24)
DROP VIEW public.v_stats_evaporation;
DROP VIEW public.v_stats_humidity;
DROP VIEW public.v_stats_lachers;
DROP VIEW public.v_stats_precipitation;
DROP VIEW public.v_stats_sediment_load;
DROP VIEW public.v_stats_streamflow;
DROP VIEW public.v_stats_temperature_all;
DROP VIEW public.v_stats_temperature_max;
DROP VIEW public.v_stats_temperature_mean;
DROP VIEW public.v_stats_temperature_min;
DROP VIEW public.v_stats_wind_speed;
DROP VIEW public.v_stats_evaporation_global;
DROP VIEW public.v_stats_humidity_global;
DROP VIEW public.v_stats_lachers_global;
DROP VIEW public.v_stats_precipitation_global;
DROP VIEW public.v_stats_sediment_load_global;
DROP VIEW public.v_stats_streamflow_global;
DROP VIEW public.v_stats_temperature_all_global;
DROP VIEW public.v_stats_temperature_max_global;
DROP VIEW public.v_stats_temperature_mean_global;
DROP VIEW public.v_stats_temperature_min_global;
DROP VIEW public.v_stats_wind_speed_global;
DROP VIEW public.v_stats_bathymetry;
DROP VIEW public.v_stats_bathymetry_global;

-- Étape 2 — hubs stats
DROP VIEW public.v_stats_property_station_timestep;
DROP VIEW public.v_stats_property_timestep;

-- Étape 3 — feuilles values annual / monthly / obs (31)
DROP VIEW public.v_values_evaporation_annual;
DROP VIEW public.v_values_humidity_annual;
DROP VIEW public.v_values_lachers_annual;
DROP VIEW public.v_values_precipitation_annual;
DROP VIEW public.v_values_sediment_load_annual;
DROP VIEW public.v_values_streamflow_annual;
DROP VIEW public.v_values_temperature_max_annual;
DROP VIEW public.v_values_temperature_mean_annual;
DROP VIEW public.v_values_temperature_min_annual;
DROP VIEW public.v_values_wind_speed_annual;
DROP VIEW public.v_values_evaporation_monthly;
DROP VIEW public.v_values_humidity_monthly;
DROP VIEW public.v_values_lachers_monthly;
DROP VIEW public.v_values_precipitation_monthly;
DROP VIEW public.v_values_sediment_load_monthly;
DROP VIEW public.v_values_streamflow_monthly;
DROP VIEW public.v_values_temperature_max_monthly;
DROP VIEW public.v_values_temperature_mean_monthly;
DROP VIEW public.v_values_temperature_min_monthly;
DROP VIEW public.v_values_wind_speed_monthly;
DROP VIEW public.v_values_evaporation_obs;
DROP VIEW public.v_values_humidity_obs;
DROP VIEW public.v_values_lachers_obs;
DROP VIEW public.v_values_precipitation_obs;
DROP VIEW public.v_values_sediment_load_obs;
DROP VIEW public.v_values_streamflow_obs;
DROP VIEW public.v_values_temperature_all_obs;
DROP VIEW public.v_values_temperature_max_obs;
DROP VIEW public.v_values_temperature_mean_obs;
DROP VIEW public.v_values_temperature_min_obs;
DROP VIEW public.v_values_wind_speed_obs;

-- Étape 4
DROP VIEW public.v_values_annual;
DROP VIEW public.v_values_monthly;

-- Étape 5
DROP VIEW public.v_values_measurements;

COMMIT;
```

**Interdit dans ce script :** `DROP VIEW public.v_values_bathymetry;`  
**Interdit :** `CASCADE`

Total prévu : **26 stats + 34 values = 60** vues.  
Conservée : `public.v_values_bathymetry`.

---

## 8. Baseline

Fichiers : `backups/lot3b_stats_values_20260812_1348/LOT3B_PRECHECK.json` (+ `.md`)

Compare vs post-LOT 3A : **WARNING** (hash `spatial_reaches`, `data_scan_periods_global`). Compteurs **19/19** et **5/5** inchangés.

**0 REGRESSION.**  
383 / 3 773 400 / 75 / 9 / 19 / 19.

---

## 9. Synthèse

VUES STATS SUPPRIMABLES :

- 24 feuilles + 2 isolées bathymétrie stats (**C**)
- 2 hubs `v_stats_property_station_timestep`, `v_stats_property_timestep` (**D**, après les feuilles)

VUES VALUES SUPPRIMABLES :

- 10 annual + 10 monthly + 11 obs (**C**)
- `v_values_annual`, `v_values_monthly` (**D**)
- `v_values_measurements` (**D**, en dernier)

VUES À CONSERVER :

- `public.v_values_bathymetry` (**A**)
- tout le reste hors périmètre (catalogue, wrappers runtime, geo, audit QC, etc.)

ORDRE SQL :

1. feuilles stats  
2. hubs stats  
3. feuilles values  
4. `v_values_annual` / `v_values_monthly`  
5. `v_values_measurements`

POSTGRESQL MODIFIÉ :  
**NON**

BASELINE :  
**WARNING** (hash déjà connus) — pas de régression

---

## 10. Point d’arrêt

Aucun DROP.  
Pas de LOT 3B exécution.  
Pas d’audit QC / geo / staging / old_hd / auth.

Attente de validation utilisateur avant exécution du SQL §7.

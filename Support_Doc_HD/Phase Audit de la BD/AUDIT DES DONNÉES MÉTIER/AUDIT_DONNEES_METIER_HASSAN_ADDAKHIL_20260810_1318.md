# AUDIT DES DONNÉES MÉTIER — PROJET HASSAN ADDAKHIL

Rapport généré le **2026-08-10** à **13:18** en **lecture seule** sur `hydro_hd`.

Aucune donnée n’a été modifiée. Aucun `UPDATE`, `DELETE`, `INSERT`, `ALTER`, `DROP`, migration, FK ou index n’a été exécuté.

## 1. Résumé exécutif

- La base auditée reste `hydro_hd` avec host logique application `host.docker.internal:5432` ; l’audit SQL a été exécuté en lecture seule via `localhost:5432` sur la même instance locale.
- Les domaines les plus sains sont `core.timeseries`, `core.measurements`, `ref.observed_properties`, `hydro.bathymetry_campaigns` et `core.reservoir_bathymetry`.
- Les anomalies les plus structurantes portent sur les scénarios SWAT, la cohérence `access ↔ core`, la faible cohérence `core ↔ gis` pour les couches spatiales, et les champs reach directement NULL dans `access.rch_results`.
- Le module siltation fonctionne en partie sur calcul dynamique depuis `hydro.bathymetry_campaigns` et `core.reservoir_bathymetry`, mais `hydro.siltation_evolution` reste vide alors que le service legacy demeure actif.

## 2. Base auditée

- Database : `hydro_hd`
- Host logique application : `host.docker.internal`
- Port : `5432`
- User : `postgres`
- PostgreSQL : `PostgreSQL 17.8 on x86_64-windows, compiled by msvc-19.44.35222, 64-bit`
- PostGIS : `3.5 USE_GEOS=1 USE_PROJ=1 USE_STATS=1`
- Taille base : `5379 MB`

## 3. Volumes principaux

| Objet | Lignes |
|---|---|
| access.rch_results | 3 637 835 |
| access.sub_results | 3 637 835 |
| core.measurements | 3 773 400 |
| core.stations | 102 |
| core.timeseries | 383 |
| gis.meteo_stations | 5 |
| hydro.bathymetry_campaigns | 6 |
| hydro.siltation_evolution | 0 |
| hydro.siltation_hsv | 0 |
| hydro.siltation_indicators | 0 |
| public.stations | 102 |
| staging.norm_stations | 105 |

## 4. Stations

| Table | Lignes | IDs uniques | Codes uniques | Geom NULL |
|---|---|---|---|---|
| core.stations | 102 | 102 | 102 | 68 |
| gis.meteo_stations | 5 | 5 | 5 | 0 |
| staging.norm_stations | 105 | — | 35 | 3 |
| public.stations | 102 | 102 | 102 | 68 |

| Problème | Table | Nb groupes | Nb lignes | Exemple | Gravité |
|---|---|---|---|---|---|
| coordonnées NULL | core.stations | 68 | 68 | errachidia_se | DQ1 |
| présente dans core, absente de gis | core→gis | 97 | 97 | 10:aghbalou_n_kerdous | DQ1 |
| station_code dupliqué en staging | staging.norm_stations | 35 | 105 | 1508/38 | DQ1 |

| Core | GIS | IDs communs | Manquants dans GIS | Manquants dans Core | Géométries différentes |
|---|---|---|---|---|---|
| 102 | 5 | 5 | 97 | 0 | 5 |

## 5. Propriétés / variables

| property_id | Nom | Unité | Domaine | Nb séries | Nb mesures | Statut |
|---|---|---|---|---|---|---|
| 21 | Temperature Mean | degC | CLIMATE | 9 | 44 444 | ACTIVE |
| 22 | Temperature Min | degC | CLIMATE | 10 | 45 138 | ACTIVE |
| 23 | Wind Speed | m/s | CLIMATE | 2 | 364 | ACTIVE |
| 24 | Temperature Max | degC | CLIMATE | 10 | 45 235 | ACTIVE |
| 25 | Reservoir Inflow | m3 | RESERVOIR | 1 | 19 861 | ACTIVE |
| 26 | Streamflow | m3/s | HYDROLOGY | 5 | 77 950 | ACTIVE |
| 27 | Reservoir Restitution | m3 | RESERVOIR | 1 | 6 132 | ACTIVE |
| 28 | Evaporation | mm | CLIMATE | 6 | 2 031 | ACTIVE |
| 29 | Precipitation | mm | CLIMATE | 8 | 107 627 | ACTIVE |
| 30 | Humidity Relative | % | CLIMATE | 4 | 928 | ACTIVE |
| 31 | SWAT Débits m³/s | m3/s | — | 109 | 1 141 230 | SANS DOMAINE |
| 32 | SWAT Sediment (t) | tons | — | 109 | 1 141 230 | SANS DOMAINE |
| 33 | SWAT Dégradation spécifique (t/ha) | t/ha | — | 109 | 1 141 230 | SANS DOMAINE |

- `access.variable_dictionary` : **0** ligne(s).
- Propriétés sans domaine : **3**.
- Propriétés actives dans `public.module_properties` mais sans données : **0**.

## 6. Scénarios

| Code scénario | Table | Nb lignes | Run ID | Source | Conclusion |
|---|---|---|---|---|---|
| etat_actuel | access.import_runs | 15 | — | daily/hru, daily/rch, daily/scenario_metadata, daily/sub, daily/weather, monthly/hru, monthly/rch, monthly/scenario_metadata, monthly/sub, monthly/weather, yearly/hru, yearly/rch, yearly/scenario_metadata, yearly/sub, yearly/weather | présent dans access seulement |
| scenario_1 | access.import_runs | 10 | — | ?/?, yearly/hru, yearly/rch, yearly/scenario_metadata, yearly/sub, yearly/weather | actif |
| scenario_2 | access.import_runs | 6 | — | ?/?, yearly/hru, yearly/rch, yearly/scenario_metadata, yearly/sub, yearly/weather | actif |
| scenario_3 | access.import_runs | 6 | — | ?/?, yearly/hru, yearly/rch, yearly/scenario_metadata, yearly/sub, yearly/weather | actif |
| scenario_4 | access.import_runs | 6 | — | ?/?, yearly/hru, yearly/rch, yearly/scenario_metadata, yearly/sub, yearly/weather | actif |
| ssp126 | access.import_runs | 15 | — | daily/hru, daily/rch, daily/scenario_metadata, daily/sub, daily/weather, monthly/hru, monthly/rch, monthly/scenario_metadata, monthly/sub, monthly/weather, yearly/hru, yearly/rch, yearly/scenario_metadata, yearly/sub, yearly/weather | présent dans access seulement |
| ssp245 | access.import_runs | 15 | — | daily/hru, daily/rch, daily/scenario_metadata, daily/sub, daily/weather, monthly/hru, monthly/rch, monthly/scenario_metadata, monthly/sub, monthly/weather, yearly/hru, yearly/rch, yearly/scenario_metadata, yearly/sub, yearly/weather | présent dans access seulement |
| ssp585 | access.import_runs | 15 | — | daily/hru, daily/rch, daily/scenario_metadata, daily/sub, daily/weather, monthly/hru, monthly/rch, monthly/scenario_metadata, monthly/sub, monthly/weather, yearly/hru, yearly/rch, yearly/scenario_metadata, yearly/sub, yearly/weather | présent dans access seulement |
| SWAT_OUTPUT | access.import_runs | 2 | — | ?/? | code batch/import technique |
| etat_actuel | access.rch_results | 596 790 | — | 1995-01-01 → 2023-08-31 | présent dans access seulement |
| scenario_1 | access.rch_results | 199 481 | — | 1995-01-01 → 2023-08-31 | actif |
| scenario_2 | access.rch_results | 199 481 | — | 1995-01-01 → 2023-08-31 | actif |
| scenario_3 | access.rch_results | 199 481 | — | 1995-01-01 → 2023-08-31 | actif |
| scenario_4 | access.rch_results | 199 481 | — | 1995-01-01 → 2023-08-31 | actif |
| ssp126 | access.rch_results | 747 707 | — | 1995-01-01 → 2059-12-31 | présent dans access seulement |
| ssp245 | access.rch_results | 747 707 | — | 1995-01-01 → 2059-12-31 | présent dans access seulement |
| ssp585 | access.rch_results | 747 707 | — | 1995-01-01 → 2059-12-31 | présent dans access seulement |
| etat_actuel | access.scenario_metadata | 1 518 | — | 1900-01-01 → 1900-01-01 | présent dans access seulement |
| scenario_1 | access.scenario_metadata | 552 | — | 1900-01-01 → 1900-01-01 | actif |
| scenario_2 | access.scenario_metadata | 558 | — | 1900-01-01 → 1900-01-01 | actif |
| scenario_3 | access.scenario_metadata | 560 | — | 1900-01-01 → 1900-01-01 | actif |
| scenario_4 | access.scenario_metadata | 506 | — | 1900-01-01 → 1900-01-01 | actif |
| ssp126 | access.scenario_metadata | 1 518 | — | 1900-01-01 → 1900-01-01 | présent dans access seulement |
| ssp245 | access.scenario_metadata | 1 518 | — | 1900-01-01 → 1900-01-01 | présent dans access seulement |
| ssp585 | access.scenario_metadata | 1 518 | — | 1900-01-01 → 1900-01-01 | présent dans access seulement |
| etat_actuel | access.sub_results | 596 790 | — | 1995-01-01 → 2023-08-31 | présent dans access seulement |
| scenario_1 | access.sub_results | 199 481 | — | 1995-01-01 → 2023-08-31 | actif |
| scenario_2 | access.sub_results | 199 481 | — | 1995-01-01 → 2023-08-31 | actif |
| scenario_3 | access.sub_results | 199 481 | — | 1995-01-01 → 2023-08-31 | actif |
| scenario_4 | access.sub_results | 199 481 | — | 1995-01-01 → 2023-08-31 | actif |
| ssp126 | access.sub_results | 747 707 | — | 1995-01-01 → 2059-12-31 | présent dans access seulement |
| ssp245 | access.sub_results | 747 707 | — | 1995-01-01 → 2059-12-31 | présent dans access seulement |
| ssp585 | access.sub_results | 747 707 | — | 1995-01-01 → 2059-12-31 | présent dans access seulement |
| SWAT_OUTPUT | core.data_batches | 1 | 2 | SWAT_MANUAL_20260422_02 | code batch/import technique |
| OBSERVED | core.measurements | 349 710 | 1 | 1965-03-03 → 2025-10-15 | actif |
| scenario_1 | core.measurements | 596 790 | 7 | 1994-12-31 → 2023-08-30 | actif |
| scenario_2 | core.measurements | 596 790 | 8 | 1994-12-31 → 2023-08-30 | actif |
| scenario_3 | core.measurements | 596 790 | 9 | 1994-12-31 → 2023-08-30 | actif |
| scenario_4 | core.measurements | 596 790 | 10 | 1994-12-31 → 2023-08-30 | actif |
| SWAT_OUTPUT_01 | core.measurements | 1 036 530 | 2 | 1994-12-31 → 2023-08-30 | même scénario technique que SWAT_OUTPUT mais côté core |
| etat_actuel | core.model_runs | 1 | 3 | Etat actuel | actif |
| OBSERVED | core.model_runs | 1 | 1 | Observed | actif |
| scenario_1 | core.model_runs | 1 | 7 | Scénario 1 reboisement | actif |
| scenario_2 | core.model_runs | 1 | 8 | Scénario 2 reboisement | actif |
| scenario_3 | core.model_runs | 1 | 9 | Scénario 3 reboisement | actif |
| scenario_4 | core.model_runs | 1 | 10 | Scénario 4 reboisement | actif |
| ssp126 | core.model_runs | 1 | 4 | SSP126 | actif |
| ssp245 | core.model_runs | 1 | 5 | SSP245 | actif |
| ssp585 | core.model_runs | 1 | 6 | SSP585 | actif |
| SWAT_OUTPUT_01 | core.model_runs | 1 | 2 | SWAT simulated run 01 | même scénario technique que SWAT_OUTPUT mais côté core |
| OBSERVED | core.timeseries | 56 | 1 | daily/observed, monthly/observed | actif |
| scenario_1 | core.timeseries | 57 | 7 | daily/simulated | actif |
| scenario_2 | core.timeseries | 57 | 8 | daily/simulated | actif |
| scenario_3 | core.timeseries | 57 | 9 | daily/simulated | actif |
| scenario_4 | core.timeseries | 57 | 10 | daily/simulated | actif |
| SWAT_OUTPUT_01 | core.timeseries | 99 | 2 | daily/simulated | même scénario technique que SWAT_OUTPUT mais côté core |

- SWAT_OUTPUT apparaît dans access.import_runs et core.data_batches, alors que SWAT_OUTPUT_01 apparaît dans core.model_runs, core.timeseries et core.measurements.
- etat_actuel, ssp126, ssp245 et ssp585 existent dans access.* mais aucune série core simulée correspondante n’a été trouvée.
- scenario_1 à scenario_4 existent à la fois dans access.* et dans core.timeseries/core.measurements.

### Focus SWAT_OUTPUT vs SWAT_OUTPUT_01

| Code scénario | Table | Nb lignes | Run ID | Source / batch | Conclusion |
|---|---|---|---|---|---|
| SWAT_OUTPUT | access.import_runs | 2 | — | ? / batch ? | imports techniques SWAT côté access |
| SWAT_OUTPUT | core.data_batches | 1 | 2 | SWAT_MANUAL_20260422_02 / SWATOutput.mdb | batch core de chargement manuel |
| SWAT_OUTPUT_01 | core.measurements | 1 036 530 | 2 | 1994-12-31 → 2023-08-30 | mesures simulées exposées par la plateforme |
| SWAT_OUTPUT_01 | core.model_runs | 1 | 2 | SWAT simulated run 01 | run simulé canonique côté core |
| SWAT_OUTPUT_01 | core.timeseries | 99 | 2 | daily/simulated | séries simulées exposées par la plateforme |

- Conclusion métier : `SWAT_OUTPUT` correspond à la couche import/batch technique, alors que `SWAT_OUTPUT_01` est le nom canonique du run simulé exposé dans `core.*`. Cela ressemble à un **renommage / nommage incohérent lors du passage import -> core**, pas à deux scénarios métier distincts.

## 7. Séries temporelles

- Doublons sur la clé métier `(station_id, property_id, run_id, source_type, time_step)` : **0** groupe(s).
- Séries sans station : **0** ; sans propriété : **0** ; sans run : **0**.
- Incohérences `source_type` vs `is_observed` : observé mismatched **0**, simulé mismatched **0**.

| ts_id | Station | Propriété | Run | Time step | Nb mesures | Statut |
|---|---|---|---|---|---|---|
| 113 | 1940/48 | Precipitation | OBSERVED | daily | 15 736 | OK |
| 114 | 867/48 | Streamflow | OBSERVED | daily | 16 544 | OK |
| 115 | 1508/38 | Streamflow | OBSERVED | daily | 17 897 | OK |
| 116 | 31/38 | Precipitation | OBSERVED | daily | 15 706 | OK |
| 117 | 1940/48 | Temperature Mean | OBSERVED | monthly | 249 | OK |
| 118 | pont_arfoud | Temperature Min | OBSERVED | monthly | 480 | OK |
| 119 | taouz | Temperature Min | OBSERVED | monthly | 507 | OK |
| 120 | 867/48 | Wind Speed | OBSERVED | monthly | 342 | OK |
| 121 | 1940/48 | Temperature Max | OBSERVED | monthly | 400 | OK |
| 122 | 1585/38 | Precipitation | OBSERVED | daily | 15 706 | OK |
| 123 | 867/48 | Temperature Min | OBSERVED | monthly | 362 | OK |
| 124 | RES_1940/48 | Reservoir Inflow | OBSERVED | daily | 19 861 | OK |
| 125 | RES_1940/48 | Reservoir Restitution | OBSERVED | daily | 6 132 | OK |
| 126 | pont_arfoud | Evaporation | OBSERVED | monthly | 501 | OK |
| 127 | pont_arfoud | Humidity Relative | OBSERVED | monthly | 338 | OK |
| 128 | 1508/38 | Temperature Mean | OBSERVED | daily | 8 766 | OK |
| 129 | 867/48 | Temperature Mean | OBSERVED | daily | 8 766 | OK |
| 130 | hammat_my_ali_cherif | Temperature Max | OBSERVED | monthly | 22 | OK |
| 131 | 1585/38 | Temperature Min | OBSERVED | daily | 8 766 | OK |
| 132 | hammat_my_ali_cherif | Temperature Mean | OBSERVED | monthly | 21 | OK |
| 133 | 867/48 | Evaporation | OBSERVED | monthly | 419 | OK |
| 134 | 1508/38 | Evaporation | OBSERVED | monthly | 122 | OK |
| 135 | 1940/48 | Temperature Min | OBSERVED | daily | 8 400 | OK |
| 136 | 1508/38 | Temperature Max | OBSERVED | daily | 8 766 | OK |
| 137 | 867/48 | Temperature Max | OBSERVED | daily | 8 766 | OK |
| 138 | taouz | Evaporation | OBSERVED | monthly | 505 | OK |
| 139 | taouz | Humidity Relative | OBSERVED | monthly | 336 | OK |
| 140 | 31/38 | Temperature Min | OBSERVED | daily | 8 766 | OK |
| 141 | hammat_my_ali_cherif | Precipitation | OBSERVED | daily | 884 | OK |
| 142 | taouz | Temperature Max | OBSERVED | monthly | 504 | OK |
| 143 | pont_arfoud | Precipitation | OBSERVED | daily | 15 706 | OK |
| 144 | 1940/48 | Temperature Min | OBSERVED | monthly | 305 | OK |
| 145 | pont_arfoud | Temperature Mean | OBSERVED | monthly | 334 | OK |
| 146 | 867/48 | Temperature Max | OBSERVED | monthly | 385 | OK |
| 147 | 1585/38 | Streamflow | OBSERVED | daily | 13 879 | OK |
| 148 | taouz | Temperature Mean | OBSERVED | monthly | 376 | OK |
| 149 | 1508/38 | Precipitation | OBSERVED | daily | 15 341 | OK |
| 150 | 867/48 | Precipitation | OBSERVED | daily | 12 842 | OK |
| 151 | 1940/48 | Streamflow | OBSERVED | daily | 8 400 | OK |
| 152 | hammat_my_ali_cherif | Evaporation | OBSERVED | monthly | 29 | OK |
| 153 | hammat_my_ali_cherif | Humidity Relative | OBSERVED | monthly | 22 | OK |
| 154 | 31/38 | Streamflow | OBSERVED | daily | 21 230 | OK |
| 155 | pont_arfoud | Temperature Max | OBSERVED | monthly | 460 | OK |
| 156 | taouz | Precipitation | OBSERVED | daily | 15 706 | OK |
| 157 | 1940/48 | Temperature Max | OBSERVED | daily | 8 400 | OK |
| 158 | 1508/38 | Temperature Min | OBSERVED | daily | 8 766 | OK |
| 159 | 1940/48 | Humidity Relative | OBSERVED | monthly | 232 | OK |
| 160 | 867/48 | Temperature Min | OBSERVED | daily | 8 766 | OK |
| 161 | 1940/48 | Evaporation | OBSERVED | monthly | 455 | OK |
| 162 | 1585/38 | Temperature Mean | OBSERVED | daily | 8 766 | OK |
| 163 | 31/38 | Temperature Max | OBSERVED | daily | 8 766 | OK |
| 164 | 1940/48 | Temperature Mean | OBSERVED | daily | 8 400 | OK |
| 165 | hammat_my_ali_cherif | Temperature Min | OBSERVED | monthly | 20 | OK |
| 166 | hammat_my_ali_cherif | Wind Speed | OBSERVED | monthly | 22 | OK |
| 167 | 31/38 | Temperature Mean | OBSERVED | daily | 8 766 | OK |
| 168 | 1585/38 | Temperature Max | OBSERVED | daily | 8 766 | OK |
| 169 | swat_rch_1 | SWAT Débits m³/s | SWAT_OUTPUT_01 | daily | 10 470 | OK |
| 170 | swat_rch_1 | SWAT Sediment (t) | SWAT_OUTPUT_01 | daily | 10 470 | OK |
| 171 | swat_rch_10 | SWAT Débits m³/s | SWAT_OUTPUT_01 | daily | 10 470 | OK |
| 172 | swat_rch_10 | SWAT Sediment (t) | SWAT_OUTPUT_01 | daily | 10 470 | OK |
| 173 | swat_rch_11 | SWAT Débits m³/s | SWAT_OUTPUT_01 | daily | 10 470 | OK |
| 174 | swat_rch_11 | SWAT Sediment (t) | SWAT_OUTPUT_01 | daily | 10 470 | OK |
| 175 | swat_rch_12 | SWAT Débits m³/s | SWAT_OUTPUT_01 | daily | 10 470 | OK |
| 176 | swat_rch_12 | SWAT Sediment (t) | SWAT_OUTPUT_01 | daily | 10 470 | OK |
| 177 | swat_rch_13 | SWAT Débits m³/s | SWAT_OUTPUT_01 | daily | 10 470 | OK |
| 178 | swat_rch_13 | SWAT Sediment (t) | SWAT_OUTPUT_01 | daily | 10 470 | OK |
| 179 | swat_rch_14 | SWAT Débits m³/s | SWAT_OUTPUT_01 | daily | 10 470 | OK |
| 180 | swat_rch_14 | SWAT Sediment (t) | SWAT_OUTPUT_01 | daily | 10 470 | OK |
| 181 | swat_rch_15 | SWAT Débits m³/s | SWAT_OUTPUT_01 | daily | 10 470 | OK |
| 182 | swat_rch_15 | SWAT Sediment (t) | SWAT_OUTPUT_01 | daily | 10 470 | OK |
| 183 | swat_rch_16 | SWAT Débits m³/s | SWAT_OUTPUT_01 | daily | 10 470 | OK |
| 184 | swat_rch_16 | SWAT Sediment (t) | SWAT_OUTPUT_01 | daily | 10 470 | OK |
| 185 | swat_rch_17 | SWAT Débits m³/s | SWAT_OUTPUT_01 | daily | 10 470 | OK |
| 186 | swat_rch_17 | SWAT Sediment (t) | SWAT_OUTPUT_01 | daily | 10 470 | OK |
| 187 | swat_rch_18 | SWAT Débits m³/s | SWAT_OUTPUT_01 | daily | 10 470 | OK |
| 188 | swat_rch_18 | SWAT Sediment (t) | SWAT_OUTPUT_01 | daily | 10 470 | OK |
| 189 | swat_rch_19 | SWAT Débits m³/s | SWAT_OUTPUT_01 | daily | 10 470 | OK |
| 190 | swat_rch_19 | SWAT Sediment (t) | SWAT_OUTPUT_01 | daily | 10 470 | OK |
| 191 | swat_rch_2 | SWAT Débits m³/s | SWAT_OUTPUT_01 | daily | 10 470 | OK |
| 192 | swat_rch_2 | SWAT Sediment (t) | SWAT_OUTPUT_01 | daily | 10 470 | OK |
| 193 | swat_rch_20 | SWAT Débits m³/s | SWAT_OUTPUT_01 | daily | 10 470 | OK |
| 194 | swat_rch_20 | SWAT Sediment (t) | SWAT_OUTPUT_01 | daily | 10 470 | OK |
| 195 | swat_rch_21 | SWAT Débits m³/s | SWAT_OUTPUT_01 | daily | 10 470 | OK |
| 196 | swat_rch_21 | SWAT Sediment (t) | SWAT_OUTPUT_01 | daily | 10 470 | OK |
| 197 | swat_rch_22 | SWAT Débits m³/s | SWAT_OUTPUT_01 | daily | 10 470 | OK |
| 198 | swat_rch_22 | SWAT Sediment (t) | SWAT_OUTPUT_01 | daily | 10 470 | OK |
| 199 | swat_rch_23 | SWAT Débits m³/s | SWAT_OUTPUT_01 | daily | 10 470 | OK |
| 200 | swat_rch_23 | SWAT Sediment (t) | SWAT_OUTPUT_01 | daily | 10 470 | OK |
| 201 | swat_rch_24 | SWAT Débits m³/s | SWAT_OUTPUT_01 | daily | 10 470 | OK |
| 202 | swat_rch_24 | SWAT Sediment (t) | SWAT_OUTPUT_01 | daily | 10 470 | OK |
| 203 | swat_rch_25 | SWAT Débits m³/s | SWAT_OUTPUT_01 | daily | 10 470 | OK |
| 204 | swat_rch_25 | SWAT Sediment (t) | SWAT_OUTPUT_01 | daily | 10 470 | OK |
| 205 | swat_rch_26 | SWAT Débits m³/s | SWAT_OUTPUT_01 | daily | 10 470 | OK |
| 206 | swat_rch_26 | SWAT Sediment (t) | SWAT_OUTPUT_01 | daily | 10 470 | OK |
| 207 | swat_rch_27 | SWAT Débits m³/s | SWAT_OUTPUT_01 | daily | 10 470 | OK |
| 208 | swat_rch_27 | SWAT Sediment (t) | SWAT_OUTPUT_01 | daily | 10 470 | OK |
| 209 | swat_rch_28 | SWAT Débits m³/s | SWAT_OUTPUT_01 | daily | 10 470 | OK |
| 210 | swat_rch_28 | SWAT Sediment (t) | SWAT_OUTPUT_01 | daily | 10 470 | OK |
| 211 | swat_rch_29 | SWAT Débits m³/s | SWAT_OUTPUT_01 | daily | 10 470 | OK |
| 212 | swat_rch_29 | SWAT Sediment (t) | SWAT_OUTPUT_01 | daily | 10 470 | OK |
| 213 | swat_rch_3 | SWAT Débits m³/s | SWAT_OUTPUT_01 | daily | 10 470 | OK |
| 214 | swat_rch_3 | SWAT Sediment (t) | SWAT_OUTPUT_01 | daily | 10 470 | OK |
| 215 | swat_rch_30 | SWAT Débits m³/s | SWAT_OUTPUT_01 | daily | 10 470 | OK |
| 216 | swat_rch_30 | SWAT Sediment (t) | SWAT_OUTPUT_01 | daily | 10 470 | OK |
| 217 | swat_rch_31 | SWAT Débits m³/s | SWAT_OUTPUT_01 | daily | 10 470 | OK |
| 218 | swat_rch_31 | SWAT Sediment (t) | SWAT_OUTPUT_01 | daily | 10 470 | OK |
| 219 | swat_rch_32 | SWAT Débits m³/s | SWAT_OUTPUT_01 | daily | 10 470 | OK |
| 220 | swat_rch_32 | SWAT Sediment (t) | SWAT_OUTPUT_01 | daily | 10 470 | OK |
| 221 | swat_rch_33 | SWAT Débits m³/s | SWAT_OUTPUT_01 | daily | 10 470 | OK |
| 222 | swat_rch_33 | SWAT Sediment (t) | SWAT_OUTPUT_01 | daily | 10 470 | OK |
| 223 | swat_rch_4 | SWAT Débits m³/s | SWAT_OUTPUT_01 | daily | 10 470 | OK |
| 224 | swat_rch_4 | SWAT Sediment (t) | SWAT_OUTPUT_01 | daily | 10 470 | OK |
| 225 | swat_rch_5 | SWAT Débits m³/s | SWAT_OUTPUT_01 | daily | 10 470 | OK |
| 226 | swat_rch_5 | SWAT Sediment (t) | SWAT_OUTPUT_01 | daily | 10 470 | OK |
| 227 | swat_rch_6 | SWAT Débits m³/s | SWAT_OUTPUT_01 | daily | 10 470 | OK |
| 228 | swat_rch_6 | SWAT Sediment (t) | SWAT_OUTPUT_01 | daily | 10 470 | OK |
| 229 | swat_rch_7 | SWAT Débits m³/s | SWAT_OUTPUT_01 | daily | 10 470 | OK |
| 230 | swat_rch_7 | SWAT Sediment (t) | SWAT_OUTPUT_01 | daily | 10 470 | OK |
| 231 | swat_rch_8 | SWAT Débits m³/s | SWAT_OUTPUT_01 | daily | 10 470 | OK |
| 232 | swat_rch_8 | SWAT Sediment (t) | SWAT_OUTPUT_01 | daily | 10 470 | OK |
| 233 | swat_rch_9 | SWAT Débits m³/s | SWAT_OUTPUT_01 | daily | 10 470 | OK |
| 234 | swat_rch_9 | SWAT Sediment (t) | SWAT_OUTPUT_01 | daily | 10 470 | OK |
| 235 | swat_sub_1 | SWAT Dégradation spécifique (t/ha) | SWAT_OUTPUT_01 | daily | 10 470 | OK |
| 236 | swat_sub_10 | SWAT Dégradation spécifique (t/ha) | SWAT_OUTPUT_01 | daily | 10 470 | OK |
| 237 | swat_sub_11 | SWAT Dégradation spécifique (t/ha) | SWAT_OUTPUT_01 | daily | 10 470 | OK |
| 238 | swat_sub_12 | SWAT Dégradation spécifique (t/ha) | SWAT_OUTPUT_01 | daily | 10 470 | OK |
| 239 | swat_sub_13 | SWAT Dégradation spécifique (t/ha) | SWAT_OUTPUT_01 | daily | 10 470 | OK |
| 240 | swat_sub_14 | SWAT Dégradation spécifique (t/ha) | SWAT_OUTPUT_01 | daily | 10 470 | OK |
| 241 | swat_sub_15 | SWAT Dégradation spécifique (t/ha) | SWAT_OUTPUT_01 | daily | 10 470 | OK |
| 242 | swat_sub_16 | SWAT Dégradation spécifique (t/ha) | SWAT_OUTPUT_01 | daily | 10 470 | OK |
| 243 | swat_sub_17 | SWAT Dégradation spécifique (t/ha) | SWAT_OUTPUT_01 | daily | 10 470 | OK |
| 244 | swat_sub_18 | SWAT Dégradation spécifique (t/ha) | SWAT_OUTPUT_01 | daily | 10 470 | OK |
| 245 | swat_sub_19 | SWAT Dégradation spécifique (t/ha) | SWAT_OUTPUT_01 | daily | 10 470 | OK |
| 246 | swat_sub_2 | SWAT Dégradation spécifique (t/ha) | SWAT_OUTPUT_01 | daily | 10 470 | OK |
| 247 | swat_sub_20 | SWAT Dégradation spécifique (t/ha) | SWAT_OUTPUT_01 | daily | 10 470 | OK |
| 248 | swat_sub_21 | SWAT Dégradation spécifique (t/ha) | SWAT_OUTPUT_01 | daily | 10 470 | OK |
| 249 | swat_sub_22 | SWAT Dégradation spécifique (t/ha) | SWAT_OUTPUT_01 | daily | 10 470 | OK |
| 250 | swat_sub_23 | SWAT Dégradation spécifique (t/ha) | SWAT_OUTPUT_01 | daily | 10 470 | OK |
| 251 | swat_sub_24 | SWAT Dégradation spécifique (t/ha) | SWAT_OUTPUT_01 | daily | 10 470 | OK |
| 252 | swat_sub_25 | SWAT Dégradation spécifique (t/ha) | SWAT_OUTPUT_01 | daily | 10 470 | OK |
| 253 | swat_sub_26 | SWAT Dégradation spécifique (t/ha) | SWAT_OUTPUT_01 | daily | 10 470 | OK |
| 254 | swat_sub_27 | SWAT Dégradation spécifique (t/ha) | SWAT_OUTPUT_01 | daily | 10 470 | OK |
| 255 | swat_sub_28 | SWAT Dégradation spécifique (t/ha) | SWAT_OUTPUT_01 | daily | 10 470 | OK |
| 256 | swat_sub_29 | SWAT Dégradation spécifique (t/ha) | SWAT_OUTPUT_01 | daily | 10 470 | OK |
| 257 | swat_sub_3 | SWAT Dégradation spécifique (t/ha) | SWAT_OUTPUT_01 | daily | 10 470 | OK |
| 258 | swat_sub_30 | SWAT Dégradation spécifique (t/ha) | SWAT_OUTPUT_01 | daily | 10 470 | OK |
| 259 | swat_sub_31 | SWAT Dégradation spécifique (t/ha) | SWAT_OUTPUT_01 | daily | 10 470 | OK |
| 260 | swat_sub_32 | SWAT Dégradation spécifique (t/ha) | SWAT_OUTPUT_01 | daily | 10 470 | OK |
| 261 | swat_sub_33 | SWAT Dégradation spécifique (t/ha) | SWAT_OUTPUT_01 | daily | 10 470 | OK |
| 262 | swat_sub_4 | SWAT Dégradation spécifique (t/ha) | SWAT_OUTPUT_01 | daily | 10 470 | OK |
| 263 | swat_sub_5 | SWAT Dégradation spécifique (t/ha) | SWAT_OUTPUT_01 | daily | 10 470 | OK |
| 264 | swat_sub_6 | SWAT Dégradation spécifique (t/ha) | SWAT_OUTPUT_01 | daily | 10 470 | OK |
| 265 | swat_sub_7 | SWAT Dégradation spécifique (t/ha) | SWAT_OUTPUT_01 | daily | 10 470 | OK |
| 266 | swat_sub_8 | SWAT Dégradation spécifique (t/ha) | SWAT_OUTPUT_01 | daily | 10 470 | OK |
| 267 | swat_sub_9 | SWAT Dégradation spécifique (t/ha) | SWAT_OUTPUT_01 | daily | 10 470 | OK |
| 268 | swat_sub_1 | SWAT Dégradation spécifique (t/ha) | scenario_1 | daily | 10 470 | OK |
| 269 | swat_rch_1 | SWAT Débits m³/s | scenario_1 | daily | 10 470 | OK |
| 270 | swat_rch_1 | SWAT Sediment (t) | scenario_1 | daily | 10 470 | OK |
| 271 | swat_sub_2 | SWAT Dégradation spécifique (t/ha) | scenario_1 | daily | 10 470 | OK |
| 272 | swat_rch_2 | SWAT Débits m³/s | scenario_1 | daily | 10 470 | OK |
| 273 | swat_rch_2 | SWAT Sediment (t) | scenario_1 | daily | 10 470 | OK |
| 274 | swat_sub_3 | SWAT Dégradation spécifique (t/ha) | scenario_1 | daily | 10 470 | OK |
| 275 | swat_rch_3 | SWAT Débits m³/s | scenario_1 | daily | 10 470 | OK |
| 276 | swat_rch_3 | SWAT Sediment (t) | scenario_1 | daily | 10 470 | OK |
| 277 | swat_sub_4 | SWAT Dégradation spécifique (t/ha) | scenario_1 | daily | 10 470 | OK |
| 278 | swat_rch_4 | SWAT Débits m³/s | scenario_1 | daily | 10 470 | OK |
| 279 | swat_rch_4 | SWAT Sediment (t) | scenario_1 | daily | 10 470 | OK |
| 280 | swat_sub_5 | SWAT Dégradation spécifique (t/ha) | scenario_1 | daily | 10 470 | OK |
| 281 | swat_rch_5 | SWAT Débits m³/s | scenario_1 | daily | 10 470 | OK |
| 282 | swat_rch_5 | SWAT Sediment (t) | scenario_1 | daily | 10 470 | OK |
| 283 | swat_sub_6 | SWAT Dégradation spécifique (t/ha) | scenario_1 | daily | 10 470 | OK |
| 284 | swat_rch_6 | SWAT Débits m³/s | scenario_1 | daily | 10 470 | OK |
| 285 | swat_rch_6 | SWAT Sediment (t) | scenario_1 | daily | 10 470 | OK |
| 286 | swat_sub_7 | SWAT Dégradation spécifique (t/ha) | scenario_1 | daily | 10 470 | OK |
| 287 | swat_rch_7 | SWAT Débits m³/s | scenario_1 | daily | 10 470 | OK |
| 288 | swat_rch_7 | SWAT Sediment (t) | scenario_1 | daily | 10 470 | OK |
| 289 | swat_sub_8 | SWAT Dégradation spécifique (t/ha) | scenario_1 | daily | 10 470 | OK |
| 290 | swat_rch_8 | SWAT Débits m³/s | scenario_1 | daily | 10 470 | OK |
| 291 | swat_rch_8 | SWAT Sediment (t) | scenario_1 | daily | 10 470 | OK |
| 292 | swat_sub_9 | SWAT Dégradation spécifique (t/ha) | scenario_1 | daily | 10 470 | OK |
| 293 | swat_rch_9 | SWAT Débits m³/s | scenario_1 | daily | 10 470 | OK |
| 294 | swat_rch_9 | SWAT Sediment (t) | scenario_1 | daily | 10 470 | OK |
| 295 | swat_sub_10 | SWAT Dégradation spécifique (t/ha) | scenario_1 | daily | 10 470 | OK |
| 296 | swat_rch_10 | SWAT Débits m³/s | scenario_1 | daily | 10 470 | OK |
| 297 | swat_rch_10 | SWAT Sediment (t) | scenario_1 | daily | 10 470 | OK |
| 298 | swat_sub_11 | SWAT Dégradation spécifique (t/ha) | scenario_1 | daily | 10 470 | OK |
| 299 | swat_rch_11 | SWAT Débits m³/s | scenario_1 | daily | 10 470 | OK |
| 300 | swat_rch_11 | SWAT Sediment (t) | scenario_1 | daily | 10 470 | OK |
| 301 | swat_sub_12 | SWAT Dégradation spécifique (t/ha) | scenario_1 | daily | 10 470 | OK |
| 302 | swat_rch_12 | SWAT Débits m³/s | scenario_1 | daily | 10 470 | OK |
| 303 | swat_rch_12 | SWAT Sediment (t) | scenario_1 | daily | 10 470 | OK |
| 304 | swat_sub_13 | SWAT Dégradation spécifique (t/ha) | scenario_1 | daily | 10 470 | OK |
| 305 | swat_rch_13 | SWAT Débits m³/s | scenario_1 | daily | 10 470 | OK |
| 306 | swat_rch_13 | SWAT Sediment (t) | scenario_1 | daily | 10 470 | OK |
| 307 | swat_sub_14 | SWAT Dégradation spécifique (t/ha) | scenario_1 | daily | 10 470 | OK |
| 308 | swat_rch_14 | SWAT Débits m³/s | scenario_1 | daily | 10 470 | OK |
| 309 | swat_rch_14 | SWAT Sediment (t) | scenario_1 | daily | 10 470 | OK |
| 310 | swat_sub_15 | SWAT Dégradation spécifique (t/ha) | scenario_1 | daily | 10 470 | OK |
| 311 | swat_rch_15 | SWAT Débits m³/s | scenario_1 | daily | 10 470 | OK |
| 312 | swat_rch_15 | SWAT Sediment (t) | scenario_1 | daily | 10 470 | OK |
| 313 | swat_sub_16 | SWAT Dégradation spécifique (t/ha) | scenario_1 | daily | 10 470 | OK |
| 314 | swat_rch_16 | SWAT Débits m³/s | scenario_1 | daily | 10 470 | OK |
| 315 | swat_rch_16 | SWAT Sediment (t) | scenario_1 | daily | 10 470 | OK |
| 316 | swat_sub_17 | SWAT Dégradation spécifique (t/ha) | scenario_1 | daily | 10 470 | OK |
| 317 | swat_rch_17 | SWAT Débits m³/s | scenario_1 | daily | 10 470 | OK |
| 318 | swat_rch_17 | SWAT Sediment (t) | scenario_1 | daily | 10 470 | OK |
| 319 | swat_sub_18 | SWAT Dégradation spécifique (t/ha) | scenario_1 | daily | 10 470 | OK |
| 320 | swat_rch_18 | SWAT Débits m³/s | scenario_1 | daily | 10 470 | OK |
| 321 | swat_rch_18 | SWAT Sediment (t) | scenario_1 | daily | 10 470 | OK |
| 322 | swat_sub_19 | SWAT Dégradation spécifique (t/ha) | scenario_1 | daily | 10 470 | OK |
| 323 | swat_rch_19 | SWAT Débits m³/s | scenario_1 | daily | 10 470 | OK |
| 324 | swat_rch_19 | SWAT Sediment (t) | scenario_1 | daily | 10 470 | OK |
| 325 | swat_sub_1 | SWAT Dégradation spécifique (t/ha) | scenario_2 | daily | 10 470 | OK |
| 326 | swat_rch_1 | SWAT Débits m³/s | scenario_2 | daily | 10 470 | OK |
| 327 | swat_rch_1 | SWAT Sediment (t) | scenario_2 | daily | 10 470 | OK |
| 328 | swat_sub_2 | SWAT Dégradation spécifique (t/ha) | scenario_2 | daily | 10 470 | OK |
| 329 | swat_rch_2 | SWAT Débits m³/s | scenario_2 | daily | 10 470 | OK |
| 330 | swat_rch_2 | SWAT Sediment (t) | scenario_2 | daily | 10 470 | OK |
| 331 | swat_sub_3 | SWAT Dégradation spécifique (t/ha) | scenario_2 | daily | 10 470 | OK |
| 332 | swat_rch_3 | SWAT Débits m³/s | scenario_2 | daily | 10 470 | OK |
| 333 | swat_rch_3 | SWAT Sediment (t) | scenario_2 | daily | 10 470 | OK |
| 334 | swat_sub_4 | SWAT Dégradation spécifique (t/ha) | scenario_2 | daily | 10 470 | OK |
| 335 | swat_rch_4 | SWAT Débits m³/s | scenario_2 | daily | 10 470 | OK |
| 336 | swat_rch_4 | SWAT Sediment (t) | scenario_2 | daily | 10 470 | OK |
| 337 | swat_sub_5 | SWAT Dégradation spécifique (t/ha) | scenario_2 | daily | 10 470 | OK |
| 338 | swat_rch_5 | SWAT Débits m³/s | scenario_2 | daily | 10 470 | OK |
| 339 | swat_rch_5 | SWAT Sediment (t) | scenario_2 | daily | 10 470 | OK |
| 340 | swat_sub_6 | SWAT Dégradation spécifique (t/ha) | scenario_2 | daily | 10 470 | OK |
| 341 | swat_rch_6 | SWAT Débits m³/s | scenario_2 | daily | 10 470 | OK |
| 342 | swat_rch_6 | SWAT Sediment (t) | scenario_2 | daily | 10 470 | OK |
| 343 | swat_sub_7 | SWAT Dégradation spécifique (t/ha) | scenario_2 | daily | 10 470 | OK |
| 344 | swat_rch_7 | SWAT Débits m³/s | scenario_2 | daily | 10 470 | OK |
| 345 | swat_rch_7 | SWAT Sediment (t) | scenario_2 | daily | 10 470 | OK |
| 346 | swat_sub_8 | SWAT Dégradation spécifique (t/ha) | scenario_2 | daily | 10 470 | OK |
| 347 | swat_rch_8 | SWAT Débits m³/s | scenario_2 | daily | 10 470 | OK |
| 348 | swat_rch_8 | SWAT Sediment (t) | scenario_2 | daily | 10 470 | OK |
| 349 | swat_sub_9 | SWAT Dégradation spécifique (t/ha) | scenario_2 | daily | 10 470 | OK |
| 350 | swat_rch_9 | SWAT Débits m³/s | scenario_2 | daily | 10 470 | OK |
| 351 | swat_rch_9 | SWAT Sediment (t) | scenario_2 | daily | 10 470 | OK |
| 352 | swat_sub_10 | SWAT Dégradation spécifique (t/ha) | scenario_2 | daily | 10 470 | OK |
| 353 | swat_rch_10 | SWAT Débits m³/s | scenario_2 | daily | 10 470 | OK |
| 354 | swat_rch_10 | SWAT Sediment (t) | scenario_2 | daily | 10 470 | OK |
| 355 | swat_sub_11 | SWAT Dégradation spécifique (t/ha) | scenario_2 | daily | 10 470 | OK |
| 356 | swat_rch_11 | SWAT Débits m³/s | scenario_2 | daily | 10 470 | OK |
| 357 | swat_rch_11 | SWAT Sediment (t) | scenario_2 | daily | 10 470 | OK |
| 358 | swat_sub_12 | SWAT Dégradation spécifique (t/ha) | scenario_2 | daily | 10 470 | OK |
| 359 | swat_rch_12 | SWAT Débits m³/s | scenario_2 | daily | 10 470 | OK |
| 360 | swat_rch_12 | SWAT Sediment (t) | scenario_2 | daily | 10 470 | OK |
| 361 | swat_sub_13 | SWAT Dégradation spécifique (t/ha) | scenario_2 | daily | 10 470 | OK |
| 362 | swat_rch_13 | SWAT Débits m³/s | scenario_2 | daily | 10 470 | OK |
| 363 | swat_rch_13 | SWAT Sediment (t) | scenario_2 | daily | 10 470 | OK |
| 364 | swat_sub_14 | SWAT Dégradation spécifique (t/ha) | scenario_2 | daily | 10 470 | OK |
| 365 | swat_rch_14 | SWAT Débits m³/s | scenario_2 | daily | 10 470 | OK |
| 366 | swat_rch_14 | SWAT Sediment (t) | scenario_2 | daily | 10 470 | OK |
| 367 | swat_sub_15 | SWAT Dégradation spécifique (t/ha) | scenario_2 | daily | 10 470 | OK |
| 368 | swat_rch_15 | SWAT Débits m³/s | scenario_2 | daily | 10 470 | OK |
| 369 | swat_rch_15 | SWAT Sediment (t) | scenario_2 | daily | 10 470 | OK |
| 370 | swat_sub_16 | SWAT Dégradation spécifique (t/ha) | scenario_2 | daily | 10 470 | OK |
| 371 | swat_rch_16 | SWAT Débits m³/s | scenario_2 | daily | 10 470 | OK |
| 372 | swat_rch_16 | SWAT Sediment (t) | scenario_2 | daily | 10 470 | OK |
| 373 | swat_sub_17 | SWAT Dégradation spécifique (t/ha) | scenario_2 | daily | 10 470 | OK |
| 374 | swat_rch_17 | SWAT Débits m³/s | scenario_2 | daily | 10 470 | OK |
| 375 | swat_rch_17 | SWAT Sediment (t) | scenario_2 | daily | 10 470 | OK |
| 376 | swat_sub_18 | SWAT Dégradation spécifique (t/ha) | scenario_2 | daily | 10 470 | OK |
| 377 | swat_rch_18 | SWAT Débits m³/s | scenario_2 | daily | 10 470 | OK |
| 378 | swat_rch_18 | SWAT Sediment (t) | scenario_2 | daily | 10 470 | OK |
| 379 | swat_sub_19 | SWAT Dégradation spécifique (t/ha) | scenario_2 | daily | 10 470 | OK |
| 380 | swat_rch_19 | SWAT Débits m³/s | scenario_2 | daily | 10 470 | OK |
| 381 | swat_rch_19 | SWAT Sediment (t) | scenario_2 | daily | 10 470 | OK |
| 382 | swat_sub_1 | SWAT Dégradation spécifique (t/ha) | scenario_3 | daily | 10 470 | OK |
| 383 | swat_rch_1 | SWAT Débits m³/s | scenario_3 | daily | 10 470 | OK |
| 384 | swat_rch_1 | SWAT Sediment (t) | scenario_3 | daily | 10 470 | OK |
| 385 | swat_sub_2 | SWAT Dégradation spécifique (t/ha) | scenario_3 | daily | 10 470 | OK |
| 386 | swat_rch_2 | SWAT Débits m³/s | scenario_3 | daily | 10 470 | OK |
| 387 | swat_rch_2 | SWAT Sediment (t) | scenario_3 | daily | 10 470 | OK |
| 388 | swat_sub_3 | SWAT Dégradation spécifique (t/ha) | scenario_3 | daily | 10 470 | OK |
| 389 | swat_rch_3 | SWAT Débits m³/s | scenario_3 | daily | 10 470 | OK |
| 390 | swat_rch_3 | SWAT Sediment (t) | scenario_3 | daily | 10 470 | OK |
| 391 | swat_sub_4 | SWAT Dégradation spécifique (t/ha) | scenario_3 | daily | 10 470 | OK |
| 392 | swat_rch_4 | SWAT Débits m³/s | scenario_3 | daily | 10 470 | OK |
| 393 | swat_rch_4 | SWAT Sediment (t) | scenario_3 | daily | 10 470 | OK |
| 394 | swat_sub_5 | SWAT Dégradation spécifique (t/ha) | scenario_3 | daily | 10 470 | OK |
| 395 | swat_rch_5 | SWAT Débits m³/s | scenario_3 | daily | 10 470 | OK |
| 396 | swat_rch_5 | SWAT Sediment (t) | scenario_3 | daily | 10 470 | OK |
| 397 | swat_sub_6 | SWAT Dégradation spécifique (t/ha) | scenario_3 | daily | 10 470 | OK |
| 398 | swat_rch_6 | SWAT Débits m³/s | scenario_3 | daily | 10 470 | OK |
| 399 | swat_rch_6 | SWAT Sediment (t) | scenario_3 | daily | 10 470 | OK |
| 400 | swat_sub_7 | SWAT Dégradation spécifique (t/ha) | scenario_3 | daily | 10 470 | OK |
| 401 | swat_rch_7 | SWAT Débits m³/s | scenario_3 | daily | 10 470 | OK |
| 402 | swat_rch_7 | SWAT Sediment (t) | scenario_3 | daily | 10 470 | OK |
| 403 | swat_sub_8 | SWAT Dégradation spécifique (t/ha) | scenario_3 | daily | 10 470 | OK |
| 404 | swat_rch_8 | SWAT Débits m³/s | scenario_3 | daily | 10 470 | OK |
| 405 | swat_rch_8 | SWAT Sediment (t) | scenario_3 | daily | 10 470 | OK |
| 406 | swat_sub_9 | SWAT Dégradation spécifique (t/ha) | scenario_3 | daily | 10 470 | OK |
| 407 | swat_rch_9 | SWAT Débits m³/s | scenario_3 | daily | 10 470 | OK |
| 408 | swat_rch_9 | SWAT Sediment (t) | scenario_3 | daily | 10 470 | OK |
| 409 | swat_sub_10 | SWAT Dégradation spécifique (t/ha) | scenario_3 | daily | 10 470 | OK |
| 410 | swat_rch_10 | SWAT Débits m³/s | scenario_3 | daily | 10 470 | OK |
| 411 | swat_rch_10 | SWAT Sediment (t) | scenario_3 | daily | 10 470 | OK |
| 412 | swat_sub_11 | SWAT Dégradation spécifique (t/ha) | scenario_3 | daily | 10 470 | OK |
| 413 | swat_rch_11 | SWAT Débits m³/s | scenario_3 | daily | 10 470 | OK |
| 414 | swat_rch_11 | SWAT Sediment (t) | scenario_3 | daily | 10 470 | OK |
| 415 | swat_sub_12 | SWAT Dégradation spécifique (t/ha) | scenario_3 | daily | 10 470 | OK |
| 416 | swat_rch_12 | SWAT Débits m³/s | scenario_3 | daily | 10 470 | OK |
| 417 | swat_rch_12 | SWAT Sediment (t) | scenario_3 | daily | 10 470 | OK |
| 418 | swat_sub_13 | SWAT Dégradation spécifique (t/ha) | scenario_3 | daily | 10 470 | OK |
| 419 | swat_rch_13 | SWAT Débits m³/s | scenario_3 | daily | 10 470 | OK |
| 420 | swat_rch_13 | SWAT Sediment (t) | scenario_3 | daily | 10 470 | OK |
| 421 | swat_sub_14 | SWAT Dégradation spécifique (t/ha) | scenario_3 | daily | 10 470 | OK |
| 422 | swat_rch_14 | SWAT Débits m³/s | scenario_3 | daily | 10 470 | OK |
| 423 | swat_rch_14 | SWAT Sediment (t) | scenario_3 | daily | 10 470 | OK |
| 424 | swat_sub_15 | SWAT Dégradation spécifique (t/ha) | scenario_3 | daily | 10 470 | OK |
| 425 | swat_rch_15 | SWAT Débits m³/s | scenario_3 | daily | 10 470 | OK |
| 426 | swat_rch_15 | SWAT Sediment (t) | scenario_3 | daily | 10 470 | OK |
| 427 | swat_sub_16 | SWAT Dégradation spécifique (t/ha) | scenario_3 | daily | 10 470 | OK |
| 428 | swat_rch_16 | SWAT Débits m³/s | scenario_3 | daily | 10 470 | OK |
| 429 | swat_rch_16 | SWAT Sediment (t) | scenario_3 | daily | 10 470 | OK |
| 430 | swat_sub_17 | SWAT Dégradation spécifique (t/ha) | scenario_3 | daily | 10 470 | OK |
| 431 | swat_rch_17 | SWAT Débits m³/s | scenario_3 | daily | 10 470 | OK |
| 432 | swat_rch_17 | SWAT Sediment (t) | scenario_3 | daily | 10 470 | OK |
| 433 | swat_sub_18 | SWAT Dégradation spécifique (t/ha) | scenario_3 | daily | 10 470 | OK |
| 434 | swat_rch_18 | SWAT Débits m³/s | scenario_3 | daily | 10 470 | OK |
| 435 | swat_rch_18 | SWAT Sediment (t) | scenario_3 | daily | 10 470 | OK |
| 436 | swat_sub_19 | SWAT Dégradation spécifique (t/ha) | scenario_3 | daily | 10 470 | OK |
| 437 | swat_rch_19 | SWAT Débits m³/s | scenario_3 | daily | 10 470 | OK |
| 438 | swat_rch_19 | SWAT Sediment (t) | scenario_3 | daily | 10 470 | OK |
| 439 | swat_sub_1 | SWAT Dégradation spécifique (t/ha) | scenario_4 | daily | 10 470 | OK |
| 440 | swat_rch_1 | SWAT Débits m³/s | scenario_4 | daily | 10 470 | OK |
| 441 | swat_rch_1 | SWAT Sediment (t) | scenario_4 | daily | 10 470 | OK |
| 442 | swat_sub_2 | SWAT Dégradation spécifique (t/ha) | scenario_4 | daily | 10 470 | OK |
| 443 | swat_rch_2 | SWAT Débits m³/s | scenario_4 | daily | 10 470 | OK |
| 444 | swat_rch_2 | SWAT Sediment (t) | scenario_4 | daily | 10 470 | OK |
| 445 | swat_sub_3 | SWAT Dégradation spécifique (t/ha) | scenario_4 | daily | 10 470 | OK |
| 446 | swat_rch_3 | SWAT Débits m³/s | scenario_4 | daily | 10 470 | OK |
| 447 | swat_rch_3 | SWAT Sediment (t) | scenario_4 | daily | 10 470 | OK |
| 448 | swat_sub_4 | SWAT Dégradation spécifique (t/ha) | scenario_4 | daily | 10 470 | OK |
| 449 | swat_rch_4 | SWAT Débits m³/s | scenario_4 | daily | 10 470 | OK |
| 450 | swat_rch_4 | SWAT Sediment (t) | scenario_4 | daily | 10 470 | OK |
| 451 | swat_sub_5 | SWAT Dégradation spécifique (t/ha) | scenario_4 | daily | 10 470 | OK |
| 452 | swat_rch_5 | SWAT Débits m³/s | scenario_4 | daily | 10 470 | OK |
| 453 | swat_rch_5 | SWAT Sediment (t) | scenario_4 | daily | 10 470 | OK |
| 454 | swat_sub_6 | SWAT Dégradation spécifique (t/ha) | scenario_4 | daily | 10 470 | OK |
| 455 | swat_rch_6 | SWAT Débits m³/s | scenario_4 | daily | 10 470 | OK |
| 456 | swat_rch_6 | SWAT Sediment (t) | scenario_4 | daily | 10 470 | OK |
| 457 | swat_sub_7 | SWAT Dégradation spécifique (t/ha) | scenario_4 | daily | 10 470 | OK |
| 458 | swat_rch_7 | SWAT Débits m³/s | scenario_4 | daily | 10 470 | OK |
| 459 | swat_rch_7 | SWAT Sediment (t) | scenario_4 | daily | 10 470 | OK |
| 460 | swat_sub_8 | SWAT Dégradation spécifique (t/ha) | scenario_4 | daily | 10 470 | OK |
| 461 | swat_rch_8 | SWAT Débits m³/s | scenario_4 | daily | 10 470 | OK |
| 462 | swat_rch_8 | SWAT Sediment (t) | scenario_4 | daily | 10 470 | OK |
| 463 | swat_sub_9 | SWAT Dégradation spécifique (t/ha) | scenario_4 | daily | 10 470 | OK |
| 464 | swat_rch_9 | SWAT Débits m³/s | scenario_4 | daily | 10 470 | OK |
| 465 | swat_rch_9 | SWAT Sediment (t) | scenario_4 | daily | 10 470 | OK |
| 466 | swat_sub_10 | SWAT Dégradation spécifique (t/ha) | scenario_4 | daily | 10 470 | OK |
| 467 | swat_rch_10 | SWAT Débits m³/s | scenario_4 | daily | 10 470 | OK |
| 468 | swat_rch_10 | SWAT Sediment (t) | scenario_4 | daily | 10 470 | OK |
| 469 | swat_sub_11 | SWAT Dégradation spécifique (t/ha) | scenario_4 | daily | 10 470 | OK |
| 470 | swat_rch_11 | SWAT Débits m³/s | scenario_4 | daily | 10 470 | OK |
| 471 | swat_rch_11 | SWAT Sediment (t) | scenario_4 | daily | 10 470 | OK |
| 472 | swat_sub_12 | SWAT Dégradation spécifique (t/ha) | scenario_4 | daily | 10 470 | OK |
| 473 | swat_rch_12 | SWAT Débits m³/s | scenario_4 | daily | 10 470 | OK |
| 474 | swat_rch_12 | SWAT Sediment (t) | scenario_4 | daily | 10 470 | OK |
| 475 | swat_sub_13 | SWAT Dégradation spécifique (t/ha) | scenario_4 | daily | 10 470 | OK |
| 476 | swat_rch_13 | SWAT Débits m³/s | scenario_4 | daily | 10 470 | OK |
| 477 | swat_rch_13 | SWAT Sediment (t) | scenario_4 | daily | 10 470 | OK |
| 478 | swat_sub_14 | SWAT Dégradation spécifique (t/ha) | scenario_4 | daily | 10 470 | OK |
| 479 | swat_rch_14 | SWAT Débits m³/s | scenario_4 | daily | 10 470 | OK |
| 480 | swat_rch_14 | SWAT Sediment (t) | scenario_4 | daily | 10 470 | OK |
| 481 | swat_sub_15 | SWAT Dégradation spécifique (t/ha) | scenario_4 | daily | 10 470 | OK |
| 482 | swat_rch_15 | SWAT Débits m³/s | scenario_4 | daily | 10 470 | OK |
| 483 | swat_rch_15 | SWAT Sediment (t) | scenario_4 | daily | 10 470 | OK |
| 484 | swat_sub_16 | SWAT Dégradation spécifique (t/ha) | scenario_4 | daily | 10 470 | OK |
| 485 | swat_rch_16 | SWAT Débits m³/s | scenario_4 | daily | 10 470 | OK |
| 486 | swat_rch_16 | SWAT Sediment (t) | scenario_4 | daily | 10 470 | OK |
| 487 | swat_sub_17 | SWAT Dégradation spécifique (t/ha) | scenario_4 | daily | 10 470 | OK |
| 488 | swat_rch_17 | SWAT Débits m³/s | scenario_4 | daily | 10 470 | OK |
| 489 | swat_rch_17 | SWAT Sediment (t) | scenario_4 | daily | 10 470 | OK |
| 490 | swat_sub_18 | SWAT Dégradation spécifique (t/ha) | scenario_4 | daily | 10 470 | OK |
| 491 | swat_rch_18 | SWAT Débits m³/s | scenario_4 | daily | 10 470 | OK |
| 492 | swat_rch_18 | SWAT Sediment (t) | scenario_4 | daily | 10 470 | OK |
| 493 | swat_sub_19 | SWAT Dégradation spécifique (t/ha) | scenario_4 | daily | 10 470 | OK |
| 494 | swat_rch_19 | SWAT Débits m³/s | scenario_4 | daily | 10 470 | OK |
| 495 | swat_rch_19 | SWAT Sediment (t) | scenario_4 | daily | 10 470 | OK |

## 8. Mesures

- Total mesures : **3 773 400**
- Doublons exacts sur `(ts_id, datetime)` : **0** groupe(s).
- `datetime` NULL : **0** ; `value` NULL : **0** ; non-finies : **0** ; hors plage : **0**.

| Propriété | Série | Station | Min date | Max date | Nb mesures | Doublons | NULL | Anomalies |
|---|---|---|---|---|---|---|---|---|
| Precipitation | 113 | 1940/48 | 1982-09-01T00:00:00-07:00 | 2025-09-30T00:00:00-07:00 | 15 736 | 0 | 0 | OK |
| Streamflow | 114 | 867/48 | 1970-05-05T00:00:00-07:00 | 2015-08-31T00:00:00-07:00 | 16 544 | 0 | 0 | OK |
| Streamflow | 115 | 1508/38 | 1974-09-01T00:00:00-07:00 | 2023-08-31T00:00:00-07:00 | 17 897 | 0 | 0 | OK |
| Precipitation | 116 | 31/38 | 1982-09-01T00:00:00-07:00 | 2025-08-31T00:00:00-07:00 | 15 706 | 0 | 0 | OK |
| Temperature Mean | 117 | 1940/48 | 1982-09-01T00:00:00-07:00 | 2023-08-01T00:00:00-07:00 | 249 | 0 | 0 | OK |
| Temperature Min | 118 | pont_arfoud | 1982-12-01T00:00:00-08:00 | 2025-07-01T00:00:00-07:00 | 480 | 0 | 0 | OK |
| Temperature Min | 119 | taouz | 1982-12-01T00:00:00-08:00 | 2025-07-01T00:00:00-07:00 | 507 | 0 | 0 | OK |
| Wind Speed | 120 | 867/48 | 1982-12-01T00:00:00-08:00 | 2016-11-01T00:00:00-07:00 | 342 | 0 | 0 | OK |
| Temperature Max | 121 | 1940/48 | 1982-12-01T00:00:00-08:00 | 2023-08-01T00:00:00-07:00 | 400 | 0 | 0 | OK |
| Precipitation | 122 | 1585/38 | 1982-09-01T00:00:00-07:00 | 2025-08-31T00:00:00-07:00 | 15 706 | 0 | 0 | OK |
| Temperature Min | 123 | 867/48 | 1982-12-01T00:00:00-08:00 | 2015-03-01T00:00:00-08:00 | 362 | 0 | 0 | OK |
| Reservoir Inflow | 124 | RES_1940/48 | 1971-06-01T00:00:00-07:00 | 2025-10-15T00:00:00-07:00 | 19 861 | 0 | 0 | OK |
| Reservoir Restitution | 125 | RES_1940/48 | 2009-01-01T00:00:00-08:00 | 2025-10-15T00:00:00-07:00 | 6 132 | 0 | 0 | OK |
| Evaporation | 126 | pont_arfoud | 1982-09-01T00:00:00-07:00 | 2025-08-01T00:00:00-07:00 | 501 | 0 | 0 | OK |
| Humidity Relative | 127 | pont_arfoud | 1996-11-01T00:00:00-08:00 | 2025-07-01T00:00:00-07:00 | 338 | 0 | 0 | OK |
| Temperature Mean | 128 | 1508/38 | 1992-01-01T00:00:00-08:00 | 2015-12-31T00:00:00-08:00 | 8 766 | 0 | 0 | OK |
| Temperature Mean | 129 | 867/48 | 1992-01-01T00:00:00-08:00 | 2015-12-31T00:00:00-08:00 | 8 766 | 0 | 0 | OK |
| Temperature Max | 130 | hammat_my_ali_cherif | 2023-10-01T00:00:00-07:00 | 2025-07-01T00:00:00-07:00 | 22 | 0 | 0 | OK |
| Temperature Min | 131 | 1585/38 | 1992-01-01T00:00:00-08:00 | 2015-12-31T00:00:00-08:00 | 8 766 | 0 | 0 | OK |
| Temperature Mean | 132 | hammat_my_ali_cherif | 2023-10-01T00:00:00-07:00 | 2025-07-01T00:00:00-07:00 | 21 | 0 | 0 | OK |
| Evaporation | 133 | 867/48 | 1982-09-01T00:00:00-07:00 | 2023-03-01T00:00:00-08:00 | 419 | 0 | 0 | OK |
| Evaporation | 134 | 1508/38 | 2013-05-01T00:00:00-07:00 | 2023-08-01T00:00:00-07:00 | 122 | 0 | 0 | OK |
| Temperature Min | 135 | 1940/48 | 1992-09-01T00:00:00-07:00 | 2015-08-31T00:00:00-07:00 | 8 400 | 0 | 0 | OK |
| Temperature Max | 136 | 1508/38 | 1992-01-01T00:00:00-08:00 | 2015-12-31T00:00:00-08:00 | 8 766 | 0 | 0 | OK |
| Temperature Max | 137 | 867/48 | 1992-01-01T00:00:00-08:00 | 2015-12-31T00:00:00-08:00 | 8 766 | 0 | 0 | OK |
| Evaporation | 138 | taouz | 1982-09-01T00:00:00-07:00 | 2025-08-01T00:00:00-07:00 | 505 | 0 | 0 | OK |
| Humidity Relative | 139 | taouz | 1996-11-01T00:00:00-08:00 | 2025-07-01T00:00:00-07:00 | 336 | 0 | 0 | OK |
| Temperature Min | 140 | 31/38 | 1992-01-01T00:00:00-08:00 | 2015-12-31T00:00:00-08:00 | 8 766 | 0 | 0 | OK |
| Precipitation | 141 | hammat_my_ali_cherif | 2023-04-01T00:00:00-07:00 | 2025-08-31T00:00:00-07:00 | 884 | 0 | 0 | OK |
| Temperature Max | 142 | taouz | 1982-12-01T00:00:00-08:00 | 2025-07-01T00:00:00-07:00 | 504 | 0 | 0 | OK |
| Precipitation | 143 | pont_arfoud | 1982-09-01T00:00:00-07:00 | 2025-08-31T00:00:00-07:00 | 15 706 | 0 | 0 | OK |
| Temperature Min | 144 | 1940/48 | 1982-11-01T00:00:00-08:00 | 2023-08-01T00:00:00-07:00 | 305 | 0 | 0 | OK |
| Temperature Mean | 145 | pont_arfoud | 1982-09-01T00:00:00-07:00 | 2025-07-01T00:00:00-07:00 | 334 | 0 | 0 | OK |
| Temperature Max | 146 | 867/48 | 1982-12-01T00:00:00-08:00 | 2015-03-01T00:00:00-08:00 | 385 | 0 | 0 | OK |
| Streamflow | 147 | 1585/38 | 1985-09-01T00:00:00-07:00 | 2023-08-31T00:00:00-07:00 | 13 879 | 0 | 0 | OK |
| Temperature Mean | 148 | taouz | 1982-09-01T00:00:00-07:00 | 2025-07-01T00:00:00-07:00 | 376 | 0 | 0 | OK |
| Precipitation | 149 | 1508/38 | 1982-09-01T00:00:00-07:00 | 2024-08-31T00:00:00-07:00 | 15 341 | 0 | 0 | OK |
| Precipitation | 150 | 867/48 | 1982-09-01T00:00:00-07:00 | 2023-03-31T00:00:00-07:00 | 12 842 | 0 | 0 | OK |
| Streamflow | 151 | 1940/48 | 1992-09-01T00:00:00-07:00 | 2015-08-31T00:00:00-07:00 | 8 400 | 0 | 0 | OK |
| Evaporation | 152 | hammat_my_ali_cherif | 2023-04-01T00:00:00-07:00 | 2025-08-01T00:00:00-07:00 | 29 | 0 | 0 | OK |
| Humidity Relative | 153 | hammat_my_ali_cherif | 2023-10-01T00:00:00-07:00 | 2025-07-01T00:00:00-07:00 | 22 | 0 | 0 | OK |
| Streamflow | 154 | 31/38 | 1965-03-03T00:00:00-08:00 | 2023-08-31T00:00:00-07:00 | 21 230 | 0 | 0 | OK |
| Temperature Max | 155 | pont_arfoud | 1982-12-01T00:00:00-08:00 | 2025-07-01T00:00:00-07:00 | 460 | 0 | 0 | OK |
| Precipitation | 156 | taouz | 1982-09-01T00:00:00-07:00 | 2025-08-31T00:00:00-07:00 | 15 706 | 0 | 0 | OK |
| Temperature Max | 157 | 1940/48 | 1992-09-01T00:00:00-07:00 | 2015-08-31T00:00:00-07:00 | 8 400 | 0 | 0 | OK |
| Temperature Min | 158 | 1508/38 | 1992-01-01T00:00:00-08:00 | 2015-12-31T00:00:00-08:00 | 8 766 | 0 | 0 | OK |
| Humidity Relative | 159 | 1940/48 | 1996-11-01T00:00:00-08:00 | 2023-08-01T00:00:00-07:00 | 232 | 0 | 0 | OK |
| Temperature Min | 160 | 867/48 | 1992-01-01T00:00:00-08:00 | 2015-12-31T00:00:00-08:00 | 8 766 | 0 | 0 | OK |
| Evaporation | 161 | 1940/48 | 1982-09-01T00:00:00-07:00 | 2025-09-01T00:00:00-07:00 | 455 | 0 | 0 | OK |
| Temperature Mean | 162 | 1585/38 | 1992-01-01T00:00:00-08:00 | 2015-12-31T00:00:00-08:00 | 8 766 | 0 | 0 | OK |
| Temperature Max | 163 | 31/38 | 1992-01-01T00:00:00-08:00 | 2015-12-31T00:00:00-08:00 | 8 766 | 0 | 0 | OK |
| Temperature Mean | 164 | 1940/48 | 1992-09-01T00:00:00-07:00 | 2015-08-31T00:00:00-07:00 | 8 400 | 0 | 0 | OK |
| Temperature Min | 165 | hammat_my_ali_cherif | 2023-10-01T00:00:00-07:00 | 2025-07-01T00:00:00-07:00 | 20 | 0 | 0 | OK |
| Wind Speed | 166 | hammat_my_ali_cherif | 2023-11-01T00:00:00-07:00 | 2025-08-01T00:00:00-07:00 | 22 | 0 | 0 | OK |
| Temperature Mean | 167 | 31/38 | 1992-01-01T00:00:00-08:00 | 2015-12-31T00:00:00-08:00 | 8 766 | 0 | 0 | OK |
| Temperature Max | 168 | 1585/38 | 1992-01-01T00:00:00-08:00 | 2015-12-31T00:00:00-08:00 | 8 766 | 0 | 0 | OK |
| SWAT Débits m³/s | 169 | swat_rch_1 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Sediment (t) | 170 | swat_rch_1 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Débits m³/s | 171 | swat_rch_10 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Sediment (t) | 172 | swat_rch_10 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Débits m³/s | 173 | swat_rch_11 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Sediment (t) | 174 | swat_rch_11 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Débits m³/s | 175 | swat_rch_12 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Sediment (t) | 176 | swat_rch_12 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Débits m³/s | 177 | swat_rch_13 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Sediment (t) | 178 | swat_rch_13 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Débits m³/s | 179 | swat_rch_14 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Sediment (t) | 180 | swat_rch_14 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Débits m³/s | 181 | swat_rch_15 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Sediment (t) | 182 | swat_rch_15 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Débits m³/s | 183 | swat_rch_16 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Sediment (t) | 184 | swat_rch_16 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Débits m³/s | 185 | swat_rch_17 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Sediment (t) | 186 | swat_rch_17 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Débits m³/s | 187 | swat_rch_18 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Sediment (t) | 188 | swat_rch_18 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Débits m³/s | 189 | swat_rch_19 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Sediment (t) | 190 | swat_rch_19 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Débits m³/s | 191 | swat_rch_2 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Sediment (t) | 192 | swat_rch_2 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Débits m³/s | 193 | swat_rch_20 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Sediment (t) | 194 | swat_rch_20 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Débits m³/s | 195 | swat_rch_21 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Sediment (t) | 196 | swat_rch_21 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Débits m³/s | 197 | swat_rch_22 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Sediment (t) | 198 | swat_rch_22 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Débits m³/s | 199 | swat_rch_23 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Sediment (t) | 200 | swat_rch_23 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Débits m³/s | 201 | swat_rch_24 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Sediment (t) | 202 | swat_rch_24 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Débits m³/s | 203 | swat_rch_25 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Sediment (t) | 204 | swat_rch_25 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Débits m³/s | 205 | swat_rch_26 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Sediment (t) | 206 | swat_rch_26 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Débits m³/s | 207 | swat_rch_27 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Sediment (t) | 208 | swat_rch_27 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Débits m³/s | 209 | swat_rch_28 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Sediment (t) | 210 | swat_rch_28 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Débits m³/s | 211 | swat_rch_29 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Sediment (t) | 212 | swat_rch_29 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Débits m³/s | 213 | swat_rch_3 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Sediment (t) | 214 | swat_rch_3 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Débits m³/s | 215 | swat_rch_30 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Sediment (t) | 216 | swat_rch_30 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Débits m³/s | 217 | swat_rch_31 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Sediment (t) | 218 | swat_rch_31 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Débits m³/s | 219 | swat_rch_32 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Sediment (t) | 220 | swat_rch_32 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Débits m³/s | 221 | swat_rch_33 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Sediment (t) | 222 | swat_rch_33 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Débits m³/s | 223 | swat_rch_4 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Sediment (t) | 224 | swat_rch_4 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Débits m³/s | 225 | swat_rch_5 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Sediment (t) | 226 | swat_rch_5 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Débits m³/s | 227 | swat_rch_6 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Sediment (t) | 228 | swat_rch_6 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Débits m³/s | 229 | swat_rch_7 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Sediment (t) | 230 | swat_rch_7 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Débits m³/s | 231 | swat_rch_8 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Sediment (t) | 232 | swat_rch_8 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Débits m³/s | 233 | swat_rch_9 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Sediment (t) | 234 | swat_rch_9 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Dégradation spécifique (t/ha) | 235 | swat_sub_1 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Dégradation spécifique (t/ha) | 236 | swat_sub_10 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Dégradation spécifique (t/ha) | 237 | swat_sub_11 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Dégradation spécifique (t/ha) | 238 | swat_sub_12 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Dégradation spécifique (t/ha) | 239 | swat_sub_13 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Dégradation spécifique (t/ha) | 240 | swat_sub_14 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Dégradation spécifique (t/ha) | 241 | swat_sub_15 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Dégradation spécifique (t/ha) | 242 | swat_sub_16 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Dégradation spécifique (t/ha) | 243 | swat_sub_17 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Dégradation spécifique (t/ha) | 244 | swat_sub_18 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Dégradation spécifique (t/ha) | 245 | swat_sub_19 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Dégradation spécifique (t/ha) | 246 | swat_sub_2 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Dégradation spécifique (t/ha) | 247 | swat_sub_20 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Dégradation spécifique (t/ha) | 248 | swat_sub_21 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Dégradation spécifique (t/ha) | 249 | swat_sub_22 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Dégradation spécifique (t/ha) | 250 | swat_sub_23 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Dégradation spécifique (t/ha) | 251 | swat_sub_24 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Dégradation spécifique (t/ha) | 252 | swat_sub_25 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Dégradation spécifique (t/ha) | 253 | swat_sub_26 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Dégradation spécifique (t/ha) | 254 | swat_sub_27 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Dégradation spécifique (t/ha) | 255 | swat_sub_28 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Dégradation spécifique (t/ha) | 256 | swat_sub_29 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Dégradation spécifique (t/ha) | 257 | swat_sub_3 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Dégradation spécifique (t/ha) | 258 | swat_sub_30 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Dégradation spécifique (t/ha) | 259 | swat_sub_31 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Dégradation spécifique (t/ha) | 260 | swat_sub_32 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Dégradation spécifique (t/ha) | 261 | swat_sub_33 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Dégradation spécifique (t/ha) | 262 | swat_sub_4 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Dégradation spécifique (t/ha) | 263 | swat_sub_5 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Dégradation spécifique (t/ha) | 264 | swat_sub_6 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Dégradation spécifique (t/ha) | 265 | swat_sub_7 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Dégradation spécifique (t/ha) | 266 | swat_sub_8 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Dégradation spécifique (t/ha) | 267 | swat_sub_9 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Dégradation spécifique (t/ha) | 268 | swat_sub_1 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Débits m³/s | 269 | swat_rch_1 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Sediment (t) | 270 | swat_rch_1 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Dégradation spécifique (t/ha) | 271 | swat_sub_2 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Débits m³/s | 272 | swat_rch_2 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Sediment (t) | 273 | swat_rch_2 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Dégradation spécifique (t/ha) | 274 | swat_sub_3 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Débits m³/s | 275 | swat_rch_3 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Sediment (t) | 276 | swat_rch_3 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Dégradation spécifique (t/ha) | 277 | swat_sub_4 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Débits m³/s | 278 | swat_rch_4 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Sediment (t) | 279 | swat_rch_4 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Dégradation spécifique (t/ha) | 280 | swat_sub_5 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Débits m³/s | 281 | swat_rch_5 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Sediment (t) | 282 | swat_rch_5 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Dégradation spécifique (t/ha) | 283 | swat_sub_6 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Débits m³/s | 284 | swat_rch_6 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Sediment (t) | 285 | swat_rch_6 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Dégradation spécifique (t/ha) | 286 | swat_sub_7 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Débits m³/s | 287 | swat_rch_7 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Sediment (t) | 288 | swat_rch_7 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Dégradation spécifique (t/ha) | 289 | swat_sub_8 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Débits m³/s | 290 | swat_rch_8 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Sediment (t) | 291 | swat_rch_8 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Dégradation spécifique (t/ha) | 292 | swat_sub_9 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Débits m³/s | 293 | swat_rch_9 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Sediment (t) | 294 | swat_rch_9 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Dégradation spécifique (t/ha) | 295 | swat_sub_10 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Débits m³/s | 296 | swat_rch_10 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Sediment (t) | 297 | swat_rch_10 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Dégradation spécifique (t/ha) | 298 | swat_sub_11 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Débits m³/s | 299 | swat_rch_11 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Sediment (t) | 300 | swat_rch_11 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Dégradation spécifique (t/ha) | 301 | swat_sub_12 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Débits m³/s | 302 | swat_rch_12 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Sediment (t) | 303 | swat_rch_12 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Dégradation spécifique (t/ha) | 304 | swat_sub_13 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Débits m³/s | 305 | swat_rch_13 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Sediment (t) | 306 | swat_rch_13 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Dégradation spécifique (t/ha) | 307 | swat_sub_14 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Débits m³/s | 308 | swat_rch_14 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Sediment (t) | 309 | swat_rch_14 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Dégradation spécifique (t/ha) | 310 | swat_sub_15 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Débits m³/s | 311 | swat_rch_15 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Sediment (t) | 312 | swat_rch_15 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Dégradation spécifique (t/ha) | 313 | swat_sub_16 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Débits m³/s | 314 | swat_rch_16 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Sediment (t) | 315 | swat_rch_16 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Dégradation spécifique (t/ha) | 316 | swat_sub_17 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Débits m³/s | 317 | swat_rch_17 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Sediment (t) | 318 | swat_rch_17 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Dégradation spécifique (t/ha) | 319 | swat_sub_18 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Débits m³/s | 320 | swat_rch_18 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Sediment (t) | 321 | swat_rch_18 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Dégradation spécifique (t/ha) | 322 | swat_sub_19 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Débits m³/s | 323 | swat_rch_19 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Sediment (t) | 324 | swat_rch_19 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Dégradation spécifique (t/ha) | 325 | swat_sub_1 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Débits m³/s | 326 | swat_rch_1 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Sediment (t) | 327 | swat_rch_1 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Dégradation spécifique (t/ha) | 328 | swat_sub_2 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Débits m³/s | 329 | swat_rch_2 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Sediment (t) | 330 | swat_rch_2 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Dégradation spécifique (t/ha) | 331 | swat_sub_3 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Débits m³/s | 332 | swat_rch_3 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Sediment (t) | 333 | swat_rch_3 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Dégradation spécifique (t/ha) | 334 | swat_sub_4 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Débits m³/s | 335 | swat_rch_4 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Sediment (t) | 336 | swat_rch_4 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Dégradation spécifique (t/ha) | 337 | swat_sub_5 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Débits m³/s | 338 | swat_rch_5 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Sediment (t) | 339 | swat_rch_5 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Dégradation spécifique (t/ha) | 340 | swat_sub_6 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Débits m³/s | 341 | swat_rch_6 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Sediment (t) | 342 | swat_rch_6 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Dégradation spécifique (t/ha) | 343 | swat_sub_7 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Débits m³/s | 344 | swat_rch_7 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Sediment (t) | 345 | swat_rch_7 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Dégradation spécifique (t/ha) | 346 | swat_sub_8 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Débits m³/s | 347 | swat_rch_8 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Sediment (t) | 348 | swat_rch_8 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Dégradation spécifique (t/ha) | 349 | swat_sub_9 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Débits m³/s | 350 | swat_rch_9 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Sediment (t) | 351 | swat_rch_9 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Dégradation spécifique (t/ha) | 352 | swat_sub_10 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Débits m³/s | 353 | swat_rch_10 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Sediment (t) | 354 | swat_rch_10 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Dégradation spécifique (t/ha) | 355 | swat_sub_11 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Débits m³/s | 356 | swat_rch_11 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Sediment (t) | 357 | swat_rch_11 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Dégradation spécifique (t/ha) | 358 | swat_sub_12 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Débits m³/s | 359 | swat_rch_12 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Sediment (t) | 360 | swat_rch_12 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Dégradation spécifique (t/ha) | 361 | swat_sub_13 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Débits m³/s | 362 | swat_rch_13 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Sediment (t) | 363 | swat_rch_13 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Dégradation spécifique (t/ha) | 364 | swat_sub_14 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Débits m³/s | 365 | swat_rch_14 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Sediment (t) | 366 | swat_rch_14 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Dégradation spécifique (t/ha) | 367 | swat_sub_15 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Débits m³/s | 368 | swat_rch_15 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Sediment (t) | 369 | swat_rch_15 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Dégradation spécifique (t/ha) | 370 | swat_sub_16 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Débits m³/s | 371 | swat_rch_16 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Sediment (t) | 372 | swat_rch_16 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Dégradation spécifique (t/ha) | 373 | swat_sub_17 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Débits m³/s | 374 | swat_rch_17 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Sediment (t) | 375 | swat_rch_17 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Dégradation spécifique (t/ha) | 376 | swat_sub_18 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Débits m³/s | 377 | swat_rch_18 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Sediment (t) | 378 | swat_rch_18 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Dégradation spécifique (t/ha) | 379 | swat_sub_19 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Débits m³/s | 380 | swat_rch_19 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Sediment (t) | 381 | swat_rch_19 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Dégradation spécifique (t/ha) | 382 | swat_sub_1 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Débits m³/s | 383 | swat_rch_1 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Sediment (t) | 384 | swat_rch_1 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Dégradation spécifique (t/ha) | 385 | swat_sub_2 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Débits m³/s | 386 | swat_rch_2 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Sediment (t) | 387 | swat_rch_2 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Dégradation spécifique (t/ha) | 388 | swat_sub_3 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Débits m³/s | 389 | swat_rch_3 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Sediment (t) | 390 | swat_rch_3 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Dégradation spécifique (t/ha) | 391 | swat_sub_4 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Débits m³/s | 392 | swat_rch_4 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Sediment (t) | 393 | swat_rch_4 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Dégradation spécifique (t/ha) | 394 | swat_sub_5 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Débits m³/s | 395 | swat_rch_5 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Sediment (t) | 396 | swat_rch_5 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Dégradation spécifique (t/ha) | 397 | swat_sub_6 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Débits m³/s | 398 | swat_rch_6 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Sediment (t) | 399 | swat_rch_6 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Dégradation spécifique (t/ha) | 400 | swat_sub_7 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Débits m³/s | 401 | swat_rch_7 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Sediment (t) | 402 | swat_rch_7 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Dégradation spécifique (t/ha) | 403 | swat_sub_8 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Débits m³/s | 404 | swat_rch_8 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Sediment (t) | 405 | swat_rch_8 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Dégradation spécifique (t/ha) | 406 | swat_sub_9 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Débits m³/s | 407 | swat_rch_9 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Sediment (t) | 408 | swat_rch_9 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Dégradation spécifique (t/ha) | 409 | swat_sub_10 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Débits m³/s | 410 | swat_rch_10 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Sediment (t) | 411 | swat_rch_10 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Dégradation spécifique (t/ha) | 412 | swat_sub_11 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Débits m³/s | 413 | swat_rch_11 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Sediment (t) | 414 | swat_rch_11 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Dégradation spécifique (t/ha) | 415 | swat_sub_12 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Débits m³/s | 416 | swat_rch_12 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Sediment (t) | 417 | swat_rch_12 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Dégradation spécifique (t/ha) | 418 | swat_sub_13 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Débits m³/s | 419 | swat_rch_13 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Sediment (t) | 420 | swat_rch_13 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Dégradation spécifique (t/ha) | 421 | swat_sub_14 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Débits m³/s | 422 | swat_rch_14 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Sediment (t) | 423 | swat_rch_14 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Dégradation spécifique (t/ha) | 424 | swat_sub_15 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Débits m³/s | 425 | swat_rch_15 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Sediment (t) | 426 | swat_rch_15 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Dégradation spécifique (t/ha) | 427 | swat_sub_16 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Débits m³/s | 428 | swat_rch_16 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Sediment (t) | 429 | swat_rch_16 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Dégradation spécifique (t/ha) | 430 | swat_sub_17 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Débits m³/s | 431 | swat_rch_17 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Sediment (t) | 432 | swat_rch_17 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Dégradation spécifique (t/ha) | 433 | swat_sub_18 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Débits m³/s | 434 | swat_rch_18 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Sediment (t) | 435 | swat_rch_18 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Dégradation spécifique (t/ha) | 436 | swat_sub_19 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Débits m³/s | 437 | swat_rch_19 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Sediment (t) | 438 | swat_rch_19 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Dégradation spécifique (t/ha) | 439 | swat_sub_1 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Débits m³/s | 440 | swat_rch_1 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Sediment (t) | 441 | swat_rch_1 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Dégradation spécifique (t/ha) | 442 | swat_sub_2 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Débits m³/s | 443 | swat_rch_2 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Sediment (t) | 444 | swat_rch_2 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Dégradation spécifique (t/ha) | 445 | swat_sub_3 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Débits m³/s | 446 | swat_rch_3 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Sediment (t) | 447 | swat_rch_3 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Dégradation spécifique (t/ha) | 448 | swat_sub_4 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Débits m³/s | 449 | swat_rch_4 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Sediment (t) | 450 | swat_rch_4 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Dégradation spécifique (t/ha) | 451 | swat_sub_5 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Débits m³/s | 452 | swat_rch_5 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Sediment (t) | 453 | swat_rch_5 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Dégradation spécifique (t/ha) | 454 | swat_sub_6 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Débits m³/s | 455 | swat_rch_6 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Sediment (t) | 456 | swat_rch_6 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Dégradation spécifique (t/ha) | 457 | swat_sub_7 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Débits m³/s | 458 | swat_rch_7 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Sediment (t) | 459 | swat_rch_7 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Dégradation spécifique (t/ha) | 460 | swat_sub_8 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Débits m³/s | 461 | swat_rch_8 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Sediment (t) | 462 | swat_rch_8 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Dégradation spécifique (t/ha) | 463 | swat_sub_9 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Débits m³/s | 464 | swat_rch_9 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Sediment (t) | 465 | swat_rch_9 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Dégradation spécifique (t/ha) | 466 | swat_sub_10 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Débits m³/s | 467 | swat_rch_10 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Sediment (t) | 468 | swat_rch_10 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Dégradation spécifique (t/ha) | 469 | swat_sub_11 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Débits m³/s | 470 | swat_rch_11 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Sediment (t) | 471 | swat_rch_11 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Dégradation spécifique (t/ha) | 472 | swat_sub_12 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Débits m³/s | 473 | swat_rch_12 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Sediment (t) | 474 | swat_rch_12 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Dégradation spécifique (t/ha) | 475 | swat_sub_13 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Débits m³/s | 476 | swat_rch_13 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Sediment (t) | 477 | swat_rch_13 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Dégradation spécifique (t/ha) | 478 | swat_sub_14 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Débits m³/s | 479 | swat_rch_14 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Sediment (t) | 480 | swat_rch_14 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Dégradation spécifique (t/ha) | 481 | swat_sub_15 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Débits m³/s | 482 | swat_rch_15 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Sediment (t) | 483 | swat_rch_15 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Dégradation spécifique (t/ha) | 484 | swat_sub_16 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Débits m³/s | 485 | swat_rch_16 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Sediment (t) | 486 | swat_rch_16 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Dégradation spécifique (t/ha) | 487 | swat_sub_17 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Débits m³/s | 488 | swat_rch_17 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Sediment (t) | 489 | swat_rch_17 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Dégradation spécifique (t/ha) | 490 | swat_sub_18 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Débits m³/s | 491 | swat_rch_18 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Sediment (t) | 492 | swat_rch_18 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Dégradation spécifique (t/ha) | 493 | swat_sub_19 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Débits m³/s | 494 | swat_rch_19 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |
| SWAT Sediment (t) | 495 | swat_rch_19 | 1994-12-31T16:00:00-08:00 | 2023-08-30T17:00:00-07:00 | 10 470 | 0 | 0 | OK |

## 9. Valeurs aberrantes

| Propriété | Unité | Nb valeurs | Min | Max | Moyenne | P1 | Médiane | P99 |
|---|---|---|---|---|---|---|---|---|
| Temperature Mean | degC | 44 444 | -4.51 | 101.1 | 18.970212 | 3.1193 | 18.425 | 34.67 |
| Temperature Min | degC | 45 138 | -9 | 32 | 11.426911 | -2.98 | 10.78 | 26.94 |
| Wind Speed | m/s | 364 | 1.19 | 3.62 | 2.332918 | 1.2626 | 2.36 | 3.3611 |
| Temperature Max | degC | 45 235 | -1.06 | 60.4 | 26.549462 | 8.1734 | 26.2 | 43 |
| Reservoir Inflow | m3 | 19 861 | 0 | 64745080.7 | 300975.963619 | 0 | 0 | 3750387.28 |
| Streamflow | m3/s | 77 950 | 0 | 594 | 2.24037 | 0 | 0.712 | 22.551 |
| Reservoir Restitution | m3 | 6 132 | 0 | 2126000 | 205856.374393 | 0 | 0 | 1789970.4 |
| Evaporation | mm | 2 031 | 11.16 | 938.9 | 298.388795 | 64.139 | 260.4 | 808.21 |
| Precipitation | mm | 107 627 | 0 | 75.5 | 0.403645 | 0 | 0 | 10.974 |
| Humidity Relative | % | 928 | 10.36 | 88.57 | 29.569612 | 14 | 28 | 71.6841 |
| SWAT Débits m³/s | m3/s | 1 141 230 | 0 | 487 | 1.160862 | 0 | 0.183 | 15.3771 |
| SWAT Sediment (t) | tons | 1 141 230 | 0 | 10990000 | 1184.561875 | 0 | 0 | 5071.84 |
| SWAT Dégradation spécifique (t/ha) | t/ha | 1 141 230 | 0 | 754 | 0.119708 | 0 | 0 | 0.951 |

## 10. Débit

| Station | Scénario | Min | Max | Nb valeurs négatives | Nb anomalies |
|---|---|---|---|---|---|
| 1508/38 | OBSERVED | 0 | 379 | 0 | 0 |
| 1585/38 | OBSERVED | 0 | 212 | 0 | 0 |
| 1940/48 | OBSERVED | 0 | 25.4 | 0 | 0 |
| 31/38 | OBSERVED | 0 | 150 | 0 | 0 |
| 867/48 | OBSERVED | 0 | 594 | 0 | 0 |
| swat_rch_1 | scenario_1 | 0 | 7.859 | 0 | 0 |
| swat_rch_10 | scenario_1 | 0 | 25.47 | 0 | 0 |
| swat_rch_11 | scenario_1 | 0 | 123.3 | 0 | 0 |
| swat_rch_12 | scenario_1 | 0.004596 | 124.8 | 0 | 0 |
| swat_rch_13 | scenario_1 | 0 | 165.9 | 0 | 0 |
| swat_rch_14 | scenario_1 | 0 | 60.54 | 0 | 0 |
| swat_rch_15 | scenario_1 | 0 | 312.6 | 0 | 0 |
| swat_rch_16 | scenario_1 | 0 | 336.3 | 0 | 0 |
| swat_rch_17 | scenario_1 | 0 | 355 | 0 | 0 |
| swat_rch_18 | scenario_1 | 0 | 87.37 | 0 | 0 |
| swat_rch_19 | scenario_1 | 0 | 289.4 | 0 | 0 |
| swat_rch_2 | scenario_1 | 0 | 28.8 | 0 | 0 |
| swat_rch_3 | scenario_1 | 0 | 6.82 | 0 | 0 |
| swat_rch_4 | scenario_1 | 0 | 41.85 | 0 | 0 |
| swat_rch_5 | scenario_1 | 0 | 4.25 | 0 | 0 |
| swat_rch_6 | scenario_1 | 0 | 42.19 | 0 | 0 |
| swat_rch_7 | scenario_1 | 0 | 5.057 | 0 | 0 |
| swat_rch_8 | scenario_1 | 0.06556 | 32.07 | 0 | 0 |
| swat_rch_9 | scenario_1 | 0 | 11.02 | 0 | 0 |
| swat_rch_1 | scenario_2 | 0 | 9.447 | 0 | 0 |
| swat_rch_10 | scenario_2 | 0 | 30.64 | 0 | 0 |
| swat_rch_11 | scenario_2 | 0 | 135.3 | 0 | 0 |
| swat_rch_12 | scenario_2 | 0 | 131.5 | 0 | 0 |
| swat_rch_13 | scenario_2 | 0 | 169.1 | 0 | 0 |
| swat_rch_14 | scenario_2 | 0 | 61.81 | 0 | 0 |
| swat_rch_15 | scenario_2 | 0 | 328.4 | 0 | 0 |
| swat_rch_16 | scenario_2 | 0 | 380.8 | 0 | 0 |
| swat_rch_17 | scenario_2 | 0 | 406.7 | 0 | 0 |
| swat_rch_18 | scenario_2 | 0 | 97.38 | 0 | 0 |
| swat_rch_19 | scenario_2 | 0 | 342 | 0 | 0 |
| swat_rch_2 | scenario_2 | 0 | 32.58 | 0 | 0 |
| swat_rch_3 | scenario_2 | 0 | 8.288 | 0 | 0 |
| swat_rch_4 | scenario_2 | 0 | 44.89 | 0 | 0 |
| swat_rch_5 | scenario_2 | 0 | 5.209 | 0 | 0 |
| swat_rch_6 | scenario_2 | 0 | 46.7 | 0 | 0 |
| swat_rch_7 | scenario_2 | 0 | 6.456 | 0 | 0 |
| swat_rch_8 | scenario_2 | 0.05242 | 33.04 | 0 | 0 |
| swat_rch_9 | scenario_2 | 0 | 13.21 | 0 | 0 |
| swat_rch_1 | scenario_3 | 0 | 10.97 | 0 | 0 |
| swat_rch_10 | scenario_3 | 0 | 34.36 | 0 | 0 |
| swat_rch_11 | scenario_3 | 0 | 147.1 | 0 | 0 |
| swat_rch_12 | scenario_3 | 0.01107 | 144.7 | 0 | 0 |
| swat_rch_13 | scenario_3 | 0 | 173.2 | 0 | 0 |
| swat_rch_14 | scenario_3 | 0 | 63.37 | 0 | 0 |
| swat_rch_15 | scenario_3 | 0 | 351.8 | 0 | 0 |
| swat_rch_16 | scenario_3 | 0 | 431.2 | 0 | 0 |
| swat_rch_17 | scenario_3 | 0 | 465.2 | 0 | 0 |
| swat_rch_18 | scenario_3 | 0 | 108.5 | 0 | 0 |
| swat_rch_19 | scenario_3 | 0 | 403.7 | 0 | 0 |
| swat_rch_2 | scenario_3 | 0 | 36.9 | 0 | 0 |
| swat_rch_3 | scenario_3 | 0 | 9.627 | 0 | 0 |
| swat_rch_4 | scenario_3 | 0 | 48.53 | 0 | 0 |
| swat_rch_5 | scenario_3 | 0 | 5.966 | 0 | 0 |
| swat_rch_6 | scenario_3 | 0 | 50.54 | 0 | 0 |
| swat_rch_7 | scenario_3 | 0 | 7.605 | 0 | 0 |
| swat_rch_8 | scenario_3 | 0.07094 | 36.76 | 0 | 0 |
| swat_rch_9 | scenario_3 | 0 | 15 | 0 | 0 |
| swat_rch_1 | scenario_4 | 0 | 10.62 | 0 | 0 |
| swat_rch_10 | scenario_4 | 0 | 34.42 | 0 | 0 |
| swat_rch_11 | scenario_4 | 0 | 149.8 | 0 | 0 |
| swat_rch_12 | scenario_4 | 0.01206 | 153.9 | 0 | 0 |
| swat_rch_13 | scenario_4 | 0 | 176.6 | 0 | 0 |
| swat_rch_14 | scenario_4 | 0 | 65.07 | 0 | 0 |
| swat_rch_15 | scenario_4 | 0 | 367.3 | 0 | 0 |
| swat_rch_16 | scenario_4 | 0 | 451.1 | 0 | 0 |
| swat_rch_17 | scenario_4 | 0 | 487 | 0 | 0 |
| swat_rch_18 | scenario_4 | 0 | 109.9 | 0 | 0 |
| swat_rch_19 | scenario_4 | 0 | 468.6 | 0 | 0 |
| swat_rch_2 | scenario_4 | 0 | 38.4 | 0 | 0 |
| swat_rch_3 | scenario_4 | 0 | 9.253 | 0 | 0 |
| swat_rch_4 | scenario_4 | 0 | 47.1 | 0 | 0 |
| swat_rch_5 | scenario_4 | 0 | 5.461 | 0 | 0 |
| swat_rch_6 | scenario_4 | 0 | 50.8 | 0 | 0 |
| swat_rch_7 | scenario_4 | 0 | 7.389 | 0 | 0 |
| swat_rch_8 | scenario_4 | 0.06828 | 36.37 | 0 | 0 |
| swat_rch_9 | scenario_4 | 0 | 14.54 | 0 | 0 |
| swat_rch_1 | SWAT_OUTPUT_01 | 0 | 333.2 | 0 | 0 |
| swat_rch_10 | SWAT_OUTPUT_01 | 0 | 333.2 | 0 | 0 |
| swat_rch_11 | SWAT_OUTPUT_01 | 0 | 373.2 | 0 | 0 |
| swat_rch_12 | SWAT_OUTPUT_01 | 0 | 46.94 | 0 | 0 |
| swat_rch_13 | SWAT_OUTPUT_01 | 0 | 19.35 | 0 | 0 |
| swat_rch_14 | SWAT_OUTPUT_01 | 0 | 387.3 | 0 | 0 |
| swat_rch_15 | SWAT_OUTPUT_01 | 0 | 36.3 | 0 | 0 |
| swat_rch_16 | SWAT_OUTPUT_01 | 0.01182 | 4.327 | 0 | 0 |
| swat_rch_17 | SWAT_OUTPUT_01 | 0 | 14.57 | 0 | 0 |
| swat_rch_18 | SWAT_OUTPUT_01 | 0 | 12.1 | 0 | 0 |
| swat_rch_19 | SWAT_OUTPUT_01 | 0 | 19.09 | 0 | 0 |
| swat_rch_2 | SWAT_OUTPUT_01 | 0 | 11.63 | 0 | 0 |
| swat_rch_20 | SWAT_OUTPUT_01 | 0 | 23.81 | 0 | 0 |
| swat_rch_21 | SWAT_OUTPUT_01 | 0 | 23.05 | 0 | 0 |
| swat_rch_22 | SWAT_OUTPUT_01 | 0 | 37.95 | 0 | 0 |
| swat_rch_23 | SWAT_OUTPUT_01 | 0 | 26.13 | 0 | 0 |
| swat_rch_24 | SWAT_OUTPUT_01 | 0 | 13.28 | 0 | 0 |
| swat_rch_25 | SWAT_OUTPUT_01 | 0 | 70.71 | 0 | 0 |
| swat_rch_26 | SWAT_OUTPUT_01 | 0 | 49.16 | 0 | 0 |
| swat_rch_27 | SWAT_OUTPUT_01 | 0 | 147.4 | 0 | 0 |
| swat_rch_28 | SWAT_OUTPUT_01 | 0 | 246.7 | 0 | 0 |
| swat_rch_29 | SWAT_OUTPUT_01 | 0 | 266.5 | 0 | 0 |
| swat_rch_3 | SWAT_OUTPUT_01 | 0 | 28.34 | 0 | 0 |
| swat_rch_30 | SWAT_OUTPUT_01 | 0.0672 | 121.1 | 0 | 0 |
| swat_rch_31 | SWAT_OUTPUT_01 | 0.1061 | 36.44 | 0 | 0 |
| swat_rch_32 | SWAT_OUTPUT_01 | 0.02932 | 300.3 | 0 | 0 |
| swat_rch_33 | SWAT_OUTPUT_01 | 0.1025 | 87.53 | 0 | 0 |
| swat_rch_4 | SWAT_OUTPUT_01 | 0 | 6.703 | 0 | 0 |
| swat_rch_5 | SWAT_OUTPUT_01 | 0 | 32.49 | 0 | 0 |
| swat_rch_6 | SWAT_OUTPUT_01 | 0 | 66.22 | 0 | 0 |
| swat_rch_7 | SWAT_OUTPUT_01 | 0 | 45.48 | 0 | 0 |
| swat_rch_8 | SWAT_OUTPUT_01 | 0 | 37.16 | 0 | 0 |
| swat_rch_9 | SWAT_OUTPUT_01 | 0 | 5.632 | 0 | 0 |

## 11. Climat

| Station | Scénario | Min | Max | Nb précipitations négatives | Nb anomalies précipitations |
|---|---|---|---|---|---|
| 1508/38 | OBSERVED | 0 | 64.7 | 0 | 0 |
| 1585/38 | OBSERVED | 0 | 63.2 | 0 | 0 |
| 1940/48 | OBSERVED | 0 | 63.8 | 0 | 0 |
| 31/38 | OBSERVED | 0 | 75.5 | 0 | 0 |
| 867/48 | OBSERVED | 0 | 64 | 0 | 0 |
| hammat_my_ali_cherif | OBSERVED | 0 | 52 | 0 | 0 |
| pont_arfoud | OBSERVED | 0 | 42.6 | 0 | 0 |
| taouz | OBSERVED | 0 | 53.5 | 0 | 0 |

| Propriété température | Nb extrêmes | Min | Max |
|---|---|---|---|
| Temperature Max | 1 | -1.06 | 60.4 |
| Temperature Mean | 1 | -4.51 | 101.1 |
| Temperature Min | 0 | -9 | 32 |

- `Tmin > Tmax` : **1** cas ; exemple : `35 @ 2022-03-01`
- `Tmean` hors intervalle `[Tmin, Tmax]` : **6** cas ; exemple : `12 @ 1999-11-01`

## 12. Sédiments / transport solide

### access.rch_results

| Scénario | Lignes | sed_out négatif | sed_in négatif | sed_out NULL | Max sed_out | P99 sed_out |
|---|---|---|---|---|---|---|
| etat_actuel | 596 790 | 0 | 0 | 0 | 16670000 | 57360 |
| scenario_1 | 199 481 | 0 | 0 | 0 | 4009000 | 1773.4 |
| scenario_2 | 199 481 | 0 | 0 | 0 | 5423000 | 3014 |
| scenario_3 | 199 481 | 0 | 0 | 0 | 7720000 | 5285.2 |
| scenario_4 | 199 481 | 0 | 0 | 0 | 16670000 | 51314 |
| ssp126 | 747 707 | 0 | 0 | 0 | 10990000 | 37378.8 |
| ssp245 | 747 707 | 0 | 0 | 0 | 10990000 | 43769.4 |
| ssp585 | 747 707 | 0 | 0 | 0 | 10990000 | 34790 |

### access.sub_results

| Scénario | Lignes | syld négatif | syld NULL | Max syld | P99 syld |
|---|---|---|---|---|---|
| etat_actuel | 596 790 | 0 | 0 | 1190.957 | 5.29 |
| scenario_1 | 199 481 | 0 | 0 | 149.982 | 0.681 |
| scenario_2 | 199 481 | 0 | 0 | 183.978 | 1.12 |
| scenario_3 | 199 481 | 0 | 0 | 305.416 | 1.79 |
| scenario_4 | 199 481 | 0 | 0 | 1190.957 | 4.9636 |
| ssp126 | 747 707 | 0 | 0 | 754 | 2.8 |
| ssp245 | 747 707 | 0 | 0 | 754 | 3.35 |
| ssp585 | 747 707 | 0 | 0 | 754 | 2.71 |

## 13. Doublons SWAT — audit précis

### access.rch_results

| Table | Type doublon | Groupes | Lignes | % | Interprétation |
|---|---|---|---|---|---|
| access.rch_results | doublons_stricts | 0 | 0 | 0.00 | répétition technique probable |
| access.rch_results | meme_cle_memes_valeurs | 0 | 0 | 0.00 | répétition technique probable |
| access.rch_results | meme_cle_valeurs_differentes | 0 | 0 | 0.00 | mêmes clés avec valeurs divergentes |
| access.rch_results | imports_repetes_entre_batches | 0 | 0 | 0.00 | répétition technique probable |

- Total lignes inspectées : **3 637 835**
- Scénarios présents dans la table : `etat_actuel, scenario_1, scenario_2, scenario_3, scenario_4, ssp126, ssp245, ssp585`
- Conclusion métier : Aucun doublon significatif détecté.

### access.sub_results

| Table | Type doublon | Groupes | Lignes | % | Interprétation |
|---|---|---|---|---|---|
| access.sub_results | doublons_stricts | 0 | 0 | 0.00 | répétition technique probable |
| access.sub_results | meme_cle_memes_valeurs | 0 | 0 | 0.00 | répétition technique probable |
| access.sub_results | meme_cle_valeurs_differentes | 0 | 0 | 0.00 | mêmes clés avec valeurs divergentes |
| access.sub_results | imports_repetes_entre_batches | 0 | 0 | 0.00 | répétition technique probable |

- Total lignes inspectées : **3 637 835**
- Scénarios présents dans la table : `etat_actuel, scenario_1, scenario_2, scenario_3, scenario_4, ssp126, ssp245, ssp585`
- Conclusion métier : Aucun doublon significatif détecté.

## 14. Analyse des import batches SWAT

### staging.swat_mdb_imports

| Batch | Source | Scénario | Hash | Nb source | Nb cible | Statut | Anomalie |
|---|---|---|---|---|---|---|---|
| 407 | SWATOutput.mdb | scenario_4 | 48bb4adbd4d80a30ca41ce3cbaae0d0765f9ce2a5646ac3f227b468829196ac9 | 551 | 551 | loaded | OK |
| 405 | SWATOutput.mdb | scenario_4 | 48bb4adbd4d80a30ca41ce3cbaae0d0765f9ce2a5646ac3f227b468829196ac9 | 551 | 551 | loaded | OK |
| 403 | SWAT_HAD.mdb | scenario_4 | a1b7adde23c2624e1c999b148781a870a1433f16141057f61b1aa21409ccc64b | 88 | 88 | loaded | OK |
| 401 | SWAT_HAD.mdb | scenario_4 | a1b7adde23c2624e1c999b148781a870a1433f16141057f61b1aa21409ccc64b | 3 991 | 3 991 | loaded | OK |
| 399 | SWAT_HAD.mdb | scenario_4 | a1b7adde23c2624e1c999b148781a870a1433f16141057f61b1aa21409ccc64b | 506 | 506 | loaded | OK |
| 397 | SWATOutput.mdb | scenario_3 | 6380b5191719352f51d7c7ceca4fbd0a57ba82918f4a0ea81abfa87ab3a14ea7 | 551 | 551 | loaded | OK |
| 395 | SWATOutput.mdb | scenario_3 | 6380b5191719352f51d7c7ceca4fbd0a57ba82918f4a0ea81abfa87ab3a14ea7 | 551 | 551 | loaded | OK |
| 393 | SWAT_HAD.mdb | scenario_3 | 92db44d64b604e8949bcc83d0b4ad715bd4f75c663063328b07f7daf76f9e7da | 88 | 88 | loaded | OK |
| 391 | SWAT_HAD.mdb | scenario_3 | 92db44d64b604e8949bcc83d0b4ad715bd4f75c663063328b07f7daf76f9e7da | 4 474 | 4 474 | loaded | OK |
| 389 | SWAT_HAD.mdb | scenario_3 | 92db44d64b604e8949bcc83d0b4ad715bd4f75c663063328b07f7daf76f9e7da | 560 | 560 | loaded | OK |
| 387 | SWATOutput.mdb | scenario_2 | 34ad5f019a76ca0661b6a554206152c81ac1be8686d5509e90bfaab4ef796da3 | 551 | 551 | loaded | OK |
| 385 | SWATOutput.mdb | scenario_2 | 34ad5f019a76ca0661b6a554206152c81ac1be8686d5509e90bfaab4ef796da3 | 551 | 551 | loaded | OK |
| 383 | SWAT_HAD.mdb | scenario_2 | 9d3252f886f6fae2b5a155ce172233c866579bebe833fae8d61c13f975fa6326 | 88 | 88 | loaded | OK |
| 381 | SWAT_HAD.mdb | scenario_2 | 9d3252f886f6fae2b5a155ce172233c866579bebe833fae8d61c13f975fa6326 | 4 454 | 4 454 | loaded | OK |
| 379 | SWAT_HAD.mdb | scenario_2 | 9d3252f886f6fae2b5a155ce172233c866579bebe833fae8d61c13f975fa6326 | 558 | 558 | loaded | OK |
| 377 | SWATOutput.mdb | scenario_1 | 51dd2a42cef6d0a40907d0cf9cc69005a50c4130154996b178a82cd16e370d28 | 551 | 551 | loaded | OK |
| 375 | SWATOutput.mdb | scenario_1 | 51dd2a42cef6d0a40907d0cf9cc69005a50c4130154996b178a82cd16e370d28 | 551 | 551 | loaded | OK |
| 373 | SWAT_HAD.mdb | scenario_1 | 7ec54fb6295bde9665584402b83a3e12027bd4ee5a287d440a59ccf042d690dc | 88 | 88 | loaded | OK |
| 371 | SWAT_HAD.mdb | scenario_1 | 7ec54fb6295bde9665584402b83a3e12027bd4ee5a287d440a59ccf042d690dc | 4 398 | 4 398 | loaded | OK |
| 369 | SWAT_HAD.mdb | scenario_1 | 7ec54fb6295bde9665584402b83a3e12027bd4ee5a287d440a59ccf042d690dc | 552 | 552 | loaded | OK |
| 153 | SWATOutput.mdb | etat_actuel | 123c228b90752b354c825c45e2b8dd3ce5abf81164938e78e8d2673157d53b8d | 551 | 198 930 | loaded | OK |
| 151 | SWATOutput.mdb | etat_actuel | 123c228b90752b354c825c45e2b8dd3ce5abf81164938e78e8d2673157d53b8d | 551 | 198 930 | loaded | OK |
| 149 | SWAT_HAD.mdb | etat_actuel | 25ae0e142e2485aa8d21d8deb4366ff04ecbc2dcfd0780bb13a83156d2d6df05 | 88 | 1 129 | loaded | OK |
| 147 | SWAT_HAD.mdb | etat_actuel | 25ae0e142e2485aa8d21d8deb4366ff04ecbc2dcfd0780bb13a83156d2d6df05 | 3 991 | 3 991 | loaded | OK |
| 145 | SWAT_HAD.mdb | etat_actuel | 25ae0e142e2485aa8d21d8deb4366ff04ecbc2dcfd0780bb13a83156d2d6df05 | 506 | 506 | loaded | OK |
| 143 | SWATOutput.mdb | etat_actuel | 5e18ef276515d0c2c4d95d1397a6e7fc24f97ff5ed2e1c910bcd799fad3ba099 | 6 536 | 198 930 | loaded | OK |
| 141 | SWATOutput.mdb | etat_actuel | 5e18ef276515d0c2c4d95d1397a6e7fc24f97ff5ed2e1c910bcd799fad3ba099 | 6 536 | 198 930 | loaded | OK |
| 139 | SWAT_HAD.mdb | etat_actuel | 551c49e6884891869ff07f2f77bf46538f947bdb74b806db495fc68a3d8a271d | 88 | 1 129 | loaded | OK |
| 137 | SWAT_HAD.mdb | etat_actuel | 551c49e6884891869ff07f2f77bf46538f947bdb74b806db495fc68a3d8a271d | 3 991 | 3 991 | loaded | OK |
| 135 | SWAT_HAD.mdb | etat_actuel | 551c49e6884891869ff07f2f77bf46538f947bdb74b806db495fc68a3d8a271d | 506 | 506 | loaded | OK |
| 133 | SWATOutput.mdb | etat_actuel | e5c96c90e6e2efb197fc5e74e4f5ecf23dbcc22cb30bddc96bf7d3fbdcbde1a0 | 198 930 | 198 930 | loaded | OK |
| 131 | SWATOutput.mdb | etat_actuel | e5c96c90e6e2efb197fc5e74e4f5ecf23dbcc22cb30bddc96bf7d3fbdcbde1a0 | 198 930 | 198 930 | loaded | OK |
| 129 | SWAT_HAD.mdb | etat_actuel | 91d71608424f72d828f5e1d89bcd9252b53c3cbeb5b300341841b7cdd0126499 | 88 | 1 129 | loaded | OK |
| 127 | SWAT_HAD.mdb | etat_actuel | 91d71608424f72d828f5e1d89bcd9252b53c3cbeb5b300341841b7cdd0126499 | 3 991 | 3 991 | loaded | OK |
| 125 | SWAT_HAD.mdb | etat_actuel | 91d71608424f72d828f5e1d89bcd9252b53c3cbeb5b300341841b7cdd0126499 | 506 | 506 | loaded | OK |
| 123 | SWATOutput.mdb | ssp585 | d2078bcf09032fd2b434b7274506ff5016acab92995c634fc36dfe5d57aea0f1 | 399 | 199 329 | loaded | OK |
| 121 | SWATOutput.mdb | ssp585 | d2078bcf09032fd2b434b7274506ff5016acab92995c634fc36dfe5d57aea0f1 | 399 | 199 329 | loaded | OK |
| 119 | SWAT_HAD.mdb | ssp585 | 5ef08dc62a6ecfe0f21331ed9261a0d4308ee416aaa3132ba30c95e2b94f4770 | 88 | 1 129 | loaded | OK |
| 117 | SWAT_HAD.mdb | ssp585 | 5ef08dc62a6ecfe0f21331ed9261a0d4308ee416aaa3132ba30c95e2b94f4770 | 3 991 | 3 991 | loaded | OK |
| 115 | SWAT_HAD.mdb | ssp585 | 5ef08dc62a6ecfe0f21331ed9261a0d4308ee416aaa3132ba30c95e2b94f4770 | 506 | 506 | loaded | OK |
| 113 | SWATOutput.mdb | ssp585 | 219077832bdc2e10870f9c7fee1f8e1059d5377ceaf7edd148654981bf15696b | 4 788 | 203 718 | loaded | OK |
| 111 | SWATOutput.mdb | ssp585 | 219077832bdc2e10870f9c7fee1f8e1059d5377ceaf7edd148654981bf15696b | 4 788 | 203 718 | loaded | OK |
| 109 | SWAT_HAD.mdb | ssp585 | 26d19549fd451eddea749d1137e30c24acf5855240c4f2c8306f373f145d3858 | 88 | 1 129 | loaded | OK |
| 107 | SWAT_HAD.mdb | ssp585 | 26d19549fd451eddea749d1137e30c24acf5855240c4f2c8306f373f145d3858 | 3 991 | 3 991 | loaded | OK |
| 105 | SWAT_HAD.mdb | ssp585 | 26d19549fd451eddea749d1137e30c24acf5855240c4f2c8306f373f145d3858 | 506 | 506 | loaded | OK |
| 103 | SWATOutput.mdb | ssp585 | f53f56b1e1d3a084175d1fd350e0a2f9f02595258513aa8e49077d2122b82385 | 145 730 | 344 660 | loaded | OK |
| 101 | SWATOutput.mdb | ssp585 | f53f56b1e1d3a084175d1fd350e0a2f9f02595258513aa8e49077d2122b82385 | 145 730 | 344 660 | loaded | OK |
| 99 | SWAT_HAD.mdb | ssp585 | 883ed850045072b58439a5bdd3433da5b4d74ddde5f296dc6a36dad37c8b625d | 88 | 1 129 | loaded | OK |
| 97 | SWAT_HAD.mdb | ssp585 | 883ed850045072b58439a5bdd3433da5b4d74ddde5f296dc6a36dad37c8b625d | 3 991 | 3 991 | loaded | OK |
| 95 | SWAT_HAD.mdb | ssp585 | 883ed850045072b58439a5bdd3433da5b4d74ddde5f296dc6a36dad37c8b625d | 506 | 506 | loaded | OK |
| 93 | SWATOutput.mdb | ssp245 | 68e0adb0009476a47c6548b06f20434449a355abe67be6512ceff5ae0de86379 | 399 | 199 329 | loaded | OK |
| 91 | SWATOutput.mdb | ssp245 | 68e0adb0009476a47c6548b06f20434449a355abe67be6512ceff5ae0de86379 | 399 | 199 329 | loaded | OK |
| 89 | SWAT_HAD.mdb | ssp245 | 0c9488de9fd694fb8ab728d14d3f75b00d76653df3462bbdafa24b89d9c7dc0f | 88 | 1 129 | loaded | OK |
| 87 | SWAT_HAD.mdb | ssp245 | 0c9488de9fd694fb8ab728d14d3f75b00d76653df3462bbdafa24b89d9c7dc0f | 3 991 | 3 991 | loaded | OK |
| 85 | SWAT_HAD.mdb | ssp245 | 0c9488de9fd694fb8ab728d14d3f75b00d76653df3462bbdafa24b89d9c7dc0f | 506 | 506 | loaded | OK |
| 83 | SWATOutput.mdb | ssp245 | 4a3d7379e7ab4f5525351e94ede39a6fc21645ac6d779173d7060ebb9ac6396b | 4 788 | 203 718 | loaded | OK |
| 81 | SWATOutput.mdb | ssp245 | 4a3d7379e7ab4f5525351e94ede39a6fc21645ac6d779173d7060ebb9ac6396b | 4 788 | 203 718 | loaded | OK |
| 79 | SWAT_HAD.mdb | ssp245 | d36b5765fe0d114f9436cdcd7673140c7c248a2b8bf2ec0dc73d03963af35255 | 88 | 1 129 | loaded | OK |
| 77 | SWAT_HAD.mdb | ssp245 | d36b5765fe0d114f9436cdcd7673140c7c248a2b8bf2ec0dc73d03963af35255 | 3 991 | 3 991 | loaded | OK |
| 75 | SWAT_HAD.mdb | ssp245 | d36b5765fe0d114f9436cdcd7673140c7c248a2b8bf2ec0dc73d03963af35255 | 506 | 506 | loaded | OK |
| 73 | SWATOutput.mdb | ssp245 | 3c3bf68631c6f77e04f9597bcca4c60a46daa9c6309b720fc129b85bfce1d52d | 145 730 | 344 660 | loaded | OK |
| 71 | SWATOutput.mdb | ssp245 | 3c3bf68631c6f77e04f9597bcca4c60a46daa9c6309b720fc129b85bfce1d52d | 145 730 | 344 660 | loaded | OK |
| 69 | SWAT_HAD.mdb | ssp245 | 5191da2dc71e121b20308be84516abd0d903252527f6ef9da7fabebee0e6da3c | 88 | 1 129 | loaded | OK |
| 67 | SWAT_HAD.mdb | ssp245 | 5191da2dc71e121b20308be84516abd0d903252527f6ef9da7fabebee0e6da3c | 3 991 | 3 991 | loaded | OK |
| 65 | SWAT_HAD.mdb | ssp245 | 5191da2dc71e121b20308be84516abd0d903252527f6ef9da7fabebee0e6da3c | 506 | 506 | loaded | OK |
| 63 | SWATOutput.mdb | ssp126 | 219cc4dead74a2653506f09b3c8f5dde073a07bc8829f81fa6b936bed6d5bed8 | 399 | 199 329 | loaded | OK |
| 61 | SWATOutput.mdb | ssp126 | 219cc4dead74a2653506f09b3c8f5dde073a07bc8829f81fa6b936bed6d5bed8 | 399 | 199 329 | loaded | OK |
| 59 | SWAT_HAD.mdb | ssp126 | 00e2e13ff752187ddfbb2d504d89aa80900ce152cb8cfc073915d635d21410b2 | 88 | 1 129 | loaded | OK |
| 57 | SWAT_HAD.mdb | ssp126 | 00e2e13ff752187ddfbb2d504d89aa80900ce152cb8cfc073915d635d21410b2 | 3 991 | 3 991 | loaded | OK |
| 55 | SWAT_HAD.mdb | ssp126 | 00e2e13ff752187ddfbb2d504d89aa80900ce152cb8cfc073915d635d21410b2 | 506 | 506 | loaded | OK |
| 53 | SWATOutput.mdb | ssp126 | b0725c73db315e3383bd5ef9bd43af157269e2349728fc0fff07ece999a66142 | 4 788 | 203 718 | loaded | OK |
| 51 | SWATOutput.mdb | ssp126 | b0725c73db315e3383bd5ef9bd43af157269e2349728fc0fff07ece999a66142 | 4 788 | 203 718 | loaded | OK |
| 31 | SWAT_HAD.mdb | ssp126 | f2a9052ba418d01770fec5ffafbd3e0bed755acad8990bc4dba8bad9485b82c0 | 88 | 1 129 | loaded | OK |
| 29 | SWAT_HAD.mdb | ssp126 | f2a9052ba418d01770fec5ffafbd3e0bed755acad8990bc4dba8bad9485b82c0 | 3 991 | 3 991 | loaded | OK |
| 27 | SWAT_HAD.mdb | ssp126 | f2a9052ba418d01770fec5ffafbd3e0bed755acad8990bc4dba8bad9485b82c0 | 506 | 506 | loaded | OK |
| 25 | SWATOutput.mdb | ssp126 | 288022caff0c572d1691547964622d4d8f3639ebc36c07426aa6147d9ad287b8 | 145 730 | 344 660 | loaded | OK |
| 23 | SWATOutput.mdb | ssp126 | 288022caff0c572d1691547964622d4d8f3639ebc36c07426aa6147d9ad287b8 | 145 730 | 344 660 | loaded | OK |
| 21 | SWAT_HAD.mdb | ssp126 | 7bf49bcd452434c1098abcb1d0a9d09aa51be0878fb5b7ada6095158d1f14002 | 88 | 1 129 | loaded | OK |
| 19 | SWAT_HAD.mdb | ssp126 | 7bf49bcd452434c1098abcb1d0a9d09aa51be0878fb5b7ada6095158d1f14002 | 3 991 | 3 991 | loaded | OK |
| 17 | SWAT_HAD.mdb | ssp126 | 7bf49bcd452434c1098abcb1d0a9d09aa51be0878fb5b7ada6095158d1f14002 | 506 | 506 | loaded | OK |

### core.data_batches

| Batch | Source | Scénario | Hash | Nb source | Nb cible | Statut | Anomalie |
|---|---|---|---|---|---|---|---|
| SWAT_MANUAL_20260422_02 | SWAT | SWAT_OUTPUT | — | 1 036 530 | 1 036 530 | finished | OK |

## 15. Reaches

| Core | GIS | IDs communs | Manquants GIS | Manquants Core | Length négative | Geom invalides core | Geom invalides gis | reach_id NULL access | reach_code NULL access | sub_code distinct access |
|---|---|---|---|---|---|---|---|---|---|---|
| 33 | 19 | 19 | 14 | 0 | 0 | 1 | 0 | 3 637 835 | 3 637 835 | 19 |

## 16. Sous-bassins

| Core | GIS | IDs communs | Manquants GIS | Manquants Core | Surface non positive | Geom invalides core | Geom invalides gis | sub_code distinct access |
|---|---|---|---|---|---|---|---|---|
| 33 | 19 | 19 | 14 | 0 | 0 | 3 | 0 | 19 |

## 17. Bassins / catchments

| Catchment | Nom | Nb stations | Nb reaches | Nb barrages | Géométrie invalide |
|---|---|---|---|---|---|
| 1 | Subbasin 1 | 102 | 1 | 12 | Ring Self-intersection[-4.46408938724013 32.000886203934] |
| 2 | Subbasin 2 | 0 | 1 | 0 | Ring Self-intersection[-4.36887219117569 32.1134276152631] |
| 3 | Subbasin 3 | 0 | 1 | 0 | Ring Self-intersection[-4.98975117860206 32.2111845531314] |
| 4 | Subbasin 4 | 0 | 1 | 0 | NON |
| 5 | Subbasin 5 | 0 | 1 | 0 | NON |
| 6 | Subbasin 6 | 0 | 1 | 0 | NON |
| 7 | Subbasin 7 | 0 | 1 | 0 | NON |
| 8 | Subbasin 8 | 0 | 1 | 0 | NON |
| 9 | Subbasin 9 | 0 | 1 | 0 | NON |
| 10 | Subbasin 10 | 0 | 1 | 0 | NON |
| 11 | Subbasin 11 | 0 | 1 | 0 | NON |
| 12 | Subbasin 12 | 0 | 1 | 0 | NON |
| 13 | Subbasin 13 | 0 | 1 | 0 | NON |
| 14 | Subbasin 14 | 0 | 1 | 0 | NON |
| 15 | Subbasin 15 | 0 | 1 | 0 | NON |
| 16 | Subbasin 16 | 0 | 1 | 0 | NON |
| 17 | Subbasin 17 | 0 | 1 | 0 | NON |
| 18 | Subbasin 18 | 0 | 1 | 0 | NON |
| 19 | Subbasin 19 | 0 | 1 | 0 | NON |
| 20 | Subbasin 20 | 0 | 1 | 0 | NON |
| 21 | Subbasin 21 | 0 | 1 | 0 | NON |
| 22 | Subbasin 22 | 0 | 1 | 0 | NON |
| 23 | Subbasin 23 | 0 | 1 | 0 | NON |
| 24 | Subbasin 24 | 0 | 1 | 0 | NON |
| 25 | Subbasin 25 | 0 | 1 | 0 | NON |
| 26 | Subbasin 26 | 0 | 1 | 0 | NON |
| 27 | Subbasin 27 | 0 | 1 | 0 | NON |
| 28 | Subbasin 28 | 0 | 1 | 0 | NON |
| 29 | Subbasin 29 | 0 | 1 | 0 | NON |
| 30 | Subbasin 30 | 0 | 1 | 0 | NON |
| 31 | Subbasin 31 | 0 | 1 | 0 | NON |
| 32 | Subbasin 32 | 0 | 1 | 0 | NON |
| 33 | Subbasin 33 | 0 | 1 | 0 | NON |

## 18. Barrages / bathymétrie

| Reservoir | Code | Nom | Points bathy | Min cote | Max cote | Min volume | Max volume |
|---|---|---|---|---|---|---|---|
| 1 | akrouz | AKROUZ | 0 | — | — | — | — |
| 2 | 1940/48 | HASSAN ADDAKHIL | 4 401 | 1081 | 1125 | 0 | 331.58 |
| 3 | achbarou | ACHBAROU | 0 | — | — | — | — |
| 4 | toudgha | TOUDGHA | 0 | — | — | — | — |
| 5 | kaddoussa | KADDOUSSA | 0 | — | — | — | — |
| 6 | assif_ouamrane | ASSIF OUAMRANE | 0 | — | — | — | — |
| 7 | douiss | DOUISS | 0 | — | — | — | — |
| 8 | defilia | DEFILIA | 0 | — | — | — | — |
| 9 | douiss_figuig | DOUISS FIGUIG | 0 | — | — | — | — |
| 10 | el_baida | EL BAIDA | 0 | — | — | — | — |
| 11 | boutaaricht | BOUTAARICHT | 0 | — | — | — | — |
| 12 | timkit | TIMKIT | 0 | — | — | — | — |

- Barrages sans bathymétrie : **11** ; bathymétries sans barrage : **0**.
- Campagnes dupliquées : **0** ; années incohérentes : **0** ; volumes négatifs campagnes : **0** ; volumes négatifs bathy : **0**.

| Reservoir | Pas décroissants volume/cote |
|---|---|

## 19. Siltation / envasement

| Table | Lignes | Utilisée | Source réelle des données | Cohérence |
|---|---|---|---|---|
| hydro.bathymetry_campaigns | 6 | OUI | source primaire réelle | OK |
| core.reservoir_bathymetry | 4 401 | OUI | courbe hauteur-surface-volume réelle | OK |
| hydro.siltation_hsv | 0 | OUI (fallback) / dynamique | calcul dynamique depuis bathymetry_campaigns + reservoir_bathymetry | structure vide mais contournée dynamiquement |
| hydro.siltation_indicators | 0 | OUI (optionnel) / dynamique | calcul dynamique depuis bathymetry_campaigns | structure vide mais indicateurs calculables |
| hydro.siltation_evolution | 0 | OUI (legacy) | aucune source réelle actuelle trouvée dans la table | incohérente: endpoint actif mais table vide |

## 20. PostGIS — qualité métier

| Table | SRID | Invalides | Vides | NULL | Non simples | Doublons | Raison principale |
|---|---|---|---|---|---|---|---|
| core.catchments | 4326 | 3 | 0 | 0 | 3 | 0 | Ring Self-intersection[-4.36887219117569 32.1134276152631] \| Ring Self-intersection[-4.46408938724013 32.000886203934] \| Ring Self-intersection[-4.98975117860206 32.2111845531314] |
| core.reaches | 4326 | 1 | 0 | 0 | 29 | 0 | Too few points in geometry component[-4.46484716232041 32.0004867648342] |
| core.stations | 4326 | 0 | 0 | 68 | 0 | 0 | — |
| core.subbasins | 4326 | 3 | 0 | 0 | 3 | 0 | Ring Self-intersection[-4.36887219117569 32.1134276152631] \| Ring Self-intersection[-4.46408938724013 32.000886203934] \| Ring Self-intersection[-4.98975117860206 32.2111845531314] |
| core.reservoirs | 4326 | 0 | 0 | 0 | 0 | 0 | — |
| gis.reach_shapes | 4326 | 0 | 0 | 0 | 9 | 0 | — |
| gis.subbasin_shapes | 4326 | 0 | 0 | 0 | 0 | 0 | — |
| gis.meteo_stations | 4326 | 0 | 0 | 0 | 0 | 0 | — |

## 21. Cohérence core ↔ gis

| Entité | Core | GIS | IDs communs | Core absent du GIS | GIS absent du Core | Géométries différentes | Géométries invalides |
|---|---|---|---|---|---|---|---|
| stations | 102 | 5 | 5 | 97 | 0 | 5 | core=68 NULL / gis=0 invalides |
| reaches | 33 | 19 | 19 | 14 | 0 | 19 | core=1 / gis=0 |
| subbasins | 33 | 19 | 19 | 14 | 0 | 19 | core=3 / gis=0 |

## 22. Cohérence core ↔ public

| Objet | Lignes core | Lignes public | Conclusion |
|---|---|---|---|
| measurements | 3 773 400 | 3 773 400 | OK |
| reaches | 33 | 33 | OK |
| stations | 102 | 102 | OK |
| subbasins | 33 | 33 | OK |
| timeseries | 383 | 383 | OK |

## 23. Cohérence core ↔ access

| Scénario | rch access | sub access | séries core | mesures core | Statut |
|---|---|---|---|---|---|
| scenario_1 | 199 481 | 199 481 | 57 | 596 790 | SYNCHRONISÉ |
| scenario_2 | 199 481 | 199 481 | 57 | 596 790 | SYNCHRONISÉ |
| scenario_3 | 199 481 | 199 481 | 57 | 596 790 | SYNCHRONISÉ |
| scenario_4 | 199 481 | 199 481 | 57 | 596 790 | SYNCHRONISÉ |
| etat_actuel | 596 790 | 596 790 | 0 | 0 | ACCESS UNIQUEMENT |
| ssp126 | 747 707 | 747 707 | 0 | 0 | ACCESS UNIQUEMENT |
| ssp245 | 747 707 | 747 707 | 0 | 0 | ACCESS UNIQUEMENT |
| ssp585 | 747 707 | 747 707 | 0 | 0 | ACCESS UNIQUEMENT |
| SWAT_OUTPUT | 0 | 0 | 0 | 0 | NOMMAGE INCOHÉRENT |
| SWAT_OUTPUT_01 | 0 | 0 | 99 | 1 036 530 | NOMMAGE INCOHÉRENT |

## 24. Staging

| Table | Lignes | Source | Dernière utilisation | Statut | Doublons |
|---|---|---|---|---|---|
| limite_raw | 33 | — | — | staging résiduel | — |
| migration_batches | 3 | 20260420T151703Z_a0f19576 | 2026-04-20T09:56:43.125222-07:00 | staging actif | — |
| migration_events | 42 | 20260420T151703Z_a0f19576 | — | staging résiduel | — |
| norm_catchments | 3 | public.bassin_abhgzr | 2026-04-20T09:56:43.516917-07:00 | staging historique | — |
| norm_communes | 258 | public.adm_communes_abhgzr | 2026-04-20T09:56:43.516917-07:00 | staging historique | — |
| norm_measurements | 1 049 166 | public.mesures_debits_jr | 2026-04-20T09:56:43.516917-07:00 | staging actif | — |
| norm_reservoir_bathymetry | 13 203 | public.bathymetries_barrages_abhgzr | 2026-04-20T09:56:43.516917-07:00 | staging historique | — |
| norm_reservoirs | 36 | public.barrages_abhgzr | 2026-04-20T09:56:43.516917-07:00 | staging historique | — |
| norm_stations | 105 | public.stations_abhgzr | 2026-04-20T09:56:43.516917-07:00 | staging historique | 35 groupes de station_code dupliqués |
| raw_adm_communes_abhgzr | 258 | public.adm_communes_abhgzr | 2026-04-20T09:56:22.811477-07:00 | staging historique | — |
| raw_barrages_abhgzr | 36 | public.barrages_abhgzr | 2026-04-20T09:56:22.853894-07:00 | staging historique | — |
| raw_bassin_abhgzr | 3 | public.bassin_abhgzr | 2026-04-20T09:56:22.844015-07:00 | staging historique | — |
| raw_bathymetries_barrages_abhgzr | 13 203 | public.bathymetries_barrages_abhgzr | 2026-04-20T09:56:42.754665-07:00 | staging historique | — |
| raw_mesures_debits_jr | 235 587 | public.mesures_debits_jr | 2026-04-20T09:56:31.111662-07:00 | staging historique | — |
| raw_mesures_evaporation_m | 6 768 | public.mesures_evaporation_m | 2026-04-20T09:56:42.473392-07:00 | staging historique | — |
| raw_mesures_humidite_relative_m | 3 060 | public.mesures_humidite_relative_m | 2026-04-20T09:56:42.638662-07:00 | staging historique | — |
| raw_mesures_lachers_barrages | 59 583 | public.mesures_lachers_barrages | 2026-04-20T09:56:40.738133-07:00 | staging historique | — |
| raw_mesures_precipitations_jr | 328 821 | public.mesures_precipitations_jr | 2026-04-20T09:56:22.870510-07:00 | staging historique | — |
| raw_mesures_temperature_jr_pn | 130 392 | public.mesures_temperature_jr_pn | 2026-04-20T09:56:37.050993-07:00 | staging historique | — |
| raw_mesures_temperature_m | 6 084 | public.mesures_temperature_m | 2026-04-20T09:56:42.321512-07:00 | staging historique | — |
| raw_mesures_vitesse_vent_m | 1 368 | public.mesures_vitesse_vent_m | 2026-04-20T09:56:42.708420-07:00 | staging historique | — |
| raw_stations_abhgzr | 105 | public.stations_abhgzr | 2026-04-20T09:56:22.859342-07:00 | staging historique | — |
| reseau_hydro_import_raw | 33 | — | — | staging résiduel | — |
| reseau_hydrologie_raw | 33 | — | — | staging résiduel | — |
| station_meteo_raw | 5 | — | — | staging résiduel | — |
| swat_mdb_imports | 80 | SWAT_HAD.mdb | 2026-06-03T06:11:50.393860-07:00 | staging actif | — |
| swat_rch_norm | 997 405 | SWAT_20260706_082420_Z0I7TR | 2026-07-06T01:30:11.717246-07:00 | staging actif | — |
| swat_rch_raw | 0 | — | — | staging actif | — |
| swat_sub_norm | 0 | — | — | staging actif | — |
| swat_sub_raw | 0 | — | — | staging actif | — |

## 25. Données legacy / audit

| Table | Lignes | Scénarios | Min date | Max date | Match dans access | Lecture |
|---|---|---|---|---|---|---|
| audit.swat_output_archive_rch | 345 510 | 1 | 1995-01-01 | 2023-08-31 | 0 | sous-ensemble / archive si match élevé |
| audit.swat_output_archive_sub | 345 510 | 1 | 1995-01-01 | 2023-08-31 | 0 | sous-ensemble / archive si match élevé |

| Backup | Lignes backup | Lignes actives | IDs communs | Conclusion |
|---|---|---|---|---|
| audit.gis_reach_shapes_backup_2026 | 1 | 19 | 19 | copie / sous-ensemble historique |
| audit.gis_subbasin_shapes_backup_2026 | 33 | 19 | 19 | copie / sous-ensemble historique |
| audit.station_reach_map_backup_2026 | 0 | 5 | 0 | backup vide |
| audit.station_subbasin_map_backup_2026 | 0 | 5 | 0 | backup vide |
| audit.swat_entity_map_backup_2026 | 38 | 38 | 0 | copie / sous-ensemble historique |

## 26. Auth

| public.users | auth.users | Source auth réelle |
|---|---|---|
| 3 | 0 | Le backend runtime utilise users.service -> public.users pour login, /me, admin et mise à jour de last_login; aucune requête runtime active vers auth.users n’a été trouvée. |

## 27. NULLs métier

| Table.Colonne | % NULL | Champ utilisé ? | Donnée alternative | Impact |
|---|---|---|---|---|
| access.weather_inputs.reach_code | 100 | NON | sub_code | champ legacy d’import weather |
| access.weather_inputs.station_name | 100 | NON | station_id | champ legacy d’import weather |
| access.weather_inputs.station_code | 100 | NON | station_id | champ legacy d’import weather |
| access.sub_results.reach_code | 100 | NON DIRECT | sub_code | pas de lien reach explicite côté sub_results |
| access.rch_results.reach_code | 100 | INDIRECT | sub_code + core.reaches/gis.reach_shapes | code reach absent, mapping indirect seulement |
| access.rch_results.reach_id | 100 | INDIRECT | sub_code + core.reaches/gis.reach_shapes | liaison reach directe indisponible dans access.rch_results |

## 28. Contraintes métier manquantes / clés candidates

| Table | Clé candidate | Doublons actuels ? | FK candidate | Risque |
|---|---|---|---|---|
| core.stations | station_id | 0 | — | faible |
| core.stations | LOWER(TRIM(station_code)) | 0 | — | moyen |
| core.timeseries | (station_id, property_id, run_id, source_type, time_step) | 0 | station_id -> core.stations; property_id -> ref.observed_properties; run_id -> core.model_runs | faible |
| core.measurements | (ts_id, datetime) | 0 | ts_id -> core.timeseries | faible |
| core.model_runs | scenario_code | 0 | — | faible |
| access.rch_results | (scenario_code, time_step, period_date, COALESCE(reach_id, reach_code, sub_code), table_source, import_batch_id) | 0 | station_id -> core.stations; entity -> core.reaches/core.subbasins | élevé |
| access.sub_results | (scenario_code, time_step, period_date, sub_code, table_source, import_batch_id) | 0 | station_id -> core.stations; sub_code -> core.subbasins | élevé |

## 29. Score qualité par domaine

| Domaine | Score | Justification |
|---|---|---|
| Stations | 5/10 | 102 stations core mais 68 géométries NULL et faible recouvrement avec gis.meteo_stations. |
| Séries temporelles | 8/10 | Clé métier unique et orphelins non détectés, mais couverture simulée incomplète selon les scénarios. |
| Mesures | 8/10 | Pas de doublons exacts détectés sur (ts_id, datetime), mais des écarts de couverture restent possibles. |
| Scénarios | 4/10 | Codification incohérente SWAT_OUTPUT / SWAT_OUTPUT_01 et scénarios access non propagés vers core. |
| SWAT | 4/10 | Nomenclature SWAT incohérente et dépendance à des mappings indirects; aucun doublon significatif détecté sur les clés testées. |
| Reaches | 4/10 | reach_id/reach_code NULL à 100 % dans access.rch_results et couverture gis partielle. |
| Sous-bassins | 7/10 | Couverture access correcte par sub_code, mais couche gis partielle et quelques géométries invalides. |
| Cartographie | 5/10 | SRID cohérent mais géométries invalides dans core et différences core↔gis. |
| Bathymétrie | 8/10 | Campagnes Hassan Addakhil cohérentes et bathymétrie disponible; vérifier seulement la monotonie par barrage. |
| Siltation | 5/10 | La plateforme calcule dynamiquement une partie des résultats, mais hydro.siltation_evolution reste vide alors que le service est actif. |
| Référentiels | 8/10 | 13 propriétés observées bien référencées; access.variable_dictionary est vide mais non bloquant au runtime. |
| Staging | 5/10 | Beaucoup de données historiques/résiduelles et structures SWAT mixtes actives/inactives. |

### Données fiables vs données à risque

| Domaine | Qualité | Risque | Décision |
|---|---|---|---|
| Stations | 5/10 | ÉLEVÉ | UTILISABLE AVEC RÉSERVE |
| Séries temporelles | 8/10 | FAIBLE | FIABLE |
| Mesures | 8/10 | FAIBLE | FIABLE |
| Scénarios | 4/10 | ÉLEVÉ | À CORRIGER |
| SWAT | 4/10 | ÉLEVÉ | À VALIDATION MÉTIER |
| Reaches | 4/10 | ÉLEVÉ | À CORRIGER |
| Sous-bassins | 7/10 | MOYEN | UTILISABLE AVEC RÉSERVE |
| Cartographie | 5/10 | MOYEN | UTILISABLE AVEC RÉSERVE |
| Bathymétrie | 8/10 | FAIBLE | FIABLE |
| Siltation | 5/10 | MOYEN | À VALIDATION MÉTIER |
| Référentiels | 8/10 | FAIBLE | FIABLE |
| Staging | 5/10 | MOYEN | LEGACY / HISTORIQUE |

## 30. Priorités DQ0-DQ3

### DQ0 — CRITIQUE

- `SWAT_OUTPUT` vs `SWAT_OUTPUT_01` : nomenclature incohérente entre import technique et run exposé.
- Plusieurs scénarios (`etat_actuel`, `ssp126`, `ssp245`, `ssp585`) existent dans `access.*` sans équivalent simulé dans `core.*`.

### DQ1 — IMPORTANT

- 68 stations core sans géométrie.
- Faible cohérence `core ↔ gis` sur stations, reaches et sous-bassins.
- `hydro.siltation_evolution` vide alors que le service legacy reste actif.
- `reach_id` et `reach_code` NULL à 100 % dans `access.rch_results`.

### DQ2 — NETTOYAGE DONNÉES

- Doublons confirmés dans `staging.norm_stations`.
- Staging volumineux et partiellement historique/résiduel.
- Multiples copies `audit.*` à classer explicitement.

### DQ3 — GOUVERNANCE

- Divergence `public.users` / `auth.users`.
- Clés métier candidates non matérialisées.
- Convention de nommage des scénarios à documenter.

## 31. Tableau global des anomalies

| ID | Priorité | Domaine | Table | Anomalie | Nb lignes | Impact | Recommandation |
|---|---|---|---|---|---|---|---|
| DQ0-01 | DQ0 | Scénarios | core.model_runs / access.import_runs / core.data_batches | Codification incohérente SWAT_OUTPUT vs SWAT_OUTPUT_01 | 1 036 633 | Risque de confusion entre import technique et run simulé exposé | Aligner la nomenclature après validation métier. |
| DQ1-01 | DQ1 | Stations | core.stations | Stations sans géométrie | 68 | Affaiblit les usages cartographiques et spatiaux. | Qualifier les stations non spatialisées et leurs sources. |
| DQ1-02 | DQ1 | Stations | core.stations ↔ gis.meteo_stations | Faible cohérence core ↔ GIS | 97 | Cartographie et comparaisons GIS incomplètes. | Décider quelle couche est canonique pour les stations. |
| DQ1-03 | DQ1 | Siltation | hydro.siltation_evolution | Table vide alors que le service legacy reste actif | 0 | Certaines routes legacy peuvent renvoyer peu ou pas de données. | Décider si le mode legacy doit être abandonné ou alimenté. |
| DQ1-04 | DQ1 | Access ↔ Core | access.* ↔ core.timeseries/core.measurements | Scénarios présents dans access mais absents du core simulé | 5 679 822 | Incohérence entre données importées et données exposées. | Qualifier les scénarios à propager ou à archiver. |
| DQ1-05 | DQ1 | Reaches | access.rch_results | reach_id et reach_code NULL à 100 % | 3 637 835 | Le niveau reach repose sur des mappings indirects. | Formaliser un mapping canonique reach ↔ sub_code. |
| DQ2-01 | DQ2 | Staging | staging.norm_stations | Doublons station_code confirmés | 105 | Risque de pollution des reprises d’import. | Traiter après validation métier des stations canoniques. |
| DQ2-02 | DQ2 | Legacy / Audit | audit.swat_output_archive_* / audit.*backup | Copies et sous-ensembles historiques nombreux | 691 020 | Bruit d’exploitation et risque de confusion. | Classer explicitement archives vs sources actives. |
| DQ3-01 | DQ3 | Auth | public.users / auth.users | Source auth réelle et schéma auth divergent | 3 | Dette de maintenance et documentation ambiguë. | Documenter public.users comme source auth runtime actuelle. |

## 32. Liste finale simple

### DONNÉES FIABLES

- `core.measurements (clé ts_id+datetime saine)`
- `core.timeseries (clé métier composite saine)`
- `ref.observed_properties`
- `hydro.bathymetry_campaigns`
- `core.reservoir_bathymetry`

### DONNÉES À CORRIGER

- `scénarios SWAT_OUTPUT / SWAT_OUTPUT_01`
- `géométries stations core NULL`
- `cohérence core↔gis stations/reaches/subbasins`
- `propagation access→core des scénarios SSP/etat_actuel`

### DOUBLONS CONFIRMÉS

- `staging.norm_stations.station_code`

### DOUBLONS À CONFIRMER


### DONNÉES INCOHÉRENTES

- `hydro.siltation_evolution vide vs service actif`
- `auth.users vide vs public.users actif`
- `access.rch_results reach_id/reach_code NULL`

### DONNÉES MANQUANTES

- `géométries de 68 stations core`
- `runs core simulés pour etat_actuel/ssp126/ssp245/ssp585`

### STAGING HISTORIQUE

- `limite_raw`
- `migration_events`
- `norm_catchments`
- `norm_communes`
- `norm_reservoir_bathymetry`
- `norm_reservoirs`
- `norm_stations`
- `raw_adm_communes_abhgzr`
- `raw_barrages_abhgzr`
- `raw_bassin_abhgzr`
- `raw_bathymetries_barrages_abhgzr`
- `raw_mesures_debits_jr`
- `raw_mesures_evaporation_m`
- `raw_mesures_humidite_relative_m`
- `raw_mesures_lachers_barrages`
- `raw_mesures_precipitations_jr`
- `raw_mesures_temperature_jr_pn`
- `raw_mesures_temperature_m`
- `raw_mesures_vitesse_vent_m`
- `raw_stations_abhgzr`
- `reseau_hydro_import_raw`
- `reseau_hydrologie_raw`
- `station_meteo_raw`

### TABLES MÉTIER SAINES

- `core.timeseries`
- `core.measurements`
- `ref.observed_properties`
- `hydro.bathymetry_campaigns`

## 33. Recommandations

1. Valider une nomenclature unique des scénarios SWAT avant toute correction de données.
2. Décider quels scénarios `access.*` doivent réellement être propagés dans `core.timeseries/core.measurements`.
3. Définir la couche canonique pour les stations, reaches et sous-bassins entre `core` et `gis`.
4. Documenter la clé métier SWAT testée et la méthode d’audit, en complément de la correction de nomenclature.
5. Trancher le sort du mode siltation legacy basé sur `hydro.siltation_evolution` vide.
6. Documenter officiellement `public.users` comme source auth runtime actuelle.
7. Préparer ensuite le `PLAN DE CORRECTION DES DONNÉES MÉTIER` avant tout correctif contrôlé.

## 34. Point d’arrêt

ARRÊTE-TOI.

- Aucune correction appliquée.
- Aucun doublon supprimé.
- Aucun scénario normalisé.
- Aucune géométrie modifiée.
- Aucun NULL rempli.
- Aucune contrainte créée.

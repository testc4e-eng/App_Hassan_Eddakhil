# AUDIT FINAL AVANT NETTOYAGE STRUCTUREL — `hydro_hd`

Rapport genere le **2026-08-11** a **11:05**.

Audit execute en **lecture seule**. Aucune suppression, aucune ecriture SQL, aucune migration et aucune modification PostgreSQL n'ont ete appliquees.

## 1. Resume executif

- Base auditée : `hydro_hd` sur `localhost:5432` (meme instance officielle que `host.docker.internal:5432`).
- Version PostgreSQL : `PostgreSQL 17.8 on x86_64-windows, compiled by msvc-19.44.35222, 64-bit`
- Version PostGIS : `3.5.3`
- Taille totale : `5379 MB` (5640410803 octets)
- Objets inventoriés : **89 tables**, **119 vues/matviews**, **13 foreign tables**.
- Baseline protégée gardée hors candidat : `core.timeseries=383`, `core.measurements=3 773 400`, `gis.reach_shapes=19`, `gis.subbasin_shapes=19`.

Constats critiques confirmés :

- Le backend attend encore plusieurs matviews `api.mv_*` absentes de `hydro_hd`; le runtime se rabat donc sur `public.*`, `core.*` et `access.*`.
- `old_hd` est uniquement un schéma FDW legacy (`old_hd_srv`) sans preuve de consommation runtime actuelle.
- `staging` n'est pas uniformément mort : `staging.norm_measurements`, `staging.migration_batches` et `staging.swat_*` sont encore appelés par le backend actuel.
- `audit.*` et les backups GIS sont de vraies redondances structurelles, mais elles restent historiques tant qu'aucun export/archivage n'a été fait.
- `auth.*` reste vide alors que l'administration active utilise `public.users`; suppression impossible sans validation manuelle.

## 2. Inventaire des schémas

| Schéma | Tables | Vues | MatViews | Foreign Tables | Taille | Rôle | Backend | Scripts | Statut |
|---|---:|---:|---:|---:|---:|---|---|---|---|
| access | 7 | 0 | 0 | 0 | 4239.8 MB | Tables SWAT importees et fallbacks runtime pour Reach/Subbasin/HRU. | OUI | OUI | ACTIF |
| api | 0 | 20 | 3 | 0 | 0.1 MB | Couche de vues et materialized views exposees a l'API backend. | OUI | NON | SUPPORT |
| audit | 11 | 5 | 0 | 0 | 273.6 MB | Backups ponctuels, archives SWAT et tables qualite hors runtime courant. | NON | NON | LEGACY |
| auth | 6 | 0 | 0 | 0 | 0.0 MB | Modele RBAC theorique non alimente dans l'etat actuel. | NON | NON | A VERIFIER |
| core | 16 | 0 | 0 | 0 | 418.5 MB | Referentiel metier principal et donnees canoniques de la plateforme. | OUI | OUI | ACTIF |
| geo | 1 | 0 | 0 | 0 | 0.0 MB | Table thematique SIG isolee a requalifier. | NON | NON | A VERIFIER |
| gis | 4 | 0 | 0 | 0 | 3.6 MB | Geometries runtime Reach/Subbasin/Stations meteo. | OUI | OUI | ACTIF |
| hydro | 4 | 0 | 0 | 0 | 0.2 MB | Tables siltation / bathymetrie exposees aux modules hydro. | OUI | OUI | ACTIF |
| old_hd | 0 | 0 | 0 | 13 | 0.0 MB | Foreign tables FDW pointant vers l'ancienne base legacy. | NON | NON | LEGACY |
| public | 4 | 91 | 0 | 0 | 7.0 MB | Couche de compatibilite SQL et tables support runtime (users, module_properties). | OUI | OUI | SUPPORT |
| ref | 6 | 0 | 0 | 0 | 0.8 MB | Referentiels et dictionnaires metier utilises par le catalogue. | OUI | OUI | SUPPORT |
| staging | 30 | 0 | 0 | 0 | 423.8 MB | Zones d'atterrissage, normalisation et pipelines d'import / Data Scan. | OUI | NON | STAGING |

## 3. Objets attendus par le backend mais absents de `hydro_hd`

- `api.mv_barrage_catalog`
- `api.mv_basin_catalog`
- `api.mv_hydro_station_stats`
- `api.mv_hydro_station_timeseries`
- `api.mv_reach_catalog`
- `api.mv_station_catalog`
- `api.mv_subbasin_catalog`
- `public.bathymetries_barrages_abhgzr`

Ces absences bloquent toute suppression agressive des fallbacks `public.*` et `access.*`.

## 4. Inventaire complet des tables

| Schéma | Table | Lignes | Taille | Backend | Scripts | Runtime | Vide | Redondante | Doublons | Décision |
|---|---|---:|---:|---|---|---|---|---|---|---|
| access | hru_results | 65 209 | 26 MB | OUI | NON | OUI | NON | NON | NON TESTE | CONSERVER |
| access | import_runs | 90 | 72 kB | OUI | OUI | OUI | NON | NON | NON TESTE | CONSERVER |
| access | rch_results | 3 637 835 | 2432 MB | OUI | OUI | OUI | NON | NON (source active, backups ailleurs) | AUCUN CONFIRME | CONSERVER |
| access | scenario_metadata | 8 248 | 3368 kB | OUI | NON | OUI | NON | NON | NON TESTE | CONSERVER |
| access | sub_results | 3 637 835 | 1774 MB | OUI | OUI | OUI | NON | NON (source active, backups ailleurs) | AUCUN CONFIRME | CONSERVER |
| access | variable_dictionary | 0 | 8192 bytes | OUI | OUI | OUI | OUI | NON | NON TESTE | CONSERVER |
| access | weather_inputs | 13 900 | 5672 kB | NON | NON | OUI | NON | NON | NON TESTE | CONSERVER |
| audit | gis_reach_shapes_backup_2026 | 33 | 680 kB | NON | NON | NON | NON | OUI (backup/archive) | NON TESTE | ARCHIVER/EXPORTER PUIS SUPPRIMER |
| audit | gis_subbasin_shapes_backup_2026 | 33 | 960 kB | NON | NON | NON | NON | OUI (backup/archive) | NON TESTE | ARCHIVER/EXPORTER PUIS SUPPRIMER |
| audit | nv_limite | 19 | 2136 kB | NON | NON | NON | NON | OUI (schema audit) | NON TESTE | ARCHIVER/EXPORTER PUIS SUPPRIMER |
| audit | nv_stream | 19 | 840 kB | NON | NON | NON | NON | OUI (schema audit) | NON TESTE | ARCHIVER/EXPORTER PUIS SUPPRIMER |
| audit | qc_issues | 0 | 8192 bytes | NON | NON | NON | OUI | OUI (schema audit) | NON TESTE | CANDIDATE A SUPPRESSION |
| audit | qc_runs | 0 | 8192 bytes | NON | NON | NON | OUI | OUI (schema audit) | NON TESTE | CANDIDATE A SUPPRESSION |
| audit | station_reach_map_backup_2026 | 0 | 8192 bytes | NON | NON | NON | OUI | OUI (backup/archive) | NON TESTE | CANDIDATE A SUPPRESSION |
| audit | station_subbasin_map_backup_2026 | 0 | 8192 bytes | NON | NON | NON | OUI | OUI (backup/archive) | NON TESTE | CANDIDATE A SUPPRESSION |
| audit | swat_entity_map_backup_2026 | 38 | 16 kB | NON | NON | NON | NON | OUI (backup/archive) | NON TESTE | ARCHIVER/EXPORTER PUIS SUPPRIMER |
| audit | swat_output_archive_rch | 345 510 | 169 MB | NON | NON | NON | NON | OUI (backup/archive) | NON TESTE | ARCHIVER/EXPORTER PUIS SUPPRIMER |
| audit | swat_output_archive_sub | 345 510 | 100 MB | NON | NON | NON | NON | OUI (backup/archive) | NON TESTE | ARCHIVER/EXPORTER PUIS SUPPRIMER |
| auth | audit_log | 0 | 8192 bytes | NON | NON | NON | OUI | OUI (modele alternatif non alimente) | NON TESTE | A VERIFIER MANUELLEMENT |
| auth | permissions | 0 | 8192 bytes | NON | NON | NON | OUI | OUI (modele alternatif non alimente) | NON TESTE | A VERIFIER MANUELLEMENT |
| auth | role_permissions | 0 | 0 bytes | NON | NON | NON | OUI | OUI (modele alternatif non alimente) | NON TESTE | A VERIFIER MANUELLEMENT |
| auth | roles | 0 | 8192 bytes | NON | NON | NON | OUI | OUI (modele alternatif non alimente) | NON TESTE | A VERIFIER MANUELLEMENT |
| auth | user_roles | 0 | 0 bytes | NON | NON | NON | OUI | OUI (modele alternatif non alimente) | NON TESTE | A VERIFIER MANUELLEMENT |
| auth | users | 0 | 8192 bytes | NON | NON | NON | OUI | OUI (modele alternatif non alimente) | NON TESTE | A VERIFIER MANUELLEMENT |
| core | catchments | 33 | 952 kB | OUI | NON | OUI | NON | NON | NON TESTE | CONSERVER |
| core | data_batches | 1 | 32 kB | OUI | NON | OUI | NON | NON | NON TESTE | CONSERVER |
| core | measurement_batches | 1 036 530 | 85 MB | OUI | OUI | OUI | NON | NON | NON TESTE | CONSERVER |
| core | measurements | 3 773 400 | 330 MB | OUI | OUI | OUI | NON | NON | AUCUN CONFIRME | CONSERVER |
| core | model_runs | 10 | 16 kB | OUI | OUI | OUI | NON | NON | AUCUN CONFIRME | CONSERVER |
| core | reaches | 33 | 672 kB | NON | OUI | NON | NON | NON | AUCUN CONFIRME | CONSERVER |
| core | reservoir_bathymetry | 4 401 | 400 kB | OUI | OUI | OUI | NON | NON | NON TESTE | CONSERVER |
| core | reservoirs | 12 | 16 kB | OUI | OUI | OUI | NON | NON | NON TESTE | CONSERVER |
| core | rivers | 0 | 8192 bytes | NON | NON | NON | OUI | NON | NON TESTE | CONSERVER |
| core | station_reach_map | 5 | 32 kB | OUI | NON | OUI | NON | NON (source active, backups ailleurs) | NON TESTE | CONSERVER |
| core | station_subbasin_map | 5 | 120 kB | OUI | OUI | OUI | NON | NON (source active, backups ailleurs) | NON TESTE | CONSERVER |
| core | stations | 102 | 64 kB | OUI | OUI | OUI | NON | NON | AUCUN CONFIRME | CONSERVER |
| core | subbasin_metrics_annual | 0 | 8192 bytes | NON | NON | NON | OUI | NON | NON TESTE | CONSERVER |
| core | subbasins | 33 | 952 kB | NON | OUI | NON | NON | NON | AUCUN CONFIRME | CONSERVER |
| core | swat_entity_map | 38 | 48 kB | OUI | OUI | OUI | NON | NON (source active, backups ailleurs) | NON TESTE | CONSERVER |
| core | timeseries | 383 | 120 kB | OUI | OUI | OUI | NON | NON | AUCUN CONFIRME | CONSERVER |
| geo | landcover | 0 | 8192 bytes | NON | NON | OUI | OUI | NON | NON TESTE | CONSERVER |
| gis | meteo_stations | 5 | 16 kB | OUI | OUI | OUI | NON | NON | NON TESTE | CONSERVER |
| gis | reach_shapes | 19 | 840 kB | OUI | OUI | OUI | NON | NON (source active, backups ailleurs) | AUCUN CONFIRME | CONSERVER |
| gis | reach_shapes_backup_20260422_144537 | 33 | 688 kB | NON | NON | NON | NON | OUI (backup GIS) | NON TESTE | ARCHIVER/EXPORTER PUIS SUPPRIMER |
| gis | subbasin_shapes | 19 | 2136 kB | OUI | OUI | OUI | NON | NON (source active, backups ailleurs) | AUCUN CONFIRME | CONSERVER |
| hydro | bathymetry_campaigns | 6 | 64 kB | OUI | OUI | OUI | NON | NON | AUCUN CONFIRME | CONSERVER |
| hydro | siltation_evolution | 0 | 32 kB | OUI | OUI | OUI | OUI | NON | AUCUN CONFIRME | CONSERVER |
| hydro | siltation_hsv | 0 | 32 kB | OUI | OUI | OUI | OUI | NON | AUCUN CONFIRME | CONSERVER |
| hydro | siltation_indicators | 0 | 32 kB | OUI | OUI | OUI | OUI | NON | AUCUN CONFIRME | CONSERVER |
| public | module_properties | 10 | 16 kB | OUI | NON | OUI | NON | NON | NON TESTE | CONSERVER |
| public | property_module_override | 0 | 8192 bytes | NON | NON | NON | OUI | NON | NON TESTE | CONSERVER TEMPORAIREMENT |
| public | spatial_ref_sys | 8 500 | 7144 kB | NON | NON | NON | NON | NON | NON TESTE | CONSERVER |
| public | users | 3 | 16 kB | OUI | OUI | OUI | NON | NON (table runtime officielle actuelle) | NON TESTE | CONSERVER |
| ref | communes | 86 | 776 kB | NON | NON | NON | NON | NON | NON TESTE | CONSERVER |
| ref | landcover_classes | 0 | 8192 bytes | NON | NON | NON | OUI | NON | NON TESTE | CONSERVER |
| ref | landcover_periods | 0 | 8192 bytes | NON | NON | NON | OUI | NON | NON TESTE | CONSERVER |
| ref | observed_properties | 13 | 16 kB | OUI | OUI | OUI | NON | NON | NON TESTE | CONSERVER |
| ref | property_domain_membership | 10 | 16 kB | NON | NON | OUI | NON | NON | NON TESTE | CONSERVER |
| ref | property_domains | 3 | 16 kB | NON | NON | NON | NON | NON | NON TESTE | CONSERVER |
| staging | limite_raw | 33 | 984 kB | NON | NON | NON | NON | OUI (source brute ou normalisee) | NON TESTE | ARCHIVER/EXPORTER PUIS SUPPRIMER |
| staging | migration_batches | 3 | 16 kB | OUI | NON | OUI | NON | OUI (staging actif / temporaire) | NON TESTE | CONSERVER |
| staging | migration_events | 42 | 16 kB | NON | NON | NON | NON | OUI (source brute ou normalisee) | NON TESTE | A VERIFIER MANUELLEMENT |
| staging | norm_catchments | 3 | 240 kB | NON | NON | NON | NON | OUI (source brute ou normalisee) | NON TESTE | ARCHIVER/EXPORTER PUIS SUPPRIMER |
| staging | norm_communes | 258 | 1904 kB | NON | NON | NON | NON | OUI (source brute ou normalisee) | NON TESTE | ARCHIVER/EXPORTER PUIS SUPPRIMER |
| staging | norm_measurements | 1 049 166 | 156 MB | OUI | NON | OUI | NON | OUI (staging actif / temporaire) | NON TESTE | CONSERVER |
| staging | norm_reservoir_bathymetry | 13 203 | 2048 kB | NON | NON | NON | NON | OUI (source brute ou normalisee) | NON TESTE | ARCHIVER/EXPORTER PUIS SUPPRIMER |
| staging | norm_reservoirs | 36 | 16 kB | NON | NON | NON | NON | OUI (source brute ou normalisee) | NON TESTE | ARCHIVER/EXPORTER PUIS SUPPRIMER |
| staging | norm_stations | 105 | 80 kB | NON | NON | NON | NON | OUI (source brute ou normalisee) | OUI (35 grp) | ARCHIVER/EXPORTER PUIS SUPPRIMER |
| staging | raw_adm_communes_abhgzr | 258 | 2816 kB | NON | NON | NON | NON | OUI (source brute ou normalisee) | NON TESTE | ARCHIVER/EXPORTER PUIS SUPPRIMER |
| staging | raw_barrages_abhgzr | 36 | 16 kB | NON | NON | NON | NON | OUI (source brute ou normalisee) | NON TESTE | ARCHIVER/EXPORTER PUIS SUPPRIMER |
| staging | raw_bassin_abhgzr | 3 | 448 kB | NON | NON | NON | NON | OUI (source brute ou normalisee) | NON TESTE | ARCHIVER/EXPORTER PUIS SUPPRIMER |
| staging | raw_bathymetries_barrages_abhgzr | 13 203 | 1968 kB | NON | NON | NON | NON | OUI (source brute ou normalisee) | NON TESTE | ARCHIVER/EXPORTER PUIS SUPPRIMER |
| staging | raw_mesures_debits_jr | 235 587 | 28 MB | NON | NON | NON | NON | OUI (source brute ou normalisee) | NON TESTE | ARCHIVER/EXPORTER PUIS SUPPRIMER |
| staging | raw_mesures_evaporation_m | 6 768 | 856 kB | NON | NON | NON | NON | OUI (source brute ou normalisee) | NON TESTE | ARCHIVER/EXPORTER PUIS SUPPRIMER |
| staging | raw_mesures_humidite_relative_m | 3 060 | 424 kB | NON | NON | NON | NON | OUI (source brute ou normalisee) | NON TESTE | ARCHIVER/EXPORTER PUIS SUPPRIMER |
| staging | raw_mesures_lachers_barrages | 59 583 | 8296 kB | NON | NON | NON | NON | OUI (source brute ou normalisee) | NON TESTE | ARCHIVER/EXPORTER PUIS SUPPRIMER |
| staging | raw_mesures_precipitations_jr | 328 821 | 43 MB | NON | NON | NON | NON | OUI (source brute ou normalisee) | NON TESTE | ARCHIVER/EXPORTER PUIS SUPPRIMER |
| staging | raw_mesures_temperature_jr_pn | 130 392 | 19 MB | NON | NON | NON | NON | OUI (source brute ou normalisee) | NON TESTE | ARCHIVER/EXPORTER PUIS SUPPRIMER |
| staging | raw_mesures_temperature_m | 6 084 | 824 kB | NON | NON | NON | NON | OUI (source brute ou normalisee) | NON TESTE | ARCHIVER/EXPORTER PUIS SUPPRIMER |
| staging | raw_mesures_vitesse_vent_m | 1 368 | 208 kB | NON | NON | NON | NON | OUI (source brute ou normalisee) | NON TESTE | ARCHIVER/EXPORTER PUIS SUPPRIMER |
| staging | raw_stations_abhgzr | 105 | 64 kB | NON | NON | NON | NON | OUI (source brute ou normalisee) | NON TESTE | ARCHIVER/EXPORTER PUIS SUPPRIMER |
| staging | reseau_hydro_import_raw | 33 | 416 kB | NON | NON | NON | NON | OUI (source brute ou normalisee) | NON TESTE | ARCHIVER/EXPORTER PUIS SUPPRIMER |
| staging | reseau_hydrologie_raw | 33 | 672 kB | NON | NON | NON | NON | OUI (source brute ou normalisee) | NON TESTE | ARCHIVER/EXPORTER PUIS SUPPRIMER |
| staging | station_meteo_raw | 5 | 16 kB | NON | NON | NON | NON | OUI (source brute ou normalisee) | NON TESTE | ARCHIVER/EXPORTER PUIS SUPPRIMER |
| staging | swat_mdb_imports | 80 | 72 kB | NON | NON | NON | NON | OUI (staging actif / temporaire) | NON TESTE | A VERIFIER MANUELLEMENT |
| staging | swat_rch_norm | 997 405 | 149 MB | OUI | NON | OUI | NON | OUI (staging actif / temporaire) | NON TESTE | CONSERVER |
| staging | swat_rch_raw | 0 | 32 kB | OUI | NON | OUI | OUI | OUI (staging actif / temporaire) | NON TESTE | CONSERVER |
| staging | swat_sub_norm | 0 | 5568 kB | OUI | NON | OUI | OUI | OUI (staging actif / temporaire) | NON TESTE | CONSERVER |
| staging | swat_sub_raw | 0 | 2624 kB | OUI | NON | OUI | OUI | OUI (staging actif / temporaire) | NON TESTE | CONSERVER |

## 5. Tables vides

- `access.variable_dictionary` (8192 bytes) — API/backend: OUI; scripts/imports: OUI; FK entrantes: 0; vues dependantes: 0; decision: CONSERVER
- `audit.qc_issues` (8192 bytes) — API/backend: NON; scripts/imports: NON; FK entrantes: 0; vues dependantes: 0; decision: CANDIDATE A SUPPRESSION
- `audit.qc_runs` (8192 bytes) — API/backend: NON; scripts/imports: NON; FK entrantes: 0; vues dependantes: 0; decision: CANDIDATE A SUPPRESSION
- `audit.station_reach_map_backup_2026` (8192 bytes) — API/backend: NON; scripts/imports: NON; FK entrantes: 0; vues dependantes: 0; decision: CANDIDATE A SUPPRESSION
- `audit.station_subbasin_map_backup_2026` (8192 bytes) — API/backend: NON; scripts/imports: NON; FK entrantes: 0; vues dependantes: 0; decision: CANDIDATE A SUPPRESSION
- `auth.audit_log` (8192 bytes) — API/backend: NON; scripts/imports: NON; FK entrantes: 0; vues dependantes: 0; decision: A VERIFIER MANUELLEMENT
- `auth.permissions` (8192 bytes) — API/backend: NON; scripts/imports: NON; FK entrantes: 0; vues dependantes: 0; decision: A VERIFIER MANUELLEMENT
- `auth.role_permissions` (0 bytes) — API/backend: NON; scripts/imports: NON; FK entrantes: 0; vues dependantes: 0; decision: A VERIFIER MANUELLEMENT
- `auth.roles` (8192 bytes) — API/backend: NON; scripts/imports: NON; FK entrantes: 0; vues dependantes: 0; decision: A VERIFIER MANUELLEMENT
- `auth.user_roles` (0 bytes) — API/backend: NON; scripts/imports: NON; FK entrantes: 0; vues dependantes: 0; decision: A VERIFIER MANUELLEMENT
- `auth.users` (8192 bytes) — API/backend: NON; scripts/imports: NON; FK entrantes: 0; vues dependantes: 0; decision: A VERIFIER MANUELLEMENT
- `core.rivers` (8192 bytes) — API/backend: NON; scripts/imports: NON; FK entrantes: 0; vues dependantes: 4; decision: CONSERVER
- `core.subbasin_metrics_annual` (8192 bytes) — API/backend: NON; scripts/imports: NON; FK entrantes: 0; vues dependantes: 1; decision: CONSERVER
- `geo.landcover` (8192 bytes) — API/backend: OUI; scripts/imports: NON; FK entrantes: 0; vues dependantes: 2; decision: CONSERVER
- `hydro.siltation_evolution` (32 kB) — API/backend: OUI; scripts/imports: OUI; FK entrantes: 0; vues dependantes: 0; decision: CONSERVER
- `hydro.siltation_hsv` (32 kB) — API/backend: OUI; scripts/imports: OUI; FK entrantes: 0; vues dependantes: 0; decision: CONSERVER
- `hydro.siltation_indicators` (32 kB) — API/backend: OUI; scripts/imports: OUI; FK entrantes: 0; vues dependantes: 0; decision: CONSERVER
- `public.property_module_override` (8192 bytes) — API/backend: NON; scripts/imports: NON; FK entrantes: 0; vues dependantes: 1; decision: CONSERVER TEMPORAIREMENT
- `ref.landcover_classes` (8192 bytes) — API/backend: NON; scripts/imports: NON; FK entrantes: 0; vues dependantes: 1; decision: CONSERVER
- `ref.landcover_periods` (8192 bytes) — API/backend: NON; scripts/imports: NON; FK entrantes: 0; vues dependantes: 1; decision: CONSERVER
- `staging.swat_rch_raw` (32 kB) — API/backend: OUI; scripts/imports: NON; FK entrantes: 0; vues dependantes: 0; decision: CONSERVER
- `staging.swat_sub_norm` (5568 kB) — API/backend: OUI; scripts/imports: NON; FK entrantes: 0; vues dependantes: 0; decision: CONSERVER
- `staging.swat_sub_raw` (2624 kB) — API/backend: OUI; scripts/imports: NON; FK entrantes: 0; vues dependantes: 0; decision: CONSERVER

## 6. Audit ciblé des doublons métier

### core.timeseries

- CLE TESTEE : `station_id, property_id, run_id, source_type, time_step`
- LIGNES : **383**
- LIGNES DISTINCTES : **383**
- GROUPES DOUBLONS : **0**
- LIGNES DUPLIQUEES : **0**
- VERDICT : AUCUN DOUBLON CONFIRME

### core.measurements

- CLE TESTEE : `ts_id, datetime`
- LIGNES : **3 773 400**
- LIGNES DISTINCTES : **3 773 400**
- GROUPES DOUBLONS : **0**
- LIGNES DUPLIQUEES : **0**
- VERDICT : AUCUN DOUBLON CONFIRME

### core.stations

- CLE TESTEE : `station_code`
- LIGNES : **102**
- LIGNES DISTINCTES : **102**
- GROUPES DOUBLONS : **0**
- LIGNES DUPLIQUEES : **0**
- VERDICT : AUCUN DOUBLON CONFIRME

### core.model_runs

- CLE TESTEE : `scenario_code`
- LIGNES : **10**
- LIGNES DISTINCTES : **10**
- GROUPES DOUBLONS : **0**
- LIGNES DUPLIQUEES : **0**
- VERDICT : AUCUN DOUBLON CONFIRME

### core.reaches

- CLE TESTEE : `reach_id`
- LIGNES : **33**
- LIGNES DISTINCTES : **33**
- GROUPES DOUBLONS : **0**
- LIGNES DUPLIQUEES : **0**
- VERDICT : AUCUN DOUBLON CONFIRME

### core.subbasins

- CLE TESTEE : `subbasin_id`
- LIGNES : **33**
- LIGNES DISTINCTES : **33**
- GROUPES DOUBLONS : **0**
- LIGNES DUPLIQUEES : **0**
- VERDICT : AUCUN DOUBLON CONFIRME

### access.rch_results

- CLE TESTEE : `scenario_code, COALESCE(time_step,''), COALESCE(reach_id::text, reach_code::text, sub_code::text), period_date`
- LIGNES : **3 637 835**
- LIGNES DISTINCTES : **3 637 835**
- GROUPES DOUBLONS : **0**
- LIGNES DUPLIQUEES : **0**
- VERDICT : AUCUN DOUBLON CONFIRME

### access.sub_results

- CLE TESTEE : `scenario_code, COALESCE(time_step,''), sub_code, period_date`
- LIGNES : **3 637 835**
- LIGNES DISTINCTES : **3 637 835**
- GROUPES DOUBLONS : **0**
- LIGNES DUPLIQUEES : **0**
- VERDICT : AUCUN DOUBLON CONFIRME

### gis.reach_shapes

- CLE TESTEE : `reach_id`
- LIGNES : **19**
- LIGNES DISTINCTES : **19**
- GROUPES DOUBLONS : **0**
- LIGNES DUPLIQUEES : **0**
- VERDICT : AUCUN DOUBLON CONFIRME

### gis.subbasin_shapes

- CLE TESTEE : `subbasin_id`
- LIGNES : **19**
- LIGNES DISTINCTES : **19**
- GROUPES DOUBLONS : **0**
- LIGNES DUPLIQUEES : **0**
- VERDICT : AUCUN DOUBLON CONFIRME

### hydro.bathymetry_campaigns

- CLE TESTEE : `dam_code, measurement_year`
- LIGNES : **6**
- LIGNES DISTINCTES : **6**
- GROUPES DOUBLONS : **0**
- LIGNES DUPLIQUEES : **0**
- VERDICT : AUCUN DOUBLON CONFIRME

### hydro.siltation_evolution

- CLE TESTEE : `dam_code, year`
- LIGNES : **0**
- LIGNES DISTINCTES : **0**
- GROUPES DOUBLONS : **0**
- LIGNES DUPLIQUEES : **0**
- VERDICT : AUCUN DOUBLON CONFIRME

### hydro.siltation_hsv

- CLE TESTEE : `dam_code, campaign_year, level_m`
- LIGNES : **0**
- LIGNES DISTINCTES : **0**
- GROUPES DOUBLONS : **0**
- LIGNES DUPLIQUEES : **0**
- VERDICT : AUCUN DOUBLON CONFIRME

### hydro.siltation_indicators

- CLE TESTEE : `dam_code, source_sheet, reference_code`
- LIGNES : **0**
- LIGNES DISTINCTES : **0**
- GROUPES DOUBLONS : **0**
- LIGNES DUPLIQUEES : **0**
- VERDICT : AUCUN DOUBLON CONFIRME

### staging.norm_stations

- CLE TESTEE : `station_code`
- LIGNES : **105**
- LIGNES DISTINCTES : **35**
- GROUPES DOUBLONS : **35**
- LIGNES DUPLIQUEES : **105**
- VERDICT : DOUBLONS CONFIRMES (35 groupes / 105 lignes)

## 7. Redondances structurelles confirmées

- **GIS backup** : `gis.reach_shapes`, `gis.reach_shapes_backup_20260422_144537`, `audit.gis_reach_shapes_backup_2026` — Redondance legacy de sauvegarde; seul `gis.reach_shapes` est runtime.
- **Subbasin backup** : `gis.subbasin_shapes`, `audit.gis_subbasin_shapes_backup_2026` — Backup legacy du referentiel runtime subbasin.
- **SWAT entity map backup** : `core.swat_entity_map`, `audit.swat_entity_map_backup_2026` — Le backup audit est historique, la table `core` est la source active.
- **Station reach map backup** : `core.station_reach_map`, `audit.station_reach_map_backup_2026` — Backup legacy sans consommation runtime.
- **Station subbasin map backup** : `core.station_subbasin_map`, `audit.station_subbasin_map_backup_2026` — Backup legacy sans consommation runtime.
- **SWAT archive reach** : `access.rch_results`, `audit.swat_output_archive_rch` — Archive historique de lignes Reach remplacee par la table access active.
- **SWAT archive sub** : `access.sub_results`, `audit.swat_output_archive_sub` — Archive historique de lignes Sub remplacee par la table access active.
- **Auth vs public users** : `public.users`, `auth.users` — Deux modeles utilisateurs coexistent, mais seul `public.users` est alimente et utilise.
- **Legacy FDW vs staging/core** : `old_hd.*`, `staging.raw_* / norm_*`, `core/ref/hydro` — Le FDW legacy expose la source historique, le stockage local normalise porte l'application actuelle.

## 8. Vues et materialized views

| Objet | Type | Runtime | Backend | Scripts | Sources | Décision | Justification |
|---|---|---|---|---|---:|---|---|
| api.mv_dashboard_catchment_counts | matview | NON | NON | NON | 2 | CANDIDATE SUPPRESSION | aucune reference runtime courante detectee sur la vue API existante |
| api.mv_dashboard_reservoir_counts | matview | NON | NON | NON | 2 | CANDIDATE SUPPRESSION | aucune reference runtime courante detectee sur la vue API existante |
| api.mv_scenario_catalog | matview | OUI | OUI | NON | 6 | CONSERVER | catalogue scenarios actif et restaure au demarrage Docker |
| api.v_catalog_properties | view | OUI | OUI | NON | 3 | CONSERVER | vue ou matview directement consommee |
| api.v_catalog_scenarios | view | NON | NON | NON | 4 | CANDIDATE SUPPRESSION | aucune reference runtime courante detectee sur la vue API existante |
| api.v_catalog_series | view | NON | NON | NON | 3 | CANDIDATE SUPPRESSION | aucune reference runtime courante detectee sur la vue API existante |
| api.v_catalog_stations | view | NON | NON | NON | 4 | CANDIDATE SUPPRESSION | aucune reference runtime courante detectee sur la vue API existante |
| api.v_compare_monthly | view | NON | NON | NON | 3 | CANDIDATE SUPPRESSION | aucune reference runtime courante detectee sur la vue API existante |
| api.v_dashboard_catchment_counts | view | NON | NON | NON | 8 | CANDIDATE SUPPRESSION | aucune reference runtime courante detectee sur la vue API existante |
| api.v_dashboard_national_counts | view | NON | NON | NON | 9 | CANDIDATE SUPPRESSION | aucune reference runtime courante detectee sur la vue API existante |
| api.v_dashboard_reservoir_counts | view | NON | NON | NON | 4 | CANDIDATE SUPPRESSION | aucune reference runtime courante detectee sur la vue API existante |
| api.v_erosion_subbasins_annual | view | NON | NON | NON | 6 | CANDIDATE SUPPRESSION | aucune reference runtime courante detectee sur la vue API existante |
| api.v_map_catchments_annual | view | NON | NON | NON | 6 | CANDIDATE SUPPRESSION | aucune reference runtime courante detectee sur la vue API existante |
| api.v_map_stations_latest | view | NON | NON | NON | 5 | CANDIDATE SUPPRESSION | aucune reference runtime courante detectee sur la vue API existante |
| api.v_measurements_annual | view | NON | NON | NON | 2 | CANDIDATE SUPPRESSION | aucune reference runtime courante detectee sur la vue API existante |
| api.v_measurements_annual_agg | view | NON | NON | NON | 2 | CANDIDATE SUPPRESSION | aucune reference runtime courante detectee sur la vue API existante |
| api.v_measurements_daily | view | NON | NON | NON | 2 | CANDIDATE SUPPRESSION | aucune reference runtime courante detectee sur la vue API existante |
| api.v_measurements_latest | view | NON | NON | NON | 2 | CANDIDATE SUPPRESSION | aucune reference runtime courante detectee sur la vue API existante |
| api.v_measurements_monthly | view | NON | NON | NON | 2 | CANDIDATE SUPPRESSION | aucune reference runtime courante detectee sur la vue API existante |
| api.v_measurements_monthly_agg | view | NON | NON | NON | 2 | CANDIDATE SUPPRESSION | aucune reference runtime courante detectee sur la vue API existante |
| api.v_qc_property_domain_tovalidate | view | NON | NON | NON | 3 | CANDIDATE SUPPRESSION | aucune reference runtime courante detectee sur la vue API existante |
| api.v_series_stats | view | NON | NON | NON | 4 | CANDIDATE SUPPRESSION | aucune reference runtime courante detectee sur la vue API existante |
| api.v_timeseries_enriched | view | NON | NON | NON | 5 | CANDIDATE SUPPRESSION | aucune reference runtime courante detectee sur la vue API existante |
| audit.v_qc_measurements_duplicates | view | NON | NON | NON | 2 | REDONDANTE | sert uniquement de couche intermediaire entre vues |
| audit.v_qc_measurements_orphans | view | NON | NON | NON | 3 | REDONDANTE | sert uniquement de couche intermediaire entre vues |
| audit.v_qc_null_geometry | view | NON | NON | NON | 8 | REDONDANTE | sert uniquement de couche intermediaire entre vues |
| audit.v_qc_timeseries_duplicates | view | NON | NON | NON | 2 | REDONDANTE | sert uniquement de couche intermediaire entre vues |
| audit.v_qc_timeseries_without_measurements | view | NON | NON | NON | 3 | REDONDANTE | sert uniquement de couche intermediaire entre vues |
| public.catchments | view | OUI | OUI | NON | 2 | CONSERVER | vue ou matview directement consommee |
| public.communes | view | NON | NON | NON | 2 | REDONDANTE | sert uniquement de couche intermediaire entre vues |
| public.geography_columns | view | NON | NON | NON | 1 | CONSERVER | vue technique PostGIS |
| public.geometry_columns | view | OUI | OUI | NON | 1 | CONSERVER | vue ou matview directement consommee |
| public.landcover | view | OUI | OUI | NON | 2 | CONSERVER | vue ou matview directement consommee |
| public.landcover_classes | view | NON | NON | NON | 2 | REDONDANTE | sert uniquement de couche intermediaire entre vues |
| public.landcover_periods | view | NON | NON | NON | 2 | REDONDANTE | sert uniquement de couche intermediaire entre vues |
| public.measurements | view | OUI | OUI | NON | 2 | CONSERVER | vue ou matview directement consommee |
| public.model_runs | view | OUI | OUI | NON | 2 | CONSERVER | vue ou matview directement consommee |
| public.observed_properties | view | NON | NON | NON | 2 | REDONDANTE | sert uniquement de couche intermediaire entre vues |
| public.reaches | view | NON | NON | NON | 2 | REDONDANTE | sert uniquement de couche intermediaire entre vues |
| public.reservoir_bathymetry | view | OUI | OUI | NON | 2 | CONSERVER | vue ou matview directement consommee |
| public.reservoirs | view | OUI | OUI | NON | 2 | CONSERVER | vue ou matview directement consommee |
| public.rivers | view | NON | NON | NON | 2 | REDONDANTE | sert uniquement de couche intermediaire entre vues |
| public.stations | view | OUI | OUI | NON | 2 | CONSERVER | vue ou matview directement consommee |
| public.subbasins | view | NON | NON | NON | 2 | REDONDANTE | sert uniquement de couche intermediaire entre vues |
| public.timeseries | view | OUI | OUI | NON | 2 | CONSERVER | vue ou matview directement consommee |
| public.v_catchments_geo | view | NON | NON | NON | 2 | REDONDANTE | sert uniquement de couche intermediaire entre vues |
| public.v_map_station | view | NON | NON | NON | 2 | REDONDANTE | sert uniquement de couche intermediaire entre vues |
| public.v_measurements_full | view | NON | NON | NON | 3 | LEGACY | aucune reference runtime courante detectee |
| public.v_property_agg_rule | view | NON | NON | NON | 2 | REDONDANTE | sert uniquement de couche intermediaire entre vues |
| public.v_property_catalog | view | NON | NON | NON | 2 | REDONDANTE | sert uniquement de couche intermediaire entre vues |
| public.v_property_catalog_final | view | NON | NON | NON | 3 | REDONDANTE | sert uniquement de couche intermediaire entre vues |
| public.v_property_module | view | NON | NON | NON | 2 | REDONDANTE | sert uniquement de couche intermediaire entre vues |
| public.v_reaches_geo | view | NON | NON | NON | 5 | REDONDANTE | sert uniquement de couche intermediaire entre vues |
| public.v_reservoirs_geo | view | NON | NON | NON | 5 | REDONDANTE | sert uniquement de couche intermediaire entre vues |
| public.v_stations_geo | view | NON | NON | NON | 5 | REDONDANTE | sert uniquement de couche intermediaire entre vues |
| public.v_stats_bathymetry | view | NON | NON | NON | 3 | LEGACY | aucune reference runtime courante detectee |
| public.v_stats_bathymetry_global | view | NON | NON | NON | 2 | LEGACY | aucune reference runtime courante detectee |
| public.v_stats_evaporation | view | NON | NON | NON | 2 | LEGACY | aucune reference runtime courante detectee |
| public.v_stats_evaporation_global | view | NON | NON | NON | 2 | LEGACY | aucune reference runtime courante detectee |
| public.v_stats_humidity | view | NON | NON | NON | 2 | LEGACY | aucune reference runtime courante detectee |
| public.v_stats_humidity_global | view | NON | NON | NON | 2 | LEGACY | aucune reference runtime courante detectee |
| public.v_stats_lachers | view | NON | NON | NON | 2 | LEGACY | aucune reference runtime courante detectee |
| public.v_stats_lachers_global | view | NON | NON | NON | 2 | LEGACY | aucune reference runtime courante detectee |
| public.v_stats_precipitation | view | NON | NON | NON | 2 | LEGACY | aucune reference runtime courante detectee |
| public.v_stats_precipitation_global | view | NON | NON | NON | 2 | LEGACY | aucune reference runtime courante detectee |
| public.v_stats_property_station_timestep | view | NON | NON | NON | 5 | LEGACY | aucune reference runtime courante detectee |
| public.v_stats_property_timestep | view | NON | NON | NON | 4 | LEGACY | aucune reference runtime courante detectee |
| public.v_stats_sediment_load | view | NON | NON | NON | 2 | LEGACY | aucune reference runtime courante detectee |
| public.v_stats_sediment_load_global | view | NON | NON | NON | 2 | LEGACY | aucune reference runtime courante detectee |
| public.v_stats_streamflow | view | NON | NON | NON | 2 | LEGACY | aucune reference runtime courante detectee |
| public.v_stats_streamflow_global | view | NON | NON | NON | 2 | LEGACY | aucune reference runtime courante detectee |
| public.v_stats_temperature_all | view | NON | NON | NON | 2 | LEGACY | aucune reference runtime courante detectee |
| public.v_stats_temperature_all_global | view | NON | NON | NON | 2 | LEGACY | aucune reference runtime courante detectee |
| public.v_stats_temperature_max | view | NON | NON | NON | 2 | LEGACY | aucune reference runtime courante detectee |
| public.v_stats_temperature_max_global | view | NON | NON | NON | 2 | LEGACY | aucune reference runtime courante detectee |
| public.v_stats_temperature_mean | view | NON | NON | NON | 2 | LEGACY | aucune reference runtime courante detectee |
| public.v_stats_temperature_mean_global | view | NON | NON | NON | 2 | LEGACY | aucune reference runtime courante detectee |
| public.v_stats_temperature_min | view | NON | NON | NON | 2 | LEGACY | aucune reference runtime courante detectee |
| public.v_stats_temperature_min_global | view | NON | NON | NON | 2 | LEGACY | aucune reference runtime courante detectee |
| public.v_stats_wind_speed | view | NON | NON | NON | 2 | LEGACY | aucune reference runtime courante detectee |
| public.v_stats_wind_speed_global | view | NON | NON | NON | 2 | LEGACY | aucune reference runtime courante detectee |
| public.v_subbasins_geo | view | NON | NON | NON | 3 | REDONDANTE | sert uniquement de couche intermediaire entre vues |
| public.v_ts_catalog | view | OUI | OUI | OUI | 6 | CONSERVER | vue ou matview directement consommee |
| public.v_ts_catalog_enriched | view | OUI | OUI | OUI | 3 | CONSERVER | vue ou matview directement consommee |
| public.v_values_annual | view | NON | NON | NON | 2 | LEGACY | aucune reference runtime courante detectee |
| public.v_values_bathymetry | view | OUI | OUI | NON | 4 | CONSERVER | vue ou matview directement consommee |
| public.v_values_evaporation_annual | view | NON | NON | NON | 3 | LEGACY | aucune reference runtime courante detectee |
| public.v_values_evaporation_monthly | view | NON | NON | NON | 3 | LEGACY | aucune reference runtime courante detectee |
| public.v_values_evaporation_obs | view | NON | NON | NON | 3 | LEGACY | aucune reference runtime courante detectee |
| public.v_values_humidity_annual | view | NON | NON | NON | 3 | LEGACY | aucune reference runtime courante detectee |
| public.v_values_humidity_monthly | view | NON | NON | NON | 3 | LEGACY | aucune reference runtime courante detectee |
| public.v_values_humidity_obs | view | NON | NON | NON | 3 | LEGACY | aucune reference runtime courante detectee |
| public.v_values_lachers_annual | view | NON | NON | NON | 3 | LEGACY | aucune reference runtime courante detectee |
| public.v_values_lachers_monthly | view | NON | NON | NON | 3 | LEGACY | aucune reference runtime courante detectee |
| public.v_values_lachers_obs | view | NON | NON | NON | 3 | LEGACY | aucune reference runtime courante detectee |
| public.v_values_measurements | view | NON | NON | NON | 7 | LEGACY | aucune reference runtime courante detectee |
| public.v_values_monthly | view | NON | NON | NON | 2 | LEGACY | aucune reference runtime courante detectee |
| public.v_values_precipitation_annual | view | NON | NON | NON | 3 | LEGACY | aucune reference runtime courante detectee |
| public.v_values_precipitation_monthly | view | NON | NON | NON | 3 | LEGACY | aucune reference runtime courante detectee |
| public.v_values_precipitation_obs | view | NON | NON | NON | 3 | LEGACY | aucune reference runtime courante detectee |
| public.v_values_sediment_load_annual | view | NON | NON | NON | 3 | LEGACY | aucune reference runtime courante detectee |
| public.v_values_sediment_load_monthly | view | NON | NON | NON | 3 | LEGACY | aucune reference runtime courante detectee |
| public.v_values_sediment_load_obs | view | NON | NON | NON | 3 | LEGACY | aucune reference runtime courante detectee |
| public.v_values_streamflow_annual | view | NON | NON | NON | 3 | LEGACY | aucune reference runtime courante detectee |
| public.v_values_streamflow_monthly | view | NON | NON | NON | 3 | LEGACY | aucune reference runtime courante detectee |
| public.v_values_streamflow_obs | view | NON | NON | NON | 3 | LEGACY | aucune reference runtime courante detectee |
| public.v_values_temperature_all_obs | view | NON | NON | NON | 3 | LEGACY | aucune reference runtime courante detectee |
| public.v_values_temperature_max_annual | view | NON | NON | NON | 3 | LEGACY | aucune reference runtime courante detectee |
| public.v_values_temperature_max_monthly | view | NON | NON | NON | 3 | LEGACY | aucune reference runtime courante detectee |
| public.v_values_temperature_max_obs | view | NON | NON | NON | 3 | LEGACY | aucune reference runtime courante detectee |
| public.v_values_temperature_mean_annual | view | NON | NON | NON | 3 | LEGACY | aucune reference runtime courante detectee |
| public.v_values_temperature_mean_monthly | view | NON | NON | NON | 3 | LEGACY | aucune reference runtime courante detectee |
| public.v_values_temperature_mean_obs | view | NON | NON | NON | 3 | LEGACY | aucune reference runtime courante detectee |
| public.v_values_temperature_min_annual | view | NON | NON | NON | 3 | LEGACY | aucune reference runtime courante detectee |
| public.v_values_temperature_min_monthly | view | NON | NON | NON | 3 | LEGACY | aucune reference runtime courante detectee |
| public.v_values_temperature_min_obs | view | NON | NON | NON | 3 | LEGACY | aucune reference runtime courante detectee |
| public.v_values_wind_speed_annual | view | NON | NON | NON | 3 | LEGACY | aucune reference runtime courante detectee |
| public.v_values_wind_speed_monthly | view | NON | NON | NON | 3 | LEGACY | aucune reference runtime courante detectee |
| public.v_values_wind_speed_obs | view | NON | NON | NON | 3 | LEGACY | aucune reference runtime courante detectee |

## 9. Audit `old_hd`

- Nombre de foreign tables : **13**
- Serveur FDW detecte : `old_hd_srv`
- Références backend actives : **0** sur `old_hd.*` dans le code runtime courant.
- Références scripts actives : **0** hors archives historiques.
- Tables exposées : `adm_communes_abhgzr`, `barrages_abhgzr`, `bassin_abhgzr`, `bathymetries_barrages_abhgzr`, `mesures_debits_jr`, `mesures_evaporation_m`, `mesures_humidite_relative_m`, `mesures_lachers_barrages`, `mesures_precipitations_jr`, `mesures_temperature_jr_pn`, `mesures_temperature_m`, `mesures_vitesse_vent_m`, `stations_abhgzr`
- Verdict : **NON** — `old_hd` n'est pas nécessaire au fonctionnement actuel de la plateforme, mais reste un support legacy/documentaire tant qu'aucune décision FDW dédiée n'est prise.

## 10. Audit `staging`

Tables `staging` encore impliquées dans le projet courant :

- `staging.migration_batches` — pipeline utilisateur: backend (`dataScan.service.ts` ou `swatIngestion.service.ts`); scripts: aucune; nécessaire aux imports futurs: **OUI**
- `staging.norm_measurements` — pipeline utilisateur: backend (`dataScan.service.ts` ou `swatIngestion.service.ts`); scripts: aucune; nécessaire aux imports futurs: **OUI**
- `staging.swat_rch_raw` — pipeline utilisateur: backend (`dataScan.service.ts` ou `swatIngestion.service.ts`); scripts: aucune; nécessaire aux imports futurs: **OUI**
- `staging.swat_sub_raw` — pipeline utilisateur: backend (`dataScan.service.ts` ou `swatIngestion.service.ts`); scripts: aucune; nécessaire aux imports futurs: **OUI**
- `staging.swat_rch_norm` — pipeline utilisateur: backend (`dataScan.service.ts` ou `swatIngestion.service.ts`); scripts: aucune; nécessaire aux imports futurs: **OUI**
- `staging.swat_sub_norm` — pipeline utilisateur: backend (`dataScan.service.ts` ou `swatIngestion.service.ts`); scripts: aucune; nécessaire aux imports futurs: **OUI**

Tables `staging` historiques de migration ABHGZR, non appelées par le runtime actuel :

- `staging.limite_raw` — dernière utilité identifiée: migration / normalisation archivée; nécessaire aux imports futurs: **NON prouvé**
- `staging.norm_catchments` — dernière utilité identifiée: migration / normalisation archivée; nécessaire aux imports futurs: **NON prouvé**
- `staging.norm_communes` — dernière utilité identifiée: migration / normalisation archivée; nécessaire aux imports futurs: **NON prouvé**
- `staging.norm_reservoir_bathymetry` — dernière utilité identifiée: migration / normalisation archivée; nécessaire aux imports futurs: **NON prouvé**
- `staging.norm_reservoirs` — dernière utilité identifiée: migration / normalisation archivée; nécessaire aux imports futurs: **NON prouvé**
- `staging.norm_stations` — dernière utilité identifiée: migration / normalisation archivée; nécessaire aux imports futurs: **NON prouvé**
- `staging.raw_adm_communes_abhgzr` — dernière utilité identifiée: migration / normalisation archivée; nécessaire aux imports futurs: **NON prouvé**
- `staging.raw_barrages_abhgzr` — dernière utilité identifiée: migration / normalisation archivée; nécessaire aux imports futurs: **NON prouvé**
- `staging.raw_bassin_abhgzr` — dernière utilité identifiée: migration / normalisation archivée; nécessaire aux imports futurs: **NON prouvé**
- `staging.raw_bathymetries_barrages_abhgzr` — dernière utilité identifiée: migration / normalisation archivée; nécessaire aux imports futurs: **NON prouvé**
- `staging.raw_mesures_debits_jr` — dernière utilité identifiée: migration / normalisation archivée; nécessaire aux imports futurs: **NON prouvé**
- `staging.raw_mesures_evaporation_m` — dernière utilité identifiée: migration / normalisation archivée; nécessaire aux imports futurs: **NON prouvé**
- `staging.raw_mesures_humidite_relative_m` — dernière utilité identifiée: migration / normalisation archivée; nécessaire aux imports futurs: **NON prouvé**
- `staging.raw_mesures_lachers_barrages` — dernière utilité identifiée: migration / normalisation archivée; nécessaire aux imports futurs: **NON prouvé**
- `staging.raw_mesures_precipitations_jr` — dernière utilité identifiée: migration / normalisation archivée; nécessaire aux imports futurs: **NON prouvé**
- `staging.raw_mesures_temperature_jr_pn` — dernière utilité identifiée: migration / normalisation archivée; nécessaire aux imports futurs: **NON prouvé**
- `staging.raw_mesures_temperature_m` — dernière utilité identifiée: migration / normalisation archivée; nécessaire aux imports futurs: **NON prouvé**
- `staging.raw_mesures_vitesse_vent_m` — dernière utilité identifiée: migration / normalisation archivée; nécessaire aux imports futurs: **NON prouvé**
- `staging.raw_stations_abhgzr` — dernière utilité identifiée: migration / normalisation archivée; nécessaire aux imports futurs: **NON prouvé**
- `staging.reseau_hydro_import_raw` — dernière utilité identifiée: migration / normalisation archivée; nécessaire aux imports futurs: **NON prouvé**
- `staging.reseau_hydrologie_raw` — dernière utilité identifiée: migration / normalisation archivée; nécessaire aux imports futurs: **NON prouvé**
- `staging.station_meteo_raw` — dernière utilité identifiée: migration / normalisation archivée; nécessaire aux imports futurs: **NON prouvé**

## 11. Listes finales A / B / C / D

### A — CONSERVER ABSOLUMENT

- `access.hru_results`
- `access.import_runs`
- `access.rch_results`
- `access.scenario_metadata`
- `access.sub_results`
- `access.variable_dictionary`
- `access.weather_inputs`
- `core.catchments`
- `core.data_batches`
- `core.measurement_batches`
- `core.measurements`
- `core.model_runs`
- `core.reaches`
- `core.reservoir_bathymetry`
- `core.reservoirs`
- `core.rivers`
- `core.station_reach_map`
- `core.station_subbasin_map`
- `core.stations`
- `core.subbasin_metrics_annual`
- `core.subbasins`
- `core.swat_entity_map`
- `core.timeseries`
- `geo.landcover`
- `gis.meteo_stations`
- `gis.reach_shapes`
- `gis.subbasin_shapes`
- `hydro.bathymetry_campaigns`
- `hydro.siltation_evolution`
- `hydro.siltation_hsv`
- `hydro.siltation_indicators`
- `public.module_properties`
- `public.users`
- `ref.communes`
- `ref.landcover_classes`
- `ref.landcover_periods`
- `ref.observed_properties`
- `ref.property_domain_membership`
- `ref.property_domains`
- `staging.migration_batches`
- `staging.norm_measurements`
- `staging.swat_rch_norm`
- `staging.swat_rch_raw`
- `staging.swat_sub_norm`
- `staging.swat_sub_raw`

### B — CONSERVER TEMPORAIREMENT

- `public.property_module_override`

### C — CANDIDATES A SUPPRESSION

- `audit.gis_reach_shapes_backup_2026` — ARCHIVER/EXPORTER PUIS SUPPRIMER
- `audit.gis_subbasin_shapes_backup_2026` — ARCHIVER/EXPORTER PUIS SUPPRIMER
- `audit.nv_limite` — ARCHIVER/EXPORTER PUIS SUPPRIMER
- `audit.nv_stream` — ARCHIVER/EXPORTER PUIS SUPPRIMER
- `audit.qc_issues` — CANDIDATE A SUPPRESSION
- `audit.qc_runs` — CANDIDATE A SUPPRESSION
- `audit.station_reach_map_backup_2026` — CANDIDATE A SUPPRESSION
- `audit.station_subbasin_map_backup_2026` — CANDIDATE A SUPPRESSION
- `audit.swat_entity_map_backup_2026` — ARCHIVER/EXPORTER PUIS SUPPRIMER
- `audit.swat_output_archive_rch` — ARCHIVER/EXPORTER PUIS SUPPRIMER
- `audit.swat_output_archive_sub` — ARCHIVER/EXPORTER PUIS SUPPRIMER
- `gis.reach_shapes_backup_20260422_144537` — ARCHIVER/EXPORTER PUIS SUPPRIMER
- `staging.limite_raw` — ARCHIVER/EXPORTER PUIS SUPPRIMER
- `staging.norm_catchments` — ARCHIVER/EXPORTER PUIS SUPPRIMER
- `staging.norm_communes` — ARCHIVER/EXPORTER PUIS SUPPRIMER
- `staging.norm_reservoir_bathymetry` — ARCHIVER/EXPORTER PUIS SUPPRIMER
- `staging.norm_reservoirs` — ARCHIVER/EXPORTER PUIS SUPPRIMER
- `staging.norm_stations` — ARCHIVER/EXPORTER PUIS SUPPRIMER
- `staging.raw_adm_communes_abhgzr` — ARCHIVER/EXPORTER PUIS SUPPRIMER
- `staging.raw_barrages_abhgzr` — ARCHIVER/EXPORTER PUIS SUPPRIMER
- `staging.raw_bassin_abhgzr` — ARCHIVER/EXPORTER PUIS SUPPRIMER
- `staging.raw_bathymetries_barrages_abhgzr` — ARCHIVER/EXPORTER PUIS SUPPRIMER
- `staging.raw_mesures_debits_jr` — ARCHIVER/EXPORTER PUIS SUPPRIMER
- `staging.raw_mesures_evaporation_m` — ARCHIVER/EXPORTER PUIS SUPPRIMER
- `staging.raw_mesures_humidite_relative_m` — ARCHIVER/EXPORTER PUIS SUPPRIMER
- `staging.raw_mesures_lachers_barrages` — ARCHIVER/EXPORTER PUIS SUPPRIMER
- `staging.raw_mesures_precipitations_jr` — ARCHIVER/EXPORTER PUIS SUPPRIMER
- `staging.raw_mesures_temperature_jr_pn` — ARCHIVER/EXPORTER PUIS SUPPRIMER
- `staging.raw_mesures_temperature_m` — ARCHIVER/EXPORTER PUIS SUPPRIMER
- `staging.raw_mesures_vitesse_vent_m` — ARCHIVER/EXPORTER PUIS SUPPRIMER
- `staging.raw_stations_abhgzr` — ARCHIVER/EXPORTER PUIS SUPPRIMER
- `staging.reseau_hydro_import_raw` — ARCHIVER/EXPORTER PUIS SUPPRIMER
- `staging.reseau_hydrologie_raw` — ARCHIVER/EXPORTER PUIS SUPPRIMER
- `staging.station_meteo_raw` — ARCHIVER/EXPORTER PUIS SUPPRIMER

### D — A VALIDATION MANUELLE

- `auth.audit_log`
- `auth.permissions`
- `auth.role_permissions`
- `auth.roles`
- `auth.user_roles`
- `auth.users`
- `staging.migration_events`
- `staging.swat_mdb_imports`

## 12. Plan de nettoyage propose (sans execution)

### LOT 1

- OBJECTIF : objets vides et totalement inutilisés
- RISQUE : P2
- OBJETS : tables `audit.qc_*` et autres vides sans dépendance active
- BACKUP NECESSAIRE : backup logique facultatif
- SQL FUTUR : DROP TABLE/VUE ciblé après validation
- TESTS : rejouer health-check backend + routes admin/users + data scan
- ROLLBACK : restauration depuis dump logique de l'objet

### LOT 2

- OBJECTIF : backups et archives legacy
- RISQUE : P2
- OBJETS : `audit.*backup*`, `audit.swat_output_archive_*`, `gis.reach_shapes_backup_20260422_144537`
- BACKUP NECESSAIRE : export CSV ou dump objet par objet
- SQL FUTUR : DROP ciblé après export
- TESTS : vérifier reach/subbasin mapping et cartes
- ROLLBACK : réimport de l'archive exportée

### LOT 3

- OBJECTIF : vues/materialized views obsolètes
- RISQUE : P1
- OBJETS : vues `public.v_stats_*`, `public.v_values_*` et vues `api.*` non appelées
- BACKUP NECESSAIRE : snapshot des définitions SQL
- SQL FUTUR : DROP VIEW/MATERIALIZED VIEW ciblé
- TESTS : smoke tests catalogue, hydrologie, sédiments, spatial
- ROLLBACK : recréation via définitions SQL exportées

### LOT 4

- OBJECTIF : staging historique non actif
- RISQUE : P1
- OBJETS : tables `staging.raw_*` / `staging.norm_*` sans appel backend actuel
- BACKUP NECESSAIRE : dump schéma+data staging
- SQL FUTUR : DROP par sous-ensemble métier
- TESTS : tests import SWAT, Data Scan, compare-functional-baseline
- ROLLBACK : restauration depuis dump staging

### LOT 5

- OBJECTIF : schémas legacy externes
- RISQUE : P1
- OBJETS : `old_hd` FDW + éventuellement `auth.*` après validation feuille de route
- BACKUP NECESSAIRE : export définitions FDW et DDL auth
- SQL FUTUR : DROP FOREIGN TABLE/SERVER ou tables auth après décision
- TESTS : tests admin, auth, scripts de seed users
- ROLLBACK : recréation du FDW / DDL auth

## 13. Tableau final de decision

| Objet | Type | Lignes | Utilisé runtime | Dépendances | Redondant | Doublons | Décision | Risque |
|---|---|---:|---|---|---|---|---|---|
| access.rch_results | table | 3 637 835 | OUI | PK:0; FK sortantes:0; FK entrantes:0; indexes:0; triggers:0; vues dependantes:1; fonctions dependantes:0 | NON (source active, backups ailleurs) | AUCUN CONFIRME | CONSERVER | P0 |
| access.sub_results | table | 3 637 835 | OUI | PK:0; FK sortantes:0; FK entrantes:0; indexes:1; triggers:0; vues dependantes:1; fonctions dependantes:0 | NON (source active, backups ailleurs) | AUCUN CONFIRME | CONSERVER | P0 |
| audit.gis_reach_shapes_backup_2026 | table | 33 | NON | PK:0; FK sortantes:0; FK entrantes:0; indexes:0; triggers:0; vues dependantes:0; fonctions dependantes:0 | OUI (backup/archive) | NON TESTE | ARCHIVER/EXPORTER PUIS SUPPRIMER | P2 |
| audit.gis_subbasin_shapes_backup_2026 | table | 33 | NON | PK:0; FK sortantes:0; FK entrantes:0; indexes:0; triggers:0; vues dependantes:0; fonctions dependantes:0 | OUI (backup/archive) | NON TESTE | ARCHIVER/EXPORTER PUIS SUPPRIMER | P2 |
| audit.nv_limite | table | 19 | NON | PK:1; FK sortantes:0; FK entrantes:0; indexes:2; triggers:0; vues dependantes:0; fonctions dependantes:0 | OUI (schema audit) | NON TESTE | ARCHIVER/EXPORTER PUIS SUPPRIMER | P2 |
| audit.nv_stream | table | 19 | NON | PK:1; FK sortantes:0; FK entrantes:0; indexes:2; triggers:0; vues dependantes:0; fonctions dependantes:0 | OUI (schema audit) | NON TESTE | ARCHIVER/EXPORTER PUIS SUPPRIMER | P2 |
| audit.qc_issues | table | 0 | NON | PK:0; FK sortantes:0; FK entrantes:0; indexes:0; triggers:0; vues dependantes:0; fonctions dependantes:0 | OUI (schema audit) | NON TESTE | CANDIDATE A SUPPRESSION | P2 |
| audit.qc_runs | table | 0 | NON | PK:0; FK sortantes:0; FK entrantes:0; indexes:0; triggers:0; vues dependantes:0; fonctions dependantes:0 | OUI (schema audit) | NON TESTE | CANDIDATE A SUPPRESSION | P2 |
| audit.station_reach_map_backup_2026 | table | 0 | NON | PK:0; FK sortantes:0; FK entrantes:0; indexes:0; triggers:0; vues dependantes:0; fonctions dependantes:0 | OUI (backup/archive) | NON TESTE | CANDIDATE A SUPPRESSION | P2 |
| audit.station_subbasin_map_backup_2026 | table | 0 | NON | PK:0; FK sortantes:0; FK entrantes:0; indexes:0; triggers:0; vues dependantes:0; fonctions dependantes:0 | OUI (backup/archive) | NON TESTE | CANDIDATE A SUPPRESSION | P2 |
| audit.swat_entity_map_backup_2026 | table | 38 | NON | PK:0; FK sortantes:0; FK entrantes:0; indexes:0; triggers:0; vues dependantes:0; fonctions dependantes:0 | OUI (backup/archive) | NON TESTE | ARCHIVER/EXPORTER PUIS SUPPRIMER | P2 |
| audit.swat_output_archive_rch | table | 345 510 | NON | PK:0; FK sortantes:0; FK entrantes:0; indexes:0; triggers:0; vues dependantes:0; fonctions dependantes:0 | OUI (backup/archive) | NON TESTE | ARCHIVER/EXPORTER PUIS SUPPRIMER | P2 |
| audit.swat_output_archive_sub | table | 345 510 | NON | PK:0; FK sortantes:0; FK entrantes:0; indexes:0; triggers:0; vues dependantes:0; fonctions dependantes:0 | OUI (backup/archive) | NON TESTE | ARCHIVER/EXPORTER PUIS SUPPRIMER | P2 |
| auth.audit_log | table | 0 | NON | PK:0; FK sortantes:0; FK entrantes:0; indexes:0; triggers:0; vues dependantes:0; fonctions dependantes:0 | OUI (modele alternatif non alimente) | NON TESTE | A VERIFIER MANUELLEMENT | P1 |
| auth.permissions | table | 0 | NON | PK:0; FK sortantes:0; FK entrantes:0; indexes:0; triggers:0; vues dependantes:0; fonctions dependantes:0 | OUI (modele alternatif non alimente) | NON TESTE | A VERIFIER MANUELLEMENT | P1 |
| auth.role_permissions | table | 0 | NON | PK:0; FK sortantes:0; FK entrantes:0; indexes:0; triggers:0; vues dependantes:0; fonctions dependantes:0 | OUI (modele alternatif non alimente) | NON TESTE | A VERIFIER MANUELLEMENT | P1 |
| auth.roles | table | 0 | NON | PK:0; FK sortantes:0; FK entrantes:0; indexes:0; triggers:0; vues dependantes:0; fonctions dependantes:0 | OUI (modele alternatif non alimente) | NON TESTE | A VERIFIER MANUELLEMENT | P1 |
| auth.user_roles | table | 0 | NON | PK:0; FK sortantes:0; FK entrantes:0; indexes:0; triggers:0; vues dependantes:0; fonctions dependantes:0 | OUI (modele alternatif non alimente) | NON TESTE | A VERIFIER MANUELLEMENT | P1 |
| auth.users | table | 0 | NON | PK:0; FK sortantes:0; FK entrantes:0; indexes:0; triggers:0; vues dependantes:0; fonctions dependantes:0 | OUI (modele alternatif non alimente) | NON TESTE | A VERIFIER MANUELLEMENT | P1 |
| core.measurements | table | 3 773 400 | OUI | PK:0; FK sortantes:0; FK entrantes:0; indexes:1; triggers:0; vues dependantes:18; fonctions dependantes:0 | NON | AUCUN CONFIRME | CONSERVER | P0 |
| core.model_runs | table | 10 | OUI | PK:0; FK sortantes:0; FK entrantes:0; indexes:0; triggers:0; vues dependantes:7; fonctions dependantes:0 | NON | AUCUN CONFIRME | CONSERVER | P0 |
| core.reaches | table | 33 | NON | PK:0; FK sortantes:0; FK entrantes:0; indexes:0; triggers:0; vues dependantes:7; fonctions dependantes:0 | NON | AUCUN CONFIRME | CONSERVER | P0 |
| core.stations | table | 102 | OUI | PK:0; FK sortantes:0; FK entrantes:0; indexes:1; triggers:0; vues dependantes:13; fonctions dependantes:0 | NON | AUCUN CONFIRME | CONSERVER | P0 |
| core.subbasins | table | 33 | NON | PK:0; FK sortantes:0; FK entrantes:0; indexes:0; triggers:0; vues dependantes:7; fonctions dependantes:0 | NON | AUCUN CONFIRME | CONSERVER | P0 |
| core.timeseries | table | 383 | OUI | PK:0; FK sortantes:0; FK entrantes:0; indexes:2; triggers:0; vues dependantes:11; fonctions dependantes:0 | NON | AUCUN CONFIRME | CONSERVER | P0 |
| gis.reach_shapes | table | 19 | OUI | PK:0; FK sortantes:0; FK entrantes:0; indexes:1; triggers:0; vues dependantes:0; fonctions dependantes:0 | NON (source active, backups ailleurs) | AUCUN CONFIRME | CONSERVER | P0 |
| gis.reach_shapes_backup_20260422_144537 | table | 33 | NON | PK:0; FK sortantes:0; FK entrantes:0; indexes:0; triggers:0; vues dependantes:0; fonctions dependantes:0 | OUI (backup GIS) | NON TESTE | ARCHIVER/EXPORTER PUIS SUPPRIMER | P2 |
| gis.subbasin_shapes | table | 19 | OUI | PK:0; FK sortantes:0; FK entrantes:0; indexes:1; triggers:0; vues dependantes:0; fonctions dependantes:0 | NON (source active, backups ailleurs) | AUCUN CONFIRME | CONSERVER | P0 |
| hydro.bathymetry_campaigns | table | 6 | OUI | PK:1; FK sortantes:0; FK entrantes:0; indexes:3; triggers:1; vues dependantes:0; fonctions dependantes:0 | NON | AUCUN CONFIRME | CONSERVER | P0 |
| hydro.siltation_evolution | table | 0 | OUI | PK:1; FK sortantes:0; FK entrantes:0; indexes:3; triggers:1; vues dependantes:0; fonctions dependantes:0 | NON | AUCUN CONFIRME | CONSERVER | P0 |
| hydro.siltation_hsv | table | 0 | OUI | PK:1; FK sortantes:0; FK entrantes:0; indexes:3; triggers:1; vues dependantes:0; fonctions dependantes:0 | NON | AUCUN CONFIRME | CONSERVER | P0 |
| hydro.siltation_indicators | table | 0 | OUI | PK:1; FK sortantes:0; FK entrantes:0; indexes:3; triggers:1; vues dependantes:0; fonctions dependantes:0 | NON | AUCUN CONFIRME | CONSERVER | P0 |
| public.module_properties | table | 10 | OUI | PK:0; FK sortantes:0; FK entrantes:0; indexes:0; triggers:0; vues dependantes:0; fonctions dependantes:0 | NON | NON TESTE | CONSERVER | P0 |
| public.property_module_override | table | 0 | NON | PK:0; FK sortantes:0; FK entrantes:0; indexes:0; triggers:0; vues dependantes:1; fonctions dependantes:0 | NON | NON TESTE | CONSERVER TEMPORAIREMENT | P1 |
| public.users | table | 3 | OUI | PK:0; FK sortantes:0; FK entrantes:0; indexes:0; triggers:0; vues dependantes:0; fonctions dependantes:0 | NON (table runtime officielle actuelle) | NON TESTE | CONSERVER | P0 |
| ref.observed_properties | table | 13 | OUI | PK:0; FK sortantes:0; FK entrantes:0; indexes:0; triggers:0; vues dependantes:42; fonctions dependantes:0 | NON | NON TESTE | CONSERVER | P0 |
| staging.limite_raw | table | 33 | NON | PK:0; FK sortantes:0; FK entrantes:0; indexes:0; triggers:0; vues dependantes:0; fonctions dependantes:0 | OUI (source brute ou normalisee) | NON TESTE | ARCHIVER/EXPORTER PUIS SUPPRIMER | P2 |
| staging.migration_events | table | 42 | NON | PK:0; FK sortantes:0; FK entrantes:0; indexes:0; triggers:0; vues dependantes:0; fonctions dependantes:0 | OUI (source brute ou normalisee) | NON TESTE | A VERIFIER MANUELLEMENT | P2 |
| staging.norm_catchments | table | 3 | NON | PK:0; FK sortantes:0; FK entrantes:0; indexes:0; triggers:0; vues dependantes:0; fonctions dependantes:0 | OUI (source brute ou normalisee) | NON TESTE | ARCHIVER/EXPORTER PUIS SUPPRIMER | P2 |
| staging.norm_communes | table | 258 | NON | PK:0; FK sortantes:0; FK entrantes:0; indexes:0; triggers:0; vues dependantes:0; fonctions dependantes:0 | OUI (source brute ou normalisee) | NON TESTE | ARCHIVER/EXPORTER PUIS SUPPRIMER | P2 |
| staging.norm_reservoir_bathymetry | table | 13 203 | NON | PK:0; FK sortantes:0; FK entrantes:0; indexes:0; triggers:0; vues dependantes:0; fonctions dependantes:0 | OUI (source brute ou normalisee) | NON TESTE | ARCHIVER/EXPORTER PUIS SUPPRIMER | P2 |
| staging.norm_reservoirs | table | 36 | NON | PK:0; FK sortantes:0; FK entrantes:0; indexes:0; triggers:0; vues dependantes:0; fonctions dependantes:0 | OUI (source brute ou normalisee) | NON TESTE | ARCHIVER/EXPORTER PUIS SUPPRIMER | P2 |
| staging.norm_stations | table | 105 | NON | PK:0; FK sortantes:0; FK entrantes:0; indexes:0; triggers:0; vues dependantes:0; fonctions dependantes:0 | OUI (source brute ou normalisee) | OUI (35 grp) | ARCHIVER/EXPORTER PUIS SUPPRIMER | P2 |
| staging.raw_adm_communes_abhgzr | table | 258 | NON | PK:0; FK sortantes:0; FK entrantes:0; indexes:0; triggers:0; vues dependantes:0; fonctions dependantes:0 | OUI (source brute ou normalisee) | NON TESTE | ARCHIVER/EXPORTER PUIS SUPPRIMER | P2 |
| staging.raw_barrages_abhgzr | table | 36 | NON | PK:0; FK sortantes:0; FK entrantes:0; indexes:0; triggers:0; vues dependantes:0; fonctions dependantes:0 | OUI (source brute ou normalisee) | NON TESTE | ARCHIVER/EXPORTER PUIS SUPPRIMER | P2 |
| staging.raw_bassin_abhgzr | table | 3 | NON | PK:0; FK sortantes:0; FK entrantes:0; indexes:0; triggers:0; vues dependantes:0; fonctions dependantes:0 | OUI (source brute ou normalisee) | NON TESTE | ARCHIVER/EXPORTER PUIS SUPPRIMER | P2 |
| staging.raw_bathymetries_barrages_abhgzr | table | 13 203 | NON | PK:0; FK sortantes:0; FK entrantes:0; indexes:0; triggers:0; vues dependantes:0; fonctions dependantes:0 | OUI (source brute ou normalisee) | NON TESTE | ARCHIVER/EXPORTER PUIS SUPPRIMER | P2 |
| staging.raw_mesures_debits_jr | table | 235 587 | NON | PK:0; FK sortantes:0; FK entrantes:0; indexes:0; triggers:0; vues dependantes:0; fonctions dependantes:0 | OUI (source brute ou normalisee) | NON TESTE | ARCHIVER/EXPORTER PUIS SUPPRIMER | P2 |
| staging.raw_mesures_evaporation_m | table | 6 768 | NON | PK:0; FK sortantes:0; FK entrantes:0; indexes:0; triggers:0; vues dependantes:0; fonctions dependantes:0 | OUI (source brute ou normalisee) | NON TESTE | ARCHIVER/EXPORTER PUIS SUPPRIMER | P2 |
| staging.raw_mesures_humidite_relative_m | table | 3 060 | NON | PK:0; FK sortantes:0; FK entrantes:0; indexes:0; triggers:0; vues dependantes:0; fonctions dependantes:0 | OUI (source brute ou normalisee) | NON TESTE | ARCHIVER/EXPORTER PUIS SUPPRIMER | P2 |
| staging.raw_mesures_lachers_barrages | table | 59 583 | NON | PK:0; FK sortantes:0; FK entrantes:0; indexes:0; triggers:0; vues dependantes:0; fonctions dependantes:0 | OUI (source brute ou normalisee) | NON TESTE | ARCHIVER/EXPORTER PUIS SUPPRIMER | P2 |
| staging.raw_mesures_precipitations_jr | table | 328 821 | NON | PK:0; FK sortantes:0; FK entrantes:0; indexes:0; triggers:0; vues dependantes:0; fonctions dependantes:0 | OUI (source brute ou normalisee) | NON TESTE | ARCHIVER/EXPORTER PUIS SUPPRIMER | P2 |
| staging.raw_mesures_temperature_jr_pn | table | 130 392 | NON | PK:0; FK sortantes:0; FK entrantes:0; indexes:0; triggers:0; vues dependantes:0; fonctions dependantes:0 | OUI (source brute ou normalisee) | NON TESTE | ARCHIVER/EXPORTER PUIS SUPPRIMER | P2 |
| staging.raw_mesures_temperature_m | table | 6 084 | NON | PK:0; FK sortantes:0; FK entrantes:0; indexes:0; triggers:0; vues dependantes:0; fonctions dependantes:0 | OUI (source brute ou normalisee) | NON TESTE | ARCHIVER/EXPORTER PUIS SUPPRIMER | P2 |
| staging.raw_mesures_vitesse_vent_m | table | 1 368 | NON | PK:0; FK sortantes:0; FK entrantes:0; indexes:0; triggers:0; vues dependantes:0; fonctions dependantes:0 | OUI (source brute ou normalisee) | NON TESTE | ARCHIVER/EXPORTER PUIS SUPPRIMER | P2 |
| staging.raw_stations_abhgzr | table | 105 | NON | PK:0; FK sortantes:0; FK entrantes:0; indexes:0; triggers:0; vues dependantes:0; fonctions dependantes:0 | OUI (source brute ou normalisee) | NON TESTE | ARCHIVER/EXPORTER PUIS SUPPRIMER | P2 |
| staging.reseau_hydro_import_raw | table | 33 | NON | PK:0; FK sortantes:0; FK entrantes:0; indexes:0; triggers:0; vues dependantes:0; fonctions dependantes:0 | OUI (source brute ou normalisee) | NON TESTE | ARCHIVER/EXPORTER PUIS SUPPRIMER | P2 |
| staging.reseau_hydrologie_raw | table | 33 | NON | PK:0; FK sortantes:0; FK entrantes:0; indexes:0; triggers:0; vues dependantes:0; fonctions dependantes:0 | OUI (source brute ou normalisee) | NON TESTE | ARCHIVER/EXPORTER PUIS SUPPRIMER | P2 |
| staging.station_meteo_raw | table | 5 | NON | PK:0; FK sortantes:0; FK entrantes:0; indexes:0; triggers:0; vues dependantes:0; fonctions dependantes:0 | OUI (source brute ou normalisee) | NON TESTE | ARCHIVER/EXPORTER PUIS SUPPRIMER | P2 |
| staging.swat_mdb_imports | table | 80 | NON | PK:0; FK sortantes:0; FK entrantes:0; indexes:0; triggers:0; vues dependantes:0; fonctions dependantes:0 | OUI (staging actif / temporaire) | NON TESTE | A VERIFIER MANUELLEMENT | P2 |
| api.mv_dashboard_catchment_counts | matview | n/d | NON | sources:2; dependants:1 | OUI | n/a | CANDIDATE SUPPRESSION | P2 |
| api.mv_dashboard_reservoir_counts | matview | n/d | NON | sources:2; dependants:1 | OUI | n/a | CANDIDATE SUPPRESSION | P2 |
| api.v_catalog_scenarios | view | n/d | NON | sources:4; dependants:1 | OUI | n/a | CANDIDATE SUPPRESSION | P2 |
| api.v_catalog_series | view | n/d | NON | sources:3; dependants:1 | OUI | n/a | CANDIDATE SUPPRESSION | P2 |
| api.v_catalog_stations | view | n/d | NON | sources:4; dependants:1 | OUI | n/a | CANDIDATE SUPPRESSION | P2 |
| api.v_compare_monthly | view | n/d | NON | sources:3; dependants:1 | OUI | n/a | CANDIDATE SUPPRESSION | P2 |
| api.v_dashboard_catchment_counts | view | n/d | NON | sources:8; dependants:2 | OUI | n/a | CANDIDATE SUPPRESSION | P2 |
| api.v_dashboard_national_counts | view | n/d | NON | sources:9; dependants:1 | OUI | n/a | CANDIDATE SUPPRESSION | P2 |
| api.v_dashboard_reservoir_counts | view | n/d | NON | sources:4; dependants:2 | OUI | n/a | CANDIDATE SUPPRESSION | P2 |
| api.v_erosion_subbasins_annual | view | n/d | NON | sources:6; dependants:1 | OUI | n/a | CANDIDATE SUPPRESSION | P2 |
| api.v_map_catchments_annual | view | n/d | NON | sources:6; dependants:1 | OUI | n/a | CANDIDATE SUPPRESSION | P2 |
| api.v_map_stations_latest | view | n/d | NON | sources:5; dependants:1 | OUI | n/a | CANDIDATE SUPPRESSION | P2 |
| api.v_measurements_annual | view | n/d | NON | sources:2; dependants:2 | OUI | n/a | CANDIDATE SUPPRESSION | P2 |
| api.v_measurements_annual_agg | view | n/d | NON | sources:2; dependants:1 | OUI | n/a | CANDIDATE SUPPRESSION | P2 |
| api.v_measurements_daily | view | n/d | NON | sources:2; dependants:1 | OUI | n/a | CANDIDATE SUPPRESSION | P2 |
| api.v_measurements_latest | view | n/d | NON | sources:2; dependants:2 | OUI | n/a | CANDIDATE SUPPRESSION | P2 |
| api.v_measurements_monthly | view | n/d | NON | sources:2; dependants:2 | OUI | n/a | CANDIDATE SUPPRESSION | P2 |
| api.v_measurements_monthly_agg | view | n/d | NON | sources:2; dependants:1 | OUI | n/a | CANDIDATE SUPPRESSION | P2 |
| api.v_qc_property_domain_tovalidate | view | n/d | NON | sources:3; dependants:1 | OUI | n/a | CANDIDATE SUPPRESSION | P2 |
| api.v_series_stats | view | n/d | NON | sources:4; dependants:1 | OUI | n/a | CANDIDATE SUPPRESSION | P2 |
| api.v_timeseries_enriched | view | n/d | NON | sources:5; dependants:8 | OUI | n/a | CANDIDATE SUPPRESSION | P2 |
| audit.v_qc_measurements_duplicates | view | n/d | NON | sources:2; dependants:1 | OUI | n/a | REDONDANTE | P2 |
| audit.v_qc_measurements_orphans | view | n/d | NON | sources:3; dependants:1 | OUI | n/a | REDONDANTE | P2 |
| audit.v_qc_null_geometry | view | n/d | NON | sources:8; dependants:1 | OUI | n/a | REDONDANTE | P2 |
| audit.v_qc_timeseries_duplicates | view | n/d | NON | sources:2; dependants:1 | OUI | n/a | REDONDANTE | P2 |
| audit.v_qc_timeseries_without_measurements | view | n/d | NON | sources:3; dependants:1 | OUI | n/a | REDONDANTE | P2 |
| public.communes | view | n/d | NON | sources:2; dependants:1 | OUI | n/a | REDONDANTE | P2 |
| public.landcover_classes | view | n/d | NON | sources:2; dependants:1 | OUI | n/a | REDONDANTE | P2 |
| public.landcover_periods | view | n/d | NON | sources:2; dependants:1 | OUI | n/a | REDONDANTE | P2 |
| public.observed_properties | view | n/d | NON | sources:2; dependants:1 | OUI | n/a | REDONDANTE | P2 |
| public.reaches | view | n/d | NON | sources:2; dependants:1 | OUI | n/a | REDONDANTE | P2 |
| public.rivers | view | n/d | NON | sources:2; dependants:1 | OUI | n/a | REDONDANTE | P2 |
| public.subbasins | view | n/d | NON | sources:2; dependants:1 | OUI | n/a | REDONDANTE | P2 |
| public.v_catchments_geo | view | n/d | NON | sources:2; dependants:1 | OUI | n/a | REDONDANTE | P2 |
| public.v_map_station | view | n/d | NON | sources:2; dependants:1 | OUI | n/a | REDONDANTE | P2 |
| public.v_measurements_full | view | n/d | NON | sources:3; dependants:1 | OUI | n/a | LEGACY | P2 |
| public.v_property_agg_rule | view | n/d | NON | sources:2; dependants:1 | OUI | n/a | REDONDANTE | P2 |
| public.v_property_catalog | view | n/d | NON | sources:2; dependants:2 | OUI | n/a | REDONDANTE | P2 |
| public.v_property_catalog_final | view | n/d | NON | sources:3; dependants:1 | OUI | n/a | REDONDANTE | P2 |
| public.v_property_module | view | n/d | NON | sources:2; dependants:2 | OUI | n/a | REDONDANTE | P2 |
| public.v_reaches_geo | view | n/d | NON | sources:5; dependants:1 | OUI | n/a | REDONDANTE | P2 |
| public.v_reservoirs_geo | view | n/d | NON | sources:5; dependants:1 | OUI | n/a | REDONDANTE | P2 |
| public.v_stations_geo | view | n/d | NON | sources:5; dependants:1 | OUI | n/a | REDONDANTE | P2 |
| public.v_stats_bathymetry | view | n/d | NON | sources:3; dependants:1 | OUI | n/a | LEGACY | P2 |
| public.v_stats_bathymetry_global | view | n/d | NON | sources:2; dependants:1 | OUI | n/a | LEGACY | P2 |
| public.v_stats_evaporation | view | n/d | NON | sources:2; dependants:1 | OUI | n/a | LEGACY | P2 |
| public.v_stats_evaporation_global | view | n/d | NON | sources:2; dependants:1 | OUI | n/a | LEGACY | P2 |
| public.v_stats_humidity | view | n/d | NON | sources:2; dependants:1 | OUI | n/a | LEGACY | P2 |
| public.v_stats_humidity_global | view | n/d | NON | sources:2; dependants:1 | OUI | n/a | LEGACY | P2 |
| public.v_stats_lachers | view | n/d | NON | sources:2; dependants:1 | OUI | n/a | LEGACY | P2 |
| public.v_stats_lachers_global | view | n/d | NON | sources:2; dependants:1 | OUI | n/a | LEGACY | P2 |
| public.v_stats_precipitation | view | n/d | NON | sources:2; dependants:1 | OUI | n/a | LEGACY | P2 |
| public.v_stats_precipitation_global | view | n/d | NON | sources:2; dependants:1 | OUI | n/a | LEGACY | P2 |
| public.v_stats_property_station_timestep | view | n/d | NON | sources:5; dependants:12 | OUI | n/a | LEGACY | P2 |
| public.v_stats_property_timestep | view | n/d | NON | sources:4; dependants:12 | OUI | n/a | LEGACY | P2 |
| public.v_stats_sediment_load | view | n/d | NON | sources:2; dependants:1 | OUI | n/a | LEGACY | P2 |
| public.v_stats_sediment_load_global | view | n/d | NON | sources:2; dependants:1 | OUI | n/a | LEGACY | P2 |
| public.v_stats_streamflow | view | n/d | NON | sources:2; dependants:1 | OUI | n/a | LEGACY | P2 |
| public.v_stats_streamflow_global | view | n/d | NON | sources:2; dependants:1 | OUI | n/a | LEGACY | P2 |
| public.v_stats_temperature_all | view | n/d | NON | sources:2; dependants:1 | OUI | n/a | LEGACY | P2 |
| public.v_stats_temperature_all_global | view | n/d | NON | sources:2; dependants:1 | OUI | n/a | LEGACY | P2 |
| public.v_stats_temperature_max | view | n/d | NON | sources:2; dependants:1 | OUI | n/a | LEGACY | P2 |
| public.v_stats_temperature_max_global | view | n/d | NON | sources:2; dependants:1 | OUI | n/a | LEGACY | P2 |
| public.v_stats_temperature_mean | view | n/d | NON | sources:2; dependants:1 | OUI | n/a | LEGACY | P2 |
| public.v_stats_temperature_mean_global | view | n/d | NON | sources:2; dependants:1 | OUI | n/a | LEGACY | P2 |
| public.v_stats_temperature_min | view | n/d | NON | sources:2; dependants:1 | OUI | n/a | LEGACY | P2 |
| public.v_stats_temperature_min_global | view | n/d | NON | sources:2; dependants:1 | OUI | n/a | LEGACY | P2 |
| public.v_stats_wind_speed | view | n/d | NON | sources:2; dependants:1 | OUI | n/a | LEGACY | P2 |
| public.v_stats_wind_speed_global | view | n/d | NON | sources:2; dependants:1 | OUI | n/a | LEGACY | P2 |
| public.v_subbasins_geo | view | n/d | NON | sources:3; dependants:1 | OUI | n/a | REDONDANTE | P2 |
| public.v_values_annual | view | n/d | NON | sources:2; dependants:11 | OUI | n/a | LEGACY | P2 |
| public.v_values_evaporation_annual | view | n/d | NON | sources:3; dependants:1 | OUI | n/a | LEGACY | P2 |
| public.v_values_evaporation_monthly | view | n/d | NON | sources:3; dependants:1 | OUI | n/a | LEGACY | P2 |
| public.v_values_evaporation_obs | view | n/d | NON | sources:3; dependants:1 | OUI | n/a | LEGACY | P2 |
| public.v_values_humidity_annual | view | n/d | NON | sources:3; dependants:1 | OUI | n/a | LEGACY | P2 |
| public.v_values_humidity_monthly | view | n/d | NON | sources:3; dependants:1 | OUI | n/a | LEGACY | P2 |
| public.v_values_humidity_obs | view | n/d | NON | sources:3; dependants:1 | OUI | n/a | LEGACY | P2 |
| public.v_values_lachers_annual | view | n/d | NON | sources:3; dependants:1 | OUI | n/a | LEGACY | P2 |
| public.v_values_lachers_monthly | view | n/d | NON | sources:3; dependants:1 | OUI | n/a | LEGACY | P2 |
| public.v_values_lachers_obs | view | n/d | NON | sources:3; dependants:1 | OUI | n/a | LEGACY | P2 |
| public.v_values_measurements | view | n/d | NON | sources:7; dependants:14 | OUI | n/a | LEGACY | P2 |
| public.v_values_monthly | view | n/d | NON | sources:2; dependants:11 | OUI | n/a | LEGACY | P2 |
| public.v_values_precipitation_annual | view | n/d | NON | sources:3; dependants:1 | OUI | n/a | LEGACY | P2 |
| public.v_values_precipitation_monthly | view | n/d | NON | sources:3; dependants:1 | OUI | n/a | LEGACY | P2 |
| public.v_values_precipitation_obs | view | n/d | NON | sources:3; dependants:1 | OUI | n/a | LEGACY | P2 |
| public.v_values_sediment_load_annual | view | n/d | NON | sources:3; dependants:1 | OUI | n/a | LEGACY | P2 |
| public.v_values_sediment_load_monthly | view | n/d | NON | sources:3; dependants:1 | OUI | n/a | LEGACY | P2 |
| public.v_values_sediment_load_obs | view | n/d | NON | sources:3; dependants:1 | OUI | n/a | LEGACY | P2 |
| public.v_values_streamflow_annual | view | n/d | NON | sources:3; dependants:1 | OUI | n/a | LEGACY | P2 |
| public.v_values_streamflow_monthly | view | n/d | NON | sources:3; dependants:1 | OUI | n/a | LEGACY | P2 |
| public.v_values_streamflow_obs | view | n/d | NON | sources:3; dependants:1 | OUI | n/a | LEGACY | P2 |
| public.v_values_temperature_all_obs | view | n/d | NON | sources:3; dependants:1 | OUI | n/a | LEGACY | P2 |
| public.v_values_temperature_max_annual | view | n/d | NON | sources:3; dependants:1 | OUI | n/a | LEGACY | P2 |
| public.v_values_temperature_max_monthly | view | n/d | NON | sources:3; dependants:1 | OUI | n/a | LEGACY | P2 |
| public.v_values_temperature_max_obs | view | n/d | NON | sources:3; dependants:1 | OUI | n/a | LEGACY | P2 |
| public.v_values_temperature_mean_annual | view | n/d | NON | sources:3; dependants:1 | OUI | n/a | LEGACY | P2 |
| public.v_values_temperature_mean_monthly | view | n/d | NON | sources:3; dependants:1 | OUI | n/a | LEGACY | P2 |
| public.v_values_temperature_mean_obs | view | n/d | NON | sources:3; dependants:1 | OUI | n/a | LEGACY | P2 |
| public.v_values_temperature_min_annual | view | n/d | NON | sources:3; dependants:1 | OUI | n/a | LEGACY | P2 |
| public.v_values_temperature_min_monthly | view | n/d | NON | sources:3; dependants:1 | OUI | n/a | LEGACY | P2 |
| public.v_values_temperature_min_obs | view | n/d | NON | sources:3; dependants:1 | OUI | n/a | LEGACY | P2 |
| public.v_values_wind_speed_annual | view | n/d | NON | sources:3; dependants:1 | OUI | n/a | LEGACY | P2 |
| public.v_values_wind_speed_monthly | view | n/d | NON | sources:3; dependants:1 | OUI | n/a | LEGACY | P2 |
| public.v_values_wind_speed_obs | view | n/d | NON | sources:3; dependants:1 | OUI | n/a | LEGACY | P2 |

## 14. Conclusion

- Tables totales : **89**
- Tables utilisées runtime : **37**
- Tables vides : **23**
- Tables non utilisées runtime : **52**
- Redondances confirmées : **48**
- Tables avec doublons confirmés : **1**
- Vues obsolètes / legacy / candidates : **104**
- Schémas legacy : **2**
- Candidates à suppression : **55**
- À validation manuelle : **8**
- PostgreSQL modifié : **NON**
- Prochaine étape : **VALIDATION UTILISATEUR DE LA LISTE DE SUPPRESSION**

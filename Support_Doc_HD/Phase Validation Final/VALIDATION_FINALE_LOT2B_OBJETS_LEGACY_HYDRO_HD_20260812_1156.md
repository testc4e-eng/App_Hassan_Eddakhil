# VALIDATION FINALE LOT 2B — OBJETS LEGACY RESTANTS — `hydro_hd`

- **Date / heure** : 2026-08-12 11:56 UTC
- **Projet** : App_Hassan_Addakhil
- **Lot** : 2B — validation des 5 objets legacy restants
- **Mode** : lecture seule
- **PostgreSQL modifié** : **NON**
- **DROP exécuté** : **NON**
- **`staging` / vues / `old_hd`** : non traités
- **`Support_Doc_HD`** : non modifié

Point d’arrêt : aucune suppression. Attente de validation utilisateur.

---

## 0. Périmètre

Cinq objets restants après LOT 2 / LOT 2A (`audit.nv_stream` déjà retiré) :

1. `audit.gis_reach_shapes_backup_2026`
2. `audit.gis_subbasin_shapes_backup_2026`
3. `audit.nv_limite`
4. `audit.swat_entity_map_backup_2026`
5. `gis.reach_shapes_backup_20260422_144537`

Hors périmètre (déjà classés **À CONSERVER**) :

- `audit.swat_output_archive_rch`
- `audit.swat_output_archive_sub`

Objets interdits de modification : `core.*`, `access.*`, GIS actif, `hydro.*`, `ref.*`, staging actif, `public.users`, vues catalogue, `api.mv_scenario_catalog`.

---

## 1. Pré-check environnement

| Contrôle | Attendu | Constaté | Statut |
| --- | --- | --- | --- |
| Backend Hassan | `http://127.0.0.1:5007` | HTTP **200** — `Hydro API`, `database: connected` | OK |
| Frontend Hassan | `http://127.0.0.1:8090` | HTTP **200** — titre Hydro-Data Intelligence | OK |
| Base officielle | `hydro_hd` | `hydro_hd` via `localhost:5432` (même instance que `host.docker.internal:5432`) | OK |
| DB host / port | `host.docker.internal` / `5432` | confirmé dans `.env` local | OK |
| `/api/v1/catalog/runs` | 9 scénarios | **9** : OBSERVED, etat_actuel, ssp126, ssp245, ssp585, scenario_1..4 | OK |

Environnement **correct**. Analyse poursuivie.

Health backend : `GET /api/v1/hydro/health` à 2026-08-12T11:40:59Z.

---

## 2. Données protégées

| Invariant | Attendu | Pré-check | Post-check | Écart |
| --- | ---: | ---: | ---: | --- |
| `core.timeseries` | 383 | 383 | 383 | aucun |
| `core.measurements` | 3 773 400 | 3 773 400 | 3 773 400 | aucun |
| Stations visibles | 75 | 75 | 75 | aucun |
| Scénarios visibles | 9 | 9 | 9 | aucun |
| Reaches runtime (`gis.reach_shapes`) | 19 | 19 | 19 | aucun |
| Subbasins runtime (`gis.subbasin_shapes`) | 19 | 19 | 19 | aucun |

Aucune baisse. Règles RULE-01 à RULE-04 respectées.

Note complémentaire (hors invariant demandé) :

- `core.stations` = 102 ; stations protégées baseline = 101 / 102
- `core.reaches` = 33 et `core.subbasins` = 33 (**non touchés**, distincts du runtime GIS 19)
- `GET /api/v1/spatial/reaches` = 19 features ; `/api/v1/spatial/subbasins` = 19 features

---

## 3. Exports LOT 2

Dossier :

`D:\3- Projets\App_Hassan_Addakhil\backups\lot2_legacy_20260811_1241`

`pg_restore` : `C:\Program Files\PostgreSQL\17\bin\pg_restore.exe`

| Objet | Dump | Taille | `pg_restore --list` | Table dans le dump |
| --- | --- | ---: | --- | --- |
| `audit.gis_reach_shapes_backup_2026` | `audit.gis_reach_shapes_backup_2026.dump` | 558 522 | OK (exit 0) | `TABLE audit gis_reach_shapes_backup_2026` |
| `audit.gis_subbasin_shapes_backup_2026` | `audit.gis_subbasin_shapes_backup_2026.dump` | 809 343 | OK | `TABLE audit gis_subbasin_shapes_backup_2026` |
| `audit.nv_limite` | `audit.nv_limite.dump` | 1 834 993 | OK | `TABLE audit nv_limite` |
| `audit.swat_entity_map_backup_2026` | `audit.swat_entity_map_backup_2026.dump` | 2 560 | OK | `TABLE audit swat_entity_map_backup_2026` |
| `gis.reach_shapes_backup_20260422_144537` | `gis.reach_shapes_backup_20260422_144537.dump` | 558 905 | OK | `TABLE gis reach_shapes_backup_20260422_144537` |

Les 5 dumps existent, taille > 0, TOC valide, objet présent.

Le dossier contient aussi, hors périmètre 2B : `audit.nv_stream.dump` (LOT 2A), `audit.swat_output_archive_rch.dump`, `audit.swat_output_archive_sub.dump`.

---

## 4. Usage runtime commun aux 5 objets

Recherche dépôt (backend, frontend, scripts, `docker/`) : **0 référence** aux 5 noms.

PostgreSQL :

- vues / matviews dépendantes : **0**
- fonctions : **0**
- triggers métier : **0**
- FK entrantes / sortantes : **0**

Le backend spatial / érosion / hydro / SWAT lit **`gis.reach_shapes`**, **`gis.subbasin_shapes`** et **`core.swat_entity_map`** uniquement.

Preuves code :

- `hydro_Hassan dakhil/backend/src/services/spatial.service.ts` (ex. L235, L528, L532)
- `hydro_Hassan dakhil/backend/src/services/erosionSwatSeries.service.ts` (ex. L620, L630)
- `hydro_Hassan dakhil/backend/src/services/swatIngestion.service.ts` (L520, L560, L608, L652) — table active `core.swat_entity_map`

---

## 5. Fiches objet

### 5.1 `audit.gis_reach_shapes_backup_2026`

OBJET : `audit.gis_reach_shapes_backup_2026`  
LIGNES : **33**  
TAILLE : **680 kB** (696 320 octets)  
RUNTIME : **NON**  
BACKEND : **NON**  
SCRIPTS : **NON**  
DÉPENDANCES SQL : **0**  
SOURCE ACTIVE : `gis.reach_shapes` (19, codes `1..19`, source `NV-Stream.shp`) ; géométries aussi présentes dans `core.reaches` (33/33 `ST_Equals`)  
DONNÉES UNIQUES : **non uniques en base** — les 14 extra existent encore dans `core.reaches` (non touché) ; unique seulement vis-à-vis du runtime GIS 19  
VALEUR HISTORIQUE : **OUI** — jeu SWAT 33 entités, codes `200001..200033`  
DUMP VALIDE : **OUI**  
RISQUE : **FAIBLE** si dump conservé ; les 14 extra restent aussi dans `core.reaches`

**Décision : `SUPPRIMABLE — DUMP SUFFISANT`**

---

### 5.2 `audit.gis_subbasin_shapes_backup_2026`

OBJET : `audit.gis_subbasin_shapes_backup_2026`  
LIGNES : **33**  
TAILLE : **960 kB** (983 040 octets)  
RUNTIME : **NON**  
BACKEND : **NON**  
SCRIPTS : **NON**  
DÉPENDANCES SQL : **0**  
SOURCE ACTIVE : `gis.subbasin_shapes` (19) ; copie géométrique **33/33** dans `core.subbasins`  
DONNÉES UNIQUES : **non uniques en base** — extra `20..33` encore dans `core.subbasins`  
VALEUR HISTORIQUE : **OUI** — ancienne délimitation SWAT 33 sous-bassins  
DUMP VALIDE : **OUI**  
RISQUE : **FAIBLE**

**Décision : `SUPPRIMABLE — DUMP SUFFISANT`**

---

### 5.3 `audit.nv_limite`

OBJET : `audit.nv_limite`  
LIGNES : **19**  
TAILLE : **2136 kB** (2 187 264 octets)  
RUNTIME : **NON**  
BACKEND : **NON**  
SCRIPTS : **NON**  
DÉPENDANCES SQL : PK `ogc_fid` + gist `wkb_geometry` uniquement  
SOURCE ACTIVE : `gis.subbasin_shapes` (jointure 19/19 sur `subbasin`)  
DONNÉES UNIQUES : **NON** — attributs métier déjà dans `source_attrs` ; 2 écarts géométriques = réparation `ST_MakeValid` seulement  
VALEUR HISTORIQUE : copie brute `NV-limite.shp`  
DUMP VALIDE : **OUI**  
RISQUE : **FAIBLE**

**Décision : `SUPPRIMABLE — DUMP SUFFISANT`**

---

### 5.4 `audit.swat_entity_map_backup_2026`

OBJET : `audit.swat_entity_map_backup_2026`  
LIGNES : **38**  
TAILLE : **16 kB**  
RUNTIME : **NON**  
BACKEND : **NON** (le runtime utilise `core.swat_entity_map`)  
SCRIPTS : **NON**  
DÉPENDANCES SQL : **0**  
SOURCE ACTIVE : `core.swat_entity_map` (38 lignes, mapping `manual`, confidence 1.00, 19 reach_id + 19 subbasin_id distincts)  
DONNÉES UNIQUES : **OUI comme trace d’audit** — ancien mapping `gis_match` effondré (tout vers id 1) ; **2/38** cibles identiques seulement  
VALEUR HISTORIQUE : **OUI** — preuve de l’état avant correction manuelle  
DUMP VALIDE : **OUI**  
RISQUE : **FAIBLE** si dump conservé

**Décision : `SUPPRIMABLE — DUMP SUFFISANT`**

---

### 5.5 `gis.reach_shapes_backup_20260422_144537`

OBJET : `gis.reach_shapes_backup_20260422_144537`  
LIGNES : **33**  
TAILLE : **688 kB** (704 512 octets)  
RUNTIME : **NON**  
BACKEND : **NON**  
SCRIPTS : **NON**  
DÉPENDANCES SQL : **0**  
SOURCE ACTIVE : aucune correspondance avec `gis.reach_shapes` (`1..19`) ; **33/33** `ST_Equals` avec `audit.gis_reach_shapes_backup_2026`  
DONNÉES UNIQUES : **codification seulement** (`112..284`) — mêmes géométries que le backup audit 2026  
VALEUR HISTORIQUE : snapshot intermédiaire de recodification  
DUMP VALIDE : **OUI**  
RISQUE : **FAIBLE**

**Décision : `SUPPRIMABLE — DUMP SUFFISANT`**

---

## 6. GIS reach backup — 33 vs 19 vs 14 extra

Référentiels comparés :

| Table | Lignes | Codes |
| --- | ---: | --- |
| `audit.gis_reach_shapes_backup_2026` | 33 | `200001..200033` |
| `gis.reach_shapes` (runtime) | 19 | `1..19` |
| `core.reaches` (non touché) | 33 | `200001..200033` |
| `gis.reach_shapes_backup_20260422_144537` | 33 | `112..284` |

### Différence de codification

- Backup audit / `core.reaches` : hydroids SWAT `200001+`, `source_attrs` sans tag `NV-Stream.shp`
- Runtime : codes `1..19`, `source_attrs.source = NV-Stream.shp`
- Snapshot avril : codes épars `112..284`

`ST_Equals` backup audit ↔ runtime : **0 / 19** (id) et **0** en jointure géométrique croisée.  
`ST_Equals` backup audit ↔ `core.reaches` : **33 / 33** (même tracé ; seul `catchment_id` diffère : backup tout à `1`, core `1..33`).  
`ST_Equals` backup audit ↔ snapshot avril : **33 / 33**.

Les géométries « historiques différentes » du runtime sont donc **un autre référentiel** (SWAT 33), pas une variante légère des 19 NV-Stream.

### 14 entités supplémentaires (absentes du runtime GIS)

| reach_id | reach_code | subbasin_id | length_m |
| ---: | ---: | ---: | ---: |
| 20 | 200020 | 20 | 36 081.6 |
| 21 | 200021 | 21 | 70 837.3 |
| 22 | 200022 | 22 | 31 059.5 |
| 23 | 200023 | 23 | 11 005.7 |
| 24 | 200024 | 24 | 20 388.0 |
| 25 | 200025 | 25 | 39 898.2 |
| 26 | 200026 | 26 | 19 892.7 |
| 27 | 200027 | 27 | 23 059.2 |
| 28 | 200028 | 28 | 46 120.4 |
| 29 | 200029 | 29 | 63 699.5 |
| 30 | 200030 | 30 | 28 903.6 |
| 31 | 200031 | 31 | 17 263.5 |
| 32 | 200032 | 32 | 113 407.1 |
| 33 | 200033 | 33 | 113 045.3 |

Reach backup `1` : géométrie dégénérée (1 point, `length_m` NULL, longueur géographique 0). Présent aussi dans `core.reaches`.

### Valeur métier des 14 extra

- **Pas utilisées** par la carte, l’érosion ou le spatial runtime (19 features).
- **Toujours présentes** dans `core.reaches` (conservé).
- **Archivées** dans le dump du 2026-08-11.

Conclusion : pas besoin de garder la table `audit.*` en plus. Le dump suffit comme archive de cette copie. Une validation métier supplémentaire n’est pas requise pour décider du DROP **de la copie audit**, car le référentiel 33 reste dans `core.reaches`.

---

## 7. GIS subbasin backup — 14 extra identifiés

| Table | Lignes |
| --- | ---: |
| `audit.gis_subbasin_shapes_backup_2026` | 33 |
| `gis.subbasin_shapes` | 19 |
| `core.subbasins` | 33 |

Codes communs `1..19` : **0/19** `ST_Equals`, **0/19** `area_m2` identique.  
Le runtime a `area_m2 = 0` pour les 19 (aire portée ailleurs / `source_attrs`) ; le backup porte les aires SWAT. Nombre de sommets : backup 81–2546 vs runtime 3479–9599. Ce n’est **pas** le même découpage.

### 14 subbasins supplémentaires

| subbasin_id / code | name | area_m2 |
| ---: | --- | ---: |
| 20 | Subbasin 20 | 117 070 191.38 |
| 21 | Subbasin 21 | 229 887 315.60 |
| 22 | Subbasin 22 | 141 265 419.44 |
| 23 | Subbasin 23 | 39 344 556.22 |
| 24 | Subbasin 24 | 86 770 373.70 |
| 25 | Subbasin 25 | 118 092 295.06 |
| 26 | Subbasin 26 | 81 519 332.80 |
| 27 | Subbasin 27 | 103 511 182.26 |
| 28 | Subbasin 28 | 140 002 199.28 |
| 29 | Subbasin 29 | 220 193 679.05 |
| 30 | Subbasin 30 | 128 714 094.53 |
| 31 | Subbasin 31 | 102 756 915.27 |
| 32 | Subbasin 32 | 416 384 256.14 |
| 33 | Subbasin 33 | 379 491 726.99 |

Ces 14 existent aussi dans `core.subbasins` (33/33 `ST_Equals` avec le backup).  
Dump valide → conservation en table `audit` non nécessaire.

---

## 8. `audit.nv_limite` — les 2 géométries différentes

Correspondance `nv_limite.subbasin::int = gis.subbasin_shapes.subbasin_code` : **19/19**.  
`ST_Equals` : **17/19**.

Les 2 écarts :

| code | ogc_fid | Type | npts nv / runtime | Δ aire | `ST_SymDifference` | Distance centroïdes | Validité nv | Validité runtime |
| ---: | ---: | --- | --- | ---: | ---: | ---: | --- | --- |
| **4** | 6 | MultiPolygon 4326 | 7403 / 7405 | **0** | **0** | **0 m** | invalide (auto-intersection ~ -4.972, 32.321) | valide (3 parties) |
| **7** | 2 | MultiPolygon 4326 | 4487 / 4488 | **0** | **0** | **0 m** | invalide (auto-intersection ~ -5.086, 32.135) | valide (2 parties) |

`ST_MakeValid(nv_limite.wkb_geometry)` = géométrie runtime pour **4 et 7**.

**Impact métier :** aucun. Pas de bassin différent, pas de décalage, pas de perte d’aire. Écart de représentation (réparation de validité), déjà appliqué dans `gis.subbasin_shapes`.

Attributs déjà recopiés **19/19** dans `gis.subbasin_shapes.source_attrs` (`source = NV-limite.shp`) : `area`, `slo1`, `len1`, `sll`, `csl`, `wid1`, `dep1`, `lat`, `long_`, `elev`, `elevmin`, `elevmax`, `hydroid`, `outletid`.  
Non recopiés (vides / redondants) : `bname`, `shape_len`, `shape_area`, `ogc_fid`.

---

## 9. `audit.swat_entity_map_backup_2026` vs `core.swat_entity_map`

| | Backup `audit` | Actif `core` |
| --- | --- | --- |
| Lignes | 38 | 38 |
| Types | 19 `rch` + 19 `sub` | 19 `rch` + 19 `sub` |
| `mapping_method` | `gis_match` × 38 | `manual` × 38 |
| `confidence` | 0.90 (rch) / 0.95 (sub) | 1.00 × 38 |
| `reach_id` distincts | **1** (tout = 1) | **19** |
| `subbasin_id` distincts | **1** (tout = 1) | **19** |
| Couples cibles identiques | **2 / 38** | `rch/1` et `sub/1` seulement |

Pourquoi le mapping a changé :

- l’archive `gis_match` a **effondré** tous les codes SWAT `1..19` vers `reach_id = 1` / `subbasin_id = 1` (match GIS incorrect) ;
- l’état actuel `manual` aligne `swat_code N → reach_id N / subbasin_id N` (1:1), ce que le backend consomme (`swatIngestion.service.ts`).

`core.swat_entity_map` est clairement l’état corrigé actuel.  
L’ancien mapping n’a qu’une valeur historique d’audit. Le dump de 2560 octets suffit.

---

## 10. Ancien snapshot GIS reach `20260422_144537`

- 33 objets
- Codes : `112, 114, 120, 147, 150, 164, 174, 183, 186, 187, 189, 199, 201, 207, 213, 216, 221, 230, 232, 234, 240, 242, 243, 247, 249, 253, 259, 267, 269, 274, 279, 283, 284`
- Recouvrement code avec runtime `1..19` : **0**
- Recouvrement géométrique avec runtime : **0**
- Recouvrement géométrique avec `audit.gis_reach_shapes_backup_2026` : **33/33**

Appariement (audit hydroid ↔ code avril), extrait significatif :

`200001↔284`, `200004↔112`, `200019↔232`, `200020↔249`, … `200033↔216`

**Nature :** ancien référentiel GIS (codes métier 112–284) **remplacé** par la recodification `200001..200033`, elle-même **non utilisée** par le runtime actuel `1..19` (NV-Stream).

Ce n’est pas une version métier encore servie. C’est un snapshot de recodification. Le dump suffit.

---

## 11. Baseline

Script : `scripts/quality/compare-functional-baseline.py`  
Aucune écriture PostgreSQL.

| Étape | Fichiers | Compare | Statut |
| --- | --- | --- | --- |
| Avant | `backups/lot2b_validation_20260812/LOT2B_PRECHECK_BASELINE.json` (+ `.md`) | vs baseline officielle 2026-08-10 | REGRESSION **préexistante** `api:catalog_runs` 9 ≠ 17 |
| Après | `backups/lot2b_validation_20260812/LOT2B_POSTCHECK_BASELINE.json` (+ `.md`) | vs pré-check LOT 2B | **WARNING** (hash payload seulement) |
| Après | snapshot live | vs officielle 2026-08-10 | même REGRESSION `catalog_runs` 9 ≠ 17 |

Pré-check vs officielle (déjà documenté en DQ6-A, `RAPPORT_DQ6A_...` : « scénarios visibles avant : 17 » / `17 -> 9`) :

```
OK: scenarios / runtime_reaches / runtime_subbasins / stations / timeseries / rch / sub / layers
REGRESSION: api:catalog_runs: Item count changed (9 != 17).
WARNING: api:catalog_hydro_stations: Item count changed (5 != 0).
WARNING: api:spatial_reaches / data_scan_summary / data_scan_periods_global (hash)
```

Post-check vs pré-check LOT 2B (cette session, lecture seule) :

```
OK: scenarios / runtime_reaches / runtime_subbasins / stations / timeseries / rch / sub / layers
WARNING: api:spatial_reaches: Endpoint payload hash changed.
WARNING: api:data_scan_periods_global: Endpoint payload hash changed.
```

Les deux WARNING post/pré sont des **hash de payload** (counts inchangés : 19 reaches, 5 périodes). Aucune baisse de volume. Non imputable à un DROP (aucun DROP).

La REGRESSION `catalog_runs` 9 ≠ 17 **n’est pas introduite par le LOT 2B**. Elle date de DQ6-A (catalogue virtuel à 9 scénarios visibles). L’invariant métier demandé aujourd’hui est **9 scénarios** — respecté.

---

## 12. Tableau final

| Objet | Runtime | Données uniques | Dump OK | Valeur historique | Décision | Risque |
| --- | --- | --- | --- | --- | --- | --- |
| `audit.gis_reach_shapes_backup_2026` | NON | 14 extra aussi dans `core.reaches` ; 0 géométrie = runtime | OUI | OUI (SWAT 33, codes 200001–200033) | **SUPPRIMABLE — DUMP SUFFISANT** | Faible |
| `audit.gis_subbasin_shapes_backup_2026` | NON | 14 extra aussi dans `core.subbasins` ; 0 géométrie = runtime | OUI | OUI (délimitation SWAT 33) | **SUPPRIMABLE — DUMP SUFFISANT** | Faible |
| `audit.nv_limite` | NON | NON (source déjà dans `gis.subbasin_shapes` + MakeValid 4 et 7) | OUI | OUI (shapefile brut) | **SUPPRIMABLE — DUMP SUFFISANT** | Faible |
| `audit.swat_entity_map_backup_2026` | NON | OUI comme trace (mapping gis_match effondré) | OUI | OUI (avant correction manual) | **SUPPRIMABLE — DUMP SUFFISANT** | Faible |
| `gis.reach_shapes_backup_20260422_144537` | NON | Codification 112–284 seulement (mêmes 33 géométries) | OUI | OUI (snapshot recodification) | **SUPPRIMABLE — DUMP SUFFISANT** | Faible |

---

## 13. Synthèse

OBJETS SUPPRIMABLES :

- `audit.gis_reach_shapes_backup_2026`
- `audit.gis_subbasin_shapes_backup_2026`
- `audit.nv_limite`
- `audit.swat_entity_map_backup_2026`
- `gis.reach_shapes_backup_20260422_144537`

Condition préalable à tout DROP futur (non exécuté) :

- conserver `backups/lot2_legacy_20260811_1241/*.dump`
- ne pas toucher `core.reaches` / `core.subbasins` / GIS actif / `core.swat_entity_map`
- rejouer `compare-functional-baseline.py` après DROP

OBJETS À CONSERVER :

- `audit.swat_output_archive_rch` (hors 2B, déjà classé)
- `audit.swat_output_archive_sub` (hors 2B, déjà classé)
- toutes les tables listées §10 de la consigne

OBJETS À VALIDATION MÉTIER :

- **aucun** parmi les 5 (les 14 extra SWAT restent dans `core.*` + dumps)

POSTGRESQL MODIFIÉ :

- **NON**

BASELINE :

- pré : `backups/lot2b_validation_20260812/LOT2B_PRECHECK_BASELINE.json`
- post : `backups/lot2b_validation_20260812/LOT2B_POSTCHECK_BASELINE.json`
- vs pré-check : **WARNING** (hash uniquement), volumes protégés **identiques**
- vs officielle 2026-08-10 : REGRESSION connue `catalog_runs` 9 ≠ 17 (DQ6-A), **pas** une régression LOT 2B

---

## 14. Point d’arrêt

Aucun `DROP`.  
Pas de nettoyage `staging`.  
Pas de nettoyage des vues.  
Pas de `old_hd`.

Attente de validation utilisateur avant toute suppression.

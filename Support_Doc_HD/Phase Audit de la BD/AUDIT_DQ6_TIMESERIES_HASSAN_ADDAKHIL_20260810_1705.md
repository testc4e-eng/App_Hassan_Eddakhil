# AUDIT DQ-6 TIMESERIES - HASSAN ADDAKHIL

Date audit: 2026-08-10
Heure audit: 17:05
Timezone: Africa/Casablanca
Mode: lecture seule stricte
Branche Git observee: `ilh_dev_20-07`
Commit de reference: `99c1089e9f0588fdbd8e8872302295cb88bbdaf6`
Baseline fonctionnelle officielle: `Support_Doc_HD/Phase Protection Donnees Fonctionnelles/PROTECTED_FUNCTIONAL_DATA_BASELINE_20260810_1608.json`
Script de comparaison: `scripts/quality/compare-functional-baseline.py`

Aucune correction n'a ete appliquee.
Aucune ecriture SQL n'a ete effectuee.
Aucun INSERT/UPDATE/DELETE/ALTER/DROP n'a ete execute.
Aucun fichier backend/frontend/runtime n'a ete modifie dans cette phase.

## 1. Resume executif

Verdict global: la chaine timeseries de `hydro_hd` est **fonctionnelle et globalement fiable**, mais elle repose sur une **architecture hybride core/access** avec plusieurs incoherences structurelles a corriger dans une phase separee.

Constats majeurs:

- Les **383 timeseries protegees** et les **3 773 400 mesures protegees** sont bien presentes.
- Aucun doublon metier n'a ete detecte dans `core.timeseries`.
- Aucun doublon strict n'a ete detecte dans `core.measurements`.
- Aucun orphelin bloquant n'a ete detecte entre `measurements -> timeseries`, `timeseries -> station`, `timeseries -> property` et `timeseries -> run`.
- La vue critique `public.v_ts_catalog_enriched` est **alignee 1:1** sur `core.timeseries`.
- Les scenarios `etat_actuel`, `ssp126`, `ssp245`, `ssp585` restent **access uniquement** pour les timeseries SWAT.
- Les scenarios `scenario_1..4` sont **partiellement materialises dans core**: daily oui, yearly non.
- `SWAT_SED_IN_TONS` et `SWAT_SED_CONC_MG_KG` sont **visibles cote plateforme** mais **non materialises dans core**; ils sont exposes dynamiquement depuis `access.rch_results`.
- Les anomalies de donnees sont concentrees dans quelques series observed climat mensuelles et dans un petit nombre de valeurs suspectes.
- Les tables `core.timeseries` et `core.measurements` n'ont **ni PK, ni FK, ni UNIQUE actives**, meme si les donnees actuelles sont compatibles avec ces contraintes.

Conclusion operationnelle:

- La plateforme peut continuer a s'appuyer sur l'etat actuel sans regression fonctionnelle immediate.
- Le nettoyage final ne doit pas supprimer `access.rch_results`, `access.sub_results`, `api.mv_scenario_catalog`, `public.v_ts_catalog_enriched` ni les services backend de fallback.
- La prochaine etape doit etre un **plan de correction DQ-6** cible sur la qualite, la tracabilite batch, la clarte scenario/catalogue et les garde-fous structurels.

## 2. Baseline protegee

Baseline chargee:

- Timeseries protegees: **383**
- Mesures protegees: **3 773 400**
- Stations visibles: **75**
- Scenarios proteges visibles: `OBSERVED`, `etat_actuel`, `ssp126`, `ssp245`, `ssp585`, `scenario_1`, `scenario_2`, `scenario_3`, `scenario_4`
- Scenarios techniques proteges: `SWAT_OUTPUT`, `SWAT_OUTPUT_01`
- Variables protegees: `PRECIPITATION`, `TMAX`, `TMIN`, `TMEAN`, `HUMIDITY_REL`, `EVAPORATION`, `WIND_SPEED`, `STREAMFLOW`, `SWAT_FLOW_M3S`, `SWAT_SED_IN_TONS`, `SWAT_SED_TONS`, `SWAT_SED_CONC_MG_KG`, `SWAT_SYLDT_HA`

Signatures d'endpoints critiques relevees dans la baseline:

| Endpoint | HTTP | Hash baseline | Items |
|---|---:|---|---:|
| `health` | 200 | `957f8ffc7662cdbb` | 8 |
| `catalog_runs` | 200 | `7e1e72564651a66d` | 17 |
| `catalog_availability_climat` | 200 | `4eef512b718ac88e` | 30 |
| `catalog_availability_hydro` | 200 | `180379674b06cf2a` | 45 |
| `catalog_availability_erosion` | 200 | `c1d9586363fc93ea` | 40 |
| `swat_availability` | 200 | `2328b481603c51e5` | 383 |

Regle de lecture DQ-6:

- aucune recommandation de cette phase ne doit reduire `383 / 3 773 400 / 75` sans remplacement fonctionnel prouve et valide.

## 3. Inventaire `core.timeseries`

### 3.1 Volumetrie globale

| Controle | Valeur |
|---|---:|
| Lignes totales | 383 |
| `ts_id` distincts | 383 |
| Stations distinctes | 75 |
| Mesures rattachees | 3 773 400 |
| Series sans mesures | 0 |

### 3.2 Repartition par `source_type`

| source_type | Series |
|---|---:|
| `simulated` | 327 |
| `observed` | 56 |

### 3.3 Repartition par `time_step`

| time_step | Series |
|---|---:|
| `daily` | 357 |
| `monthly` | 26 |
| `yearly` | 0 |

Le type PostgreSQL de `time_step` est l'enum `time_step` avec les valeurs:
`instantaneous`, `hourly`, `daily`, `monthly`, `annual`.
En pratique, `core.timeseries` n'utilise ici que `daily` et `monthly`.

### 3.4 Repartition par run

| Scenario | Run ID | Series core | Statut rapide |
|---|---:|---:|---|
| `OBSERVED` | 1 | 56 | Observe core |
| `SWAT_OUTPUT_01` | 2 | 99 | Legacy core complet |
| `etat_actuel` | 3 | 0 | Access uniquement |
| `ssp126` | 4 | 0 | Access uniquement |
| `ssp245` | 5 | 0 | Access uniquement |
| `ssp585` | 6 | 0 | Access uniquement |
| `scenario_1` | 7 | 57 | Partiel core daily |
| `scenario_2` | 8 | 57 | Partiel core daily |
| `scenario_3` | 9 | 57 | Partiel core daily |
| `scenario_4` | 10 | 57 | Partiel core daily |

### 3.5 Repartition par propriete

| Property | property_id | Series |
|---|---:|---:|
| `SWAT_FLOW_M3S` | 31 | 109 |
| `SWAT_SED_TONS` | 32 | 109 |
| `SWAT_SYLDT_HA` | 33 | 109 |
| `TMIN` | 22 | 10 |
| `TMAX` | 24 | 10 |
| `TMEAN` | 21 | 9 |
| `PRECIPITATION` | 29 | 8 |
| `EVAPORATION` | 28 | 6 |
| `STREAMFLOW` | 26 | 5 |
| `HUMIDITY_REL` | 30 | 4 |
| `WIND_SPEED` | 23 | 2 |
| `INFLOW_M3` | 25 | 1 |
| `RESTITUTION_M3` | 27 | 1 |

### 3.6 Distribution par station

| Controle | Valeur |
|---|---:|
| Stations distinctes | 75 |
| Min series par station | 1 |
| Max series par station | 10 |
| Moyenne | 5.11 |

### 3.7 Cle metier candidate

Cle candidate auditee:

`station_id + property_id + run_id + source_type + time_step`

| Cle metier | Groupes doublons | Lignes concernees | Conclusion |
|---|---:|---:|---|
| `station_id + property_id + run_id + source_type + time_step` | 0 | 0 | Compatible avec une contrainte `UNIQUE` |

### 3.8 Orphelins et series non rattachees

| Controle | Resultat |
|---|---:|
| Series sans station | 0 |
| Series sans propriete | 0 |
| Series sans run | 0 |
| Series sans batch | 284 |
| Series sans mesures | 0 |

Interpretation:

- Les relations fonctionnelles coeur sont saines.
- Le point faible principal est la **tracabilite batch**.

## 4. Inventaire `core.measurements`

| Controle | Resultat |
|---|---:|
| Lignes totales | 3 773 400 |
| `ts_id` distincts couverts | 383 |
| Date min | `1965-03-03 00:00:00-08:00` |
| Date max | `2025-10-15 00:00:00-07:00` |
| `datetime` NULL | 0 |
| `value` NULL | 0 |
| `NaN` | 0 |
| `+/-Infinity` | 0 |

Colonnes relevees:

| Table | Colonne | Type PostgreSQL |
|---|---|---|
| `core.measurements` | `ts_id` | `integer` |
| `core.measurements` | `datetime` | `timestamp with time zone` |
| `core.measurements` | `value` | `double precision` |
| `core.measurements` | `quality_flag` | `smallint` |

## 5. Orphelins

| Relation | Orphelins | Gravite |
|---|---:|---|
| `core.measurements -> core.timeseries` | 0 | Aucune |
| `core.timeseries -> core.stations` | 0 | Aucune |
| `core.timeseries -> ref.observed_properties` | 0 | Aucune |
| `core.timeseries -> core.model_runs` | 0 | Aucune |
| `core.timeseries -> core.measurement_batches / core.data_batches` | 284 series sans lien | Majeure pour la tracabilite |

Conclusion:

- Pas d'orphelins runtime bloquants.
- Tracabilite partielle sur les batches.

## 6. Doublons timeseries

Tests realises:

- A. meme `ts_id`
- B. meme cle metier
- C. memes metadonnees utiles avec `ts_id` differents
- D. memes donnees de mesures dupliquees entre series

| Type doublon | Groupes | Lignes / series | Interpretation |
|---|---:|---:|---|
| Meme `ts_id` | 0 | 0 | Aucun doublon technique |
| Meme cle metier | 0 | 0 | Aucun doublon metier |
| Memes metadonnees, `ts_id` differents | 0 | 0 | Pas de doublon catalogue identifie |
| Mesures dupliquees entre deux series differentes | 0 groupe probant | 0 | Pas de duplication metier confirmee |

Conclusion:

- Les 383 series protegees ne sont pas dupliquees dans `core.timeseries`.

## 7. Doublons measurements

| Type | Groupes | Lignes | Risque |
|---|---:|---:|---|
| `(ts_id, datetime)` meme valeur | 0 | 0 | Aucun |
| `(ts_id, datetime, value)` strict | 0 | 0 | Aucun |
| `(ts_id, datetime)` avec valeurs differentes | 0 | 0 | Aucun conflit detecte |

Conclusion:

- `core.measurements` est propre du point de vue duplication.

## 8. Audit par scenario

| Scenario | Run ID | Series | Mesures | Min date | Max date | Statut |
|---|---:|---:|---:|---|---|---|
| `OBSERVED` | 1 | 56 | 349 710 | 1965-03-03 | 2025-10-15 | CORE COMPLET |
| `SWAT_OUTPUT_01` | 2 | 99 | 1 036 530 | 1994-12-31 16:00:00-08:00 | 2023-08-30 17:00:00-07:00 | CORE COMPLET / LEGACY |
| `etat_actuel` | 3 | 0 | 0 | n/a core | n/a core | ACCESS UNIQUEMENT |
| `ssp126` | 4 | 0 | 0 | n/a core | n/a core | ACCESS UNIQUEMENT |
| `ssp245` | 5 | 0 | 0 | n/a core | n/a core | ACCESS UNIQUEMENT |
| `ssp585` | 6 | 0 | 0 | n/a core | n/a core | ACCESS UNIQUEMENT |
| `scenario_1` | 7 | 57 | 596 790 | 1994-12-31 16:00:00-08:00 | 2023-08-30 17:00:00-07:00 | PARTIEL |
| `scenario_2` | 8 | 57 | 596 790 | 1994-12-31 16:00:00-08:00 | 2023-08-30 17:00:00-07:00 | PARTIEL |
| `scenario_3` | 9 | 57 | 596 790 | 1994-12-31 16:00:00-08:00 | 2023-08-30 17:00:00-07:00 | PARTIEL |
| `scenario_4` | 10 | 57 | 596 790 | 1994-12-31 16:00:00-08:00 | 2023-08-30 17:00:00-07:00 | PARTIEL |

Complement access:

- `etat_actuel`: `access.rch_results` et `access.sub_results` contiennent `596 790` lignes chacun.
- `ssp126`, `ssp245`, `ssp585`: `747 707` lignes reach et `747 707` lignes subbasin chacun.
- `scenario_1..4`: `199 481` reach + `199 481` subbasin chacun en access pour les pas non materialises dans core.

## 9. Observed

### 9.1 Synthese des 5 stations hydrologiques protegees

| Station | Variable | Time step | Points | Periode | Anomalies |
|---|---|---|---:|---|---|
| `FOUM TILLICHT` (`1508/38`) | `PRECIPITATION` | daily | 15 341 | 1982-09-01 -> 2024-08-31 | Aucune forte |
| `FOUM TILLICHT` (`1508/38`) | `STREAMFLOW` | daily | 17 897 | 1974-09-01 -> 2023-08-31 | Aucune forte |
| `FOUM TILLICHT` (`1508/38`) | `TMAX/TMEAN/TMIN` | daily | 8 766 chacun | 2000-01-01 -> 2023-12-31 | Aucune forte |
| `FOUM TILLICHT` (`1508/38`) | `EVAPORATION` | monthly | 122 | 2013-05-01 -> 2023-08-01 | Partiel, max gap 3 mois |
| `Zaouiet Sidi Hamza` (`31/38`) | `PRECIPITATION` | daily | 15 706 | 1982-09-01 -> 2025-08-31 | Aucune forte |
| `Zaouiet Sidi Hamza` (`31/38`) | `STREAMFLOW` | daily | 21 230 | 1965-03-03 -> 2023-08-31 | Gap max 137 jours |
| `Zaouiet Sidi Hamza` (`31/38`) | `TMAX/TMEAN/TMIN` | daily | 8 766 chacun | 2000-01-01 -> 2023-12-31 | Aucune forte |
| `MZIZEL` (`1585/38`) | `PRECIPITATION` | daily | 15 706 | 1982-09-01 -> 2025-08-31 | Aucune forte |
| `MZIZEL` (`1585/38`) | `STREAMFLOW` | daily | 13 879 | 1985-09-01 -> 2023-08-31 | Aucune forte |
| `MZIZEL` (`1585/38`) | `TMAX/TMEAN/TMIN` | daily | 8 766 chacun | 2000-01-01 -> 2023-12-31 | Aucune forte |
| `FOUM ZAABEL` (`867/48`) | `PRECIPITATION` | daily | 12 842 | 1982-09-01 -> 2023-08-31 | Partiel, gap max 1 981 jours |
| `FOUM ZAABEL` (`867/48`) | `STREAMFLOW` | daily | 16 544 | 1970-05-05 -> 2015-08-31 | Cohesif |
| `FOUM ZAABEL` (`867/48`) | `EVAPORATION/TMAX/TMIN/WIND_SPEED` | monthly | 342 a 419 | 1982-01-01 -> 2025-08-01 | Plusieurs series partielles / tres incompletes |
| `Barrage Hassan Addakhil` (`1940/48`) | `PRECIPITATION` | daily | 15 736 | 1982-09-01 -> 2025-08-31 | Aucune forte |
| `Barrage Hassan Addakhil` (`1940/48`) | `STREAMFLOW` | daily | 8 400 | 1992-09-01 -> 2015-08-31 | Cohesif |
| `Barrage Hassan Addakhil` (`1940/48`) | `TMAX/TMEAN/TMIN/HUMIDITY_REL/EVAPORATION` | monthly | 232 a 455 | 1982-09-01 -> 2025-09-01 | Plusieurs series tres incompletes |

### 9.2 Conclusion observed

- Les series observed hydrologiques protegees sont globalement stables.
- Les fragilites portent surtout sur le **climat mensuel** et non sur le **streamflow observed**.

## 10. Climat

Variables auditees:

- `PRECIPITATION`
- `TMAX`
- `TMIN`
- `TMEAN`
- `HUMIDITY_REL`
- `EVAPORATION`
- `WIND_SPEED`

### 10.1 Couverture par variable

| Variable | Pas | Series | Points | Commentaire |
|---|---|---:|---:|---|
| `PRECIPITATION` | daily | 8 | 107 627 | Couverture robuste, mais une station partielle (`867/48`) |
| `TMAX` | daily | 5 | 43 464 | Cohesif |
| `TMAX` | monthly | 5 | 1 771 | Plusieurs trous sur `1940/48` et `867/48` |
| `TMEAN` | daily | 5 | 43 464 | Cohesif |
| `TMEAN` | monthly | 4 | 980 | Plus fragile, valeur extreme detectee |
| `TMIN` | daily | 5 | 43 464 | Cohesif |
| `TMIN` | monthly | 5 | 1 674 | Trous importants selon station |
| `HUMIDITY_REL` | monthly | 4 | 928 | `1940/48` tres incomplet |
| `EVAPORATION` | monthly | 6 | 2 031 | Partiel sur plusieurs stations |
| `WIND_SPEED` | monthly | 2 | 364 | Couverture etendue limitee |

### 10.2 Risques climat

- Pas de doublon detecte.
- Les trous longs sur le mensuel peuvent fausser certaines analyses de tendance si aucune qualification n'est appliquee.
- `TMEAN` contient au moins une valeur manifestement suspecte.

## 11. Hydrologie

### 11.1 Observe

| Variable | Scenario | Series | Points | Min | Max | Moyenne |
|---|---|---:|---:|---:|---:|---:|
| `STREAMFLOW` | `OBSERVED` | 5 | 77 950 | 0 | 594 | 2.24037 |

### 11.2 Simule

| Variable | Scenario | Series | Points | Min | Max | Moyenne |
|---|---|---:|---:|---:|---:|---:|
| `SWAT_FLOW_M3S` | `SWAT_OUTPUT_01` | 33 | 345 510 | 0 | 487 | 1.16086 |
| `SWAT_FLOW_M3S` | `scenario_1` | 19 | 198 930 | 0 | n/a global | n/a global |
| `SWAT_FLOW_M3S` | `scenario_2` | 19 | 198 930 | 0 | n/a global | n/a global |
| `SWAT_FLOW_M3S` | `scenario_3` | 19 | 198 930 | 0 | n/a global | n/a global |
| `SWAT_FLOW_M3S` | `scenario_4` | 19 | 198 930 | 0 | n/a global | n/a global |

### 11.3 Conclusion hydrologie

- Les series observees de debit sont saines.
- La simulation hydro est scindee entre `core.measurements` et `access.rch_results` selon scenario et time step.

## 12. Sediments

Variables materialisees dans core:

- `SWAT_SED_TONS`
- `SWAT_SYLDT_HA`

Variables visibles mais non materialisees dans core:

- `SWAT_SED_IN_TONS`
- `SWAT_SED_CONC_MG_KG`

### 12.1 Couverture materialisee

| Variable | Scenario | Series | Points | Domaine |
|---|---|---:|---:|---|
| `SWAT_SED_TONS` | `SWAT_OUTPUT_01` | 33 | 345 510 | Reach |
| `SWAT_SED_TONS` | `scenario_1..4` | 19 par scenario | 198 930 par scenario | Reach |
| `SWAT_SYLDT_HA` | `SWAT_OUTPUT_01` | 33 | 345 510 | Subbasin |
| `SWAT_SYLDT_HA` | `scenario_1..4` | 19 par scenario | 198 930 par scenario | Subbasin |

### 12.2 Conclusion sediments

- Les series core SWAT sediment/yield sont presentes pour `SWAT_OUTPUT_01` et `scenario_1..4`.
- La plateforme continue toutefois a dependre d'`access.*` pour une partie importante de l'exposition sedimentaire.

## 13. Proprietes visibles mais sans series core

| Property | Core series | Access source | Frontend visible | Statut |
|---|---:|---|---|---|
| `SWAT_SED_IN_TONS` | 0 | `access.rch_results.sed_in_tons` | Oui | ACCESS / DYNAMIC |
| `SWAT_SED_CONC_MG_KG` | 0 | `access.rch_results.sedconc_mg_kg` | Oui | ACCESS / DYNAMIC |

Interpretation:

- Il ne s'agit pas d'une perte de donnees core.
- Il s'agit d'un **contrat applicatif hybride** actuellement assume par `erosionSwatSeries.service.ts`.

## 14. Time step

### 14.1 Core

| Domaine | Scenario | daily | monthly | yearly | Source |
|---|---|---:|---:|---:|---|
| Observed climat/hydro | `OBSERVED` | 30 | 26 | 0 | `core.timeseries` + `core.measurements` |
| Hydro SWAT | `SWAT_OUTPUT_01` | 33 | 0 | 0 | `core.timeseries` + `core.measurements` |
| Sediment reach | `SWAT_OUTPUT_01` | 33 | 0 | 0 | `core.timeseries` + `core.measurements` |
| Solid yield | `SWAT_OUTPUT_01` | 33 | 0 | 0 | `core.timeseries` + `core.measurements` |
| Hydro SWAT | `scenario_1..4` | 19 par scenario | 0 | 0 | `core.timeseries` + `core.measurements` |
| Sediment reach | `scenario_1..4` | 19 par scenario | 0 | 0 | `core.timeseries` + `core.measurements` |
| Solid yield | `scenario_1..4` | 19 par scenario | 0 | 0 | `core.timeseries` + `core.measurements` |

### 14.2 Access

| Domaine | Scenario | daily | monthly | yearly | Source |
|---|---|---:|---:|---:|---|
| Reach results | `etat_actuel` | 198 930 | 198 930 | 198 930 | `access.rch_results` |
| Sub results | `etat_actuel` | 198 930 | 198 930 | 198 930 | `access.sub_results` |
| Reach results | `ssp126/245/585` | 344 660 | 203 718 | 199 329 | `access.rch_results` |
| Sub results | `ssp126/245/585` | 344 660 | 203 718 | 199 329 | `access.sub_results` |
| Reach results | `scenario_1..4` | 198 930 | 0 | 551 | `access.rch_results` |
| Sub results | `scenario_1..4` | 198 930 | 0 | 551 | `access.sub_results` |

Conclusion:

- `monthly` et `yearly` dans `access.*` sont des donnees materialisees/importees, pas un simple calcul a la volee.
- `core` ne couvre pas tous les pas temporels SWAT.

## 15. Trous temporels

### 15.1 Classement global des 383 series

| Classe | Series |
|---|---:|
| `COMPLET` | 359 |
| `PARTIEL` | 17 |
| `TRES_INCOMPLET` | 7 |
| `A_VALIDER` | 0 |

### 15.2 Pires cas releves

| ts_id | Station | Property | Scenario | Couverture | Plus grand gap | Classe |
|---|---|---|---|---|---|---|
| 117 | `1940/48` | `TMEAN` | `OBSERVED` | 249/492 | 210 mois | `TRES_INCOMPLET` |
| 144 | `1940/48` | `TMIN` | `OBSERVED` | 305/490 | 132 mois | `TRES_INCOMPLET` |
| 145 | `pont_arfoud` | `TMEAN` | `OBSERVED` | 334/515 | 133 mois | `TRES_INCOMPLET` |
| 159 | `1940/48` | `HUMIDITY_REL` | `OBSERVED` | 232/322 | 49 mois | `TRES_INCOMPLET` |
| 148 | `taouz` | `TMEAN` | `OBSERVED` | 376/515 | 133 mois | `TRES_INCOMPLET` |
| 121 | `1940/48` | `TMAX` | `OBSERVED` | 400/489 | 37 mois | `TRES_INCOMPLET` |
| 120 | `867/48` | `WIND_SPEED` | `OBSERVED` | 342/408 | 47 mois | `TRES_INCOMPLET` |
| 150 | `867/48` | `PRECIPITATION` | `OBSERVED` | 12 842/14 822 | 1 981 jours | `PARTIEL` |

Interpretation:

- Les anomalies de completude sont concentrees sur quelques series observed mensuelles.
- Les series SWAT core materialisees sont regulieres et sans trous structurants detectes.

## 16. Series constantes

| ts_id | Station | Property | Scenario | Valeur | Duree |
|---|---|---|---|---:|---|
| 235 | `swat_sub_1` | `SWAT_SYLDT_HA` | `SWAT_OUTPUT_01` | 0.0 | 10 470 points |

Interpretation:

- Une serie constante n'est pas automatiquement invalide.
- Ce cas doit etre surveille mais ne justifie pas a lui seul une correction destructive.

## 17. Valeurs aberrantes

### 17.1 Statistiques globales par propriete

| Property | Min | Max | Moyenne | p01 | p50 | p99 |
|---|---:|---:|---:|---:|---:|---:|
| `STREAMFLOW` | 0 | 594 | 2.24037 | 0 | 0.712 | 22.551 |
| `SWAT_FLOW_M3S` | 0 | 487 | 1.16086 | 0 | 0.147 | 15.3771 |
| `SWAT_SED_TONS` | 0 | 10 990 000 | 1 184.56 | 0 | 0 | 5 071.84 |
| `SWAT_SYLDT_HA` | 0 | 754 | 0.1197 | 0 | ~0 | 0.951 |
| `PRECIPITATION` | 0 | 75.5 | 0.4036 | 0 | 0 | 10.974 |
| `TMAX` | -1.06 | 60.4 | 26.55 | n/a | n/a | 43.0 |
| `TMEAN` | -4.51 | 101.1 | 18.97 | n/a | n/a | 34.67 |
| `TMIN` | -9.0 | 32.0 | 11.43 | n/a | n/a | 26.94 |
| `EVAPORATION` | 11.16 | 938.9 | 298.39 | n/a | n/a | n/a |
| `HUMIDITY_REL` | 10.36 | 88.57 | n/a | n/a | n/a | n/a |
| `WIND_SPEED` | 1.19 | 3.62 | n/a | n/a | n/a | n/a |

### 17.2 Cas suspects signales

| Type | Detail | Impact |
|---|---|---|
| `TMIN > TMAX` | Station `1940/48`, date `2022-03-01`, `TMIN=14.9`, `TMAX=9.4` | Incoherence climat ponctuelle |
| Valeur extreme `TMEAN` | Station `1940/48`, date `1994-01-01`, `TMEAN=101.1` | Tres probable anomalie de saisie/import |
| Negatif `STREAMFLOW` | Aucun | Aucun |
| Negatif `PRECIPITATION` | Aucun | Aucun |
| Negatif `SWAT_SED_TONS` | Aucun | Aucun |
| Negatif `SWAT_SYLDT_HA` | Aucun | Aucun |

## 18. Dates et timezone

Constats:

- `core.timeseries.created_at` est en `timestamp with time zone`
- `core.measurements.datetime` est en `timestamp with time zone`
- Timezone PostgreSQL courante: `America/Los_Angeles`
- Le backend/API expose selon les cas:
  - des dates ISO UTC pour certains metadonnees (`ts_created_at`)
  - des dates simples `YYYY-MM-DD` pour `start_date` / `end_date`

Interpretation du cas `1994-12-31T16:00:00-08:00`:

- il s'agit tres probablement d'un **jour UTC minuit** converti dans la timezone de session PostgreSQL.
- le comportement ressemble a un **artefact d'affichage / normalisation timezone**, pas a une perte de donnees.

Risque:

- confusion de comparaison entre SQL brut et API si les dates ne sont pas normalisees dans le meme referentiel.

## 19. Batches

Inventaire:

| Objet | Lignes | Observations |
|---|---:|---|
| `core.data_batches` | 1 | Un seul batch catalogue |
| `core.measurement_batches` | 1 036 530 | Tracabilite par mesure |

Batch principal releve:

| batch_id | source | source_file | row_count | run_id | scenario_code | notes |
|---|---|---|---:|---:|---|---|
| `SWAT_MANUAL_20260422_02` | `SWAT` | `SWATOutput.mdb` | 1 036 530 | 2 | `SWAT_OUTPUT` | `manual load from access tables` |

Series sans lien `measurement_batches`:

| Scenario | source_type | time_step | Series sans batch |
|---|---|---|---:|
| `Observed` | `observed` | `daily` | 30 |
| `Observed` | `observed` | `monthly` | 26 |
| `Scenario 1 reboisement` | `simulated` | `daily` | 57 |
| `Scenario 2 reboisement` | `simulated` | `daily` | 57 |
| `Scenario 3 reboisement` | `simulated` | `daily` | 57 |
| `Scenario 4 reboisement` | `simulated` | `daily` | 57 |

Interpretation:

- Seul `SWAT_OUTPUT_01` est completement trace par batch.
- Les observed et les scenarios `1..4` n'ont pas de ligneage batch exploitable.
- Les repetions `(ts_id, batch_id)` dans `measurement_batches` sont normales car la table est **par mesure**, pas par serie.

## 20. Audit `public.v_ts_catalog_enriched`

| Controle | Valeur |
|---|---:|
| Lignes `core.timeseries` | 383 |
| Lignes `public.v_ts_catalog_enriched` | 383 |
| Series core absentes de la vue | 0 |
| Lignes vue sans serie core | 0 |

Definition fonctionnelle relevee:

- `public.v_ts_catalog` joint `core.timeseries`, `core.stations`, `core.catchments`, `ref.observed_properties`, `core.model_runs`
- `public.v_ts_catalog_enriched` enrichit avec:
  - `n_points`
  - `start_date`
  - `end_date`

Conclusion:

- Vue critique saine et centrale.
- A ne surtout pas supprimer ni "simplifier" pendant le nettoyage final.

## 21. Audit `api.mv_scenario_catalog`

Constats:

- La matview est construite a partir de `core.model_runs`.
- Elle combine aussi des signaux d'`access.rch_results`, `access.sub_results`, `access.hru_results`, `access.weather_inputs`.
- Elle masque le scenario technique `SWAT_OUTPUT_01`.
- Le backend ajoute en plus des **runs virtuels normalises 101..108** dans `catalog.service.ts`.

Effet observe dans `GET /api/v1/catalog/runs`:

- 17 lignes retournees.
- 9 runs reels visibles (`1, 3..10`) plus 8 runs virtuels (`101..108`).

Anomalie:

- **Duplication visible des codes scenario** entre runs reels et runs virtuels.

## 22. API availability

| API | Items | Source DB principale | Ecart eventuel |
|---|---:|---|---|
| `catalog_availability_climat` | 30 | `public.v_ts_catalog` + `core.measurements` | Aucun detecte |
| `catalog_availability_hydro` | 45 | Core observe + `hydroSwatSeriesService` | Aucun detecte |
| `catalog_availability_erosion` | 40 | `erosionSwatSeriesService` + `access.*` | Catalogue synthetique, pas un reflet pur de core |
| `swat_availability` | 383 | Hybride core/access selon module | Conforme a la baseline |

Point important:

- `catalog_availability_erosion` expose des `ts_id` synthetiques non core.
- Cela est conforme au design actuel, mais rend l'architecture plus difficile a lire.

## 23. Contrat backend

### `catalog.service.ts`

- SOURCE PRINCIPALE: `public.v_ts_catalog_enriched`
- FALLBACK / AUGMENTATION: `hydroSwatSeriesService`, `erosionSwatSeriesService`
- SCENARIOS: observed, SWAT legacy, runs virtuels normalises
- PROPERTIES: toutes variables de catalogue
- RISQUE: duplication de scenarios visibles dans `catalog/runs`

### `timeseries.service.ts`

- SOURCE PRINCIPALE: `public.v_ts_catalog_enriched` + `core.measurements`
- FALLBACK: services SWAT hydro/erosion, union sur stations SWAT mappees
- SCENARIOS: observed + simules
- PROPERTIES: climat, hydro, SWAT
- RISQUE: comportement different selon module et scenario

### `hydro.service.ts`

- SOURCE PRINCIPALE: `api.mv_scenario_catalog` si presente
- FALLBACK: `public.model_runs`
- SCENARIOS: observed + simules
- RISQUE: masque partiellement la dette scenario/core

### `solidYield.service.ts`

- SOURCE PRINCIPALE: `erosionSwatSeriesService`
- FALLBACK: requetes `access.rch_results` / `access.sub_results`
- RISQUE: forte dependance access

### `erosionSwatSeries.service.ts`

- SOURCE PRINCIPALE: catalogue synthetique + core si disponible
- FALLBACK: `api.mv_hydro_station_stats`, `access.rch_results`, `access.sub_results`
- PROPERTIES: inclut `SWAT_SED_IN_TONS` et `SWAT_SED_CONC_MG_KG`
- RISQUE: masque l'absence de materialisation core pour certaines proprietes

### `hydroSwatSeries.service.ts`

- SOURCE PRINCIPALE: `api.mv_hydro_station_stats` ou `access.rch_results`
- FALLBACK: derives runtime reach
- RISQUE: coeur applicatif SWAT hydro reste access-centrique

### `spatial.service.ts`

- SOURCE PRINCIPALE: `core.measurements` pour certaines series simulees si resolues
- FALLBACK: `access.rch_results`, `erosionSwatSeriesService`
- RISQUE: les fallbacks masquent les lacunes core par scenario/time_step

### `stationSimulation.service.ts`

- SOURCE PRINCIPALE: observed via `core.measurements`
- FALLBACK simule: `hydroSwatSeriesService` puis core si besoin
- RISQUE: l'ordre des fallbacks rend les divergences core/access peu visibles

## 24. Fallbacks

| Service | Source principale | Fallback | Quand utilise |
|---|---|---|---|
| `catalog.service.ts` | `public.v_ts_catalog_enriched` | services SWAT hydro/erosion | Pour enrichir les scenarios/proprietes SWAT |
| `timeseries.service.ts` | `core.measurements` | services SWAT, unions mappees | Quand le catalogue est simule ou hybride |
| `hydroSwatSeries.service.ts` | `api.mv_hydro_station_stats` | `access.rch_results` | Pour la disponibilite SWAT hydro |
| `erosionSwatSeries.service.ts` | core si coherent | `api.mv_hydro_station_stats`, `access.*` | Pour sediment / solid yield |
| `spatial.service.ts` | core SWAT localise | `access.rch_results` | Si pas de serie core resolvable |
| `stationSimulation.service.ts` | access SWAT via service dedie | core SWAT | Si la voie access ne renvoie rien |

Constat cle:

- Les fallbacks sont **actifs**, pas seulement historiques.
- Ils masquent des absences core sur plusieurs scenarios et pas temporels.

## 25. Indexes et contraintes existantes

### 25.1 Indexes existants

| Table | Index | Definition |
|---|---|---|
| `core.measurements` | `idx_core_measurements_ts_id_datetime` | `(ts_id, datetime)` |
| `core.timeseries` | `idx_timeseries_lookup` | `(station_id, property_id, run_id, source_type, time_step)` |
| `core.timeseries` | `idx_timeseries_run` | `(run_id, source_type, time_step)` |

### 25.2 Contraintes existantes

| Table | Contrainte | Type |
|---|---|---|
| `core.measurements` | contraintes `_not_null` | `CHECK` |
| `core.timeseries` | contraintes `_not_null` | `CHECK` |

Constat:

- Aucune `PRIMARY KEY`
- Aucune `FOREIGN KEY`
- Aucune `UNIQUE`

## 26. Contraintes candidates

| Table | Contrainte candidate | Compatible | Doublons actuels |
|---|---|---|---:|
| `core.timeseries` | `PRIMARY KEY (ts_id)` | Oui | 0 |
| `core.timeseries` | `UNIQUE (station_id, property_id, run_id, source_type, time_step)` | Oui | 0 |
| `core.timeseries` | `FOREIGN KEY (station_id) -> core.stations` | Oui | 0 orphelin |
| `core.timeseries` | `FOREIGN KEY (property_id) -> ref.observed_properties` | Oui | 0 orphelin |
| `core.timeseries` | `FOREIGN KEY (run_id) -> core.model_runs` | Oui | 0 orphelin |
| `core.measurements` | `FOREIGN KEY (ts_id) -> core.timeseries` | Oui | 0 orphelin |
| `core.measurements` | `UNIQUE (ts_id, datetime)` | Oui | 0 |

Attention:

- La compatibilite logique est bonne.
- La mise en place devra etre planifiee separement avec tests de perf et fenetre de rollback.

## 27. Redondances `access.*` / `core.*`

Comparaison:

- `core.measurements` contient observed + une partie des series SWAT materialisees.
- `access.rch_results` et `access.sub_results` restent les sources/fallbacks pour:
  - `etat_actuel`
  - `ssp126`, `ssp245`, `ssp585`
  - `scenario_1..4` yearly
  - proprietes dynamiques `SWAT_SED_IN_TONS`, `SWAT_SED_CONC_MG_KG`

Verdict:

- Ce n'est **pas un doublon metier brut**.
- C'est une **redondance architecturale/fonctionnelle volontaire mais imparfaitement documentee**.

## 28. Score qualite

| Domaine | Score /10 | Commentaire |
|---|---:|---|
| Observed timeseries | 7 | Bon socle, trous localises sur mensuel |
| Simulated core | 7 | Stable sur ce qui est materialise |
| Measurements | 9 | Pas de doublons ni NULL problematiques |
| Climat | 6 | Trous mensuels et quelques anomalies de valeur |
| Hydrologie | 8 | Donnees robustes observees et simulees principales |
| Sediments | 7 | Couverture utile mais hybride core/access |
| Scenarios | 5 | Multiplicite core/access/virtuel peu lisible |
| Time steps | 5 | Materialisation partielle selon scenario |
| Catalogues | 7 | Fonctionnels mais catalogues hybrides |
| Tracabilite batch | 4 | 284 series sans batch |
| Contraintes | 3 | Aucune PK/FK/UNIQUE active |
| Performance structurelle | 7 | Index utiles presents sur les axes critiques |

## 29. Classification des anomalies TS0-TS3

### TS0 - Critique

Aucune anomalie TS0 n'a ete confirmee dans cette phase.

### TS1 - Important

1. `etat_actuel`, `ssp126`, `ssp245`, `ssp585` sont visibles applicativement mais sans timeseries core.
2. `scenario_1..4` ne sont materialises que partiellement dans core.
3. `catalog/runs` duplique les scenarios visibles via runs reels et runs virtuels.
4. `SWAT_SED_IN_TONS` et `SWAT_SED_CONC_MG_KG` sont visibles sans support core, uniquement par exposition dynamique access.

### TS2 - Qualite

1. 7 series observed sont `TRES_INCOMPLET`.
2. 17 series observed sont `PARTIEL`.
3. Une incoherence `TMIN > TMAX` a ete detectee.
4. Une valeur extreme `TMEAN=101.1` a ete detectee.
5. Une serie constante SWAT (`ts_id=235`) est a surveiller.

### TS3 - Structure

1. Aucune PK/FK/UNIQUE active sur `core.timeseries` et `core.measurements`.
2. Tracabilite batch manquante sur 284/383 series.
3. Mix timezone SQL/API potentiellement source de confusion.
4. Architecture hybride core/access peu explicite dans les catalogues exposes.

## 30. Recommandations

Sans rien corriger dans cette phase, la suite la plus sure est:

1. Formaliser un plan de correction DQ-6 en separant:
   - qualite observed climat
   - clarte scenario/catalogue
   - tracabilite batch
   - garde-fous structurels
2. Ne surtout pas supprimer `access.rch_results` / `access.sub_results` tant que les scenarios canoniques ne sont pas entierement rematerialises ou remplacés fonctionnellement.
3. Auditer en phase corrective les 7 series `TRES_INCOMPLET` avant toute contrainte ou normalisation climat.
4. Corriger d'abord les anomalies ponctuelles de valeur (`TMIN > TMAX`, `TMEAN=101.1`) avec validation metier.
5. Clarifier le contrat `catalog/runs` pour eviter les doublons visuels de scenario.
6. Definir une strategie de batch lineage pour observed et `scenario_1..4`.
7. Preparer une phase technique separee pour les PK/FK/UNIQUE, avec tests de performance et rollback.

## 31. Tableau final des anomalies

| ID | Priorite | Domaine | Serie/Table | Anomalie | Impact | Recommandation |
|---|---|---|---|---|---|---|
| TS1-01 | TS1 | Scenarios | `core.model_runs` / `core.timeseries` | `etat_actuel`, `ssp126`, `ssp245`, `ssp585` sans serie core | Dependance access obligatoire | Conserver access, clarifier le modele |
| TS1-02 | TS1 | Scenarios | `scenario_1..4` | Materialisation core daily seulement | Couverture time_step incomplete | Auditer la cible fonctionnelle par scenario |
| TS1-03 | TS1 | Catalogue | `api.mv_scenario_catalog` + backend | Duplication visible runs reels / virtuels | Lisibilite catalogue degradee | Rationaliser les alias scenario |
| TS1-04 | TS1 | Proprietes | `SWAT_SED_IN_TONS`, `SWAT_SED_CONC_MG_KG` | Proprietes visibles sans core | Contrat hybride | Documenter / stabiliser le fallback |
| TS2-01 | TS2 | Climat observed | `ts_id 117` | `TMEAN` tres incomplet | Analyses mensuelles fragilisees | Qualification metier avant correction |
| TS2-02 | TS2 | Climat observed | `ts_id 144` | `TMIN` tres incomplet | Analyses mensuelles fragilisees | Qualification metier avant correction |
| TS2-03 | TS2 | Climat observed | `ts_id 159` | `HUMIDITY_REL` tres incomplet | Analyses mensuelles fragilisees | Qualification metier avant correction |
| TS2-04 | TS2 | Climat observed | `1940/48` | `TMIN > TMAX` le `2022-03-01` | Incoherence ponctuelle | Corriger avec validation metier |
| TS2-05 | TS2 | Climat observed | `1940/48` | `TMEAN=101.1` le `1994-01-01` | Valeur suspecte | Corriger avec validation metier |
| TS2-06 | TS2 | Observed | `867/48` precipitation | Gap max 1 981 jours | Serie partielle | Auditer l'origine du trou |
| TS2-07 | TS2 | Simule | `ts_id 235` | Serie constante `0.0` | A surveiller | Valider metier avant action |
| TS3-01 | TS3 | Structure | `core.timeseries` | Pas de PK/FK/UNIQUE | Risque futur de derive | Planifier les contraintes |
| TS3-02 | TS3 | Structure | `core.measurements` | Pas de PK/FK/UNIQUE | Risque futur de derive | Planifier les contraintes |
| TS3-03 | TS3 | Tracabilite | `core.measurement_batches` | 284 series sans lien batch | Auditabilite partielle | Definir une politique de lineage |
| TS3-04 | TS3 | Dates | `timestamptz` / API | Referentiels timezone differents | Risque d'interpretation | Normaliser l'affichage/documentation |

## 32. Synthese simple

TIMESERIES FIABLES:

- les 383 series protegees existent toujours
- aucune serie core n'est dupliquee
- aucune mesure core n'est dupliquee
- aucun orphelin runtime bloquant n'est detecte
- `public.v_ts_catalog_enriched` est alignee sur `core.timeseries`

TIMESERIES A SURVEILLER:

- les series observed climat mensuelles de `1940/48`
- la precipitation observed `867/48`
- la serie constante `ts_id 235`

TIMESERIES INCOHERENTES:

- aucune serie entierement cassee
- une incoherence ponctuelle `TMIN > TMAX`
- une valeur `TMEAN=101.1` tres suspecte

MESURES DUPLIQUEES:

- 0

ORPHELINS:

- 0 orphelin runtime bloquant
- 284 series sans batch

SCENARIOS CORE COMPLETS:

- `OBSERVED`
- `SWAT_OUTPUT_01`

SCENARIOS ACCESS UNIQUEMENT:

- `etat_actuel`
- `ssp126`
- `ssp245`
- `ssp585`

SCENARIOS CORE PARTIELS:

- `scenario_1`
- `scenario_2`
- `scenario_3`
- `scenario_4`

FALLBACKS ACTIFS:

- `catalog.service.ts`
- `timeseries.service.ts`
- `hydroSwatSeries.service.ts`
- `erosionSwatSeries.service.ts`
- `spatial.service.ts`
- `stationSimulation.service.ts`

CONTRAINTES RECOMMANDEES:

- `core.timeseries PRIMARY KEY (ts_id)`
- `core.timeseries UNIQUE (station_id, property_id, run_id, source_type, time_step)`
- `core.measurements FOREIGN KEY (ts_id) -> core.timeseries`
- `core.measurements UNIQUE (ts_id, datetime)`

## 33. Verdict final

La chaine timeseries protegee de Hassan Addakhil est **fonctionnelle, coherent au niveau des volumes proteges, sans doublons core et sans orphelins runtime bloquants**.

La dette restante est surtout:

- structurelle
- de tracabilite
- de clarte scenario/core/access
- de qualite climat mensuelle sur un sous-ensemble limite de series observed

Cette dette justifie une **phase de correction DQ-6 ciblee**, mais **ne justifie aucune suppression de donnees protegees** dans l'etat actuel.

## 34. Verification baseline finale

Execution:

- `python scripts/quality/compare-functional-baseline.py --compare Support_Doc_HD/Phase Protection Donnees Fonctionnelles/PROTECTED_FUNCTIONAL_DATA_BASELINE_20260810_1608.json`

Resultat:

- `COMPARE STATUS: WARNING`
- `OK: scenarios`
- `OK: runtime_reaches`
- `OK: runtime_subbasins`
- `OK: stations`
- `OK: timeseries`
- `OK: rch`
- `OK: sub`
- `OK: layers`
- `WARNING: api:spatial_reaches`
- `WARNING: api:data_scan_periods_global`

Interpretation:

- aucune regression n'a ete detectee sur les scenarios, stations, timeseries, groupes SWAT ni couches protegees
- `data_scan_periods_global` varie au niveau hash de payload alors que le nombre d'items reste stable; ce warning est coherent avec un endpoint de diagnostic contenant des metadonnees de generation
- `spatial_reaches` garde `19` features et le meme type geometrique `MultiLineString`; le warning est un drift de payload d'API, pas une disparition de donnees protegees

Conclusion baseline:

- **pas de regression fonctionnelle confirmee sur les donnees protegees**
- **2 warnings de contrat API restent a qualifier dans la prochaine phase**

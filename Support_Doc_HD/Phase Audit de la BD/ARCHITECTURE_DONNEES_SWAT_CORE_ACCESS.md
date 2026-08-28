# ARCHITECTURE DONNEES SWAT CORE / ACCESS

## Objet

Ce document formalise l'architecture hybride SWAT utilisee par le projet Hassan Addakhil apres DQ6-B.

Objectifs :

- expliciter le partage de responsabilites entre `core.*` et `access.*` ;
- documenter les proprietes SWAT exposees au frontend ;
- centraliser les regles metier de source/fallback ;
- conserver le comportement existant sans materialiser de nouvelles donnees.

## Couche metier explicite

Fichier cree :

- `hydro_Hassan dakhil/backend/src/constants/swatDataSources.ts`

Cette couche centralise :

- les scenarios SWAT visibles ;
- la compatibilite `OBSERVED` + alias internes `101..108` ;
- les definitions des proprietes SWAT ;
- la source principale `core` / `access` ;
- les colonnes `access.*` utilisees ;
- les domaines metier ;
- les `time_step` supportes ;
- le mode d'exposition `MATERIALIZED` / `DYNAMIC` ;
- les strategies de fallback.

## Role de core

`core.*` reste la source structurelle et materialisee quand une serie existe deja dans le catalogue :

- `core.model_runs`
- `core.timeseries`
- `core.measurements`
- `core.stations`
- `core.station_reach_map`
- `core.station_subbasin_map`

En pratique, `core` sert a :

- exposer les series deja cataloguees ;
- garantir les relations station/run/property ;
- alimenter certaines matviews et vues `api.*` / `public.*` ;
- servir de support prioritaire pour `SWAT_OUTPUT_01` et certaines series deja materialisees.

## Role de access

`access.*` reste la source brute actuelle des resultats SWAT non materialises dans `core`.

Tables principales :

- `access.rch_results`
- `access.sub_results`
- `access.hru_results`

En pratique, `access` sert a :

- fournir les scenarios metier visibles `etat_actuel`, `ssp*`, `scenario_1..4` ;
- fournir les proprietes dynamiques non materialisees ;
- fournir les fallbacks quand `core` ne contient pas encore la serie equivalente.

## Scenarios

Scenarios metier visibles :

- `etat_actuel`
- `ssp126`
- `ssp245`
- `ssp585`
- `scenario_1`
- `scenario_2`
- `scenario_3`
- `scenario_4`

Compatibilite interne conservee :

- alias `101..108`
- scenario technique legacy `SWAT_OUTPUT`
- run core technique `SWAT_OUTPUT_01`

Regle actuelle :

- `/api/v1/catalog/runs` expose 9 scenarios visibles ;
- les alias `101..108` restent acceptes en interne pour les resolutions SWAT ;
- `SWAT_OUTPUT_01` n'est plus visible mais reste compatible avec les chemins core existants.

## Matrice Core / Access

| Domaine | Scenario | Property | Source principale | Fallback | Materialise core | Source canonique actuelle |
| --- | --- | --- | --- | --- | --- | --- |
| Hydro | `SWAT_OUTPUT_01` | `SWAT_FLOW_M3S` | `core.timeseries` / `core.measurements` / `api.mv_hydro_station_*` | `access.rch_results.flow_out_cms` via mapping station/subbasin | OUI | `CORE` |
| Hydro | `etat_actuel`, `ssp126`, `ssp245`, `ssp585`, `scenario_1..4` | `SWAT_FLOW_M3S` | `access.rch_results.flow_out_cms` | matviews/core si deja materialisees | OUI pour legacy, NON requis pour scenarios visibles | `HYBRIDE` |
| Sediments | `SWAT_OUTPUT_01` | `SWAT_SED_TONS` | `core.timeseries` / `core.measurements` / catalogue enrichi | `access.rch_results.sed_out_tons` | OUI | `CORE` |
| Sediments | `etat_actuel`, `ssp126`, `ssp245`, `ssp585`, `scenario_1..4` | `SWAT_SED_TONS` | `access.rch_results.sed_out_tons` | core/matview si deja disponible | OUI pour legacy, partiel ailleurs | `HYBRIDE` |
| Sediments | `etat_actuel`, `ssp126`, `ssp245`, `ssp585`, `scenario_1..4` | `SWAT_SED_IN_TONS` | `access.rch_results.sed_in_tons` | aucun fallback core | NON | `DYNAMIC` |
| Sediments | `etat_actuel`, `ssp126`, `ssp245`, `ssp585`, `scenario_1..4` | `SWAT_SED_CONC_MG_KG` | `access.rch_results.sedconc_mg_kg` | aucun fallback core | NON | `DYNAMIC` |
| Solid Yield | `SWAT_OUTPUT_01` | `SWAT_SYLDT_HA` | `core.timeseries` / `core.measurements` / catalogue enrichi | `access.sub_results.syld_t_ha` | OUI | `CORE` |
| Solid Yield | `etat_actuel`, `ssp126`, `ssp245`, `ssp585`, `scenario_1..4` | `SWAT_SYLDT_HA` | `access.sub_results.syld_t_ha` | core/catalogue si deja present | OUI partiel | `HYBRIDE` |

## Proprietes materialized

Proprietes deja exposees avec possibilite de lecture `core` :

- `SWAT_FLOW_M3S`
- `SWAT_SED_TONS`
- `SWAT_SYLDT_HA`

Caracteristiques :

- elles peuvent rester lisibles depuis `core` quand un `run_id` et une serie existent deja ;
- elles gardent un fallback `access.*` pour les scenarios metier visibles ;
- aucun fallback n'a ete retire en DQ6-B.

## Proprietes dynamic / access-backed

### `SWAT_SED_IN_TONS`

- `PROPERTY_CODE`: `SWAT_SED_IN_TONS`
- `SOURCE`: `ACCESS`
- `TABLE`: `access.rch_results`
- `COLONNE`: `sed_in_tons`
- `UNITE`: `tons`
- `DOMAINE`: `sediments`
- `TIME_STEPS`: `daily`, `monthly`, `annual`
- `SCENARIOS`: `etat_actuel`, `ssp126`, `ssp245`, `ssp585`, `scenario_1..4`
- `MODE EXPOSITION`: `DYNAMIC`
- `MATERIALISATION CORE`: `NON`

### `SWAT_SED_CONC_MG_KG`

- `PROPERTY_CODE`: `SWAT_SED_CONC_MG_KG`
- `SOURCE`: `ACCESS`
- `TABLE`: `access.rch_results`
- `COLONNE`: `sedconc_mg_kg`
- `UNITE`: `mg/kg`
- `DOMAINE`: `sediments`
- `TIME_STEPS`: `daily`, `monthly`, `annual`
- `SCENARIOS`: `etat_actuel`, `ssp126`, `ssp245`, `ssp585`, `scenario_1..4`
- `MODE EXPOSITION`: `DYNAMIC`
- `MATERIALISATION CORE`: `NON`

## Services analyses

### `catalog.service.ts`

- `SOURCE CORE`: `public.module_properties`, `ref.observed_properties`, `public.v_ts_catalog_enriched`
- `SOURCE ACCESS`: via `hydroSwatSeriesService` et `erosionSwatSeriesService`
- `FALLBACK`: fusion du catalogue core avec les proprietes SWAT partagees
- `PROPRIETES`: `SWAT_FLOW_M3S`, `SWAT_SED_TONS`, `SWAT_SED_IN_TONS`, `SWAT_SED_CONC_MG_KG`, `SWAT_SYLDT_HA`
- `SCENARIOS`: visibles + alias internes resolves par les services SWAT
- `POURQUOI`: exposer un catalogue frontend coherent sans rendre les alias visibles

### `timeseries.service.ts`

- `SOURCE CORE`: `core.measurements`, `core.timeseries`
- `SOURCE ACCESS`: delegation aux services hydro/erosion SWAT
- `FALLBACK`: legacy catalog pour les cas hors chemin SWAT canonique
- `PROPRIETES`: observed + SWAT visibles par module
- `SCENARIOS`: `OBSERVED` + scenarios SWAT visibles
- `POURQUOI`: router les lectures vers le bon backend sans changer le contrat API

### `hydroSwatSeries.service.ts`

- `SOURCE CORE`: `api.mv_hydro_station_stats`, `api.mv_hydro_station_timeseries`
- `SOURCE ACCESS`: `access.rch_results.flow_out_cms`
- `FALLBACK`: lecture directe `access.rch_results` si matview/core indisponible
- `PROPRIETES`: `SWAT_FLOW_M3S`
- `SCENARIOS`: scenarios visibles + alias `101..108`
- `POURQUOI`: servir le debit simule tout en gardant compatibilite core/access

### `erosionSwatSeries.service.ts`

- `SOURCE CORE`: catalogues/materialisations existantes pour `SWAT_SED_TONS` et `SWAT_SYLDT_HA`
- `SOURCE ACCESS`: `access.rch_results`, `access.sub_results`
- `FALLBACK`: access pour les scenarios visibles ou quand la serie core manque
- `PROPRIETES`: `SWAT_SED_IN_TONS`, `SWAT_SED_TONS`, `SWAT_SED_CONC_MG_KG`, `SWAT_SYLDT_HA`
- `SCENARIOS`: scenarios visibles + alias internes
- `POURQUOI`: concentrer la logique SWAT erosion et formaliser les proprietes dynamiques

### `solidYield.service.ts`

- `SOURCE CORE`: indirecte via `erosionSwatSeriesService`
- `SOURCE ACCESS`: diagnostics directs `access.sub_results` / `access.rch_results`
- `FALLBACK`: aucun changement, delegation conservee
- `PROPRIETES`: `SWAT_SYLDT_HA` (+ diagnostics sed_in/sed_out/sed_conc)
- `SCENARIOS`: scenarios visibles
- `POURQUOI`: conserver le module Solid Yield sans dupliquer les regles SWAT

### `spatial.service.ts`

- `SOURCE CORE`: verification de presence de series core et lectures reach/subbasin deja materialisees
- `SOURCE ACCESS`: disponibilites reaches et sous-bassins via `access.rch_results` / `access.sub_results`
- `FALLBACK`: core pour certaines series, access sinon
- `PROPRIETES`: `SWAT_FLOW_M3S`, `SWAT_SED_TONS`, `SWAT_SED_IN_TONS`, `SWAT_SYLDT_HA`
- `SCENARIOS`: normalises vers `etat_actuel` + scenarios visibles
- `POURQUOI`: conserver les cartes, l'inspecteur spatial et les disponibilites scenario

### `stationSimulation.service.ts`

- `SOURCE CORE`: observe (`STREAMFLOW`), fallback simule materialise
- `SOURCE ACCESS`: debit simule strict via `hydroSwatSeriesService`
- `FALLBACK`: core simule si aucune serie strictement disponible en access
- `PROPRIETES`: `STREAMFLOW`, `SWAT_FLOW_M3S`, sous-bassin `access.sub_results`
- `SCENARIOS`: scenarios visibles + alias internes
- `POURQUOI`: garder la comparaison observe/simule sans casser la resolution scenario

## Matrice des fallbacks

| Service | Source principale | Fallback | Encore necessaire | Condition future de suppression |
| --- | --- | --- | --- | --- |
| `catalog.service.ts` | catalogue core + defs SWAT partagees | fusion avec services SWAT | OUI | quand tout le catalogue SWAT sera aligne dans une seule source materialisee |
| `timeseries.service.ts` | core pour observe, services SWAT pour simule | legacy catalog | OUI | quand tous les cas legacy seront migres sur les routes SWAT formalisees |
| `hydroSwatSeries.service.ts` | matviews/core si disponibles | `access.rch_results.flow_out_cms` | OUI | quand les scenarios visibles seront materialises de facon uniforme dans core |
| `erosionSwatSeries.service.ts` | core/catalogue pour proprietes materialisees | `access.rch_results` / `access.sub_results` | OUI | quand `SWAT_SED_TONS` et `SWAT_SYLDT_HA` auront une couverture core complete |
| `solidYield.service.ts` | delegation vers `erosionSwatSeriesService` | diagnostics directs access | OUI | quand le module diagnostic sera bascule sur une couche analytics unifiee |
| `spatial.service.ts` | disponibilites core + services SWAT | access direct pour reaches/subbasins | OUI | quand les couches spatiales consommeront une seule source agregee |
| `stationSimulation.service.ts` | observe core + simule strict access | simule core materialise | OUI | quand la serie simulee stricte sera garantie pour tous les scenarios |

## Regles de compatibilite

- ne pas exposer `101..108` dans `/api/v1/catalog/runs` ;
- continuer a accepter `101..108` pour les routes hydro/erosion SWAT ;
- ne pas changer les `time_step` exposes ;
- ne pas modifier les stations visibles ;
- ne pas changer les valeurs retournees ;
- ne pas materialiser de nouvelles timeseries en DQ6-B ;
- ne retirer aucun fallback en DQ6-B.

## Strategie future de convergence

Etapes futures possibles, hors DQ6-B :

- qualifier climat (`DQ6-C`) ;
- normaliser les payloads legacy encore vivants ;
- materialiser progressivement les scenarios visibles si la gouvernance valide cette direction ;
- supprimer les fallbacks seulement apres preuve de couverture fonctionnelle complete.

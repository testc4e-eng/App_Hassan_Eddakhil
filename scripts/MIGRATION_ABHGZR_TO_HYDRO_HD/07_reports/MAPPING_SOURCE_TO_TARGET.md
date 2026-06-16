# MAPPING_SOURCE_TO_TARGET

## Legende

- Transformation: regle technique appliquee.
- Regle qualite: controle bloquant/non-bloquant.
- Risque: point de vigilance metier/technique.

## Mapping principal

| Table source | Colonne source | Sens metier | Table cible | Colonne cible | Transformation | Regle qualite | Risque |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `public.adm_communes_abhgzr` | `code_commune` | code commune | `ref.communes` | `code_commune` | trim + upper | non null + unique | collisions codes |
| `public.adm_communes_abhgzr` | `commune_fr` | nom FR | `ref.communes` | `name_fr` | direct | non vide recommande | accents/encodage |
| `public.adm_communes_abhgzr` | `commune_ar` | nom AR | `ref.communes` | `name_ar` | direct | optionnel | encodage |
| `public.adm_communes_abhgzr` | `milieu` | urbain/rural | `ref.communes` | `milieu` | lower-normalize | domaine restreint | valeurs libres |
| `public.adm_communes_abhgzr` | `geom` | limite commune | `ref.communes` | `geom` | EWKT -> 4326 | validite geometrique | SRID source |
| `public.bassin_abhgzr` | `nom_bassin` | bassin principal | `core.catchments` | `name` | direct | non null | nom unique incertain |
| `public.bassin_abhgzr` | `geom` | geom bassin | `core.catchments` | `geom` | EWKT -> 4326 | validite/srid | metadata SRID |
| `public.barrages_abhgzr` | `ire_barrage` | code barrage | `core.reservoirs` | `reservoir_code` | trim | non null + unique | doublons code |
| `public.barrages_abhgzr` | `nom_barrage` | nom barrage | `core.reservoirs` | `name` | direct | non null recommande | variantes orthographe |
| `public.barrages_abhgzr` | `code_commune` | rattachement commune | `core.reservoirs` | `commune_code` | direct | FK logique ref.communes | commune manquante |
| `public.barrages_abhgzr` | `geom` | point barrage | `core.reservoirs` | `geom` | EWKT -> 4326 | point valide | coord/geom divergents |
| `public.stations_abhgzr` | `ire_station` | code station | `core.stations` | `station_code` | trim | non null + unique | doublons |
| `public.stations_abhgzr` | `nom_station_fr` | nom station | `core.stations` | `name` | coalesce FR/AR | non vide | noms incomplets |
| `public.stations_abhgzr` | `type_station` | type metier | `core.stations` | `type_station` | direct | domaine controle | heterogeneite |
| `public.stations_abhgzr` | `type_station` | code type | `core.stations` | `station_type_code` | mapping code | obligatoire pour timeseries | mapping incomplet |
| `public.stations_abhgzr` | `code_commune` | rattachement commune | `core.stations` | `commune_code` | direct | coherence commune | codes absents |
| `public.stations_abhgzr` | `coord_z` | altitude | `core.stations` | `altitude_m` | cast numeric | plage plausible | nulls |
| `public.stations_abhgzr` | `geom` | point station | `core.stations` | `geom` | EWKT -> 4326 | validite/srid | geom nulle |
| `public.bathymetries_barrages_abhgzr` | `ire_barrage` | barrage lie | `core.reservoir_bathymetry` | `reservoir_id` | join via reservoir_code | FK valide | barrage introuvable |
| `public.bathymetries_barrages_abhgzr` | `cote_mngm` | niveau | `core.reservoir_bathymetry` | `level_m` | cast numeric | >=0 recommande | outliers |
| `public.bathymetries_barrages_abhgzr` | `volumr_mm3` | volume | `core.reservoir_bathymetry` | `volume_hm3` | cast + unite (a confirmer) | >0 | unite ambigue |
| `public.bathymetries_barrages_abhgzr` | `surface_km2` | surface | `core.reservoir_bathymetry` | `area_km2` | direct | >0 | valeur nulle |
| `public.mesures_precipitations_jr` | `ire_station` + `date_jr` + `precipitation_jr` | pluie journaliere | `core.timeseries` + `core.measurements` | `station_id`/`property_id`/`datetime`/`value` | property=`precipitation`, time_step=`day` | date/value non null | station absente |
| `public.mesures_debits_jr` | `ire_station` + `date_jr` + `debit_jr` | debit journalier | `core.timeseries` + `core.measurements` | idem | property=`streamflow`, `day` | value numerique | unite |
| `public.mesures_temperature_jr_pn` | `temp_jr_max/min/moy` | temperature journaliere | `core.timeseries` + `core.measurements` | idem | 3 properties (`tmax`,`tmin`,`tmean`) | cast + bornes physiques | valeurs extremes |
| `public.mesures_temperature_m` | `temperature_min/max/moy` | temperature mensuelle | `core.timeseries` + `core.measurements` | idem | texte -> numeric, `month` | parse numeric strict | texte invalide |
| `public.mesures_evaporation_m` | `evaporation_m` | evaporation mensuelle | `core.timeseries` + `core.measurements` | idem | texte -> numeric, `month` | parse + >=0 | texte invalide |
| `public.mesures_humidite_relative_m` | `humidite_relative_m` | humidite mensuelle | `core.timeseries` + `core.measurements` | idem | texte -> numeric, `month` | [0..100] recommande | outliers |
| `public.mesures_vitesse_vent_m` | `vitesse_moy_m` | vent mensuel | `core.timeseries` + `core.measurements` | idem | texte -> numeric, `month` | >=0 | unite |
| `public.mesures_lachers_barrages` | `apports_m3`/`restitution_m3` | flux barrage journalier | `core.timeseries` + `core.measurements` | idem | texte -> numeric, entity reservoir/station mapping | parse + >=0 | entite cible a confirmer |

## Donnees sans cible directe parfaite

- `stations_abhgzr.date_m_s`, `etat_fonct`, `mode_fonct`, `mesures_station`, `observation`
  -> a stocker en `source_attrs` (JSON) dans `staging.norm_stations` puis eventuelle extension non destructive.

- `barrages_abhgzr.type_barrage`, `coord_x`, `coord_y`
  -> `type_barrage` en metadonnees; `coord_x/coord_y` servent controle coherence geometrique.

## Decision metier proposee

- Normaliser toutes les mesures source en `timeseries/measurements`.
- Distinguer la frequence via `time_step` (`day` / `month`).
- Creer/garantir un `run` observe (`core.model_runs`, `scenario_code='OBSERVED'`).
- Mapper les variables via `ref.observed_properties` et `ref.property_domain_membership`.


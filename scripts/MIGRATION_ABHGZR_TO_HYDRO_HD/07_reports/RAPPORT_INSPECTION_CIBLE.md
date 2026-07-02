# RAPPORT_INSPECTION_CIBLE

## Base inspectee

- Nom: `hydro_hd_1714`
- Date inspection: 2026-04-20
- Taille: ~22 MB
- Extensions: `plpgsql`, `postgis`, `postgres_fdw`

## Inventaire global

- Tables: 52
- Vues: 116
- Vues materialisees: 2
- Sequences: 35
- PK: 39
- FK: 31

## Repartition par schema (synthese)

- `core`: noyau metier hydrologie/series (`stations`, `catchments`, `timeseries`, `measurements`, etc.)
- `ref`: referentiels (`observed_properties`, domaines, communes, landcover classes/periodes)
- `geo` + `gis`: objets geographiques et shapes d'integration
- `api`: vues de consommation dashboard
- `public`: vues de compatibilite/exposition
- `audit`: controles qualite
- `staging`: zone d'atterrissage
- `auth`, `access`: securite et sous-systeme SWAT
- `old_hd`: FDW legacy

## Etat de remplissage observe

Constat cle:

- Les tables coeur `core/ref/geo` sont structurellement presentes mais tres peu/pas alimentees au moment de l'inspection.
- Des donnees existent dans `gis` et `staging` (shapes raw/intermediaires).
- `old_hd.*` depend de `old_hd_srv` (connectivite externe requise, non garantie).

## Tables et vues utilisees par le projet (code actuel)

Utilisation backend/frontend detectee principalement sur:

- `public.stations`, `public.catchments`, `public.timeseries`, `public.measurements`, `public.reservoirs`, `public.landcover`
- `public.v_ts_catalog_enriched`, `public.module_properties`
- `api.v_catalog_*`, `api.v_series_stats`, `api.v_timeseries_enriched`
- Spatial: `gis.subbasin_shapes`, `gis.reach_shapes`, `gis.meteo_stations`, `core.stations`

Conclusion pratique:

- Le chargement de `core.*` est prioritaire car `public.*` et `api.*` en dependent largement.
- Toute migration doit etre retrocompatible avec ces vues.

## Spatial cible

Geometries detectees dans `core`, `geo`, `gis`, `public`, `api`, `staging`, `ref`, `old_hd`.
SRID cible predominant: 4326.

## Dependances importantes de vues

Exemples structurants:

- `public.stations` <= `core.stations`
- `public.catchments` <= `core.catchments`
- `public.timeseries` <= `core.timeseries`
- `public.measurements` <= `core.measurements`
- `api.v_timeseries_enriched` <= `core.timeseries` + `core.stations` + `core.model_runs` + `ref.observed_properties`
- `api.v_measurements_*` <= `core.measurements`

## Conclusion cible

La base cible est un bon schema de destination. La strategie la plus sure est:

1. atterrissage source en `staging`,
2. normalisation vers types/cles cibles,
3. chargement idempotent dans `ref/core`,
4. validation de non-regression sur `public.*` et `api.*`.


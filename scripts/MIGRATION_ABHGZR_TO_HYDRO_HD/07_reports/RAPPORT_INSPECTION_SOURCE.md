# RAPPORT_INSPECTION_SOURCE

## Base inspectee

- Nom: `bdd_erosion_abhgzr_20-04-26`
- Date inspection: 2026-04-20
- Extensions: `plpgsql`, `postgis`
- Schema metier principal: `public`
- Taille: ~37 MB

## Inventaire global

- Tables metier: 14
- Vues: 2 (`geometry_columns`, `geography_columns`)
- Sequences: 12

### Tables principales

- Referentiel spatial/admin:
- `public.adm_communes_abhgzr`
- `public.bassin_abhgzr`
- `public.barrages_abhgzr`
- `public.stations_abhgzr`
- Mesures:
- `public.mesures_precipitations_jr`
- `public.mesures_debits_jr`
- `public.mesures_temperature_jr_pn`
- `public.mesures_lachers_barrages`
- `public.mesures_temperature_m`
- `public.mesures_evaporation_m`
- `public.mesures_humidite_relative_m`
- `public.mesures_vitesse_vent_m`
- Bathymetrie:
- `public.bathymetries_barrages_abhgzr`
- Technique PostGIS:
- `public.spatial_ref_sys`

## Coherence relationnelle

PK/FK source detectees:

- `adm_communes_abhgzr(code_commune)` -> PK
- `stations_abhgzr(code_commune)` -> FK vers `adm_communes_abhgzr(code_commune)`
- `barrages_abhgzr(code_commune)` -> FK vers `adm_communes_abhgzr(code_commune)`
- `mesures_* (ire_station)` -> FK vers `stations_abhgzr(ire_station)`
- `mesures_lachers_barrages(ire_barrage)` -> FK vers `barrages_abhgzr(ire_barrage)`
- `bathymetries_barrages_abhgzr(ire_barrage)` -> FK vers `barrages_abhgzr(ire_barrage)`

## Types et anomalies de typage

- Mesures journalieres: majoritairement bien typees (`date`, `double precision`).
- Mesures mensuelles: plusieurs colonnes sont en texte:
- `temperature_min`, `temperature_max`, `temperature_moy`
- `evaporation_m`
- `humidite_relative_m`
- `vitesse_moy_m`
- Lachers barrage:
- `apports_m3`, `restitution_m3` en texte (conversion numerique necessaire).

## Spatial / PostGIS

Tables geometriques source:

- `adm_communes_abhgzr.geom` (multipolygon)
- `bassin_abhgzr.geom` (multipolygon)
- `barrages_abhgzr.geom` (point)
- `stations_abhgzr.geom` (point)

Constats:

- Geometries presentes et exploitables.
- Un controle a detecte au moins une geometrie invalide cote communes.
- SRID metadata pas toujours strict dans la source (cas `SRID=0` possible en metadata).

## Volumetrie source (ordre de grandeur)

- `mesures_precipitations_jr`: ~109k lignes
- `mesures_debits_jr`: ~78k
- `mesures_temperature_jr_pn`: ~43k
- `mesures_lachers_barrages`: ~19k
- Mensuel (temperature/evapo/humidite/vent): faible a moyen volume
- Entites (communes/stations/barrages/bassin): faible volume

## Conclusion source

La base source est metierement riche et coherentement reliee. Elle peut alimenter directement le modele cible `core/ref`, a condition de:

- normaliser les colonnes texte de mesures en numerique,
- harmoniser/valider le SRID geometrique,
- generer des cles fonctionnelles robustes pour un chargement idempotent.


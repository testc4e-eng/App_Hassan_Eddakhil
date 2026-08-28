# Mapping SWAT -> hydro_hd

## Source

- `rch` (SWATOutput.mdb):
  - `RCH` (si présent) / fallback `SUB`
  - `YEAR`, `MON`, `YYYYDDD`
  - `FLOW_OUT`, `SED_OUT`
- `sub`:
  - `SUB`
  - `YEAR`, `MON`, `YYYYDDD`
  - `SYLDt/ha`

## Cible staging

- `staging.swat_rch_raw`
- `staging.swat_sub_raw`
- `staging.swat_rch_norm`
- `staging.swat_sub_norm`

## Cible métier

- `core.model_runs` (run simulé SWAT)
- `core.data_batches` (traçabilité lot)
- `core.timeseries` (`source_type='simulated'`, `time_step='daily'`)
- `core.measurements`
- `core.measurement_batches` (lien batch -> points)
- `core.stations` (stations synthétiques `swat_sub_*`, `swat_rch_*`)

## Règles de mapping entités

1. Priorité `core.swat_entity_map` (mapping manuel explicite).
2. Sinon, match auto GIS:
   - SUB -> `gis.subbasin_shapes.subbasin_id/subbasin_code`
   - RCH -> `gis.reach_shapes.reach_id/reach_code/subbasin_id`
3. Sinon fallback sur code SWAT brut.

## Variables SWAT supportées

- `flow_m3s` -> `SWAT_FLOW_M3S`
- `sed_tons` -> `SWAT_SED_TONS`
- `syldt_ha` -> `SWAT_SYLDT_HA`

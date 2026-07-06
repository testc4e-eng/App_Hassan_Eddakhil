-- ============================================================
-- Script de rafraîchissement des vues matérialisées API
-- ============================================================
-- À exécuter après tout changement de géométrie ou de scénarios.

REFRESH MATERIALIZED VIEW api.mv_scenario_catalog;
REFRESH MATERIALIZED VIEW api.mv_dashboard_catchment_counts;
REFRESH MATERIALIZED VIEW api.mv_dashboard_reservoir_counts;

ANALYZE gis.subbasin_shapes;
ANALYZE gis.reach_shapes;
ANALYZE core.swat_entity_map;

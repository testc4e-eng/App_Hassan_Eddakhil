BEGIN;

-- Ne touche pas à api.v_catalog_properties ni api.v_catalog_stations

CREATE SCHEMA IF NOT EXISTS api;

DROP VIEW IF EXISTS api.v_catalog_module_properties;

CREATE VIEW api.v_catalog_module_properties AS
SELECT
  mp.module_code,
  mp.property_id,
  mp.is_enabled,
  mp.sort_order,
  p.name          AS property_name,
  p.unit          AS unit,
  p.standard_name AS standard_name,
  p.description   AS description
FROM public.module_properties mp
JOIN api.v_catalog_properties p
  ON p.property_id = mp.property_id
WHERE mp.is_enabled = true
ORDER BY mp.module_code, mp.sort_order, mp.property_id;

COMMENT ON VIEW api.v_catalog_module_properties IS
'Catalogue des variables par module (climat/hydro/erosion) basé sur module_properties + v_catalog_properties';

COMMIT;

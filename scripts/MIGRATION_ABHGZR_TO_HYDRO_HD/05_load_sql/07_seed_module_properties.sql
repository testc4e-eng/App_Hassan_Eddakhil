-- 07_seed_module_properties.sql
-- Seed dashboard module/property mapping expected by frontend:
-- module_code in ('climat','hydro','erosion')
-- Non-destructive, idempotent (upsert).

BEGIN;

WITH mapping AS (
  SELECT 'climat'::text AS module_code, 10::int AS sort_order, p.property_id
  FROM ref.observed_properties p
  WHERE upper(p.standard_name) = 'PRECIPITATION'
  UNION ALL
  SELECT 'climat', 20, p.property_id
  FROM ref.observed_properties p
  WHERE upper(p.standard_name) = 'TMAX'
  UNION ALL
  SELECT 'climat', 30, p.property_id
  FROM ref.observed_properties p
  WHERE upper(p.standard_name) = 'TMIN'
  UNION ALL
  SELECT 'climat', 40, p.property_id
  FROM ref.observed_properties p
  WHERE upper(p.standard_name) = 'TMEAN'
  UNION ALL
  SELECT 'climat', 50, p.property_id
  FROM ref.observed_properties p
  WHERE upper(p.standard_name) = 'HUMIDITY_REL'
  UNION ALL
  SELECT 'climat', 60, p.property_id
  FROM ref.observed_properties p
  WHERE upper(p.standard_name) = 'EVAPORATION'
  UNION ALL
  SELECT 'climat', 70, p.property_id
  FROM ref.observed_properties p
  WHERE upper(p.standard_name) = 'WIND_SPEED'

  UNION ALL
  SELECT 'hydro', 10, p.property_id
  FROM ref.observed_properties p
  WHERE upper(p.standard_name) = 'STREAMFLOW'

  -- NOTE:
  -- No dedicated SEDIMENT_LOAD data currently loaded from source.
  -- Temporary erosion module uses reservoir operation variables.
  UNION ALL
  SELECT 'erosion', 10, p.property_id
  FROM ref.observed_properties p
  WHERE upper(p.standard_name) = 'INFLOW_M3'
  UNION ALL
  SELECT 'erosion', 20, p.property_id
  FROM ref.observed_properties p
  WHERE upper(p.standard_name) = 'RESTITUTION_M3'
)
INSERT INTO public.module_properties (module_code, property_id, is_enabled, sort_order)
SELECT m.module_code, m.property_id, true, m.sort_order
FROM mapping m
ON CONFLICT (module_code, property_id)
DO UPDATE SET
  is_enabled = EXCLUDED.is_enabled,
  sort_order = EXCLUDED.sort_order;

COMMIT;

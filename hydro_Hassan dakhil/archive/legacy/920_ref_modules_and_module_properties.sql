BEGIN;

-- ============================================================
-- 1) Tables "ref" pour cataloguer les modules + mapping propriétés
-- ============================================================

CREATE SCHEMA IF NOT EXISTS ref;

-- Table des modules (métadonnées)
CREATE TABLE IF NOT EXISTS ref.modules (
  module_code     text PRIMARY KEY,
  name_fr         text NOT NULL,
  description     text,
  icon            text,
  sort_order      int  NOT NULL DEFAULT 100,
  is_enabled      boolean NOT NULL DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- Mapping module -> propriétés (celle que ton backend attend conceptuellement)
CREATE TABLE IF NOT EXISTS ref.module_properties (
  module_code  text NOT NULL REFERENCES ref.modules(module_code) ON DELETE CASCADE,
  property_id  int  NOT NULL,
  is_enabled   boolean NOT NULL DEFAULT true,
  sort_order   int NOT NULL DEFAULT 100,
  created_at   timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (module_code, property_id)
);

-- ============================================================
-- 2) "Pont" de compatibilité : public.module_properties
--    (ton backend fait JOIN public.module_properties)
-- ============================================================

CREATE SCHEMA IF NOT EXISTS public;

DROP VIEW IF EXISTS public.module_properties;
CREATE VIEW public.module_properties AS
SELECT
  module_code,
  property_id,
  is_enabled,
  sort_order,
  created_at
FROM ref.module_properties;

COMMENT ON VIEW public.module_properties IS
'Vue pont vers ref.module_properties pour compatibilité applicative (backend).';


-- ============================================================
-- 3) Seed des modules (Hydro / Climat / Erosion-Sédiments)
-- ============================================================

INSERT INTO ref.modules (module_code, name_fr, description, icon, sort_order, is_enabled)
VALUES
  ('climat',  'Suivi Climat',        'Variables climatiques (pluie, températures, vent, évaporation...)', 'cloud-sun', 10, true),
  ('hydro',   'Suivi Hydrologique',  'Variables hydrologiques (débit, lâchers...)',                      'droplet',   20, true),
  ('erosion', 'Érosion / Sédiments', 'Transport solide, charge sédimentaire, SYIELD...',                 'mountain',  30, true)
ON CONFLICT (module_code) DO UPDATE
SET
  name_fr    = EXCLUDED.name_fr,
  description= EXCLUDED.description,
  icon       = EXCLUDED.icon,
  sort_order = EXCLUDED.sort_order,
  is_enabled = EXCLUDED.is_enabled;

-- ============================================================
-- 4) Seed ref.module_properties
--    IMPORTANT: On ne dépend que des property_id existants.
--    On utilise ref.observed_properties (d’après tes captures).
-- ============================================================

-- Helper: insérer uniquement si la propriété existe réellement
-- (évite d'avoir du mapping vers des property_id absents)
WITH props AS (
  SELECT property_id FROM ref.observed_properties
)
INSERT INTO ref.module_properties (module_code, property_id, is_enabled, sort_order)
SELECT x.module_code, x.property_id, true, x.sort_order
FROM (
  VALUES
    -- -------- CLIMAT --------
    ('climat',  1,  10),  -- Precipitation
    ('climat',  3,  20),  -- Air Temperature Max
    ('climat',  4,  30),  -- Air Temperature Min
    ('climat',  5,  40),  -- Air Temperature Mean
    ('climat',  7,  50),  -- Wind Speed
    ('climat', 70,  60),  -- Evaporation_bac
    ('climat', 71,  70),  -- Evaporation_piche

    -- -------- HYDRO --------
    ('hydro',   2,  10),  -- Streamflow
    ('hydro',   8,  20),  -- Reservoir Release

    -- -------- EROSION / SEDIMENTS --------
    ('erosion', 9,  10),  -- Sediment Load
    ('erosion', 81, 20)   -- Basin Degradation (SYIELD)
) AS x(module_code, property_id, sort_order)
JOIN props p ON p.property_id = x.property_id
ON CONFLICT (module_code, property_id) DO UPDATE
SET
  is_enabled = EXCLUDED.is_enabled,
  sort_order = EXCLUDED.sort_order;

-- ============================================================
-- 5) Checks rapides (facultatif mais utile)
-- ============================================================

-- 5.1 combien de propriétés par module ?
-- SELECT module_code, COUNT(*) FROM ref.module_properties GROUP BY module_code ORDER BY module_code;

-- 5.2 aperçu avec libellés des propriétés
-- SELECT mp.module_code, mp.sort_order, op.property_id, op.name, op.unit
-- FROM ref.module_properties mp
-- JOIN ref.observed_properties op ON op.property_id = mp.property_id
-- ORDER BY mp.module_code, mp.sort_order;

COMMIT;

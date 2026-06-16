-- 910_ref_properties_and_api_views.sql
-- Objectif:
-- 1) tables ref.* pour référentiels propriétés / domaines / modules
-- 2) compat backend: public.module_properties + public.observed_properties (views)
-- 3) vues api.* consumables par frontend

BEGIN;

-- =============== SCHEMAS ===============
CREATE SCHEMA IF NOT EXISTS ref;
CREATE SCHEMA IF NOT EXISTS api;

-- =============== TABLES REF ===============

-- Domaines (CLIMAT/HYDRO/EROSION)
CREATE TABLE IF NOT EXISTS ref.property_domains (
  domain_code  text PRIMARY KEY,
  label        text NOT NULL,
  description  text
);

-- Appartenance propriété -> domaine (avec règles)
CREATE TABLE IF NOT EXISTS ref.property_domain_membership (
  property_id      bigint NOT NULL,
  domain_code      text   NOT NULL,
  display_order    integer NOT NULL DEFAULT 999,
  is_enabled       boolean NOT NULL DEFAULT true,
  allow_observed   boolean NOT NULL DEFAULT true,
  allow_simulated  boolean NOT NULL DEFAULT true,
  default_agg      text NOT NULL DEFAULT 'daily',
  CONSTRAINT property_domain_membership_pkey PRIMARY KEY (property_id, domain_code),
  CONSTRAINT property_domain_membership_domain_fk
    FOREIGN KEY (domain_code) REFERENCES ref.property_domains(domain_code) ON DELETE CASCADE,
  CONSTRAINT property_domain_membership_default_agg_check
    CHECK (default_agg = ANY (ARRAY['daily','monthly','annual']))
);

-- Override “module/submodule” (optionnel si tu veux affiner côté UI)
CREATE TABLE IF NOT EXISTS ref.property_module_override (
  property_id  integer PRIMARY KEY,
  module       text,
  submodule    text
);

-- Mapping module -> property_id (c’est ce que ton backend cherche sous public.module_properties)
CREATE TABLE IF NOT EXISTS ref.module_properties (
  module_code  text NOT NULL,
  property_id  integer NOT NULL,
  is_enabled   boolean NOT NULL DEFAULT true,
  sort_order   integer NOT NULL DEFAULT 999,
  created_at   timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT module_properties_pkey PRIMARY KEY (module_code, property_id)
);

-- =============== SEED DOMAINS ===============
INSERT INTO ref.property_domains(domain_code, label, description)
VALUES
  ('CLIMAT',  'Climat',  'Variables climatiques (P, T, vent, ET0, etc.)'),
  ('HYDRO',   'Hydrologie', 'Débits, lâchers, niveaux, etc.'),
  ('EROSION', 'Érosion / Sédiments', 'Sédiments, SYIELD, etc.')
ON CONFLICT (domain_code) DO UPDATE
SET label = EXCLUDED.label,
    description = EXCLUDED.description;

-- =============== SEED MEMBERSHIP (IMPORTANT: default_agg DOIT être daily/monthly/annual) ===============
-- Adapte ici la répartition par domaine selon tes property_id réels.
-- D’après ta capture: 1=P, 2=Q, 3/4/5=T, 7=Vent, 70/71=Evap, 8=Lâcher, 9=Sediment, 81=SYIELD
WITH desired(property_id, domain_code, display_order, allow_observed, allow_simulated, default_agg) AS (
  VALUES
    -- CLIMAT
    (1::bigint,  'CLIMAT',  10, true, true, 'daily'),
    (3::bigint,  'CLIMAT',  20, true, true, 'daily'),
    (4::bigint,  'CLIMAT',  21, true, true, 'daily'),
    (5::bigint,  'CLIMAT',  22, true, true, 'daily'),
    (7::bigint,  'CLIMAT',  30, true, true, 'daily'),
    (70::bigint, 'CLIMAT',  40, true, true, 'daily'),
    (71::bigint, 'CLIMAT',  41, true, true, 'daily'),

    -- HYDRO
    (2::bigint,  'HYDRO',   10, true, true, 'daily'),
    (8::bigint,  'HYDRO',   20, true, true, 'daily'),

    -- EROSION
    (9::bigint,  'EROSION', 10, true, true, 'monthly'),
    (81::bigint, 'EROSION', 20, true, true, 'annual')
)
INSERT INTO ref.property_domain_membership(property_id, domain_code, display_order, is_enabled, allow_observed, allow_simulated, default_agg)
SELECT
  d.property_id,
  d.domain_code,
  d.display_order,
  true,
  d.allow_observed,
  d.allow_simulated,
  d.default_agg
FROM desired d
ON CONFLICT (property_id, domain_code) DO UPDATE
SET display_order   = EXCLUDED.display_order,
    is_enabled      = EXCLUDED.is_enabled,
    allow_observed  = EXCLUDED.allow_observed,
    allow_simulated = EXCLUDED.allow_simulated,
    default_agg     = EXCLUDED.default_agg;

-- =============== SEED MODULE_PROPERTIES (pour /timeseries/bundle) ===============
-- Ici le module_code doit matcher ce que ton frontend envoie: climat / hydro / erosion
-- (dans ton endpoint: module=climat)
WITH mp(module_code, property_id, sort_order) AS (
  VALUES
    ('climat',  1,  10),
    ('climat',  3,  20),
    ('climat',  4,  21),
    ('climat',  5,  22),
    ('climat',  7,  30),
    ('climat',  70, 40),
    ('climat',  71, 41),

    ('hydro',   2,  10),
    ('hydro',   8,  20),

    ('erosion', 9,  10),
    ('erosion', 81, 20)
)
INSERT INTO ref.module_properties(module_code, property_id, is_enabled, sort_order)
SELECT module_code, property_id, true, sort_order
FROM mp
ON CONFLICT (module_code, property_id) DO UPDATE
SET is_enabled = EXCLUDED.is_enabled,
    sort_order = EXCLUDED.sort_order;

-- =============== COMPAT BACKEND (public.*) ===============
-- Ton backend Node interroge public.module_properties / observed_properties
-- => on crée des views de compat (zero refacto Node)
CREATE OR REPLACE VIEW public.module_properties AS
SELECT module_code, property_id, is_enabled, sort_order, created_at
FROM ref.module_properties;

-- observed_properties: si ta table source est ref.observed_properties, on expose aussi une vue public
-- (Si tu as déjà une table public.observed_properties, commente cette view)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema='public' AND table_name='observed_properties'
  ) THEN
    -- rien: une table existe déjà
    NULL;
  ELSE
    EXECUTE 'CREATE OR REPLACE VIEW public.observed_properties AS
             SELECT property_id, name, unit, standard_name, description
             FROM ref.observed_properties';
  END IF;
END$$;

-- =============== API VIEWS (consommables frontend) ===============
-- 1) Catalogue propriétés par domaine + règles UI
CREATE OR REPLACE VIEW api.v_catalog_properties AS
SELECT
  op.property_id,
  op.name         AS property_name,
  op.unit,
  op.standard_name,
  op.description,
  m.domain_code,
  d.label         AS domain_label,
  m.display_order,
  m.is_enabled,
  m.allow_observed,
  m.allow_simulated,
  m.default_agg
FROM ref.observed_properties op
LEFT JOIN ref.property_domain_membership m
  ON m.property_id = op.property_id
LEFT JOIN ref.property_domains d
  ON d.domain_code = m.domain_code;

COMMENT ON VIEW api.v_catalog_properties IS
'Catalogue des propriétés (variables) + domaines + règles d''affichage (observed/simulated, default_agg, ordre).';

-- 2) Catalogue stations (depuis ta vue existante si tu veux, sinon table stations)
CREATE OR REPLACE VIEW api.v_catalog_stations AS
SELECT
  s.station_id,
  s.station_code,
  s.name,
  s.type_station,
  s.station_type_code,
  s.commune_code,
  ST_AsGeoJSON(s.geom)::json AS geom,
  s.altitude_m,
  s.start_date,
  s.end_date,
  s.catchment_id,
  s.reach_id
FROM public.stations s;

-- 3) Exposer le mapping module->properties pour l’UI
CREATE OR REPLACE VIEW api.v_module_properties AS
SELECT
  mp.module_code,
  mp.property_id,
  op.name AS property_name,
  op.unit,
  op.standard_name,
  mp.is_enabled,
  mp.sort_order
FROM ref.module_properties mp
JOIN ref.observed_properties op
  ON op.property_id = mp.property_id;

COMMENT ON VIEW api.v_module_properties IS
'Liste des propriétés par module (climat/hydro/erosion) avec ordre et activation, pour filtrage UI.';

COMMIT;

BEGIN;

CREATE SCHEMA IF NOT EXISTS hydro;

CREATE OR REPLACE FUNCTION hydro.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TABLE IF NOT EXISTS hydro.siltation_indicators (
  indicator_id BIGSERIAL PRIMARY KEY,
  dam_code TEXT NOT NULL,
  dam_name TEXT NOT NULL,
  reference_code TEXT NOT NULL,
  source_file TEXT,
  source_sheet TEXT NOT NULL,
  baseline_year INTEGER,
  current_year INTEGER,
  volume_initial_mhm3 NUMERIC(14, 3),
  volume_current_mhm3 NUMERIC(14, 3),
  volume_silted_mhm3 NUMERIC(14, 3),
  loss_percent NUMERIC(8, 3),
  tea_mhm3_per_year NUMERIC(12, 6),
  ter_percent_per_year NUMERIC(8, 4),
  duration_years NUMERIC(8, 2),
  trapping_efficiency_percent NUMERIC(8, 3),
  basin_area_km2 NUMERIC(12, 3),
  specific_erosion_m3_km2_year NUMERIC(14, 3),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_siltation_indicators UNIQUE (dam_code, source_sheet, reference_code)
);

CREATE INDEX IF NOT EXISTS idx_siltation_indicators_dam_code
  ON hydro.siltation_indicators (dam_code);

CREATE TABLE IF NOT EXISTS hydro.siltation_hsv (
  hsv_id BIGSERIAL PRIMARY KEY,
  dam_code TEXT NOT NULL,
  dam_name TEXT NOT NULL,
  campaign_year INTEGER NOT NULL,
  level_m NUMERIC(10, 3) NOT NULL,
  surface_km2 NUMERIC(12, 4),
  volume_mhm3 NUMERIC(12, 4),
  source_sheet TEXT NOT NULL,
  source_row INTEGER,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_siltation_hsv UNIQUE (dam_code, campaign_year, level_m)
);

CREATE INDEX IF NOT EXISTS idx_siltation_hsv_dam_campaign
  ON hydro.siltation_hsv (dam_code, campaign_year);

CREATE TABLE IF NOT EXISTS hydro.siltation_evolution (
  evolution_id BIGSERIAL PRIMARY KEY,
  dam_code TEXT NOT NULL,
  dam_name TEXT NOT NULL,
  year INTEGER NOT NULL,
  annual_silted_mhm3 NUMERIC(14, 6) NOT NULL,
  cumulative_silted_mhm3 NUMERIC(14, 6),
  annual_rate_mhm3 NUMERIC(14, 6),
  source_sheet TEXT NOT NULL,
  source_row INTEGER,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_siltation_evolution UNIQUE (dam_code, year)
);

CREATE INDEX IF NOT EXISTS idx_siltation_evolution_dam_year
  ON hydro.siltation_evolution (dam_code, year);

DROP TRIGGER IF EXISTS trg_siltation_indicators_updated_at ON hydro.siltation_indicators;
CREATE TRIGGER trg_siltation_indicators_updated_at
BEFORE UPDATE ON hydro.siltation_indicators
FOR EACH ROW EXECUTE FUNCTION hydro.set_updated_at();

DROP TRIGGER IF EXISTS trg_siltation_hsv_updated_at ON hydro.siltation_hsv;
CREATE TRIGGER trg_siltation_hsv_updated_at
BEFORE UPDATE ON hydro.siltation_hsv
FOR EACH ROW EXECUTE FUNCTION hydro.set_updated_at();

DROP TRIGGER IF EXISTS trg_siltation_evolution_updated_at ON hydro.siltation_evolution;
CREATE TRIGGER trg_siltation_evolution_updated_at
BEFORE UPDATE ON hydro.siltation_evolution
FOR EACH ROW EXECUTE FUNCTION hydro.set_updated_at();

COMMIT;

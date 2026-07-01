BEGIN;

CREATE SCHEMA IF NOT EXISTS hydro;

CREATE TABLE IF NOT EXISTS hydro.bathymetry_campaigns (
  campaign_id BIGSERIAL PRIMARY KEY,
  dam_code TEXT NOT NULL,
  dam_name TEXT NOT NULL,
  measurement_year INTEGER NOT NULL,
  campaign_year INTEGER NOT NULL,
  normal_level_m NUMERIC(10, 3),
  volume_mhm3 NUMERIC(14, 6) NOT NULL,
  silted_since_previous_mhm3 NUMERIC(14, 6),
  annual_siltation_rate_mhm3 NUMERIC(14, 6),
  cumulative_silted_mhm3 NUMERIC(14, 6),
  source_file TEXT NOT NULL,
  source_sheet TEXT NOT NULL,
  source_row INTEGER,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_bathymetry_campaigns UNIQUE (dam_code, measurement_year)
);

CREATE INDEX IF NOT EXISTS idx_bathymetry_campaigns_dam_campaign
  ON hydro.bathymetry_campaigns (dam_code, campaign_year);

DROP TRIGGER IF EXISTS trg_bathymetry_campaigns_updated_at ON hydro.bathymetry_campaigns;
CREATE TRIGGER trg_bathymetry_campaigns_updated_at
BEFORE UPDATE ON hydro.bathymetry_campaigns
FOR EACH ROW EXECUTE FUNCTION hydro.set_updated_at();

COMMIT;

export type SiltationIndicatorRow = {
  indicator_id: number;
  dam_code: string;
  dam_name: string;
  reference_code: string | null;
  baseline_year: number | null;
  current_year: number | null;
  volume_initial_mhm3: number | null;
  volume_current_mhm3: number | null;
  volume_silted_mhm3: number | null;
  loss_percent: number | null;
  tea_mhm3_per_year: number | null;
  ter_percent_per_year: number | null;
  duration_years: number | null;
  trapping_efficiency_percent: number | null;
  basin_area_km2: number | null;
  specific_erosion_m3_km2_year: number | null;
  created_at: string;
  updated_at: string;
};

export type SiltationHsvRow = {
  hsv_id: number;
  dam_code: string;
  dam_name: string;
  campaign_year: number;
  level_m: number;
  surface_km2: number | null;
  volume_mhm3: number | null;
  source_sheet: string;
};

export type SiltationEvolutionRow = {
  evolution_id: number;
  dam_code: string;
  dam_name: string;
  year: number;
  annual_silted_mhm3: number;
  cumulative_silted_mhm3: number | null;
  annual_rate_mhm3: number | null;
};

export type SiltationAvailability = {
  barrage: string;
  years: number[];
  hsvYears: number[];
  campaignYears: number[];
  dataSource?: "bathy_had" | "legacy";
};

export type BathymetryCampaignRow = {
  campaign_id: number;
  dam_code: string;
  dam_name: string;
  measurement_year: number;
  campaign_year: number;
  normal_level_m: number | null;
  volume_mhm3: number;
  silted_since_previous_mhm3: number | null;
  annual_siltation_rate_mhm3: number | null;
  cumulative_silted_mhm3: number | null;
  source_file: string;
  source_sheet: string;
  metadata?: Record<string, unknown>;
};

export type BathymetryPeriodVolumeRow = {
  period: string;
  volume_silted_mhm3: number;
  fromYear: number;
  toYear: number;
};

export type BathymetryCampaignsResponse = {
  dam_code: string;
  dam_name: string;
  source_file: string;
  normal_level_m: number | null;
  campaigns: BathymetryCampaignRow[];
  periods: BathymetryPeriodVolumeRow[];
  campaignYears: number[];
};

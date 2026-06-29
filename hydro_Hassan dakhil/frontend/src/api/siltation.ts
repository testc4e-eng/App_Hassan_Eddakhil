import { apiGet, qs } from "./client";

export type SiltationIndicator = {
  dam_code: string;
  dam_name: string;
  baseline_year: number | null;
  current_year: number | null;
  volume_initial_mhm3: number | null;
  volume_current_mhm3: number | null;
  volume_silted_mhm3: number | null;
  loss_percent: number | null;
  tea_mhm3_per_year: number | null;
  ter_percent_per_year: number | null;
  duration_years: number | null;
};

export type SiltationEvolutionRow = {
  year: number;
  annual_silted_mhm3: number;
  cumulative_silted_mhm3: number | null;
  annual_rate_mhm3: number | null;
};

export type SiltationHsvRow = {
  campaign_year: number;
  level_m: number;
  surface_km2: number | null;
  volume_mhm3: number | null;
};

export type SiltationSummaryResponse = {
  dam_code: string;
  dam_name: string;
  indicators: SiltationIndicator | null;
  evolution_rows: number;
  hsv_rows: number;
  data_source?: "bathy_had" | "legacy";
};

export type SiltationAvailabilityResponse = {
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

const API_BASE = import.meta.env.VITE_API_BASE ?? "/api/v1";

export const siltationApi = {
  summary: (damCode = "HASSAN_ADDAKHIL") =>
    apiGet<SiltationSummaryResponse>(`/siltation/summary${qs({ damCode })}`),
  indicators: (damCode = "HASSAN_ADDAKHIL") =>
    apiGet<SiltationIndicator[]>(`/siltation/indicators${qs({ damCode })}`),
  hsv: (damCode = "HASSAN_ADDAKHIL") =>
    apiGet<SiltationHsvRow[]>(`/siltation/hsv${qs({ damCode })}`),
  evolution: (damCode = "HASSAN_ADDAKHIL") =>
    apiGet<SiltationEvolutionRow[]>(`/siltation/evolution${qs({ damCode })}`),
  availability: (damCode = "HASSAN_ADDAKHIL") =>
    apiGet<SiltationAvailabilityResponse>(`/siltation/availability${qs({ damCode })}`),
  bathymetryCampaigns: (damCode = "HASSAN_ADDAKHIL") =>
    apiGet<BathymetryCampaignsResponse | null>(`/siltation/bathymetry-campaigns${qs({ damCode })}`),
  periodVolumes: (damCode = "HASSAN_ADDAKHIL") =>
    apiGet<BathymetryPeriodVolumeRow[]>(`/siltation/period-volumes${qs({ damCode })}`),
  exportExcelUrl: (damCode = "HASSAN_ADDAKHIL") =>
    `${API_BASE}/siltation/export/excel${qs({ damCode })}`,
  exportPdfUrl: (damCode = "HASSAN_ADDAKHIL") =>
    `${API_BASE}/siltation/export/pdf${qs({ damCode })}`,
};

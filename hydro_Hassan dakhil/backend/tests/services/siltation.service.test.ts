import { afterEach, describe, expect, it, vi } from "vitest";
import { SiltationService } from "../../src/services/siltation.service";
import type {
  BathymetryCampaignsResponse,
  SiltationIndicatorRow,
} from "../../src/types/siltation.types";
import { DatabaseService } from "../../src/services/database.service";

function buildCampaignPackage(
  campaigns: BathymetryCampaignsResponse["campaigns"]
): BathymetryCampaignsResponse {
  return {
    dam_code: "HASSAN_ADDAKHIL",
    dam_name: "HASSAN ADDAKHIL",
    source_file: "bathy_HAD.xlsx",
    normal_level_m: 1122.2,
    campaigns,
    periods: [],
    campaignYears: campaigns.map((row) => row.measurement_year),
  };
}

function buildStoredIndicator(overrides: Partial<SiltationIndicatorRow> = {}): SiltationIndicatorRow {
  return {
    indicator_id: 7,
    dam_code: "HASSAN_ADDAKHIL",
    dam_name: "HASSAN ADDAKHIL",
    reference_code: "LEGACY",
    baseline_year: 1990,
    current_year: 2022,
    volume_initial_mhm3: null,
    volume_current_mhm3: null,
    volume_silted_mhm3: null,
    loss_percent: null,
    tea_mhm3_per_year: null,
    ter_percent_per_year: null,
    duration_years: null,
    trapping_efficiency_percent: 95.2,
    basin_area_km2: 1234.5,
    specific_erosion_m3_km2_year: 67.89,
    created_at: "2026-08-28T00:00:00.000Z",
    updated_at: "2026-08-28T00:00:00.000Z",
    ...overrides,
  };
}

describe("backend services/siltation.service", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("computes indicators dynamically from bathymetry campaigns when the legacy table is empty", async () => {
    const service = new SiltationService();
    vi.spyOn(service, "getBathymetryCampaignsPackage").mockResolvedValue(
      buildCampaignPackage([
        {
          campaign_id: 1,
          dam_code: "HASSAN_ADDAKHIL",
          dam_name: "HASSAN ADDAKHIL",
          measurement_year: 1990,
          campaign_year: 1990,
          normal_level_m: 1122.2,
          volume_mhm3: 346.77904973333403,
          silted_since_previous_mhm3: null,
          annual_siltation_rate_mhm3: null,
          cumulative_silted_mhm3: null,
          source_file: "bathy_HAD.xlsx",
          source_sheet: "Sheet1",
        },
        {
          campaign_id: 2,
          dam_code: "HASSAN_ADDAKHIL",
          dam_name: "HASSAN ADDAKHIL",
          measurement_year: 2022,
          campaign_year: 2022,
          normal_level_m: 1122.2,
          volume_mhm3: 287.5664121607314,
          silted_since_previous_mhm3: 22.69718363926961,
          annual_siltation_rate_mhm3: 2.521909293252179,
          cumulative_silted_mhm3: 59.21263757260266,
          source_file: "bathy_HAD.xlsx",
          source_sheet: "Sheet1",
        },
      ])
    );
    vi.spyOn(DatabaseService.prototype, "query").mockResolvedValue([]);

    const [indicator] = await service.getIndicators();

    expect(indicator).toMatchObject({
      dam_code: "HASSAN_ADDAKHIL",
      reference_code: "BATHY_HAD",
      baseline_year: 1990,
      current_year: 2022,
      duration_years: 32,
      volume_initial_mhm3: 346.77904973333403,
      volume_current_mhm3: 287.5664121607314,
      volume_silted_mhm3: 59.21263757260266,
    });
    expect(indicator.loss_percent ?? 0).toBeCloseTo(17.07503311348709, 10);
    expect(indicator.tea_mhm3_per_year ?? 0).toBeCloseTo(1.850394924143833, 10);
    expect(indicator.ter_percent_per_year ?? 0).toBeCloseTo(0.5335947847964716, 10);
  });

  it("preserves documented metadata fields from a stored indicator while recomputing KPI values", async () => {
    const service = new SiltationService();
    vi.spyOn(service, "getBathymetryCampaignsPackage").mockResolvedValue(
      buildCampaignPackage([
        {
          campaign_id: 1,
          dam_code: "HASSAN_ADDAKHIL",
          dam_name: "HASSAN ADDAKHIL",
          measurement_year: 2013,
          campaign_year: 2013,
          normal_level_m: 1122.2,
          volume_mhm3: 310.263595800001,
          silted_since_previous_mhm3: null,
          annual_siltation_rate_mhm3: null,
          cumulative_silted_mhm3: 36.51545393333305,
          source_file: "bathy_HAD.xlsx",
          source_sheet: "Sheet1",
        },
        {
          campaign_id: 2,
          dam_code: "HASSAN_ADDAKHIL",
          dam_name: "HASSAN ADDAKHIL",
          measurement_year: 2022,
          campaign_year: 2022,
          normal_level_m: 1122.2,
          volume_mhm3: 287.5664121607314,
          silted_since_previous_mhm3: 22.69718363926961,
          annual_siltation_rate_mhm3: 2.521909293252179,
          cumulative_silted_mhm3: 59.21263757260266,
          source_file: "bathy_HAD.xlsx",
          source_sheet: "Sheet1",
        },
      ])
    );
    vi.spyOn(DatabaseService.prototype, "query").mockResolvedValue([buildStoredIndicator()]);

    const [indicator] = await service.getIndicators();

    expect(indicator.reference_code).toBe("LEGACY");
    expect(indicator.trapping_efficiency_percent).toBe(95.2);
    expect(indicator.basin_area_km2).toBe(1234.5);
    expect(indicator.specific_erosion_m3_km2_year).toBe(67.89);
    expect(indicator.volume_silted_mhm3).toBeCloseTo(59.21263757260266, 10);
  });

  it("returns a single-campaign indicator without NaN or Infinity values", async () => {
    const service = new SiltationService();
    vi.spyOn(service, "getBathymetryCampaignsPackage").mockResolvedValue(
      buildCampaignPackage([
        {
          campaign_id: 1,
          dam_code: "HASSAN_ADDAKHIL",
          dam_name: "HASSAN ADDAKHIL",
          measurement_year: 2022,
          campaign_year: 2022,
          normal_level_m: 1122.2,
          volume_mhm3: 287.5664121607314,
          silted_since_previous_mhm3: null,
          annual_siltation_rate_mhm3: null,
          cumulative_silted_mhm3: null,
          source_file: "bathy_HAD.xlsx",
          source_sheet: "Sheet1",
        },
      ])
    );
    vi.spyOn(DatabaseService.prototype, "query").mockResolvedValue([]);

    const [indicator] = await service.getIndicators();

    expect(indicator.duration_years).toBe(0);
    expect(indicator.volume_silted_mhm3).toBe(0);
    expect(indicator.loss_percent).toBe(0);
    expect(indicator.tea_mhm3_per_year).toBeNull();
    expect(indicator.ter_percent_per_year).toBeNull();
  });

  it("falls back to the stored indicator when no bathymetry campaign package exists", async () => {
    const service = new SiltationService();
    const stored = buildStoredIndicator({
      volume_initial_mhm3: 100,
      volume_current_mhm3: 80,
      volume_silted_mhm3: 20,
      loss_percent: 20,
      tea_mhm3_per_year: 2,
      ter_percent_per_year: 0.5,
      duration_years: 10,
    });
    vi.spyOn(service, "getBathymetryCampaignsPackage").mockResolvedValue(null);
    vi.spyOn(DatabaseService.prototype, "query").mockResolvedValue([stored]);

    const [indicator] = await service.getIndicators();

    expect(indicator).toEqual(stored);
  });
});

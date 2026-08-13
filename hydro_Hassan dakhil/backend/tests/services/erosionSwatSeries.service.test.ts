import { afterEach, describe, expect, it, vi } from "vitest";
import { DatabaseService } from "../../src/services/database.service";
import {
  ErosionSwatSeriesService,
  type ErosionAvailabilityRow,
} from "../../src/services/erosionSwatSeries.service";

describe("backend services/erosionSwatSeriesService", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("resolves the virtual erosion alias without hitting the database", async () => {
    const queryOneSpy = vi.spyOn(DatabaseService.prototype, "queryOne");
    const service = new ErosionSwatSeriesService();

    await expect(service.resolveErosionScenario(105)).resolves.toEqual({
      run_id: 105,
      scenario_code: "scenario_1",
      scenario_name: "Scénario reboisement pente 9%",
    });
    expect(queryOneSpy).not.toHaveBeenCalled();
  });

  it("keeps erosion alias requests compatible with canonical availability rows", async () => {
    const service = new ErosionSwatSeriesService();
    const row: ErosionAvailabilityRow = {
      ts_id: 700000001,
      module_code: "erosion",
      station_id: 22,
      station_code: "STA-22",
      station_name: "Station 22",
      station_label: "STA-22 - Station 22",
      property_id: 33,
      property_name: "Dégradation spécifique (t/ha)",
      unit: "t/ha",
      standard_name: "SWAT_SYLDT_HA",
      run_id: 7,
      scenario_code: "scenario_1",
      scenario_name: "Scénario reboisement pente 9%",
      source_type: "simulated",
      time_step: "annual",
      n_measures: 20,
      dt_min: "2001-01-01",
      dt_max: "2020-12-31",
      v_min: 0.1,
      v_max: 2.5,
      created_at: "2026-08-11T08:00:00.000Z",
      period_days: 7304,
    };

    vi.spyOn(service as any, "resolveScenario").mockResolvedValue({
      run_id: 105,
      scenario_code: "scenario_1",
      scenario_name: "Scénario reboisement pente 9%",
    });
    vi.spyOn(service, "getAvailability").mockResolvedValue([row]);
    vi.spyOn(service as any, "resolveMappedSubbasinId").mockResolvedValue(null);

    await expect(service.getStationsForRun(105)).resolves.toEqual([
      {
        station_id: 22,
        station_code: "STA-22",
        station_name: "Station 22",
      },
    ]);

    await expect(service.getCatalog(22, 105)).resolves.toMatchObject([
      {
        ts_id: 700000001,
        station_id: 22,
        property_id: 33,
        run_id: 105,
        scenario_code: "scenario_1",
      },
    ]);

    await expect(service.getDateRange(22, 105, 33)).resolves.toEqual({
      min_date: "2001-01-01",
      max_date: "2020-12-31",
      n_points: 20,
    });
  });

  it("keeps dynamic and materialized SWAT erosion properties declared from the shared source map", async () => {
    const service = new ErosionSwatSeriesService();
    await expect(service.getModuleProperties()).resolves.toEqual([
      {
        module_code: "erosion",
        property_id: 91010,
        is_enabled: true,
        sort_order: 9001,
        name: "Sediments entrants",
        unit: "tons",
        standard_name: "SWAT_SED_IN_TONS",
        description: "Simulated sediment inflow at reach outlet.",
      },
      {
        module_code: "erosion",
        property_id: 32,
        is_enabled: true,
        sort_order: 9002,
        name: "Sediments sortants",
        unit: "tons",
        standard_name: "SWAT_SED_TONS",
        description: "Simulated sediment out at reach outlet.",
      },
      {
        module_code: "erosion",
        property_id: 91011,
        is_enabled: true,
        sort_order: 9003,
        name: "Concentration sediments",
        unit: "mg/kg",
        standard_name: "SWAT_SED_CONC_MG_KG",
        description: "Simulated sediment concentration at reach outlet.",
      },
      {
        module_code: "erosion",
        property_id: 33,
        is_enabled: true,
        sort_order: 9004,
        name: "D\u00e9gradation sp\u00e9cifique (t/ha)",
        unit: "t/ha",
        standard_name: "SWAT_SYLDT_HA",
        description: "Simulated sediment yield by subbasin.",
      },
    ]);
  });
});

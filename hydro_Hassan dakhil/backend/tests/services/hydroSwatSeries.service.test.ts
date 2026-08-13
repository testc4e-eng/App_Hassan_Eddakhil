import { afterEach, describe, expect, it, vi } from "vitest";
import {
  HydroSwatSeriesService,
  type HydroAvailabilityRow,
} from "../../src/services/hydroSwatSeries.service";

describe("backend services/hydroSwatSeriesService", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("resolves canonical run ids against virtual hydro availability rows", async () => {
    const service = new HydroSwatSeriesService();
    const row: HydroAvailabilityRow = {
      ts_id: 1010000001,
      module_code: "hydro",
      station_id: 11,
      station_code: "STA-11",
      station_name: "Station 11",
      station_label: "STA-11 - Station 11",
      property_id: 31,
      property_name: "Débit simulé",
      unit: "m3/s",
      standard_name: "SWAT_FLOW_M3S",
      run_id: 101,
      scenario_code: "etat_actuel",
      scenario_name: "Scénario état actuel",
      source_type: "simulated",
      time_step: "daily",
      n_measures: 365,
      dt_min: "2020-01-01",
      dt_max: "2020-12-31",
      v_min: 1,
      v_max: 10,
      created_at: "2026-08-11T08:00:00.000Z",
      period_days: 365,
    };

    vi.spyOn(service as any, "resolveScenario").mockResolvedValue({
      run_id: 3,
      scenario_code: "etat_actuel",
      scenario_name: "Scénario état actuel",
    });
    vi.spyOn(service, "getAvailability").mockResolvedValue([row]);

    await expect(service.getStationsForRun(3)).resolves.toEqual([
      {
        station_id: 11,
        station_code: "STA-11",
        station_name: "Station 11",
      },
    ]);

    await expect(service.getCatalog(11, 3)).resolves.toMatchObject([
      {
        ts_id: 1010000001,
        station_id: 11,
        property_id: 31,
        run_id: 3,
        scenario_code: "etat_actuel",
      },
    ]);

    await expect(service.getDateRange(11, 3, 31)).resolves.toEqual({
      min_date: "2020-01-01",
      max_date: "2020-12-31",
      n_points: 365,
    });
  });

  it("keeps virtual hydro aliases working internally", async () => {
    const service = new HydroSwatSeriesService();
    const row: HydroAvailabilityRow = {
      ts_id: 1010000001,
      module_code: "hydro",
      station_id: 11,
      station_code: "STA-11",
      station_name: "Station 11",
      station_label: "STA-11 - Station 11",
      property_id: 31,
      property_name: "Débit simulé",
      unit: "m3/s",
      standard_name: "SWAT_FLOW_M3S",
      run_id: 101,
      scenario_code: "etat_actuel",
      scenario_name: "Scénario état actuel",
      source_type: "simulated",
      time_step: "daily",
      n_measures: 365,
      dt_min: "2020-01-01",
      dt_max: "2020-12-31",
      v_min: 1,
      v_max: 10,
      created_at: "2026-08-11T08:00:00.000Z",
      period_days: 365,
    };

    vi.spyOn(service as any, "resolveScenario").mockResolvedValue({
      run_id: 101,
      scenario_code: "etat_actuel",
      scenario_name: "Scénario état actuel",
    });
    vi.spyOn(service, "getAvailability").mockResolvedValue([row]);

    await expect(service.getStationsForRun(101)).resolves.toEqual([
      {
        station_id: 11,
        station_code: "STA-11",
        station_name: "Station 11",
      },
    ]);
  });

  it("keeps the shared SWAT flow property definition available for hydro", async () => {
    const service = new HydroSwatSeriesService();
    const row: HydroAvailabilityRow = {
      ts_id: 1010000001,
      module_code: "hydro",
      station_id: 11,
      station_code: "STA-11",
      station_name: "Station 11",
      station_label: "STA-11 - Station 11",
      property_id: 31,
      property_name: "D\u00e9bit simul\u00e9",
      unit: "m3/s",
      standard_name: "SWAT_FLOW_M3S",
      run_id: 101,
      scenario_code: "etat_actuel",
      scenario_name: "Sc\u00e9nario \u00e9tat actuel",
      source_type: "simulated",
      time_step: "daily",
      n_measures: 365,
      dt_min: "2020-01-01",
      dt_max: "2020-12-31",
      v_min: 1,
      v_max: 10,
      created_at: "2026-08-11T08:00:00.000Z",
      period_days: 365,
    };

    vi.spyOn(service as any, "getAvailabilityRows").mockResolvedValue([row]);

    await expect(service.getModuleProperties()).resolves.toEqual([
      {
        module_code: "hydro",
        property_id: 31,
        is_enabled: true,
        sort_order: 1001,
        name: "D\u00e9bit simul\u00e9",
        unit: "m3/s",
        standard_name: "SWAT_FLOW_M3S",
        description: "SWAT simulated D\u00e9bits m\u00b3/s at reach outlet.",
      },
    ]);
  });
});

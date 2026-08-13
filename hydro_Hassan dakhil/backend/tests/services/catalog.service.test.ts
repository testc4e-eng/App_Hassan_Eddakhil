import { afterEach, describe, expect, it, vi } from "vitest";
import { CatalogService } from "../../src/services/catalog.service";
import { DatabaseService } from "../../src/services/database.service";

describe("backend services/catalogService", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns only canonical visible runs from the scenario catalog", async () => {
    vi.spyOn(DatabaseService.prototype, "relationExists").mockImplementation(
      async (relationName: string) => relationName === "api.mv_scenario_catalog"
    );
    vi.spyOn(DatabaseService.prototype, "query").mockImplementation(
      async (sql: string) => {
        if (!sql.includes("FROM api.mv_scenario_catalog")) {
          throw new Error(`Unexpected query: ${sql}`);
        }

        return [
          {
            run_id: 1,
            scenario_code: "OBSERVED",
            scenario_name: "Observed",
            description: null,
            is_observed: true,
            created_at: "2026-01-01T00:00:00.000Z",
            is_visible: true,
          },
          {
            run_id: 3,
            scenario_code: "etat_actuel",
            scenario_name: "Scénario état actuel",
            description: null,
            is_observed: false,
            created_at: "2026-01-02T00:00:00.000Z",
            is_visible: true,
          },
          {
            run_id: 101,
            scenario_code: "etat_actuel",
            scenario_name: "Scénario état actuel",
            description: null,
            is_observed: false,
            created_at: "1970-01-01T00:00:00.000Z",
            is_visible: true,
          },
          {
            run_id: 4,
            scenario_code: "ssp126",
            scenario_name: "Scénario SSP126",
            description: null,
            is_observed: false,
            created_at: "2026-01-03T00:00:00.000Z",
            is_visible: true,
          },
          {
            run_id: 102,
            scenario_code: "ssp126",
            scenario_name: "Scénario SSP126",
            description: null,
            is_observed: false,
            created_at: "1970-01-01T00:00:00.000Z",
            is_visible: true,
          },
          {
            run_id: 5,
            scenario_code: "ssp245",
            scenario_name: "Scénario SSP245",
            description: null,
            is_observed: false,
            created_at: "2026-01-04T00:00:00.000Z",
            is_visible: true,
          },
          {
            run_id: 6,
            scenario_code: "ssp585",
            scenario_name: "Scénario SSP585",
            description: null,
            is_observed: false,
            created_at: "2026-01-05T00:00:00.000Z",
            is_visible: true,
          },
          {
            run_id: 7,
            scenario_code: "scenario_1",
            scenario_name: "Scénario 1",
            description: null,
            is_observed: false,
            created_at: "2026-01-06T00:00:00.000Z",
            is_visible: true,
          },
          {
            run_id: 8,
            scenario_code: "scenario_2",
            scenario_name: "Scénario 2",
            description: null,
            is_observed: false,
            created_at: "2026-01-07T00:00:00.000Z",
            is_visible: true,
          },
          {
            run_id: 9,
            scenario_code: "scenario_3",
            scenario_name: "Scénario 3",
            description: null,
            is_observed: false,
            created_at: "2026-01-08T00:00:00.000Z",
            is_visible: true,
          },
          {
            run_id: 10,
            scenario_code: "scenario_4",
            scenario_name: "Scénario 4",
            description: null,
            is_observed: false,
            created_at: "2026-01-09T00:00:00.000Z",
            is_visible: true,
          },
          {
            run_id: 2,
            scenario_code: "SWAT_OUTPUT_01",
            scenario_name: "SWAT legacy",
            description: null,
            is_observed: false,
            created_at: "2026-01-10T00:00:00.000Z",
            is_visible: true,
          },
        ] as any;
      }
    );

    const service = new CatalogService();
    const rows = await service.getRuns();

    expect(rows.map((row) => row.run_id)).toEqual([1, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(rows.map((row) => row.scenario_code)).toEqual([
      "OBSERVED",
      "etat_actuel",
      "ssp126",
      "ssp245",
      "ssp585",
      "scenario_1",
      "scenario_2",
      "scenario_3",
      "scenario_4",
    ]);
    expect(rows.filter((row) => row.scenario_code === "etat_actuel")).toHaveLength(1);
    expect(rows.some((row) => row.run_id >= 101)).toBe(false);
    expect(rows.some((row) => row.scenario_code === "SWAT_OUTPUT_01")).toBe(false);
  });
});

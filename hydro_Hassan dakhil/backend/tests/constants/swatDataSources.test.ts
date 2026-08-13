import { describe, expect, it } from "vitest";
import {
  SWAT_DYNAMIC_PROPERTY_DEFS,
  VISIBLE_AND_OBSERVED_SWAT_SCENARIO_CODE_SET,
  getSwatPropertyDefinition,
  resolveSwatStorageTimeStep,
} from "../../src/constants/swatDataSources";

describe("backend constants/swatDataSources", () => {
  it("documents dynamic SWAT reach properties backed by access tables", () => {
    const sedimentIn = getSwatPropertyDefinition("SWAT_SED_IN_TONS");
    const sedimentConcentration = getSwatPropertyDefinition(
      "SWAT_SED_CONC_MG_KG"
    );

    expect(sedimentIn).toMatchObject({
      property_id: 91010,
      primary_source: "ACCESS",
      canonical_source: "DYNAMIC",
      source_table: "access.rch_results",
      source_column: "sed_in_tons",
      exposure_mode: "DYNAMIC",
      materialized_core: false,
    });
    expect(sedimentConcentration).toMatchObject({
      property_id: 91011,
      primary_source: "ACCESS",
      canonical_source: "DYNAMIC",
      source_table: "access.rch_results",
      source_column: "sedconc_mg_kg",
      exposure_mode: "DYNAMIC",
      materialized_core: false,
    });
    expect(
      SWAT_DYNAMIC_PROPERTY_DEFS.map((property) => property.standard_name)
    ).toEqual(["SWAT_SED_IN_TONS", "SWAT_SED_CONC_MG_KG"]);
  });

  it("keeps visible SWAT scenarios and observed compatibility explicit", () => {
    expect(VISIBLE_AND_OBSERVED_SWAT_SCENARIO_CODE_SET.has("OBSERVED")).toBe(
      true
    );
    expect(
      VISIBLE_AND_OBSERVED_SWAT_SCENARIO_CODE_SET.has("etat_actuel")
    ).toBe(true);
    expect(
      VISIBLE_AND_OBSERVED_SWAT_SCENARIO_CODE_SET.has("scenario_4")
    ).toBe(true);
    expect(
      VISIBLE_AND_OBSERVED_SWAT_SCENARIO_CODE_SET.has("SWAT_OUTPUT_01")
    ).toBe(false);
  });

  it("keeps scenario_* storage mapped to yearly while preserving daily access defaults", () => {
    expect(resolveSwatStorageTimeStep("scenario_1", "daily")).toBe("yearly");
    expect(resolveSwatStorageTimeStep("ssp126", "annual")).toBe("yearly");
    expect(resolveSwatStorageTimeStep("etat_actuel", "daily")).toBe("daily");
  });
});

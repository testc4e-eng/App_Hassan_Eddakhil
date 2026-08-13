import { describe, expect, it } from "vitest";
import {
  aggToCanonicalTimeStep,
  getNativeGranularityFromRows,
  isAggregationSelectable,
  normalizeTimeStep,
  pickSourceTimeStep,
  resolveSelectableAggregations,
} from "../../src/utils/aggregationAvailability";

describe("backend utils/aggregationAvailability", () => {
  it("normalizes supported time step labels", () => {
    expect(normalizeTimeStep("daily")).toBe("daily");
    expect(normalizeTimeStep("monthly")).toBe("monthly");
    expect(normalizeTimeStep("annual")).toBe("annual");
    expect(normalizeTimeStep("instant")).toBe("daily");
    expect(normalizeTimeStep("unknown")).toBeNull();
  });

  it("derives native and selectable granularities from rows", () => {
    const native = getNativeGranularityFromRows([
      { time_step: "monthly" },
      { time_step: "annual" },
    ]);

    expect(native).toEqual({
      daily: false,
      monthly: true,
      annual: true,
    });
    expect(resolveSelectableAggregations(native)).toEqual({
      daily: false,
      monthly: true,
      annual: true,
    });
  });

  it("resolves the source time step used for aggregation", () => {
    const native = { daily: true, monthly: false, annual: false };

    expect(aggToCanonicalTimeStep("day")).toBe("daily");
    expect(pickSourceTimeStep("month", native)).toBe("daily");
    expect(isAggregationSelectable("year", { daily: false, monthly: false, annual: true })).toBe(true);
  });
});

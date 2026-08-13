import { describe, expect, it } from "vitest";
import {
  composeSelectValue,
  deduplicateSelectOptions,
  extractSelectNumericPart,
} from "../../src/lib/selectOptions";

describe("frontend lib/selectOptions", () => {
  it("composes select values with empty slots preserved", () => {
    expect(composeSelectValue(["hydro", 12, null, "station"])).toBe("hydro__12____station");
  });

  it("deduplicates options by key while preserving order", () => {
    const items = [
      { id: 1, label: "A" },
      { id: 1, label: "A duplicate" },
      { id: 2, label: "B" },
    ];

    expect(deduplicateSelectOptions(items, (item) => item.id)).toEqual([
      { id: 1, label: "A" },
      { id: 2, label: "B" },
    ]);
  });

  it("extracts a numeric part from a composed value", () => {
    expect(extractSelectNumericPart("hydro__42__run", 1)).toBe(42);
    expect(extractSelectNumericPart("hydro__abc__run", 1)).toBeUndefined();
  });
});

export type NativeGranularity = {
  daily: boolean;
  monthly: boolean;
  annual: boolean;
};

export type SelectableGranularity = NativeGranularity;

export type AggInterval = "day" | "month" | "year";

export function normalizeTimeStep(
  value: string | null | undefined
): "daily" | "monthly" | "annual" | null {
  const timeStep = String(value || "").toLowerCase();
  if (!timeStep) return null;
  if (timeStep.includes("daily") || timeStep.includes("day") || timeStep.includes("instant")) {
    return "daily";
  }
  if (timeStep.includes("month")) return "monthly";
  if (timeStep.includes("annual") || timeStep.includes("year")) return "annual";
  return null;
}

export function getNativeGranularityFromRows(
  rows: Array<{ time_step?: string | null }>
): NativeGranularity {
  const native: NativeGranularity = {
    daily: false,
    monthly: false,
    annual: false,
  };

  for (const row of rows) {
    const normalized = normalizeTimeStep(row.time_step);
    if (!normalized) continue;
    native[normalized] = true;
  }

  return native;
}

export function resolveSelectableAggregations(
  native: NativeGranularity
): SelectableGranularity {
  if (native.daily) {
    return { daily: true, monthly: true, annual: true };
  }
  if (native.monthly) {
    return { daily: false, monthly: true, annual: true };
  }
  if (native.annual) {
    return { daily: false, monthly: false, annual: true };
  }
  return { daily: false, monthly: false, annual: false };
}

export function isAggregationSelectable(
  agg: AggInterval,
  availability: SelectableGranularity
): boolean {
  if (agg === "day") return availability.daily;
  if (agg === "month") return availability.monthly;
  return availability.annual;
}

export const AGGREGATION_PRIORITY: AggInterval[] = ["day", "month", "year"];

export function selectableAggregationModes(
  availability: SelectableGranularity
): AggInterval[] {
  return AGGREGATION_PRIORITY.filter((mode) => isAggregationSelectable(mode, availability));
}

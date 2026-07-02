export type NativeGranularity = {
  daily: boolean;
  monthly: boolean;
  annual: boolean;
};

export type SelectableGranularity = NativeGranularity;

export type AggInterval = "day" | "month" | "year";
export type CanonicalTimeStep = "daily" | "monthly" | "annual";

export function normalizeTimeStep(
  value: string | null | undefined
): CanonicalTimeStep | null {
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

export function aggToCanonicalTimeStep(agg: AggInterval): CanonicalTimeStep {
  if (agg === "month") return "monthly";
  if (agg === "year") return "annual";
  return "daily";
}

export function pickSourceTimeStep(
  agg: AggInterval,
  native: NativeGranularity
): CanonicalTimeStep | null {
  const requested = aggToCanonicalTimeStep(agg);

  if (requested === "daily" && native.daily) return "daily";
  if (requested === "monthly" && native.monthly) return "monthly";
  if (requested === "annual" && native.annual) return "annual";

  if (requested === "monthly" && native.daily) return "daily";
  if (requested === "annual" && native.daily) return "daily";
  if (requested === "annual" && native.monthly) return "monthly";

  return null;
}

export function isAggregationSelectable(
  agg: AggInterval,
  selectable: SelectableGranularity
): boolean {
  const canonical = aggToCanonicalTimeStep(agg);
  return selectable[canonical];
}

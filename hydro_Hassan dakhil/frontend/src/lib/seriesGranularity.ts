export type DataGranularity = "daily" | "monthly" | "yearly";
export type AggregationMode = "day" | "month" | "year";

type GranularityRow = {
  time_step?: string | null;
  dt_min?: string | null;
  dt_max?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  period?: string | null;
  datetime?: string | null;
  year?: string | null;
  month?: string | null;
};

function normalizeTimeStep(step?: string | null): DataGranularity | null {
  const value = String(step ?? "").toLowerCase();
  if (!value) return null;
  if (value.includes("year")) return "yearly";
  if (value.includes("month")) return "monthly";
  if (value.includes("day")) return "daily";
  if (value.includes("instant")) return "daily";
  return null;
}

function toDate(value?: string | null): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isFinite(d.getTime()) ? d : null;
}

function uniqueSortedDates(rows: GranularityRow[]): Date[] {
  const seen = new Map<string, Date>();
  for (const row of rows) {
    const candidates = [row.dt_min, row.dt_max, row.start_date, row.end_date, row.period, row.datetime];
    for (const candidate of candidates) {
      const d = toDate(candidate);
      if (!d) continue;
      const key = d.toISOString().slice(0, 10);
      if (!seen.has(key)) seen.set(key, d);
    }
  }
  return Array.from(seen.values()).sort((a, b) => a.getTime() - b.getTime());
}

export function detectSeriesGranularity(rows: GranularityRow[]): DataGranularity {
  const votes = rows
    .map((row) => normalizeTimeStep(row.time_step))
    .filter((v): v is DataGranularity => Boolean(v));

  if (votes.length) {
    if (votes.every((v) => v === "yearly")) return "yearly";
    if (votes.every((v) => v === "monthly")) return "monthly";
    return "daily";
  }

  const dates = uniqueSortedDates(rows);
  if (dates.length <= 1) {
    const only = dates[0];
    if (!only) return "daily";
    if (only.getDate() === 1 && only.getMonth() === 0) return "yearly";
    if (only.getDate() === 1) return "monthly";
    return "daily";
  }

  const allYearOnly = dates.every((d) => d.getMonth() === 0 && d.getDate() === 1);
  if (allYearOnly) return "yearly";

  const allMonthOnly = dates.every((d) => d.getDate() === 1);
  if (allMonthOnly) return "monthly";

  return "daily";
}

export function getAvailableAggregationModes(granularity: DataGranularity): AggregationMode[] {
  if (granularity === "yearly") return ["year"];
  if (granularity === "monthly") return ["month"];
  return ["day", "month", "year"];
}

export function formatDateByAggregation(dateLike: string, agg: AggregationMode): string {
  const d = toDate(dateLike);
  if (!d) return dateLike;

  if (agg === "year") {
    return String(d.getFullYear());
  }

  if (agg === "month") {
    const month = String(d.getMonth() + 1).padStart(2, "0");
    return `${month}/${d.getFullYear()}`;
  }

  return d.toLocaleDateString("fr-FR");
}

function parseDateYmd(value?: string | null): Date | null {
  if (!value) return null;
  const normalized = String(value).slice(0, 10);
  const d = new Date(`${normalized}T00:00:00Z`);
  return Number.isFinite(d.getTime()) ? d : null;
}

export function clampAggregationForRange(
  requested: AggregationMode,
  startDate?: string | null,
  endDate?: string | null
): AggregationMode {
  if (requested !== "day") return requested;

  const start = parseDateYmd(startDate);
  const end = parseDateYmd(endDate);
  if (!start || !end) return requested;

  const spanDays = Math.max(
    1,
    Math.round((end.getTime() - start.getTime()) / 86400000) + 1
  );

  if (spanDays > 3650) return "year";
  if (spanDays > 730) return "month";
  return requested;
}

import type { ChartDisplayMode } from "@/types/chart";

type ChartRow = Record<string, unknown>;

export type DisplayModeTransformResult<T extends ChartRow, K extends string> = {
  data: Array<T & { probability?: number }>;
  xKey: K | "probability";
  xLabel: string;
  excludedForLog: number;
};

type TransformOptions<T extends ChartRow, K extends string> = {
  mode: ChartDisplayMode;
  rows: T[];
  xKey: K;
  valueKeys: readonly string[];
  normalLabel?: string;
  fdcLabel?: string;
};

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

export function usesLogarithmicYAxis(mode: ChartDisplayMode): boolean {
  return mode === "logarithmic" || mode === "fdc";
}

export function hasStrictlyPositiveValues(
  rows: ChartRow[],
  valueKeys: readonly string[]
) {
  return rows.some((row) =>
    valueKeys.some((key) => {
      const value = row[key];
      return isFiniteNumber(value) && value > 0;
    })
  );
}

export function transformSeriesForDisplayMode<T extends ChartRow, K extends string>({
  mode,
  rows,
  xKey,
  valueKeys,
  normalLabel = "Date",
  fdcLabel = "Probabilite de depassement (%)",
}: TransformOptions<T, K>): DisplayModeTransformResult<T, K> {
  if (mode === "normal") {
    return {
      data: rows,
      xKey,
      xLabel: normalLabel,
      excludedForLog: 0,
    };
  }

  if (mode === "logarithmic") {
    let excludedForLog = 0;
    const data = rows.map((row) => {
      const next: Record<string, unknown> = { ...row };
      for (const key of valueKeys) {
        const value = next[key];
        if (isFiniteNumber(value) && value <= 0) {
          next[key] = null;
          excludedForLog += 1;
        }
      }
      return next as T & { probability?: number };
    });

    return {
      data,
      xKey,
      xLabel: normalLabel,
      excludedForLog,
    };
  }

  const seriesByKey = valueKeys.map((key) => ({
    key,
    values: rows
      .map((row) => row[key])
      .filter((value): value is number => isFiniteNumber(value) && value > 0)
      .sort((a, b) => b - a),
  }));
  const maxLen = Math.max(0, ...seriesByKey.map((series) => series.values.length));
  const data: Array<T & { probability?: number }> = [];
  let excludedForLog = 0;

  for (let index = 0; index < maxLen; index += 1) {
    const probability = Number((((index + 1) / (maxLen + 1)) * 100).toFixed(2));
    const row: Record<string, unknown> = { probability };

    for (const series of seriesByKey) {
      const value = series.values[index] ?? null;
      row[series.key] = value;
      if (value === null) excludedForLog += 1;
    }

    data.push(row as T & { probability?: number });
  }

  return {
    data,
    xKey: "probability",
    xLabel: fdcLabel,
    excludedForLog,
  };
}

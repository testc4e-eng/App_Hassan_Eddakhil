type SeriesPoint = {
  date: string;
  value: number | null;
};

function toFiniteNumber(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  return null;
}

export function downsampleSeriesPoints(points: SeriesPoint[], maxPoints = 700): SeriesPoint[] {
  if (points.length <= maxPoints) return points;

  const step = Math.max(1, Math.ceil(points.length / maxPoints));
  const picked = new Set<number>();
  picked.add(0);
  picked.add(points.length - 1);

  for (let i = 0; i < points.length; i += step) picked.add(i);

  let maxIdx = -1;
  let maxVal = Number.NEGATIVE_INFINITY;
  let minIdx = -1;
  let minVal = Number.POSITIVE_INFINITY;

  for (let i = 0; i < points.length; i++) {
    const value = toFiniteNumber(points[i]?.value);
    if (value === null) continue;
    if (value > maxVal) {
      maxVal = value;
      maxIdx = i;
    }
    if (value < minVal) {
      minVal = value;
      minIdx = i;
    }
  }
  if (maxIdx >= 0) picked.add(maxIdx);
  if (minIdx >= 0) picked.add(minIdx);

  return Array.from(picked)
    .sort((a, b) => a - b)
    .map((index) => points[index]);
}

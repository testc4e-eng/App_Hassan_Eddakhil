// frontend/src/lib/thematicColors.ts
import { EMPTY_VALUE_PLACEHOLDER } from "@/lib/display";

export const DEFAULT_SUBBASIN_COLORS = [
  "#ffffcc",
  "#ffeda0",
  "#fed976",
  "#feb24c",
  "#fd8d3c",
  "#fc4e2a",
  "#e31a1c",
  "#bd0026",
  "#800026",
];

export const DEFAULT_REACH_COLORS = [
  "#f7fbff",
  "#deebf7",
  "#c6dbef",
  "#9ecae1",
  "#6baed6",
  "#4292c6",
  "#2171b5",
  "#08519c",
  "#08306b",
];

export function valueToColor(
  value: number | null | undefined,
  min: number,
  max: number,
  colors: string[]
): string {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return "#cccccc";
  }
  if (colors.length === 0) return "#cccccc";
  if (min === max) return colors[colors.length - 1];
  const t = (value - min) / (max - min);
  const clamped = Math.max(0, Math.min(1, t));
  const idx = Math.floor(clamped * (colors.length - 1));
  return colors[idx];
}

export function formatValue(value: number | null | undefined, unit: string): string {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return `${EMPTY_VALUE_PLACEHOLDER} ${unit}`;
  }
  const formatted = Math.abs(value) >= 100 ? value.toFixed(1) : value.toFixed(2);
  return `${formatted} ${unit}`;
}

import type { CSSProperties } from "react";
import type { Margin } from "recharts/types/util/types";

/** Bottom margin large enough for tick labels, X-axis title, then legend. */
export const RECHARTS_MARGIN_X_LABEL_LEGEND: Margin = {
  top: 16,
  right: 20,
  left: 10,
  bottom: 72,
};

export const RECHARTS_MARGIN_STANDARD: Margin = {
  top: 20,
  right: 24,
  left: 12,
  bottom: 64,
};

export function rechartsXAxisBottomLabel(value: string) {
  return {
    value,
    position: "insideBottom" as const,
    offset: 6,
  };
}

export const RECHARTS_X_AXIS_BOTTOM = {
  height: 52,
  tickMargin: 10,
};

export const RECHARTS_LEGEND_BOTTOM = {
  verticalAlign: "bottom" as const,
  align: "center" as const,
  wrapperStyle: {
    paddingTop: 26,
    fontSize: 12,
    lineHeight: "18px",
  } satisfies CSSProperties,
  height: 36,
};

export const RECHARTS_LEGEND_CUSTOM_WRAPPER_CLASS =
  "flex flex-wrap items-center justify-center gap-4 pt-6 text-xs";

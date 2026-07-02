import {
  isNormalizedSwatScenarioCode,
  NORMALIZED_SWAT_SCENARIO_CODES,
  type NormalizedSwatScenarioCode,
} from "@/constants/swatScenarios";

export type ScenarioColorKey =
  | "STATE_CURRENT"
  | "SSP126"
  | "SSP245"
  | "SSP585"
  | "REFORESTATION_9"
  | "REFORESTATION_15"
  | "REFORESTATION_25"
  | "BUFFER_ZONE";

export type ScenarioColorTheme = {
  badge: string;
  icon: string;
  accent: string;
  border: string;
  shadow: string;
  hoverShadow: string;
  chart: string;
};

export const SCENARIO_COLOR_KEYS: Record<ScenarioColorKey, NormalizedSwatScenarioCode> = {
  STATE_CURRENT: "etat_actuel",
  SSP126: "ssp126",
  SSP245: "ssp245",
  SSP585: "ssp585",
  REFORESTATION_9: "scenario_1",
  REFORESTATION_15: "scenario_2",
  REFORESTATION_25: "scenario_3",
  BUFFER_ZONE: "scenario_4",
};

export const SCENARIO_RUN_ID_TO_CODE: Record<number, NormalizedSwatScenarioCode> = {
  101: "etat_actuel",
  102: "ssp126",
  103: "ssp245",
  104: "ssp585",
  105: "scenario_1",
  106: "scenario_2",
  107: "scenario_3",
  108: "scenario_4",
};

const DEFAULT_THEME: ScenarioColorTheme = {
  badge: "#64748B",
  icon: "#475569",
  accent: "#F1F5F9",
  border: "#64748B33",
  shadow: "0 4px 14px rgba(100, 116, 139, 0.12)",
  hoverShadow: "0 8px 24px rgba(100, 116, 139, 0.18)",
  chart: "#64748B",
};

function withAlpha(hex: string, alphaHex: string): string {
  const normalized = hex.replace("#", "").slice(0, 6);
  return `#${normalized}${alphaHex}`;
}

function buildTheme(
  badge: string,
  icon: string,
  accent: string,
  shadowRgb: string
): ScenarioColorTheme {
  return {
    badge,
    icon,
    accent,
    border: withAlpha(badge, "33"),
    shadow: `0 4px 14px rgba(${shadowRgb}, 0.14)`,
    hoverShadow: `0 8px 24px rgba(${shadowRgb}, 0.22)`,
    chart: badge,
  };
}

export const SCENARIO_COLORS: Record<NormalizedSwatScenarioCode, ScenarioColorTheme> = {
  etat_actuel: buildTheme("#22C7D6", "#1FB5C6", "#DFF9FC", "34, 199, 214"),
  ssp126: buildTheme("#6BCB77", "#52B65F", "#EAF8ED", "107, 203, 119"),
  ssp245: buildTheme("#8B5CF6", "#7C3AED", "#F1EBFF", "139, 92, 246"),
  ssp585: buildTheme("#EF4444", "#DC2626", "#FDECEC", "239, 68, 68"),
  scenario_1: buildTheme("#F59E0B", "#D97706", "#FFF4DE", "245, 158, 11"),
  scenario_2: buildTheme("#FBBF24", "#EAB308", "#FFF9DB", "251, 191, 36"),
  scenario_3: buildTheme("#16A34A", "#15803D", "#E7F8ED", "22, 163, 74"),
  scenario_4: buildTheme("#38BDF8", "#0EA5E9", "#E0F5FF", "56, 189, 248"),
};

export const SCENARIO_CHART_COLORS = NORMALIZED_SWAT_SCENARIO_CODES.map(
  (code) => SCENARIO_COLORS[code].chart
);

export function resolveScenarioCode(
  scenarioCode?: string | null,
  runId?: number | null
): NormalizedSwatScenarioCode | null {
  const code = String(scenarioCode || "").trim();
  if (isNormalizedSwatScenarioCode(code)) return code;
  if (runId != null && SCENARIO_RUN_ID_TO_CODE[runId]) {
    return SCENARIO_RUN_ID_TO_CODE[runId];
  }
  return null;
}

export function getScenarioColorTheme(
  scenarioCode?: string | null,
  runId?: number | null
): ScenarioColorTheme {
  const resolved = resolveScenarioCode(scenarioCode, runId);
  if (!resolved) return DEFAULT_THEME;
  return SCENARIO_COLORS[resolved];
}

export function getScenarioChartColor(
  scenarioCode?: string | null,
  runId?: number | null
): string {
  return getScenarioColorTheme(scenarioCode, runId).chart;
}

export function getScenarioColorByKey(key: ScenarioColorKey): ScenarioColorTheme {
  return SCENARIO_COLORS[SCENARIO_COLOR_KEYS[key]];
}

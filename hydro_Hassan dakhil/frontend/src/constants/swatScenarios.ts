export const NORMALIZED_SWAT_SCENARIO_CODES = [
  "etat_actuel",
  "ssp126",
  "ssp245",
  "ssp585",
  "scenario_1",
  "scenario_2",
  "scenario_3",
  "scenario_4",
] as const;

export type NormalizedSwatScenarioCode =
  (typeof NORMALIZED_SWAT_SCENARIO_CODES)[number];

export type NormalizedSwatScenario = {
  code: NormalizedSwatScenarioCode;
  label: string;
};

export const NORMALIZED_SWAT_SCENARIOS: NormalizedSwatScenario[] = [
  { code: "etat_actuel", label: "État actuel" },
  { code: "ssp126", label: "SSP 1-2.6" },
  { code: "ssp245", label: "SSP 2-4.5" },
  { code: "ssp585", label: "SSP 5-8.5" },
  { code: "scenario_1", label: "Scénario 1" },
  { code: "scenario_2", label: "Scénario 2" },
  { code: "scenario_3", label: "Scénario 3" },
  { code: "scenario_4", label: "Scénario 4" },
];

export const NORMALIZED_SWAT_SCENARIO_SET = new Set<string>(
  NORMALIZED_SWAT_SCENARIO_CODES
);

export const NORMALIZED_SWAT_SCENARIO_ORDER = new Map<
  NormalizedSwatScenarioCode,
  number
>(NORMALIZED_SWAT_SCENARIOS.map((item, index) => [item.code, index] as const));

export const HIDDEN_SCENARIO_CODES = new Set<string>([
  "SWAT_OUTPUT",
  "SWAT_OUTPUT_01",
]);

export const LEGACY_SWAT_SCENARIO_CODES = new Set<string>([
  "SWAT_OUTPUT",
  "SWAT_OUTPUT_01",
]);

export function isNormalizedSwatScenarioCode(code: string | null | undefined): code is NormalizedSwatScenarioCode {
  return NORMALIZED_SWAT_SCENARIO_SET.has(String(code || ""));
}

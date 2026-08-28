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
  { code: "etat_actuel", label: "Scénario état actuel" },
  { code: "ssp126", label: "Scénario changement climatique SSP126" },
  { code: "ssp245", label: "Scénario changement climatique SSP245" },
  { code: "ssp585", label: "Scénario changement climatique SSP585" },
  { code: "scenario_1", label: "Scénario reboisement pente 9%" },
  { code: "scenario_2", label: "Scénario reboisement pente 15%" },
  { code: "scenario_3", label: "Scénario reboisement pente 25%" },
  { code: "scenario_4", label: "Scénario reboisement Buffer zone" },
];

export const NORMALIZED_SWAT_SCENARIO_SET = new Set<string>(
  NORMALIZED_SWAT_SCENARIO_CODES
);

export const NORMALIZED_SWAT_SCENARIO_ORDER = new Map<
  NormalizedSwatScenarioCode,
  number
>(NORMALIZED_SWAT_SCENARIOS.map((item, index) => [item.code, index] as const));

export const TECHNICAL_SWAT_IMPORT_SCENARIO_CODE = "SWAT_OUTPUT";
export const TECHNICAL_SWAT_CORE_RUN_CODE = "SWAT_OUTPUT_01";

export const HIDDEN_SCENARIO_CODES = new Set<string>([
  TECHNICAL_SWAT_IMPORT_SCENARIO_CODE,
  TECHNICAL_SWAT_CORE_RUN_CODE,
]);

export const LEGACY_SWAT_SCENARIO_CODES = new Set<string>([
  TECHNICAL_SWAT_IMPORT_SCENARIO_CODE,
  TECHNICAL_SWAT_CORE_RUN_CODE,
]);

export function isNormalizedSwatScenarioCode(code: string | null | undefined): code is NormalizedSwatScenarioCode {
  return NORMALIZED_SWAT_SCENARIO_SET.has(String(code || ""));
}

const SWAT_SCENARIO_LABEL_BY_CODE = new Map<string, string>(
  NORMALIZED_SWAT_SCENARIOS.map((scenario) => [scenario.code, scenario.label])
);

const SWAT_SCENARIO_LABEL_BY_RUN_ID = new Map<number, string>(
  (
    [
      [101, "etat_actuel"],
      [102, "ssp126"],
      [103, "ssp245"],
      [104, "ssp585"],
      [105, "scenario_1"],
      [106, "scenario_2"],
      [107, "scenario_3"],
      [108, "scenario_4"],
    ] as const
  ).map(([runId, code]) => [runId, SWAT_SCENARIO_LABEL_BY_CODE.get(code) || code])
);

/** Display label only — never changes scenario codes or run ids. */
export function resolveSwatScenarioLabel(
  scenarioCode?: string | null,
  fallback?: string | null,
  runId?: number | null
): string {
  const code = String(scenarioCode || "").trim();
  if (code && SWAT_SCENARIO_LABEL_BY_CODE.has(code)) {
    return SWAT_SCENARIO_LABEL_BY_CODE.get(code) as string;
  }

  if (typeof runId === "number" && Number.isFinite(runId) && SWAT_SCENARIO_LABEL_BY_RUN_ID.has(runId)) {
    return SWAT_SCENARIO_LABEL_BY_RUN_ID.get(runId) as string;
  }

  return String(fallback || code || "").trim();
}

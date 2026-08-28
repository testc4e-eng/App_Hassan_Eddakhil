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

export const NORMALIZED_SWAT_SCENARIOS = [
  { run_id: 101, scenario_code: "etat_actuel", scenario_name: "Scénario état actuel" },
  { run_id: 102, scenario_code: "ssp126", scenario_name: "Scénario changement climatique SSP126" },
  { run_id: 103, scenario_code: "ssp245", scenario_name: "Scénario changement climatique SSP245" },
  { run_id: 104, scenario_code: "ssp585", scenario_name: "Scénario changement climatique SSP585" },
  { run_id: 105, scenario_code: "scenario_1", scenario_name: "Scénario reboisement pente 9%" },
  { run_id: 106, scenario_code: "scenario_2", scenario_name: "Scénario reboisement pente 15%" },
  { run_id: 107, scenario_code: "scenario_3", scenario_name: "Scénario reboisement pente 25%" },
  { run_id: 108, scenario_code: "scenario_4", scenario_name: "Scénario reboisement Buffer zone" },
] as const;

export type NormalizedSwatScenario =
  (typeof NORMALIZED_SWAT_SCENARIOS)[number];

export const NORMALIZED_SWAT_SCENARIO_SET = new Set<string>(
  NORMALIZED_SWAT_SCENARIO_CODES
);

export const NORMALIZED_SWAT_SCENARIO_BY_RUN_ID = new Map<number, NormalizedSwatScenario>(
  NORMALIZED_SWAT_SCENARIOS.map((scenario) => [scenario.run_id, scenario])
);

export const NORMALIZED_SWAT_SCENARIO_BY_CODE = new Map<string, NormalizedSwatScenario>(
  NORMALIZED_SWAT_SCENARIOS.map((scenario) => [scenario.scenario_code, scenario])
);

export const LEGACY_SWAT_SCENARIO_CODES = new Set<string>([
  "SWAT_OUTPUT",
  "SWAT_OUTPUT_01",
]);

export const TECHNICAL_SWAT_IMPORT_SCENARIO_CODE = "SWAT_OUTPUT";
export const TECHNICAL_SWAT_CORE_RUN_CODE = "SWAT_OUTPUT_01";

export const TECHNICAL_SWAT_IMPORT_SCENARIO_CODES = new Set<string>([
  TECHNICAL_SWAT_IMPORT_SCENARIO_CODE,
]);

export const TECHNICAL_SWAT_CORE_RUN_CODES = new Set<string>([
  TECHNICAL_SWAT_CORE_RUN_CODE,
]);

export const LEGACY_SWAT_IMPORT_TO_RUN_CODE = new Map<string, string>([
  [TECHNICAL_SWAT_IMPORT_SCENARIO_CODE, TECHNICAL_SWAT_CORE_RUN_CODE],
]);

export function resolveDefaultSwatRunCode(scenarioCode: string): string {
  const code = String(scenarioCode || "").trim();
  if (!code) return TECHNICAL_SWAT_CORE_RUN_CODE;
  return LEGACY_SWAT_IMPORT_TO_RUN_CODE.get(code) || code;
}

export function validateSwatImportCodes(scenarioCode: string, runCode: string): string[] {
  const scenario = String(scenarioCode || "").trim();
  const run = String(runCode || "").trim();
  const errors: string[] = [];

  if (!scenario) {
    errors.push("scenarioCode is required.");
    return errors;
  }

  if (!run) {
    errors.push("runCode is required.");
    return errors;
  }

  if (scenario.startsWith("SWAT_") && !TECHNICAL_SWAT_IMPORT_SCENARIO_CODES.has(scenario)) {
    errors.push(
      `Unsupported technical SWAT scenarioCode "${scenario}". Allowed technical provenance code(s): ${[
        ...TECHNICAL_SWAT_IMPORT_SCENARIO_CODES,
      ].join(", ")}.`
    );
  }

  if (run.startsWith("SWAT_") && !TECHNICAL_SWAT_CORE_RUN_CODES.has(run)) {
    errors.push(
      `Unsupported technical SWAT runCode "${run}". Allowed technical core run code(s): ${[
        ...TECHNICAL_SWAT_CORE_RUN_CODES,
      ].join(", ")}.`
    );
  }

  const expectedRunCode = LEGACY_SWAT_IMPORT_TO_RUN_CODE.get(scenario);
  if (expectedRunCode && run !== expectedRunCode) {
    errors.push(
      `scenarioCode "${scenario}" must use runCode "${expectedRunCode}", received "${run}".`
    );
  }

  if (!expectedRunCode && TECHNICAL_SWAT_CORE_RUN_CODES.has(run)) {
    errors.push(
      `runCode "${run}" is reserved for the legacy technical provenance "${TECHNICAL_SWAT_IMPORT_SCENARIO_CODE}".`
    );
  }

  return errors;
}

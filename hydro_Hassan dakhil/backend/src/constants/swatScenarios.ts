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
  { run_id: 105, scenario_code: "scenario_1", scenario_name: "Scénario changement spatial 1" },
  { run_id: 106, scenario_code: "scenario_2", scenario_name: "Scénario changement spatial 2" },
  { run_id: 107, scenario_code: "scenario_3", scenario_name: "Scénario changement spatial 3" },
  { run_id: 108, scenario_code: "scenario_4", scenario_name: "Scénario changement spatial 4" },
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

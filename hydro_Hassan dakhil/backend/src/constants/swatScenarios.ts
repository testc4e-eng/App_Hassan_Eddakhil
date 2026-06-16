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

export const NORMALIZED_SWAT_SCENARIO_SET = new Set<string>(
  NORMALIZED_SWAT_SCENARIO_CODES
);

export const LEGACY_SWAT_SCENARIO_CODES = new Set<string>([
  "SWAT_OUTPUT",
  "SWAT_OUTPUT_01",
]);

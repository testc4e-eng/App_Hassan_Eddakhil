import {
  NORMALIZED_SWAT_SCENARIO_CODES,
  NORMALIZED_SWAT_SCENARIOS,
  type NormalizedSwatScenarioCode,
} from "./swatScenarios";

export const VISIBLE_SWAT_SCENARIO_CODES = [
  ...NORMALIZED_SWAT_SCENARIO_CODES,
] as const;

export const VISIBLE_AND_OBSERVED_SWAT_SCENARIO_CODES = [
  "OBSERVED",
  ...VISIBLE_SWAT_SCENARIO_CODES,
] as const;

export const VISIBLE_SWAT_SCENARIO_CODE_SET = new Set<string>(
  VISIBLE_SWAT_SCENARIO_CODES
);

export const VISIBLE_AND_OBSERVED_SWAT_SCENARIO_CODE_SET = new Set<string>(
  VISIBLE_AND_OBSERVED_SWAT_SCENARIO_CODES
);

export const VISIBLE_SWAT_SCENARIO_NAME_BY_CODE = new Map<
  NormalizedSwatScenarioCode,
  string
>(
  NORMALIZED_SWAT_SCENARIOS.map((scenario) => [
    scenario.scenario_code,
    scenario.scenario_name,
  ])
);

export type SwatTimeStep = "daily" | "monthly" | "annual";
export type SwatSourceTable =
  | "access.rch_results"
  | "access.sub_results"
  | "access.hru_results";
export type SwatEntityType = "rch" | "sub" | "hru";
export type SwatModuleCode = "hydro" | "erosion";
export type SwatDomain = "hydro" | "sediments" | "solid_yield";
export type SwatCanonicalSource = "CORE" | "ACCESS" | "DYNAMIC" | "HYBRIDE";
export type SwatExposureMode = "MATERIALIZED" | "DYNAMIC";

export interface SwatPropertyDefinition {
  property_id: number;
  standard_name: string;
  name: string;
  unit: string | null;
  description: string;
  module_code: SwatModuleCode;
  domain: SwatDomain;
  source_table: SwatSourceTable;
  source_column: string;
  entity_type: SwatEntityType;
  sort_order: number;
  supported_time_steps: readonly SwatTimeStep[];
  scenario_codes: readonly NormalizedSwatScenarioCode[];
  primary_source: "CORE" | "ACCESS";
  canonical_source: SwatCanonicalSource;
  materialized_core: boolean;
  exposure_mode: SwatExposureMode;
  fallback_strategy: string;
  legacy_catalog_enabled: boolean;
}

export const SWAT_PROPERTY_DEFS = [
  {
    property_id: 31,
    standard_name: "SWAT_FLOW_M3S",
    name: "D\u00e9bit simul\u00e9",
    unit: "m3/s",
    description: "SWAT simulated D\u00e9bits m\u00b3/s at reach outlet.",
    module_code: "hydro",
    domain: "hydro",
    source_table: "access.rch_results",
    source_column: "flow_out_cms",
    entity_type: "rch",
    sort_order: 1001,
    supported_time_steps: ["daily", "monthly", "annual"],
    scenario_codes: VISIBLE_SWAT_SCENARIO_CODES,
    primary_source: "ACCESS",
    canonical_source: "HYBRIDE",
    materialized_core: true,
    exposure_mode: "MATERIALIZED",
    fallback_strategy:
      "Prefer api/core materialized flow when available, fallback to access.rch_results by mapped station/subbasin.",
    legacy_catalog_enabled: true,
  },
  {
    property_id: 91010,
    standard_name: "SWAT_SED_IN_TONS",
    name: "Sediments entrants",
    unit: "tons",
    description: "Simulated sediment inflow at reach outlet.",
    module_code: "erosion",
    domain: "sediments",
    source_table: "access.rch_results",
    source_column: "sed_in_tons",
    entity_type: "rch",
    sort_order: 9001,
    supported_time_steps: ["daily", "monthly", "annual"],
    scenario_codes: VISIBLE_SWAT_SCENARIO_CODES,
    primary_source: "ACCESS",
    canonical_source: "DYNAMIC",
    materialized_core: false,
    exposure_mode: "DYNAMIC",
    fallback_strategy:
      "Read directly from access.rch_results; no core timeseries is materialized for this property.",
    legacy_catalog_enabled: false,
  },
  {
    property_id: 32,
    standard_name: "SWAT_SED_TONS",
    name: "Sediments sortants",
    unit: "tons",
    description: "Simulated sediment out at reach outlet.",
    module_code: "erosion",
    domain: "sediments",
    source_table: "access.rch_results",
    source_column: "sed_out_tons",
    entity_type: "rch",
    sort_order: 9002,
    supported_time_steps: ["daily", "monthly", "annual"],
    scenario_codes: VISIBLE_SWAT_SCENARIO_CODES,
    primary_source: "ACCESS",
    canonical_source: "HYBRIDE",
    materialized_core: true,
    exposure_mode: "MATERIALIZED",
    fallback_strategy:
      "Prefer api/core catalog data when present, fallback to access.rch_results for normalized scenarios and aliases.",
    legacy_catalog_enabled: true,
  },
  {
    property_id: 91011,
    standard_name: "SWAT_SED_CONC_MG_KG",
    name: "Concentration sediments",
    unit: "mg/kg",
    description: "Simulated sediment concentration at reach outlet.",
    module_code: "erosion",
    domain: "sediments",
    source_table: "access.rch_results",
    source_column: "sedconc_mg_kg",
    entity_type: "rch",
    sort_order: 9003,
    supported_time_steps: ["daily", "monthly", "annual"],
    scenario_codes: VISIBLE_SWAT_SCENARIO_CODES,
    primary_source: "ACCESS",
    canonical_source: "DYNAMIC",
    materialized_core: false,
    exposure_mode: "DYNAMIC",
    fallback_strategy:
      "Read directly from access.rch_results; no core timeseries is materialized for this property.",
    legacy_catalog_enabled: false,
  },
  {
    property_id: 33,
    standard_name: "SWAT_SYLDT_HA",
    name: "D\u00e9gradation sp\u00e9cifique (t/ha)",
    unit: "t/ha",
    description: "Simulated sediment yield by subbasin.",
    module_code: "erosion",
    domain: "solid_yield",
    source_table: "access.sub_results",
    source_column: "syld_t_ha",
    entity_type: "sub",
    sort_order: 9004,
    supported_time_steps: ["daily", "monthly", "annual"],
    scenario_codes: VISIBLE_SWAT_SCENARIO_CODES,
    primary_source: "ACCESS",
    canonical_source: "HYBRIDE",
    materialized_core: true,
    exposure_mode: "MATERIALIZED",
    fallback_strategy:
      "Prefer api/core catalog or measurements when present, fallback to access.sub_results for normalized scenarios and aliases.",
    legacy_catalog_enabled: true,
  },
] as const satisfies readonly SwatPropertyDefinition[];

export const SWAT_PROPERTY_BY_STANDARD_NAME = new Map<string, SwatPropertyDefinition>(
  SWAT_PROPERTY_DEFS.map((definition) => [definition.standard_name, definition])
);

export const SWAT_PROPERTY_BY_ID = new Map<number, SwatPropertyDefinition>(
  SWAT_PROPERTY_DEFS.map((definition) => [definition.property_id, definition])
);

export const SWAT_HYDRO_PROPERTY_DEFS: SwatPropertyDefinition[] =
  SWAT_PROPERTY_DEFS.filter((definition) => definition.module_code === "hydro");

export const SWAT_EROSION_PROPERTY_DEFS: SwatPropertyDefinition[] =
  SWAT_PROPERTY_DEFS.filter((definition) => definition.module_code === "erosion");

export const SWAT_DYNAMIC_PROPERTY_DEFS = SWAT_PROPERTY_DEFS.filter(
  (definition) => definition.exposure_mode === "DYNAMIC"
);

export const LEGACY_SWAT_REACH_STANDARD_NAMES = [
  "SWAT_FLOW_M3S",
  "SWAT_SED_TONS",
] as const;

export const SWAT_REACH_SPATIAL_VARIABLES = {
  SED_OUT: {
    accessColumn: "sed_out_tons",
    standardName: "SWAT_SED_TONS",
    unit: "tons",
    label: "Sediment (t)",
  },
  SED_IN: {
    accessColumn: "sed_in_tons",
    standardName: "SWAT_SED_IN_TONS",
    unit: "tons",
    label: "SED_IN",
  },
  FLOW_OUT: {
    accessColumn: "flow_out_cms",
    standardName: "SWAT_FLOW_M3S",
    unit: "m3/s",
    label: "D\u00e9bits m3/s",
  },
  FLOW_IN: {
    accessColumn: "flow_in_cms",
    standardName: "SWAT_FLOW_M3S",
    unit: "m3/s",
    label: "FLOW_IN",
  },
} as const;

export function isVisibleSwatScenarioCode(
  value: string | null | undefined
): value is NormalizedSwatScenarioCode {
  return !!value && VISIBLE_SWAT_SCENARIO_CODE_SET.has(value);
}

export function getSwatPropertyDefinition(
  standardName: string | null | undefined
): SwatPropertyDefinition | null {
  if (!standardName) return null;
  return SWAT_PROPERTY_BY_STANDARD_NAME.get(String(standardName)) || null;
}

export function getSwatPropertiesForModule(
  moduleCode: string
): SwatPropertyDefinition[] {
  return SWAT_PROPERTY_DEFS.filter(
    (definition) => definition.module_code === moduleCode
  );
}

export function getLegacyCatalogBackedSwatProperties(
  moduleCode: string
): SwatPropertyDefinition[] {
  return getSwatPropertiesForModule(moduleCode).filter(
    (definition) => definition.legacy_catalog_enabled
  );
}

export function getLegacyCatalogBackedSwatStandardNames(
  moduleCode: string
): string[] {
  return getLegacyCatalogBackedSwatProperties(moduleCode).map(
    (definition) => definition.standard_name
  );
}

export function buildSwatStandardNameSqlCondition(
  columnName: string,
  standardNames: readonly string[]
): string {
  if (!standardNames.length) {
    return "false";
  }
  if (standardNames.length === 1) {
    return `${columnName} = '${standardNames[0]}'`;
  }
  return `${columnName} IN (${standardNames
    .map((standardName) => `'${standardName}'`)
    .join(", ")})`;
}

export function buildSwatSortCaseSql(
  columnName: string,
  definitions: readonly Pick<SwatPropertyDefinition, "standard_name" | "sort_order">[]
): string {
  if (!definitions.length) {
    return "WHEN 1 = 1 THEN 9999";
  }
  return [
    ...definitions.map(
      (definition) =>
        `WHEN ${columnName} = '${definition.standard_name}' THEN ${definition.sort_order}`
    ),
    "ELSE 9999",
  ].join("\n          ");
}

export function resolveSwatStorageTimeStep(
  scenarioCode: string,
  catalogTimeStep: string
): string {
  const normalizedScenarioCode = String(scenarioCode || "").trim().toLowerCase();
  const normalizedTimeStep = String(catalogTimeStep || "").trim().toLowerCase();

  if (normalizedScenarioCode.startsWith("scenario_")) {
    return "yearly";
  }
  if (normalizedTimeStep === "annual") {
    return "yearly";
  }
  return normalizedTimeStep || "daily";
}

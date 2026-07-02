import type { SpatialTimeseriesResponse } from "@/api/spatial";
import { NORMALIZED_SWAT_SCENARIOS } from "@/constants/swatScenarios";

export type SpatialEntityKind = "barrage" | "subbasin" | "reach" | "station";

export type StationVariableCode =
  | "debit_observed"
  | "debit_simulated"
  | "precipitation"
  | "temperature_mean"
  | "temperature_min"
  | "temperature_max";

/** Variables métier affichées dans le panneau Détails pour une station (liste fixe). */
export type SpatialStationVariableCode =
  | "debit_observed"
  | "debit_simulated"
  | "precipitation";

export type SpatialStationVariableDef = {
  code: SpatialStationVariableCode;
  label: string;
  source: "hydro" | "climate";
  scenario: string;
};

/** Liste métier fixe — ne jamais filtrer selon l'API. */
export const SPATIAL_STATION_VARIABLE_DEFS: SpatialStationVariableDef[] = [
  { code: "debit_observed", label: "Débit observé", source: "hydro", scenario: "OBSERVED" },
  { code: "debit_simulated", label: "Débit simulé", source: "hydro", scenario: "etat_actuel" },
  { code: "precipitation", label: "Précipitation", source: "climate", scenario: "OBSERVED" },
];

export type StationVariableDef = {
  code: StationVariableCode;
  label: string;
  source: "hydro" | "climate";
  scenario: string;
};

export const STATION_VARIABLE_DEFS: StationVariableDef[] = [
  ...SPATIAL_STATION_VARIABLE_DEFS,
  { code: "temperature_mean", label: "Température moyenne", source: "climate", scenario: "OBSERVED" },
  { code: "temperature_min", label: "Température minimale", source: "climate", scenario: "OBSERVED" },
  { code: "temperature_max", label: "Température maximale", source: "climate", scenario: "OBSERVED" },
];

export type ReachVariableCode = "SED_OUT" | "FLOW_OUT";

export type ReachVariableDef = {
  code: ReachVariableCode;
  label: string;
};

/** Liste métier fixe pour un reach — ne jamais filtrer selon l'API. */
export const REACH_VARIABLE_DEFS: ReachVariableDef[] = [
  { code: "SED_OUT", label: "Sediment (t)" },
  { code: "FLOW_OUT", label: "Débits m³/s" },
];

export const SUBBASIN_VARIABLE = {
  code: "SYLDT",
  label: "Dégradation spécifique (t/ha)",
} as const;

export const SPATIAL_SCENARIO_OPTIONS = NORMALIZED_SWAT_SCENARIOS.map((item) => ({
  code: item.code,
  label: item.label,
}));

export function hasSpatialAvailability(response: SpatialTimeseriesResponse | null | undefined) {
  if (!response) return false;
  return (
    response.data.length > 0 ||
    response.availability.daily ||
    response.availability.monthly ||
    response.availability.annual
  );
}

export function entityKindLabel(kind: SpatialEntityKind) {
  if (kind === "barrage") return "Barrage sélectionné";
  if (kind === "subbasin") return "Sous-bassin sélectionné";
  if (kind === "reach") return "Tronçon hydro sélectionné";
  return "Station sélectionnée";
}

export function buildEmptyStationVariableAvailability(): Record<SpatialStationVariableCode, boolean> {
  return {
    debit_observed: false,
    debit_simulated: false,
    precipitation: false,
  };
}

export function buildEmptyReachVariableAvailability(): Record<ReachVariableCode, boolean> {
  return {
    SED_OUT: false,
    FLOW_OUT: false,
  };
}

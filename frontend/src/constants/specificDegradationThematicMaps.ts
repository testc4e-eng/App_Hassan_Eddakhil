import {
  NORMALIZED_SWAT_SCENARIOS,
  type NormalizedSwatScenarioCode,
} from "@/constants/swatScenarios";

export const SPECIFIC_DEGRADATION_THEMATIC_MAPS_MANIFEST_URL =
  "/data/hassan/degradation-maps/manifest.json";

export type SpecificDegradationThematicMapEntry = {
  id: string;
  scenarioCode: NormalizedSwatScenarioCode;
  runId: number;
  title: string;
  description: string;
  scenarioLabel: string;
  periodStart: string;
  periodEnd: string;
  subbasinIds: number[] | null;
  pdfPath: string;
  thumbnailPath?: string | null;
  generatedAt?: string | null;
  fileSizeBytes?: number | null;
};

export type SpecificDegradationThematicMapsManifest = {
  version: number;
  maps: SpecificDegradationThematicMapEntry[];
};

const SCENARIO_RUN_IDS: Record<NormalizedSwatScenarioCode, number> = {
  etat_actuel: 101,
  ssp126: 102,
  ssp245: 103,
  ssp585: 104,
  scenario_1: 105,
  scenario_2: 106,
  scenario_3: 107,
  scenario_4: 108,
};

export const DEFAULT_SPECIFIC_DEGRADATION_THEMATIC_MAPS_MANIFEST: SpecificDegradationThematicMapsManifest =
  {
    version: 1,
    maps: NORMALIZED_SWAT_SCENARIOS.map((scenario) => ({
      id: `syldt_ha_${scenario.code}`,
      scenarioCode: scenario.code,
      runId: SCENARIO_RUN_IDS[scenario.code],
      title: `Carte thématique — ${scenario.label}`,
      description:
        "Carte choroplèthe de la dégradation spécifique (t/ha) par sous-bassin du bassin Hassan Addakhil.",
      scenarioLabel: scenario.label,
      periodStart: "1995-01-01",
      periodEnd: "2023-08-31",
      subbasinIds: null,
      pdfPath: `/data/hassan/degradation-maps/${scenario.code}/degradation_specifique.pdf`,
      thumbnailPath: `/data/hassan/degradation-maps/${scenario.code}/thumbnail.jpg`,
      generatedAt: null,
      fileSizeBytes: null,
    })),
  };

/** Liste fixe des 8 scénarios — toujours affichés dans la section cartes thématiques. */
export const THEMATIC_MAP_SCENARIOS = DEFAULT_SPECIFIC_DEGRADATION_THEMATIC_MAPS_MANIFEST.maps;

export function periodsOverlap(
  mapStart: string,
  mapEnd: string,
  filterStart: string,
  filterEnd: string
): boolean {
  if (!filterStart || !filterEnd) return true;
  if (!mapStart || !mapEnd) return true;
  return mapStart <= filterEnd && mapEnd >= filterStart;
}

export function mapMatchesSubbasin(
  entry: SpecificDegradationThematicMapEntry,
  subbasinId: number | null
): boolean {
  if (!entry.subbasinIds?.length) return true;
  if (subbasinId == null) return false;
  return entry.subbasinIds.includes(subbasinId);
}

export function formatFileSize(bytes?: number | null): string | null {
  if (bytes == null || !Number.isFinite(bytes) || bytes <= 0) return null;
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

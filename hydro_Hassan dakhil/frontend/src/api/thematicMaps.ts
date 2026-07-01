// frontend/src/api/thematicMaps.ts
import type { FeatureCollection } from "@/api/spatial";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "/api/v1";

export type ThematicMapMeta = {
  scenario_code: string;
  variable: string;
  aggregation: string;
  start_year: number | null;
  end_year: number | null;
  min_value: number | null;
  max_value: number | null;
  unit: string;
  count: number;
};

export type ThematicMapResponse = {
  success: boolean;
  data: {
    type: "FeatureCollection";
    features: FeatureCollection["features"];
    meta: ThematicMapMeta;
  };
};

export async function fetchSubbasinVulnerability(params: {
  scenarioCode?: string;
  startYear?: number;
  endYear?: number;
  aggregation?: string;
}): Promise<ThematicMapResponse> {
  const search = new URLSearchParams();
  if (params.scenarioCode) search.set("scenarioCode", params.scenarioCode);
  if (params.startYear != null) search.set("startYear", String(params.startYear));
  if (params.endYear != null) search.set("endYear", String(params.endYear));
  if (params.aggregation) search.set("aggregation", params.aggregation);

  const response = await fetch(`${API_BASE}/maps/thematic/subbasins/vulnerability?${search.toString()}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch subbasin vulnerability: ${response.status}`);
  }
  return response.json();
}

export async function fetchReachSediment(params: {
  scenarioCode?: string;
  startYear?: number;
  endYear?: number;
  aggregation?: string;
}): Promise<ThematicMapResponse> {
  const search = new URLSearchParams();
  if (params.scenarioCode) search.set("scenarioCode", params.scenarioCode);
  if (params.startYear != null) search.set("startYear", String(params.startYear));
  if (params.endYear != null) search.set("endYear", String(params.endYear));
  if (params.aggregation) search.set("aggregation", params.aggregation);

  const response = await fetch(`${API_BASE}/maps/thematic/reaches/sediment?${search.toString()}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch reach sediment: ${response.status}`);
  }
  return response.json();
}

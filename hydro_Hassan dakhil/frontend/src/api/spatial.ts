// frontend/src/api/spatial.ts
export type Geometry = {
  type: string;
  coordinates: unknown;
};

export type Feature<P = Record<string, unknown>> = {
  type: "Feature";
  geometry: Geometry;
  properties: P;
};

export type FeatureCollection<P = Record<string, unknown>> = {
  type: "FeatureCollection";
  features: Array<Feature<P>>;
};

export type ProjectSpatialData = {
  stations: FeatureCollection;
  basins: FeatureCollection;
  subbasins: FeatureCollection;
  reaches: FeatureCollection;
  barrages: FeatureCollection;
};

type ApiResponse<T> = { success: boolean; data: T; error?: string };

const API_BASE = import.meta.env.VITE_API_BASE ?? "/api/v1";

async function getJSON<T>(url: string): Promise<T> {
  const r = await fetch(url);
  const j = (await r.json()) as ApiResponse<T>;
  if (!r.ok || !j.success) throw new Error(j.error || "API error");
  return j.data;
}

// ====== Spatial fetchers ======
export function fetchBasins() {
  return getJSON<FeatureCollection>(`${API_BASE}/spatial/basins`);
}

export function fetchBarrages() {
  return getJSON<FeatureCollection>(`${API_BASE}/spatial/barrages`);
}

export function fetchSubBasins(params?: { catchmentId?: number; barrageId?: number }) {
  const search = new URLSearchParams();
  if (params?.catchmentId != null) search.set("catchmentId", String(params.catchmentId));
  if (params?.barrageId != null) search.set("barrageId", String(params.barrageId));
  const qs = search.toString() ? `?${search.toString()}` : "";
  return getJSON<FeatureCollection>(`${API_BASE}/spatial/subbasins${qs}`);
}

export function fetchReaches(params?: { subbasinId?: number }) {
  const qs =
    params?.subbasinId != null ? `?subbasinId=${params.subbasinId}` : "";
  return getJSON<FeatureCollection>(`${API_BASE}/spatial/reaches${qs}`);
}

export function fetchStations(params?: { catchmentId?: number }) {
  const qs =
    params?.catchmentId != null ? `?catchmentId=${params.catchmentId}` : "";
  return getJSON<FeatureCollection>(`${API_BASE}/spatial/stations${qs}`);
}

export function fetchProjectHassanAddakhil() {
  return getJSON<ProjectSpatialData>(`${API_BASE}/spatial/project-hassan-addakhil`);
}

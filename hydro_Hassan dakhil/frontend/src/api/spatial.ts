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

export type ReachTimeseriesResponse = {
  reachId: number;
  reachCode?: number | null;
  subbasinId?: number | null;
  catchmentId?: number | null;
  subCode: number;
  scenarioCode: string;
  periodStart: number | null;
  periodEnd: number | null;
  series: Array<{
    year?: number;
    period?: string;
    flow_out_cms: number | null;
    flow_in_cms: number | null;
    sed_out_tons: number | null;
    sed_in_tons: number | null;
    n?: number;
  }>;
};

export type SpatialAggregationAvailability = {
  daily: boolean;
  monthly: boolean;
  annual: boolean;
};

export type SpatialTimeseriesResponse = {
  entityType: "subbasin" | "reach" | "station";
  entityId: string;
  variable: string;
  unit: string;
  aggregation: "daily" | "monthly" | "annual";
  data: Array<{ date: string; value: number | null }>;
  availability: SpatialAggregationAvailability;
};

export type SpatialScenarioAvailabilityItem = {
  code: string;
  label: string;
  available: boolean;
};

export type SpatialScenariosAvailabilityResponse = {
  entityType: "subbasin" | "reach" | "station";
  entityId: string;
  variable: string;
  availableScenarios: string[];
  scenarios: SpatialScenarioAvailabilityItem[];
};

type ApiResponse<T> = { success: boolean; data: T; error?: string };

const API_BASE = import.meta.env.VITE_API_BASE ?? "/api/v1";
const spatialCache = new Map<string, Promise<unknown>>();

function cacheRequest<T>(key: string, loader: () => Promise<T>): Promise<T> {
  const existing = spatialCache.get(key);
  if (existing) return existing as Promise<T>;

  const promise = loader().catch((error) => {
    spatialCache.delete(key);
    throw error;
  });
  spatialCache.set(key, promise);
  return promise;
}

async function getJSON<T>(url: string, signal?: AbortSignal): Promise<T> {
  const r = await fetch(url, signal ? { signal } : undefined);
  const j = (await r.json()) as ApiResponse<T>;
  if (!r.ok || !j.success) throw new Error(j.error || "API error");
  return j.data;
}

function fetchTimeseriesCached<T>(url: string, signal?: AbortSignal): Promise<T> {
  if (signal) return getJSON<T>(url, signal);
  return cacheRequest(url, () => getJSON<T>(url));
}

async function getRawJSON<T>(url: string): Promise<T> {
  const r = await fetch(url);
  if (!r.ok) {
    throw new Error(`HTTP ${r.status} ${r.statusText}`);
  }
  return (await r.json()) as T;
}

// ====== Spatial fetchers ======
export function fetchBasins() {
  const url = `${API_BASE}/spatial/basins`;
  return cacheRequest(url, () => getJSON<FeatureCollection>(url));
}

export function fetchBarrages() {
  const url = `${API_BASE}/spatial/barrages`;
  return cacheRequest(url, () => getJSON<FeatureCollection>(url));
}

export function fetchSubBasins(params?: { catchmentId?: number; barrageId?: number }) {
  const search = new URLSearchParams();
  if (params?.catchmentId != null) search.set("catchmentId", String(params.catchmentId));
  if (params?.barrageId != null) search.set("barrageId", String(params.barrageId));
  const qs = search.toString() ? `?${search.toString()}` : "";
  const url = `${API_BASE}/spatial/subbasins${qs}`;
  return cacheRequest(url, () => getJSON<FeatureCollection>(url));
}

export function fetchReaches(params?: {
  subbasinId?: number;
  catchmentId?: number;
  includeSummary?: boolean;
}) {
  const search = new URLSearchParams();
  if (params?.subbasinId != null) search.set("subbasinId", String(params.subbasinId));
  if (params?.catchmentId != null) search.set("catchmentId", String(params.catchmentId));
  if (params?.includeSummary === false) search.set("summary", "false");
  const qs = search.toString() ? `?${search.toString()}` : "";
  const url = `${API_BASE}/spatial/reaches${qs}`;
  return cacheRequest(url, () => getJSON<FeatureCollection>(url));
}

export function fetchReachTimeseries(
  reachId: number,
  params?: {
    scenarioCode?: string;
    interval?: "day" | "month" | "year";
    startDate?: string;
    endDate?: string;
  }
) {
  const search = new URLSearchParams({
    scenarioCode: params?.scenarioCode ?? "etat_actuel",
  });
  if (params?.interval) search.set("interval", params.interval);
  if (params?.startDate) search.set("startDate", params.startDate);
  if (params?.endDate) search.set("endDate", params.endDate);
  const url = `${API_BASE}/spatial/reaches/${reachId}/timeseries?${search.toString()}`;
  return cacheRequest(url, () => getJSON<ReachTimeseriesResponse>(url));
}

export function fetchSubbasinTimeseries(
  subbasinId: number,
  params?: {
    variable?: string;
    scenario?: string;
    aggregation?: "day" | "month" | "year";
    startDate?: string;
    endDate?: string;
  },
  options?: { signal?: AbortSignal }
) {
  const search = new URLSearchParams();
  if (params?.variable) search.set("variable", params.variable);
  if (params?.scenario) search.set("scenario", params.scenario);
  if (params?.aggregation) search.set("aggregation", params.aggregation);
  if (params?.startDate) search.set("startDate", params.startDate);
  if (params?.endDate) search.set("endDate", params.endDate);
  const qs = search.toString() ? `?${search.toString()}` : "";
  const url = `${API_BASE}/spatial/subbasins/${subbasinId}/timeseries${qs}`;
  return fetchTimeseriesCached<SpatialTimeseriesResponse>(url, options?.signal);
}

export function fetchReachVariableTimeseries(
  reachId: number,
  params?: {
    variable?: "SED_OUT" | "SED_IN" | "FLOW_OUT" | "FLOW_IN";
    scenario?: string;
    aggregation?: "day" | "month" | "year";
    startDate?: string;
    endDate?: string;
  },
  options?: { signal?: AbortSignal }
) {
  const search = new URLSearchParams();
  if (params?.variable) search.set("variable", params.variable);
  if (params?.scenario) search.set("scenarioCode", params.scenario);
  if (params?.aggregation) search.set("interval", params.aggregation);
  if (params?.startDate) search.set("startDate", params.startDate);
  if (params?.endDate) search.set("endDate", params.endDate);
  const qs = search.toString() ? `?${search.toString()}` : "";
  const url = `${API_BASE}/spatial/reaches/${reachId}/timeseries${qs}`;
  return fetchTimeseriesCached<SpatialTimeseriesResponse>(url, options?.signal);
}

export function fetchStationTimeseries(
  stationId: number,
  params?: {
    variable?: "debit_observed" | "debit_simulated";
    scenario?: string;
    aggregation?: "day" | "month" | "year";
    startDate?: string;
    endDate?: string;
  },
  options?: { signal?: AbortSignal }
) {
  const search = new URLSearchParams();
  if (params?.variable) search.set("variable", params.variable);
  if (params?.scenario) search.set("scenario", params.scenario);
  if (params?.aggregation) search.set("aggregation", params.aggregation);
  if (params?.startDate) search.set("startDate", params.startDate);
  if (params?.endDate) search.set("endDate", params.endDate);
  const qs = search.toString() ? `?${search.toString()}` : "";
  const url = `${API_BASE}/spatial/stations/${stationId}/timeseries${qs}`;
  return fetchTimeseriesCached<SpatialTimeseriesResponse>(url, options?.signal);
}

export function fetchStationClimate(
  stationId: number,
  params?: {
    variable?: "precipitation" | "temperature_min" | "temperature_max" | "temperature_mean";
    scenario?: string;
    aggregation?: "day" | "month" | "year";
    startDate?: string;
    endDate?: string;
  },
  options?: { signal?: AbortSignal }
) {
  const search = new URLSearchParams();
  if (params?.variable) search.set("variable", params.variable);
  if (params?.scenario) search.set("scenario", params.scenario);
  if (params?.aggregation) search.set("aggregation", params.aggregation);
  if (params?.startDate) search.set("startDate", params.startDate);
  if (params?.endDate) search.set("endDate", params.endDate);
  const qs = search.toString() ? `?${search.toString()}` : "";
  const url = `${API_BASE}/spatial/stations/${stationId}/climate${qs}`;
  return fetchTimeseriesCached<SpatialTimeseriesResponse>(url, options?.signal);
}

export function fetchStations(params?: { catchmentId?: number }) {
  const qs =
    params?.catchmentId != null ? `?catchmentId=${params.catchmentId}` : "";
  const url = `${API_BASE}/spatial/stations${qs}`;
  return cacheRequest(url, () => getJSON<FeatureCollection>(url));
}

export function fetchProjectHassanAddakhil() {
  const url = `${API_BASE}/spatial/project-hassan-addakhil`;
  return cacheRequest(url, () => getJSON<ProjectSpatialData>(url));
}

export function fetchSpatialScenariosAvailability(
  entityType: "subbasin" | "reach" | "station",
  entityId: number,
  params?: {
    variable?: string;
    aggregation?: "day" | "month" | "year";
    startDate?: string;
    endDate?: string;
  },
  options?: { signal?: AbortSignal }
) {
  const pathSegment =
    entityType === "subbasin" ? "subbasins" : entityType === "reach" ? "reaches" : "stations";
  const search = new URLSearchParams();
  if (params?.variable) search.set("variable", params.variable);
  if (params?.aggregation) search.set("aggregation", params.aggregation);
  if (params?.startDate) search.set("startDate", params.startDate);
  if (params?.endDate) search.set("endDate", params.endDate);
  const qs = search.toString() ? `?${search.toString()}` : "";
  const url = `${API_BASE}/spatial/${pathSegment}/${entityId}/scenarios-availability${qs}`;
  if (options?.signal) return getJSON<SpatialScenariosAvailabilityResponse>(url, options.signal);
  return cacheRequest(url, () => getJSON<SpatialScenariosAvailabilityResponse>(url));
}

// Couches dérivées locales (issues de l'analyse des dossiers de données)
export function fetchSubbasinHruSummary() {
  return getRawJSON<FeatureCollection>("/data/hassan/subbasin_hru_summary.geojson");
}

export function fetchNvStreamNetwork() {
  return getRawJSON<FeatureCollection>("/data/hassan/nv_stream.geojson");
}

export function normalizeNvStreamReachCollection(
  collection: FeatureCollection,
  apiReaches?: FeatureCollection | null
): FeatureCollection {
  const apiBySubbasin = new Map<number, Record<string, unknown>>();
  for (const feature of apiReaches?.features ?? []) {
    const subbasinId = Number(
      feature?.properties?.subbasin_id ?? feature?.properties?.Subbasin ?? NaN
    );
    if (Number.isFinite(subbasinId)) {
      apiBySubbasin.set(subbasinId, (feature.properties ?? {}) as Record<string, unknown>);
    }
  }

  return {
    type: "FeatureCollection",
    features: collection.features.map((feature) => {
      const properties = (feature.properties ?? {}) as Record<string, unknown>;
      const subbasinId = Number(properties.Subbasin ?? properties.subbasin_id ?? properties.id);
      const apiProps = Number.isFinite(subbasinId) ? apiBySubbasin.get(subbasinId) ?? {} : {};
      const reachId = Number(apiProps.id ?? apiProps.reach_id ?? subbasinId);
      const reachCode = apiProps.reach_code ?? properties.reach_code ?? subbasinId;

      return {
        type: "Feature",
        geometry: feature.geometry,
        properties: {
          ...apiProps,
          ...properties,
          id: Number.isFinite(reachId) ? reachId : subbasinId,
          reach_id: Number.isFinite(reachId) ? reachId : subbasinId,
          subbasin_id: subbasinId,
          reach_code: reachCode,
          name:
            properties.name ??
            apiProps.name ??
            (reachCode != null ? `Troncon ${reachCode}` : `Troncon ${subbasinId}`),
        },
      };
    }),
  };
}

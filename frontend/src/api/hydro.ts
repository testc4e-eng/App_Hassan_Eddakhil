// frontend/src/api/hydro.ts
import { apiGet, qs } from "./client";
import type { Station, Catchment, Reservoir, ModelRun } from '../types/hydro';
import { timeseriesApi } from './timeseries';

// Types manquants: on les définit ici pour ne pas bloquer le build.
// Tu pourras ensuite les déplacer dans ../types/hydro.ts si tu veux.

export type HealthResponse = {
  success?: boolean;
  status?: string;
  message?: string;
};

export type DashboardStats = Record<string, any>;

export type FilterOptions = {
  limit?: number;
  stationIds?: number[];
  catchmentIds?: number[];
};

export type TimeseriesCatalogItem = {
  ts_id: number;
  station_id: number;
  station_code?: string;
  station_name?: string;
  station_label?: string;

  property_id: number;
  property_name: string;
  unit?: string | null;

  run_id: number;
  scenario_code?: string;
  scenario_name?: string;

  source_type?: string;
  time_step?: string;

  n_measures?: number;
  dt_min?: string;
  dt_max?: string;
  v_min?: number;
  v_max?: number;
};

export type TimeseriesAggPoint = {
  period: string;
  avg_value: number;
  min_value: number;
  max_value: number;
  n: number;
};

export type TimeseriesDateRange = {
  minDate: string | null;
  maxDate: string | null;
  nPoints: number;
};

export type ReservoirBathymetryPoint = {
  bathy_id: number | null;
  reservoir_id: number | null;
  reservoir_key: string;
  reservoir_code: string | null;
  reservoir_name: string;
  catchment_id: number | null;
  catchment_name: string | null;
  level_m: number | null;
  volume_hm3: number | null;
  area_km2: number | null;
  source: string | null;
  created_at: string | null;
};

export type TimeseriesBundleResponse = {
  stationId: number;
  runId: number;
  module: string;
  catalog: TimeseriesCatalogItem[];
  aggregated: Record<string, TimeseriesAggPoint[]>;
};

export type StationSimulationPoint = {
  date: string;
  observed: number | null;
  simulated: number | null;
  delta: number | null;
  absDelta: number | null;
};

export type StationSimulationSeriesPoint = {
  date: string;
  value: number | null;
};

export type StationSimulationSubbasinPoint = {
  date: string;
  wyldMm: number | null;
  syldTHa: number | null;
  surqMm: number | null;
  gwQMm: number | null;
};

export type StationSimulationMetrics = {
  n: number;
  observedMean: number | null;
  simulatedMean: number | null;
  rmse: number | null;
  nse: number | null;
  r2: number | null;
  pbias: number | null;
};

export type StationSimulationResponse = {
  station: {
    stationId: number;
    stationCode: string;
    stationName: string;
    nvStationName: string;
    subbasinId: number;
    hydroId: number;
    outletId: number;
    sourceLayer: string;
    mappingMethod: string;
    confidenceScore: number;
  };
  scenario: {
    runId: number | null;
    scenarioCode: string;
    scenarioName: string | null;
    importId: number | null;
  };
  observed: {
    tsId: number | null;
    count: number;
    startDate: string | null;
    endDate: string | null;
    points: StationSimulationSeriesPoint[];
  };
  subbasin: {
    count: number;
    startDate: string | null;
    endDate: string | null;
    points: StationSimulationSubbasinPoint[];
  };
  simulated: {
    count: number;
    startDate: string | null;
    endDate: string | null;
    points: StationSimulationSeriesPoint[];
  };
  paired: StationSimulationPoint[];
  metrics: StationSimulationMetrics;
  warnings: string[];
};

export const hydroApi = {
  health: () => apiGet<HealthResponse>("/hydro/health"),

  getStations: (filter?: FilterOptions) => {
    const query = qs({
      limit: filter?.limit,
      stationIds: filter?.stationIds?.length
        ? JSON.stringify(filter.stationIds)
        : undefined,
    });
    return apiGet<Station[]>(`/hydro/stations${query}`);
  },

  getCatchments: (filter?: FilterOptions) => {
    const query = qs({
      catchmentIds: filter?.catchmentIds?.length
        ? JSON.stringify(filter.catchmentIds)
        : undefined,
    });
    return apiGet<Catchment[]>(`/hydro/catchments${query}`);
  },

  getReservoirs: () => apiGet<Reservoir[]>("/hydro/reservoirs"),

  getBathymetry: (reservoirId?: number) => {
    const query = qs({ reservoirId });
    return apiGet<ReservoirBathymetryPoint[]>(`/hydro/bathymetry${query}`);
  },

  getModelRuns: (isObserved?: boolean) => {
    const query = qs({ isObserved });
    return apiGet<ModelRun[]>(`/hydro/model-runs${query}`);
  },

  getDashboardStats: () => apiGet<DashboardStats>("/hydro/stats"),

  getTimeseriesCatalog: (p: {
    stationId: number;
    runId: number;
    module: string;
  }) => {
    return timeseriesApi.catalog(p);
  },

  getTimeseriesDateRange: (p: {
    stationId: number;
    runId?: number;
    propertyId?: number;
    module: string;
  }) => {
    const query = qs(p);
    return apiGet<TimeseriesDateRange>(`/timeseries/date-range${query}`);
  },

  getTimeseriesBundle: (p: {
    stationId: number;
    runId: number;
    module: string;
    agg: "day" | "month" | "year";
    startDate?: string;
    endDate?: string;
  }) => {
    return timeseriesApi.bundle(p);
  },

  getStationSimulations: (
    stationId: number,
    options?: { runId?: number; scenarioCode?: string; startDate?: string; endDate?: string }
  ) => {
    const query = qs({
      runId: options?.runId,
      scenarioCode: options?.scenarioCode,
      startDate: options?.startDate,
      endDate: options?.endDate,
    });
    return apiGet<StationSimulationResponse>(`/stations/${stationId}/simulations${query}`);
  },
};

export async function getDashboardData() {
  const [stations, catchments, reservoirs] = await Promise.all([
    hydroApi.getStations({ limit: 50 }),
    hydroApi.getCatchments(),
    hydroApi.getReservoirs(),
  ]);

  return { stations, catchments, timeseries: [], reservoirs };
}

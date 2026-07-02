export type SolidYieldSubbasin = {
  subbasin_station_id: number;
  subbasin_id: number;
  station_code: string;
  subbasin_name: string;
  runs_count: number;
  points_count: number;
  min_date: string | null;
  max_date: string | null;
};

export type SolidYieldAvailability = {
  subbasin_station_id: number;
  subbasin_id: number;
  station_code: string;
  subbasin_name: string;
  run_id: number;
  scenario_code: string;
  scenario_name: string;
  source_type: string;
  property_id: number;
  property_name: string;
  standard_name: string;
  unit: string | null;
  points_count: number;
  min_date: string | null;
  max_date: string | null;
};

export type SolidYieldPoint = {
  period: string;
  value: number | null;
  n: number;
};

export type SolidYieldStats = {
  min_value: number | null;
  max_value: number | null;
  avg_value: number | null;
  sum_value: number | null;
  n_points: number;
  min_date: string | null;
  max_date: string | null;
};

type ApiResponse<T> = {
  success: boolean;
  data: T;
  count?: number;
  error?: string;
};

const API_BASE = (import.meta as any).env?.VITE_API_BASE || "/api/v1";

async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) throw new Error(await res.text());
  const json = (await res.json()) as ApiResponse<T>;
  if (!json.success) throw new Error(json.error || "Erreur API");
  return json.data;
}

export const solidYieldService = {
  subbasins: () =>
    apiGet<SolidYieldSubbasin[]>("/solid-yield/subbasins"),

  availability: (subbasinStationId?: number) => {
    const qs = new URLSearchParams();
    if (subbasinStationId) qs.set("subbasinStationId", String(subbasinStationId));
    return apiGet<SolidYieldAvailability[]>(
      `/solid-yield/availability${qs.toString() ? `?${qs.toString()}` : ""}`
    );
  },

  timeseries: (args: {
    subbasinStationId: number;
    runId: number;
    interval: "day" | "month" | "year";
    startDate?: string;
    endDate?: string;
  }) => {
    const qs = new URLSearchParams({
      subbasinStationId: String(args.subbasinStationId),
      runId: String(args.runId),
      interval: args.interval,
    });
    if (args.startDate) qs.set("startDate", args.startDate);
    if (args.endDate) qs.set("endDate", args.endDate);
    return apiGet<SolidYieldPoint[]>(`/solid-yield/timeseries?${qs.toString()}`);
  },

  stats: (args: {
    subbasinStationId: number;
    runId: number;
    startDate?: string;
    endDate?: string;
  }) => {
    const qs = new URLSearchParams({
      subbasinStationId: String(args.subbasinStationId),
      runId: String(args.runId),
    });
    if (args.startDate) qs.set("startDate", args.startDate);
    if (args.endDate) qs.set("endDate", args.endDate);
    return apiGet<SolidYieldStats | null>(`/solid-yield/stats?${qs.toString()}`);
  },
};


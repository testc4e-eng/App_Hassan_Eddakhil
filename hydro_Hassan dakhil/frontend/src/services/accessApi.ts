export type AccessEntityType = "sub" | "rch";

export type AccessVariable = {
  variable_code: string;
  variable_name: string;
  unit: string | null;
  module: string | null;
  entity_type: AccessEntityType | null;
  source_table: string | null;
  source_column: string | null;
  description: string | null;
};

export type AccessTimeSeriesRow = {
  import_run_id: number | null;
  entity_type: AccessEntityType;
  entity_id: number | null;
  entity_code: string | null;
  year: number | null;
  mon: number | null;
  period_date: string | null;
  variable_code: string;
  variable_name: string;
  value_num: number | null;
  unit: string | null;
  source_table: string | null;
  source_column: string | null;
  raw_record: Record<string, unknown> | null;
};

async function request<T>(path: string): Promise<T> {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`Access API error: ${response.status}`);
  }
  const payload = await response.json();
  if (!payload?.success) {
    throw new Error(payload?.error || "Access API request failed");
  }
  return payload.data as T;
}

export const accessApi = {
  summary: () => request("/api/v1/access/summary"),
  variables: () => request<AccessVariable[]>("/api/v1/access/variables"),
  importRuns: () => request<Record<string, unknown>[]>("/api/v1/access/import-runs"),
  entities: (entityType: AccessEntityType) =>
    request<Record<string, unknown>[]>(`/api/v1/access/entities?entityType=${entityType}`),
  timeseries: (params: {
    entityType: AccessEntityType;
    entityId?: number;
    variable?: string;
    year?: number;
    limit?: number;
  }) => {
    const search = new URLSearchParams({ entityType: params.entityType });
    if (params.entityId !== undefined) search.set("entityId", String(params.entityId));
    if (params.variable) search.set("variable", params.variable);
    if (params.year !== undefined) search.set("year", String(params.year));
    if (params.limit !== undefined) search.set("limit", String(params.limit));
    return request<AccessTimeSeriesRow[]>(`/api/v1/access/timeseries?${search.toString()}`);
  },
  stats: (params: {
    entityType: AccessEntityType;
    entityId?: number;
    variable?: string;
  }) => {
    const search = new URLSearchParams({ entityType: params.entityType });
    if (params.entityId !== undefined) search.set("entityId", String(params.entityId));
    if (params.variable) search.set("variable", params.variable);
    return request<Record<string, unknown>[]>(`/api/v1/access/stats?${search.toString()}`);
  },
};

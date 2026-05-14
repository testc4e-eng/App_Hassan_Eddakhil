import type {
  ApiEnvelope,
  DataScanAvailability,
  DataScanAnomaly,
  DataScanEntityPeriod,
  DataScanEntityVariableSourcePeriod,
  DataScanGlobalPeriods,
  DataScanRelation,
  DataScanSummary,
  DataScanTableDetail,
  DataScanTableFilters,
  DataScanTableRow,
  DataScanVariablePeriod,
} from "@/types/dataScan";

const API_BASE = import.meta.env.VITE_API_BASE ?? "/api/v1";

async function request<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`);
  const json = (await res.json()) as ApiEnvelope<T>;
  if (!res.ok || !json.success) {
    throw new Error(json.error || `API error: ${path}`);
  }
  return json.data;
}

function makeQuery(filters: DataScanTableFilters): string {
  const search = new URLSearchParams();
  if (filters.schema) search.set("schema", filters.schema);
  if (filters.tableType) search.set("tableType", filters.tableType);
  if (filters.geometryOnly) search.set("geometryOnly", "true");
  if (filters.emptyOnly) search.set("emptyOnly", "true");
  if (filters.anomalousOnly) search.set("anomalousOnly", "true");
  const q = search.toString();
  return q ? `?${q}` : "";
}

export const dataScanService = {
  getSummary: () => request<DataScanSummary>("/data-scan/summary"),
  getTables: (filters: DataScanTableFilters = {}) =>
    request<DataScanTableRow[]>(`/data-scan/tables${makeQuery(filters)}`),
  getTableDetail: (schemaName: string, tableName: string) =>
    request<DataScanTableDetail>(
      `/data-scan/tables/${encodeURIComponent(schemaName)}/${encodeURIComponent(tableName)}`
    ),
  getAnomalies: () => request<DataScanAnomaly[]>("/data-scan/anomalies"),
  getRelations: () => request<DataScanRelation[]>("/data-scan/relations"),
  getPeriodsGlobal: () => request<DataScanGlobalPeriods>("/data-scan/periods/global"),
  getPeriodsByVariable: () =>
    request<DataScanVariablePeriod[]>("/data-scan/periods/by-variable"),
  getPeriodsByEntity: () =>
    request<DataScanEntityPeriod[]>("/data-scan/periods/by-entity"),
  getPeriodsByEntityVariableSource: () =>
    request<DataScanEntityVariableSourcePeriod[]>(
      "/data-scan/periods/by-entity-variable-source"
    ),
  getDataAvailability: () =>
    request<DataScanAvailability>("/data-scan/data-availability"),
};

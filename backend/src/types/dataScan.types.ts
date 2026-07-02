export type ScanSeverity = "critical" | "warning" | "info";

export interface DataScanSummary {
  database_name: string;
  database_size: string;
  schemas: string[];
  extensions: string[];
  tables_count: number;
  views_count: number;
  sequences_count: number;
  pk_count: number;
  fk_count: number;
  total_estimated_rows: number;
  geometry_tables_count: number;
  total_columns: number;
  anomalies_count: number;
}

export interface DataScanTableRow {
  schema_name: string;
  table_name: string;
  table_type: "BASE TABLE" | "VIEW";
  estimated_rows: number;
  columns_count: number;
  has_geometry: boolean;
  has_date: boolean;
  pk_count: number;
  fk_count: number;
  srid_list: number[];
  geometry_types: string[];
  anomaly_count: number;
  quality_status: "good" | "warning" | "critical";
  quality_score: number;
  dashboard_useful: boolean;
}

export interface DataScanColumnInfo {
  column_name: string;
  data_type: string;
  udt_name: string;
  is_nullable: boolean;
  column_default: string | null;
  is_primary_key: boolean;
  is_foreign_key: boolean;
  fk_target: string | null;
}

export interface DataScanIndexInfo {
  index_name: string;
  index_definition: string;
}

export interface DataScanGeometryInfo {
  column_name: string;
  geometry_type: string;
  srid: number;
  invalid_count: number;
}

export interface DataScanDateStat {
  column_name: string;
  min_value: string | null;
  max_value: string | null;
  null_count: number;
}

export interface DataScanNumericStat {
  column_name: string;
  min_value: number | null;
  max_value: number | null;
  avg_value: number | null;
  null_count: number;
}

export interface DataScanAnomaly {
  id: string;
  severity: ScanSeverity;
  scope: "database" | "table" | "column";
  schema_name: string | null;
  table_name: string | null;
  column_name: string | null;
  code: string;
  message: string;
}

export interface DataScanRelation {
  source_schema: string;
  source_table: string;
  source_column: string;
  target_schema: string;
  target_table: string;
  target_column: string;
  relation_type: "foreign_key" | "inferred";
}

export interface DataScanTableDetail {
  schema_name: string;
  table_name: string;
  table_type: "BASE TABLE" | "VIEW";
  estimated_rows: number;
  exact_rows: number;
  dashboard_useful: boolean;
  description: string;
  columns: DataScanColumnInfo[];
  indexes: DataScanIndexInfo[];
  geometry: DataScanGeometryInfo[];
  date_stats: DataScanDateStat[];
  numeric_stats: DataScanNumericStat[];
  sample_rows: Record<string, unknown>[];
  anomalies: DataScanAnomaly[];
}

export interface DataScanTableFilters {
  schema?: string;
  tableType?: "BASE TABLE" | "VIEW";
  geometryOnly?: boolean;
  emptyOnly?: boolean;
  anomalousOnly?: boolean;
}

export type DataScanDataStatus =
  | "avec données"
  | "vide"
  | "dates absentes"
  | "dates incohérentes"
  | "sans données"
  | "absente";

export interface DataScanGlobalPeriodRow {
  schema_name: string;
  table_name: string;
  data_type: string;
  total_rows: number;
  date_column: string | null;
  min_date: string | null;
  max_date: string | null;
  period_label: string;
  null_date_count: number;
  status: DataScanDataStatus;
}

export interface DataScanGlobalPeriods {
  generated_at: string;
  period_min: string | null;
  period_max: string | null;
  period_label: string;
  rows: DataScanGlobalPeriodRow[];
}

export interface DataScanVariablePeriod {
  variable_code: string;
  variable_name: string;
  table_source: string;
  records_count: number;
  stations_count: number;
  basins_count: number;
  sources: string[];
  min_date: string | null;
  max_date: string | null;
  period_label: string;
  status: DataScanDataStatus;
}

export interface DataScanEntityPeriod {
  entity_type: string;
  entity_code: string;
  entity_name: string;
  basin_name: string | null;
  variables: string[];
  sources: string[];
  total_points: number;
  min_date: string | null;
  max_date: string | null;
  period_label: string;
  status: "avec données" | "sans données";
}

export interface DataScanEntityVariableSourcePeriod {
  entity_type: string;
  entity_code: string;
  entity_name: string;
  basin_name: string | null;
  variable_code: string;
  variable_name: string;
  source: string;
  records_count: number;
  min_date: string | null;
  max_date: string | null;
  period_label: string;
}

export interface DataScanAvailability {
  latest_load_batch_id: string | null;
  stations_total: number;
  stations_with_data: number;
  stations_without_data: number;
  reservoirs_total: number;
  reservoirs_with_data: number;
  reservoirs_without_data: number;
  variables_total: number;
  variables_with_data: number;
  variables_without_data: number;
  sources_with_rows: string[];
  tables_with_data_without_date_column: string[];
  tables_with_incoherent_dates: string[];
}

export type SwatVariableCode = "flow_m3s" | "sed_tons" | "syldt_ha";
export type SwatEntityType = "subbasin" | "reach" | "station" | "basin";

export interface SwatBatch {
  batch_id: string;
  batch_name: string | null;
  source_file: string | null;
  imported_at: string;
  status: string;
  row_count: number;
  run_id: number | null;
  scenario_code: string | null;
  notes: string | null;
}

export interface SwatAvailability {
  entity_type: SwatEntityType;
  entity_id: number;
  entity_code: string;
  entity_name: string;
  basin_name: string | null;
  data_type: "observed" | "simulated";
  variable_code: string;
  variable_label: string;
  points_count: number;
  min_date: string;
  max_date: string;
  period_fr: string;
  run_id: number;
  run_name: string;
  scenario_code: string;
  batch_id: string | null;
}

export interface SwatSummary {
  batches_swat: number;
  availability_simulated: number;
  points_simulated: number;
  entities_unique_simulated: number;
  points_reach_simulated: number;
  points_subbasin_simulated: number;
  variables_simulated_available: number;
}

export interface SwatImportPayload {
  mdbPath?: string;
  scenarioCode?: string;
  runCode?: string;
  runName?: string;
  dryRun?: boolean;
  importMode?: "skipAccess" | "import" | "reload" | "preview";
}

export interface SwatImportCounters {
  raw_rch?: number;
  raw_sub?: number;
  norm_rch?: number;
  norm_sub?: number;
  timeseries_inserted?: number;
  measurements_upserted?: number;
}

export interface SwatImportResult {
  batch_id?: string;
  run_id?: number;
  run_code?: string;
  scenario_code?: string;
  access_import_id?: number | null;
  dry_run?: boolean;
  mode?: string;
  counters?: SwatImportCounters;
  logs?: string[];
}

export interface SwatImportAuditReport {
  totalLines: number;
  variables: string[];
  periodMin: string | null;
  periodMax: string | null;
  duplicatesNote: string;
  errors: string[];
  entities: {
    reaches: number;
    subbasins: number;
    timeseries: number;
  };
  scenarios: string[];
  runs: string[];
  accessImportId: string | null;
}

export interface SwatDeletePayload {
  entity_type?: SwatEntityType;
  entity_id?: number;
  variable?: SwatVariableCode;
  source_type?: "simulated" | "observed";
  batch_id?: string;
  period_start?: string;
  period_end?: string;
  run_id?: number;
  confirm?: boolean;
}

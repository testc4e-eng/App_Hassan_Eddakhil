export type SwatEntityType = "subbasin" | "reach" | "station" | "basin";

export type SwatVariableCode = "flow_m3s" | "sed_tons" | "syldt_ha";

export type SwatImportMode = "skipAccess" | "import" | "reload" | "preview";

export interface SwatImportPayload {
  mdbPath?: string;
  scenarioCode?: string;
  runCode?: string;
  runName?: string;
  dryRun?: boolean;
  importMode?: SwatImportMode;
}

export interface SwatDeleteFilterPayload {
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

export interface SwatBatchRow {
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

export interface SwatAvailabilityRow {
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

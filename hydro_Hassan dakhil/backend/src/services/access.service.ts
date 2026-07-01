import { Pool } from "pg";
import Database from "../config/database.config";

type EntityType = "sub" | "rch";

type AccessSummary = {
  import_runs: number;
  variable_count: number;
  sub_rows: number;
  rch_rows: number;
  latest_import: string | null;
};

type AccessVariableRow = {
  variable_code: string;
  variable_name: string;
  unit: string | null;
  module: string | null;
  entity_type: EntityType | null;
  source_table: string | null;
  source_column: string | null;
  description: string | null;
};

type AccessTimeSeriesRow = {
  import_run_id: number | null;
  entity_type: EntityType;
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

type AccessStatsRow = {
  variable_code: string;
  variable_name: string;
  unit: string | null;
  samples: string;
  min_value: number | null;
  max_value: number | null;
  avg_value: number | null;
  first_period: string | null;
  last_period: string | null;
};

const pool = Database.getPool();

const TABLE_BY_ENTITY: Record<EntityType, string> = {
  sub: "access.sub_results",
  rch: "access.rch_results",
};

type TableSpec = {
  table: string;
  entityColumn: string;
  entityCodeColumn: string | null;
  periodColumn: string;
  yearColumn: string | null;
  monColumn: string | null;
  variableCodeColumn: string;
  variableNameColumn: string | null;
  valueColumn: string;
  unitColumn: string | null;
  sourceTableColumn: string | null;
  sourceColumnColumn: string | null;
  rawRecordColumn: string | null;
  importRunColumn: string | null;
};

async function getColumns(table: string): Promise<string[]> {
  const rows = await query<{ column_name: string }>(
    `
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = split_part($1, '.', 1)
      AND table_name = split_part($1, '.', 2)
    ORDER BY ordinal_position
    `,
    [table]
  );
  return rows.map((row) => row.column_name);
}

function pickColumn(columns: string[], candidates: string[]): string | null {
  return candidates.find((candidate) => columns.includes(candidate)) || null;
}

async function getTableSpec(entityType: EntityType): Promise<TableSpec> {
  const table = TABLE_BY_ENTITY[entityType];
  const columns = await getColumns(table);

  const entityColumn =
    pickColumn(columns, [
      "entity_id",
      "entity_code",
      "subbasin_code",
      "sub_code",
      "reach_code",
      "reach_id",
      "code",
      "id",
    ]) || "entity_id";

  const periodColumn =
    pickColumn(columns, ["period_date", "sample_date", "event_date", "ts_date", "date_value"]) || "period_date";

  const variableCodeColumn =
    pickColumn(columns, ["variable_code", "var_code", "property_code", "code"]) || "variable_code";

  const valueColumn = pickColumn(columns, ["value_num", "value", "measurement", "variable_value"]) || "value_num";

  return {
    table,
    entityColumn,
    entityCodeColumn: pickColumn(columns, ["entity_code", "subbasin_code", "sub_code", "reach_code"]),
    periodColumn,
    yearColumn: pickColumn(columns, ["year", "yr"]),
    monColumn: pickColumn(columns, ["mon", "month"]),
    variableCodeColumn,
    variableNameColumn: pickColumn(columns, ["variable_name", "var_name", "name"]),
    valueColumn,
    unitColumn: pickColumn(columns, ["unit", "units"]),
    sourceTableColumn: pickColumn(columns, ["source_table", "origin_table"]),
    sourceColumnColumn: pickColumn(columns, ["source_column", "origin_column"]),
    rawRecordColumn: pickColumn(columns, ["raw_record", "raw_json", "payload"]),
    importRunColumn: pickColumn(columns, ["import_run_id", "run_id"]),
  };
}

async function query<T>(sql: string, params: unknown[] = []): Promise<T[]> {
  const result = await pool.query(sql, params);
  return result.rows as T[];
}

export class AccessService {
  async health() {
    const [db] = await query<{ current_database: string; current_schema: string }>(
      "SELECT current_database(), current_schema()"
    );
    return db;
  }

  async summary(): Promise<AccessSummary> {
    const [row] = await query<AccessSummary>(
      `
      SELECT
        (SELECT COUNT(*)::int FROM access.import_runs) AS import_runs,
        (SELECT COUNT(*)::int FROM access.variable_dictionary) AS variable_count,
        (SELECT COUNT(*)::int FROM access.sub_results) AS sub_rows,
        (SELECT COUNT(*)::int FROM access.rch_results) AS rch_rows,
        (SELECT MAX(started_at)::text FROM access.import_runs) AS latest_import
      `
    );
    return row;
  }

  async listTables() {
    return query<{ table_name: string; row_count: number }>(
      `
      SELECT table_name, row_count
      FROM (
        VALUES
          ('import_runs', (SELECT COUNT(*)::int FROM access.import_runs)),
          ('variable_dictionary', (SELECT COUNT(*)::int FROM access.variable_dictionary)),
          ('sub_results', (SELECT COUNT(*)::int FROM access.sub_results)),
          ('rch_results', (SELECT COUNT(*)::int FROM access.rch_results))
      ) AS t(table_name, row_count)
      ORDER BY table_name
      `
    );
  }

  async listVariables() {
    return query<AccessVariableRow>(
      `
      SELECT
        variable_code,
        variable_label AS variable_name,
        unit,
        module_code AS module,
        entity_type,
        source_table,
        NULL::text AS source_column,
        definition AS description
      FROM access.variable_dictionary
      ORDER BY module_code NULLS LAST, variable_code
      `
    );
  }

  async listImportRuns() {
    return query<Record<string, unknown>>(
      `
      SELECT *
      FROM access.import_runs
      ORDER BY started_at DESC NULLS LAST, import_run_id DESC
      LIMIT 50
      `
    );
  }

  async listEntities(entityType: EntityType) {
    const spec = await getTableSpec(entityType);
    return query<Record<string, unknown>>(
      `
      SELECT
        ${spec.entityColumn} AS entity_id,
        ${spec.entityCodeColumn || spec.entityColumn} AS entity_code,
        MIN(${spec.periodColumn})::text AS first_period,
        MAX(${spec.periodColumn})::text AS last_period,
        COUNT(*)::int AS sample_count
      FROM ${spec.table}
      GROUP BY ${spec.entityColumn}, ${spec.entityCodeColumn || spec.entityColumn}
      ORDER BY ${spec.entityColumn} NULLS LAST
      `
    );
  }

  async listTimeSeries(params: {
    entityType: EntityType;
    entityId?: number;
    variableCode?: string;
    year?: number;
    limit?: number;
  }) {
    const spec = await getTableSpec(params.entityType);
    const where: string[] = ["1=1"];
    const values: unknown[] = [];

    if (typeof params.entityId === "number" && Number.isFinite(params.entityId)) {
      values.push(params.entityId);
      where.push(`${spec.entityColumn} = $${values.length}`);
    }

    if (params.variableCode) {
      values.push(params.variableCode);
      where.push(`${spec.variableCodeColumn} = $${values.length}`);
    }

    if (typeof params.year === "number" && Number.isFinite(params.year)) {
      values.push(params.year);
      if (spec.yearColumn) {
        where.push(`${spec.yearColumn} = $${values.length}`);
      }
    }

    const limit = Math.min(Math.max(params.limit ?? 500, 1), 5000);
    values.push(limit);

    return query<AccessTimeSeriesRow>(
      `
      SELECT
        ${spec.importRunColumn || "NULL::bigint"} AS import_run_id,
        '${params.entityType}'::text AS entity_type,
        ${spec.entityColumn} AS entity_id,
        ${spec.entityCodeColumn || "NULL::text"} AS entity_code,
        ${spec.yearColumn || "NULL::int"} AS year,
        ${spec.monColumn || "NULL::int"} AS mon,
        ${spec.periodColumn}::text AS period_date,
        ${spec.variableCodeColumn} AS variable_code,
        ${spec.variableNameColumn || `${spec.variableCodeColumn}`} AS variable_name,
        ${spec.valueColumn} AS value_num,
        ${spec.unitColumn || "NULL::text"} AS unit,
        ${spec.sourceTableColumn || "NULL::text"} AS source_table,
        ${spec.sourceColumnColumn || "NULL::text"} AS source_column,
        ${spec.rawRecordColumn || "NULL::jsonb"} AS raw_record
      FROM ${spec.table}
      WHERE ${where.join(" AND ")}
      ORDER BY ${spec.periodColumn} NULLS LAST, ${spec.entityColumn} NULLS LAST, ${spec.variableCodeColumn}
      LIMIT $${values.length}
      `,
      values
    );
  }

  async stats(params: {
    entityType: EntityType;
    entityId?: number;
    variableCode?: string;
  }) {
    const spec = await getTableSpec(params.entityType);
    const where: string[] = [`${spec.valueColumn} IS NOT NULL`];
    const values: unknown[] = [];

    if (typeof params.entityId === "number" && Number.isFinite(params.entityId)) {
      values.push(params.entityId);
      where.push(`${spec.entityColumn} = $${values.length}`);
    }

    if (params.variableCode) {
      values.push(params.variableCode);
      where.push(`${spec.variableCodeColumn} = $${values.length}`);
    }

    return query<AccessStatsRow>(
      `
      SELECT
        ${spec.variableCodeColumn} AS variable_code,
        ${spec.variableNameColumn || spec.variableCodeColumn} AS variable_name,
        ${spec.unitColumn || "NULL::text"} AS unit,
        COUNT(*)::text AS samples,
        MIN(${spec.valueColumn}) AS min_value,
        MAX(${spec.valueColumn}) AS max_value,
        AVG(${spec.valueColumn}) AS avg_value,
        MIN(${spec.periodColumn})::text AS first_period,
        MAX(${spec.periodColumn})::text AS last_period
      FROM ${spec.table}
      WHERE ${where.join(" AND ")}
      GROUP BY ${spec.variableCodeColumn}, ${spec.variableNameColumn || spec.variableCodeColumn}, ${spec.unitColumn || "NULL"}
      ORDER BY ${spec.variableCodeColumn}
      `,
      values
    );
  }
}

export const accessService = new AccessService();

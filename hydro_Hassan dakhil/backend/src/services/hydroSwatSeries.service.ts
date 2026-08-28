import { DatabaseService } from "./database.service";
import {
  getNativeGranularityFromRows,
  pickSourceTimeStep,
} from "../utils/aggregationAvailability";
import {
  NORMALIZED_SWAT_SCENARIOS,
  NORMALIZED_SWAT_SCENARIO_BY_CODE,
  NORMALIZED_SWAT_SCENARIO_BY_RUN_ID,
  type NormalizedSwatScenarioCode,
} from "../constants/swatScenarios";
import {
  SWAT_HYDRO_PROPERTY_DEFS,
  VISIBLE_SWAT_SCENARIO_CODES,
} from "../constants/swatDataSources";

const CANONICAL_SCENARIOS = VISIBLE_SWAT_SCENARIO_CODES;

type CanonicalScenarioCode = NormalizedSwatScenarioCode;
type AggInterval = "day" | "month" | "year";
type HydroTimeStep = "daily" | "monthly" | "annual";
type HydroSourceTable = "access.rch_results" | "access.sub_results" | "access.hru_results";
type HydroEntityType = "rch" | "sub" | "hru";

export interface HydroVariableDef {
  property_id: number;
  standard_name: string;
  name: string;
  unit: string | null;
  description: string;
  source_table: HydroSourceTable;
  source_column: string;
  entity_type: HydroEntityType;
  sort_order: number;
}

export interface HydroAvailabilityRow {
  ts_id: number;
  module_code: "hydro";
  station_id: number;
  station_code: string;
  station_name: string;
  station_label: string;
  property_id: number;
  property_name: string;
  unit: string | null;
  standard_name: string;
  run_id: number;
  scenario_code: string;
  scenario_name: string;
  source_type: "simulated";
  time_step: HydroTimeStep;
  n_measures: number;
  dt_min: string | null;
  dt_max: string | null;
  v_min: number | null;
  v_max: number | null;
  created_at: string | null;
  period_days: number | null;
}

export interface HydroCatalogRow {
  ts_id: number;
  station_id: number;
  station_code: string;
  station_name: string;
  property_id: number;
  property_name: string;
  unit: string | null;
  standard_name: string;
  run_id: number;
  scenario_code: string;
  scenario_name: string;
  source_type: string;
  time_step: HydroTimeStep;
  ts_created_at: string;
  n_points: number | null;
  start_date: string | null;
  end_date: string | null;
}

export interface HydroDateRangeRow {
  min_date: string | null;
  max_date: string | null;
  n_points: number;
}

export interface HydroSeriesPoint {
  date: string;
  value: number | null;
}

export interface HydroAggregatedRow {
  period: string;
  avg_value: number | null;
  min_value: number | null;
  max_value: number | null;
  n: number;
}

export interface HydroBundleResult {
  catalog: HydroCatalogRow[];
  aggregated: Record<string, HydroAggregatedRow[]>;
}

type StationMappingRow = {
  station_id: number;
  station_code: string;
  station_name: string;
  subbasin_id: number;
};

type ScenarioRow = {
  run_id: number;
  scenario_code: string;
  scenario_name: string;
};

type AvailabilitySummaryRow = {
  station_id: number;
  station_code: string;
  station_name: string;
  run_id: number;
  scenario_code: string;
  scenario_name: string;
  time_step: HydroTimeStep;
  property_id: number;
  property_name: string;
  unit: string | null;
  standard_name: string;
  n_measures: string | number;
  dt_min: string | null;
  dt_max: string | null;
  v_min: string | number | null;
  v_max: string | number | null;
  created_at: string | null;
  rn?: string | number;
};

type RawSeriesRow = {
  period_date: string;
  value: number | string | null;
};

const BASE_VARIABLE_DEFS: HydroVariableDef[] = SWAT_HYDRO_PROPERTY_DEFS.map(
  ({
    property_id,
    standard_name,
    name,
    unit,
    description,
    source_table,
    source_column,
    entity_type,
    sort_order,
  }) => ({
    property_id,
    standard_name,
    name,
    unit,
    description,
    source_table,
    source_column,
    entity_type,
    sort_order,
  })
);

function toNumber(value: number | string | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

function toDateKey(value: string): string {
  return String(value).slice(0, 10);
}

function periodKey(date: string, agg: AggInterval): string {
  const d = new Date(`${date.slice(0, 10)}T00:00:00Z`);
  if (!Number.isFinite(d.getTime())) return date.slice(0, 10);

  if (agg === "year") {
    return `${d.getUTCFullYear()}-01-01`;
  }

  if (agg === "month") {
    const month = String(d.getUTCMonth() + 1).padStart(2, "0");
    return `${d.getUTCFullYear()}-${month}-01`;
  }

  return date.slice(0, 10);
}

function aggregateSeries(rows: HydroSeriesPoint[], agg: AggInterval): HydroAggregatedRow[] {
  const map = new Map<
    string,
    {
      sum: number;
      min: number;
      max: number;
      n: number;
    }
  >();

  for (const row of rows) {
    if (row.value === null || !Number.isFinite(row.value)) continue;
    const key = periodKey(row.date, agg);
    const existing = map.get(key) || {
      sum: 0,
      min: Number.POSITIVE_INFINITY,
      max: Number.NEGATIVE_INFINITY,
      n: 0,
    };
    existing.sum += row.value;
    existing.min = Math.min(existing.min, row.value);
    existing.max = Math.max(existing.max, row.value);
    existing.n += 1;
    map.set(key, existing);
  }

  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([period, stats]) => ({
      period,
      avg_value: stats.n ? stats.sum / stats.n : null,
      min_value: stats.n ? stats.min : null,
      max_value: stats.n ? stats.max : null,
      n: stats.n,
    }));
}

export class HydroSwatSeriesService {
  private db = new DatabaseService();
  private availabilityCache: Promise<HydroAvailabilityRow[]> | null = null;
  private variableDefsCache: Promise<HydroVariableDef[]> | null = null;

  private async query<T>(sql: string, params: unknown[] = []) {
    return this.db.query<T>(sql, params);
  }

  private async queryOne<T>(sql: string, params: unknown[] = []) {
    return this.db.queryOne<T>(sql, params);
  }

  private async resolveScenario(runId?: number): Promise<ScenarioRow | null> {
    if (typeof runId === "number" && Number.isFinite(runId)) {
      const virtualScenario = NORMALIZED_SWAT_SCENARIO_BY_RUN_ID.get(runId);
      if (virtualScenario) {
        return {
          run_id: virtualScenario.run_id,
          scenario_code: virtualScenario.scenario_code,
          scenario_name: virtualScenario.scenario_name,
        };
      }

      return this.queryOne<ScenarioRow>(
        `
        SELECT run_id, scenario_code, scenario_name
        FROM public.model_runs
        WHERE run_id = $1
          AND is_observed = false
        LIMIT 1
        `,
        [runId]
      );
    }

    return this.queryOne<ScenarioRow>(
      `
      SELECT run_id, scenario_code, scenario_name
      FROM public.model_runs
      WHERE is_observed = false
      ORDER BY run_id DESC
      LIMIT 1
      `
    );
  }

  private async resolveAccessScenarioCode(preferredScenarioCode?: string): Promise<string> {
    const preferred = preferredScenarioCode?.trim();
    if (preferred) {
      const preferredRow = await this.queryOne<{ scenario_code: string }>(
        `
        SELECT scenario_code
        FROM access.rch_results
        WHERE scenario_code = $1
        LIMIT 1
        `,
        [preferred]
      );
      if (preferredRow?.scenario_code) {
        return preferredRow.scenario_code;
      }
    }

    const latest = await this.queryOne<{ scenario_code: string }>(
      `
      SELECT scenario_code
      FROM access.rch_results
      ORDER BY import_id DESC
      LIMIT 1
      `
    );

    return latest?.scenario_code || preferred || "etat_actuel";
  }

  private expandVirtualScenarioRows(rows: HydroAvailabilityRow[]): HydroAvailabilityRow[] {
    return rows.flatMap((row) =>
      NORMALIZED_SWAT_SCENARIOS.map((scenario) => ({
        ...row,
        ts_id: this.syntheticTsId(
          scenario.run_id,
          row.station_id,
          row.property_id,
          row.time_step
        ),
        run_id: scenario.run_id,
        scenario_code: scenario.scenario_code,
        scenario_name: scenario.scenario_name,
      }))
    );
  }

  private async resolveMapping(stationId: number): Promise<StationMappingRow | null> {
    return this.queryOne<StationMappingRow>(
      `
      SELECT
        m.station_id,
        s.station_code,
        s.name AS station_name,
        m.subbasin_id
      FROM core.station_subbasin_map m
      JOIN core.stations s
        ON s.station_id = m.station_id
      WHERE m.station_id = $1
        AND m.is_active = true
      ORDER BY m.is_primary DESC, m.updated_at DESC, m.id DESC
      LIMIT 1
      `,
      [stationId]
    );
  }

  private isCanonicalScenarioCode(code: string | null | undefined): code is CanonicalScenarioCode {
    return !!code && (CANONICAL_SCENARIOS as readonly string[]).includes(code);
  }

  private getHydroVariableDefs(): Promise<HydroVariableDef[]> {
    if (!this.variableDefsCache) {
      this.variableDefsCache = Promise.resolve(BASE_VARIABLE_DEFS);
    }
    return this.variableDefsCache;
  }

  private async getAvailabilityRowsFromMatView(): Promise<HydroAvailabilityRow[]> {
    const scenarioCodes = CANONICAL_SCENARIOS;
    const rows = await this.query<AvailabilitySummaryRow>(
      `
      SELECT
        station_id,
        station_code,
        station_name,
        run_id,
        scenario_code,
        scenario_name,
        time_step,
        property_id,
        property_name,
        unit,
        standard_name,
        n_measures,
        dt_min,
        dt_max,
        v_min,
        v_max,
        created_at
      FROM api.mv_hydro_station_stats
      WHERE scenario_code = ANY($1::text[])
      ORDER BY
        station_id,
        run_id,
        property_id,
        CASE time_step
          WHEN 'daily' THEN 1
          WHEN 'monthly' THEN 2
          WHEN 'annual' THEN 3
          ELSE 99
        END;
      `,
      [scenarioCodes]
    );

    const propertyRows = new Map<number, HydroVariableDef>();
    for (const def of await this.getHydroVariableDefs()) {
      propertyRows.set(def.property_id, def);
    }

    const allRows: HydroAvailabilityRow[] = [];
    const seenKeys = new Set<string>();

    for (const row of rows) {
      const timeStep = String(row.time_step) as HydroTimeStep;
      const key = `${row.station_id}:${row.run_id}:${row.property_id}:${timeStep}`;
      if (seenKeys.has(key)) continue;
      seenKeys.add(key);

      const def = propertyRows.get(Number(row.property_id));
      if (!def) continue;

      const tsId = this.syntheticTsId(
        Number(row.run_id),
        Number(row.station_id),
        def.property_id,
        timeStep
      );
      const nPoints = toNumber(row.n_measures) ?? 0;
      allRows.push({
        ts_id: tsId,
        module_code: "hydro",
        station_id: Number(row.station_id),
        station_code: String(row.station_code),
        station_name: String(row.station_name),
        station_label: `${row.station_code} - ${row.station_name}`,
        property_id: def.property_id,
        property_name: def.name,
        unit: def.unit,
        standard_name: def.standard_name,
        run_id: Number(row.run_id),
        scenario_code: String(row.scenario_code),
        scenario_name: String(row.scenario_name),
        source_type: "simulated",
        time_step: timeStep,
        n_measures: nPoints,
        dt_min: row.dt_min,
        dt_max: row.dt_max,
        v_min: toNumber(row.v_min),
        v_max: toNumber(row.v_max),
        created_at: row.created_at,
        period_days: row.dt_min && row.dt_max
          ? Math.max(
              0,
              Math.round(
                (new Date(row.dt_max).getTime() - new Date(row.dt_min).getTime()) / 86400000
              )
            )
          : null,
      });
    }

    return allRows.sort((a, b) =>
      a.station_id - b.station_id ||
      a.run_id - b.run_id ||
      a.property_id - b.property_id
    );
  }

  private async getAvailabilityRows(): Promise<HydroAvailabilityRow[]> {
    if (this.availabilityCache) {
      return this.availabilityCache;
    }

    const promise = (async () => {
      if (await this.db.relationExists("api.mv_hydro_station_stats")) {
        const matRows = await this.getAvailabilityRowsFromMatView();
        if (matRows.length) return matRows;
      }

      const propertyRows = new Map<number, HydroVariableDef>();
      for (const def of await this.getHydroVariableDefs()) {
        propertyRows.set(def.property_id, def);
      }

      const results = await Promise.all([
        this.query<AvailabilitySummaryRow>(
          `
          WITH source AS (
            SELECT
              sim.station_id AS station_id,
              sim.station_code,
              sim.name AS station_name,
              r.scenario_code,
              'daily'::text AS time_step,
              r.period_date,
              r.flow_out_cms
            FROM access.rch_results r
            JOIN core.station_subbasin_map m
              ON m.subbasin_id = r.sub_code
             AND m.is_active = true
            JOIN core.stations sim
              ON sim.station_id = m.station_id
            WHERE r.scenario_code = ANY($1::text[])
          ),
          grouped AS (
            SELECT
              station_id,
              station_code,
              station_name,
              scenario_code,
              time_step,
              31::int AS property_id,
              'Débit simulé'::text AS property_name,
              'm3/s'::text AS unit,
              'SWAT_FLOW_M3S'::text AS standard_name,
              COUNT(*)::bigint AS n_measures,
              MIN(period_date)::date::text AS dt_min,
              MAX(period_date)::date::text AS dt_max,
              MIN(flow_out_cms)::double precision AS v_min,
              MAX(flow_out_cms)::double precision AS v_max,
              MAX(period_date)::date::text AS created_at
            FROM source
            WHERE flow_out_cms IS NOT NULL
            GROUP BY
              station_id,
              station_code,
              station_name,
              scenario_code,
              time_step
          )
          SELECT
            station_id,
            station_code,
            station_name,
            scenario_code,
            time_step,
            property_id,
            property_name,
            unit,
            standard_name,
            n_measures,
            dt_min,
            dt_max,
            v_min,
            v_max,
            created_at
          FROM grouped
          ORDER BY
            station_id,
            scenario_code,
            property_id,
            CASE time_step
              WHEN 'daily' THEN 1
              WHEN 'monthly' THEN 2
              WHEN 'annual' THEN 3
              ELSE 99
            END;
          `,
          [CANONICAL_SCENARIOS]
        ),
      ]);

      const allRows: HydroAvailabilityRow[] = [];
      const seenKeys = new Set<string>();
      for (const row of results[0]) {
        const scenarioCode = String(row.scenario_code);
        const scenarioMeta = NORMALIZED_SWAT_SCENARIO_BY_CODE.get(scenarioCode);
        if (!scenarioMeta) continue;
        const timeStep = String(row.time_step) as HydroTimeStep;
        const key = `${row.station_id}:${scenarioMeta.run_id}:${row.property_id}:${timeStep}`;
        if (seenKeys.has(key)) continue;
        seenKeys.add(key);

        const def = propertyRows.get(Number(row.property_id));
        if (!def) continue;
        const tsId = this.syntheticTsId(
          scenarioMeta.run_id,
          Number(row.station_id),
          def.property_id,
          timeStep
        );
        const nPoints = toNumber(row.n_measures) ?? 0;
        allRows.push({
          ts_id: tsId,
          module_code: "hydro",
          station_id: Number(row.station_id),
          station_code: String(row.station_code),
          station_name: String(row.station_name),
          station_label: `${row.station_code} - ${row.station_name}`,
          property_id: def.property_id,
          property_name: def.name,
          unit: def.unit,
          standard_name: def.standard_name,
          run_id: scenarioMeta.run_id,
          scenario_code: scenarioMeta.scenario_code,
          scenario_name: scenarioMeta.scenario_name,
          source_type: "simulated",
          time_step: timeStep,
          n_measures: nPoints,
          dt_min: row.dt_min,
          dt_max: row.dt_max,
          v_min: toNumber(row.v_min),
          v_max: toNumber(row.v_max),
          created_at: row.created_at,
          period_days: row.dt_min && row.dt_max
            ? Math.max(
                0,
                Math.round(
                  (new Date(row.dt_max).getTime() - new Date(row.dt_min).getTime()) / 86400000
                )
              )
            : null,
        });
      }

      return allRows.sort((a, b) =>
        a.station_id - b.station_id ||
        a.run_id - b.run_id ||
        a.property_id - b.property_id
      );
    })();

    this.availabilityCache = promise.catch((error) => {
      if (this.availabilityCache === promise) {
        this.availabilityCache = null;
      }
      throw error;
    });

    return this.availabilityCache;
  }

  private async loadSeriesFromMatView(
    def: HydroVariableDef,
    stationId: number,
    scenarioCode: string,
    timeStep: HydroTimeStep,
    startDate?: string,
    endDate?: string
  ): Promise<HydroSeriesPoint[]> {
    const params: unknown[] = [stationId, scenarioCode, timeStep, def.entity_type];
    const where: string[] = [
      `station_id = $1`,
      `scenario_code = $2`,
      `time_step = $3`,
      `source_table = $4`,
      `${def.source_column} IS NOT NULL`,
    ];

    if (startDate) {
      params.push(startDate);
      where.push(`period_date >= $${params.length}::date`);
    }
    if (endDate) {
      params.push(endDate);
      where.push(`period_date <= $${params.length}::date`);
    }

    const sql = `
      SELECT
        period_date::text AS period_date,
        AVG(${def.source_column})::double precision AS value
      FROM api.mv_hydro_station_timeseries
      WHERE ${where.join(" AND ")}
      GROUP BY period_date
      ORDER BY period_date
    `;

    const rows = await this.query<RawSeriesRow>(sql, params);
    return rows.map((row) => ({
      date: toDateKey(row.period_date),
      value: toNumber(row.value),
    }));
  }

  private async loadSeries(
    def: HydroVariableDef,
    stationId: number,
    scenarioCode: string,
    timeStep: HydroTimeStep,
    startDate?: string,
    endDate?: string
  ): Promise<HydroSeriesPoint[]> {
    if (await this.db.relationExists("api.mv_hydro_station_timeseries")) {
      const rows = await this.loadSeriesFromMatView(def, stationId, scenarioCode, timeStep, startDate, endDate);
      if (rows.length) return rows;
    }

    if (def.entity_type === "rch") {
      const accessScenarioCode = await this.resolveAccessScenarioCode(scenarioCode);
      const params: unknown[] = [stationId, accessScenarioCode];
      const where: string[] = [
        `m.station_id = $1`,
        `r.scenario_code = $2`,
        `r.flow_out_cms IS NOT NULL`,
      ];

      if (startDate) {
        params.push(startDate);
        where.push(`r.period_date >= $${params.length}::date`);
      }
      if (endDate) {
        params.push(endDate);
        where.push(`r.period_date <= $${params.length}::date`);
      }

      const sql = `
        SELECT
          r.period_date::date::text AS period_date,
          AVG(r.flow_out_cms)::double precision AS value
        FROM access.rch_results r
        JOIN core.station_subbasin_map m
          ON m.subbasin_id = r.sub_code
         AND m.station_id = $1
         AND m.is_active = true
        WHERE ${where.join(" AND ")}
        GROUP BY r.period_date
        ORDER BY r.period_date
      `;

      const rows = await this.query<RawSeriesRow>(sql, params);
      return rows.map((row) => ({
        date: toDateKey(row.period_date),
        value: toNumber(row.value),
      }));
    }

    const sourceAlias = def.entity_type === "sub" ? "s" : "h";
    const tableName = def.source_table;
    const periodColumn = `${sourceAlias}.period_date`;
    const valueColumn = `${sourceAlias}.${def.source_column}`;
    const scenarioColumn = `${sourceAlias}.scenario_code`;
    const timeStepColumn = `${sourceAlias}.time_step`;
    const params: unknown[] = [stationId, scenarioCode, timeStep];
    const directWhere: string[] = [
      `${sourceAlias}.station_id = $1`,
      `${scenarioColumn} = $2`,
      `${timeStepColumn} = $3`,
      `${valueColumn} IS NOT NULL`,
    ];
    const fallbackWhere: string[] = [
      `${sourceAlias}.station_id IS NULL`,
      `${scenarioColumn} = $2`,
      `${timeStepColumn} = $3`,
      `${valueColumn} IS NOT NULL`,
      `m.station_id = $1`,
      `m.is_active = true`,
    ];

    if (startDate) {
      const placeholder = `$${params.length + 1}`;
      params.push(startDate);
      directWhere.push(`${periodColumn} >= ${placeholder}::date`);
      fallbackWhere.push(`${periodColumn} >= ${placeholder}::date`);
    }
    if (endDate) {
      const placeholder = `$${params.length + 1}`;
      params.push(endDate);
      directWhere.push(`${periodColumn} <= ${placeholder}::date`);
      fallbackWhere.push(`${periodColumn} <= ${placeholder}::date`);
    }

    const sql = `
      WITH direct_source AS (
        SELECT
          ${periodColumn}::date AS period_date,
          ${valueColumn}::double precision AS value
        FROM ${tableName} ${sourceAlias}
        WHERE ${directWhere.join(" AND ")}
      ),
      fallback_source AS (
        SELECT
          ${periodColumn}::date AS period_date,
          ${valueColumn}::double precision AS value
        FROM ${tableName} ${sourceAlias}
        JOIN core.station_subbasin_map m
          ON m.subbasin_id = ${sourceAlias}.sub_code
         AND m.station_id = $1
         AND m.is_active = true
        WHERE ${fallbackWhere.join(" AND ")}
      ),
      source AS (
        SELECT * FROM direct_source
        UNION ALL
        SELECT * FROM fallback_source
      )
      SELECT
        period_date::text AS period_date,
        AVG(value)::double precision AS value
      FROM source
      GROUP BY period_date
      ORDER BY period_date
    `;

    const rows = await this.query<RawSeriesRow>(sql, params);
    return rows.map((row) => ({
      date: toDateKey(row.period_date),
      value: toNumber(row.value),
    }));
  }

  private syntheticTsId(
    runId: number,
    stationId: number,
    propertyId: number,
    timeStep: HydroTimeStep
  ): number {
    const stepCode = timeStep === "daily" ? 1 : timeStep === "monthly" ? 2 : 3;
    return runId * 100_000_000 + stationId * 100_000 + propertyId * 10 + stepCode;
  }

  async getAvailableVariables(): Promise<HydroVariableDef[]> {
    const availability = await this.getAvailabilityRows();
    const propertyIds = new Set(availability.map((row) => row.property_id));
    return (await this.getHydroVariableDefs())
      .filter((def) => propertyIds.has(def.property_id))
      .sort((a, b) => a.sort_order - b.sort_order || a.property_id - b.property_id);
  }

  async getModuleProperties(): Promise<
    Array<{
      module_code: string;
      property_id: number;
      is_enabled: boolean;
      sort_order: number;
      name: string;
      unit: string | null;
      standard_name: string | null;
      description: string | null;
    }>
  > {
    const defs = await this.getAvailableVariables();
    return defs.map((def) => ({
      module_code: "hydro",
      property_id: def.property_id,
      is_enabled: true,
      sort_order: def.sort_order,
      name: def.name,
      unit: def.unit,
      standard_name: def.standard_name,
      description: def.description,
    }));
  }

  async getAvailability(filters?: {
    stationId?: number;
    scenarioCode?: string;
    propertyId?: number;
  }): Promise<HydroAvailabilityRow[]> {
    const rows = await this.getAvailabilityRows();
    return rows.filter((row) => {
      if (filters?.stationId && row.station_id !== filters.stationId) return false;
      if (filters?.scenarioCode && row.scenario_code !== filters.scenarioCode) return false;
      if (filters?.propertyId && row.property_id !== filters.propertyId) return false;
      return true;
    });
  }

  private async getAvailabilityRowsForRun(
    runId: number,
    filters?: {
      stationId?: number;
      propertyId?: number;
    }
  ): Promise<HydroAvailabilityRow[]> {
    const scenario = await this.resolveScenario(runId);
    const rows = await this.getAvailability({
      stationId: filters?.stationId,
      propertyId: filters?.propertyId,
      scenarioCode: scenario?.scenario_code,
    });
    const exact = rows.filter((row) => row.run_id === runId);

    if (exact.length || !scenario) {
      return exact;
    }

    return rows.filter((row) => row.scenario_code === scenario.scenario_code);
  }

  private toCatalogRow(row: HydroAvailabilityRow, requestedRunId: number): HydroCatalogRow {
    return {
      ts_id: row.ts_id,
      station_id: row.station_id,
      station_code: row.station_code,
      station_name: row.station_name,
      property_id: row.property_id,
      property_name: row.property_name,
      unit: row.unit,
      standard_name: row.standard_name,
      run_id: requestedRunId,
      scenario_code: row.scenario_code,
      scenario_name: row.scenario_name,
      source_type: row.source_type,
      time_step: row.time_step,
      ts_created_at: row.created_at || new Date().toISOString(),
      n_points: row.n_measures,
      start_date: row.dt_min,
      end_date: row.dt_max,
    };
  }

  async getStationsForRun(runId: number): Promise<
    Array<{
      station_id: number;
      station_code: string;
      station_name: string;
    }>
  > {
    const filtered = await this.getAvailabilityRowsForRun(runId);
    const map = new Map<number, { station_id: number; station_code: string; station_name: string }>();
    for (const row of filtered) {
      if (!map.has(row.station_id)) {
        map.set(row.station_id, {
          station_id: row.station_id,
          station_code: row.station_code,
          station_name: row.station_name,
        });
      }
    }
    return Array.from(map.values()).sort((a, b) => a.station_name.localeCompare(b.station_name));
  }

  async getCatalog(stationId: number, runId: number): Promise<HydroCatalogRow[]> {
    const rows = await this.getAvailabilityRowsForRun(runId, { stationId });
    return rows
      .map((row) => this.toCatalogRow(row, runId))
      .sort((a, b) => a.property_id - b.property_id);
  }

  async getDateRange(stationId: number, runId: number, propertyId: number): Promise<HydroDateRangeRow> {
    const rows = await this.getAvailabilityRowsForRun(runId, {
      stationId,
      propertyId,
    });
    const row = rows[0];
    if (!row) {
      return { min_date: null, max_date: null, n_points: 0 };
    }
    return {
      min_date: row.dt_min,
      max_date: row.dt_max,
      n_points: row.n_measures,
    };
  }

  async getBundle(params: {
    stationId: number;
    runId: number;
    agg: AggInterval;
    startDate?: string;
    endDate?: string;
  }): Promise<HydroBundleResult> {
    const scenario = await this.resolveScenario(params.runId);
    if (!scenario) {
      return { catalog: [], aggregated: {} };
    }

    const defs = await this.getAvailableVariables();
    const catalogRows = await this.getCatalog(params.stationId, params.runId);
    const aggregated: Record<string, HydroAggregatedRow[]> = {};
    const catalog: HydroCatalogRow[] = [];

    const bundleParts = await Promise.all(
      defs.map(async (def) => {
        const propertyCatalog = catalogRows.filter(
          (row) => row.property_id === def.property_id
        );
        const native = getNativeGranularityFromRows(propertyCatalog);
        const sourceTimeStep = pickSourceTimeStep(params.agg, native);
        if (!sourceTimeStep) return null;

        const availabilityRow = catalogRows.find(
          (row) =>
            row.property_id === def.property_id && row.time_step === sourceTimeStep
        );
        if (!availabilityRow) return null;

        const series = await this.loadSeries(
          def,
          params.stationId,
          scenario.scenario_code,
          sourceTimeStep,
          params.startDate,
          params.endDate
        );

        if (!series.length) return null;

        return {
          availabilityRow,
          tsId: String(availabilityRow.ts_id),
          rows: aggregateSeries(series, params.agg),
        };
      })
    );

    for (const part of bundleParts) {
      if (!part) continue;
      aggregated[part.tsId] = part.rows;
      catalog.push(part.availabilityRow);
    }

    return {
      catalog: catalog.sort((a, b) => a.property_id - b.property_id),
      aggregated,
    };
  }

  isCanonicalHydroRun(runId: number): Promise<boolean> {
    return this.resolveScenario(runId).then((row) => !!row);
  }

  async resolveHydroScenario(runId: number): Promise<ScenarioRow | null> {
    return this.resolveScenario(runId);
  }

  /**
   * Load reach flow for a station using the exact scenario code only.
   * Never falls back to another scenario (e.g. etat_actuel).
   */
  async loadStrictRchFlowSeries(
    stationId: number,
    scenarioCode: string,
    startDate?: string,
    endDate?: string
  ): Promise<HydroSeriesPoint[]> {
    const defs = await this.getHydroVariableDefs();
    const def = defs.find((item) => item.entity_type === "rch");
    if (!def) return [];

    const timeSteps: HydroTimeStep[] = ["daily", "monthly", "annual"];
    for (const timeStep of timeSteps) {
      if (await this.db.relationExists("api.mv_hydro_station_timeseries")) {
        const fromMatView = await this.loadSeriesFromMatView(
          def,
          stationId,
          scenarioCode,
          timeStep,
          startDate,
          endDate
        );
        if (fromMatView.length) return fromMatView;
      }
    }

    const params: unknown[] = [stationId, scenarioCode];
    const where: string[] = [
      "m.station_id = $1",
      "LOWER(r.scenario_code) = LOWER($2)",
      "r.flow_out_cms IS NOT NULL",
    ];

    if (startDate) {
      params.push(startDate);
      where.push(`r.period_date >= $${params.length}::date`);
    }
    if (endDate) {
      params.push(endDate);
      where.push(`r.period_date <= $${params.length}::date`);
    }

    const rows = await this.query<RawSeriesRow>(
      `
      SELECT
        r.period_date::date::text AS period_date,
        AVG(r.flow_out_cms)::double precision AS value
      FROM access.rch_results r
      JOIN core.station_subbasin_map m
        ON m.subbasin_id = r.sub_code
       AND m.station_id = $1
       AND m.is_active = true
      WHERE ${where.join(" AND ")}
      GROUP BY r.period_date
      ORDER BY r.period_date
      `,
      params
    );

    return rows.map((row) => ({
      date: toDateKey(row.period_date),
      value: toNumber(row.value),
    }));
  }
}

export const hydroSwatSeriesService = new HydroSwatSeriesService();


import { DatabaseService } from "./database.service";
import { TtlCache } from "../utils/ttlCache";
import {
  EXTENSIONS_QUERY,
  FK_RELATIONS_QUERY,
  SCHEMAS_QUERY,
  SUMMARY_BASE_QUERY,
  TABLES_OVERVIEW_QUERY,
} from "../queries/dataScan.queries";
import type {
  DataScanAvailability,
  DataScanAnomaly,
  DataScanColumnInfo,
  DataScanDateStat,
  DataScanEntityPeriod,
  DataScanEntityVariableSourcePeriod,
  DataScanGlobalPeriodRow,
  DataScanGlobalPeriods,
  DataScanGeometryInfo,
  DataScanIndexInfo,
  DataScanNumericStat,
  DataScanRelation,
  DataScanSummary,
  DataScanTableDetail,
  DataScanTableFilters,
  DataScanTableRow,
  DataScanVariablePeriod,
} from "../types/dataScan.types";

type DbScalar = string | number | boolean | null;

export class DataScanService {
  private db = new DatabaseService();
  private cache = new TtlCache<any>();
  private readonly cacheTtlMs = 10 * 60 * 1000;

  private cacheKey(name: string, payload?: unknown): string {
    return payload === undefined ? name : `${name}:${JSON.stringify(payload)}`;
  }

  private isSafeIdentifier(value: string): boolean {
    return /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(value);
  }

  private quoteIdentifier(value: string): string {
    if (!this.isSafeIdentifier(value)) {
      throw new Error(`Invalid identifier: ${value}`);
    }
    return `"${value}"`;
  }

  private formatDateFr(value: string | null): string {
    if (!value) return "-";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "-";
    return new Intl.DateTimeFormat("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      timeZone: "UTC",
    }).format(d);
  }

  private formatPeriodLabel(minDate: string | null, maxDate: string | null): string {
    if (!minDate || !maxDate) return "période indisponible";
    return `du ${this.formatDateFr(minDate)} au ${this.formatDateFr(maxDate)}`;
  }

  private inferDataTypeByTableName(tableName: string): string {
    const n = tableName.toLowerCase();
    if (n.includes("precip")) return "Précipitation";
    if (n.includes("debit") || n.includes("streamflow")) return "Débit";
    if (n.includes("lacher") || n.includes("restitution")) return "Lâchers";
    if (n.includes("temperature")) return "Température";
    if (n.includes("evaporation")) return "Évaporation";
    if (n.includes("humidite")) return "Humidité";
    if (n.includes("vent")) return "Vitesse vent";
    if (n.includes("bathym")) return "Bathymétrie";
    if (n.includes("measure")) return "Mesures";
    if (n.includes("timeseries")) return "Série temporelle";
    return "Données métier";
  }

  private chooseDateColumn(columns: string[]): string | null {
    if (!columns.length) return null;
    const priority = [
      "datetime",
      "datetime_utc",
      "observed_at",
      "measured_at",
      "measurement_time",
      "timestamp",
      "ts",
      "date",
      "created_at",
      "inserted_at",
      "start_date",
      "end_date",
      "year",
    ];

    const byPriority = priority.find((p) =>
      columns.some((c) => c.toLowerCase() === p)
    );
    if (byPriority) {
      const exact = columns.find((c) => c.toLowerCase() === byPriority);
      return exact ?? null;
    }

    const loose =
      columns.find((c) => /(date|time|timestamp|year)/i.test(c)) ?? null;
    return loose;
  }

  private async tableExists(schemaName: string, tableName: string): Promise<boolean> {
    const [row] = await this.db.query<{ exists: boolean }>(
      `
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = $1
          AND table_name = $2
      ) AS exists
      `,
      [schemaName, tableName]
    );
    return Boolean(row?.exists);
  }

  private async getLatestSuccessfulLoadBatchId(): Promise<string | null> {
    const exists = await this.tableExists("staging", "migration_batches");
    if (!exists) return null;

    const [row] = await this.db.query<{ load_batch_id: string }>(
      `
      SELECT load_batch_id
      FROM staging.migration_batches
      WHERE status = 'success'
      ORDER BY started_at DESC
      LIMIT 1
      `
    );

    return row?.load_batch_id ?? null;
  }

  private inferDashboardUseful(schemaName: string, tableName: string): boolean {
    const full = `${schemaName}.${tableName}`.toLowerCase();
    return /(station|reservoir|barrage|basin|subbasin|reach|timeseries|measurement|meteo|climat|hydro|sediment|bathym)/.test(
      full
    );
  }

  private buildTableAnomalies(row: DataScanTableRow): DataScanAnomaly[] {
    const anomalies: DataScanAnomaly[] = [];
    const tableId = `${row.schema_name}.${row.table_name}`;

    if (row.estimated_rows <= 0) {
      anomalies.push({
        id: `${tableId}:empty`,
        severity: "warning",
        scope: "table",
        schema_name: row.schema_name,
        table_name: row.table_name,
        column_name: null,
        code: "TABLE_EMPTY",
        message: "Table vide (estimation de lignes = 0).",
      });
    }

    if (row.has_geometry && row.srid_list.some((s) => !s || s <= 0)) {
      anomalies.push({
        id: `${tableId}:srid`,
        severity: "warning",
        scope: "table",
        schema_name: row.schema_name,
        table_name: row.table_name,
        column_name: null,
        code: "SRID_MISSING",
        message: "Colonne géométrique avec SRID manquant ou invalide.",
      });
    }

    if (!row.has_date && this.inferDashboardUseful(row.schema_name, row.table_name)) {
      anomalies.push({
        id: `${tableId}:date`,
        severity: "info",
        scope: "table",
        schema_name: row.schema_name,
        table_name: row.table_name,
        column_name: null,
        code: "NO_DATE_COLUMN",
        message: "Aucune colonne temporelle détectée.",
      });
    }

    if (row.pk_count === 0 && row.table_type === "BASE TABLE") {
      anomalies.push({
        id: `${tableId}:pk`,
        severity: "warning",
        scope: "table",
        schema_name: row.schema_name,
        table_name: row.table_name,
        column_name: null,
        code: "MISSING_PRIMARY_KEY",
        message: "Aucune clé primaire détectée.",
      });
    }

    return anomalies;
  }

  private enrichTableRow(raw: {
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
  }): DataScanTableRow {
    const dashboardUseful = this.inferDashboardUseful(raw.schema_name, raw.table_name);
    const anomalyCount = this.buildTableAnomalies({
      ...raw,
      anomaly_count: 0,
      quality_status: "good",
      quality_score: 100,
      dashboard_useful: dashboardUseful,
    }).length;

    const qualityScore = Math.max(0, 100 - anomalyCount * 20);
    const qualityStatus: DataScanTableRow["quality_status"] =
      anomalyCount >= 3 ? "critical" : anomalyCount >= 1 ? "warning" : "good";

    return {
      ...raw,
      anomaly_count: anomalyCount,
      quality_score: qualityScore,
      quality_status: qualityStatus,
      dashboard_useful: dashboardUseful,
    };
  }

  async getTables(filters: DataScanTableFilters = {}): Promise<DataScanTableRow[]> {
    const key = this.cacheKey("dataScan.tables", filters);
    return this.cache.getOrSet(key, this.cacheTtlMs, async () => {
    const raw = await this.db.query<{
      schema_name: string;
      table_name: string;
      table_type: "BASE TABLE" | "VIEW";
      estimated_rows: string | number;
      columns_count: string | number;
      has_geometry: boolean;
      has_date: boolean;
      pk_count: string | number;
      fk_count: string | number;
      srid_list: number[] | null;
      geometry_types: string[] | null;
    }>(TABLES_OVERVIEW_QUERY);

    let rows = raw.map((r) =>
      this.enrichTableRow({
        schema_name: r.schema_name,
        table_name: r.table_name,
        table_type: r.table_type,
        estimated_rows: Number(r.estimated_rows ?? 0),
        columns_count: Number(r.columns_count ?? 0),
        has_geometry: Boolean(r.has_geometry),
        has_date: Boolean(r.has_date),
        pk_count: Number(r.pk_count ?? 0),
        fk_count: Number(r.fk_count ?? 0),
        srid_list: Array.isArray(r.srid_list) ? r.srid_list : [],
        geometry_types: Array.isArray(r.geometry_types) ? r.geometry_types : [],
      })
    );

    if (filters.schema) {
      rows = rows.filter((r) => r.schema_name === filters.schema);
    }
    if (filters.tableType) {
      rows = rows.filter((r) => r.table_type === filters.tableType);
    }
    if (filters.geometryOnly) {
      rows = rows.filter((r) => r.has_geometry);
    }
    if (filters.emptyOnly) {
      rows = rows.filter((r) => r.estimated_rows <= 0);
    }
    if (filters.anomalousOnly) {
      rows = rows.filter((r) => r.anomaly_count > 0);
    }

    rows.sort((a, b) => {
      if (a.schema_name !== b.schema_name) return a.schema_name.localeCompare(b.schema_name);
      return a.table_name.localeCompare(b.table_name);
    });
    return rows;
    });
  }

  async getAnomalies(): Promise<DataScanAnomaly[]> {
    const key = this.cacheKey("dataScan.anomalies");
    return this.cache.getOrSet(key, this.cacheTtlMs, async () => {
      const tables = await this.getTables();
      return tables.flatMap((t) => this.buildTableAnomalies(t));
    });
  }

  async getSummary(): Promise<DataScanSummary> {
    const key = this.cacheKey("dataScan.summary");
    return this.cache.getOrSet(key, this.cacheTtlMs, async () => {
    const [base] = await this.db.query<{
      database_name: string;
      database_size: string;
      tables_count: string | number;
      views_count: string | number;
      sequences_count: string | number;
      pk_count: string | number;
      fk_count: string | number;
      total_estimated_rows: string | number;
      geometry_tables_count: string | number;
      total_columns: string | number;
    }>(SUMMARY_BASE_QUERY);

    if (!base) {
      throw new Error("Unable to compute data scan summary.");
    }

    const schemas = await this.db.query<{ nspname: string }>(SCHEMAS_QUERY);
    const extensions = await this.db.query<{ extname: string }>(EXTENSIONS_QUERY);
    const anomalies = await this.getAnomalies();

    return {
      database_name: base.database_name,
      database_size: base.database_size,
      schemas: schemas.map((s) => s.nspname),
      extensions: extensions.map((e) => e.extname),
      tables_count: Number(base.tables_count ?? 0),
      views_count: Number(base.views_count ?? 0),
      sequences_count: Number(base.sequences_count ?? 0),
      pk_count: Number(base.pk_count ?? 0),
      fk_count: Number(base.fk_count ?? 0),
      total_estimated_rows: Number(base.total_estimated_rows ?? 0),
      geometry_tables_count: Number(base.geometry_tables_count ?? 0),
      total_columns: Number(base.total_columns ?? 0),
      anomalies_count: anomalies.length,
    };
    });
  }

  async getRelations(): Promise<DataScanRelation[]> {
    const key = this.cacheKey("dataScan.relations");
    return this.cache.getOrSet(key, this.cacheTtlMs, async () => {
    const fk = await this.db.query<{
      source_schema: string;
      source_table: string;
      source_column: string;
      target_schema: string;
      target_table: string;
      target_column: string;
    }>(FK_RELATIONS_QUERY);

    const relations: DataScanRelation[] = fk.map((r) => ({
      ...r,
      relation_type: "foreign_key",
    }));

    const seen = new Set(relations.map((r) => `${r.source_schema}.${r.source_table}->${r.target_schema}.${r.target_table}:${r.source_column}`));
    const inferredPairs: Array<[string, string]> = [
      ["stations", "timeseries"],
      ["timeseries", "measurements"],
      ["catchments", "subbasin_shapes"],
      ["subbasin_shapes", "reach_shapes"],
      ["reservoirs", "reservoir_bathymetry"],
    ];

    for (const [src, tgt] of inferredPairs) {
      const key = `public.${src}->public.${tgt}:*`;
      if (!seen.has(key)) {
        relations.push({
          source_schema: "public",
          source_table: src,
          source_column: "*",
          target_schema: "public",
          target_table: tgt,
          target_column: "*",
          relation_type: "inferred",
        });
      }
    }

    return relations;
    });
  }

  async getPeriodsGlobal(): Promise<DataScanGlobalPeriods> {
    const candidates = await this.db.query<{
      schema_name: string;
      table_name: string;
      date_columns: string[] | null;
    }>(
      `
      SELECT
        t.table_schema AS schema_name,
        t.table_name,
        COALESCE(
          array_agg(c.column_name ORDER BY c.ordinal_position)
          FILTER (
            WHERE c.data_type IN ('date', 'timestamp without time zone', 'timestamp with time zone')
               OR c.udt_name IN ('date', 'timestamp', 'timestamptz')
               OR c.column_name ~* '(date|time|timestamp|year)'
          ),
          '{}'::text[]
        ) AS date_columns
      FROM information_schema.tables t
      LEFT JOIN information_schema.columns c
        ON c.table_schema = t.table_schema
       AND c.table_name = t.table_name
      WHERE t.table_type = 'BASE TABLE'
        AND t.table_schema NOT IN ('pg_catalog', 'information_schema')
        AND (
          t.table_schema IN ('core', 'staging')
          OR t.table_name ~* '(measure|timeseries|value|result|obs|precip|debit|temperature|evaporation|humidite|vent|lacher|bathym|run)'
        )
      GROUP BY t.table_schema, t.table_name
      ORDER BY t.table_schema, t.table_name
      `
    );

    const rows: DataScanGlobalPeriodRow[] = [];

    for (const t of candidates) {
      const qSchema = this.quoteIdentifier(t.schema_name);
      const qTable = this.quoteIdentifier(t.table_name);
      const [countRow] = await this.db.query<{ total_rows: string | number }>(
        `SELECT COUNT(*)::bigint AS total_rows FROM ${qSchema}.${qTable}`
      );
      const totalRows = Number(countRow?.total_rows ?? 0);
      const dateColumn = this.chooseDateColumn(Array.isArray(t.date_columns) ? t.date_columns : []);

      if (totalRows <= 0) {
        rows.push({
          schema_name: t.schema_name,
          table_name: t.table_name,
          data_type: this.inferDataTypeByTableName(t.table_name),
          total_rows: 0,
          date_column: dateColumn,
          min_date: null,
          max_date: null,
          period_label: "période indisponible",
          null_date_count: 0,
          status: "vide",
        });
        continue;
      }

      if (!dateColumn) {
        rows.push({
          schema_name: t.schema_name,
          table_name: t.table_name,
          data_type: this.inferDataTypeByTableName(t.table_name),
          total_rows: totalRows,
          date_column: null,
          min_date: null,
          max_date: null,
          period_label: "période indisponible",
          null_date_count: 0,
          status: "dates absentes",
        });
        continue;
      }

      const qDate = this.quoteIdentifier(dateColumn);
      const [dateRow] = await this.db.query<{
        min_date: string | null;
        max_date: string | null;
        null_date_count: string | number;
      }>(
        `
        SELECT
          MIN(${qDate})::text AS min_date,
          MAX(${qDate})::text AS max_date,
          SUM(CASE WHEN ${qDate} IS NULL THEN 1 ELSE 0 END)::bigint AS null_date_count
        FROM ${qSchema}.${qTable}
        `
      );

      const minDate = dateRow?.min_date ?? null;
      const maxDate = dateRow?.max_date ?? null;
      const nullDateCount = Number(dateRow?.null_date_count ?? 0);
      const status =
        !minDate || !maxDate ? "dates incohérentes" : "avec données";

      rows.push({
        schema_name: t.schema_name,
        table_name: t.table_name,
        data_type: this.inferDataTypeByTableName(t.table_name),
        total_rows: totalRows,
        date_column: dateColumn,
        min_date: minDate,
        max_date: maxDate,
        period_label: this.formatPeriodLabel(minDate, maxDate),
        null_date_count: nullDateCount,
        status,
      });
    }

    const periodRows = rows.filter(
      (r) => r.status === "avec données" && r.min_date && r.max_date
    );
    const minEpochs = periodRows
      .map((r) => new Date(r.min_date as string).getTime())
      .filter((n) => Number.isFinite(n));
    const maxEpochs = periodRows
      .map((r) => new Date(r.max_date as string).getTime())
      .filter((n) => Number.isFinite(n));

    const periodMin =
      minEpochs.length > 0 ? minEpochs.reduce((a, b) => Math.min(a, b)) : null;
    const periodMax =
      maxEpochs.length > 0 ? maxEpochs.reduce((a, b) => Math.max(a, b)) : null;

    const minIso = periodMin ? new Date(periodMin).toISOString() : null;
    const maxIso = periodMax ? new Date(periodMax).toISOString() : null;

    return {
      generated_at: new Date().toISOString(),
      period_min: minIso,
      period_max: maxIso,
      period_label: this.formatPeriodLabel(minIso, maxIso),
      rows,
    };
  }

  async getPeriodsByVariable(): Promise<DataScanVariablePeriod[]> {
    const measurementsExists = await this.tableExists("core", "measurements");
    const timeseriesExists = await this.tableExists("core", "timeseries");
    const propsExists = await this.tableExists("ref", "observed_properties");

    if (measurementsExists && timeseriesExists && propsExists) {
      const rows = await this.db.query<{
        variable_code: string;
        variable_name: string;
        records_count: string | number;
        stations_count: string | number;
        basins_count: string | number;
        sources: string[] | null;
        min_date: string | null;
        max_date: string | null;
      }>(
        `
        SELECT
          COALESCE(p.standard_name, p.name, CONCAT('property_', p.property_id::text)) AS variable_code,
          p.name AS variable_name,
          COUNT(m.*)::bigint AS records_count,
          COUNT(DISTINCT t.station_id)::int AS stations_count,
          COUNT(DISTINCT s.catchment_id)::int AS basins_count,
          COALESCE(
            ARRAY_AGG(DISTINCT COALESCE(NULLIF(t.source_type, ''), mr.scenario_code, 'UNKNOWN')),
            '{}'::text[]
          ) AS sources,
          MIN(m.datetime)::text AS min_date,
          MAX(m.datetime)::text AS max_date
        FROM core.measurements m
        JOIN core.timeseries t ON t.ts_id = m.ts_id
        LEFT JOIN core.model_runs mr ON mr.run_id = t.run_id
        JOIN ref.observed_properties p ON p.property_id = t.property_id
        LEFT JOIN core.stations s ON s.station_id = t.station_id
        GROUP BY p.property_id, p.standard_name, p.name
        ORDER BY p.standard_name NULLS LAST, p.name
        `
      );

      return rows.map((r) => {
        const minDate = r.min_date ?? null;
        const maxDate = r.max_date ?? null;
        return {
          variable_code: r.variable_code,
          variable_name: r.variable_name,
          table_source: "core.measurements",
          records_count: Number(r.records_count ?? 0),
          stations_count: Number(r.stations_count ?? 0),
          basins_count: Number(r.basins_count ?? 0),
          sources: Array.isArray(r.sources) ? r.sources : [],
          min_date: minDate,
          max_date: maxDate,
          period_label: this.formatPeriodLabel(minDate, maxDate),
          status: minDate && maxDate ? "avec données" : "dates incohérentes",
        };
      });
    }

    const normExists = await this.tableExists("staging", "norm_measurements");
    if (!normExists) return [];

    const latestBatch = await this.getLatestSuccessfulLoadBatchId();
    const rows = await this.db.query<{
      variable_code: string;
      records_count: string | number;
      stations_count: string | number;
      basins_count: string | number;
      sources: string[] | null;
      min_date: string | null;
      max_date: string | null;
    }>(
      `
      SELECT
        n.property_code AS variable_code,
        COUNT(*)::bigint AS records_count,
        COUNT(DISTINCT CASE WHEN n.entity_type = 'station' THEN n.entity_code END)::int AS stations_count,
        COUNT(DISTINCT s.catchment_id)::int AS basins_count,
        COALESCE(ARRAY_AGG(DISTINCT n.source_table), '{}'::text[]) AS sources,
        MIN(n.datetime_utc)::text AS min_date,
        MAX(n.datetime_utc)::text AS max_date
      FROM staging.norm_measurements n
      LEFT JOIN core.stations s ON s.station_code = n.entity_code
      WHERE ($1::text IS NULL OR n.load_batch_id = $1)
      GROUP BY n.property_code
      ORDER BY n.property_code
      `,
      [latestBatch]
    );

    return rows.map((r) => {
      const minDate = r.min_date ?? null;
      const maxDate = r.max_date ?? null;
      return {
        variable_code: r.variable_code,
        variable_name: r.variable_code,
        table_source: "staging.norm_measurements",
        records_count: Number(r.records_count ?? 0),
        stations_count: Number(r.stations_count ?? 0),
        basins_count: Number(r.basins_count ?? 0),
        sources: Array.isArray(r.sources) ? r.sources : [],
        min_date: minDate,
        max_date: maxDate,
        period_label: this.formatPeriodLabel(minDate, maxDate),
        status: minDate && maxDate ? "avec données" : "dates incohérentes",
      };
    });
  }

  async getPeriodsByEntity(): Promise<DataScanEntityPeriod[]> {
    const normExists = await this.tableExists("staging", "norm_measurements");
    const latestBatch = normExists ? await this.getLatestSuccessfulLoadBatchId() : null;

    const aggSql = normExists
      ? `
      agg AS (
        SELECT
          n.entity_type,
          n.entity_code,
          COUNT(*)::bigint AS total_points,
          COALESCE(ARRAY_AGG(DISTINCT n.property_code), '{}'::text[]) AS variables,
          COALESCE(ARRAY_AGG(DISTINCT n.source_table), '{}'::text[]) AS sources,
          MIN(n.datetime_utc)::text AS min_date,
          MAX(n.datetime_utc)::text AS max_date
        FROM staging.norm_measurements n
        WHERE ($1::text IS NULL OR n.load_batch_id = $1)
        GROUP BY n.entity_type, n.entity_code
      )
      `
      : `
      agg AS (
        SELECT
          'station'::text AS entity_type,
          s.station_code AS entity_code,
          COUNT(m.*)::bigint AS total_points,
          COALESCE(ARRAY_AGG(DISTINCT COALESCE(p.standard_name, p.name)), '{}'::text[]) AS variables,
          COALESCE(ARRAY_AGG(DISTINCT COALESCE(NULLIF(t.source_type, ''), 'UNKNOWN')), '{}'::text[]) AS sources,
          MIN(m.datetime)::text AS min_date,
          MAX(m.datetime)::text AS max_date
        FROM core.stations s
        LEFT JOIN core.timeseries t ON t.station_id = s.station_id
        LEFT JOIN core.measurements m ON m.ts_id = t.ts_id
        LEFT JOIN ref.observed_properties p ON p.property_id = t.property_id
        GROUP BY s.station_code
      )
      `;

    const entityPeriodsSql = `
      WITH entities AS (
        SELECT
          'station'::text AS entity_type,
          s.station_code AS entity_code,
          s.name AS entity_name,
          c.name AS basin_name
        FROM core.stations s
        LEFT JOIN core.catchments c ON c.catchment_id = s.catchment_id
        UNION ALL
        SELECT
          'reservoir'::text AS entity_type,
          COALESCE(r.reservoir_code, r.reservoir_id::text) AS entity_code,
          r.name AS entity_name,
          c.name AS basin_name
        FROM core.reservoirs r
        LEFT JOIN core.catchments c ON c.catchment_id = r.catchment_id
      ),
      ${aggSql}
      SELECT
        e.entity_type,
        e.entity_code,
        e.entity_name,
        e.basin_name,
        COALESCE(a.variables, '{}'::text[]) AS variables,
        COALESCE(a.sources, '{}'::text[]) AS sources,
        COALESCE(a.total_points, 0)::bigint AS total_points,
        a.min_date,
        a.max_date
      FROM entities e
      LEFT JOIN agg a
        ON a.entity_type = e.entity_type
       AND a.entity_code = e.entity_code
      ORDER BY e.entity_type, e.entity_name
      `;

    const rows = normExists
      ? await this.db.query<{
          entity_type: string;
          entity_code: string;
          entity_name: string;
          basin_name: string | null;
          variables: string[] | null;
          sources: string[] | null;
          total_points: string | number;
          min_date: string | null;
          max_date: string | null;
        }>(entityPeriodsSql, [latestBatch])
      : await this.db.query<{
          entity_type: string;
          entity_code: string;
          entity_name: string;
          basin_name: string | null;
          variables: string[] | null;
          sources: string[] | null;
          total_points: string | number;
          min_date: string | null;
          max_date: string | null;
        }>(entityPeriodsSql);

    return rows.map((r) => {
      const minDate = r.min_date ?? null;
      const maxDate = r.max_date ?? null;
      const points = Number(r.total_points ?? 0);
      return {
        entity_type: r.entity_type,
        entity_code: r.entity_code,
        entity_name: r.entity_name,
        basin_name: r.basin_name,
        variables: Array.isArray(r.variables) ? r.variables : [],
        sources: Array.isArray(r.sources) ? r.sources : [],
        total_points: points,
        min_date: minDate,
        max_date: maxDate,
        period_label: this.formatPeriodLabel(minDate, maxDate),
        status: points > 0 ? "avec données" : "sans données",
      };
    });
  }

  async getPeriodsByEntityVariableSource(): Promise<DataScanEntityVariableSourcePeriod[]> {
    const normExists = await this.tableExists("staging", "norm_measurements");
    if (!normExists) return [];

    const latestBatch = await this.getLatestSuccessfulLoadBatchId();
    const rows = await this.db.query<{
      entity_type: string;
      entity_code: string;
      entity_name: string;
      basin_name: string | null;
      variable_code: string;
      variable_name: string;
      source: string;
      records_count: string | number;
      min_date: string | null;
      max_date: string | null;
    }>(
      `
      WITH entity_catalog AS (
        SELECT
          'station'::text AS entity_type,
          s.station_code AS entity_code,
          s.name AS entity_name,
          c.name AS basin_name
        FROM core.stations s
        LEFT JOIN core.catchments c ON c.catchment_id = s.catchment_id
        UNION ALL
        SELECT
          'reservoir'::text AS entity_type,
          COALESCE(r.reservoir_code, r.reservoir_id::text) AS entity_code,
          r.name AS entity_name,
          c.name AS basin_name
        FROM core.reservoirs r
        LEFT JOIN core.catchments c ON c.catchment_id = r.catchment_id
      )
      SELECT
        n.entity_type,
        n.entity_code,
        COALESCE(ec.entity_name, n.entity_code) AS entity_name,
        ec.basin_name,
        n.property_code AS variable_code,
        COALESCE(op.name, n.property_code) AS variable_name,
        COALESCE(NULLIF(n.source_table, ''), 'UNKNOWN') AS source,
        COUNT(*)::bigint AS records_count,
        MIN(n.datetime_utc)::text AS min_date,
        MAX(n.datetime_utc)::text AS max_date
      FROM staging.norm_measurements n
      LEFT JOIN entity_catalog ec
        ON ec.entity_type = n.entity_type
       AND ec.entity_code = n.entity_code
      LEFT JOIN ref.observed_properties op
        ON op.standard_name = n.property_code
      WHERE ($1::text IS NULL OR n.load_batch_id = $1)
      GROUP BY
        n.entity_type,
        n.entity_code,
        COALESCE(ec.entity_name, n.entity_code),
        ec.basin_name,
        n.property_code,
        COALESCE(op.name, n.property_code),
        COALESCE(NULLIF(n.source_table, ''), 'UNKNOWN')
      ORDER BY n.entity_type, entity_name, variable_code, source
      `,
      [latestBatch]
    );

    return rows.map((r) => {
      const minDate = r.min_date ?? null;
      const maxDate = r.max_date ?? null;
      return {
        entity_type: r.entity_type,
        entity_code: r.entity_code,
        entity_name: r.entity_name,
        basin_name: r.basin_name,
        variable_code: r.variable_code,
        variable_name: r.variable_name,
        source: r.source,
        records_count: Number(r.records_count ?? 0),
        min_date: minDate,
        max_date: maxDate,
        period_label: this.formatPeriodLabel(minDate, maxDate),
      };
    });
  }

  async getDataAvailability(): Promise<DataScanAvailability> {
    const latestBatch = await this.getLatestSuccessfulLoadBatchId();
    const normExists = await this.tableExists("staging", "norm_measurements");
    const globalPeriods = await this.getPeriodsGlobal();

    const [stationsTotalRow] = await this.db.query<{ n: string | number }>(
      `SELECT COUNT(*)::bigint AS n FROM core.stations`
    );
    const [stationsWithDataRow] = await this.db.query<{ n: string | number }>(
      `
      SELECT COUNT(*)::bigint AS n
      FROM (
        SELECT s.station_id
        FROM core.stations s
        JOIN core.timeseries t ON t.station_id = s.station_id
        JOIN core.measurements m ON m.ts_id = t.ts_id
        GROUP BY s.station_id
      ) x
      `
    );

    const [reservoirTotalRow] = await this.db.query<{ n: string | number }>(
      `SELECT COUNT(*)::bigint AS n FROM core.reservoirs`
    );
    const [reservoirWithDataRow] = normExists
      ? await this.db.query<{ n: string | number }>(
          `
          SELECT COUNT(*)::bigint AS n
          FROM (
            SELECT r.reservoir_id
            FROM core.reservoirs r
            JOIN staging.norm_measurements n
              ON n.entity_type = 'reservoir'
             AND n.entity_code = COALESCE(r.reservoir_code, r.reservoir_id::text)
            WHERE ($1::text IS NULL OR n.load_batch_id = $1)
            GROUP BY r.reservoir_id
          ) x
          `,
          [latestBatch]
        )
      : [{ n: 0 }];

    const [variablesTotalRow] = await this.db.query<{ n: string | number }>(
      `SELECT COUNT(*)::bigint AS n FROM ref.observed_properties`
    );
    const [variablesWithDataRow] = await this.db.query<{ n: string | number }>(
      `
      SELECT COUNT(*)::bigint AS n
      FROM (
        SELECT DISTINCT t.property_id
        FROM core.timeseries t
        JOIN core.measurements m ON m.ts_id = t.ts_id
      ) x
      `
    );

    const sourcesRows = normExists
      ? await this.db.query<{ source: string }>(
          `
          SELECT DISTINCT COALESCE(NULLIF(source_table, ''), 'UNKNOWN') AS source
          FROM staging.norm_measurements
          WHERE ($1::text IS NULL OR load_batch_id = $1)
          ORDER BY 1
          `,
          [latestBatch]
        )
      : [];

    const tablesWithoutDate = globalPeriods.rows
      .filter((r) => r.total_rows > 0 && r.status === "dates absentes")
      .map((r) => `${r.schema_name}.${r.table_name}`);

    const tablesIncoherentDates = globalPeriods.rows
      .filter((r) => r.total_rows > 0 && r.status === "dates incohérentes")
      .map((r) => `${r.schema_name}.${r.table_name}`);

    const stationsTotal = Number(stationsTotalRow?.n ?? 0);
    const stationsWithData = Number(stationsWithDataRow?.n ?? 0);
    const reservoirsTotal = Number(reservoirTotalRow?.n ?? 0);
    const reservoirsWithData = Number(reservoirWithDataRow?.n ?? 0);
    const variablesTotal = Number(variablesTotalRow?.n ?? 0);
    const variablesWithData = Number(variablesWithDataRow?.n ?? 0);

    return {
      latest_load_batch_id: latestBatch,
      stations_total: stationsTotal,
      stations_with_data: stationsWithData,
      stations_without_data: Math.max(0, stationsTotal - stationsWithData),
      reservoirs_total: reservoirsTotal,
      reservoirs_with_data: reservoirsWithData,
      reservoirs_without_data: Math.max(0, reservoirsTotal - reservoirsWithData),
      variables_total: variablesTotal,
      variables_with_data: variablesWithData,
      variables_without_data: Math.max(0, variablesTotal - variablesWithData),
      sources_with_rows: sourcesRows.map((r) => r.source),
      tables_with_data_without_date_column: tablesWithoutDate,
      tables_with_incoherent_dates: tablesIncoherentDates,
    };
  }

  private async getTableColumns(schemaName: string, tableName: string): Promise<DataScanColumnInfo[]> {
    const columns = await this.db.query<{
      column_name: string;
      data_type: string;
      udt_name: string;
      is_nullable: "YES" | "NO";
      column_default: string | null;
    }>(
      `
      SELECT column_name, data_type, udt_name, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_schema = $1 AND table_name = $2
      ORDER BY ordinal_position
      `,
      [schemaName, tableName]
    );

    const pkCols = await this.db.query<{ column_name: string }>(
      `
      SELECT kcu.column_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
       AND tc.table_schema = kcu.table_schema
       AND tc.table_name = kcu.table_name
      WHERE tc.table_schema = $1
        AND tc.table_name = $2
        AND tc.constraint_type = 'PRIMARY KEY'
      `,
      [schemaName, tableName]
    );
    const pkSet = new Set(pkCols.map((r) => r.column_name));

    const fkCols = await this.db.query<{
      column_name: string;
      foreign_table_schema: string;
      foreign_table_name: string;
      foreign_column_name: string;
    }>(
      `
      SELECT
        kcu.column_name,
        ccu.table_schema AS foreign_table_schema,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
       AND tc.table_schema = kcu.table_schema
       AND tc.table_name = kcu.table_name
      JOIN information_schema.constraint_column_usage ccu
        ON ccu.constraint_name = tc.constraint_name
       AND ccu.table_schema = tc.table_schema
      WHERE tc.table_schema = $1
        AND tc.table_name = $2
        AND tc.constraint_type = 'FOREIGN KEY'
      `,
      [schemaName, tableName]
    );
    const fkMap = new Map<string, string>(
      fkCols.map((r) => [
        r.column_name,
        `${r.foreign_table_schema}.${r.foreign_table_name}.${r.foreign_column_name}`,
      ])
    );

    return columns.map((c) => ({
      column_name: c.column_name,
      data_type: c.data_type,
      udt_name: c.udt_name,
      is_nullable: c.is_nullable === "YES",
      column_default: c.column_default,
      is_primary_key: pkSet.has(c.column_name),
      is_foreign_key: fkMap.has(c.column_name),
      fk_target: fkMap.get(c.column_name) ?? null,
    }));
  }

  private async getTableIndexes(schemaName: string, tableName: string): Promise<DataScanIndexInfo[]> {
    return this.db.query<DataScanIndexInfo>(
      `
      SELECT indexname AS index_name, indexdef AS index_definition
      FROM pg_indexes
      WHERE schemaname = $1
        AND tablename = $2
      ORDER BY indexname
      `,
      [schemaName, tableName]
    );
  }

  private async getGeometryInfo(
    schemaName: string,
    tableName: string
  ): Promise<DataScanGeometryInfo[]> {
    const geomCols = await this.db.query<{
      column_name: string;
      geometry_type: string;
      srid: string | number;
    }>(
      `
      SELECT f_geometry_column AS column_name, type AS geometry_type, srid
      FROM public.geometry_columns
      WHERE f_table_schema = $1
        AND f_table_name = $2
      `,
      [schemaName, tableName]
    );

    const out: DataScanGeometryInfo[] = [];
    const qSchema = this.quoteIdentifier(schemaName);
    const qTable = this.quoteIdentifier(tableName);

    for (const g of geomCols) {
      const qCol = this.quoteIdentifier(g.column_name);
      const sql = `
        SELECT COUNT(*)::bigint AS invalid_count
        FROM ${qSchema}.${qTable}
        WHERE ${qCol} IS NOT NULL
          AND NOT ST_IsValid(${qCol})
      `;
      const [row] = await this.db.query<{ invalid_count: string | number }>(sql);
      out.push({
        column_name: g.column_name,
        geometry_type: g.geometry_type,
        srid: Number(g.srid ?? 0),
        invalid_count: Number(row?.invalid_count ?? 0),
      });
    }

    return out;
  }

  private async getExactRows(schemaName: string, tableName: string): Promise<number> {
    const qSchema = this.quoteIdentifier(schemaName);
    const qTable = this.quoteIdentifier(tableName);
    const [row] = await this.db.query<{ total: string | number }>(
      `SELECT COUNT(*)::bigint AS total FROM ${qSchema}.${qTable}`
    );
    return Number(row?.total ?? 0);
  }

  private async getDateStats(
    schemaName: string,
    tableName: string,
    columns: DataScanColumnInfo[]
  ): Promise<DataScanDateStat[]> {
    const dateCols = columns.filter(
      (c) =>
        c.data_type === "date" ||
        c.data_type === "timestamp without time zone" ||
        c.data_type === "timestamp with time zone" ||
        c.udt_name === "date" ||
        c.udt_name === "timestamp" ||
        c.udt_name === "timestamptz"
    );
    if (!dateCols.length) return [];

    const qSchema = this.quoteIdentifier(schemaName);
    const qTable = this.quoteIdentifier(tableName);
    const stats: DataScanDateStat[] = [];

    for (const col of dateCols) {
      const qCol = this.quoteIdentifier(col.column_name);
      const [row] = await this.db.query<{
        min_value: string | null;
        max_value: string | null;
        null_count: string | number;
      }>(
        `
        SELECT
          MIN(${qCol})::text AS min_value,
          MAX(${qCol})::text AS max_value,
          SUM(CASE WHEN ${qCol} IS NULL THEN 1 ELSE 0 END)::bigint AS null_count
        FROM ${qSchema}.${qTable}
        `
      );
      stats.push({
        column_name: col.column_name,
        min_value: row?.min_value ?? null,
        max_value: row?.max_value ?? null,
        null_count: Number(row?.null_count ?? 0),
      });
    }

    return stats;
  }

  private async getNumericStats(
    schemaName: string,
    tableName: string,
    columns: DataScanColumnInfo[]
  ): Promise<DataScanNumericStat[]> {
    const numericCols = columns.filter((c) =>
      ["smallint", "integer", "bigint", "numeric", "real", "double precision"].includes(
        c.data_type
      )
    );
    if (!numericCols.length) return [];

    const qSchema = this.quoteIdentifier(schemaName);
    const qTable = this.quoteIdentifier(tableName);
    const stats: DataScanNumericStat[] = [];

    for (const col of numericCols.slice(0, 12)) {
      const qCol = this.quoteIdentifier(col.column_name);
      const [row] = await this.db.query<{
        min_value: string | number | null;
        max_value: string | number | null;
        avg_value: string | number | null;
        null_count: string | number;
      }>(
        `
        SELECT
          MIN(${qCol}) AS min_value,
          MAX(${qCol}) AS max_value,
          AVG(${qCol}) AS avg_value,
          SUM(CASE WHEN ${qCol} IS NULL THEN 1 ELSE 0 END)::bigint AS null_count
        FROM ${qSchema}.${qTable}
        `
      );

      const toNum = (v: DbScalar): number | null =>
        v === null ? null : Number.isFinite(Number(v)) ? Number(v) : null;

      stats.push({
        column_name: col.column_name,
        min_value: toNum(row?.min_value ?? null),
        max_value: toNum(row?.max_value ?? null),
        avg_value: toNum(row?.avg_value ?? null),
        null_count: Number(row?.null_count ?? 0),
      });
    }

    return stats;
  }

  private async getSampleRows(
    schemaName: string,
    tableName: string
  ): Promise<Record<string, unknown>[]> {
    const qSchema = this.quoteIdentifier(schemaName);
    const qTable = this.quoteIdentifier(tableName);
    return this.db.query<Record<string, unknown>>(
      `SELECT * FROM ${qSchema}.${qTable} LIMIT 10`
    );
  }

  async getTableDetail(schemaName: string, tableName: string): Promise<DataScanTableDetail> {
    if (!this.isSafeIdentifier(schemaName) || !this.isSafeIdentifier(tableName)) {
      throw new Error("Invalid schema/table name");
    }

    const tables = await this.getTables({ schema: schemaName });
    const base = tables.find((t) => t.table_name === tableName);
    if (!base) {
      throw new Error(`Table not found: ${schemaName}.${tableName}`);
    }

    const columns = await this.getTableColumns(schemaName, tableName);
    const [indexes, geometry, exactRows, dateStats, numericStats, sampleRows] =
      await Promise.all([
        this.getTableIndexes(schemaName, tableName),
        this.getGeometryInfo(schemaName, tableName),
        this.getExactRows(schemaName, tableName),
        this.getDateStats(schemaName, tableName, columns),
        this.getNumericStats(schemaName, tableName, columns),
        this.getSampleRows(schemaName, tableName),
      ]);

    const anomalies = this.buildTableAnomalies(base);

    for (const g of geometry) {
      if (g.invalid_count > 0) {
        anomalies.push({
          id: `${schemaName}.${tableName}:geom:${g.column_name}`,
          severity: "critical",
          scope: "column",
          schema_name: schemaName,
          table_name: tableName,
          column_name: g.column_name,
          code: "INVALID_GEOMETRY",
          message: `Géométries invalides détectées (${g.invalid_count}) sur ${g.column_name}.`,
        });
      }
    }

    for (const d of dateStats) {
      if (exactRows > 0 && d.null_count / exactRows > 0.8) {
        anomalies.push({
          id: `${schemaName}.${tableName}:date:null:${d.column_name}`,
          severity: "warning",
          scope: "column",
          schema_name: schemaName,
          table_name: tableName,
          column_name: d.column_name,
          code: "HIGH_NULL_RATIO",
          message: `Plus de 80% de valeurs nulles sur ${d.column_name}.`,
        });
      }
    }

    return {
      schema_name: base.schema_name,
      table_name: base.table_name,
      table_type: base.table_type,
      estimated_rows: base.estimated_rows,
      exact_rows: exactRows,
      dashboard_useful: base.dashboard_useful,
      description: base.dashboard_useful
        ? "Table potentiellement utile pour les modules dashboard."
        : "Table technique ou secondaire.",
      columns,
      indexes,
      geometry,
      date_stats: dateStats,
      numeric_stats: numericStats,
      sample_rows: sampleRows,
      anomalies,
    };
  }
}

export const dataScanService = new DataScanService();

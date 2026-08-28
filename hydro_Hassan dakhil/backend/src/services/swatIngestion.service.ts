import fs from "fs";
import { spawn } from "child_process";
import path from "path";
import { Pool, PoolClient } from "pg";
import db from "../config/database.config";
import {
  resolveDefaultSwatRunCode,
  validateSwatImportCodes,
} from "../constants/swatScenarios";
import { AppError } from "../middleware/errorHandler";
import {
  SwatAvailabilityRow,
  SwatBatchRow,
  SwatDeleteFilterPayload,
  SwatImportPayload,
  SwatVariableCode,
} from "../types/swatIngestion.types";

type Queryable = PoolClient | Pool;

type PropertyMeta = {
  code: SwatVariableCode;
  name: string;
  unit: string;
  standardName: string;
  description: string;
};

const SWAT_PROPERTIES: PropertyMeta[] = [
  {
    code: "flow_m3s",
    name: "SWAT Débits m³/s",
    unit: "m3/s",
    standardName: "SWAT_FLOW_M3S",
    description: "SWAT simulated Débits m³/s at reach outlet (FLOW_OUT).",
  },
  {
    code: "sed_tons",
    name: "SWAT Sediment (t)",
    unit: "tons",
    standardName: "SWAT_SED_TONS",
    description: "SWAT simulated sediment out at reach outlet (SED_OUT).",
  },
  {
    code: "syldt_ha",
    name: "SWAT Dégradation spécifique (t/ha)",
    unit: "t/ha",
    standardName: "SWAT_SYLDT_HA",
    description: "SWAT simulated sediment yield by subbasin (SYLDt/ha).",
  },
];

export class SwatIngestionService {
  private pool = db.getPool();
  private infrastructureReady = false;
  private infrastructureInitPromise: Promise<void> | null = null;

  private async ensureInfrastructureNoTx(): Promise<void> {
    if (this.infrastructureReady) {
      return;
    }

    if (!this.infrastructureInitPromise) {
      this.infrastructureInitPromise = (async () => {
        const client = await this.pool.connect();
        try {
          await client.query("BEGIN");
          await this.ensureInfrastructure(client);
          await client.query("COMMIT");
        } catch (error) {
          await client.query("ROLLBACK");
          throw error;
        } finally {
          client.release();
        }
      })();
    }

    try {
      await this.infrastructureInitPromise;
      this.infrastructureReady = true;
    } catch (error) {
      this.infrastructureInitPromise = null;
      throw error;
    }
  }

  private async query<T = Record<string, unknown>>(
    sql: string,
    params: unknown[] = [],
    client?: Queryable
  ): Promise<T[]> {
    const executor = client ?? this.pool;
    const result = await executor.query(sql, params);
    return result.rows as T[];
  }

  private async execute(
    sql: string,
    params: unknown[] = [],
    client?: Queryable
  ): Promise<number> {
    const executor = client ?? this.pool;
    const result = await executor.query(sql, params);
    return result.rowCount ?? 0;
  }

  private newBatchId(): string {
    const now = new Date();
    const pad = (v: number) => String(v).padStart(2, "0");
    const ts = `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}_${pad(
      now.getUTCHours()
    )}${pad(now.getUTCMinutes())}${pad(now.getUTCSeconds())}`;
    const suffix = Math.random().toString(36).slice(2, 8).toUpperCase();
    return `SWAT_${ts}_${suffix}`;
  }

  private resolveImportScriptPath(): string {
    if (process.env.SWAT_IMPORT_SCRIPT_PATH?.trim()) {
      return process.env.SWAT_IMPORT_SCRIPT_PATH.trim();
    }

    const candidates = [
      path.resolve(process.cwd(), "..", "..", "scripts", "swat-import", "import_swat_output.ps1"),
      path.resolve(process.cwd(), "scripts", "swat-import", "import_swat_output.ps1"),
      path.resolve(__dirname, "..", "..", "..", "..", "scripts", "swat-import", "import_swat_output.ps1"),
      path.resolve(__dirname, "..", "..", "..", "..", "..", "scripts", "swat-import", "import_swat_output.ps1"),
    ];

    return candidates.find((candidate) => fs.existsSync(candidate)) ?? candidates[0];
  }

  private ensureExternalImportSupport(importMode: "import" | "reload" | "preview"): string {
    if (process.platform !== "win32") {
      throw new AppError(
        `SWAT MDB mode "${importMode}" is only supported on a local Windows backend. Use skipAccess in Docker/Linux.`,
        400
      );
    }

    const importScriptPath = this.resolveImportScriptPath();
    if (!fs.existsSync(importScriptPath)) {
      throw new AppError(`SWAT import script not found: ${importScriptPath}`, 500);
    }

    return importScriptPath;
  }

  private runPowerShellScript(
    scriptPath: string,
    scriptArgs: string[]
  ): Promise<{ exitCode: number; logs: string[] }> {
    return new Promise((resolve, reject) => {
      const logs: string[] = [];
      const child = spawn(
        "powershell.exe",
        ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", scriptPath, ...scriptArgs],
        {
          shell: false,
          windowsHide: true,
        }
      );

      child.stdout.on("data", (chunk: Buffer) => {
        logs.push(chunk.toString());
      });
      child.stderr.on("data", (chunk: Buffer) => {
        logs.push(chunk.toString());
      });
      child.on("error", (error) => reject(error));
      child.on("close", (code) => resolve({ exitCode: code ?? -1, logs }));
    });
  }

  private summarizeScriptLogs(logs: string[]): string {
    const lines = logs
      .flatMap((chunk) => chunk.split(/\r?\n/))
      .map((line) => line.trim())
      .filter(Boolean);

    return lines.slice(-8).join(" | ");
  }

  private buildScriptFailureError(exitCode: number, logs: string[]): AppError {
    const rawDetail = logs.join("\n");
    const detail = this.summarizeScriptLogs(logs);

    if (/Impossible de trouver SWATOutput\.mdb/i.test(rawDetail)) {
      return new AppError(
        detail
          ? `SWAT MDB source unavailable. ${detail}`
          : "SWAT MDB source unavailable. Configure SWAT_MDB_PATH or SWAT_DATA_ROOT with a valid Hassan Addakhil SWATOutput.mdb.",
        412
      );
    }

    return new AppError(
      detail
        ? `SWAT Access import script failed (exit=${exitCode}). ${detail}`
        : `SWAT Access import script failed (exit=${exitCode}).`,
      500
    );
  }

  private async ensureInfrastructure(client: Queryable): Promise<void> {
    await this.execute(
      `
      CREATE SCHEMA IF NOT EXISTS staging;

      CREATE TABLE IF NOT EXISTS core.data_batches (
        batch_id text PRIMARY KEY,
        source text NOT NULL,
        source_file text,
        imported_at timestamptz NOT NULL DEFAULT now(),
        status text NOT NULL DEFAULT 'running',
        row_count integer NOT NULL DEFAULT 0,
        run_id integer REFERENCES core.model_runs(run_id),
        scenario_code text,
        notes text
      );

      CREATE TABLE IF NOT EXISTS core.measurement_batches (
        ts_id integer NOT NULL,
        datetime timestamptz NOT NULL,
        batch_id text NOT NULL REFERENCES core.data_batches(batch_id) ON DELETE CASCADE,
        created_at timestamptz NOT NULL DEFAULT now(),
        PRIMARY KEY (ts_id, datetime, batch_id),
        FOREIGN KEY (ts_id, datetime) REFERENCES core.measurements(ts_id, datetime) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS core.swat_entity_map (
        entity_type text NOT NULL CHECK (entity_type IN ('sub','rch')),
        swat_code integer NOT NULL,
        subbasin_id integer,
        reach_id integer,
        station_id integer REFERENCES core.stations(station_id),
        mapping_method text NOT NULL DEFAULT 'manual',
        confidence numeric(5,2) NOT NULL DEFAULT 1.00,
        is_active boolean NOT NULL DEFAULT true,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        PRIMARY KEY (entity_type, swat_code)
      );

      CREATE TABLE IF NOT EXISTS staging.swat_rch_raw (
        raw_id bigserial PRIMARY KEY,
        batch_id text NOT NULL,
        source_import_id bigint,
        scenario_code text,
        swat_rch integer,
        swat_sub integer,
        year integer,
        mon integer,
        yyyyddd integer,
        period_date date,
        flow_out double precision,
        sed_out double precision,
        source_file text,
        raw_record jsonb,
        inserted_at timestamptz NOT NULL DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS staging.swat_sub_raw (
        raw_id bigserial PRIMARY KEY,
        batch_id text NOT NULL,
        source_import_id bigint,
        scenario_code text,
        swat_sub integer,
        year integer,
        mon integer,
        yyyyddd integer,
        period_date date,
        syldt_ha double precision,
        source_file text,
        raw_record jsonb,
        inserted_at timestamptz NOT NULL DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS staging.swat_rch_norm (
        norm_id bigserial PRIMARY KEY,
        batch_id text NOT NULL,
        scenario_code text,
        run_id integer,
        reach_id integer,
        subbasin_id integer,
        station_code text,
        station_id integer,
        obs_date date,
        flow_m3s double precision,
        sed_tons double precision,
        mapping_method text,
        mapping_confidence numeric(5,2),
        inserted_at timestamptz NOT NULL DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS staging.swat_sub_norm (
        norm_id bigserial PRIMARY KEY,
        batch_id text NOT NULL,
        scenario_code text,
        run_id integer,
        subbasin_id integer,
        station_code text,
        station_id integer,
        obs_date date,
        syldt_ha double precision,
        mapping_method text,
        mapping_confidence numeric(5,2),
        inserted_at timestamptz NOT NULL DEFAULT now()
      );

      CREATE INDEX IF NOT EXISTS idx_swat_rch_raw_batch ON staging.swat_rch_raw(batch_id);
      CREATE INDEX IF NOT EXISTS idx_swat_sub_raw_batch ON staging.swat_sub_raw(batch_id);
      CREATE INDEX IF NOT EXISTS idx_swat_rch_norm_batch ON staging.swat_rch_norm(batch_id);
      CREATE INDEX IF NOT EXISTS idx_swat_sub_norm_batch ON staging.swat_sub_norm(batch_id);
      CREATE INDEX IF NOT EXISTS idx_swat_entity_map_lookup ON core.swat_entity_map(entity_type, swat_code) WHERE is_active;
      CREATE INDEX IF NOT EXISTS idx_measurement_batches_batch ON core.measurement_batches(batch_id);
      `,
      [],
      client
    );
  }

  private async ensureObservedProperties(client: Queryable): Promise<Record<SwatVariableCode, number>> {
    const result: Partial<Record<SwatVariableCode, number>> = {};

    for (const property of SWAT_PROPERTIES) {
      const existing = await this.query<{ property_id: number }>(
        `SELECT property_id FROM ref.observed_properties WHERE standard_name = $1 OR name = $2 LIMIT 1`,
        [property.standardName, property.name],
        client
      );

      if (existing.length > 0) {
        result[property.code] = existing[0].property_id;
        await this.execute(
          `
          UPDATE ref.observed_properties
          SET name = $2, unit = $3, standard_name = $4, description = $5
          WHERE property_id = $1
          `,
          [existing[0].property_id, property.name, property.unit, property.standardName, property.description],
          client
        );
        continue;
      }

      const created = await this.query<{ property_id: number }>(
        `
        WITH mx AS (
          SELECT COALESCE(MAX(property_id), 0) AS max_id
          FROM ref.observed_properties
        )
        INSERT INTO ref.observed_properties (property_id, name, unit, standard_name, description)
        SELECT mx.max_id + 1, $1, $2, $3, $4
        FROM mx
        RETURNING property_id
        `,
        [property.name, property.unit, property.standardName, property.description],
        client
      );
      result[property.code] = created[0].property_id;
    }

    return result as Record<SwatVariableCode, number>;
  }

  private async ensureModelRun(
    client: Queryable,
    runCode: string,
    runName: string,
    scenarioCode: string
  ): Promise<number> {
    const existing = await this.query<{ run_id: number }>(
      `SELECT run_id FROM core.model_runs WHERE scenario_code = $1 LIMIT 1`,
      [runCode],
      client
    );

    if (existing.length > 0) {
      await this.execute(
        `
        UPDATE core.model_runs
        SET scenario_name = $2,
            description = $3,
            is_observed = false
        WHERE run_id = $1
        `,
        [existing[0].run_id, runName, `SWAT simulated run (${scenarioCode})`],
        client
      );
      return existing[0].run_id;
    }

    const inserted = await this.query<{ run_id: number }>(
      `
      WITH mx AS (
        SELECT COALESCE(MAX(run_id), 0) AS max_id
        FROM core.model_runs
      )
      INSERT INTO core.model_runs (run_id, scenario_code, scenario_name, description, is_observed)
      SELECT mx.max_id + 1, $1, $2, $3, false
      FROM mx
      RETURNING run_id
      `,
      [runCode, runName, `SWAT simulated run (${scenarioCode})`],
      client
    );
    return inserted[0].run_id;
  }

  private async getLatestAccessImportId(scenarioCode?: string): Promise<number | null> {
    const rows = await this.query<{ import_id: number }>(
      `
      SELECT import_id
      FROM access.import_runs
      WHERE (
          status = 'finished'
          OR (status = 'running' AND COALESCE(total_rows, 0) > 0)
        )
        AND ($1::text IS NULL OR scenario_code = $1)
      ORDER BY
        CASE WHEN status = 'finished' THEN 0 ELSE 1 END,
        import_id DESC
      LIMIT 1
      `,
      [scenarioCode ?? null]
    );
    return rows.length > 0 ? Number(rows[0].import_id) : null;
  }

  private async populateRawFromAccess(
    client: Queryable,
    batchId: string,
    scenarioCode: string,
    accessImportId: number | null
  ): Promise<{ rchRows: number; subRows: number }> {
    await this.execute(`DELETE FROM staging.swat_rch_raw WHERE batch_id = $1`, [batchId], client);
    await this.execute(`DELETE FROM staging.swat_sub_raw WHERE batch_id = $1`, [batchId], client);

    const rchRows = await this.execute(
      `
      INSERT INTO staging.swat_rch_raw (
        batch_id, source_import_id, scenario_code, swat_rch, swat_sub, year, mon, yyyyddd, period_date,
        flow_out, sed_out, source_file, raw_record
      )
      SELECT
        $1 AS batch_id,
        r.import_id AS source_import_id,
        r.scenario_code,
        NULL::integer AS swat_rch,
        r.sub_code AS swat_sub,
        r.year,
        r.mon,
        r.yyyyddd,
        r.period_date,
        r.flow_out_cms AS flow_out,
        r.sed_out_tons AS sed_out,
        r.source_file,
        to_jsonb(r) AS raw_record
      FROM access.rch_results r
      WHERE ($2::text IS NULL OR r.scenario_code = $2)
        AND ($3::bigint IS NULL OR r.import_id = $3)
      `,
      [batchId, scenarioCode || null, accessImportId],
      client
    );

    const subRows = await this.execute(
      `
      INSERT INTO staging.swat_sub_raw (
        batch_id, source_import_id, scenario_code, swat_sub, year, mon, yyyyddd, period_date, syldt_ha, source_file, raw_record
      )
      SELECT
        $1 AS batch_id,
        s.import_id AS source_import_id,
        s.scenario_code,
        s.sub_code AS swat_sub,
        s.year,
        s.mon,
        s.yyyyddd,
        s.period_date,
        s.syld_t_ha AS syldt_ha,
        s.source_file,
        to_jsonb(s) AS raw_record
      FROM access.sub_results s
      WHERE ($2::text IS NULL OR s.scenario_code = $2)
        AND ($3::bigint IS NULL OR s.import_id = $3)
      `,
      [batchId, scenarioCode || null, accessImportId],
      client
    );

    return { rchRows, subRows };
  }

  private async normalize(
    client: Queryable,
    batchId: string,
    runId: number
  ): Promise<{ normRchRows: number; normSubRows: number }> {
    await this.execute(`DELETE FROM staging.swat_rch_norm WHERE batch_id = $1`, [batchId], client);
    await this.execute(`DELETE FROM staging.swat_sub_norm WHERE batch_id = $1`, [batchId], client);

    const normSubRows = await this.execute(
      `
      INSERT INTO staging.swat_sub_norm (
        batch_id, scenario_code, run_id, subbasin_id, station_code, obs_date, syldt_ha, mapping_method, mapping_confidence
      )
      SELECT
        r.batch_id,
        r.scenario_code,
        $2 AS run_id,
        COALESCE(m.subbasin_id, g.subbasin_id, r.swat_sub) AS subbasin_id,
        'swat_sub_' || COALESCE(m.subbasin_id, g.subbasin_id, r.swat_sub)::text AS station_code,
        COALESCE(r.period_date, to_date(r.yyyyddd::text, 'YYYYDDD'), make_date(r.year, GREATEST(COALESCE(r.mon, 1), 1), 1)) AS obs_date,
        r.syldt_ha,
        COALESCE(m.mapping_method, CASE WHEN g.subbasin_id IS NOT NULL THEN 'gis_match' ELSE 'fallback_code' END) AS mapping_method,
        COALESCE(m.confidence, CASE WHEN g.subbasin_id IS NOT NULL THEN 0.95 ELSE 0.40 END) AS mapping_confidence
      FROM staging.swat_sub_raw r
      LEFT JOIN core.swat_entity_map m
        ON m.entity_type = 'sub'
       AND m.swat_code = r.swat_sub
       AND m.is_active = true
      LEFT JOIN LATERAL (
        SELECT s.subbasin_id
        FROM gis.subbasin_shapes s
        WHERE s.subbasin_id = r.swat_sub
           OR s.subbasin_code = r.swat_sub
        ORDER BY CASE
          WHEN s.subbasin_id = r.swat_sub THEN 1
          WHEN s.subbasin_code = r.swat_sub THEN 2
          ELSE 99
        END
        LIMIT 1
      ) g ON true
      WHERE r.batch_id = $1
      `,
      [batchId, runId],
      client
    );

    const normRchRows = await this.execute(
      `
      INSERT INTO staging.swat_rch_norm (
        batch_id, scenario_code, run_id, reach_id, subbasin_id, station_code, obs_date, flow_m3s, sed_tons, mapping_method, mapping_confidence
      )
      SELECT
        r.batch_id,
        r.scenario_code,
        $2 AS run_id,
        COALESCE(m.reach_id, rg.reach_id, r.swat_rch, r.swat_sub) AS reach_id,
        COALESCE(m.subbasin_id, rg.subbasin_id, r.swat_sub) AS subbasin_id,
        'swat_rch_' || COALESCE(m.reach_id, rg.reach_id, r.swat_rch, r.swat_sub)::text AS station_code,
        COALESCE(r.period_date, to_date(r.yyyyddd::text, 'YYYYDDD'), make_date(r.year, GREATEST(COALESCE(r.mon, 1), 1), 1)) AS obs_date,
        r.flow_out AS flow_m3s,
        r.sed_out AS sed_tons,
        COALESCE(m.mapping_method, CASE WHEN rg.reach_id IS NOT NULL THEN 'gis_match' ELSE 'fallback_code' END) AS mapping_method,
        COALESCE(m.confidence, CASE WHEN rg.reach_id IS NOT NULL THEN 0.90 ELSE 0.35 END) AS mapping_confidence
      FROM staging.swat_rch_raw r
      LEFT JOIN core.swat_entity_map m
        ON m.entity_type = 'rch'
       AND m.swat_code = COALESCE(r.swat_rch, r.swat_sub)
       AND m.is_active = true
      LEFT JOIN LATERAL (
        SELECT g.reach_id, g.subbasin_id
        FROM gis.reach_shapes g
        WHERE (r.swat_rch IS NOT NULL AND (g.reach_id = r.swat_rch OR g.reach_code = r.swat_rch))
           OR g.reach_id = r.swat_sub
           OR g.reach_code = r.swat_sub
           OR g.subbasin_id = r.swat_sub
        ORDER BY CASE
          WHEN r.swat_rch IS NOT NULL AND g.reach_id = r.swat_rch THEN 1
          WHEN r.swat_rch IS NOT NULL AND g.reach_code = r.swat_rch THEN 2
          WHEN g.reach_id = r.swat_sub THEN 3
          WHEN g.reach_code = r.swat_sub THEN 4
          WHEN g.subbasin_id = r.swat_sub THEN 5
          ELSE 99
        END
        LIMIT 1
      ) rg ON true
      WHERE r.batch_id = $1
      `,
      [batchId, runId],
      client
    );

    await this.execute(
      `
      WITH ranked AS (
        SELECT
          'rch'::text AS entity_type,
          COALESCE(sr.swat_rch, sr.swat_sub) AS swat_code,
          rn.subbasin_id,
          rn.reach_id,
          rn.mapping_method,
          rn.mapping_confidence,
          now() AS updated_at,
          ROW_NUMBER() OVER (
            PARTITION BY COALESCE(sr.swat_rch, sr.swat_sub)
            ORDER BY rn.mapping_confidence DESC NULLS LAST, rn.subbasin_id NULLS LAST, rn.reach_id NULLS LAST
          ) AS rn_rank
        FROM staging.swat_rch_raw sr
        JOIN staging.swat_rch_norm rn
          ON rn.batch_id = sr.batch_id
         AND rn.obs_date = COALESCE(sr.period_date, to_date(sr.yyyyddd::text, 'YYYYDDD'), make_date(sr.year, GREATEST(COALESCE(sr.mon, 1), 1), 1))
        WHERE sr.batch_id = $1
      )
      INSERT INTO core.swat_entity_map (entity_type, swat_code, subbasin_id, reach_id, mapping_method, confidence, is_active, updated_at)
      SELECT
        entity_type,
        swat_code,
        subbasin_id,
        reach_id,
        mapping_method,
        mapping_confidence,
        true,
        updated_at
      FROM ranked
      WHERE rn_rank = 1
      ON CONFLICT (entity_type, swat_code) DO UPDATE
      SET subbasin_id = EXCLUDED.subbasin_id,
          reach_id = EXCLUDED.reach_id,
          mapping_method = EXCLUDED.mapping_method,
          confidence = EXCLUDED.confidence,
          is_active = true,
          updated_at = now()
      `,
      [batchId],
      client
    );

    await this.execute(
      `
      WITH ranked AS (
        SELECT
          'sub'::text AS entity_type,
          sr.swat_sub AS swat_code,
          sn.subbasin_id,
          sn.mapping_method,
          sn.mapping_confidence,
          now() AS updated_at,
          ROW_NUMBER() OVER (
            PARTITION BY sr.swat_sub
            ORDER BY sn.mapping_confidence DESC NULLS LAST, sn.subbasin_id NULLS LAST
          ) AS rn_rank
        FROM staging.swat_sub_raw sr
        JOIN staging.swat_sub_norm sn
          ON sn.batch_id = sr.batch_id
         AND sn.obs_date = COALESCE(sr.period_date, to_date(sr.yyyyddd::text, 'YYYYDDD'), make_date(sr.year, GREATEST(COALESCE(sr.mon, 1), 1), 1))
        WHERE sr.batch_id = $1
      )
      INSERT INTO core.swat_entity_map (entity_type, swat_code, subbasin_id, mapping_method, confidence, is_active, updated_at)
      SELECT
        entity_type,
        swat_code,
        subbasin_id,
        mapping_method,
        mapping_confidence,
        true,
        updated_at
      FROM ranked
      WHERE rn_rank = 1
      ON CONFLICT (entity_type, swat_code) DO UPDATE
      SET subbasin_id = EXCLUDED.subbasin_id,
          mapping_method = EXCLUDED.mapping_method,
          confidence = EXCLUDED.confidence,
          is_active = true,
          updated_at = now()
      `,
      [batchId],
      client
    );

    return { normRchRows, normSubRows };
  }

  private async ensureSyntheticStations(client: Queryable, batchId: string): Promise<void> {
    await this.execute(
      `
      WITH src AS (
        SELECT DISTINCT
          n.station_code,
          'SWAT subbasin ' || n.subbasin_id::text AS name,
          'SWAT'::text AS type_station,
          'SWAT_SUBBASIN'::text AS station_type_code,
          s.catchment_id,
          NULL::integer AS reach_id
        FROM staging.swat_sub_norm n
        LEFT JOIN gis.subbasin_shapes s ON s.subbasin_id = n.subbasin_id
        WHERE n.batch_id = $1
          AND n.station_code IS NOT NULL
        UNION
        SELECT DISTINCT
          n.station_code,
          'SWAT reach ' || n.reach_id::text AS name,
          'SWAT'::text AS type_station,
          'SWAT_REACH'::text AS station_type_code,
          r.catchment_id,
          NULL::integer AS reach_id
        FROM staging.swat_rch_norm n
        LEFT JOIN gis.reach_shapes r ON r.reach_id = n.reach_id
        WHERE n.batch_id = $1
          AND n.station_code IS NOT NULL
      ),
      missing AS (
        SELECT src.*
        FROM src
        LEFT JOIN core.stations st ON st.station_code = src.station_code
        WHERE st.station_id IS NULL
      ),
      mx AS (
        SELECT COALESCE(MAX(station_id), 0) AS max_id
        FROM core.stations
      )
      INSERT INTO core.stations (
        station_id, station_code, name, type_station, station_type_code, catchment_id, reach_id
      )
      SELECT
        mx.max_id + ROW_NUMBER() OVER (ORDER BY missing.station_code),
        missing.station_code,
        missing.name,
        missing.type_station,
        missing.station_type_code,
        missing.catchment_id,
        missing.reach_id
      FROM missing
      CROSS JOIN mx
      `,
      [batchId],
      client
    );

    await this.execute(
      `
      UPDATE staging.swat_sub_norm n
      SET station_id = st.station_id
      FROM core.stations st
      WHERE n.batch_id = $1
        AND st.station_code = n.station_code
      `,
      [batchId],
      client
    );

    await this.execute(
      `
      UPDATE staging.swat_rch_norm n
      SET station_id = st.station_id
      FROM core.stations st
      WHERE n.batch_id = $1
        AND st.station_code = n.station_code
      `,
      [batchId],
      client
    );
  }

  private async upsertTimeseriesAndMeasurements(
    client: Queryable,
    batchId: string,
    runId: number,
    propertyIds: Record<SwatVariableCode, number>
  ): Promise<{ timeseriesInserted: number; measurementsUpserted: number }> {
    const timeseriesInserted = await this.execute(
      `
      WITH candidates AS (
        SELECT DISTINCT station_id, $2::integer AS property_id
        FROM staging.swat_rch_norm
        WHERE batch_id = $1 AND station_id IS NOT NULL AND flow_m3s IS NOT NULL
        UNION
        SELECT DISTINCT station_id, $3::integer
        FROM staging.swat_rch_norm
        WHERE batch_id = $1 AND station_id IS NOT NULL AND sed_tons IS NOT NULL
        UNION
        SELECT DISTINCT station_id, $4::integer
        FROM staging.swat_sub_norm
        WHERE batch_id = $1 AND station_id IS NOT NULL AND syldt_ha IS NOT NULL
      ),
      missing AS (
        SELECT c.station_id, c.property_id
        FROM candidates c
        LEFT JOIN core.timeseries t
          ON t.station_id = c.station_id
         AND t.property_id = c.property_id
         AND t.run_id = $5
         AND t.source_type = 'simulated'
         AND t.time_step = 'daily'
        WHERE t.ts_id IS NULL
      ),
      mx AS (
        SELECT COALESCE(MAX(ts_id), 0) AS max_id
        FROM core.timeseries
      )
      INSERT INTO core.timeseries (ts_id, station_id, property_id, run_id, source_type, time_step, created_at)
      SELECT
        mx.max_id + ROW_NUMBER() OVER (ORDER BY missing.station_id, missing.property_id),
        missing.station_id,
        missing.property_id,
        $5,
        'simulated',
        'daily',
        now()
      FROM missing
      CROSS JOIN mx
      `,
      [batchId, propertyIds.flow_m3s, propertyIds.sed_tons, propertyIds.syldt_ha, runId],
      client
    );

    const measurementsUpserted = await this.execute(
      `
      WITH flow_rows AS (
        SELECT t.ts_id, (n.obs_date::timestamp AT TIME ZONE 'UTC') AS dt, n.flow_m3s AS val
        FROM staging.swat_rch_norm n
        JOIN core.timeseries t
          ON t.station_id = n.station_id
         AND t.property_id = $2
         AND t.run_id = $5
         AND t.source_type = 'simulated'
         AND t.time_step = 'daily'
        WHERE n.batch_id = $1 AND n.flow_m3s IS NOT NULL AND n.obs_date IS NOT NULL
      ),
      sed_rows AS (
        SELECT t.ts_id, (n.obs_date::timestamp AT TIME ZONE 'UTC') AS dt, n.sed_tons AS val
        FROM staging.swat_rch_norm n
        JOIN core.timeseries t
          ON t.station_id = n.station_id
         AND t.property_id = $3
         AND t.run_id = $5
         AND t.source_type = 'simulated'
         AND t.time_step = 'daily'
        WHERE n.batch_id = $1 AND n.sed_tons IS NOT NULL AND n.obs_date IS NOT NULL
      ),
      syld_rows AS (
        SELECT t.ts_id, (n.obs_date::timestamp AT TIME ZONE 'UTC') AS dt, n.syldt_ha AS val
        FROM staging.swat_sub_norm n
        JOIN core.timeseries t
          ON t.station_id = n.station_id
         AND t.property_id = $4
         AND t.run_id = $5
         AND t.source_type = 'simulated'
         AND t.time_step = 'daily'
        WHERE n.batch_id = $1 AND n.syldt_ha IS NOT NULL AND n.obs_date IS NOT NULL
      ),
      union_rows AS (
        SELECT * FROM flow_rows
        UNION ALL
        SELECT * FROM sed_rows
        UNION ALL
        SELECT * FROM syld_rows
      ),
      deduped_rows AS (
        SELECT
          ts_id,
          dt,
          MAX(val)::double precision AS val
        FROM union_rows
        GROUP BY ts_id, dt
      ),
      updated AS (
        UPDATE core.measurements m
        SET value = d.val
        FROM deduped_rows d
        WHERE m.ts_id = d.ts_id
          AND m.datetime = d.dt
        RETURNING m.ts_id, m.datetime
      ),
      inserted AS (
        INSERT INTO core.measurements (ts_id, datetime, value, quality_flag)
        SELECT d.ts_id, d.dt, d.val, NULL::smallint
        FROM deduped_rows d
        WHERE NOT EXISTS (
          SELECT 1
          FROM core.measurements m
          WHERE m.ts_id = d.ts_id
            AND m.datetime = d.dt
        )
        RETURNING ts_id, datetime
      ),
      touched AS (
        SELECT ts_id, datetime FROM updated
        UNION
        SELECT ts_id, datetime FROM inserted
      )
      INSERT INTO core.measurement_batches (ts_id, datetime, batch_id)
      SELECT t.ts_id, t.datetime, $1
      FROM touched t
      WHERE NOT EXISTS (
        SELECT 1
        FROM core.measurement_batches mb
        WHERE mb.ts_id = t.ts_id
          AND mb.datetime = t.datetime
          AND mb.batch_id = $1
      )
      `,
      [batchId, propertyIds.flow_m3s, propertyIds.sed_tons, propertyIds.syldt_ha, runId],
      client
    );

    return { timeseriesInserted, measurementsUpserted };
  }

  async importSwat(payload: SwatImportPayload): Promise<Record<string, unknown>> {
    const scenarioCode = payload.scenarioCode?.trim() || "etat_actuel";
    const runCode = payload.runCode?.trim() || resolveDefaultSwatRunCode(scenarioCode);
    const runName = payload.runName?.trim() || `SWAT ${scenarioCode}`;
    const dryRun = payload.dryRun === true;
    const importMode = payload.importMode ?? "skipAccess";
    const batchId = this.newBatchId();
    const logs: string[] = [];
    const isScenarioFolderRun = /^scenario_[1-4]$/i.test(scenarioCode);
    const codeErrors = validateSwatImportCodes(scenarioCode, runCode);

    if (codeErrors.length > 0) {
      throw new AppError(`Invalid SWAT import codes. ${codeErrors.join(" ")}`, 400);
    }

    if (importMode !== "skipAccess") {
      const importScriptPath = this.ensureExternalImportSupport(importMode);
      const scriptArgs = ["-Mode", importMode];
      if (payload.mdbPath?.trim()) {
        scriptArgs.push("-MdbPath", payload.mdbPath.trim());
      }

      const scriptResult = await this.runPowerShellScript(importScriptPath, scriptArgs);
      logs.push(...scriptResult.logs);
      if (scriptResult.exitCode !== 0) {
        throw this.buildScriptFailureError(scriptResult.exitCode, scriptResult.logs);
      }
      if (importMode === "preview") {
        return { mode: "preview", logs };
      }
    }

    const accessImportId = isScenarioFolderRun ? null : await this.getLatestAccessImportId(scenarioCode);
    const client = await this.pool.connect();

    try {
      await client.query("BEGIN");
      await this.ensureInfrastructure(client);

      const propertyIds = await this.ensureObservedProperties(client);
      const runId = await this.ensureModelRun(client, runCode, runName, scenarioCode);

      await this.execute(
        `
        INSERT INTO core.data_batches (
          batch_id, source, source_file, imported_at, status, row_count, run_id, scenario_code, notes
        )
        VALUES ($1, 'SWAT', $2, now(), $3, 0, $4, $5, $6)
        ON CONFLICT (batch_id) DO UPDATE
        SET status = EXCLUDED.status,
            imported_at = EXCLUDED.imported_at,
            run_id = EXCLUDED.run_id,
            scenario_code = EXCLUDED.scenario_code,
            notes = EXCLUDED.notes
        `,
        [
          batchId,
          payload.mdbPath ?? null,
          dryRun ? "dry-run" : "running",
          runId,
          scenarioCode,
          `Access import id: ${accessImportId ?? "N/A"}`,
        ],
        client
      );

      const raw = await this.populateRawFromAccess(client, batchId, scenarioCode, accessImportId);
      const normalized = await this.normalize(client, batchId, runId);
      await this.ensureSyntheticStations(client, batchId);
      const loaded = await this.upsertTimeseriesAndMeasurements(client, batchId, runId, propertyIds);

      const totalRows =
        Number(raw.rchRows) +
        Number(raw.subRows) +
        Number(normalized.normRchRows) +
        Number(normalized.normSubRows) +
        Number(loaded.measurementsUpserted);

      await this.execute(
        `UPDATE core.data_batches SET status = $2, row_count = $3 WHERE batch_id = $1`,
        [batchId, dryRun ? "dry-run" : "finished", totalRows],
        client
      );

      if (dryRun) {
        await client.query("ROLLBACK");
      } else {
        await client.query("COMMIT");
      }

      return {
        batch_id: batchId,
        run_id: runId,
        run_code: runCode,
        scenario_code: scenarioCode,
        access_import_id: accessImportId,
        dry_run: dryRun,
        counters: {
          raw_rch: raw.rchRows,
          raw_sub: raw.subRows,
          norm_rch: normalized.normRchRows,
          norm_sub: normalized.normSubRows,
          timeseries_inserted: loaded.timeseriesInserted,
          measurements_upserted: loaded.measurementsUpserted,
        },
        logs,
      };
    } catch (error) {
      await client.query("ROLLBACK");
      try {
        await this.execute(
          `UPDATE core.data_batches SET status = 'failed', notes = COALESCE(notes,'') || E'\n' || $2 WHERE batch_id = $1`,
          [batchId, error instanceof Error ? error.message : "unknown error"]
        );
      } catch {
        // noop
      }
      throw error;
    } finally {
      client.release();
    }
  }

  async listBatches(): Promise<SwatBatchRow[]> {
    await this.ensureInfrastructureNoTx();
    return this.query<SwatBatchRow>(
      `
      SELECT
        b.batch_id,
        COALESCE(b.scenario_code, b.batch_id) AS batch_name,
        b.source_file,
        b.imported_at::text AS imported_at,
        b.status,
        b.row_count,
        b.run_id,
        b.scenario_code,
        b.notes
      FROM core.data_batches b
      WHERE b.source = 'SWAT'
      ORDER BY b.imported_at DESC, b.batch_id DESC
      `
    );
  }

  async getSummary(): Promise<Record<string, unknown>> {
    await this.ensureInfrastructureNoTx();
    const rows = await this.query<Record<string, unknown>>(
      `
      WITH availability AS (
        SELECT
          CASE
            WHEN st.station_code LIKE 'swat_rch_%' THEN 'reach'
            WHEN st.station_code LIKE 'swat_sub_%' THEN 'subbasin'
            WHEN st.station_type_code = 'SWAT_REACH' THEN 'reach'
            WHEN st.station_type_code = 'SWAT_SUBBASIN' THEN 'subbasin'
            ELSE 'station'
          END AS entity_type,
          v.source_type AS data_type,
          v.station_id,
          COALESCE(v.n_points, 0)::int AS points_count
        FROM public.v_ts_catalog_enriched v
        JOIN core.stations st ON st.station_id = v.station_id
      )
      , swat_props AS (
        SELECT DISTINCT v.standard_name
        FROM public.v_ts_catalog_enriched v
        WHERE v.source_type = 'simulated'
      ),
      simulated AS (
        SELECT *
        FROM availability
        WHERE data_type = 'simulated'
      )
      SELECT
        (SELECT COUNT(*)::int FROM core.data_batches WHERE source = 'SWAT') AS batches_swat,
        (SELECT COUNT(*)::int FROM simulated) AS availability_simulated,
        (SELECT COALESCE(SUM(points_count),0)::int FROM simulated) AS points_simulated,
        (SELECT COUNT(DISTINCT station_id)::int FROM public.v_ts_catalog_enriched WHERE source_type = 'simulated') AS entities_unique_simulated,
        (SELECT COALESCE(SUM(points_count),0)::int FROM simulated WHERE entity_type = 'reach') AS points_reach_simulated,
        (SELECT COALESCE(SUM(points_count),0)::int FROM simulated WHERE entity_type = 'subbasin') AS points_subbasin_simulated,
        (SELECT COUNT(*)::int FROM swat_props) AS variables_simulated_available
      `
    );
    return rows[0] ?? {};
  }

  async getAvailability(): Promise<SwatAvailabilityRow[]> {
    await this.ensureInfrastructureNoTx();
    return this.query<SwatAvailabilityRow>(
      `
      WITH base AS (
        SELECT
          v.ts_id,
          v.station_id,
          st.station_code,
          st.name AS station_name,
          st.station_type_code,
          c.name AS basin_name,
          v.source_type AS data_type,
          v.property_id,
          v.standard_name,
          v.property_name,
          COALESCE(v.n_points, 0)::int AS points_count,
          v.start_date::date AS min_date,
          v.end_date::date AS max_date,
          v.run_id,
          COALESCE(v.scenario_name, mr.scenario_name) AS run_name,
          v.scenario_code,
          mb.batch_id
        FROM public.v_ts_catalog_enriched v
        JOIN core.stations st ON st.station_id = v.station_id
        LEFT JOIN core.catchments c ON c.catchment_id = st.catchment_id
        LEFT JOIN core.model_runs mr ON mr.run_id = v.run_id
        LEFT JOIN LATERAL (
          SELECT db.batch_id
          FROM core.data_batches db
          WHERE db.source = 'SWAT'
            AND db.run_id = v.run_id
            AND COALESCE(db.scenario_code, '') = COALESCE(v.scenario_code, '')
          ORDER BY db.imported_at DESC, db.batch_id DESC
          LIMIT 1
        ) mb ON true
      )
      SELECT
        CASE
          WHEN station_code LIKE 'swat_rch_%' THEN 'reach'
          WHEN station_code LIKE 'swat_sub_%' THEN 'subbasin'
          WHEN station_type_code = 'SWAT_REACH' THEN 'reach'
          WHEN station_type_code = 'SWAT_SUBBASIN' THEN 'subbasin'
          ELSE 'station'
        END AS entity_type,
        CASE
          WHEN station_code LIKE 'swat_sub_%' THEN COALESCE(NULLIF(replace(station_code, 'swat_sub_', ''), '')::int, station_id)
          WHEN station_code LIKE 'swat_rch_%' THEN COALESCE(NULLIF(replace(station_code, 'swat_rch_', ''), '')::int, station_id)
          ELSE station_id
        END AS entity_id,
        station_code AS entity_code,
        station_name AS entity_name,
        basin_name,
        data_type,
        CASE
          WHEN standard_name = 'SWAT_FLOW_M3S' THEN 'flow_m3s'
          WHEN standard_name = 'SWAT_SED_TONS' THEN 'sed_tons'
          WHEN standard_name = 'SWAT_SYLDT_HA' THEN 'syldt_ha'
          ELSE COALESCE(lower(standard_name), 'prop_' || property_id::text)
        END AS variable_code,
        property_name AS variable_label,
        points_count,
        min_date::text AS min_date,
        max_date::text AS max_date,
        'du ' || to_char(min_date, 'DD/MM/YYYY') || ' au ' || to_char(max_date, 'DD/MM/YYYY') AS period_fr,
        run_id,
        run_name,
        scenario_code,
        batch_id
      FROM base
      ORDER BY entity_type, entity_id, variable_code, data_type
      `
    );
  }

  async getData(filters: {
    entityType?: "subbasin" | "reach" | "station" | "basin";
    entityId?: number;
    entityCode?: string;
    variable?: SwatVariableCode;
    source?: "simulated" | "observed";
    periodStart?: string;
    periodEnd?: string;
    batchId?: string;
    runId?: number;
    limit?: number;
  }): Promise<Record<string, unknown>[]> {
    await this.ensureInfrastructureNoTx();
    const params: unknown[] = [];
    const where: string[] = ["1=1"];

    if (filters.entityType === "subbasin" && typeof filters.entityId === "number") {
      params.push(`swat_sub_${filters.entityId}`);
      where.push(`st.station_code = $${params.length}`);
    } else if (filters.entityType === "reach" && typeof filters.entityId === "number") {
      params.push(`swat_rch_${filters.entityId}`);
      where.push(`st.station_code = $${params.length}`);
    } else if (filters.entityType === "station" && typeof filters.entityId === "number") {
      params.push(filters.entityId);
      where.push(`st.station_id = $${params.length}`);
    }

    if (filters.entityCode?.trim()) {
      params.push(filters.entityCode.trim());
      where.push(`st.station_code = $${params.length}`);
    }

    if (filters.variable) {
      const variableMap: Record<SwatVariableCode, string> = {
        flow_m3s: "SWAT_FLOW_M3S",
        sed_tons: "SWAT_SED_TONS",
        syldt_ha: "SWAT_SYLDT_HA",
      };
      params.push(variableMap[filters.variable]);
      where.push(`op.standard_name = $${params.length}`);
    }

    if (filters.source) {
      params.push(filters.source);
      where.push(`ts.source_type = $${params.length}`);
    }

    if (filters.periodStart) {
      params.push(filters.periodStart);
      where.push(`m.datetime::date >= $${params.length}::date`);
    }

    if (filters.periodEnd) {
      params.push(filters.periodEnd);
      where.push(`m.datetime::date <= $${params.length}::date`);
    }

    if (typeof filters.runId === "number") {
      params.push(filters.runId);
      where.push(`ts.run_id = $${params.length}`);
    }

    if (filters.batchId) {
      params.push(filters.batchId);
      where.push(`mb.batch_id = $${params.length}`);
    }

    const limit = Math.min(Math.max(filters.limit ?? 2000, 1), 20000);
    params.push(limit);

    return this.query(
      `
      SELECT
        ts.ts_id,
        ts.run_id,
        mr.scenario_name AS run_name,
        mr.scenario_code,
        ts.source_type,
        CASE
          WHEN st.station_code LIKE 'swat_rch_%' THEN 'reach'
          WHEN st.station_code LIKE 'swat_sub_%' THEN 'subbasin'
          WHEN st.station_type_code = 'SWAT_REACH' THEN 'reach'
          WHEN st.station_type_code = 'SWAT_SUBBASIN' THEN 'subbasin'
          ELSE 'station'
        END AS entity_type,
        st.station_id,
        st.station_code,
        st.name AS station_name,
        c.name AS basin_name,
        op.property_id,
        CASE
          WHEN op.standard_name = 'SWAT_FLOW_M3S' THEN 'flow_m3s'
          WHEN op.standard_name = 'SWAT_SED_TONS' THEN 'sed_tons'
          WHEN op.standard_name = 'SWAT_SYLDT_HA' THEN 'syldt_ha'
          ELSE COALESCE(lower(op.standard_name), 'prop_' || op.property_id::text)
        END AS variable_code,
        op.standard_name,
        op.name AS property_name,
        op.unit,
        m.datetime::text AS datetime,
        m.value,
        mb.batch_id
      FROM core.measurements m
      JOIN core.timeseries ts ON ts.ts_id = m.ts_id
      JOIN core.stations st ON st.station_id = ts.station_id
      JOIN ref.observed_properties op ON op.property_id = ts.property_id
      JOIN core.model_runs mr ON mr.run_id = ts.run_id
      LEFT JOIN core.catchments c ON c.catchment_id = st.catchment_id
      LEFT JOIN core.measurement_batches mb
        ON mb.ts_id = m.ts_id
       AND mb.datetime = m.datetime
      WHERE ${where.join(" AND ")}
      ORDER BY m.datetime DESC
      LIMIT $${params.length}
      `,
      params
    );
  }

  async deleteByFilter(payload: SwatDeleteFilterPayload): Promise<Record<string, unknown>> {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");

      const where: string[] = ["ts.source_type = COALESCE($1, ts.source_type)"];
      const params: unknown[] = [payload.source_type ?? "simulated"];

      if (payload.entity_type === "subbasin" && typeof payload.entity_id === "number") {
        params.push(`swat_sub_${payload.entity_id}`);
        where.push(`st.station_code = $${params.length}`);
      } else if (payload.entity_type === "reach" && typeof payload.entity_id === "number") {
        params.push(`swat_rch_${payload.entity_id}`);
        where.push(`st.station_code = $${params.length}`);
      }

      if (payload.variable) {
        const variableMap: Record<SwatVariableCode, string> = {
          flow_m3s: "SWAT_FLOW_M3S",
          sed_tons: "SWAT_SED_TONS",
          syldt_ha: "SWAT_SYLDT_HA",
        };
        params.push(variableMap[payload.variable]);
        where.push(`op.standard_name = $${params.length}`);
      }

      if (payload.batch_id) {
        params.push(payload.batch_id);
        where.push(`mb.batch_id = $${params.length}`);
      }

      if (payload.period_start) {
        params.push(payload.period_start);
        where.push(`m.datetime::date >= $${params.length}::date`);
      }

      if (payload.period_end) {
        params.push(payload.period_end);
        where.push(`m.datetime::date <= $${params.length}::date`);
      }

      if (typeof payload.run_id === "number") {
        params.push(payload.run_id);
        where.push(`ts.run_id = $${params.length}`);
      }

      const countRows = await this.query<{ total: number }>(
        `
        SELECT COUNT(*)::int AS total
        FROM core.measurements m
        JOIN core.timeseries ts ON ts.ts_id = m.ts_id
        JOIN core.stations st ON st.station_id = ts.station_id
        JOIN ref.observed_properties op ON op.property_id = ts.property_id
        LEFT JOIN core.measurement_batches mb
          ON mb.ts_id = m.ts_id
         AND mb.datetime = m.datetime
        WHERE ${where.join(" AND ")}
        `,
        params,
        client
      );

      const toDelete = countRows[0]?.total ?? 0;
      if (!payload.confirm) {
        await client.query("ROLLBACK");
        return {
          confirmed: false,
          candidate_rows: toDelete,
          message: "Confirmation required: pass confirm=true to execute delete.",
        };
      }

      const deletedMeasurements = await this.execute(
        `
        WITH target AS (
          SELECT DISTINCT m.ts_id, m.datetime
          FROM core.measurements m
          JOIN core.timeseries ts ON ts.ts_id = m.ts_id
          JOIN core.stations st ON st.station_id = ts.station_id
          JOIN ref.observed_properties op ON op.property_id = ts.property_id
          LEFT JOIN core.measurement_batches mb
            ON mb.ts_id = m.ts_id
           AND mb.datetime = m.datetime
          WHERE ${where.join(" AND ")}
        )
        DELETE FROM core.measurements m
        USING target t
        WHERE m.ts_id = t.ts_id
          AND m.datetime = t.datetime
        `,
        params,
        client
      );

      const deletedTimeseries = await this.execute(
        `
        DELETE FROM core.timeseries ts
        WHERE ts.source_type = 'simulated'
          AND NOT EXISTS (
            SELECT 1
            FROM core.measurements m
            WHERE m.ts_id = ts.ts_id
          )
        `,
        [],
        client
      );

      await client.query("COMMIT");
      return {
        confirmed: true,
        candidate_rows: toDelete,
        deleted_measurements: deletedMeasurements,
        deleted_orphan_timeseries: deletedTimeseries,
      };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
}

export const swatIngestionService = new SwatIngestionService();

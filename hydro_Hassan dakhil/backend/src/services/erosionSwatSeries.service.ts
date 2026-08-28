import { DatabaseService } from "./database.service";
import {
  NORMALIZED_SWAT_SCENARIOS,
  NORMALIZED_SWAT_SCENARIO_BY_RUN_ID,
} from "../constants/swatScenarios";
import {
  SWAT_EROSION_PROPERTY_DEFS,
  VISIBLE_SWAT_SCENARIO_CODES,
  resolveSwatStorageTimeStep,
} from "../constants/swatDataSources";
import {
  HASSAN_ADDAKHIL_STATION_IDS,
  isHassanAddakhilStationId,
} from "../constants/projectStations";
import {
  getNativeGranularityFromRows,
  normalizeTimeStep,
  pickSourceTimeStep,
} from "../utils/aggregationAvailability";

const EROSION_SCENARIO_CODES = VISIBLE_SWAT_SCENARIO_CODES;

const EROSION_SCENARIO_NAME_BY_CODE: Record<(typeof EROSION_SCENARIO_CODES)[number], string> = {
  etat_actuel: "Scénario état actuel",
  ssp126: "Scénario changement climatique SSP126",
  ssp245: "Scénario changement climatique SSP245",
  ssp585: "Scénario changement climatique SSP585",
  scenario_1: "Scénario reboisement pente 9 %",
  scenario_2: "Scénario reboisement pente 15 %",
  scenario_3: "Scénario reboisement pente 25 %",
  scenario_4: "Scénario reboisement Buffer zone",
};

type AggInterval = "day" | "month" | "year";
type ErosionTimeStep = "daily" | "monthly" | "annual";

type ErosionScenarioCode = (typeof EROSION_SCENARIO_CODES)[number];

type ErosionSourceTable = "access.rch_results" | "access.sub_results";
type ErosionEntityType = "rch" | "sub";

type DisplayStationInfo = {
  station_id: number;
  station_code: string;
  station_name: string;
};

type DisplayStationMaps = {
  subById: Map<number, DisplayStationInfo>;
  reachById: Map<number, DisplayStationInfo>;
};

export interface ErosionVariableDef {
  property_id: number;
  standard_name: string;
  name: string;
  unit: string | null;
  description: string;
  source_table: ErosionSourceTable;
  source_column: string;
  entity_type: ErosionEntityType;
  sort_order: number;
}

export interface ErosionAvailabilityRow {
  ts_id: number;
  module_code: "erosion";
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
  time_step: ErosionTimeStep;
  n_measures: number;
  dt_min: string | null;
  dt_max: string | null;
  v_min: number | null;
  v_max: number | null;
  created_at: string | null;
  period_days: number | null;
}

export interface ErosionCatalogRow {
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
  time_step: ErosionTimeStep;
  ts_created_at: string;
  n_points: number | null;
  start_date: string | null;
  end_date: string | null;
}

export interface ErosionDateRangeRow {
  min_date: string | null;
  max_date: string | null;
  n_points: number;
}

export interface ErosionSeriesPoint {
  date: string;
  value: number | null;
  n: number;
}

export interface ErosionAggregatedRow {
  period: string;
  avg_value: number | null;
  min_value: number | null;
  max_value: number | null;
  n: number;
}

export interface ErosionBundleResult {
  catalog: ErosionCatalogRow[];
  aggregated: Record<string, ErosionAggregatedRow[]>;
}

export interface ErosionSubbasinRow {
  subbasin_station_id: number;
  subbasin_id: number;
  station_code: string;
  subbasin_name: string;
  runs_count: number;
  points_count: number;
  min_date: string | null;
  max_date: string | null;
}

export interface ErosionSubbasinAvailabilityRow {
  subbasin_station_id: number;
  subbasin_id: number;
  station_code: string;
  subbasin_name: string;
  run_id: number;
  scenario_code: string;
  scenario_name: string;
  source_type: string;
  time_step: ErosionTimeStep;
  property_id: number;
  property_name: string;
  standard_name: string;
  unit: string | null;
  points_count: number;
  min_date: string | null;
  max_date: string | null;
}

export interface ErosionSeriesStats {
  min_value: number | null;
  max_value: number | null;
  avg_value: number | null;
  sum_value: number | null;
  n_points: number;
  min_date: string | null;
  max_date: string | null;
}

export const EROSION_VARIABLE_DEFS: ErosionVariableDef[] = [
  {
    property_id: 91010,
    standard_name: "SWAT_SED_IN_TONS",
    name: "Sediments entrants",
    unit: "tons",
    description: "Simulated sediment inflow at reach outlet.",
    source_table: "access.rch_results",
    source_column: "sed_in_tons",
    entity_type: "rch",
    sort_order: 9001,
  },
  {
    property_id: 32,
    standard_name: "SWAT_SED_TONS",
    name: "Sediments sortants",
    unit: "tons",
    description: "Simulated sediment out at reach outlet.",
    source_table: "access.rch_results",
    source_column: "sed_out_tons",
    entity_type: "rch",
    sort_order: 9002,
  },
  {
    property_id: 91011,
    standard_name: "SWAT_SED_CONC_MG_KG",
    name: "Concentration sediments",
    unit: "mg/kg",
    description: "Simulated sediment concentration at reach outlet.",
    source_table: "access.rch_results",
    source_column: "sedconc_mg_kg",
    entity_type: "rch",
    sort_order: 9003,
  },
  {
    property_id: 33,
    standard_name: "SWAT_SYLDT_HA",
    name: "Dégradation spécifique (t/ha)",
    unit: "t/ha",
    description: "Simulated sediment yield by subbasin.",
    source_table: "access.sub_results",
    source_column: "syld_t_ha",
    entity_type: "sub",
    sort_order: 9004,
  },
];

const SHARED_EROSION_VARIABLE_DEFS: ErosionVariableDef[] =
  SWAT_EROSION_PROPERTY_DEFS.map(
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
      source_table: source_table as ErosionSourceTable,
      source_column,
      entity_type: entity_type as ErosionEntityType,
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

function resolveStorageTimeStep(scenarioCode: string, catalogTimeStep: string): string {
  return resolveSwatStorageTimeStep(scenarioCode, catalogTimeStep);
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

function aggregateSeries(rows: ErosionSeriesPoint[], agg: AggInterval): ErosionAggregatedRow[] {
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

export class ErosionSwatSeriesService {
  private db = new DatabaseService();
  private availabilityCache: Promise<ErosionAvailabilityRow[]> | null = null;
  private variableDefsCache: Promise<ErosionVariableDef[]> | null = null;
  private displayStationMapsCache: Promise<DisplayStationMaps> | null = null;

  private async query<T>(sql: string, params: unknown[] = []) {
    return this.db.query<T>(sql, params);
  }

  private async queryOne<T>(sql: string, params: unknown[] = []) {
    return this.db.queryOne<T>(sql, params);
  }

  private async resolveMappedSubbasinId(stationId: number): Promise<number | null> {
    const row = await this.queryOne<{ subbasin_id: number }>(
      `
      SELECT subbasin_id
      FROM core.station_subbasin_map
      WHERE station_id = $1
        AND is_active = true
      LIMIT 1
      `,
      [stationId]
    );

    return row ? Number(row.subbasin_id) : null;
  }

  private async getDisplayStationMaps(): Promise<DisplayStationMaps> {
    if (!this.displayStationMapsCache) {
      this.displayStationMapsCache = (async () => {
        const projectStationIds = [...HASSAN_ADDAKHIL_STATION_IDS];

        const [subRows, reachRows] = await Promise.all([
          this.query<{
            subbasin_id: number;
            station_id: number;
            station_code: string;
            station_name: string;
          }>(
            `
            SELECT
              m.subbasin_id,
              s.station_id,
              s.station_code,
              s.name AS station_name
            FROM core.station_subbasin_map m
            JOIN core.stations s
              ON s.station_id = m.station_id
            WHERE m.is_active = true
              AND m.station_id = ANY($1::int[])
            ORDER BY m.subbasin_id, m.is_primary DESC, m.updated_at DESC, m.id DESC
            `,
            [projectStationIds]
          ),
          this.query<{
            reach_id: number;
            station_id: number;
            station_code: string;
            station_name: string;
          }>(
            `
            SELECT
              m.reach_id,
              s.station_id,
              s.station_code,
              s.name AS station_name
            FROM core.station_reach_map m
            JOIN core.stations s
              ON s.station_id = m.station_id
            WHERE m.is_active = true
              AND m.is_primary = true
              AND m.station_id = ANY($1::int[])
            ORDER BY m.reach_id, m.updated_at DESC, m.id DESC
            `,
            [projectStationIds]
          ),
        ]);

        const subById = new Map<number, DisplayStationInfo>();
        for (const row of subRows) {
          if (!subById.has(Number(row.subbasin_id))) {
            subById.set(Number(row.subbasin_id), {
              station_id: Number(row.station_id),
              station_code: String(row.station_code),
              station_name: String(row.station_name),
            });
          }
        }

        const reachById = new Map<number, DisplayStationInfo>();
        for (const row of reachRows) {
          if (!reachById.has(Number(row.reach_id))) {
            reachById.set(Number(row.reach_id), {
              station_id: Number(row.station_id),
              station_code: String(row.station_code),
              station_name: String(row.station_name),
            });
          }
        }

        return { subById, reachById };
      })();
    }

    return this.displayStationMapsCache;
  }

  private extractStationSuffix(stationCode: string): number | null {
    const match = String(stationCode || "").match(/(\d+)$/);
    if (!match) return null;
    const suffix = Number(match[1]);
    return Number.isFinite(suffix) ? suffix : null;
  }

  private resolveDisplayStation(
    row: { station_id: number; station_code: string; station_name: string },
    entityType: ErosionEntityType,
    maps: DisplayStationMaps
  ): DisplayStationInfo {
    if (isHassanAddakhilStationId(row.station_id)) {
      return {
        station_id: Number(row.station_id),
        station_code: String(row.station_code),
        station_name: String(row.station_name),
      };
    }

    const suffix = this.extractStationSuffix(String(row.station_code));
    if (suffix === null) {
      return {
        station_id: Number(row.station_id),
        station_code: String(row.station_code),
        station_name: String(row.station_name),
      };
    }

    const mapped =
      entityType === "sub"
        ? maps.subById.get(suffix)
        : maps.reachById.get(suffix);

    return (
      mapped || {
        station_id: Number(row.station_id),
        station_code: String(row.station_code),
        station_name: String(row.station_name),
      }
    );
  }

  private async resolveScenario(runId: number): Promise<{ run_id: number; scenario_code: string; scenario_name: string } | null> {
    const virtualScenario = NORMALIZED_SWAT_SCENARIO_BY_RUN_ID.get(runId);
    if (
      virtualScenario &&
      (EROSION_SCENARIO_CODES as readonly string[]).includes(
        virtualScenario.scenario_code
      )
    ) {
      return {
        run_id: virtualScenario.run_id,
        scenario_code: virtualScenario.scenario_code,
        scenario_name: virtualScenario.scenario_name,
      };
    }

    return this.queryOne<{ run_id: number; scenario_code: string; scenario_name: string }>(
      `
      SELECT run_id, scenario_code, scenario_name
      FROM core.model_runs
      WHERE run_id = $1
        AND scenario_code = ANY($2::text[])
      LIMIT 1
      `,
      [runId, EROSION_SCENARIO_CODES]
    );
  }

  private getErosionVariableDefs(): Promise<ErosionVariableDef[]> {
    if (!this.variableDefsCache) {
      this.variableDefsCache = Promise.resolve(SHARED_EROSION_VARIABLE_DEFS);
    }
    return this.variableDefsCache;
  }

  private syntheticTsId(
    runId: number,
    stationId: number,
    propertyId: number,
    timeStep: ErosionTimeStep
  ): number {
    const stepCode = timeStep === "daily" ? 1 : timeStep === "monthly" ? 2 : 3;
    return runId * 100_000_000 + stationId * 100_000 + propertyId * 10 + stepCode;
  }

  private async getSimulatedAvailabilityRowsFromCatalog(): Promise<ErosionAvailabilityRow[]> {
    const defRows = new Map<number, ErosionVariableDef>();
    for (const def of await this.getErosionVariableDefs()) {
      defRows.set(def.property_id, def);
    }
    const displayStationMaps = await this.getDisplayStationMaps();
    const propertyIds = SHARED_EROSION_VARIABLE_DEFS.map((def) => def.property_id);

    const fastCatalogRows = await this.query<{
      ts_id: number;
      station_id: number;
      station_code: string;
      station_name: string;
      run_id: number;
      scenario_code: string;
      scenario_name: string;
      time_step: string;
      property_id: number;
      property_name: string;
      standard_name: string;
      unit: string | null;
      created_at: string | null;
    }>(
      `
      SELECT
        ts_id,
        station_id,
        station_code,
        station_name,
        run_id,
        scenario_code,
        scenario_name,
        time_step,
        property_id,
        property_name,
        standard_name,
        unit,
        ts_created_at::timestamptz::text AS created_at
      FROM (
        SELECT
          v.*,
          ROW_NUMBER() OVER (
            PARTITION BY v.station_id, v.run_id, v.property_id
            ORDER BY CASE v.time_step
              WHEN 'daily' THEN 1
              WHEN 'monthly' THEN 2
              WHEN 'annual' THEN 3
              ELSE 99
            END,
            v.ts_id
          ) AS rn
        FROM public.v_ts_catalog v
        WHERE v.source_type = 'simulated'
          AND v.scenario_code = ANY($1::text[])
          AND v.property_id = ANY($2::int[])
      ) ranked
      WHERE rn = 1
      ORDER BY station_id, run_id, property_id, ts_id
      `,
      [EROSION_SCENARIO_CODES, propertyIds]
    );

    if (!fastCatalogRows.length) {
      return [];
    }

    const subbasinIds = fastCatalogRows
      .filter((row) => row.station_code.startsWith("swat_sub_"))
      .map((row) => this.extractStationSuffix(row.station_code))
      .filter((value): value is number => value !== null);
    const reachIds = fastCatalogRows
      .filter((row) => row.station_code.startsWith("swat_rch_"))
      .map((row) => this.extractStationSuffix(row.station_code))
      .filter((value): value is number => value !== null);

    const [validSubbasinRows, validReachRows] = await Promise.all([
      subbasinIds.length
        ? this.query<{ subbasin_id: number }>(
            `
            SELECT subbasin_id
            FROM gis.subbasin_shapes
            WHERE subbasin_id = ANY($1::int[])
            `,
            [[...new Set(subbasinIds)]]
          )
        : Promise.resolve([] as Array<{ subbasin_id: number }>),
      reachIds.length
        ? this.query<{ reach_id: number }>(
            `
            SELECT reach_id
            FROM gis.reach_shapes
            WHERE reach_id = ANY($1::int[])
            `,
            [[...new Set(reachIds)]]
          )
        : Promise.resolve([] as Array<{ reach_id: number }>),
    ]);

    const validSubbasinIds = new Set(validSubbasinRows.map((row) => Number(row.subbasin_id)));
    const validReachIds = new Set(validReachRows.map((row) => Number(row.reach_id)));

    const fastRankedRows = fastCatalogRows.filter((row) => {
      const suffix = this.extractStationSuffix(row.station_code);
      if (row.station_code.startsWith("swat_sub_")) {
        return suffix !== null && validSubbasinIds.has(suffix);
      }
      if (row.station_code.startsWith("swat_rch_")) {
        return suffix !== null && validReachIds.has(suffix);
      }
      return !/^swat_(sub|rch)_/i.test(row.station_code);
    });

    if (!fastRankedRows.length) {
      return [];
    }

    const fastMeasurementStats = await this.query<{
      ts_id: number;
      n_measures: string | number;
      dt_min: string | null;
      dt_max: string | null;
    }>(
      `
      SELECT
        m.ts_id,
        COUNT(*)::bigint AS n_measures,
        MIN(m.datetime)::date::text AS dt_min,
        MAX(m.datetime)::date::text AS dt_max
      FROM core.measurements m
      WHERE m.ts_id = ANY($1::int[])
      GROUP BY m.ts_id
      `,
      [[...new Set(fastRankedRows.map((row) => Number(row.ts_id)))]]
    );

    const fastStatsByTsId = new Map(
      fastMeasurementStats.map((row) => [
        Number(row.ts_id),
        {
          n_measures: Number(row.n_measures || 0),
          dt_min: row.dt_min,
          dt_max: row.dt_max,
        },
      ])
    );

    const fastAvailability: ErosionAvailabilityRow[] = [];
    for (const row of fastRankedRows) {
      const def = defRows.get(Number(row.property_id));
      if (!def) continue;
      const displayStation = this.resolveDisplayStation(
        {
          station_id: Number(row.station_id),
          station_code: String(row.station_code),
          station_name: String(row.station_name),
        },
        def.entity_type,
        displayStationMaps
      );
      const stats = fastStatsByTsId.get(Number(row.ts_id));
      const nPoints = stats?.n_measures ?? 0;
      const dtMin = stats?.dt_min ?? null;
      const dtMax = stats?.dt_max ?? null;
      const timeStep = (String(row.time_step) as ErosionTimeStep) || "daily";
      fastAvailability.push({
        ts_id: this.syntheticTsId(
          Number(row.run_id),
          displayStation.station_id,
          def.property_id,
          timeStep
        ),
        module_code: "erosion",
        station_id: displayStation.station_id,
        station_code: displayStation.station_code,
        station_name: displayStation.station_name,
        station_label: `${displayStation.station_code} - ${displayStation.station_name}`,
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
        dt_min: dtMin,
        dt_max: dtMax,
        v_min: null,
        v_max: null,
        created_at: row.created_at,
        period_days:
          dtMin && dtMax
            ? Math.max(
                0,
                Math.round((new Date(dtMax).getTime() - new Date(dtMin).getTime()) / 86400000)
              )
            : null,
      });
    }

    return fastAvailability.sort(
      (a, b) =>
        a.station_id - b.station_id ||
        a.run_id - b.run_id ||
        a.property_id - b.property_id
    );

    const rows = await this.query<{
      station_id: number;
      station_code: string;
      station_name: string;
      run_id: number;
      scenario_code: string;
      scenario_name: string;
      time_step: string;
      property_id: number;
      property_name: string;
      standard_name: string;
      unit: string | null;
      n_measures: string | number;
      dt_min: string | null;
      dt_max: string | null;
      created_at: string | null;
    }>(
      `
      SELECT
        v.station_id,
        v.station_code,
        v.station_name,
        v.run_id,
        v.scenario_code,
        v.scenario_name,
        v.time_step,
        v.property_id,
        v.property_name,
        v.standard_name,
        v.unit,
        COALESCE(v.n_points, 0)::bigint AS n_measures,
        v.start_date::date::text AS dt_min,
        v.end_date::date::text AS dt_max,
        v.ts_created_at::timestamptz::text AS created_at
      FROM public.v_ts_catalog_enriched v
      WHERE v.source_type = 'simulated'
        AND v.scenario_code = ANY($1::text[])
        AND v.property_id = ANY($2::int[])
        AND (
          (
            v.station_code ~ '^swat_sub_[0-9]+$'
            AND EXISTS (
              SELECT 1
              FROM gis.subbasin_shapes valid_sb
              WHERE valid_sb.subbasin_id = replace(v.station_code, 'swat_sub_', '')::int
            )
          )
          OR (
            v.station_code ~ '^swat_rch_[0-9]+$'
            AND EXISTS (
              SELECT 1
              FROM gis.reach_shapes valid_rch
              WHERE valid_rch.reach_id = replace(v.station_code, 'swat_rch_', '')::int
            )
          )
          OR v.station_code !~ '^swat_(sub|rch)_[0-9]+$'
        )
      ORDER BY v.station_id, v.run_id, v.property_id,
        CASE v.time_step
          WHEN 'daily' THEN 1
          WHEN 'monthly' THEN 2
          WHEN 'annual' THEN 3
          ELSE 99
        END,
        v.ts_id
      `,
      [EROSION_SCENARIO_CODES, SHARED_EROSION_VARIABLE_DEFS.map((def) => def.property_id)]
    );

    const availability: ErosionAvailabilityRow[] = [];
    for (const row of rows) {
      const def = defRows.get(Number(row.property_id));
      if (!def) continue;
      const variableDef = def as ErosionVariableDef;
      const displayStation = this.resolveDisplayStation(
        {
          station_id: Number(row.station_id),
          station_code: String(row.station_code),
          station_name: String(row.station_name),
        },
        variableDef.entity_type,
        displayStationMaps
      );
      const nPoints = toNumber(row.n_measures) ?? 0;
      const timeStep = (String(row.time_step) as ErosionTimeStep) || "daily";
      const dtMin = row.dt_min;
      const dtMax = row.dt_max;
      const periodDays =
        dtMin && dtMax
          ? Math.max(
              0,
              Math.round(
                (new Date(dtMax as string).getTime() - new Date(dtMin as string).getTime()) / 86400000
              )
            )
          : null;
      availability.push({
        ts_id: this.syntheticTsId(
          Number(row.run_id),
          displayStation.station_id,
          variableDef.property_id,
          timeStep
        ),
        module_code: "erosion",
        station_id: displayStation.station_id,
        station_code: displayStation.station_code,
        station_name: displayStation.station_name,
        station_label: `${displayStation.station_code} - ${displayStation.station_name}`,
        property_id: variableDef.property_id,
        property_name: variableDef.name,
        unit: variableDef.unit,
        standard_name: variableDef.standard_name,
        run_id: Number(row.run_id),
        scenario_code: String(row.scenario_code),
        scenario_name: String(row.scenario_name),
        source_type: "simulated",
        time_step: timeStep,
        n_measures: nPoints,
        dt_min: dtMin,
        dt_max: dtMax,
        v_min: null,
        v_max: null,
        created_at: row.created_at,
        period_days: periodDays,
      });
    }

    return availability.sort(
      (a, b) =>
        a.station_id - b.station_id ||
        a.run_id - b.run_id ||
        a.property_id - b.property_id
    );
  }

  private async getSimulatedAvailabilityRowsFromMatView(): Promise<ErosionAvailabilityRow[]> {
    const displayStationMaps = await this.getDisplayStationMaps();
    const rows = await this.query<{
      station_id: number;
      station_code: string;
      station_name: string;
      run_id: number;
      scenario_code: string;
      scenario_name: string;
      time_step: string;
      property_id: number;
      property_name: string;
      standard_name: string;
      unit: string | null;
      n_measures: string | number;
      dt_min: string | null;
      dt_max: string | null;
      v_min: string | number | null;
      v_max: string | number | null;
      created_at: string | null;
    }>(
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
        standard_name,
        unit,
        n_measures,
        dt_min,
        dt_max,
        v_min,
        v_max,
        created_at
      FROM api.mv_hydro_station_stats
      WHERE scenario_code = ANY($1::text[])
        AND property_id IN (91010, 32, 91011, 33, 91001, 91002, 91003, 91004, 91005)
        AND (
          (
            station_code ~ '^swat_sub_[0-9]+$'
            AND EXISTS (
              SELECT 1
              FROM gis.subbasin_shapes valid_sb
              WHERE valid_sb.subbasin_id = replace(station_code, 'swat_sub_', '')::int
            )
          )
          OR (
            station_code ~ '^swat_rch_[0-9]+$'
            AND EXISTS (
              SELECT 1
              FROM gis.reach_shapes valid_rch
              WHERE valid_rch.reach_id = replace(station_code, 'swat_rch_', '')::int
            )
          )
          OR station_code !~ '^swat_(sub|rch)_[0-9]+$'
        )
      ORDER BY station_id, run_id, property_id,
        CASE time_step
          WHEN 'daily' THEN 1
          WHEN 'monthly' THEN 2
          WHEN 'annual' THEN 3
          ELSE 99
        END;
      `,
      [EROSION_SCENARIO_CODES]
    );

    const defRows = new Map<number, ErosionVariableDef>();
    for (const def of await this.getErosionVariableDefs()) {
      defRows.set(def.property_id, def);
    }

    const availability: ErosionAvailabilityRow[] = [];
    for (const row of rows) {
      const def = defRows.get(Number(row.property_id));
      if (!def) continue;
      const displayStation = this.resolveDisplayStation(
        {
          station_id: Number(row.station_id),
          station_code: String(row.station_code),
          station_name: String(row.station_name),
        },
        def.entity_type,
        displayStationMaps
      );
      const timeStep = (String(row.time_step) as ErosionTimeStep) || "daily";
      const tsId = this.syntheticTsId(
        Number(row.run_id),
        displayStation.station_id,
        def.property_id,
        timeStep
      );
      availability.push({
        ts_id: tsId,
        module_code: "erosion",
        station_id: displayStation.station_id,
        station_code: displayStation.station_code,
        station_name: displayStation.station_name,
        station_label: `${displayStation.station_code} - ${displayStation.station_name}`,
        property_id: def.property_id,
        property_name: def.name,
        unit: def.unit,
        standard_name: def.standard_name,
        run_id: Number(row.run_id),
        scenario_code: String(row.scenario_code),
        scenario_name: String(row.scenario_name),
        source_type: "simulated",
        time_step: timeStep,
        n_measures: Number(row.n_measures || 0),
        dt_min: row.dt_min,
        dt_max: row.dt_max,
        v_min: toNumber(row.v_min),
        v_max: toNumber(row.v_max),
        created_at: row.created_at,
        period_days:
          row.dt_min && row.dt_max
            ? Math.max(
                0,
                Math.round(
                  (new Date(row.dt_max).getTime() - new Date(row.dt_min).getTime()) / 86400000
                )
              )
            : null,
      });
    }

    return availability.sort(
      (a, b) =>
        a.station_id - b.station_id ||
        a.run_id - b.run_id ||
        a.property_id - b.property_id
    );
  }

  private async getSimulatedAvailabilityRowsFromAccess(): Promise<ErosionAvailabilityRow[]> {
    const defRows = new Map<number, ErosionVariableDef>();
    for (const def of await this.getErosionVariableDefs()) {
      defRows.set(def.property_id, def);
    }

    const rows = await this.query<{
      station_id: number;
      station_code: string;
      station_name: string;
      run_id: number;
      scenario_code: string;
      scenario_name: string;
      time_step: string;
      property_id: number;
      n_measures: string | number;
      dt_min: string | null;
      dt_max: string | null;
      v_min: string | number | null;
      v_max: string | number | null;
      created_at: string | null;
    }>(
      `
      WITH run AS (
        SELECT run_id, scenario_code, scenario_name
        FROM public.model_runs
        WHERE scenario_code = 'etat_actuel'
        ORDER BY run_id
        LIMIT 1
      ),
      source AS (
        SELECT
          sim.station_id,
          sim.station_code,
          sim.name AS station_name,
          run.run_id,
          run.scenario_code,
          run.scenario_name,
          'daily'::text AS time_step,
          r.period_date,
          91010::int AS property_id,
          r.sed_in_tons::double precision AS value
        FROM access.rch_results r
        JOIN gis.reach_shapes valid_rch
          ON valid_rch.reach_id = r.sub_code
        JOIN core.stations sim
          ON sim.station_code = ('swat_rch_' || r.sub_code::text)
        CROSS JOIN run
        WHERE r.scenario_code = 'etat_actuel'
          AND r.sed_in_tons IS NOT NULL

        UNION ALL

        SELECT
          sim.station_id,
          sim.station_code,
          sim.name AS station_name,
          run.run_id,
          run.scenario_code,
          run.scenario_name,
          'daily'::text AS time_step,
          r.period_date,
          32::int AS property_id,
          r.sed_out_tons::double precision AS value
        FROM access.rch_results r
        JOIN gis.reach_shapes valid_rch
          ON valid_rch.reach_id = r.sub_code
        JOIN core.stations sim
          ON sim.station_code = ('swat_rch_' || r.sub_code::text)
        CROSS JOIN run
        WHERE r.scenario_code = 'etat_actuel'
          AND r.sed_out_tons IS NOT NULL

        UNION ALL

        SELECT
          sim.station_id,
          sim.station_code,
          sim.name AS station_name,
          run.run_id,
          run.scenario_code,
          run.scenario_name,
          'daily'::text AS time_step,
          r.period_date,
          91011::int AS property_id,
          r.sedconc_mg_kg::double precision AS value
        FROM access.rch_results r
        JOIN gis.reach_shapes valid_rch
          ON valid_rch.reach_id = r.sub_code
        JOIN core.stations sim
          ON sim.station_code = ('swat_rch_' || r.sub_code::text)
        CROSS JOIN run
        WHERE r.scenario_code = 'etat_actuel'
          AND r.sedconc_mg_kg IS NOT NULL

        UNION ALL

        SELECT
          sim.station_id,
          sim.station_code,
          sim.name AS station_name,
          run.run_id,
          run.scenario_code,
          run.scenario_name,
          'daily'::text AS time_step,
          s.period_date,
          33::int AS property_id,
          s.syld_t_ha::double precision AS value
        FROM access.sub_results s
        JOIN gis.subbasin_shapes valid_sb
          ON valid_sb.subbasin_id = s.sub_code
        JOIN core.stations sim
          ON sim.station_code = ('swat_rch_' || s.sub_code::text)
        CROSS JOIN run
        WHERE s.scenario_code = 'etat_actuel'
          AND s.syld_t_ha IS NOT NULL
      )
      SELECT
        station_id,
        station_code,
        station_name,
        run_id,
        scenario_code,
        scenario_name,
        time_step,
        property_id,
        COUNT(*)::bigint AS n_measures,
        MIN(period_date)::date::text AS dt_min,
        MAX(period_date)::date::text AS dt_max,
        MIN(value)::double precision AS v_min,
        MAX(value)::double precision AS v_max,
        MAX(period_date)::date::text AS created_at
      FROM source
      GROUP BY station_id, station_code, station_name, run_id, scenario_code, scenario_name, time_step, property_id
      ORDER BY station_id, run_id, property_id
      `
    );

    const availability: ErosionAvailabilityRow[] = [];
    for (const row of rows) {
      const def = defRows.get(Number(row.property_id));
      if (!def) continue;
      const nPoints = toNumber(row.n_measures) ?? 0;
      const timeStep = (String(row.time_step) as ErosionTimeStep) || "daily";
      availability.push({
        ts_id: this.syntheticTsId(
          Number(row.run_id),
          Number(row.station_id),
          def.property_id,
          timeStep
        ),
        module_code: "erosion",
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
        period_days:
          row.dt_min && row.dt_max
            ? Math.max(
                0,
                Math.round((new Date(row.dt_max).getTime() - new Date(row.dt_min).getTime()) / 86400000)
              )
            : null,
      });
    }

    return availability.sort(
      (a, b) =>
        a.station_id - b.station_id ||
        a.run_id - b.run_id ||
        a.property_id - b.property_id
    );
  }

  private async getSimulatedAvailabilityRows(): Promise<ErosionAvailabilityRow[]> {
    if (this.availabilityCache) {
      return this.availabilityCache;
    }

    const promise = (async () => {
      if (await this.db.relationExists("public.v_ts_catalog_enriched")) {
        const catalogRows = await this.getSimulatedAvailabilityRowsFromCatalog();
        if (catalogRows.length) return catalogRows;
        return this.getSimulatedAvailabilityRowsFromAccess();
      }

      if (await this.db.relationExists("api.mv_hydro_station_stats")) {
        const matViewRows = await this.getSimulatedAvailabilityRowsFromMatView();
        if (matViewRows.length) return matViewRows;
        return this.getSimulatedAvailabilityRowsFromAccess();
      }

      // Legacy DB dumps (access.rch_results / access.sub_results) do not expose
      // time_step, import_date or station_id columns — reuse the access fallback.
      return this.getSimulatedAvailabilityRowsFromAccess();
    })();

    this.availabilityCache = promise.catch((error) => {
      if (this.availabilityCache === promise) {
        this.availabilityCache = null;
      }
      throw error;
    });

    return this.availabilityCache;
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
    const defs = await this.getErosionVariableDefs();
    return defs.map((def) => ({
      module_code: "erosion",
      property_id: def.property_id,
      is_enabled: true,
      sort_order: def.sort_order,
      name: def.name,
      unit: def.unit,
      standard_name: def.standard_name,
      description: def.description,
    }));
  }

  async getAvailableVariables(): Promise<ErosionVariableDef[]> {
    const availability = await this.getSimulatedAvailabilityRows();
    const propertyIds = new Set(availability.map((row) => row.property_id));
    return (await this.getErosionVariableDefs())
      .filter((def) => propertyIds.has(def.property_id))
      .sort((a, b) => a.sort_order - b.sort_order || a.property_id - b.property_id);
  }

  async getAvailability(filters?: {
    stationId?: number;
    scenarioCode?: string;
    propertyId?: number;
  }): Promise<ErosionAvailabilityRow[]> {
    const rows = await this.getSimulatedAvailabilityRows();
    return rows.filter((row) => {
      if (filters?.stationId && row.station_id !== filters.stationId) return false;
      if (filters?.scenarioCode && row.scenario_code !== filters.scenarioCode) return false;
      if (filters?.propertyId && row.property_id !== filters.propertyId) return false;
      return true;
    });
  }

  async resolveErosionScenario(runId: number): Promise<{ run_id: number; scenario_code: string; scenario_name: string } | null> {
    return this.resolveScenario(runId);
  }

  private async getAvailabilityRowsForRun(
    runId: number,
    filters?: {
      stationId?: number;
      propertyId?: number;
    }
  ): Promise<ErosionAvailabilityRow[]> {
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

  private toCatalogRow(
    row: ErosionAvailabilityRow,
    requestedRunId: number
  ): ErosionCatalogRow {
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

  async getCatalog(stationId: number, runId: number): Promise<ErosionCatalogRow[]> {
    const direct = (await this.getAvailabilityRowsForRun(runId, { stationId }))
      .map((row) => this.toCatalogRow(row, runId))
      .sort((a, b) => a.property_id - b.property_id);

    if (direct.length) {
      return direct;
    }

    const subbasinId = await this.resolveMappedSubbasinId(stationId);
    if (subbasinId === null) {
      return direct;
    }

    const suffix = String(subbasinId);
    const fallbackRows = (await this.getAvailabilityRowsForRun(runId)).filter(
      (row) => {
      return row.station_code === `swat_sub_${suffix}` || row.station_code === `swat_rch_${suffix}`;
      }
    );

    return fallbackRows
      .map((row) => this.toCatalogRow(row, runId))
      .sort((a, b) => a.property_id - b.property_id);
  }

  async getDateRange(stationId: number, runId: number, propertyId: number): Promise<ErosionDateRangeRow> {
    const rows = await this.getAvailabilityRowsForRun(runId, {
      stationId,
      propertyId,
    });
    const row = rows[0];
    if (!row) {
      const subbasinId = await this.resolveMappedSubbasinId(stationId);
      if (subbasinId === null) {
        return { min_date: null, max_date: null, n_points: 0 };
      }

      const suffix = String(subbasinId);
      const fallbackRow = (await this.getAvailabilityRowsForRun(runId, {
        propertyId,
      })).find(
        (item) =>
          (item.station_code === `swat_sub_${suffix}` || item.station_code === `swat_rch_${suffix}`)
      );

      if (!fallbackRow) {
        return { min_date: null, max_date: null, n_points: 0 };
      }

      return {
        min_date: fallbackRow.dt_min,
        max_date: fallbackRow.dt_max,
        n_points: fallbackRow.n_measures,
      };
    }
    return {
      min_date: row.dt_min,
      max_date: row.dt_max,
      n_points: row.n_measures,
    };
  }

  private async loadSeriesFromMatView(
    def: ErosionVariableDef,
    stationId: number,
    scenarioCode: string,
    timeStep: ErosionTimeStep,
    startDate?: string,
    endDate?: string
  ): Promise<ErosionSeriesPoint[]> {
    const storageTimeStep = resolveStorageTimeStep(scenarioCode, timeStep);
    const params: unknown[] = [stationId, scenarioCode, storageTimeStep, def.entity_type];
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
        AVG(${def.source_column})::double precision AS value,
        COUNT(*)::int AS n
      FROM api.mv_hydro_station_timeseries
      WHERE ${where.join(" AND ")}
      GROUP BY period_date
      ORDER BY period_date
    `;

    const rows = await this.query<{ period_date: string; value: number | string | null; n: number | string }>(sql, params);
    return rows.map((row) => ({
      date: toDateKey(row.period_date),
      value: toNumber(row.value),
      n: Number(row.n || 0),
    }));
  }

  private async loadSeries(
    def: ErosionVariableDef,
    stationId: number,
    scenarioCode: string,
    timeStep: ErosionTimeStep,
    startDate?: string,
    endDate?: string
  ): Promise<ErosionSeriesPoint[]> {
    if (await this.db.relationExists("api.mv_hydro_station_timeseries")) {
      return this.loadSeriesFromMatView(def, stationId, scenarioCode, timeStep, startDate, endDate);
    }

    const tableName = def.source_table;
    const sourceAlias = def.entity_type === "rch" ? "r" : "s";
    const periodColumn = `${sourceAlias}.period_date`;
    const valueColumn = `${sourceAlias}.${def.source_column}`;
    const storageTimeStep = resolveStorageTimeStep(scenarioCode, timeStep);
    const params: unknown[] = [stationId, scenarioCode, storageTimeStep];
    const directWhere: string[] = [
      `${sourceAlias}.station_id = $1`,
      `${sourceAlias}.scenario_code = $2`,
      `${sourceAlias}.time_step = $3`,
      `${valueColumn} IS NOT NULL`,
    ];
    const fallbackWhere: string[] = [
      `${sourceAlias}.station_id IS NULL`,
      `${sourceAlias}.scenario_code = $2`,
      `${sourceAlias}.time_step = $3`,
      `${valueColumn} IS NOT NULL`,
      `m.station_id = $1`,
      `m.is_active = true`,
    ];

    if (startDate) {
      params.push(startDate);
      directWhere.push(`${periodColumn} >= $${params.length}::date`);
      fallbackWhere.push(`${periodColumn} >= $${params.length}::date`);
    }
    if (endDate) {
      params.push(endDate);
      directWhere.push(`${periodColumn} <= $${params.length}::date`);
      fallbackWhere.push(`${periodColumn} <= $${params.length}::date`);
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
        AVG(value)::double precision AS value,
        COUNT(*)::int AS n
      FROM source
      GROUP BY period_date
      ORDER BY period_date
    `;

    const rows = await this.query<{ period_date: string; value: number | string | null; n: number | string }>(sql, params);
    return rows.map((row) => ({
      date: toDateKey(row.period_date),
      value: toNumber(row.value),
      n: Number(row.n || 0),
    }));
  }

  async getBundle(params: {
    stationId: number;
    runId: number;
    agg: AggInterval;
    startDate?: string;
    endDate?: string;
  }): Promise<ErosionBundleResult> {
    const scenario = await this.resolveScenario(params.runId);
    if (!scenario) {
      return { catalog: [], aggregated: {} };
    }

    const defs = await this.getAvailableVariables();
    const catalogRows = await this.getCatalog(params.stationId, params.runId);
    const aggregated: Record<string, ErosionAggregatedRow[]> = {};
    const catalog: ErosionCatalogRow[] = [];

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

  async getSubbasins(): Promise<ErosionSubbasinRow[]> {
    const availability = await this.getSubbasinAvailability();
    const rowsById = new Map<
      number,
      ErosionSubbasinRow & { runIds: Set<number> }
    >();

    for (const row of availability) {
      const existing = rowsById.get(row.subbasin_station_id);
      if (!existing) {
        rowsById.set(row.subbasin_station_id, {
          subbasin_station_id: row.subbasin_station_id,
          subbasin_id: row.subbasin_id,
          station_code: row.station_code,
          subbasin_name: row.subbasin_name,
          runs_count: 0,
          points_count: row.points_count,
          min_date: row.min_date,
          max_date: row.max_date,
          runIds: new Set([row.run_id]),
        });
        continue;
      }

      existing.runIds.add(row.run_id);
      existing.points_count += row.points_count;
      existing.min_date =
        !existing.min_date || (row.min_date && row.min_date < existing.min_date)
          ? row.min_date
          : existing.min_date;
      existing.max_date =
        !existing.max_date || (row.max_date && row.max_date > existing.max_date)
          ? row.max_date
          : existing.max_date;
    }

    return Array.from(rowsById.values())
      .map((row) => ({
        subbasin_station_id: row.subbasin_station_id,
        subbasin_id: row.subbasin_id,
        station_code: row.station_code,
        subbasin_name: row.subbasin_name,
        runs_count: row.runIds.size,
        points_count: row.points_count,
        min_date: row.min_date,
        max_date: row.max_date,
      }))
      .sort((a, b) => a.subbasin_id - b.subbasin_id);
  }

  async getSubbasinAvailability(subbasinStationId?: number): Promise<ErosionSubbasinAvailabilityRow[]> {
    try {
      const accessScenarioRows = await this.getSubbasinAvailabilityFromAccessScenarioSummary(
        subbasinStationId
      );
      if (accessScenarioRows.length) {
        return accessScenarioRows;
      }
    } catch (error) {
      console.error("[erosion] subbasin availability scenario summary failed", error);
    }

    if (await this.db.relationExists("api.mv_hydro_station_stats")) {
      try {
        const matRows = await this.getSubbasinAvailabilityFromMatView(subbasinStationId);
        if (matRows.length) return matRows;
      } catch (error) {
        console.error("[erosion] subbasin availability from matview failed", error);
      }
    }

    if (await this.db.relationExists("public.v_ts_catalog_enriched")) {
      try {
        const catalogRows = await this.getSubbasinAvailabilityFromCatalog(subbasinStationId);
        if (catalogRows.length) return catalogRows;
      } catch (error) {
        console.error("[erosion] subbasin availability from catalog failed", error);
      }
    }

    try {
      const accessRows = await this.getSubbasinAvailabilityFromAccessModelRuns(subbasinStationId);
      if (accessRows.length) return accessRows;
    } catch (error) {
      console.error("[erosion] subbasin availability from access.sub_results failed", error);
    }

    return this.getSubbasinAvailabilityFromAccessVirtual(subbasinStationId);
  }

  private async getSubbasinAvailabilityFromAccessScenarioSummary(
    subbasinStationId?: number
  ): Promise<ErosionSubbasinAvailabilityRow[]> {
    const params: unknown[] = [EROSION_SCENARIO_CODES];
    const stationFilter =
      subbasinStationId == null
        ? ""
        : (() => {
            params.push(subbasinStationId);
            return `AND st.station_id = $${params.length}`;
          })();

    const rows = await this.query<{
      subbasin_station_id: number;
      subbasin_id: number;
      station_code: string;
      subbasin_name: string;
      run_id: number | null;
      scenario_code: string;
      points_count: string | number;
      min_date: string | null;
      max_date: string | null;
    }>(
      `
      WITH run_map AS (
        SELECT DISTINCT ON (mr.scenario_code)
          mr.scenario_code,
          mr.run_id
        FROM core.model_runs mr
        WHERE mr.scenario_code = ANY($1::text[])
        ORDER BY mr.scenario_code, mr.run_id
      ),
      availability AS (
        SELECT
          st.station_id AS subbasin_station_id,
          s.sub_code::int AS subbasin_id,
          st.station_code,
          st.name AS subbasin_name,
          s.scenario_code,
          COUNT(*)::bigint AS points_count,
          MIN(s.period_date)::date::text AS min_date,
          MAX(s.period_date)::date::text AS max_date
        FROM access.sub_results s
        JOIN core.stations st
          ON st.station_code = ('swat_sub_' || s.sub_code::text)
        WHERE s.scenario_code = ANY($1::text[])
          AND s.syld_t_ha IS NOT NULL
          ${stationFilter}
        GROUP BY
          st.station_id,
          s.sub_code,
          st.station_code,
          st.name,
          s.scenario_code
      )
      SELECT
        a.subbasin_station_id,
        a.subbasin_id,
        a.station_code,
        a.subbasin_name,
        rm.run_id,
        a.scenario_code,
        a.points_count,
        a.min_date,
        a.max_date
      FROM availability a
      LEFT JOIN run_map rm
        ON rm.scenario_code = a.scenario_code
      ORDER BY a.subbasin_id, a.scenario_code
      `,
      params
    );

    return rows
      .filter((row) => Number.isFinite(Number(row.run_id)))
      .map((row) => ({
        subbasin_station_id: Number(row.subbasin_station_id),
        subbasin_id: Number(row.subbasin_id),
        station_code: String(row.station_code),
        subbasin_name: String(row.subbasin_name),
        run_id: Number(row.run_id),
        scenario_code: String(row.scenario_code),
        scenario_name:
          EROSION_SCENARIO_NAME_BY_CODE[row.scenario_code as ErosionScenarioCode] ||
          String(row.scenario_code),
        source_type: "simulated",
        time_step: "daily",
        property_id: 33,
        property_name: "SWAT Dégradation spécifique (t/ha)",
        standard_name: "SWAT_SYLDT_HA",
        unit: "t/ha",
        points_count: Number(row.points_count || 0),
        min_date: row.min_date,
        max_date: row.max_date,
      }));
  }

  private async getSubbasinAvailabilityFromAccessVirtual(
    subbasinStationId?: number
  ): Promise<ErosionSubbasinAvailabilityRow[]> {
    const params: unknown[] = [];
    const where = ["s.scenario_code = 'etat_actuel'", "s.syld_t_ha IS NOT NULL"];

    if (subbasinStationId) {
      params.push(subbasinStationId);
      where.push(`sim.station_id = $${params.length}`);
    }

    const rows = await this.query<{
      subbasin_station_id: number;
      subbasin_id: number;
      station_code: string;
      subbasin_name: string;
      points_count: string | number;
      min_date: string | null;
      max_date: string | null;
    }>(
      `
      SELECT
        sim.station_id AS subbasin_station_id,
        s.sub_code::int AS subbasin_id,
        sim.station_code,
        sim.name AS subbasin_name,
        COUNT(*)::bigint AS points_count,
        MIN(s.period_date)::date::text AS min_date,
        MAX(s.period_date)::date::text AS max_date
      FROM access.sub_results s
      JOIN gis.subbasin_shapes valid_sb
        ON valid_sb.subbasin_id = s.sub_code
      JOIN core.stations sim
        ON sim.station_code = ('swat_sub_' || s.sub_code::text)
      WHERE ${where.join(" AND ")}
      GROUP BY sim.station_id, s.sub_code, sim.station_code, sim.name
      ORDER BY s.sub_code
      `,
      params
    );

    const modelRuns = await this.query<{
      run_id: number;
      scenario_code: string;
      scenario_name: string;
    }>(
      `
      SELECT run_id, scenario_code, scenario_name
      FROM core.model_runs
      WHERE scenario_code = 'etat_actuel'
      ORDER BY run_id
      `
    );

    const runRows =
      modelRuns.length > 0
        ? modelRuns
        : NORMALIZED_SWAT_SCENARIOS.filter(
            (scenario) => scenario.scenario_code === "etat_actuel"
          );

    return rows.flatMap((row) =>
      runRows.map((scenario) => ({
        subbasin_station_id: Number(row.subbasin_station_id),
        subbasin_id: Number(row.subbasin_id),
        station_code: String(row.station_code),
        subbasin_name: String(row.subbasin_name),
        run_id: Number(scenario.run_id),
        scenario_code: String(scenario.scenario_code),
        scenario_name: String(scenario.scenario_name),
        source_type: "simulated",
        time_step: "daily" as ErosionTimeStep,
        property_id: 33,
        property_name: "Dégradation spécifique (t/ha)",
        standard_name: "SWAT_SYLDT_HA",
        unit: "t/ha",
        points_count: Number(row.points_count || 0),
        min_date: row.min_date,
        max_date: row.max_date,
      }))
    );
    /*
      NORMALIZED_SWAT_SCENARIOS.map((scenario) => ({
        subbasin_station_id: Number(row.subbasin_station_id),
        subbasin_id: Number(row.subbasin_id),
        station_code: String(row.station_code),
        subbasin_name: String(row.subbasin_name),
        run_id: 1,
        scenario_code: "OBSERVED",
        scenario_name: "Observé",
        source_type: "observed",
        time_step: "daily" as ErosionTimeStep,
        property_id: 33,
        property_name: "Dégradation spécifique (t/ha)",
        standard_name: "SWAT_SYLDT_HA",
        unit: "t/ha",
        points_count: 0,
        min_date: null,
        max_date: null,
        subbasin_station_id: Number(row.subbasin_station_id),
        subbasin_id: Number(row.subbasin_id),
        station_code: String(row.station_code),
        subbasin_name: String(row.subbasin_name),
        run_id: scenario.run_id,
        scenario_code: scenario.scenario_code,
        scenario_name: scenario.scenario_name,
        source_type: "simulated",
        time_step: "daily" as ErosionTimeStep,
        property_id: 33,
        property_name: "Dégradation spécifique (t/ha)",
        standard_name: "SWAT_SYLDT_HA",
        unit: "t/ha",
        points_count: Number(row.points_count || 0),
        min_date: row.min_date,
        max_date: row.max_date,
      })),
    ]
    );
    */
  }

  private async getSubbasinAvailabilityFromAccessModelRuns(subbasinStationId?: number): Promise<ErosionSubbasinAvailabilityRow[]> {
    const params: unknown[] = [EROSION_SCENARIO_CODES];
    const where: string[] = [
      "s.scenario_code = ANY($1::text[])",
      "s.syld_t_ha IS NOT NULL",
    ];

    if (subbasinStationId) {
      params.push(subbasinStationId);
      where.push(`st.station_id = $${params.length}`);
    }

    const q = `
      WITH source AS (
        SELECT
          st.station_id AS subbasin_station_id,
          s.sub_code::int AS subbasin_id,
          st.station_code,
          st.name AS subbasin_name,
          mr.run_id,
          s.scenario_code,
          mr.scenario_name,
          CASE
            WHEN s.scenario_code LIKE '%\\_annual' ESCAPE '\\' THEN 'annual'
            WHEN s.scenario_code LIKE '%\\_monthly' ESCAPE '\\' THEN 'monthly'
            ELSE 'daily'
          END AS time_step,
          s.period_date,
          s.syld_t_ha
        FROM access.sub_results s
        JOIN gis.subbasin_shapes valid_sb
          ON valid_sb.subbasin_id = s.sub_code
        JOIN core.stations st
          ON st.station_code = ('swat_sub_' || s.sub_code::text)
        JOIN core.model_runs mr
          ON mr.scenario_code = s.scenario_code
        WHERE ${where.join(" AND ")}
      ),
      grouped AS (
        SELECT
          subbasin_station_id,
          subbasin_id,
          station_code,
          subbasin_name,
          run_id,
          scenario_code,
          scenario_name,
          time_step,
          'simulated'::text AS source_type,
          33::int AS property_id,
          'Dégradation spécifique (t/ha)'::text AS property_name,
          'SWAT_SYLDT_HA'::text AS standard_name,
          't/ha'::text AS unit,
          COUNT(*)::bigint AS points_count,
          MIN(period_date)::date::text AS min_date,
          MAX(period_date)::date::text AS max_date
        FROM source
        WHERE syld_t_ha IS NOT NULL
        GROUP BY
          subbasin_station_id,
          subbasin_id,
          station_code,
          subbasin_name,
          run_id,
          scenario_code,
          scenario_name,
          time_step
      ),
      ranked AS (
        SELECT
          *,
          ROW_NUMBER() OVER (
            PARTITION BY subbasin_station_id, run_id, scenario_code, property_id
          ORDER BY CASE time_step
            WHEN 'daily' THEN 1
            WHEN 'monthly' THEN 2
            WHEN 'annual' THEN 3
            ELSE 99
          END
          ) AS rn
        FROM grouped
      )
      SELECT
        subbasin_station_id,
        subbasin_id,
        station_code,
        subbasin_name,
        run_id,
        scenario_code,
        scenario_name,
        source_type,
        time_step,
        property_id,
        property_name,
        standard_name,
        unit,
        points_count,
        min_date,
        max_date
      FROM ranked
      WHERE rn = 1
      ORDER BY subbasin_id, run_id;
    `;

    return this.query<ErosionSubbasinAvailabilityRow>(q, params);
  }

  private async getSubbasinAvailabilityFromCatalog(
    subbasinStationId?: number
  ): Promise<ErosionSubbasinAvailabilityRow[]> {
    const params: unknown[] = [EROSION_SCENARIO_CODES];
    const where: string[] = [
      "v.source_type = 'simulated'",
      "v.scenario_code = ANY($1::text[])",
      "v.standard_name = 'SWAT_SYLDT_HA'",
      "v.property_id = 33",
    ];

    if (subbasinStationId) {
      params.push(subbasinStationId);
      where.push(`v.station_id = $${params.length}`);
    }

    const fastCatalogRows = await this.query<{
      ts_id: number;
      subbasin_station_id: number;
      subbasin_id: number | null;
      station_code: string;
      subbasin_name: string;
      run_id: number;
      scenario_code: string;
      scenario_name: string;
      source_type: string;
      time_step: string;
      property_id: number;
      property_name: string;
      standard_name: string;
      unit: string | null;
    }>(
      `
      SELECT
        ts_id,
        subbasin_station_id,
        subbasin_id,
        station_code,
        subbasin_name,
        run_id,
        scenario_code,
        scenario_name,
        source_type,
        time_step,
        property_id,
        property_name,
        standard_name,
        unit
      FROM (
        SELECT
          v.ts_id,
          v.station_id AS subbasin_station_id,
          NULLIF(replace(v.station_code, 'swat_sub_', ''), '')::int AS subbasin_id,
          v.station_code,
          v.station_name AS subbasin_name,
          v.run_id,
          v.scenario_code,
          v.scenario_name,
          v.source_type,
          v.time_step,
          v.property_id,
          v.property_name,
          v.standard_name,
          v.unit,
          ROW_NUMBER() OVER (
            PARTITION BY v.station_id, v.run_id, v.scenario_code, v.property_id
            ORDER BY CASE v.time_step
              WHEN 'daily' THEN 1
              WHEN 'monthly' THEN 2
              WHEN 'annual' THEN 3
              ELSE 99
            END,
            v.ts_id
          ) AS rn
        FROM public.v_ts_catalog_enriched v
        WHERE ${where.join(" AND ")}
          AND v.station_code ~ '^swat_sub_[0-9]+$'
      ) ranked
      WHERE rn = 1
      ORDER BY subbasin_id, run_id
      `,
      params
    );

    const fastFilteredRows = fastCatalogRows.filter(
      (row): row is typeof row & { subbasin_id: number } => Number.isFinite(Number(row.subbasin_id))
    );
    if (!fastFilteredRows.length) {
      return [];
    }

    const fastValidSubbasinIds = new Set(
      (
        await this.query<{ subbasin_id: number }>(
          `
          SELECT subbasin_id
          FROM gis.subbasin_shapes
          WHERE subbasin_id = ANY($1::int[])
          `,
          [[...new Set(fastFilteredRows.map((row) => Number(row.subbasin_id)))]]
        )
      ).map((row) => Number(row.subbasin_id))
    );

    const fastRankedRows = fastFilteredRows.filter((row) =>
      fastValidSubbasinIds.has(Number(row.subbasin_id))
    );
    if (!fastRankedRows.length) {
      return [];
    }

    const fastMeasurementStats = await this.query<{
      ts_id: number;
      points_count: string | number;
      min_date: string | null;
      max_date: string | null;
    }>(
      `
      SELECT
        m.ts_id,
        COUNT(*)::bigint AS points_count,
        MIN(m.datetime)::date::text AS min_date,
        MAX(m.datetime)::date::text AS max_date
      FROM core.measurements m
      WHERE m.ts_id = ANY($1::int[])
      GROUP BY m.ts_id
      `,
      [[...new Set(fastRankedRows.map((row) => Number(row.ts_id)))]]
    );

    const fastStatsByTsId = new Map(
      fastMeasurementStats.map((row) => [
        Number(row.ts_id),
        {
          points_count: Number(row.points_count || 0),
          min_date: row.min_date,
          max_date: row.max_date,
        },
      ])
    );

    return fastRankedRows.map((row) => {
      const stats = fastStatsByTsId.get(Number(row.ts_id));
      return {
        subbasin_station_id: Number(row.subbasin_station_id),
        subbasin_id: Number(row.subbasin_id),
        station_code: String(row.station_code),
        subbasin_name: String(row.subbasin_name),
        run_id: Number(row.run_id),
        scenario_code: String(row.scenario_code),
        scenario_name: String(row.scenario_name),
        source_type: String(row.source_type),
        time_step: String(row.time_step) as ErosionTimeStep,
        property_id: Number(row.property_id),
        property_name: String(row.property_name),
        standard_name: String(row.standard_name),
        unit: row.unit ?? null,
        points_count: stats?.points_count ?? 0,
        min_date: stats?.min_date ?? null,
        max_date: stats?.max_date ?? null,
      };
    });

    const rows = await this.query<{
      subbasin_station_id: number;
      subbasin_id: number;
      station_code: string;
      subbasin_name: string;
      run_id: number;
      scenario_code: string;
      scenario_name: string;
      source_type: string;
      time_step: string;
      property_id: number;
      property_name: string;
      standard_name: string;
      unit: string | null;
      points_count: string | number;
      min_date: string | null;
      max_date: string | null;
      rn: string | number;
    }>(
      `
      WITH catalog AS (
        SELECT
          v.station_id AS subbasin_station_id,
          COALESCE(NULLIF(replace(v.station_code, 'swat_sub_', ''), '')::int, v.station_id) AS subbasin_id,
          v.station_code,
          v.station_name AS subbasin_name,
          v.run_id,
          v.scenario_code,
          v.scenario_name,
          v.source_type,
          v.time_step,
          33::int AS property_id,
          'Dégradation spécifique (t/ha)'::text AS property_name,
          'SWAT_SYLDT_HA'::text AS standard_name,
          't/ha'::text AS unit,
          COALESCE(v.n_points, 0)::bigint AS points_count,
          v.start_date::date::text AS min_date,
          v.end_date::date::text AS max_date,
          ROW_NUMBER() OVER (
            PARTITION BY v.station_id, v.run_id, v.scenario_code, 33
            ORDER BY CASE v.time_step
              WHEN 'daily' THEN 1
              WHEN 'monthly' THEN 2
              WHEN 'annual' THEN 3
              ELSE 99
            END
          ) AS rn
        FROM public.v_ts_catalog v
        WHERE ${where.join(" AND ")}
          AND v.station_code ~ '^swat_sub_[0-9]+$'
          AND EXISTS (
            SELECT 1
            FROM gis.subbasin_shapes valid_sb
            WHERE valid_sb.subbasin_id = replace(v.station_code, 'swat_sub_', '')::int
          )
      )
      SELECT
        subbasin_station_id,
        subbasin_id,
        station_code,
        subbasin_name,
        run_id,
        scenario_code,
        scenario_name,
        source_type,
        time_step,
        property_id,
        property_name,
        standard_name,
        unit,
        points_count,
        min_date,
        max_date,
        rn
      FROM catalog
      WHERE rn = 1
      ORDER BY subbasin_id, run_id;
      `,
      params
    );

    return rows.map((row) => ({
      subbasin_station_id: Number(row.subbasin_station_id),
      subbasin_id: Number(row.subbasin_id),
      station_code: String(row.station_code),
      subbasin_name: String(row.subbasin_name),
      run_id: Number(row.run_id),
      scenario_code: String(row.scenario_code),
      scenario_name: String(row.scenario_name),
      source_type: String(row.source_type),
      time_step: String(row.time_step) as ErosionTimeStep,
      property_id: Number(row.property_id),
      property_name: String(row.property_name),
      standard_name: String(row.standard_name),
      unit: row.unit ?? null,
      points_count: Number(row.points_count || 0),
      min_date: row.min_date,
      max_date: row.max_date,
    }));
  }

  private async getSubbasinAvailabilityFromMatView(subbasinStationId?: number): Promise<ErosionSubbasinAvailabilityRow[]> {
    const params: unknown[] = [EROSION_SCENARIO_CODES];
    const where: string[] = [
      "scenario_code = ANY($1::text[])",
      "property_id = 33",
      "source_table = 'sub'",
    ];

    if (subbasinStationId) {
      params.push(subbasinStationId);
      where.push(`station_id = $${params.length}`);
    }

    const rows = await this.query<ErosionSubbasinAvailabilityRow>(
      `
      SELECT
        station_id AS subbasin_station_id,
        subbasin_id,
        station_code,
        station_name AS subbasin_name,
        run_id,
        scenario_code,
        scenario_name,
        source_type,
        time_step,
        property_id,
        property_name,
        standard_name,
        unit,
        n_measures AS points_count,
        dt_min AS min_date,
        dt_max AS max_date
      FROM api.mv_hydro_station_stats h
      WHERE ${where.join(" AND ")}
        AND EXISTS (
          SELECT 1
          FROM gis.subbasin_shapes valid_sb
          WHERE valid_sb.subbasin_id = h.subbasin_id
        )
      ORDER BY station_id, run_id;
      `,
      params
    );

    return rows;
  }

  async getSubbasinSeries(
    interval: AggInterval,
    filter: {
      subbasinStationId: number;
      runId: number;
      startDate?: string;
      endDate?: string;
    }
  ): Promise<ErosionSeriesPoint[]> {
    const unit = interval === "month" ? "month" : interval === "year" ? "year" : "day";
    const availabilityRows = (await this.getSubbasinAvailability(filter.subbasinStationId)).filter(
      (row) => row.run_id === filter.runId
    );
    if (!availabilityRows.length) {
      return [];
    }

    const native = getNativeGranularityFromRows(availabilityRows);
    const sourceCanonical = pickSourceTimeStep(interval, native);
    if (!sourceCanonical) {
      return [];
    }

    const selected =
      availabilityRows.find(
        (row) => normalizeTimeStep(row.time_step) === sourceCanonical
      ) || availabilityRows[0];
    const subbasinId = selected.subbasin_id;
    if (!Number.isFinite(subbasinId)) {
      return [];
    }
    if (String(selected.scenario_code).toUpperCase() === "OBSERVED") {
      return [];
    }
    const storageTimeStep = resolveStorageTimeStep(
      selected.scenario_code,
      sourceCanonical === "annual" ? "annual" : sourceCanonical
    );

    if (await this.db.relationExists("api.mv_hydro_station_timeseries")) {
      const params: unknown[] = [
        subbasinId,
        filter.runId,
        storageTimeStep,
        "sub",
      ];
      const where: string[] = [
        "subbasin_id = $1",
        "run_id = $2",
        "time_step = $3",
        "source_table = $4",
        "syld_t_ha IS NOT NULL",
      ];

      if (filter.startDate) {
        params.push(filter.startDate);
        where.push(`period_date >= $${params.length}::date`);
      }
      if (filter.endDate) {
        params.push(filter.endDate);
        where.push(`period_date <= $${params.length}::date`);
      }

      const sql = `
        SELECT
          date_trunc('${unit}', period_date::timestamp)::date::text AS period,
          AVG(syld_t_ha)::double precision AS value,
          COUNT(*)::int AS n
        FROM api.mv_hydro_station_timeseries
        WHERE ${where.join(" AND ")}
        GROUP BY 1
        ORDER BY 1;
      `;

      const rows = await this.query<{ period: string; value: number | string | null; n: number | string }>(sql, params);
      if (rows.length) {
        return rows.map((row) => ({
          date: toDateKey(row.period),
          value: toNumber(row.value),
          n: Number(row.n || 0),
        }));
      }
    }

    const catalogRows = await this.loadSubbasinSeriesFromCatalogMeasurements(
      filter.subbasinStationId,
      filter.runId,
      unit,
      filter.startDate,
      filter.endDate
    );
    if (catalogRows.length) {
      return catalogRows;
    }

    const params: unknown[] = [
      subbasinId,
      selected.scenario_code,
      unit,
    ];
    const where: string[] = [
      "s.sub_code = $1",
      "s.scenario_code = $2",
      "s.syld_t_ha IS NOT NULL",
    ];

    if (filter.startDate) {
      params.push(filter.startDate);
      where.push(`s.period_date >= $${params.length}::date`);
    }
    if (filter.endDate) {
      params.push(filter.endDate);
      where.push(`s.period_date <= $${params.length}::date`);
    }

    const sql = `
      SELECT
        date_trunc($3, s.period_date::timestamp)::date::text AS period,
        AVG(s.syld_t_ha)::double precision AS value,
        COUNT(*)::int AS n
      FROM access.sub_results s
      WHERE ${where.join(" AND ")}
      GROUP BY 1
      ORDER BY 1;
    `;

    const rows = await this.query<{ period: string; value: number | string | null; n: number | string }>(sql, params);

    return rows.map((row) => ({
      date: toDateKey(row.period),
      value: toNumber(row.value),
      n: Number(row.n || 0),
    }));
  }

  async getSubbasinStats(filter: {
    subbasinStationId: number;
    runId: number;
    startDate?: string;
    endDate?: string;
  }): Promise<ErosionSeriesStats | null> {
    const selected = (await this.getSubbasinAvailability(filter.subbasinStationId)).find(
      (row) => row.run_id === filter.runId
    );
    if (!selected) {
      return null;
    }
    const subbasinId = selected.subbasin_id;
    if (!Number.isFinite(subbasinId)) {
      return null;
    }
    if (String(selected.scenario_code).toUpperCase() === "OBSERVED") {
      return null;
    }
    const storageTimeStep = resolveStorageTimeStep(selected.scenario_code, selected.time_step);

    if (await this.db.relationExists("api.mv_hydro_station_timeseries")) {
      const params: unknown[] = [
        subbasinId,
        filter.runId,
        storageTimeStep,
        "sub",
      ];
      const where: string[] = [
        "subbasin_id = $1",
        "run_id = $2",
        "time_step = $3",
        "source_table = $4",
        "syld_t_ha IS NOT NULL",
      ];

      if (filter.startDate) {
        params.push(filter.startDate);
        where.push(`period_date >= $${params.length}::date`);
      }
      if (filter.endDate) {
        params.push(filter.endDate);
        where.push(`period_date <= $${params.length}::date`);
      }

      const row = await this.queryOne<ErosionSeriesStats>(
        `
        SELECT
          MIN(syld_t_ha)::double precision AS min_value,
          MAX(syld_t_ha)::double precision AS max_value,
          AVG(syld_t_ha)::double precision AS avg_value,
          SUM(syld_t_ha)::double precision AS sum_value,
          COUNT(*)::int AS n_points,
          MIN(period_date)::date::text AS min_date,
          MAX(period_date)::date::text AS max_date
        FROM api.mv_hydro_station_timeseries
        WHERE ${where.join(" AND ")};
        `,
        params
      );
      if (row && Number(row.n_points || 0) > 0) return row;
    }

    const catalogStats = await this.loadSubbasinStatsFromCatalogMeasurements(
      filter.subbasinStationId,
      filter.runId,
      filter.startDate,
      filter.endDate
    );
    if (catalogStats && Number(catalogStats.n_points || 0) > 0) {
      return catalogStats;
    }

    const params: unknown[] = [
      subbasinId,
      selected.scenario_code,
    ];
    const where: string[] = [
      "s.sub_code = $1",
      "s.scenario_code = $2",
      "s.syld_t_ha IS NOT NULL",
    ];

    if (filter.startDate) {
      params.push(filter.startDate);
      where.push(`s.period_date >= $${params.length}::date`);
    }
    if (filter.endDate) {
      params.push(filter.endDate);
      where.push(`s.period_date <= $${params.length}::date`);
    }

    const sql = `
      SELECT
        MIN(s.syld_t_ha)::double precision AS min_value,
        MAX(s.syld_t_ha)::double precision AS max_value,
        AVG(s.syld_t_ha)::double precision AS avg_value,
        SUM(s.syld_t_ha)::double precision AS sum_value,
        COUNT(*)::int AS n_points,
        MIN(s.period_date)::date::text AS min_date,
        MAX(s.period_date)::date::text AS max_date
      FROM access.sub_results s
      WHERE ${where.join(" AND ")};
    `;

    return this.queryOne<ErosionSeriesStats>(sql, params);
  }

  private async resolveSubbasinCatalogTsId(
    subbasinStationId: number,
    runId: number
  ): Promise<number | null> {
    if (!(await this.db.relationExists("public.v_ts_catalog_enriched"))) {
      return null;
    }

    const row = await this.queryOne<{ ts_id: number }>(
      `
      SELECT v.ts_id
      FROM public.v_ts_catalog_enriched v
      WHERE v.station_id = $1
        AND v.run_id = $2
        AND v.standard_name = 'SWAT_SYLDT_HA'
        AND v.source_type = 'simulated'
      ORDER BY CASE v.time_step
        WHEN 'daily' THEN 1
        WHEN 'monthly' THEN 2
        WHEN 'annual' THEN 3
        ELSE 99
      END
      LIMIT 1
      `,
      [subbasinStationId, runId]
    );

    return row?.ts_id != null ? Number(row.ts_id) : null;
  }

  private async loadSubbasinSeriesFromCatalogMeasurements(
    subbasinStationId: number,
    runId: number,
    unit: AggInterval,
    startDate?: string,
    endDate?: string
  ): Promise<ErosionSeriesPoint[]> {
    const tsId = await this.resolveSubbasinCatalogTsId(subbasinStationId, runId);
    if (tsId == null) return [];

    const params: unknown[] = [tsId, unit];
    const where = ["m.ts_id = $1"];
    if (startDate) {
      params.push(startDate);
      where.push(`m.datetime::date >= $${params.length}::date`);
    }
    if (endDate) {
      params.push(endDate);
      where.push(`m.datetime::date <= $${params.length}::date`);
    }

    const rows = await this.query<{ period: string; value: number | string | null; n: number | string }>(
      `
      SELECT
        date_trunc($2, m.datetime::timestamp)::date::text AS period,
        AVG(m.value)::double precision AS value,
        COUNT(*)::int AS n
      FROM core.measurements m
      WHERE ${where.join(" AND ")}
      GROUP BY 1
      ORDER BY 1
      `,
      params
    );

    return rows.map((row) => ({
      date: toDateKey(row.period),
      value: toNumber(row.value),
      n: Number(row.n || 0),
    }));
  }

  private async loadSubbasinStatsFromCatalogMeasurements(
    subbasinStationId: number,
    runId: number,
    startDate?: string,
    endDate?: string
  ): Promise<ErosionSeriesStats | null> {
    const tsId = await this.resolveSubbasinCatalogTsId(subbasinStationId, runId);
    if (tsId == null) return null;

    const params: unknown[] = [tsId];
    const where = ["m.ts_id = $1"];
    if (startDate) {
      params.push(startDate);
      where.push(`m.datetime::date >= $${params.length}::date`);
    }
    if (endDate) {
      params.push(endDate);
      where.push(`m.datetime::date <= $${params.length}::date`);
    }

    return this.queryOne<ErosionSeriesStats>(
      `
      SELECT
        MIN(m.value)::double precision AS min_value,
        MAX(m.value)::double precision AS max_value,
        AVG(m.value)::double precision AS avg_value,
        SUM(m.value)::double precision AS sum_value,
        COUNT(*)::int AS n_points,
        MIN(m.datetime)::date::text AS min_date,
        MAX(m.datetime)::date::text AS max_date
      FROM core.measurements m
      WHERE ${where.join(" AND ")};
      `,
      params
    );
  }
}

export const erosionSwatSeriesService = new ErosionSwatSeriesService();

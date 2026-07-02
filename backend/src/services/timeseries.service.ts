// src/services/timeseries.service.ts
import { DatabaseService } from "./database.service";
import { uniqueBy } from "../utils/deduplicate";
import { erosionSwatSeriesService } from "./erosionSwatSeries.service";
import {
  hydroSwatSeriesService,
  type HydroCatalogRow,
  type HydroDateRangeRow,
} from "./hydroSwatSeries.service";
import { isStandardNameVisibleForModule } from "../constants/moduleVariables";
import {
  getNativeGranularityFromRows,
  normalizeTimeStep,
  pickSourceTimeStep,
  resolveSelectableAggregations,
  type AggInterval,
} from "../utils/aggregationAvailability";

const EROSION_VISIBLE_SCENARIO_CODES = new Set([
  "OBSERVED",
  "etat_actuel",
  "ssp126",
  "ssp245",
  "ssp585",
  "scenario_1",
  "scenario_2",
  "scenario_3",
  "scenario_4",
]);

type AggregationAvailability = {
  daily: boolean;
  monthly: boolean;
  annual: boolean;
};

function rangesOverlap(
  rowStart?: string | null,
  rowEnd?: string | null,
  startDate?: string,
  endDate?: string
): boolean {
  if (!startDate && !endDate) return true;
  const from = rowStart || rowEnd || null;
  const to = rowEnd || rowStart || null;
  if (!from || !to) return true;
  if (startDate && to < startDate) return false;
  if (endDate && from > endDate) return false;
  return true;
}

export interface CatalogFilter {
  stationId: number;
  runId: number;
  moduleCode: string;
}

export interface DateRangeFilter {
  stationId: number;
  runId?: number;
  propertyId?: number;
  moduleCode?: string;
}

export interface AggregationAvailabilityFilter {
  stationId: number;
  runId: number;
  propertyId: number;
  moduleCode: string;
  startDate?: string;
  endDate?: string;
}

export interface TsCatalogRow {
  ts_id: number;
  station_id: number;
  station_code: string;
  station_name: string;

  property_id: number;
  property_name: string;
  unit: string | null;
  standard_name: string | null;

  run_id: number;
  scenario_code: string;
  scenario_name: string;

  source_type: string;
  time_step: string;

  ts_created_at: string;

  n_points: number | null;
  start_date: string | null;
  end_date: string | null;
}

export interface TimeseriesDateRangeRow {
  min_date: string | null;
  max_date: string | null;
  n_points: number;
}

export interface TimeseriesBundleResult {
  catalog: TsCatalogRow[];
  aggregated: Record<string, Array<{
    period: string;
    avg_value: number | null;
    min_value: number | null;
    max_value: number | null;
    n: number;
  }>>;
}

export class TimeseriesService {
  private db = new DatabaseService();

  private isHydroCanonical(runId: number | undefined): Promise<boolean> {
    if (!runId) return Promise.resolve(false);
    return hydroSwatSeriesService.resolveHydroScenario(runId).then((row) => !!row);
  }

  private isErosionSimulated(runId: number | undefined): Promise<boolean> {
    if (!runId) return Promise.resolve(false);
    return erosionSwatSeriesService.resolveErosionScenario(runId).then((row) => !!row);
  }

  private async getLegacyCatalog(filter: CatalogFilter): Promise<TsCatalogRow[]> {
    const sql = `
      WITH station_catalog AS (
        SELECT
          c.ts_id,
          c.station_id,
          c.station_code,
          c.station_name,
          c.property_id,
          c.property_name,
          c.unit,
          c.standard_name,
          c.run_id,
          c.scenario_code,
          c.scenario_name,
          c.source_type,
          c.time_step,
          c.ts_created_at,
          c.n_points,
          c.start_date,
          c.end_date
        FROM public.v_ts_catalog_enriched c

        UNION ALL

        SELECT
          c.ts_id,
          m.station_id,
          rs.station_code,
          rs.name AS station_name,
          c.property_id,
          c.property_name,
          c.unit,
          c.standard_name,
          c.run_id,
          c.scenario_code,
          c.scenario_name,
          c.source_type,
          c.time_step,
          c.ts_created_at,
          c.n_points,
          c.start_date,
          c.end_date
        FROM public.v_ts_catalog_enriched c
        JOIN core.stations sw
          ON sw.station_id = c.station_id
        JOIN core.station_reach_map m
          ON m.is_active = true
         AND m.is_primary = true
         AND (
           (m.simulated_station_id IS NOT NULL AND m.simulated_station_id = sw.station_id)
           OR sw.station_code = ('swat_rch_' || m.reach_id::text)
         )
        JOIN core.stations rs
          ON rs.station_id = m.station_id
        WHERE c.source_type = 'simulated'
          AND c.standard_name IN ('SWAT_FLOW_M3S', 'SWAT_SED_TONS')
      )
      SELECT
        c.ts_id,
        c.station_id,
        c.station_code,
        c.station_name,
        c.property_id,
        c.property_name,
        c.unit,
        c.standard_name,
        c.run_id,
        c.scenario_code,
        c.scenario_name,
        c.source_type,
        c.time_step,
        c.ts_created_at,
        c.n_points,
        c.start_date,
        c.end_date
      FROM station_catalog c
      LEFT JOIN public.module_properties mp
        ON mp.property_id = c.property_id
       AND mp.module_code = $3
       AND mp.is_enabled = true
      WHERE c.station_id = $1
        AND c.run_id = $2
        AND (
          mp.property_id IS NOT NULL
          OR (
            c.source_type = 'simulated'
            AND (
              ($3 = 'hydro' AND c.standard_name = 'SWAT_FLOW_M3S')
              OR ($3 = 'erosion' AND c.standard_name IN ('SWAT_SED_TONS', 'SWAT_SYLDT_HA'))
            )
          )
        )
      ORDER BY
        COALESCE(mp.sort_order, 9999),
        c.property_id ASC,
        c.ts_id ASC;
    `;

    const rows = await this.db.query<TsCatalogRow>(sql, [
      filter.stationId,
      filter.runId,
      filter.moduleCode,
    ]);

    const visibleRows = uniqueBy(
      rows.filter((row) =>
        isStandardNameVisibleForModule(filter.moduleCode, row.standard_name)
      ),
      (row) => row.ts_id
    );

    if (filter.moduleCode === "erosion") {
      return visibleRows.filter((row) =>
        EROSION_VISIBLE_SCENARIO_CODES.has(String(row.scenario_code || ""))
      );
    }
    return visibleRows;
  }

  private async getLegacyDateRange(filter: DateRangeFilter): Promise<TimeseriesDateRangeRow> {
    if (filter.moduleCode === "erosion" && filter.runId) {
      const run = await this.db.queryOne<{ scenario_code: string }>(
        `SELECT scenario_code FROM public.model_runs WHERE run_id = $1 LIMIT 1`,
        [filter.runId]
      );

      if (!run || !EROSION_VISIBLE_SCENARIO_CODES.has(run.scenario_code)) {
        return {
          min_date: null,
          max_date: null,
          n_points: 0,
        };
      }
    }

    const sql = `
      SELECT
        MIN(m.datetime)::date::text AS min_date,
        MAX(m.datetime)::date::text AS max_date,
        COUNT(*)::int AS n_points
      FROM public.measurements m
      JOIN public.timeseries t
        ON t.ts_id = m.ts_id
      WHERE t.station_id = $1
        AND ($2::int IS NULL OR t.run_id = $2)
        AND ($3::int IS NULL OR t.property_id = $3)
        AND (
          $4::text IS NULL
          OR EXISTS (
            SELECT 1
            FROM public.module_properties mp
            WHERE mp.property_id = t.property_id
              AND mp.module_code = $4
              AND mp.is_enabled = true
          )
        );
    `;

    const row = await this.db.queryOne<TimeseriesDateRangeRow>(sql, [
      filter.stationId,
      filter.runId ?? null,
      filter.propertyId ?? null,
      filter.moduleCode ?? null,
    ]);

    return (
      row || {
        min_date: null,
        max_date: null,
        n_points: 0,
      }
    );
  }

  private async getLegacyBundle(
    filter: CatalogFilter,
    agg: AggInterval,
    startDate?: string,
    endDate?: string
  ): Promise<TimeseriesBundleResult> {
    const catalog = await this.getLegacyCatalog(filter);
    const aggregated: TimeseriesBundleResult["aggregated"] = {};
    const resultCatalog: TsCatalogRow[] = [];

    const byProperty = new Map<number, TsCatalogRow[]>();
    for (const row of catalog) {
      const propertyRows = byProperty.get(row.property_id) || [];
      propertyRows.push(row);
      byProperty.set(row.property_id, propertyRows);
    }

    const entries = await Promise.all(
      Array.from(byProperty.entries()).map(async ([, propertyRows]) => {
        const native = getNativeGranularityFromRows(propertyRows);
        const sourceTimeStep = pickSourceTimeStep(agg, native);
        if (!sourceTimeStep) return null;

        const ts = propertyRows.find(
          (row) => normalizeTimeStep(row.time_step) === sourceTimeStep
        );
        if (!ts) return null;

        const sql = `
          SELECT
            date_trunc($2, m.datetime) AS period,
            AVG(m.value) AS avg_value,
            MIN(m.value) AS min_value,
            MAX(m.value) AS max_value,
            COUNT(*)::bigint AS n
          FROM public.measurements m
          WHERE m.ts_id = $1
            AND ($3::timestamptz IS NULL OR m.datetime >= $3::timestamptz)
            AND ($4::timestamptz IS NULL OR m.datetime <= $4::timestamptz)
          GROUP BY 1
          ORDER BY 1;
        `;
        const rows = await this.db.query(sql, [
          ts.ts_id,
          agg,
          startDate ? `${startDate}T00:00:00Z` : null,
          endDate ? `${endDate}T23:59:59Z` : null,
        ]);
        if (!rows.length) return null;
        return { ts, rows } as const;
      })
    );

    for (const entry of entries) {
      if (!entry) continue;
      resultCatalog.push(entry.ts);
      aggregated[entry.ts.ts_id] = entry.rows;
    }

    return { catalog: resultCatalog, aggregated };
  }

  private hydroCatalogToTimeseries(row: HydroCatalogRow): TsCatalogRow {
    return {
      ts_id: row.ts_id,
      station_id: row.station_id,
      station_code: row.station_code,
      station_name: row.station_name,
      property_id: row.property_id,
      property_name: row.property_name,
      unit: row.unit,
      standard_name: row.standard_name,
      run_id: row.run_id,
      scenario_code: row.scenario_code,
      scenario_name: row.scenario_name,
      source_type: row.source_type,
      time_step: row.time_step,
      ts_created_at: row.ts_created_at,
      n_points: row.n_points,
      start_date: row.start_date,
      end_date: row.end_date,
    };
  }

  async getCatalog(filter: CatalogFilter): Promise<TsCatalogRow[]> {
    if (filter.moduleCode === "hydro" && (await this.isHydroCanonical(filter.runId))) {
      const rows = await hydroSwatSeriesService.getCatalog(filter.stationId, filter.runId);
      return uniqueBy(
        rows.map((row) => this.hydroCatalogToTimeseries(row)),
        (row) => row.ts_id
      );
    }

    if (filter.moduleCode === "erosion" && (await this.isErosionSimulated(filter.runId))) {
      const rows = await erosionSwatSeriesService.getCatalog(filter.stationId, filter.runId);
      return uniqueBy(rows.map((row) => ({
        ts_id: row.ts_id,
        station_id: row.station_id,
        station_code: row.station_code,
        station_name: row.station_name,
        property_id: row.property_id,
        property_name: row.property_name,
        unit: row.unit,
        standard_name: row.standard_name,
        run_id: row.run_id,
        scenario_code: row.scenario_code,
        scenario_name: row.scenario_name,
        source_type: row.source_type,
        time_step: row.time_step,
        ts_created_at: row.ts_created_at,
        n_points: row.n_points,
        start_date: row.start_date,
        end_date: row.end_date,
      })), (row) => row.ts_id);
    }

    return this.getLegacyCatalog(filter);
  }

  async getDateRange(filter: DateRangeFilter): Promise<TimeseriesDateRangeRow> {
    if (
      filter.moduleCode === "hydro" &&
      filter.runId &&
      filter.propertyId &&
      (await this.isHydroCanonical(filter.runId))
    ) {
      const row = await hydroSwatSeriesService.getDateRange(
        filter.stationId,
        filter.runId,
        filter.propertyId
      );
      return {
        min_date: row.min_date,
        max_date: row.max_date,
        n_points: row.n_points,
      };
    }

    if (
      filter.moduleCode === "erosion" &&
      filter.runId &&
      filter.propertyId &&
      (await this.isErosionSimulated(filter.runId))
    ) {
      const row = await erosionSwatSeriesService.getDateRange(
        filter.stationId,
        filter.runId,
        filter.propertyId
      );
      return {
        min_date: row.min_date,
        max_date: row.max_date,
        n_points: row.n_points,
      };
    }

    return this.getLegacyDateRange(filter);
  }

  async getBundle(
    filter: CatalogFilter,
    agg: AggInterval,
    startDate?: string,
    endDate?: string
  ): Promise<TimeseriesBundleResult> {
    if (filter.moduleCode === "hydro" && (await this.isHydroCanonical(filter.runId))) {
      const bundle = await hydroSwatSeriesService.getBundle({
        stationId: filter.stationId,
        runId: filter.runId,
        agg,
        startDate,
        endDate,
      });

      return {
        catalog: uniqueBy(
          bundle.catalog.map((row) => this.hydroCatalogToTimeseries(row)),
          (row) => row.ts_id
        ),
        aggregated: bundle.aggregated,
      };
    }

    if (filter.moduleCode === "erosion" && (await this.isErosionSimulated(filter.runId))) {
      const bundle = await erosionSwatSeriesService.getBundle({
        stationId: filter.stationId,
        runId: filter.runId,
        agg,
        startDate,
        endDate,
      });

      return {
        catalog: uniqueBy(bundle.catalog.map((row) => ({
          ts_id: row.ts_id,
          station_id: row.station_id,
          station_code: row.station_code,
          station_name: row.station_name,
          property_id: row.property_id,
          property_name: row.property_name,
          unit: row.unit,
          standard_name: row.standard_name,
          run_id: row.run_id,
          scenario_code: row.scenario_code,
          scenario_name: row.scenario_name,
          source_type: row.source_type,
          time_step: row.time_step,
          ts_created_at: row.ts_created_at,
          n_points: row.n_points,
          start_date: row.start_date,
          end_date: row.end_date,
        })), (row) => row.ts_id),
        aggregated: bundle.aggregated,
      };
    }

    return this.getLegacyBundle(filter, agg, startDate, endDate);
  }

  async getAggregationAvailability(
    filter: AggregationAvailabilityFilter
  ): Promise<AggregationAvailability> {
    const catalog = await this.getCatalog({
      stationId: filter.stationId,
      runId: filter.runId,
      moduleCode: filter.moduleCode,
    });

    const selectedRows = catalog.filter(
      (row) =>
        Number(row.property_id) === filter.propertyId &&
        rangesOverlap(row.start_date, row.end_date, filter.startDate, filter.endDate)
    );

    const native = getNativeGranularityFromRows(selectedRows);
    return resolveSelectableAggregations(native);
  }

  async aggregate(
    tsId: number,
    interval: AggInterval,
    startDate: string,
    endDate: string
  ) {
    const unit =
      interval === "day" ? "day" : interval === "month" ? "month" : "year";

    const sql = `
      SELECT
        date_trunc($2, m.datetime) AS period,
        AVG(m.value) AS avg_value,
        MIN(m.value) AS min_value,
        MAX(m.value) AS max_value,
        COUNT(*)::bigint AS n
      FROM public.measurements m
      WHERE m.ts_id = $1
        AND m.datetime >= $3::timestamptz
        AND m.datetime <= $4::timestamptz
      GROUP BY 1
      ORDER BY 1;
    `;

    return this.db.query(sql, [tsId, unit, startDate, endDate]);
  }
}

export const timeseriesService = new TimeseriesService();

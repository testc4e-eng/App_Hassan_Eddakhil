// src/services/timeseries.service.ts
import { DatabaseService } from "./database.service";
import { uniqueBy } from "../utils/deduplicate";
import { erosionSwatSeriesService } from "./erosionSwatSeries.service";
import {
  hydroSwatSeriesService,
  type HydroCatalogRow,
} from "./hydroSwatSeries.service";
import { isStandardNameVisibleForModule } from "../constants/moduleVariables";
import {
  LEGACY_SWAT_REACH_STANDARD_NAMES,
  VISIBLE_AND_OBSERVED_SWAT_SCENARIO_CODE_SET,
  buildSwatStandardNameSqlCondition,
  getLegacyCatalogBackedSwatStandardNames,
} from "../constants/swatDataSources";
import {
  getNativeGranularityFromRows,
  normalizeTimeStep,
  pickSourceTimeStep,
  resolveSelectableAggregations,
  type AggInterval,
} from "../utils/aggregationAvailability";
import { TtlCache } from "../utils/ttlCache";

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

export interface TimeseriesStatsResult {
  count: number;
  min: number | null;
  max: number | null;
  mean: number | null;
  sum: number | null;
  missing: number;
}

export interface TimeseriesTablePageResult {
  items: Array<Record<string, string | number | null>>;
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
}

export class TimeseriesService {
  private db = new DatabaseService();
  private legacyCatalogCache = new TtlCache<TsCatalogRow[]>();
  private legacyAggregationCache = new TtlCache<TimeseriesBundleResult["aggregated"]>();
  private readonly legacyCacheTtlMs = 60_000;

  private isHydroCanonical(runId: number | undefined): Promise<boolean> {
    if (!runId) return Promise.resolve(false);
    return hydroSwatSeriesService.resolveHydroScenario(runId).then((row) => !!row);
  }

  private isErosionSimulated(runId: number | undefined): Promise<boolean> {
    if (!runId) return Promise.resolve(false);
    return erosionSwatSeriesService.resolveErosionScenario(runId).then((row) => !!row);
  }

  private async getLegacyCatalog(filter: CatalogFilter): Promise<TsCatalogRow[]> {
    const legacySwatCatalogFilter = buildSwatStandardNameSqlCondition(
      "c.standard_name",
      getLegacyCatalogBackedSwatStandardNames(filter.moduleCode)
    );
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
          AND c.standard_name IN (${LEGACY_SWAT_REACH_STANDARD_NAMES.map((name) => `'${name}'`).join(", ")})
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
            AND ${legacySwatCatalogFilter}
          )
        )
      ORDER BY
        COALESCE(mp.sort_order, 9999),
        c.property_id ASC,
        c.ts_id ASC;
    `;
    const cacheKey = `legacy.catalog:${filter.stationId}:${filter.runId}:${filter.moduleCode}`;
    return this.legacyCatalogCache.getOrSet(cacheKey, this.legacyCacheTtlMs, async () => {
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
          VISIBLE_AND_OBSERVED_SWAT_SCENARIO_CODE_SET.has(
            String(row.scenario_code || "")
          )
        );
      }
      return visibleRows;
    });
  }

  private async getLegacyDateRange(filter: DateRangeFilter): Promise<TimeseriesDateRangeRow> {
    if (filter.moduleCode === "erosion" && filter.runId) {
      const run = await this.db.queryOne<{ scenario_code: string }>(
        `SELECT scenario_code FROM public.model_runs WHERE run_id = $1 LIMIT 1`,
        [filter.runId]
      );

      if (
        !run ||
        !VISIBLE_AND_OBSERVED_SWAT_SCENARIO_CODE_SET.has(run.scenario_code)
      ) {
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
    endDate?: string,
    propertyIds?: number[],
    maxPoints?: number
  ): Promise<TimeseriesBundleResult> {
    const catalog = this.filterCatalogByPropertyIds(
      await this.getLegacyCatalog(filter),
      propertyIds
    );
    const selectedCatalog = this.pickCatalogRowsForAggregation(catalog, agg);
    const aggregated = await this.aggregateCatalogRows(
      selectedCatalog,
      agg,
      startDate,
      endDate
    );

    return this.applyBundleFilters(
      {
        catalog: selectedCatalog.filter(
          (row) => (aggregated[String(row.ts_id)] || []).length > 0
        ),
        aggregated,
      },
      propertyIds,
      maxPoints
    );
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

  private normalizePropertyIds(propertyIds?: number[]): number[] {
    return Array.from(
      new Set(
        (propertyIds || [])
          .map((value) => Number(value))
          .filter((value) => Number.isFinite(value))
      )
    );
  }

  private filterCatalogByPropertyIds(
    catalog: TsCatalogRow[],
    propertyIds?: number[]
  ): TsCatalogRow[] {
    const normalizedIds = this.normalizePropertyIds(propertyIds);
    if (!normalizedIds.length) return catalog;
    const allowed = new Set(normalizedIds);
    return catalog.filter((row) => allowed.has(Number(row.property_id)));
  }

  private pickCatalogRowsForAggregation(
    catalog: TsCatalogRow[],
    agg: AggInterval
  ): TsCatalogRow[] {
    const byProperty = new Map<number, TsCatalogRow[]>();
    for (const row of catalog) {
      const propertyRows = byProperty.get(row.property_id) || [];
      propertyRows.push(row);
      byProperty.set(row.property_id, propertyRows);
    }

    const selectedRows: TsCatalogRow[] = [];
    for (const propertyRows of byProperty.values()) {
      const native = getNativeGranularityFromRows(propertyRows);
      const sourceTimeStep = pickSourceTimeStep(agg, native);
      if (!sourceTimeStep) continue;

      const ts =
        propertyRows.find(
          (row) => normalizeTimeStep(row.time_step) === sourceTimeStep
        ) || propertyRows[0];

      if (ts) {
        selectedRows.push(ts);
      }
    }

    return selectedRows.sort((a, b) => a.property_id - b.property_id);
  }

  private async aggregateCatalogRows(
    catalogRows: TsCatalogRow[],
    agg: AggInterval,
    startDate?: string,
    endDate?: string
  ): Promise<TimeseriesBundleResult["aggregated"]> {
    if (!catalogRows.length) return {};
    const tsIds = [...new Set(catalogRows.map((row) => Number(row.ts_id)))].sort((a, b) => a - b);
    const cacheKey = [
      "legacy.agg",
      agg,
      startDate || "",
      endDate || "",
      tsIds.join(","),
    ].join(":");

    return this.legacyAggregationCache.getOrSet(cacheKey, this.legacyCacheTtlMs, async () => {
      const rows = await this.db.query<{
        ts_id: number;
        period: string;
        avg_value: number | null;
        min_value: number | null;
        max_value: number | null;
        n: number;
      }>(
        `
        SELECT
          m.ts_id,
          date_trunc($2, m.datetime)::date::text AS period,
          AVG(m.value)::double precision AS avg_value,
          MIN(m.value)::double precision AS min_value,
          MAX(m.value)::double precision AS max_value,
          COUNT(*)::bigint AS n
        FROM public.measurements m
        WHERE m.ts_id = ANY($1::int[])
          AND ($3::timestamptz IS NULL OR m.datetime >= $3::timestamptz)
          AND ($4::timestamptz IS NULL OR m.datetime <= $4::timestamptz)
        GROUP BY m.ts_id, period
        ORDER BY m.ts_id, period
        `,
        [
          tsIds,
          agg,
          startDate ? `${startDate}T00:00:00Z` : null,
          endDate ? `${endDate}T23:59:59Z` : null,
        ]
      );

      const aggregated: TimeseriesBundleResult["aggregated"] = {};
      for (const row of rows) {
        const key = String(row.ts_id);
        if (!aggregated[key]) aggregated[key] = [];
        aggregated[key].push({
          period: row.period,
          avg_value: row.avg_value,
          min_value: row.min_value,
          max_value: row.max_value,
          n: Number(row.n || 0),
        });
      }

      return aggregated;
    });
  }

  private downsampleAggregatedRows(
    rows: Array<{
      period: string;
      avg_value: number | null;
      min_value: number | null;
      max_value: number | null;
      n: number;
    }>,
    maxPoints?: number
  ) {
    if (!maxPoints || rows.length <= maxPoints) return rows;

    const bucketSize = Math.max(1, Math.ceil(rows.length / maxPoints));
    const picked = new Set<number>([0, rows.length - 1]);

    for (let start = 0; start < rows.length; start += bucketSize) {
      const end = Math.min(rows.length, start + bucketSize);
      let minIdx = start;
      let maxIdx = start;

      for (let index = start; index < end; index += 1) {
        const current = Number(rows[index].avg_value ?? Number.NaN);
        const minValue = Number(rows[minIdx].avg_value ?? Number.NaN);
        const maxValue = Number(rows[maxIdx].avg_value ?? Number.NaN);

        if (Number.isFinite(current) && (!Number.isFinite(minValue) || current < minValue)) {
          minIdx = index;
        }
        if (Number.isFinite(current) && (!Number.isFinite(maxValue) || current > maxValue)) {
          maxIdx = index;
        }
      }

      picked.add(start);
      picked.add(end - 1);
      picked.add(minIdx);
      picked.add(maxIdx);
    }

    const selected = Array.from(picked)
      .filter((index) => index >= 0 && index < rows.length)
      .sort((a, b) => a - b)
      .map((index) => rows[index]);

    if (selected.length <= maxPoints) return selected;

    const step = Math.ceil(selected.length / maxPoints);
    return selected.filter((_, index) => index % step === 0 || index === selected.length - 1);
  }

  private applyBundleFilters(
    bundle: TimeseriesBundleResult,
    propertyIds?: number[],
    maxPoints?: number
  ): TimeseriesBundleResult {
    const catalog = this.filterCatalogByPropertyIds(bundle.catalog, propertyIds);
    const allowedTsIds = new Set(catalog.map((row) => String(row.ts_id)));
    const aggregated = Object.fromEntries(
      Object.entries(bundle.aggregated || {})
        .filter(([tsId]) => allowedTsIds.has(tsId))
        .map(([tsId, rows]) => [tsId, this.downsampleAggregatedRows(rows, maxPoints)])
    );

    return { catalog, aggregated };
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
    endDate?: string,
    options?: { propertyIds?: number[]; maxPoints?: number }
  ): Promise<TimeseriesBundleResult> {
    if (filter.moduleCode === "hydro" && (await this.isHydroCanonical(filter.runId))) {
      const bundle = await hydroSwatSeriesService.getBundle({
        stationId: filter.stationId,
        runId: filter.runId,
        agg,
        startDate,
        endDate,
      });

      return this.applyBundleFilters(
        {
          catalog: uniqueBy(
            bundle.catalog.map((row) => this.hydroCatalogToTimeseries(row)),
            (row) => row.ts_id
          ),
          aggregated: bundle.aggregated,
        },
        options?.propertyIds,
        options?.maxPoints
      );
    }

    if (filter.moduleCode === "erosion" && (await this.isErosionSimulated(filter.runId))) {
      const bundle = await erosionSwatSeriesService.getBundle({
        stationId: filter.stationId,
        runId: filter.runId,
        agg,
        startDate,
        endDate,
      });

      return this.applyBundleFilters(
        {
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
        },
        options?.propertyIds,
        options?.maxPoints
      );
    }

    return this.getLegacyBundle(
      filter,
      agg,
      startDate,
      endDate,
      options?.propertyIds,
      options?.maxPoints
    );
  }

  async getStats(args: {
    filter: CatalogFilter;
    agg: AggInterval;
    startDate?: string;
    endDate?: string;
    propertyIds?: number[];
  }): Promise<TimeseriesStatsResult> {
    const bundle = await this.getBundle(
      args.filter,
      args.agg,
      args.startDate,
      args.endDate,
      { propertyIds: args.propertyIds }
    );

    const values: number[] = [];
    let missing = 0;

    for (const row of bundle.catalog) {
      const series = bundle.aggregated[String(row.ts_id)] || [];
      for (const point of series) {
        if (point.avg_value === null || !Number.isFinite(point.avg_value)) {
          missing += 1;
          continue;
        }
        values.push(Number(point.avg_value));
      }
    }

    if (!values.length) {
      return {
        count: 0,
        min: null,
        max: null,
        mean: null,
        sum: null,
        missing,
      };
    }

    const sum = values.reduce((acc, value) => acc + value, 0);
    return {
      count: values.length,
      min: Math.min(...values),
      max: Math.max(...values),
      mean: sum / values.length,
      sum,
      missing,
    };
  }

  async getTablePage(args: {
    filter: CatalogFilter;
    agg: AggInterval;
    startDate?: string;
    endDate?: string;
    propertyIds?: number[];
    page?: number;
    pageSize?: number;
    search?: string;
    sortColumn?: string;
    sortDirection?: "asc" | "desc";
  }): Promise<TimeseriesTablePageResult> {
    const pageSize = Math.max(1, Math.min(100, Number(args.pageSize || 25)));
    const requestedPage = Math.max(1, Number(args.page || 1));
    const sortColumn = String(args.sortColumn || "date");
    const sortDirection = args.sortDirection === "asc" ? "asc" : "desc";
    const search = String(args.search || "").trim().toLowerCase();

    const bundle = await this.getBundle(
      args.filter,
      args.agg,
      args.startDate,
      args.endDate,
      { propertyIds: args.propertyIds }
    );

    const rowsByPeriod = new Map<string, Record<string, string | number | null>>();

    for (const tsRow of bundle.catalog) {
      const series = bundle.aggregated[String(tsRow.ts_id)] || [];
      const valueKey = `p_${tsRow.property_id}`;
      for (const point of series) {
        const existing = rowsByPeriod.get(point.period) || { date: point.period };
        existing[valueKey] = point.avg_value;
        rowsByPeriod.set(point.period, existing);
      }
    }

    let items = Array.from(rowsByPeriod.values());

    if (search) {
      items = items.filter((row) =>
        Object.values(row).some((value) =>
          String(value ?? "").toLowerCase().includes(search)
        )
      );
    }

    items.sort((left, right) => {
      const a = left[sortColumn];
      const b = right[sortColumn];

      if (sortColumn === "date") {
        const aTime = new Date(String(a ?? "")).getTime() || 0;
        const bTime = new Date(String(b ?? "")).getTime() || 0;
        return sortDirection === "asc" ? aTime - bTime : bTime - aTime;
      }

      const aNum = Number(a ?? 0) || 0;
      const bNum = Number(b ?? 0) || 0;
      return sortDirection === "asc" ? aNum - bNum : bNum - aNum;
    });

    const total = items.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const page = Math.min(requestedPage, totalPages);
    const start = (page - 1) * pageSize;

    return {
      items: items.slice(start, start + pageSize),
      page,
      page_size: pageSize,
      total,
      total_pages: totalPages,
    };
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

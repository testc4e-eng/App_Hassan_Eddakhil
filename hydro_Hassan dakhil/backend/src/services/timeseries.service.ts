// src/services/timeseries.service.ts
import { DatabaseService } from "./database.service";

type AggInterval = "day" | "month" | "year";

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

export class TimeseriesService {
  private db = new DatabaseService();

  async getCatalog(filter: CatalogFilter): Promise<TsCatalogRow[]> {
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

    return this.db.query<TsCatalogRow>(sql, [
      filter.stationId,
      filter.runId,
      filter.moduleCode,
    ]);
  }

  async getDateRange(filter: DateRangeFilter): Promise<TimeseriesDateRangeRow> {
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

import { DatabaseService } from "./database.service";
import {
  SolidYieldAvailabilityRow,
  SolidYieldInterval,
  SolidYieldSeriesPoint,
  SolidYieldStats,
  SolidYieldSubbasinRow,
} from "../types/solidYield.types";

type PeriodFilter = {
  subbasinStationId: number;
  runId: number;
  startDate?: string;
  endDate?: string;
};

export class SolidYieldService {
  private db = new DatabaseService();

  private catalogCte = `
    WITH syldt_catalog AS (
      SELECT
        c.ts_id,
        c.station_id AS subbasin_station_id,
        COALESCE(NULLIF(replace(s.station_code, 'swat_sub_', ''), '')::int, s.station_id) AS subbasin_id,
        s.station_code,
        s.name AS subbasin_name,
        c.run_id,
        c.scenario_code,
        c.scenario_name,
        c.source_type,
        c.property_id,
        c.property_name,
        c.standard_name,
        c.unit,
        COALESCE(c.n_points, 0)::bigint AS points_count,
        c.start_date AS min_date,
        c.end_date AS max_date
      FROM public.v_ts_catalog_enriched c
      JOIN core.stations s
        ON s.station_id = c.station_id
      WHERE c.source_type = 'simulated'
        AND c.standard_name = 'SWAT_SYLDT_HA'
        AND s.station_code LIKE 'swat_sub_%'
    )
  `;

  async getSubbasins(): Promise<SolidYieldSubbasinRow[]> {
    const q = `
      ${this.catalogCte}
      SELECT
        subbasin_station_id,
        subbasin_id,
        station_code,
        subbasin_name,
        count(DISTINCT run_id)::int AS runs_count,
        sum(points_count)::bigint AS points_count,
        min(min_date) AS min_date,
        max(max_date) AS max_date
      FROM syldt_catalog
      GROUP BY subbasin_station_id, subbasin_id, station_code, subbasin_name
      ORDER BY subbasin_id;
    `;
    return this.db.query<SolidYieldSubbasinRow>(q, []);
  }

  async getAvailability(subbasinStationId?: number): Promise<SolidYieldAvailabilityRow[]> {
    const params: any[] = [];
    const where: string[] = [];

    if (subbasinStationId) {
      params.push(subbasinStationId);
      where.push(`subbasin_station_id = $${params.length}`);
    }

    const q = `
      ${this.catalogCte}
      SELECT
        subbasin_station_id,
        subbasin_id,
        station_code,
        subbasin_name,
        run_id,
        scenario_code,
        scenario_name,
        source_type,
        property_id,
        property_name,
        standard_name,
        unit,
        points_count,
        min_date,
        max_date
      FROM syldt_catalog
      ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
      ORDER BY subbasin_id, run_id;
    `;
    return this.db.query<SolidYieldAvailabilityRow>(q, params);
  }

  async getSeries(
    interval: SolidYieldInterval,
    filter: PeriodFilter
  ): Promise<SolidYieldSeriesPoint[]> {
    const unit =
      interval === "month" ? "month" : interval === "year" ? "year" : "day";

    const params: any[] = [filter.subbasinStationId, filter.runId, unit];
    const where = [
      "ts.station_id = $1",
      "ts.run_id = $2",
      "ts.source_type = 'simulated'",
      "p.standard_name = 'SWAT_SYLDT_HA'",
    ];

    if (filter.startDate) {
      params.push(filter.startDate);
      where.push(`m.datetime >= $${params.length}::timestamptz`);
    }
    if (filter.endDate) {
      params.push(filter.endDate);
      where.push(`m.datetime <= $${params.length}::timestamptz`);
    }

    const q = `
      SELECT
        date_trunc($3, m.datetime)::date::text AS period,
        AVG(m.value)::double precision AS value,
        COUNT(*)::int AS n
      FROM core.timeseries ts
      JOIN ref.observed_properties p
        ON p.property_id = ts.property_id
      JOIN core.measurements m
        ON m.ts_id = ts.ts_id
      WHERE ${where.join(" AND ")}
      GROUP BY 1
      ORDER BY 1;
    `;

    return this.db.query<SolidYieldSeriesPoint>(q, params);
  }

  async getStats(filter: PeriodFilter): Promise<SolidYieldStats | null> {
    const params: any[] = [filter.subbasinStationId, filter.runId];
    const where = [
      "ts.station_id = $1",
      "ts.run_id = $2",
      "ts.source_type = 'simulated'",
      "p.standard_name = 'SWAT_SYLDT_HA'",
    ];

    if (filter.startDate) {
      params.push(filter.startDate);
      where.push(`m.datetime >= $${params.length}::timestamptz`);
    }
    if (filter.endDate) {
      params.push(filter.endDate);
      where.push(`m.datetime <= $${params.length}::timestamptz`);
    }

    const q = `
      SELECT
        MIN(m.value)::double precision AS min_value,
        MAX(m.value)::double precision AS max_value,
        AVG(m.value)::double precision AS avg_value,
        SUM(m.value)::double precision AS sum_value,
        COUNT(*)::int AS n_points,
        MIN(m.datetime) AS min_date,
        MAX(m.datetime) AS max_date
      FROM core.timeseries ts
      JOIN ref.observed_properties p
        ON p.property_id = ts.property_id
      JOIN core.measurements m
        ON m.ts_id = ts.ts_id
      WHERE ${where.join(" AND ")};
    `;

    return this.db.queryOne<SolidYieldStats>(q, params);
  }
}

export const solidYieldService = new SolidYieldService();


import { erosionSwatSeriesService } from "./erosionSwatSeries.service";
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

const EROSION_SCENARIO_CODES = [
  "etat_actuel",
  "ssp126",
  "ssp245",
  "ssp585",
  "scenario_1",
  "scenario_2",
  "scenario_3",
  "scenario_4",
] as const;

type SedimentDiagnosticVariableCode = "SED_IN" | "SED_OUT" | "SED_CONC" | "SYLDT_HA";

type SedimentDiagnosticsRow = {
  scenario_code: string;
  scenario_name: string;
  station_id: number;
  station_code: string;
  station_name: string;
  variable_code: SedimentDiagnosticVariableCode;
  source_table: "access.rch_results" | "access.sub_results";
  line_count: number;
  min_date: string | null;
  max_date: string | null;
  min_value: number | null;
  max_value: number | null;
  status: "AVAILABLE" | "NO_DATA";
  reason: string;
};

type SedimentDiagnosticsResponse = {
  generated_at: string;
  scenarios: Array<{
    scenario_code: string;
    scenario_name: string;
    run_id: number;
  }>;
  stations: Array<{
    station_id: number;
    station_code: string;
    station_name: string;
  }>;
  rows: SedimentDiagnosticsRow[];
  summary: {
    scenario_count: number;
    station_count: number;
    available_rows: number;
    missing_rows: number;
  };
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
        AND c.scenario_code = ANY(ARRAY[${EROSION_SCENARIO_CODES.map((code) => `'${code}'`).join(", ")}])
        AND s.station_code LIKE 'swat_sub_%'
    )
  `;

  async getSubbasins(): Promise<SolidYieldSubbasinRow[]> {
    return erosionSwatSeriesService.getSubbasins();
  }

  async getAvailability(subbasinStationId?: number): Promise<SolidYieldAvailabilityRow[]> {
    return erosionSwatSeriesService.getSubbasinAvailability(subbasinStationId);
  }

  async getSeries(
    interval: SolidYieldInterval,
    filter: PeriodFilter
  ): Promise<SolidYieldSeriesPoint[]> {
    const rows = await erosionSwatSeriesService.getSubbasinSeries(interval, {
      subbasinStationId: filter.subbasinStationId,
      runId: filter.runId,
      startDate: filter.startDate,
      endDate: filter.endDate,
    });

    return rows.map((row) => ({
      period: row.date,
      value: row.value,
      n: row.n,
    }));
  }

  async getStats(filter: PeriodFilter): Promise<SolidYieldStats | null> {
    return erosionSwatSeriesService.getSubbasinStats({
      subbasinStationId: filter.subbasinStationId,
      runId: filter.runId,
      startDate: filter.startDate,
      endDate: filter.endDate,
    });
  }

  async getSedimentDiagnostics(): Promise<SedimentDiagnosticsResponse> {
    const scenarios = await this.db.query<{
      run_id: number;
      scenario_code: string;
      scenario_name: string;
    }>(
      `
      SELECT run_id, scenario_code, scenario_name
      FROM core.model_runs
      WHERE scenario_code = ANY($1::text[])
      ORDER BY array_position($1::text[], scenario_code), run_id
      `,
      [EROSION_SCENARIO_CODES]
    );

    const stationIds = [2, 3, 24, 29, 35];
    const stations = await this.db.query<{
      station_id: number;
      station_code: string;
      station_name: string;
    }>(
      `
      SELECT station_id, station_code, name AS station_name
      FROM core.stations
      WHERE station_id = ANY($1::int[])
      ORDER BY station_id
      `,
      [stationIds]
    );

    const rchAgg = await this.db.query<{
      scenario_code: string;
      station_id: number;
      station_code: string;
      station_name: string;
      line_count: number;
      sed_in_count: number;
      sed_out_count: number;
      sed_conc_count: number;
      min_date: string | null;
      max_date: string | null;
      sed_in_min: number | null;
      sed_in_max: number | null;
      sed_out_min: number | null;
      sed_out_max: number | null;
      sed_conc_min: number | null;
      sed_conc_max: number | null;
    }>(
      `
      SELECT
        r.scenario_code,
        COALESCE(m.station_id, r.station_id) AS station_id,
        s.station_code,
        s.name AS station_name,
        COUNT(*)::int AS line_count,
        COUNT(*) FILTER (WHERE r.sed_in_tons IS NOT NULL)::int AS sed_in_count,
        COUNT(*) FILTER (WHERE r.sed_out_tons IS NOT NULL)::int AS sed_out_count,
        COUNT(*) FILTER (WHERE r.sedconc_mg_kg IS NOT NULL)::int AS sed_conc_count,
        MIN(r.period_date)::date::text AS min_date,
        MAX(r.period_date)::date::text AS max_date,
        MIN(r.sed_in_tons)::double precision AS sed_in_min,
        MAX(r.sed_in_tons)::double precision AS sed_in_max,
        MIN(r.sed_out_tons)::double precision AS sed_out_min,
        MAX(r.sed_out_tons)::double precision AS sed_out_max,
        MIN(r.sedconc_mg_kg)::double precision AS sed_conc_min,
        MAX(r.sedconc_mg_kg)::double precision AS sed_conc_max
      FROM access.rch_results r
      LEFT JOIN core.station_subbasin_map m
        ON m.subbasin_id = r.sub_code
       AND m.is_active = true
      JOIN core.stations s
        ON s.station_id = COALESCE(m.station_id, r.station_id)
      WHERE r.scenario_code = ANY($1::text[])
        AND COALESCE(m.station_id, r.station_id) = ANY($2::int[])
      GROUP BY r.scenario_code, COALESCE(m.station_id, r.station_id), s.station_code, s.name
      ORDER BY r.scenario_code, station_id
      `,
      [EROSION_SCENARIO_CODES, stationIds]
    );

    const subAgg = await this.db.query<{
      scenario_code: string;
      station_id: number;
      station_code: string;
      station_name: string;
      line_count: number;
      syld_count: number;
      min_date: string | null;
      max_date: string | null;
      syld_min: number | null;
      syld_max: number | null;
    }>(
      `
      SELECT
        s.scenario_code,
        COALESCE(m.station_id, s.station_id) AS station_id,
        st.station_code,
        st.name AS station_name,
        COUNT(*)::int AS line_count,
        COUNT(*) FILTER (WHERE s.syld_t_ha IS NOT NULL)::int AS syld_count,
        MIN(s.period_date)::date::text AS min_date,
        MAX(s.period_date)::date::text AS max_date,
        MIN(s.syld_t_ha)::double precision AS syld_min,
        MAX(s.syld_t_ha)::double precision AS syld_max
      FROM access.sub_results s
      LEFT JOIN core.station_subbasin_map m
        ON m.subbasin_id = s.sub_code
       AND m.is_active = true
      JOIN core.stations st
        ON st.station_id = COALESCE(m.station_id, s.station_id)
      WHERE s.scenario_code = ANY($1::text[])
        AND COALESCE(m.station_id, s.station_id) = ANY($2::int[])
      GROUP BY s.scenario_code, COALESCE(m.station_id, s.station_id), st.station_code, st.name
      ORDER BY s.scenario_code, station_id
      `,
      [EROSION_SCENARIO_CODES, stationIds]
    );

    const rchMap = new Map<string, (typeof rchAgg)[number]>();
    for (const row of rchAgg) {
      rchMap.set(`${row.scenario_code}:${row.station_id}`, row);
    }

    const subMap = new Map<string, (typeof subAgg)[number]>();
    for (const row of subAgg) {
      subMap.set(`${row.scenario_code}:${row.station_id}`, row);
    }

    const rows: SedimentDiagnosticsRow[] = [];
    for (const scenario of scenarios) {
      for (const station of stations) {
        const key = `${scenario.scenario_code}:${station.station_id}`;
        const rch = rchMap.get(key);
        const sub = subMap.get(key);

        rows.push(
          {
            scenario_code: scenario.scenario_code,
            scenario_name: scenario.scenario_name,
            station_id: station.station_id,
            station_code: station.station_code,
            station_name: station.station_name,
            variable_code: "SED_OUT",
            source_table: "access.rch_results",
            line_count: rch?.sed_out_count ?? 0,
            min_date: rch?.min_date ?? null,
            max_date: rch?.max_date ?? null,
            min_value: rch?.sed_out_min ?? null,
            max_value: rch?.sed_out_max ?? null,
            status: (rch?.sed_out_count ?? 0) > 0 ? "AVAILABLE" : "NO_DATA",
            reason:
              (rch?.sed_out_count ?? 0) > 0
                ? "data_available"
                : "no rows in access.rch_results for this scenario/station",
          },
          {
            scenario_code: scenario.scenario_code,
            scenario_name: scenario.scenario_name,
            station_id: station.station_id,
            station_code: station.station_code,
            station_name: station.station_name,
            variable_code: "SED_IN",
            source_table: "access.rch_results",
            line_count: rch?.sed_in_count ?? 0,
            min_date: rch?.min_date ?? null,
            max_date: rch?.max_date ?? null,
            min_value: rch?.sed_in_min ?? null,
            max_value: rch?.sed_in_max ?? null,
            status: (rch?.sed_in_count ?? 0) > 0 ? "AVAILABLE" : "NO_DATA",
            reason:
              (rch?.sed_in_count ?? 0) > 0
                ? "data_available"
                : "no rows in access.rch_results for this scenario/station",
          },
          {
            scenario_code: scenario.scenario_code,
            scenario_name: scenario.scenario_name,
            station_id: station.station_id,
            station_code: station.station_code,
            station_name: station.station_name,
            variable_code: "SED_CONC",
            source_table: "access.rch_results",
            line_count: rch?.sed_conc_count ?? 0,
            min_date: rch?.min_date ?? null,
            max_date: rch?.max_date ?? null,
            min_value: rch?.sed_conc_min ?? null,
            max_value: rch?.sed_conc_max ?? null,
            status: (rch?.sed_conc_count ?? 0) > 0 ? "AVAILABLE" : "NO_DATA",
            reason:
              (rch?.sed_conc_count ?? 0) > 0
                ? "data_available"
                : "no rows in access.rch_results for this scenario/station",
          },
          {
            scenario_code: scenario.scenario_code,
            scenario_name: scenario.scenario_name,
            station_id: station.station_id,
            station_code: station.station_code,
            station_name: station.station_name,
            variable_code: "SYLDT_HA",
            source_table: "access.sub_results",
            line_count: sub?.syld_count ?? 0,
            min_date: sub?.min_date ?? null,
            max_date: sub?.max_date ?? null,
            min_value: sub?.syld_min ?? null,
            max_value: sub?.syld_max ?? null,
            status: (sub?.syld_count ?? 0) > 0 ? "AVAILABLE" : "NO_DATA",
            reason:
              (sub?.syld_count ?? 0) > 0
                ? "data_available"
                : "no rows in access.sub_results for this scenario/station",
          }
        );
      }
    }

    const availableRows = rows.filter((row) => row.line_count > 0).length;

    return {
      generated_at: new Date().toISOString(),
      scenarios: scenarios.map((row) => ({
        run_id: Number(row.run_id),
        scenario_code: row.scenario_code,
        scenario_name: row.scenario_name,
      })),
      stations: stations.map((row) => ({
        station_id: Number(row.station_id),
        station_code: row.station_code,
        station_name: row.station_name,
      })),
      rows,
      summary: {
        scenario_count: scenarios.length,
        station_count: stations.length,
        available_rows: availableRows,
        missing_rows: rows.length - availableRows,
      },
    };
  }
}

export const solidYieldService = new SolidYieldService();

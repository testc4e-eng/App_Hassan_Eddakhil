// backend/src/services/hydro.service.ts
import { DatabaseService } from "./database.service";
import {
  FilterOptions,
  Station,
  Catchment,
  Measurement,
  Landcover,
  Timeseries,
  ModelRun,
  Reservoir,
} from "../types/hydro.types";
import { isStandardNameVisibleForModule } from "../constants/moduleVariables";

export class HydroService {
  private db = new DatabaseService();

  private static readonly canonicalSwatScenarios = [
    "etat_actuel",
    "ssp126",
    "ssp245",
    "ssp585",
    "scenario_1",
    "scenario_2",
    "scenario_3",
    "scenario_4",
  ] as const;

  // ================ STATIONS ================
  async getStations(filter?: FilterOptions): Promise<Station[]> {
    if (await this.db.relationExists("api.mv_station_catalog")) {
      let query = `
        SELECT
          station_id,
          station_name AS name,
          station_code,
          geometry::text as geom,
          COALESCE(type_station, station_type_code, 'station') as type,
          catchment_id
        FROM api.mv_station_catalog
        WHERE 1=1
      `;
      const params: any[] = [];

      if (filter?.stationIds?.length) {
        query += ` AND station_id = ANY($${params.length + 1})`;
        params.push(filter.stationIds);
      }

      query += ` ORDER BY station_name`;

      if (filter?.limit) {
        query += ` LIMIT $${params.length + 1}`;
        params.push(filter.limit);
      }

      return this.db.query<Station>(query, params);
    }

    let query = `
      SELECT
        station_id,
        name,
        station_code,
        ST_AsGeoJSON(geom) as geom,
        COALESCE(type_station, station_type_code, 'station') as type,
        catchment_id
      FROM public.stations
      WHERE 1=1
    `;
    const params: any[] = [];

    if (filter?.stationIds?.length) {
      query += ` AND station_id = ANY($${params.length + 1})`;
      params.push(filter.stationIds);
    }

    query += ` ORDER BY name`;

    if (filter?.limit) {
      query += ` LIMIT $${params.length + 1}`;
      params.push(filter.limit);
    }

    return this.db.query<Station>(query, params);
  }

  async getStationById(id: number): Promise<Station | null> {
    if (await this.db.relationExists("api.mv_station_catalog")) {
      const query = `
        SELECT
          station_id,
          station_name AS name,
          station_code,
          geometry::text as geom,
          COALESCE(type_station, station_type_code, 'station') as type,
          catchment_id
        FROM api.mv_station_catalog
        WHERE station_id = $1
      `;
      return this.db.queryOne<Station>(query, [id]);
    }

    const query = `
      SELECT
        station_id,
        name,
        station_code,
        ST_AsGeoJSON(geom) as geom,
        COALESCE(type_station, station_type_code, 'station') as type,
        catchment_id
      FROM public.stations
      WHERE station_id = $1
    `;
    return this.db.queryOne<Station>(query, [id]);
  }

  // ================ CATCHMENTS ================
  async getCatchments(filter?: FilterOptions): Promise<Catchment[]> {
    if (await this.db.relationExists("api.mv_basin_catalog")) {
      let query = `
        SELECT
          catchment_id,
          name,
          dam_name,
          area_m2,
          geometry::text as geom
        FROM api.mv_basin_catalog
        WHERE 1=1
      `;
      const params: any[] = [];

      if (filter?.catchmentIds?.length) {
        query += ` AND catchment_id = ANY($${params.length + 1})`;
        params.push(filter.catchmentIds);
      }

      query += " ORDER BY name";
      return this.db.query<Catchment>(query, params);
    }

    let query = `
      SELECT
        catchment_id,
        name,
        dam_name,
        area_m2,
        ST_AsGeoJSON(geom) as geom
      FROM public.catchments
      WHERE 1=1
    `;
    const params: any[] = [];

    if (filter?.catchmentIds?.length) {
      query += ` AND catchment_id = ANY($${params.length + 1})`;
      params.push(filter.catchmentIds);
    }

    query += " ORDER BY name";
    return this.db.query<Catchment>(query, params);
  }

  async getCatchmentById(id: number): Promise<Catchment | null> {
    if (await this.db.relationExists("api.mv_basin_catalog")) {
      const query = `
        SELECT
          catchment_id,
          name,
          dam_name,
          area_m2,
          geometry::text as geom
        FROM api.mv_basin_catalog
        WHERE catchment_id = $1
      `;
      return this.db.queryOne<Catchment>(query, [id]);
    }

    const query = `
      SELECT
        catchment_id,
        name,
        dam_name,
        area_m2,
        ST_AsGeoJSON(geom) as geom
      FROM public.catchments
      WHERE catchment_id = $1
    `;
    return this.db.queryOne<Catchment>(query, [id]);
  }

  // ================ TIMESERIES ================
  async getTimeseries(
    stationId?: number,
    propertyId?: number
  ): Promise<Timeseries[]> {
    let query = `
      SELECT
        ts.ts_id,
        ts.station_id,
        ts.property_id,
        ts.run_id,
        ts.source_type,
        ts.created_at,
        ts.time_step,

        s.name as station_name,

        p.name as property_name,
        p.unit as unit,
        p.standard_name as standard_name,
        p.description as description,

        mr.scenario_code,
        mr.scenario_name,
        mr.is_observed
      FROM public.timeseries ts
      LEFT JOIN public.stations s ON s.station_id = ts.station_id
      LEFT JOIN api.v_catalog_properties p ON p.property_id = ts.property_id
      LEFT JOIN public.model_runs mr ON mr.run_id = ts.run_id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (stationId) {
      query += ` AND ts.station_id = $${params.length + 1}`;
      params.push(stationId);
    }

    if (propertyId) {
      query += ` AND ts.property_id = $${params.length + 1}`;
      params.push(propertyId);
    }

    query += ` ORDER BY ts.created_at DESC`;
    return this.db.query<Timeseries>(query, params);
  }

  // ================ MEASUREMENTS ================
  async getMeasurements(
    tsId: number,
    filter: FilterOptions
  ): Promise<Measurement[]> {
    const { startDate, endDate, limit } = filter;

    let query = `
      SELECT
        ts_id,
        datetime,
        value,
        quality_flag
      FROM public.measurements
      WHERE ts_id = $1
    `;
    const params: any[] = [tsId];
    let i = 2;

    if (startDate) {
      query += ` AND datetime >= $${i++}`;
      params.push(startDate);
    }
    if (endDate) {
      query += ` AND datetime <= $${i++}`;
      params.push(endDate);
    }

    query += ` ORDER BY datetime ASC`;

    if (limit) {
      query += ` LIMIT $${i}`;
      params.push(limit);
    }

    return this.db.query<Measurement>(query, params);
  }

  async getAggregatedMeasurements(
    tsId: number,
    interval: "hour" | "day" | "month" | "year",
    startDate: string,
    endDate: string
  ): Promise<any[]> {
    const query = `
      SELECT
        date_trunc($2, datetime) as period,
        AVG(value) as avg_value,
        MIN(value) as min_value,
        MAX(value) as max_value,
        COUNT(*) as count
      FROM public.measurements
      WHERE ts_id = $1
        AND datetime >= $3
        AND datetime <= $4
      GROUP BY date_trunc($2, datetime)
      ORDER BY period ASC
    `;
    return this.db.query(query, [tsId, interval, startDate, endDate]);
  }

  // ================ RESERVOIRS (FIX) ================
  async getReservoirs(): Promise<Reservoir[]> {
    if (await this.db.relationExists("api.mv_barrage_catalog")) {
      const query = `
        SELECT
          reservoir_id,
          name,
          geometry::text as geom,
          created_at
        FROM api.mv_barrage_catalog
        ORDER BY name
      `;
      return this.db.query<Reservoir>(query, []);
    }
    // adapte le FROM si ton nom rÃ©el diffÃ¨re (ex: public.reservoirs, public.lakes, etc.)
    const query = `
      SELECT
        reservoir_id,
        name,
        ST_AsGeoJSON(geom) as geom,
        created_at
      FROM public.reservoirs
      ORDER BY name
    `;
    return this.db.query<Reservoir>(query, []);
  }

  // ================ MODEL RUNS ================
  async getModelRuns(isObserved?: boolean): Promise<ModelRun[]> {
    if (await this.db.relationExists("api.mv_scenario_catalog")) {
      let query = `
        SELECT run_id, scenario_code, scenario_name, description, is_observed, created_at
        FROM api.mv_scenario_catalog
        WHERE is_visible = true
      `;
      const params: any[] = [];

      if (typeof isObserved === "boolean") {
        query += ` AND is_observed = $${params.length + 1}`;
        params.push(isObserved);
        query += " ORDER BY run_id";
      } else {
        query += ` ORDER BY
          CASE WHEN is_observed THEN 0 ELSE 1 END,
          array_position($${params.length + 1}::text[], scenario_code),
          run_id`;
        params.push(HydroService.canonicalSwatScenarios);
      }

      return this.db.query<ModelRun>(query, params);
    }

    let query = `
      SELECT run_id, scenario_code, scenario_name, description, is_observed, created_at
      FROM public.model_runs
      WHERE 1=1
    `;
    const params: any[] = [];

    if (typeof isObserved === "boolean") {
      query += ` AND is_observed = $${params.length + 1}`;
      params.push(isObserved);
      query += " ORDER BY run_id";
    } else {
      query += `
        AND (
          is_observed = true
          OR EXISTS (
            SELECT 1
            FROM access.scenario_metadata sm
            WHERE sm.scenario_code = public.model_runs.scenario_code
          )
          OR scenario_code = ANY($${params.length + 1}::text[])
        )
      `;
      params.push(HydroService.canonicalSwatScenarios);
      query += `
        ORDER BY
          CASE WHEN is_observed THEN 0 ELSE 1 END,
          array_position($${params.length}::text[], scenario_code),
          run_id
      `;
    }
    return this.db.query<ModelRun>(query, params);
  }

  // ================ LANDCOVER (si tu l'utilises encore) ================
  async getLandcover(
    periodId?: number,
    catchmentId?: number
  ): Promise<Landcover[]> {
    // adapte selon ton schÃ©ma rÃ©el
    let query = `
      SELECT
        lc_id,
        lc_period_id,
        class_id,
        ST_AsGeoJSON(geom) as geom,
        area_m2,
        year,
        scenario_code,
        class_code,
        name_fr,
        color_hex
      FROM public.landcover
      WHERE 1=1
    `;
    const params: any[] = [];

    if (periodId) {
      query += ` AND lc_period_id = $${params.length + 1}`;
      params.push(periodId);
    }
    if (catchmentId) {
      query += ` AND catchment_id = $${params.length + 1}`;
      params.push(catchmentId);
    }

    query += ` ORDER BY lc_id`;
    return this.db.query<Landcover>(query, params);
  }

  // Placeholders si le controller les appelle (Ã©vite crash)
  async getLandcoverSummary(
    _catchmentId: number,
    _periodId?: number
  ): Promise<any[]> {
    return [];
  }

  async getFeaturesInBounds(_bounds: any): Promise<any> {
    return { stations: [], catchments: [], reservoirs: [], bounds: _bounds };
  }

  async getDashboardStats(): Promise<any> {
    return {
      totalStations: { count: "0" },
      totalCatchments: { count: "0" },
      totalMeasurements: { count: "0" },
      totalReservoirs: { count: "0" },
      latestMeasurement: { latest_date: null },
      activeStations: { count: "0" },
    };
  }

  // IMPORTANT: ton controller appelle aussi Ã§a
  async getTimeseriesCatalogByModule(
    stationId: number,
    runId: number,
    moduleCode: string
  ): Promise<any[]> {
    const query = `
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
        c.*
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
      ORDER BY COALESCE(mp.sort_order, 9999), c.property_id
    `;
    const rows = await this.db.query<any>(query, [stationId, runId, moduleCode]);
    return rows.filter((row) =>
      isStandardNameVisibleForModule(moduleCode, row.standard_name)
    );
  }



  async getStationsValuesByVariable(
    variable: string,
    scenario: string,
    date: string
  ) {
    // MOCK TEMPORAIRE
    return [
      { station_id: 1, value: 12.4, station_name: "Station A" },
      { station_id: 2, value: 45.8, station_name: "Station B" },
      { station_id: 3, value: 89.1, station_name: "Station C" },
    ];
  }



  async getTimeseriesStats(
    tsId: number,
    startDate: string,
    endDate: string
  ) {
    // On rÃ©utilise la mÃ©thode existante
    const measurements = await this.getMeasurements(tsId, {
      startDate,
      endDate,
      // on met une limite trÃ¨s grande (ou null si ton code supporte)
      limit: 1000000,
    });

    // IMPORTANT: adapte le champ value si diffÃ©rent (ex: m.value, m.val, m.measurement_value)
    const values = (measurements ?? [])
      .map((m: any) => Number(m.value))
      .filter((v: number) => Number.isFinite(v));

    const count = values.length;
    if (count === 0) {
      return { min: null, max: null, mean: null, count: 0 };
    }

    let min = values[0];
    let max = values[0];
    let sum = 0;

    for (const v of values) {
      if (v < min) min = v;
      if (v > max) max = v;
      sum += v;
    }

    return {
      min,
      max,
      mean: sum / count,
      count,
    };
  }

}

export const hydroService = new HydroService();


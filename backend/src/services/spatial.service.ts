// backend/src/services/spatial.service.ts
import { DatabaseService } from "./database.service";
import { uniqueBy } from "../utils/deduplicate";
import { TtlCache } from "../utils/ttlCache";
import { erosionSwatSeriesService } from "./erosionSwatSeries.service";
import { timeseriesService } from "./timeseries.service";
import {
  LEGACY_SWAT_SCENARIO_CODES,
  NORMALIZED_SWAT_SCENARIOS,
  NORMALIZED_SWAT_SCENARIO_SET,
} from "../constants/swatScenarios";
import {
  resolveSelectableAggregations,
  type NativeGranularity,
} from "../utils/aggregationAvailability";

type GeoJsonGeometry = {
  type: string;
  coordinates: unknown;
};

type SpatialRow = {
  id: number;
  name: string;
  geometry: GeoJsonGeometry;
  [key: string]: unknown;
};

type ReachTimeseriesRow = {
  year: number;
  flow_out_cms: number | null;
  flow_in_cms: number | null;
  sed_out_tons: number | null;
  sed_in_tons: number | null;
};

type AggregationKey = "day" | "month" | "year";

type SpatialAggregationAvailability = {
  daily: boolean;
  monthly: boolean;
  annual: boolean;
};

export type SpatialTimeseriesResponse = {
  entityType: "subbasin" | "reach" | "station";
  entityId: string;
  variable: string;
  unit: string;
  aggregation: "daily" | "monthly" | "annual";
  data: Array<{ date: string; value: number | null }>;
  availability: SpatialAggregationAvailability;
};

export type SpatialFeatureCollection<P extends Record<string, unknown> = Record<string, unknown>> = {
  type: "FeatureCollection";
  features: Array<{
    type: "Feature";
    geometry: GeoJsonGeometry;
    properties: P;
  }>;
};

export type HassanAddakhilProjectSpatialData = {
  stations: SpatialFeatureCollection;
  basins: SpatialFeatureCollection;
  subbasins: SpatialFeatureCollection;
  reaches: SpatialFeatureCollection;
  barrages: SpatialFeatureCollection;
};

export type SpatialScenarioAvailabilityItem = {
  code: string;
  label: string;
  available: boolean;
};

export type SpatialScenariosAvailabilityResponse = {
  entityType: "subbasin" | "reach" | "station";
  entityId: string;
  variable: string;
  availableScenarios: string[];
  scenarios: SpatialScenarioAvailabilityItem[];
};

export class SpatialService {
  private db = new DatabaseService();
  private timeseriesCache = new TtlCache<SpatialTimeseriesResponse | null>();
  private scenarioAvailabilityCache = new TtlCache<SpatialScenariosAvailabilityResponse | null>();
  private readonly timeseriesCacheTtlMs = 5 * 60 * 1000;

  private normalizeAggregation(value?: string): AggregationKey {
    const raw = String(value || "").toLowerCase();
    if (raw === "month" || raw === "monthly") return "month";
    if (raw === "year" || raw === "annual") return "year";
    return "day";
  }

  private toAggregationLabel(agg: AggregationKey): "daily" | "monthly" | "annual" {
    if (agg === "month") return "monthly";
    if (agg === "year") return "annual";
    return "daily";
  }

  private buildEmptyAvailability(): SpatialAggregationAvailability {
    return { daily: false, monthly: false, annual: false };
  }

  private aggregationAvailable(availability: SpatialAggregationAvailability, agg: AggregationKey): boolean {
    if (agg === "month") return availability.monthly;
    if (agg === "year") return availability.annual;
    return availability.daily;
  }

  private mapTimeStepAvailability(rows: Array<{ time_step?: string | null }>): SpatialAggregationAvailability {
    const native: NativeGranularity = { daily: false, monthly: false, annual: false };
    for (const row of rows) {
      const timeStep = String(row.time_step || "").toLowerCase();
      if (!timeStep) continue;
      if (timeStep.includes("daily") || timeStep.includes("day") || timeStep.includes("instant")) {
        native.daily = true;
      }
      if (timeStep.includes("month")) native.monthly = true;
      if (timeStep.includes("annual") || timeStep.includes("year")) native.annual = true;
    }
    return resolveSelectableAggregations(native);
  }

  private async resolveRunIdByScenarioCode(scenarioCode?: string, options?: { observed?: boolean }): Promise<number | null> {
    if (scenarioCode) {
      const row = await this.db.queryOne<{ run_id: number }>(
        `
        SELECT run_id
        FROM core.model_runs
        WHERE LOWER(scenario_code) = LOWER($1)
        ORDER BY run_id
        LIMIT 1
        `,
        [scenarioCode]
      );
      if (row?.run_id) return Number(row.run_id);
    }

    if (options?.observed) {
      const observed = await this.db.queryOne<{ run_id: number }>(
        `
        SELECT run_id
        FROM core.model_runs
        WHERE COALESCE(is_observed, false) = true
           OR UPPER(scenario_code) = 'OBSERVED'
        ORDER BY COALESCE(is_observed, false) DESC, run_id
        LIMIT 1
        `
      );
      if (observed?.run_id) return Number(observed.run_id);
    }

    const fallback = await this.db.queryOne<{ run_id: number }>(
      `
      SELECT run_id
      FROM core.model_runs
      ORDER BY run_id
      LIMIT 1
      `
    );
    return fallback?.run_id ? Number(fallback.run_id) : null;
  }

  private async resolveSubbasinStationId(subbasinId: number): Promise<number | null> {
    const row = await this.db.queryOne<{ station_id: number }>(
      `
      SELECT station_id
      FROM core.stations
      WHERE LOWER(station_code) = LOWER($1)
      LIMIT 1
      `,
      [`swat_sub_${subbasinId}`]
    );
    return row?.station_id ? Number(row.station_id) : null;
  }

  private normalizeScenarioCode(code: string): string {
    const raw = String(code || "").trim();
    const lower = raw.toLowerCase();
    if (LEGACY_SWAT_SCENARIO_CODES.has(raw) || lower === "swat_output" || lower === "swat_output_01") {
      return "etat_actuel";
    }
    if (NORMALIZED_SWAT_SCENARIO_SET.has(lower)) return lower;
    return lower;
  }

  private timeStepMatchesAggregation(
    timeStep: string | null | undefined,
    aggregation?: string
  ): boolean {
    if (!aggregation) return true;
    const agg = this.normalizeAggregation(aggregation);
    const step = String(timeStep || "").toLowerCase();
    if (agg === "day") return step.includes("daily") || step.includes("day");
    if (agg === "month") return step.includes("month");
    if (agg === "year") return step.includes("annual") || step.includes("year");
    return true;
  }

  private buildScenariosAvailabilityResponse(
    entityType: "subbasin" | "reach" | "station",
    entityId: number,
    variable: string,
    availableCodes: Set<string>
  ): SpatialScenariosAvailabilityResponse {
    const scenarios = NORMALIZED_SWAT_SCENARIOS.map((item) => ({
      code: item.scenario_code,
      label: item.scenario_name,
      available: availableCodes.has(item.scenario_code),
    }));

    return {
      entityType,
      entityId: String(entityId),
      variable,
      availableScenarios: scenarios.filter((item) => item.available).map((item) => item.code),
      scenarios,
    };
  }

  private async getReachSubCode(reachId: number): Promise<number | null> {
    const row = await this.db.queryOne<{ sub_code: number }>(
      `
      SELECT COALESCE(subbasin_id, reach_id, reach_code) AS sub_code
      FROM gis.reach_shapes
      WHERE reach_id = $1
      LIMIT 1
      `,
      [reachId]
    );
    return row?.sub_code != null ? Number(row.sub_code) : null;
  }

  private async getReachScenariosAvailability(
    reachId: number,
    variable: string
  ): Promise<SpatialScenariosAvailabilityResponse | null> {
    const subCode = await this.getReachSubCode(reachId);
    if (subCode == null) return null;

    const columnByVariable: Record<string, { accessColumn: string; standardName: string }> = {
      SED_OUT: { accessColumn: "sed_out_tons", standardName: "SWAT_SED_TONS" },
      SED_IN: { accessColumn: "sed_in_tons", standardName: "SWAT_SED_IN_TONS" },
      FLOW_OUT: { accessColumn: "flow_out_cms", standardName: "SWAT_FLOW_M3S" },
      FLOW_IN: { accessColumn: "flow_in_cms", standardName: "SWAT_FLOW_M3S" },
    };
    const selected = columnByVariable[variable] || columnByVariable.SED_OUT;
    const availableCodes = new Set<string>();

    if (await this.db.relationExists("access.rch_results")) {
      const accessRows = await this.db.query<{ scenario_code: string }>(
        `
        SELECT DISTINCT scenario_code
        FROM access.rch_results
        WHERE sub_code = $1
          AND ${selected.accessColumn} IS NOT NULL
        `,
        [subCode]
      );
      for (const row of accessRows) {
        availableCodes.add(this.normalizeScenarioCode(row.scenario_code));
      }
    }

    const coreRows = await this.db.query<{ scenario_code: string }>(
      `
      SELECT DISTINCT LOWER(mr.scenario_code) AS scenario_code
      FROM core.model_runs mr
      WHERE EXISTS (
        SELECT 1
        FROM core.measurements m
        JOIN core.timeseries t ON t.ts_id = m.ts_id
        JOIN core.stations st ON st.station_id = t.station_id
        JOIN ref.observed_properties op ON op.property_id = t.property_id
        WHERE t.run_id = mr.run_id
          AND st.station_code = $1
          AND op.standard_name = $2
        LIMIT 1
      )
      `,
      [`swat_rch_${subCode}`, selected.standardName]
    );
    for (const row of coreRows) {
      availableCodes.add(this.normalizeScenarioCode(row.scenario_code));
    }

    return this.buildScenariosAvailabilityResponse("reach", reachId, variable, availableCodes);
  }

  private async getSubbasinScenariosAvailability(
    subbasinId: number,
    variable: string,
    aggregation?: string
  ): Promise<SpatialScenariosAvailabilityResponse | null> {
    const subbasinStationId = await this.resolveSubbasinStationId(subbasinId);
    if (!subbasinStationId) return null;

    const standardName = variable === "SYLDT" || variable === "SYLDT_HA" ? "SWAT_SYLDT_HA" : variable;
    const availabilityRows = await erosionSwatSeriesService.getSubbasinAvailability(subbasinStationId);
    const availableCodes = new Set<string>();

    for (const row of availabilityRows) {
      if (String(row.standard_name || "").toUpperCase() !== standardName) continue;
      if (Number(row.points_count || 0) <= 0) continue;
      if (!this.timeStepMatchesAggregation(row.time_step, aggregation)) continue;
      availableCodes.add(this.normalizeScenarioCode(row.scenario_code));
    }

    return this.buildScenariosAvailabilityResponse(
      "subbasin",
      subbasinId,
      variable === "SYLDT_HA" ? "SYLDT" : variable,
      availableCodes
    );
  }

  private async getStationScenariosAvailability(
    stationId: number,
    variable: string,
    aggregation?: string
  ): Promise<SpatialScenariosAvailabilityResponse | null> {
    if (variable !== "debit_simulated") {
      return this.buildScenariosAvailabilityResponse("station", stationId, variable, new Set());
    }

    const availableCodes = new Set<string>();
    const coreRows = await this.db.query<{ scenario_code: string; time_step: string | null }>(
      `
      SELECT DISTINCT
        LOWER(mr.scenario_code) AS scenario_code,
        t.time_step
      FROM core.timeseries t
      JOIN core.model_runs mr ON mr.run_id = t.run_id
      JOIN ref.observed_properties op ON op.property_id = t.property_id
      WHERE t.station_id = $1
        AND t.source_type = 'simulated'
        AND op.standard_name = 'SWAT_FLOW_M3S'
        AND EXISTS (
          SELECT 1
          FROM core.measurements m
          WHERE m.ts_id = t.ts_id
          LIMIT 1
        )
      `,
      [stationId]
    );

    for (const row of coreRows) {
      if (!this.timeStepMatchesAggregation(row.time_step, aggregation)) continue;
      availableCodes.add(this.normalizeScenarioCode(row.scenario_code));
    }

    if (await this.db.relationExists("access.rch_results")) {
      const accessRows = await this.db.query<{ scenario_code: string }>(
        `
        SELECT DISTINCT r.scenario_code
        FROM access.rch_results r
        JOIN core.station_subbasin_map m
          ON m.subbasin_id = r.sub_code
         AND m.is_active = true
        WHERE m.station_id = $1
          AND r.flow_out_cms IS NOT NULL
        `,
        [stationId]
      );
      for (const row of accessRows) {
        availableCodes.add(this.normalizeScenarioCode(row.scenario_code));
      }
    }

    return this.buildScenariosAvailabilityResponse("station", stationId, variable, availableCodes);
  }

  async getScenariosAvailability(
    entityType: "subbasin" | "reach" | "station",
    entityId: number,
    args: {
      variable?: string;
      aggregation?: string;
      startDate?: string;
      endDate?: string;
    }
  ): Promise<SpatialScenariosAvailabilityResponse | null> {
    void args.startDate;
    void args.endDate;
    const cacheKey = `scenarios:${entityType}:${entityId}:${JSON.stringify(args)}`;
    return this.scenarioAvailabilityCache.getOrSet(cacheKey, this.timeseriesCacheTtlMs, async () => {
      if (entityType === "reach") {
        return this.getReachScenariosAvailability(
          entityId,
          String(args.variable || "SED_OUT").toUpperCase()
        );
      }
      if (entityType === "subbasin") {
        return this.getSubbasinScenariosAvailability(
          entityId,
          String(args.variable || "SYLDT").toUpperCase(),
          args.aggregation
        );
      }
      return this.getStationScenariosAvailability(
        entityId,
        String(args.variable || "debit_simulated").toLowerCase(),
        args.aggregation
      );
    });
  }

  private toSpatialResponse(args: {
    entityType: "subbasin" | "reach" | "station";
    entityId: string | number;
    variable: string;
    unit: string;
    aggregation: AggregationKey;
    data: Array<{ date: string; value: number | null }>;
    availability: SpatialAggregationAvailability;
  }): SpatialTimeseriesResponse {
    return {
      entityType: args.entityType,
      entityId: String(args.entityId),
      variable: args.variable,
      unit: args.unit,
      aggregation: this.toAggregationLabel(args.aggregation),
      data: args.data,
      availability: args.availability,
    };
  }

  async getBarrages() {
    if (await this.db.relationExists("api.mv_barrage_catalog")) {
      const rows = await this.db.query(
        `
        SELECT
          reservoir_id AS id,
          name,
          geometry AS geometry
        FROM api.mv_barrage_catalog
        WHERE geometry IS NOT NULL
        ORDER BY name
        `
      );
      return uniqueBy(rows, (row) => row.id);
    }

    const q = `
      SELECT
        reservoir_id AS id,
        name,
        ST_AsGeoJSON(geom)::json AS geometry
      FROM core.reservoirs
      WHERE geom IS NOT NULL
      ORDER BY name
    `;
    const rows = await this.db.query(q);
    return uniqueBy(rows, (row) => row.id);
  }

  toFeatureCollection<T extends SpatialRow>(
    rows: T[],
    extraProps: (r: T) => Record<string, unknown>
  ): SpatialFeatureCollection {
    return {
      type: "FeatureCollection",
      features: rows.map((r) => ({
        type: "Feature",
        geometry: r.geometry,
        properties: extraProps(r),
      })),
    };
  }

  private async getProjectCatchmentId(): Promise<number> {
    const rows = await this.db.query<{ catchment_id: number }>(
      `
      SELECT catchment_id
      FROM core.reservoirs
      WHERE UPPER(name) = 'HASSAN ADDAKHIL'
      ORDER BY reservoir_id
      LIMIT 1
      `
    );

    return rows[0]?.catchment_id ?? 1;
  }

  private async getProjectReservoirName(): Promise<string> {
    const rows = await this.db.query<{ name: string }>(
      `
      SELECT name
      FROM core.reservoirs
      WHERE UPPER(name) LIKE '%HASSAN ADDAKHIL%'
      ORDER BY reservoir_id
      LIMIT 1
      `
    );

    return rows[0]?.name ?? "HASSAN ADDAKHIL";
  }

  private async getProjectBasin(projectCatchmentId: number, projectStationIds: number[]) {
    const rows = await this.db.query<SpatialRow>(
      `
      SELECT
        $1::int AS id,
        'Bassin versant du barrage Hassan Addakhil' AS name,
        ST_AsGeoJSON(ST_Union(sb.geom))::json AS geometry,
        SUM(sb.area_m2) AS area_m2,
        SUM(sb.area_m2) / 1000000.0 AS area_km2,
        COUNT(*)::int AS subbasins_count,
        (
          SELECT COUNT(*)
          FROM core.stations s
          WHERE s.geom IS NOT NULL
            AND s.station_id = ANY($2::int[])
        )::int AS stations_count,
        (
          SELECT COUNT(*)
          FROM gis.reach_shapes r
          WHERE r.geom IS NOT NULL
            AND r.catchment_id = $1
        )::int AS reaches_count
      FROM gis.subbasin_shapes sb
      WHERE sb.geom IS NOT NULL
        AND sb.catchment_id = $1
      GROUP BY sb.catchment_id
      `,
      [projectCatchmentId, projectStationIds]
    );

    return rows;
  }

  async getProjectHassanAddakhil(): Promise<HassanAddakhilProjectSpatialData> {
    const projectCatchmentId = await this.getProjectCatchmentId();
    const projectReservoirName = await this.getProjectReservoirName();
    const projectStationIds = [2, 3, 24, 29, 35];

    const useMatViews = await Promise.all([
      this.db.relationExists("api.mv_basin_catalog"),
      this.db.relationExists("api.mv_subbasin_catalog"),
      this.db.relationExists("api.mv_reach_catalog"),
      this.db.relationExists("api.mv_station_catalog"),
      this.db.relationExists("api.mv_barrage_catalog"),
    ]).then((rows) => rows.every(Boolean));

    if (useMatViews) {
      const [basins, subbasins, reaches, stations, barrages] = await Promise.all([
        this.getProjectBasin(projectCatchmentId, projectStationIds),
        this.db.query<SpatialRow>(
          `
          SELECT
            subbasin_id AS id,
            catchment_id,
            subbasin_code,
            name,
            area_m2,
            geometry AS geometry,
            area_km2,
            perimeter_km,
            centroid_lat,
            centroid_lng
          FROM api.mv_subbasin_catalog
          WHERE geometry IS NOT NULL
            AND catchment_id = $1
          ORDER BY subbasin_id
          `,
          [projectCatchmentId]
        ),
        this.getReaches(undefined, projectCatchmentId),
        this.db.query<SpatialRow>(
          `
          SELECT
            s.station_id AS id,
            s.station_name AS name,
            s.station_code,
            s.type_station,
            s.station_type_code,
            s.catchment_id,
            s.geometry AS geometry
          FROM api.mv_station_catalog s
          WHERE s.geometry IS NOT NULL
            AND s.station_id = ANY($1::int[])
          ORDER BY s.station_id, CASE WHEN LOWER(s.station_code) LIKE 'meteo%' THEN 1 ELSE 0 END, s.station_name
          `,
          [projectStationIds]
        ),
        this.db.query<SpatialRow>(
          `
          SELECT
            reservoir_id AS id,
            name,
            geometry AS geometry
          FROM api.mv_barrage_catalog
          WHERE geometry IS NOT NULL
            AND UPPER(name) LIKE '%' || UPPER($1) || '%'
          ORDER BY name
          `,
          [projectReservoirName]
        ),
      ]);

      return {
        stations: this.toFeatureCollection(uniqueBy(stations, (r) => r.id), (r) => ({
          id: r.id,
          name: r.name,
          station_code: r.station_code,
          catchment_id: r.catchment_id,
          type_station: r.type_station,
          station_type_code: r.station_type_code,
        })),
        basins: this.toFeatureCollection(uniqueBy(basins, (r) => r.id), (r) => ({
          id: r.id,
          name: r.name,
          area_m2: r.area_m2,
          area_km2: r.area_km2,
          subbasins_count: r.subbasins_count,
          stations_count: r.stations_count,
          reaches_count: r.reaches_count,
        })),
        subbasins: this.toFeatureCollection(uniqueBy(subbasins, (r) => r.id), (r) => ({
          id: r.id,
          name: r.name,
          catchment_id: r.catchment_id,
          subbasin_code: r.subbasin_code,
          area_m2: r.area_m2,
          area_km2: r.area_km2,
          perimeter_km: r.perimeter_km,
          centroid_lat: r.centroid_lat,
          centroid_lng: r.centroid_lng,
        })),
        reaches: this.toFeatureCollection(uniqueBy(reaches, (r) => r.id), (r) => ({
          id: r.id,
          reach_code: r.reach_code,
          subbasin_id: r.subbasin_id,
          catchment_id: r.catchment_id,
          length_m: r.length_m,
          slope_pct: r.slope_pct,
          scenario_code: r.scenario_code,
          period_start: r.period_start,
          period_end: r.period_end,
          drainage_area_km2: r.drainage_area_km2,
          flow_out_cms: r.flow_out_cms,
          flow_in_cms: r.flow_in_cms,
          sed_out_tons: r.sed_out_tons,
          sed_in_tons: r.sed_in_tons,
        })),
        barrages: this.toFeatureCollection(uniqueBy(barrages, (r) => r.id), (r) => ({
          id: r.id,
          name: r.name,
        })),
      };
    }

    const [basins, subbasins, reaches, stations, barrages] = await Promise.all([
      this.getProjectBasin(projectCatchmentId, projectStationIds),
      this.db.query<SpatialRow>(
        `
        WITH project_basin AS (
          SELECT geom
          FROM public.catchments
          WHERE catchment_id = $1
          LIMIT 1
        )
        SELECT
          subbasin_id AS id,
          catchment_id,
          subbasin_code,
          name,
          area_m2,
          ST_AsGeoJSON(geom)::json AS geometry,
          (area_m2 / 1000000.0) AS area_km2,
          (ST_Perimeter(geom::geography) / 1000.0) AS perimeter_km,
          ST_Y(ST_Centroid(geom)) AS centroid_lat,
          ST_X(ST_Centroid(geom)) AS centroid_lng
        FROM gis.subbasin_shapes
        WHERE geom IS NOT NULL
          AND (
            catchment_id = $1
            OR ST_Intersects(geom, (SELECT geom FROM project_basin))
          )
        ORDER BY subbasin_id
        `,
        [projectCatchmentId]
      ),
      this.getReaches(undefined, projectCatchmentId),
      this.db.query<SpatialRow>(
        `
        SELECT
          s.station_id AS id,
          s.name,
          s.station_code,
          s.type_station,
          s.station_type_code,
          s.catchment_id,
          ST_AsGeoJSON(s.geom)::json AS geometry
        FROM public.stations s
        WHERE s.geom IS NOT NULL
          AND s.station_id = ANY($1::int[])
        ORDER BY s.station_id
        `,
        [projectStationIds]
      ),
      this.db.query<SpatialRow>(
        `
        SELECT
          reservoir_id AS id,
          name,
          ST_AsGeoJSON(geom)::json AS geometry
        FROM core.reservoirs
        WHERE geom IS NOT NULL
          AND UPPER(name) LIKE '%' || UPPER($1) || '%'
        ORDER BY name
        `,
        [projectReservoirName]
      ),
    ]);

    return {
      stations: this.toFeatureCollection(uniqueBy(stations, (r) => r.id), (r) => ({
        id: r.id,
        name: r.name,
        station_code: r.station_code,
        catchment_id: r.catchment_id,
        type_station: r.type_station,
        station_type_code: r.station_type_code,
      })),
      basins: this.toFeatureCollection(uniqueBy(basins, (r) => r.id), (r) => ({
        id: r.id,
        name: r.name,
        area_m2: r.area_m2,
        area_km2: r.area_km2,
        subbasins_count: r.subbasins_count,
        stations_count: r.stations_count,
        reaches_count: r.reaches_count,
      })),
      subbasins: this.toFeatureCollection(uniqueBy(subbasins, (r) => r.id), (r) => ({
        id: r.id,
        name: r.name,
        catchment_id: r.catchment_id,
        subbasin_code: r.subbasin_code,
        area_m2: r.area_m2,
        area_km2: r.area_km2,
        perimeter_km: r.perimeter_km,
        centroid_lat: r.centroid_lat,
        centroid_lng: r.centroid_lng,
      })),
      reaches: this.toFeatureCollection(uniqueBy(reaches, (r) => r.id), (r) => ({
        id: r.id,
        reach_code: r.reach_code,
        subbasin_id: r.subbasin_id,
        catchment_id: r.catchment_id,
        length_m: r.length_m,
        slope_pct: r.slope_pct,
        scenario_code: r.scenario_code,
        period_start: r.period_start,
        period_end: r.period_end,
        drainage_area_km2: r.drainage_area_km2,
        flow_out_cms: r.flow_out_cms,
        flow_in_cms: r.flow_in_cms,
        sed_out_tons: r.sed_out_tons,
        sed_in_tons: r.sed_in_tons,
      })),
      barrages: this.toFeatureCollection(uniqueBy(barrages, (r) => r.id), (r) => ({
        id: r.id,
        name: r.name,
      })),
    };
  }

  async getBasins(catchmentId?: number) {
    const params: any[] = [];
    let q = `
      SELECT
        c.catchment_id AS id,
        COALESCE(NULLIF(c.name, ''), 'Bassin ' || c.catchment_id::text) AS name,
        ST_AsGeoJSON(c.geom)::json AS geometry,
        COALESCE(c.area_m2, ST_Area(c.geom::geography)) AS area_m2,
        COALESCE(c.area_m2, ST_Area(c.geom::geography)) / 1000000.0 AS area_km2,
        COALESCE(sb.subbasins_count, 0)::int AS subbasins_count,
        COALESCE(st.stations_count, 0)::int AS stations_count,
        COALESCE(rch.reaches_count, 0)::int AS reaches_count
      FROM core.catchments c
      LEFT JOIN (
        SELECT catchment_id, COUNT(*) AS subbasins_count
        FROM gis.subbasin_shapes
        WHERE geom IS NOT NULL
        GROUP BY catchment_id
      ) sb ON sb.catchment_id = c.catchment_id
      LEFT JOIN (
        SELECT catchment_id, COUNT(*) AS stations_count
        FROM core.stations
        WHERE geom IS NOT NULL
        GROUP BY catchment_id
      ) st ON st.catchment_id = c.catchment_id
      LEFT JOIN (
        SELECT catchment_id, COUNT(*) AS reaches_count
        FROM gis.reach_shapes
        WHERE geom IS NOT NULL
        GROUP BY catchment_id
      ) rch ON rch.catchment_id = c.catchment_id
      WHERE c.geom IS NOT NULL
    `;

    if (catchmentId != null) {
      params.push(catchmentId);
      q += ` AND c.catchment_id = $${params.length}`;
    }

    q += `
      ORDER BY name
    `;

    const rows = await this.db.query(q, params);
    return uniqueBy(rows, (row) => row.id);
  }

  async getSubBasins(catchmentId?: number, barrageId?: number) {
    if (!barrageId && await this.db.relationExists("api.mv_subbasin_catalog")) {
      const params: any[] = [];
      let q = `
        SELECT
          subbasin_id AS id,
          catchment_id,
          subbasin_code,
          name,
          area_m2,
          geometry AS geometry,
          area_km2,
          perimeter_km,
          centroid_lat,
          centroid_lng
        FROM api.mv_subbasin_catalog
        WHERE geometry IS NOT NULL
      `;

      if (catchmentId) {
        params.push(catchmentId);
        q += ` AND catchment_id = $${params.length}`;
      }

      q += ` ORDER BY subbasin_id`;
      const rows = await this.db.query(q, params);
      return uniqueBy(rows, (row) => row.id);
    }

    let q = `
      SELECT
        subbasin_id AS id,
        catchment_id,
        subbasin_code,
        name,
        area_m2,
        ST_AsGeoJSON(geom)::json AS geometry,
        (area_m2 / 1000000.0) AS area_km2,
        (ST_Perimeter(geom::geography) / 1000.0) AS perimeter_km,
        ST_Y(ST_Centroid(geom)) AS centroid_lat,
        ST_X(ST_Centroid(geom)) AS centroid_lng
      FROM gis.subbasin_shapes
      WHERE geom IS NOT NULL
    `;

    const params: any[] = [];
    if (catchmentId) {
      params.push(catchmentId);
      q += ` AND catchment_id = $${params.length}`;
    }
    if (barrageId) {
      params.push(barrageId);
      q += `
        AND EXISTS (
          SELECT 1
          FROM core.reservoirs r
          WHERE r.reservoir_id = $${params.length}
            AND r.geom IS NOT NULL
            AND (
              ST_Intersects(gis.subbasin_shapes.geom, r.geom)
              OR ST_DWithin(gis.subbasin_shapes.geom::geography, r.geom::geography, 10000)
            )
        )
      `;
    }
    q += ` ORDER BY subbasin_id`;
    const rows = await this.db.query(q, params);
    return uniqueBy(rows, (row) => row.id);
  }

  async getReaches(subbasinId?: number, catchmentId?: number) {
    let q = `
      WITH rch_summary AS (
        SELECT
          sub_code,
          scenario_code,
          MIN(year) AS period_start,
          MAX(year) AS period_end,
          AVG(area_km2) AS drainage_area_km2,
          AVG(flow_out_cms) AS flow_out_cms,
          AVG(flow_in_cms) AS flow_in_cms,
          AVG(sed_out_tons) AS sed_out_tons,
          AVG(sed_in_tons) AS sed_in_tons
        FROM access.rch_results
        WHERE scenario_code = 'etat_actuel'
        GROUP BY sub_code, scenario_code
      )
      SELECT
        r.reach_id AS id,
        r.reach_code,
        r.subbasin_id,
        r.catchment_id,
        r.length_m,
        r.slope_pct,
        COALESCE(rs.scenario_code, 'etat_actuel') AS scenario_code,
        rs.period_start,
        rs.period_end,
        COALESCE(rs.drainage_area_km2, sb.area_m2 / 1000000.0) AS drainage_area_km2,
        rs.flow_out_cms,
        rs.flow_in_cms,
        rs.sed_out_tons,
        rs.sed_in_tons,
        ST_AsGeoJSON(r.geom)::json AS geometry
      FROM gis.reach_shapes r
      LEFT JOIN gis.subbasin_shapes sb
        ON sb.subbasin_id = r.subbasin_id
      LEFT JOIN rch_summary rs
        ON rs.sub_code = COALESCE(r.subbasin_id, r.reach_id, r.reach_code)
      WHERE r.geom IS NOT NULL
    `;
    const params: any[] = [];

    if (catchmentId) {
      params.push(catchmentId);
      q += ` AND r.catchment_id = $${params.length}`;
    }
    if (subbasinId) {
      params.push(subbasinId);
      q += ` AND r.subbasin_id = $${params.length}`;
    }

    q += ` ORDER BY r.reach_id`;
    const rows = await this.db.query(q, params);
    return uniqueBy(rows, (row) => row.id);
  }

  async getReachTimeseries(
    reachId: number,
    scenarioCode = "etat_actuel",
    options: { interval?: string; startDate?: string; endDate?: string } = {}
  ) {
    const reachRows = await this.db.query<{
      reach_id: number;
      reach_code: number | null;
      subbasin_id: number | null;
      catchment_id: number;
      sub_code: number;
    }>(
      `
      SELECT
        reach_id,
        reach_code,
        subbasin_id,
        catchment_id,
        COALESCE(subbasin_id, reach_id, reach_code) AS sub_code
      FROM gis.reach_shapes
      WHERE reach_id = $1
      LIMIT 1
      `,
      [reachId]
    );

    const reach = reachRows[0];
    if (!reach) {
      return null;
    }

    const interval =
      options.interval === "day" || options.interval === "month" || options.interval === "year"
        ? options.interval
        : "year";
    const params: any[] = [reach.sub_code, scenarioCode, interval];
    const where = ["sub_code = $1", "scenario_code = $2"];

    const runRow = await this.db.queryOne<{ run_id: number }>(
      `
      SELECT run_id
      FROM core.model_runs
      WHERE LOWER(scenario_code) = LOWER($1)
      ORDER BY run_id
      LIMIT 1
      `,
      [scenarioCode]
    );

    if (options.startDate) {
      params.push(options.startDate);
      where.push(`period_date >= $${params.length}::date`);
    }
    if (options.endDate) {
      params.push(options.endDate);
      where.push(`period_date <= $${params.length}::date`);
    }

    if (runRow?.run_id) {
      const coreParams: any[] = [
        runRow.run_id,
        `swat_rch_${reach.sub_code}`,
        interval,
      ];
      const coreWhere: string[] = [
        "t.run_id = $1",
        "st.station_code = $2",
        "t.source_type = 'simulated'",
        "t.time_step = 'daily'",
        "op.standard_name IN ('SWAT_FLOW_M3S', 'SWAT_SED_TONS')",
      ];

      if (options.startDate) {
        coreParams.push(options.startDate);
        coreWhere.push(`m.datetime::date >= $${coreParams.length}::date`);
      }
      if (options.endDate) {
        coreParams.push(options.endDate);
        coreWhere.push(`m.datetime::date <= $${coreParams.length}::date`);
      }

      const coreSeries = await this.db.query<ReachTimeseriesRow & { period: string; n: number }>(
        `
        SELECT
          date_trunc($3, m.datetime::timestamp)::date::text AS period,
          EXTRACT(YEAR FROM MIN(m.datetime))::int AS year,
          AVG(CASE WHEN op.standard_name = 'SWAT_FLOW_M3S' THEN m.value END)::double precision AS flow_out_cms,
          NULL::double precision AS flow_in_cms,
          AVG(CASE WHEN op.standard_name = 'SWAT_SED_TONS' THEN m.value END)::double precision AS sed_out_tons,
          NULL::double precision AS sed_in_tons,
          COUNT(*) FILTER (WHERE op.standard_name = 'SWAT_SED_TONS')::int AS n
        FROM core.measurements m
        JOIN core.timeseries t
          ON t.ts_id = m.ts_id
        JOIN core.stations st
          ON st.station_id = t.station_id
        JOIN ref.observed_properties op
          ON op.property_id = t.property_id
        WHERE ${coreWhere.join(" AND ")}
        GROUP BY period
        ORDER BY period
        `,
        coreParams
      );

      if (coreSeries.length > 0) {
        return {
          reachId: reach.reach_id,
          reachCode: reach.reach_code,
          subbasinId: reach.subbasin_id,
          catchmentId: reach.catchment_id,
          subCode: reach.sub_code,
          scenarioCode,
          periodStart: coreSeries[0]?.year ?? null,
          periodEnd: coreSeries[coreSeries.length - 1]?.year ?? null,
          series: coreSeries,
        };
      }
    }

    const series = await this.db.query<ReachTimeseriesRow & { period: string; n: number }>(
      `
      SELECT
        date_trunc($3, period_date::timestamp)::date::text AS period,
        MIN(year)::int AS year,
        AVG(flow_out_cms) AS flow_out_cms,
        AVG(flow_in_cms) AS flow_in_cms,
        AVG(sed_out_tons) AS sed_out_tons,
        AVG(sed_in_tons) AS sed_in_tons,
        COUNT(*)::int AS n
      FROM access.rch_results
      WHERE ${where.join(" AND ")}
      GROUP BY period
      ORDER BY period
      `,
      params
    );

    return {
      reachId: reach.reach_id,
      reachCode: reach.reach_code,
      subbasinId: reach.subbasin_id,
      catchmentId: reach.catchment_id,
      subCode: reach.sub_code,
      scenarioCode,
      periodStart: series[0]?.year ?? null,
      periodEnd: series[series.length - 1]?.year ?? null,
      series,
    };
  }

  async getSubbasinTimeseries(
    subbasinId: number,
    args: {
      variable?: string;
      scenario?: string;
      aggregation?: string;
      startDate?: string;
      endDate?: string;
    }
  ): Promise<SpatialTimeseriesResponse | null> {
    const cacheKey = `subbasin:${subbasinId}:${JSON.stringify(args)}`;
    return this.timeseriesCache.getOrSet(cacheKey, this.timeseriesCacheTtlMs, async () => {
    const subbasinStationId = await this.resolveSubbasinStationId(subbasinId);
    if (!subbasinStationId) return null;

    const variable = String(args.variable || "SYLDT").toUpperCase();
    const requestedAggregation = this.normalizeAggregation(args.aggregation);
    const runId = await this.resolveRunIdByScenarioCode(args.scenario || "etat_actuel");
    if (!runId) return null;

    const availabilityRows = await erosionSwatSeriesService.getSubbasinAvailability(subbasinStationId);
    const selectedRows = availabilityRows.filter(
      (row) =>
        Number(row.run_id) === runId &&
        String(row.standard_name || "").toUpperCase() === "SWAT_SYLDT_HA"
    );
    const availability = this.mapTimeStepAvailability(selectedRows);

    if (variable !== "SYLDT" && variable !== "SYLDT_HA") {
      return this.toSpatialResponse({
        entityType: "subbasin",
        entityId: subbasinId,
        variable,
        unit: "t/ha",
        aggregation: requestedAggregation,
        data: [],
        availability,
      });
    }

    if (!this.aggregationAvailable(availability, requestedAggregation)) {
      return this.toSpatialResponse({
        entityType: "subbasin",
        entityId: subbasinId,
        variable: "SYLDT",
        unit: selectedRows[0]?.unit || "t/ha",
        aggregation: requestedAggregation,
        data: [],
        availability,
      });
    }

    const rows = await erosionSwatSeriesService.getSubbasinSeries(requestedAggregation, {
      subbasinStationId,
      runId,
      startDate: args.startDate,
      endDate: args.endDate,
    });

    return this.toSpatialResponse({
      entityType: "subbasin",
      entityId: subbasinId,
      variable: "SYLDT",
      unit: selectedRows[0]?.unit || "t/ha",
      aggregation: requestedAggregation,
      data: rows.map((row) => ({ date: row.date, value: row.value })),
      availability,
    });
    });
  }

  async getReachVariableTimeseries(
    reachId: number,
    args: {
      variable?: string;
      scenario?: string;
      aggregation?: string;
      startDate?: string;
      endDate?: string;
    }
  ): Promise<SpatialTimeseriesResponse | null> {
    const cacheKey = `reach:${reachId}:${JSON.stringify(args)}`;
    return this.timeseriesCache.getOrSet(cacheKey, this.timeseriesCacheTtlMs, async () => {
    const requestedAggregation = this.normalizeAggregation(args.aggregation);
    const scenarioCode = String(args.scenario || "etat_actuel");
    const response = await this.getReachTimeseries(reachId, scenarioCode, {
      interval: requestedAggregation,
      startDate: args.startDate,
      endDate: args.endDate,
    });
    if (!response) return null;

    const variable = String(args.variable || "SED_OUT").toUpperCase();
    const mapping: Record<string, { key: keyof ReachTimeseriesRow; unit: string; label: string }> = {
      SED_OUT: { key: "sed_out_tons", unit: "tons", label: "Sediment (t)" },
      SED_IN: { key: "sed_in_tons", unit: "tons", label: "SED_IN" },
      FLOW_OUT: { key: "flow_out_cms", unit: "m3/s", label: "Débits m³/s" },
      FLOW_IN: { key: "flow_in_cms", unit: "m3/s", label: "FLOW_IN" },
    };
    const selected = mapping[variable] || mapping.SED_OUT;
    const data = response.series.map((row) => ({
      date: row.period,
      value:
        row[selected.key] !== null && row[selected.key] !== undefined
          ? Number(row[selected.key])
          : null,
    }));
    const hasValues = data.some((row) => row.value !== null && Number.isFinite(row.value));
    const availability = resolveSelectableAggregations({
      daily: hasValues,
      monthly: false,
      annual: false,
    });

    if (!this.aggregationAvailable(availability, requestedAggregation)) {
      return this.toSpatialResponse({
        entityType: "reach",
        entityId: reachId,
        variable: selected.label,
        unit: selected.unit,
        aggregation: requestedAggregation,
        data: [],
        availability,
      });
    }

    return this.toSpatialResponse({
      entityType: "reach",
      entityId: reachId,
      variable: selected.label,
      unit: selected.unit,
      aggregation: requestedAggregation,
      data,
      availability,
    });
    });
  }

  private pickCatalogItemByVariable(
    catalog: Array<{ property_id: number; standard_name: string | null; property_name: string; unit: string | null }>,
    variable: string,
    moduleCode: "hydro" | "climat"
  ) {
    const normalizedVariable = variable.toLowerCase();

    const byMatchers: Record<string, (item: { standard_name: string | null; property_name: string }) => boolean> = {
      debit_observed: (item) => String(item.standard_name || "").toUpperCase() === "STREAMFLOW",
      debit_simulated: (item) => String(item.standard_name || "").toUpperCase() === "SWAT_FLOW_M3S",
      precipitation: (item) => {
        const standard = String(item.standard_name || "").toLowerCase();
        const name = String(item.property_name || "").toLowerCase();
        return (
          standard.includes("precip") ||
          standard.includes("rain") ||
          name.includes("precip") ||
          name.includes("pluie")
        );
      },
      temperature_min: (item) => {
        const standard = String(item.standard_name || "").toLowerCase();
        const name = String(item.property_name || "").toLowerCase();
        return (
          standard.includes("temp") &&
          (standard.includes("min") || name.includes("min"))
        );
      },
      temperature_max: (item) => {
        const standard = String(item.standard_name || "").toLowerCase();
        const name = String(item.property_name || "").toLowerCase();
        return (
          standard.includes("temp") &&
          (standard.includes("max") || name.includes("max"))
        );
      },
      temperature_mean: (item) => {
        const standard = String(item.standard_name || "").toLowerCase();
        const name = String(item.property_name || "").toLowerCase();
        return (
          standard.includes("temp") &&
          (standard.includes("mean") || standard.includes("avg") || name.includes("moy") || name.includes("mean"))
        );
      },
    };

    const matcher = byMatchers[normalizedVariable];
    if (!matcher) return null;
    const item = catalog.find(matcher) || null;

    if (!item && moduleCode === "hydro" && normalizedVariable === "debit_observed") {
      return catalog.find((row) => String(row.standard_name || "").toUpperCase() === "STREAMFLOW") || null;
    }
    return item;
  }

  async getStationTimeseries(
    stationId: number,
    args: {
      variable?: string;
      scenario?: string;
      aggregation?: string;
      startDate?: string;
      endDate?: string;
    }
  ): Promise<SpatialTimeseriesResponse | null> {
    const cacheKey = `station:${stationId}:${JSON.stringify(args)}`;
    return this.timeseriesCache.getOrSet(cacheKey, this.timeseriesCacheTtlMs, async () => {
    const requestedAggregation = this.normalizeAggregation(args.aggregation);
    const variable = String(args.variable || "debit_observed").toLowerCase();
    const observed = variable === "debit_observed";
    const runId = await this.resolveRunIdByScenarioCode(args.scenario, { observed });
    if (!runId) return null;

    const catalog = await timeseriesService.getCatalog({
      stationId,
      runId,
      moduleCode: "hydro",
    });
    const selected = this.pickCatalogItemByVariable(catalog, variable, "hydro");
    if (!selected) {
      return this.toSpatialResponse({
        entityType: "station",
        entityId: stationId,
        variable,
        unit: variable === "debit_observed" || variable === "debit_simulated" ? "m3/s" : "-",
        aggregation: requestedAggregation,
        data: [],
        availability: this.buildEmptyAvailability(),
      });
    }

    const availability = await timeseriesService.getAggregationAvailability({
      stationId,
      runId,
      propertyId: selected.property_id,
      moduleCode: "hydro",
      startDate: args.startDate,
      endDate: args.endDate,
    });

    if (!this.aggregationAvailable(availability, requestedAggregation)) {
      return this.toSpatialResponse({
        entityType: "station",
        entityId: stationId,
        variable,
        unit: selected.unit || "m3/s",
        aggregation: requestedAggregation,
        data: [],
        availability,
      });
    }

    const bundle = await timeseriesService.getBundle(
      { stationId, runId, moduleCode: "hydro" },
      requestedAggregation,
      args.startDate,
      args.endDate
    );
    const tsItem = bundle.catalog.find((item) => Number(item.property_id) === selected.property_id);
    const points = tsItem ? bundle.aggregated[String(tsItem.ts_id)] || [] : [];

    return this.toSpatialResponse({
      entityType: "station",
      entityId: stationId,
      variable,
      unit: selected.unit || "m3/s",
      aggregation: requestedAggregation,
      data: points.map((point) => ({ date: point.period, value: point.avg_value })),
      availability,
    });
    });
  }

  async getStationClimateTimeseries(
    stationId: number,
    args: {
      variable?: string;
      scenario?: string;
      aggregation?: string;
      startDate?: string;
      endDate?: string;
    }
  ): Promise<SpatialTimeseriesResponse | null> {
    const cacheKey = `station-climate:${stationId}:${JSON.stringify(args)}`;
    return this.timeseriesCache.getOrSet(cacheKey, this.timeseriesCacheTtlMs, async () => {
    const requestedAggregation = this.normalizeAggregation(args.aggregation);
    const variable = String(args.variable || "precipitation").toLowerCase();
    const runId = await this.resolveRunIdByScenarioCode(args.scenario, { observed: true });
    if (!runId) return null;

    const catalog = await timeseriesService.getCatalog({
      stationId,
      runId,
      moduleCode: "climat",
    });
    const selected = this.pickCatalogItemByVariable(catalog, variable, "climat");
    if (!selected) {
      return this.toSpatialResponse({
        entityType: "station",
        entityId: stationId,
        variable,
        unit: "-",
        aggregation: requestedAggregation,
        data: [],
        availability: this.buildEmptyAvailability(),
      });
    }

    const availability = await timeseriesService.getAggregationAvailability({
      stationId,
      runId,
      propertyId: selected.property_id,
      moduleCode: "climat",
      startDate: args.startDate,
      endDate: args.endDate,
    });

    if (!this.aggregationAvailable(availability, requestedAggregation)) {
      return this.toSpatialResponse({
        entityType: "station",
        entityId: stationId,
        variable,
        unit: selected.unit || "-",
        aggregation: requestedAggregation,
        data: [],
        availability,
      });
    }

    const bundle = await timeseriesService.getBundle(
      { stationId, runId, moduleCode: "climat" },
      requestedAggregation,
      args.startDate,
      args.endDate
    );
    const tsItem = bundle.catalog.find((item) => Number(item.property_id) === selected.property_id);
    const points = tsItem ? bundle.aggregated[String(tsItem.ts_id)] || [] : [];

    return this.toSpatialResponse({
      entityType: "station",
      entityId: stationId,
      variable,
      unit: selected.unit || "-",
      aggregation: requestedAggregation,
      data: points.map((point) => ({ date: point.period, value: point.avg_value })),
      availability,
    });
    });
  }

  async getStations(catchmentId?: number) {
    if (await this.db.relationExists("api.mv_station_catalog")) {
      const params: any[] = [];
      let q = `
        SELECT
          station_id AS id,
          station_name AS name,
          station_code,
          type_station,
          station_type_code,
          catchment_id,
          geometry AS geometry
        FROM api.mv_station_catalog
        WHERE geometry IS NOT NULL
      `;

      if (catchmentId) {
        params.push(catchmentId);
        q += ` AND catchment_id = $${params.length}`;
      }

      q += ` ORDER BY station_id, CASE WHEN LOWER(station_code) LIKE 'meteo%' THEN 1 ELSE 0 END, station_name`;
      const rows = await this.db.query(q, params);
      return uniqueBy(rows, (row) => row.id);
    }

    const params: any[] = [];
    let q = `
      SELECT
        s.station_id AS id,
        s.name,
        s.station_code,
        s.type_station,
        s.station_type_code,
        s.catchment_id,
        ST_AsGeoJSON(s.geom)::json AS geometry
      FROM (
        SELECT station_id, station_code, name, type_station, station_type_code, catchment_id, geom
        FROM core.stations
        UNION ALL
        SELECT station_id, station_code, name, type_station, station_type_code, catchment_id, geom
        FROM gis.meteo_stations
      ) s
      WHERE s.geom IS NOT NULL
    `;

    if (catchmentId) {
      q += `
        AND EXISTS (
          SELECT 1
          FROM public.catchments c
          WHERE c.catchment_id = $1
          AND c.geom IS NOT NULL
          AND ST_Intersects(c.geom, s.geom)
        )
      `;
      params.push(catchmentId);
    }

    q += ` ORDER BY s.station_id, CASE WHEN LOWER(s.station_code) LIKE 'meteo%' THEN 1 ELSE 0 END, s.name`;
    const rows = await this.db.query(q, params);
    return uniqueBy(rows, (row) => row.id);
  }
}

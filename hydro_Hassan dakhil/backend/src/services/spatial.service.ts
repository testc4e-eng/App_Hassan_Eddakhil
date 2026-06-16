// backend/src/services/spatial.service.ts
import { DatabaseService } from "./database.service";
import { uniqueBy } from "../utils/deduplicate";

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

export class SpatialService {
  private db = new DatabaseService();

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
        this.db.query<SpatialRow>(
          `
          SELECT
            catchment_id AS id,
            name,
            geometry AS geometry
          FROM api.mv_basin_catalog
          WHERE geometry IS NOT NULL
            AND catchment_id = $1
          ORDER BY name
          `,
          [projectCatchmentId]
        ),
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
        this.db.query<SpatialRow>(
          `
          SELECT
            reach_id AS id,
            reach_code,
            subbasin_id,
            catchment_id,
            length_m,
            slope_pct,
            geometry AS geometry
          FROM api.mv_reach_catalog
          WHERE geometry IS NOT NULL
            AND catchment_id = $1
          ORDER BY reach_id
          `,
          [projectCatchmentId]
        ),
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
        })),
        barrages: this.toFeatureCollection(uniqueBy(barrages, (r) => r.id), (r) => ({
          id: r.id,
          name: r.name,
        })),
      };
    }

    const [basins, subbasins, reaches, stations, barrages] = await Promise.all([
      this.db.query<SpatialRow>(
        `
        SELECT
          catchment_id AS id,
          name,
          ST_AsGeoJSON(geom)::json AS geometry
        FROM public.catchments
        WHERE catchment_id = $1
          AND geom IS NOT NULL
        ORDER BY name
        `,
        [projectCatchmentId]
      ),
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
      this.db.query<SpatialRow>(
        `
        WITH project_basin AS (
          SELECT geom
          FROM public.catchments
          WHERE catchment_id = $1
          LIMIT 1
        )
        SELECT
          r.reach_id AS id,
          r.reach_code,
          r.subbasin_id,
          r.catchment_id,
          r.length_m,
          r.slope_pct,
          ST_AsGeoJSON(r.geom)::json AS geometry
        FROM gis.reach_shapes r
        WHERE r.geom IS NOT NULL
          AND (
            r.catchment_id = $1
            OR ST_Intersects(r.geom, (SELECT geom FROM project_basin))
          )
        ORDER BY r.reach_id
        `,
        [projectCatchmentId]
      ),
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
      })),
      barrages: this.toFeatureCollection(uniqueBy(barrages, (r) => r.id), (r) => ({
        id: r.id,
        name: r.name,
      })),
    };
  }

  async getBasins() {
    if (await this.db.relationExists("api.mv_basin_catalog")) {
      const rows = await this.db.query(
        `
        SELECT
          catchment_id AS id,
          name,
          geometry AS geometry
        FROM api.mv_basin_catalog
        WHERE geometry IS NOT NULL
        ORDER BY name
        `
      );
      return uniqueBy(rows, (row) => row.id);
    }

    const q = `
      SELECT
        catchment_id AS id,
        name,
        ST_AsGeoJSON(geom)::json AS geometry
      FROM public.catchments
      WHERE geom IS NOT NULL
      ORDER BY name
    `;
    const rows = await this.db.query(q);
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
    if (await this.db.relationExists("api.mv_reach_catalog")) {
      const params: any[] = [];
      let q = `
        SELECT
          reach_id AS id,
          reach_code,
          subbasin_id,
          catchment_id,
          length_m,
          slope_pct,
          geometry AS geometry
        FROM api.mv_reach_catalog
        WHERE geometry IS NOT NULL
      `;

      if (catchmentId) {
        params.push(catchmentId);
        q += ` AND catchment_id = $${params.length}`;
      }
      if (subbasinId) {
        params.push(subbasinId);
        q += ` AND subbasin_id = $${params.length}`;
      }

      q += ` ORDER BY reach_id`;
      const rows = await this.db.query(q, params);
      return uniqueBy(rows, (row) => row.id);
    }

    let q = `
      SELECT
        reach_id AS id,
        reach_code,
        subbasin_id,
        catchment_id,
        length_m,
        slope_pct,
        ST_AsGeoJSON(geom)::json AS geometry
      FROM gis.reach_shapes
      WHERE geom IS NOT NULL
    `;
    const params: any[] = [];

    if (catchmentId) {
      params.push(catchmentId);
      q += ` AND catchment_id = $${params.length}`;
    }
    if (subbasinId) {
      params.push(subbasinId);
      q += ` AND subbasin_id = $${params.length}`;
    }

    q += ` ORDER BY reach_id`;
    const rows = await this.db.query(q, params);
    return uniqueBy(rows, (row) => row.id);
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

// backend/src/services/thematicSubbasin.service.ts
import { DatabaseService } from "./database.service";

export type ThematicSubbasinFeature = {
  type: "Feature";
  geometry: {
    type: string;
    coordinates: unknown;
  };
  properties: {
    id: number;
    catchment_id: number | null;
    name: string | null;
    value: number | null;
    unit: string;
    scenario_code: string;
    start_year: number | null;
    end_year: number | null;
    aggregation: string;
  };
};

export type ThematicSubbasinResponse = {
  type: "FeatureCollection";
  features: ThematicSubbasinFeature[];
  meta: {
    scenario_code: string;
    variable: string;
    aggregation: string;
    start_year: number | null;
    end_year: number | null;
    min_value: number | null;
    max_value: number | null;
    unit: string;
    count: number;
  };
};

export class ThematicSubbasinService {
  private db = new DatabaseService();

  private parseYear(value: unknown): number | null {
    if (value === undefined || value === null) return null;
    const n = Number(value);
    if (Number.isNaN(n)) return null;
    return n;
  }

  async getVulnerabilityBySubbasin(params: {
    scenarioCode?: string;
    startYear?: number;
    endYear?: number;
    aggregation?: string;
  }): Promise<ThematicSubbasinResponse> {
    const scenarioCode = params.scenarioCode || "etat_actuel";
    const startYear = this.parseYear(params.startYear);
    const endYear = this.parseYear(params.endYear);
    const aggregation = (params.aggregation || "avg").toLowerCase();

    const sqlParams: (string | number)[] = [scenarioCode];
    let dateFilter = "";
    if (startYear != null) {
      sqlParams.push(`${startYear}-01-01`);
      dateFilter += ` AND period_date >= $${sqlParams.length}`;
    }
    if (endYear != null) {
      sqlParams.push(`${endYear}-12-31`);
      dateFilter += ` AND period_date <= $${sqlParams.length}`;
    }

    const aggFn = aggregation === "sum" ? "SUM" : "AVG";

    const rows = await this.db.query<{
      id: number;
      catchment_id: number | null;
      name: string | null;
      geometry: Record<string, unknown>;
      value: number | null;
    }>(`
      WITH annual AS (
        SELECT
          sub_code,
          EXTRACT(YEAR FROM period_date) AS year,
          SUM(syld_t_ha) AS yearly_sum
        FROM access.sub_results
        WHERE LOWER(scenario_code) = LOWER($1)
          AND syld_t_ha IS NOT NULL
          ${dateFilter}
        GROUP BY sub_code, EXTRACT(YEAR FROM period_date)
      ),
      aggregated AS (
        SELECT
          sub_code,
          ${aggFn}(yearly_sum) AS value
        FROM annual
        GROUP BY sub_code
      )
      SELECT
        sb.subbasin_id AS id,
        sb.catchment_id,
        sb.subbasin_name AS name,
        ST_AsGeoJSON(sb.geom)::json AS geometry,
        agg.value
      FROM gis.subbasin_shapes sb
      LEFT JOIN aggregated agg ON agg.sub_code = sb.subbasin_id
      WHERE sb.geom IS NOT NULL
      ORDER BY sb.subbasin_id
    `, sqlParams);

    const features: ThematicSubbasinFeature[] = rows.map((row) => ({
      type: "Feature",
      geometry: row.geometry as { type: string; coordinates: unknown },
      properties: {
        id: row.id,
        catchment_id: row.catchment_id,
        name: row.name,
        value: row.value,
        unit: "t/ha/an",
        scenario_code: scenarioCode,
        start_year: startYear,
        end_year: endYear,
        aggregation,
      },
    }));

    const values = features
      .map((f) => f.properties.value)
      .filter((v): v is number => v !== null && !Number.isNaN(v));

    return {
      type: "FeatureCollection",
      features,
      meta: {
        scenario_code: scenarioCode,
        variable: "syld_t_ha",
        aggregation,
        start_year: startYear,
        end_year: endYear,
        min_value: values.length > 0 ? Math.min(...values) : null,
        max_value: values.length > 0 ? Math.max(...values) : null,
        unit: "t/ha/an",
        count: features.length,
      },
    };
  }
}

export const thematicSubbasinService = new ThematicSubbasinService();

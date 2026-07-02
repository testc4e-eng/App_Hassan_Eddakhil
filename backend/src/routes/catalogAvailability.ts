// backend/src/routes/catalogAvailability.ts
import { Router, Request, Response } from "express";
import Database from "../config/database.config";
import { isStandardNameVisibleForModule } from "../constants/moduleVariables";
import { filterHassanAddakhilStations, HASSAN_ADDAKHIL_STATION_IDS } from "../constants/projectStations";
import { erosionSwatSeriesService } from "../services/erosionSwatSeries.service";
import { hydroSwatSeriesService } from "../services/hydroSwatSeries.service";

const router = Router();
const EROSION_VISIBLE_SCENARIO_CODES = new Set([
  "OBSERVED",
  "etat_actuel",
  "scenario_1",
  "scenario_2",
  "scenario_3",
  "scenario_4",
]);

function normalizeModule(moduleCode: string): "climat" | "hydro" | "erosion" | "" {
  const m = String(moduleCode || "").trim().toLowerCase();
  if (m === "climat" || m === "climate") return "climat";
  if (m === "hydro" || m === "hydrology") return "hydro";
  if (m === "erosion" || m === "sediment" || m === "sediments") return "erosion";
  return "";
}

/**
 * GET /api/v1/catalog/availability?module=climat&stationId=3&sourceType=observed&scenarioCode=OBSERVED&propertyId=1
 *
 * Base: api.v_catalog_series_modules (contient module_code)
 * Stats: api.v_timeseries_with_stats_ui (contient dt_min/dt_max/n_measures/v_min/v_max)
 *
 * Objectif: permettre au frontend de filtrer intelligemment:
 * station -> source_type -> scenario -> variables -> période -> agrégation (time_step)
 *
 * + support time_step='instantaneous'
 */
router.get("/catalog/availability", async (req: Request, res: Response) => {
  try {
    const moduleCode = normalizeModule(String(req.query.module || ""));
    const stationId = req.query.stationId ? Number(req.query.stationId) : null;
    const sourceType = req.query.sourceType
      ? String(req.query.sourceType)
      : null;
    const scenarioCode = req.query.scenarioCode
      ? String(req.query.scenarioCode)
      : null;
    const propertyId = req.query.propertyId
      ? Number(req.query.propertyId)
      : null;

    if (moduleCode === "hydro") {
      const pool = Database.getPool();

      const observedQuery = `
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
        JOIN public.module_properties mp
          ON mp.property_id = c.property_id
         AND mp.module_code = 'hydro'
         AND mp.is_enabled = true
        WHERE c.source_type = 'observed'
          AND c.station_id = ANY($1::int[])
      `;

      const projectStationIds = [...HASSAN_ADDAKHIL_STATION_IDS];

      const [observedResult, simulatedRows] = await Promise.all([
        pool.query(observedQuery, [projectStationIds]),
        hydroSwatSeriesService.getAvailability({
          stationId: stationId ?? undefined,
          scenarioCode:
            scenarioCode && scenarioCode !== "OBSERVED"
              ? scenarioCode
              : undefined,
          propertyId: propertyId ?? undefined,
        }),
      ]);

      const merged = [...observedResult.rows, ...simulatedRows];
      const unique = new Map<string, any>();

      for (const row of merged) {
        const key = `${row.source_type || "unknown"}:${row.ts_id}`;
        if (!unique.has(key)) {
          unique.set(key, row);
        }
      }

      const filtered = Array.from(unique.values()).filter((row) => {
        if (!isStandardNameVisibleForModule(moduleCode, row.standard_name)) return false;
        if (stationId && Number(row.station_id) !== stationId) return false;
        if (propertyId && Number(row.property_id) !== propertyId) return false;
        if (sourceType && row.source_type !== sourceType) return false;
        if (scenarioCode) {
          if (scenarioCode === "OBSERVED") {
            return String(row.source_type) === "observed";
          }
          if (row.scenario_code !== scenarioCode) return false;
        }
        return true;
      });

      return res.json({
        success: true,
        data: filterHassanAddakhilStations(filtered),
        count: filterHassanAddakhilStations(filtered).length,
      });
    }

    if (moduleCode === "erosion") {
      const pool = Database.getPool();

      const observedQuery = `
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
        JOIN public.module_properties mp
          ON mp.property_id = c.property_id
         AND mp.module_code = 'erosion'
         AND mp.is_enabled = true
        WHERE c.source_type = 'observed'
          AND c.station_id = ANY($1::int[])
      `;

      const projectStationIds = [...HASSAN_ADDAKHIL_STATION_IDS];

      const [observedResult, simulatedRows] = await Promise.all([
        pool.query(observedQuery, [projectStationIds]),
        erosionSwatSeriesService.getAvailability({
          stationId: stationId ?? undefined,
          scenarioCode:
            scenarioCode && scenarioCode !== "OBSERVED"
              ? scenarioCode
              : undefined,
          propertyId: propertyId ?? undefined,
        }),
      ]);

      const merged = [...observedResult.rows, ...simulatedRows];
      const unique = new Map<string, any>();

      for (const row of merged) {
        const key = `${row.source_type || "unknown"}:${row.ts_id}`;
        if (!unique.has(key)) {
          unique.set(key, row);
        }
      }

      const filtered = Array.from(unique.values()).filter((row) => {
        if (!isStandardNameVisibleForModule(moduleCode, row.standard_name)) return false;
        if (stationId && Number(row.station_id) !== stationId) return false;
        if (propertyId && Number(row.property_id) !== propertyId) return false;
        if (sourceType && row.source_type !== sourceType) return false;
        if (scenarioCode) {
          if (scenarioCode === "OBSERVED") {
            return String(row.source_type) === "observed";
          }
          if (row.scenario_code !== scenarioCode) return false;
        }
        return true;
      });

      return res.json({
        success: true,
        data: filterHassanAddakhilStations(filtered),
        count: filterHassanAddakhilStations(filtered).length,
      });
    }

    const where: string[] = [];
    const params: any[] = [];

    if (moduleCode) {
      params.push(moduleCode);
      where.push(`
        (
          EXISTS (
            SELECT 1
            FROM public.module_properties mp
            WHERE mp.property_id = c.property_id
              AND mp.module_code = $${params.length}
              AND mp.is_enabled = true
          )
          OR (
            c.source_type = 'simulated'
            AND (
              ($${params.length} = 'hydro' AND c.standard_name = 'SWAT_FLOW_M3S')
              OR ($${params.length} = 'erosion' AND c.standard_name IN ('SWAT_SED_TONS', 'SWAT_SYLDT_HA'))
            )
          )
        )
      `);
    }
    if (stationId) {
      params.push(stationId);
      where.push(`c.station_id = $${params.length}`);
    }
    if (sourceType) {
      params.push(sourceType);
      where.push(`c.source_type = $${params.length}`);
    }
    if (scenarioCode) {
      params.push(scenarioCode);
      where.push(`c.scenario_code = $${params.length}`);
    }
    if (propertyId) {
      params.push(propertyId);
      where.push(`c.property_id = $${params.length}`);
    }

    params.push([...HASSAN_ADDAKHIL_STATION_IDS]);
    where.push(`c.station_id = ANY($${params.length}::int[])`);

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
        CASE
          WHEN c.source_type = 'simulated' AND c.standard_name = 'SWAT_FLOW_M3S' THEN 'hydro'
          WHEN c.source_type = 'simulated' AND c.standard_name IN ('SWAT_SED_TONS', 'SWAT_SYLDT_HA') THEN 'erosion'
          ELSE (
            SELECT mp.module_code
            FROM public.module_properties mp
            WHERE mp.property_id = c.property_id
              AND mp.is_enabled = true
            ORDER BY mp.sort_order
            LIMIT 1
          )
        END AS module_code,

        c.station_id,
        c.station_code,
        c.station_name,
        COALESCE(
          c.station_code || ' - ' || c.station_name,
          c.station_name,
          c.station_id::text
        ) AS station_label,

        c.property_id,
        c.property_name,
        c.unit,

        c.run_id,
        c.scenario_code,
        c.scenario_name,

        c.source_type,
        c.time_step,

        COALESCE(c.n_points, 0)::bigint AS n_measures,
        c.start_date AS dt_min,
        c.end_date AS dt_max,
        NULL::double precision AS v_min,
        NULL::double precision AS v_max,
        c.ts_created_at AS created_at,
        CASE
          WHEN c.start_date IS NULL OR c.end_date IS NULL THEN NULL
          ELSE (c.end_date::date - c.start_date::date)
        END::integer AS period_days
      FROM station_catalog c
      ${where.length ? "WHERE " + where.join(" AND ") : ""}
      ORDER BY c.station_id, c.source_type, c.scenario_code, c.property_id
    `;

    const pool = Database.getPool();
    const { rows } = await pool.query(sql, params);
    const data = filterHassanAddakhilStations(
      rows.filter((row) =>
        isStandardNameVisibleForModule(moduleCode, row.standard_name)
      )
    );

    res.json({ success: true, data, count: data.length });
  } catch (e: any) {
    res.status(500).json({ success: false, error: e?.message || String(e) });
  }
});

export default router;

import { Request, Response, Router } from "express";
import Database from "../config/database.config";
import { isStandardNameVisibleForModule } from "../constants/moduleVariables";
import {
  filterHassanAddakhilStations,
  HASSAN_ADDAKHIL_STATION_IDS,
} from "../constants/projectStations";
import { erosionSwatSeriesService } from "../services/erosionSwatSeries.service";
import { hydroSwatSeriesService } from "../services/hydroSwatSeries.service";

const router = Router();

function parseOptionalIntParam(value: unknown, name: string): number | null {
  if (value == null || value === "") return null;
  const parsed = Number(value);
  if (!Number.isInteger(parsed)) {
    throw new Error(`INVALID_INT:${name}`);
  }
  return parsed;
}

function normalizeModule(
  moduleCode: string
): "climat" | "hydro" | "erosion" | "" {
  const normalized = String(moduleCode || "").trim().toLowerCase();
  if (normalized === "climat" || normalized === "climate") return "climat";
  if (normalized === "hydro" || normalized === "hydrology") return "hydro";
  if (
    normalized === "erosion" ||
    normalized === "sediment" ||
    normalized === "sediments"
  ) {
    return "erosion";
  }
  return "";
}

async function fetchProjectCatalogAvailability(args: {
  moduleCode: "climat" | "hydro" | "erosion";
  stationId?: number | null;
  sourceType?: string | null;
  scenarioCode?: string | null;
  propertyId?: number | null;
  onlyObserved?: boolean;
}) {
  const pool = Database.getPool();
  const params: Array<string | number | number[] | null> = [
    args.moduleCode,
    [...HASSAN_ADDAKHIL_STATION_IDS],
    args.stationId ?? null,
    args.sourceType ?? null,
    args.scenarioCode ?? null,
    args.propertyId ?? null,
  ];

  const observedOnlyClause = args.onlyObserved
    ? `AND c.source_type = 'observed'`
    : "";

  const sql = `
    WITH candidate AS (
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
        c.ts_created_at
      FROM public.v_ts_catalog c
      JOIN public.module_properties mp
        ON mp.property_id = c.property_id
       AND mp.module_code = $1
       AND mp.is_enabled = true
      WHERE c.station_id = ANY($2::int[])
        AND ($3::int IS NULL OR c.station_id = $3)
        AND ($4::text IS NULL OR c.source_type = $4)
        AND ($5::text IS NULL OR c.scenario_code = $5)
        AND ($6::int IS NULL OR c.property_id = $6)
        ${observedOnlyClause}
    ),
    stats AS (
      SELECT
        m.ts_id,
        COUNT(*)::bigint AS n_points,
        MIN(m.datetime)::date::text AS start_date,
        MAX(m.datetime)::date::text AS end_date
      FROM core.measurements m
      JOIN candidate c
        ON c.ts_id = m.ts_id
      GROUP BY m.ts_id
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
      COALESCE(s.n_points, 0)::bigint AS n_points,
      s.start_date,
      s.end_date
    FROM candidate c
    LEFT JOIN stats s
      ON s.ts_id = c.ts_id
    ORDER BY c.station_id, c.source_type, c.scenario_code, c.property_id
  `;

  const { rows } = await pool.query(sql, params);
  return rows;
}

function deduplicateRows(rows: any[]) {
  const unique = new Map<string, any>();
  for (const row of rows) {
    const key = `${row.source_type || "unknown"}:${row.ts_id}`;
    if (!unique.has(key)) {
      unique.set(key, row);
    }
  }
  return Array.from(unique.values());
}

function filterRows(
  rows: any[],
  args: {
    moduleCode: "climat" | "hydro" | "erosion";
    stationId?: number | null;
    sourceType?: string | null;
    scenarioCode?: string | null;
    propertyId?: number | null;
  }
) {
  return rows.filter((row) => {
    if (
      !isStandardNameVisibleForModule(args.moduleCode, row.standard_name)
    ) {
      return false;
    }
    if (args.stationId && Number(row.station_id) !== args.stationId) {
      return false;
    }
    if (args.propertyId && Number(row.property_id) !== args.propertyId) {
      return false;
    }
    if (args.sourceType && row.source_type !== args.sourceType) {
      return false;
    }
    if (args.scenarioCode) {
      if (args.scenarioCode === "OBSERVED") {
        return String(row.source_type) === "observed";
      }
      if (String(row.scenario_code) !== args.scenarioCode) {
        return false;
      }
    }
    return true;
  });
}

router.get("/catalog/availability", async (req: Request, res: Response) => {
  try {
    const moduleCode = normalizeModule(String(req.query.module || ""));
    const stationId = parseOptionalIntParam(req.query.stationId, "stationId");
    const sourceType = req.query.sourceType
      ? String(req.query.sourceType)
      : null;
    const scenarioCode = req.query.scenarioCode
      ? String(req.query.scenarioCode)
      : null;
    const propertyId = parseOptionalIntParam(req.query.propertyId, "propertyId");

    if (!moduleCode) {
      return res.status(400).json({
        success: false,
        error: "module est requis et doit être climat, hydro ou erosion",
      });
    }

    if (moduleCode === "hydro") {
      const observedPromise =
        sourceType === "simulated"
          ? Promise.resolve([])
          : fetchProjectCatalogAvailability({
              moduleCode: "hydro",
              stationId,
              propertyId,
              onlyObserved: true,
            });

      const simulatedPromise =
        sourceType === "observed" || scenarioCode === "OBSERVED"
          ? Promise.resolve([])
          : hydroSwatSeriesService.getAvailability({
              stationId: stationId ?? undefined,
              scenarioCode:
                scenarioCode && scenarioCode !== "OBSERVED"
                  ? scenarioCode
                  : undefined,
              propertyId: propertyId ?? undefined,
            });

      const [observedRows, simulatedRows] = await Promise.all([
        observedPromise,
        simulatedPromise,
      ]);

      const data = filterHassanAddakhilStations(
        filterRows(deduplicateRows([...observedRows, ...simulatedRows]), {
          moduleCode,
          stationId,
          sourceType,
          scenarioCode,
          propertyId,
        })
      );

      return res.json({ success: true, data, count: data.length });
    }

    if (moduleCode === "erosion") {
      const observedPromise =
        sourceType === "simulated"
          ? Promise.resolve([])
          : fetchProjectCatalogAvailability({
              moduleCode: "erosion",
              stationId,
              propertyId,
              onlyObserved: true,
            });

      const simulatedPromise =
        sourceType === "observed" || scenarioCode === "OBSERVED"
          ? Promise.resolve([])
          : erosionSwatSeriesService.getAvailability({
              stationId: stationId ?? undefined,
              scenarioCode:
                scenarioCode && scenarioCode !== "OBSERVED"
                  ? scenarioCode
                  : undefined,
              propertyId: propertyId ?? undefined,
            });

      const [observedRows, simulatedRows] = await Promise.all([
        observedPromise,
        simulatedPromise,
      ]);

      const data = filterHassanAddakhilStations(
        filterRows(deduplicateRows([...observedRows, ...simulatedRows]), {
          moduleCode,
          stationId,
          sourceType,
          scenarioCode,
          propertyId,
        })
      );

      return res.json({ success: true, data, count: data.length });
    }

    const rows = await fetchProjectCatalogAvailability({
      moduleCode,
      stationId,
      sourceType,
      scenarioCode,
      propertyId,
    });

    const data = filterHassanAddakhilStations(
      filterRows(rows, {
        moduleCode,
        stationId,
        sourceType,
        scenarioCode,
        propertyId,
      })
    );

    return res.json({ success: true, data, count: data.length });
  } catch (error: any) {
    if (typeof error?.message === "string" && error.message.startsWith("INVALID_INT:")) {
      const field = error.message.split(":")[1] || "parameter";
      return res.status(400).json({
        success: false,
        error: `${field} doit etre un entier valide`,
      });
    }
    return res.status(500).json({
      success: false,
      error: "Erreur interne du serveur",
    });
  }
});

export default router;

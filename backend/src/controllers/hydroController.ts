// backend/src/controllers/hydroController.ts
import { Request, Response, NextFunction } from "express";
import { hydroService } from "../services/hydro.service";
import { AdaptiveHydroService } from "../services/adaptive.service";
import { SpatialService } from "../services/spatial.service";
import { FilterOptions } from "../types/hydro.types";

const adaptiveService = new AdaptiveHydroService();
const spatialService = new SpatialService();

/**
 * ✅ Helpers Query (Express + qs)
 * Express peut retourner string | string[] | ParsedQs...
 * Ici on force un string propre.
 */
function qString(v: unknown, fallback = ""): string {
  if (v === undefined || v === null) return fallback;
  if (Array.isArray(v)) return v.length ? String(v[0]) : fallback;
  return String(v);
}

function qStringOpt(v: unknown): string | undefined {
  const s = qString(v, "").trim();
  return s ? s : undefined;
}

function qInt(v: unknown): number | undefined {
  const s = qStringOpt(v);
  if (!s) return undefined;
  const n = parseInt(s, 10);
  return Number.isFinite(n) ? n : undefined;
}

function qFloat(v: unknown): number | undefined {
  const s = qStringOpt(v);
  if (!s) return undefined;
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : undefined;
}

function qBool(v: unknown): boolean | undefined {
  const s = qStringOpt(v);
  if (s === undefined) return undefined;
  if (s === "true") return true;
  if (s === "false") return false;
  return undefined;
}

function qJson<T = any>(v: unknown): T | undefined {
  const s = qStringOpt(v);
  if (!s) return undefined;
  try {
    return JSON.parse(s) as T;
  } catch {
    return undefined;
  }
}

export class HydroController {
  // ================ HEALTH CHECK ADAPTATIF ================
  async healthCheck(req: Request, res: Response, next: NextFunction) {
    try {
      const health = await adaptiveService.checkDatabaseHealth();
      res.json({
        success: true,
        timestamp: new Date().toISOString(),
        service: "Hydro API",
        version: "1.0.0",
        database: health.connected ? "connected" : "disconnected",
        tables: health.tables,
        uptime: process.uptime(),
        ...(health.connected && { structures: health.structures }),
      });
    } catch (error) {
      next(error);
    }
  }

  // ================ STATIONS ADAPTATIVES ================
  async getStations(req: Request, res: Response, next: NextFunction) {
    try {
      const q = req.query as Record<string, unknown>;

      const filter: FilterOptions = {
        stationIds: qJson(q["stationIds"]),
        limit: qInt(q["limit"]),
      };

      const spatialRows = await spatialService.getStations();
      const stations = spatialRows
        .map((row: any) => ({
          station_id: Number(row.id ?? row.station_id),
          name: String(row.name ?? ""),
          station_code: row.station_code ?? row.code ?? null,
          type: row.type_station ?? row.station_type_code ?? row.type ?? "station",
          type_station: row.type_station ?? null,
          station_type_code: row.station_type_code ?? null,
          catchment_id: row.catchment_id ?? null,
          geom: row.geometry ?? row.geom ?? null,
        }))
        .filter((station) => Number.isFinite(station.station_id));

      const filtered =
        filter.stationIds?.length
          ? stations.filter((s) => filter.stationIds?.includes(Number(s.station_id)))
          : stations;

      const limited = filter.limit ? filtered.slice(0, filter.limit) : filtered;

      res.json({ success: true, data: limited, count: limited.length });
    } catch (error) {
      next(error);
    }
  }

  // ================ TIMESERIES CATALOG (station + run + module) ================
  async getTimeseriesCatalog(req: Request, res: Response, next: NextFunction) {
    try {
      const q = req.query as Record<string, unknown>;

      const stationId = qInt(q["stationId"]);
      const runId = qInt(q["runId"]);
      const moduleCode = qString(q["moduleCode"]).trim(); // ✅ string garanti

      if (!stationId || !runId || !moduleCode) {
        return res.status(400).json({
          success: false,
          error: "stationId, runId, moduleCode sont requis",
        });
      }

      const result = await hydroService.getTimeseriesCatalogByModule(
        stationId,
        runId,
        moduleCode
      );

      res.json({ success: true, stationId, runId, moduleCode, data: result });
    } catch (error) {
      next(error);
    }
  }

  // ================ GET STATION BY ID ================
  async getStationById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(String(req.params.id), 10);

      const stations = await spatialService.getStations();
      const station = stations.find((s: any) => Number(s.id ?? s.station_id) === id);

      if (!station) {
        return res
          .status(404)
          .json({ success: false, error: "Station not found" });
      }

      res.json({
        success: true,
        data: {
          station_id: Number(station.id ?? station.station_id),
          name: String(station.name ?? ""),
          station_code: station.station_code ?? station.code ?? null,
          type: station.type_station ?? station.station_type_code ?? station.type ?? "station",
          type_station: station.type_station ?? null,
          station_type_code: station.station_type_code ?? null,
          catchment_id: station.catchment_id ?? null,
          geom: station.geometry ?? station.geom ?? null,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // ================ CATCHMENTS ================
  async getCatchments(req: Request, res: Response, next: NextFunction) {
    try {
      const q = req.query as Record<string, unknown>;

      const filter: FilterOptions = {
        catchmentIds: qJson(q["catchmentIds"]),
      };

      const catchments = await hydroService.getCatchments(filter);
      res.json({ success: true, data: catchments, count: catchments.length });
    } catch (error) {
      next(error);
    }
  }

  async getCatchmentById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(String(req.params.id), 10);
      const catchment = await hydroService.getCatchmentById(id);

      if (!catchment) {
        return res
          .status(404)
          .json({ success: false, error: "Catchment not found" });
      }

      res.json({ success: true, data: catchment });
    } catch (error) {
      next(error);
    }
  }

  // ================ TIMESERIES ================
  async getTimeseries(req: Request, res: Response, next: NextFunction) {
    try {
      const q = req.query as Record<string, unknown>;

      const stationId = qInt(q["stationId"]);
      const propertyId = qInt(q["propertyId"]);

      const timeseries = await adaptiveService.getTimeseriesAdaptive(
        stationId,
        propertyId
      );

      res.json({ success: true, data: timeseries, count: timeseries.length });
    } catch (error) {
      next(error);
    }
  }

  // ================ MEASUREMENTS ================
  async getMeasurements(req: Request, res: Response, next: NextFunction) {
    try {
      const q = req.query as Record<string, unknown>;
      const tsId = parseInt(String(req.params.tsId), 10);

      const filter: FilterOptions = {
        startDate: qStringOpt(q["startDate"]),
        endDate: qStringOpt(q["endDate"]),
        limit: qInt(q["limit"]) ?? 1000,
      };

      const measurements = await hydroService.getMeasurements(tsId, filter);

      res.json({
        success: true,
        data: measurements,
        count: measurements.length,
        tsId,
      });
    } catch (error) {
      next(error);
    }
  }

  async getAggregatedMeasurements(req: Request, res: Response, next: NextFunction) {
    try {
      const q = req.query as Record<string, unknown>;
      const tsId = parseInt(String(req.params.tsId), 10);

      const interval = qString(q["interval"]).trim(); // ✅ string garanti
      const startDate = qString(q["startDate"]).trim(); // ✅ string garanti
      const endDate = qString(q["endDate"]).trim(); // ✅ string garanti

      if (!interval || !startDate || !endDate) {
        return res.status(400).json({
          success: false,
          error: "interval, startDate, and endDate are required",
        });
      }

      const data = await hydroService.getAggregatedMeasurements(
        tsId,
        interval as any,
        startDate,
        endDate
      );

      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  // ================ LANDCOVER ================
  async getLandcover(req: Request, res: Response, next: NextFunction) {
    try {
      const q = req.query as Record<string, unknown>;
      const periodId = qInt(q["periodId"]);
      const catchmentId = qInt(q["catchmentId"]);

      const landcover = await hydroService.getLandcover(periodId, catchmentId);
      res.json({ success: true, data: landcover, count: landcover.length });
    } catch (error) {
      next(error);
    }
  }

  async getLandcoverSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const q = req.query as Record<string, unknown>;
      const catchmentId = parseInt(String(req.params.catchmentId), 10);
      const periodId = qInt(q["periodId"]);

      const summary = await hydroService.getLandcoverSummary(
        catchmentId,
        periodId
      );
      res.json({ success: true, data: summary });
    } catch (error) {
      next(error);
    }
  }

  // ================ RESERVOIRS ================
  async getReservoirs(req: Request, res: Response, next: NextFunction) {
    try {
      const reservoirs = await hydroService.getReservoirs();
      res.json({ success: true, data: reservoirs, count: reservoirs.length });
    } catch (error) {
      next(error);
    }
  }

  async getBathymetry(req: Request, res: Response, next: NextFunction) {
    try {
      const q = req.query as Record<string, unknown>;
      const reservoirId = qInt(q["reservoirId"]);

      const bathymetry = await hydroService.getBathymetry(reservoirId);
      res.json({ success: true, data: bathymetry, count: bathymetry.length });
    } catch (error) {
      next(error);
    }
  }

  // ================ MODEL RUNS ================
  async getModelRuns(req: Request, res: Response, next: NextFunction) {
    try {
      const q = req.query as Record<string, unknown>;
      const isObserved = qBool(q["isObserved"]);

      const modelRuns = await hydroService.getModelRuns(isObserved);
      res.json({ success: true, data: modelRuns, count: modelRuns.length });
    } catch (error) {
      next(error);
    }
  }

  // ================ SPATIAL ================
  async getFeaturesInBounds(req: Request, res: Response, next: NextFunction) {
    try {
      const q = req.query as Record<string, unknown>;

      const minLng = qFloat(q["minLng"]);
      const minLat = qFloat(q["minLat"]);
      const maxLng = qFloat(q["maxLng"]);
      const maxLat = qFloat(q["maxLat"]);

      if (
        minLng === undefined ||
        minLat === undefined ||
        maxLng === undefined ||
        maxLat === undefined
      ) {
        return res
          .status(400)
          .json({ success: false, error: "Bounds parameters are required" });
      }

      const bounds = { minLng, minLat, maxLng, maxLat };
      const features = await hydroService.getFeaturesInBounds(bounds);

      res.json({ success: true, data: features });
    } catch (error) {
      next(error);
    }
  }

  // ================ DASHBOARD ================
  async getDashboardStats(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await hydroService.getDashboardStats();
      res.json({ success: true, data: stats });
    } catch (error) {
      next(error);
    }
  }

  // ================ TIMESERIES STATS (min/max/mean) ================
  async getTimeseriesStats(req: Request, res: Response, next: NextFunction) {
    try {
      const q = req.query as Record<string, unknown>;
      const tsId = Number(req.params.tsId);

      const startDate = qString(q["startDate"], "1900-01-01"); // ✅ string garanti
      const endDate = qString(q["endDate"], "2025-12-31"); // ✅ string garanti

      if (!Number.isFinite(tsId)) {
        return res.status(400).json({ success: false, error: "Invalid tsId" });
      }

      const stats = await hydroService.getTimeseriesStats(tsId, startDate, endDate);

      return res.json({ success: true, tsId, startDate, endDate, ...stats });
    } catch (error) {
      next(error);
    }
  }

  // ================ HEALTH CHECK SIMPLE ================
  async healthCheckSimple(req: Request, res: Response, next: NextFunction) {
    try {
      res.json({
        success: true,
        timestamp: new Date().toISOString(),
        service: "Hydro API",
        version: "1.0.0",
        database: "connected",
        uptime: process.uptime(),
        message: "API is running",
      });
    } catch (error) {
      next(error);
    }
  }

  // ================ STATIONS SIMPLE ================
  async getStationsSimple(req: Request, res: Response, next: NextFunction) {
    try {
      const q = req.query as Record<string, unknown>;
      const limit = qInt(q["limit"]) ?? 50;

      const stations = await adaptiveService.getStationsAdaptive({ limit });
      res.json({ success: true, data: stations, count: stations.length });
    } catch (error) {
      next(error);
    }
  }
}

export const hydroController = new HydroController();

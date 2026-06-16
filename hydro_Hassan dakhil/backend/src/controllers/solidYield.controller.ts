import { NextFunction, Request, Response } from "express";
import { solidYieldService } from "../services/solidYield.service";
import { SolidYieldInterval } from "../types/solidYield.types";
import { TtlCache } from "../utils/ttlCache";

function qString(v: unknown, fallback = ""): string {
  if (v === undefined || v === null) return fallback;
  if (Array.isArray(v)) return v.length ? String(v[0]) : fallback;
  return String(v);
}

function qInt(v: unknown): number | undefined {
  const s = qString(v).trim();
  if (!s) return undefined;
  const n = Number.parseInt(s, 10);
  return Number.isFinite(n) ? n : undefined;
}

function qInterval(v: unknown): SolidYieldInterval {
  const s = qString(v, "day").toLowerCase();
  if (s === "month") return "month";
  if (s === "year") return "year";
  return "day";
}

export class SolidYieldController {
  private cache = new TtlCache<any>();
  private readonly cacheTtlMs = 5 * 60 * 1000;

  private cacheKey(name: string, payload?: unknown): string {
    return payload === undefined ? name : `${name}:${JSON.stringify(payload)}`;
  }

  async subbasins(_req: Request, res: Response, next: NextFunction) {
    try {
      const data = await this.cache.getOrSet(
        this.cacheKey("solidYield.subbasins"),
        this.cacheTtlMs,
        () => solidYieldService.getSubbasins()
      );
      res.json({ success: true, data, count: data.length });
    } catch (error) {
      next(error);
    }
  }

  async availability(req: Request, res: Response, next: NextFunction) {
    try {
      const subbasinStationId = qInt(req.query.subbasinStationId);
      const data = await this.cache.getOrSet(
        this.cacheKey("solidYield.availability", { subbasinStationId: subbasinStationId ?? null }),
        this.cacheTtlMs,
        () => solidYieldService.getAvailability(subbasinStationId)
      );
      console.debug("[solid-yield][availability]", {
        subbasinStationId: subbasinStationId ?? null,
        count: data.length,
      });
      res.json({ success: true, data, count: data.length });
    } catch (error) {
      next(error);
    }
  }

  async timeseries(req: Request, res: Response, next: NextFunction) {
    try {
      const subbasinStationId = qInt(req.query.subbasinStationId);
      const runId = qInt(req.query.runId);
      const interval = qInterval(req.query.interval);
      const startDate = qString(req.query.startDate);
      const endDate = qString(req.query.endDate);

      if (!subbasinStationId || !runId) {
        return res.status(400).json({
          success: false,
          error: "subbasinStationId et runId sont requis",
        });
      }

      const payload = {
        subbasinStationId,
        runId,
        interval,
        startDate: startDate || null,
        endDate: endDate || null,
      };
      const data = await this.cache.getOrSet(
        this.cacheKey("solidYield.timeseries", payload),
        this.cacheTtlMs,
        () =>
          solidYieldService.getSeries(interval, {
            subbasinStationId,
            runId,
            startDate: startDate || undefined,
            endDate: endDate || undefined,
          })
      );

      console.debug("[solid-yield][timeseries]", {
        subbasinStationId,
        runId,
        interval,
        count: data.length,
      });

      res.json({
        success: true,
        interval,
        subbasinStationId,
        runId,
        data,
        count: data.length,
      });
    } catch (error) {
      next(error);
    }
  }

  async stats(req: Request, res: Response, next: NextFunction) {
    try {
      const subbasinStationId = qInt(req.query.subbasinStationId);
      const runId = qInt(req.query.runId);
      const startDate = qString(req.query.startDate);
      const endDate = qString(req.query.endDate);

      if (!subbasinStationId || !runId) {
        return res.status(400).json({
          success: false,
          error: "subbasinStationId et runId sont requis",
        });
      }

      const payload = {
        subbasinStationId,
        runId,
        startDate: startDate || null,
        endDate: endDate || null,
      };
      const data = await this.cache.getOrSet(
        this.cacheKey("solidYield.stats", payload),
        this.cacheTtlMs,
        () =>
          solidYieldService.getStats({
            subbasinStationId,
            runId,
            startDate: startDate || undefined,
            endDate: endDate || undefined,
          })
      );

      console.debug("[solid-yield][stats]", {
        subbasinStationId,
        runId,
        hasData: Boolean(data),
      });

      res.json({ success: true, subbasinStationId, runId, data });
    } catch (error) {
      next(error);
    }
  }

  async diagnostic(_req: Request, res: Response, next: NextFunction) {
    try {
      const data = await solidYieldService.getSedimentDiagnostics();
      console.debug("[solid-yield][diagnostic]", {
        scenarios: data.summary.scenario_count,
        stations: data.summary.station_count,
        rows: data.rows.length,
        availableRows: data.summary.available_rows,
      });
      res.json({ success: true, data, count: data.rows.length });
    } catch (error) {
      next(error);
    }
  }
}

export const solidYieldController = new SolidYieldController();

import { NextFunction, Request, Response } from "express";
import { solidYieldService } from "../services/solidYield.service";
import { SolidYieldInterval } from "../types/solidYield.types";

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
  async subbasins(_req: Request, res: Response, next: NextFunction) {
    try {
      const data = await solidYieldService.getSubbasins();
      res.json({ success: true, data, count: data.length });
    } catch (error) {
      next(error);
    }
  }

  async availability(req: Request, res: Response, next: NextFunction) {
    try {
      const subbasinStationId = qInt(req.query.subbasinStationId);
      const data = await solidYieldService.getAvailability(subbasinStationId);
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

      const data = await solidYieldService.getSeries(interval, {
        subbasinStationId,
        runId,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
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

      const data = await solidYieldService.getStats({
        subbasinStationId,
        runId,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });

      res.json({ success: true, subbasinStationId, runId, data });
    } catch (error) {
      next(error);
    }
  }
}

export const solidYieldController = new SolidYieldController();


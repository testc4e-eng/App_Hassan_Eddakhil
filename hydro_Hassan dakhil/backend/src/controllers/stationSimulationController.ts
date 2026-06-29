import { NextFunction, Request, Response } from "express";
import { stationSimulationService } from "../services/stationSimulation.service";

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

export class StationSimulationController {
  async getStationSimulations(req: Request, res: Response, next: NextFunction) {
    try {
      const stationId = qInt(req.params.stationId);
      const runId = qInt(req.query.runId);
      const scenarioCode = qString(req.query.scenarioCode).trim() || undefined;
      const startDate = qString(req.query.startDate).trim() || undefined;
      const endDate = qString(req.query.endDate).trim() || undefined;

      if (!stationId) {
        return res.status(400).json({ success: false, error: "Invalid stationId" });
      }

      const data = await stationSimulationService.getStationSimulations({
        stationId,
        runId,
        scenarioCode,
        startDate,
        endDate,
      });

      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }
}

export const stationSimulationController = new StationSimulationController();

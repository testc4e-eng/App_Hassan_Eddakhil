// backend/src/controllers/thematicReach.controller.ts
import { Request, Response, NextFunction } from "express";
import { thematicReachService } from "../services/thematicReach.service";

function q1(v: unknown): string | undefined {
  if (typeof v === "string") return v;
  if (Array.isArray(v)) return typeof v[0] === "string" ? v[0] : undefined;
  return undefined;
}

function qNumber(v: unknown): number | undefined {
  if (v === undefined || v === null) return undefined;
  const n = Number(v);
  if (Number.isNaN(n)) return undefined;
  return n;
}

export class ThematicReachController {
  async getSediment(req: Request, res: Response, next: NextFunction) {
    try {
      const scenarioCode = q1(req.query.scenarioCode);
      const startYear = qNumber(req.query.startYear);
      const endYear = qNumber(req.query.endYear);
      const aggregation = q1(req.query.aggregation);

      const result = await thematicReachService.getSedimentByReach({
        scenarioCode,
        startYear,
        endYear,
        aggregation,
      });

      return res.json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }
}

export const thematicReachController = new ThematicReachController();

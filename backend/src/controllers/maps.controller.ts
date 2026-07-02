// backend/src/controllers/maps.controller.ts
import { Request, Response, NextFunction } from "express";
import { mapsService } from "../services/maps.service";

function q1(v: unknown): string | undefined {
  if (typeof v === "string") return v;
  if (Array.isArray(v)) return typeof v[0] === "string" ? v[0] : undefined;
  return undefined;
}

export class MapsController {
  /**
   * GET /api/v1/maps/stations-values?variable=discharge&scenario=observed&date=2024-01-01
   * Returns: { success:true, data:[{station_id,value,station_name?}] }
   */
  async getStationsValues(req: Request, res: Response, next: NextFunction) {
    try {
      const variable = q1(req.query.variable);
      const scenario = q1(req.query.scenario);
      const date = q1(req.query.date);

      if (!variable || !scenario || !date) {
        return res.status(400).json({
          success: false,
          error: "variable, scenario, date sont requis",
        });
      }

      const rows = await mapsService.getStationsValues(variable, scenario, date);

      return res.json({
        success: true,
        variable,
        scenario,
        date,
        data: rows,
        count: rows.length,
      });
    } catch (err) {
      next(err);
    }
  }
}

export const mapsController = new MapsController();

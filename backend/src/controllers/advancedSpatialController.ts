import { Request, Response, NextFunction } from "express";
import { AdvancedSpatialService, type AdvancedSpatialLayer } from "../services/advancedSpatial.service";

const service = new AdvancedSpatialService();

function parseScenario(value: unknown): string {
  const scenario = String(value ?? "current").trim();
  if (!scenario) return "current";
  return scenario;
}

function parseLayer(value: unknown): AdvancedSpatialLayer {
  const layer = String(value ?? "hrus").trim().toLowerCase();
  if (layer === "hrus" || layer === "subs" || layer === "rivs" || layer === "lulc" || layer === "sol" || layer === "slope") {
    return layer;
  }
  throw new Error(`Invalid advanced spatial layer: ${value}`);
}

export class AdvancedSpatialController {
  async scenarios(_req: Request, res: Response, next: NextFunction) {
    try {
      res.json({ success: true, data: service.getScenarios() });
    } catch (e) {
      next(e);
    }
  }

  async layer(req: Request, res: Response, next: NextFunction) {
    try {
      const scenario = parseScenario(req.query.scenario);
      const layer = parseLayer(req.query.layer);
      const subbasinId = req.query.subbasin != null ? Number(req.query.subbasin) : undefined;

      const data = await service.getLayer(scenario, layer, subbasinId);
      res.json({
        success: true,
        data: {
          scenario,
          layer,
          subbasinId: Number.isFinite(subbasinId) ? subbasinId : null,
          geojson: data,
          count: data.features.length,
        },
      });
    } catch (e) {
      next(e);
    }
  }

  async debugRoot(_req: Request, res: Response, next: NextFunction) {
    try {
      res.json({ success: true, data: service.getDebugRoot() });
    } catch (e) {
      next(e);
    }
  }
}

export const advancedSpatialController = new AdvancedSpatialController();

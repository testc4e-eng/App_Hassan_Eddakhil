// backend/src/controllers/catalogController.ts
import { Request, Response, NextFunction } from "express";
import { catalogService } from "../services/catalog.service";

export class CatalogController {
  async getModules(req: Request, res: Response, next: NextFunction) {
    try {
      const rows = await catalogService.getModules();
      res.json({ success: true, data: rows, count: rows.length });
    } catch (e) {
      next(e);
    }
  }

  async getModuleProperties(req: Request, res: Response, next: NextFunction) {
    try {
      const moduleCode = String(req.params.moduleCode);
      const rows = await catalogService.getModuleProperties(moduleCode);
      res.json({ success: true, moduleCode, data: rows, count: rows.length });
    } catch (e) {
      next(e);
    }
  }

  async getRuns(req: Request, res: Response, next: NextFunction) {
    try {
      const rows = await catalogService.getRuns();
      res.json({ success: true, data: rows, count: rows.length });
    } catch (e) {
      next(e);
    }
  }

  async getStationsForModule(req: Request, res: Response, next: NextFunction) {
    try {
      const moduleCode = String(req.params.moduleCode);
      const runId = req.query.runId ? Number(req.query.runId) : undefined;
      if (!runId) {
        return res
          .status(400)
          .json({ success: false, error: "runId est requis" });
      }
      const rows = await catalogService.getStationsForModule(moduleCode, runId);
      res.json({
        success: true,
        moduleCode,
        runId,
        data: rows,
        count: rows.length,
      });
    } catch (e) {
      next(e);
    }
  }
}

export const catalogController = new CatalogController();

import { Request, Response } from "express";
import { accessService } from "../services/access.service";

function toInt(value: unknown): number | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  const parsed = Number.parseInt(String(value), 10);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export class AccessController {
  async health(_req: Request, res: Response) {
    try {
      const data = await accessService.health();
      res.json({ success: true, data });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Access health failed",
      });
    }
  }

  async summary(_req: Request, res: Response) {
    try {
      const data = await accessService.summary();
      res.json({ success: true, data });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Access summary failed",
      });
    }
  }

  async tables(_req: Request, res: Response) {
    try {
      const data = await accessService.listTables();
      res.json({ success: true, data, count: data.length });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Access tables failed",
      });
    }
  }

  async variables(_req: Request, res: Response) {
    try {
      const data = await accessService.listVariables();
      res.json({ success: true, data, count: data.length });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Access variables failed",
      });
    }
  }

  async importRuns(_req: Request, res: Response) {
    try {
      const data = await accessService.listImportRuns();
      res.json({ success: true, data, count: data.length });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Access import runs failed",
      });
    }
  }

  async entities(req: Request, res: Response) {
    try {
      const entityType = String(req.query.entityType || "sub") as "sub" | "rch";
      const data = await accessService.listEntities(entityType);
      res.json({ success: true, entityType, data, count: data.length });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Access entities failed",
      });
    }
  }

  async timeseries(req: Request, res: Response) {
    try {
      const entityType = String(req.query.entityType || "sub") as "sub" | "rch";
      const data = await accessService.listTimeSeries({
        entityType,
        entityId: toInt(req.query.entityId),
        variableCode: req.query.variable ? String(req.query.variable) : undefined,
        year: toInt(req.query.year),
        limit: toInt(req.query.limit),
      });
      res.json({ success: true, entityType, data, count: data.length });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Access timeseries failed",
      });
    }
  }

  async stats(req: Request, res: Response) {
    try {
      const entityType = String(req.query.entityType || "sub") as "sub" | "rch";
      const data = await accessService.stats({
        entityType,
        entityId: toInt(req.query.entityId),
        variableCode: req.query.variable ? String(req.query.variable) : undefined,
      });
      res.json({ success: true, entityType, data, count: data.length });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Access stats failed",
      });
    }
  }
}

export const accessController = new AccessController();

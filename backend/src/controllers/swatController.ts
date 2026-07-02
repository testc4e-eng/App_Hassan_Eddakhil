import { Request, Response, NextFunction } from "express";
import { accessService } from "../services/access.service";
import { swatIngestionService } from "../services/swatIngestion.service";
import { SwatDeleteFilterPayload, SwatImportPayload } from "../types/swatIngestion.types";
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

export class SwatController {
  private cache = new TtlCache<any>();
  private readonly cacheTtlMs = 5 * 60 * 1000;

  private cacheKey(name: string, payload?: unknown): string {
    return payload === undefined ? name : `${name}:${JSON.stringify(payload)}`;
  }

  private clearCache() {
    this.cache.clear();
  }

  async summary(_req: Request, res: Response, next: NextFunction) {
    try {
      const data = await this.cache.getOrSet(
        this.cacheKey("swat.summary"),
        this.cacheTtlMs,
        () => swatIngestionService.getSummary()
      );
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async import(req: Request, res: Response, next: NextFunction) {
    try {
      const payload = (req.body ?? {}) as SwatImportPayload;
      const data = await swatIngestionService.importSwat(payload);
      this.clearCache();
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async batches(_req: Request, res: Response, next: NextFunction) {
    try {
      const data = await this.cache.getOrSet(
        this.cacheKey("swat.batches"),
        this.cacheTtlMs,
        () => swatIngestionService.listBatches()
      );
      res.json({ success: true, data, count: data.length });
    } catch (error) {
      next(error);
    }
  }

  async availability(_req: Request, res: Response, next: NextFunction) {
    try {
      const data = await this.cache.getOrSet(
        this.cacheKey("swat.availability"),
        this.cacheTtlMs,
        () => swatIngestionService.getAvailability()
      );
      res.json({ success: true, data, count: data.length });
    } catch (error) {
      next(error);
    }
  }

  async data(req: Request, res: Response, next: NextFunction) {
    try {
      const entityType = qString(req.query.entityType) as "subbasin" | "reach" | "station" | "basin" | "";
      const payload = {
        entityType: entityType || undefined,
        entityId: qInt(req.query.entityId),
        entityCode: qString(req.query.entityCode),
        variable: qString(req.query.variable) as "flow_m3s" | "sed_tons" | "syldt_ha" | "",
        source: qString(req.query.source) as "simulated" | "observed" | "",
        periodStart: qString(req.query.periodStart),
        periodEnd: qString(req.query.periodEnd),
        batchId: qString(req.query.batchId),
        runId: qInt(req.query.runId),
        limit: qInt(req.query.limit),
      };

      const data = await swatIngestionService.getData({
        entityType: payload.entityType || undefined,
        entityId: payload.entityId,
        entityCode: payload.entityCode || undefined,
        variable: (payload.variable || undefined) as "flow_m3s" | "sed_tons" | "syldt_ha" | undefined,
        source: (payload.source || undefined) as "simulated" | "observed" | undefined,
        periodStart: payload.periodStart || undefined,
        periodEnd: payload.periodEnd || undefined,
        batchId: payload.batchId || undefined,
        runId: payload.runId,
        limit: payload.limit,
      });

      this.cache.set(this.cacheKey("swat.data", payload), data, this.cacheTtlMs);
      res.json({ success: true, data, count: data.length });
    } catch (error) {
      next(error);
    }
  }

  async deleteByFilter(req: Request, res: Response, next: NextFunction) {
    try {
      const payload = (req.body ?? {}) as SwatDeleteFilterPayload;
      const data = await swatIngestionService.deleteByFilter(payload);
      this.clearCache();
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async subbasins(req: Request, res: Response, next: NextFunction) {
    try {
      const entityId = qInt(req.query.entityId);
      const data = await this.cache.getOrSet(
        this.cacheKey("swat.subbasins", entityId ?? null),
        this.cacheTtlMs,
        () => accessService.listEntities("sub")
      );
      const filtered = entityId ? data.filter((r: any) => Number(r.entity_id) === entityId) : data;
      res.json({ success: true, entityType: "sub", data: filtered, count: filtered.length });
    } catch (error) {
      next(error);
    }
  }

  async reaches(req: Request, res: Response, next: NextFunction) {
    try {
      const entityId = qInt(req.query.entityId);
      const data = await this.cache.getOrSet(
        this.cacheKey("swat.reaches", entityId ?? null),
        this.cacheTtlMs,
        () => accessService.listEntities("rch")
      );
      const filtered = entityId ? data.filter((r: any) => Number(r.entity_id) === entityId) : data;
      res.json({ success: true, entityType: "rch", data: filtered, count: filtered.length });
    } catch (error) {
      next(error);
    }
  }

  async variables(_req: Request, res: Response, next: NextFunction) {
    try {
      const data = await this.cache.getOrSet(
        this.cacheKey("swat.variables"),
        this.cacheTtlMs,
        () => accessService.listVariables()
      );
      res.json({ success: true, data, count: data.length });
    } catch (error) {
      next(error);
    }
  }

  async timeseries(req: Request, res: Response, next: NextFunction) {
    try {
      const entityType = qString(req.query.entityType, "sub") as "sub" | "rch";
      const entityId = qInt(req.query.entityId);
      const variableCode = qString(req.query.variable);
      const year = qInt(req.query.year);
      const limit = qInt(req.query.limit);
      const payload = { entityType, entityId, variableCode: variableCode || null, year, limit };
      const data = await this.cache.getOrSet(
        this.cacheKey("swat.timeseries", payload),
        this.cacheTtlMs,
        () => accessService.listTimeSeries({
          entityType,
          entityId,
          variableCode: variableCode || undefined,
          year,
          limit,
        })
      );
      res.json({ success: true, entityType, data, count: data.length });
    } catch (error) {
      next(error);
    }
  }

  async stats(req: Request, res: Response, next: NextFunction) {
    try {
      const entityType = qString(req.query.entityType, "sub") as "sub" | "rch";
      const entityId = qInt(req.query.entityId);
      const variableCode = qString(req.query.variable);
      const payload = { entityType, entityId, variableCode: variableCode || null };
      const data = await this.cache.getOrSet(
        this.cacheKey("swat.stats", payload),
        this.cacheTtlMs,
        () => accessService.stats({
          entityType,
          entityId,
          variableCode: variableCode || undefined,
        })
      );
      res.json({ success: true, entityType, data, count: data.length });
    } catch (error) {
      next(error);
    }
  }
}

export const swatController = new SwatController();

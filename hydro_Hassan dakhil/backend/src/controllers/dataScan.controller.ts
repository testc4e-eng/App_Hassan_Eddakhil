import { NextFunction, Request, Response } from "express";
import { dataScanService } from "../services/dataScan.service";
import type { DataScanTableFilters } from "../types/dataScan.types";
import { TtlCache } from "../utils/ttlCache";

function toBool(value: unknown): boolean | undefined {
  if (value === undefined) return undefined;
  if (typeof value === "boolean") return value;
  const v = String(value).trim().toLowerCase();
  if (v === "true" || v === "1") return true;
  if (v === "false" || v === "0") return false;
  return undefined;
}

export class DataScanController {
  private cache = new TtlCache<any>();
  private readonly cacheTtlMs = 10 * 60 * 1000;

  private cacheKey(name: string, payload?: unknown): string {
    return payload === undefined ? name : `${name}:${JSON.stringify(payload)}`;
  }

  async summary(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await this.cache.getOrSet(
        this.cacheKey("dataScan.summary"),
        this.cacheTtlMs,
        () => dataScanService.getSummary()
      );
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async tables(req: Request, res: Response, next: NextFunction) {
    try {
      const filters: DataScanTableFilters = {
        schema: req.query.schema ? String(req.query.schema) : undefined,
        tableType:
          req.query.tableType === "BASE TABLE" || req.query.tableType === "VIEW"
            ? (req.query.tableType as "BASE TABLE" | "VIEW")
            : undefined,
        geometryOnly: toBool(req.query.geometryOnly),
        emptyOnly: toBool(req.query.emptyOnly),
        anomalousOnly: toBool(req.query.anomalousOnly),
      };
      const data = await this.cache.getOrSet(
        this.cacheKey("dataScan.tables", filters),
        this.cacheTtlMs,
        () => dataScanService.getTables(filters)
      );
      res.json({ success: true, data, count: data.length });
    } catch (error) {
      next(error);
    }
  }

  async tableDetail(req: Request, res: Response, next: NextFunction) {
    try {
      const schemaName = String(req.params.schema);
      const tableName = String(req.params.table);
      const data = await this.cache.getOrSet(
        this.cacheKey("dataScan.tableDetail", { schemaName, tableName }),
        this.cacheTtlMs,
        () => dataScanService.getTableDetail(schemaName, tableName)
      );
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async anomalies(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await this.cache.getOrSet(
        this.cacheKey("dataScan.anomalies"),
        this.cacheTtlMs,
        () => dataScanService.getAnomalies()
      );
      res.json({ success: true, data, count: data.length });
    } catch (error) {
      next(error);
    }
  }

  async relations(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await this.cache.getOrSet(
        this.cacheKey("dataScan.relations"),
        this.cacheTtlMs,
        () => dataScanService.getRelations()
      );
      res.json({ success: true, data, count: data.length });
    } catch (error) {
      next(error);
    }
  }

  async periodsGlobal(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await this.cache.getOrSet(
        this.cacheKey("dataScan.periods.global"),
        this.cacheTtlMs,
        () => dataScanService.getPeriodsGlobal()
      );
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async periodsByVariable(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await this.cache.getOrSet(
        this.cacheKey("dataScan.periods.byVariable"),
        this.cacheTtlMs,
        () => dataScanService.getPeriodsByVariable()
      );
      res.json({ success: true, data, count: data.length });
    } catch (error) {
      next(error);
    }
  }

  async periodsByEntity(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await this.cache.getOrSet(
        this.cacheKey("dataScan.periods.byEntity"),
        this.cacheTtlMs,
        () => dataScanService.getPeriodsByEntity()
      );
      res.json({ success: true, data, count: data.length });
    } catch (error) {
      next(error);
    }
  }

  async periodsByEntityVariableSource(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await this.cache.getOrSet(
        this.cacheKey("dataScan.periods.byEntityVariableSource"),
        this.cacheTtlMs,
        () => dataScanService.getPeriodsByEntityVariableSource()
      );
      res.json({ success: true, data, count: data.length });
    } catch (error) {
      next(error);
    }
  }

  async dataAvailability(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await this.cache.getOrSet(
        this.cacheKey("dataScan.dataAvailability"),
        this.cacheTtlMs,
        () => dataScanService.getDataAvailability()
      );
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }
}

export const dataScanController = new DataScanController();

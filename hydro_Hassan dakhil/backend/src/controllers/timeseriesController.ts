// src/controllers/timeseriesController.ts
import { Request, Response, NextFunction } from "express";
import { timeseriesService } from "../services/timeseries.service";

type AggInterval = "day" | "month" | "year";

function parseIntList(value: unknown): number[] {
  const raw = Array.isArray(value) ? value.join(",") : String(value || "");
  return raw
    .split(",")
    .map((item) => Number(item.trim()))
    .filter((item) => Number.isFinite(item));
}

export class TimeseriesController {
  async health(req: Request, res: Response, next: NextFunction) {
    try {
      res.json({
        success: true,
        service: "Timeseries API",
        ts: new Date().toISOString(),
      });
    } catch (e) {
      next(e);
    }
  }

  async getCatalog(req: Request, res: Response, next: NextFunction) {
    try {
      const stationId = req.query.stationId
        ? Number(req.query.stationId)
        : undefined;
      const runId = req.query.runId ? Number(req.query.runId) : undefined;
      const moduleCode = req.query.module
        ? String(req.query.module)
        : undefined;

      if (!stationId || !runId || !moduleCode) {
        return res.status(400).json({
          success: false,
          error: "stationId, runId, module sont requis",
        });
      }

      const rows = await timeseriesService.getCatalog({
        stationId,
        runId,
        moduleCode,
      });
      console.debug("[timeseries/catalog]", {
        stationId,
        runId,
        moduleCode,
        count: rows.length,
      });
      res.json({ success: true, data: rows, count: rows.length });
    } catch (e) {
      next(e);
    }
  }

  async getDateRange(req: Request, res: Response, next: NextFunction) {
    try {
      const stationId = req.query.stationId
        ? Number(req.query.stationId)
        : undefined;
      const runId = req.query.runId ? Number(req.query.runId) : undefined;
      const propertyId = req.query.propertyId
        ? Number(req.query.propertyId)
        : undefined;
      const moduleCode = req.query.module
        ? String(req.query.module)
        : undefined;

      if (!stationId) {
        return res.status(400).json({
          success: false,
          error: "stationId est requis",
        });
      }

      const data = await timeseriesService.getDateRange({
        stationId,
        runId,
        propertyId,
        moduleCode,
      });

      res.json({
        success: true,
        data: {
          minDate: data.min_date,
          maxDate: data.max_date,
          nPoints: data.n_points,
        },
      });
    } catch (e) {
      next(e);
    }
  }

  async getBundle(req: Request, res: Response, next: NextFunction) {
    try {
      const stationId = req.query.stationId
        ? Number(req.query.stationId)
        : undefined;
      const runId = req.query.runId ? Number(req.query.runId) : undefined;
      const moduleCode = req.query.module
        ? String(req.query.module)
        : undefined;
      const agg = req.query.agg
        ? (String(req.query.agg) as AggInterval)
        : undefined;
      const startDate = req.query.startDate
        ? String(req.query.startDate)
        : undefined;
      const endDate = req.query.endDate ? String(req.query.endDate) : undefined;
      const propertyIds = parseIntList(req.query.propertyIds);
      const maxPoints = req.query.maxPoints
        ? Number(req.query.maxPoints)
        : undefined;

      if (!stationId || !runId || !moduleCode) {
        return res.status(400).json({
          success: false,
          error: "stationId, runId, module sont requis",
        });
      }

      const bundle = await timeseriesService.getBundle({
        stationId,
        runId,
        moduleCode,
      }, agg ?? "day", startDate, endDate, {
        propertyIds,
        maxPoints,
      });
      console.debug("[timeseries/bundle] params", {
        stationId,
        runId,
        moduleCode,
        agg: agg ?? null,
        startDate: startDate ?? null,
        endDate: endDate ?? null,
        propertyIds,
        maxPoints: maxPoints ?? null,
        catalogCount: bundle.catalog.length,
      });

      console.debug("[timeseries/bundle] response", {
        stationId,
        runId,
        moduleCode,
        aggregatedSeriesCount: bundle.aggregated
          ? Object.keys(bundle.aggregated).length
          : 0,
      });

      res.json({
        success: true,
        data: {
          stationId,
          runId,
          module: moduleCode,
          catalog: bundle.catalog,
          aggregated: bundle.aggregated,
        },
      });
    } catch (e) {
      next(e);
    }
  }

  async getStats(req: Request, res: Response, next: NextFunction) {
    try {
      const stationId = req.query.stationId ? Number(req.query.stationId) : undefined;
      const runId = req.query.runId ? Number(req.query.runId) : undefined;
      const moduleCode = req.query.module ? String(req.query.module) : undefined;
      const agg = req.query.agg ? (String(req.query.agg) as AggInterval) : "day";
      const startDate = req.query.startDate ? String(req.query.startDate) : undefined;
      const endDate = req.query.endDate ? String(req.query.endDate) : undefined;
      const propertyIds = parseIntList(req.query.propertyIds);

      if (!stationId || !runId || !moduleCode) {
        return res.status(400).json({
          success: false,
          error: "stationId, runId, module sont requis",
        });
      }

      const data = await timeseriesService.getStats({
        filter: { stationId, runId, moduleCode },
        agg,
        startDate,
        endDate,
        propertyIds,
      });

      return res.json({ success: true, data });
    } catch (e) {
      next(e);
    }
  }

  async getTable(req: Request, res: Response, next: NextFunction) {
    try {
      const stationId = req.query.stationId ? Number(req.query.stationId) : undefined;
      const runId = req.query.runId ? Number(req.query.runId) : undefined;
      const moduleCode = req.query.module ? String(req.query.module) : undefined;
      const agg = req.query.agg ? (String(req.query.agg) as AggInterval) : "day";
      const startDate = req.query.startDate ? String(req.query.startDate) : undefined;
      const endDate = req.query.endDate ? String(req.query.endDate) : undefined;
      const propertyIds = parseIntList(req.query.propertyIds);
      const page = req.query.page ? Number(req.query.page) : 1;
      const pageSize = req.query.page_size ? Number(req.query.page_size) : 25;
      const search = req.query.search ? String(req.query.search) : undefined;
      const sortColumn = req.query.sortColumn ? String(req.query.sortColumn) : undefined;
      const sortDirection = req.query.sortDirection === "asc" ? "asc" : "desc";

      if (!stationId || !runId || !moduleCode) {
        return res.status(400).json({
          success: false,
          error: "stationId, runId, module sont requis",
        });
      }

      const data = await timeseriesService.getTablePage({
        filter: { stationId, runId, moduleCode },
        agg,
        startDate,
        endDate,
        propertyIds,
        page,
        pageSize,
        search,
        sortColumn,
        sortDirection,
      });

      return res.json({ success: true, data });
    } catch (e) {
      next(e);
    }
  }

  async getAggregationAvailability(req: Request, res: Response, next: NextFunction) {
    try {
      const stationId = req.query.stationId
        ? Number(req.query.stationId)
        : undefined;
      const runId = req.query.runId ? Number(req.query.runId) : undefined;
      const propertyId = req.query.propertyId
        ? Number(req.query.propertyId)
        : undefined;
      const moduleCode = req.query.module
        ? String(req.query.module)
        : undefined;
      const startDate = req.query.startDate
        ? String(req.query.startDate)
        : undefined;
      const endDate = req.query.endDate
        ? String(req.query.endDate)
        : undefined;

      if (!stationId || !runId || !propertyId || !moduleCode) {
        return res.status(400).json({
          success: false,
          error: "stationId, runId, propertyId, module sont requis",
        });
      }

      const availability = await timeseriesService.getAggregationAvailability({
        stationId,
        runId,
        propertyId,
        moduleCode,
        startDate,
        endDate,
      });

      res.json({ success: true, data: availability });
    } catch (e) {
      next(e);
    }
  }

  async aggregate(req: Request, res: Response, next: NextFunction) {
    try {
      const tsId = Number(req.params.tsId);
      const interval = req.query.interval
        ? (String(req.query.interval) as AggInterval)
        : undefined;
      const startDate = req.query.startDate
        ? String(req.query.startDate)
        : undefined;
      const endDate = req.query.endDate ? String(req.query.endDate) : undefined;

      if (!interval || !startDate || !endDate) {
        return res.status(400).json({
          success: false,
          error: "interval, startDate, endDate sont requis",
        });
      }

      const data = await timeseriesService.aggregate(
        tsId,
        interval,
        startDate,
        endDate
      );
      res.json({ success: true, tsId, interval, data });
    } catch (e) {
      next(e);
    }
  }
}

export const timeseriesController = new TimeseriesController();

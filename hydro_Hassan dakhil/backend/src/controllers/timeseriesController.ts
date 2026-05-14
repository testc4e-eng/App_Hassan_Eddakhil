// src/controllers/timeseriesController.ts
import { Request, Response, NextFunction } from "express";
import { timeseriesService } from "../services/timeseries.service";

type AggInterval = "day" | "month" | "year";

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

      if (!stationId || !runId || !moduleCode) {
        return res.status(400).json({
          success: false,
          error: "stationId, runId, module sont requis",
        });
      }

      const catalog = await timeseriesService.getCatalog({
        stationId,
        runId,
        moduleCode,
      });
      console.debug("[timeseries/bundle] params", {
        stationId,
        runId,
        moduleCode,
        agg: agg ?? null,
        startDate: req.query.startDate ? String(req.query.startDate) : null,
        endDate: req.query.endDate ? String(req.query.endDate) : null,
        catalogCount: catalog.length,
      });

      let aggregated: Record<number, any[]> | undefined = undefined;
      if (agg) {
        aggregated = {};
        for (const ts of catalog) {
          if (!ts.start_date || !ts.end_date) continue;
          aggregated[ts.ts_id] = await timeseriesService.aggregate(
            ts.ts_id,
            agg,
            ts.start_date,
            ts.end_date
          );
        }
      }

      console.debug("[timeseries/bundle] response", {
        stationId,
        runId,
        moduleCode,
        aggregatedSeriesCount: aggregated ? Object.keys(aggregated).length : 0,
      });

      res.json({
        success: true,
        stationId,
        runId,
        module: moduleCode,
        catalog,
        aggregated,
      });
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

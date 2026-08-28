// backend/src/controllers/spatialController.ts
import { Request, Response, NextFunction } from "express";
import { SpatialService } from "../services/spatial.service";

const spatialService = new SpatialService();

export class SpatialController {
  async barrages(req: Request, res: Response, next: NextFunction) {
    try {
      const rows = await spatialService.getBarrages();
      res.json({
        success: true,
        data: spatialService.toFeatureCollection(rows, (r) => ({
          id: r.id,
          name: r.name,
        })),
      });
    } catch (e) {
      next(e);
    }
  }

  async basins(req: Request, res: Response, next: NextFunction) {
    try {
      const rows = await spatialService.getBasins();
      res.json({
        success: true,
        data: spatialService.toFeatureCollection(rows, (r) => ({
          id: r.id,
          name: r.name,
          area_m2: r.area_m2,
          area_km2: r.area_km2,
          subbasins_count: r.subbasins_count,
          stations_count: r.stations_count,
          reaches_count: r.reaches_count,
        })),
      });
    } catch (e) {
      next(e);
    }
  }

  async subbasins(req: Request, res: Response, next: NextFunction) {
    try {
      const catchmentId = req.query.catchmentId
        ? Number(req.query.catchmentId)
        : undefined;
      const barrageId = req.query.barrageId
        ? Number(req.query.barrageId)
        : undefined;

      const rows = await spatialService.getSubBasins(catchmentId, barrageId);
      res.json({
        success: true,
        data: spatialService.toFeatureCollection(rows, (r) => ({
          id: r.id,
          name: r.name,
          catchment_id: r.catchment_id,
          subbasin_code: r.subbasin_code,
          area_m2: r.area_m2,
          area_km2: r.area_km2,
          perimeter_km: r.perimeter_km,
          centroid_lat: r.centroid_lat,
          centroid_lng: r.centroid_lng,
        })),
      });
    } catch (e) {
      next(e);
    }
  }

  async reaches(req: Request, res: Response, next: NextFunction) {
    try {
      const subbasinId = req.query.subbasinId ? Number(req.query.subbasinId) : undefined;
      const catchmentId = req.query.catchmentId ? Number(req.query.catchmentId) : undefined;
      const includeSummary =
        req.query.summary === undefined
          ? true
          : !["false", "0", "no"].includes(String(req.query.summary).toLowerCase());

      const rows = await spatialService.getReaches(subbasinId, catchmentId, {
        includeSummary,
      });

      res.json({
        success: true,
        data: spatialService.toFeatureCollection(rows, (r) => ({
          id: r.id,
          reach_code: r.reach_code,
          subbasin_id: r.subbasin_id,
          catchment_id: r.catchment_id,
          length_m: r.length_m,
          slope_pct: r.slope_pct,
          scenario_code: r.scenario_code,
          period_start: r.period_start,
          period_end: r.period_end,
          drainage_area_km2: r.drainage_area_km2,
          flow_out_cms: r.flow_out_cms,
          flow_in_cms: r.flow_in_cms,
          sed_out_tons: r.sed_out_tons,
          sed_in_tons: r.sed_in_tons,
        })),
      });
    } catch (e) {
      next(e);
    }
  }

  async reachTimeseries(req: Request, res: Response, next: NextFunction) {
    try {
      const reachId = Number(req.params.reachId);
      const scenarioCode = req.query.scenarioCode
        ? String(req.query.scenarioCode)
        : "etat_actuel";
      const interval = req.query.interval ? String(req.query.interval) : "year";
      const startDate = req.query.startDate ? String(req.query.startDate) : undefined;
      const endDate = req.query.endDate ? String(req.query.endDate) : undefined;
      const variable = req.query.variable ? String(req.query.variable) : undefined;

      if (!Number.isFinite(reachId)) {
        res.status(400).json({ success: false, error: "Invalid reach id" });
        return;
      }

      if (variable) {
        const data = await spatialService.getReachVariableTimeseries(reachId, {
          variable,
          scenario: scenarioCode,
          aggregation: interval,
          startDate,
          endDate,
        });
        if (!data) {
          res.status(404).json({ success: false, error: "Reach not found" });
          return;
        }
        console.debug("[spatial][reach-timeseries]", {
          endpoint: "/spatial/reaches/:reachId/timeseries",
          reach_id: reachId,
          scenario_code: scenarioCode,
          variable: variable.toUpperCase(),
          aggregation: interval,
          points_count: data.data.length,
        });
        res.json({ success: true, data });
        return;
      }

      const data = await spatialService.getReachTimeseries(reachId, scenarioCode, {
        interval,
        startDate,
        endDate,
      });
      if (!data) {
        res.status(404).json({ success: false, error: "Reach not found" });
        return;
      }
      console.debug("[spatial][reach-timeseries]", {
        endpoint: "/spatial/reaches/:reachId/timeseries",
        reach_id: reachId,
        scenario_code: scenarioCode,
        variable: "SED_OUT",
        aggregation: interval,
        points_count: data.series.length,
      });

      res.json({ success: true, data });
    } catch (e) {
      next(e);
    }
  }

  async subbasinTimeseries(req: Request, res: Response, next: NextFunction) {
    try {
      const subbasinId = Number(req.params.subbasinId);
      if (!Number.isFinite(subbasinId)) {
        res.status(400).json({ success: false, error: "Invalid subbasin id" });
        return;
      }

      const data = await spatialService.getSubbasinTimeseries(subbasinId, {
        variable: req.query.variable ? String(req.query.variable) : "SYLDT",
        scenario: req.query.scenario ? String(req.query.scenario) : "etat_actuel",
        aggregation: req.query.aggregation ? String(req.query.aggregation) : "year",
        startDate: req.query.startDate ? String(req.query.startDate) : undefined,
        endDate: req.query.endDate ? String(req.query.endDate) : undefined,
      });

      if (!data) {
        res.status(404).json({ success: false, error: "Subbasin not found" });
        return;
      }
      console.debug("[spatial][subbasin-timeseries]", {
        endpoint: "/spatial/subbasins/:subbasinId/timeseries",
        subbasin_id: subbasinId,
        scenario_code: req.query.scenario ? String(req.query.scenario) : "etat_actuel",
        variable: req.query.variable ? String(req.query.variable).toUpperCase() : "SYLDT",
        aggregation: req.query.aggregation ? String(req.query.aggregation) : "year",
        points_count: data.data.length,
      });

      res.json({ success: true, data });
    } catch (e) {
      next(e);
    }
  }

  async stationTimeseries(req: Request, res: Response, next: NextFunction) {
    try {
      const stationId = Number(req.params.stationId);
      if (!Number.isFinite(stationId)) {
        res.status(400).json({ success: false, error: "Invalid station id" });
        return;
      }

      const data = await spatialService.getStationTimeseries(stationId, {
        variable: req.query.variable ? String(req.query.variable) : "debit_observed",
        scenario: req.query.scenario ? String(req.query.scenario) : undefined,
        aggregation: req.query.aggregation ? String(req.query.aggregation) : "day",
        startDate: req.query.startDate ? String(req.query.startDate) : undefined,
        endDate: req.query.endDate ? String(req.query.endDate) : undefined,
      });
      if (!data) {
        res.status(404).json({ success: false, error: "Station not found" });
        return;
      }
      res.json({ success: true, data });
    } catch (e) {
      next(e);
    }
  }

  async stationClimate(req: Request, res: Response, next: NextFunction) {
    try {
      const stationId = Number(req.params.stationId);
      if (!Number.isFinite(stationId)) {
        res.status(400).json({ success: false, error: "Invalid station id" });
        return;
      }

      const data = await spatialService.getStationClimateTimeseries(stationId, {
        variable: req.query.variable ? String(req.query.variable) : "precipitation",
        scenario: req.query.scenario ? String(req.query.scenario) : undefined,
        aggregation: req.query.aggregation ? String(req.query.aggregation) : "day",
        startDate: req.query.startDate ? String(req.query.startDate) : undefined,
        endDate: req.query.endDate ? String(req.query.endDate) : undefined,
      });
      if (!data) {
        res.status(404).json({ success: false, error: "Station not found" });
        return;
      }
      res.json({ success: true, data });
    } catch (e) {
      next(e);
    }
  }

  async stations(req: Request, res: Response, next: NextFunction) {
    try {
      const catchmentId = req.query.catchmentId
        ? Number(req.query.catchmentId)
        : undefined;

      const rows = await spatialService.getStations(catchmentId);
      res.json({
        success: true,
        data: spatialService.toFeatureCollection(rows, (r) => ({
          id: r.id,
          name: r.name,
          station_code: r.station_code,
          catchment_id: r.catchment_id,
          type_station: r.type_station,
          station_type_code: r.station_type_code,
        })),
      });
    } catch (e) {
      next(e);
    }
  }

  async projectHassanAddakhil(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await spatialService.getProjectHassanAddakhil();
      res.json({ success: true, data });
    } catch (e) {
      next(e);
    }
  }

  async scenariosAvailability(req: Request, res: Response, next: NextFunction) {
    try {
      const entityTypeParam = String(req.params.entityType || "");
      const entityId = Number(req.params.entityId);
      const entityType =
        entityTypeParam === "reaches"
          ? "reach"
          : entityTypeParam === "subbasins"
            ? "subbasin"
            : entityTypeParam === "stations"
              ? "station"
              : null;

      if (!entityType || !Number.isFinite(entityId)) {
        res.status(400).json({ success: false, error: "Invalid entity type or id" });
        return;
      }

      const data = await spatialService.getScenariosAvailability(entityType, entityId, {
        variable: req.query.variable ? String(req.query.variable) : undefined,
        aggregation: req.query.aggregation ? String(req.query.aggregation) : undefined,
        startDate: req.query.startDate ? String(req.query.startDate) : undefined,
        endDate: req.query.endDate ? String(req.query.endDate) : undefined,
      });

      if (!data) {
        res.status(404).json({ success: false, error: "Entity not found" });
        return;
      }

      res.json({ success: true, data });
    } catch (e) {
      next(e);
    }
  }

  async reachScenariosAvailability(req: Request, res: Response, next: NextFunction) {
    req.params.entityType = "reaches";
    req.params.entityId = req.params.entityId || req.params.reachId;
    return this.scenariosAvailability(req, res, next);
  }

  async subbasinScenariosAvailability(req: Request, res: Response, next: NextFunction) {
    req.params.entityType = "subbasins";
    req.params.entityId = req.params.entityId || req.params.subbasinId;
    return this.scenariosAvailability(req, res, next);
  }

  async stationScenariosAvailability(req: Request, res: Response, next: NextFunction) {
    req.params.entityType = "stations";
    req.params.entityId = req.params.entityId || req.params.stationId;
    return this.scenariosAvailability(req, res, next);
  }
}

export const spatialController = new SpatialController();

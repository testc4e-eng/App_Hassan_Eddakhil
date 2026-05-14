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

      const rows = await spatialService.getReaches(subbasinId, catchmentId);

      res.json({
        success: true,
        data: spatialService.toFeatureCollection(rows, (r) => ({
          id: r.id,
          reach_code: r.reach_code,
          subbasin_id: r.subbasin_id,
          catchment_id: r.catchment_id,
          length_m: r.length_m,
          slope_pct: r.slope_pct,
        })),
      });
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
}

export const spatialController = new SpatialController();

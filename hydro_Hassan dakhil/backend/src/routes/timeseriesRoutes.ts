// src/routes/timeseriesRoutes.ts
import { Router } from "express";
import { timeseriesController } from "../controllers/timeseriesController";

const router = Router();

router.get("/health", timeseriesController.health.bind(timeseriesController));

/**
 * Catalogue enrichi filtré par station + run + module
 * GET /api/v1/timeseries/catalog?stationId=1&runId=2&module=climat
 */
router.get(
  "/catalog",
  timeseriesController.getCatalog.bind(timeseriesController)
);

/**
 * Bornes de période réelles pour station + run + variable + module
 * GET /api/v1/timeseries/date-range?stationId=1&runId=2&propertyId=3&module=climat
 */
router.get(
  "/date-range",
  timeseriesController.getDateRange.bind(timeseriesController)
);

/**
 * Bundle = catalogue + stats + fenêtre min/max (déjà dans v_ts_catalog_enriched)
 * + option d’agrégation directe
 * GET /api/v1/timeseries/bundle?stationId=1&runId=2&module=climat&agg=month
 */
router.get(
  "/bundle",
  timeseriesController.getBundle.bind(timeseriesController)
);

router.get(
  "/stats",
  timeseriesController.getStats.bind(timeseriesController)
);

router.get(
  "/table",
  timeseriesController.getTable.bind(timeseriesController)
);

router.get(
  "/availability",
  timeseriesController.getAggregationAvailability.bind(timeseriesController)
);

/**
 * Agrégation d’une TS
 * GET /api/v1/timeseries/:tsId/aggregate?interval=month&startDate=2020-01-01&endDate=2020-12-31
 */
router.get(
  "/:tsId/aggregate",
  timeseriesController.aggregate.bind(timeseriesController)
);

export default router;

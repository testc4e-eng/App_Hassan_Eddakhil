// src/routes/hydroRoutes.ts
import { Router } from "express";
import { hydroController } from "../controllers/hydroController";

const router = Router();

// ================ HEALTH & INFO ================
router.get("/health", hydroController.healthCheck.bind(hydroController));
router.get("/stats", hydroController.getDashboardStats.bind(hydroController));

// ================ STATIONS ================
router.get("/stations", hydroController.getStations.bind(hydroController));
router.get(
  "/stations/:id",
  hydroController.getStationById.bind(hydroController)
);

// ================ CATCHMENTS ================
router.get("/catchments", hydroController.getCatchments.bind(hydroController));
router.get(
  "/catchments/:id",
  hydroController.getCatchmentById.bind(hydroController)
);

// ================ TIMESERIES ================
router.get("/timeseries", hydroController.getTimeseries.bind(hydroController));

// ✅ NOUVEAU : CATALOG (station + run + module)
router.get(
  "/timeseries/catalog",
  hydroController.getTimeseriesCatalog.bind(hydroController)
);

// ================ MEASUREMENTS ================
router.get(
  "/timeseries/:tsId/measurements",
  hydroController.getMeasurements.bind(hydroController)
);
router.get(
  "/timeseries/:tsId/measurements/aggregated",
  hydroController.getAggregatedMeasurements.bind(hydroController)
);

// ================ LANDCOVER ================
router.get("/landcover", hydroController.getLandcover.bind(hydroController));
router.get(
  "/catchments/:catchmentId/landcover-summary",
  hydroController.getLandcoverSummary.bind(hydroController)
);

// ================ RESERVOIRS ================
router.get("/reservoirs", hydroController.getReservoirs.bind(hydroController));

// ================ MODEL RUNS ================
router.get("/model-runs", hydroController.getModelRuns.bind(hydroController));

// ================ SPATIAL ================
router.get(
  "/spatial/features",
  hydroController.getFeaturesInBounds.bind(hydroController)
);

// ================ ROUTES DE TEST SIMPLES ================
router.get(
  "/test/health",
  hydroController.healthCheckSimple.bind(hydroController)
);
router.get(
  "/test/stations",
  hydroController.getStationsSimple.bind(hydroController)
);

// ✅ STATS (min/max/mean)
router.get(
  "/timeseries/:tsId/stats",
  hydroController.getTimeseriesStats.bind(hydroController)
);

export default router;

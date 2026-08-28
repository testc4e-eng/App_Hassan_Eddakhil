import { Router } from "express";
import { spatialController } from "../controllers/spatialController";
import { advancedSpatialController } from "../controllers/advancedSpatialController";
import { requireRole, verifyToken } from "../middleware/auth";

const router = Router();

router.get("/barrages", spatialController.barrages.bind(spatialController));
router.get("/basins", spatialController.basins.bind(spatialController));
router.get("/subbasins", spatialController.subbasins.bind(spatialController));
router.get("/subbasins/:subbasinId/timeseries", spatialController.subbasinTimeseries.bind(spatialController));
router.get(
  "/subbasins/:entityId/scenarios-availability",
  spatialController.subbasinScenariosAvailability.bind(spatialController)
);
router.get("/reaches", spatialController.reaches.bind(spatialController));
router.get("/reaches/:reachId/timeseries", spatialController.reachTimeseries.bind(spatialController));
router.get(
  "/reaches/:entityId/scenarios-availability",
  spatialController.reachScenariosAvailability.bind(spatialController)
);
router.get("/stations", spatialController.stations.bind(spatialController));
router.get("/stations/:stationId/timeseries", spatialController.stationTimeseries.bind(spatialController));
router.get("/stations/:stationId/climate", spatialController.stationClimate.bind(spatialController));
router.get(
  "/stations/:entityId/scenarios-availability",
  spatialController.stationScenariosAvailability.bind(spatialController)
);
router.get(
  "/project-hassan-addakhil",
  spatialController.projectHassanAddakhil.bind(spatialController)
);

router.get(
  "/advanced/scenarios",
  advancedSpatialController.scenarios.bind(advancedSpatialController)
);
router.get(
  "/advanced/debug-root",
  verifyToken,
  requireRole("ADMIN"),
  advancedSpatialController.debugRoot.bind(advancedSpatialController)
);
router.get(
  "/advanced/layer",
  advancedSpatialController.layer.bind(advancedSpatialController)
);

export default router;

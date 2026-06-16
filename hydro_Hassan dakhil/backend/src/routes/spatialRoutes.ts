import { Router } from "express";
import { spatialController } from "../controllers/spatialController";
import { advancedSpatialController } from "../controllers/advancedSpatialController";

const router = Router();

router.get("/barrages", spatialController.barrages.bind(spatialController));
router.get("/basins", spatialController.basins.bind(spatialController));
router.get("/subbasins", spatialController.subbasins.bind(spatialController));
router.get("/reaches", spatialController.reaches.bind(spatialController));
router.get("/stations", spatialController.stations.bind(spatialController));
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
  advancedSpatialController.debugRoot.bind(advancedSpatialController)
);
router.get(
  "/advanced/layer",
  advancedSpatialController.layer.bind(advancedSpatialController)
);

export default router;

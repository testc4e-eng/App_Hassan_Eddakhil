import { Router } from "express";
import { spatialController } from "../controllers/spatialController";

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

export default router;

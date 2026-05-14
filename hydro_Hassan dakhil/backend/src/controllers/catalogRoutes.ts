// backend/src/routes/catalogRoutes.ts
import { Router } from "express";
import { catalogController } from "../controllers/catalogController";

const router = Router();

// /api/v1/catalog/modules
router.get("/modules", (req, res, next) =>
  catalogController.getModules(req, res, next)
);

// /api/v1/catalog/modules/:moduleCode/properties
router.get("/modules/:moduleCode/properties", (req, res, next) =>
  catalogController.getModuleProperties(req, res, next)
);

// /api/v1/catalog/runs
router.get("/runs", (req, res, next) =>
  catalogController.getRuns(req, res, next)
);

// /api/v1/catalog/modules/:moduleCode/stations?runId=1
router.get("/modules/:moduleCode/stations", (req, res, next) =>
  catalogController.getStationsForModule(req, res, next)
);

export default router;

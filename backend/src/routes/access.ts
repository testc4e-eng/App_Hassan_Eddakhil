import { Router } from "express";
import { accessController } from "../controllers/accessController";

const router = Router();

router.get("/health", accessController.health.bind(accessController));
router.get("/summary", accessController.summary.bind(accessController));
router.get("/tables", accessController.tables.bind(accessController));
router.get("/variables", accessController.variables.bind(accessController));
router.get("/import-runs", accessController.importRuns.bind(accessController));
router.get("/entities", accessController.entities.bind(accessController));
router.get("/timeseries", accessController.timeseries.bind(accessController));
router.get("/stats", accessController.stats.bind(accessController));

export default router;

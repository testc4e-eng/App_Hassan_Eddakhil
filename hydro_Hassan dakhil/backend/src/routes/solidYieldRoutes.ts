import { Router } from "express";
import { solidYieldController } from "../controllers/solidYield.controller";

const router = Router();

router.get("/debug/diagnostic", solidYieldController.diagnostic.bind(solidYieldController));
router.get("/subbasins", solidYieldController.subbasins.bind(solidYieldController));
router.get("/availability", solidYieldController.availability.bind(solidYieldController));
router.get("/timeseries", solidYieldController.timeseries.bind(solidYieldController));
router.get("/stats", solidYieldController.stats.bind(solidYieldController));

export default router;

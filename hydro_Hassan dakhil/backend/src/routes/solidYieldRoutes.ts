import { Router } from "express";
import { solidYieldController } from "../controllers/solidYield.controller";
import { requireRole, verifyToken } from "../middleware/auth";

const router = Router();

router.get(
  "/debug/diagnostic",
  verifyToken,
  requireRole("ADMIN"),
  solidYieldController.diagnostic.bind(solidYieldController)
);
router.get("/subbasins", solidYieldController.subbasins.bind(solidYieldController));
router.get("/availability", solidYieldController.availability.bind(solidYieldController));
router.get("/timeseries", solidYieldController.timeseries.bind(solidYieldController));
router.get("/stats", solidYieldController.stats.bind(solidYieldController));

export default router;

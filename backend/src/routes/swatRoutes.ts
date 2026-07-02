import { Router } from "express";
import { swatController } from "../controllers/swatController";

const router = Router();

router.post("/import", swatController.import.bind(swatController));
router.get("/summary", swatController.summary.bind(swatController));
router.get("/batches", swatController.batches.bind(swatController));
router.get("/availability", swatController.availability.bind(swatController));
router.get("/data", swatController.data.bind(swatController));
router.delete("/delete-by-filter", swatController.deleteByFilter.bind(swatController));

router.get("/subbasins", swatController.subbasins.bind(swatController));
router.get("/reaches", swatController.reaches.bind(swatController));
router.get("/variables", swatController.variables.bind(swatController));
router.get("/timeseries", swatController.timeseries.bind(swatController));
router.get("/stats", swatController.stats.bind(swatController));

export default router;

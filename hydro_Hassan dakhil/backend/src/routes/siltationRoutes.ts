import { Router } from "express";
import { siltationController } from "../controllers/siltation.controller";

const router = Router();

router.get("/summary", siltationController.summary.bind(siltationController));
router.get("/indicators", siltationController.indicators.bind(siltationController));
router.get("/hsv", siltationController.hsv.bind(siltationController));
router.get("/evolution", siltationController.evolution.bind(siltationController));
router.get("/availability", siltationController.availability.bind(siltationController));
router.get("/bathymetry-campaigns", siltationController.bathymetryCampaigns.bind(siltationController));
router.get("/period-volumes", siltationController.periodVolumes.bind(siltationController));
router.get("/bathymetry", siltationController.bathymetry.bind(siltationController));
router.get("/export/excel", siltationController.exportExcel.bind(siltationController));
router.get("/export/pdf", siltationController.exportPdf.bind(siltationController));

export default router;

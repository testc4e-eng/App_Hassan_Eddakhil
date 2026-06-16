import { Router } from "express";
import { dataScanController } from "../controllers/dataScan.controller";

const router = Router();

router.get("/summary", dataScanController.summary.bind(dataScanController));
router.get("/tables", dataScanController.tables.bind(dataScanController));
router.get("/tables/:schema/:table", dataScanController.tableDetail.bind(dataScanController));
router.get("/anomalies", dataScanController.anomalies.bind(dataScanController));
router.get("/relations", dataScanController.relations.bind(dataScanController));
router.get("/periods/global", dataScanController.periodsGlobal.bind(dataScanController));
router.get("/periods/by-variable", dataScanController.periodsByVariable.bind(dataScanController));
router.get("/periods/by-entity", dataScanController.periodsByEntity.bind(dataScanController));
router.get(
  "/periods/by-entity-variable-source",
  dataScanController.periodsByEntityVariableSource.bind(dataScanController)
);
router.get("/data-availability", dataScanController.dataAvailability.bind(dataScanController));

export default router;

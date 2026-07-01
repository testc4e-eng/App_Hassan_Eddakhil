// backend/src/routes/adminDbConfig.routes.ts
import { Router } from "express";
import { adminDbConfigController } from "../controllers/adminDbConfig.controller";

const router = Router();

router.get(
  "/db-config",
  adminDbConfigController.getConfig.bind(adminDbConfigController)
);

router.post(
  "/db-config/test",
  adminDbConfigController.testConnection.bind(adminDbConfigController)
);

export default router;

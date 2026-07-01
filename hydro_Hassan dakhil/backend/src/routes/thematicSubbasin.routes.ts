// backend/src/routes/thematicSubbasin.routes.ts
import { Router } from "express";
import { thematicSubbasinController } from "../controllers/thematicSubbasin.controller";

const router = Router();

router.get(
  "/vulnerability",
  thematicSubbasinController.getVulnerability.bind(thematicSubbasinController)
);

export default router;

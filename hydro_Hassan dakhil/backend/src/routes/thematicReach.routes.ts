// backend/src/routes/thematicReach.routes.ts
import { Router } from "express";
import { thematicReachController } from "../controllers/thematicReach.controller";

const router = Router();

router.get(
  "/sediment",
  thematicReachController.getSediment.bind(thematicReachController)
);

export default router;

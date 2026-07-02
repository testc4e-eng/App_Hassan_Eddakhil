import { Router } from "express";
import { mapsController } from "../controllers/maps.controller";

const router = Router();

router.get("/stations-values", mapsController.getStationsValues.bind(mapsController));

export default router;

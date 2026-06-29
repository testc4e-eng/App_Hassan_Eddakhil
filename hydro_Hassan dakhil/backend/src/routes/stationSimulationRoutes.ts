import { Router } from "express";
import { stationSimulationController } from "../controllers/stationSimulationController";

const router = Router();

router.get(
  "/stations/:stationId/simulations",
  stationSimulationController.getStationSimulations.bind(stationSimulationController)
);

export default router;

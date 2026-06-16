import { Router } from "express";
import catalogRoutes from "./catalogRoutes";

const router = Router();

router.use("/catalog", catalogRoutes);

export default router;

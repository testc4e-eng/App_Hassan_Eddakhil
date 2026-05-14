import { Router } from "express";
import { adminUsersController } from "../controllers/adminUsersController";
import { requireRole, verifyToken } from "../middleware/auth";

const router = Router();

router.use(verifyToken, requireRole("ADMIN"));

router.get("/users", adminUsersController.list.bind(adminUsersController));
router.post("/users", adminUsersController.create.bind(adminUsersController));
router.put("/users/:id", adminUsersController.update.bind(adminUsersController));
router.patch("/users/:id/status", adminUsersController.updateStatus.bind(adminUsersController));
router.patch("/users/:id/reset-password", adminUsersController.resetPassword.bind(adminUsersController));
router.delete("/users/:id", adminUsersController.remove.bind(adminUsersController));

export default router;

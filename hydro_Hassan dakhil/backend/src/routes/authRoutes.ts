import { Router } from "express";
import rateLimit from "express-rate-limit";
import { authController } from "../controllers/authController";
import { verifyToken } from "../middleware/auth";

const router = Router();
const isProd = process.env.NODE_ENV === "production";

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProd ? 20 : 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: "Trop de tentatives, réessayez plus tard." },
});

router.post("/login", loginLimiter, authController.login.bind(authController));
router.get("/me", verifyToken, authController.me.bind(authController));
router.post("/change-password", verifyToken, authController.changePassword.bind(authController));
router.post("/logout", verifyToken, authController.logout.bind(authController));

export default router;

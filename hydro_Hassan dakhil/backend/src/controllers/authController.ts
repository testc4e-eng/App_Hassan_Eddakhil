import type { Request, Response } from "express";
import { authService } from "../services/auth.service";
import { changePasswordSchema, loginSchema } from "../schemas/auth.schemas";
import { AppError } from "../middleware/errorHandler";

export class AuthController {
  async login(req: Request, res: Response) {
    try {
      const { email, password } = loginSchema.parse(req.body);
      const data = await authService.login(email, password);
      res.json({ success: true, data });
    } catch (error) {
      const status = error instanceof AppError ? error.statusCode || 500 : 400;
      res.status(status).json({
        success: false,
        error: error instanceof AppError ? error.message : "Login invalide",
      });
    }
  }

  async me(req: Request, res: Response) {
    try {
      if (!req.user) {
        throw new AppError("Non autorisé", 401);
      }
      res.json({ success: true, data: { user: req.user, expiresIn: authService.getTokenExpiry() } });
    } catch (error) {
      res.status(error instanceof AppError ? error.statusCode || 500 : 500).json({
        success: false,
        error: error instanceof AppError ? error.message : "Impossible de récupérer le profil",
      });
    }
  }

  async changePassword(req: Request, res: Response) {
    try {
      if (!req.user) {
        throw new AppError("Non autorisé", 401);
      }

      const { oldPassword, newPassword } = changePasswordSchema.parse(req.body);
      const user = await authService.changePassword(req.user.id, oldPassword, newPassword);
      res.json({ success: true, data: { user } });
    } catch (error) {
      const status = error instanceof AppError ? error.statusCode || 500 : 400;
      res.status(status).json({
        success: false,
        error: error instanceof AppError ? error.message : "Impossible de modifier le mot de passe",
      });
    }
  }

  async logout(_req: Request, res: Response) {
    res.json({ success: true, data: { message: "Déconnecté" } });
  }
}

export const authController = new AuthController();

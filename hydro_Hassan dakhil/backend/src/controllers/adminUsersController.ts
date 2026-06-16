import type { Request, Response } from "express";
import { AppError } from "../middleware/errorHandler";
import {
  createUserSchema,
  resetPasswordSchema,
  statusSchema,
  updateUserSchema,
} from "../schemas/auth.schemas";
import { getSaltRounds } from "../services/auth.service";
import { usersService } from "../services/users.service";

export class AdminUsersController {
  async list(_req: Request, res: Response) {
    try {
      const data = await usersService.listUsers();
      res.json({ success: true, data, count: data.length });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Impossible de lister les utilisateurs",
      });
    }
  }

  async create(req: Request, res: Response) {
    try {
      const payload = createUserSchema.parse(req.body);
      const data = await usersService.createUser(payload, getSaltRounds());
      res.status(201).json({ success: true, data });
    } catch (error) {
      const status = error instanceof AppError ? error.statusCode || 500 : 400;
      res.status(status).json({
        success: false,
        error: error instanceof Error ? error.message : "Impossible de créer l'utilisateur",
      });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const payload = updateUserSchema.parse(req.body);
      const id = String(req.params.id);
      const data = await usersService.updateUser(id, payload);
      if (!data) {
        throw new AppError("Utilisateur introuvable", 404);
      }
      res.json({ success: true, data });
    } catch (error) {
      const status = error instanceof AppError ? error.statusCode || 500 : 400;
      res.status(status).json({
        success: false,
        error: error instanceof Error ? error.message : "Impossible de modifier l'utilisateur",
      });
    }
  }

  async updateStatus(req: Request, res: Response) {
    try {
      const { status } = statusSchema.parse(req.body);
      const id = String(req.params.id);
      const data = await usersService.updateStatus(id, status);
      if (!data) {
        throw new AppError("Utilisateur introuvable", 404);
      }
      res.json({ success: true, data });
    } catch (error) {
      const statusCode = error instanceof AppError ? error.statusCode || 500 : 400;
      res.status(statusCode).json({
        success: false,
        error: error instanceof Error ? error.message : "Impossible de changer le statut",
      });
    }
  }

  async resetPassword(req: Request, res: Response) {
    try {
      const { newPassword } = resetPasswordSchema.parse(req.body);
      const id = String(req.params.id);
      const data = await usersService.updatePassword(id, newPassword, getSaltRounds());
      if (!data) {
        throw new AppError("Utilisateur introuvable", 404);
      }
      res.json({ success: true, data: { user: data } });
    } catch (error) {
      const statusCode = error instanceof AppError ? error.statusCode || 500 : 400;
      res.status(statusCode).json({
        success: false,
        error: error instanceof Error ? error.message : "Impossible de réinitialiser le mot de passe",
      });
    }
  }

  async remove(req: Request, res: Response) {
    try {
      const removed = await usersService.deleteUser(String(req.params.id));
      if (!removed) {
        throw new AppError("Utilisateur introuvable", 404);
      }
      res.json({ success: true, data: { deleted: true } });
    } catch (error) {
      const statusCode = error instanceof AppError ? error.statusCode || 500 : 400;
      res.status(statusCode).json({
        success: false,
        error: error instanceof Error ? error.message : "Impossible de supprimer l'utilisateur",
      });
    }
  }
}

export const adminUsersController = new AdminUsersController();

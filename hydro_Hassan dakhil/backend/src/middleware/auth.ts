import type { NextFunction, Request, Response } from "express";
import { AppError } from "./errorHandler";
import { verifyAuthToken } from "../config/jwt.config";
import { usersService } from "../services/users.service";
import type { UserRole } from "../types/auth";

export async function verifyToken(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7).trim() : null;

    if (!token) {
      throw new AppError("Non autorisé", 401);
    }

    const payload = verifyAuthToken(token);
    if (!payload.sub) {
      throw new AppError("Non autorisé", 401);
    }

    const user = await usersService.findById(payload.sub);
    if (!user || user.status !== "ACTIVE") {
      throw new AppError("Non autorisé", 401);
    }

    req.user = {
      id: user.id,
      full_name: user.full_name,
      email: user.email,
      role: user.role,
      status: user.status,
      last_login: user.last_login,
      created_at: user.created_at,
      updated_at: user.updated_at,
    };

    next();
  } catch (error) {
    next(error instanceof AppError ? error : new AppError("Non autorisé", 401));
  }
}

export function requireRole(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError("Non autorisé", 401));
    }

    if (roles.length > 0 && !roles.includes(req.user.role)) {
      return next(new AppError("Accès interdit", 403));
    }

    return next();
  };
}

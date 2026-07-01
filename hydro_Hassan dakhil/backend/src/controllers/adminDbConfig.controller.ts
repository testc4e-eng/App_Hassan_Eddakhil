// backend/src/controllers/adminDbConfig.controller.ts
import { Request, Response, NextFunction } from "express";
import { adminDbConfigService, type DbConfig } from "../services/adminDbConfig.service";

function isDbConfigBody(body: unknown): body is DbConfig {
  if (!body || typeof body !== "object") return false;
  const b = body as Record<string, unknown>;
  return (
    typeof b.host === "string" &&
    typeof b.port === "number" &&
    typeof b.database === "string" &&
    typeof b.user === "string" &&
    typeof b.password === "string" &&
    typeof b.ssl === "boolean"
  );
}

export class AdminDbConfigController {
  async getConfig(req: Request, res: Response, next: NextFunction) {
    try {
      const config = adminDbConfigService.getCurrentConfig();
      return res.json({
        success: true,
        data: config,
        note: "La configuration effective provient des variables d'environnement au démarrage du backend.",
      });
    } catch (err) {
      next(err);
    }
  }

  async testConnection(req: Request, res: Response, next: NextFunction) {
    try {
      if (!isDbConfigBody(req.body)) {
        return res.status(400).json({
          success: false,
          error: "Payload invalide. Attendu : { host, port, database, user, password, ssl }",
        });
      }

      const result = await adminDbConfigService.testConnection(req.body);
      return res.status(result.success ? 200 : 400).json({
        success: result.success,
        message: result.message,
      });
    } catch (err) {
      next(err);
    }
  }
}

export const adminDbConfigController = new AdminDbConfigController();

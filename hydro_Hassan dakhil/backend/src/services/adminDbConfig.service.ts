// backend/src/services/adminDbConfig.service.ts
import { Pool } from "pg";

export type DbConfig = {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  ssl: boolean;
};

export type DbConfigPublic = {
  host: string;
  port: number;
  database: string;
  user: string;
  ssl: boolean;
};

function getEnvConfig(): DbConfig {
  return {
    host: process.env.DB_HOST || "",
    port: Number(process.env.DB_PORT || "0"),
    database: process.env.DB_NAME || "",
    user: process.env.DB_USER || "",
    password: process.env.DB_PASSWORD || "",
    ssl: process.env.DB_SSL === "true",
  };
}

export class AdminDbConfigService {
  getCurrentConfig(): DbConfigPublic {
    const config = getEnvConfig();
    return {
      host: config.host,
      port: config.port,
      database: config.database,
      user: config.user,
      ssl: config.ssl,
    };
  }

  async testConnection(config: DbConfig): Promise<{ success: boolean; message: string }> {
    const pool = new Pool({
      host: config.host,
      port: config.port,
      database: config.database,
      user: config.user,
      password: config.password,
      ssl: config.ssl ? { rejectUnauthorized: false } : false,
      connectionTimeoutMillis: 5000,
    });

    try {
      const client = await pool.connect();
      const result = await client.query("SELECT NOW() AS now");
      client.release();
      return {
        success: true,
        message: `Connexion réussie à ${config.database} sur ${config.host}:${config.port} (serveur: ${result.rows[0]?.now})`,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erreur inconnue";
      return {
        success: false,
        message: `Échec de connexion : ${message}`,
      };
    } finally {
      await pool.end();
    }
  }
}

export const adminDbConfigService = new AdminDbConfigService();

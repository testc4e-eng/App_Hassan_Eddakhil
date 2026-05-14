// src/services/database.service.ts
import db from "../config/database.config";
import { PoolClient } from "pg";

export class DatabaseService {
  private pool = db.getPool();

  async query<T = any>(text: string, params?: any[]): Promise<T[]> {
    try {
      const result = await this.pool.query(text, params);
      return result.rows;
    } catch (error) {
      console.error("Database query error:", error);

      // Gestion type-safe de l'erreur
      if (error instanceof Error) {
        throw new Error(`Database error: ${error.message}`);
      } else {
        throw new Error("Unknown database error occurred");
      }
    }
  }

  async queryOne<T = any>(text: string, params?: any[]): Promise<T | null> {
    const results = await this.query<T>(text, params);
    return results.length > 0 ? results[0] : null;
  }

  async execute(text: string, params?: any[]): Promise<number> {
    try {
      const result = await this.pool.query(text, params);
      return result.rowCount || 0;
    } catch (error) {
      console.error("Database execute error:", error);

      // Gestion type-safe
      if (error instanceof Error) {
        throw error;
      } else {
        throw new Error("Unknown database execution error");
      }
    }
  }

  async beginTransaction(): Promise<PoolClient> {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      return client;
    } catch (error) {
      client.release();
      throw error;
    }
  }

  async commitTransaction(client: PoolClient): Promise<void> {
    try {
      await client.query("COMMIT");
    } finally {
      client.release();
    }
  }

  async rollbackTransaction(client: PoolClient): Promise<void> {
    try {
      await client.query("ROLLBACK");
    } finally {
      client.release();
    }
  }
}

export const databaseService = new DatabaseService();

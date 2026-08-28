// src/services/database.service.ts
import db from "../config/database.config";
import { PoolClient } from "pg";

export class DatabaseService {
  private pool = db.getPool();
  private relationExistsCache = new Map<string, Promise<boolean>>();
  private slowQueryThresholdMs = Number(
    process.env.SLOW_QUERY_LOG_MS ??
      (process.env.NODE_ENV === "production" ? "0" : "1000")
  );

  private queryPreview(text: string): string {
    return text.replace(/\s+/g, " ").trim().slice(0, 220);
  }

  private logSlowQuery(args: {
    text: string;
    durationMs: number;
    rowCount?: number;
    error?: Error;
  }) {
    if (
      !Number.isFinite(this.slowQueryThresholdMs) ||
      this.slowQueryThresholdMs <= 0 ||
      args.durationMs < this.slowQueryThresholdMs
    ) {
      return;
    }

    console.warn("[db][slow-query]", {
      durationMs: args.durationMs,
      rowCount: args.rowCount ?? null,
      sql: this.queryPreview(args.text),
      error: args.error?.message ?? null,
    });
  }

  async query<T = any>(text: string, params?: any[]): Promise<T[]> {
    const startedAt = Date.now();
    try {
      const result = await this.pool.query(text, params);
      this.logSlowQuery({
        text,
        durationMs: Date.now() - startedAt,
        rowCount: result.rowCount ?? result.rows.length,
      });
      return result.rows;
    } catch (error) {
      this.logSlowQuery({
        text,
        durationMs: Date.now() - startedAt,
        error: error instanceof Error ? error : undefined,
      });
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

  async relationExists(regclassName: string): Promise<boolean> {
    const cached = this.relationExistsCache.get(regclassName);
    if (cached) return cached;

    const promise = this.queryOne<{ exists: boolean }>(
      `SELECT to_regclass($1) IS NOT NULL AS exists`,
      [regclassName]
    ).then((row) => Boolean(row?.exists)).catch((error) => {
      this.relationExistsCache.delete(regclassName);
      throw error;
    });

    this.relationExistsCache.set(regclassName, promise);
    return promise;
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

//src/config/database.config.ts

import { Pool, PoolConfig } from "pg";
import dotenv from "dotenv";
import { requireEnv, getEnvOrDefault } from "./env";

dotenv.config();

const dbConfig: PoolConfig = {
  host: requireEnv("DB_HOST"),
  port: parseInt(requireEnv("DB_PORT")),
  database: requireEnv("DB_NAME"),
  user: requireEnv("DB_USER"),
  password: requireEnv("DB_PASSWORD"),
  ssl: getEnvOrDefault("DB_SSL", "false") === "true" ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
};

class Database {
  private static instance: Database;
  private pool: Pool;

  private constructor() {
    this.pool = new Pool(dbConfig);

    this.pool.on("connect", () => {
      console.log("✅ Database connected successfully");
    });

    this.pool.on("error", (err) => {
      console.error("❌ Unexpected database error:", err);
    });
  }

  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  public getPool(): Pool {
    return this.pool;
  }

  public async testConnection(): Promise<boolean> {
    try {
      const client = await this.pool.connect();
      const result = await client.query("SELECT NOW()");
      client.release();
      console.log("📊 Database connection test successful:", result.rows[0]);
      return true;
    } catch (error) {
      console.error("❌ Database connection test failed:", error);
      return false;
    }
  }
}

export default Database.getInstance();

//src/config/database.config.ts

import { Pool, PoolConfig } from "pg";
import dotenv from "dotenv";

dotenv.config();

const dbConfig: PoolConfig = {
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "5432"),
  database: process.env.DB_NAME || "hydro_hd_1714",
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "",
  ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
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

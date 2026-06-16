require("dotenv").config();
const { Pool } = require("pg");

const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: Number.parseInt(process.env.DB_PORT || "5432", 10),
  database: process.env.DB_NAME || "hydro_hd_1714",
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "",
  ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
});

const seedPasswordHash =
  "$2b$12$CqPlxY1FKB3SNHgBVdeR7eCgV7xXUGgsS5Ct71wl75AOzFIUOdJl.";

const users = [
  {
    full_name: "C4E Admin",
    email: "c4e.africa@gmail.com",
    password_hash: seedPasswordHash,
    role: "ADMIN",
    status: "ACTIVE",
  },
  {
    full_name: "Ilham Qaidouh",
    email: "ilhamqaidouh@gmail.com",
    password_hash: seedPasswordHash,
    role: "USER",
    status: "ACTIVE",
  },
];

async function ensureTable() {
  await pool.query(`
    CREATE EXTENSION IF NOT EXISTS pgcrypto;
    CREATE TABLE IF NOT EXISTS public.users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      full_name VARCHAR(150) NOT NULL,
      email VARCHAR(150) UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role VARCHAR(20) NOT NULL CHECK (role IN ('ADMIN', 'USER')),
      status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
      last_login TIMESTAMP NULL,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);
}

async function seed() {
  await ensureTable();

  for (const user of users) {
    await pool.query(
      `
        INSERT INTO public.users (full_name, email, password_hash, role, status)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (email)
        DO UPDATE SET
          full_name = EXCLUDED.full_name,
          password_hash = EXCLUDED.password_hash,
          role = EXCLUDED.role,
          status = EXCLUDED.status,
          updated_at = NOW()
      `,
      [user.full_name, user.email.toLowerCase(), user.password_hash, user.role, user.status]
    );
  }

  console.log("Seed utilisateurs terminé.");
}

seed()
  .catch((error) => {
    console.error("Seed utilisateurs échoué:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });

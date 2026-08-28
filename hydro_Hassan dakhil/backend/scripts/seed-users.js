require("./load-env");
const bcrypt = require("bcrypt");
const { Pool } = require("pg");

const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number.parseInt(process.env.DB_PORT, 10),
  database: process.env.DB_NAME || process.env.HDI_DB_NAME,
  user: process.env.DB_USER || process.env.POSTGRES_USER,
  password: process.env.DB_PASSWORD || process.env.POSTGRES_PASSWORD,
  ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
});

const adminEmail = process.env.SEED_ADMIN_EMAIL;
const userEmail = process.env.SEED_USER_EMAIL;

function getSaltRounds() {
  const parsed = Number.parseInt(process.env.BCRYPT_SALT_ROUNDS || "12", 10);
  return Number.isFinite(parsed) ? Math.max(parsed, 10) : 12;
}

function isValidBcryptHash(value) {
  return /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/.test(value);
}

async function resolveSeedPasswordHash() {
  const seedPassword = process.env.SEED_USER_PASSWORD?.trim();
  const seedPasswordHash = process.env.SEED_USER_PASSWORD_HASH?.trim();

  if (seedPassword) {
    return bcrypt.hash(seedPassword, getSaltRounds());
  }

  if (seedPasswordHash && isValidBcryptHash(seedPasswordHash)) {
    return seedPasswordHash;
  }

  console.error(
    "Seed utilisateurs echoue : fournissez SEED_USER_PASSWORD ou un SEED_USER_PASSWORD_HASH bcrypt valide."
  );
  process.exitCode = 1;
  return null;
}

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

  const seedPasswordHash = await resolveSeedPasswordHash();
  if (!seedPasswordHash) {
    return;
  }

  if (!adminEmail || !userEmail) {
    console.error(
      "Seed utilisateurs echoue : SEED_ADMIN_EMAIL et SEED_USER_EMAIL sont requis."
    );
    process.exitCode = 1;
    return;
  }

  const users = [
    {
      full_name: "C4E Admin",
      email: adminEmail,
      password_hash: seedPasswordHash,
      role: "ADMIN",
      status: "ACTIVE",
    },
    {
      full_name: "Ilham Qaidouh",
      email: userEmail,
      password_hash: seedPasswordHash,
      role: "USER",
      status: "ACTIVE",
    },
  ];

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

  console.log("Seed utilisateurs termine.");
}

seed()
  .catch((error) => {
    console.error("Seed utilisateurs echoue:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });

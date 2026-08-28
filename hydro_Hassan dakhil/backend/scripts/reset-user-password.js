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

function getSaltRounds() {
  const parsed = Number.parseInt(process.env.BCRYPT_SALT_ROUNDS || "12", 10);
  return Number.isFinite(parsed) ? Math.max(parsed, 10) : 12;
}

function printHelp() {
  console.log(`Usage:
  npm run auth:reset-password -- --email user@example.com --password "NewPassword123"

Options:
  --email       User email to update
  --password    New plain-text password
  --dry-run     Validate the target account without changing the password

Environment fallback:
  AUTH_RESET_EMAIL
  AUTH_RESET_PASSWORD
`);
}

function readArg(name) {
  const index = process.argv.indexOf(name);
  if (index === -1) return null;
  return process.argv[index + 1] || null;
}

async function main() {
  if (process.argv.includes("--help") || process.argv.includes("-h")) {
    printHelp();
    return;
  }

  const dryRun = process.argv.includes("--dry-run");
  const email = (readArg("--email") || process.env.AUTH_RESET_EMAIL || "").trim().toLowerCase();
  const password = (readArg("--password") || process.env.AUTH_RESET_PASSWORD || "").trim();

  if (!email || (!password && !dryRun)) {
    printHelp();
    throw new Error("Email is required, and password is required unless --dry-run is used.");
  }

  const existingUser = await pool.query(
    `
      SELECT id, email, role, status, updated_at
      FROM public.users
      WHERE LOWER(email) = LOWER($1)
      LIMIT 1
    `,
    [email]
  );

  if (!existingUser.rows[0]) {
    throw new Error(`User not found: ${email}`);
  }

  if (dryRun) {
    console.log(
      JSON.stringify(
        {
          success: true,
          dryRun: true,
          user: existingUser.rows[0],
        },
        null,
        2
      )
    );
    return;
  }

  const passwordHash = await bcrypt.hash(password, getSaltRounds());
  const result = await pool.query(
    `
      UPDATE public.users
      SET password_hash = $2,
          updated_at = NOW()
      WHERE LOWER(email) = LOWER($1)
      RETURNING id, email, role, status, updated_at
    `,
    [email, passwordHash]
  );

  console.log(
    JSON.stringify(
      {
        success: true,
        user: result.rows[0],
      },
      null,
      2
    )
  );
}

main()
  .catch((error) => {
    console.error(error.stack || error.message || String(error));
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });

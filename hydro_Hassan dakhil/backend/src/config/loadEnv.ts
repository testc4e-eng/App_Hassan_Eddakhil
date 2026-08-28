import dotenv from "dotenv";
import path from "path";

let envLoaded = false;

function applyEnvAliases() {
  if (!process.env.HDI_DB_NAME && process.env.DB_NAME) {
    process.env.HDI_DB_NAME = process.env.DB_NAME;
  }
  if (!process.env.DB_NAME && process.env.HDI_DB_NAME) {
    process.env.DB_NAME = process.env.HDI_DB_NAME;
  }
  if (!process.env.DB_NAME && process.env.POSTGRES_DB) {
    process.env.DB_NAME = process.env.POSTGRES_DB;
  }
  if (!process.env.DB_USER && process.env.POSTGRES_USER) {
    process.env.DB_USER = process.env.POSTGRES_USER;
  }
  if (!process.env.DB_PASSWORD && process.env.POSTGRES_PASSWORD) {
    process.env.DB_PASSWORD = process.env.POSTGRES_PASSWORD;
  }
}

export function loadBackendEnv() {
  if (envLoaded) {
    return;
  }

  const backendDir = __dirname.includes(`${path.sep}dist${path.sep}`)
    ? path.resolve(__dirname, "..", "..", "..")
    : path.resolve(__dirname, "..", "..");
  const workspaceRoot = path.resolve(backendDir, "..", "..");

  dotenv.config({
    path: path.join(workspaceRoot, ".env"),
    override: false,
    quiet: true,
  });

  dotenv.config({
    path: path.join(backendDir, ".env"),
    override: true,
    quiet: true,
  });

  applyEnvAliases();
  envLoaded = true;
}

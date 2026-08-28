const path = require("path");
const dotenv = require("dotenv");

let loaded = false;

function applyAliases() {
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

function loadBackendScriptEnv() {
  if (loaded) return;

  const backendDir = path.resolve(__dirname, "..");
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

  applyAliases();
  loaded = true;
}

loadBackendScriptEnv();

module.exports = {
  loadBackendScriptEnv,
};

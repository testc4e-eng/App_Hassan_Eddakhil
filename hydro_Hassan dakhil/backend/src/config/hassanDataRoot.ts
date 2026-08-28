import fs from "fs";
import path from "path";

export function resolveHassanDataRoot(rawRoot?: string | null) {
  const raw = String(rawRoot ?? process.env.HASSAN_DATA_ROOT ?? "").trim();
  const isProd = String(process.env.NODE_ENV ?? "").trim().toLowerCase() === "production";
  const resolved = raw
    ? path.isAbsolute(raw)
      ? raw
      : path.resolve(process.cwd(), raw)
    : isProd
      ? ""
      : path.resolve(process.cwd(), "..", "hassan dakhil");

  return {
    raw,
    resolved,
    exists: Boolean(resolved) && fs.existsSync(resolved),
  };
}

export function getProjectRoot() {
  return path.resolve(process.cwd(), "..");
}


import fs from "fs";
import path from "path";

export function resolveHassanDataRoot(rawRoot?: string | null) {
  const raw = String(rawRoot ?? process.env.HASSAN_DATA_ROOT ?? "").trim();
  const resolved = raw
    ? path.isAbsolute(raw)
      ? raw
      : path.resolve(process.cwd(), raw)
    : path.resolve(process.cwd(), "..", "hassan dakhil");

  return {
    raw,
    resolved,
    exists: fs.existsSync(resolved),
  };
}

export function getProjectRoot() {
  return path.resolve(process.cwd(), "..");
}


import jwt from "jsonwebtoken";
import type { AuthTokenPayload } from "../types/auth";
import { getEnvOrDefault, isWeakSecret, requireEnv, warnIfWeakSecret } from "./env";

const JWT_SECRET = requireEnv("JWT_SECRET");
const JWT_EXPIRES_IN = getEnvOrDefault("JWT_EXPIRES_IN", "8h");
const isProd = String(process.env.NODE_ENV ?? "").trim().toLowerCase() === "production";

if (isProd && isWeakSecret(JWT_SECRET)) {
  throw new Error("JWT_SECRET must be replaced with a strong non-placeholder value in production");
}

warnIfWeakSecret("JWT_SECRET");

export function signAuthToken(payload: AuthTokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"],
  });
}

export function verifyAuthToken(token: string): AuthTokenPayload {
  const decoded = jwt.verify(token, JWT_SECRET);
  if (!decoded || typeof decoded === "string") {
    throw new Error("Invalid token");
  }

  const payload = decoded as jwt.JwtPayload;
  return {
    sub: String(payload.sub || ""),
    email: String(payload.email || ""),
    role: (payload.role as AuthTokenPayload["role"]) || "USER",
  };
}

export { JWT_EXPIRES_IN };

import jwt from "jsonwebtoken";
import type { AuthTokenPayload } from "../types/auth";

const JWT_SECRET = process.env.JWT_SECRET || "change_me_strong_secret";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "8h";

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

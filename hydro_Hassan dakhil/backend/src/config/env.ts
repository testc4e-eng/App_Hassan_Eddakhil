// src/config/env.ts
/**
 * Helpers for reading environment variables.
 * All secrets and environment-specific values must come from env vars,
 * never from hardcoded fallbacks.
 */

export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value || value.trim() === "") {
    throw new Error(`Environment variable ${name} is required`);
  }
  return value;
}

export function getEnvOrDefault(name: string, defaultValue: string): string {
  const value = process.env[name];
  if (!value || value.trim() === "") {
    return defaultValue;
  }
  return value;
}

export function getEnvOrDefaultNumber(name: string, defaultValue: number): number {
  const value = process.env[name];
  if (!value || value.trim() === "") {
    return defaultValue;
  }
  const parsed = Number(value);
  if (Number.isNaN(parsed)) {
    throw new Error(`Environment variable ${name} must be a valid number`);
  }
  return parsed;
}

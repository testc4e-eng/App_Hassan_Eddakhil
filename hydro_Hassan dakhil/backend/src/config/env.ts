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

export function requireEnvAny(...names: string[]): string {
  for (const name of names) {
    const value = process.env[name];
    if (value && value.trim() !== "") {
      return value;
    }
  }
  throw new Error(`One of the environment variables ${names.join(", ")} is required`);
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

export function getEnvOrDefaultBoolean(name: string, defaultValue: boolean): boolean {
  const value = process.env[name];
  if (!value || value.trim() === "") {
    return defaultValue;
  }

  switch (value.trim().toLowerCase()) {
    case "1":
    case "true":
    case "yes":
    case "on":
      return true;
    case "0":
    case "false":
    case "no":
    case "off":
      return false;
    default:
      return defaultValue;
  }
}

export function isWeakSecret(value: string, minLength = 32): boolean {
  const normalized = value.trim().toLowerCase();
  return (
    normalized.length < minLength ||
    normalized.includes("change_me") ||
    normalized.includes("default") ||
    normalized.includes("secret") && normalized.length < minLength + 8
  );
}

export function warnIfWeakSecret(name: string, minLength = 32): void {
  const value = process.env[name];
  if (!value || value.trim() === "") {
    return;
  }
  if (!isWeakSecret(value, minLength)) {
    return;
  }

  console.warn(
    `[config][warning] ${name} appears weak or placeholder-like. Replace it in local environment configuration.`
  );
}

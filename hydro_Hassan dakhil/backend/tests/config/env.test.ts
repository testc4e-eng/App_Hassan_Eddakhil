import { describe, expect, it } from "vitest";
import {
  getEnvOrDefault,
  getEnvOrDefaultNumber,
  requireEnv,
  requireEnvAny,
} from "../../src/config/env";

describe("backend config/env", () => {
  it("reads required environment variables", () => {
    process.env.Q0_ENV_REQUIRED = "configured";

    expect(requireEnv("Q0_ENV_REQUIRED")).toBe("configured");
  });

  it("reads the first available variable in requireEnvAny", () => {
    delete process.env.Q0_ENV_ANY_A;
    process.env.Q0_ENV_ANY_B = "fallback";

    expect(requireEnvAny("Q0_ENV_ANY_A", "Q0_ENV_ANY_B")).toBe("fallback");
  });

  it("returns defaults for empty values", () => {
    process.env.Q0_ENV_DEFAULT = "";

    expect(getEnvOrDefault("Q0_ENV_DEFAULT", "default-value")).toBe("default-value");
    expect(getEnvOrDefaultNumber("Q0_ENV_DEFAULT_NUMBER", 42)).toBe(42);
  });

  it("throws when a numeric env var is invalid", () => {
    process.env.Q0_ENV_BAD_NUMBER = "not-a-number";

    expect(() => getEnvOrDefaultNumber("Q0_ENV_BAD_NUMBER", 1)).toThrow(
      "Environment variable Q0_ENV_BAD_NUMBER must be a valid number"
    );
  });
});

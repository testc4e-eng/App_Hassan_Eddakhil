import { describe, expect, it } from "vitest";
import { AppError, errorHandler } from "../../src/middleware/errorHandler";

describe("backend middleware/errorHandler", () => {
  it("returns a structured error envelope", () => {
    const req = {
      path: "/api/v1/hydro/swat/import",
      method: "POST",
    } as never;
    const res = {
      statusCode: 200,
      body: undefined as unknown,
      status(code: number) {
        this.statusCode = code;
        return this;
      },
      json(payload: unknown) {
        this.body = payload;
        return this;
      },
    };

    errorHandler(new AppError("Non autorisé", 401), req, res as never, (() => undefined) as never);

    expect(res.statusCode).toBe(401);
    expect(res.body).toEqual({
      success: false,
      error: "Non autorisé",
    });
  });
});

import request from "supertest";
import { afterEach, describe, expect, it, vi } from "vitest";
import app from "../../src/app";

describe("backend http/app", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns the API root payload", async () => {
    const response = await request(app).get("/");

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      success: true,
      message: "Hydro HD API",
      version: "1.0.0",
    });
  });

  it("returns the simple hydro health endpoint without hitting the DB", async () => {
    const response = await request(app).get("/api/v1/hydro/test/health");

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      success: true,
      service: "Hydro API",
      database: "connected",
      message: "API is running",
    });
  });

  it("returns 401 on /api/auth/me when no token is provided", async () => {
    const response = await request(app).get("/api/auth/me");

    expect(response.status).toBe(401);
    expect(response.body).toMatchObject({
      success: false,
      error: "Non autorisé",
    });
  });

  it("returns 401 on /api/v1/admin/db-config without a token", async () => {
    const response = await request(app).get("/api/v1/admin/db-config");

    expect(response.status).toBe(401);
    expect(response.body).toMatchObject({
      success: false,
      error: "Non autorisé",
    });
    expect(response.body).not.toHaveProperty("stack");
  });

  it("returns 401 on /api/v1/admin/db-config/test without a token", async () => {
    const response = await request(app).post("/api/v1/admin/db-config/test").send({
      host: "127.0.0.1",
      port: 5432,
      database: "hydro_hd",
      user: "postgres",
      password: "probe",
      ssl: false,
    });

    expect(response.status).toBe(401);
    expect(response.body).toMatchObject({
      success: false,
      error: "Non autorisé",
    });
  });

  it("returns 401 on /api/v1/hydro/swat/import when no token is provided", async () => {
    const response = await request(app)
      .post("/api/v1/hydro/swat/import")
      .send({ importMode: "preview" });

    expect(response.status).toBe(401);
    expect(response.body).toMatchObject({
      success: false,
      error: "Non autorisé",
    });
  });

  it("returns a 404 envelope for unknown routes", async () => {
    const response = await request(app).get("/api/v1/does-not-exist");

    expect(response.status).toBe(404);
    expect(response.body).toMatchObject({
      success: false,
    });
    expect(String(response.body.error)).toContain("Route /api/v1/does-not-exist not found");
  });
});

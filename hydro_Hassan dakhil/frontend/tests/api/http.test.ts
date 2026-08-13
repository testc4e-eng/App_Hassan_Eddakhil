import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError, getApiBase, httpGet } from "../../src/api/http";

describe("frontend api/http", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  it("falls back to /api/v1 when no env override exists", () => {
    expect(getApiBase()).toBe("/api/v1");
  });

  it("returns envelope data and forwards query params", async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      statusText: "OK",
      text: async () => JSON.stringify({ success: true, data: { station: 7 } }),
    } as Response);

    const data = await httpGet<{ station: number }>("/hydro/stations", {
      stationId: 7,
      module: "hydro",
      empty: "",
    });

    expect(data).toEqual({ station: 7 });
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/api/v1/hydro/stations?stationId=7&module=hydro"),
      expect.objectContaining({ method: "GET" })
    );
  });

  it("throws ApiError on non-ok responses with API payload details", async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 412,
      statusText: "Precondition Failed",
      text: async () => JSON.stringify({ success: false, error: "SWAT MDB source unavailable." }),
    } as Response);

    await expect(httpGet("/hydro/swat/import")).rejects.toMatchObject<ApiError>({
      name: "ApiError",
      status: 412,
      message: "SWAT MDB source unavailable.",
    });
  });

  it("throws ApiError when a successful HTTP response contains a failed API envelope", async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      statusText: "OK",
      text: async () => JSON.stringify({ success: false, error: "Invalid payload" }),
    } as Response);

    await expect(httpGet("/hydro/swat/import")).rejects.toMatchObject<ApiError>({
      name: "ApiError",
      status: 200,
      message: "Invalid payload",
    });
  });
});

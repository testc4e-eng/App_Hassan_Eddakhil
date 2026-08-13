import { describe, expect, it, vi } from "vitest";

const { httpGetMock } = vi.hoisted(() => ({
  httpGetMock: vi.fn(),
}));

vi.mock("../../src/api/http", () => ({
  httpGet: httpGetMock,
}));

import { apiGet, qs } from "../../src/api/client";

describe("frontend api/client", () => {
  it("builds a query string and ignores empty values", () => {
    expect(
      qs({
        stationId: 12,
        module: "hydro",
        empty: "",
        nil: null,
        undef: undefined,
      })
    ).toBe("?stationId=12&module=hydro");
  });

  it("returns an empty query string when every value is empty", () => {
    expect(qs({ a: "", b: null, c: undefined })).toBe("");
  });

  it("normalizes the path before delegating to httpGet", async () => {
    httpGetMock.mockResolvedValueOnce({ ok: true });

    await apiGet("hydro/stations");

    expect(httpGetMock).toHaveBeenCalledWith("/hydro/stations");
  });
});

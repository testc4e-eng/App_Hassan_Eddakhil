import { describe, expect, it, vi } from "vitest";
import { TtlCache } from "../../src/utils/ttlCache";

describe("backend utils/ttlCache", () => {
  it("returns cached values before expiration", () => {
    vi.useFakeTimers();
    const cache = new TtlCache<number>();

    cache.set("count", 7, 1000);

    expect(cache.get("count")).toBe(7);
    vi.useRealTimers();
  });

  it("deduplicates concurrent factories", async () => {
    const cache = new TtlCache<number>();
    const factory = vi.fn(async () => 99);

    const [a, b] = await Promise.all([
      cache.getOrSet("shared", 1000, factory),
      cache.getOrSet("shared", 1000, factory),
    ]);

    expect(a).toBe(99);
    expect(b).toBe(99);
    expect(factory).toHaveBeenCalledTimes(1);
  });
});

import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useDebouncedValue } from "../../src/lib/useDebouncedValue";

describe("frontend lib/useDebouncedValue", () => {
  it("updates the debounced value only after the delay", () => {
    vi.useFakeTimers();

    const { result, rerender } = renderHook(
      ({ value, delayMs }) => useDebouncedValue(value, delayMs),
      {
        initialProps: { value: "initial", delayMs: 200 },
      }
    );

    expect(result.current).toBe("initial");

    rerender({ value: "updated", delayMs: 200 });
    expect(result.current).toBe("initial");

    act(() => {
      vi.advanceTimersByTime(200);
    });

    expect(result.current).toBe("updated");
    vi.useRealTimers();
  });
});

import { describe, expect, it } from "vitest";
import { formatVnd } from "@/lib/money";

describe("formatVnd", () => {
  it("groups thousands with dots, Vietnamese style", () => {
    expect(formatVnd(1_500_000)).toBe("1.500.000₫");
    expect(formatVnd(240_000)).toBe("240.000₫");
    expect(formatVnd(0)).toBe("0₫");
  });

  it("rejects fractional amounts", () => {
    expect(() => formatVnd(1000.5)).toThrow();
  });
});

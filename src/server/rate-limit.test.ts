import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/headers", () => ({ headers: async () => new Headers() }));

import { allow, allowForm, HOUR_MS, LIMITS, resetRateLimits } from "./rate-limit";

describe("rate limits", () => {
  beforeEach(() => resetRateLimits());

  it("allows up to the limit, then refuses until the window ends", () => {
    const t = 1_000_000;
    for (let i = 0; i < 3; i++) expect(allow("k", 3, HOUR_MS, t)).toBe(true);
    expect(allow("k", 3, HOUR_MS, t + 1)).toBe(false);
    expect(allow("k", 3, HOUR_MS, t + HOUR_MS)).toBe(true);
  });

  it("limits each visitor to 5 booking requests an hour", () => {
    const t = 1_000_000;
    for (let i = 0; i < LIMITS.booking.ip; i++)
      expect(allowForm("booking", "1.1.1.1", t)).toBe(true);
    expect(allowForm("booking", "1.1.1.1", t)).toBe(false);
    // Another visitor still gets through.
    expect(allowForm("booking", "2.2.2.2", t)).toBe(true);
  });

  it("caps booking requests for the whole site", () => {
    const t = 1_000_000;
    for (let i = 0; i < LIMITS.booking.all; i++) {
      expect(allowForm("booking", `10.0.0.${i}`, t)).toBe(true);
    }
    expect(allowForm("booking", "10.0.1.1", t)).toBe(false);
    // Enquiries have their own counts.
    expect(allowForm("enquiry", "10.0.1.1", t)).toBe(true);
  });

  it("doesn't count a refused attempt against the site-wide cap", () => {
    const t = 1_000_000;
    for (let i = 0; i < 5; i++) allowForm("booking", "1.1.1.1", t);
    for (let i = 0; i < 50; i++) expect(allowForm("booking", "1.1.1.1", t)).toBe(false);
    // 5 counted site-wide, so 15 more visitors fit.
    for (let i = 0; i < 15; i++) expect(allowForm("booking", `10.0.0.${i}`, t)).toBe(true);
    expect(allowForm("booking", "10.0.2.1", t)).toBe(false);
  });
});

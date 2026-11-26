import { describe, expect, it } from "vitest";
import { SECURITY_HEADERS, securityHeaders } from "./security-headers";

describe("security headers", () => {
  const byKey = Object.fromEntries(SECURITY_HEADERS.map((h) => [h.key, h.value]));

  it("applies to every address", () => {
    expect(securityHeaders()).toEqual([{ source: "/:path*", headers: SECURITY_HEADERS }]);
  });

  it("sends HSTS without preload or subdomains (hard to undo)", () => {
    expect(byKey["Strict-Transport-Security"]).toBe("max-age=31536000");
  });

  it("blocks framing by other sites", () => {
    expect(byKey["Content-Security-Policy"]).toBe("frame-ancestors 'self'");
    expect(byKey["X-Frame-Options"]).toBe("SAMEORIGIN");
  });

  it("sets nosniff, referrer and permissions rules", () => {
    expect(byKey["X-Content-Type-Options"]).toBe("nosniff");
    expect(byKey["Referrer-Policy"]).toBe("strict-origin-when-cross-origin");
    expect(byKey["Permissions-Policy"]).toContain("camera=()");
  });

  it("has no duplicate header", () => {
    expect(new Set(SECURITY_HEADERS.map((h) => h.key)).size).toBe(SECURITY_HEADERS.length);
  });
});

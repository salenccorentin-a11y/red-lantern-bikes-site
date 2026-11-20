// Limits on the public forms, so a script can't fill the fleet with fake
// booking requests or use the site to send hundreds of emails.
//
// Counts live in memory: the site runs as one Railway service, and a restart
// only clears the counts (a few minutes of extra allowance at most).

import { headers } from "next/headers";

type Window = { start: number; count: number };

const windows = new Map<string, Window>();
let lastSweep = 0;

/**
 * Counts one attempt under `key` and says whether it is allowed: at most
 * `limit` attempts per `windowMs`. A refused attempt is not counted.
 */
export function allow(key: string, limit: number, windowMs: number, now = Date.now()): boolean {
  sweep(now);
  const w = windows.get(key);
  if (!w || now - w.start >= windowMs) {
    windows.set(key, { start: now, count: 1 });
    return true;
  }
  if (w.count >= limit) return false;
  w.count += 1;
  return true;
}

/** True when every check passes; counts an attempt only if all of them do. */
export function allowAll(
  checks: { key: string; limit: number; windowMs: number }[],
  now = Date.now(),
): boolean {
  sweep(now);
  const full = checks.some(({ key, limit, windowMs }) => {
    const w = windows.get(key);
    return w !== undefined && now - w.start < windowMs && w.count >= limit;
  });
  if (full) return false;
  for (const { key, limit, windowMs } of checks) allow(key, limit, windowMs, now);
  return true;
}

/** Drops finished windows once in a while so the map can't grow forever. */
function sweep(now: number) {
  if (now - lastSweep < 10 * 60_000) return;
  lastSweep = now;
  for (const [key, w] of windows) {
    if (now - w.start > DAY_MS) windows.delete(key);
  }
}

/** Clears every count (tests only). */
export function resetRateLimits() {
  windows.clear();
  lastSweep = 0;
}

export const HOUR_MS = 3_600_000;
export const DAY_MS = 24 * HOUR_MS;

/** Limits per form. "ip" is per connection, "all" is for the whole site. */
export const LIMITS = {
  booking: { ip: 5, all: 20, windowMs: HOUR_MS },
  enquiry: { ip: 5, all: 20, windowMs: HOUR_MS },
  staffLogin: { ip: 10, all: 50, windowMs: HOUR_MS },
} as const;

/** One form submission: allowed if both the visitor's and the site-wide count have room. */
export function allowForm(form: keyof typeof LIMITS, ip: string, now = Date.now()): boolean {
  const l = LIMITS[form];
  const checks: { key: string; limit: number; windowMs: number }[] = [
    { key: `${form}:all`, limit: l.all, windowMs: l.windowMs },
  ];
  // Without a known address, every visitor would share one count: use the
  // site-wide cap only.
  if (ip !== "unknown") checks.push({ key: `${form}:ip:${ip}`, limit: l.ip, windowMs: l.windowMs });
  return allowAll(checks, now);
}

/**
 * The visitor's address. Railway's proxy sets X-Real-IP to the address that
 * connected; X-Forwarded-For's first entry is the fallback. Never stored.
 */
export async function clientIp(): Promise<string> {
  const h = await headers();
  const real = h.get("x-real-ip")?.trim();
  if (real) return real;
  const forwarded = h.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || "unknown";
}

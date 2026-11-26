// Security headers sent with every response (next.config.ts → headers()).
//
// Added 2026-11-26 after the Cloudflare audit: www is "DNS only" on
// Cloudflare, so Cloudflare's own HSTS switch never reaches it and the site
// has to send these itself.
//
// Kept deliberately small. No full Content-Security-Policy: the site loads
// Google Maps, Umami and Sentry, and a strict CSP would need nonces on every
// page. Only `frame-ancestors` is set, which stops other sites from showing
// ours in a frame (clickjacking) without touching what the pages load.

type Header = { key: string; value: string };

export const SECURITY_HEADERS: Header[] = [
  // Browsers remember for a year to use https only. No `preload` and no
  // `includeSubDomains`: both are hard to undo and add nothing on www.
  { key: "Strict-Transport-Security", value: "max-age=31536000" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Only our own pages may put the site in a frame. X-Frame-Options is the
  // older form of the same rule, for old browsers.
  { key: "Content-Security-Policy", value: "frame-ancestors 'self'" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  // The site never uses the camera, microphone or location.
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
];

/** The rule for next.config.ts: every address gets the headers. */
export function securityHeaders() {
  return [{ source: "/:path*", headers: SECURITY_HEADERS }];
}

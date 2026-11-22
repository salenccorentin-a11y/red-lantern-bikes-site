import type { NextConfig } from "next";
import { oldSiteRedirects } from "./src/seo/redirects";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  images: {
    // 75 is the default for every photo. 60 is used only for the tall home
    // photo on phones, whose lower part sits under the night gradient.
    qualities: [60, 75],
  },
  experimental: {
    // CSS as separate files, cached across pages (was inlined until
    // 2026-11-22). Inlining put every style, the booking page's included,
    // into each page twice: home HTML 101 KB → 65 KB gzipped, /book 52 → 21 KB,
    // for about 13 KB of CSS fetched once.
    inlineCss: false,
    // Two root layouts (English, and /fr + /ko, each with its own <html lang>),
    // so the 404 for unknown addresses is its own page: app/global-not-found.tsx.
    globalNotFound: true,
    // Set by `next upgrade --agent=security` (16.4.3 → 16.4.6, 2026-11-17).
    agentUpgrade: "security",
  },
  // Old Odoo addresses → new pages, as permanent 301s (src/seo/redirects.ts).
  async redirects() {
    return oldSiteRedirects();
  },
};

export default nextConfig;

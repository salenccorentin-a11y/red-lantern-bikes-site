import type { NextConfig } from "next";
import { oldSiteRedirects } from "./src/seo/redirects";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  experimental: {
    // Puts the (small) CSS in the page instead of a separate file, so phones on
    // slow connections can paint sooner. Most visitors are first-time tourists.
    inlineCss: true,
  },
  // Old Odoo addresses → new pages, as permanent 301s (src/seo/redirects.ts).
  async redirects() {
    return oldSiteRedirects();
  },
};

export default nextConfig;

// The site's public address, used for the sitemap, robots.txt, canonical
// links and structured data. Set SITE_URL in production to
// https://www.redlanternbikes.com (the old site's main address).

export function siteUrl(): string {
  return (process.env.SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

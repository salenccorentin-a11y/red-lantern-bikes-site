// Records every page of the old Odoo site before it's switched off: address,
// status, redirect target, title, meta description, canonical and main
// heading. Starts from the old sitemap and the home page in every language,
// then follows internal links.
//
//   npx tsx scripts/seo/crawl-old-site.ts
//
// Writes docs/seo/old-site-crawl.json. Polite: a few requests at a time.

import { writeFileSync, mkdirSync } from "node:fs";
import * as cheerio from "cheerio";

const ORIGIN = "https://www.redlanternbikes.com";
const LANGS = ["vi", "fr", "nl", "ja", "ko_KR", "zh_CN"];
const MAX_PAGES = 800;
const CONCURRENCY = 3;

// Odoo URLs that are actions or assets, not pages.
const SKIP = [
  /^\/web(\/|$)/,
  /^\/shop\/cart\/update/,
  /^\/shop\/change_pricelist/,
  /^\/shop\/pricelist/,
  /\/feed$/,
  /^\/website\/(?!social)/,
  /\.(css|js|png|jpe?g|gif|svg|webp|ico|woff2?|pdf|xml)$/i,
];

type Page = {
  url: string;
  status: number;
  location?: string;
  title?: string;
  description?: string;
  canonical?: string;
  h1?: string;
  lang?: string;
};

function normalise(href: string, base: string): string | null {
  try {
    const url = new URL(href, base);
    if (url.host !== new URL(ORIGIN).host) return null;
    url.hash = "";
    url.protocol = "https:";
    // Keep pagination, drop tracking and sorting parameters.
    for (const key of [...url.searchParams.keys()]) {
      if (key !== "page") url.searchParams.delete(key);
    }
    const path = url.pathname;
    if (SKIP.some((re) => re.test(path))) return null;
    return url.toString();
  } catch {
    return null;
  }
}

async function fetchPage(url: string): Promise<{ page: Page; links: string[] }> {
  const response = await fetch(url, {
    redirect: "manual",
    headers: { "User-Agent": "RedLanternMigrationCrawler/1.0 (site owner)" },
  });
  const page: Page = { url, status: response.status };
  if (response.status >= 300 && response.status < 400) {
    page.location = response.headers.get("location") ?? undefined;
    return { page, links: page.location ? [page.location] : [] };
  }
  const type = response.headers.get("content-type") ?? "";
  if (!type.includes("text/html")) return { page, links: [] };

  const $ = cheerio.load(await response.text());
  page.title = $("title").first().text().trim() || undefined;
  page.description = $('meta[name="description"]').attr("content")?.trim() || undefined;
  page.canonical = $('link[rel="canonical"]').attr("href") || undefined;
  page.h1 = $("h1").first().text().replace(/\s+/g, " ").trim() || undefined;
  page.lang = $("html").attr("lang") || undefined;
  const links = $("a[href]")
    .map((_, a) => $(a).attr("href")!)
    .get();
  return { page, links };
}

async function sitemapUrls(): Promise<string[]> {
  const xml = await fetch(`${ORIGIN}/sitemap.xml`).then((r) => r.text());
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());
}

async function main() {
  const seeds = [`${ORIGIN}/`, ...LANGS.map((l) => `${ORIGIN}/${l}`), ...(await sitemapUrls())];
  const queue: string[] = [];
  const seen = new Set<string>();
  const enqueue = (href: string, base: string) => {
    const url = normalise(href, base);
    if (url && !seen.has(url) && seen.size < MAX_PAGES) {
      seen.add(url);
      queue.push(url);
    }
  };
  seeds.forEach((s) => enqueue(s, ORIGIN));

  const pages: Page[] = [];
  async function worker() {
    while (queue.length > 0) {
      const url = queue.shift()!;
      try {
        const { page, links } = await fetchPage(url);
        pages.push(page);
        links.forEach((l) => enqueue(l, url));
        process.stdout.write(`${page.status} ${url}\n`);
      } catch (error) {
        pages.push({ url, status: 0, title: String(error) });
      }
      await new Promise((r) => setTimeout(r, 150));
    }
  }
  // Workers stop when the queue is momentarily empty; loop until nothing is left.
  while (queue.length > 0) {
    await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  }

  pages.sort((a, b) => a.url.localeCompare(b.url));
  mkdirSync("docs/seo", { recursive: true });
  writeFileSync(
    "docs/seo/old-site-crawl.json",
    JSON.stringify({ crawledAt: new Date().toISOString(), origin: ORIGIN, pages }, null, 2) + "\n",
  );
  const byStatus = pages.reduce<Record<number, number>>((acc, p) => {
    acc[p.status] = (acc[p.status] ?? 0) + 1;
    return acc;
  }, {});
  console.log(`\n${pages.length} URLs`, byStatus, seen.size >= MAX_PAGES ? "(limit reached)" : "");
}

main();

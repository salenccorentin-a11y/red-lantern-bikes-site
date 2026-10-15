// Checks that every address of the old site works on the new one: either it
// loads directly (200), or it redirects once with a 301 to a page that loads.
//
//   npx tsx scripts/seo/check-redirects.ts [new site, default http://localhost:3000]
//
// Reads docs/seo/old-site-crawl.json. Exits with an error if anything fails.

import { readFileSync } from "node:fs";

type Page = { url: string; status: number; location?: string };

const NEW_SITE = process.argv[2] ?? "http://localhost:3000";
const { pages } = JSON.parse(readFileSync("docs/seo/old-site-crawl.json", "utf8")) as {
  pages: Page[];
};

// Odoo actions (currency switcher and the like) were links, not pages.
const NOT_PAGES = /\/shop\/change_pricelist\//;

function pathOf(url: string) {
  const u = new URL(url);
  return u.pathname + u.search;
}

async function check(path: string) {
  const first = await fetch(NEW_SITE + path, { redirect: "manual" });
  if (first.status === 200) return { ok: true, result: "200" };
  if (first.status !== 301) return { ok: false, result: `${first.status}` };

  const location = first.headers.get("location")!;
  const target = new URL(location, NEW_SITE);
  if (target.origin !== new URL(NEW_SITE).origin) {
    return { ok: true, result: `301 → ${location} (external)` };
  }
  const second = await fetch(target, { redirect: "manual" });
  const result = `301 → ${target.pathname}${target.search} → ${second.status}`;
  return { ok: second.status === 200, result };
}

async function main() {
  // Every old address that was a real page or a redirect (old 404s are skipped).
  const paths = [
    ...new Set(
      pages
        .filter(
          (p) =>
            (p.status === 200 || (p.status >= 300 && p.status < 400)) && !NOT_PAGES.test(p.url),
        )
        .map((p) => pathOf(p.url)),
    ),
  ].sort();

  let failures = 0;
  const outcomes: Record<string, number> = {};
  for (const path of paths) {
    const { ok, result } = await check(path);
    const kind = result.startsWith("301")
      ? result.includes("external")
        ? "301 external"
        : "301"
      : result;
    outcomes[kind] = (outcomes[kind] ?? 0) + 1;
    if (!ok) {
      failures++;
      console.log(`FAIL ${path}  ${result}`);
    }
  }
  console.log(`\nChecked ${paths.length} old addresses:`, outcomes);
  if (failures > 0) {
    console.log(`${failures} failed.`);
    process.exit(1);
  }
  console.log("All old addresses load or redirect once to a working page.");
}

main();

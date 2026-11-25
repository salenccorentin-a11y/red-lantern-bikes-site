// Brings the site up to date with the owner's Notion Rentals database
// (src/server/notion-sync.ts). One way: Notion → site.
//
//   npm run sync:notion -- <rows.json> [--dry-run]
//
// The rows (see NotionRental in src/lib/notion-import.ts) are fetched through
// the Notion connection just before running: every row not Returned, plus the
// recently returned ones. On Railway, where there is no file, the rows can be
// passed in the NOTION_ROWS_JSON variable instead. They hold customer names:
// keep them out of git and delete them afterwards. Uses DATABASE_URL, so run
// it against the database you mean. --dry-run changes nothing.

import "dotenv/config";
import { readFileSync } from "node:fs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import type { NotionRental } from "../src/lib/notion-import";
import { linkBookingsToCustomers } from "../src/server/customers";
import { syncNotionRentals } from "../src/server/notion-sync";

const args = process.argv.slice(2);
const file = args.find((a) => !a.startsWith("--"));
const dryRun = args.includes("--dry-run");
const json = file ? readFileSync(file, "utf8") : process.env.NOTION_ROWS_JSON;
if (!json) {
  console.error("Usage: npm run sync:notion -- <rows.json> [--dry-run] (or set NOTION_ROWS_JSON)");
  process.exit(1);
}

const url = process.env.DATABASE_URL;
if (!url) throw new Error("Missing environment variable DATABASE_URL. See .env.example.");
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });

const rows = JSON.parse(json) as NotionRental[];
console.log(`${dryRun ? "DRY RUN: nothing is changed. " : ""}${rows.length} Notion rows.`);
syncNotionRentals(db, rows, { dryRun })
  .then(async (report) => {
    for (const l of report) console.log(`${l.start}  ${l.name}: ${l.changes.join("; ")}`);
    if (report.length === 0) console.log("Everything already matches Notion.");
    if (!dryRun) await linkBookingsToCustomers(db);
  })
  .finally(() => db.$disconnect());

// Imports rentals from the owner's Notion Rentals database.
//
//   npm run import:notion -- <rows.json> [--dry-run]
//       current and upcoming rentals (step 11, src/server/notion-import.ts)
//   npm run import:notion -- <rows.json> --history [--dry-run]
//       returned rentals, as past rentals in the Archive (CRM Phase 2,
//       src/server/notion-history.ts), then customer records for them
//
// rows.json is a list of Notion rows (see NotionRental in
// src/lib/notion-import.ts), fetched through the Notion connection just
// before running. On Railway, where there is no file, the rows can be passed
// in NOTION_ROWS_JSON, NOTION_ROWS_JSON_2… (each a JSON list; they are put
// together). They hold customer names: keep them out of git and delete them
// afterwards. Uses DATABASE_URL, so run it against the database you mean.
// --dry-run shows what would happen and changes nothing.

import "dotenv/config";
import { readFileSync } from "node:fs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import type { NotionRental } from "../src/lib/notion-import";
import { linkBookingsToCustomers } from "../src/server/customers";
import { importNotionHistory } from "../src/server/notion-history";
import { importNotionRentals } from "../src/server/notion-import";

const args = process.argv.slice(2);
const file = args.find((a) => !a.startsWith("--"));
const dryRun = args.includes("--dry-run");
const history = args.includes("--history");

function readRows(): NotionRental[] | null {
  if (file) return JSON.parse(readFileSync(file, "utf8")) as NotionRental[];
  const part = (k: string) => Number(k.slice("NOTION_ROWS_JSON_".length) || 1);
  const keys = Object.keys(process.env)
    .filter((k) => /^NOTION_ROWS_JSON(_\d+)?$/.test(k))
    .sort((a, b) => part(a) - part(b));
  if (keys.length === 0) return null;
  return keys.flatMap((k) => JSON.parse(process.env[k]!) as NotionRental[]);
}

const rows = readRows();
if (!rows) {
  console.error(
    "Usage: npm run import:notion -- <rows.json> [--history] [--dry-run] (or set NOTION_ROWS_JSON)",
  );
  process.exit(1);
}

const url = process.env.DATABASE_URL;
if (!url) throw new Error("Missing environment variable DATABASE_URL. See .env.example.");
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });

console.log(`${dryRun ? "DRY RUN: nothing is changed. " : ""}${rows.length} Notion rows.`);

async function main(rows: NotionRental[]) {
  if (history) {
    const report = await importNotionHistory(db, rows, { dryRun });
    const count = (kind: string) => report.filter((l) => l.result.kind === kind).length;
    for (const l of report) {
      const what =
        l.result.kind === "imported"
          ? `${dryRun ? "would import" : "imported"}${l.result.cancelled ? " as cancelled" : ""}: ${l.result.models.join(", ")}`
          : l.result.kind === "already-imported"
            ? "already on the site"
            : `skipped: ${l.result.reason}`;
      console.log(`${l.start || "(no date)"}  ${l.name} (${l.bike}): ${what}`);
    }
    console.log(
      `${dryRun ? "Would import" : "Imported"} ${count("imported")} rentals, ${count("already-imported")} already on the site, ${count("skipped")} skipped.`,
    );
    if (!dryRun) {
      const linked = await linkBookingsToCustomers(db);
      console.log(`${linked} bookings linked to customer records.`);
    }
    return;
  }

  const report = await importNotionRentals(db, rows, { dryRun });
  for (const l of report) {
    const what =
      l.result.kind === "imported"
        ? `${dryRun ? "would import" : "imported"} on ${l.result.plates.join(", ")}`
        : l.result.kind === "already-imported"
          ? "already imported"
          : `skipped: ${l.result.reason}`;
    console.log(`${l.start} → ${l.end}  ${l.name} (${l.bike}): ${what}`);
  }
}

main(rows).finally(() => db.$disconnect());

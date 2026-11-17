// Step 11: imports current and upcoming rentals from the owner's Notion
// Rentals database (src/server/notion-import.ts).
//
//   npm run import:notion -- <rows.json> [--dry-run]
//
// rows.json is a list of Notion rows (see NotionRental in
// src/lib/notion-import.ts), fetched through the Notion connection just
// before running. It holds customer names: keep it out of git and delete it
// afterwards. Uses DATABASE_URL from .env, so run it against the database you
// mean. --dry-run shows what would happen and changes nothing.

import "dotenv/config";
import { readFileSync } from "node:fs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import type { NotionRental } from "../src/lib/notion-import";
import { importNotionRentals } from "../src/server/notion-import";

const args = process.argv.slice(2);
const file = args.find((a) => !a.startsWith("--"));
const dryRun = args.includes("--dry-run");
if (!file) {
  console.error("Usage: npm run import:notion -- <rows.json> [--dry-run]");
  process.exit(1);
}

const url = process.env.DATABASE_URL;
if (!url) throw new Error("Missing environment variable DATABASE_URL. See .env.example.");
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });

const rows = JSON.parse(readFileSync(file, "utf8")) as NotionRental[];
importNotionRentals(db, rows, { dryRun })
  .then((report) => {
    for (const l of report) {
      const what =
        l.result.kind === "imported"
          ? `${dryRun ? "would import" : "imported"} on ${l.result.plates.join(", ")}`
          : l.result.kind === "already-imported"
            ? "already imported"
            : `skipped: ${l.result.reason}`;
      console.log(`${l.start} → ${l.end}  ${l.name} (${l.bike}): ${what}`);
    }
  })
  .finally(() => db.$disconnect());

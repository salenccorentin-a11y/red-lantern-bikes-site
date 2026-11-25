// Step 11: bring the owner's current and upcoming rentals from the Notion
// Rentals database into the site, so the site never offers a bike that is
// already out. Returned rentals stay in Notion, the owner's archive.
//
// Each bike of a Notion row becomes one booking (source IMPORT) on a free
// physical bike of that model, written with the same lock, re-check and
// blocked days as any other booking. Prices are not invented: the money
// columns go into the staff note word for word, and the price fields are 0.
// A row already imported (found by the Notion link in the staff note) is
// skipped, so the import can be run again just before launch. The money and
// extras columns go into the booking's rental record (paidNote…), word for
// word. Rows already on the site are kept up to date by src/server/notion-sync.ts.

import type { PrismaClient } from "@/generated/prisma/client";
import { parseIsoDate } from "@/lib/dates";
import {
  dropoffFor,
  notionNote,
  parseBikes,
  recordFields,
  type NotionRental,
} from "@/lib/notion-import";
import { lastBlockedDay, rentalBlocks } from "@/lib/occupancy";
import { generateReference } from "@/lib/reference";
import { freeBikes, getSettings, transitDaysFor } from "@/server/availability";
import { QUEUED_WRITE, bikeIsFree, lockBike } from "@/server/bike-lock";

export type ImportLine = {
  name: string;
  bike: string;
  start: string;
  end: string;
  result:
    | { kind: "imported"; plates: string[] }
    | { kind: "already-imported" }
    | { kind: "skipped"; reason: string };
};

export async function importNotionRentals(
  db: PrismaClient,
  rows: NotionRental[],
  { dryRun = false }: { dryRun?: boolean } = {},
): Promise<ImportLine[]> {
  const settings = await getSettings(db);
  const report: ImportLine[] = [];

  for (const row of rows) {
    const line = (result: ImportLine["result"]): ImportLine => ({
      name: row.name,
      bike: row.bike,
      start: row.start,
      end: row.end,
      result,
    });
    if (row.status === "Returned") {
      report.push(line({ kind: "skipped", reason: "returned: stays in Notion" }));
      continue;
    }
    const start = parseIsoDate(row.start);
    const end = parseIsoDate(row.end);
    if (!start || !end || end < start) {
      report.push(line({ kind: "skipped", reason: "dates missing or wrong" }));
      continue;
    }
    const bikes = parseBikes(row.bike);
    if (!bikes) {
      report.push(line({ kind: "skipped", reason: "bike not in the fleet: enter it by hand" }));
      continue;
    }
    const already = await db.booking.count({
      where: {
        OR: [
          { notionUrl: row.url },
          { source: "IMPORT", staffNote: { startsWith: `Imported from Notion ${row.url}` } },
        ],
      },
    });
    if (already > 0) {
      report.push(line({ kind: "already-imported" }));
      continue;
    }

    const dropoff = dropoffFor(row.destination);
    const route =
      dropoff.city === "SAIGON"
        ? null
        : await db.route.findFirst({ where: { fromCity: "SAIGON", toCity: dropoff.city } });
    const blocks = rentalBlocks({
      start,
      end,
      cleaningGapDays: settings.cleaningGapDays,
      transitDays: transitDaysFor(route),
    });
    const last = lastBlockedDay(blocks);
    const days = Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1;
    const units = bikes.reduce((n, b) => n + b.count, 0);

    // Find every bike first, so a row is imported whole or not at all.
    const picks: { modelId: string; bikeId: string; plate: string }[] = [];
    let missing: string | null = null;
    for (const { slug, count } of bikes) {
      const model = await db.bikeModel.findUnique({ where: { slug } });
      if (!model) {
        missing = `model ${slug} not in the database`;
        break;
      }
      const free = (await freeBikes(db, { modelId: model.id, first: start, last })).filter(
        (b) => !picks.some((p) => p.bikeId === b.id),
      );
      if (free.length < count) {
        missing = `only ${free.length} free ${model.name} for these dates, ${count} needed`;
        break;
      }
      for (const b of free.slice(0, count)) {
        picks.push({ modelId: model.id, bikeId: b.id, plate: b.plate });
      }
    }
    if (missing) {
      report.push(line({ kind: "skipped", reason: missing }));
      continue;
    }
    if (dryRun) {
      report.push(line({ kind: "imported", plates: picks.map((p) => p.plate) }));
      continue;
    }

    await db.$transaction(async (tx) => {
      for (const [i, pick] of picks.entries()) {
        await lockBike(tx, pick.bikeId);
        if (!(await bikeIsFree(tx, pick.bikeId, start, last))) {
          throw new Error(`${pick.plate} was booked during the import; run it again.`);
        }
        await tx.booking.create({
          data: {
            reference: generateReference(),
            status: row.status === "On the road" ? "CHECKED_OUT" : "CONFIRMED",
            source: "IMPORT",
            bikeModelId: pick.modelId,
            bikeId: pick.bikeId,
            pickupCity: "SAIGON",
            dropoffCity: dropoff.city,
            routeId: route?.id ?? null,
            startDate: start,
            endDate: end,
            days,
            rateTier: "DAILY",
            dailyRate: 0,
            rentalVnd: 0,
            totalVnd: 0,
            depositVnd: 0,
            balanceVnd: 0,
            customerName: row.name,
            notionUrl: row.url,
            staffNote:
              [
                units > 1 ? `Bike ${i + 1} of ${units} (Notion: ${row.bike})` : null,
                notionNote(row, dropoff.other),
              ]
                .filter(Boolean)
                .join("\n") || null,
            ...recordFields(row),
            oilChangedOn: row.oilChangedOn ? parseIsoDate(row.oilChangedOn) : null,
            kmSinceOilChange: row.kmSinceChange ?? null,
            oilReminderSentOn: row.lastReminder ? parseIsoDate(row.lastReminder) : null,
            checkedOutAt: row.status === "On the road" ? start : null,
            occupancies: {
              create: blocks.map((block) => ({
                bikeId: pick.bikeId,
                kind: block.kind,
                startDate: block.start,
                endDate: block.end,
              })),
            },
          },
        });
      }
    }, QUEUED_WRITE);
    report.push(line({ kind: "imported", plates: picks.map((p) => p.plate) }));
  }
  return report;
}

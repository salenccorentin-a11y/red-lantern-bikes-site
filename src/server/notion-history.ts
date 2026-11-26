// CRM Phase 2: the owner's returned Notion rentals come onto the site as past
// rentals, so each customer record shows the whole history (owner,
// 2026-11-26: "Start Phase 2").
//
// Each bike of a returned Notion row becomes one COMPLETED booking (source
// IMPORT), already in the Archive. Unlike current rentals
// (src/server/notion-import.ts), no physical bike is picked and no days are
// blocked: the dates are past, and the fleet then wasn't the fleet now. The
// money and extras columns go into the rental record word for word, the price
// fields are 0. A row whose whole note is "CANCELLED" becomes a cancelled
// booking. Rows already on the site (found by their Notion link) are skipped,
// so it can be run again. Customer records are made afterwards by
// linkBookingsToCustomers: without an email or phone, each Notion row gets its
// own record (src/server/customers.ts never matches on a name alone).

import type { PrismaClient } from "@/generated/prisma/client";
import { parseIsoDate } from "@/lib/dates";
import {
  cell,
  dropoffFor,
  notionNote,
  parseBikes,
  recordFields,
  type NotionRental,
} from "@/lib/notion-import";
import { generateReference } from "@/lib/reference";
import { isUniqueViolation } from "@/server/db-errors";

export type HistoryLine = {
  name: string;
  bike: string;
  start: string;
  result:
    | { kind: "imported"; models: string[]; cancelled: boolean }
    | { kind: "already-imported" }
    | { kind: "skipped"; reason: string };
};

export async function importNotionHistory(
  db: PrismaClient,
  rows: NotionRental[],
  { dryRun = false, now = new Date() }: { dryRun?: boolean; now?: Date } = {},
): Promise<HistoryLine[]> {
  const report: HistoryLine[] = [];
  const models = new Map((await db.bikeModel.findMany()).map((m) => [m.slug, m]));

  for (const row of rows) {
    const line = (result: HistoryLine["result"]): HistoryLine => ({
      name: cell(row.name) ?? "(no name)",
      bike: row.bike ?? "",
      start: row.start ?? "",
      result,
    });
    if (row.status !== "Returned") {
      report.push(line({ kind: "skipped", reason: "not returned: the Notion sync handles it" }));
      continue;
    }
    const name = cell(row.name);
    if (!name) {
      report.push(line({ kind: "skipped", reason: "no name" }));
      continue;
    }
    const start = row.start ? parseIsoDate(row.start) : null;
    const end = row.end ? parseIsoDate(row.end) : null;
    if (!start || !end || end < start) {
      report.push(line({ kind: "skipped", reason: "dates missing or wrong" }));
      continue;
    }
    const bikes = row.bike ? parseBikes(row.bike) : null;
    const missing = bikes?.find((b) => !models.has(b.slug));
    if (!bikes || missing) {
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

    const cancelled = cell(row.notes)?.toUpperCase() === "CANCELLED";
    const units = bikes.flatMap((b) => Array<string>(b.count).fill(b.slug));
    report.push(
      line({ kind: "imported", models: units.map((s) => models.get(s)!.name), cancelled }),
    );
    if (dryRun) continue;

    const dropoff = dropoffFor(row.destination);
    const route =
      dropoff.city === "SAIGON"
        ? null
        : await db.route.findFirst({ where: { fromCity: "SAIGON", toCity: dropoff.city } });
    const days = Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1;
    const note = notionNote(row, dropoff.other);
    // A WhatsApp number typed in the name column ("+84 96 …"): kept as the
    // name, and also as the phone, so the customer record can be matched.
    const phone = /^\+?[\d\s.()-]{8,}$/.test(name) ? name : null;

    const createRow = () =>
      db.$transaction(
        units.map((slug, i) =>
          db.booking.create({
            data: {
              reference: generateReference(),
              status: cancelled ? "CANCELLED" : "COMPLETED",
              source: "IMPORT",
              bikeModelId: models.get(slug)!.id,
              bikeId: null,
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
              customerName: name,
              customerPhone: phone,
              notionUrl: row.url,
              staffNote:
                [
                  units.length > 1
                    ? `Bike ${i + 1} of ${units.length} (Notion: ${row.bike})`
                    : null,
                  note,
                ]
                  .filter(Boolean)
                  .join("\n") || null,
              ...recordFields(row),
              checkedOutAt: cancelled ? null : start,
              checkedInAt: cancelled ? null : end,
              cancelledAt: cancelled ? now : null,
              archivedAt: now,
            },
          }),
        ),
      );

    // A new reference can clash with one already used (6 random digits):
    // the row is then written again with fresh ones.
    for (let attempt = 1; ; attempt++) {
      try {
        await createRow();
        break;
      } catch (e) {
        if (!isUniqueViolation(e) || attempt >= 5) throw e;
      }
    }
  }
  return report;
}

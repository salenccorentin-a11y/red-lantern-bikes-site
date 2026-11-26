// Brings the site up to date with the owner's Notion Rentals database, while
// both are used side by side (CRM plan, Phase 3). One way: Notion → site.
//
// For each Notion row:
// - already on the site (Booking.notionUrl): the rental record columns, the
//   notes and the oil columns are copied over, and the status follows Notion
//   (On the road → checked out, Returned → checked in, which frees the bike's
//   remaining days). Different dates are reported, never changed: moving a
//   booking's blocked days is done by hand in the staff area.
// - not on the site yet: imported like step 11 (src/server/notion-import.ts),
//   unless it's Returned (past rentals: src/server/notion-history.ts).
// Site bookings from Notion whose row is gone from Notion are only reported.

import type { Prisma, PrismaClient } from "@/generated/prisma/client";
import { parseIsoDate, toIsoDate } from "@/lib/dates";
import { cell, dropoffFor, notionNote, recordFields, type NotionRental } from "@/lib/notion-import";
import { checkIn } from "@/server/booking-admin";
import { importNotionRentals } from "@/server/notion-import";

export type SyncLine = { name: string; start: string; changes: string[] };

const ACTIVE = ["PENDING_PAYMENT", "CONFIRMED", "CHECKED_OUT", "COMPLETED"] as const;

const same = (a: Date | null, b: Date | null) => (a?.getTime() ?? null) === (b?.getTime() ?? null);

export async function syncNotionRentals(
  db: PrismaClient,
  rows: NotionRental[],
  { dryRun = false, now = new Date() }: { dryRun?: boolean; now?: Date } = {},
): Promise<SyncLine[]> {
  const report: SyncLine[] = [];
  const seen = new Set<string>();

  for (const row of rows) {
    if (!cell(row.name) || !row.start) continue; // An empty Notion row.
    seen.add(row.url);
    const changes: string[] = [];
    const bookings = await db.booking.findMany({
      where: { notionUrl: row.url, status: { in: [...ACTIVE] } },
      orderBy: { createdAt: "asc" },
    });

    if (bookings.length === 0) {
      if (row.status === "Returned") continue; // History: npm run import:notion -- --history.
      const [line] = await importNotionRentals(db, [row], { dryRun });
      changes.push(
        line.result.kind === "imported"
          ? `${dryRun ? "would be added" : "added"} on ${line.result.plates.join(", ")}`
          : line.result.kind === "already-imported"
            ? "already on the site"
            : `not added: ${line.result.reason}`,
      );
      report.push({ name: row.name, start: row.start, changes });
      continue;
    }

    const start = parseIsoDate(row.start);
    const end = parseIsoDate(row.end);
    const fields = recordFields(row);
    const units = bookings.length;

    for (const [i, b] of bookings.entries()) {
      const data: Prisma.BookingUpdateInput = {};
      for (const [key, value] of Object.entries(fields) as [keyof typeof fields, string | null][]) {
        if (b[key] !== value) data[key] = value;
      }
      const note =
        [
          units > 1 ? `Bike ${i + 1} of ${units} (Notion: ${row.bike})` : null,
          notionNote(row, dropoffFor(row.destination).other),
        ]
          .filter(Boolean)
          .join("\n") || null;
      if (b.staffNote !== note) data.staffNote = note;

      // Oil: Notion's values win when it has one.
      const oil = row.oilChangedOn ? parseIsoDate(row.oilChangedOn) : null;
      if (oil && !same(b.oilChangedOn, oil)) data.oilChangedOn = oil;
      if (row.kmSinceChange != null && b.kmSinceOilChange !== row.kmSinceChange) {
        data.kmSinceOilChange = row.kmSinceChange;
      }
      const reminder = row.lastReminder ? parseIsoDate(row.lastReminder) : null;
      if (reminder && !same(b.oilReminderSentOn, reminder)) data.oilReminderSentOn = reminder;

      const fieldNames = Object.keys(data);
      if (fieldNames.length > 0 && i === 0) {
        changes.push(`updated ${fieldNames.map(label).join(", ")}`);
      }

      // Status.
      let status: string | null = null;
      if (
        row.status === "On the road" &&
        (b.status === "CONFIRMED" || b.status === "PENDING_PAYMENT")
      ) {
        data.status = "CHECKED_OUT";
        data.checkedOutAt = start ?? now;
        data.holdExpiresAt = null;
        status = "now on the road";
      }
      const checkInNeeded =
        row.status === "Returned" &&
        (b.status === "CHECKED_OUT" || b.status === "CONFIRMED" || b.status === "PENDING_PAYMENT");
      if (checkInNeeded) status = "returned (checked in)";
      if (row.status === "Upcoming" && b.status === "CHECKED_OUT") {
        status = "on the road on the site but Upcoming in Notion: left as it is";
      }
      if (status && i === 0) changes.push(status);

      if (i === 0 && start && end && (!same(b.startDate, start) || !same(b.endDate, end))) {
        changes.push(
          `dates differ: site ${toIsoDate(b.startDate)} → ${toIsoDate(b.endDate)}, Notion ${row.start} → ${row.end}. Change them by hand`,
        );
      }

      if (dryRun) continue;
      if (Object.keys(data).length > 0) await db.booking.update({ where: { id: b.id }, data });
      if (checkInNeeded) {
        if (b.status !== "CHECKED_OUT") {
          await db.booking.update({
            where: { id: b.id },
            data: { status: "CHECKED_OUT", checkedOutAt: start ?? now, holdExpiresAt: null },
          });
        }
        await checkIn(db, b.id, now);
      }
    }

    if (changes.length > 0) report.push({ name: row.name, start: row.start, changes });
  }

  // Bookings from Notion rows that aren't in Notion any more.
  const orphans = await db.booking.findMany({
    where: {
      notionUrl: { not: null },
      status: { in: ["CONFIRMED", "CHECKED_OUT", "PENDING_PAYMENT"] },
    },
    select: { notionUrl: true, customerName: true, startDate: true },
  });
  const reported = new Set<string>();
  for (const o of orphans) {
    if (seen.has(o.notionUrl!) || reported.has(o.notionUrl!)) continue;
    reported.add(o.notionUrl!);
    report.push({
      name: o.customerName,
      start: toIsoDate(o.startDate),
      changes: ["not found in Notion any more: check it by hand (left as it is)"],
    });
  }
  return report;
}

function label(field: string): string {
  return (
    {
      paidNote: "paid",
      transferNote: "transfer",
      depositNote: "deposit",
      insuranceNote: "insurance",
      helmetNote: "helmet",
      problemsNote: "problems on the way",
      staffNote: "notes",
      oilChangedOn: "oil change date",
      kmSinceOilChange: "km since oil change",
      oilReminderSentOn: "last oil reminder",
    }[field] ?? field
  );
}

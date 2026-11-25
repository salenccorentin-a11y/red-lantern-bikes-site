// The rental list on the staff Customers page, laid out like the owner's
// Notion Rentals page: one row per rental (several bikes rented together are
// one row), newest first, with an Archive for rentals that are over.
//
// A rental goes to the archive only when staff press "Archive", once every
// bike is back (checked in).

import type { Prisma, PrismaClient } from "@/generated/prisma/client";
import { CITY_NAME } from "@/lib/cities";
import { checkIn } from "@/server/booking-admin";

export type RentalTab = "active" | "archive";

export type RentalStatus = "Request" | "Upcoming" | "On the road" | "Returned";

const SHOWN = ["PENDING_PAYMENT", "CONFIRMED", "CHECKED_OUT", "COMPLETED"] as const;

/** One row of the list. `ids` are the bookings behind it, one per bike. */
export type RentalRow = Awaited<ReturnType<typeof listRentals>>[number];

function rowStatus(statuses: string[]): RentalStatus {
  if (statuses.includes("CHECKED_OUT")) return "On the road";
  if (statuses.includes("CONFIRMED")) return "Upcoming";
  if (statuses.includes("PENDING_PAYMENT")) return "Request";
  return "Returned";
}

/** "Drop-off: Nha Trang" and "Bike 1 of 2" lines are shown elsewhere. */
function splitNote(note: string | null) {
  const lines = (note ?? "").split("\n").map((l) => l.trim());
  const place = lines.find((l) => l.startsWith("Drop-off: "))?.slice("Drop-off: ".length);
  const rest = lines.filter((l) => l && !l.startsWith("Drop-off: ") && !/^Bike \d+ of \d+/.test(l));
  return { place: place ?? null, notes: rest.join("\n") || null };
}

export async function listRentals(db: PrismaClient, tab: RentalTab, search = "") {
  const q = search.trim();
  const where: Prisma.BookingWhereInput = {
    status: { in: [...SHOWN] },
    archivedAt: tab === "archive" ? { not: null } : null,
    ...(q
      ? {
          OR: [
            { customerName: { contains: q, mode: "insensitive" } },
            { staffNote: { contains: q, mode: "insensitive" } },
            { bikeModel: { name: { contains: q, mode: "insensitive" } } },
            { bike: { plate: { contains: q, mode: "insensitive" } } },
          ],
        }
      : {}),
  };
  const bookings = await db.booking.findMany({
    where,
    include: { bike: { select: { plate: true } }, bikeModel: { select: { name: true } } },
    orderBy: [{ startDate: "desc" }, { createdAt: "asc" }],
    take: tab === "archive" ? 600 : 300,
  });

  // Bikes rented together: same Notion row, or same customer and dates.
  const groups = new Map<string, typeof bookings>();
  for (const b of bookings) {
    const key =
      b.notionUrl ??
      `${b.customerId ?? b.id}|${b.startDate.getTime()}|${b.endDate.getTime()}|${b.archivedAt ? 1 : 0}`;
    groups.set(key, [...(groups.get(key) ?? []), b]);
  }

  return [...groups.values()].map((list) => {
    const first = list[0];
    const { place, notes } = splitNote(first.staffNote);
    const status = rowStatus(list.map((b) => b.status));
    return {
      key: first.id,
      ids: list.map((b) => b.id),
      firstId: first.id,
      customerId: first.customerId,
      name: first.customerName,
      status,
      bikes: list.map((b) => ({ id: b.id, model: b.bikeModel.name, plate: b.bike?.plate ?? null })),
      startDate: first.startDate,
      endDate: first.endDate,
      days: first.days,
      destination: place ?? CITY_NAME[first.dropoffCity],
      paid: first.paidNote,
      transfer: first.transferNote,
      deposit: first.depositNote,
      insurance: first.insuranceNote,
      helmet: first.helmetNote,
      notes,
      problems: first.problemsNote,
      archivedAt: first.archivedAt,
    };
  });
}

/**
 * The order of the current list (owner, 2026-11-26): rentals that have
 * started (on the road or just returned) first, then the upcoming ones and
 * requests; both by start date, the soonest first.
 */
export function splitByStart(rows: RentalRow[]) {
  const started = rows
    .filter((r) => r.status === "On the road" || r.status === "Returned")
    .sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
  const upcoming = rows
    .filter((r) => r.status === "Upcoming" || r.status === "Request")
    .sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
  return { started, upcoming };
}

/** How many rentals are in the archive (for the tab label). */
export async function archiveCount(db: PrismaClient) {
  const rows = await db.booking.findMany({
    where: { archivedAt: { not: null }, status: { in: [...SHOWN] } },
    select: { notionUrl: true, customerId: true, id: true, startDate: true, endDate: true },
  });
  return new Set(
    rows.map(
      (b) =>
        b.notionUrl ?? `${b.customerId ?? b.id}|${b.startDate.getTime()}|${b.endDate.getTime()}`,
    ),
  ).size;
}

type Result = { ok: true } | { ok: false; error: string };

/** Every bike of the rental is back: check in the ones still out. */
export async function markRentalReturned(
  db: PrismaClient,
  ids: string[],
  now: Date = new Date(),
): Promise<Result> {
  const out = await db.booking.findMany({
    where: { id: { in: ids }, status: "CHECKED_OUT" },
    select: { id: true },
  });
  if (out.length === 0) return { ok: false, error: "No bike of this rental is out." };
  for (const b of out) {
    const result = await checkIn(db, b.id, now);
    if (!result.ok) return result;
  }
  return { ok: true };
}

/** Puts a rental in the archive. Only once every bike is back. */
export async function archiveRental(
  db: PrismaClient,
  ids: string[],
  now: Date = new Date(),
): Promise<Result> {
  const bookings = await db.booking.findMany({
    where: { id: { in: ids } },
    select: { status: true },
  });
  if (bookings.length === 0) return { ok: false, error: "Rental not found." };
  if (bookings.some((b) => b.status !== "COMPLETED")) {
    return { ok: false, error: "Mark the bike as returned first, then archive the rental." };
  }
  await db.booking.updateMany({ where: { id: { in: ids } }, data: { archivedAt: now } });
  return { ok: true };
}

/** Takes a rental back out of the archive. */
export async function unarchiveRental(db: PrismaClient, ids: string[]): Promise<Result> {
  await db.booking.updateMany({ where: { id: { in: ids } }, data: { archivedAt: null } });
  return { ok: true };
}

export type RecordInput = {
  paid: string;
  transfer: string;
  deposit: string;
  insurance: string;
  helmet: string;
  notes: string;
  problems: string;
};

/** Staff edit a booking's rental record (the Notion-like columns). */
export async function saveRentalRecord(db: PrismaClient, bookingId: string, input: RecordInput) {
  const text = (v: string, max = 500) => v.trim().slice(0, max) || null;
  await db.booking.update({
    where: { id: bookingId },
    data: {
      paidNote: text(input.paid),
      transferNote: text(input.transfer),
      depositNote: text(input.deposit),
      insuranceNote: text(input.insurance),
      helmetNote: text(input.helmet),
      staffNote: text(input.notes, 2000),
      problemsNote: text(input.problems, 2000),
    },
  });
}

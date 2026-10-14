// Staff actions on a booking: handing the bike over and taking it back.

import type { PrismaClient } from "@/generated/prisma/client";
import { addDays, parseIsoDate, todayInSaigon } from "@/lib/dates";
import { getSettings } from "@/server/availability";

type Result = { ok: true } | { ok: false; error: string };

/** The customer takes the bike. Allowed for confirmed bookings and, until online
 * payments exist, for unpaid ones whose deposit is paid at the counter. */
export async function checkOut(
  db: PrismaClient,
  bookingId: string,
  now: Date = new Date(),
): Promise<Result> {
  const { count } = await db.booking.updateMany({
    where: { id: bookingId, status: { in: ["CONFIRMED", "PENDING_PAYMENT"] } },
    data: { status: "CHECKED_OUT", checkedOutAt: now, holdExpiresAt: null },
  });
  return count === 1
    ? { ok: true }
    : {
        ok: false,
        error: "This booking can't be checked out (already out, returned or cancelled).",
      };
}

/**
 * The bike is back. If a Saigon round trip ends early, the days it no longer
 * needs are freed (keeping the cleaning gap) so the bike can be rented again.
 * The price doesn't change. One-way bookings keep their train-back block.
 */
export async function checkIn(
  db: PrismaClient,
  bookingId: string,
  now: Date = new Date(),
): Promise<Result> {
  return db.$transaction(async (tx) => {
    const { count } = await tx.booking.updateMany({
      where: { id: bookingId, status: "CHECKED_OUT" },
      data: { status: "COMPLETED", checkedInAt: now },
    });
    if (count !== 1) {
      return { ok: false as const, error: "Only a bike that's out can be checked in." };
    }

    const booking = await tx.booking.findUniqueOrThrow({ where: { id: bookingId } });
    const today = parseIsoDate(todayInSaigon(now))!;
    if (booking.dropoffCity === "SAIGON" && today < booking.endDate) {
      const { cleaningGapDays } = await getSettings(tx);
      const freeFrom = addDays(today, cleaningGapDays);
      await tx.bikeOccupancy.updateMany({
        where: {
          bookingId,
          kind: "BOOKING",
          releasedAt: null,
          endDate: { gt: freeFrom },
          startDate: { lte: freeFrom },
        },
        data: { endDate: freeFrom },
      });
    }
    return { ok: true as const };
  });
}

export async function saveStaffNote(db: PrismaClient, bookingId: string, note: string) {
  await db.booking.update({ where: { id: bookingId }, data: { staffNote: note.trim() || null } });
}

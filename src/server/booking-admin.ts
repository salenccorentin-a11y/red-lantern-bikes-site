// Staff actions on a booking: handing the bike over, taking it back, and
// changing its dates.

import type { PrismaClient } from "@/generated/prisma/client";
import {
  addDays,
  daysInclusive,
  formatDisplayDate,
  parseIsoDate,
  toIsoDate,
  todayInSaigon,
} from "@/lib/dates";
import { lastBlockedDay, rentalBlocks } from "@/lib/occupancy";
import { rentalPrice } from "@/lib/pricing";
import { getSettings, overlapping, transitDaysFor } from "@/server/availability";
import { QUEUED_WRITE, lockBike } from "@/server/bike-lock";
import { isOverlapViolation, withTransientRetry } from "@/server/db-errors";

type Result = { ok: true } | { ok: false; error: string };

/** The customer takes the bike. Allowed for confirmed bookings and for requests
 * not answered yet (handing over the bike is the answer). */
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

/** Bookings whose dates can still change: not answered, confirmed or out. */
const DATES_CHANGE: readonly string[] = ["PENDING_PAYMENT", "CONFIRMED", "CHECKED_OUT"];

export type DatesChanged = {
  ok: true;
  days: number;
  /** Totals of all the bookings changed, before and after; equal for imported ones (price 0). */
  totalBefore: number;
  totalAfter: number;
  balanceBefore: number;
  balanceAfter: number;
};

/** A reason to refuse, thrown inside the transaction so nothing is written. */
class Refusal extends Error {}

/**
 * New dates for a rental, e.g. the customer extends by a couple of days (owner,
 * 2026-11-26: "a lot of time people ask us to extend for a couple of days").
 * Several bookings change together (the bikes of one group), all or none.
 *
 * Each bike's blocked days move with the dates (plus the cleaning gap or the
 * train back), after checking nothing else is booked or blocked on the new
 * days. Once the bike is out, only the return date can change. Priced bookings
 * are priced again for the new length at the model's current rates (the tier
 * can change, e.g. 6 days → 8 days is the weekly rate); per-day extras follow,
 * the one-way fee and the deposit stay. Imported bookings keep price 0: their
 * money is in the rental record.
 */
export async function changeDates(
  db: PrismaClient,
  bookingIds: string[],
  change: { startDate: string; endDate: string },
  now: Date = new Date(),
): Promise<DatesChanged | { ok: false; error: string }> {
  const start = parseIsoDate(change.startDate);
  const end = parseIsoDate(change.endDate);
  if (!start || !end) return { ok: false, error: "Pick both dates." };
  if (end < start) return { ok: false, error: "The return date is before the pick-up date." };
  const ids = [...new Set(bookingIds)];
  const days = daysInclusive(start, end);

  try {
    return await withTransientRetry(() =>
      db.$transaction(async (tx) => {
        const bookings = await tx.booking.findMany({
          where: { id: { in: ids } },
          include: { addOns: true, bikeModel: true, route: true, bike: true },
        });
        if (bookings.length !== ids.length) throw new Refusal("Booking not found.");
        const { cleaningGapDays } = await getSettings(tx);
        const result: DatesChanged = {
          ok: true,
          days,
          totalBefore: 0,
          totalAfter: 0,
          balanceBefore: 0,
          balanceAfter: 0,
        };

        for (const b of bookings) {
          if (!DATES_CHANGE.includes(b.status)) {
            throw new Refusal(
              "The dates of a returned, cancelled or expired booking can't change.",
            );
          }
          if (b.status === "CHECKED_OUT" && b.startDate.getTime() !== start.getTime()) {
            throw new Refusal("The bike is already out: only the return date can change.");
          }

          if (b.bike) {
            await lockBike(tx, b.bike.id);
            const blocks = rentalBlocks({
              start,
              end,
              cleaningGapDays,
              transitDays: transitDaysFor(b.route),
            });
            const clash = await tx.bikeOccupancy.findFirst({
              where: {
                bikeId: b.bike.id,
                ...overlapping(start, lastBlockedDay(blocks)),
                // Its own days don't count (bookingId null: a maintenance block).
                OR: [{ bookingId: null }, { bookingId: { notIn: ids } }],
              },
              include: { booking: { select: { reference: true, customerName: true } } },
              orderBy: { startDate: "asc" },
            });
            if (clash) {
              const from = formatDisplayDate(toIsoDate(clash.startDate));
              throw new Refusal(
                clash.booking
                  ? `${b.bike.plate} is booked from ${from} by ${clash.booking.customerName} (${clash.booking.reference}), counting the cleaning day. Give one of them another bike first.`
                  : `${b.bike.plate} is blocked from ${from}${clash.note ? ` (${clash.note})` : ""}.`,
              );
            }
            await tx.bikeOccupancy.updateMany({
              where: { bookingId: b.id, releasedAt: null },
              data: { releasedAt: now },
            });
            await tx.bikeOccupancy.createMany({
              data: blocks.map((block) => ({
                bikeId: b.bike!.id,
                bookingId: b.id,
                kind: block.kind,
                startDate: block.start,
                endDate: block.end,
              })),
            });
          }

          let price = {};
          let totalVnd = b.totalVnd;
          let balanceVnd = b.balanceVnd;
          if (b.source !== "IMPORT") {
            const rental = rentalPrice(b.bikeModel, days);
            let addOnsVnd = 0;
            for (const a of b.addOns) {
              const lineVnd =
                a.pricing === "PER_DAY" ? a.unitPrice * days * a.quantity : a.totalVnd;
              addOnsVnd += lineVnd;
              if (lineVnd !== a.totalVnd) {
                await tx.bookingAddOn.update({ where: { id: a.id }, data: { totalVnd: lineVnd } });
              }
            }
            totalVnd = rental.rentalVnd + b.oneWayFeeVnd + addOnsVnd;
            const depositVnd = Math.min(b.depositVnd, totalVnd);
            balanceVnd = totalVnd - depositVnd;
            price = {
              rateTier: rental.rateTier,
              dailyRate: rental.dailyRate,
              rentalVnd: rental.rentalVnd,
              addOnsVnd,
              totalVnd,
              depositVnd,
              balanceVnd,
            };
          }
          await tx.booking.update({
            where: { id: b.id },
            data: { startDate: start, endDate: end, days, ...price },
          });
          result.totalBefore += b.totalVnd;
          result.totalAfter += totalVnd;
          result.balanceBefore += b.balanceVnd;
          result.balanceAfter += balanceVnd;
        }
        return result;
      }, QUEUED_WRITE),
    );
  } catch (error) {
    if (error instanceof Refusal) return { ok: false, error: error.message };
    // Backstop: another booking took those days a moment ago.
    if (isOverlapViolation(error)) {
      return { ok: false, error: "Another booking just took those days. Try again." };
    }
    throw error;
  }
}

export async function saveStaffNote(db: PrismaClient, bookingId: string, note: string) {
  await db.booking.update({ where: { id: bookingId }, data: { staffNote: note.trim() || null } });
}

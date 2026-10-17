// Creating, cancelling and expiring bookings.
//
// Double-booking is prevented by the database: every booking writes its
// blocked days to BikeOccupancy, whose no-overlap constraint refuses a second
// active row for the same bike and day. reserveBike() picks a free bike, locks
// it so customers booking the same bike take turns (see bike-lock.ts),
// re-checks it, and writes the booking. If another customer won that bike a
// moment earlier, it moves on to the next free bike.

import type { BookingSource, City, PrismaClient } from "@/generated/prisma/client";
import { parseIsoDate, todayInSaigon } from "@/lib/dates";
import { lastBlockedDay, rentalBlocks } from "@/lib/occupancy";
import { quote, type AddOnChoice, type QuoteError } from "@/lib/pricing";
import { generateReference } from "@/lib/reference";
import {
  freeBikes,
  getSettings,
  resolveRoute,
  transitDaysFor,
  type TripError,
} from "@/server/availability";
import { QUEUED_WRITE, bikeIsFree, lockBike } from "@/server/bike-lock";
import { isOverlapViolation, isUniqueViolation, withTransientRetry } from "@/server/db-errors";

const HOUR_MS = 3_600_000;
const REFERENCE_ATTEMPTS = 5;

export type ReserveInput = {
  source: Exclude<BookingSource, "IMPORT">;
  modelId: string;
  /** Walk-ins: the bike the customer is standing next to. Online: leave empty. */
  bikeId?: string;
  pickupCity: City;
  dropoffCity: City;
  /** "YYYY-MM-DD", both days included. */
  startDate: string;
  endDate: string;
  addOns: { addOnId: string; quantity: number }[];
  customer: { name: string; email?: string; phone?: string; note?: string };
  createdById?: string;
  /** For tests; defaults to the current time. */
  now?: Date;
};

export type ReserveError =
  | QuoteError
  | TripError
  | { code: "MODEL_NOT_FOUND" }
  | { code: "ADD_ON_NOT_FOUND"; addOnId: string }
  | { code: "TOO_MANY_ADD_ON"; addOnId: string }
  | { code: "START_IN_PAST" }
  | { code: "NO_BIKE_AVAILABLE" };

export async function reserveBike(db: PrismaClient, input: ReserveInput) {
  const now = input.now ?? new Date();
  const online = input.source === "ONLINE";

  // Free up bikes held by unpaid bookings first, so they can be offered again.
  await releaseExpiredHolds(db, now);

  const start = parseIsoDate(input.startDate);
  const end = parseIsoDate(input.endDate);
  if (!start || !end) return fail({ code: "INVALID_DATE" });
  if (input.startDate < todayInSaigon(now)) return fail({ code: "START_IN_PAST" });

  const model = await db.bikeModel.findUnique({ where: { id: input.modelId } });
  if (!model || !model.active) return fail({ code: "MODEL_NOT_FOUND" });

  const trip = await resolveRoute(db, { ...input, online });
  if (!trip.ok) return fail(trip.error);
  const route = trip.route;

  const routeFee = route
    ? await db.routeFee.findUnique({
        where: { routeId_bikeModelId: { routeId: route.id, bikeModelId: model.id } },
      })
    : null;

  const addOnRows = await db.addOn.findMany({
    where: { id: { in: input.addOns.map((a) => a.addOnId) }, active: true },
    include: { modelPrices: { where: { bikeModelId: model.id } } },
  });
  const addOns: AddOnChoice[] = [];
  for (const choice of input.addOns) {
    const row = addOnRows.find((a) => a.id === choice.addOnId);
    if (!row) return fail({ code: "ADD_ON_NOT_FOUND", addOnId: choice.addOnId });
    // Each extra once, up to its limit (listing it twice would get round that).
    const repeated = addOns.some((a) => a.addOnId === row.id);
    if (repeated || choice.quantity > row.maxQuantity) {
      return fail({ code: "TOO_MANY_ADD_ON", addOnId: row.id });
    }
    addOns.push({
      addOnId: row.id,
      name: row.name,
      pricing: row.pricing,
      // This model's own price if it has one, e.g. insurance on a bigger bike.
      unitPrice: row.modelPrices[0]?.price ?? row.price,
      quantity: choice.quantity,
    });
  }

  const settings = await getSettings(db);
  const priced = quote({
    startDate: input.startDate,
    endDate: input.endDate,
    rates: model,
    oneWay: route ? { minDays: route.minDays, feeVnd: routeFee?.fee ?? null } : null,
    addOns,
    depositVnd: settings.depositVnd,
  });
  if (!priced.ok) return fail(priced.error);
  const q = priced.quote;

  const blocks = rentalBlocks({
    start,
    end,
    cleaningGapDays: settings.cleaningGapDays,
    transitDays: transitDaysFor(route),
  });

  const candidates = await freeBikes(db, {
    modelId: model.id,
    bikeId: input.bikeId,
    first: start,
    last: lastBlockedDay(blocks),
  });

  const last = lastBlockedDay(blocks);
  const bookingData = (bikeId: string) => ({
    reference: generateReference(),
    status: online ? ("PENDING_PAYMENT" as const) : ("CONFIRMED" as const),
    source: input.source,
    bikeModelId: model.id,
    bikeId,
    pickupCity: input.pickupCity,
    dropoffCity: input.dropoffCity,
    routeId: route?.id ?? null,
    startDate: start,
    endDate: end,
    days: q.days,
    rateTier: q.rateTier,
    dailyRate: q.dailyRate,
    rentalVnd: q.rentalVnd,
    oneWayFeeVnd: q.oneWayFeeVnd,
    addOnsVnd: q.addOnsVnd,
    totalVnd: q.totalVnd,
    depositVnd: q.depositVnd,
    balanceVnd: q.balanceVnd,
    customerName: input.customer.name,
    customerEmail: input.customer.email,
    customerPhone: input.customer.phone,
    customerNote: input.customer.note,
    holdExpiresAt: online ? new Date(now.getTime() + settings.holdHours * HOUR_MS) : null,
    createdById: input.createdById,
    addOns: {
      create: q.addOnLines.map((line) => ({
        addOnId: line.addOnId,
        name: line.name,
        pricing: line.pricing,
        unitPrice: line.unitPrice,
        quantity: line.quantity,
        totalVnd: line.totalVnd,
      })),
    },
    occupancies: {
      create: blocks.map((block) => ({
        bikeId,
        kind: block.kind,
        startDate: block.start,
        endDate: block.end,
        createdById: input.createdById,
      })),
    },
  });

  for (const bike of candidates) {
    for (let attempt = 1; attempt <= REFERENCE_ATTEMPTS; attempt++) {
      try {
        const booking = await withTransientRetry(() =>
          db.$transaction(async (tx) => {
            // Take turns with anyone else booking this bike right now, then
            // check it's still free: another customer may have just won it.
            await lockBike(tx, bike.id);
            if (!(await bikeIsFree(tx, bike.id, start, last))) return null;
            // The booking, its add-ons and its blocked days: all or nothing.
            return tx.booking.create({
              data: bookingData(bike.id),
              include: { bike: true, addOns: true, occupancies: true },
            });
          }, QUEUED_WRITE),
        );
        if (!booking) break; // Taken a moment ago: try the next bike.
        return { ok: true as const, booking, quote: q };
      } catch (error) {
        // Backstop: the database itself refused an overlap. Try the next bike.
        if (isOverlapViolation(error)) break;
        // Two bookings drew the same reference: draw again.
        if (isUniqueViolation(error) && attempt < REFERENCE_ATTEMPTS) continue;
        throw error;
      }
    }
  }

  return fail({ code: "NO_BIKE_AVAILABLE" });
}

/**
 * Online bookings whose deposit didn't arrive in time: mark them EXPIRED and
 * free their bikes. Runs before every reservation and from a scheduled job.
 * Returns how many bookings expired.
 */
export async function releaseExpiredHolds(db: PrismaClient, now: Date = new Date()) {
  return db.$transaction(async (tx) => {
    const expired = await tx.booking.findMany({
      where: { status: "PENDING_PAYMENT", holdExpiresAt: { lte: now } },
      select: { id: true },
    });
    if (expired.length === 0) return 0;
    const ids = expired.map((b) => b.id);

    // Re-check the status in the update, in case a payment was confirmed meanwhile.
    const { count } = await tx.booking.updateMany({
      where: { id: { in: ids }, status: "PENDING_PAYMENT" },
      data: { status: "EXPIRED" },
    });
    await tx.bikeOccupancy.updateMany({
      where: { bookingId: { in: ids }, releasedAt: null, booking: { status: "EXPIRED" } },
      data: { releasedAt: now },
    });
    return count;
  });
}

export type CancelError = { code: "BOOKING_NOT_FOUND" } | { code: "CANNOT_CANCEL"; status: string };

/** Cancels a booking that hasn't started yet and frees its bike. */
export async function cancelBooking(db: PrismaClient, bookingId: string, now: Date = new Date()) {
  return db.$transaction(async (tx) => {
    const booking = await tx.booking.findUnique({ where: { id: bookingId } });
    if (!booking) return failure<CancelError>({ code: "BOOKING_NOT_FOUND" });
    if (booking.status !== "PENDING_PAYMENT" && booking.status !== "CONFIRMED") {
      return failure<CancelError>({ code: "CANNOT_CANCEL", status: booking.status });
    }
    await tx.booking.update({
      where: { id: bookingId },
      data: { status: "CANCELLED", cancelledAt: now },
    });
    await tx.bikeOccupancy.updateMany({
      where: { bookingId, releasedAt: null },
      data: { releasedAt: now },
    });
    return { ok: true as const };
  });
}

function fail(error: ReserveError) {
  return failure(error);
}

function failure<E>(error: E) {
  return { ok: false as const, error };
}

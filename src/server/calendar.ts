// Data for the staff calendar: every active bike with what's booked or
// blocked in a window of days, plus today's pick-ups and returns.

import type { PrismaClient } from "@/generated/prisma/client";
import { addDays } from "@/lib/dates";
import { overlapping } from "@/server/availability";

export async function loadCalendar(db: PrismaClient, windowStart: Date, days: number) {
  const windowEnd = addDays(windowStart, days - 1);
  return db.bike.findMany({
    where: { status: "ACTIVE" },
    orderBy: [{ model: { sortOrder: "asc" } }, { plate: "asc" }],
    include: {
      model: { select: { name: true } },
      occupancies: {
        where: overlapping(windowStart, windowEnd),
        orderBy: { startDate: "asc" },
        include: {
          booking: { select: { id: true, reference: true, status: true, customerName: true } },
        },
      },
    },
  });
}

export type CalendarBike = Awaited<ReturnType<typeof loadCalendar>>[number];

/** Online booking requests the shop hasn't answered yet, most urgent first. */
export async function waitingRequests(db: PrismaClient) {
  return db.booking.findMany({
    where: { status: "PENDING_PAYMENT", source: "ONLINE" },
    select: {
      id: true,
      customerName: true,
      startDate: true,
      endDate: true,
      holdExpiresAt: true,
      bike: { select: { plate: true } },
      bikeModel: { select: { name: true } },
    },
    orderBy: { holdExpiresAt: "asc" },
  });
}

/** Bikes going out and coming back today. */
export async function todaysMovements(db: PrismaClient, today: Date) {
  const select = {
    id: true,
    reference: true,
    status: true,
    customerName: true,
    dropoffCity: true,
    bike: { select: { plate: true } },
    bikeModel: { select: { name: true } },
  } as const;
  const [pickups, returns] = await Promise.all([
    db.booking.findMany({
      where: { startDate: today, status: { in: ["CONFIRMED", "PENDING_PAYMENT"] } },
      select,
      orderBy: { createdAt: "asc" },
    }),
    db.booking.findMany({
      where: { endDate: today, status: "CHECKED_OUT" },
      select,
      orderBy: { createdAt: "asc" },
    }),
  ]);
  return { pickups, returns };
}

/**
 * Every pick-up and return from `first` to `last` (inclusive), for the
 * calendar's day list on a phone. Cancelled and declined bookings are left out.
 */
export async function movementsBetween(db: PrismaClient, first: Date, last: Date) {
  const inWindow = { gte: first, lte: last };
  return db.booking.findMany({
    where: {
      status: { in: ["PENDING_PAYMENT", "CONFIRMED", "CHECKED_OUT", "COMPLETED"] },
      OR: [{ startDate: inWindow }, { endDate: inWindow }],
    },
    select: {
      id: true,
      status: true,
      customerName: true,
      startDate: true,
      endDate: true,
      days: true,
      dropoffCity: true,
      bike: { select: { plate: true } },
      bikeModel: { select: { name: true } },
    },
    orderBy: [{ startDate: "asc" }, { createdAt: "asc" }],
  });
}

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

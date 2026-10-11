// Staff blocking a bike for maintenance. The block is a BikeOccupancy row, so
// it takes the bike out of availability the moment it's saved, and the
// database refuses it if the bike is already booked on those days.

import type { PrismaClient } from "@/generated/prisma/client";
import { parseIsoDate, toIsoDate } from "@/lib/dates";
import { overlapping } from "@/server/availability";
import { QUEUED_WRITE, bikeIsFree, lockBike } from "@/server/bike-lock";
import { isOverlapViolation, withTransientRetry } from "@/server/db-errors";

export type Conflict = {
  kind: string;
  startDate: string;
  endDate: string;
  bookingReference: string | null;
};

export async function blockForMaintenance(
  db: PrismaClient,
  input: {
    bikeId: string;
    startDate: string;
    endDate: string;
    note?: string;
    createdById?: string;
  },
) {
  const start = parseIsoDate(input.startDate);
  const end = parseIsoDate(input.endDate);
  if (!start || !end || end < start)
    return { ok: false as const, error: { code: "INVALID_DATE" as const } };

  let block = null;
  try {
    block = await withTransientRetry(() =>
      db.$transaction(async (tx) => {
        // Take turns with any booking being written for this bike right now.
        await lockBike(tx, input.bikeId);
        if (!(await bikeIsFree(tx, input.bikeId, start, end))) return null;
        return tx.bikeOccupancy.create({
          data: {
            bikeId: input.bikeId,
            kind: "MAINTENANCE",
            startDate: start,
            endDate: end,
            note: input.note,
            createdById: input.createdById,
          },
        });
      }, QUEUED_WRITE),
    );
  } catch (error) {
    // Backstop: the database itself refused an overlap.
    if (!isOverlapViolation(error)) throw error;
  }
  if (block) return { ok: true as const, block };

  // Tell staff what's in the way, so they can move the booking or pick other days.
  const existing = await db.bikeOccupancy.findMany({
    where: { bikeId: input.bikeId, ...overlapping(start, end) },
    include: { booking: { select: { reference: true } } },
    orderBy: { startDate: "asc" },
  });
  const conflicts: Conflict[] = existing.map((o) => ({
    kind: o.kind,
    startDate: toIsoDate(o.startDate),
    endDate: toIsoDate(o.endDate),
    bookingReference: o.booking?.reference ?? null,
  }));
  return { ok: false as const, error: { code: "BIKE_BUSY" as const, conflicts } };
}

/** Ends a maintenance block early; the bike is bookable again straight away. */
export async function liftBlock(db: PrismaClient, occupancyId: string, now: Date = new Date()) {
  const { count } = await db.bikeOccupancy.updateMany({
    where: { id: occupancyId, kind: "MAINTENANCE", releasedAt: null },
    data: { releasedAt: now },
  });
  return count === 1;
}

// Queueing writes per bike.
//
// Two transactions saving overlapping blocks for the same bike at the same
// instant would each wait for the other inside the no-overlap check, until
// Postgres notices the deadlock (about a second later) and cancels one. To
// avoid that, every write that adds a booking or block first locks the bike's
// row: writers for the same bike take turns, writers for different bikes don't
// wait for each other. The no-overlap constraint stays as the final guarantee.

import type { Prisma } from "@/generated/prisma/client";
import { overlapping } from "@/server/availability";

/** Transaction options for writes that may queue behind other customers. */
export const QUEUED_WRITE = { maxWait: 10_000, timeout: 15_000 };

/** Waits until no other transaction is writing to this bike, then holds it. */
export async function lockBike(tx: Prisma.TransactionClient, bikeId: string) {
  await tx.$queryRaw`SELECT id FROM "Bike" WHERE id = ${bikeId} FOR UPDATE`;
}

/** After lockBike: true if the bike has nothing booked or blocked on these days. */
export async function bikeIsFree(
  tx: Prisma.TransactionClient,
  bikeId: string,
  first: Date,
  last: Date,
) {
  const clash = await tx.bikeOccupancy.findFirst({
    where: { bikeId, ...overlapping(first, last) },
    select: { id: true },
  });
  return clash === null;
}

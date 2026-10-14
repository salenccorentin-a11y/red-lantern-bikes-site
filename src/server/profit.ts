// Profit per bike for a period: what its rentals brought in, minus what its
// repairs and incidents cost. Owners only.
//
// Revenue counts bookings where the bike actually went out (checked out or
// returned), in the period the rental started. Online deposits kept from
// cancellations will be added once payments are recorded (payment step).

import type { PrismaClient } from "@/generated/prisma/client";
import { netCost } from "@/server/incidents";

export type BikeProfit = {
  bikeId: string;
  plate: string;
  modelName: string;
  status: string;
  rentals: number;
  rentalDays: number;
  revenueVnd: number;
  costVnd: number;
  profitVnd: number;
};

/** `from` and `to` are calendar days, both included. */
export async function profitByBike(db: PrismaClient, from: Date, to: Date): Promise<BikeProfit[]> {
  const [bikes, bookings, incidents] = await Promise.all([
    db.bike.findMany({
      include: { model: { select: { name: true, sortOrder: true } } },
      orderBy: [{ model: { sortOrder: "asc" } }, { plate: "asc" }],
    }),
    db.booking.findMany({
      where: {
        bikeId: { not: null },
        status: { in: ["CHECKED_OUT", "COMPLETED"] },
        startDate: { gte: from, lte: to },
      },
      select: { bikeId: true, totalVnd: true, days: true },
    }),
    db.bikeIncident.findMany({
      where: { occurredOn: { gte: from, lte: to } },
      select: { bikeId: true, partsVnd: true, labourVnd: true, otherVnd: true, recoveredVnd: true },
    }),
  ]);

  return bikes.map((bike) => {
    const rented = bookings.filter((b) => b.bikeId === bike.id);
    const revenueVnd = rented.reduce((sum, b) => sum + b.totalVnd, 0);
    const costVnd = incidents
      .filter((i) => i.bikeId === bike.id)
      .reduce((sum, i) => sum + netCost(i), 0);
    return {
      bikeId: bike.id,
      plate: bike.plate,
      modelName: bike.model.name,
      status: bike.status,
      rentals: rented.length,
      rentalDays: rented.reduce((sum, b) => sum + b.days, 0),
      revenueVnd,
      costVnd,
      profitVnd: revenueVnd - costVnd,
    };
  });
}

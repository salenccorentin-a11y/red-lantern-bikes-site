// Shared set-up for booking tests: the real seeded fleet and a fixed clock.
import type { PrismaClient } from "@/generated/prisma/client";
import { seed } from "@/db/seed";
import type { ReserveInput } from "@/server/bookings";

/** 10:00 on 11 October 2026 in Saigon. */
export const NOW = new Date("2026-10-11T03:00:00Z");

export async function seededFleet(db: PrismaClient) {
  await seed(db);
  const model = (slug: string) => db.bikeModel.findUniqueOrThrow({ where: { slug } });
  return {
    versys: await model("kawasaki-versys-x300"), // 1 bike
    cb150x: await model("honda-cb150x"), // 2 bikes
    xr150: await model("honda-xr150"), // 8 bikes
    wave: await model("wave-alpha-110"), // 4 bikes
  };
}

/** An online Saigon round trip; override any field. */
export function onlineBooking(
  modelId: string,
  overrides: Partial<ReserveInput> = {},
): ReserveInput {
  return {
    source: "ONLINE",
    modelId,
    pickupCity: "SAIGON",
    dropoffCity: "SAIGON",
    startDate: "2026-11-10",
    endDate: "2026-11-17",
    addOns: [],
    customer: { name: "Test Rider", email: "rider@example.com" },
    now: NOW,
    ...overrides,
  };
}

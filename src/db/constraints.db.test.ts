// The database itself must refuse impossible data, whatever the app code does.
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import type { OccupancyKind } from "@/generated/prisma/client";
import { createTestClient, day, resetDatabase } from "@/test/db";

const db = createTestClient();

let bikeA: string;
let bikeB: string;

beforeEach(async () => {
  await resetDatabase(db);
  const model = await db.bikeModel.create({
    data: {
      slug: "honda-xr150",
      name: "Honda XR150",
      kind: "Manual dual-sport",
      dailyRate: 400_000,
      weeklyRate: 350_000,
      monthlyRate: 300_000,
    },
  });
  bikeA = (await db.bike.create({ data: { plate: "TEST-A", modelId: model.id } })).id;
  bikeB = (await db.bike.create({ data: { plate: "TEST-B", modelId: model.id } })).id;
});

afterAll(() => db.$disconnect());

function block(bikeId: string, start: string, end: string, kind: OccupancyKind = "BOOKING") {
  return db.bikeOccupancy.create({
    data: { bikeId, kind, startDate: day(start), endDate: day(end) },
  });
}

describe("no double-booking (BikeOccupancy_no_overlap)", () => {
  it("refuses a second booking that overlaps the first on the same bike", async () => {
    await block(bikeA, "2026-11-10", "2026-11-17");
    await expect(block(bikeA, "2026-11-15", "2026-11-20")).rejects.toThrow();
  });

  it("refuses a booking that starts on the day the previous one ends (both days count)", async () => {
    await block(bikeA, "2026-11-10", "2026-11-17");
    await expect(block(bikeA, "2026-11-17", "2026-11-20")).rejects.toThrow();
  });

  it("allows the next booking to start the day after", async () => {
    await block(bikeA, "2026-11-10", "2026-11-17");
    await expect(block(bikeA, "2026-11-18", "2026-11-20")).resolves.toBeDefined();
  });

  it("refuses a booking during a maintenance block", async () => {
    await block(bikeA, "2026-11-12", "2026-11-13", "MAINTENANCE");
    await expect(block(bikeA, "2026-11-10", "2026-11-17")).rejects.toThrow();
  });

  it("allows the same dates on a different bike", async () => {
    await block(bikeA, "2026-11-10", "2026-11-17");
    await expect(block(bikeB, "2026-11-10", "2026-11-17")).resolves.toBeDefined();
  });

  it("frees the bike once a booking is released (cancelled), keeping the old row", async () => {
    const first = await block(bikeA, "2026-11-10", "2026-11-17");
    await db.bikeOccupancy.update({ where: { id: first.id }, data: { releasedAt: new Date() } });

    await expect(block(bikeA, "2026-11-10", "2026-11-17")).resolves.toBeDefined();
    expect(await db.bikeOccupancy.count({ where: { bikeId: bikeA } })).toBe(2);
  });

  it("allows only one of five simultaneous bookings for the same bike and dates", async () => {
    const attempts = await Promise.allSettled(
      Array.from({ length: 5 }, () => block(bikeA, "2026-12-01", "2026-12-05")),
    );
    expect(attempts.filter((a) => a.status === "fulfilled")).toHaveLength(1);
  });

  it("refuses an end date before the start date", async () => {
    await expect(block(bikeA, "2026-11-17", "2026-11-10")).rejects.toThrow();
  });
});

describe("other data rules", () => {
  it("refuses a booking whose deposit and balance don't add up to the total", async () => {
    const model = await db.bikeModel.findFirstOrThrow();
    await expect(
      db.booking.create({
        data: {
          reference: "RLB-000001",
          status: "CONFIRMED",
          source: "WALK_IN",
          bikeModelId: model.id,
          bikeId: bikeA,
          pickupCity: "SAIGON",
          dropoffCity: "SAIGON",
          startDate: day("2026-11-10"),
          endDate: day("2026-11-10"),
          days: 1,
          rateTier: "DAILY",
          dailyRate: 400_000,
          rentalVnd: 400_000,
          totalVnd: 400_000,
          depositVnd: 400_000,
          balanceVnd: 100_000,
          customerName: "Test Rider",
        },
      }),
    ).rejects.toThrow();
  });

  it("allows only one settings row", async () => {
    await db.siteSettings.create({ data: { id: 1 } });
    await expect(db.siteSettings.create({ data: { id: 2 } })).rejects.toThrow();
  });
});

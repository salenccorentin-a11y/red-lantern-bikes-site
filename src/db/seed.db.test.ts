import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { seed } from "@/db/seed";
import { BIKE_MODELS } from "@/db/seed-data";
import { createTestClient, resetDatabase } from "@/test/db";

const db = createTestClient();

beforeEach(() => resetDatabase(db));
afterAll(() => db.$disconnect());

describe("seed", () => {
  it("creates the fleet from docs/pricing.md: 26 bikes across 12 models", async () => {
    await seed(db);

    const models = await db.bikeModel.findMany({
      include: { _count: { select: { bikes: true } } },
    });
    expect(models).toHaveLength(12);
    expect(await db.bike.count()).toBe(26);

    for (const { slug, units } of BIKE_MODELS) {
      expect(models.find((m) => m.slug === slug)?._count.bikes, slug).toBe(units);
    }

    const xr150 = models.find((m) => m.slug === "honda-xr150");
    expect(xr150).toMatchObject({ dailyRate: 400_000, weeklyRate: 350_000, monthlyRate: 300_000 });
  });

  it("sets up the two online routes with 3 days back by train; reverse routes are enquiries", async () => {
    await seed(db);

    const routes = await db.route.findMany();
    expect(routes).toHaveLength(4);
    const summary = routes
      .map((r) => `${r.fromCity}>${r.toCity} online=${r.bookableOnline} transit=${r.transitDays}`)
      .sort();
    expect(summary).toEqual([
      "DA_NANG>SAIGON online=false transit=null",
      "HANOI>SAIGON online=false transit=null",
      "SAIGON>DA_NANG online=true transit=3",
      "SAIGON>HANOI online=true transit=3",
    ]);
  });

  it("sets one-way fees by model ($50 / $60 / $80), the same on both online routes", async () => {
    await seed(db);

    const fees = await db.routeFee.findMany({ include: { bikeModel: true, route: true } });
    expect(fees).toHaveLength(24); // 12 models × 2 routes
    expect(fees.every((f) => f.route.bookableOnline)).toBe(true);

    const feeOf = (slug: string) => [
      ...new Set(fees.filter((f) => f.bikeModel.slug === slug).map((f) => f.fee)),
    ];
    expect(feeOf("wave-alpha-110")).toEqual([1_300_000]);
    expect(feeOf("suzuki-gd110")).toEqual([1_300_000]);
    expect(feeOf("honda-xr150")).toEqual([1_600_000]);
    expect(feeOf("yamaha-wr155r")).toEqual([1_600_000]);
    expect(feeOf("honda-cb150x")).toEqual([2_100_000]);
    expect(feeOf("kawasaki-versys-x300")).toEqual([2_100_000]);
  });

  it("fills in empty transit days on an existing route without touching set values", async () => {
    await db.route.create({
      data: { fromCity: "SAIGON", toCity: "HANOI", minDays: 12, transitDays: null },
    });
    await db.route.create({
      data: { fromCity: "SAIGON", toCity: "DA_NANG", minDays: 7, transitDays: 5 },
    });

    await seed(db);

    const routes = await db.route.findMany({ where: { fromCity: "SAIGON" } });
    expect(routes.find((r) => r.toCity === "HANOI")?.transitDays).toBe(3);
    expect(routes.find((r) => r.toCity === "DA_NANG")?.transitDays).toBe(5);
  });

  it("uses the decided settings: 1,500,000 deposit, 0-day gap, 24-hour hold", async () => {
    await seed(db);

    expect(await db.siteSettings.findUniqueOrThrow({ where: { id: 1 } })).toMatchObject({
      depositVnd: 1_500_000,
      cleaningGapDays: 0,
      holdHours: 24,
    });
  });

  it("can run again without duplicating anything or overwriting staff edits", async () => {
    await seed(db);
    await db.bikeModel.update({ where: { slug: "honda-xr150" }, data: { dailyRate: 420_000 } });

    await seed(db);

    expect(await db.bike.count()).toBe(26);
    expect(await db.route.count()).toBe(4);
    const xr150 = await db.bikeModel.findUniqueOrThrow({ where: { slug: "honda-xr150" } });
    expect(xr150.dailyRate).toBe(420_000);
  });
});

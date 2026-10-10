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

  it("sets up routes without guessing unknown fees or transit days", async () => {
    await seed(db);

    const routes = await db.route.findMany();
    expect(routes).toHaveLength(4);
    expect(routes.every((r) => r.transitDays === null)).toBe(true);
    expect(await db.routeFee.count()).toBe(0);

    const online = routes.filter((r) => r.bookableOnline).map((r) => `${r.fromCity}>${r.toCity}`);
    expect(online.sort()).toEqual(["SAIGON>DA_NANG", "SAIGON>HANOI"]);
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

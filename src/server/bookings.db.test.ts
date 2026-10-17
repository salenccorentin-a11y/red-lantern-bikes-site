import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { toIsoDate } from "@/lib/dates";
import { REFERENCE_PATTERN } from "@/lib/reference";
import { availabilityByModel } from "@/server/availability";
import { cancelBooking, releaseExpiredHolds, reserveBike } from "@/server/bookings";
import { createTestClient, resetDatabase } from "@/test/db";
import { NOW, onlineBooking, seededFleet } from "@/test/fixtures";

const db = createTestClient();
let fleet: Awaited<ReturnType<typeof seededFleet>>;

beforeEach(async () => {
  await resetDatabase(db);
  fleet = await seededFleet(db);
});
afterAll(() => db.$disconnect());

const HOUR_MS = 3_600_000;

const addOn = (slug: string) => db.addOn.findUniqueOrThrow({ where: { slug } });

async function blocksOf(bookingId: string) {
  const rows = await db.bikeOccupancy.findMany({
    where: { bookingId },
    orderBy: { startDate: "asc" },
  });
  return rows.map(
    (o) =>
      `${o.kind} ${toIsoDate(o.startDate)}..${toIsoDate(o.endDate)}${o.releasedAt ? " released" : ""}`,
  );
}

function expectOk<T extends { ok: boolean }>(result: T): Extract<T, { ok: true }> {
  if (!result.ok) throw new Error(`Expected success, got ${JSON.stringify(result)}`);
  return result as Extract<T, { ok: true }>;
}

describe("reserveBike: online round trip", () => {
  it("creates a booking waiting for payment, with the price snapshot and a 24-hour hold", async () => {
    const { booking } = expectOk(await reserveBike(db, onlineBooking(fleet.xr150.id)));

    expect(booking.reference).toMatch(REFERENCE_PATTERN);
    expect(booking).toMatchObject({
      status: "PENDING_PAYMENT",
      source: "ONLINE",
      bikeModelId: fleet.xr150.id,
      days: 8,
      rateTier: "WEEKLY",
      dailyRate: 350_000,
      rentalVnd: 2_800_000,
      oneWayFeeVnd: 0,
      totalVnd: 2_800_000,
      depositVnd: 1_500_000,
      balanceVnd: 1_300_000,
    });
    expect(booking.bike?.modelId).toBe(fleet.xr150.id);
    expect(booking.holdExpiresAt?.getTime()).toBe(NOW.getTime() + 24 * HOUR_MS);
    expect(await blocksOf(booking.id)).toEqual(["BOOKING 2026-11-10..2026-11-17"]);
  });

  it("adds the cleaning gap from settings after drop-off", async () => {
    await db.siteSettings.update({ where: { id: 1 }, data: { cleaningGapDays: 1 } });
    const { booking } = expectOk(await reserveBike(db, onlineBooking(fleet.xr150.id)));
    expect(await blocksOf(booking.id)).toEqual(["BOOKING 2026-11-10..2026-11-18"]);
  });

  it("stores add-ons with their prices at booking time", async () => {
    const insurance = await addOn("insurance");
    const helmet = await addOn("premium-helmet");
    const result = await reserveBike(
      db,
      onlineBooking(fleet.xr150.id, {
        addOns: [
          { addOnId: insurance.id, quantity: 1 },
          { addOnId: helmet.id, quantity: 2 },
        ],
      }),
    );
    const { booking } = expectOk(result);
    // Insurance 8 days × 130,000 (a 150cc), plus two helmets at 500,000 each.
    expect(booking.addOnsVnd).toBe(1_040_000 + 1_000_000);
    expect(booking.totalVnd).toBe(2_800_000 + 2_040_000);
    expect(booking.addOns).toMatchObject([
      { name: "Full coverage insurance", unitPrice: 130_000, quantity: 1, totalVnd: 1_040_000 },
      { name: "Premium helmet", unitPrice: 500_000, quantity: 2, totalVnd: 1_000_000 },
    ]);
  });
});

describe("reserveBike: add-ons", () => {
  it("prices insurance by bike: 80,000 a day on a Wave, 260,000 on the Versys", async () => {
    const insurance = await addOn("insurance");
    const addOns = [{ addOnId: insurance.id, quantity: 1 }];
    const wave = expectOk(await reserveBike(db, onlineBooking(fleet.wave.id, { addOns })));
    const versys = expectOk(await reserveBike(db, onlineBooking(fleet.versys.id, { addOns })));
    expect(wave.booking.addOns[0]).toMatchObject({ unitPrice: 80_000, totalVnd: 640_000 });
    expect(versys.booking.addOns[0]).toMatchObject({ unitPrice: 260_000, totalVnd: 2_080_000 });
  });

  it("uses the add-on's usual price for a model without its own", async () => {
    const insurance = await addOn("insurance");
    await db.addOnModelPrice.deleteMany({ where: { addOnId: insurance.id } });
    const { booking } = expectOk(
      await reserveBike(
        db,
        onlineBooking(fleet.versys.id, { addOns: [{ addOnId: insurance.id, quantity: 1 }] }),
      ),
    );
    expect(booking.addOns[0].unitPrice).toBe(80_000);
  });

  it("refuses more than the add-on's maximum", async () => {
    const gloves = await addOn("gloves");
    const result = await reserveBike(
      db,
      onlineBooking(fleet.xr150.id, { addOns: [{ addOnId: gloves.id, quantity: 3 }] }),
    );
    expect(result).toEqual({ ok: false, error: { code: "TOO_MANY_ADD_ON", addOnId: gloves.id } });
  });

  it("refuses the same add-on listed twice (which would get round the maximum)", async () => {
    const gloves = await addOn("gloves");
    const result = await reserveBike(
      db,
      onlineBooking(fleet.xr150.id, {
        addOns: [
          { addOnId: gloves.id, quantity: 2 },
          { addOnId: gloves.id, quantity: 2 },
        ],
      }),
    );
    expect(result).toEqual({ ok: false, error: { code: "TOO_MANY_ADD_ON", addOnId: gloves.id } });
  });
});

describe("reserveBike: one-way", () => {
  it("Saigon to Hanoi: charges the model's fee and blocks 3 train days after drop-off", async () => {
    const result = await reserveBike(
      db,
      onlineBooking(fleet.xr150.id, {
        dropoffCity: "HANOI",
        startDate: "2026-11-01",
        endDate: "2026-11-12",
      }),
    );
    const { booking } = expectOk(result);
    expect(booking).toMatchObject({ days: 12, oneWayFeeVnd: 1_600_000, totalVnd: 5_800_000 });
    expect(await blocksOf(booking.id)).toEqual([
      "BOOKING 2026-11-01..2026-11-12",
      "TRANSIT 2026-11-13..2026-11-15",
    ]);
  });

  it("keeps the bike unavailable in Saigon while it's on the train, and frees it after", async () => {
    const trip = {
      dropoffCity: "DA_NANG" as const,
      startDate: "2026-11-01",
      endDate: "2026-11-07",
    };
    expectOk(await reserveBike(db, onlineBooking(fleet.versys.id, trip)));

    // Train days 8 to 10 November: the only Versys is away.
    const duringTrain = await reserveBike(
      db,
      onlineBooking(fleet.versys.id, { startDate: "2026-11-10", endDate: "2026-11-12" }),
    );
    expect(duringTrain).toEqual({ ok: false, error: { code: "NO_BIKE_AVAILABLE" } });

    const afterTrain = await reserveBike(
      db,
      onlineBooking(fleet.versys.id, { startDate: "2026-11-11", endDate: "2026-11-12" }),
    );
    expect(afterTrain.ok).toBe(true);
  });

  it("refuses a trip shorter than the route minimum", async () => {
    const result = await reserveBike(
      db,
      onlineBooking(fleet.xr150.id, {
        dropoffCity: "HANOI",
        startDate: "2026-11-01",
        endDate: "2026-11-11",
      }),
    );
    expect(result).toEqual({ ok: false, error: { code: "BELOW_MIN_DAYS", minDays: 12 } });
  });

  it("refuses reverse routes online (they're enquiries)", async () => {
    const result = await reserveBike(
      db,
      onlineBooking(fleet.xr150.id, {
        pickupCity: "HANOI",
        dropoffCity: "SAIGON",
        endDate: "2026-11-30",
      }),
    );
    expect(result).toEqual({ ok: false, error: { code: "ROUTE_NOT_BOOKABLE_ONLINE" } });
  });

  it("refuses a route whose transit days aren't set yet", async () => {
    await db.route.updateMany({ where: { toCity: "HANOI" }, data: { transitDays: null } });
    const result = await reserveBike(
      db,
      onlineBooking(fleet.xr150.id, {
        dropoffCity: "HANOI",
        startDate: "2026-11-01",
        endDate: "2026-11-12",
      }),
    );
    expect(result).toEqual({ ok: false, error: { code: "ROUTE_NOT_READY" } });
  });
});

describe("reserveBike: picking a physical bike", () => {
  it("gives each overlapping booking a different bike, then runs out", async () => {
    const first = expectOk(await reserveBike(db, onlineBooking(fleet.cb150x.id)));
    const second = expectOk(await reserveBike(db, onlineBooking(fleet.cb150x.id)));
    expect(first.booking.bikeId).not.toBe(second.booking.bikeId);

    const third = await reserveBike(db, onlineBooking(fleet.cb150x.id));
    expect(third).toEqual({ ok: false, error: { code: "NO_BIKE_AVAILABLE" } });
  });

  it("books the same bike again from the day after drop-off", async () => {
    expectOk(await reserveBike(db, onlineBooking(fleet.versys.id)));
    const next = await reserveBike(
      db,
      onlineBooking(fleet.versys.id, { startDate: "2026-11-18", endDate: "2026-11-20" }),
    );
    expect(next.ok).toBe(true);
  });

  it("never assigns a retired bike", async () => {
    await db.bike.updateMany({ where: { modelId: fleet.versys.id }, data: { status: "RETIRED" } });
    const result = await reserveBike(db, onlineBooking(fleet.versys.id));
    expect(result).toEqual({ ok: false, error: { code: "NO_BIKE_AVAILABLE" } });
  });

  it("walk-in: books the bike staff choose, confirmed straight away with no hold", async () => {
    const bikes = await db.bike.findMany({
      where: { modelId: fleet.cb150x.id },
      orderBy: { plate: "desc" },
    });
    const result = await reserveBike(
      db,
      onlineBooking(fleet.cb150x.id, {
        source: "WALK_IN",
        bikeId: bikes[0].id,
        startDate: "2026-10-11",
      }),
    );
    const { booking } = expectOk(result);
    expect(booking).toMatchObject({
      bikeId: bikes[0].id,
      status: "CONFIRMED",
      holdExpiresAt: null,
    });
  });
});

describe("reserveBike: validation", () => {
  it("refuses a pick-up date in the past (Saigon time)", async () => {
    const result = await reserveBike(
      db,
      onlineBooking(fleet.xr150.id, { startDate: "2026-10-10", endDate: "2026-10-12" }),
    );
    expect(result).toEqual({ ok: false, error: { code: "START_IN_PAST" } });
  });

  it("accepts a pick-up today", async () => {
    const result = await reserveBike(
      db,
      onlineBooking(fleet.xr150.id, { startDate: "2026-10-11", endDate: "2026-10-12" }),
    );
    expect(result.ok).toBe(true);
  });

  it("refuses an unknown or inactive add-on", async () => {
    const result = await reserveBike(
      db,
      onlineBooking(fleet.xr150.id, { addOns: [{ addOnId: "nope", quantity: 1 }] }),
    );
    expect(result).toEqual({ ok: false, error: { code: "ADD_ON_NOT_FOUND", addOnId: "nope" } });
  });

  it("refuses an inactive model", async () => {
    await db.bikeModel.update({ where: { id: fleet.xr150.id }, data: { active: false } });
    const result = await reserveBike(db, onlineBooking(fleet.xr150.id));
    expect(result).toEqual({ ok: false, error: { code: "MODEL_NOT_FOUND" } });
  });
});

describe("unpaid holds", () => {
  it("expire after 24 hours and free the bike", async () => {
    const { booking } = expectOk(await reserveBike(db, onlineBooking(fleet.versys.id)));

    expect(await releaseExpiredHolds(db, new Date(NOW.getTime() + 23 * HOUR_MS))).toBe(0);
    expect(await releaseExpiredHolds(db, new Date(NOW.getTime() + 24 * HOUR_MS))).toBe(1);

    const expired = await db.booking.findUniqueOrThrow({ where: { id: booking.id } });
    expect(expired.status).toBe("EXPIRED");
    expect(await blocksOf(booking.id)).toEqual(["BOOKING 2026-11-10..2026-11-17 released"]);
  });

  it("are released automatically when the next customer tries to book", async () => {
    expectOk(await reserveBike(db, onlineBooking(fleet.versys.id)));

    const tooSoon = await reserveBike(
      db,
      onlineBooking(fleet.versys.id, { now: new Date(NOW.getTime() + 2 * HOUR_MS) }),
    );
    expect(tooSoon).toEqual({ ok: false, error: { code: "NO_BIKE_AVAILABLE" } });

    const nextDay = await reserveBike(
      db,
      onlineBooking(fleet.versys.id, { now: new Date(NOW.getTime() + 25 * HOUR_MS) }),
    );
    expect(nextDay.ok).toBe(true);
  });

  it("leave confirmed bookings alone", async () => {
    const { booking } = expectOk(await reserveBike(db, onlineBooking(fleet.versys.id)));
    await db.booking.update({ where: { id: booking.id }, data: { status: "CONFIRMED" } });

    expect(await releaseExpiredHolds(db, new Date(NOW.getTime() + 48 * HOUR_MS))).toBe(0);
    expect(await blocksOf(booking.id)).toEqual(["BOOKING 2026-11-10..2026-11-17"]);
  });
});

describe("cancelBooking", () => {
  it("frees the bike and keeps the booking for history", async () => {
    const { booking } = expectOk(await reserveBike(db, onlineBooking(fleet.versys.id)));
    expect(await cancelBooking(db, booking.id, NOW)).toEqual({ ok: true });

    expect((await db.booking.findUniqueOrThrow({ where: { id: booking.id } })).status).toBe(
      "CANCELLED",
    );
    expect((await reserveBike(db, onlineBooking(fleet.versys.id))).ok).toBe(true);
  });

  it("refuses to cancel a booking that's already under way", async () => {
    const { booking } = expectOk(await reserveBike(db, onlineBooking(fleet.versys.id)));
    await db.booking.update({ where: { id: booking.id }, data: { status: "CHECKED_OUT" } });
    expect(await cancelBooking(db, booking.id, NOW)).toEqual({
      ok: false,
      error: { code: "CANNOT_CANCEL", status: "CHECKED_OUT" },
    });
  });
});

describe("availabilityByModel", () => {
  it("counts free bikes per model and leaves out models that are fully booked", async () => {
    expectOk(await reserveBike(db, onlineBooking(fleet.versys.id)));
    expectOk(await reserveBike(db, onlineBooking(fleet.cb150x.id)));

    const counts = await availabilityByModel(db, {
      startDate: "2026-11-12",
      endDate: "2026-11-14",
      pickupCity: "SAIGON",
      dropoffCity: "SAIGON",
    });
    expect(counts.get(fleet.versys.id)).toBeUndefined();
    expect(counts.get(fleet.cb150x.id)).toBe(1);
    expect(counts.get(fleet.xr150.id)).toBe(8);
    expect([...counts.values()].reduce((a, b) => a + b, 0)).toBe(24);
  });

  it("includes the train days for one-way trips", async () => {
    // The Versys is booked from 15 November.
    expectOk(
      await reserveBike(
        db,
        onlineBooking(fleet.versys.id, { startDate: "2026-11-15", endDate: "2026-11-16" }),
      ),
    );
    // A Da Nang trip ending 12 November would keep it away until 15 November.
    const counts = await availabilityByModel(db, {
      startDate: "2026-11-06",
      endDate: "2026-11-12",
      pickupCity: "SAIGON",
      dropoffCity: "DA_NANG",
    });
    expect(counts.get(fleet.versys.id)).toBeUndefined();
  });
});

import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { toIsoDate } from "@/lib/dates";
import { checkIn, checkOut } from "@/server/booking-admin";
import { reserveBike } from "@/server/bookings";
import { createTestClient, resetDatabase } from "@/test/db";
import { NOW, onlineBooking, seededFleet } from "@/test/fixtures";

const db = createTestClient();
let fleet: Awaited<ReturnType<typeof seededFleet>>;

beforeEach(async () => {
  await resetDatabase(db);
  fleet = await seededFleet(db);
});
afterAll(() => db.$disconnect());

/** A moment on the given Saigon day, 10:00 local time. */
const onDay = (iso: string) => new Date(`${iso}T03:00:00Z`);

async function book(overrides = {}) {
  const result = await reserveBike(db, onlineBooking(fleet.versys.id, overrides));
  if (!result.ok) throw new Error(JSON.stringify(result.error));
  return result.booking;
}

async function blocks(bookingId: string) {
  const rows = await db.bikeOccupancy.findMany({
    where: { bookingId },
    orderBy: { startDate: "asc" },
  });
  return rows.map((o) => `${o.kind} ${toIsoDate(o.startDate)}..${toIsoDate(o.endDate)}`);
}

describe("checkOut", () => {
  it("hands over a confirmed or unpaid booking and stops its hold expiring", async () => {
    const booking = await book();
    expect(await checkOut(db, booking.id, onDay("2026-11-10"))).toEqual({ ok: true });

    const after = await db.booking.findUniqueOrThrow({ where: { id: booking.id } });
    expect(after).toMatchObject({ status: "CHECKED_OUT", holdExpiresAt: null });
    expect(after.checkedOutAt).toEqual(onDay("2026-11-10"));
  });

  it("can't check out twice, or a cancelled booking", async () => {
    const booking = await book();
    await checkOut(db, booking.id, NOW);
    expect((await checkOut(db, booking.id, NOW)).ok).toBe(false);

    const cancelled = await book({ startDate: "2026-12-01", endDate: "2026-12-02" });
    await db.booking.update({ where: { id: cancelled.id }, data: { status: "CANCELLED" } });
    expect((await checkOut(db, cancelled.id, NOW)).ok).toBe(false);
  });
});

describe("checkIn", () => {
  it("completes the booking", async () => {
    const booking = await book();
    await checkOut(db, booking.id, onDay("2026-11-10"));
    expect(await checkIn(db, booking.id, onDay("2026-11-17"))).toEqual({ ok: true });
    expect((await db.booking.findUniqueOrThrow({ where: { id: booking.id } })).status).toBe(
      "COMPLETED",
    );
    expect(await blocks(booking.id)).toEqual(["BOOKING 2026-11-10..2026-11-17"]);
  });

  it("frees the remaining days when a round trip comes back early, without changing the price", async () => {
    const booking = await book();
    await checkOut(db, booking.id, onDay("2026-11-10"));
    await checkIn(db, booking.id, onDay("2026-11-13"));

    expect(await blocks(booking.id)).toEqual(["BOOKING 2026-11-10..2026-11-13"]);
    const after = await db.booking.findUniqueOrThrow({ where: { id: booking.id } });
    expect(after.totalVnd).toBe(booking.totalVnd);

    // The Versys can be rented again from the 14th.
    const next = await reserveBike(
      db,
      onlineBooking(fleet.versys.id, { startDate: "2026-11-14", endDate: "2026-11-16" }),
    );
    expect(next.ok).toBe(true);
  });

  it("keeps the cleaning gap after an early return", async () => {
    await db.siteSettings.update({ where: { id: 1 }, data: { cleaningGapDays: 1 } });
    const booking = await book();
    await checkOut(db, booking.id, onDay("2026-11-10"));
    await checkIn(db, booking.id, onDay("2026-11-13"));
    expect(await blocks(booking.id)).toEqual(["BOOKING 2026-11-10..2026-11-14"]);
  });

  it("keeps the train-back block for a one-way trip", async () => {
    const booking = await book({
      dropoffCity: "DA_NANG",
      startDate: "2026-11-01",
      endDate: "2026-11-07",
    });
    await checkOut(db, booking.id, onDay("2026-11-01"));
    await checkIn(db, booking.id, onDay("2026-11-05"));
    expect(await blocks(booking.id)).toEqual([
      "BOOKING 2026-11-01..2026-11-07",
      "TRANSIT 2026-11-08..2026-11-10",
    ]);
  });

  it("only works on a bike that's out", async () => {
    const booking = await book();
    expect((await checkIn(db, booking.id, NOW)).ok).toBe(false);
  });
});

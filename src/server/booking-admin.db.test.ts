import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { toIsoDate } from "@/lib/dates";
import { changeDates, checkIn, checkOut } from "@/server/booking-admin";
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

describe("changeDates", () => {
  const dates = (startDate: string, endDate: string) => ({ startDate, endDate });

  it("extends a rental: the bike's days move and the price follows the new length", async () => {
    await db.siteSettings.update({ where: { id: 1 }, data: { cleaningGapDays: 1 } });
    const perDay = await db.addOn.findFirstOrThrow({ where: { pricing: "PER_DAY" } });
    const booking = await book({
      startDate: "2026-11-10",
      endDate: "2026-11-15",
      addOns: [{ addOnId: perDay.id, quantity: 1 }],
    });
    expect(booking.days).toBe(6);

    const result = await changeDates(db, [booking.id], dates("2026-11-10", "2026-11-17"), NOW);
    expect(result).toMatchObject({ ok: true, days: 8, totalBefore: booking.totalVnd });

    const after = await db.booking.findUniqueOrThrow({
      where: { id: booking.id },
      include: { addOns: true },
    });
    expect(toIsoDate(after.endDate)).toBe("2026-11-17");
    expect(after).toMatchObject({
      days: 8,
      rateTier: "WEEKLY",
      dailyRate: fleet.versys.weeklyRate,
      rentalVnd: fleet.versys.weeklyRate * 8,
      depositVnd: booking.depositVnd,
    });
    expect(after.addOns[0].totalVnd).toBe(after.addOns[0].unitPrice * 8);
    expect(after.totalVnd).toBe(after.rentalVnd + after.addOnsVnd);
    expect(after.balanceVnd).toBe(after.totalVnd - after.depositVnd);
    expect(result.ok && result.totalAfter).toBe(after.totalVnd);
    // The old block is released (kept for history), the new one has the cleaning day.
    const active = await db.bikeOccupancy.findMany({
      where: { bookingId: booking.id, releasedAt: null },
    });
    expect(active.map((o) => `${toIsoDate(o.startDate)}..${toIsoDate(o.endDate)}`)).toEqual([
      "2026-11-10..2026-11-18",
    ]);
  });

  it("refuses when the bike is booked on the new days, and changes nothing", async () => {
    const booking = await book();
    const next = await book({ startDate: "2026-11-19", endDate: "2026-11-21" });

    const result = await changeDates(db, [booking.id], dates("2026-11-10", "2026-11-19"), NOW);
    expect(result.ok).toBe(false);
    expect(!result.ok && result.error).toContain(next.reference);
    expect(await blocks(booking.id)).toEqual(["BOOKING 2026-11-10..2026-11-17"]);
    expect(
      toIsoDate((await db.booking.findUniqueOrThrow({ where: { id: booking.id } })).endDate),
    ).toBe("2026-11-17");
  });

  it("frees the days a shorter rental no longer needs", async () => {
    const booking = await book();
    expect((await changeDates(db, [booking.id], dates("2026-11-10", "2026-11-12"), NOW)).ok).toBe(
      true,
    );
    const next = await reserveBike(
      db,
      onlineBooking(fleet.versys.id, { startDate: "2026-11-14", endDate: "2026-11-16" }),
    );
    expect(next.ok).toBe(true);
  });

  it("only moves the return date once the bike is out, and never after it's back", async () => {
    const booking = await book();
    await checkOut(db, booking.id, onDay("2026-11-10"));
    expect(await changeDates(db, [booking.id], dates("2026-11-11", "2026-11-19"), NOW)).toEqual({
      ok: false,
      error: "The bike is already out: only the return date can change.",
    });
    expect((await changeDates(db, [booking.id], dates("2026-11-10", "2026-11-19"), NOW)).ok).toBe(
      true,
    );

    await checkIn(db, booking.id, onDay("2026-11-19"));
    expect((await changeDates(db, [booking.id], dates("2026-11-10", "2026-11-21"), NOW)).ok).toBe(
      false,
    );
  });

  it("keeps an imported rental's price at 0", async () => {
    const booking = await book();
    await db.booking.update({
      where: { id: booking.id },
      data: { source: "IMPORT", rentalVnd: 0, totalVnd: 0, depositVnd: 0, balanceVnd: 0 },
    });
    await changeDates(db, [booking.id], dates("2026-11-10", "2026-11-19"), NOW);
    expect(await db.booking.findUniqueOrThrow({ where: { id: booking.id } })).toMatchObject({
      days: 10,
      totalVnd: 0,
    });
  });

  it("changes the bikes of a group together, or none of them", async () => {
    const a = await reserveBike(db, onlineBooking(fleet.cb150x.id));
    const b = await reserveBike(db, onlineBooking(fleet.cb150x.id));
    if (!a.ok || !b.ok) throw new Error("booking failed");
    // A third customer has the second CB150X right after.
    const blocker = await reserveBike(
      db,
      onlineBooking(fleet.cb150x.id, {
        bikeId: b.booking.bikeId!,
        startDate: "2026-11-19",
        endDate: "2026-11-20",
      }),
    );
    expect(blocker.ok).toBe(true);

    const ids = [a.booking.id, b.booking.id];
    expect((await changeDates(db, ids, dates("2026-11-10", "2026-11-19"), NOW)).ok).toBe(false);
    expect(await blocks(a.booking.id)).toEqual(["BOOKING 2026-11-10..2026-11-17"]);

    const result = await changeDates(db, ids, dates("2026-11-10", "2026-11-18"), NOW);
    expect(result).toMatchObject({ ok: true, days: 9 });
    expect(await blocks(b.booking.id)).toContain("BOOKING 2026-11-10..2026-11-18");
  });
});

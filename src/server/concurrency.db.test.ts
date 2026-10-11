// The brief's hardest rule: two customers must never get the same bike for
// overlapping dates, even if they submit at the same moment. These tests fire
// real bookings in parallel through reserveBike().
import { afterAll, beforeEach, expect, it } from "vitest";
import { reserveBike } from "@/server/bookings";
import { createTestClient, resetDatabase } from "@/test/db";
import { onlineBooking, seededFleet } from "@/test/fixtures";

const db = createTestClient();
let fleet: Awaited<ReturnType<typeof seededFleet>>;

beforeEach(async () => {
  await resetDatabase(db);
  fleet = await seededFleet(db);
});
afterAll(() => db.$disconnect());

it("eight customers race for the only Versys: exactly one gets it", async () => {
  const results = await Promise.all(
    Array.from({ length: 8 }, () => reserveBike(db, onlineBooking(fleet.versys.id))),
  );

  expect(results.filter((r) => r.ok)).toHaveLength(1);
  expect(results.filter((r) => !r.ok).map((r) => !r.ok && r.error.code)).toEqual(
    Array(7).fill("NO_BIKE_AVAILABLE"),
  );
  expect(await db.bikeOccupancy.count({ where: { releasedAt: null } })).toBe(1);
});

it("eight customers race for two CB150Xs: two win, on different bikes", async () => {
  const results = await Promise.all(
    Array.from({ length: 8 }, () => reserveBike(db, onlineBooking(fleet.cb150x.id))),
  );

  const winners = results.flatMap((r) => (r.ok ? [r.booking.bikeId] : []));
  expect(winners).toHaveLength(2);
  expect(new Set(winners).size).toBe(2);
});

it("a race with overlapping but different dates still gives one winner per bike", async () => {
  const ranges = [
    ["2026-11-10", "2026-11-17"],
    ["2026-11-15", "2026-11-20"],
    ["2026-11-17", "2026-11-17"],
    ["2026-11-01", "2026-11-10"],
  ];
  const results = await Promise.all(
    ranges.map(([startDate, endDate]) =>
      reserveBike(db, onlineBooking(fleet.versys.id, { startDate, endDate })),
    ),
  );

  // Whoever wins, no two winners may share a day on the single Versys.
  const won = results.flatMap((r) => (r.ok ? [r.booking] : []));
  for (const a of won) {
    for (const b of won) {
      if (a.id === b.id) continue;
      const overlap = a.startDate <= b.endDate && b.startDate <= a.endDate;
      expect(overlap, `${a.reference} and ${b.reference} overlap`).toBe(false);
    }
  }
  expect(won.length).toBeGreaterThanOrEqual(1);
});

it("a staff maintenance block and a customer booking racing for the same days: one wins", async () => {
  const [bike] = await db.bike.findMany({ where: { modelId: fleet.versys.id } });
  const { blockForMaintenance } = await import("@/server/maintenance");

  const [booking, block] = await Promise.all([
    reserveBike(db, onlineBooking(fleet.versys.id)),
    blockForMaintenance(db, { bikeId: bike.id, startDate: "2026-11-12", endDate: "2026-11-13" }),
  ]);

  expect([booking.ok, block.ok].filter(Boolean)).toHaveLength(1);
});

it("thirty customers book XR150s at once with random overlapping dates: no errors, no shared days", async () => {
  const day = (n: number) => `2026-11-${String(n).padStart(2, "0")}`;
  const requests = Array.from({ length: 30 }, () => {
    const start = 1 + Math.floor(Math.random() * 20);
    const length = Math.floor(Math.random() * 6);
    return onlineBooking(fleet.xr150.id, { startDate: day(start), endDate: day(start + length) });
  });

  // Any unexpected database error (such as an unhandled deadlock) rejects here.
  const results = await Promise.all(requests.map((r) => reserveBike(db, r)));

  for (const r of results) {
    if (!r.ok) expect(r.error.code).toBe("NO_BIKE_AVAILABLE");
  }
  const won = results.flatMap((r) => (r.ok ? [r.booking] : []));
  expect(won.length).toBeGreaterThanOrEqual(8);
  for (const a of won) {
    for (const b of won) {
      if (a.id === b.id || a.bikeId !== b.bikeId) continue;
      const overlap = a.startDate <= b.endDate && b.startDate <= a.endDate;
      expect(overlap, `${a.reference} and ${b.reference} share a day`).toBe(false);
    }
  }
}, 30_000);

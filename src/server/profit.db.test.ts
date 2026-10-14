import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { checkIn, checkOut } from "@/server/booking-admin";
import { reserveBike } from "@/server/bookings";
import { logIncident } from "@/server/incidents";
import { profitByBike } from "@/server/profit";
import { createTestClient, day, resetDatabase } from "@/test/db";
import { onlineBooking, seededFleet } from "@/test/fixtures";

const db = createTestClient();
let fleet: Awaited<ReturnType<typeof seededFleet>>;
let versysBikeId: string;

beforeEach(async () => {
  await resetDatabase(db);
  fleet = await seededFleet(db);
  versysBikeId = (await db.bike.findFirstOrThrow({ where: { modelId: fleet.versys.id } })).id;
});
afterAll(() => db.$disconnect());

async function rentVersys(startDate: string, endDate: string, goOut = true) {
  const result = await reserveBike(db, onlineBooking(fleet.versys.id, { startDate, endDate }));
  if (!result.ok) throw new Error(JSON.stringify(result.error));
  if (goOut) {
    await checkOut(db, result.booking.id, new Date(`${startDate}T03:00:00Z`));
    await checkIn(db, result.booking.id, new Date(`${endDate}T03:00:00Z`));
  }
  return result.booking;
}

const versysRow = async (from: string, to: string) =>
  (await profitByBike(db, day(from), day(to))).find((r) => r.bikeId === versysBikeId)!;

describe("logIncident", () => {
  it("records structured costs", async () => {
    const result = await logIncident(db, {
      bikeId: versysBikeId,
      kind: "REPAIR",
      occurredOn: "2026-11-20",
      description: "Replaced clutch cable",
      partsVnd: "180000",
      labourVnd: "50000",
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.incident).toMatchObject({ partsVnd: 180_000, labourVnd: 50_000, otherVnd: 0 });
    }
  });

  it("refuses negative or fractional amounts", async () => {
    for (const partsVnd of ["-1", "1000.5"]) {
      const result = await logIncident(db, {
        bikeId: versysBikeId,
        kind: "REPAIR",
        occurredOn: "2026-11-20",
        description: "Bad amount",
        partsVnd,
      });
      expect(result.ok).toBe(false);
    }
  });

  it("refuses linking a booking for a different bike", async () => {
    const other = await reserveBike(db, onlineBooking(fleet.xr150.id));
    if (!other.ok) throw new Error("booking failed");
    const result = await logIncident(db, {
      bikeId: versysBikeId,
      bookingId: other.booking.id,
      kind: "DAMAGE",
      occurredOn: "2026-11-12",
      description: "Scratched tank",
    });
    expect(result).toEqual({ ok: false, error: "That booking isn't for this bike." });
  });
});

describe("profitByBike", () => {
  it("is rental revenue minus repair costs, net of what customers paid back", async () => {
    // 5 days × 1,200,000 = 6,000,000 (cap: 7 × 1,100,000 = 7,700,000 is higher)
    const booking = await rentVersys("2026-11-02", "2026-11-06");
    await logIncident(db, {
      bikeId: versysBikeId,
      bookingId: booking.id,
      kind: "DAMAGE",
      occurredOn: "2026-11-06",
      description: "Broken mirror",
      partsVnd: 300_000,
      labourVnd: 100_000,
      recoveredVnd: 250_000,
    });
    await logIncident(db, {
      bikeId: versysBikeId,
      kind: "SERVICE",
      occurredOn: "2026-11-20",
      description: "Oil change",
      partsVnd: 150_000,
    });

    expect(await versysRow("2026-11-01", "2026-11-30")).toMatchObject({
      rentals: 1,
      rentalDays: 5,
      revenueVnd: 6_000_000,
      costVnd: 300_000, // 300k + 100k − 250k + 150k
      profitVnd: 5_700_000,
    });
  });

  it("counts only rentals where the bike actually went out", async () => {
    await rentVersys("2026-11-02", "2026-11-06", false); // booked, never picked up
    expect((await versysRow("2026-11-01", "2026-11-30")).revenueVnd).toBe(0);
  });

  it("counts rentals and costs in the period they started or happened", async () => {
    await rentVersys("2026-11-28", "2026-12-03");
    await logIncident(db, {
      bikeId: versysBikeId,
      kind: "REPAIR",
      occurredOn: "2026-12-05",
      description: "Brake pads",
      partsVnd: 200_000,
    });

    expect(await versysRow("2026-11-01", "2026-11-30")).toMatchObject({ rentals: 1, costVnd: 0 });
    expect(await versysRow("2026-12-01", "2026-12-31")).toMatchObject({
      rentals: 0,
      costVnd: 200_000,
    });
  });

  it("lists every bike, including ones with nothing yet", async () => {
    expect(await profitByBike(db, day("2026-11-01"), day("2026-11-30"))).toHaveLength(26);
  });
});

import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { reserveBike } from "@/server/bookings";
import { blockForMaintenance, liftBlock } from "@/server/maintenance";
import { createTestClient, resetDatabase } from "@/test/db";
import { NOW, onlineBooking, seededFleet } from "@/test/fixtures";

const db = createTestClient();
let fleet: Awaited<ReturnType<typeof seededFleet>>;
let versysBikeId: string;

beforeEach(async () => {
  await resetDatabase(db);
  fleet = await seededFleet(db);
  versysBikeId = (await db.bike.findFirstOrThrow({ where: { modelId: fleet.versys.id } })).id;
});
afterAll(() => db.$disconnect());

describe("maintenance blocks", () => {
  it("take the bike out of availability immediately", async () => {
    const block = await blockForMaintenance(db, {
      bikeId: versysBikeId,
      startDate: "2026-11-12",
      endDate: "2026-11-13",
      note: "New chain and sprockets",
    });
    expect(block.ok).toBe(true);

    const result = await reserveBike(db, onlineBooking(fleet.versys.id));
    expect(result).toEqual({ ok: false, error: { code: "NO_BIKE_AVAILABLE" } });
  });

  it("can be lifted early, making the bike bookable again", async () => {
    const block = await blockForMaintenance(db, {
      bikeId: versysBikeId,
      startDate: "2026-11-12",
      endDate: "2026-11-13",
    });
    if (!block.ok) throw new Error("block failed");

    expect(await liftBlock(db, block.block.id, NOW)).toBe(true);
    expect((await reserveBike(db, onlineBooking(fleet.versys.id))).ok).toBe(true);
  });

  it("are refused over an existing booking, listing what's in the way", async () => {
    const booked = await reserveBike(db, onlineBooking(fleet.versys.id));
    if (!booked.ok) throw new Error("booking failed");

    const block = await blockForMaintenance(db, {
      bikeId: versysBikeId,
      startDate: "2026-11-15",
      endDate: "2026-11-20",
    });
    expect(block).toEqual({
      ok: false,
      error: {
        code: "BIKE_BUSY",
        conflicts: [
          {
            kind: "BOOKING",
            startDate: "2026-11-10",
            endDate: "2026-11-17",
            bookingReference: booked.booking.reference,
          },
        ],
      },
    });
  });

  it("only lifts maintenance blocks, never a customer's booking", async () => {
    const booked = await reserveBike(db, onlineBooking(fleet.versys.id));
    if (!booked.ok) throw new Error("booking failed");
    expect(await liftBlock(db, booked.booking.occupancies[0].id, NOW)).toBe(false);
  });

  it("refuse an end date before the start date", async () => {
    const block = await blockForMaintenance(db, {
      bikeId: versysBikeId,
      startDate: "2026-11-13",
      endDate: "2026-11-12",
    });
    expect(block).toEqual({ ok: false, error: { code: "INVALID_DATE" } });
  });
});

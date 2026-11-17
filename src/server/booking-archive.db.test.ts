import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { checkIn, checkOut } from "@/server/booking-admin";
import { archiveBooking, archiveRow } from "@/server/booking-archive";
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

async function returnedBooking() {
  const result = await reserveBike(
    db,
    onlineBooking(fleet.versys.id, {
      startDate: "2026-12-01",
      endDate: "2026-12-07",
      customer: {
        name: "Test Rider",
        email: "rider@example.test",
        phone: "+44 7700 900123",
        note: "Two helmets please",
      },
    }),
  );
  if (!result.ok) throw new Error(JSON.stringify(result.error));
  await checkOut(db, result.booking.id);
  await checkIn(db, result.booking.id);
  await db.booking.update({ where: { id: result.booking.id }, data: { staffNote: "Paid cash" } });
  return result.booking;
}

describe("archiveBooking", () => {
  it("sends a returned rental to Notion, then removes the customer's details", async () => {
    const booking = await returnedBooking();
    const rows: string[][] = [];

    const result = await archiveBooking(db, booking.id, async (cells) => {
      rows.push(cells);
    });

    expect(result).toEqual({ ok: true });
    expect(rows).toHaveLength(1);
    expect(rows[0][0]).toBe("Test Rider");
    expect(rows[0][10]).toContain(booking.reference);
    expect(rows[0][10]).toContain("Customer: Two helmets please");
    expect(rows[0][10]).toContain("Paid cash");

    const after = await db.booking.findUniqueOrThrow({ where: { id: booking.id } });
    expect(after).toMatchObject({
      customerName: "Archived",
      customerEmail: null,
      customerPhone: null,
      customerNote: null,
      staffNote: null,
    });
    expect(after.archivedAt).toBeInstanceOf(Date);
    // Money and dates stay for the calendar and the profit page.
    expect(after.totalVnd).toBe(booking.totalVnd);
  });

  it("keeps everything when Notion refuses the row", async () => {
    const booking = await returnedBooking();
    const result = await archiveBooking(db, booking.id, async () => {
      throw new Error("Notion 401");
    });
    expect(result.ok).toBe(false);
    const after = await db.booking.findUniqueOrThrow({ where: { id: booking.id } });
    expect(after).toMatchObject({ customerName: "Test Rider", archivedAt: null });
  });

  it("refuses a rental that isn't over, and a second archive", async () => {
    const result = await reserveBike(db, onlineBooking(fleet.versys.id));
    if (!result.ok) throw new Error("booking failed");
    const append = async () => {};
    expect((await archiveBooking(db, result.booking.id, append)).ok).toBe(false);

    const booking = await returnedBooking();
    expect(await archiveBooking(db, booking.id, append)).toEqual({ ok: true });
    expect((await archiveBooking(db, booking.id, append)).ok).toBe(false);
  });
});

describe("archiveRow", () => {
  it("follows the RENTALS table's columns and date style", () => {
    const row = archiveRow({
      reference: "RLB-123456",
      status: "COMPLETED",
      customerName: "Anna",
      customerNote: null,
      staffNote: null,
      bikeModel: { name: "Honda XR150" },
      bike: { plate: "59-A1 234.56" },
      dropoffCity: "HANOI",
      startDate: new Date("2026-12-01T00:00:00Z"),
      endDate: new Date("2026-12-28T00:00:00Z"),
      days: 28,
      totalVnd: 10_000_000,
      oneWayFeeVnd: 1_600_000,
      addOns: [
        { name: "Full coverage insurance", quantity: 1, totalVnd: 3_640_000 },
        { name: "Premium helmet", quantity: 2, totalVnd: 1_000_000 },
      ],
      incidents: [{ description: "Flat tyre", partsVnd: 40_000, labourVnd: 0, otherVnd: 0 }],
    });
    expect(row).toEqual([
      "Anna",
      "Honda XR150 59-A1 234.56",
      "",
      "01/12 - 28/12",
      "28",
      "Ha Noi",
      "8.400.000₫",
      "1.600.000₫",
      "",
      "Yes 3.640.000₫",
      "RLB-123456 / Premium helmet × 2",
      "Flat tyre 40.000₫",
    ]);
  });
});

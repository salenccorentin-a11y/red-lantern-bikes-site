import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { reserveBike } from "@/server/bookings";
import { linkBookingsToCustomers, listCustomers, saveCustomer } from "@/server/customers";
import { checkIn, checkOut } from "@/server/booking-admin";
import { createTestClient, day, resetDatabase } from "@/test/db";
import { onlineBooking, seededFleet } from "@/test/fixtures";

const db = createTestClient();
let fleet: Awaited<ReturnType<typeof seededFleet>>;

beforeEach(async () => {
  await resetDatabase(db);
  fleet = await seededFleet(db);
});
afterAll(() => db.$disconnect());

async function book(customer: { name: string; email?: string; phone?: string }, start: string) {
  const end = `${start.slice(0, 8)}${String(Number(start.slice(8)) + 3).padStart(2, "0")}`;
  const result = await reserveBike(
    db,
    onlineBooking(fleet.xr150.id, { customer, startDate: start, endDate: end }),
  );
  if (!result.ok) throw new Error(JSON.stringify(result));
  return result.booking;
}

describe("linking bookings to customers", () => {
  it("matches the same person by email, ignoring case and spaces", async () => {
    await book({ name: "Sam Rider", email: "sam@example.com" }, "2026-11-02");
    await book({ name: "Sam R.", email: " SAM@example.com " }, "2026-11-12");
    expect(await linkBookingsToCustomers(db)).toBe(2);
    expect(await db.customer.count()).toBe(1);
    // The name from the first booking stays.
    expect((await db.customer.findFirstOrThrow()).name).toBe("Sam Rider");
  });

  it("matches by phone when the email differs, and fills in what's missing", async () => {
    await book({ name: "Ana", phone: "+33 6 12 34 56 78" }, "2026-11-02");
    await book({ name: "Ana", email: "ana@example.com", phone: "0033612345678" }, "2026-11-12");
    await linkBookingsToCustomers(db);
    const customers = await db.customer.findMany();
    expect(customers).toHaveLength(1);
    expect(customers[0]).toMatchObject({ phoneKey: "33612345678", emailKey: "ana@example.com" });
  });

  it("never merges two people by name alone", async () => {
    await book({ name: "Markus" }, "2026-11-02");
    await book({ name: "Markus" }, "2026-11-12");
    await linkBookingsToCustomers(db);
    expect(await db.customer.count()).toBe(2);
  });

  it("keeps one customer for an imported rental of several bikes", async () => {
    const a = await book({ name: "Anita" }, "2026-11-02");
    const b = await book({ name: "Anita" }, "2026-11-02");
    const c = await book({ name: "Anita" }, "2026-11-12");
    await db.booking.updateMany({
      where: { id: { in: [a.id, b.id, c.id] } },
      data: { source: "IMPORT", customerEmail: null },
    });
    await linkBookingsToCustomers(db);
    // Same name and start date: one rental. Another date: can't tell, kept apart.
    expect(await db.customer.count()).toBe(2);
  });

  it("does nothing the second time", async () => {
    await book({ name: "Sam", email: "sam@example.com" }, "2026-11-02");
    expect(await linkBookingsToCustomers(db)).toBe(1);
    expect(await linkBookingsToCustomers(db)).toBe(0);
  });
});

describe("customer list and edits", () => {
  it("counts real rentals only and finds customers by phone digits", async () => {
    const a = await book(
      { name: "Sam", email: "sam@example.com", phone: "+44 7700 900123" },
      "2026-11-02",
    );
    await book({ name: "Sam", email: "sam@example.com" }, "2026-11-12"); // still a request
    await db.booking.update({ where: { id: a.id }, data: { status: "CONFIRMED" } });
    await checkOut(db, a.id);
    await checkIn(db, a.id);
    await linkBookingsToCustomers(db);

    const [sam] = await listCustomers(db, "7700 900");
    expect(sam).toMatchObject({ name: "Sam", rentals: 1, onTheRoad: false });
    expect(await listCustomers(db, "nobody")).toHaveLength(0);
  });

  it("saves edits, and refuses a phone another customer has", async () => {
    await book({ name: "One", phone: "+44 7700 900111" }, "2026-11-02");
    await book({ name: "Two", phone: "+44 7700 900222" }, "2026-11-12");
    await linkBookingsToCustomers(db);
    const two = await db.customer.findFirstOrThrow({ where: { name: "Two" } });
    const edit = { name: "Two", email: "", phone: "+44 7700 900111", country: "UK", notes: "" };

    expect(await saveCustomer(db, two.id, edit)).toMatchObject({ ok: false });
    expect(await saveCustomer(db, two.id, { ...edit, phone: "+44 7700 900333" })).toEqual({
      ok: true,
    });
    expect(await db.customer.findUniqueOrThrow({ where: { id: two.id } })).toMatchObject({
      phoneKey: "447700900333",
      country: "UK",
    });
  });
});

describe("countRentals", () => {
  it("counts bookings with the same dates once", async () => {
    const { countRentals } = await import("@/server/customers");
    const b = (s: string, e: string) => ({ startDate: day(s), endDate: day(e) });
    expect(countRentals([b("2026-11-02", "2026-11-05"), b("2026-11-02", "2026-11-05")])).toBe(1);
    expect(countRentals([b("2026-11-02", "2026-11-05"), b("2026-11-12", "2026-11-15")])).toBe(2);
  });
});

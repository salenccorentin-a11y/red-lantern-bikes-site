import { afterAll, beforeEach, describe, expect, it } from "vitest";
import type { NotionRental } from "@/lib/notion-import";
import { reserveBike } from "@/server/bookings";
import { importNotionRentals } from "@/server/notion-import";
import { createTestClient, resetDatabase } from "@/test/db";
import { onlineBooking, seededFleet } from "@/test/fixtures";

const db = createTestClient();
let fleet: Awaited<ReturnType<typeof seededFleet>>;

beforeEach(async () => {
  await resetDatabase(db);
  fleet = await seededFleet(db);
});
afterAll(() => db.$disconnect());

const row = (over: Partial<NotionRental>): NotionRental => ({
  url: "https://app.notion.com/row-1",
  name: "Anita",
  status: "Upcoming",
  bike: "Versys",
  start: "2026-11-10",
  end: "2026-11-17",
  destination: "HCMC",
  paid: "380$",
  ...over,
});

describe("Notion import", () => {
  it("books a free bike so the site can't offer it again", async () => {
    const report = await importNotionRentals(db, [row({})]);
    expect(report[0].result.kind).toBe("imported");

    const booking = await db.booking.findFirstOrThrow({ where: { source: "IMPORT" } });
    expect(booking).toMatchObject({ status: "CONFIRMED", customerName: "Anita", totalVnd: 0 });
    expect(booking).toMatchObject({ paidNote: "380$", notionUrl: "https://app.notion.com/row-1" });

    // The Versys fleet has one bike: now taken.
    const online = await reserveBike(db, onlineBooking(fleet.versys.id));
    expect(online).toEqual({ ok: false, error: { code: "NO_BIKE_AVAILABLE" } });
  });

  it("makes one booking per bike and marks bikes on the road as checked out", async () => {
    await importNotionRentals(db, [row({ bike: "2 Wave", status: "On the road" })]);
    const bookings = await db.booking.findMany({ where: { source: "IMPORT" } });
    expect(bookings).toHaveLength(2);
    expect(new Set(bookings.map((b) => b.bikeId)).size).toBe(2);
    expect(bookings.every((b) => b.status === "CHECKED_OUT")).toBe(true);
  });

  it("skips rows already imported, so it can run again", async () => {
    await importNotionRentals(db, [row({})]);
    const again = await importNotionRentals(db, [row({})]);
    expect(again[0].result.kind).toBe("already-imported");
    expect(await db.booking.count({ where: { source: "IMPORT" } })).toBe(1);
  });

  it("imports nothing from a row it can't fully place", async () => {
    // Two Versys asked, the fleet has one.
    const report = await importNotionRentals(db, [row({ bike: "2 Versys" })]);
    expect(report[0].result).toMatchObject({ kind: "skipped" });
    expect(await db.booking.count({ where: { source: "IMPORT" } })).toBe(0);
  });

  it("leaves returned rentals and unknown bikes alone, and changes nothing on a dry run", async () => {
    const report = await importNotionRentals(
      db,
      [
        row({ status: "Returned" }),
        row({ url: "https://app.notion.com/row-2", bike: "Honda Vision" }),
        row({ url: "https://app.notion.com/row-3", bike: "XR150" }),
      ],
      { dryRun: true },
    );
    expect(report.map((l) => l.result.kind)).toEqual(["skipped", "skipped", "imported"]);
    expect(await db.booking.count()).toBe(0);
  });

  it("blocks the trip back for a one-way rental", async () => {
    await importNotionRentals(db, [row({ bike: "XR150", destination: "Ha Noi" })]);
    const kinds = await db.bikeOccupancy.findMany({ select: { kind: true } });
    expect(kinds.map((k) => k.kind).sort()).toEqual(["BOOKING", "TRANSIT"]);
  });
});

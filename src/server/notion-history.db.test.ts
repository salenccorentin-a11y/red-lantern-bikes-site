import { afterAll, beforeEach, describe, expect, it } from "vitest";
import type { NotionRental } from "@/lib/notion-import";
import { countRentals, linkBookingsToCustomers } from "@/server/customers";
import { importNotionHistory } from "@/server/notion-history";
import { syncNotionRentals } from "@/server/notion-sync";
import { listRentals } from "@/server/rentals";
import { createTestClient, resetDatabase } from "@/test/db";
import { seededFleet } from "@/test/fixtures";

const db = createTestClient();

beforeEach(async () => {
  await resetDatabase(db);
  await seededFleet(db);
});
afterAll(() => db.$disconnect());

const NOW = new Date("2026-11-26T03:00:00Z");

const row = (over: Partial<NotionRental> = {}): NotionRental => ({
  url: "https://app.notion.com/old-1",
  name: "Jack",
  status: "Returned",
  bike: "3 XR150",
  start: "2025-12-16",
  end: "2026-01-14",
  destination: "Ha Noi",
  paid: "400$/bike",
  deposit: "1122.14p REV",
  insurance: "Yes 3$/day",
  problems: "Broken Clutch handle 230k",
  ...over,
});

describe("importing returned Notion rentals (CRM Phase 2)", () => {
  it("adds each bike as a past rental in the Archive, with Notion's columns word for word", async () => {
    const [line] = await importNotionHistory(db, [row()], { now: NOW });
    expect(line.result).toMatchObject({
      kind: "imported",
      models: ["Honda XR150", "Honda XR150", "Honda XR150"],
    });

    const bookings = await db.booking.findMany({ orderBy: { staffNote: "asc" } });
    expect(bookings).toHaveLength(3);
    for (const b of bookings) {
      expect(b).toMatchObject({
        status: "COMPLETED",
        source: "IMPORT",
        bikeId: null,
        dropoffCity: "HANOI",
        customerName: "Jack",
        paidNote: "400$/bike",
        depositNote: "1122.14p REV",
        problemsNote: "Broken Clutch handle 230k",
        totalVnd: 0,
        archivedAt: NOW,
      });
    }
    expect(bookings[0].staffNote).toBe("Bike 1 of 3 (Notion: 3 XR150)");
    // Past dates: no days blocked on any bike.
    expect(await db.bikeOccupancy.count()).toBe(0);

    const archive = await listRentals(db, "archive", "");
    expect(archive).toHaveLength(1);
    expect(archive[0].bikes).toHaveLength(3);
    expect(await listRentals(db, "active", "")).toHaveLength(0);
  });

  it("changes nothing on a dry run, and skips a second run", async () => {
    expect((await importNotionHistory(db, [row()], { dryRun: true }))[0].result.kind).toBe(
      "imported",
    );
    expect(await db.booking.count()).toBe(0);
    await importNotionHistory(db, [row()], { now: NOW });
    expect((await importNotionHistory(db, [row()], { now: NOW }))[0].result.kind).toBe(
      "already-imported",
    );
    expect(await db.booking.count()).toBe(3);
  });

  it("skips rows it can't place, and leaves current rentals to the sync", async () => {
    const report = await importNotionHistory(
      db,
      [
        row({ url: "a", bike: "Yamaha Mio 125" }),
        row({ url: "b", end: null as unknown as string }),
        row({ url: "c", name: null as unknown as string }),
        row({ url: "d", status: "On the road" }),
      ],
      { now: NOW },
    );
    expect(report.map((l) => l.result)).toEqual([
      { kind: "skipped", reason: "bike not in the fleet: enter it by hand" },
      { kind: "skipped", reason: "dates missing or wrong" },
      { kind: "skipped", reason: "no name" },
      { kind: "skipped", reason: "not returned: the Notion sync handles it" },
    ]);
    expect(await db.booking.count()).toBe(0);
  });

  it("keeps a WhatsApp number typed as the name as the phone too", async () => {
    await importNotionHistory(db, [row({ name: "+84 96 163 45 05", bike: "Winner X" })], {
      now: NOW,
    });
    const b = await db.booking.findFirstOrThrow();
    expect(b).toMatchObject({
      customerName: "+84 96 163 45 05",
      customerPhone: "+84 96 163 45 05",
    });
  });

  it("keeps a cancelled rental as cancelled", async () => {
    await importNotionHistory(db, [row({ bike: "CB150X", notes: "CANCELLED" })], { now: NOW });
    const b = await db.booking.findFirstOrThrow();
    expect(b.status).toBe("CANCELLED");
    expect(b.checkedOutAt).toBeNull();
  });

  it("gives each Notion row its own customer record, one rental for a group", async () => {
    await importNotionHistory(
      db,
      [
        row(),
        row({
          url: "https://app.notion.com/old-2",
          bike: "EN125",
          start: "2026-03-01",
          end: "2026-03-05",
        }),
      ],
      { now: NOW },
    );
    await linkBookingsToCustomers(db);
    const customers = await db.customer.findMany({ include: { bookings: true } });
    // Same name, no email or phone: never merged on the name alone.
    expect(customers).toHaveLength(2);
    const group = customers.find((c) => c.bookings.length === 3)!;
    expect(countRentals(group.bookings)).toBe(1);
  });

  it("is then kept up to date by the Notion sync, without being reported as missing", async () => {
    await importNotionHistory(db, [row()], { now: NOW });
    const report = await syncNotionRentals(
      db,
      [row({ problems: "Broken Clutch handle 230k / Oil leak 400k" })],
      { now: NOW },
    );
    expect(report).toEqual([
      { name: "Jack", start: "2025-12-16", changes: ["updated problems on the way"] },
    ]);
    expect((await syncNotionRentals(db, [], { now: NOW })).length).toBe(0);
  });
});

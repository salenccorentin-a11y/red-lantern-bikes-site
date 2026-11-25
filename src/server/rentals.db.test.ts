import { afterAll, beforeEach, describe, expect, it } from "vitest";
import type { NotionRental } from "@/lib/notion-import";
import { importNotionRentals } from "@/server/notion-import";
import { syncNotionRentals } from "@/server/notion-sync";
import {
  archiveRental,
  listRentals,
  markRentalReturned,
  saveRentalRecord,
  unarchiveRental,
} from "@/server/rentals";
import { createTestClient, resetDatabase } from "@/test/db";
import { seededFleet } from "@/test/fixtures";

const db = createTestClient();

beforeEach(async () => {
  await resetDatabase(db);
  await seededFleet(db);
});
afterAll(() => db.$disconnect());

const row = (over: Partial<NotionRental> = {}): NotionRental => ({
  url: "https://app.notion.com/row-1",
  name: "Markus",
  status: "On the road",
  bike: "2x XR150",
  start: "2026-11-20",
  end: "2026-12-05",
  destination: "Ha Noi",
  paid: "323$ x 2",
  transfer: "60$ x2",
  deposit: "900e Coco",
  insurance: "Yes",
  helmet: "2FF 20$",
  ...over,
});

const NOW = new Date("2026-11-25T03:00:00Z");

describe("rental list", () => {
  it("shows a rental of two bikes as one row with Notion's columns, newest first", async () => {
    await importNotionRentals(db, [
      row(),
      row({
        url: "https://app.notion.com/row-2",
        name: "Lo",
        bike: "CB125",
        start: "2026-10-26",
        end: "2026-11-24",
        destination: "Nha Trang",
      }),
    ]);
    const rows = await listRentals(db, "active");
    expect(rows.map((r) => r.name)).toEqual(["Markus", "Lo"]);
    expect(rows[0]).toMatchObject({
      status: "On the road",
      days: 16,
      destination: "Hanoi",
      paid: "323$ x 2",
      deposit: "900e Coco",
      helmet: "2FF 20$",
    });
    expect(rows[0].bikes).toHaveLength(2);
    expect(rows[1].destination).toBe("Nha Trang");
  });

  it("archives a rental only once the bikes are back", async () => {
    await importNotionRentals(db, [row()]);
    const [r] = await listRentals(db, "active");
    expect(await archiveRental(db, r.ids, NOW)).toMatchObject({ ok: false });

    expect(await markRentalReturned(db, r.ids, NOW)).toEqual({ ok: true });
    const [back] = await listRentals(db, "active");
    expect(back.status).toBe("Returned");

    expect(await archiveRental(db, r.ids, NOW)).toEqual({ ok: true });
    expect(await listRentals(db, "active")).toHaveLength(0);
    expect(await listRentals(db, "archive")).toHaveLength(1);

    await unarchiveRental(db, r.ids);
    expect(await listRentals(db, "active")).toHaveLength(1);
  });

  it("saves the rental record from the booking page", async () => {
    await importNotionRentals(db, [row({ bike: "XR150" })]);
    const [r] = await listRentals(db, "active");
    await saveRentalRecord(db, r.firstId, {
      paid: " 350$ ",
      transfer: "",
      deposit: "Passport",
      insurance: "No",
      helmet: "",
      notes: "Side box",
      problems: "80k spark plug",
    });
    const [after] = await listRentals(db, "active");
    expect(after).toMatchObject({
      paid: "350$",
      transfer: null,
      deposit: "Passport",
      notes: "Side box",
      problems: "80k spark plug",
    });
  });
});

describe("Notion sync", () => {
  it("updates the record, oil and status of rentals already on the site", async () => {
    await importNotionRentals(db, [row({ status: "Upcoming" })]);
    const report = await syncNotionRentals(
      db,
      [
        row({
          problems: "80k spark plug",
          oilChangedOn: "2026-11-24",
          notes: "Riding with a friend",
        }),
      ],
      { now: NOW },
    );
    expect(report[0].changes.join("; ")).toMatch(/problems on the way.*now on the road/);
    const bookings = await db.booking.findMany({ where: { notionUrl: row().url } });
    expect(bookings).toHaveLength(2);
    for (const b of bookings) {
      expect(b).toMatchObject({ status: "CHECKED_OUT", problemsNote: "80k spark plug" });
      expect(b.oilChangedOn?.toISOString().slice(0, 10)).toBe("2026-11-24");
      expect(b.staffNote).toContain("Riding with a friend");
    }
  });

  it("checks in rentals returned in Notion, adds new ones, and skips old returned ones", async () => {
    await importNotionRentals(db, [row()]);
    const report = await syncNotionRentals(
      db,
      [
        row({ status: "Returned" }),
        row({
          url: "https://app.notion.com/new",
          name: "Felix",
          bike: "Wave",
          start: "2026-11-23",
          end: "2026-12-17",
        }),
        row({
          url: "https://app.notion.com/old",
          name: "Old",
          bike: "Wave",
          status: "Returned",
          start: "2026-01-02",
          end: "2026-01-09",
        }),
      ],
      { now: NOW },
    );
    expect(report.map((l) => l.name)).toEqual(["Markus", "Felix"]);
    const markus = await db.booking.findMany({ where: { notionUrl: row().url } });
    expect(markus.every((b) => b.status === "COMPLETED")).toBe(true);
    expect(
      await db.booking.count({ where: { customerName: "Felix", status: "CHECKED_OUT" } }),
    ).toBe(1);
    expect(await db.booking.count({ where: { customerName: "Old" } })).toBe(0);
  });

  it("changes nothing in a dry run, reports date changes and rows gone from Notion", async () => {
    await importNotionRentals(db, [
      row(),
      row({ url: "https://app.notion.com/gone", name: "Gone", bike: "Wave" }),
    ]);
    const report = await syncNotionRentals(db, [row({ end: "2026-12-08", paid: "400$" })], {
      dryRun: true,
      now: NOW,
    });
    expect(report[0].changes.join("; ")).toMatch(/updated paid.*dates differ/);
    expect(report[1]).toMatchObject({ name: "Gone" });
    expect(report[1].changes[0]).toMatch(/not found in Notion/);
    const b = await db.booking.findFirstOrThrow({ where: { notionUrl: row().url } });
    expect(b.paidNote).toBe("323$ x 2");
  });
});

describe("order of the current list", () => {
  it("puts started rentals first, then upcoming, both soonest start first", async () => {
    const { splitByStart } = await import("@/server/rentals");
    await importNotionRentals(db, [
      row({ url: "u1", name: "Lo", bike: "CB125", start: "2026-10-26", end: "2026-11-24" }),
      row({ url: "u2", name: "Felix", bike: "Wave", start: "2026-11-23", end: "2026-12-17" }),
      row({
        url: "u3",
        name: "Anita",
        bike: "Wave",
        status: "Upcoming",
        start: "2027-05-03",
        end: "2027-05-27",
      }),
      row({
        url: "u4",
        name: "Seb",
        bike: "Versys",
        status: "Upcoming",
        start: "2026-12-07",
        end: "2026-12-16",
      }),
    ]);
    const { started, upcoming } = splitByStart(await listRentals(db, "active"));
    expect(started.map((r) => r.name)).toEqual(["Lo", "Felix"]);
    expect(upcoming.map((r) => r.name)).toEqual(["Seb", "Anita"]);
  });
});

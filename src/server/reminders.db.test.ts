import { afterAll, beforeEach, describe, expect, it } from "vitest";
import type { Email } from "@/server/email";
import { reserveBike } from "@/server/bookings";
import { sendHoldReminders, sendPickupReminders } from "@/server/reminders";
import { createTestClient, resetDatabase } from "@/test/db";
import { NOW, onlineBooking, seededFleet } from "@/test/fixtures";

const db = createTestClient();
let fleet: Awaited<ReturnType<typeof seededFleet>>;

beforeEach(async () => {
  await resetDatabase(db);
  fleet = await seededFleet(db);
});
afterAll(() => db.$disconnect());

const HOUR_MS = 3_600_000;
const later = (hours: number) => new Date(NOW.getTime() + hours * HOUR_MS);

/** Collects emails instead of sending them. */
function outbox() {
  const sent: Email[] = [];
  return { sent, send: async (email: Email) => void sent.push(email) };
}

async function book(overrides: Parameters<typeof onlineBooking>[1] = {}) {
  const result = await reserveBike(db, onlineBooking(fleet.xr150.id, overrides));
  if (!result.ok) throw new Error(JSON.stringify(result));
  return result.booking;
}

describe("hold reminders", () => {
  // NOW is 10:00 on 11 Oct in Saigon; the hold runs out 24 hours later.

  it("reminds once, about 3 hours before an unpaid hold runs out", async () => {
    const booking = await book();
    const box = outbox();

    expect(await sendHoldReminders(db, later(20), box.send)).toBe(0); // 4 hours left
    expect(await sendHoldReminders(db, later(21.5), box.send)).toBe(1); // 2.5 hours left
    expect(await sendHoldReminders(db, later(22.5), box.send)).toBe(0); // already sent

    expect(box.sent).toHaveLength(1);
    expect(box.sent[0].to).toBe("rider@example.com");
    expect(box.sent[0].subject).toContain(booking.reference);
    expect(box.sent[0].text).toContain(`/booking/${booking.viewToken}`);
  });

  it("doesn't remind once the deposit is paid", async () => {
    const booking = await book();
    await db.booking.update({ where: { id: booking.id }, data: { status: "CONFIRMED" } });
    const box = outbox();
    expect(await sendHoldReminders(db, later(21.5), box.send)).toBe(0);
  });

  it("doesn't remind when less than 15 minutes are left", async () => {
    await book();
    const box = outbox();
    expect(await sendHoldReminders(db, later(23.9), box.send)).toBe(0);
  });

  it("doesn't remind when the hold is short (4 hours or less in settings)", async () => {
    await db.siteSettings.update({ where: { id: 1 }, data: { holdHours: 4 } });
    await book();
    const box = outbox();
    expect(await sendHoldReminders(db, later(2), box.send)).toBe(0);
  });

  it("tries again on the next run if sending failed", async () => {
    await book();
    const failing = async () => {
      throw new Error("Resend is down");
    };
    expect(await sendHoldReminders(db, later(21), failing)).toBe(0);
    const box = outbox();
    expect(await sendHoldReminders(db, later(22), box.send)).toBe(1);
  });
});

describe("pick-up reminders", () => {
  // A confirmed (paid) booking picking up on 13 Oct.
  const confirmed = async (startDate = "2026-10-13") => {
    const booking = await book({ startDate, endDate: "2026-10-20" });
    await db.booking.update({ where: { id: booking.id }, data: { status: "CONFIRMED" } });
    return booking;
  };
  // 12 Oct in Saigon (UTC+7): 07:00 and 10:00.
  const dayBefore7am = new Date("2026-10-12T00:00:00Z");
  const dayBefore10am = new Date("2026-10-12T03:00:00Z");

  it("reminds the day before pick-up, once, with what to bring", async () => {
    const booking = await confirmed();
    const box = outbox();

    expect(await sendPickupReminders(db, dayBefore10am, box.send)).toBe(1);
    expect(await sendPickupReminders(db, dayBefore10am, box.send)).toBe(0);

    const email = box.sent[0];
    expect(email.subject).toContain(booking.reference);
    expect(email.text).toContain("passport");
    expect(email.text).toContain("International Driving Permit");
    expect(email.text).toContain("US$300");
  });

  it("waits until 9:00 Saigon time", async () => {
    await confirmed();
    const box = outbox();
    expect(await sendPickupReminders(db, dayBefore7am, box.send)).toBe(0);
  });

  it("only for tomorrow's pick-ups, and only once the deposit is paid", async () => {
    await confirmed("2026-10-14"); // the day after tomorrow
    await book({ startDate: "2026-10-13", endDate: "2026-10-20" }); // not paid yet
    const box = outbox();
    expect(await sendPickupReminders(db, dayBefore10am, box.send)).toBe(0);
  });
});

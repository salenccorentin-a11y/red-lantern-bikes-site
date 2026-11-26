import { afterAll, beforeEach, describe, expect, it } from "vitest";
import type { Email } from "@/server/email";
import { acceptRequest, declineRequest } from "@/server/booking-requests";
import { releaseExpiredHolds, reserveBike } from "@/server/bookings";
import { sendAnswerReminders, sendExpiryNotices, sendPickupReminders } from "@/server/reminders";
import { createTestClient, resetDatabase } from "@/test/db";
import { NOW, onlineBooking, seededFleet } from "@/test/fixtures";

const db = createTestClient();
let fleet: Awaited<ReturnType<typeof seededFleet>>;

beforeEach(async () => {
  await resetDatabase(db);
  fleet = await seededFleet(db);
  process.env.BOOKINGS_EMAIL = "shop@example.com";
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

describe("reminders to the shop about unanswered requests", () => {
  // NOW is 10:00 on 11 Oct in Saigon; a request's hold runs out 24 hours later.

  it("reminds the shop once, about 3 hours before a request runs out", async () => {
    const booking = await book();
    const box = outbox();

    expect(await sendAnswerReminders(db, later(20), box.send)).toBe(0); // 4 hours left
    expect(await sendAnswerReminders(db, later(21.5), box.send)).toBe(1); // 2.5 hours left
    expect(await sendAnswerReminders(db, later(22.5), box.send)).toBe(0); // already sent

    expect(box.sent).toHaveLength(1);
    expect(box.sent[0].to).toBe("shop@example.com");
    expect(box.sent[0].subject).toContain("Reminder");
    expect(box.sent[0].subject).toContain(booking.reference);
    expect(box.sent[0].text).toContain(`/staff/request/${booking.decisionToken}?answer=accept`);
  });

  it("doesn't remind once the request is answered", async () => {
    const booking = await book();
    await acceptRequest(db, booking.id);
    const box = outbox();
    expect(await sendAnswerReminders(db, later(21.5), box.send)).toBe(0);
  });

  it("doesn't remind when less than 15 minutes are left", async () => {
    await book();
    const box = outbox();
    expect(await sendAnswerReminders(db, later(23.9), box.send)).toBe(0);
  });

  it("doesn't remind when the time to answer is short (4 hours or less in settings)", async () => {
    await db.siteSettings.update({ where: { id: 1 }, data: { holdHours: 4 } });
    await book();
    const box = outbox();
    expect(await sendAnswerReminders(db, later(2), box.send)).toBe(0);
  });

  it("tries again on the next run if sending failed", async () => {
    await book();
    const failing = async () => {
      throw new Error("Resend is down");
    };
    expect(await sendAnswerReminders(db, later(21), failing)).toBe(0);
    const box = outbox();
    expect(await sendAnswerReminders(db, later(22), box.send)).toBe(1);
  });
});

describe("telling customers their request ran out", () => {
  it("emails the customer once, after the request lapsed unanswered", async () => {
    const booking = await book();
    const box = outbox();

    // Still waiting: nothing to say.
    expect(await sendExpiryNotices(db, later(23), box.send)).toBe(0);

    await releaseExpiredHolds(db, later(25));
    expect(await sendExpiryNotices(db, later(25), box.send)).toBe(1);
    expect(await sendExpiryNotices(db, later(26), box.send)).toBe(0);

    expect(box.sent).toHaveLength(1);
    expect(box.sent[0].to).toBe("rider@example.com");
    expect(box.sent[0].subject).toContain(booking.reference);
    expect(box.sent[0].text).toContain("You haven't paid anything");
  });

  it("says nothing about requests that were answered", async () => {
    const accepted = await book();
    await acceptRequest(db, accepted.id);
    const declined = await book({ startDate: "2026-12-01", endDate: "2026-12-05" });
    await declineRequest(db, declined.id);

    await releaseExpiredHolds(db, later(25));
    const box = outbox();
    expect(await sendExpiryNotices(db, later(25), box.send)).toBe(0);
  });

  it("says nothing about requests that lapsed more than two days ago", async () => {
    await book();
    await releaseExpiredHolds(db, later(25));
    const box = outbox();
    expect(await sendExpiryNotices(db, later(24 + 49), box.send)).toBe(0);
  });
});

describe("pick-up reminders", () => {
  // An accepted booking picking up on 13 Oct.
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
    // The licence rules live in the FAQ and terms, not this email (owner, 2026-11-22).
    expect(email.text).not.toContain("International Driving Permit");
    expect(email.text).toContain("US$300");
  });

  it("waits until 9:00 Saigon time", async () => {
    await confirmed();
    const box = outbox();
    expect(await sendPickupReminders(db, dayBefore7am, box.send)).toBe(0);
  });

  it("only for tomorrow's pick-ups, and only once the booking is accepted", async () => {
    await confirmed("2026-10-14"); // the day after tomorrow
    await book({ startDate: "2026-10-13", endDate: "2026-10-20" }); // not answered yet
    const box = outbox();
    expect(await sendPickupReminders(db, dayBefore10am, box.send)).toBe(0);
  });
});

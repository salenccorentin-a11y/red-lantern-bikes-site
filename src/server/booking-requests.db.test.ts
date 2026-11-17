import { afterAll, beforeEach, describe, expect, it } from "vitest";
import {
  acceptRequest,
  declineRequest,
  sendAnswerEmail,
  sendRequestEmails,
} from "@/server/booking-requests";
import { releaseExpiredHolds, reserveBike } from "@/server/bookings";
import type { Email } from "@/server/email";
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

/** A request for the only Versys, so "is the bike still free?" is easy to test. */
async function request(overrides: Parameters<typeof onlineBooking>[1] = {}) {
  const result = await reserveBike(db, onlineBooking(fleet.versys.id, overrides));
  if (!result.ok) throw new Error(JSON.stringify(result));
  return result.booking;
}

const statusOf = async (id: string) =>
  (await db.booking.findUniqueOrThrow({ where: { id } })).status;
const activeBlocks = (bookingId: string) =>
  db.bikeOccupancy.count({ where: { bookingId, releasedAt: null } });

describe("accepting a booking request", () => {
  it("confirms the booking, keeps the bike and stops the clock", async () => {
    const booking = await request();
    expect(await acceptRequest(db, booking.id, later(1))).toEqual({ ok: true });

    const after = await db.booking.findUniqueOrThrow({ where: { id: booking.id } });
    expect(after.status).toBe("CONFIRMED");
    expect(after.holdExpiresAt).toBeNull();
    expect(await activeBlocks(booking.id)).toBe(1);

    // Long after the answer deadline, it's still confirmed.
    expect(await releaseExpiredHolds(db, later(48))).toBe(0);
    expect(await statusOf(booking.id)).toBe("CONFIRMED");
  });

  it("counts only once when clicked twice", async () => {
    const booking = await request();
    expect(await acceptRequest(db, booking.id)).toEqual({ ok: true });
    expect(await acceptRequest(db, booking.id)).toEqual({ ok: false, error: "ALREADY_ACCEPTED" });
  });

  it("still works after the request ran out, if the bike is free", async () => {
    const booking = await request();
    await releaseExpiredHolds(db, later(25));
    expect(await statusOf(booking.id)).toBe("EXPIRED");
    expect(await activeBlocks(booking.id)).toBe(0);

    expect(await acceptRequest(db, booking.id, later(26))).toEqual({ ok: true });
    expect(await statusOf(booking.id)).toBe("CONFIRMED");
    expect(await activeBlocks(booking.id)).toBe(1);
  });

  it("refuses a request that ran out once someone else has the bike", async () => {
    const first = await request();
    await releaseExpiredHolds(db, later(25));
    const second = await request({
      now: later(25),
      startDate: "2026-11-15",
      endDate: "2026-11-20",
    });

    expect(await acceptRequest(db, first.id, later(26))).toEqual({
      ok: false,
      error: "BIKE_TAKEN",
    });
    expect(await statusOf(first.id)).toBe("EXPIRED");
    expect(await activeBlocks(second.id)).toBe(1);
  });

  it("refuses a request that ran out once its pick-up day has passed", async () => {
    const booking = await request({ startDate: "2026-10-12", endDate: "2026-10-14" });
    await releaseExpiredHolds(db, later(25));
    expect(await acceptRequest(db, booking.id, later(72))).toEqual({
      ok: false,
      error: "TOO_LATE",
    });
  });

  it("refuses a declined request", async () => {
    const booking = await request();
    await declineRequest(db, booking.id);
    expect(await acceptRequest(db, booking.id)).toEqual({ ok: false, error: "ALREADY_DECLINED" });
  });
});

describe("declining a booking request", () => {
  it("cancels it and frees the bike for the next customer", async () => {
    const booking = await request();
    expect(await declineRequest(db, booking.id, later(1))).toEqual({ ok: true });

    const after = await db.booking.findUniqueOrThrow({ where: { id: booking.id } });
    expect(after.status).toBe("CANCELLED");
    expect(after.cancelledAt).toEqual(later(1));
    expect(await activeBlocks(booking.id)).toBe(0);

    // The only Versys can be requested again for the same days.
    await request({ now: later(2) });
  });

  it("doesn't cancel a booking that was already accepted", async () => {
    const booking = await request();
    await acceptRequest(db, booking.id);
    expect(await declineRequest(db, booking.id)).toEqual({ ok: false, error: "ALREADY_ACCEPTED" });
    expect(await statusOf(booking.id)).toBe("CONFIRMED");
    expect(await activeBlocks(booking.id)).toBe(1);
  });
});

describe("booking request emails", () => {
  it("sends the shop every detail with accept and decline links, and tells the customer", async () => {
    const helmet = await db.addOn.findUniqueOrThrow({ where: { slug: "premium-helmet" } });
    const booking = await request({
      addOns: [{ addOnId: helmet.id, quantity: 2 }],
      customer: {
        name: "Test Rider",
        email: "rider@example.com",
        phone: "+44 7700 900123",
        note: "Arriving on the night bus",
      },
    });
    const box = outbox();
    await sendRequestEmails(db, booking.id, box.send);

    const [toShop, toCustomer] = box.sent;
    expect(toShop.to).toBe("shop@example.com");
    expect(toShop.replyTo).toBe("rider@example.com");
    expect(toShop.subject).toContain(booking.reference);
    for (const part of [
      "Test Rider",
      "rider@example.com",
      "+44 7700 900123",
      "Arriving on the night bus",
      "Kawasaki Versys X300",
      booking.bike!.plate,
      "Tue 10 Nov 2026 to Tue 17 Nov 2026 (8 days)",
      "Premium helmet × 2",
      `/staff/request/${booking.decisionToken}?answer=accept`,
      `/staff/request/${booking.decisionToken}?answer=decline`,
    ]) {
      expect(toShop.text).toContain(part);
    }

    expect(toCustomer.to).toBe("rider@example.com");
    expect(toCustomer.text).toContain("nothing to pay yet");
    expect(toCustomer.text).toContain(`/booking/${booking.viewToken}`);
    // The customer never sees the shop's accept link or the plate.
    expect(toCustomer.text).not.toContain(booking.decisionToken);
    expect(toCustomer.html).not.toContain(booking.decisionToken);
  });

  it("tells the customer the answer, with the shop's reason when declined", async () => {
    const booking = await request();
    const box = outbox();

    await acceptRequest(db, booking.id);
    expect(await sendAnswerEmail(db, booking.id, { accepted: true }, box.send)).toBe(true);
    expect(box.sent[0].subject).toBe(`Booking ${booking.reference} is confirmed`);
    expect(box.sent[0].text).toContain("arrange the booking deposit");

    const other = await request({ startDate: "2026-12-01", endDate: "2026-12-05" });
    await declineRequest(db, other.id);
    await sendAnswerEmail(
      db,
      other.id,
      { accepted: false, reason: "That bike is <in the workshop> that week." },
      box.send,
    );
    expect(box.sent[1].text).toContain("That bike is <in the workshop> that week.");
    expect(box.sent[1].html).toContain("&lt;in the workshop&gt;");
    expect(box.sent[1].html).not.toContain("<in the workshop>");
  });

  it("reports false when the answer email can't be sent", async () => {
    const booking = await request();
    await acceptRequest(db, booking.id);
    const failing = async () => {
      throw new Error("Resend is down");
    };
    expect(await sendAnswerEmail(db, booking.id, { accepted: true }, failing)).toBe(false);
  });
});

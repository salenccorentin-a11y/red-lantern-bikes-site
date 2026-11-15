// Booking requests: until online payments exist, every online booking waits
// for the shop's answer. The request holds its bike (so nobody else can take
// it meanwhile); the shop gets an email with Accept and Decline links, and
// arranges payment with the customer itself after accepting.
//
// This file has the two answers and the emails around them. Creating the
// request, and letting an unanswered one lapse, is in bookings.ts.

import type { PrismaClient } from "@/generated/prisma/client";
import { whatsappLink } from "@/content/business";
import { dropoffLabel } from "@/lib/cities";
import { formatDisplayDate, formatSaigonDateTime, toIsoDate, todayInSaigon } from "@/lib/dates";
import { QUEUED_WRITE, bikeIsFree, lockBike } from "@/server/bike-lock";
import { isOverlapViolation, withTransientRetry } from "@/server/db-errors";
import { sendEmail, type Email } from "@/server/email";
import {
  bookingAcceptedEmail,
  bookingDeclinedEmail,
  bookingReceivedEmail,
  bookingRequestEmail,
  requestExpiredEmail,
  type RequestEmailData,
} from "@/server/emails/booking-request";
import { reportError } from "@/server/report-error";

export type AnswerError =
  | "NOT_FOUND"
  /** Already accepted (or the rental has even started). */
  | "ALREADY_ACCEPTED"
  /** Already declined or cancelled. */
  | "ALREADY_DECLINED"
  /** The request lapsed and someone else has the bike for those days now. */
  | "BIKE_TAKEN"
  /** The request lapsed and its pick-up day has passed. */
  | "TOO_LATE";

export type AnswerResult = { ok: true } | { ok: false; error: AnswerError };

const fail = (error: AnswerError): AnswerResult => ({ ok: false, error });

/**
 * The shop accepts a request: the booking is confirmed and keeps its bike.
 * A request that lapsed unanswered can still be accepted, as long as its bike
 * is still free for those days.
 */
export async function acceptRequest(
  db: PrismaClient,
  bookingId: string,
  now: Date = new Date(),
): Promise<AnswerResult> {
  try {
    return await withTransientRetry(() =>
      db.$transaction(async (tx) => {
        const booking = await tx.booking.findUnique({
          where: { id: bookingId },
          include: { occupancies: true },
        });
        if (!booking) return fail("NOT_FOUND");

        if (booking.status === "PENDING_PAYMENT") {
          // Only if it's still waiting: two clicks at once must not both count.
          const { count } = await tx.booking.updateMany({
            where: { id: bookingId, status: "PENDING_PAYMENT" },
            data: { status: "CONFIRMED", holdExpiresAt: null },
          });
          return count === 1 ? { ok: true as const } : fail("ALREADY_ACCEPTED");
        }

        if (booking.status === "EXPIRED") {
          if (toIsoDate(booking.startDate) < todayInSaigon(now)) return fail("TOO_LATE");
          if (!booking.bikeId || booking.occupancies.length === 0) return fail("BIKE_TAKEN");
          // Its days were freed when it lapsed. Take them back, if nobody
          // else has booked or blocked the bike since.
          const times = booking.occupancies.flatMap((o) => [o.startDate, o.endDate]);
          const first = new Date(Math.min(...times.map((d) => d.getTime())));
          const last = new Date(Math.max(...times.map((d) => d.getTime())));
          await lockBike(tx, booking.bikeId);
          if (!(await bikeIsFree(tx, booking.bikeId, first, last))) return fail("BIKE_TAKEN");
          await tx.bikeOccupancy.updateMany({ where: { bookingId }, data: { releasedAt: null } });
          await tx.booking.update({
            where: { id: bookingId },
            data: { status: "CONFIRMED", holdExpiresAt: null },
          });
          return { ok: true as const };
        }

        return fail(booking.status === "CANCELLED" ? "ALREADY_DECLINED" : "ALREADY_ACCEPTED");
      }, QUEUED_WRITE),
    );
  } catch (error) {
    // Backstop: the database itself refused to give the days back.
    if (isOverlapViolation(error)) return fail("BIKE_TAKEN");
    throw error;
  }
}

/** The shop declines a request: it's cancelled and the bike is free again. */
export async function declineRequest(
  db: PrismaClient,
  bookingId: string,
  now: Date = new Date(),
): Promise<AnswerResult> {
  return db.$transaction(async (tx) => {
    const { count } = await tx.booking.updateMany({
      where: { id: bookingId, status: { in: ["PENDING_PAYMENT", "EXPIRED"] } },
      data: { status: "CANCELLED", cancelledAt: now, holdExpiresAt: null },
    });
    if (count === 0) {
      const booking = await tx.booking.findUnique({ where: { id: bookingId } });
      if (!booking) return fail("NOT_FOUND");
      // An accepted booking is cancelled from the staff area, not from the email link.
      return fail(booking.status === "CANCELLED" ? "ALREADY_DECLINED" : "ALREADY_ACCEPTED");
    }
    await tx.bikeOccupancy.updateMany({
      where: { bookingId, releasedAt: null },
      data: { releasedAt: now },
    });
    return { ok: true as const };
  });
}

/** In plain words, for the page the shop sees after clicking. */
export const ANSWER_ERROR_TEXT: Record<AnswerError, string> = {
  NOT_FOUND: "This booking request doesn't exist any more.",
  ALREADY_ACCEPTED: "This booking was already accepted. To cancel it, open it in the staff area.",
  ALREADY_DECLINED: "This request was already declined or cancelled.",
  BIKE_TAKEN:
    "This request ran out before it was answered, and the bike has been booked or blocked for those days since. Ask the customer to send a new request, or create the booking as a walk-in on another bike.",
  TOO_LATE: "This request ran out before it was answered, and its pick-up day has passed.",
};

// ─── Emails ─────────────────────────────────────────────────────────────────

/** Where booking requests are sent: the shop's own inbox. */
export function shopEmail(): string | null {
  return process.env.BOOKINGS_EMAIL || process.env.ENQUIRIES_EMAIL || null;
}

const siteUrl = () => process.env.SITE_URL ?? "http://localhost:3000";

/** Everything the emails say about one booking. */
export async function requestEmailData(
  db: PrismaClient,
  bookingId: string,
): Promise<RequestEmailData> {
  const b = await db.booking.findUniqueOrThrow({
    where: { id: bookingId },
    include: { bikeModel: true, bike: true, addOns: true },
  });
  return {
    reference: b.reference,
    bikeName: b.bikeModel.name,
    plate: b.bike?.plate ?? null,
    startDate: formatDisplayDate(toIsoDate(b.startDate)),
    endDate: formatDisplayDate(toIsoDate(b.endDate)),
    days: b.days,
    dropoffLabel: dropoffLabel(b.dropoffCity),
    rentalVnd: b.rentalVnd,
    oneWayFeeVnd: b.oneWayFeeVnd,
    addOns: b.addOns.map((a) => ({ name: a.name, quantity: a.quantity, totalVnd: a.totalVnd })),
    totalVnd: b.totalVnd,
    depositVnd: b.depositVnd,
    balanceVnd: b.balanceVnd,
    customerName: b.customerName,
    customerEmail: b.customerEmail,
    customerPhone: b.customerPhone,
    customerNote: b.customerNote,
    answerBy:
      b.status === "PENDING_PAYMENT" && b.holdExpiresAt
        ? formatSaigonDateTime(b.holdExpiresAt)
        : null,
    bookingUrl: `${siteUrl()}/booking/${b.viewToken}`,
    decisionUrl: `${siteUrl()}/staff/request/${b.decisionToken}`,
    staffUrl: `${siteUrl()}/staff/bookings/${b.id}`,
    bookUrl: `${siteUrl()}/book`,
    whatsappUrl: whatsappLink(`Hi Red Lantern Bikes! About my booking ${b.reference}.`),
  };
}

type Send = (email: Email) => Promise<unknown>;

/**
 * A new request: tells the shop (with the Accept / Decline links) and the
 * customer. The request stands even if an email fails; it's in the staff area.
 */
export async function sendRequestEmails(
  db: PrismaClient,
  bookingId: string,
  send: Send = sendEmail,
) {
  const d = await requestEmailData(db, bookingId);
  const shop = shopEmail();
  if (shop) {
    try {
      await send(bookingRequestEmail(shop, d));
    } catch (error) {
      await reportError(`Booking request ${d.reference}: email to the shop failed`, error);
    }
  } else {
    await reportError(
      `Booking request ${d.reference}: nobody was told`,
      new Error("BOOKINGS_EMAIL is not set, so booking requests can't be emailed to the shop."),
    );
  }
  if (d.customerEmail) {
    try {
      await send(bookingReceivedEmail(d.customerEmail, d));
    } catch (error) {
      await reportError(`Booking request ${d.reference}: email to the customer failed`, error);
    }
  }
}

/** Tells the customer the shop's answer. Returns false if the email couldn't be sent. */
export async function sendAnswerEmail(
  db: PrismaClient,
  bookingId: string,
  answer: { accepted: true } | { accepted: false; reason: string | null },
  send: Send = sendEmail,
): Promise<boolean> {
  const d = await requestEmailData(db, bookingId);
  if (!d.customerEmail) return false;
  try {
    await send(
      answer.accepted
        ? bookingAcceptedEmail(d.customerEmail, d)
        : bookingDeclinedEmail(d.customerEmail, d, answer.reason),
    );
    return true;
  } catch (error) {
    await reportError(`Booking ${d.reference}: the answer email to the customer failed`, error);
    return false;
  }
}

export { bookingRequestEmail, requestExpiredEmail };

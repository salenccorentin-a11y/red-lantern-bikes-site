// Scheduled jobs, run every hour (scripts/run-jobs.ts, a Railway cron job):
// - remind the shop about booking requests it hasn't answered, a few hours
//   before their hold runs out,
// - release requests whose hold has run out, and tell those customers,
// - remind customers the day before pick-up of what to bring.
//
// Each reminder is claimed in the database before it's sent (its "sent at"
// is set only if still empty), so two runs at once can't send it twice. If
// sending fails, the claim is undone and the next run tries again.

import type { PrismaClient } from "@/generated/prisma/client";
import { dropoffLabel } from "@/lib/cities";
import { formatDisplayDate, toIsoDate, todayInSaigon, addDays, parseIsoDate } from "@/lib/dates";
import { ADDRESS_LINE, BUSINESS, mapsLink, whatsappLink } from "@/content/business";
import { getSettings } from "@/server/availability";
import {
  bookingRequestEmail,
  requestEmailData,
  requestExpiredEmail,
  shopEmail,
} from "@/server/booking-requests";
import { releaseExpiredHolds } from "@/server/bookings";
import { sendEmail, type Email } from "@/server/email";
import { reportError } from "@/server/report-error";
import { pickupReminderEmail } from "@/server/emails/pickup-reminder";

/** Remind the shop when this many hours (or fewer) of a request's hold are left. */
export const HOLD_REMINDER_HOURS = 3;
/** Don't remind about a hold with less than this left: it would arrive too late. */
const HOLD_REMINDER_MIN_LEFT_MS = 15 * 60_000;
/** Don't tell customers about requests that lapsed longer ago than this. */
const EXPIRY_NOTICE_MAX_AGE_MS = 48 * 3_600_000;
/** Day-before reminders go out from this hour, Saigon time (no night emails). */
export const PICKUP_REMINDER_FROM_HOUR = 9;

type Send = (email: Email) => Promise<unknown>;

const bookingUrl = (viewToken: string) =>
  `${process.env.SITE_URL ?? "http://localhost:3000"}/booking/${viewToken}`;

/** Sends one claimed reminder; gives the claim back if sending fails. */
async function sendClaimed(release: () => Promise<unknown>, send: () => Promise<unknown>) {
  try {
    await send();
    return true;
  } catch (error) {
    await release();
    await reportError("Reminder email failed; it will be retried on the next run.", error);
    return false;
  }
}

/**
 * Reminds the shop about requests it hasn't answered yet, once each, when
 * their hold is about to run out.
 */
export async function sendAnswerReminders(
  db: PrismaClient,
  now: Date = new Date(),
  send: Send = sendEmail,
) {
  const to = shopEmail();
  if (!to) return 0;
  // With a short hold (set in staff settings), a reminder would arrive almost
  // as soon as the request itself, so there are none.
  const { holdHours } = await getSettings(db);
  if (holdHours <= HOLD_REMINDER_HOURS + 1) return 0;

  const due = await db.booking.findMany({
    where: {
      status: "PENDING_PAYMENT",
      source: "ONLINE",
      holdReminderSentAt: null,
      holdExpiresAt: {
        gt: new Date(now.getTime() + HOLD_REMINDER_MIN_LEFT_MS),
        lte: new Date(now.getTime() + HOLD_REMINDER_HOURS * 3_600_000),
      },
    },
    select: { id: true },
  });

  let sent = 0;
  for (const b of due) {
    const claimed = await db.booking.updateMany({
      where: { id: b.id, holdReminderSentAt: null, status: "PENDING_PAYMENT" },
      data: { holdReminderSentAt: now },
    });
    if (claimed.count === 0) continue;
    const ok = await sendClaimed(
      () => db.booking.update({ where: { id: b.id }, data: { holdReminderSentAt: null } }),
      async () =>
        send(bookingRequestEmail(to, await requestEmailData(db, b.id), { reminder: true })),
    );
    if (ok) sent++;
  }
  return sent;
}

/**
 * Tells customers whose request ran out unanswered that the bike was
 * released, once each. Run after releaseExpiredHolds.
 */
export async function sendExpiryNotices(
  db: PrismaClient,
  now: Date = new Date(),
  send: Send = sendEmail,
) {
  const due = await db.booking.findMany({
    where: {
      status: "EXPIRED",
      source: "ONLINE",
      expiryNoticeSentAt: null,
      customerEmail: { not: null },
      holdExpiresAt: { gte: new Date(now.getTime() - EXPIRY_NOTICE_MAX_AGE_MS), lte: now },
    },
    select: { id: true, customerEmail: true },
  });

  let sent = 0;
  for (const b of due) {
    const claimed = await db.booking.updateMany({
      where: { id: b.id, expiryNoticeSentAt: null, status: "EXPIRED" },
      data: { expiryNoticeSentAt: now },
    });
    if (claimed.count === 0) continue;
    const ok = await sendClaimed(
      () => db.booking.update({ where: { id: b.id }, data: { expiryNoticeSentAt: null } }),
      async () => send(requestExpiredEmail(b.customerEmail!, await requestEmailData(db, b.id))),
    );
    if (ok) sent++;
  }
  return sent;
}

/** The hour of the day in Saigon (0–23). */
function saigonHour(now: Date): number {
  return Number(
    new Intl.DateTimeFormat("en-GB", {
      hour: "2-digit",
      hourCycle: "h23",
      timeZone: "Asia/Ho_Chi_Minh",
    }).format(now),
  );
}

export async function sendPickupReminders(
  db: PrismaClient,
  now: Date = new Date(),
  send: Send = sendEmail,
) {
  if (saigonHour(now) < PICKUP_REMINDER_FROM_HOUR) return 0;
  const tomorrow = addDays(parseIsoDate(todayInSaigon(now))!, 1);

  const due = await db.booking.findMany({
    where: {
      status: "CONFIRMED",
      pickupReminderSentAt: null,
      customerEmail: { not: null },
      startDate: tomorrow,
    },
    include: { bikeModel: true },
  });

  let sent = 0;
  for (const b of due) {
    const claimed = await db.booking.updateMany({
      where: { id: b.id, pickupReminderSentAt: null, status: "CONFIRMED" },
      data: { pickupReminderSentAt: now },
    });
    if (claimed.count === 0) continue;
    const ok = await sendClaimed(
      () => db.booking.update({ where: { id: b.id }, data: { pickupReminderSentAt: null } }),
      () =>
        send(
          pickupReminderEmail({
            to: b.customerEmail!,
            customerName: b.customerName,
            reference: b.reference,
            bikeName: b.bikeModel.name,
            startDate: formatDisplayDate(toIsoDate(b.startDate)),
            endDate: formatDisplayDate(toIsoDate(b.endDate)),
            dropoffLabel: dropoffLabel(b.dropoffCity),
            balanceVnd: b.balanceVnd,
            address: ADDRESS_LINE,
            hours: BUSINESS.hours,
            mapsUrl: mapsLink(),
            whatsappUrl: whatsappLink(`Hi Red Lantern Bikes! About my booking ${b.reference}.`),
            bookingUrl: bookingUrl(b.viewToken),
          }),
        ),
    );
    if (ok) sent++;
  }
  return sent;
}

/** Everything the hourly job does, in order. */
export async function runScheduledJobs(db: PrismaClient, now: Date = new Date()) {
  const answerReminders = await sendAnswerReminders(db, now);
  const released = await releaseExpiredHolds(db, now);
  const expiryNotices = await sendExpiryNotices(db, now);
  const pickupReminders = await sendPickupReminders(db, now);
  return { answerReminders, released, expiryNotices, pickupReminders };
}

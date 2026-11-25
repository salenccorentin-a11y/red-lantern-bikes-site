// The 08:00 email to the shop (src/server/emails/morning-list.ts), sent by
// the hourly job (src/server/reminders.ts) on its first run from 08:00
// Saigon time. Sent once a day at most: the day's DailyEmail row is the
// claim. Nothing to report means no email.

import type { PrismaClient } from "@/generated/prisma/client";
import { formatDisplayDate, parseIsoDate, todayInSaigon } from "@/lib/dates";
import { shopEmail } from "@/server/booking-requests";
import { waitingRequests, todaysMovements } from "@/server/calendar";
import { sendEmail, type Email } from "@/server/email";
import { morningListEmail, type MorningItem } from "@/server/emails/morning-list";
import { isUniqueViolation } from "@/server/db-errors";
import { oilDueToday } from "@/server/oil";
import { reportError } from "@/server/report-error";

export const MORNING_EMAIL_FROM_HOUR = 8;
const KIND = "morning-list";

const staffUrl = (path: string) => `${process.env.SITE_URL ?? "http://localhost:3000"}${path}`;

type Send = (email: Email) => Promise<unknown>;

export async function sendMorningList(
  db: PrismaClient,
  now: Date = new Date(),
  hour: number,
  send: Send = sendEmail,
): Promise<boolean> {
  const to = shopEmail();
  if (!to || hour < MORNING_EMAIL_FROM_HOUR) return false;
  const todayIso = todayInSaigon(now);
  const today = parseIsoDate(todayIso)!;

  // Already sent today?
  if (await db.dailyEmail.findUnique({ where: { kind_day: { kind: KIND, day: today } } })) {
    return false;
  }

  const [oil, movements, requests] = await Promise.all([
    oilDueToday(db, now),
    todaysMovements(db, today),
    waitingRequests(db),
  ]);
  const item = (id: string, label: string): MorningItem => ({
    label,
    url: staffUrl(`/staff/bookings/${id}`),
  });
  const bike = (b: { bikeModel: { name: string }; bike: { plate: string } | null }) =>
    `${b.bikeModel.name}${b.bike ? ` ${b.bike.plate}` : ""}`;

  const data = {
    to,
    dateLabel: formatDisplayDate(todayIso),
    oil: oil.map((r) =>
      item(
        r.id,
        `${r.customerName} · ${bike(r)} · ${r.daysSince} ${r.daysSince === 1 ? "day" : "days"} since ${r.oilChangedOn ? "oil change" : "pick-up"}`,
      ),
    ),
    pickups: movements.pickups.map((b) => item(b.id, `${b.customerName} · ${bike(b)}`)),
    returns: movements.returns.map((b) => item(b.id, `${b.customerName} · ${bike(b)}`)),
    requests: requests.map((b) => item(b.id, `${b.customerName} · ${bike(b)}`)),
    oilPageUrl: staffUrl("/staff/oil"),
  };
  const empty =
    data.oil.length + data.pickups.length + data.returns.length + data.requests.length === 0;

  // Claim today's email (also when there's nothing to say, so we don't check
  // again every hour).
  try {
    await db.dailyEmail.create({ data: { kind: KIND, day: today, sentAt: now } });
  } catch (error) {
    if (isUniqueViolation(error)) return false; // Another run got there first.
    throw error;
  }
  if (empty) return false;

  try {
    await send(morningListEmail(data));
    return true;
  } catch (error) {
    // Give the claim back so the next hourly run tries again.
    await db.dailyEmail.delete({ where: { kind_day: { kind: KIND, day: today } } });
    await reportError("Morning list email failed; it will be retried on the next run.", error);
    return false;
  }
}

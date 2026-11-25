// Oil changes for rentals on the road: who needs a WhatsApp reminder, and
// recording what the customer tells us. The rule is in src/lib/oil.ts.

import type { PrismaClient } from "@/generated/prisma/client";
import { addDays, parseIsoDate, todayInSaigon } from "@/lib/dates";
import { daysSinceOilChange, nextOilReminder, oilReminderDue, oilReminderLink } from "@/lib/oil";

export type OilRow = Awaited<ReturnType<typeof oilList>>[number];

/** Every rental out with a customer, soonest reminder first. */
export async function oilList(db: PrismaClient, now: Date = new Date()) {
  const today = parseIsoDate(todayInSaigon(now))!;
  const out = await db.booking.findMany({
    where: { status: "CHECKED_OUT" },
    select: {
      id: true,
      reference: true,
      customerName: true,
      customerPhone: true,
      startDate: true,
      endDate: true,
      oilChangedOn: true,
      kmSinceOilChange: true,
      oilReminderSentOn: true,
      customer: { select: { id: true, phone: true } },
      bike: { select: { plate: true } },
      bikeModel: { select: { name: true, oilIntervalKm: true } },
    },
  });

  return out
    .map((b) => {
      const next = nextOilReminder(b);
      const phone = b.customer?.phone ?? b.customerPhone;
      return {
        ...b,
        next,
        due: oilReminderDue(b, today),
        daysSince: daysSinceOilChange(b, today),
        // Over the shop's km interval for this model, if the customer told us.
        overKm: b.kmSinceOilChange != null && b.kmSinceOilChange >= b.bikeModel.oilIntervalKm,
        // Coming back today or tomorrow: no reminder needed, just so you know.
        endingSoon: b.endDate <= addDays(today, 1),
        whatsappUrl: oilReminderLink(phone, b.customerName),
      };
    })
    .sort((a, b) => a.next.getTime() - b.next.getTime());
}

/** Rentals that need a reminder today, except those coming back by tomorrow. */
export async function oilDueToday(db: PrismaClient, now: Date = new Date()) {
  return (await oilList(db, now)).filter((r) => r.due && !r.endingSoon);
}

type Result = { ok: true } | { ok: false; error: string };

/**
 * The customer told us their km since the last oil change (owner,
 * 2026-11-26): that counts as today's contact, so the reminder stops being
 * due and comes back 2 days later (the "every 2 days" rule, from today).
 */
export async function recordKm(
  db: PrismaClient,
  bookingId: string,
  input: { km: string },
  now: Date = new Date(),
): Promise<Result> {
  const km = Number(input.km.replace(/[\s,.]/g, ""));
  if (!input.km.trim() || !Number.isInteger(km) || km < 0 || km > 100_000) {
    return { ok: false, error: "Write the km as a whole number, e.g. 500." };
  }
  await db.booking.update({
    where: { id: bookingId },
    data: { kmSinceOilChange: km, oilReminderSentOn: parseIsoDate(todayInSaigon(now))! },
  });
  return { ok: true };
}

/**
 * The oil change is done (owner, 2026-11-26): the count starts again, so the
 * next reminder is 5 days after the change and the km are cleared. An empty
 * date means today.
 */
export async function recordOilChange(
  db: PrismaClient,
  bookingId: string,
  input: { changedOn: string },
  now: Date = new Date(),
): Promise<Result> {
  const today = parseIsoDate(todayInSaigon(now))!;
  const date = input.changedOn.trim() ? parseIsoDate(input.changedOn.trim()) : today;
  if (!date) return { ok: false, error: "That oil change date isn't a valid date." };
  if (date > today) return { ok: false, error: "The oil change date can't be in the future." };
  await db.booking.update({
    where: { id: bookingId },
    data: { oilChangedOn: date, kmSinceOilChange: null },
  });
  return { ok: true };
}

/** A reminder was sent today. Returns the WhatsApp link to open, if any. */
export async function markOilReminderSent(
  db: PrismaClient,
  bookingId: string,
  now: Date = new Date(),
) {
  const booking = await db.booking.update({
    where: { id: bookingId },
    data: { oilReminderSentOn: parseIsoDate(todayInSaigon(now))! },
    select: { customerName: true, customerPhone: true, customer: { select: { phone: true } } },
  });
  return oilReminderLink(booking.customer?.phone ?? booking.customerPhone, booking.customerName);
}

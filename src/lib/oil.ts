// Oil-change reminders for bikes on the road, the same rule as the shop's
// Notion "Next reminder" formula (owner, 2026-11-20):
// - first reminder 5 days after the last oil change, or after pick-up if
//   there hasn't been one yet,
// - then every 2 days after a reminder, until the oil change is recorded.
// Saving the km the customer reports counts as a reminder sent that day
// (owner, 2026-11-26), so the next one is 2 days later (src/server/oil.ts).
// Dates are calendar days (UTC midnight), like every DATE column.

import { addDays } from "@/lib/dates";

export const FIRST_REMINDER_DAYS = 5;
export const REPEAT_REMINDER_DAYS = 2;

export const OIL_REMINDER_MESSAGE = (name: string) =>
  `Hi ${name}! Hope the trip is going well. Quick reminder: it is time for an oil change. When you do it, please send me a photo of the mechanic doing it and one of the full odometer, it is needed for the insurance. Thanks and ride safe!`;

export type OilState = {
  startDate: Date;
  oilChangedOn: Date | null;
  oilReminderSentOn: Date | null;
};

/** The day the customer should next get a reminder. */
export function nextOilReminder(s: OilState): Date {
  const base = s.oilChangedOn ?? s.startDate;
  const first = addDays(base, FIRST_REMINDER_DAYS);
  if (s.oilReminderSentOn && s.oilReminderSentOn >= first) {
    return addDays(s.oilReminderSentOn, REPEAT_REMINDER_DAYS);
  }
  return first;
}

/** Whole days since the last oil change (or pick-up). */
export function daysSinceOilChange(s: OilState, today: Date): number {
  const base = s.oilChangedOn ?? s.startDate;
  return Math.round((today.getTime() - base.getTime()) / 86_400_000);
}

/** A reminder is due today (or overdue). Only for bikes out with a customer. */
export function oilReminderDue(s: OilState, today: Date): boolean {
  return nextOilReminder(s) <= today;
}

/** Digits only, for wa.me links. A leading "00" is dropped. Null if too short. */
export function whatsappDigits(phone: string | null | undefined): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "").replace(/^00/, "");
  return digits.length >= 8 ? digits : null;
}

/** A wa.me link to the customer with the reminder ready to send. */
export function oilReminderLink(phone: string | null | undefined, name: string): string | null {
  const digits = whatsappDigits(phone);
  if (!digits) return null;
  const firstName = name.trim().split(/\s+/)[0] || name;
  return `https://wa.me/${digits}?text=${encodeURIComponent(OIL_REMINDER_MESSAGE(firstName))}`;
}

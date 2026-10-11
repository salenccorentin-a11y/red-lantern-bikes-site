// Calendar days as "YYYY-MM-DD" strings. Rentals are booked by date only, so
// there are no times or timezones in the maths: every day is a UTC midnight
// Date internally, which also matches how Prisma stores DATE columns.

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
const DAY_MS = 86_400_000;

/** "2026-11-03" → Date at UTC midnight, or null if it isn't a real calendar day. */
export function parseIsoDate(value: string): Date | null {
  const match = ISO_DATE.exec(value);
  if (!match) return null;
  const [, y, m, d] = match.map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  // Rejects dates like 2026-02-30 that JavaScript would roll over to March.
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== m - 1 || date.getUTCDate() !== d) {
    return null;
  }
  return date;
}

export function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * DAY_MS);
}

/** Rental length counting both the pick-up and drop-off days: 10 → 17 Oct is 8. */
export function daysInclusive(start: Date, end: Date): number {
  return Math.round((end.getTime() - start.getTime()) / DAY_MS) + 1;
}

/** Today's date in Saigon, whatever timezone the server runs in. */
export function todayInSaigon(now: Date = new Date()): string {
  // en-CA formats dates as YYYY-MM-DD.
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ho_Chi_Minh" }).format(now);
}

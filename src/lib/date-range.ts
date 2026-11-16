// The logic behind the booking page's date-range picker, kept apart from the
// component so it can be tested. Days are "YYYY-MM-DD" strings and months are
// "YYYY-MM" strings (see dates.ts), so comparing them as text is comparing dates.

import { addDays, daysInclusive, parseIsoDate, toIsoDate } from "./dates";

/** A trip's days; "" for a day not chosen yet. */
export type DateRange = { start: string; end: string };

/**
 * What tapping a day does. The first tap is the pick-up day and the second
 * the drop-off day (the same day twice is a one-day rental). A tap before
 * the pick-up day moves the pick-up day instead, and a tap once both are
 * chosen starts again. Days before `today` can't be chosen.
 */
export function pickDay(range: DateRange, day: string, today: string): DateRange {
  if (day < today) return range;
  if (!range.start || range.end || day < range.start) return { start: day, end: "" };
  return { start: range.start, end: day };
}

/** The trip's length, counting both the pick-up and drop-off days; null until both are chosen. */
export function tripDays(range: DateRange): number | null {
  const start = parseIsoDate(range.start);
  const end = parseIsoDate(range.end);
  if (!start || !end || end < start) return null;
  return daysInclusive(start, end);
}

export const monthOf = (day: string) => day.slice(0, 7);

/** "2026-12" + 1 → "2027-01". */
export function addMonths(month: string, count: number): string {
  const [year, monthNumber] = month.split("-").map(Number);
  const date = new Date(Date.UTC(year, monthNumber - 1 + count, 1));
  return toIsoDate(date).slice(0, 7);
}

/**
 * A month as rows of seven days for a calendar, with null for the blanks
 * before the 1st and after the last day. `weekStartsOn`: 0 Sunday, 1 Monday.
 */
export function monthWeeks(month: string, weekStartsOn: 0 | 1): (string | null)[][] {
  const first = parseIsoDate(`${month}-01`);
  if (!first) return [];
  const cells: (string | null)[] = Array.from(
    { length: (first.getUTCDay() - weekStartsOn + 7) % 7 },
    () => null,
  );
  for (let day = first; toIsoDate(day).startsWith(month); day = addDays(day, 1)) {
    cells.push(toIsoDate(day));
  }
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks: (string | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

/** Moves a day by a number of days, never to before `earliest`. */
export function shiftDay(day: string, days: number, earliest: string): string {
  const date = parseIsoDate(day);
  if (!date) return earliest;
  const moved = toIsoDate(addDays(date, days));
  return moved < earliest ? earliest : moved;
}

// Placing bookings and blocks on the staff calendar grid. Pure, no database.

import { addDays, daysInclusive } from "@/lib/dates";

export type Placed = {
  /** 1-based column of the first visible day. */
  column: number;
  /** Number of visible days. */
  span: number;
  /** The bar continues before the first visible day. */
  continuesBefore: boolean;
  /** The bar continues after the last visible day. */
  continuesAfter: boolean;
};

/**
 * Where a run of days [start, end] (inclusive) falls in a window of `days`
 * columns starting at `windowStart`, or null if it's entirely outside.
 */
export function placeInWindow(
  start: Date,
  end: Date,
  windowStart: Date,
  days: number,
): Placed | null {
  const windowEnd = addDays(windowStart, days - 1);
  if (end < windowStart || start > windowEnd) return null;

  const visibleStart = start < windowStart ? windowStart : start;
  const visibleEnd = end > windowEnd ? windowEnd : end;
  return {
    column: daysInclusive(windowStart, visibleStart),
    span: daysInclusive(visibleStart, visibleEnd),
    continuesBefore: start < windowStart,
    continuesAfter: end > windowEnd,
  };
}

/** The window's days, for the column headers. */
export function windowDays(windowStart: Date, days: number): Date[] {
  return Array.from({ length: days }, (_, i) => addDays(windowStart, i));
}

type Blocked = { startDate: Date; endDate: Date };

/**
 * The bikes with nothing booked or blocked on `day` (start and end days
 * included), for the calendar's day list. Occupancies are already limited to
 * live ones (not released) by the query.
 */
export function freeOn<B extends { occupancies: Blocked[] }>(bikes: B[], day: Date): B[] {
  const t = day.getTime();
  return bikes.filter((b) =>
    b.occupancies.every((o) => o.endDate.getTime() < t || o.startDate.getTime() > t),
  );
}

/** "XR150 ×2, CB150X, Wave": free bikes counted by model, in the bikes' order. */
export function countByModel(bikes: { model: { name: string } }[]): string {
  const counts = new Map<string, number>();
  for (const b of bikes) counts.set(b.model.name, (counts.get(b.model.name) ?? 0) + 1);
  return [...counts].map(([name, n]) => (n > 1 ? `${name} ×${n}` : name)).join(", ");
}

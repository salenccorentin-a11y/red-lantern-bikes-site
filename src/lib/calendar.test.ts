import { describe, expect, it } from "vitest";
import { placeInWindow, windowDays } from "@/lib/calendar";
import { parseIsoDate, toIsoDate } from "@/lib/dates";

const d = (s: string) => parseIsoDate(s)!;
// A 14-day window from Sunday 1 November 2026.
const place = (start: string, end: string) => placeInWindow(d(start), d(end), d("2026-11-01"), 14);

describe("placeInWindow", () => {
  it("places a booking fully inside the window", () => {
    expect(place("2026-11-03", "2026-11-05")).toEqual({
      column: 3,
      span: 3,
      continuesBefore: false,
      continuesAfter: false,
    });
  });

  it("places a one-day booking on the first day", () => {
    expect(place("2026-11-01", "2026-11-01")).toMatchObject({ column: 1, span: 1 });
  });

  it("cuts off a booking that started before the window", () => {
    expect(place("2026-10-25", "2026-11-02")).toEqual({
      column: 1,
      span: 2,
      continuesBefore: true,
      continuesAfter: false,
    });
  });

  it("cuts off a booking that runs past the window", () => {
    expect(place("2026-11-12", "2026-11-30")).toEqual({
      column: 12,
      span: 3,
      continuesBefore: false,
      continuesAfter: true,
    });
  });

  it("handles a month-long booking that covers the whole window", () => {
    expect(place("2026-10-20", "2026-12-20")).toEqual({
      column: 1,
      span: 14,
      continuesBefore: true,
      continuesAfter: true,
    });
  });

  it("leaves out bookings entirely before or after the window", () => {
    expect(place("2026-10-01", "2026-10-31")).toBeNull();
    expect(place("2026-11-15", "2026-11-20")).toBeNull();
  });
});

describe("windowDays", () => {
  it("lists each day, across a month end", () => {
    expect(windowDays(d("2026-10-30"), 4).map(toIsoDate)).toEqual([
      "2026-10-30",
      "2026-10-31",
      "2026-11-01",
      "2026-11-02",
    ]);
  });
});

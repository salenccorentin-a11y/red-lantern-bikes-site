import { describe, expect, it } from "vitest";
import {
  addDays,
  daysInclusive,
  formatDisplayDate,
  formatSaigonDateTime,
  parseIsoDate,
  toIsoDate,
  todayInSaigon,
} from "@/lib/dates";

const d = (s: string) => parseIsoDate(s)!;

describe("parseIsoDate", () => {
  it("reads YYYY-MM-DD as a calendar day", () => {
    expect(toIsoDate(d("2026-11-03"))).toBe("2026-11-03");
  });

  it("rejects days that don't exist and other formats", () => {
    expect(parseIsoDate("2026-02-30")).toBeNull();
    expect(parseIsoDate("2027-02-29")).toBeNull(); // not a leap year
    expect(parseIsoDate("2026-13-01")).toBeNull();
    expect(parseIsoDate("03/11/2026")).toBeNull();
    expect(parseIsoDate("2026-11-3")).toBeNull();
    expect(parseIsoDate("")).toBeNull();
  });

  it("accepts 29 February in a leap year", () => {
    expect(toIsoDate(d("2028-02-29"))).toBe("2028-02-29");
  });
});

describe("daysInclusive", () => {
  it("counts both the pick-up and drop-off days: 10 to 17 October is 8 days", () => {
    expect(daysInclusive(d("2026-10-10"), d("2026-10-17"))).toBe(8);
  });

  it("counts a same-day rental as 1 day", () => {
    expect(daysInclusive(d("2026-10-10"), d("2026-10-10"))).toBe(1);
  });

  it("works across months, years and leap days", () => {
    expect(daysInclusive(d("2026-12-30"), d("2027-01-02"))).toBe(4);
    expect(daysInclusive(d("2028-02-27"), d("2028-03-01"))).toBe(4);
    expect(daysInclusive(d("2027-02-27"), d("2027-03-01"))).toBe(3);
  });
});

describe("addDays", () => {
  it("moves across month ends", () => {
    expect(toIsoDate(addDays(d("2026-10-30"), 3))).toBe("2026-11-02");
    expect(toIsoDate(addDays(d("2026-11-02"), -3))).toBe("2026-10-30");
  });
});

describe("todayInSaigon", () => {
  it("uses Saigon's date (UTC+7), not the server's", () => {
    // 20:00 UTC on 10 Oct is already 03:00 on 11 Oct in Saigon.
    expect(todayInSaigon(new Date("2026-10-10T20:00:00Z"))).toBe("2026-10-11");
    expect(todayInSaigon(new Date("2026-10-10T16:59:00Z"))).toBe("2026-10-10");
  });
});

describe("display formats", () => {
  it("shows a calendar day with its weekday", () => {
    expect(formatDisplayDate("2026-11-01")).toBe("Sun 1 Nov 2026");
  });

  it("shows a moment in Saigon time", () => {
    expect(formatSaigonDateTime(new Date("2026-10-16T03:00:00Z"))).toBe("16 Oct 2026, 10:00");
  });
});

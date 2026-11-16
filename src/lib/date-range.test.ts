import { describe, expect, it } from "vitest";
import { addMonths, monthWeeks, pickDay, shiftDay, tripDays } from "./date-range";

const TODAY = "2026-11-15";

describe("pickDay", () => {
  it("takes the first tap as the pick-up day and the second as the drop-off day", () => {
    const first = pickDay({ start: "", end: "" }, "2026-12-01", TODAY);
    expect(first).toEqual({ start: "2026-12-01", end: "" });
    expect(pickDay(first, "2026-12-08", TODAY)).toEqual({ start: "2026-12-01", end: "2026-12-08" });
  });

  it("allows a one-day rental: the same day twice", () => {
    const first = pickDay({ start: "", end: "" }, "2026-12-01", TODAY);
    expect(pickDay(first, "2026-12-01", TODAY)).toEqual({ start: "2026-12-01", end: "2026-12-01" });
  });

  it("moves the pick-up day when the second tap is earlier", () => {
    const first = { start: "2026-12-10", end: "" };
    expect(pickDay(first, "2026-12-03", TODAY)).toEqual({ start: "2026-12-03", end: "" });
  });

  it("starts again when both days were already chosen", () => {
    const done = { start: "2026-12-01", end: "2026-12-08" };
    expect(pickDay(done, "2026-12-20", TODAY)).toEqual({ start: "2026-12-20", end: "" });
  });

  it("ignores days before today, but allows today", () => {
    const empty = { start: "", end: "" };
    expect(pickDay(empty, "2026-11-14", TODAY)).toEqual(empty);
    expect(pickDay(empty, TODAY, TODAY)).toEqual({ start: TODAY, end: "" });
  });
});

describe("tripDays", () => {
  it("counts both the pick-up and the drop-off day", () => {
    expect(tripDays({ start: "2026-12-01", end: "2026-12-08" })).toBe(8);
    expect(tripDays({ start: "2026-12-01", end: "2026-12-01" })).toBe(1);
    expect(tripDays({ start: "2026-12-28", end: "2027-01-03" })).toBe(7);
  });

  it("is unknown until both days are chosen", () => {
    expect(tripDays({ start: "2026-12-01", end: "" })).toBeNull();
    expect(tripDays({ start: "", end: "" })).toBeNull();
    expect(tripDays({ start: "2026-12-08", end: "2026-12-01" })).toBeNull();
  });
});

describe("monthWeeks", () => {
  it("lays out December 2026 from Monday (the 1st is a Tuesday)", () => {
    const weeks = monthWeeks("2026-12", 1);
    expect(weeks[0]).toEqual([
      null,
      "2026-12-01",
      "2026-12-02",
      "2026-12-03",
      "2026-12-04",
      "2026-12-05",
      "2026-12-06",
    ]);
    expect(weeks).toHaveLength(5);
    expect(weeks[4]).toEqual([
      "2026-12-28",
      "2026-12-29",
      "2026-12-30",
      "2026-12-31",
      null,
      null,
      null,
    ]);
  });

  it("lays out the same month from Sunday", () => {
    const weeks = monthWeeks("2026-12", 0);
    expect(weeks[0].slice(0, 3)).toEqual([null, null, "2026-12-01"]);
    expect(weeks.flat().filter(Boolean)).toHaveLength(31);
  });

  it("handles February in a leap year and a month starting on the first column", () => {
    expect(monthWeeks("2028-02", 1).flat().filter(Boolean)).toHaveLength(29);
    // 1 February 2027 is a Monday: no blanks before it.
    expect(monthWeeks("2027-02", 1)[0][0]).toBe("2027-02-01");
    expect(monthWeeks("2027-02", 1)).toHaveLength(4);
  });
});

describe("addMonths and shiftDay", () => {
  it("rolls over the year", () => {
    expect(addMonths("2026-12", 1)).toBe("2027-01");
    expect(addMonths("2027-01", -1)).toBe("2026-12");
    expect(addMonths("2026-11", 14)).toBe("2028-01");
  });

  it("moves by days and weeks, across months, never before today", () => {
    expect(shiftDay("2026-11-30", 1, TODAY)).toBe("2026-12-01");
    expect(shiftDay("2026-12-03", -7, TODAY)).toBe("2026-11-26");
    expect(shiftDay("2026-11-17", -7, TODAY)).toBe(TODAY);
  });
});

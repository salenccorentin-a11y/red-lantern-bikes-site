import { describe, expect, it } from "vitest";
import { parseIsoDate, toIsoDate } from "@/lib/dates";
import { lastBlockedDay, rentalBlocks } from "@/lib/occupancy";

const d = (s: string) => parseIsoDate(s)!;
const show = (blocks: ReturnType<typeof rentalBlocks>) =>
  blocks.map((b) => `${b.kind} ${toIsoDate(b.start)}..${toIsoDate(b.end)}`);

describe("rentalBlocks", () => {
  it("round trip with no cleaning gap blocks exactly the rental days", () => {
    const blocks = rentalBlocks({
      start: d("2026-11-10"),
      end: d("2026-11-17"),
      cleaningGapDays: 0,
      transitDays: null,
    });
    expect(show(blocks)).toEqual(["BOOKING 2026-11-10..2026-11-17"]);
  });

  it("round trip adds the cleaning gap after drop-off", () => {
    const blocks = rentalBlocks({
      start: d("2026-11-10"),
      end: d("2026-11-17"),
      cleaningGapDays: 1,
      transitDays: null,
    });
    expect(show(blocks)).toEqual(["BOOKING 2026-11-10..2026-11-18"]);
  });

  it("one-way to Hanoi blocks 3 train days after drop-off", () => {
    const blocks = rentalBlocks({
      start: d("2026-11-01"),
      end: d("2026-11-12"),
      cleaningGapDays: 0,
      transitDays: 3,
    });
    expect(show(blocks)).toEqual([
      "BOOKING 2026-11-01..2026-11-12",
      "TRANSIT 2026-11-13..2026-11-15",
    ]);
    expect(toIsoDate(lastBlockedDay(blocks))).toBe("2026-11-15");
  });

  it("one-way adds the cleaning gap after the train, at the end of the transit block", () => {
    const blocks = rentalBlocks({
      start: d("2026-11-01"),
      end: d("2026-11-12"),
      cleaningGapDays: 1,
      transitDays: 3,
    });
    expect(show(blocks)).toEqual([
      "BOOKING 2026-11-01..2026-11-12",
      "TRANSIT 2026-11-13..2026-11-16",
    ]);
  });

  it("one-way with zero transit and zero gap has no transit block", () => {
    const blocks = rentalBlocks({
      start: d("2026-11-01"),
      end: d("2026-11-12"),
      cleaningGapDays: 0,
      transitDays: 0,
    });
    expect(show(blocks)).toEqual(["BOOKING 2026-11-01..2026-11-12"]);
  });
});

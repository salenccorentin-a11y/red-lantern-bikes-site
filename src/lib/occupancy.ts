// Which days a rental takes a bike out of service. Pure, no database.
//
// Round trip:  the rental days, then the cleaning gap.
// One-way:     the rental days, then the train back to Saigon plus the
//              cleaning gap (as a separate TRANSIT block, so staff can see
//              why the bike is away).

import { addDays } from "@/lib/dates";

export type BlockedRange = {
  kind: "BOOKING" | "TRANSIT";
  /** Inclusive. */
  start: Date;
  /** Inclusive. */
  end: Date;
};

export function rentalBlocks(input: {
  start: Date;
  end: Date;
  cleaningGapDays: number;
  /** Days to bring the bike back to Saigon; null for a trip that ends in Saigon. */
  transitDays: number | null;
}): BlockedRange[] {
  const { start, end, cleaningGapDays, transitDays } = input;

  if (transitDays === null) {
    return [{ kind: "BOOKING", start, end: addDays(end, cleaningGapDays) }];
  }

  const blocks: BlockedRange[] = [{ kind: "BOOKING", start, end }];
  const awayDays = transitDays + cleaningGapDays;
  if (awayDays > 0) {
    blocks.push({ kind: "TRANSIT", start: addDays(end, 1), end: addDays(end, awayDays) });
  }
  return blocks;
}

/** Last day the bike is unavailable because of these blocks. */
export function lastBlockedDay(blocks: BlockedRange[]): Date {
  return new Date(Math.max(...blocks.map((b) => b.end.getTime())));
}

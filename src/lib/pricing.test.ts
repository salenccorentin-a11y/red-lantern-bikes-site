// Every rule in docs/pricing.md, with real rates and fees.
import { describe, expect, it } from "vitest";
import { quote, rateTierFor, type AddOnChoice, type QuoteInput } from "@/lib/pricing";

const WAVE = { dailyRate: 240_000, weeklyRate: 205_000, monthlyRate: 185_000 };
const XR150 = { dailyRate: 400_000, weeklyRate: 350_000, monthlyRate: 300_000 };
const VERSYS = { dailyRate: 1_200_000, weeklyRate: 1_100_000, monthlyRate: 900_000 };

const DEPOSIT = 1_500_000;
const HANOI = (feeVnd: number | null) => ({ minDays: 12, feeVnd });
const DA_NANG = (feeVnd: number | null) => ({ minDays: 7, feeVnd });

const HELMET: AddOnChoice = {
  addOnId: "helmet",
  name: "Second helmet",
  pricing: "PER_DAY",
  unitPrice: 20_000,
  quantity: 1,
};
const RACK: AddOnChoice = {
  addOnId: "rack",
  name: "Luggage rack and straps",
  pricing: "FLAT",
  unitPrice: 150_000,
  quantity: 1,
};

function priced(overrides: Partial<QuoteInput>) {
  const result = quote({
    startDate: "2026-11-01",
    endDate: "2026-11-01",
    rates: XR150,
    oneWay: null,
    addOns: [],
    depositVnd: DEPOSIT,
    ...overrides,
  });
  if (!result.ok) throw new Error(`Expected a price, got ${JSON.stringify(result.error)}`);
  return result.quote;
}

/** End date for a rental of `days` days starting 1 November 2026. */
const endFor = (days: number) => new Date(Date.UTC(2026, 10, days)).toISOString().slice(0, 10);

describe("rate tiers (rule 3): weekly from 7 days, monthly from 30, applied to every day", () => {
  it.each([
    [1, "DAILY"],
    [6, "DAILY"],
    [7, "WEEKLY"],
    [29, "WEEKLY"],
    [30, "MONTHLY"],
    [90, "MONTHLY"],
  ] as const)("%i days → %s", (days, tier) => {
    expect(rateTierFor(days)).toBe(tier);
  });

  it("6-day XR150 at the daily rate: 6 × 400,000", () => {
    const q = priced({ endDate: endFor(6) });
    expect(q).toMatchObject({
      days: 6,
      rateTier: "DAILY",
      dailyRate: 400_000,
      rentalVnd: 2_400_000,
    });
  });

  it("7-day XR150 at the weekly rate for all 7 days: 7 × 350,000", () => {
    const q = priced({ endDate: endFor(7) });
    expect(q).toMatchObject({
      days: 7,
      rateTier: "WEEKLY",
      dailyRate: 350_000,
      rentalVnd: 2_450_000,
    });
  });

  it("10-day XR150 is 10 × 350,000 (the example in docs/pricing.md)", () => {
    expect(priced({ endDate: endFor(10) }).rentalVnd).toBe(3_500_000);
  });

  it("29-day XR150 is still weekly: 29 × 350,000", () => {
    expect(priced({ endDate: endFor(29) })).toMatchObject({
      rateTier: "WEEKLY",
      rentalVnd: 10_150_000,
    });
  });

  it("30-day XR150 at the monthly rate for all 30 days: 30 × 300,000", () => {
    expect(priced({ endDate: endFor(30) })).toMatchObject({
      rateTier: "MONTHLY",
      dailyRate: 300_000,
      rentalVnd: 9_000_000,
    });
  });

  // With "every day" tiers, a longer rental can cost less than a shorter one.
  // This is how rule 3 reads today; these tests record it so it can't change silently.
  it("a 7-day Wave Alpha costs less than 6 days: 1,435,000 vs 1,440,000", () => {
    expect(priced({ rates: WAVE, endDate: endFor(6) }).rentalVnd).toBe(1_440_000);
    expect(priced({ rates: WAVE, endDate: endFor(7) }).rentalVnd).toBe(1_435_000);
  });

  it("a 30-day XR150 costs less than 29 days: 9,000,000 vs 10,150,000", () => {
    expect(priced({ endDate: endFor(29) }).rentalVnd).toBe(10_150_000);
    expect(priced({ endDate: endFor(30) }).rentalVnd).toBe(9_000_000);
  });
});

describe("day count (rule 7): both the pick-up and drop-off days count", () => {
  it("10 to 17 October is 8 days", () => {
    expect(priced({ startDate: "2026-10-10", endDate: "2026-10-17" }).days).toBe(8);
  });

  it("picking up and dropping off on the same day is 1 day", () => {
    expect(priced({ startDate: "2026-10-10", endDate: "2026-10-10" }).days).toBe(1);
  });
});

describe("deposit (rules 4 and 5)", () => {
  it("is part of the total: balance = total − 1,500,000", () => {
    const q = priced({ endDate: endFor(10) }); // 3,500,000
    expect(q).toMatchObject({ totalVnd: 3_500_000, depositVnd: 1_500_000, balanceVnd: 2_000_000 });
  });

  it("is capped at the total: a 1-day Wave Alpha has a 240,000 deposit and nothing at pick-up", () => {
    const q = priced({ rates: WAVE });
    expect(q).toMatchObject({ totalVnd: 240_000, depositVnd: 240_000, balanceVnd: 0 });
  });

  it("is exactly 1,500,000 when the total is exactly 1,500,000", () => {
    const q = priced({ rates: { ...WAVE, dailyRate: 300_000 }, endDate: endFor(5) });
    expect(q).toMatchObject({ totalVnd: 1_500_000, depositVnd: 1_500_000, balanceVnd: 0 });
  });

  it("deposit plus balance always equals the total", () => {
    for (const days of [1, 3, 6, 7, 12, 30]) {
      const q = priced({ rates: WAVE, endDate: endFor(days) });
      expect(q.depositVnd + q.balanceVnd).toBe(q.totalVnd);
    }
  });
});

describe("one-way fees (rule 1)", () => {
  it("adds the model's fee: 12-day XR150 to Hanoi", () => {
    const q = priced({ endDate: endFor(12), oneWay: HANOI(1_600_000) });
    // 12 × 350,000 + 1,600,000
    expect(q).toMatchObject({
      rentalVnd: 4_200_000,
      oneWayFeeVnd: 1_600_000,
      totalVnd: 5_800_000,
      depositVnd: 1_500_000,
      balanceVnd: 4_300_000,
    });
  });

  it("7-day Wave Alpha to Da Nang with the $50 fee", () => {
    const q = priced({ rates: WAVE, endDate: endFor(7), oneWay: DA_NANG(1_300_000) });
    // 7 × 205,000 + 1,300,000
    expect(q.totalVnd).toBe(2_735_000);
  });

  it("refuses a trip shorter than the route's minimum: 11 days to Hanoi", () => {
    const result = quote({
      startDate: "2026-11-01",
      endDate: endFor(11),
      rates: XR150,
      oneWay: HANOI(1_600_000),
      addOns: [],
      depositVnd: DEPOSIT,
    });
    expect(result).toEqual({ ok: false, error: { code: "BELOW_MIN_DAYS", minDays: 12 } });
  });

  it("accepts exactly the minimum: 7 days to Da Nang", () => {
    expect(priced({ endDate: endFor(7), oneWay: DA_NANG(1_600_000) }).days).toBe(7);
  });

  it("refuses a route with no fee set for this model, instead of charging nothing", () => {
    const result = quote({
      startDate: "2026-11-01",
      endDate: endFor(12),
      rates: XR150,
      oneWay: HANOI(null),
      addOns: [],
      depositVnd: DEPOSIT,
    });
    expect(result).toEqual({ ok: false, error: { code: "NO_ONE_WAY_FEE" } });
  });

  it("charges no fee on a Saigon round trip", () => {
    expect(priced({ endDate: endFor(12) }).oneWayFeeVnd).toBe(0);
  });
});

describe("add-ons", () => {
  it("charges per-day add-ons for every rental day and flat ones once", () => {
    const q = priced({ endDate: endFor(8), addOns: [HELMET, RACK] });
    expect(q.addOnLines.map((l) => l.totalVnd)).toEqual([160_000, 150_000]);
    expect(q.addOnsVnd).toBe(310_000);
    // 8 × 350,000 + 310,000
    expect(q.totalVnd).toBe(3_110_000);
  });

  it("multiplies by quantity", () => {
    const q = priced({ endDate: endFor(3), addOns: [{ ...HELMET, quantity: 2 }] });
    expect(q.addOnsVnd).toBe(120_000);
  });

  it("refuses a zero, negative or fractional quantity", () => {
    for (const quantity of [0, -1, 1.5]) {
      const result = quote({
        startDate: "2026-11-01",
        endDate: "2026-11-03",
        rates: XR150,
        oneWay: null,
        addOns: [{ ...RACK, quantity }],
        depositVnd: DEPOSIT,
      });
      expect(result).toEqual({ ok: false, error: { code: "INVALID_ADD_ON", addOnId: "rack" } });
    }
  });

  it("counts add-ons in the deposit cap", () => {
    // 1-day Wave 240,000 + rack 150,000 = 390,000, all paid as the deposit.
    const q = priced({ rates: WAVE, addOns: [RACK] });
    expect(q).toMatchObject({ totalVnd: 390_000, depositVnd: 390_000, balanceVnd: 0 });
  });
});

describe("full booking", () => {
  it("12-day Versys to Hanoi with a second helmet", () => {
    const q = priced({
      rates: VERSYS,
      endDate: endFor(12),
      oneWay: HANOI(2_100_000),
      addOns: [HELMET],
    });
    expect(q).toEqual({
      days: 12,
      rateTier: "WEEKLY",
      dailyRate: 1_100_000,
      rentalVnd: 13_200_000,
      oneWayFeeVnd: 2_100_000,
      addOnLines: [{ ...HELMET, totalVnd: 240_000 }],
      addOnsVnd: 240_000,
      totalVnd: 15_540_000,
      depositVnd: 1_500_000,
      balanceVnd: 14_040_000,
    });
  });
});

describe("bad dates", () => {
  const base = { rates: XR150, oneWay: null, addOns: [], depositVnd: DEPOSIT };

  it("refuses a drop-off before the pick-up", () => {
    expect(quote({ ...base, startDate: "2026-11-10", endDate: "2026-11-09" })).toEqual({
      ok: false,
      error: { code: "END_BEFORE_START" },
    });
  });

  it("refuses dates that don't exist or aren't YYYY-MM-DD", () => {
    for (const [startDate, endDate] of [
      ["2026-02-30", "2026-03-02"],
      ["2026-11-01", "11/05/2026"],
      ["", "2026-11-05"],
    ]) {
      expect(quote({ ...base, startDate, endDate })).toEqual({
        ok: false,
        error: { code: "INVALID_DATE" },
      });
    }
  });
});

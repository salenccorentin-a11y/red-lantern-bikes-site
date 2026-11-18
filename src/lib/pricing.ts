// Booking price calculator. Pure: no database, no clock. The booking code
// loads rates, fees, add-ons and settings, calls quote(), and stores the result
// as the booking's price snapshot. Rules are in docs/pricing.md.

import { daysInclusive, parseIsoDate } from "@/lib/dates";

/** Each tier's rate applies from this many days, to every day of the rental. */
export const WEEKLY_FROM_DAYS = 7;
export const THREE_WEEKS_FROM_DAYS = 21;
export const MONTHLY_FROM_DAYS = 30;
export const FORTY_FIVE_DAYS_FROM_DAYS = 45;

export type RateTier = "DAILY" | "WEEKLY" | "THREE_WEEKS" | "MONTHLY" | "FORTY_FIVE_DAYS";

/**
 * Price per day for each tier, in VND. The 3-week and 45-day prices are
 * optional (added 18 November 2026): while a model has none, that tier is
 * skipped and the weekly or monthly price carries on.
 */
export type RateCard = {
  dailyRate: number;
  weeklyRate: number;
  threeWeekRate?: number | null;
  monthlyRate: number;
  fortyFiveDayRate?: number | null;
};

/** The tiers, shortest first, with the rental length each starts at. */
export const TIERS: readonly { tier: RateTier; fromDays: number }[] = [
  { tier: "DAILY", fromDays: 1 },
  { tier: "WEEKLY", fromDays: WEEKLY_FROM_DAYS },
  { tier: "THREE_WEEKS", fromDays: THREE_WEEKS_FROM_DAYS },
  { tier: "MONTHLY", fromDays: MONTHLY_FROM_DAYS },
  { tier: "FORTY_FIVE_DAYS", fromDays: FORTY_FIVE_DAYS_FROM_DAYS },
];

/** The tier's price per day, or null when the model has no price for it. */
export function rateFor(rates: RateCard, tier: RateTier): number | null {
  switch (tier) {
    case "DAILY":
      return rates.dailyRate;
    case "WEEKLY":
      return rates.weeklyRate;
    case "THREE_WEEKS":
      return rates.threeWeekRate ?? null;
    case "MONTHLY":
      return rates.monthlyRate;
    case "FORTY_FIVE_DAYS":
      return rates.fortyFiveDayRate ?? null;
  }
}

/** The tiers this model has a price for, shortest first, e.g. for a price table. */
export function pricedTiers(rates: RateCard): { tier: RateTier; fromDays: number; rate: number }[] {
  return TIERS.flatMap(({ tier, fromDays }) => {
    const rate = rateFor(rates, tier);
    return rate === null ? [] : [{ tier, fromDays, rate }];
  });
}

export type OneWayTerms = {
  minDays: number;
  /** Fee for this bike model on this route; null if none has been set. */
  feeVnd: number | null;
};

export type AddOnChoice = {
  addOnId: string;
  name: string;
  pricing: "PER_DAY" | "FLAT";
  unitPrice: number;
  quantity: number;
};

export type QuoteInput = {
  /** Pick-up day, "YYYY-MM-DD". */
  startDate: string;
  /** Drop-off day, "YYYY-MM-DD". Both days are charged. */
  endDate: string;
  rates: RateCard;
  /** Null for a Saigon round trip. */
  oneWay: OneWayTerms | null;
  addOns: AddOnChoice[];
  /** The online deposit from settings (1,500,000), before capping. */
  depositVnd: number;
};

export type AddOnLine = AddOnChoice & { totalVnd: number };

export type Quote = {
  days: number;
  rateTier: RateTier;
  dailyRate: number;
  /** days × dailyRate, or less when the price cap applies. */
  rentalVnd: number;
  /**
   * Set when the rental is charged at a longer tier's price because that is
   * cheaper, e.g. a 26-day rental charged as 30 days at the monthly rate.
   */
  cappedAt: { tier: RateTier; days: number } | null;
  oneWayFeeVnd: number;
  addOnLines: AddOnLine[];
  addOnsVnd: number;
  totalVnd: number;
  /** Paid online; capped at the total. */
  depositVnd: number;
  /** Paid at pick-up. */
  balanceVnd: number;
};

export type QuoteError =
  | { code: "INVALID_DATE" }
  | { code: "END_BEFORE_START" }
  | { code: "BELOW_MIN_DAYS"; minDays: number }
  | { code: "NO_ONE_WAY_FEE" }
  | { code: "INVALID_ADD_ON"; addOnId: string };

export type QuoteResult = { ok: true; quote: Quote } | { ok: false; error: QuoteError };

/**
 * The tier for a rental of `days` days: the longest one it reaches that the
 * model has a price for. Without `rates`, every tier counts as priced.
 */
export function rateTierFor(days: number, rates?: RateCard): RateTier {
  let found: RateTier = "DAILY";
  for (const { tier, fromDays } of TIERS) {
    if (days >= fromDays && (!rates || rateFor(rates, tier) !== null)) found = tier;
  }
  return found;
}

/**
 * Rental price for the given number of days. Never more than the price of the
 * next tier's minimum length (decided 11 October 2026), so a customer never
 * pays more for fewer days.
 */
export function rentalPrice(
  rates: RateCard,
  days: number,
): Pick<Quote, "rateTier" | "dailyRate" | "rentalVnd" | "cappedAt"> {
  const rateTier = rateTierFor(days, rates);
  // Never null: rateTierFor only picks tiers with a price.
  const dailyRate = rateFor(rates, rateTier)!;
  let rentalVnd = dailyRate * days;
  let cappedAt: Quote["cappedAt"] = null;

  for (const longer of pricedTiers(rates)) {
    if (days >= longer.fromDays) continue;
    const price = longer.rate * longer.fromDays;
    if (price < rentalVnd) {
      rentalVnd = price;
      cappedAt = { tier: longer.tier, days: longer.fromDays };
    }
  }

  return { rateTier, dailyRate, rentalVnd, cappedAt };
}

/**
 * How much less a rental costs than the same days at the daily rate, e.g.
 * 8 days of an XR150: 8 × 400,000 = 3,200,000 at the daily rate, 2,800,000
 * at the weekly rate, so 400,000 saved. 0 when the daily rate applies.
 */
export function savingVsDaily(rates: RateCard, days: number): number {
  return Math.max(0, rates.dailyRate * days - rentalPrice(rates, days).rentalVnd);
}

export function quote(input: QuoteInput): QuoteResult {
  const start = parseIsoDate(input.startDate);
  const end = parseIsoDate(input.endDate);
  if (!start || !end) return { ok: false, error: { code: "INVALID_DATE" } };
  if (end < start) return { ok: false, error: { code: "END_BEFORE_START" } };

  const days = daysInclusive(start, end);

  let oneWayFeeVnd = 0;
  if (input.oneWay) {
    if (days < input.oneWay.minDays) {
      return { ok: false, error: { code: "BELOW_MIN_DAYS", minDays: input.oneWay.minDays } };
    }
    if (input.oneWay.feeVnd === null) return { ok: false, error: { code: "NO_ONE_WAY_FEE" } };
    oneWayFeeVnd = input.oneWay.feeVnd;
  }

  const rental = rentalPrice(input.rates, days);

  const addOnLines: AddOnLine[] = [];
  for (const addOn of input.addOns) {
    if (!Number.isInteger(addOn.quantity) || addOn.quantity < 1) {
      return { ok: false, error: { code: "INVALID_ADD_ON", addOnId: addOn.addOnId } };
    }
    const perUnit = addOn.pricing === "PER_DAY" ? addOn.unitPrice * days : addOn.unitPrice;
    addOnLines.push({ ...addOn, totalVnd: perUnit * addOn.quantity });
  }
  const addOnsVnd = addOnLines.reduce((sum, line) => sum + line.totalVnd, 0);

  const totalVnd = rental.rentalVnd + oneWayFeeVnd + addOnsVnd;
  const depositVnd = Math.min(input.depositVnd, totalVnd);

  return {
    ok: true,
    quote: {
      days,
      ...rental,
      oneWayFeeVnd,
      addOnLines,
      addOnsVnd,
      totalVnd,
      depositVnd,
      balanceVnd: totalVnd - depositVnd,
    },
  };
}

/**
 * What an extra costs on a given bike: the model's own price if it has one
 * (insurance costs more on bigger bikes), otherwise the extra's usual price.
 */
export function addOnUnitPrice(
  addOn: { price: number; modelPrices: Record<string, number> },
  modelId: string,
): number {
  return addOn.modelPrices[modelId] ?? addOn.price;
}

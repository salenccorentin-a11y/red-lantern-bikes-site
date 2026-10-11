// Which physical bikes are free. Reads only; reserving happens in bookings.ts,
// where the database's no-overlap rule settles any race.

import type { City, PrismaClient, Route, SiteSettings } from "@/generated/prisma/client";
import { parseIsoDate } from "@/lib/dates";
import { lastBlockedDay, rentalBlocks } from "@/lib/occupancy";

export async function getSettings(db: PrismaClient): Promise<SiteSettings> {
  const settings = await db.siteSettings.findUnique({ where: { id: 1 } });
  if (!settings) throw new Error("Site settings are missing. Run `npm run db:seed`.");
  return settings;
}

/** Filter for occupancies that touch any day from `first` to `last`. */
export function overlapping(first: Date, last: Date) {
  return { releasedAt: null, startDate: { lte: last }, endDate: { gte: first } };
}

/** Active bikes with nothing booked or blocked from `first` to `last` inclusive. */
export async function freeBikes(
  db: PrismaClient,
  where: { modelId?: string; bikeId?: string; first: Date; last: Date },
) {
  return db.bike.findMany({
    where: {
      status: "ACTIVE",
      ...(where.modelId && { modelId: where.modelId }),
      ...(where.bikeId && { id: where.bikeId }),
      occupancies: { none: overlapping(where.first, where.last) },
    },
    orderBy: { plate: "asc" },
    select: { id: true, plate: true, modelId: true },
  });
}

export type TripError =
  { code: "ROUTE_NOT_FOUND" } | { code: "ROUTE_NOT_BOOKABLE_ONLINE" } | { code: "ROUTE_NOT_READY" };

/**
 * The route for a pick-up and drop-off city, or null for a round trip.
 * Online bookings only accept routes open for online booking, and one-way trips
 * from Saigon need their transit days set (to block the train ride back).
 */
export async function resolveRoute(
  db: PrismaClient,
  trip: { pickupCity: City; dropoffCity: City; online: boolean },
): Promise<{ ok: true; route: Route | null } | { ok: false; error: TripError }> {
  if (trip.pickupCity === trip.dropoffCity) {
    // Round trips start from the shop in Saigon at launch.
    if (trip.pickupCity !== "SAIGON") return { ok: false, error: { code: "ROUTE_NOT_FOUND" } };
    return { ok: true, route: null };
  }

  const route = await db.route.findUnique({
    where: { fromCity_toCity: { fromCity: trip.pickupCity, toCity: trip.dropoffCity } },
  });
  if (!route || !route.active) return { ok: false, error: { code: "ROUTE_NOT_FOUND" } };
  if (trip.online && !route.bookableOnline) {
    return { ok: false, error: { code: "ROUTE_NOT_BOOKABLE_ONLINE" } };
  }
  if (trip.dropoffCity !== "SAIGON" && route.transitDays === null) {
    return { ok: false, error: { code: "ROUTE_NOT_READY" } };
  }
  return { ok: true, route };
}

/** Days a bike ends up away from Saigon after this route (null: it ends in Saigon). */
export function transitDaysFor(route: Route | null): number | null {
  if (!route || route.toCity === "SAIGON") return null;
  return route.transitDays;
}

/**
 * Number of free bikes per model for these dates and cities, for the booking
 * page's bike list. Models with no free bike are left out.
 */
export async function availabilityByModel(
  db: PrismaClient,
  input: { startDate: string; endDate: string; pickupCity: City; dropoffCity: City },
): Promise<Map<string, number>> {
  const start = parseIsoDate(input.startDate);
  const end = parseIsoDate(input.endDate);
  if (!start || !end || end < start) return new Map();

  const trip = await resolveRoute(db, { ...input, online: true });
  if (!trip.ok) return new Map();

  const settings = await getSettings(db);
  const blocks = rentalBlocks({
    start,
    end,
    cleaningGapDays: settings.cleaningGapDays,
    transitDays: transitDaysFor(trip.route),
  });

  const bikes = await freeBikes(db, { first: start, last: lastBlockedDay(blocks) });
  const counts = new Map<string, number>();
  for (const bike of bikes) counts.set(bike.modelId, (counts.get(bike.modelId) ?? 0) + 1);
  return counts;
}

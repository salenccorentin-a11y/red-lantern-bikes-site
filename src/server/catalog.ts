// Everything the booking page needs to show bikes and prices, as plain data
// that can be passed to the browser. Prices come from the database, so staff
// edits show up on the next page load.

import type { PrismaClient } from "@/generated/prisma/client";
import { studioPhoto } from "./bike-photo";
import { getSettings } from "@/server/availability";

export type OneWayCity = "HANOI" | "DA_NANG";

export type CatalogModel = {
  id: string;
  slug: string;
  name: string;
  kind: string;
  dailyRate: number;
  weeklyRate: number;
  threeWeekRate: number | null;
  monthlyRate: number;
  fortyFiveDayRate: number | null;
  /** Studio photo, or the lantern for a model without one yet. */
  image: string;
  /** One-way fee per destination; missing if none is set for this model. */
  oneWayFees: Partial<Record<OneWayCity, number>>;
  /** Engine size, when known (added by the booking page). */
  engineCc?: number;
};

export type CatalogAddOn = {
  id: string;
  /** Stable name, e.g. "insurance" (for translations). */
  slug: string;
  name: string;
  description: string | null;
  pricing: "PER_DAY" | "FLAT";
  /** For models without their own price. */
  price: number;
  /** Price per model id, where it differs from `price`. */
  modelPrices: Record<string, number>;
  maxQuantity: number;
};

export type Catalog = {
  models: CatalogModel[];
  /** One-way routes open for online booking. */
  routes: { toCity: OneWayCity; minDays: number }[];
  addOns: CatalogAddOn[];
  depositVnd: number;
  usdToVndRate: number;
};

export async function loadCatalog(db: PrismaClient): Promise<Catalog> {
  const [models, routes, addOns, settings] = await Promise.all([
    db.bikeModel.findMany({
      where: { active: true },
      orderBy: { sortOrder: "asc" },
      include: { routeFees: { include: { route: true } } },
    }),
    db.route.findMany({
      where: { fromCity: "SAIGON", active: true, bookableOnline: true, transitDays: { not: null } },
    }),
    db.addOn.findMany({
      where: { active: true },
      orderBy: { sortOrder: "asc" },
      include: { modelPrices: true },
    }),
    getSettings(db),
  ]);

  const onlineRouteIds = new Set(routes.map((r) => r.id));

  return {
    models: models.map((m) => {
      const oneWayFees: CatalogModel["oneWayFees"] = {};
      for (const fee of m.routeFees) {
        if (onlineRouteIds.has(fee.routeId) && fee.route.toCity !== "SAIGON") {
          oneWayFees[fee.route.toCity] = fee.fee;
        }
      }
      return {
        id: m.id,
        slug: m.slug,
        name: m.name,
        kind: m.kind,
        dailyRate: m.dailyRate,
        weeklyRate: m.weeklyRate,
        threeWeekRate: m.threeWeekRate,
        monthlyRate: m.monthlyRate,
        fortyFiveDayRate: m.fortyFiveDayRate,
        image: studioPhoto(m.slug),
        oneWayFees,
      };
    }),
    routes: routes.flatMap((r) =>
      r.toCity === "SAIGON" ? [] : [{ toCity: r.toCity, minDays: r.minDays }],
    ),
    addOns: addOns.map((a) => ({
      id: a.id,
      slug: a.slug,
      name: a.name,
      description: a.description,
      pricing: a.pricing,
      price: a.price,
      modelPrices: Object.fromEntries(a.modelPrices.map((p) => [p.bikeModelId, p.price])),
      maxQuantity: a.maxQuantity,
    })),
    depositVnd: settings.depositVnd,
    usdToVndRate: settings.usdToVndRate,
  };
}

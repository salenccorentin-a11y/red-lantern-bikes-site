// Everything the booking page needs to show bikes and prices, as plain data
// that can be passed to the browser. Prices come from the database, so staff
// edits show up on the next page load.

import type { PrismaClient } from "@/generated/prisma/client";
import { getSettings } from "@/server/availability";

export type OneWayCity = "HANOI" | "DA_NANG";

export type CatalogModel = {
  id: string;
  slug: string;
  name: string;
  kind: string;
  dailyRate: number;
  weeklyRate: number;
  monthlyRate: number;
  /** One-way fee per destination; missing if none is set for this model. */
  oneWayFees: Partial<Record<OneWayCity, number>>;
};

export type Catalog = {
  models: CatalogModel[];
  /** One-way routes open for online booking. */
  routes: { toCity: OneWayCity; minDays: number }[];
  addOns: { id: string; name: string; pricing: "PER_DAY" | "FLAT"; price: number }[];
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
    db.addOn.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }),
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
        monthlyRate: m.monthlyRate,
        oneWayFees,
      };
    }),
    routes: routes.flatMap((r) =>
      r.toCity === "SAIGON" ? [] : [{ toCity: r.toCity, minDays: r.minDays }],
    ),
    addOns: addOns.map((a) => ({ id: a.id, name: a.name, pricing: a.pricing, price: a.price })),
    depositVnd: settings.depositVnd,
    usdToVndRate: settings.usdToVndRate,
  };
}

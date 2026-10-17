import type { PrismaClient } from "@/generated/prisma/client";
import { ADD_ONS, BIKE_MODELS, RETIRED_ADD_ONS, ROUTES, placeholderPlate } from "@/db/seed-data";

/**
 * Fills a database with the fleet, routes, one-way fees, add-ons and settings.
 * Safe to run more than once: existing values are left exactly as they are, so
 * prices edited by staff are never overwritten. Only missing rows and empty
 * transit days are filled in.
 */
export async function seed(db: PrismaClient) {
  await db.siteSettings.upsert({ where: { id: 1 }, create: { id: 1 }, update: {} });

  const onlineRoutes = [];
  for (const route of ROUTES) {
    const saved = await db.route.upsert({
      where: { fromCity_toCity: { fromCity: route.fromCity, toCity: route.toCity } },
      create: route,
      update: {},
    });
    if (saved.transitDays === null && route.transitDays !== null) {
      await db.route.update({ where: { id: saved.id }, data: { transitDays: route.transitDays } });
    }
    if (route.bookableOnline) onlineRoutes.push(saved);
  }

  for (const [i, { units, oneWayFee, ...model }] of BIKE_MODELS.entries()) {
    const saved = await db.bikeModel.upsert({
      where: { slug: model.slug },
      create: { ...model, sortOrder: i },
      update: {},
    });

    // Top up to the number of units with placeholder plates.
    const existing = await db.bike.count({ where: { modelId: saved.id } });
    for (let n = existing + 1; n <= units; n++) {
      await db.bike.create({ data: { plate: placeholderPlate(model.slug, n), modelId: saved.id } });
    }

    for (const route of onlineRoutes) {
      await db.routeFee.upsert({
        where: { routeId_bikeModelId: { routeId: route.id, bikeModelId: saved.id } },
        create: { routeId: route.id, bikeModelId: saved.id, fee: oneWayFee },
        update: {},
      });
    }
  }

  const models = await db.bikeModel.findMany({ select: { id: true, slug: true } });
  for (const [i, { modelPrices = {}, ...addOn }] of ADD_ONS.entries()) {
    const saved = await db.addOn.upsert({
      where: { slug: addOn.slug },
      create: { ...addOn, sortOrder: i },
      update: {},
    });
    for (const model of models) {
      const price = modelPrices[model.slug];
      if (price === undefined) continue;
      await db.addOnModelPrice.upsert({
        where: { addOnId_bikeModelId: { addOnId: saved.id, bikeModelId: model.id } },
        create: { addOnId: saved.id, bikeModelId: model.id, price },
        update: {},
      });
    }
  }
  await db.addOn.updateMany({ where: { slug: { in: RETIRED_ADD_ONS } }, data: { active: false } });
}

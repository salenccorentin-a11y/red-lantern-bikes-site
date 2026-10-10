import type { PrismaClient } from "@/generated/prisma/client";
import { ADD_ONS, BIKE_MODELS, ROUTES, placeholderPlate } from "@/db/seed-data";

/**
 * Fills an empty database with the fleet, routes, add-ons and settings.
 * Safe to run more than once: existing rows are left exactly as they are, so
 * prices edited by staff are never overwritten.
 */
export async function seed(db: PrismaClient) {
  await db.siteSettings.upsert({ where: { id: 1 }, create: { id: 1 }, update: {} });

  for (const [i, { units, ...model }] of BIKE_MODELS.entries()) {
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
  }

  for (const route of ROUTES) {
    await db.route.upsert({
      where: { fromCity_toCity: { fromCity: route.fromCity, toCity: route.toCity } },
      create: route,
      update: {},
    });
  }

  for (const [i, addOn] of ADD_ONS.entries()) {
    await db.addOn.upsert({
      where: { slug: addOn.slug },
      create: { ...addOn, sortOrder: i },
      update: {},
    });
  }
}

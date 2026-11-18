// Bike models for the public pages: prices, one-way fees and how many bikes
// of each model are in the fleet.

import type { PrismaClient } from "@/generated/prisma/client";
import { studioPhoto } from "./bike-photo";

export async function listModels(db: PrismaClient) {
  const models = await db.bikeModel.findMany({
    where: { active: true },
    orderBy: { sortOrder: "asc" },
    include: {
      routeFees: { include: { route: true } },
      _count: { select: { bikes: { where: { status: "ACTIVE" } } } },
    },
  });
  return models.map((m) => ({
    slug: m.slug,
    name: m.name,
    kind: m.kind,
    dailyRate: m.dailyRate,
    weeklyRate: m.weeklyRate,
    threeWeekRate: m.threeWeekRate,
    monthlyRate: m.monthlyRate,
    fortyFiveDayRate: m.fortyFiveDayRate,
    // Text entered in staff settings, for models added there.
    summary: m.summary,
    description: m.description,
    licence: m.licence,
    image: studioPhoto(m.slug),
    units: m._count.bikes,
    oneWayFees: m.routeFees
      .filter((f) => f.route.fromCity === "SAIGON" && f.route.bookableOnline && f.route.active)
      .map((f) => ({ toCity: f.route.toCity, fee: f.fee, minDays: f.route.minDays })),
  }));
}

export type PublicModel = Awaited<ReturnType<typeof listModels>>[number];

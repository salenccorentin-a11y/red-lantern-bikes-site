// Bike models for the public pages: prices, one-way fees and how many bikes
// of each model are in the fleet.

import type { PrismaClient } from "@/generated/prisma/client";

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
    monthlyRate: m.monthlyRate,
    units: m._count.bikes,
    oneWayFees: m.routeFees
      .filter((f) => f.route.fromCity === "SAIGON" && f.route.bookableOnline && f.route.active)
      .map((f) => ({ toCity: f.route.toCity, fee: f.fee, minDays: f.route.minDays })),
  }));
}

export type PublicModel = Awaited<ReturnType<typeof listModels>>[number];

// Looks up a model added from the staff area, for its public page.

import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/lib/db";

/**
 * A model on sale, by its page address: for a model added from the staff
 * area (not in src/content/bikes.ts), whose page title and very existence
 * come from the database. Cached, so the page head is ready at once; staff
 * changes to models refresh it (updateTag("fleet") in the settings actions).
 */
export async function modelOnSale(slug: string) {
  "use cache";
  cacheTag("fleet");
  cacheLife("days");
  const m = await db.bikeModel.findUnique({
    where: { slug },
    select: {
      slug: true,
      name: true,
      summary: true,
      description: true,
      licence: true,
      active: true,
    },
  });
  return m?.active ? m : null;
}

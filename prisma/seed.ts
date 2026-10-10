// Run with `npx prisma db seed` (or `npm run db:seed`).
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { seed } from "../src/db/seed";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("Missing environment variable DATABASE_URL. See .env.example.");

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });

seed(db)
  .then(async () => {
    const [models, bikes, routes, addOns] = await Promise.all([
      db.bikeModel.count(),
      db.bike.count(),
      db.route.count(),
      db.addOn.count(),
    ]);
    console.log(`Seeded: ${models} models, ${bikes} bikes, ${routes} routes, ${addOns} add-ons.`);
  })
  .finally(() => db.$disconnect());

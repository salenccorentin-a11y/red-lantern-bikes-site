// Adds a staff member, or updates one and makes sure they're active.
//
//   npm run staff:add -- <email> "<name>" [OWNER|STAFF]
//
// Uses DATABASE_URL from .env, so run it against the database you mean.
// Owners see costs and profit and can change prices and settings.

import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { normaliseEmail } from "../src/server/auth";

const [email, name, role = "STAFF"] = process.argv.slice(2);
if (!email || !name || (role !== "OWNER" && role !== "STAFF")) {
  console.error('Usage: npm run staff:add -- <email> "<name>" [OWNER|STAFF]');
  process.exit(1);
}

const url = process.env.DATABASE_URL;
if (!url) throw new Error("Missing environment variable DATABASE_URL. See .env.example.");
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });

db.staffUser
  .upsert({
    where: { email: normaliseEmail(email) },
    create: { email: normaliseEmail(email), name, role },
    update: { name, role, active: true },
  })
  .then((staff) => console.log(`${staff.name} <${staff.email}> can sign in as ${staff.role}.`))
  .finally(() => db.$disconnect());

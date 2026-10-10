// Prisma client for database tests. Always points at TEST_DATABASE_URL so tests
// can never write to the development or production database.
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import { requireEnv } from "@/lib/env";

export function createTestClient() {
  const adapter = new PrismaPg({ connectionString: requireEnv("TEST_DATABASE_URL") });
  return new PrismaClient({ adapter });
}

/** Empties every table, so each test starts from a blank database. */
export async function resetDatabase(db: PrismaClient) {
  const tables = await db.$queryRaw<{ tablename: string }[]>`
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public' AND tablename <> '_prisma_migrations'
  `;
  if (tables.length === 0) return;
  const list = tables.map((t) => `"${t.tablename}"`).join(", ");
  await db.$executeRawUnsafe(`TRUNCATE ${list} RESTART IDENTITY CASCADE`);
}

/** A calendar day as Prisma expects for DATE columns, e.g. day("2026-11-03"). */
export function day(isoDate: string) {
  return new Date(`${isoDate}T00:00:00Z`);
}

// Prisma client for database tests. Always points at TEST_DATABASE_URL so tests
// can never write to the development or production database.
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import { requireEnv } from "@/lib/env";

export function createTestClient() {
  const adapter = new PrismaPg({ connectionString: requireEnv("TEST_DATABASE_URL") });
  return new PrismaClient({ adapter });
}

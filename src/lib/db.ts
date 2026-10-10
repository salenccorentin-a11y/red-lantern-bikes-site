import "server-only";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import { requireEnv } from "@/lib/env";

function createClient() {
  const adapter = new PrismaPg({ connectionString: requireEnv("DATABASE_URL") });
  return new PrismaClient({ adapter });
}

// Reuse one client across hot reloads in development, so `next dev`
// doesn't open a new pool of database connections on every edit.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const db = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}

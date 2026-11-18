import "server-only";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import { requireEnv } from "@/lib/env";

// Reuse one client across hot reloads in development, so `next dev`
// doesn't open a new pool of database connections on every edit. After a
// schema change (`prisma migrate dev` regenerates the client), the kept client
// still knows only the old columns ("Unknown argument …" on save, 18 Nov
// 2026), so one made from an older generated client is replaced.
const globalForPrisma = globalThis as unknown as {
  prisma?: { $disconnect(): Promise<void> };
};

function client(): PrismaClient {
  const kept = globalForPrisma.prisma;
  if (kept instanceof PrismaClient) return kept;
  void kept?.$disconnect();
  const adapter = new PrismaPg({ connectionString: requireEnv("DATABASE_URL") });
  const fresh = new PrismaClient({ adapter });
  globalForPrisma.prisma = fresh;
  return fresh;
}

/**
 * The app's database client. It connects on first use rather than on import,
 * so building the site (which imports every route) needs no database.
 */
export const db: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, property) {
    const real = client();
    const value = Reflect.get(real, property, real);
    return typeof value === "function" ? value.bind(real) : value;
  },
});

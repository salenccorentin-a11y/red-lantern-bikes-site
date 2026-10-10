import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Read directly (not env()) so `prisma generate` still works in CI without a database.
    url: process.env["DATABASE_URL"],
  },
});

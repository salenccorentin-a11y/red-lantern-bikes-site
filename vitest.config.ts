import { defineConfig } from "vitest/config";

// Two test projects:
// - unit: pure logic (pricing, formatting), no database. `npm test`
// - db: tests that need the local Postgres from docker-compose.yml. `npm run test:db`
export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: "unit",
          include: ["src/**/*.test.ts"],
          exclude: ["src/**/*.db.test.ts"],
        },
      },
      {
        extends: true,
        test: {
          name: "db",
          include: ["src/**/*.db.test.ts"],
        },
      },
    ],
  },
});

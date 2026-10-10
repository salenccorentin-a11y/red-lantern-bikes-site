import { afterAll, expect, it } from "vitest";
import { createTestClient } from "@/test/db";

const db = createTestClient();

afterAll(() => db.$disconnect());

it("connects to the test database, not the development one", async () => {
  const [row] = await db.$queryRaw<{ db: string }[]>`SELECT current_database() AS db`;
  expect(row.db).toBe("redlantern_test");
});

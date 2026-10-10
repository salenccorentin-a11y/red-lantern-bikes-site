// Runs once before the database tests: brings the test database up to the
// latest migration. Never touches DATABASE_URL's database.
import "dotenv/config";
import { execSync } from "node:child_process";

export default function setup() {
  const url = process.env.TEST_DATABASE_URL;
  if (!url) throw new Error("Missing environment variable TEST_DATABASE_URL. See .env.example.");

  execSync("npx prisma migrate deploy", {
    env: { ...process.env, DATABASE_URL: url },
    stdio: "inherit",
  });
}

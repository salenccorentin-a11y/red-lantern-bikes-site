// The hourly job: releases unpaid bookings whose hold ran out and sends the
// reminder emails (src/server/reminders.ts).
//
//   npm run jobs
//
// On Railway, a cron service runs this every hour ("0 * * * *"). It uses
// DATABASE_URL, RESEND_API_KEY, EMAIL_FROM and SITE_URL from the environment.
// Without RESEND_API_KEY the emails are printed instead of sent.

import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { runScheduledJobs } from "../src/server/reminders";
import { reportError } from "../src/server/report-error";

const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

runScheduledJobs(db)
  .then((result) => console.log(`Jobs done: ${JSON.stringify(result)}`))
  .catch(async (error) => {
    await reportError("Hourly jobs failed", error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());

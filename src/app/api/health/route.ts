// Health check for uptime monitoring (UptimeRobot checks this every few
// minutes). 200 when the site and its database answer; 503 otherwise, which
// triggers an alert.

import { connection } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  await connection();
  try {
    await Promise.race([
      db.$queryRaw`SELECT 1`,
      new Promise((_, reject) => setTimeout(() => reject(new Error("Database timeout")), 5000)),
    ]);
    return Response.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json(
      { ok: false, problem: "database" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}

// GET /api/availability?dropoff=HANOI&start=2026-11-01&end=2026-11-12
// → { "counts": { "<modelId>": 3, ... } }  (models with no free bike are left out)
//
// Runs at request time on every call (it reads the request), so it always
// reflects the latest bookings and maintenance blocks.

import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { availabilityByModel } from "@/server/availability";
import { allow, clientIp } from "@/server/rate-limit";

const query = z.object({
  dropoff: z.enum(["SAIGON", "HANOI", "DA_NANG"]),
  start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export async function GET(request: NextRequest) {
  // The booking page asks a few times per visit; a script asking thousands
  // of times would only load the database.
  const ip = await clientIp();
  if (ip !== "unknown" && !allow(`availability:ip:${ip}`, 120, 10 * 60_000)) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  }
  const parsed = query.safeParse(Object.fromEntries(request.nextUrl.searchParams));
  if (!parsed.success) {
    return NextResponse.json({ error: "Expected dropoff, start and end." }, { status: 400 });
  }

  const counts = await availabilityByModel(db, {
    startDate: parsed.data.start,
    endDate: parsed.data.end,
    pickupCity: "SAIGON",
    dropoffCity: parsed.data.dropoff,
  });

  return NextResponse.json(
    { counts: Object.fromEntries(counts) },
    { headers: { "Cache-Control": "no-store" } },
  );
}

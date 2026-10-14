// The per-bike incident and repair log.

import { z } from "zod";
import type { PrismaClient } from "@/generated/prisma/client";
import { parseIsoDate } from "@/lib/dates";

const vnd = z.coerce.number().int("Whole VND only.").min(0).max(1_000_000_000);

export const incidentInput = z.object({
  bikeId: z.string().min(1),
  bookingId: z.string().min(1).optional(),
  kind: z.enum(["SERVICE", "REPAIR", "DAMAGE", "ACCIDENT", "THEFT", "OTHER"]),
  occurredOn: z.string().refine((s) => parseIsoDate(s) !== null, "Choose a date."),
  description: z.string().trim().min(3, "Describe what happened.").max(2000),
  odometerKm: z.coerce.number().int().min(0).max(2_000_000).optional(),
  partsVnd: vnd.default(0),
  labourVnd: vnd.default(0),
  otherVnd: vnd.default(0),
  recoveredVnd: vnd.default(0),
});

export type IncidentInput = z.input<typeof incidentInput>;

/** Checks the input (it may come straight from a form) and logs it. */
export async function logIncident(db: PrismaClient, raw: unknown, createdById?: string) {
  const parsed = incidentInput.safeParse(raw);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0].message };
  const input = parsed.data;

  if (input.bookingId) {
    const booking = await db.booking.findUnique({ where: { id: input.bookingId } });
    if (!booking || booking.bikeId !== input.bikeId) {
      return { ok: false as const, error: "That booking isn't for this bike." };
    }
  }

  const incident = await db.bikeIncident.create({
    data: { ...input, occurredOn: parseIsoDate(input.occurredOn)!, createdById },
  });
  return { ok: true as const, incident };
}

/** What an incident cost the business, after anything recovered. */
export function netCost(i: {
  partsVnd: number;
  labourVnd: number;
  otherVnd: number;
  recoveredVnd: number;
}) {
  return i.partsVnd + i.labourVnd + i.otherVnd - i.recoveredVnd;
}

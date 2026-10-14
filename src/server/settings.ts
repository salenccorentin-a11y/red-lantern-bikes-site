// Owner settings: business settings, prices, add-ons, bikes and staff.
// Every function checks its own input, so it's safe to call straight from a
// form. Pages call requireOwner() before any of these.

import { z } from "zod";
import type { PrismaClient } from "@/generated/prisma/client";
import { parseIsoDate, todayInSaigon } from "@/lib/dates";
import { normaliseEmail } from "@/server/auth";
import { isUniqueViolation } from "@/server/db-errors";

type Result = { ok: true } | { ok: false; error: string };
const ok: Result = { ok: true };
const fail = (error: string): Result => ({ ok: false, error });
const firstIssue = (e: z.ZodError) => e.issues[0].message;

const vnd = (label: string, min = 0, max = 100_000_000) =>
  z.coerce
    .number({ error: `${label}: enter a number.` })
    .int(`${label}: whole VND only.`)
    .min(min, `${label}: at least ${min.toLocaleString("en-US")}.`)
    .max(max, `${label}: at most ${max.toLocaleString("en-US")}.`);

const checkbox = z.preprocess((v) => v === "on" || v === true || v === "true", z.boolean());

// ─── Business settings ──────────────────────────────────────────────────────

const siteSettings = z.object({
  depositVnd: vnd("Deposit", 0, 10_000_000),
  cleaningGapDays: z.coerce
    .number()
    .int()
    .min(0, "Gap: 0 or more days.")
    .max(14, "Gap: at most 14 days."),
  holdHours: z.coerce
    .number()
    .int()
    .min(1, "Hold: at least 1 hour.")
    .max(168, "Hold: at most 168 hours (7 days)."),
  usdToVndRate: vnd("USD rate", 10_000, 100_000),
});

export async function updateSiteSettings(db: PrismaClient, raw: unknown): Promise<Result> {
  const parsed = siteSettings.safeParse(raw);
  if (!parsed.success) return fail(firstIssue(parsed.error));
  await db.siteSettings.upsert({
    where: { id: 1 },
    create: { id: 1, ...parsed.data },
    update: parsed.data,
  });
  return ok;
}

// ─── Model prices and one-way fees ──────────────────────────────────────────

const modelPricing = z.object({
  modelId: z.string().min(1),
  dailyRate: vnd("Daily rate", 1_000),
  weeklyRate: vnd("Weekly rate", 1_000),
  monthlyRate: vnd("Monthly rate", 1_000),
  active: checkbox,
  /** routeId → fee; an empty value removes the fee (model not offered on that route). */
  fees: z.record(z.string(), z.string()).default({}),
});

export async function updateModelPricing(db: PrismaClient, raw: unknown): Promise<Result> {
  const parsed = modelPricing.safeParse(raw);
  if (!parsed.success) return fail(firstIssue(parsed.error));
  const { modelId, fees, ...prices } = parsed.data;

  const feeUpdates: { routeId: string; fee: number | null }[] = [];
  for (const [routeId, value] of Object.entries(fees)) {
    if (value.trim() === "") {
      feeUpdates.push({ routeId, fee: null });
      continue;
    }
    const fee = vnd("One-way fee", 0, 20_000_000).safeParse(value);
    if (!fee.success) return fail(firstIssue(fee.error));
    feeUpdates.push({ routeId, fee: fee.data });
  }

  await db.$transaction(async (tx) => {
    await tx.bikeModel.update({ where: { id: modelId }, data: prices });
    for (const { routeId, fee } of feeUpdates) {
      if (fee === null) {
        await tx.routeFee.deleteMany({ where: { routeId, bikeModelId: modelId } });
      } else {
        await tx.routeFee.upsert({
          where: { routeId_bikeModelId: { routeId, bikeModelId: modelId } },
          create: { routeId, bikeModelId: modelId, fee },
          update: { fee },
        });
      }
    }
  });
  return ok;
}

// ─── Add-ons ────────────────────────────────────────────────────────────────

const addOn = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(2, "Add-on name: at least 2 characters.").max(80),
  pricing: z.enum(["PER_DAY", "FLAT"]),
  price: vnd("Add-on price", 0, 10_000_000),
  active: checkbox,
});

export async function saveAddOn(db: PrismaClient, raw: unknown): Promise<Result> {
  const parsed = addOn.safeParse(raw);
  if (!parsed.success) return fail(firstIssue(parsed.error));
  const { id, ...data } = parsed.data;
  if (id) {
    await db.addOn.update({ where: { id }, data: { ...data, description: null } });
    return ok;
  }
  const base =
    data.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "add-on";
  const count = await db.addOn.count();
  try {
    await db.addOn.create({ data: { ...data, slug: `${base}-${count + 1}`, sortOrder: count } });
  } catch (error) {
    if (isUniqueViolation(error))
      return fail("An add-on with a similar name exists. Try another name.");
    throw error;
  }
  return ok;
}

// ─── Bikes ──────────────────────────────────────────────────────────────────

const plate = z
  .string()
  .trim()
  .min(3, "Plate: at least 3 characters.")
  .max(20, "Plate: at most 20 characters.")
  .transform((p) => p.toUpperCase());

const bikeDetails = z.object({
  bikeId: z.string().min(1),
  plate,
  notes: z.string().trim().max(500).optional(),
  acquiredOn: z
    .string()
    .optional()
    .refine((s) => !s || parseIsoDate(s) !== null, "Bought on: choose a valid date."),
  purchaseVnd: z.union([z.literal(""), vnd("Purchase price", 0, 1_000_000_000)]).optional(),
});

export async function updateBike(db: PrismaClient, raw: unknown): Promise<Result> {
  const parsed = bikeDetails.safeParse(raw);
  if (!parsed.success) return fail(firstIssue(parsed.error));
  const { bikeId, acquiredOn, purchaseVnd, notes, ...rest } = parsed.data;
  try {
    await db.bike.update({
      where: { id: bikeId },
      data: {
        ...rest,
        notes: notes || null,
        acquiredOn: acquiredOn ? parseIsoDate(acquiredOn) : null,
        purchaseVnd: purchaseVnd === "" || purchaseVnd === undefined ? null : purchaseVnd,
      },
    });
  } catch (error) {
    if (isUniqueViolation(error)) return fail(`Another bike already has plate ${rest.plate}.`);
    throw error;
  }
  return ok;
}

export async function addBike(db: PrismaClient, raw: unknown): Promise<Result> {
  const parsed = z.object({ modelId: z.string().min(1, "Choose a model."), plate }).safeParse(raw);
  if (!parsed.success) return fail(firstIssue(parsed.error));
  try {
    await db.bike.create({ data: parsed.data });
  } catch (error) {
    if (isUniqueViolation(error))
      return fail(`Another bike already has plate ${parsed.data.plate}.`);
    throw error;
  }
  return ok;
}

/** Retire a bike (never offered again) or bring it back. */
export async function setBikeRetired(
  db: PrismaClient,
  bikeId: string,
  retired: boolean,
  now: Date = new Date(),
): Promise<Result> {
  if (retired) {
    const today = parseIsoDate(todayInSaigon(now))!;
    const upcoming = await db.booking.findMany({
      where: {
        bikeId,
        status: { in: ["PENDING_PAYMENT", "CONFIRMED", "CHECKED_OUT"] },
        endDate: { gte: today },
      },
      select: { reference: true },
    });
    if (upcoming.length > 0) {
      return fail(
        `This bike still has bookings: ${upcoming.map((b) => b.reference).join(", ")}. Move or cancel them first.`,
      );
    }
  }
  await db.bike.update({ where: { id: bikeId }, data: { status: retired ? "RETIRED" : "ACTIVE" } });
  return ok;
}

// ─── Staff ──────────────────────────────────────────────────────────────────

const staffFields = z.object({
  // Trim and lowercase before checking, so a pasted " Linh@Example.com" works.
  email: z.preprocess(
    (v) => (typeof v === "string" ? normaliseEmail(v) : v),
    z.email("Staff email: enter a valid address."),
  ),
  name: z.string().trim().min(2, "Staff name: at least 2 characters.").max(80),
  role: z.enum(["OWNER", "STAFF"]),
});

export async function addStaff(db: PrismaClient, raw: unknown): Promise<Result> {
  const parsed = staffFields.safeParse(raw);
  if (!parsed.success) return fail(firstIssue(parsed.error));
  try {
    await db.staffUser.create({ data: parsed.data });
  } catch (error) {
    if (isUniqueViolation(error)) return fail(`${parsed.data.email} is already on the staff list.`);
    throw error;
  }
  return ok;
}

/**
 * Change a staff member's role or switch their access off or on. There must
 * always be at least one active owner, and nobody can lock themselves out.
 */
export async function updateStaff(
  db: PrismaClient,
  raw: unknown,
  actingStaffId: string,
): Promise<Result> {
  const parsed = z
    .object({ staffId: z.string().min(1), role: z.enum(["OWNER", "STAFF"]), active: checkbox })
    .safeParse(raw);
  if (!parsed.success) return fail(firstIssue(parsed.error));
  const { staffId, role, active } = parsed.data;

  if (staffId === actingStaffId && (!active || role !== "OWNER")) {
    return fail("You can't remove your own owner access. Ask another owner to do it.");
  }

  return db
    .$transaction(async (tx) => {
      await tx.staffUser.update({ where: { id: staffId }, data: { role, active } });
      const owners = await tx.staffUser.count({ where: { role: "OWNER", active: true } });
      if (owners === 0) throw new LastOwnerError();
      if (!active) await tx.staffSession.deleteMany({ where: { staffId } });
      return ok;
    })
    .catch((error) => {
      if (error instanceof LastOwnerError)
        return fail("There must always be at least one active owner.");
      throw error;
    });
}

class LastOwnerError extends Error {}

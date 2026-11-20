// Owner settings: business settings, prices, add-ons, bikes and staff.
// Every function checks its own input, so it's safe to call straight from a
// form. Pages call requireOwner() before any of these.

import { z } from "zod";
import type { PrismaClient } from "@/generated/prisma/client";
import { parseIsoDate, todayInSaigon } from "@/lib/dates";
import { PARTNER_NOTE, partnerPlate } from "@/lib/partner-bike";
import { normaliseEmail } from "@/server/auth";
import { isUniqueViolation } from "@/server/db-errors";

type Result = { ok: true } | { ok: false; error: string };
const ok: Result = { ok: true };
const fail = (error: string): Result => ({ ok: false, error });
/** Like fail(), for functions that return more than ok on success. */
const failWith = (error: string) => ({ ok: false as const, error });
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

/** A price that may be left empty: "" or missing → null (tier not priced). */
const optionalVnd = (label: string) =>
  z.preprocess(
    (v) => (v === undefined || (typeof v === "string" && v.trim() === "") ? null : v),
    vnd(label, 1_000).nullable(),
  );

const rateFields = {
  dailyRate: vnd("Daily rate", 1_000),
  weeklyRate: vnd("Weekly rate", 1_000),
  threeWeekRate: optionalVnd("3-week rate"),
  monthlyRate: vnd("Monthly rate", 1_000),
  fortyFiveDayRate: optionalVnd("45-day rate"),
};

const modelPricing = z.object({
  modelId: z.string().min(1),
  ...rateFields,
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
  description: z
    .string()
    .trim()
    .max(200, "Note for customers: at most 200 characters.")
    .optional()
    // Left out: unchanged. Empty: no note.
    .transform((v) => (v === undefined ? undefined : v || null)),
  maxQuantity: z.coerce
    .number()
    .int()
    .min(1, "Max per booking: at least 1.")
    .max(5, "Max per booking: at most 5.")
    .optional(),
  active: checkbox,
});

export async function saveAddOn(db: PrismaClient, raw: unknown): Promise<Result> {
  const parsed = addOn.safeParse(raw);
  if (!parsed.success) return fail(firstIssue(parsed.error));
  const { id, ...data } = parsed.data;
  if (id) {
    await db.addOn.update({ where: { id }, data });
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

/**
 * Prices of one add-on for particular models (e.g. insurance by bike size).
 * `prices` maps model id to the form value; blank means "use the add-on's
 * usual price".
 */
export async function saveAddOnModelPrices(
  db: PrismaClient,
  addOnId: string,
  prices: Record<string, string>,
): Promise<Result> {
  const updates: { bikeModelId: string; price: number | null }[] = [];
  for (const [bikeModelId, value] of Object.entries(prices)) {
    if (value.trim() === "") {
      updates.push({ bikeModelId, price: null });
      continue;
    }
    const price = vnd("Price", 0, 10_000_000).safeParse(value);
    if (!price.success) return fail(firstIssue(price.error));
    updates.push({ bikeModelId, price: price.data });
  }
  await db.$transaction(async (tx) => {
    for (const { bikeModelId, price } of updates) {
      if (price === null) {
        await tx.addOnModelPrice.deleteMany({ where: { addOnId, bikeModelId } });
      } else {
        await tx.addOnModelPrice.upsert({
          where: { addOnId_bikeModelId: { addOnId, bikeModelId } },
          create: { addOnId, bikeModelId, price },
          update: { price },
        });
      }
    }
  });
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

/**
 * Add one or more bikes of a model at once: one plate per line (or separated
 * by commas). Purchase date and price, if given, go on every bike added.
 * All or nothing: if one plate is taken, no bike is added.
 */
export async function addBikes(db: PrismaClient, raw: unknown): Promise<Result> {
  const parsed = z
    .object({
      modelId: z.string().min(1, "Choose a model."),
      plates: z.string(),
      acquiredOn: bikeDetails.shape.acquiredOn,
      purchaseVnd: bikeDetails.shape.purchaseVnd,
    })
    .safeParse(raw);
  if (!parsed.success) return fail(firstIssue(parsed.error));
  const { modelId, acquiredOn, purchaseVnd } = parsed.data;

  const plates: string[] = [];
  for (const line of parsed.data.plates.split(/[\n,]/)) {
    if (line.trim() === "") continue;
    const p = plate.safeParse(line);
    if (!p.success) return fail(`${line.trim()}: ${firstIssue(p.error)}`);
    plates.push(p.data);
  }
  if (plates.length === 0) return fail("Enter at least one plate.");
  if (plates.length > 30) return fail("At most 30 bikes at a time.");
  const twice = plates.find((p, i) => plates.indexOf(p) !== i);
  if (twice) return fail(`Plate ${twice} is in the list twice.`);

  const taken = await db.bike.findMany({
    where: { plate: { in: plates } },
    select: { plate: true },
  });
  if (taken.length > 0) {
    return fail(`Another bike already has plate ${taken.map((b) => b.plate).join(", ")}.`);
  }
  try {
    await db.bike.createMany({
      data: plates.map((p) => ({
        modelId,
        plate: p,
        acquiredOn: acquiredOn ? parseIsoDate(acquiredOn) : null,
        purchaseVnd: purchaseVnd === "" || purchaseVnd === undefined ? null : purchaseVnd,
      })),
    });
  } catch (error) {
    if (isUniqueViolation(error))
      return fail("One of these plates was just added by someone else.");
    throw error;
  }
  return ok;
}

/**
 * Delete a bike for good: only for one added by mistake, with no bookings,
 * blocks or repair records. A bike with history is retired instead.
 */
export async function deleteBike(db: PrismaClient, bikeId: string): Promise<Result> {
  const bike = await db.bike.findUnique({
    where: { id: bikeId },
    select: {
      plate: true,
      _count: { select: { bookings: true, occupancies: true, incidents: true } },
    },
  });
  if (!bike) return fail("This bike no longer exists.");
  const { bookings, occupancies, incidents } = bike._count;
  if (bookings + occupancies + incidents > 0) {
    return fail(
      `${bike.plate} has bookings, blocks or repairs on record, so it can't be deleted. Retire it instead: it's never offered again and keeps its history.`,
    );
  }
  await db.bike.delete({ where: { id: bikeId } });
  return ok;
}

// ─── Bike models ────────────────────────────────────────────────────────────

const newModel = z.object({
  name: z.string().trim().min(2, "Model name: at least 2 characters.").max(60),
  kind: z.string().trim().min(2, "Type: at least 2 characters, e.g. Manual dual-sport.").max(40),
  ...rateFields,
  hanoiFee: optionalVnd("One-way fee to Hanoi"),
  daNangFee: optionalVnd("One-way fee to Da Nang"),
  licence: z.enum(["IDP_OR_A1", "A2"], { error: "Choose the licence needed." }),
  summary: z.string().trim().min(10, "One-line summary: at least 10 characters.").max(140),
  description: z.string().trim().min(20, "Description: at least 20 characters.").max(800),
  active: checkbox,
});

/** "Honda Wave RSX 110" → "honda-wave-rsx-110" (the bike page's address). */
export function modelSlug(name: string): string {
  return (
    name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "bike"
  );
}

/**
 * A new model, with its prices, one-way fees and the text customers see.
 * Its page is at /bikes/<slug> and it's listed last; add its bikes with
 * addBikes. The shop's lantern stands in for a photo until one is added.
 */
export async function createModel(
  db: PrismaClient,
  raw: unknown,
): Promise<{ ok: true; slug: string } | { ok: false; error: string }> {
  const parsed = newModel.safeParse(raw);
  if (!parsed.success) return failWith(firstIssue(parsed.error));
  const { hanoiFee, daNangFee, ...data } = parsed.data;
  const slug = modelSlug(data.name);

  const routes = await db.route.findMany({
    where: { fromCity: "SAIGON", toCity: { in: ["HANOI", "DA_NANG"] } },
    select: { id: true, toCity: true },
  });
  const fees = routes.flatMap((r) => {
    const fee = r.toCity === "HANOI" ? hanoiFee : daNangFee;
    return fee === null ? [] : [{ routeId: r.id, fee }];
  });
  const last = await db.bikeModel.aggregate({ _max: { sortOrder: true } });

  try {
    await db.bikeModel.create({
      data: {
        ...data,
        slug,
        sortOrder: (last._max.sortOrder ?? 0) + 1,
        routeFees: { create: fees },
        // Bookable when all own bikes are taken: see Bike.partner.
        bikes: { create: { plate: partnerPlate(slug), partner: true, notes: PARTNER_NOTE } },
      },
    });
  } catch (error) {
    if (isUniqueViolation(error))
      return failWith(`A model called "${data.name}" (or very close) already exists.`);
    throw error;
  }
  return { ok: true, slug };
}

/**
 * Remove a model for good: only one with no bikes and no bookings (e.g. added
 * by mistake). Otherwise take it off sale: it stays in the records.
 */
export async function deleteModel(db: PrismaClient, modelId: string): Promise<Result> {
  const model = await db.bikeModel.findUnique({
    where: { id: modelId },
    select: {
      name: true,
      // Its partner bike doesn't count: it goes with the model.
      _count: { select: { bikes: { where: { partner: false } }, bookings: true } },
    },
  });
  if (!model) return fail("This model no longer exists.");
  if (model._count.bikes + model._count.bookings > 0) {
    return fail(
      `${model.name} has bikes or bookings, so it can't be deleted. Untick "On sale" to stop offering it, and retire its bikes.`,
    );
  }
  await db.$transaction([
    db.bikeOccupancy.deleteMany({ where: { bike: { modelId, partner: true } } }),
    db.bike.deleteMany({ where: { modelId, partner: true } }),
    db.routeFee.deleteMany({ where: { bikeModelId: modelId } }),
    db.addOnModelPrice.deleteMany({ where: { bikeModelId: modelId } }),
    db.bikeModel.delete({ where: { id: modelId } }),
  ]);
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

import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { reserveBike } from "@/server/bookings";
import {
  addBike,
  addStaff,
  saveAddOn,
  saveAddOnModelPrices,
  setBikeRetired,
  updateBike,
  updateModelPricing,
  updateSiteSettings,
  updateStaff,
} from "@/server/settings";
import { createTestClient, resetDatabase } from "@/test/db";
import { NOW, onlineBooking, seededFleet } from "@/test/fixtures";

const db = createTestClient();
let fleet: Awaited<ReturnType<typeof seededFleet>>;

beforeEach(async () => {
  await resetDatabase(db);
  fleet = await seededFleet(db);
});
afterAll(() => db.$disconnect());

describe("business settings", () => {
  it("saves valid values from a form", async () => {
    const result = await updateSiteSettings(db, {
      depositVnd: "1200000",
      cleaningGapDays: "1",
      holdHours: "12",
      usdToVndRate: "25500",
    });
    expect(result).toEqual({ ok: true });
    expect(await db.siteSettings.findUniqueOrThrow({ where: { id: 1 } })).toMatchObject({
      depositVnd: 1_200_000,
      cleaningGapDays: 1,
      holdHours: 12,
      usdToVndRate: 25_500,
    });
  });

  it("refuses values that would break bookings", async () => {
    const base = {
      depositVnd: "1500000",
      cleaningGapDays: "0",
      holdHours: "24",
      usdToVndRate: "26000",
    };
    for (const bad of [
      { holdHours: "0" },
      { cleaningGapDays: "-1" },
      { depositVnd: "abc" },
      { depositVnd: "1500.5" },
    ]) {
      expect((await updateSiteSettings(db, { ...base, ...bad })).ok).toBe(false);
    }
  });
});

describe("model prices and one-way fees", () => {
  it("updates rates and fees, and removes a fee left empty", async () => {
    const routes = await db.route.findMany({ where: { fromCity: "SAIGON" } });
    const hanoi = routes.find((r) => r.toCity === "HANOI")!;
    const daNang = routes.find((r) => r.toCity === "DA_NANG")!;

    const result = await updateModelPricing(db, {
      modelId: fleet.xr150.id,
      dailyRate: "420000",
      weeklyRate: "360000",
      monthlyRate: "310000",
      active: "on",
      fees: { [hanoi.id]: "1700000", [daNang.id]: "" },
    });
    expect(result).toEqual({ ok: true });

    expect(await db.bikeModel.findUniqueOrThrow({ where: { id: fleet.xr150.id } })).toMatchObject({
      dailyRate: 420_000,
      active: true,
    });
    const fees = await db.routeFee.findMany({ where: { bikeModelId: fleet.xr150.id } });
    expect(fees).toEqual([expect.objectContaining({ routeId: hanoi.id, fee: 1_700_000 })]);
  });

  it("hides a model when it's switched off", async () => {
    await updateModelPricing(db, {
      modelId: fleet.versys.id,
      dailyRate: "1200000",
      weeklyRate: "1100000",
      monthlyRate: "900000",
    });
    expect((await db.bikeModel.findUniqueOrThrow({ where: { id: fleet.versys.id } })).active).toBe(
      false,
    );
  });

  it("refuses a zero rate", async () => {
    const result = await updateModelPricing(db, {
      modelId: fleet.xr150.id,
      dailyRate: "0",
      weeklyRate: "350000",
      monthlyRate: "300000",
      active: "on",
    });
    expect(result.ok).toBe(false);
  });
});

describe("add-ons", () => {
  it("adds and edits an add-on", async () => {
    expect(
      await saveAddOn(db, { name: "Rain poncho", pricing: "FLAT", price: "60000", active: "on" }),
    ).toEqual({ ok: true });
    const poncho = await db.addOn.findFirstOrThrow({ where: { name: "Rain poncho" } });
    await saveAddOn(db, { id: poncho.id, name: "Rain poncho", pricing: "FLAT", price: "70000" });
    expect(await db.addOn.findUniqueOrThrow({ where: { id: poncho.id } })).toMatchObject({
      price: 70_000,
      active: false,
    });
  });

  it("saves the note for customers and the maximum per booking", async () => {
    const gloves = await db.addOn.findUniqueOrThrow({ where: { slug: "gloves" } });
    expect(
      await saveAddOn(db, {
        id: gloves.id,
        name: "Gloves",
        pricing: "FLAT",
        price: "500000",
        description: "  Returned with the bike.  ",
        maxQuantity: "3",
        active: "on",
      }),
    ).toEqual({ ok: true });
    expect(await db.addOn.findUniqueOrThrow({ where: { id: gloves.id } })).toMatchObject({
      description: "Returned with the bike.",
      maxQuantity: 3,
    });
  });

  it("sets, changes and clears a price for one bike", async () => {
    const insurance = await db.addOn.findUniqueOrThrow({ where: { slug: "insurance" } });
    const priceFor = async (bikeModelId: string) =>
      (
        await db.addOnModelPrice.findUnique({
          where: { addOnId_bikeModelId: { addOnId: insurance.id, bikeModelId } },
        })
      )?.price;

    expect(
      await saveAddOnModelPrices(db, insurance.id, {
        [fleet.versys.id]: "300000",
        [fleet.cb150x.id]: "",
      }),
    ).toEqual({ ok: true });
    expect(await priceFor(fleet.versys.id)).toBe(300_000);
    expect(await priceFor(fleet.cb150x.id)).toBeUndefined();
    expect(await priceFor(fleet.xr150.id)).toBe(130_000); // not in the form: unchanged
  });

  it("refuses a price that isn't a whole number", async () => {
    const insurance = await db.addOn.findUniqueOrThrow({ where: { slug: "insurance" } });
    const result = await saveAddOnModelPrices(db, insurance.id, { [fleet.versys.id]: "12.5" });
    expect(result.ok).toBe(false);
  });
});

describe("bikes", () => {
  it("renames a placeholder plate, in capitals", async () => {
    const bike = await db.bike.findFirstOrThrow({ where: { modelId: fleet.versys.id } });
    expect(
      await updateBike(db, { bikeId: bike.id, plate: "59-x1 123.45", purchaseVnd: "95000000" }),
    ).toEqual({ ok: true });
    expect(await db.bike.findUniqueOrThrow({ where: { id: bike.id } })).toMatchObject({
      plate: "59-X1 123.45",
      purchaseVnd: 95_000_000,
    });
  });

  it("refuses a plate another bike already has", async () => {
    const [a, b] = await db.bike.findMany({ where: { modelId: fleet.cb150x.id } });
    expect(await updateBike(db, { bikeId: b.id, plate: a.plate })).toEqual({
      ok: false,
      error: `Another bike already has plate ${a.plate}.`,
    });
    expect((await addBike(db, { modelId: fleet.cb150x.id, plate: a.plate })).ok).toBe(false);
  });

  it("adds a new bike that can be booked straight away", async () => {
    expect(await addBike(db, { modelId: fleet.versys.id, plate: "59-X2 999.99" })).toEqual({
      ok: true,
    });
    expect(await db.bike.count({ where: { modelId: fleet.versys.id, status: "ACTIVE" } })).toBe(2);
  });

  it("won't retire a bike with an upcoming booking, but will once it's cancelled", async () => {
    const booked = await reserveBike(db, onlineBooking(fleet.versys.id));
    if (!booked.ok) throw new Error("booking failed");

    const refused = await setBikeRetired(db, booked.booking.bikeId!, true, NOW);
    expect(refused.ok).toBe(false);
    if (!refused.ok) expect(refused.error).toContain(booked.booking.reference);

    await db.booking.update({ where: { id: booked.booking.id }, data: { status: "CANCELLED" } });
    expect(await setBikeRetired(db, booked.booking.bikeId!, true, NOW)).toEqual({ ok: true });
  });
});

describe("staff", () => {
  let ownerId: string;

  beforeEach(async () => {
    ownerId = (
      await db.staffUser.create({
        data: { email: "owner@example.com", name: "Owner", role: "OWNER" },
      })
    ).id;
  });

  it("adds staff with a normalised email and refuses duplicates", async () => {
    expect(await addStaff(db, { email: " Linh@Example.com", name: "Linh", role: "STAFF" })).toEqual(
      { ok: true },
    );
    expect(
      (await addStaff(db, { email: "linh@example.com", name: "Linh", role: "STAFF" })).ok,
    ).toBe(false);
  });

  it("stops you removing your own owner access", async () => {
    expect(
      (await updateStaff(db, { staffId: ownerId, role: "STAFF", active: "on" }, ownerId)).ok,
    ).toBe(false);
    expect((await updateStaff(db, { staffId: ownerId, role: "OWNER" }, ownerId)).ok).toBe(false);
  });

  it("always keeps at least one active owner", async () => {
    const other = await db.staffUser.create({
      data: { email: "o2@example.com", name: "Second owner", role: "OWNER" },
    });
    expect(
      await updateStaff(db, { staffId: other.id, role: "STAFF", active: "on" }, ownerId),
    ).toEqual({ ok: true });
    // Now `ownerId` is the only owner; another owner can't exist to demote them, so
    // simulate the last owner being deactivated by someone else.
    expect(await updateStaff(db, { staffId: ownerId, role: "OWNER" }, other.id)).toEqual({
      ok: false,
      error: "There must always be at least one active owner.",
    });
    expect((await db.staffUser.findUniqueOrThrow({ where: { id: ownerId } })).active).toBe(true);
  });

  it("signs a deactivated staff member out everywhere", async () => {
    const linh = await db.staffUser.create({
      data: { email: "linh@example.com", name: "Linh", role: "STAFF" },
    });
    await db.staffSession.create({
      data: { tokenHash: "x", staffId: linh.id, expiresAt: new Date(Date.now() + 3_600_000) },
    });
    expect(await updateStaff(db, { staffId: linh.id, role: "STAFF" }, ownerId)).toEqual({
      ok: true,
    });
    expect(await db.staffSession.count({ where: { staffId: linh.id } })).toBe(0);
  });
});

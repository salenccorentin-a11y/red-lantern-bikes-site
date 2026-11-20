import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { reserveBike } from "@/server/bookings";
import { listModels } from "@/server/fleet";
import {
  addBike,
  addBikes,
  addStaff,
  createModel,
  deleteBike,
  deleteModel,
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

describe("3-week and 45-day prices", () => {
  const xr150Prices = {
    dailyRate: "400000",
    weeklyRate: "350000",
    monthlyRate: "300000",
    active: "on",
  };

  it("saves them, and clears them when left empty", async () => {
    await updateModelPricing(db, {
      modelId: fleet.xr150.id,
      ...xr150Prices,
      threeWeekRate: "320000",
      fortyFiveDayRate: "280000",
    });
    expect(await db.bikeModel.findUniqueOrThrow({ where: { id: fleet.xr150.id } })).toMatchObject({
      threeWeekRate: 320_000,
      fortyFiveDayRate: 280_000,
    });

    await updateModelPricing(db, {
      modelId: fleet.xr150.id,
      ...xr150Prices,
      threeWeekRate: "",
      fortyFiveDayRate: " ",
    });
    expect(await db.bikeModel.findUniqueOrThrow({ where: { id: fleet.xr150.id } })).toMatchObject({
      threeWeekRate: null,
      fortyFiveDayRate: null,
    });
  });

  it("charges a 45-day booking at the 45-day price", async () => {
    await updateModelPricing(db, {
      modelId: fleet.xr150.id,
      ...xr150Prices,
      fortyFiveDayRate: "280000",
    });
    // 10 November to 24 December: 45 days.
    const booked = await reserveBike(db, onlineBooking(fleet.xr150.id, { endDate: "2026-12-24" }));
    if (!booked.ok) throw new Error(JSON.stringify(booked));
    expect(booked.booking).toMatchObject({
      days: 45,
      rateTier: "FORTY_FIVE_DAYS",
      rentalVnd: 45 * 280_000,
    });
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

  it("adds several bikes at once, one plate per line", async () => {
    const result = await addBikes(db, {
      modelId: fleet.versys.id,
      plates: "59-x2 111.11\n\n59-X2 222.22 , 59-X2 333.33",
      acquiredOn: "2026-11-01",
      purchaseVnd: "120000000",
    });
    expect(result).toEqual({ ok: true });
    const added = await db.bike.findMany({
      where: { modelId: fleet.versys.id, plate: { startsWith: "59-X2" } },
      orderBy: { plate: "asc" },
    });
    expect(added.map((b) => b.plate)).toEqual(["59-X2 111.11", "59-X2 222.22", "59-X2 333.33"]);
    expect(added.every((b) => b.purchaseVnd === 120_000_000)).toBe(true);
  });

  it("adds none when one plate is taken or listed twice", async () => {
    const taken = (await db.bike.findFirstOrThrow({ where: { modelId: fleet.cb150x.id } })).plate;
    const before = await db.bike.count();
    expect(
      (await addBikes(db, { modelId: fleet.versys.id, plates: `59-X3 444.44\n${taken}` })).ok,
    ).toBe(false);
    expect(
      (await addBikes(db, { modelId: fleet.versys.id, plates: "59-X3 444.44\n59-x3 444.44" })).ok,
    ).toBe(false);
    expect(await addBikes(db, { modelId: fleet.versys.id, plates: "  " })).toEqual({
      ok: false,
      error: "Enter at least one plate.",
    });
    expect(await db.bike.count()).toBe(before);
  });

  it("deletes a bike added by mistake, but not one with history", async () => {
    await addBikes(db, { modelId: fleet.versys.id, plates: "59-X4 555.55" });
    const mistake = await db.bike.findUniqueOrThrow({ where: { plate: "59-X4 555.55" } });
    expect(await deleteBike(db, mistake.id)).toEqual({ ok: true });
    expect(await db.bike.findUnique({ where: { id: mistake.id } })).toBeNull();

    const booked = await reserveBike(db, onlineBooking(fleet.versys.id));
    if (!booked.ok) throw new Error("booking failed");
    const refused = await deleteBike(db, booked.booking.bikeId!);
    expect(refused.ok).toBe(false);
    if (!refused.ok) expect(refused.error).toContain("Retire it instead");
  });
});

describe("bike models", () => {
  const newModel = {
    name: "Honda Wave RSX 110",
    kind: "Semi-automatic",
    dailyRate: "250000",
    weeklyRate: "210000",
    threeWeekRate: "",
    monthlyRate: "190000",
    fortyFiveDayRate: "170000",
    hanoiFee: "1300000",
    daNangFee: "",
    licence: "IDP_OR_A1",
    summary: "A newer Wave with a bit more room for luggage.",
    description:
      "The same easy Honda Wave, in its newer RSX version. Good in town and on long rides.",
    active: "on",
  };

  it("adds a model with its prices, fees and text, listed for customers", async () => {
    const result = await createModel(db, newModel);
    expect(result).toEqual({ ok: true, slug: "honda-wave-rsx-110" });

    const model = await db.bikeModel.findUniqueOrThrow({
      where: { slug: "honda-wave-rsx-110" },
      include: { routeFees: { include: { route: true } } },
    });
    expect(model).toMatchObject({
      dailyRate: 250_000,
      threeWeekRate: null,
      fortyFiveDayRate: 170_000,
      licence: "IDP_OR_A1",
      active: true,
    });
    expect(model.routeFees.map((f) => [f.route.toCity, f.fee])).toEqual([["HANOI", 1_300_000]]);

    // It comes with its partner bike, which isn't counted as one of ours.
    const bikes = await db.bike.findMany({ where: { modelId: model.id } });
    expect(bikes.map((b) => [b.plate, b.partner])).toEqual([["PARTNER-HONDA-WAVE-RSX-110", true]]);

    const listed = (await listModels(db)).find((m) => m.slug === "honda-wave-rsx-110");
    expect(listed).toMatchObject({ units: 0, summary: newModel.summary });
    // No studio photo yet: the lantern stands in.
    expect(listed?.image).toBe("/brand/lantern.webp");
  });

  it("refuses a second model with the same name", async () => {
    await createModel(db, newModel);
    const again = await createModel(db, { ...newModel, name: "Honda Wave RSX-110" });
    expect(again.ok).toBe(false);
  });

  it("refuses a model without its required text", async () => {
    expect((await createModel(db, { ...newModel, summary: "" })).ok).toBe(false);
  });

  it("deletes a model with no bikes and no bookings, and refuses one with bikes", async () => {
    await createModel(db, newModel);
    const added = await db.bikeModel.findUniqueOrThrow({ where: { slug: "honda-wave-rsx-110" } });
    expect(await deleteModel(db, added.id)).toEqual({ ok: true });
    expect(await db.bikeModel.findUnique({ where: { id: added.id } })).toBeNull();
    // Its partner bike went with it.
    expect(await db.bike.count({ where: { modelId: added.id } })).toBe(0);

    const refused = await deleteModel(db, fleet.xr150.id);
    expect(refused.ok).toBe(false);
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

"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
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
import { requireOwner } from "@/server/staff-session";

type Result = { ok: true } | { ok: false; error: string };

function back(path: string, result: Result, done: string): never {
  const query: Record<string, string> = result.ok ? { done } : { error: result.error };
  redirect(`${path}?${new URLSearchParams(query)}`);
}

const fields = (form: FormData) => Object.fromEntries(form.entries());

export async function saveSiteSettingsAction(form: FormData) {
  await requireOwner();
  back("/staff/settings", await updateSiteSettings(db, fields(form)), "Settings saved.");
}

export async function saveModelAction(form: FormData) {
  await requireOwner();
  const fees: Record<string, string> = {};
  for (const [key, value] of form.entries()) {
    if (key.startsWith("fee:")) fees[key.slice(4)] = String(value);
  }
  const result = await updateModelPricing(db, { ...fields(form), fees });
  back("/staff/settings", result, `${form.get("modelName")} saved.`);
}

export async function saveAddOnAction(form: FormData) {
  await requireOwner();
  back("/staff/settings/add-ons", await saveAddOn(db, fields(form)), "Add-on saved.");
}

export async function saveAddOnPricesAction(form: FormData) {
  await requireOwner();
  const prices: Record<string, string> = {};
  for (const [key, value] of form.entries()) {
    if (key.startsWith("price:")) prices[key.slice(6)] = String(value);
  }
  const result = await saveAddOnModelPrices(db, String(form.get("addOnId")), prices);
  back("/staff/settings/add-ons", result, `${form.get("addOnName")} prices saved.`);
}

export async function saveBikeAction(form: FormData) {
  await requireOwner();
  back("/staff/settings/bikes", await updateBike(db, fields(form)), "Bike saved.");
}

export async function addBikeAction(form: FormData) {
  await requireOwner();
  back("/staff/settings/bikes", await addBike(db, fields(form)), "Bike added.");
}

export async function retireBikeAction(form: FormData) {
  await requireOwner();
  const retire = form.get("retire") === "yes";
  const result = await setBikeRetired(db, String(form.get("bikeId")), retire);
  back("/staff/settings/bikes", result, retire ? "Bike retired." : "Bike back in the fleet.");
}

export async function addStaffAction(form: FormData) {
  await requireOwner();
  back(
    "/staff/settings/staff",
    await addStaff(db, fields(form)),
    "Added. They can sign in with their email now.",
  );
}

export async function updateStaffAction(form: FormData) {
  const owner = await requireOwner();
  back("/staff/settings/staff", await updateStaff(db, fields(form), owner.id), "Saved.");
}

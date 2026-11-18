"use server";

import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import {
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
import { requireOwner } from "@/server/staff-session";

type Result = { ok: true } | { ok: false; error: string };

/** Bike pages for models added here are cached; this refreshes them. */
const refreshFleet = () => updateTag("fleet");

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
  refreshFleet();
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

export async function addBikesAction(form: FormData) {
  await requireOwner();
  const plates = String(form.get("plates") ?? "")
    .split(/[\n,]/)
    .filter((p) => p.trim()).length;
  back(
    "/staff/settings/bikes",
    await addBikes(db, fields(form)),
    plates === 1 ? "Bike added." : `${plates} bikes added.`,
  );
}

export async function deleteBikeAction(form: FormData) {
  await requireOwner();
  const result = await deleteBike(db, String(form.get("bikeId")));
  back("/staff/settings/bikes", result, `${form.get("plate")} deleted.`);
}

export async function createModelAction(form: FormData) {
  await requireOwner();
  const result = await createModel(db, fields(form));
  if (result.ok) refreshFleet();
  back(
    "/staff/settings/models",
    result.ok ? { ok: true } : result,
    result.ok
      ? `${form.get("name")} added. Its page is /bikes/${result.slug}. Now add its bikes under Bikes and plates.`
      : "",
  );
}

export async function deleteModelAction(form: FormData) {
  await requireOwner();
  const result = await deleteModel(db, String(form.get("modelId")));
  if (result.ok) refreshFleet();
  back("/staff/settings/models", result, `${form.get("modelName")} deleted.`);
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

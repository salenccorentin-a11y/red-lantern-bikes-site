"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { saveCustomer } from "@/server/customers";
import { requireStaff } from "@/server/staff-session";

export async function saveCustomerAction(form: FormData) {
  await requireStaff();
  const id = String(form.get("id"));
  const field = (name: string) => String(form.get(name) ?? "");
  const result = await saveCustomer(db, id, {
    name: field("name"),
    email: field("email"),
    phone: field("phone"),
    country: field("country"),
    notes: field("notes"),
  });
  const message: Record<string, string> = result.ok
    ? { done: "Customer saved." }
    : { error: result.error };
  redirect(`/staff/customers/${encodeURIComponent(id)}?${new URLSearchParams(message)}`);
}

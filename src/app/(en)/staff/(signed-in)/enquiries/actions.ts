"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { markEnquiryHandled } from "@/server/enquiries";
import { requireStaff } from "@/server/staff-session";

export async function toggleHandledAction(form: FormData) {
  const staff = await requireStaff();
  await markEnquiryHandled(db, String(form.get("id")), staff.id, form.get("handled") === "yes");
  redirect("/staff/enquiries");
}

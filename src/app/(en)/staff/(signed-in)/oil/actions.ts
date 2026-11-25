"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { markOilReminderSent, recordKm, recordOilChange } from "@/server/oil";
import { requireStaff } from "@/server/staff-session";

/** Back to where the form was, with a message. Only staff pages are allowed. */
function backTo(form: FormData, message: { done?: string; error?: string }): never {
  const from = String(form.get("from") ?? "");
  const path =
    from.startsWith("/staff") && !from.startsWith("//") ? from.split("?")[0] : "/staff/oil";
  redirect(`${path}?${new URLSearchParams(message as Record<string, string>)}`);
}

/** The customer reported their km: next reminder in 2 days. */
export async function recordKmAction(form: FormData) {
  await requireStaff();
  const result = await recordKm(db, String(form.get("id")), {
    km: String(form.get("km") ?? ""),
  });
  backTo(
    form,
    result.ok ? { done: "Km saved. Next reminder in 2 days." } : { error: result.error },
  );
}

/** The oil change is done: next reminder 5 days after it. */
export async function recordOilChangeAction(form: FormData) {
  await requireStaff();
  const result = await recordOilChange(db, String(form.get("id")), {
    changedOn: String(form.get("changedOn") ?? ""),
  });
  backTo(
    form,
    result.ok
      ? { done: "Oil change saved. Next reminder 5 days after it." }
      : { error: result.error },
  );
}

/** Notes today's reminder, then opens WhatsApp with the message ready to send. */
export async function sendOilReminderAction(form: FormData) {
  await requireStaff();
  const link = await markOilReminderSent(db, String(form.get("id")));
  if (!link) {
    backTo(form, {
      error: "No WhatsApp number for this customer. Add it on their customer page first.",
    });
  }
  redirect(link);
}

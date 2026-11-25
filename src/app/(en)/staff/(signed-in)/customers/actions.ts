"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { archiveRental, markRentalReturned, unarchiveRental } from "@/server/rentals";
import { requireStaff } from "@/server/staff-session";

function ids(form: FormData) {
  return String(form.get("ids") ?? "")
    .split(",")
    .filter(Boolean)
    .slice(0, 20);
}

function back(form: FormData, message: Record<string, string>): never {
  const tab = form.get("tab") === "archive" ? "archive" : "active";
  redirect(`/staff/customers?${new URLSearchParams({ tab, ...message })}`);
}

export async function markReturnedAction(form: FormData) {
  await requireStaff();
  const result = await markRentalReturned(db, ids(form));
  back(
    form,
    result.ok
      ? { done: "Marked as returned. Archive the rental when everything is settled." }
      : { error: result.error },
  );
}

export async function archiveAction(form: FormData) {
  await requireStaff();
  const result = await archiveRental(db, ids(form));
  back(form, result.ok ? { done: "Rental moved to the archive." } : { error: result.error });
}

export async function unarchiveAction(form: FormData) {
  await requireStaff();
  await unarchiveRental(db, ids(form));
  back(form, { done: "Rental taken out of the archive." });
}

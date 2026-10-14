"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { checkIn, checkOut, saveStaffNote } from "@/server/booking-admin";
import { cancelBooking } from "@/server/bookings";
import { requireStaff } from "@/server/staff-session";

function back(id: string, message: { done?: string; error?: string }): never {
  const query = new URLSearchParams(message as Record<string, string>);
  redirect(`/staff/bookings/${encodeURIComponent(id)}?${query}`);
}

export async function checkOutAction(form: FormData) {
  await requireStaff();
  const id = String(form.get("id"));
  const result = await checkOut(db, id);
  back(id, result.ok ? { done: "Checked out. Have a good ride!" } : { error: result.error });
}

export async function checkInAction(form: FormData) {
  await requireStaff();
  const id = String(form.get("id"));
  const result = await checkIn(db, id);
  back(id, result.ok ? { done: "Checked in." } : { error: result.error });
}

export async function cancelAction(form: FormData) {
  await requireStaff();
  const id = String(form.get("id"));
  if (form.get("confirm") !== "yes")
    back(id, { error: "Tick the box to confirm the cancellation." });
  const result = await cancelBooking(db, id);
  back(
    id,
    result.ok
      ? { done: "Booking cancelled. The bike is free again." }
      : { error: "This booking can't be cancelled any more." },
  );
}

export async function saveNoteAction(form: FormData) {
  await requireStaff();
  const id = String(form.get("id"));
  await saveStaffNote(db, id, String(form.get("note") ?? "").slice(0, 2000));
  back(id, { done: "Note saved." });
}

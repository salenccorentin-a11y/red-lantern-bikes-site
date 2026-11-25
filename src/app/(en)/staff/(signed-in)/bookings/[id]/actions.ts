"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { checkIn, checkOut } from "@/server/booking-admin";
import {
  ANSWER_ERROR_TEXT,
  acceptRequest,
  declineRequest,
  sendAnswerEmail,
} from "@/server/booking-requests";
import { cancelBooking } from "@/server/bookings";
import { archiveRental, saveRentalRecord, unarchiveRental } from "@/server/rentals";
import { requireStaff } from "@/server/staff-session";

function back(id: string, message: { done?: string; error?: string }): never {
  const query = new URLSearchParams(message as Record<string, string>);
  redirect(`/staff/bookings/${encodeURIComponent(id)}?${query}`);
}

/** Accepts an online booking request (same as the link in the shop's email). */
export async function acceptRequestAction(form: FormData) {
  await requireStaff();
  const id = String(form.get("id"));
  const result = await acceptRequest(db, id);
  if (!result.ok) back(id, { error: ANSWER_ERROR_TEXT[result.error] });
  const emailed = await sendAnswerEmail(db, id, { accepted: true });
  back(id, {
    done: emailed
      ? "Accepted. The customer has been emailed. Now contact them to arrange the deposit."
      : "Accepted, but the email to the customer could not be sent. Please tell them yourself.",
  });
}

export async function declineRequestAction(form: FormData) {
  await requireStaff();
  const id = String(form.get("id"));
  const result = await declineRequest(db, id);
  if (!result.ok) back(id, { error: ANSWER_ERROR_TEXT[result.error] });
  const reason = String(form.get("reason") ?? "")
    .trim()
    .slice(0, 1000);
  const emailed = await sendAnswerEmail(db, id, { accepted: false, reason: reason || null });
  back(id, {
    done: emailed
      ? "Declined. The bike is free again and the customer has been emailed."
      : "Declined. The bike is free again, but the email to the customer could not be sent.",
  });
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

/** The rental record: the Notion-like columns and the notes. */
export async function saveRecordAction(form: FormData) {
  await requireStaff();
  const id = String(form.get("id"));
  const field = (name: string) => String(form.get(name) ?? "");
  await saveRentalRecord(db, id, {
    paid: field("paid"),
    transfer: field("transfer"),
    deposit: field("deposit"),
    insurance: field("insurance"),
    helmet: field("helmet"),
    notes: field("notes"),
    problems: field("problems"),
  });
  back(id, { done: "Rental record saved." });
}

/** Archives this booking (and the other bikes of the same rental, if any). */
export async function archiveBookingAction(form: FormData) {
  await requireStaff();
  const id = String(form.get("id"));
  const ids = String(form.get("ids") ?? id)
    .split(",")
    .filter(Boolean)
    .slice(0, 20);
  const result = await archiveRental(db, ids);
  back(id, result.ok ? { done: "Rental moved to the archive." } : { error: result.error });
}

export async function unarchiveBookingAction(form: FormData) {
  await requireStaff();
  const id = String(form.get("id"));
  const ids = String(form.get("ids") ?? id)
    .split(",")
    .filter(Boolean)
    .slice(0, 20);
  await unarchiveRental(db, ids);
  back(id, { done: "Rental taken out of the archive." });
}

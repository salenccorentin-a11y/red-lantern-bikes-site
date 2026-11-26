"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { addDays, formatDisplayDate, toIsoDate } from "@/lib/dates";
import { formatVnd } from "@/lib/money";
import { changeDates, checkIn, checkOut } from "@/server/booking-admin";
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

/**
 * New dates, or "+N days" on the return date. With "group" ticked, the other
 * bikes of the same rental change too (all or none).
 */
export async function changeDatesAction(form: FormData) {
  await requireStaff();
  const id = String(form.get("id"));
  const ids =
    form.get("group") === "yes"
      ? [
          id,
          ...String(form.get("ids") ?? "")
            .split(",")
            .filter(Boolean),
        ].slice(0, 20)
      : [id];
  let startDate = String(form.get("start") ?? "");
  let endDate = String(form.get("end") ?? "");
  const extend = Number(form.get("extend") ?? 0);
  if (Number.isInteger(extend) && extend > 0 && extend <= 60) {
    const booking = await db.booking.findUnique({ where: { id } });
    if (!booking) back(id, { error: "Booking not found." });
    startDate = toIsoDate(booking.startDate);
    endDate = toIsoDate(addDays(booking.endDate, extend));
  }
  const result = await changeDates(db, ids, { startDate, endDate });
  if (!result.ok) back(id, { error: result.error });

  const bikes = ids.length > 1 ? ` for the ${ids.length} bikes` : "";
  let done = `New dates${bikes}: ${formatDisplayDate(startDate)} to ${formatDisplayDate(endDate)} (${result.days} days).`;
  if (result.totalAfter !== result.totalBefore) {
    const more = result.balanceAfter - result.balanceBefore;
    done += ` Total ${formatVnd(result.totalAfter)} (was ${formatVnd(result.totalBefore)}): ${
      more >= 0 ? `${formatVnd(more)} more to collect` : `${formatVnd(-more)} less to collect`
    }.`;
  }
  back(id, { done });
}

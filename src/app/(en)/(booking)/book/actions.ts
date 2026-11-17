"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { bookingInput } from "@/lib/booking-input";
import { bookingErrorMessage } from "@/lib/booking-messages";
import { sendRequestEmails } from "@/server/booking-requests";
import { reserveBike } from "@/server/bookings";
import { reportError } from "@/server/report-error";
import { getMessages } from "@/i18n";
import { isLocale } from "@/i18n/config";
import { localize } from "@/i18n/paths";

export type BookingFormState = {
  /** Shown above the Reserve button. */
  error?: string;
  /** Problems with individual fields, keyed by field name. */
  fieldErrors?: Record<string, string>;
};

/**
 * Creates a booking request from the booking page. Everything is checked
 * again here; prices are recalculated from the database, never taken from
 * the browser. The bike is held while the shop decides: the shop gets an
 * email with Accept and Decline links (src/server/booking-requests.ts), and
 * the customer is sent to their booking page.
 */
export async function createOnlineBooking(input: unknown): Promise<BookingFormState> {
  const parsed = bookingInput.safeParse(input);
  if (!parsed.success) {
    const raw = (input ?? {}) as { lang?: unknown };
    const t = getMessages(isLocale(raw.lang) ? raw.lang : "en");
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const field = String(issue.path[0] ?? "form");
      fieldErrors[field] ??= issue.message;
    }
    // A filled-in hidden field means a bot; give it nothing useful.
    if (fieldErrors.website) return { error: t.bookingErrors.GENERIC };
    return { error: t.book.checkFields, fieldErrors };
  }
  const form = parsed.data;

  const result = await reserveBike(db, {
    source: "ONLINE",
    modelId: form.modelId,
    pickupCity: "SAIGON",
    dropoffCity: form.dropoffCity,
    startDate: form.startDate,
    endDate: form.endDate,
    addOns: form.addOns,
    customer: { name: form.name, email: form.email, phone: form.phone, note: form.note },
  });
  if (!result.ok) return { error: bookingErrorMessage(result.error, form.lang) };

  const { booking } = result;

  // The request stands even if an email fails: it's in the staff area, and
  // the customer's booking page has everything.
  try {
    await sendRequestEmails(db, booking.id);
  } catch (error) {
    await reportError(`Booking request ${booking.reference}: emails failed`, error);
  }

  redirect(localize(form.lang, `/booking/${booking.viewToken}`));
}

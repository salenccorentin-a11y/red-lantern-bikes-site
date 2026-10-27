"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { bookingInput } from "@/lib/booking-input";
import { bookingErrorMessage } from "@/lib/booking-messages";
import { dropoffLabel } from "@/lib/cities";
import { formatSaigonDateTime, toIsoDate } from "@/lib/dates";
import { reserveBike } from "@/server/bookings";
import { sendEmail } from "@/server/email";
import { bookingReceivedEmail } from "@/server/emails/booking-received";

export type BookingFormState = {
  /** Shown above the Reserve button. */
  error?: string;
  /** Problems with individual fields, keyed by field name. */
  fieldErrors?: Record<string, string>;
};

/**
 * Creates an online booking from the booking page. Everything is checked
 * again here; prices are recalculated from the database, never taken from
 * the browser. On success, the customer is sent to their booking page.
 */
export async function createOnlineBooking(input: unknown): Promise<BookingFormState> {
  const parsed = bookingInput.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const field = String(issue.path[0] ?? "form");
      fieldErrors[field] ??= issue.message;
    }
    // A filled-in hidden field means a bot; give it nothing useful.
    if (fieldErrors.website) return { error: "Something went wrong. Please try again." };
    return { error: "Please check the highlighted fields.", fieldErrors };
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
  if (!result.ok) return { error: bookingErrorMessage(result.error) };

  const { booking } = result;
  const model = await db.bikeModel.findUniqueOrThrow({ where: { id: booking.bikeModelId } });
  const siteUrl = process.env.SITE_URL ?? "http://localhost:3000";

  // The booking stands even if the email fails; the booking page has everything.
  try {
    await sendEmail(
      bookingReceivedEmail({
        to: form.email,
        customerName: form.name,
        reference: booking.reference,
        bikeName: model.name,
        startDate: toIsoDate(booking.startDate),
        endDate: toIsoDate(booking.endDate),
        days: booking.days,
        dropoffLabel: dropoffLabel(booking.dropoffCity),
        totalVnd: booking.totalVnd,
        depositVnd: booking.depositVnd,
        balanceVnd: booking.balanceVnd,
        holdExpires: booking.holdExpiresAt ? formatSaigonDateTime(booking.holdExpiresAt) : "",
        bookingUrl: `${siteUrl}/booking/${booking.viewToken}`,
      }),
    );
  } catch (error) {
    console.error(`Booking ${booking.reference}: confirmation email failed`, error);
  }

  redirect(`/booking/${booking.viewToken}`);
}

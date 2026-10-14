"use server";

import { findTour } from "@/content/tours";
import { db } from "@/lib/db";
import { sendEmail } from "@/server/email";
import { enquiryReceivedEmail } from "@/server/emails/enquiry-received";
import { createEnquiry } from "@/server/enquiries";

export type EnquiryState = { sent?: boolean; error?: string; field?: string };

const KIND_LABEL: Record<string, string> = {
  TOUR: "Tour",
  REVERSE_ROUTE: "Trip from Hanoi or Da Nang",
  GENERAL: "General question",
};

/** The enquiry form on tour pages and the contact page. */
export async function sendEnquiry(_previous: EnquiryState, form: FormData): Promise<EnquiryState> {
  const raw = Object.fromEntries(form.entries());
  const result = await createEnquiry(db, raw);
  if (!result.ok) return { error: result.error, field: result.field };

  const to = process.env.ENQUIRIES_EMAIL;
  if (to && result.enquiryId) {
    const enquiry = await db.enquiry.findUniqueOrThrow({ where: { id: result.enquiryId } });
    const siteUrl = process.env.SITE_URL ?? "http://localhost:3000";
    try {
      await sendEmail(
        enquiryReceivedEmail(to, {
          kindLabel: KIND_LABEL[enquiry.kind],
          topicLabel: enquiry.topic ? (findTour(enquiry.topic)?.name ?? enquiry.topic) : undefined,
          name: enquiry.name,
          email: enquiry.email,
          phone: enquiry.phone,
          message: enquiry.message,
          preferredStart: enquiry.preferredStart?.toISOString().slice(0, 10),
          riders: enquiry.riders,
          staffUrl: `${siteUrl}/staff/enquiries`,
        }),
      );
    } catch (error) {
      // The enquiry is saved and visible in the staff area either way.
      console.error("Enquiry notification email failed", error);
    }
  }
  return { sent: true };
}

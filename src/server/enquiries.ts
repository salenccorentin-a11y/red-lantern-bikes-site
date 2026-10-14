// Enquiries from the tour pages and the contact page.

import { z } from "zod";
import type { PrismaClient } from "@/generated/prisma/client";
import { parseIsoDate } from "@/lib/dates";
import { normaliseEmail } from "@/server/auth";

const HOUR_MS = 3_600_000;
/** Most enquiries one email address can send per hour. */
const MAX_PER_HOUR = 5;

const optionalText = (max: number) =>
  z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
    z.string().trim().max(max).optional(),
  );

export const enquiryInput = z.object({
  kind: z.enum(["TOUR", "REVERSE_ROUTE", "GENERAL"]),
  topic: optionalText(80),
  name: z.string().trim().min(2, "Please enter your name.").max(100),
  email: z.preprocess(
    (v) => (typeof v === "string" ? normaliseEmail(v) : v),
    z.email("Please enter a valid email address.").max(200),
  ),
  phone: optionalText(40),
  message: z
    .string()
    .trim()
    .min(10, "Please tell us a little more (10 characters or more).")
    .max(3000),
  preferredStart: optionalText(10).refine(
    (s) => !s || parseIsoDate(s) !== null,
    "Please choose a valid date.",
  ),
  riders: z.preprocess(
    (v) => (v === "" || v === null ? undefined : v),
    z.coerce.number().int().min(1).max(30).optional(),
  ),
  // Filled in only by spam bots.
  website: z.string().max(0).optional(),
});

export type EnquiryResult = { ok: true } | { ok: false; error: string; field?: string };

export async function createEnquiry(
  db: PrismaClient,
  raw: unknown,
  now: Date = new Date(),
): Promise<EnquiryResult & { enquiryId?: string }> {
  const parsed = enquiryInput.safeParse(raw);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const field = String(issue.path[0] ?? "");
    // A bot filled in the hidden field: pretend all is well and save nothing.
    if (field === "website") return { ok: true };
    return { ok: false, error: issue.message, field };
  }
  const { kind, topic, name, email, phone, message, riders, preferredStart } = parsed.data;

  const recent = await db.enquiry.count({
    where: { email, createdAt: { gte: new Date(now.getTime() - HOUR_MS) } },
  });
  if (recent >= MAX_PER_HOUR) {
    return {
      ok: false,
      error: "We've received several messages from you already. We'll be in touch soon.",
    };
  }

  const enquiry = await db.enquiry.create({
    data: {
      kind,
      topic,
      name,
      email,
      phone,
      message,
      riders,
      preferredStart: preferredStart ? parseIsoDate(preferredStart) : null,
      createdAt: now,
    },
  });
  return { ok: true, enquiryId: enquiry.id };
}

export async function markEnquiryHandled(
  db: PrismaClient,
  id: string,
  staffId: string,
  handled: boolean,
) {
  await db.enquiry.update({
    where: { id },
    data: handled
      ? { handledAt: new Date(), handledById: staffId }
      : { handledAt: null, handledById: null },
  });
}

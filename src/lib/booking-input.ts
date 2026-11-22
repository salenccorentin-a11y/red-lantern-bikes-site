// The booking form's data, checked on the server before anything is saved.
// The browser's prices are never sent: the server recalculates everything.

import { z } from "zod";

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Please choose a date.");

export const bookingInput = z.object({
  dropoffCity: z.enum(["SAIGON", "HANOI", "DA_NANG"]),
  startDate: isoDate,
  endDate: isoDate,
  modelId: z.string().min(1, "Please choose a bike.").max(64),
  addOns: z
    .array(
      z.object({ addOnId: z.string().min(1).max(64), quantity: z.number().int().min(1).max(5) }),
    )
    .max(20),
  name: z.string().trim().min(2, "Please enter your name.").max(100),
  email: z.email("Please enter a valid email address.").max(200),
  // Required: the shop arranges the booking deposit by phone or WhatsApp.
  phone: z
    .string()
    .trim()
    .max(40)
    .refine(
      (v) => (v.match(/\d/g)?.length ?? 0) >= 6,
      "Please enter your phone or WhatsApp number.",
    ),
  note: z.string().trim().max(1000).optional(),
  acceptDeposit: z.literal(true, {
    error: "Please confirm you understand the booking deposit is non-refundable.",
  }),
  // The page's language, for messages and where to go next.
  lang: z.enum(["en", "fr", "ko", "vi"]).default("en"),
  // Left empty by people; filled in by spam bots that complete every field.
  website: z.string().max(0).optional(),
});

export type BookingInput = z.infer<typeof bookingInput>;

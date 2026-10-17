"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { bookingErrorMessage } from "@/lib/booking-messages";
import { reserveBike } from "@/server/bookings";
import { requireStaff } from "@/server/staff-session";

const walkIn = z.object({
  modelId: z.string().min(1, "Choose a bike model."),
  bikeId: z.string().optional(),
  dropoffCity: z.enum(["SAIGON", "HANOI", "DA_NANG"]),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a pick-up date."),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a drop-off date."),
  // From the "addOn:<id>" selects: how many of each extra.
  addOns: z
    .array(z.object({ addOnId: z.string().min(1), quantity: z.number().int().min(1).max(5) }))
    .max(20),
  name: z.string().trim().min(2, "Enter the customer's name.").max(100),
  phone: z.string().trim().max(40).optional(),
  email: z.union([z.email("Check the email address."), z.literal("")]).optional(),
  note: z.string().trim().max(1000).optional(),
});

export type WalkInState = { error?: string };

export async function createWalkIn(_previous: WalkInState, form: FormData): Promise<WalkInState> {
  const staff = await requireStaff();
  const parsed = walkIn.safeParse({
    modelId: form.get("modelId"),
    bikeId: form.get("bikeId") || undefined,
    dropoffCity: form.get("dropoffCity"),
    startDate: form.get("startDate"),
    endDate: form.get("endDate"),
    addOns: [...form.entries()].flatMap(([key, value]) =>
      key.startsWith("addOn:") && Number(value) > 0
        ? [{ addOnId: key.slice("addOn:".length), quantity: Number(value) }]
        : [],
    ),
    name: form.get("name"),
    phone: form.get("phone") || undefined,
    email: form.get("email") || undefined,
    note: form.get("note") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const input = parsed.data;

  const result = await reserveBike(db, {
    source: "WALK_IN",
    modelId: input.modelId,
    bikeId: input.bikeId,
    pickupCity: "SAIGON",
    dropoffCity: input.dropoffCity,
    startDate: input.startDate,
    endDate: input.endDate,
    addOns: input.addOns,
    customer: {
      name: input.name,
      phone: input.phone,
      email: input.email || undefined,
      note: input.note,
    },
    createdById: staff.id,
  });

  if (!result.ok) {
    if (result.error.code === "NO_BIKE_AVAILABLE") {
      return {
        error: input.bikeId
          ? "That bike is booked or blocked on some of those days. Pick another bike or leave it on 'any free bike'."
          : "No bike of this model is free on those days.",
      };
    }
    return { error: bookingErrorMessage(result.error) };
  }
  redirect(
    `/staff/bookings/${result.booking.id}?done=${encodeURIComponent("Walk-in booking created.")}`,
  );
}

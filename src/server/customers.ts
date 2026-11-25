// Customer records: one person across all their rentals.
//
// Bookings keep the name, email and phone given at booking time. Each booking
// is linked to a customer, matched by email first, then by phone. A booking
// with neither (e.g. old imports with a name only) gets a customer of its own:
// names alone are too often shared to match on. Linking runs on staff pages
// and in the hourly job, so it covers every way a booking is made.

import type { Prisma, PrismaClient } from "@/generated/prisma/client";
import { whatsappDigits } from "@/lib/oil";
import { isUniqueViolation } from "@/server/db-errors";

/** Tidied email used for matching, or null. */
export function emailKey(email: string | null | undefined): string | null {
  const key = email?.trim().toLowerCase();
  return key ? key : null;
}

/** Tidied phone used for matching: digits only, no leading 00. Null if too short. */
export const phoneKey = whatsappDigits;

/** Statuses that count as a real rental (not a request that never happened). */
export const RENTED_STATUSES = ["CONFIRMED", "CHECKED_OUT", "COMPLETED"] as const;

/**
 * Rentals, counting bookings with the same dates once: two bikes for a couple
 * (or one imported row with several bikes) is one rental.
 */
export function countRentals(bookings: { startDate: Date; endDate: Date }[]): number {
  return new Set(bookings.map((b) => `${b.startDate.getTime()}-${b.endDate.getTime()}`)).size;
}

type Contact = {
  name: string;
  email: string | null;
  phone: string | null;
  source: string;
  startDate: Date;
};

async function findOrCreateCustomer(tx: Prisma.TransactionClient, c: Contact) {
  const byEmail = emailKey(c.email);
  const byPhone = phoneKey(c.phone);

  const match =
    (byEmail && (await tx.customer.findUnique({ where: { emailKey: byEmail } }))) ||
    (byPhone && (await tx.customer.findUnique({ where: { phoneKey: byPhone } }))) ||
    (await sameImportRow(tx, c)) ||
    null;

  if (match) {
    // Fill in what the customer record is missing, if no one else has it.
    const data: Prisma.CustomerUpdateInput = {};
    // (No one has this email, or the match would have been by email.)
    if (!match.emailKey && byEmail)
      Object.assign(data, { email: c.email!.trim(), emailKey: byEmail });
    if (!match.phoneKey && byPhone) {
      const taken = await tx.customer.findUnique({ where: { phoneKey: byPhone } });
      if (!taken) Object.assign(data, { phone: c.phone!.trim(), phoneKey: byPhone });
    }
    if (Object.keys(data).length > 0) await tx.customer.update({ where: { id: match.id }, data });
    return match.id;
  }

  const created = await tx.customer.create({
    data: {
      name: c.name.trim(),
      email: byEmail ? c.email!.trim() : null,
      emailKey: byEmail,
      phone: byPhone ? c.phone!.trim() : null,
      phoneKey: byPhone,
    },
  });
  return created.id;
}

/**
 * An imported rental with several bikes became one booking per bike, all with
 * the same name and start date and no contact details: one customer.
 */
async function sameImportRow(tx: Prisma.TransactionClient, c: Contact) {
  if (c.source !== "IMPORT" || c.email || c.phone) return null;
  const sibling = await tx.booking.findFirst({
    where: {
      source: "IMPORT",
      customerName: c.name,
      startDate: c.startDate,
      customerEmail: null,
      customerPhone: null,
      customerId: { not: null },
    },
    select: { customer: true },
  });
  return sibling?.customer ?? null;
}

/**
 * Links every booking that has no customer yet. Returns how many were linked.
 * Oldest first, so a customer's record starts from their first booking.
 */
export async function linkBookingsToCustomers(db: PrismaClient, limit = 500) {
  const unlinked = await db.booking.findMany({
    where: { customerId: null },
    select: {
      id: true,
      source: true,
      startDate: true,
      customerName: true,
      customerEmail: true,
      customerPhone: true,
    },
    orderBy: { createdAt: "asc" },
    take: limit,
  });

  let linked = 0;
  for (const b of unlinked) {
    const contact = {
      name: b.customerName,
      email: b.customerEmail,
      phone: b.customerPhone,
      source: b.source,
      startDate: b.startDate,
    };
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        await db.$transaction(async (tx) => {
          const customerId = await findOrCreateCustomer(tx, contact);
          // Only if still unlinked: another page load may have done it already.
          const { count } = await tx.booking.updateMany({
            where: { id: b.id, customerId: null },
            data: { customerId },
          });
          linked += count;
        });
        break;
      } catch (error) {
        // Someone created the same customer a moment ago: match again.
        if (isUniqueViolation(error) && attempt < 2) continue;
        throw error;
      }
    }
  }
  return linked;
}

export type CustomerInput = {
  name: string;
  email: string;
  phone: string;
  country: string;
  notes: string;
};

type SaveResult = { ok: true } | { ok: false; error: string };

/** Staff edit a customer's details. */
export async function saveCustomer(
  db: PrismaClient,
  id: string,
  input: CustomerInput,
): Promise<SaveResult> {
  const name = input.name.trim();
  if (!name) return { ok: false, error: "The name can't be empty." };
  const email = input.email.trim();
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: "That email doesn't look right." };
  }
  const phone = input.phone.trim();
  if (phone && !phoneKey(phone)) {
    return { ok: false, error: "Write the phone with its country code, e.g. +44 7700 900123." };
  }

  try {
    await db.customer.update({
      where: { id },
      data: {
        name: name.slice(0, 200),
        email: email || null,
        emailKey: emailKey(email),
        phone: phone || null,
        phoneKey: phoneKey(phone),
        country: input.country.trim().slice(0, 80) || null,
        notes: input.notes.trim().slice(0, 4000) || null,
      },
    });
    return { ok: true };
  } catch (error) {
    if (isUniqueViolation(error)) {
      return { ok: false, error: "Another customer already has this email or phone number." };
    }
    throw error;
  }
}

/** Customers for the list page: newest rental first, optionally searched. */
export async function listCustomers(db: PrismaClient, search = "") {
  const q = search.trim();
  const digits = q.replace(/\D/g, "");
  const where: Prisma.CustomerWhereInput = q
    ? {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { email: { contains: q, mode: "insensitive" } },
          { country: { contains: q, mode: "insensitive" } },
          ...(digits.length >= 3 ? [{ phoneKey: { contains: digits } }] : []),
        ],
      }
    : {};

  const customers = await db.customer.findMany({
    where,
    include: {
      bookings: {
        where: { status: { in: [...RENTED_STATUSES] } },
        select: {
          startDate: true,
          endDate: true,
          status: true,
          bikeModel: { select: { name: true } },
        },
        orderBy: { startDate: "desc" },
      },
    },
    take: 300,
  });

  const today = Date.now();
  const rows = customers.map((c) => {
    // The most recent rental that has started, else the next one coming.
    const started = c.bookings.filter((b) => b.startDate.getTime() <= today);
    const upcoming = c.bookings.filter((b) => b.startDate.getTime() > today).reverse();
    return {
      id: c.id,
      name: c.name,
      email: c.email,
      phone: c.phone,
      country: c.country,
      rentals: countRentals(c.bookings),
      onTheRoad: c.bookings.some((b) => b.status === "CHECKED_OUT"),
      lastRental: started[0] ?? upcoming[0] ?? null,
      hasStarted: started.length > 0,
    };
  });
  // Like the rental list (owner, 2026-11-26): customers whose rental has
  // started first, then those with only upcoming rentals, both by start date
  // soonest first; then those with no rental.
  const rank = (r: (typeof rows)[number]) => (r.hasStarted ? 0 : r.lastRental ? 1 : 2);
  return rows.sort((a, b) => {
    if (rank(a) !== rank(b)) return rank(a) - rank(b);
    const ta = a.lastRental?.startDate.getTime() ?? 0;
    const tb = b.lastRental?.startDate.getTime() ?? 0;
    return ta - tb;
  });
}

/** One customer with every booking, newest first. */
export async function loadCustomer(db: PrismaClient, id: string) {
  return db.customer.findUnique({
    where: { id },
    include: {
      bookings: {
        include: { bikeModel: { select: { name: true } }, bike: { select: { plate: true } } },
        orderBy: { startDate: "desc" },
      },
    },
  });
}

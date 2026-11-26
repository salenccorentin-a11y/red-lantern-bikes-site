// Reading the owner's Notion "Rentals" database rows (step 11 of the plan).
// Pure, no database: turns Notion's free-text columns into what a booking
// needs. The import itself is src/server/notion-import.ts.

import type { City } from "@/generated/prisma/client";

/** One row of the Notion Rentals database, as fetched through the Notion connection. */
export type NotionRental = {
  /** The row's Notion link: marks the bookings made from it, so a second run skips them. */
  url: string;
  /** The "Rentals" title: the customer's first name. */
  name: string;
  status: "Upcoming" | "On the road" | "Returned";
  /** Free text, e.g. "XR150", "2 Wave", "2NVX", "NVX125/155". */
  bike: string;
  /** "YYYY-MM-DD", both days included. */
  start: string;
  end: string;
  /** Notion's Destination option, e.g. "HCMC", "Ha Noi", "Nha Trang". */
  destination: string | null;
  // Money and extras as typed in Notion ("230$", "1.8ml VND"…): kept as notes,
  // never turned into prices.
  paid?: string | null;
  deposit?: string | null;
  insurance?: string | null;
  helmet?: string | null;
  transfer?: string | null;
  /** Notion's "Notes" and "Problems on the way". */
  notes?: string | null;
  problems?: string | null;
  /** Oil columns: "YYYY-MM-DD" dates and a km figure. */
  oilChangedOn?: string | null;
  kmSinceChange?: number | null;
  lastReminder?: string | null;
};

// Words in Notion's "Bike" column → the site's model slugs. Order matters:
// the first match wins ("cb150x" before "cb125").
const MODELS: [RegExp, string][] = [
  [/wave/, "wave-alpha-110"],
  [/\bgd\s*(110)?\b/, "suzuki-gd110"],
  [/\ben\s*(125)?\b/, "suzuki-en125"],
  [/cb\s*150\s*x/, "honda-cb150x"],
  [/cb\s*125/, "honda-cb125"],
  [/nvx/, "yamaha-nvx125"],
  [/winner/, "honda-winner-x-150"],
  [/gsx|bandit/, "suzuki-gsx-r150"],
  [/xr\s*150/, "honda-xr150"],
  [/crf/, "honda-crf150"],
  [/wr\s*155/, "yamaha-wr155r"],
  [/versys/, "kawasaki-versys-x300"],
];

export type BikeCount = { slug: string; count: number };

/**
 * "2 Wave" → [{wave-alpha-110, 2}]. Several bikes are separated by commas, a
 * spaced slash ("CB150X / Versys") or a spaced dash ("2 x EN - 1 x GD");
 * "NVX125/155" (no spaces) is one bike.
 * Null when any part names no model of the fleet (Vision, Mio, XR125…):
 * those rows are left for the owner to enter by hand.
 */
export function parseBikes(text: string): BikeCount[] | null {
  const parts = text
    .toLowerCase()
    .split(/,|\s\/\s|\s-\s/)
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length === 0) return null;
  const out: BikeCount[] = [];
  for (const part of parts) {
    // "2x CB150X" counts 2; the x must be followed by a space, so "2 XR150"
    // keeps its XR (it once read as 2 × "R150").
    const counted = /^(\d+)\s*(?:x\s+)?(.*)$/.exec(part);
    const count = counted ? Number(counted[1]) : 1;
    const rest = counted ? counted[2] : part;
    // XR125 is not in the fleet: don't let "xr" alone match the XR150, and
    // don't let "GSXS XR125" (two bikes in one part) pass as one GSX.
    if (/xr\s*125/.test(rest)) return null;
    const slug = MODELS.find(([re]) => re.test(rest))?.[1];
    if (!slug || count < 1) return null;
    const same = out.find((b) => b.slug === slug);
    if (same) same.count += count;
    else out.push({ slug, count });
  }
  return out;
}

/**
 * Where the bike is left. The site knows Saigon, Hanoi and Da Nang; any other
 * place (Nha Trang, Hue…) is booked as a Saigon return, with the real place
 * written in the staff note.
 */
export function dropoffFor(destination: string | null): { city: City; other?: string } {
  const d = (destination ?? "").trim().toLowerCase();
  if (d === "" || d === "hcmc") return { city: "SAIGON" };
  if (d === "ha noi") return { city: "HANOI" };
  if (d === "da nang") return { city: "DA_NANG" };
  return { city: "SAIGON", other: destination!.trim() };
}

/** A Notion text cell, tidied: empty or "-" means nothing. */
export function cell(value: string | null | undefined): string | null {
  const v = value?.trim();
  return v && v !== "-" ? v : null;
}

/** The rental record columns, word for word from Notion. */
export function recordFields(row: NotionRental) {
  return {
    paidNote: cell(row.paid),
    transferNote: cell(row.transfer),
    depositNote: cell(row.deposit),
    insuranceNote: cell(row.insurance),
    helmetNote: cell(row.helmet),
    problemsNote: cell(row.problems),
  };
}

/**
 * The staff note of a booking from Notion: the real drop-off place when the
 * site can't book it (Nha Trang…), then Notion's own notes.
 */
export function notionNote(row: NotionRental, otherPlace?: string): string | null {
  const lines = [otherPlace ? `Drop-off: ${otherPlace}` : null, cell(row.notes)].filter(Boolean);
  return lines.length > 0 ? lines.join("\n") : null;
}

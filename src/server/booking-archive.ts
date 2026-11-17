// Archiving a finished rental. The privacy page promises that a customer's
// details stay on the site only until the rental is over, then move to the
// owner's private archive: the "Archive" table on the RENTALS page in Notion.
//
// Staff press "Archive to Notion" on a returned, cancelled or ran-out booking.
// A row is added to that table (same columns as the owner's own rows), then
// the customer's name, contact details and notes are removed from the
// database. Bike, dates and money stay, for the calendar and the profit page.

import type { PrismaClient } from "@/generated/prisma/client";
import { formatVnd } from "@/lib/money";
import { toIsoDate } from "@/lib/dates";

/** Booking statuses that can be archived: the rental is over or never happened. */
export const ARCHIVABLE_STATUSES = ["COMPLETED", "CANCELLED", "EXPIRED"] as const;

/** Adds one row (one text per column) to the archive table. */
export type AppendArchiveRow = (cells: string[]) => Promise<void>;

export type ArchiveResult = { ok: true } | { ok: false; error: string };

const DESTINATION = { SAIGON: "HCMC", HANOI: "Ha Noi", DA_NANG: "Da Nang" } as const;

const STATUS_NOTE: Record<string, string> = {
  CANCELLED: "Cancelled",
  EXPIRED: "Request ran out unanswered",
};

type ArchiveBooking = {
  reference: string;
  status: string;
  customerName: string;
  customerNote: string | null;
  staffNote: string | null;
  bikeModel: { name: string };
  bike: { plate: string } | null;
  dropoffCity: keyof typeof DESTINATION;
  startDate: Date;
  endDate: Date;
  days: number;
  totalVnd: number;
  oneWayFeeVnd: number;
  addOns: { name: string; quantity: number; totalVnd: number }[];
  incidents: { description: string; partsVnd: number; labourVnd: number; otherVnd: number }[];
};

/** "08/02 - 04/03", the way the owner writes dates in Notion. */
function dayMonth(date: Date): string {
  const [, month, day] = toIsoDate(date).split("-");
  return `${day}/${month}`;
}

/**
 * The archive row, in the RENTALS table's column order: Rentals, Bike, Last oil
 * change, Date, Days, Destination, Paid rental, Transfer, Deposit, Insurance,
 * Notes, Problems on the way. The security deposit isn't recorded on the site,
 * so Deposit (and Last oil change) are left for the owner to fill in.
 */
export function archiveRow(b: ArchiveBooking): string[] {
  const isInsurance = (name: string) => /insurance/i.test(name);
  const insurance = b.addOns.filter((a) => isInsurance(a.name));
  const extras = b.addOns
    .filter((a) => !isInsurance(a.name))
    .map((a) => `${a.name}${a.quantity > 1 ? ` × ${a.quantity}` : ""}`);
  const notes = [
    b.reference,
    STATUS_NOTE[b.status],
    ...extras,
    b.customerNote && `Customer: ${b.customerNote}`,
    b.staffNote,
  ].filter(Boolean);
  const problems = b.incidents.map((i) => {
    const cost = i.partsVnd + i.labourVnd + i.otherVnd;
    return cost > 0 ? `${i.description} ${formatVnd(cost)}` : i.description;
  });

  return [
    b.customerName,
    b.bike ? `${b.bikeModel.name} ${b.bike.plate}` : b.bikeModel.name,
    "",
    `${dayMonth(b.startDate)} - ${dayMonth(b.endDate)}`,
    String(b.days),
    DESTINATION[b.dropoffCity],
    formatVnd(b.totalVnd - b.oneWayFeeVnd),
    b.oneWayFeeVnd > 0 ? formatVnd(b.oneWayFeeVnd) : "-",
    "",
    insurance.length > 0 ? `Yes ${formatVnd(insurance.reduce((s, a) => s + a.totalVnd, 0))}` : "No",
    notes.join(" / "),
    problems.join(" / "),
  ];
}

/** Sends the booking to the Notion archive, then removes the customer's details. */
export async function archiveBooking(
  db: PrismaClient,
  bookingId: string,
  append: AppendArchiveRow,
  now: Date = new Date(),
): Promise<ArchiveResult> {
  const booking = await db.booking.findUnique({
    where: { id: bookingId },
    include: { bikeModel: true, bike: true, addOns: true, incidents: true },
  });
  if (!booking) return { ok: false, error: "Booking not found." };
  if (booking.archivedAt) return { ok: false, error: "This booking is already archived." };
  if (!(ARCHIVABLE_STATUSES as readonly string[]).includes(booking.status)) {
    return {
      ok: false,
      error:
        "Only returned, cancelled or ran-out bookings can be archived. Check the bike in first.",
    };
  }

  try {
    await append(archiveRow(booking));
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    return { ok: false, error: `Notion didn't accept the row, so nothing was removed. ${reason}` };
  }

  await db.booking.updateMany({
    where: { id: bookingId, archivedAt: null },
    data: {
      archivedAt: now,
      customerName: "Archived",
      customerEmail: null,
      customerPhone: null,
      customerNote: null,
      staffNote: null,
    },
  });
  return { ok: true };
}

// ─── Notion ──────────────────────────────────────────────────────────────

const NOTION_API = "https://api.notion.com/v1";
const NOTION_VERSION = "2022-06-28";

type NotionBlock = {
  id: string;
  type: string;
  table?: { table_width: number };
  [key: string]: unknown;
};

/**
 * Appends rows to the table under the "Archive" heading of the RENTALS page,
 * through a Notion internal integration that has access to that page.
 * Returns null when NOTION_TOKEN or NOTION_RENTALS_PAGE_ID isn't set.
 */
export function notionArchiveFromEnv(): AppendArchiveRow | null {
  const token = process.env.NOTION_TOKEN;
  const pageId = process.env.NOTION_RENTALS_PAGE_ID;
  if (!token || !pageId) return null;

  async function notion(path: string, init?: RequestInit) {
    const response = await fetch(`${NOTION_API}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${token}`,
        "Notion-Version": NOTION_VERSION,
        "Content-Type": "application/json",
      },
    });
    if (!response.ok) throw new Error(`Notion ${response.status}: ${await response.text()}`);
    return response.json();
  }

  async function archiveTable(): Promise<NotionBlock> {
    const blocks: NotionBlock[] = [];
    let cursor: string | undefined;
    do {
      const query = new URLSearchParams({
        page_size: "100",
        ...(cursor && { start_cursor: cursor }),
      });
      const page = await notion(`/blocks/${pageId}/children?${query}`);
      blocks.push(...page.results);
      cursor = page.has_more ? page.next_cursor : undefined;
    } while (cursor);

    const heading = blocks.findIndex((b) => {
      if (!b.type.startsWith("heading_")) return false;
      const text = (b[b.type] as { rich_text: { plain_text: string }[] }).rich_text;
      return text.some((t) => /archive/i.test(t.plain_text));
    });
    const table = blocks.slice(heading + 1).find((b) => b.type === "table");
    if (heading === -1 || !table) {
      throw new Error('No table found under an "Archive" heading on the RENTALS page.');
    }
    return table;
  }

  return async (cells) => {
    const table = await archiveTable();
    const width = table.table?.table_width ?? cells.length;
    const row = Array.from({ length: width }, (_, i) => (cells[i] ?? "").slice(0, 2000));
    await notion(`/blocks/${table.id}/children`, {
      method: "PATCH",
      body: JSON.stringify({
        children: [
          {
            object: "block",
            type: "table_row",
            table_row: {
              cells: row.map((text) => (text ? [{ type: "text", text: { content: text } }] : [])),
            },
          },
        ],
      }),
    });
  };
}

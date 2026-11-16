// Sent the day before pick-up: when and where, what to bring, and what's left
// to pay. The security deposit and licence rules are in the rental terms.

import { formatVnd } from "@/lib/money";
import type { Email } from "@/server/email";
import { buttonHtml, escapeHtml, rowsHtml, wrapHtml } from "./html";

export type PickupReminderData = {
  to: string;
  customerName: string;
  reference: string;
  bikeName: string;
  /** e.g. "Fri 20 Nov 2026". */
  startDate: string;
  endDate: string;
  dropoffLabel: string;
  balanceVnd: number;
  address: string;
  hours: string;
  mapsUrl: string;
  /** wa.me link, if the shop's WhatsApp number is set. */
  whatsappUrl: string | null;
  bookingUrl: string;
};

export function pickupReminderEmail(d: PickupReminderData): Email {
  const rows: [string, string][] = [
    ["Booking reference", d.reference],
    ["Bike", d.bikeName],
    ["Pick-up", `${d.startDate}, at our shop`],
    ["Drop-off", `${d.endDate}, ${d.dropoffLabel}`],
    ["Balance to pay at pick-up", formatVnd(d.balanceVnd)],
  ];
  const bring = [
    "Your motorbike licence, or an International Driving Permit (1968 Vienna Convention) that covers motorbikes.",
    "A security deposit, returned when you bring the bike back: your passport, or cash (US$300 for a scooter, US$500 for a motorcycle).",
    d.balanceVnd > 0
      ? `The balance of ${formatVnd(d.balanceVnd)}, in cash or by bank transfer.`
      : "Nothing else to pay: your booking is fully paid.",
  ];
  const shop = `${d.address}. ${d.hours}.`;
  const delivery =
    "Staying in or near District 1? Reply to this email or message us and we'll bring the bike to your hotel for free.";

  const text = [
    `Hi ${d.customerName},`,
    "",
    `Your ${d.bikeName} is ready for tomorrow. Here's what to know.`,
    "",
    ...rows.map(([label, value]) => `${label}: ${value}`),
    "",
    "Please bring:",
    ...bring.map((item) => `- ${item}`),
    "",
    `Where: ${shop}`,
    `Map: ${d.mapsUrl}`,
    "",
    delivery,
    ...(d.whatsappUrl ? ["", `WhatsApp: ${d.whatsappUrl}`] : []),
    "",
    `Your booking: ${d.bookingUrl}`,
    "",
    "See you tomorrow!",
    "Red Lantern Bikes, District 1, Ho Chi Minh City",
  ].join("\n");

  const html = wrapHtml(`<p>Hi ${escapeHtml(d.customerName)},</p>
<p>Your <strong>${escapeHtml(d.bikeName)}</strong> is ready for tomorrow. Here's what to know.</p>
${rowsHtml(rows)}
<p><strong>Please bring:</strong></p>
<ul>${bring.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
<p><strong>Where:</strong> ${escapeHtml(shop)} <a href="${escapeHtml(d.mapsUrl)}">Open in Google Maps</a></p>
<p>${escapeHtml(delivery)}${d.whatsappUrl ? ` <a href="${escapeHtml(d.whatsappUrl)}">Message us on WhatsApp</a>` : ""}</p>
${buttonHtml(d.bookingUrl, "View your booking")}
<p>See you tomorrow!</p>`);

  return {
    to: d.to,
    subject: `Tomorrow: your ${d.bikeName} is ready (booking ${d.reference})`,
    text,
    html,
  };
}

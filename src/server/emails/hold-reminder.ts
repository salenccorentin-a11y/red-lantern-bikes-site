// Sent a few hours before an unpaid online booking's hold runs out, so a
// customer who forgot the deposit can still keep their bike.

import { formatVnd } from "@/lib/money";
import type { Email } from "@/server/email";
import { buttonHtml, escapeHtml, rowsHtml, wrapHtml } from "./html";

export type HoldReminderData = {
  to: string;
  customerName: string;
  reference: string;
  bikeName: string;
  /** e.g. "Fri 20 Nov 2026". */
  startDate: string;
  endDate: string;
  depositVnd: number;
  /** Already formatted in Saigon time, e.g. "16 Oct 2026, 10:00". */
  holdExpires: string;
  bookingUrl: string;
};

export function holdReminderEmail(d: HoldReminderData): Email {
  const rows: [string, string][] = [
    ["Booking reference", d.reference],
    ["Bike", d.bikeName],
    ["Dates", `${d.startDate} to ${d.endDate}`],
    ["Deposit to pay", formatVnd(d.depositVnd)],
  ];
  const intro = `Your ${d.bikeName} is still held for you, but only until ${d.holdExpires} (Saigon time). We haven't received your deposit yet.`;
  const after =
    "If you've already paid, thank you: you don't need to do anything, and we'll confirm as soon as it arrives. If your plans changed, just ignore this email and the bike will be released.";

  const text = [
    `Hi ${d.customerName},`,
    "",
    intro,
    "",
    ...rows.map(([label, value]) => `${label}: ${value}`),
    "",
    `Pay your deposit here, using reference ${d.reference}:`,
    d.bookingUrl,
    "",
    after,
    "",
    "Red Lantern Bikes, District 1, Ho Chi Minh City",
  ].join("\n");

  const html = wrapHtml(`<p>Hi ${escapeHtml(d.customerName)},</p>
<p>${escapeHtml(intro)}</p>
${rowsHtml(rows)}
${buttonHtml(d.bookingUrl, "Pay your deposit")}
<p>Use reference <strong>${escapeHtml(d.reference)}</strong> with your payment.</p>
<p>${escapeHtml(after)}</p>`);

  return {
    to: d.to,
    subject: `Booking ${d.reference}: your bike is held until ${d.holdExpires}`,
    text,
    html,
  };
}

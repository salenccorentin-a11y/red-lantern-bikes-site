// Email sent as soon as an online booking is made: what was booked, what to
// pay now, and a link back to the booking page with payment instructions.

import { formatVnd } from "@/lib/money";
import type { Email } from "@/server/email";

export type BookingEmailData = {
  to: string;
  customerName: string;
  reference: string;
  bikeName: string;
  startDate: string;
  endDate: string;
  days: number;
  dropoffLabel: string;
  totalVnd: number;
  depositVnd: number;
  balanceVnd: number;
  /** Already formatted in Saigon time, e.g. "16 Oct 2026, 10:00". */
  holdExpires: string;
  bookingUrl: string;
};

const escape = (s: string) =>
  s.replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!,
  );

export function bookingReceivedEmail(d: BookingEmailData): Email {
  const rows: [string, string][] = [
    ["Booking reference", d.reference],
    ["Bike", d.bikeName],
    ["Dates", `${d.startDate} to ${d.endDate} (${d.days} day${d.days === 1 ? "" : "s"})`],
    ["Drop-off", d.dropoffLabel],
    ["Total", formatVnd(d.totalVnd)],
    ["Deposit to pay now (non-refundable)", formatVnd(d.depositVnd)],
    ["Balance at pick-up", formatVnd(d.balanceVnd)],
  ];

  const text = [
    `Hi ${d.customerName},`,
    "",
    `Thanks for booking with Red Lantern Bikes. Your bike is held until ${d.holdExpires} (Saigon time) while we wait for your deposit.`,
    "",
    ...rows.map(([label, value]) => `${label}: ${value}`),
    "",
    `Pay your deposit here, using reference ${d.reference}:`,
    d.bookingUrl,
    "",
    "If the deposit doesn't arrive by then, the booking is released.",
    "",
    "Red Lantern Bikes, District 1, Ho Chi Minh City",
  ].join("\n");

  const html = `<div style="font-family:system-ui,sans-serif;color:#1b1512;max-width:560px">
<p>Hi ${escape(d.customerName)},</p>
<p>Thanks for booking with Red Lantern Bikes. Your bike is held until <strong>${escape(d.holdExpires)}</strong> (Saigon time) while we wait for your deposit.</p>
<table style="border-collapse:collapse;width:100%">
${rows.map(([label, value]) => `<tr><td style="padding:6px 0;color:#6e625a">${escape(label)}</td><td style="padding:6px 0;text-align:right"><strong>${escape(value)}</strong></td></tr>`).join("\n")}
</table>
<p><a href="${escape(d.bookingUrl)}" style="display:inline-block;background:#b3261e;color:#fff;padding:12px 18px;border-radius:4px;text-decoration:none">Pay your deposit</a></p>
<p>Use reference <strong>${escape(d.reference)}</strong> with your payment. If the deposit doesn't arrive by then, the booking is released.</p>
<p style="color:#6e625a">Red Lantern Bikes, District 1, Ho Chi Minh City</p>
</div>`;

  return { to: d.to, subject: `Booking ${d.reference}: please pay your deposit`, text, html };
}

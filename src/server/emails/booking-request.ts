// Emails for booking requests. Online bookings are requests until the shop
// answers: there is no online payment yet, so the shop accepts or declines
// each one from its own email and arranges payment with the customer directly.
//
// - bookingReceivedEmail: to the customer, as soon as they send the request.
// - bookingRequestEmail: to the shop, with everything about the request and
//   Accept / Decline buttons. Also used as the reminder when no answer came.
// - bookingAcceptedEmail, bookingDeclinedEmail, requestExpiredEmail: the
//   answer, to the customer.

import { formatVnd } from "@/lib/money";
import type { Email } from "@/server/email";
import { buttonHtml, escapeHtml, rowsHtml, wrapHtml } from "./html";

export type RequestEmailData = {
  reference: string;
  bikeName: string;
  /** The physical bike the system picked. Shown to the shop only. */
  plate: string | null;
  /** e.g. "Fri 20 Nov 2026". */
  startDate: string;
  endDate: string;
  days: number;
  dropoffLabel: string;
  rentalVnd: number;
  oneWayFeeVnd: number;
  addOns: { name: string; quantity: number; totalVnd: number }[];
  totalVnd: number;
  depositVnd: number;
  balanceVnd: number;
  customerName: string;
  customerEmail: string | null;
  customerPhone: string | null;
  customerNote: string | null;
  /** When the hold runs out, in Saigon time, e.g. "16 Oct 2026, 10:00". Null once answered. */
  answerBy: string | null;
  /** The customer's own booking page. */
  bookingUrl: string;
  /** The shop's accept-or-decline page for this request. */
  decisionUrl: string;
  /** The booking in the staff area (needs sign-in). */
  staffUrl: string;
  /** The booking page, for a new request. */
  bookUrl: string;
  /** wa.me link to the shop, if its WhatsApp number is set. */
  whatsappUrl: string | null;
};

const days = (n: number) => `${n} day${n === 1 ? "" : "s"}`;

function tripRows(d: RequestEmailData): [string, string][] {
  return [
    ["Booking reference", d.reference],
    ["Bike", d.bikeName],
    ["Dates", `${d.startDate} to ${d.endDate} (${days(d.days)})`],
    ["Drop-off", d.dropoffLabel],
  ];
}

function priceRows(d: RequestEmailData): [string, string][] {
  return [
    [`Rental, ${days(d.days)}`, formatVnd(d.rentalVnd)],
    ...(d.oneWayFeeVnd > 0
      ? ([["One-way fee", formatVnd(d.oneWayFeeVnd)]] as [string, string][])
      : []),
    ...d.addOns.map((a): [string, string] => [
      a.quantity > 1 ? `${a.name} × ${a.quantity}` : a.name,
      formatVnd(a.totalVnd),
    ]),
    ["Total", formatVnd(d.totalVnd)],
    ["Booking deposit (non-refundable)", formatVnd(d.depositVnd)],
    ["Balance at pick-up", formatVnd(d.balanceVnd)],
  ];
}

const lines = (rows: [string, string][]) => rows.map(([label, value]) => `${label}: ${value}`);
const SIGN_OFF = "Red Lantern Bikes, District 1, Ho Chi Minh City";

/** To the customer: we have your request, nothing to pay yet. */
export function bookingReceivedEmail(to: string, d: RequestEmailData): Email {
  const intro = `Thanks for your booking request. We're checking it now and will answer by email${
    d.answerBy ? `, by ${d.answerBy} (Saigon time) at the latest` : " soon"
  }. Your ${d.bikeName} is held for you in the meantime.`;
  const payment =
    "There's nothing to pay yet. Once we confirm your booking, we'll contact you to arrange the booking deposit. The balance is paid at pick-up.";
  const rows = [...tripRows(d), ...priceRows(d).slice(-3)];

  const text = [
    `Hi ${d.customerName},`,
    "",
    intro,
    "",
    ...lines(rows),
    "",
    payment,
    "",
    `Your request: ${d.bookingUrl}`,
    "",
    SIGN_OFF,
  ].join("\n");

  const html = wrapHtml(`<p>Hi ${escapeHtml(d.customerName)},</p>
<p>${escapeHtml(intro)}</p>
${rowsHtml(rows)}
<p>${escapeHtml(payment)}</p>
${buttonHtml(d.bookingUrl, "View your request")}`);

  return { to, subject: `Booking request ${d.reference}: we've received it`, text, html };
}

/** To the shop: a new request (or a reminder about one) with Accept / Decline. */
export function bookingRequestEmail(
  to: string,
  d: RequestEmailData,
  options: { reminder?: boolean } = {},
): Email {
  const customerRows: [string, string][] = [
    ["Name", d.customerName],
    ...(d.customerEmail ? ([["Email", d.customerEmail]] as [string, string][]) : []),
    ...(d.customerPhone ? ([["Phone / WhatsApp", d.customerPhone]] as [string, string][]) : []),
  ];
  const trip: [string, string][] = [
    ["Booking reference", d.reference],
    ["Bike", d.plate ? `${d.bikeName} (${d.plate})` : d.bikeName],
    ...tripRows(d).slice(2),
  ];
  const heading = options.reminder
    ? `Booking request ${d.reference} still needs your answer`
    : `New booking request from ${d.customerName}`;
  const deadline = d.answerBy
    ? `The bike is held until ${d.answerBy} (Saigon time). With no answer by then, the request lapses, the bike is freed and the customer is told.`
    : "";
  const after =
    "When you accept, the customer gets an email saying the booking is confirmed and that you'll contact them about payment. Reply to this email to write to them directly.";
  const accept = `${d.decisionUrl}?answer=accept`;
  const decline = `${d.decisionUrl}?answer=decline`;

  const text = [
    heading,
    "",
    ...lines(customerRows),
    ...(d.customerNote ? ["", `Their note: ${d.customerNote}`] : []),
    "",
    ...lines(trip),
    "",
    ...lines(priceRows(d)),
    "",
    `Accept: ${accept}`,
    `Decline: ${decline}`,
    "",
    ...(deadline ? [deadline, ""] : []),
    after,
    "",
    `In the staff area: ${d.staffUrl}`,
  ].join("\n");

  const button = (href: string, label: string, colour: string) =>
    `<a href="${escapeHtml(href)}" style="display:inline-block;background:${colour};color:#fff;padding:12px 22px;border-radius:999px;text-decoration:none;font-weight:700;margin:0 8px 8px 0">${label}</a>`;

  const html = `<div style="font-family:system-ui,sans-serif;color:#0f1b2d;max-width:560px;line-height:1.5">
<p><strong>${escapeHtml(heading)}</strong></p>
${rowsHtml(customerRows)}
${d.customerNote ? `<p style="white-space:pre-wrap;border-left:3px solid #d9dee8;padding-left:12px">${escapeHtml(d.customerNote)}</p>` : ""}
<p style="margin-bottom:0"><strong>Trip</strong></p>
${rowsHtml(trip)}
<p style="margin-bottom:0"><strong>Price</strong></p>
${rowsHtml(priceRows(d))}
<p style="margin-top:20px">${button(accept, "Accept", "#1a7f4b")}${button(decline, "Decline", "#4a5872")}</p>
${deadline ? `<p>${escapeHtml(deadline)}</p>` : ""}
<p style="color:#4a5872">${escapeHtml(after)} <a href="${escapeHtml(d.staffUrl)}">Open it in the staff area</a>.</p>
</div>`;

  return {
    to,
    subject: options.reminder
      ? `Reminder: booking request ${d.reference} is waiting for your answer`
      : `Booking request ${d.reference}: ${d.bikeName}, ${d.startDate} to ${d.endDate}`,
    text,
    html,
    ...(d.customerEmail && { replyTo: d.customerEmail }),
  };
}

/** To the customer: the shop accepted. */
export function bookingAcceptedEmail(to: string, d: RequestEmailData): Email {
  const intro = `Good news: your booking is confirmed, and your ${d.bikeName} is reserved for you.`;
  const payment = `We'll contact you shortly${
    d.customerPhone ? " by email or WhatsApp" : " by email"
  } to arrange the booking deposit of ${formatVnd(d.depositVnd)} (non-refundable).${
    d.balanceVnd > 0 ? ` The balance of ${formatVnd(d.balanceVnd)} is paid at pick-up.` : ""
  }`;
  const rows = [...tripRows(d), ...priceRows(d).slice(-3)];

  const text = [
    `Hi ${d.customerName},`,
    "",
    intro,
    "",
    ...lines(rows),
    "",
    payment,
    "",
    `Your booking: ${d.bookingUrl}`,
    ...(d.whatsappUrl ? [`Questions? WhatsApp: ${d.whatsappUrl}`] : []),
    "",
    SIGN_OFF,
  ].join("\n");

  const html = wrapHtml(`<p>Hi ${escapeHtml(d.customerName)},</p>
<p>${escapeHtml(intro)}</p>
${rowsHtml(rows)}
<p>${escapeHtml(payment)}</p>
${buttonHtml(d.bookingUrl, "View your booking")}
${d.whatsappUrl ? `<p>Questions? <a href="${escapeHtml(d.whatsappUrl)}">Message us on WhatsApp</a>.</p>` : ""}`);

  return { to, subject: `Booking ${d.reference} is confirmed`, text, html };
}

/** To the customer: the shop declined, with its reason if it gave one. */
export function bookingDeclinedEmail(
  to: string,
  d: RequestEmailData,
  reason: string | null,
): Email {
  const intro = `We're sorry: we can't confirm your booking request for the ${d.bikeName} from ${d.startDate} to ${d.endDate}.`;
  const next =
    "You haven't paid anything, and you don't owe anything. You're welcome to try other dates or another bike.";

  const text = [
    `Hi ${d.customerName},`,
    "",
    intro,
    ...(reason ? ["", reason] : []),
    "",
    next,
    "",
    `Send a new request: ${d.bookUrl}`,
    ...(d.whatsappUrl ? [`Or message us on WhatsApp: ${d.whatsappUrl}`] : []),
    "",
    SIGN_OFF,
  ].join("\n");

  const html = wrapHtml(`<p>Hi ${escapeHtml(d.customerName)},</p>
<p>${escapeHtml(intro)}</p>
${reason ? `<p style="white-space:pre-wrap;border-left:3px solid #d9dee8;padding-left:12px">${escapeHtml(reason)}</p>` : ""}
<p>${escapeHtml(next)}</p>
${buttonHtml(d.bookUrl, "Send a new request")}
${d.whatsappUrl ? `<p>Or <a href="${escapeHtml(d.whatsappUrl)}">message us on WhatsApp</a>.</p>` : ""}`);

  return {
    to,
    subject: `Booking request ${d.reference}: sorry, we can't take this one`,
    text,
    html,
  };
}

/** To the customer: nobody answered in time and the hold has ended. */
export function requestExpiredEmail(to: string, d: RequestEmailData): Email {
  const intro = `We're sorry: we didn't manage to answer your booking request for the ${d.bikeName} (${d.startDate} to ${d.endDate}) in time, so the hold on the bike has ended.`;
  const next =
    "You haven't paid anything. If you'd still like the bike, message us and we'll sort it out straight away, or send a new request.";

  const text = [
    `Hi ${d.customerName},`,
    "",
    intro,
    "",
    next,
    "",
    ...(d.whatsappUrl ? [`WhatsApp: ${d.whatsappUrl}`] : []),
    `Send a new request: ${d.bookUrl}`,
    "",
    SIGN_OFF,
  ].join("\n");

  const html = wrapHtml(`<p>Hi ${escapeHtml(d.customerName)},</p>
<p>${escapeHtml(intro)}</p>
<p>${escapeHtml(next)}</p>
${d.whatsappUrl ? buttonHtml(d.whatsappUrl, "Message us on WhatsApp") : ""}
<p><a href="${escapeHtml(d.bookUrl)}">Send a new request</a></p>`);

  return {
    to,
    subject: `Booking request ${d.reference}: we couldn't confirm it in time`,
    text,
    html,
  };
}

// Tells the business about a new enquiry. Replying to the email goes
// straight to the customer.

import type { Email } from "@/server/email";

const escape = (s: string) =>
  s.replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!,
  );

export function enquiryReceivedEmail(
  to: string,
  e: {
    kindLabel: string;
    topicLabel?: string;
    name: string;
    email: string;
    phone?: string | null;
    message: string;
    preferredStart?: string | null;
    riders?: number | null;
    staffUrl: string;
  },
): Email {
  const rows: [string, string][] = [
    ["About", e.topicLabel ? `${e.kindLabel}: ${e.topicLabel}` : e.kindLabel],
    ["Name", e.name],
    ["Email", e.email],
    ...(e.phone ? ([["Phone / WhatsApp", e.phone]] as [string, string][]) : []),
    ...(e.preferredStart ? ([["Preferred start", e.preferredStart]] as [string, string][]) : []),
    ...(e.riders ? ([["Riders", String(e.riders)]] as [string, string][]) : []),
  ];

  const text = [
    `New enquiry from ${e.name}`,
    "",
    ...rows.map(([label, value]) => `${label}: ${value}`),
    "",
    e.message,
    "",
    `Reply to this email to answer ${e.name}. Mark it handled in the staff area: ${e.staffUrl}`,
  ].join("\n");

  const html = `<div style="font-family:system-ui,sans-serif;color:#1b1512;max-width:560px">
<p><strong>New enquiry from ${escape(e.name)}</strong></p>
<table style="border-collapse:collapse">
${rows.map(([label, value]) => `<tr><td style="padding:4px 16px 4px 0;color:#6e625a">${escape(label)}</td><td>${escape(value)}</td></tr>`).join("\n")}
</table>
<p style="white-space:pre-wrap;border-left:3px solid #ddd3c4;padding-left:12px">${escape(e.message)}</p>
<p style="color:#6e625a">Reply to this email to answer ${escape(e.name)}. <a href="${escape(e.staffUrl)}">Mark it handled in the staff area</a>.</p>
</div>`;

  return {
    to,
    subject: `Enquiry: ${e.topicLabel ?? e.kindLabel} – ${e.name}`,
    text,
    html,
    replyTo: e.email,
  };
}

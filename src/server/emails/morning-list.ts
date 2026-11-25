// The shop's 08:00 email: oil reminders to send, bikes going out and coming
// back today, and booking requests still waiting for an answer. Names and
// bikes only; phone numbers stay in the staff area.

import type { Email } from "@/server/email";
import { escapeHtml, wrapHtml } from "./html";

export type MorningItem = { label: string; url: string };

export type MorningListData = {
  to: string;
  /** e.g. "Thu 26 Nov 2026". */
  dateLabel: string;
  oil: MorningItem[];
  pickups: MorningItem[];
  returns: MorningItem[];
  requests: MorningItem[];
  oilPageUrl: string;
};

export function morningListEmail(d: MorningListData): Email {
  const sections: [string, MorningItem[]][] = [
    ["Oil reminders to send", d.oil],
    ["Going out today", d.pickups],
    ["Coming back today", d.returns],
    ["Booking requests waiting for your answer", d.requests],
  ];
  const shown = sections.filter(([, items]) => items.length > 0);

  const text = [
    `Today, ${d.dateLabel}`,
    "",
    ...shown.flatMap(([title, items]) => [
      `${title} (${items.length}):`,
      ...items.map((i) => `- ${i.label}: ${i.url}`),
      "",
    ]),
    ...(d.oil.length > 0 ? [`Send the oil reminders from ${d.oilPageUrl}`, ""] : []),
    "Red Lantern Bikes staff area",
  ].join("\n");

  const html = wrapHtml(`<p><strong>Today, ${escapeHtml(d.dateLabel)}</strong></p>
${shown
  .map(
    ([
      title,
      items,
    ]) => `<p style="margin-bottom:4px"><strong>${escapeHtml(title)} (${items.length})</strong></p>
<ul style="margin-top:0">${items.map((i) => `<li><a href="${escapeHtml(i.url)}">${escapeHtml(i.label)}</a></li>`).join("")}</ul>`,
  )
  .join("\n")}
${d.oil.length > 0 ? `<p><a href="${escapeHtml(d.oilPageUrl)}">Open the Oil page to send the reminders</a></p>` : ""}`);

  const counts = [
    d.oil.length > 0 && `${d.oil.length} oil`,
    d.pickups.length > 0 && `${d.pickups.length} out`,
    d.returns.length > 0 && `${d.returns.length} back`,
    d.requests.length > 0 && `${d.requests.length} waiting`,
  ].filter(Boolean);

  return { to: d.to, subject: `Today at the shop: ${counts.join(", ")}`, text, html };
}

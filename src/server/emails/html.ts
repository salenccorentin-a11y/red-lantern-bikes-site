// Small helpers shared by the reminder emails.

export const escapeHtml = (s: string) =>
  s.replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!,
  );

/** Label/value rows as a simple two-column table. */
export function rowsHtml(rows: [string, string][]): string {
  return `<table style="border-collapse:collapse;width:100%">
${rows.map(([label, value]) => `<tr><td style="padding:6px 0;color:#4a6073">${escapeHtml(label)}</td><td style="padding:6px 0;text-align:right"><strong>${escapeHtml(value)}</strong></td></tr>`).join("\n")}
</table>`;
}

/** A red button-style link. */
export function buttonHtml(href: string, label: string): string {
  return `<p><a href="${escapeHtml(href)}" style="display:inline-block;background:#de2e0c;color:#fff;padding:12px 18px;border-radius:999px;text-decoration:none;font-weight:700">${escapeHtml(label)}</a></p>`;
}

export function wrapHtml(body: string): string {
  return `<div style="font-family:system-ui,sans-serif;color:#0c2270;max-width:560px;line-height:1.5">
${body}
<p style="color:#4a6073">Red Lantern Bikes, District 1, Ho Chi Minh City</p>
</div>`;
}

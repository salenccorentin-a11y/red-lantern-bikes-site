import { LOGIN_LINK_MINUTES } from "@/server/auth";
import type { Email } from "@/server/email";

export function staffLoginEmail(to: string, name: string, link: string): Email {
  const text = [
    `Hi ${name},`,
    "",
    `Use this link to sign in to the Red Lantern Bikes staff area. It works once, for ${LOGIN_LINK_MINUTES} minutes:`,
    link,
    "",
    "If you didn't ask to sign in, you can ignore this email.",
  ].join("\n");

  const html = `<div style="font-family:system-ui,sans-serif;color:#1b1512;max-width:520px">
<p>Use this button to sign in to the Red Lantern Bikes staff area. It works once, for ${LOGIN_LINK_MINUTES} minutes.</p>
<p><a href="${link}" style="display:inline-block;background:#b3261e;color:#fff;padding:12px 18px;border-radius:4px;text-decoration:none">Sign in</a></p>
<p style="color:#6e625a">If you didn't ask to sign in, you can ignore this email.</p>
</div>`;

  return { to, subject: "Your Red Lantern Bikes sign-in link", text, html };
}

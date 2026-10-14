"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { consumeLoginToken, createLoginToken } from "@/server/auth";
import { sendEmail } from "@/server/email";
import { staffLoginEmail } from "@/server/emails/staff-login";
import { setSessionCookie } from "@/server/staff-session";

export type LoginRequestState = { sent?: boolean; error?: string };

/** Emails a sign-in link if the address belongs to active staff. */
export async function requestLoginLink(
  _previous: LoginRequestState,
  form: FormData,
): Promise<LoginRequestState> {
  const email = z
    .email()
    .max(200)
    .safeParse(String(form.get("email") ?? "").trim());
  if (!email.success) return { error: "Please enter a valid email address." };

  const link = await createLoginToken(db, email.data);
  if (link) {
    const siteUrl = process.env.SITE_URL ?? "http://localhost:3000";
    const url = `${siteUrl}/staff/login/confirm?token=${encodeURIComponent(link.token)}`;
    try {
      await sendEmail(staffLoginEmail(link.staff.email, link.staff.name, url));
    } catch (error) {
      console.error("Staff sign-in email failed", error);
    }
  }
  // Same answer whether or not the email is staff, so the form can't be used
  // to find out who works here.
  return { sent: true };
}

/** The "Sign in" button on the link's confirm page. */
export async function signInWithLink(form: FormData) {
  const token = String(form.get("token") ?? "");
  const session = token ? await consumeLoginToken(db, token) : null;
  if (!session) redirect("/staff/login?expired=1");
  await setSessionCookie(session.sessionToken, session.expiresAt);
  redirect("/staff");
}

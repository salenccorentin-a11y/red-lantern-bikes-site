// Connects staff sign-in (auth.ts) to the browser's cookie. Every staff page
// and every staff action calls requireStaff() or requireOwner() itself; the
// check is never left to the browser or to navigation links alone.

import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { cache } from "react";
import { db } from "@/lib/db";
import { endSession, findSessionStaff, type StaffIdentity } from "@/server/auth";

// "__Host-" makes browsers refuse the cookie unless it's secure, host-only and
// site-wide. Plain http on localhost can't use it, so development drops it.
const COOKIE =
  process.env.NODE_ENV === "production" ? "__Host-rlb_staff_session" : "rlb_staff_session";

export async function setSessionCookie(token: string, expiresAt: Date) {
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

/** The signed-in staff member, or null. Checked once per request. */
export const currentStaff = cache(async (): Promise<StaffIdentity | null> => {
  // Who is signed in depends on this request (and on the time, for expiry),
  // so never work it out ahead of time.
  await connection();
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  return findSessionStaff(db, token);
});

/** For staff pages and actions: the signed-in staff member, or off to sign-in. */
export async function requireStaff(): Promise<StaffIdentity> {
  const staff = await currentStaff();
  if (!staff) redirect("/staff/login");
  return staff;
}

/** For prices, costs, profit and settings: owners only. */
export async function requireOwner(): Promise<StaffIdentity> {
  const staff = await requireStaff();
  if (staff.role !== "OWNER") redirect("/staff?owner-only=1");
  return staff;
}

export async function signOutCurrentSession() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) await endSession(db, token);
  jar.delete(COOKIE);
}

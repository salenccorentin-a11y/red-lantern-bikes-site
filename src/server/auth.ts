// Staff sign-in by email link. Pure database logic, no cookies or requests,
// so it can be tested directly; staff-session.ts connects it to the browser.
//
// Tokens are 32 random bytes. Only their SHA-256 hash is stored, so someone
// reading the database can't sign in with what they find there.

import { createHash, randomBytes } from "node:crypto";
import type { PrismaClient } from "@/generated/prisma/client";

const MINUTE_MS = 60_000;
export const LOGIN_LINK_MINUTES = 15;
export const SESSION_DAYS = 30;
/** Most sign-in links one person can request in LOGIN_LINK_MINUTES. */
const MAX_LINKS_PER_WINDOW = 5;

export function newToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function normaliseEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Creates a sign-in link token for an active staff member. Returns null for
 * unknown or inactive emails, and when too many links were requested recently.
 * The caller shows the same message either way, so the form can't be used to
 * find out who works here.
 */
export async function createLoginToken(db: PrismaClient, email: string, now = new Date()) {
  const staff = await db.staffUser.findUnique({ where: { email: normaliseEmail(email) } });
  if (!staff || !staff.active) return null;

  const windowStart = new Date(now.getTime() - LOGIN_LINK_MINUTES * MINUTE_MS);
  const recent = await db.staffLoginToken.count({
    where: { staffId: staff.id, createdAt: { gte: windowStart } },
  });
  if (recent >= MAX_LINKS_PER_WINDOW) return null;

  const token = newToken();
  await db.staffLoginToken.create({
    data: {
      tokenHash: hashToken(token),
      staffId: staff.id,
      expiresAt: new Date(now.getTime() + LOGIN_LINK_MINUTES * MINUTE_MS),
      createdAt: now,
    },
  });
  return { token, staff };
}

/** Who a sign-in link belongs to, without using it up (for the confirm page). */
export async function peekLoginToken(db: PrismaClient, token: string, now = new Date()) {
  const row = await db.staffLoginToken.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { staff: true },
  });
  if (!row || row.usedAt || row.expiresAt <= now || !row.staff.active) return null;
  return row.staff;
}

/**
 * Uses up a sign-in link and opens a session. Returns the session token for
 * the cookie, or null if the link is unknown, used, expired, or its owner was
 * deactivated. Safe against double clicks: only one use can win.
 */
export async function consumeLoginToken(db: PrismaClient, token: string, now = new Date()) {
  const tokenHash = hashToken(token);
  return db.$transaction(async (tx) => {
    const row = await tx.staffLoginToken.findUnique({
      where: { tokenHash },
      include: { staff: true },
    });
    if (!row || !row.staff.active) return null;

    const { count } = await tx.staffLoginToken.updateMany({
      where: { id: row.id, usedAt: null, expiresAt: { gt: now } },
      data: { usedAt: now },
    });
    if (count !== 1) return null;

    const sessionToken = newToken();
    const expiresAt = new Date(now.getTime() + SESSION_DAYS * 24 * 60 * MINUTE_MS);
    await tx.staffSession.create({
      data: { tokenHash: hashToken(sessionToken), staffId: row.staffId, expiresAt, createdAt: now },
    });
    return { sessionToken, expiresAt, staff: row.staff };
  });
}

/** The staff member behind a session cookie, or null if it's not valid any more. */
export async function findSessionStaff(db: PrismaClient, sessionToken: string, now = new Date()) {
  const session = await db.staffSession.findUnique({
    where: { tokenHash: hashToken(sessionToken) },
    include: { staff: true },
  });
  if (!session || session.expiresAt <= now || !session.staff.active) return null;
  const { id, email, name, role } = session.staff;
  return { id, email, name, role };
}

export type StaffIdentity = NonNullable<Awaited<ReturnType<typeof findSessionStaff>>>;

export async function endSession(db: PrismaClient, sessionToken: string) {
  await db.staffSession.deleteMany({ where: { tokenHash: hashToken(sessionToken) } });
}

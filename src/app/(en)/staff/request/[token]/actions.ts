"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { acceptRequest, declineRequest, sendAnswerEmail } from "@/server/booking-requests";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * The Accept and Decline buttons on the page behind the link in the shop's
 * email. Whoever has the link can answer, so it needs no sign-in: the code
 * in it is random and is only ever sent to the shop's own inbox.
 */
export async function answerRequestAction(form: FormData) {
  const token = String(form.get("token") ?? "");
  const page = `/staff/request/${encodeURIComponent(token)}`;
  const booking = UUID.test(token)
    ? await db.booking.findUnique({ where: { decisionToken: token }, select: { id: true } })
    : null;
  if (!booking) redirect(page);

  const accepted = form.get("answer") === "accept";
  const result = accepted
    ? await acceptRequest(db, booking.id)
    : await declineRequest(db, booking.id);
  if (!result.ok) redirect(`${page}?error=${result.error}`);

  const reason = String(form.get("reason") ?? "")
    .trim()
    .slice(0, 1000);
  const emailed = await sendAnswerEmail(
    db,
    booking.id,
    accepted ? { accepted: true } : { accepted: false, reason: reason || null },
  );
  redirect(`${page}?done=${accepted ? "accepted" : "declined"}${emailed ? "" : "&email=failed"}`);
}

// The page behind the Accept / Decline links in the shop's "new booking
// request" email. It shows the request and takes a button press to answer,
// so email scanners that open links automatically can't answer by accident.
// No sign-in: the random code in the address is the key (see actions.ts).

import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { dropoffLabel } from "@/lib/cities";
import { formatDisplayDate, formatSaigonDateTime, toIsoDate } from "@/lib/dates";
import { db } from "@/lib/db";
import { formatVnd } from "@/lib/money";
import { ANSWER_ERROR_TEXT, type AnswerError } from "@/server/booking-requests";
import { answerRequestAction } from "./actions";
import styles from "../../staff.module.css";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Props = PageProps<"/staff/request/[token]">;

export default function RequestPage(props: Props) {
  return (
    <main className={styles.main}>
      <Suspense fallback={<p className={styles.muted}>Loading the request…</p>}>
        <Request params={props.params} searchParams={props.searchParams} />
      </Suspense>
    </main>
  );
}

async function Request(props: Pick<Props, "params" | "searchParams">) {
  const [{ token }, query] = await Promise.all([props.params, props.searchParams]);
  await connection();
  const booking = UUID.test(token)
    ? await db.booking.findUnique({
        where: { decisionToken: token },
        include: { bikeModel: true, bike: true, addOns: true },
      })
    : null;

  if (!booking) {
    return (
      <>
        <h1>Booking request</h1>
        <p>This link doesn&apos;t match any booking request.</p>
        <p>
          <Link href="/staff">Open the staff area</Link>
        </p>
      </>
    );
  }

  const error = typeof query.error === "string" ? query.error : null;
  const waiting = booking.status === "PENDING_PAYMENT";
  const lapsed = booking.status === "EXPIRED";
  const accepted = ["CONFIRMED", "CHECKED_OUT", "COMPLETED"].includes(booking.status);
  const declineFirst = query.answer === "decline";

  const acceptForm = (
    <form action={answerRequestAction} className={styles.panel}>
      <input type="hidden" name="token" value={token} />
      <input type="hidden" name="answer" value="accept" />
      <h2>Accept</h2>
      <p>
        The booking is confirmed and the bike stays reserved. {booking.customerName} gets an email
        saying so, and that you&apos;ll contact them about paying the deposit of{" "}
        {formatVnd(booking.depositVnd)}.
      </p>
      <button className={styles.primary}>Accept this booking</button>
    </form>
  );
  const declineForm = (
    <form action={answerRequestAction} className={`${styles.panel} ${styles.form}`}>
      <input type="hidden" name="token" value={token} />
      <input type="hidden" name="answer" value="decline" />
      <h2>Decline</h2>
      <p>The request is cancelled and the bike is free again. The customer gets an email.</p>
      <label className={styles.field}>
        <span>Message to the customer (optional)</span>
        <textarea
          name="reason"
          rows={3}
          maxLength={1000}
          placeholder="e.g. That bike is in the workshop that week. The Honda XR150 is free if you'd like it."
        />
      </label>
      <div>
        <button className={styles.secondary}>Decline this request</button>
      </div>
    </form>
  );

  return (
    <>
      <h1>
        Booking request {booking.reference} · {booking.customerName}
      </h1>

      {query.done === "accepted" && (
        <p className={styles.success}>
          Accepted.{" "}
          {query.email === "failed"
            ? "The confirmation email to the customer could not be sent, so please tell them yourself."
            : `${booking.customerName} has been emailed that the booking is confirmed.`}
        </p>
      )}
      {query.done === "declined" && (
        <p className={styles.success}>
          Declined. The bike is free again.{" "}
          {query.email === "failed"
            ? "The email to the customer could not be sent, so please tell them yourself."
            : `${booking.customerName} has been emailed.`}
        </p>
      )}
      {error && (
        <p className={styles.error}>
          {ANSWER_ERROR_TEXT[error as AnswerError] ?? "That didn't work. Please try again."}
        </p>
      )}

      {waiting && (
        <p>
          <span className={styles.badge}>Waiting for your answer</span>{" "}
          {booking.holdExpiresAt && (
            <span className={styles.muted}>
              The bike is held until {formatSaigonDateTime(booking.holdExpiresAt)} (Saigon time).
            </span>
          )}
        </p>
      )}
      {lapsed && (
        <p>
          <span className={styles.badge}>Ran out unanswered</span>{" "}
          <span className={styles.muted}>
            The bike was released
            {booking.holdExpiresAt && ` on ${formatSaigonDateTime(booking.holdExpiresAt)}`}. You can
            still accept, as long as nobody else has taken it since.
          </span>
        </p>
      )}
      {accepted && (
        <ContactCustomer
          reference={booking.reference}
          name={booking.customerName}
          email={booking.customerEmail}
          phone={booking.customerPhone}
          bikeName={booking.bikeModel.name}
          depositVnd={booking.depositVnd}
        />
      )}
      {booking.status === "CANCELLED" && !query.done && (
        <p>
          <span className={styles.badge}>Declined or cancelled</span>
        </p>
      )}

      {/* The answer first: on a phone, the details below are a long scroll. */}
      {(waiting || lapsed) && (
        <div className={styles.row}>
          {declineFirst ? declineForm : acceptForm}
          {declineFirst ? acceptForm : declineForm}
        </div>
      )}

      <div className={styles.row}>
        <section className={styles.panel}>
          <h2>Customer</h2>
          <dl>
            <dt className={styles.muted}>Name</dt>
            <dd>{booking.customerName}</dd>
            {booking.customerEmail && (
              <>
                <dt className={styles.muted}>Email</dt>
                <dd>
                  <a href={`mailto:${booking.customerEmail}`}>{booking.customerEmail}</a>
                </dd>
              </>
            )}
            {booking.customerPhone && (
              <>
                <dt className={styles.muted}>Phone / WhatsApp</dt>
                <dd>
                  <a href={`tel:${booking.customerPhone}`}>{booking.customerPhone}</a>
                </dd>
              </>
            )}
            {booking.customerNote && (
              <>
                <dt className={styles.muted}>Their note</dt>
                <dd>{booking.customerNote}</dd>
              </>
            )}
          </dl>
        </section>

        <section className={styles.panel}>
          <h2>Trip</h2>
          <dl>
            <dt className={styles.muted}>Bike</dt>
            <dd>
              {booking.bikeModel.name}
              {booking.bike && ` · ${booking.bike.plate}`}
            </dd>
            <dt className={styles.muted}>Dates</dt>
            <dd>
              {formatDisplayDate(toIsoDate(booking.startDate))} to{" "}
              {formatDisplayDate(toIsoDate(booking.endDate))} ({booking.days}{" "}
              {booking.days === 1 ? "day" : "days"})
            </dd>
            <dt className={styles.muted}>Drop-off</dt>
            <dd>{dropoffLabel(booking.dropoffCity)}</dd>
            <dt className={styles.muted}>Requested</dt>
            <dd>{formatSaigonDateTime(booking.createdAt)}</dd>
          </dl>
        </section>

        <section className={styles.panel}>
          <h2>Price</h2>
          <table className={styles.table}>
            <tbody>
              <tr>
                <td>Rental ({booking.days} days)</td>
                <td className={styles.num}>{formatVnd(booking.rentalVnd)}</td>
              </tr>
              {booking.oneWayFeeVnd > 0 && (
                <tr>
                  <td>One-way fee</td>
                  <td className={styles.num}>{formatVnd(booking.oneWayFeeVnd)}</td>
                </tr>
              )}
              {booking.addOns.map((a) => (
                <tr key={a.id}>
                  <td>
                    {a.name}
                    {a.quantity > 1 ? ` × ${a.quantity}` : ""}
                  </td>
                  <td className={styles.num}>{formatVnd(a.totalVnd)}</td>
                </tr>
              ))}
              <tr>
                <th>Total</th>
                <th className={styles.num}>{formatVnd(booking.totalVnd)}</th>
              </tr>
              <tr>
                <td>Deposit (non-refundable)</td>
                <td className={styles.num}>{formatVnd(booking.depositVnd)}</td>
              </tr>
              <tr>
                <td>Balance at pick-up</td>
                <td className={styles.num}>{formatVnd(booking.balanceVnd)}</td>
              </tr>
            </tbody>
          </table>
        </section>
      </div>

      <p className={styles.muted}>
        <Link href={`/staff/bookings/${booking.id}`}>Open this booking in the staff area</Link>{" "}
        (needs sign-in) to add a note, cancel it later or check the bike out.
      </p>
    </>
  );
}

/** After accepting: ways to reach the customer about payment. */
function ContactCustomer(props: {
  reference: string;
  name: string;
  email: string | null;
  phone: string | null;
  bikeName: string;
  depositVnd: number;
}) {
  const message = `Hi ${props.name}, this is Red Lantern Bikes. Your booking ${props.reference} (${props.bikeName}) is confirmed. To pay the deposit of ${formatVnd(props.depositVnd)}: `;
  const digits = props.phone?.replace(/\D/g, "") ?? "";
  return (
    <section className={styles.panel}>
      <h2>Confirmed: now arrange payment with {props.name}</h2>
      <p>
        Deposit to collect: <b>{formatVnd(props.depositVnd)}</b>. These links open a message you can
        finish with your payment details.
      </p>
      <div className={styles.row}>
        {digits.length >= 8 && (
          <a
            className={styles.primary}
            href={`https://wa.me/${digits}?text=${encodeURIComponent(message)}`}
            target="_blank"
            rel="noopener"
          >
            WhatsApp {props.phone}
          </a>
        )}
        {props.email && (
          <a
            className={digits.length >= 8 ? styles.secondary : styles.primary}
            href={`mailto:${props.email}?subject=${encodeURIComponent(
              `Your Red Lantern Bikes booking ${props.reference}: deposit`,
            )}&body=${encodeURIComponent(message)}`}
          >
            Email {props.email}
          </a>
        )}
      </div>
    </section>
  );
}

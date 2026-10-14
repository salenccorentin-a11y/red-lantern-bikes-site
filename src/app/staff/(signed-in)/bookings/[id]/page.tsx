import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { dropoffLabel } from "@/lib/cities";
import { formatDisplayDate, formatSaigonDateTime, toIsoDate } from "@/lib/dates";
import { db } from "@/lib/db";
import { formatVnd } from "@/lib/money";
import { requireStaff } from "@/server/staff-session";
import { cancelAction, checkInAction, checkOutAction, saveNoteAction } from "./actions";
import styles from "../../../staff.module.css";

const STATUS: Record<string, string> = {
  PENDING_PAYMENT: "Waiting for deposit",
  CONFIRMED: "Confirmed",
  CHECKED_OUT: "Out with customer",
  COMPLETED: "Returned",
  CANCELLED: "Cancelled",
  EXPIRED: "Expired (deposit never arrived)",
};

export default function StaffBookingPage(props: PageProps<"/staff/bookings/[id]">) {
  return (
    <Suspense fallback={<p className={styles.muted}>Loading booking…</p>}>
      <BookingAdmin params={props.params} searchParams={props.searchParams} />
    </Suspense>
  );
}

async function BookingAdmin(props: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireStaff();
  const [{ id }, query] = await Promise.all([props.params, props.searchParams]);
  const booking = await db.booking.findUnique({
    where: { id },
    include: { bike: true, bikeModel: true, addOns: true, createdBy: { select: { name: true } } },
  });
  if (!booking) notFound();

  const canCheckOut = booking.status === "CONFIRMED" || booking.status === "PENDING_PAYMENT";
  const canCheckIn = booking.status === "CHECKED_OUT";
  const canCancel = canCheckOut;

  return (
    <>
      <p>
        <Link href="/staff">← Calendar</Link>
      </p>
      <h1>
        {booking.reference} · {booking.customerName}
      </h1>
      <p>
        <span className={styles.badge}>{STATUS[booking.status] ?? booking.status}</span>{" "}
        <span className={styles.muted}>
          {booking.source === "WALK_IN"
            ? `Walk-in${booking.createdBy ? ` by ${booking.createdBy.name}` : ""}`
            : booking.source === "IMPORT"
              ? "Imported"
              : "Booked online"}{" "}
          on {formatSaigonDateTime(booking.createdAt)}
        </span>
      </p>
      {typeof query.done === "string" && <p className={styles.success}>{query.done}</p>}
      {typeof query.error === "string" && <p className={styles.error}>{query.error}</p>}

      <div className={styles.row}>
        <section className={styles.panel}>
          <h2>Trip</h2>
          <dl>
            <dt className={styles.muted}>Bike</dt>
            <dd>
              {booking.bikeModel.name}
              {booking.bike && (
                <>
                  {" · "}
                  <Link href={`/staff/bikes/${booking.bike.id}`}>{booking.bike.plate}</Link>
                </>
              )}
            </dd>
            <dt className={styles.muted}>Dates</dt>
            <dd>
              {formatDisplayDate(toIsoDate(booking.startDate))} to{" "}
              {formatDisplayDate(toIsoDate(booking.endDate))} ({booking.days} days)
            </dd>
            <dt className={styles.muted}>Drop-off</dt>
            <dd>{dropoffLabel(booking.dropoffCity)}</dd>
            {booking.status === "PENDING_PAYMENT" && booking.holdExpiresAt && (
              <>
                <dt className={styles.muted}>Hold expires</dt>
                <dd>{formatSaigonDateTime(booking.holdExpiresAt)}</dd>
              </>
            )}
            {booking.checkedOutAt && (
              <>
                <dt className={styles.muted}>Checked out</dt>
                <dd>{formatSaigonDateTime(booking.checkedOutAt)}</dd>
              </>
            )}
            {booking.checkedInAt && (
              <>
                <dt className={styles.muted}>Checked in</dt>
                <dd>{formatSaigonDateTime(booking.checkedInAt)}</dd>
              </>
            )}
          </dl>
        </section>

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
          <h2>Money</h2>
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
                <td>Deposit (online, non-refundable)</td>
                <td className={styles.num}>{formatVnd(booking.depositVnd)}</td>
              </tr>
              <tr>
                <td>Balance at pick-up</td>
                <td className={styles.num}>{formatVnd(booking.balanceVnd)}</td>
              </tr>
            </tbody>
          </table>
          {booking.status === "PENDING_PAYMENT" && (
            <p className={styles.muted}>
              Deposit not received online yet. If the customer pays it at the counter, collect the
              full total at pick-up.
            </p>
          )}
        </section>
      </div>

      <section className={styles.panel}>
        <h2>Actions</h2>
        <div className={styles.row}>
          {canCheckOut && (
            <form action={checkOutAction}>
              <input type="hidden" name="id" value={booking.id} />
              <button className={styles.primary}>Check out: customer takes the bike</button>
            </form>
          )}
          {canCheckIn && (
            <form action={checkInAction}>
              <input type="hidden" name="id" value={booking.id} />
              <button className={styles.primary}>Check in: bike is back</button>
            </form>
          )}
          {booking.bike && (
            <p>
              <Link href={`/staff/bikes/${booking.bike.id}?booking=${booking.id}#incident`}>
                Log damage or an incident on this rental
              </Link>
            </p>
          )}
        </div>
        {canCancel && (
          <form action={cancelAction} className={styles.form} style={{ marginTop: 16 }}>
            <input type="hidden" name="id" value={booking.id} />
            <label>
              <input type="checkbox" name="confirm" value="yes" /> Yes, cancel this booking. The
              deposit is non-refundable.
            </label>
            <div>
              <button className={styles.secondary}>Cancel booking</button>
            </div>
          </form>
        )}
      </section>

      <section className={styles.panel}>
        <h2>Staff note</h2>
        <form action={saveNoteAction} className={styles.form}>
          <input type="hidden" name="id" value={booking.id} />
          <label className={styles.field}>
            <span>Only staff see this</span>
            <textarea
              name="note"
              rows={3}
              defaultValue={booking.staffNote ?? ""}
              maxLength={2000}
            />
          </label>
          <div>
            <button className={styles.secondary}>Save note</button>
          </div>
        </form>
      </section>
    </>
  );
}

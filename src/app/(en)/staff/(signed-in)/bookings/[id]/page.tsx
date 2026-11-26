import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { dropoffLabel } from "@/lib/cities";
import {
  formatDisplayDate,
  formatSaigonDateTime,
  parseIsoDate,
  toIsoDate,
  todayInSaigon,
} from "@/lib/dates";
import { db } from "@/lib/db";
import { formatVnd } from "@/lib/money";
import { daysSinceOilChange, nextOilReminder, oilReminderDue, whatsappDigits } from "@/lib/oil";
import { linkBookingsToCustomers } from "@/server/customers";
import { requireStaff } from "@/server/staff-session";
import { RecordOilForm, SendReminderButton } from "../../oil/oil-forms";
import {
  acceptRequestAction,
  cancelAction,
  changeDatesAction,
  checkInAction,
  checkOutAction,
  archiveBookingAction,
  declineRequestAction,
  saveRecordAction,
  unarchiveBookingAction,
} from "./actions";
import styles from "../../../staff.module.css";

const STATUS: Record<string, string> = {
  PENDING_PAYMENT: "Request waiting for your answer",
  CONFIRMED: "Confirmed",
  CHECKED_OUT: "Out with customer",
  COMPLETED: "Returned",
  CANCELLED: "Cancelled",
  EXPIRED: "Request ran out unanswered",
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
  await linkBookingsToCustomers(db);
  const booking = await db.booking.findUnique({
    where: { id },
    include: {
      bike: true,
      bikeModel: true,
      addOns: true,
      createdBy: { select: { name: true } },
      customer: { select: { id: true, phone: true } },
    },
  });
  if (!booking) notFound();
  const today = parseIsoDate(todayInSaigon())!;
  const onTheRoad = booking.status === "CHECKED_OUT";
  const oilDue = onTheRoad && oilReminderDue(booking, today);
  const hasWhatsapp = whatsappDigits(booking.customer?.phone ?? booking.customerPhone) != null;
  const from = `/staff/bookings/${booking.id}`;
  // The other bikes of the same rental (same Notion row, or same customer and dates).
  const siblings = await db.booking.findMany({
    where: {
      id: { not: booking.id },
      status: { in: ["CONFIRMED", "CHECKED_OUT", "COMPLETED"] },
      ...(booking.notionUrl
        ? { notionUrl: booking.notionUrl }
        : booking.customerId
          ? {
              customerId: booking.customerId,
              startDate: booking.startDate,
              endDate: booking.endDate,
            }
          : { id: "none" }),
    },
    select: {
      id: true,
      status: true,
      startDate: true,
      endDate: true,
      bike: { select: { plate: true } },
    },
  });
  const rentalIds = [booking.id, ...siblings.map((b) => b.id)].join(",");
  // Dates change while the booking isn't returned; the other bikes on the
  // same dates can change with it.
  const canChangeDates = ["PENDING_PAYMENT", "CONFIRMED", "CHECKED_OUT"].includes(booking.status);
  const sameDates = siblings.filter(
    (b) =>
      b.status !== "COMPLETED" &&
      b.startDate.getTime() === booking.startDate.getTime() &&
      b.endDate.getTime() === booking.endDate.getTime(),
  );

  const canCheckOut = booking.status === "CONFIRMED" || booking.status === "PENDING_PAYMENT";
  const canCheckIn = booking.status === "CHECKED_OUT";
  const canCancel = canCheckOut;
  // Online bookings are requests until the shop answers. One that ran out
  // unanswered can still be accepted while its bike is free.
  const canAnswer =
    booking.source === "ONLINE" &&
    (booking.status === "PENDING_PAYMENT" || booking.status === "EXPIRED");

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
              {canChangeDates && (
                <>
                  {" · "}
                  <a href="#dates">Change or extend</a>
                </>
              )}
            </dd>
            <dt className={styles.muted}>Drop-off</dt>
            <dd>{dropoffLabel(booking.dropoffCity)}</dd>
            {booking.status === "PENDING_PAYMENT" && booking.holdExpiresAt && (
              <>
                <dt className={styles.muted}>Answer by</dt>
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
          {booking.customer && (
            <p>
              <Link href={`/staff/customers/${booking.customer.id}`}>
                Customer record and past rentals
              </Link>
            </p>
          )}
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
                <td>Deposit (non-refundable)</td>
                <td className={styles.num}>{formatVnd(booking.depositVnd)}</td>
              </tr>
              <tr>
                <td>Balance at pick-up</td>
                <td className={styles.num}>{formatVnd(booking.balanceVnd)}</td>
              </tr>
            </tbody>
          </table>
          {booking.source === "ONLINE" && (
            <p className={styles.muted}>
              There is no online payment: after accepting, arrange the deposit with the customer
              directly. Use the staff note below to record when it&apos;s paid.
            </p>
          )}
        </section>
      </div>

      {canAnswer && (
        <section className={styles.panel}>
          <h2>Answer this request</h2>
          <p className={styles.muted}>
            {booking.status === "EXPIRED"
              ? "It ran out unanswered and the bike was released. You can still accept it while the bike is free."
              : "The customer is waiting. Either way, they get an email with your answer."}
          </p>
          <div className={styles.row}>
            <form action={acceptRequestAction}>
              <input type="hidden" name="id" value={booking.id} />
              <button className={styles.primary}>Accept this booking</button>
            </form>
            <form action={declineRequestAction} className={styles.form}>
              <input type="hidden" name="id" value={booking.id} />
              <label className={styles.field}>
                <span>Message to the customer (optional)</span>
                <textarea name="reason" rows={2} maxLength={1000} />
              </label>
              <div>
                <button className={styles.secondary}>Decline this request</button>
              </div>
            </form>
          </div>
        </section>
      )}

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

      {canChangeDates && (
        <section className={styles.panel} id="dates">
          <h2>Change dates or extend</h2>
          <form action={changeDatesAction} className={styles.form}>
            <input type="hidden" name="id" value={booking.id} />
            <input type="hidden" name="ids" value={sameDates.map((b) => b.id).join(",")} />
            <p className={styles.muted}>
              The bike&apos;s days move with the dates, after checking nobody else has it booked.
              {booking.source === "IMPORT"
                ? " The money stays in the rental record below."
                : " The price is worked out again for the new number of days."}
              {onTheRoad ? " The bike is out, so only the return date can change." : ""}
            </p>
            <div className={styles.inlineForm}>
              <label className={styles.field}>
                <span>Pick-up</span>
                <input
                  type="date"
                  name="start"
                  required
                  defaultValue={toIsoDate(booking.startDate)}
                  readOnly={onTheRoad}
                />
              </label>
              <label className={styles.field}>
                <span>Return</span>
                <input type="date" name="end" required defaultValue={toIsoDate(booking.endDate)} />
              </label>
              <div>
                <button className={styles.secondary}>Save new dates</button>
              </div>
            </div>
            <div>
              <p className={styles.muted}>Or extend the return date:</p>
              <div className={styles.row}>
                {[1, 2, 3, 7].map((n) => (
                  <button
                    key={n}
                    name="extend"
                    value={n}
                    formNoValidate
                    className={styles.secondary}
                  >
                    {n === 7 ? "+1 week" : `+${n} ${n === 1 ? "day" : "days"}`}
                  </button>
                ))}
              </div>
            </div>
            {sameDates.length > 0 && (
              <label>
                <input type="checkbox" name="group" value="yes" defaultChecked /> Also the{" "}
                {sameDates.length === 1 ? "other bike" : `${sameDates.length} other bikes`} of this
                rental ({sameDates.map((b) => b.bike?.plate ?? "bike").join(", ")})
              </label>
            )}
          </form>
        </section>
      )}

      {(onTheRoad || booking.oilChangedOn || booking.kmSinceOilChange != null) && (
        <section className={styles.panel}>
          <h2>Oil change</h2>
          <p className={styles.muted}>
            {daysSinceOilChange(booking, today)}{" "}
            {daysSinceOilChange(booking, today) === 1 ? "day" : "days"} since{" "}
            {booking.oilChangedOn ? "the last oil change" : "pick-up"}
            {booking.oilReminderSentOn
              ? ` · last reminder ${formatDisplayDate(toIsoDate(booking.oilReminderSentOn))}`
              : ""}
            {onTheRoad && !oilDue
              ? ` · next reminder ${formatDisplayDate(toIsoDate(nextOilReminder(booking)))}`
              : ""}
          </p>
          {oilDue && (
            <p>
              <span className={styles.badgeAlert}>Reminder due</span>
            </p>
          )}
          <div className={styles.row}>
            {oilDue && <SendReminderButton id={booking.id} from={from} hasPhone={hasWhatsapp} />}
            <RecordOilForm
              id={booking.id}
              from={from}
              oilChangedOn={booking.oilChangedOn}
              kmSinceOilChange={booking.kmSinceOilChange}
              intervalKm={booking.bikeModel.oilIntervalKm}
            />
          </div>
        </section>
      )}

      <section className={styles.panel}>
        <h2>Rental record</h2>
        {siblings.length > 0 && (
          <p className={styles.muted}>
            Rented with {siblings.length === 1 ? "another bike" : `${siblings.length} other bikes`}:{" "}
            {siblings.map((b, i) => (
              <span key={b.id}>
                {i > 0 ? ", " : ""}
                <Link href={`/staff/bookings/${b.id}`}>{b.bike?.plate ?? "bike"}</Link>
              </span>
            ))}
            . Each bike keeps its own record.
          </p>
        )}
        <form action={saveRecordAction} className={styles.form}>
          <input type="hidden" name="id" value={booking.id} />
          <div className={styles.inlineForm}>
            {(
              [
                ["paid", "Paid", booking.paidNote, "e.g. 350$ or 1.8ml VND"],
                ["transfer", "Transfer", booking.transferNote, "e.g. 60$"],
                ["deposit", "Deposit", booking.depositNote, "e.g. 450e Coco, Passport"],
                ["insurance", "Insurance", booking.insuranceNote, "e.g. No, Yes 5$/day"],
                ["helmet", "Helmet", booking.helmetNote, "e.g. FF 20$"],
              ] as const
            ).map(([name, label, value, placeholder]) => (
              <label key={name} className={styles.field}>
                <span>{label}</span>
                <input
                  name={name}
                  defaultValue={value ?? ""}
                  placeholder={placeholder}
                  maxLength={500}
                />
              </label>
            ))}
          </div>
          <label className={styles.field}>
            <span>Notes (only staff see these)</span>
            <textarea
              name="notes"
              rows={3}
              defaultValue={booking.staffNote ?? ""}
              maxLength={2000}
            />
          </label>
          <label className={styles.field}>
            <span>Problems on the way</span>
            <textarea
              name="problems"
              rows={2}
              defaultValue={booking.problemsNote ?? ""}
              maxLength={2000}
              placeholder="e.g. 80k spark plug"
            />
          </label>
          <div>
            <button className={styles.secondary}>Save rental record</button>
          </div>
        </form>
      </section>

      {booking.status === "COMPLETED" && (
        <section className={styles.panel}>
          <h2>Archive</h2>
          {booking.archivedAt ? (
            <form action={unarchiveBookingAction} className={styles.form}>
              <input type="hidden" name="id" value={booking.id} />
              <input type="hidden" name="ids" value={rentalIds} />
              <p className={styles.muted}>
                In the archive since {formatSaigonDateTime(booking.archivedAt)}.
              </p>
              <div>
                <button className={styles.secondary}>Take out of the archive</button>
              </div>
            </form>
          ) : (
            <form action={archiveBookingAction} className={styles.form}>
              <input type="hidden" name="id" value={booking.id} />
              <input type="hidden" name="ids" value={rentalIds} />
              <p className={styles.muted}>
                The bike is back. Once everything is settled, move the rental to the archive.
              </p>
              <div>
                <button className={styles.primary}>Archive this rental</button>
              </div>
            </form>
          )}
        </section>
      )}
    </>
  );
}

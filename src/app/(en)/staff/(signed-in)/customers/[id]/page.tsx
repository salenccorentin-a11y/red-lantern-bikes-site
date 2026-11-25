// One customer: their details (editable) and every rental they've had.

import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { dropoffLabel } from "@/lib/cities";
import { formatDisplayDate, toIsoDate } from "@/lib/dates";
import { db } from "@/lib/db";
import { formatVnd } from "@/lib/money";
import { whatsappDigits } from "@/lib/oil";
import { countRentals, loadCustomer, RENTED_STATUSES } from "@/server/customers";
import { requireStaff } from "@/server/staff-session";
import { saveCustomerAction } from "./actions";
import styles from "../../../staff.module.css";

const STATUS: Record<string, string> = {
  PENDING_PAYMENT: "Request",
  CONFIRMED: "Upcoming",
  CHECKED_OUT: "On the road",
  COMPLETED: "Returned",
  CANCELLED: "Cancelled",
  EXPIRED: "Request ran out",
};

export default function CustomerPage(props: PageProps<"/staff/customers/[id]">) {
  return (
    <Suspense fallback={<p className={styles.muted}>Loading customer…</p>}>
      <Customer params={props.params} searchParams={props.searchParams} />
    </Suspense>
  );
}

async function Customer(props: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireStaff();
  const [{ id }, query] = await Promise.all([props.params, props.searchParams]);
  const customer = await loadCustomer(db, id);
  if (!customer) notFound();

  const rented = customer.bookings.filter((b) =>
    (RENTED_STATUSES as readonly string[]).includes(b.status),
  );
  const totalVnd = rented.reduce((sum, b) => sum + b.totalVnd, 0);
  const rentals = countRentals(rented);
  // Days on the road, counting a rental with two bikes once.
  const days = [
    ...new Map(
      rented.map((b) => [`${b.startDate.getTime()}-${b.endDate.getTime()}`, b.days]),
    ).values(),
  ].reduce((sum, n) => sum + n, 0);
  const whatsapp = whatsappDigits(customer.phone);

  return (
    <>
      <p>
        <Link href="/staff/customers">← Customers</Link>
      </p>
      <h1>{customer.name}</h1>
      <p className={styles.muted}>
        {rentals} {rentals === 1 ? "rental" : "rentals"} · {days} days
        {totalVnd > 0 ? ` · ${formatVnd(totalVnd)} booked on the site` : ""}
      </p>
      {typeof query.done === "string" && <p className={styles.success}>{query.done}</p>}
      {typeof query.error === "string" && <p className={styles.error}>{query.error}</p>}

      <div className={styles.row}>
        <section className={styles.panel}>
          <h2>Details</h2>
          {whatsapp && (
            <p>
              <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noreferrer">
                Message on WhatsApp
              </a>
              {customer.email && (
                <>
                  {" · "}
                  <a href={`mailto:${customer.email}`}>Email</a>
                </>
              )}
            </p>
          )}
          <form action={saveCustomerAction} className={styles.form}>
            <input type="hidden" name="id" value={customer.id} />
            <label className={styles.field}>
              <span>Name</span>
              <input name="name" defaultValue={customer.name} required maxLength={200} />
            </label>
            <label className={styles.field}>
              <span>Phone / WhatsApp, with country code</span>
              <input
                name="phone"
                type="tel"
                defaultValue={customer.phone ?? ""}
                placeholder="+44 7700 900123"
              />
            </label>
            <label className={styles.field}>
              <span>Email</span>
              <input name="email" type="email" defaultValue={customer.email ?? ""} />
            </label>
            <label className={styles.field}>
              <span>Country</span>
              <input name="country" defaultValue={customer.country ?? ""} maxLength={80} />
            </label>
            <label className={styles.field}>
              <span>Notes (only staff see these)</span>
              <textarea
                name="notes"
                rows={3}
                defaultValue={customer.notes ?? ""}
                maxLength={4000}
              />
            </label>
            <div>
              <button className={styles.secondary}>Save customer</button>
            </div>
          </form>
        </section>

        <section className={styles.panel}>
          <h2>Rentals</h2>
          {customer.bookings.length === 0 && <p className={styles.muted}>No bookings.</p>}
          <ul className={styles.list}>
            {customer.bookings.map((b) => (
              <li key={b.id}>
                <Link href={`/staff/bookings/${b.id}`}>
                  <b>
                    {formatDisplayDate(toIsoDate(b.startDate))} to{" "}
                    {formatDisplayDate(toIsoDate(b.endDate))}
                  </b>
                </Link>{" "}
                <span className={styles.badge}>{STATUS[b.status] ?? b.status}</span>
                <br />
                <span className={styles.muted}>
                  {b.bikeModel.name} {b.bike?.plate ?? ""} · {dropoffLabel(b.dropoffCity)} ·{" "}
                  {b.reference}
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}

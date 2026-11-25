// Customers: the rentals, laid out like the owner's Notion Rentals page.
// Tabs: current rentals (on the road, upcoming, just returned), the archive,
// and the people (one record per customer). Newest rental first.

import Link from "next/link";
import { Suspense } from "react";
import { formatDisplayDate, toIsoDate } from "@/lib/dates";
import { db } from "@/lib/db";
import { linkBookingsToCustomers, listCustomers } from "@/server/customers";
import {
  archiveCount,
  listRentals,
  splitByStart,
  type RentalRow,
  type RentalTab,
} from "@/server/rentals";
import { requireStaff } from "@/server/staff-session";
import { archiveAction, markReturnedAction, unarchiveAction } from "./actions";
import { DragScroll } from "./drag-scroll";
import styles from "../../staff.module.css";
import list from "./rentals.module.css";

type Tab = RentalTab | "people";

export default function CustomersPage(props: PageProps<"/staff/customers">) {
  return (
    <>
      <h1>Customers</h1>
      <Suspense fallback={<p className={styles.muted}>Loading…</p>}>
        <Customers searchParams={props.searchParams} />
      </Suspense>
    </>
  );
}

async function Customers({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireStaff();
  const query = await searchParams;
  const tab: Tab =
    query.tab === "archive" ? "archive" : query.tab === "people" ? "people" : "active";
  const search = typeof query.q === "string" ? query.q.slice(0, 100) : "";
  await linkBookingsToCustomers(db);
  const archived = await archiveCount(db);

  const tabLink = (t: Tab, label: string) => (
    <Link
      href={`/staff/customers?tab=${t}`}
      className={`${list.tab} ${tab === t ? list.tabOn : ""}`}
      aria-current={tab === t ? "page" : undefined}
    >
      {label}
    </Link>
  );

  return (
    <>
      <nav className={list.tabs} aria-label="Customer lists">
        {tabLink("active", "On the road & upcoming")}
        {tabLink("archive", `Archive (${archived})`)}
        {tabLink("people", "People")}
      </nav>

      {typeof query.done === "string" && <p className={styles.success}>{query.done}</p>}
      {typeof query.error === "string" && <p className={styles.error}>{query.error}</p>}

      <form className={styles.search} role="search">
        <input type="hidden" name="tab" value={tab} />
        <input
          type="search"
          name="q"
          defaultValue={search}
          placeholder={
            tab === "people" ? "Name, email, phone or country" : "Name, bike, plate or note"
          }
          aria-label="Search"
        />
        <button className={styles.secondary}>Search</button>
      </form>

      {tab === "people" ? <People search={search} /> : <Rentals tab={tab} search={search} />}
    </>
  );
}

async function Rentals({ tab, search }: { tab: RentalTab; search: string }) {
  const rows = await listRentals(db, tab, search);
  if (rows.length === 0) {
    return (
      <p className={styles.muted}>
        {search ? "Nothing found." : tab === "archive" ? "The archive is empty." : "No rentals."}
      </p>
    );
  }
  if (tab === "archive") return <RentalTable rows={rows} tab={tab} />;

  const { started, upcoming } = splitByStart(rows);
  return (
    <>
      <p className={styles.muted}>
        When a bike is back, press <b>Returned</b>; when everything is settled, <b>Archive</b> moves
        the rental to the archive. On a computer, drag the table sideways (or scroll with Shift) to
        see every column.
      </p>
      {started.length > 0 && (
        <>
          <h2 className={list.group}>
            On the road &amp; returned <span>({started.length}, soonest start first)</span>
          </h2>
          <RentalTable rows={started} tab={tab} />
        </>
      )}
      {upcoming.length > 0 && (
        <>
          <h2 className={list.group}>
            Upcoming <span>({upcoming.length}, soonest first)</span>
          </h2>
          <RentalTable rows={upcoming} tab={tab} />
        </>
      )}
    </>
  );
}

function RentalTable({ rows, tab }: { rows: RentalRow[]; tab: RentalTab }) {
  return (
    <DragScroll className={list.wrap}>
      <table className={list.table}>
        <thead>
          <tr>
            <th className={list.stickyCol}>Customer</th>
            <th>Status</th>
            <th>Dates</th>
            <th>Bike</th>
            <th>Destination</th>
            <th>Paid</th>
            <th>Transfer</th>
            <th>Deposit</th>
            <th>Insurance</th>
            <th>Helmet</th>
            <th>Notes</th>
            <th>Problems on the way</th>
            <th>
              <span className={list.srOnly}>Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <RentalLine key={r.key} r={r} tab={tab} />
          ))}
        </tbody>
      </table>
    </DragScroll>
  );
}

const STATUS_CLASS: Record<string, string> = {
  "On the road": list.road,
  Upcoming: list.upcoming,
  Request: list.request,
  Returned: list.returned,
};

function RentalLine({ r, tab }: { r: RentalRow; tab: RentalTab }) {
  const cell = (label: string, value: string | null, wide = false) => (
    <td data-label={label} className={wide ? list.wide : undefined}>
      {value ?? <span className={list.empty}>–</span>}
    </td>
  );
  const hidden = (
    <>
      <input type="hidden" name="ids" value={r.ids.join(",")} />
      <input type="hidden" name="tab" value={tab} />
    </>
  );
  return (
    <tr>
      <td data-label="Customer" className={`${list.name} ${list.stickyCol}`}>
        {r.customerId ? <Link href={`/staff/customers/${r.customerId}`}>{r.name}</Link> : r.name}
      </td>
      <td data-label="Status">
        <div>
          <span className={`${list.status} ${STATUS_CLASS[r.status]}`}>{r.status}</span>
        </div>
      </td>
      <td data-label="Dates" className={list.dates}>
        <div>
          <span>{formatDisplayDate(toIsoDate(r.startDate))}</span>
          <span>→ {formatDisplayDate(toIsoDate(r.endDate))}</span>
          <span className={list.days}>{r.days} days</span>
        </div>
      </td>
      <td data-label="Bike">
        <div>
          {r.bikes.map((b) => (
            <Link key={b.id} href={`/staff/bookings/${b.id}`} className={list.bike}>
              {b.model}
              {b.plate ? <small> {b.plate}</small> : null}
            </Link>
          ))}
        </div>
      </td>
      {cell("Destination", r.destination)}
      {cell("Paid", r.paid)}
      {cell("Transfer", r.transfer)}
      {cell("Deposit", r.deposit)}
      {cell("Insurance", r.insurance)}
      {cell("Helmet", r.helmet)}
      {cell("Notes", r.notes, true)}
      {cell("Problems on the way", r.problems, true)}
      <td className={list.actions}>
        <Link href={`/staff/bookings/${r.firstId}`} className={list.edit}>
          Edit
        </Link>
        {r.status === "On the road" && tab === "active" && (
          <form action={markReturnedAction}>
            {hidden}
            <button className={styles.secondary}>Returned</button>
          </form>
        )}
        {r.status === "Returned" && tab === "active" && (
          <form action={archiveAction}>
            {hidden}
            <button className={styles.primary}>Archive</button>
          </form>
        )}
        {tab === "archive" && (
          <form action={unarchiveAction}>
            {hidden}
            <button className={styles.secondary}>Unarchive</button>
          </form>
        )}
      </td>
    </tr>
  );
}

async function People({ search }: { search: string }) {
  const customers = await listCustomers(db, search);
  if (customers.length === 0) return <p className={styles.muted}>No customers found.</p>;
  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Customer</th>
            <th className={styles.num}>Rentals</th>
            <th>Latest (or next) rental</th>
            <th>Country</th>
          </tr>
        </thead>
        <tbody>
          {customers.map((c) => (
            <tr key={c.id}>
              <td>
                <Link href={`/staff/customers/${c.id}`}>
                  <b>{c.name}</b>
                </Link>{" "}
                {c.onTheRoad && <span className={styles.badge}>On the road</span>}{" "}
                {c.rentals > 1 && <span className={styles.badge}>Returning</span>}
              </td>
              <td className={styles.num}>{c.rentals}</td>
              <td>
                {c.lastRental
                  ? `${formatDisplayDate(toIsoDate(c.lastRental.startDate))} · ${c.lastRental.bikeModel.name}`
                  : "No rental yet"}
              </td>
              <td>{c.country ?? ""}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

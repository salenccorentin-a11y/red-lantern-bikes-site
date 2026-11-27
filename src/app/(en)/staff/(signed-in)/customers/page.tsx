// Customers: the rentals, laid out like the owner's Notion Rentals page.
// Tabs: current rentals (on the road, upcoming, just returned), the archive,
// and the people (one record per customer). Newest rental first.
// On a phone the rentals stay a table (customer column fixed, swipe for the
// rest) like Notion's, or one card each if you pick Cards.

import Link from "next/link";
import { Suspense } from "react";
import { formatDisplayDate, formatShortDate, toIsoDate, todayInSaigon } from "@/lib/dates";
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
import { viewPreference } from "../view-pref";
import { ViewSwitch } from "../view-switch";
import styles from "../../staff.module.css";
import list from "./rentals.module.css";

type Tab = RentalTab | "people";
type View = "table" | "cards";

const VIEW_COOKIE = "staff_rentals_view";

export default function CustomersPage(props: PageProps<"/staff/customers">) {
  return (
    <Suspense
      fallback={
        <>
          <h1>Customers</h1>
          <p className={styles.muted}>Loading…</p>
        </>
      }
    >
      <Customers searchParams={props.searchParams} />
    </Suspense>
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
  const view = await viewPreference<View>(VIEW_COOKIE, query.view, ["table", "cards"], "table");
  const viewHref = (v: View) =>
    `/staff/customers?tab=${tab}&view=${v}${search ? `&q=${encodeURIComponent(search)}` : ""}`;
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
      <div className={list.titleRow}>
        <h1>Customers</h1>
        {tab !== "people" && (
          <ViewSwitch
            className={styles.phoneOnly}
            cookie={VIEW_COOKIE}
            current={view}
            label="Show rentals as"
            options={[
              { value: "table", label: "Table", href: viewHref("table") },
              { value: "cards", label: "Cards", href: viewHref("cards") },
            ]}
          />
        )}
      </div>

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

      {tab === "people" ? (
        <People search={search} />
      ) : (
        <Rentals tab={tab} search={search} cards={view === "cards"} />
      )}
    </>
  );
}

async function Rentals({ tab, search, cards }: { tab: RentalTab; search: string; cards: boolean }) {
  const rows = await listRentals(db, tab, search);
  if (rows.length === 0) {
    return (
      <p className={styles.muted}>
        {search ? "Nothing found." : tab === "archive" ? "The archive is empty." : "No rentals."}
      </p>
    );
  }
  const table = (r: RentalRow[]) => <RentalTable rows={r} tab={tab} cards={cards} />;
  if (tab === "archive") return table(rows);

  const { started, upcoming } = splitByStart(rows);
  return (
    <>
      <p className={`${styles.muted} ${styles.desktopOnly}`}>
        When a bike is back, press <b>Returned</b>; when everything is settled, <b>Archive</b> moves
        the rental to the archive. Drag the table sideways (or scroll with Shift) to see every
        column.
      </p>
      {!cards && (
        <p className={`${styles.muted} ${styles.phoneOnly} ${list.hint}`}>
          Swipe sideways for every column · tap a note to read it all
        </p>
      )}
      {started.length > 0 && (
        <>
          <h2 className={list.group}>
            On the road &amp; returned <span>({started.length}, soonest start first)</span>
          </h2>
          {table(started)}
        </>
      )}
      {upcoming.length > 0 && (
        <>
          <h2 className={list.group}>
            Upcoming <span>({upcoming.length}, soonest first)</span>
          </h2>
          {table(upcoming)}
        </>
      )}
    </>
  );
}

function RentalTable({ rows, tab, cards }: { rows: RentalRow[]; tab: RentalTab; cards: boolean }) {
  const year = Number(todayInSaigon().slice(0, 4));
  return (
    <DragScroll className={`${list.wrap} ${cards ? list.cards : ""}`}>
      <table className={list.table}>
        <thead>
          <tr>
            <th className={list.stickyCol}>Customer</th>
            <th className={list.statusCol}>Status</th>
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
            <RentalLine key={r.key} r={r} tab={tab} year={year} />
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

function RentalLine({ r, tab, year }: { r: RentalRow; tab: RentalTab; year: number }) {
  // Long notes are cut to a few lines on a phone; tapping one opens it
  // (drag-scroll.tsx). Empty fields are left out of a card.
  const cell = (label: string, value: string | null, wide = false) => (
    <td
      data-label={label}
      className={[wide ? list.wide : "", value ? "" : list.blank].join(" ").trim() || undefined}
      data-clamp={wide && value ? "" : undefined}
    >
      {value ? (
        wide ? (
          <div className={list.clamp}>{value}</div>
        ) : (
          value
        )
      ) : (
        <span className={list.empty}>–</span>
      )}
    </td>
  );
  const start = toIsoDate(r.startDate);
  const end = toIsoDate(r.endDate);
  const status = <span className={`${list.status} ${STATUS_CLASS[r.status]}`}>{r.status}</span>;
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
        <span className={list.statusInline}>{status}</span>
      </td>
      <td data-label="Status" className={list.statusCol}>
        <div>{status}</div>
      </td>
      <td data-label="Dates" className={list.dates}>
        <div className={list.longDates}>
          <span>{formatDisplayDate(start)}</span>
          <span>→ {formatDisplayDate(end)}</span>
          <span className={list.days}>{r.days} days</span>
        </div>
        <div className={list.shortDates}>
          <span className={list.range}>
            {formatShortDate(start, year)} → {formatShortDate(end, year)}
          </span>
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
  const year = Number(todayInSaigon().slice(0, 4));
  return (
    <DragScroll className={list.wrap}>
      <table className={list.table}>
        <thead>
          <tr>
            <th className={list.stickyCol}>Customer</th>
            <th className={styles.num}>Rentals</th>
            <th>Latest (or next) rental</th>
            <th>Country</th>
          </tr>
        </thead>
        <tbody>
          {customers.map((c) => (
            <tr key={c.id}>
              <td className={`${list.name} ${list.stickyCol}`}>
                <Link href={`/staff/customers/${c.id}`}>{c.name}</Link>
                {(c.onTheRoad || c.rentals > 1) && (
                  <span className={list.badges}>
                    {c.onTheRoad && (
                      <span className={`${list.status} ${list.road}`}>On the road</span>
                    )}
                    {c.rentals > 1 && <span className={styles.badge}>Returning</span>}
                  </span>
                )}
              </td>
              <td className={styles.num}>{c.rentals}</td>
              <td className={list.nowrap}>
                {c.lastRental ? (
                  <>
                    <span className={styles.desktopOnly}>
                      {formatDisplayDate(toIsoDate(c.lastRental.startDate))}
                    </span>
                    <span className={styles.phoneOnly}>
                      {formatShortDate(toIsoDate(c.lastRental.startDate), year)}
                    </span>
                    {" · "}
                    {c.lastRental.bikeModel.name}
                  </>
                ) : (
                  "No rental yet"
                )}
              </td>
              <td>{c.country ?? ""}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </DragScroll>
  );
}

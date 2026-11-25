// Oil changes: every rental out with a customer, due reminders first.
// Same rule as the old Notion "Oil reminders" tab (src/lib/oil.ts).

import Link from "next/link";
import { Suspense } from "react";
import { formatDisplayDate, toIsoDate } from "@/lib/dates";
import { db } from "@/lib/db";
import { linkBookingsToCustomers } from "@/server/customers";
import { oilList, type OilRow } from "@/server/oil";
import { requireStaff } from "@/server/staff-session";
import { RecordOilForm, SendReminderButton } from "./oil-forms";
import styles from "../../staff.module.css";

export default function OilPage(props: PageProps<"/staff/oil">) {
  return (
    <>
      <h1>Oil changes</h1>
      <p className={styles.muted}>
        Reminder 5 days after the last oil change (or pick-up), then every 2 days. When the customer
        tells you their km, save it: the next reminder moves to 2 days later. When the oil change is
        done, save it: the next reminder is 5 days after it.
      </p>
      <Suspense fallback={<p className={styles.muted}>Loading…</p>}>
        <OilRentals searchParams={props.searchParams} />
      </Suspense>
    </>
  );
}

async function OilRentals({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireStaff();
  const query = await searchParams;
  await linkBookingsToCustomers(db);
  const rows = await oilList(db);
  const due = rows.filter((r) => r.due && !r.endingSoon);
  const later = rows.filter((r) => !(r.due && !r.endingSoon));

  return (
    <>
      {typeof query.done === "string" && <p className={styles.success}>{query.done}</p>}
      {typeof query.error === "string" && <p className={styles.error}>{query.error}</p>}
      {rows.length === 0 && <p className={styles.muted}>No bikes out with customers right now.</p>}

      {due.length > 0 && <h2>Due today ({due.length})</h2>}
      {due.map((r) => (
        <OilCard key={r.id} row={r} />
      ))}

      {later.length > 0 && <h2>Not due yet</h2>}
      {later.map((r) => (
        <OilCard key={r.id} row={r} />
      ))}
    </>
  );
}

function OilCard({ row: r }: { row: OilRow }) {
  return (
    <article className={styles.panel}>
      <h2>
        <Link href={`/staff/bookings/${r.id}`}>{r.customerName}</Link>{" "}
        <span className={styles.muted}>
          · {r.bikeModel.name} {r.bike?.plate ?? ""}
        </span>
      </h2>
      <p>
        {r.due && !r.endingSoon && <span className={styles.badgeAlert}>Reminder due</span>}{" "}
        {r.overKm && <span className={styles.badgeAlert}>Over {r.bikeModel.oilIntervalKm} km</span>}{" "}
        {r.endingSoon && (
          <span className={styles.badge}>
            Back {formatDisplayDate(toIsoDate(r.endDate))}: no reminder needed
          </span>
        )}
      </p>
      <p className={styles.muted}>
        {r.daysSince} {r.daysSince === 1 ? "day" : "days"} since{" "}
        {r.oilChangedOn ? "the last oil change" : "pick-up"}
        {r.kmSinceOilChange != null ? ` · ${r.kmSinceOilChange} km reported` : ""}
        {r.oilReminderSentOn
          ? ` · last reminder ${formatDisplayDate(toIsoDate(r.oilReminderSentOn))}`
          : ""}
        {!r.due ? ` · next reminder ${formatDisplayDate(toIsoDate(r.next))}` : ""}
      </p>
      <div className={styles.row}>
        {r.due && !r.endingSoon && (
          <div>
            <SendReminderButton id={r.id} from="/staff/oil" hasPhone={r.whatsappUrl != null} />
            {r.whatsappUrl == null && r.customer && (
              <p>
                <Link href={`/staff/customers/${r.customer.id}`}>Add their WhatsApp number</Link>
              </p>
            )}
          </div>
        )}
        <RecordOilForm
          id={r.id}
          from="/staff/oil"
          oilChangedOn={r.oilChangedOn}
          kmSinceOilChange={r.kmSinceOilChange}
          intervalKm={r.bikeModel.oilIntervalKm}
        />
      </div>
    </article>
  );
}

// Oil changes: every rental out with a customer. Same rule as the old
// Notion "Oil reminders" tab (src/lib/oil.ts). Reminders due today come
// first as big cards with the WhatsApp button; the other rentals are short
// rows that open to record the km or an oil change; rentals coming back by
// tomorrow are last.

import Link from "next/link";
import { Suspense } from "react";
import { formatShortDate, parseIsoDate, toIsoDate, todayInSaigon } from "@/lib/dates";
import { db } from "@/lib/db";
import { linkBookingsToCustomers } from "@/server/customers";
import { oilList, type OilRow } from "@/server/oil";
import { requireStaff } from "@/server/staff-session";
import { KmMeter, RecordOilForm, SendReminderButton } from "./oil-forms";
import styles from "../../staff.module.css";
import oil from "./oil.module.css";

const DAY_MS = 86_400_000;

export default function OilPage(props: PageProps<"/staff/oil">) {
  return (
    <>
      <div className={oil.head}>
        <h1>Oil changes</h1>
        <details className={oil.rule}>
          <summary>How reminders work</summary>
          <p>
            Reminder 5 days after the last oil change (or pick-up), then every 2 days. When the
            customer tells you their km, save it: the next reminder moves to 2 days later. When the
            oil change is done, save it: the next reminder is 5 days after it. Bikes coming back
            today or tomorrow need no reminder.
          </p>
        </details>
      </div>
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
  const today = parseIsoDate(todayInSaigon())!;
  const due = rows.filter((r) => r.due && !r.endingSoon);
  const soon = rows.filter((r) => r.endingSoon);
  const later = rows.filter((r) => !r.due && !r.endingSoon);
  const overKm = rows.filter((r) => r.overKm).length;

  return (
    <>
      {typeof query.done === "string" && <p className={styles.success}>{query.done}</p>}
      {typeof query.error === "string" && <p className={styles.error}>{query.error}</p>}

      {rows.length === 0 ? (
        <p className={styles.muted}>No bikes out with customers right now.</p>
      ) : (
        <ul className={oil.stats}>
          <li className={due.length > 0 ? oil.statDue : undefined}>
            <b>{due.length}</b> due today
          </li>
          <li>
            <b>{rows.length}</b> {rows.length === 1 ? "bike" : "bikes"} on the road
          </li>
          {overKm > 0 && (
            <li className={oil.statDue}>
              <b>{overKm}</b> over the km rule
            </li>
          )}
          {soon.length > 0 && (
            <li>
              <b>{soon.length}</b> back by tomorrow
            </li>
          )}
        </ul>
      )}

      {rows.length > 0 && (
        <section>
          <h2 className={oil.groupTitle}>
            Due today {due.length > 0 && <span>({due.length})</span>}
          </h2>
          {due.length === 0 ? (
            <p className={oil.allClear}>✓ No reminder to send today.</p>
          ) : (
            <div className={oil.dueGrid}>
              {due.map((r) => (
                <DueCard key={r.id} r={r} today={today} />
              ))}
            </div>
          )}
        </section>
      )}

      {later.length > 0 && (
        <section>
          <h2 className={oil.groupTitle}>
            Not due yet <span>({later.length}, next reminder first)</span>
          </h2>
          <ul className={oil.rows}>
            {later.map((r) => (
              <OilLine key={r.id} r={r} today={today} />
            ))}
          </ul>
        </section>
      )}

      {soon.length > 0 && (
        <section>
          <h2 className={oil.groupTitle}>
            Coming back by tomorrow <span>(no reminder needed)</span>
          </h2>
          <ul className={`${oil.rows} ${oil.soon}`}>
            {soon.map((r) => (
              <OilLine key={r.id} r={r} today={today} />
            ))}
          </ul>
        </section>
      )}
    </>
  );
}

const days = (n: number) => `${n} ${n === 1 ? "day" : "days"}`;

/** "today", "tomorrow", "in 3 days"; past days are "overdue" (or "late"). */
function whenFrom(date: Date, today: Date, past = "overdue") {
  const n = Math.round((date.getTime() - today.getTime()) / DAY_MS);
  if (n < 0) return `${days(-n)} ${past}`;
  if (n === 0) return "today";
  if (n === 1) return "tomorrow";
  return `in ${days(n)}`;
}

function DueCard({ r, today }: { r: OilRow; today: Date }) {
  const year = today.getUTCFullYear();
  const late = Math.round((today.getTime() - r.next.getTime()) / DAY_MS);
  return (
    <article className={oil.card}>
      <header className={oil.cardHead}>
        <span className={oil.who}>
          <Link href={`/staff/bookings/${r.id}`} className={oil.name}>
            {r.customerName}
          </Link>
          <span className={oil.bike}>
            {r.bikeModel.name}
            {r.bike?.plate ? ` · ${r.bike.plate}` : ""}
          </span>
        </span>
        <span className={`${oil.pill} ${oil.pillDue}`}>
          {late > 0 ? `${days(late)} overdue` : "Due today"}
        </span>
      </header>

      <dl className={oil.facts}>
        <div>
          <dt>Since {r.oilChangedOn ? "oil change" : "pick-up"}</dt>
          <dd>{days(r.daysSince)}</dd>
        </div>
        <div>
          <dt>Km reported</dt>
          <dd>
            <KmMeter km={r.kmSinceOilChange} intervalKm={r.bikeModel.oilIntervalKm} />
          </dd>
        </div>
        <div>
          <dt>Last reminder</dt>
          <dd>
            {r.oilReminderSentOn ? (
              formatShortDate(toIsoDate(r.oilReminderSentOn), year)
            ) : (
              <span className={oil.none}>None yet</span>
            )}
          </dd>
        </div>
        <div>
          <dt>Back on</dt>
          <dd>{formatShortDate(toIsoDate(r.endDate), year)}</dd>
        </div>
      </dl>

      <SendReminderButton
        id={r.id}
        from="/staff/oil"
        hasPhone={r.whatsappUrl != null}
        customerId={r.customer?.id}
      />

      <details className={oil.replied}>
        <summary>Customer replied? Save their km or the oil change</summary>
        <RecordOilForm
          id={r.id}
          from="/staff/oil"
          oilChangedOn={r.oilChangedOn}
          kmSinceOilChange={r.kmSinceOilChange}
          intervalKm={r.bikeModel.oilIntervalKm}
        />
      </details>
    </article>
  );
}

/** One short row; tapping it opens the km and oil-change forms. */
function OilLine({ r, today }: { r: OilRow; today: Date }) {
  const year = today.getUTCFullYear();
  return (
    <li>
      <details>
        <summary className={oil.rowSummary}>
          <span className={`${oil.cell} ${oil.cellName}`}>
            <b>{r.customerName}</b>
            <small>
              {r.bikeModel.name}
              {r.bike?.plate ? ` · ${r.bike.plate}` : ""}
            </small>
          </span>
          <span className={`${oil.cell} ${oil.cellDays}`}>
            <small>Since {r.oilChangedOn ? "oil change" : "pick-up"}</small>
            {days(r.daysSince)}
          </span>
          <span className={`${oil.cell} ${oil.cellKm}`}>
            <small>Km reported</small>
            <KmMeter km={r.kmSinceOilChange} intervalKm={r.bikeModel.oilIntervalKm} />
          </span>
          <span className={`${oil.cell} ${oil.cellNext}`}>
            {r.endingSoon ? (
              <>
                <small>Back</small>
                {whenFrom(r.endDate, today, "late")}
              </>
            ) : (
              <>
                <small>Next reminder</small>
                <span>
                  {whenFrom(r.next, today)} · {formatShortDate(toIsoDate(r.next), year)}
                </span>
              </>
            )}
          </span>
          <span className={oil.open}>Record</span>
        </summary>
        <div className={oil.rowBody}>
          <div className={oil.rowLinks}>
            <Link href={`/staff/bookings/${r.id}`}>Open the rental →</Link>
            {r.oilReminderSentOn && (
              <span className={styles.muted}>
                Last reminder {formatShortDate(toIsoDate(r.oilReminderSentOn), year)}
              </span>
            )}
            <span className={styles.muted}>
              Back on {formatShortDate(toIsoDate(r.endDate), year)}
            </span>
          </div>
          <RecordOilForm
            id={r.id}
            from="/staff/oil"
            oilChangedOn={r.oilChangedOn}
            kmSinceOilChange={r.kmSinceOilChange}
            intervalKm={r.bikeModel.oilIntervalKm}
          />
        </div>
      </details>
    </li>
  );
}

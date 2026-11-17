// Owners only: profit per bike for a period (default: this month).

import Link from "next/link";
import { Suspense } from "react";
import { addDays, parseIsoDate, toIsoDate, todayInSaigon } from "@/lib/dates";
import { db } from "@/lib/db";
import { formatVnd } from "@/lib/money";
import { profitByBike } from "@/server/profit";
import { requireOwner } from "@/server/staff-session";
import styles from "../../staff.module.css";

export default function ProfitPage(props: PageProps<"/staff/profit">) {
  return (
    <>
      <h1>Profit per bike</h1>
      <Suspense fallback={<p className={styles.muted}>Adding it up…</p>}>
        <Profit searchParams={props.searchParams} />
      </Suspense>
    </>
  );
}

function monthBounds(anyDay: Date) {
  const start = new Date(Date.UTC(anyDay.getUTCFullYear(), anyDay.getUTCMonth(), 1));
  const end = addDays(new Date(Date.UTC(anyDay.getUTCFullYear(), anyDay.getUTCMonth() + 1, 1)), -1);
  return { start, end };
}

async function Profit({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireOwner();
  const query = await searchParams;
  const thisMonth = monthBounds(parseIsoDate(todayInSaigon())!);
  const from = (typeof query.from === "string" && parseIsoDate(query.from)) || thisMonth.start;
  const to = (typeof query.to === "string" && parseIsoDate(query.to)) || thisMonth.end;

  const rows = await profitByBike(db, from, to);
  const total = rows.reduce(
    (t, r) => ({
      rentals: t.rentals + r.rentals,
      rentalDays: t.rentalDays + r.rentalDays,
      revenueVnd: t.revenueVnd + r.revenueVnd,
      costVnd: t.costVnd + r.costVnd,
      profitVnd: t.profitVnd + r.profitVnd,
    }),
    { rentals: 0, rentalDays: 0, revenueVnd: 0, costVnd: 0, profitVnd: 0 },
  );

  const previous = monthBounds(addDays(from, -1));
  const next = monthBounds(addDays(to, 1));
  const range = (r: { start: Date; end: Date }) =>
    `/staff/profit?from=${toIsoDate(r.start)}&to=${toIsoDate(r.end)}`;

  return (
    <>
      <form className={`${styles.panel} ${styles.row}`} style={{ alignItems: "end" }}>
        <label className={styles.field}>
          <span>From</span>
          <input type="date" name="from" defaultValue={toIsoDate(from)} />
        </label>
        <label className={styles.field}>
          <span>To (included)</span>
          <input type="date" name="to" defaultValue={toIsoDate(to)} />
        </label>
        <div>
          <button className={styles.secondary}>Show</button>
        </div>
        <p style={{ margin: 0 }}>
          <Link href={range(previous)}>← Previous month</Link> ·{" "}
          <Link href={range(next)}>Next month →</Link>
        </p>
      </form>

      <div className={`${styles.panel} ${styles.tableWrap}`}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Bike</th>
              <th>Model</th>
              <th className={styles.num}>Rentals</th>
              <th className={styles.num}>Days out</th>
              <th className={styles.num}>Revenue</th>
              <th className={styles.num}>Repairs and incidents</th>
              <th className={styles.num}>Profit</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.bikeId}>
                <td>
                  <Link href={`/staff/bikes/${r.bikeId}`}>{r.plate}</Link>
                  {r.status === "RETIRED" && <span className={styles.badge}> retired</span>}
                </td>
                <td>{r.modelName}</td>
                <td className={styles.num}>{r.rentals}</td>
                <td className={styles.num}>{r.rentalDays}</td>
                <td className={styles.num}>{formatVnd(r.revenueVnd)}</td>
                <td className={styles.num}>{formatVnd(r.costVnd)}</td>
                <td
                  className={styles.num}
                  style={{ color: r.profitVnd < 0 ? "var(--lantern)" : undefined }}
                >
                  {formatVnd(r.profitVnd)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <th colSpan={2}>All bikes</th>
              <th className={styles.num}>{total.rentals}</th>
              <th className={styles.num}>{total.rentalDays}</th>
              <th className={styles.num}>{formatVnd(total.revenueVnd)}</th>
              <th className={styles.num}>{formatVnd(total.costVnd)}</th>
              <th className={styles.num}>{formatVnd(total.profitVnd)}</th>
            </tr>
          </tfoot>
        </table>
      </div>
      <p className={styles.muted}>
        Revenue counts rentals where the bike actually went out, in the period they started. Repairs
        count by the date they happened, minus anything charged back to customers. Kept deposits
        from cancellations will be added once online payments are recorded.
      </p>
    </>
  );
}

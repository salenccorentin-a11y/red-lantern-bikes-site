// Staff home: today's pick-ups and returns, then every bike's bookings and
// blocks on a calendar. ?from=YYYY-MM-DD moves the window.

import Link from "next/link";
import { Suspense } from "react";
import { placeInWindow, windowDays } from "@/lib/calendar";
import { CITY_NAME } from "@/lib/cities";
import { addDays, parseIsoDate, toIsoDate, todayInSaigon } from "@/lib/dates";
import { db } from "@/lib/db";
import { releaseExpiredHolds } from "@/server/bookings";
import { loadCalendar, todaysMovements, type CalendarBike } from "@/server/calendar";
import { requireStaff } from "@/server/staff-session";
import styles from "./calendar.module.css";
import staffStyles from "../staff.module.css";

const DAYS = 21;

export default function StaffHome(props: PageProps<"/staff">) {
  return (
    <Suspense fallback={<p className={staffStyles.muted}>Loading the calendar…</p>}>
      <Calendar searchParams={props.searchParams} />
    </Suspense>
  );
}

async function Calendar({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireStaff();
  const params = await searchParams;
  const today = parseIsoDate(todayInSaigon())!;
  const from = (typeof params.from === "string" && parseIsoDate(params.from)) || addDays(today, -2);

  // Unpaid holds that ran out shouldn't clutter the calendar.
  await releaseExpiredHolds(db);
  const [bikes, movements] = await Promise.all([
    loadCalendar(db, from, DAYS),
    todaysMovements(db, today),
  ]);
  const days = windowDays(from, DAYS);
  const weekBack = toIsoDate(addDays(from, -7));
  const weekOn = toIsoDate(addDays(from, 7));

  return (
    <>
      {params["owner-only"] && <p className={staffStyles.error}>That page is for owners only.</p>}

      <div className={styles.today}>
        <Movements title="Going out today" list={movements.pickups} empty="No pick-ups today." />
        <Movements title="Coming back today" list={movements.returns} empty="No returns today." />
      </div>

      <div className={styles.toolbar}>
        <h1>Calendar</h1>
        <div className={styles.toolbarLinks}>
          <Link href={`/staff?from=${weekBack}`}>← Week</Link>
          <Link href="/staff">Today</Link>
          <Link href={`/staff?from=${weekOn}`}>Week →</Link>
        </div>
        <Legend />
      </div>

      <div className={styles.scroller}>
        <div className={styles.grid} style={{ "--days": DAYS } as React.CSSProperties}>
          <div className={`${styles.corner} ${styles.head}`}>Bike</div>
          {days.map((day) => (
            <div
              key={day.getTime()}
              className={`${styles.head} ${styles.dayHead} ${day.getTime() === today.getTime() ? styles.todayCol : ""} ${isWeekend(day) ? styles.weekend : ""}`}
            >
              <span>{day.toLocaleDateString("en-GB", { weekday: "short", timeZone: "UTC" })}</span>
              <b>{day.getUTCDate()}</b>
            </div>
          ))}
          {bikes.map((bike, row) => (
            <BikeRow
              key={bike.id}
              bike={bike}
              row={row + 2}
              from={from}
              today={today}
              days={days}
            />
          ))}
        </div>
      </div>
    </>
  );
}

function BikeRow(props: {
  bike: CalendarBike;
  row: number;
  from: Date;
  today: Date;
  days: Date[];
}) {
  const { bike, row, from, today, days } = props;
  return (
    <>
      <Link
        href={`/staff/bikes/${bike.id}`}
        className={styles.bikeCell}
        style={{ gridRow: row }}
        title={bike.model.name}
      >
        <b>{bike.plate}</b>
        <span>{bike.model.name}</span>
      </Link>
      {days.map((day, i) => (
        <div
          key={day.getTime()}
          className={`${styles.cell} ${day.getTime() === today.getTime() ? styles.todayCol : ""} ${isWeekend(day) ? styles.weekend : ""}`}
          style={{ gridRow: row, gridColumn: i + 2 }}
        />
      ))}
      {bike.occupancies.map((o) => {
        const place = placeInWindow(o.startDate, o.endDate, from, DAYS);
        if (!place) return null;
        const style = { gridRow: row, gridColumn: `${place.column + 1} / span ${place.span}` };
        const classes = [
          styles.bar,
          styles[barClass(o.kind, o.booking?.status)],
          place.continuesBefore ? styles.continuesBefore : "",
          place.continuesAfter ? styles.continuesAfter : "",
        ].join(" ");

        if (o.kind === "BOOKING" && o.booking) {
          return (
            <Link
              key={o.id}
              href={`/staff/bookings/${o.booking.id}`}
              className={classes}
              style={style}
              title={`${o.booking.reference} · ${o.booking.customerName}`}
            >
              {o.booking.customerName}
            </Link>
          );
        }
        return (
          <Link
            key={o.id}
            href={`/staff/bikes/${bike.id}`}
            className={classes}
            style={style}
            title={o.note ?? undefined}
          >
            {o.kind === "TRANSIT" ? "Train back" : (o.note ?? "Maintenance")}
          </Link>
        );
      })}
    </>
  );
}

type Movement = Awaited<ReturnType<typeof todaysMovements>>["pickups"][number];

function Movements({ title, list, empty }: { title: string; list: Movement[]; empty: string }) {
  return (
    <section className={staffStyles.panel}>
      <h2>{title}</h2>
      {list.length === 0 ? (
        <p className={staffStyles.muted}>{empty}</p>
      ) : (
        <ul className={styles.movements}>
          {list.map((b) => (
            <li key={b.id}>
              <Link href={`/staff/bookings/${b.id}`}>
                <b>{b.customerName}</b> · {b.bikeModel.name} {b.bike?.plate ?? ""}
                {b.dropoffCity !== "SAIGON" && ` · to ${CITY_NAME[b.dropoffCity]}`}
                {b.status === "PENDING_PAYMENT" && (
                  <span className={staffStyles.badge}>deposit not paid</span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function Legend() {
  const items: [string, string][] = [
    ["pending", "Waiting for deposit"],
    ["confirmed", "Confirmed"],
    ["out", "Out with customer"],
    ["done", "Returned"],
    ["transit", "Train back"],
    ["maintenance", "Maintenance"],
  ];
  return (
    <ul className={styles.legend}>
      {items.map(([cls, label]) => (
        <li key={cls}>
          <span className={`${styles.swatch} ${styles[cls]}`} />
          {label}
        </li>
      ))}
    </ul>
  );
}

function barClass(kind: string, status?: string): string {
  if (kind === "MAINTENANCE") return "maintenance";
  if (kind === "TRANSIT") return "transit";
  switch (status) {
    case "PENDING_PAYMENT":
      return "pending";
    case "CHECKED_OUT":
      return "out";
    case "COMPLETED":
      return "done";
    default:
      return "confirmed";
  }
}

function isWeekend(day: Date) {
  return day.getUTCDay() === 0 || day.getUTCDay() === 6;
}

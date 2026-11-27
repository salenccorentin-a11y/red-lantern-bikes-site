// Staff home: today's pick-ups and returns, then every bike's bookings and
// blocks on a calendar. ?from=YYYY-MM-DD moves the window. Two views (the
// choice is remembered): Grid, bikes down the side and days across, and List,
// one block per day with who goes out, who comes back and which bikes are
// free; the list reads best on a phone.

import Link from "next/link";
import { Suspense } from "react";
import { countByModel, freeOn, placeInWindow, windowDays } from "@/lib/calendar";
import { CITY_NAME } from "@/lib/cities";
import {
  addDays,
  formatDisplayDate,
  formatSaigonDateTime,
  parseIsoDate,
  toIsoDate,
  todayInSaigon,
} from "@/lib/dates";
import { db } from "@/lib/db";
import { releaseExpiredHolds } from "@/server/bookings";
import { oilDueToday } from "@/server/oil";
import {
  loadCalendar,
  movementsBetween,
  todaysMovements,
  waitingRequests,
  type CalendarBike,
} from "@/server/calendar";
import { requireStaff } from "@/server/staff-session";
import { viewPreference } from "./view-pref";
import { ViewSwitch } from "./view-switch";
import styles from "./calendar.module.css";
import staffStyles from "../staff.module.css";

const DAYS = 21;
const LIST_DAYS = 14;
type View = "grid" | "list";
const VIEW_COOKIE = "staff_calendar_view";

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
  const view = await viewPreference<View>(VIEW_COOKIE, params.view, ["grid", "list"], "grid");
  const list = view === "list";
  const length = list ? LIST_DAYS : DAYS;
  const today = parseIsoDate(todayInSaigon())!;
  const from =
    (typeof params.from === "string" && parseIsoDate(params.from)) ||
    (list ? today : addDays(today, -2));

  // Requests that ran out unanswered shouldn't clutter the calendar.
  await releaseExpiredHolds(db);
  const [bikes, movements, requests, oilDue, window] = await Promise.all([
    loadCalendar(db, from, length),
    todaysMovements(db, today),
    waitingRequests(db),
    oilDueToday(db),
    list ? movementsBetween(db, from, addDays(from, length - 1)) : Promise.resolve([]),
  ]);
  const days = windowDays(from, length);
  const href = (v: View, start?: Date) =>
    `/staff?view=${v}${start ? `&from=${toIsoDate(start)}` : ""}`;
  const showsToday = days.some((d) => d.getTime() === today.getTime());
  // The day list starts with today's movements, so they aren't repeated.
  const listStartsToday = list && days[0].getTime() === today.getTime();
  const quietToday = movements.pickups.length + movements.returns.length === 0;

  return (
    <>
      {params["owner-only"] && <p className={staffStyles.error}>That page is for owners only.</p>}

      {requests.length > 0 && (
        <section className={staffStyles.panel}>
          <h2>Booking requests waiting for your answer</h2>
          <ul className={styles.movements}>
            {requests.map((b) => (
              <li key={b.id}>
                <Link href={`/staff/bookings/${b.id}`}>
                  <b>{b.customerName}</b> · {b.bikeModel.name} {b.bike?.plate ?? ""} ·{" "}
                  {formatDisplayDate(toIsoDate(b.startDate))} to{" "}
                  {formatDisplayDate(toIsoDate(b.endDate))}
                  {b.holdExpiresAt && (
                    <span className={staffStyles.badge}>
                      answer by {formatSaigonDateTime(b.holdExpiresAt)}
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {oilDue.length > 0 && (
        <section className={staffStyles.panel}>
          <h2>Oil reminders due today ({oilDue.length})</h2>
          <ul className={styles.movements}>
            {oilDue.map((r) => (
              <li key={r.id}>
                <Link href={`/staff/bookings/${r.id}`}>
                  <b>{r.customerName}</b> · {r.bikeModel.name} {r.bike?.plate ?? ""} · {r.daysSince}{" "}
                  days since {r.oilChangedOn ? "oil change" : "pick-up"}
                </Link>
              </li>
            ))}
          </ul>
          <p>
            <Link href="/staff/oil">Send them from the Oil page →</Link>
          </p>
        </section>
      )}

      {listStartsToday ? null : quietToday ? (
        <p className={styles.todayQuiet}>Today: nothing going out or coming back.</p>
      ) : (
        <div className={styles.today}>
          <Movements title="Going out today" list={movements.pickups} empty="No pick-ups today." />
          <Movements title="Coming back today" list={movements.returns} empty="No returns today." />
        </div>
      )}

      <div className={styles.toolbar}>
        <h1>Calendar</h1>
        <ViewSwitch
          cookie={VIEW_COOKIE}
          current={view}
          label="Show the calendar as"
          options={[
            { value: "grid", label: "Grid", href: href("grid") },
            { value: "list", label: "List", href: href("list") },
          ]}
        />
        <div className={styles.toolbarLinks}>
          <Link href={href(view, addDays(from, -7))}>← Week</Link>
          <Link href={href(view)} aria-current={showsToday ? "true" : undefined}>
            Today
          </Link>
          <Link href={href(view, addDays(from, 7))}>Week →</Link>
        </div>
        {!list && <Legend />}
      </div>

      {list ? (
        <DayList days={days} today={today} bikes={bikes} moves={window} />
      ) : (
        <Grid days={days} today={today} from={from} bikes={bikes} />
      )}
    </>
  );
}

function Grid({
  days,
  today,
  from,
  bikes,
}: {
  days: Date[];
  today: Date;
  from: Date;
  bikes: CalendarBike[];
}) {
  return (
    <>
      <div className={styles.scroller}>
        <div className={styles.grid} style={{ "--days": DAYS } as React.CSSProperties}>
          <div className={`${styles.corner} ${styles.head}`}>Bike</div>
          {days.map((day, i) => (
            <div
              key={day.getTime()}
              className={`${styles.head} ${styles.dayHead} ${day.getTime() === today.getTime() ? styles.todayCol : ""} ${isWeekend(day) ? styles.weekend : ""}`}
            >
              <small className={styles.month}>
                {i === 0 || day.getUTCDate() === 1
                  ? day.toLocaleDateString("en-GB", { month: "short", timeZone: "UTC" })
                  : ""}
              </small>
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

type WindowMove = Awaited<ReturnType<typeof movementsBetween>>[number];

function dayName(day: Date, today: Date) {
  const diff = Math.round((day.getTime() - today.getTime()) / 86_400_000);
  const date = day.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
  if (diff === 0) return { lead: "Today", date };
  if (diff === 1) return { lead: "Tomorrow", date };
  if (diff === -1) return { lead: "Yesterday", date };
  return { lead: null, date };
}

/** One block per day: who goes out, who comes back, which bikes are free. */
function DayList({
  days,
  today,
  bikes,
  moves,
}: {
  days: Date[];
  today: Date;
  bikes: CalendarBike[];
  moves: WindowMove[];
}) {
  return (
    <ol className={styles.dayList}>
      {days.map((day) => {
        const t = day.getTime();
        const out = moves.filter((m) => m.startDate.getTime() === t);
        const back = moves.filter((m) => m.endDate.getTime() === t);
        const blocks = bikes.flatMap((b) =>
          b.occupancies
            .filter((o) => o.kind === "MAINTENANCE" && o.startDate.getTime() === t)
            .map((o) => ({ bike: b, note: o.note })),
        );
        const free = freeOn(bikes, day);
        const name = dayName(day, today);
        const quiet = out.length === 0 && back.length === 0 && blocks.length === 0;
        return (
          <li
            key={t}
            className={`${styles.day} ${t === today.getTime() ? styles.dayIsToday : ""} ${t < today.getTime() ? styles.dayPast : ""}`}
          >
            <h2 className={styles.dayTitle}>
              <span>
                {name.lead && <b>{name.lead} · </b>}
                {name.date}
              </span>
              <span className={free.length === 0 ? styles.fullChip : styles.freeChip}>
                {free.length === 0 ? "No bike free" : `${free.length} of ${bikes.length} free`}
              </span>
            </h2>

            {quiet ? (
              <p className={styles.quiet}>Nothing going out or coming back.</p>
            ) : (
              <ul className={styles.dayItems}>
                {out.map((m) => (
                  <DayItem key={`o${m.id}`} m={m} kind="out" />
                ))}
                {back.map((m) => (
                  <DayItem key={`b${m.id}`} m={m} kind="back" />
                ))}
                {blocks.map(({ bike, note }) => (
                  <li key={`m${bike.id}`}>
                    <Link href={`/staff/bikes/${bike.id}`} className={styles.item}>
                      <span className={`${styles.tag} ${styles.maintenance}`}>Workshop</span>
                      <span className={styles.itemText}>
                        <b>
                          {bike.model.name} {bike.plate}
                        </b>
                        {note && <span>{note}</span>}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}

            {free.length > 0 && (
              <details className={styles.freeList}>
                <summary>Which bikes are free</summary>
                {countByModel(free)}
              </details>
            )}
          </li>
        );
      })}
    </ol>
  );
}

function DayItem({ m, kind }: { m: WindowMove; kind: "out" | "back" }) {
  const away = m.dropoffCity !== "SAIGON" ? CITY_NAME[m.dropoffCity] : null;
  const tag =
    kind === "out"
      ? { label: "Out", cls: m.status === "PENDING_PAYMENT" ? styles.pending : styles.confirmed }
      : { label: "Back", cls: m.status === "COMPLETED" ? styles.done : styles.out };
  return (
    <li>
      <Link href={`/staff/bookings/${m.id}`} className={styles.item}>
        <span className={`${styles.tag} ${tag.cls}`}>{tag.label}</span>
        <span className={styles.itemText}>
          <b>{m.customerName}</b>
          <span>
            {m.bikeModel.name} {m.bike?.plate ?? ""}
            {kind === "out" && ` · ${m.days} days`}
            {away && (kind === "out" ? ` · to ${away}` : ` · in ${away}`)}
          </span>
        </span>
        {kind === "out" && m.status === "PENDING_PAYMENT" && (
          <span className={staffStyles.badge}>request</span>
        )}
        {kind === "out" && m.status === "CHECKED_OUT" && (
          <span className={styles.itemDone}>gone ✓</span>
        )}
        {kind === "back" && m.status === "COMPLETED" && (
          <span className={styles.itemDone}>back ✓</span>
        )}
      </Link>
    </li>
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
                  <span className={staffStyles.badge}>not answered yet</span>
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
    ["pending", "Request, not answered yet"],
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

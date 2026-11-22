"use client";

// One control for the trip's dates: a button showing the pick-up day, the
// drop-off day and the trip length, which opens a calendar under it. The
// first tap on a day is the pick-up day, the second the drop-off day; days
// before today can't be chosen. It opens and closes without any animation,
// like everything else in the booking steps.
//
// Keyboard: arrow keys move day by day and week by week, Page Up / Page Down
// by four weeks, Enter or Space chooses, Escape closes.

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { DATE_LOCALE, type Locale } from "@/i18n/config";
import {
  addMonths,
  monthOf,
  monthWeeks,
  pickDay,
  shiftDay,
  tripDays,
  type DateRange,
} from "@/lib/date-range";
import { parseIsoDate } from "@/lib/dates";
import styles from "./DateRangePicker.module.css";

/** The first day of the week on each language's calendars: 0 Sunday, 1 Monday. */
const WEEK_STARTS_ON: Record<Locale, 0 | 1> = { en: 1, fr: 1, ko: 0, vi: 1 };
/** How far ahead the calendar goes. */
const MONTHS_AHEAD = 24;

export type DateRangeLabels = {
  pickUp: string;
  dropOff: string;
  /** In place of a day that isn't chosen yet. */
  placeholder: string;
  calendar: string;
  hintStart: string;
  hintEnd: string;
  prevMonth: string;
  nextMonth: string;
  close: string;
  /** Read out after a chosen day's date, e.g. "pick-up day". */
  dayPickUp: string;
  dayDropOff: string;
};

export function DateRangePicker(props: {
  range: DateRange;
  onChange: (range: DateRange) => void;
  /** Today in Saigon; earlier days can't be chosen. */
  today: string;
  lang: Locale;
  labels: DateRangeLabels;
  /** "8 days" */
  daysLabel: (days: number) => string;
  /** Shown under the calendar once both days are chosen. */
  lengthNote?: string | null;
}) {
  const { range, today, lang, labels } = props;
  const [open, setOpen] = useState(false);
  // The first month shown, and the day the arrow keys start from.
  const [view, setView] = useState(monthOf(today));
  const [focusDay, setFocusDay] = useState(today);
  // With a mouse: the day under the pointer, to preview the trip.
  const [hover, setHover] = useState<string | null>(null);
  const moveFocus = useRef(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const secondMonthRef = useRef<HTMLDivElement>(null);
  const panelId = useId();

  const format = useMemo(() => {
    const locale = DATE_LOCALE[lang];
    const make = (options: Intl.DateTimeFormatOptions) => {
      const formatter = new Intl.DateTimeFormat(locale, { ...options, timeZone: "UTC" });
      return (iso: string) => {
        const date = parseIsoDate(iso);
        return date ? formatter.format(date) : iso;
      };
    };
    const short = make({ weekday: "short", day: "numeric", month: "short" });
    const weekday = make({ weekday: "short" });
    return {
      /** "Tue 1 Dec" */
      short: (iso: string) => short(iso).replace(",", ""),
      /** "Tuesday 1 December 2026", read out for each day. */
      full: make({ weekday: "long", day: "numeric", month: "long", year: "numeric" }),
      month: make({ month: "long", year: "numeric" }),
      // 7 January 2024 was a Sunday.
      weekdays: Array.from({ length: 7 }, (_, i) =>
        weekday(`2024-01-${String(7 + WEEK_STARTS_ON[lang] + i).padStart(2, "0")}`),
      ),
    };
  }, [lang]);

  // After the arrow keys move to another day, or the calendar opens, put the
  // keyboard on that day.
  useEffect(() => {
    if (!open || !moveFocus.current) return;
    moveFocus.current = false;
    panelRef.current?.querySelector<HTMLButtonElement>('button[data-day][tabindex="0"]')?.focus();
  });

  const days = tripDays(range);
  const lastMonth = addMonths(monthOf(today), MONTHS_AHEAD);
  const months = [view, addMonths(view, 1)];
  const previewEnd = range.start && !range.end && hover && hover >= range.start ? hover : null;
  const rangeEnd = range.end || previewEnd;

  function toggle() {
    if (open) {
      setOpen(false);
      return;
    }
    const startAt = range.start && range.start >= today ? range.start : today;
    setView(monthOf(startAt));
    setFocusDay(startAt);
    setHover(null);
    moveFocus.current = true;
    setOpen(true);
  }

  function close() {
    setOpen(false);
    triggerRef.current?.focus();
  }

  function showMonth(month: string) {
    setView(month);
    // Keep the arrow keys' starting day inside the month on screen.
    if (monthOf(focusDay) !== month) {
      const first = `${month}-01`;
      setFocusDay(first < today ? today : first);
    }
  }

  function choose(day: string) {
    const next = pickDay(range, day, today);
    props.onChange(next);
    setFocusDay(day);
    if (next.end) close();
  }

  function onKeyDown(event: React.KeyboardEvent) {
    if (event.key === "Escape") {
      event.preventDefault();
      close();
      return;
    }
    const day = (event.target as HTMLElement).dataset?.day;
    const step = {
      ArrowLeft: -1,
      ArrowRight: 1,
      ArrowUp: -7,
      ArrowDown: 7,
      PageUp: -28,
      PageDown: 28,
    }[event.key];
    if (!day || !step) return;
    event.preventDefault();
    const target = shiftDay(day, step, today);
    const month = monthOf(target);
    if (month > lastMonth) return;
    // The second month is hidden on narrow screens (see the stylesheet).
    const twoMonths = secondMonthRef.current?.offsetParent != null;
    if (month < view) setView(month);
    else if (month > (twoMonths ? months[1] : view)) {
      setView(twoMonths ? addMonths(month, -1) : month);
    }
    setFocusDay(target);
    moveFocus.current = true;
  }

  const hint = !range.start ? labels.hintStart : !range.end ? labels.hintEnd : props.lengthNote;

  return (
    <div className={styles.picker}>
      <button
        ref={triggerRef}
        type="button"
        className={`${styles.trigger} ${open ? styles.triggerOpen : ""}`}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={toggle}
      >
        <span className={styles.end}>
          <span className={styles.endLabel}>{labels.pickUp}</span>
          <span className={range.start ? styles.endValue : styles.endEmpty}>
            {range.start ? format.short(range.start) : labels.placeholder}
          </span>
        </span>
        <span className={styles.length}>
          {days !== null && <span className={styles.pill}>{props.daysLabel(days)}</span>}
        </span>
        <span className={styles.end}>
          <span className={styles.endLabel}>{labels.dropOff}</span>
          <span className={range.end ? styles.endValue : styles.endEmpty}>
            {range.end ? format.short(range.end) : labels.placeholder}
          </span>
        </span>
      </button>

      {open && (
        <div
          ref={panelRef}
          id={panelId}
          className={styles.panel}
          role="group"
          aria-label={labels.calendar}
          onKeyDown={onKeyDown}
          onMouseLeave={() => setHover(null)}
        >
          <div className={styles.months}>
            <button
              type="button"
              className={`${styles.nav} ${styles.navPrev}`}
              aria-label={labels.prevMonth}
              disabled={view <= monthOf(today)}
              onClick={() => showMonth(addMonths(view, -1))}
            >
              <Chevron direction="left" />
            </button>
            <button
              type="button"
              className={`${styles.nav} ${styles.navNext}`}
              aria-label={labels.nextMonth}
              disabled={view >= lastMonth}
              onClick={() => showMonth(addMonths(view, 1))}
            >
              <Chevron direction="right" />
            </button>
            {months.map((month, index) => (
              <div
                key={month}
                ref={index === 1 ? secondMonthRef : undefined}
                className={index === 1 ? styles.monthSecond : undefined}
              >
                <table className={styles.month}>
                  <caption>{format.month(`${month}-01`)}</caption>
                  <thead>
                    <tr>
                      {format.weekdays.map((name) => (
                        <th key={name} scope="col">
                          {name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {monthWeeks(month, WEEK_STARTS_ON[lang]).map((week, row) => (
                      <tr key={row}>
                        {week.map((day, column) => {
                          if (!day) return <td key={column} />;
                          const isStart = day === range.start;
                          const isEnd = day === rangeEnd && Boolean(range.start);
                          const inRange =
                            Boolean(range.start && rangeEnd) &&
                            day > range.start &&
                            day < (rangeEnd as string);
                          const state = [
                            styles.day,
                            day === today ? styles.dayToday : "",
                            inRange ? styles.dayIn : "",
                            isStart ? styles.dayStart : "",
                            // The pick-up day keeps its own look while the pointer is still on it.
                            isEnd && day === range.end ? styles.dayEnd : "",
                            isEnd && day !== range.end && !isStart ? styles.dayPreview : "",
                            isStart && (!rangeEnd || rangeEnd === day) ? styles.dayAlone : "",
                          ].join(" ");
                          const role =
                            (isStart ? `, ${labels.dayPickUp}` : "") +
                            (day === range.end ? `, ${labels.dayDropOff}` : "");
                          return (
                            <td key={column}>
                              <button
                                type="button"
                                data-day={day}
                                className={state}
                                disabled={day < today}
                                tabIndex={day === focusDay ? 0 : -1}
                                aria-label={format.full(day) + role}
                                aria-pressed={isStart || day === range.end}
                                aria-current={day === today ? "date" : undefined}
                                onClick={() => choose(day)}
                                onMouseEnter={() => setHover(day)}
                              >
                                {Number(day.slice(8))}
                              </button>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
          <div className={styles.foot}>
            <p aria-live="polite">{hint}</p>
            <button type="button" className={styles.close} onClick={close}>
              {labels.close}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Chevron({ direction }: { direction: "left" | "right" }) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
      <path
        d={direction === "left" ? "M12.5 4.5 7 10l5.5 5.5" : "M7.5 4.5 13 10l-5.5 5.5"}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// The oil pieces used on the Oil page and on each booking page: the WhatsApp
// reminder button, the km meter, and the two forms.

import Link from "next/link";
import { formatShortDate, toIsoDate, todayInSaigon } from "@/lib/dates";
import { recordKmAction, recordOilChangeAction, sendOilReminderAction } from "./actions";
import styles from "../../staff.module.css";
import oil from "./oil.module.css";

/** Opens WhatsApp with the reminder ready, and notes it was sent today. */
export function SendReminderButton(props: {
  id: string;
  from: string;
  hasPhone: boolean;
  /** For the "add their number" link when there's no WhatsApp number. */
  customerId?: string | null;
}) {
  if (!props.hasPhone) {
    return (
      <p className={oil.noPhone}>
        No WhatsApp number for this customer.
        {props.customerId && (
          <Link href={`/staff/customers/${props.customerId}`}>Add their number →</Link>
        )}
      </p>
    );
  }
  return (
    <form action={sendOilReminderAction}>
      <input type="hidden" name="id" value={props.id} />
      <input type="hidden" name="from" value={props.from} />
      <button className={oil.whatsapp}>Send reminder on WhatsApp</button>
    </form>
  );
}

/** Km the customer reported, against the model's oil rule. */
export function KmMeter({ km, intervalKm }: { km: number | null; intervalKm: number }) {
  if (km == null) return <span className={oil.none}>Not reported</span>;
  const share = km / intervalKm;
  const level = share >= 1 ? oil.meterOver : share >= 0.75 ? oil.meterWarn : "";
  return (
    <span className={oil.meter}>
      <span className={`${oil.meterBar} ${level}`}>
        <span style={{ width: `${Math.min(share, 1) * 100}%` }} />
      </span>
      <span className={oil.meterText}>
        {km.toLocaleString("en-US")} / {intervalKm.toLocaleString("en-US")} km
      </span>
    </span>
  );
}

/**
 * Two separate forms (owner, 2026-11-26):
 * - Km reported: saves the km and moves the next reminder to 2 days from today.
 * - Oil change done: the next reminder is 5 days after the change; km cleared.
 */
export function RecordOilForm(props: {
  id: string;
  from: string;
  oilChangedOn: Date | null;
  kmSinceOilChange: number | null;
  intervalKm: number;
}) {
  const today = todayInSaigon();
  const year = Number(today.slice(0, 4));
  return (
    <div className={oil.forms}>
      <div className={oil.formsInner}>
        <form action={recordKmAction} className={oil.miniForm}>
          <input type="hidden" name="id" value={props.id} />
          <input type="hidden" name="from" value={props.from} />
          <label className={oil.miniLabel} htmlFor={`km-${props.id}`}>
            Km the customer reported
          </label>
          <div className={oil.miniRow}>
            <input
              id={`km-${props.id}`}
              type="text"
              inputMode="numeric"
              name="km"
              defaultValue={props.kmSinceOilChange ?? ""}
              placeholder="e.g. 500"
              required
            />
            <button className={styles.secondary}>Save km</button>
          </div>
          <p className={oil.hint}>
            Since the last oil change (rule: {props.intervalKm.toLocaleString("en-US")} km). Next
            reminder in 2 days.
          </p>
        </form>

        <form action={recordOilChangeAction} className={oil.miniForm}>
          <input type="hidden" name="id" value={props.id} />
          <input type="hidden" name="from" value={props.from} />
          <label className={oil.miniLabel} htmlFor={`oil-${props.id}`}>
            Oil change done
          </label>
          <div className={oil.miniRow}>
            <input id={`oil-${props.id}`} type="date" name="changedOn" max={today} />
            <button className={styles.secondary}>Save</button>
          </div>
          <p className={oil.hint}>
            Empty date = today. Next reminder 5 days after it.
            {props.oilChangedOn
              ? ` Last one: ${formatShortDate(toIsoDate(props.oilChangedOn), year)}.`
              : ""}
          </p>
        </form>
      </div>
    </div>
  );
}

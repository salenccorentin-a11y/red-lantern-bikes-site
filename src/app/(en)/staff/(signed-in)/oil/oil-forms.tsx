// The two oil forms, used on the Oil page and on each booking page.

import { formatDisplayDate, toIsoDate } from "@/lib/dates";
import { recordKmAction, recordOilChangeAction, sendOilReminderAction } from "./actions";
import styles from "../../staff.module.css";

/** Opens WhatsApp with the reminder ready, and notes it was sent today. */
export function SendReminderButton(props: { id: string; from: string; hasPhone: boolean }) {
  if (!props.hasPhone) {
    return <span className={styles.muted}>No WhatsApp number</span>;
  }
  return (
    <form action={sendOilReminderAction}>
      <input type="hidden" name="id" value={props.id} />
      <input type="hidden" name="from" value={props.from} />
      <button className={styles.primary}>Send reminder on WhatsApp</button>
    </form>
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
  return (
    <>
      <form action={recordKmAction} className={styles.inlineForm}>
        <input type="hidden" name="id" value={props.id} />
        <input type="hidden" name="from" value={props.from} />
        <label className={styles.field}>
          <span>
            Km since the last oil change (rule: {props.intervalKm.toLocaleString("en-US")} km)
          </span>
          <input
            type="text"
            inputMode="numeric"
            name="km"
            defaultValue={props.kmSinceOilChange ?? ""}
            placeholder="e.g. 500"
            required
          />
        </label>
        <div>
          <button className={styles.secondary}>Km reported: remind in 2 days</button>
        </div>
      </form>
      <form action={recordOilChangeAction} className={styles.inlineForm}>
        <input type="hidden" name="id" value={props.id} />
        <input type="hidden" name="from" value={props.from} />
        <label className={styles.field}>
          <span>
            Oil change date (empty = today)
            {props.oilChangedOn
              ? `. Last one: ${formatDisplayDate(toIsoDate(props.oilChangedOn))}`
              : ""}
          </span>
          <input type="date" name="changedOn" />
        </label>
        <div>
          <button className={styles.secondary}>Oil change done: remind 5 days later</button>
        </div>
      </form>
    </>
  );
}

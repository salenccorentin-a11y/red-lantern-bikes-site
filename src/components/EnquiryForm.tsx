"use client";

import { useActionState } from "react";
import { sendEnquiry, type EnquiryState } from "@/app/(public)/enquiry-actions";
import styles from "./EnquiryForm.module.css";

type Props = {
  kind: "TOUR" | "REVERSE_ROUTE" | "GENERAL";
  topic?: string;
  /** Ask for a start date and number of riders (tours and trips). */
  tripDetails?: boolean;
  messagePlaceholder?: string;
};

export function EnquiryForm({ kind, topic, tripDetails, messagePlaceholder }: Props) {
  const [state, action, pending] = useActionState<EnquiryState, FormData>(sendEnquiry, {});

  if (state.sent) {
    return (
      <p className={styles.sent} role="status">
        Thanks! Your message is with us, and we&apos;ll get back to you as soon as we can.
      </p>
    );
  }

  const invalid = (field: string) => (state.field === field ? true : undefined);

  return (
    <form action={action} className={styles.form}>
      <input type="hidden" name="kind" value={kind} />
      {topic && <input type="hidden" name="topic" value={topic} />}
      <div className={styles.row}>
        <label>
          <span>Your name</span>
          <input name="name" autoComplete="name" required aria-invalid={invalid("name")} />
        </label>
        <label>
          <span>Email</span>
          <input
            name="email"
            type="email"
            autoComplete="email"
            required
            aria-invalid={invalid("email")}
          />
        </label>
        <label>
          <span>Phone or WhatsApp (optional)</span>
          <input name="phone" type="tel" autoComplete="tel" />
        </label>
      </div>
      {tripDetails && (
        <div className={styles.row}>
          <label>
            <span>Preferred start date (optional)</span>
            <input name="preferredStart" type="date" aria-invalid={invalid("preferredStart")} />
          </label>
          <label>
            <span>Number of riders (optional)</span>
            <input name="riders" type="number" min={1} max={30} inputMode="numeric" />
          </label>
        </div>
      )}
      <label>
        <span>Your message</span>
        <textarea
          name="message"
          rows={5}
          required
          minLength={10}
          maxLength={3000}
          placeholder={messagePlaceholder}
          aria-invalid={invalid("message")}
        />
      </label>
      <label className={styles.honeypot} aria-hidden="true">
        Website
        <input name="website" tabIndex={-1} autoComplete="off" />
      </label>
      {state.error && <p className={styles.error}>{state.error}</p>}
      <div>
        <button className={styles.button} disabled={pending}>
          {pending ? "Sending…" : "Send message"}
        </button>
      </div>
    </form>
  );
}

"use client";

import { useActionState } from "react";
import { sendEnquiry, type EnquiryState } from "@/app/(en)/(public)/enquiry-actions";
import type { Messages } from "@/i18n/messages/en";
import styles from "./EnquiryForm.module.css";

type Props = {
  /** Wording in the page's language (passed in, so browsers get one language). */
  t: Messages["enquiry"];
  kind: "TOUR" | "REVERSE_ROUTE" | "GENERAL";
  topic?: string;
  /** Ask for a start date and number of riders (tours and trips). */
  tripDetails?: boolean;
  messagePlaceholder?: string;
};

export function EnquiryForm({ t, kind, topic, tripDetails, messagePlaceholder }: Props) {
  const [state, action, pending] = useActionState<EnquiryState, FormData>(sendEnquiry, {});

  if (state.sent) {
    return (
      <p className={styles.sent} role="status">
        {t.sent}
      </p>
    );
  }

  const invalid = (field: string) => (state.field === field ? true : undefined);
  // The server's message is in English; show the one for the field in this language.
  const errors = t.errors as Record<string, string>;
  const error = state.error ? (errors[state.field ?? "form"] ?? errors.form) : null;

  return (
    <form action={action} className={styles.form}>
      <input type="hidden" name="kind" value={kind} />
      {topic && <input type="hidden" name="topic" value={topic} />}
      <div className={styles.row}>
        <label>
          <span>{t.name}</span>
          <input name="name" autoComplete="name" required aria-invalid={invalid("name")} />
        </label>
        <label>
          <span>{t.email}</span>
          <input
            name="email"
            type="email"
            autoComplete="email"
            required
            aria-invalid={invalid("email")}
          />
        </label>
        <label>
          <span>{t.phone}</span>
          <input name="phone" type="tel" autoComplete="tel" />
        </label>
      </div>
      {tripDetails && (
        <div className={styles.row}>
          <label>
            <span>{t.start}</span>
            <input name="preferredStart" type="date" aria-invalid={invalid("preferredStart")} />
          </label>
          <label>
            <span>{t.riders}</span>
            <input name="riders" type="number" min={1} max={30} inputMode="numeric" />
          </label>
        </div>
      )}
      <label>
        <span>{t.message}</span>
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
      {error && <p className={styles.error}>{error}</p>}
      <div>
        <button className={styles.button} disabled={pending}>
          {pending ? t.sending : t.send}
        </button>
      </div>
    </form>
  );
}

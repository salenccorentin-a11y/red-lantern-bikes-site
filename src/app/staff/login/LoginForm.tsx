"use client";

import { useActionState } from "react";
import { requestLoginLink, type LoginRequestState } from "./actions";
import styles from "../staff.module.css";

export function LoginForm() {
  const [state, action, pending] = useActionState<LoginRequestState, FormData>(
    requestLoginLink,
    {},
  );

  if (state.sent) {
    return (
      <p role="status">
        If that email belongs to a staff member, a sign-in link is on its way. It works once, for 15
        minutes.
      </p>
    );
  }

  return (
    <form action={action} className={styles.form}>
      <label className={styles.field}>
        <span>Staff email</span>
        <input type="email" name="email" autoComplete="email" required />
      </label>
      {state.error && <p className={styles.error}>{state.error}</p>}
      <button className={styles.primary} disabled={pending}>
        {pending ? "Sending…" : "Email me a sign-in link"}
      </button>
    </form>
  );
}

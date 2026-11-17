// Opening the emailed link lands here. Signing in takes a button press, so
// email scanners that open links automatically can't use up the link.

import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { db } from "@/lib/db";
import { peekLoginToken } from "@/server/auth";
import { signInWithLink } from "../actions";
import styles from "../../staff.module.css";

export default function ConfirmPage(props: PageProps<"/staff/login/confirm">) {
  return (
    <main className={styles.narrow}>
      <h1>Staff sign-in</h1>
      <Suspense fallback={<p>Checking your link…</p>}>
        <Confirm searchParams={props.searchParams} />
      </Suspense>
    </main>
  );
}

async function Confirm({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { token } = await searchParams;
  await connection();
  const staff = typeof token === "string" ? await peekLoginToken(db, token) : null;

  if (!staff) {
    return (
      <>
        <p>This sign-in link has expired or was already used.</p>
        <p>
          <Link href="/staff/login">Get a new link</Link>
        </p>
      </>
    );
  }

  return (
    <form action={signInWithLink} className={styles.form}>
      <input type="hidden" name="token" value={token as string} />
      <p>Signing in as {staff.name}.</p>
      <button className={styles.primary}>Sign in</button>
    </form>
  );
}

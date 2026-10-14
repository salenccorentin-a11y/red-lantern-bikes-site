// Everything under /staff except the sign-in pages. The nav needs to know who
// is signed in, so it streams in behind Suspense; each page also checks the
// session itself, so a page is never shown just because the nav was.

import Link from "next/link";
import { Suspense } from "react";
import { requireStaff } from "@/server/staff-session";
import { signOut } from "./actions";
import styles from "../staff.module.css";

export default function SignedInLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className={styles.topbar}>
        <Link href="/staff" className={styles.logo}>
          Red Lantern <span>Staff</span>
        </Link>
        <Suspense fallback={<nav className={styles.nav} />}>
          <StaffNav />
        </Suspense>
      </header>
      <main className={styles.main}>{children}</main>
    </>
  );
}

async function StaffNav() {
  const staff = await requireStaff();
  const owner = staff.role === "OWNER";
  return (
    <nav className={styles.nav} aria-label="Staff">
      <Link href="/staff">Calendar</Link>
      <Link href="/staff/walk-in">Walk-in</Link>
      <Link href="/staff/bikes">Bikes</Link>
      {owner && <Link href="/staff/profit">Profit</Link>}
      {owner && <Link href="/staff/settings">Settings</Link>}
      <form action={signOut} className={styles.signOut}>
        <span className={styles.who}>{staff.name}</span>
        <button className={styles.linkButton}>Sign out</button>
      </form>
    </nav>
  );
}

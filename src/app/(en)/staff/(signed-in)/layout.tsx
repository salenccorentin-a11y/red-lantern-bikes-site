// Everything under /staff except the sign-in pages. The nav needs to know who
// is signed in, so it streams in behind Suspense; each page also checks the
// session itself, so a page is never shown just because the nav was.

import Link from "next/link";
import { Suspense } from "react";
import { requireStaff } from "@/server/staff-session";
import { signOut } from "./actions";
import { NavLinks } from "./nav-links";
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
      <div className={styles.navLinks}>
        <NavLinks
          links={[
            { href: "/staff", label: "Calendar" },
            { href: "/staff/walk-in", label: "Walk-in" },
            { href: "/staff/customers", label: "Customers" },
            { href: "/staff/oil", label: "Oil" },
            { href: "/staff/enquiries", label: "Enquiries" },
            { href: "/staff/bikes", label: "Bikes" },
            ...(owner
              ? [
                  { href: "/staff/profit", label: "Profit" },
                  { href: "/staff/settings", label: "Settings" },
                ]
              : []),
          ]}
        />
      </div>
      <form action={signOut} className={styles.signOut}>
        <span className={styles.who}>{staff.name}</span>
        <button className={styles.linkButton}>Sign out</button>
      </form>
    </nav>
  );
}

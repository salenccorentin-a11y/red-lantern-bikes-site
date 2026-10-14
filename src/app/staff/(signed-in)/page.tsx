import { connection } from "next/server";
import { Suspense } from "react";
import { requireStaff } from "@/server/staff-session";
import styles from "../staff.module.css";

export default function StaffHome() {
  return (
    <Suspense fallback={<p className={styles.muted}>Loading…</p>}>
      <Home />
    </Suspense>
  );
}

async function Home() {
  await connection();
  const staff = await requireStaff();
  return (
    <>
      <h1>Bookings calendar</h1>
      <p className={styles.muted}>Signed in as {staff.name}. The calendar comes next.</p>
    </>
  );
}

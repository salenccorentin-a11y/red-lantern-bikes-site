import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { db } from "@/lib/db";
import { todayInSaigon } from "@/lib/dates";
import { loadCatalog } from "@/server/catalog";
import { BookingForm } from "./BookingForm";
import styles from "./book.module.css";

export const metadata: Metadata = {
  title: "Book a motorbike | Red Lantern Bikes",
  description:
    "Rent a motorbike in Saigon or ride one-way to Hanoi or Da Nang. Live availability, clear prices, and a small online deposit.",
};

export default function BookPage() {
  return (
    <>
      <SiteHeader />
      <main className={styles.page}>
        <h1 className={styles.title}>Book your bike</h1>
        <Suspense fallback={<p className={styles.loading}>Loading bikes and prices…</p>}>
          <BookingLoader />
        </Suspense>
      </main>
    </>
  );
}

async function BookingLoader() {
  // Prices and availability must be current, so load them for each visit.
  await connection();
  const catalog = await loadCatalog(db);
  return <BookingForm catalog={catalog} today={todayInSaigon()} />;
}

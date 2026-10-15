import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { db } from "@/lib/db";
import { todayInSaigon } from "@/lib/dates";
import { loadCatalog } from "@/server/catalog";
import { BookingForm } from "./BookingForm";
import { PageHeader } from "@/components/PageHeader";
import styles from "./book.module.css";

export const metadata: Metadata = {
  alternates: { canonical: "/book" },
  title: "Book a motorbike | Red Lantern Bikes",
  description:
    "Rent a motorbike in Saigon or ride one-way to Hanoi or Da Nang. Live availability, clear prices, and a small online deposit.",
};

export default function BookPage(props: PageProps<"/book">) {
  return (
    <>
      <PageHeader
        title="Book your bike"
        intro="Choose your trip, dates and bike. You see the full price before you pay, and hold the bike with a small deposit."
      />
      <main className={styles.page}>
        <Suspense fallback={<p className={styles.loading}>Loading bikes and prices…</p>}>
          <BookingLoader searchParams={props.searchParams} />
        </Suspense>
      </main>
    </>
  );
}

async function BookingLoader({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  // Links like /book?model=honda-xr150&dropoff=HANOI preselect the trip.
  const query = await searchParams;
  // Prices and availability must be current, so load them for each visit.
  await connection();
  const catalog = await loadCatalog(db);
  const model = catalog.models.find((m) => m.slug === query.model);
  const dropoff = catalog.routes.find((r) => r.toCity === query.dropoff)?.toCity ?? "SAIGON";
  return (
    <BookingForm
      catalog={catalog}
      today={todayInSaigon()}
      initialModelId={model?.id ?? null}
      initialDropoff={dropoff}
    />
  );
}

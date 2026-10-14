import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { BikeCard } from "@/components/BikeCard";
import cardStyles from "@/components/BikeCard.module.css";
import { db } from "@/lib/db";
import { getSettings } from "@/server/availability";
import { listModels } from "@/server/fleet";
import styles from "../content.module.css";

export const metadata: Metadata = {
  title: "Our bikes: scooters, manuals and adventure bikes | Red Lantern Bikes",
  description:
    "Twelve models to rent in Saigon, from the Honda Wave to the Kawasaki Versys X300. Daily, weekly and monthly prices, one-way to Hanoi or Da Nang.",
};

export default function BikesPage() {
  return (
    <main className={styles.page}>
      <h1>Our bikes</h1>
      <p className={styles.lead}>
        From easy semi-automatics for the city to adventure bikes for the length of Vietnam. Every
        bike is serviced in our own shop before it goes out.
      </p>
      <p>
        Prices are per day. Rent for 7 days or more and the weekly rate applies to every day; from
        30 days, the monthly rate. <Link href="/faq#licence">Which licence do I need?</Link>
      </p>
      <Suspense fallback={<p className={styles.muted}>Loading bikes…</p>}>
        <AllBikes />
      </Suspense>
    </main>
  );
}

async function AllBikes() {
  await connection();
  const [models, settings] = await Promise.all([listModels(db), getSettings(db)]);
  return (
    <div className={cardStyles.grid}>
      {models.map((m) => (
        <BikeCard key={m.slug} model={m} usdRate={settings.usdToVndRate} />
      ))}
    </div>
  );
}

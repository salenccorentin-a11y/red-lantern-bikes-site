import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { BikeCard } from "@/components/BikeCard";
import cardStyles from "@/components/BikeCard.module.css";
import { PageHeader } from "@/components/PageHeader";
import ui from "@/components/ui.module.css";
import { db } from "@/lib/db";
import { getSettings } from "@/server/availability";
import { listModels } from "@/server/fleet";
import luggageReady from "../../../../public/photos/luggage-ready.webp";
import styles from "../content.module.css";

// Title kept from the old /shop page, which now redirects here.
export const metadata: Metadata = {
  alternates: { canonical: "/bikes" },
  title: "Rent a Motorbike in Saigon | Full Fleet | Red Lantern Bikes",
  description:
    "Twelve models to rent in Saigon, from the Honda Wave to the Kawasaki Versys X300. Daily, weekly and monthly prices, one-way to Hanoi or Da Nang.",
};

export default function BikesPage() {
  return (
    <>
      <PageHeader
        title="Our bikes"
        intro="From easy semi-automatics for the city to adventure bikes for the length of Vietnam. Every bike is serviced in our own shop."
        photo={{
          src: luggageReady,
          alt: "A bike loaded with luggage, ready for a long ride",
          position: "50% 55%",
        }}
      />
      <main className={ui.sectionMist}>
        <div className={styles.page}>
          <p className={styles.prose}>
            Prices are per day. From 7 days the weekly price applies to every day, and from 30 days
            the monthly price.{" "}
            <Link href="/faq#licence" className={ui.link}>
              Which licence do I need?
            </Link>
          </p>
          <Suspense fallback={<div style={{ minHeight: 900 }} />}>
            <AllBikes />
          </Suspense>
        </div>
      </main>
    </>
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

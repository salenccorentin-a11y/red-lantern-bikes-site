import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { BikeCard } from "@/components/BikeCard";
import cardStyles from "@/components/BikeCard.module.css";
import { ADDRESS_LINE, BUSINESS, mapsLink } from "@/content/business";
import { db } from "@/lib/db";
import { getSettings } from "@/server/availability";
import { listModels } from "@/server/fleet";
import styles from "./page.module.css";

// Title kept from the old site, which ranks for it.
export const metadata: Metadata = {
  title: "Motorbike Rental Saigon | Red Lantern Bikes – From $9/Day",
  // Kept from the old site, except "Book on WhatsApp" (booking is online now).
  description:
    "Rent a motorbike in Ho Chi Minh City from $9/day. Honda, Kawasaki & Suzuki fleet. One-way rental to Hanoi & Da Nang. Rated 4.9★ by 245+ riders. Book online.",
};

const FEATURED = ["wave-alpha-110", "honda-xr150", "honda-cb150x", "kawasaki-versys-x300"];

export default function Home() {
  return (
    <main>
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <p className={styles.eyebrow}>District 1, Saigon</p>
          <h1>Motorbike rental in Saigon, and one-way to Hanoi or Da Nang</h1>
          <p className={styles.lead}>
            Well-kept bikes, fair prices, and a team that answers WhatsApp wherever you are in
            Vietnam. Book online in a few minutes and pick up at our shop in District 1.
          </p>
          <div className={styles.actions}>
            <Link href="/book" className={styles.primary}>
              Book a bike
            </Link>
            <Link href="/one-way" className={styles.secondary}>
              One-way trips
            </Link>
          </div>
          <ul className={styles.trust}>
            <li>{BUSINESS.googleRating}★ on Google</li>
            <li>Helmet and gear included</li>
            <li>Roadside assistance anywhere in Vietnam</li>
          </ul>
        </div>
      </section>

      <div className={styles.page}>
        <section className={styles.section}>
          <h2>Three ways to ride</h2>
          <div className={styles.ways}>
            <Link href="/bikes" className={styles.way}>
              <h3>Rent in Saigon</h3>
              <p>
                By the day, week or month. Weekly and monthly rates make longer trips much cheaper
                per day.
              </p>
              <span>See the bikes →</span>
            </Link>
            <Link href="/one-way" className={styles.way}>
              <h3>One-way to Hanoi or Da Nang</h3>
              <p>
                Pick up in Saigon, ride north at your own pace and leave the bike at the end. We
                bring it home.
              </p>
              <span>How one-way works →</span>
            </Link>
            <Link href="/tours" className={styles.way}>
              <h3>Tours</h3>
              <p>
                Guided or self-guided routes, from the Mekong Delta to the length of the country.
              </p>
              <span>See the tours →</span>
            </Link>
          </div>
        </section>

        <section className={styles.section}>
          <h2>Popular bikes</h2>
          <Suspense fallback={<p className={styles.muted}>Loading prices…</p>}>
            <FeaturedBikes />
          </Suspense>
          <p>
            <Link href="/bikes">See all bikes →</Link>
          </p>
        </section>

        <section className={`${styles.section} ${styles.split}`}>
          <div>
            <h2>Included with every bike</h2>
            <ul className={styles.ticks}>
              {BUSINESS.included.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div>
            <h2>How it works</h2>
            <ol className={styles.steps}>
              <li>
                <b>Choose your dates and bike</b> on the booking page. You see the full price
                straight away.
              </li>
              <li>
                <b>Pay a small deposit online</b> to hold the bike. The rest is paid when you pick
                it up.
              </li>
              <li>
                <b>Pick up at our shop</b> in District 1. Bring your motorbike licence or
                International Driving Permit.
              </li>
              <li>
                <b>Ride.</b> Bring the bike back to us, or leave it in Hanoi or Da Nang on a one-way
                trip.
              </li>
            </ol>
          </div>
        </section>

        <section className={`${styles.section} ${styles.people}`}>
          <h2>Run by riders</h2>
          <p>
            {BUSINESS.founders.map((f) => f.name).join(" and ")} started Red Lantern to share the
            roads they love. {BUSINESS.founders[0].bio}
          </p>
          <p>
            <Link href="/about">About us →</Link>
          </p>
        </section>

        <section className={`${styles.section} ${styles.visit}`}>
          <h2>Visit the shop</h2>
          <p>
            {ADDRESS_LINE}
            <br />
            {BUSINESS.hours}
          </p>
          <p>
            <a href={mapsLink()} target="_blank" rel="noopener">
              Open in Google Maps
            </a>{" "}
            · <Link href="/contact">Contact us</Link>
          </p>
          <Link href="/book" className={styles.primary}>
            Book a bike
          </Link>
        </section>
      </div>
    </main>
  );
}

async function FeaturedBikes() {
  // Prices are edited by staff, so read them for each visit.
  await connection();
  const [models, settings] = await Promise.all([listModels(db), getSettings(db)]);
  const featured = FEATURED.flatMap((slug) => models.filter((m) => m.slug === slug));
  return (
    <div className={cardStyles.grid}>
      {featured.map((m) => (
        <BikeCard key={m.slug} model={m} usdRate={settings.usdToVndRate} />
      ))}
    </div>
  );
}

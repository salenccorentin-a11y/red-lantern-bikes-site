import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { BikeCard } from "@/components/BikeCard";
import cardStyles from "@/components/BikeCard.module.css";
import { LocalBusinessData } from "@/components/LocalBusinessData";
import { RiderWall } from "@/components/RiderWall";
import { OneWayTrips } from "@/components/oneway/OneWayTrips";
import { ShopMap } from "@/components/ShopMap";
import ui from "@/components/ui.module.css";
import { ADDRESS_LINE, BUSINESS, mapsLink } from "@/content/business";
import { db } from "@/lib/db";
import { getSettings } from "@/server/availability";
import { listModels } from "@/server/fleet";
import karstRoad from "../../../public/photos/karst-road.webp";
import mountainSunset from "../../../public/photos/mountain-sunset.webp";
import riverCrossing from "../../../public/photos/river-crossing.webp";
import saigonOpera from "../../../public/photos/saigon-opera.webp";
import styles from "./page.module.css";

// Title kept from the old site, which ranks for it.
export const metadata: Metadata = {
  alternates: { canonical: "/" },
  title: "Motorbike Rental Saigon | Red Lantern Bikes – From $9/Day",
  // Kept from the old site, except "Book on WhatsApp" (booking is online now).
  description:
    "Rent a motorbike in Ho Chi Minh City from $9/day. Honda, Kawasaki & Suzuki fleet. One-way rental to Hanoi & Da Nang. Rated 4.9★ by 245+ riders. Book online.",
};

const FEATURED = ["wave-alpha-110", "honda-xr150", "honda-cb150x", "kawasaki-versys-x300"];

const WAYS = [
  {
    href: "/bikes",
    title: "Rent in Saigon",
    text: "By the day, week or month. The longer you ride, the less each day costs.",
    photo: saigonOpera,
    alt: "A rider on a scooter in front of Saigon's Opera House",
  },
  {
    href: "/one-way",
    title: "One-way to Hanoi or Da Nang",
    text: "Ride north at your own pace and leave the bike at the end. We bring it home.",
    photo: riverCrossing,
    alt: "A rider and bike crossing a river on a small boat in northern Vietnam",
  },
  {
    href: "/tours",
    title: "Tours",
    text: "Guided or self-guided, from the Mekong Delta to the length of the country.",
    photo: mountainSunset,
    alt: "A rider on an adventure bike above a mountain valley at sunset",
  },
];

export default function Home() {
  return (
    <main>
      <LocalBusinessData />

      <section className={styles.hero}>
        <div className={styles.heroMedia}>
          <Image
            src={karstRoad}
            alt="A Red Lantern bike on an empty road through the karst mountains"
            fill
            priority
            placeholder="blur"
            sizes="(max-width: 900px) 100vw, 55vw"
            className={styles.heroPhoto}
          />
          <figure className={styles.heroQuote}>
            <blockquote>“A journey of a thousand miles begins with a single step.”</blockquote>
            <figcaption>Lao Tzu</figcaption>
          </figure>
        </div>
        <div className={styles.heroText}>
          <h1 className={styles.heroTitle}>
            Motorbike rental in Saigon, and one-way to Hanoi or Da Nang
          </h1>
          <p className={styles.lead}>
            Well-kept bikes, fair prices and a team that answers WhatsApp wherever you are in
            Vietnam. Book online in a few minutes and pick up in District 1.
          </p>
          <div className={ui.actions}>
            <Link href="/book" className={ui.primary}>
              Book a bike
            </Link>
            <Link href="/one-way" className={ui.ghostDark}>
              See one-way trips
            </Link>
          </div>
          <ul className={styles.trust}>
            <li>
              <Star /> {BUSINESS.googleRating} on Google
            </li>
            <li>Helmet and gear included</li>
            <li>Help on the road, anywhere in Vietnam</li>
          </ul>
        </div>
      </section>

      <OneWayTrips
        title="One-way trips"
        intro="Ride the length of Vietnam without riding back: the highlands, the central coast, the Hai Van Pass and the karst of the north. Leave the bike in Da Nang or Hanoi and we bring it home."
      />

      <section className={ui.section}>
        <div className={ui.container}>
          <h2 className={ui.sectionTitle}>Three ways to ride</h2>
          <div className={styles.ways}>
            {WAYS.map((way) => (
              <Link key={way.href} href={way.href} className={styles.way}>
                <Image
                  src={way.photo}
                  alt={way.alt}
                  fill
                  placeholder="blur"
                  sizes="(max-width: 760px) 100vw, 33vw"
                  className={styles.wayPhoto}
                />
                <span className={styles.wayText}>
                  <span className={styles.wayTitle}>{way.title}</span>
                  <span>{way.text}</span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className={`${ui.section} ${ui.sectionMist}`}>
        <div className={ui.container}>
          <h2 className={ui.sectionTitle}>Popular bikes</h2>
          <p className={ui.sectionIntro}>
            From an easy semi-automatic for the city to an adventure bike for the whole country.
          </p>
          <Suspense fallback={<div className={styles.bikesPlaceholder} />}>
            <FeaturedBikes />
          </Suspense>
          <p className={styles.after}>
            <Link href="/bikes" className={ui.ghostLight}>
              See all bikes
            </Link>
          </p>
        </div>
      </section>

      <section className={`${ui.section} ${ui.sectionNight}`}>
        <div className={ui.container}>
          <h2 className={ui.sectionTitle}>Riders who set off from our shop</h2>
          <p className={ui.sectionIntro}>
            Rated {BUSINESS.googleRating} on Google by the travellers who rode with us.
          </p>
          <RiderWall />
        </div>
      </section>

      <section className={ui.section}>
        <div className={`${ui.container} ${styles.split}`}>
          <div>
            <h2 className={styles.splitTitle}>Included with every bike</h2>
            <ul className={styles.ticks}>
              {BUSINESS.included.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className={styles.splitTitle}>How booking works</h2>
            <ol className={styles.steps}>
              <li>
                <b>Choose your dates and bike.</b> You see the full price straight away.
              </li>
              <li>
                <b>Pay a small deposit online</b> to hold the bike. The rest is paid at pick-up.
              </li>
              <li>
                <b>Pick up at our shop</b> in District 1 with your motorbike licence or
                International Driving Permit.
              </li>
              <li>
                <b>Ride.</b> Bring the bike back to us, or leave it in Hanoi or Da Nang.
              </li>
            </ol>
          </div>
        </div>
      </section>

      <section className={`${ui.section} ${ui.sectionMist}`}>
        <div className={`${ui.container} ${styles.visit}`}>
          <div>
            <h2 className={styles.splitTitle}>Run by riders, in District 1</h2>
            <p>
              {BUSINESS.founders.map((f) => f.name).join(" and ")} started Red Lantern to share the
              roads they love. {BUSINESS.founders[0].bio}
            </p>
            <p>
              <Link href="/about" className={ui.link}>
                Meet the team
              </Link>
            </p>
          </div>
          <div className={styles.shopCard}>
            <ShopMap />
            <h3>Visit the shop</h3>
            <p>
              {ADDRESS_LINE}
              <br />
              {BUSINESS.hours}
            </p>
            <div className={ui.actions}>
              <Link href="/book" className={ui.primary}>
                Book a bike
              </Link>
              <a href={mapsLink()} target="_blank" rel="noopener" className={ui.ghostLight}>
                Open in Google Maps
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function Star() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" className={styles.star}>
      <path
        fill="currentColor"
        d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3 6.1 20.6l1.3-6.6L2.5 9.4l6.6-.8z"
      />
    </svg>
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

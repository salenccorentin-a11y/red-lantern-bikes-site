import type { Metadata } from "next";
import Link from "next/link";
import { ADDRESS_LINE, BUSINESS, mapsLink } from "@/content/business";
import styles from "../content.module.css";

// Title kept from the old site.
export const metadata: Metadata = {
  title: "About Us | Red Lantern Bikes",
  description:
    "Red Lantern Bikes is run by riders Phi and Coco in District 1, Saigon: well-kept bikes, local knowledge and help on the road wherever you are in Vietnam.",
};

export default function AboutPage() {
  return (
    <main className={styles.page}>
      <h1>About us</h1>
      <div className={styles.prose}>
        <p className={styles.lead}>
          We&apos;re a small team of riders in District 1, Saigon. We started Red Lantern to share
          the roads we love, and to give travellers a bike they can trust and someone to call when
          they need help.
        </p>

        <h2>Who we are</h2>
        {BUSINESS.founders.map((f) => (
          <div key={f.name}>
            <h3>
              {f.name} <span className={styles.muted}>· {f.role}</span>
            </h3>
            <p>{f.bio}</p>
          </div>
        ))}

        <h2>How we work</h2>
        <ul>
          <li>
            <b>Bikes we&apos;d ride ourselves.</b> Every bike is serviced in our own shop.
          </li>
          <li>
            <b>Clear prices.</b> You see the full price before you book, with no hidden fees.
          </li>
          <li>
            <b>Help on the road.</b> Message us on WhatsApp from anywhere in Vietnam.
          </li>
          <li>
            <b>Local knowledge.</b> We&apos;ll help you plan a route that suits your time and your
            riding.
          </li>
        </ul>

        <h2>Visit us</h2>
        <p>
          {ADDRESS_LINE}
          <br />
          {BUSINESS.hours}
          <br />
          <a href={mapsLink()} target="_blank" rel="noopener">
            Open in Google Maps
          </a>
        </p>
      </div>
      <div className={styles.actions}>
        <Link href="/book" className={styles.primary}>
          Book a bike
        </Link>
        <Link href="/contact" className={styles.secondary}>
          Contact us
        </Link>
      </div>
    </main>
  );
}

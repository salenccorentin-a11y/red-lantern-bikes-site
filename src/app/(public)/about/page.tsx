import type { Metadata } from "next";
import Link from "next/link";
import { ADDRESS_LINE, BUSINESS, mapsLink } from "@/content/business";
import { PageHeader } from "@/components/PageHeader";
import { RiderWall } from "@/components/RiderWall";
import ui from "@/components/ui.module.css";
import saigonOpera from "../../../../public/photos/saigon-opera.webp";
import styles from "../content.module.css";
import about from "./about.module.css";

// Title kept from the old site.
export const metadata: Metadata = {
  alternates: { canonical: "/about" },
  title: "About Us | Red Lantern Bikes",
  description:
    "Red Lantern Bikes is run by riders Phi and Coco in District 1, Saigon: well-kept bikes, local knowledge and help on the road wherever you are in Vietnam.",
};

export default function AboutPage() {
  return (
    <>
      <PageHeader
        title="About us"
        intro="A small team of riders in District 1, Saigon. We started Red Lantern to share the roads we love, and to give travellers a bike they can trust and someone to call when they need help."
        photo={{
          src: saigonOpera,
          alt: "A rider in front of Saigon's Opera House",
          position: "50% 35%",
        }}
      />
      <main>
        <div className={`${styles.page} ${about.grid}`}>
          <div className={styles.prose}>
            <h2>Who we are</h2>
            {BUSINESS.founders.map((f) => (
              <div key={f.name} className={about.person}>
                <h3>{f.name}</h3>
                <p className={styles.muted}>{f.role}</p>
                <p>{f.bio}</p>
              </div>
            ))}

            <h2>How we work</h2>
            <ul className={about.principles}>
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
                <b>Local knowledge.</b> We&apos;ll help you plan a route that suits your time and
                your riding.
              </li>
            </ul>
          </div>

          <aside className={`${styles.box} ${styles.boxMist}`}>
            <h2>Visit us</h2>
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
          </aside>
        </div>

        <section className={`${ui.section} ${ui.sectionNight}`}>
          <div className={ui.container}>
            <h2 className={ui.sectionTitle}>Riders who set off from our shop</h2>
            <RiderWall />
          </div>
        </section>
      </main>
    </>
  );
}

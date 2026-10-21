import type { Metadata } from "next";
import Link from "next/link";
import { ADDRESS_LINE, BUSINESS } from "@/content/business";
import { PageHeader } from "@/components/PageHeader";
import styles from "../content.module.css";

export const metadata: Metadata = {
  alternates: { canonical: "/terms" },
  // Title kept from the old /terms page.
  title: "Terms & Conditions | Red Lantern Bikes",
  description: "The terms for renting a motorbike from Red Lantern Bikes in Saigon.",
};

// DRAFT. Written from the booking rules and the owner's answers (21 Oct 2026).
// Have it reviewed, ideally by a Vietnamese lawyer, before launch.

export default function TermsPage() {
  return (
    <>
      <PageHeader
        title="Terms & conditions"
        intro="The terms for renting a motorbike from Red Lantern Bikes."
      />
      <main className={styles.page}>
        <div className={styles.prose}>
          <p className={styles.draftNote}>Draft: to be reviewed before the site goes live.</p>

          <h2>1. Who we are</h2>
          <p>
            {BUSINESS.name}, {ADDRESS_LINE}, {BUSINESS.country}. &quot;We&quot; means Red Lantern
            Bikes; &quot;you&quot; means the person who books and rides the bike.
          </p>

          <h2>2. Booking and deposit</h2>
          <ul>
            <li>
              A booking is held once you pay the online deposit of 1,500,000₫, or the full price if
              it is lower. We hold the bike for 24 hours while the deposit arrives; if it
              doesn&apos;t arrive in time, the booking is released.
            </li>
            <li>The deposit is part of the rental price. The balance is paid when you pick up.</li>
            <li>
              <b>The deposit is non-refundable</b>, including if you cancel. Nothing beyond the
              deposit is owed for a cancellation.
            </li>
            <li>
              Rental days include both the pick-up day and the drop-off day. Returning early does
              not reduce the price.
            </li>
          </ul>

          <h2>3. Riders</h2>
          <ul>
            <li>
              You must hold a licence that is valid for the bike in Vietnam: see{" "}
              <Link href="/faq#licence">which licence do I need</Link>. You are responsible for
              riding legally.
            </li>
            <li>You must be 18 or older.</li>
            <li>
              At pick-up you leave a security deposit: your passport, or cash of US$300 for a
              scooter or US$500 for a motorcycle. It is returned when you bring the bike back.
            </li>
          </ul>

          <h2>4. One-way rentals</h2>
          <p>
            One-way rentals to Hanoi (at least 12 days) and Da Nang (at least 7 days) include a
            one-way fee that depends on the bike. The bike must be returned to our partner drop-off
            point in that city on the last day of the rental.
          </p>

          <h2>5. Looking after the bike</h2>
          <ul>
            <li>Ride safely, lock the bike, and follow Vietnamese traffic law.</li>
            <li>
              If the bike breaks down or is damaged, contact us straight away on WhatsApp before
              arranging repairs.
            </li>
            <li>
              Optional full coverage insurance, added when you book, is charged per day by bike
              size. It covers accidents, mechanical problems and flat tyres. It does not cover theft
              or loss of the bike, or any problem with the police or from breaking the law.
            </li>
            <li>
              Without insurance, we cover engine failures only. Theft, accidents and all other
              repairs are paid by the rider.
            </li>
            <li>
              Rented premium helmets and gloves are returned with the bike at the end of the rental.
            </li>
          </ul>

          <h2>6. Returning the bike</h2>
          <ul>
            <li>Return the bike on the agreed day, at our shop or the agreed drop-off point.</li>
            <li>
              Late returns are charged for each extra day at the daily rate in your rental contract,
              added at the end of the rental.
            </li>
            <li>We don&apos;t check the fuel level or ask you to clean the bike.</li>
          </ul>

          <h2>7. Contact</h2>
          <p>
            Questions about these terms: <Link href="/contact">contact us</Link>.
          </p>
        </div>
      </main>
    </>
  );
}

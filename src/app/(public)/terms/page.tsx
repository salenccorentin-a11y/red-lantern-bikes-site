import type { Metadata } from "next";
import Link from "next/link";
import { ADDRESS_LINE, BUSINESS } from "@/content/business";
import styles from "../content.module.css";

export const metadata: Metadata = {
  // Title kept from the old /terms page.
  title: "Terms & Conditions | Red Lantern Bikes",
  description: "The terms for renting a motorbike from Red Lantern Bikes in Saigon.",
};

// DRAFT. Written from the booking rules decided for the new site. Have it
// reviewed (ideally by a Vietnamese lawyer) before launch, and fill in the
// points marked "To confirm".

export default function TermsPage() {
  return (
    <main className={styles.page}>
      <div className={styles.prose}>
        <h1>Rental terms</h1>
        <p className={styles.draftNote}>
          Draft: to be reviewed before the site goes live. Items marked &quot;To confirm&quot; are
          not decided yet.
        </p>

        <h2>1. Who we are</h2>
        <p>
          {BUSINESS.name}, {ADDRESS_LINE}, {BUSINESS.country}. &quot;We&quot; means Red Lantern
          Bikes; &quot;you&quot; means the person who books and rides the bike.
        </p>

        <h2>2. Booking and deposit</h2>
        <ul>
          <li>
            A booking is held once you pay the online deposit of 1,500,000₫, or the full price if it
            is lower. We hold the bike for 24 hours while the deposit arrives; if it doesn&apos;t
            arrive in time, the booking is released.
          </li>
          <li>The deposit is part of the rental price. The balance is paid when you pick up.</li>
          <li>
            <b>The deposit is non-refundable</b>, including if you cancel. Nothing beyond the
            deposit is owed for a cancellation.
          </li>
          <li>
            Rental days include both the pick-up day and the drop-off day. Returning early does not
            reduce the price.
          </li>
        </ul>

        <h2>3. Riders</h2>
        <ul>
          <li>
            You must hold a licence that is valid for the bike in Vietnam: see{" "}
            <Link href="/faq#licence">which licence do I need</Link>. You are responsible for riding
            legally.
          </li>
          <li>
            To confirm: minimum age, documents to show at pick-up, and whether a security deposit or
            document is held during the rental.
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
            To confirm: who pays for damage, theft, traffic fines and repairs during the rental, and
            what optional insurance covers.
          </li>
        </ul>

        <h2>6. Returning the bike</h2>
        <ul>
          <li>Return the bike on the agreed day, at our shop or the agreed drop-off point.</li>
          <li>To confirm: late returns, fuel level on return, and cleaning.</li>
        </ul>

        <h2>7. Contact</h2>
        <p>
          Questions about these terms: <Link href="/contact">contact us</Link>.
        </p>
      </div>
    </main>
  );
}

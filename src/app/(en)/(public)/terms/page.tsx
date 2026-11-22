import type { Metadata } from "next";
import Link from "next/link";
import { ADDRESS_LINE, BUSINESS } from "@/content/business";
import { PageHeader } from "@/components/PageHeader";
import styles from "../content.module.css";
import { shareMetadata } from "@/seo/share";

export const metadata: Metadata = {
  alternates: { canonical: "/terms" },
  ...shareMetadata({ path: "/terms" }),
  // Title kept from the old /terms page.
  title: "Terms & Conditions | Red Lantern Bikes",
  description: "The terms for renting a motorbike from Red Lantern Bikes in Saigon.",
};

// DRAFT. Written from the booking rules and the owner's answers (21 Oct 2026).
// Insurance, return hours and late returns follow the rental contract of
// 11 Nov 2026. The fine amounts stay in the contract, not on the site (owner,
// 16 Nov 2026). Have it reviewed, ideally by a Vietnamese lawyer, before launch.

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
              You send a booking request on this website, which costs nothing. We hold the bike
              while we check your request and answer by email within 24 hours. The booking is
              confirmed once we accept it; if we can&apos;t answer in time, the request lapses and
              the bike is released.
            </li>
            <li>
              Once your booking is confirmed, we contact you to arrange a deposit of 1,500,000₫, or
              the full price if it is lower. The deposit is part of the rental price. The balance is
              paid when you pick up.
            </li>
            <li>
              <b>The deposit is non-refundable</b> once paid, including if you cancel. Nothing
              beyond the deposit is owed for a cancellation.
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
            point in that city on the last day of the rental. Drop-off in Da Lat, Hue or Nha Trang
            can&apos;t be booked online, but we can arrange it on request.
          </p>

          <h2>5. Looking after the bike</h2>
          <ul>
            <li>Ride safely, lock the bike, and follow Vietnamese traffic law.</li>
            <li>
              If the bike breaks down or is damaged, contact us on WhatsApp before any repair
              starts.
            </li>
            <li>
              Optional full coverage insurance, added when you book, is charged per day by bike
              size. It covers accidents on the road, flat tyres, and mechanical problems that come
              from the bike, unless the rider caused them. It does not cover theft, police matters,
              floods, damage to third parties, or health problems.
            </li>
            <li>
              The insurance only applies if every oil change during the rental is done properly and,
              each time, you send us a photo of the mechanic doing it and a photo of the full
              odometer.
            </li>
            <li>
              It also only applies if you contact us before any repair. We do not pay for a repair
              if you contact us once a mechanic has already started on the bike, or after the repair
              is done.
            </li>
            <li>
              Without insurance, we cover engine failures only. Theft, accidents and all other
              repairs are paid by the rider.
            </li>
            <li>
              Rented premium helmets are returned with the bike at the end of the rental. Gloves are
              bought, so you keep them.
            </li>
          </ul>

          <h2>6. Returning the bike</h2>
          <ul>
            <li>Return the bike on the agreed day, at our shop or the agreed drop-off point.</li>
            <li>
              The drop-off points in Da Nang and Hanoi take bikes back between 9am and 4pm. In Ho
              Chi Minh City, return times are more flexible: agree yours with us.
            </li>
            <li>Late returns are charged per hour, at the rate set in your rental contract.</li>
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

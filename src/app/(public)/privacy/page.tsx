import type { Metadata } from "next";
import Link from "next/link";
import { ADDRESS_LINE, BUSINESS } from "@/content/business";
import { PageHeader } from "@/components/PageHeader";
import styles from "../content.module.css";

export const metadata: Metadata = {
  alternates: { canonical: "/privacy" },
  title: "Privacy | Red Lantern Bikes",
  description:
    "What personal data Red Lantern Bikes collects, why, and how to contact us about it.",
};

// DRAFT. Describes what the site actually does with personal data. Have it
// reviewed before launch, including against Vietnam's personal data rules
// (Decree 13/2023/ND-CP and later law).

export default function PrivacyPage() {
  return (
    <>
      <PageHeader
        title="Privacy"
        intro="What personal data we collect, why, and how to reach us about it."
      />
      <main className={styles.page}>
        <div className={styles.prose}>
          <p className={styles.draftNote}>Draft: to be reviewed before the site goes live.</p>

          <h2>Who is responsible</h2>
          <p>
            {BUSINESS.name}, {ADDRESS_LINE}, {BUSINESS.country}.
          </p>

          <h2>What we collect</h2>
          <ul>
            <li>
              <b>When you book:</b> your name, email address, phone or WhatsApp number, your note to
              us, and the details of your booking (bike, dates, route, price, payments).
            </li>
            <li>
              <b>When you send a message:</b> your name, email, phone if you give it, and what you
              write.
            </li>
            <li>
              <b>When you visit the site:</b> our hosting provider keeps standard server logs (such
              as IP address and pages requested) for security. We don&apos;t use advertising or
              tracking cookies.
            </li>
          </ul>

          <h2>Why we use it</h2>
          <ul>
            <li>To hold your bike, take payment and prepare your rental.</li>
            <li>To contact you about your booking or answer your message.</li>
            <li>To keep the records a business must keep, and to deal with damage or disputes.</li>
          </ul>
          <p>We don&apos;t sell your data or use it for advertising.</p>

          <h2>Who else handles it</h2>
          <ul>
            <li>Railway, which hosts our website and database in Singapore.</li>
            <li>Resend, which sends our booking emails.</li>
            <li>
              Cloudflare, which manages our domain name and forwards the emails sent to our booking
              address.
            </li>
            <li>Notion, where we keep our private archive of past rentals.</li>
            <li>
              Umami, which counts visits to our pages without cookies and without collecting
              personal data. Booking page addresses are shortened before they are counted, so your
              private booking link is never sent.
            </li>
            <li>
              Sentry, which tells us when something breaks on the site. Error reports contain
              technical details (such as the page and browser), not your name or booking details.
            </li>
            <li>
              Google, whose map of our shop is shown on the home page. When the map loads, Google
              receives your request and may set its own cookies, under Google&apos;s privacy policy.
            </li>
            <li>Your bank or e-wallet provider, when you pay a deposit.</li>
          </ul>

          <h2>How long we keep it</h2>
          <p>
            We keep your booking details (your name, contact details, note and booking) on this site
            until your rental is over. Then we move them to our private archive of past rentals and
            remove them from the website&apos;s database.
          </p>

          <h2>Your choices</h2>
          <p>
            You can ask us what we hold about you, ask us to correct it, or ask us to delete it
            where we&apos;re not required to keep it. <Link href="/contact">Contact us</Link>.
          </p>
        </div>
      </main>
    </>
  );
}

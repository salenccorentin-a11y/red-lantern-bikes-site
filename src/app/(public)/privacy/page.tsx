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
              <b>When you book:</b> your name, email address, phone or WhatsApp number if you give
              it, your note to us, and the details of your booking (bike, dates, route, price,
              payments).
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
              Google, whose map of our shop is shown on the home page. When the map loads, Google
              receives your request and may set its own cookies, under Google&apos;s privacy policy.
            </li>
            <li>Your bank or e-wallet provider, when you pay a deposit.</li>
          </ul>

          <h2>How long we keep it</h2>
          <p>
            To confirm: how long booking records and messages are kept (typically as long as
            accounting rules require).
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

import type { Metadata } from "next";
import { Suspense } from "react";
import { EnquiryForm } from "@/components/EnquiryForm";
import { LocalBusinessData } from "@/components/LocalBusinessData";
import { ADDRESS_LINE, BUSINESS, mapsLink, whatsappLink } from "@/content/business";
import { PageHeader } from "@/components/PageHeader";
import styles from "../content.module.css";

export const metadata: Metadata = {
  alternates: { canonical: "/contact" },
  title: "Contact | Red Lantern Bikes",
  description: `Find Red Lantern Bikes at ${ADDRESS_LINE}. Send us a message about rentals, one-way trips or tours.`,
};

export default function ContactPage(props: PageProps<"/contact">) {
  const whatsapp = whatsappLink("Hi Red Lantern Bikes!");
  return (
    <>
      <PageHeader
        title="Contact us"
        intro="Questions about bikes, routes or a trip you're planning? Send us a message, or come and see us in District 1."
      />
      <main className={styles.page}>
        <LocalBusinessData />
        <div className={styles.twoCol}>
          <div>
            <Suspense fallback={<EnquiryForm kind="GENERAL" />}>
              <ContactForm searchParams={props.searchParams} />
            </Suspense>
          </div>
          <section className={`${styles.box} ${styles.boxMist}`}>
            <h2>The shop</h2>
            <p>
              {ADDRESS_LINE}
              <br />
              {BUSINESS.hours}
            </p>
            <p>
              <a href={mapsLink()} target="_blank" rel="noopener">
                Open in Google Maps
              </a>
            </p>
            {(whatsapp || BUSINESS.phone || BUSINESS.email) && <h2>Other ways to reach us</h2>}
            {whatsapp && (
              <p>
                <a href={whatsapp}>Message us on WhatsApp</a>
              </p>
            )}
            {BUSINESS.phone && (
              <p>
                <a href={`tel:${BUSINESS.phone.replace(/\s/g, "")}`}>{BUSINESS.phone}</a>
              </p>
            )}
            {BUSINESS.email && (
              <p>
                <a href={`mailto:${BUSINESS.email}`}>{BUSINESS.email}</a>
              </p>
            )}
          </section>
        </div>
      </main>
    </>
  );
}

/** /contact?about=reverse comes from the booking page: trips starting up north. */
async function ContactForm({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { about } = await searchParams;
  if (about === "reverse") {
    return (
      <>
        <p>
          Want to start in Hanoi or Da Nang and ride to Saigon? Tell us where you&apos;d like to
          start, your dates and the bike you&apos;re after, and we&apos;ll check what we can do.
        </p>
        <EnquiryForm
          kind="REVERSE_ROUTE"
          tripDetails
          messagePlaceholder="e.g. Hanoi to Saigon, starting 3 December, about 3 weeks, Honda XR150."
        />
      </>
    );
  }
  return (
    <>
      <EnquiryForm kind="GENERAL" />
    </>
  );
}

// The FAQ and contact pages, in any language.

import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import styles from "@/app/(public)/content.module.css";
import { EnquiryForm } from "@/components/EnquiryForm";
import { LocalBusinessData } from "@/components/LocalBusinessData";
import { PageHeader } from "@/components/PageHeader";
import ui from "@/components/ui.module.css";
import { ADDRESS_LINE, BUSINESS, mapsLink, whatsappLink } from "@/content/business";
import { faqFor, getMessages, hoursFor } from "@/i18n";
import { fill, OG_LOCALE, type Locale } from "@/i18n/config";
import { languageAlternates, localize } from "@/i18n/paths";

export function faqMetadata(lang: Locale): Metadata {
  const t = getMessages(lang).faq;
  return {
    title: t.metaTitle,
    description: t.metaDescription,
    alternates: languageAlternates(lang, "/faq"),
    openGraph: { locale: OG_LOCALE[lang] },
  };
}

export function FaqView({ lang }: { lang: Locale }) {
  const t = getMessages(lang).faq;
  const faq = faqFor(lang);
  return (
    <>
      <PageHeader title={t.title} intro={t.intro} />
      <main className={styles.page}>
        <div className={`${styles.prose} ${styles.faq}`}>
          {faq.map((item) => (
            <details key={item.id} id={item.id}>
              <summary>{item.question}</summary>
              {item.answer.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </details>
          ))}
        </div>
        <p className={styles.prose} style={{ marginTop: 32 }}>
          {t.somethingElse}{" "}
          <Link href={localize(lang, "/contact")} className={ui.link}>
            {t.sendMessage}
          </Link>
          .
        </p>
        <script
          type="application/ld+json"
          // Lets search engines show these answers directly in results.
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              inLanguage: lang,
              mainEntity: faq.map((item) => ({
                "@type": "Question",
                name: item.question,
                acceptedAnswer: { "@type": "Answer", text: item.answer.join(" ") },
              })),
            }).replace(/</g, "\\u003c"),
          }}
        />
      </main>
    </>
  );
}

export function contactMetadata(lang: Locale): Metadata {
  const t = getMessages(lang).contact;
  return {
    title: t.metaTitle,
    description: fill(t.metaDescription, { address: ADDRESS_LINE }),
    alternates: languageAlternates(lang, "/contact"),
    openGraph: { locale: OG_LOCALE[lang] },
  };
}

export function ContactView({
  lang,
  searchParams,
}: {
  lang: Locale;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const m = getMessages(lang);
  const t = m.contact;
  const whatsapp = whatsappLink(t.whatsappMessage);
  return (
    <>
      <PageHeader title={t.title} intro={t.intro} />
      <main className={styles.page}>
        <LocalBusinessData />
        <div className={styles.twoCol}>
          <div>
            <Suspense fallback={<EnquiryForm t={m.enquiry} kind="GENERAL" />}>
              <ContactForm lang={lang} searchParams={searchParams} />
            </Suspense>
          </div>
          <section className={`${styles.box} ${styles.boxMist}`}>
            <h2>{t.shop}</h2>
            <p>
              {ADDRESS_LINE}
              <br />
              {hoursFor(lang)}
            </p>
            <p>
              <a href={mapsLink()} target="_blank" rel="noopener">
                {m.common.openMaps}
              </a>
            </p>
            {(whatsapp || BUSINESS.phone || BUSINESS.email) && <h2>{t.otherWays}</h2>}
            {whatsapp && (
              <p>
                <a href={whatsapp} data-umami-event="WhatsApp">
                  {t.whatsapp}
                </a>
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

/** ?about=reverse comes from the booking page: trips starting up north. */
async function ContactForm({
  lang,
  searchParams,
}: {
  lang: Locale;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { about } = await searchParams;
  const m = getMessages(lang);
  if (about === "reverse") {
    return (
      <>
        <p>{m.contact.reverseIntro}</p>
        <EnquiryForm
          t={m.enquiry}
          kind="REVERSE_ROUTE"
          tripDetails
          messagePlaceholder={m.contact.reversePlaceholder}
        />
      </>
    );
  }
  return <EnquiryForm t={m.enquiry} kind="GENERAL" />;
}

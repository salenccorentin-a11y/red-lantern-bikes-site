// The tours list and each tour's page, in any language.
//
// Tours are written in src/content/tours.ts (translations in src/i18n/content),
// so every tour page is built ahead of time. The page reads the tour from the
// address before rendering, so unknown tours get a real 404.

import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import styles from "@/app/(public)/content.module.css";
import { EnquiryForm } from "@/components/EnquiryForm";
import { PageHeader } from "@/components/PageHeader";
import { TOUR_PHOTOS } from "@/components/tourPhotos";
import ui from "@/components/ui.module.css";
import { TOURS } from "@/content/tours";
import { findTourFor, getMessages, toursFor } from "@/i18n";
import { fill, OG_LOCALE, type Locale } from "@/i18n/config";
import { languageAlternates, localize } from "@/i18n/paths";
import mountainSunset from "../../public/photos/mountain-sunset.webp";

export function toursMetadata(lang: Locale): Metadata {
  const t = getMessages(lang).tours;
  return {
    title: t.metaTitle,
    description: t.metaDescription,
    alternates: languageAlternates(lang, "/tours"),
    openGraph: { locale: OG_LOCALE[lang] },
  };
}

export function ToursView({ lang }: { lang: Locale }) {
  const t = getMessages(lang).tours;
  return (
    <>
      <PageHeader
        title={t.title}
        intro={t.intro}
        photo={{ src: mountainSunset, alt: t.photoAlt, position: "50% 55%" }}
      />
      <main className={styles.page}>
        <div className={styles.cards}>
          {toursFor(lang).map((tour) => {
            const photo = TOUR_PHOTOS[tour.slug];
            const meta = [tour.duration, tour.priceFrom].filter(Boolean);
            return (
              <Link
                key={tour.slug}
                href={localize(lang, `/tours/${tour.slug}`)}
                className={styles.card}
              >
                {photo && (
                  <Image
                    src={photo.src}
                    alt={photo.alt}
                    placeholder="blur"
                    sizes="(max-width: 700px) 100vw, 360px"
                    className={styles.cardPhoto}
                    style={{ objectPosition: photo.position }}
                  />
                )}
                <span className={styles.cardBody}>
                  <h2 className={styles.cardTitle}>{tour.name}</h2>
                  <p className={styles.cardText}>{tour.summary}</p>
                  <p className={styles.cardMeta}>
                    {meta.length > 0 ? meta.join(", ") : t.askDates}
                  </p>
                </span>
              </Link>
            );
          })}
        </div>
      </main>
    </>
  );
}

export function tourSlugs() {
  return TOURS.map((tour) => ({ slug: tour.slug }));
}

export function tourMetadata(lang: Locale, slug: string): Metadata {
  const tour = findTourFor(lang, slug);
  if (!tour) return {};
  return {
    title: fill(getMessages(lang).tours.tourMetaTitle, { name: tour.name }),
    description: tour.summary,
    alternates: languageAlternates(lang, `/tours/${tour.slug}`),
    openGraph: { locale: OG_LOCALE[lang] },
  };
}

export function TourView({ lang, slug }: { lang: Locale; slug: string }) {
  const tour = findTourFor(lang, slug);
  if (!tour) notFound();
  const m = getMessages(lang);
  const t = m.tours;

  const facts: [string, string | null][] = [
    [t.route, tour.route],
    [t.duration, tour.duration],
    [t.group, tour.groupSize],
    [t.price, tour.priceFrom],
  ];

  const photo = TOUR_PHOTOS[tour.slug];

  return (
    <>
      <PageHeader title={tour.name} intro={tour.summary} photo={photo}>
        <div className={ui.actions} style={{ marginTop: 24 }}>
          <a href="#enquire" className={ui.primary}>
            {t.ask}
          </a>
        </div>
      </PageHeader>
      <main className={styles.page}>
        <Link href={localize(lang, "/tours")} className={styles.back}>
          {t.allTours}
        </Link>

        <dl className={styles.facts}>
          {facts
            .filter(([, value]) => value)
            .map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
        </dl>

        <div className={styles.prose}>
          {tour.description.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
          {tour.highlights.length > 0 && (
            <>
              <h2>{t.highlights}</h2>
              <ul>
                {tour.highlights.map((h) => (
                  <li key={h}>{h}</li>
                ))}
              </ul>
            </>
          )}
        </div>

        <section className={`${styles.box} ${styles.boxMist}`} style={{ marginTop: 48 }}>
          <h2 id="enquire">{t.ask}</h2>
          <p>{t.askIntro}</p>
          <EnquiryForm
            t={m.enquiry}
            kind="TOUR"
            topic={tour.slug}
            tripDetails
            messagePlaceholder={t.placeholder}
          />
        </section>
      </main>
    </>
  );
}

// A bike's own page, in any language (/bikes/honda-xr150, /fr/bikes/…, /ko/bikes/…).
//
// Built ahead of time from src/content/bikes.ts, so the title and
// description are in the page head straight away (search engines need that)
// and unknown bikes are a real 404. Prices load live inside the page.

import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { cache, Suspense } from "react";
import bike from "@/app/(public)/bikes/[slug]/bike.module.css";
import styles from "@/app/(public)/content.module.css";
import { bikeImage } from "@/components/BikeCard";
import { BikeGallery } from "@/components/BikeGallery";
import { GoogleReviews } from "@/components/GoogleReviews";
import { SharedElement } from "@/components/motion/SharedElement";
import ui from "@/components/ui.module.css";
import { WhatsAppLink } from "@/components/WhatsAppLink";
import { BIKE_CONTENT } from "@/content/bikes";
import { BIKE_MODELS } from "@/db/seed-data";
import { bikeContent, cityName, getMessages, includedFor, kindLabel, licenceText } from "@/i18n";
import { fill, OG_LOCALE, type Locale } from "@/i18n/config";
import { languageAlternates, localize } from "@/i18n/paths";
import { db } from "@/lib/db";
import { formatUsdApprox, formatVnd } from "@/lib/money";
import { MONTHLY_FROM_DAYS, WEEKLY_FROM_DAYS, savingVsDaily } from "@/lib/pricing";
import { getSettings } from "@/server/availability";
import { listModels } from "@/server/fleet";

export function bikeSlugs() {
  return Object.keys(BIKE_CONTENT).map((slug) => ({ slug }));
}

export function bikeMetadata(lang: Locale, slug: string): Metadata {
  const content = bikeContent(lang, slug);
  if (!content) return {};
  // English wording from the old site's product pages.
  return {
    title: { absolute: content.seoTitle },
    description: content.seoDescription,
    alternates: languageAlternates(lang, `/bikes/${slug}`),
    openGraph: {
      locale: OG_LOCALE[lang],
      images: [{ url: bikeImage(slug), width: 1200, height: 800 }],
    },
  };
}

// The model's name from the fleet list, for the photo description (a staff
// rename in settings won't change it, which is fine for that).
const MODEL_NAME: Record<string, string> = Object.fromEntries(
  BIKE_MODELS.map((m) => [m.slug, m.name]),
);

export function BikeView({ lang, slug }: { lang: Locale; slug: string }) {
  if (!BIKE_CONTENT[slug]) notFound();
  const t = getMessages(lang).bike;
  return (
    <main className={bike.main}>
      <div className={styles.page}>
        <Link href={localize(lang, "/bikes")} className={styles.back}>
          {t.allBikes}
        </Link>
        <article>
          <div className={bike.top}>
            {/* Outside the loading step, so the photo is there the moment the
                page opens and the card's photo can grow into it. */}
            <div className={bike.imagePanel}>
              <SharedElement name={`bike-${slug}`}>
                <Image
                  src={bikeImage(slug)}
                  alt={fill(t.photoAlt, { name: MODEL_NAME[slug] ?? "" })}
                  width={1200}
                  height={800}
                  priority
                  sizes="(max-width: 900px) 100vw, 55vw"
                  className={bike.image}
                />
              </SharedElement>
            </div>
            <Suspense fallback={<div style={{ minHeight: 420 }} />}>
              <BikeInfo lang={lang} slug={slug} />
            </Suspense>
          </div>
          <Suspense fallback={null}>
            <BikeMore lang={lang} slug={slug} />
          </Suspense>
        </article>
      </div>
    </main>
  );
}

// Prices and fleet numbers are edited by staff, so they're read on each
// visit. cache() lets the two parts below share one database read.
const loadBike = cache(async (slug: string) => {
  await connection();
  const [models, settings] = await Promise.all([listModels(db), getSettings(db)]);
  const model = models.find((m) => m.slug === slug);
  if (!model) notFound();
  return { model, settings };
});

async function BikeInfo({ lang, slug }: { lang: Locale; slug: string }) {
  const { model, settings } = await loadBike(slug);
  const content = bikeContent(lang, slug);
  const t = getMessages(lang).bike;
  const usd = (vnd: number) => formatUsdApprox(vnd, settings.usdToVndRate);
  const to = (href: string) => localize(lang, href);

  return (
    <div>
      <p className={bike.kind}>{kindLabel(lang, model.kind)}</p>
      <h1 className={bike.name}>{model.name}</h1>
      {content && <p className={bike.description}>{content.description}</p>}

      <table className={styles.table}>
        <caption className={bike.caption}>{t.pricePerDay}</caption>
        <tbody>
          <tr>
            <td>{t.tierDaily}</td>
            <td className={styles.num}>
              {formatVnd(model.dailyRate)} <small>{usd(model.dailyRate)}</small>
            </td>
          </tr>
          <tr>
            <td>{t.tierWeekly}</td>
            <td className={styles.num}>
              {formatVnd(model.weeklyRate)} <small>{usd(model.weeklyRate)}</small>
            </td>
          </tr>
          <tr>
            <td>{t.tierMonthly}</td>
            <td className={styles.num}>
              {formatVnd(model.monthlyRate)} <small>{usd(model.monthlyRate)}</small>
            </td>
          </tr>
          {model.oneWayFees.map((f) => (
            <tr key={f.toCity}>
              <td>
                {fill(t.oneWayFeeTo, { city: cityName(lang, f.toCity) })}
                <br />
                <small>{fill(t.forTrips, { days: f.minDays })}</small>
              </td>
              <td className={styles.num}>
                {formatVnd(f.fee)} <small>{usd(f.fee)}</small>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <p className={bike.saving}>
        {fill(t.savingStart, { weekDays: WEEKLY_FROM_DAYS })}{" "}
        <b>{formatVnd(savingVsDaily(model, WEEKLY_FROM_DAYS))}</b>
        {fill(t.savingMiddle, { monthDays: MONTHLY_FROM_DAYS })}{" "}
        <b>{formatVnd(savingVsDaily(model, MONTHLY_FROM_DAYS))}</b>
        {t.savingEnd}
      </p>

      <div className={ui.actions} style={{ marginTop: 24 }}>
        <Link href={to(`/book?model=${model.slug}`)} className={ui.primary}>
          {t.bookThis}
        </Link>
        {model.oneWayFees.length > 0 && (
          <Link href={to(`/book?model=${model.slug}&dropoff=HANOI`)} className={ui.ghostLight}>
            {t.rideOneWay}
          </Link>
        )}
        <WhatsAppLink
          label={getMessages(lang).common.askWhatsApp}
          message={fill(t.whatsappMessage, { name: model.name })}
        />
      </div>
      <p className={bike.small}>
        {fill(t.depositNote, { deposit: formatVnd(settings.depositVnd) })}
      </p>
    </div>
  );
}

async function BikeMore({ lang, slug }: { lang: Locale; slug: string }) {
  const { model } = await loadBike(slug);
  const content = bikeContent(lang, slug);
  const t = getMessages(lang).bike;

  return (
    <>
      <BikeGallery
        slug={model.slug}
        name={model.name}
        title={fill(t.photosOf, { name: model.name })}
      />
      <GoogleReviews lang={lang} title={t.reviewsTitle} />

      <div className={bike.details}>
        {content && content.bestFor.length > 0 && (
          <section>
            <h2>{t.goodFor}</h2>
            <ul className={bike.tags}>
              {content.bestFor.map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
          </section>
        )}
        <section>
          <h2>{t.licence}</h2>
          <p>{licenceText(lang, content?.licence ?? "IDP_OR_A1")}</p>
          <p className={styles.muted}>
            {model.units === 1 ? t.unitsOne : fill(t.unitsMany, { n: model.units })}
          </p>
        </section>
        <section>
          <h2>{t.included}</h2>
          <ul className={bike.included}>
            {includedFor(lang).map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}

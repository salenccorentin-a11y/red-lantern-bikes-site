// The home page, in any language (English at /, French at /fr, Korean at /ko).

import type { Metadata } from "next";
import { getImageProps } from "next/image";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import pageStyles from "@/app/(en)/(public)/page.module.css";
import { BikeCard } from "@/components/BikeCard";
import cardStyles from "@/components/BikeCard.module.css";
import { GoogleReviews } from "@/components/GoogleReviews";
import { LocalBusinessData } from "@/components/LocalBusinessData";
import { OneWayTrips } from "@/components/oneway/OneWayTrips";
import { RiderWall } from "@/components/RiderWall";
import { ShopMap } from "@/components/ShopMap";
import ui from "@/components/ui.module.css";
import { ADDRESS_LINE, BUSINESS } from "@/content/business";
import { getMessages, includedFor } from "@/i18n";
import { fill, OG_LOCALE, type Locale } from "@/i18n/config";
import { languageAlternates, localize } from "@/i18n/paths";
import { db } from "@/lib/db";
import { getSettings } from "@/server/availability";
import { listModels } from "@/server/fleet";
import karstRoad from "../../public/photos/karst-road.webp";
import karstRoadPhone from "../../public/photos/karst-road-phone.webp";

const styles = pageStyles;

export function homeMetadata(lang: Locale): Metadata {
  const t = getMessages(lang).home;
  return {
    // English title and description kept from the old site, which ranks for them.
    title: t.metaTitle,
    description: t.metaDescription,
    alternates: languageAlternates(lang, "/"),
    openGraph: { locale: OG_LOCALE[lang] },
  };
}

const FEATURED = ["wave-alpha-110", "honda-xr150", "honda-cb150x", "kawasaki-versys-x300"];

export function HomeView({ lang }: { lang: Locale }) {
  const m = getMessages(lang);
  const t = m.home;
  const to = (href: string) => localize(lang, href);

  return (
    <main>
      <LocalBusinessData />

      {/* The whole road photo behind the words, and a booking bar in the
          middle: pick where you leave the bike and go straight to booking. */}
      <section className={styles.hero}>
        <div className={styles.heroMedia}>
          <HeroPhoto alt={t.heroAlt} />
        </div>
        <div className={styles.heroInner}>
          <h1 className={styles.heroTitle}>{t.title}</h1>
          <p className={styles.lead}>{t.lead}</p>
          <form className={styles.heroBar} action={to("/book")} method="get">
            <label className={styles.heroField}>
              <span className={styles.heroLabel}>{t.dropoffQuestion}</span>
              <select name="dropoff" defaultValue="SAIGON">
                <option value="SAIGON">{m.common.dropoffReturn}</option>
                <option value="DA_NANG">
                  {fill(m.common.dropoffOneWay, { city: m.common.city.DA_NANG })}
                </option>
                <option value="HANOI">
                  {fill(m.common.dropoffOneWay, { city: m.common.city.HANOI })}
                </option>
              </select>
            </label>
            <button type="submit" className={ui.primary}>
              {m.common.bookABike}
            </button>
          </form>
          <ul className={styles.trust}>
            <li>
              <StarIcon /> {fill(t.trustRating, { rating: BUSINESS.googleRating })}
            </li>
            <li>
              <HelmetIcon /> {t.trustGear}
            </li>
            <li>
              <WrenchIcon /> {t.trustHelp}
            </li>
          </ul>
          <Link href={to("/one-way")} className={styles.heroLink}>
            {t.seeOneWay}
          </Link>
        </div>
      </section>

      <OneWayTrips lang={lang} title={t.oneWayTitle} intro={t.oneWayIntro} />

      {/* Straight after the route: the bikes, then what riders say. */}
      <section className={`${ui.section} ${ui.sectionMist}`}>
        <div className={ui.container}>
          <h2 className={ui.sectionTitle}>{t.popularTitle}</h2>
          <p className={ui.sectionIntro}>{t.popularIntro}</p>
          <Suspense fallback={<div className={styles.bikesPlaceholder} />}>
            <FeaturedBikes lang={lang} />
          </Suspense>
          <p className={styles.after}>
            <Link href={to("/bikes")} className={ui.ghostLight}>
              {t.seeAllBikes}
            </Link>
          </p>
        </div>
      </section>

      <section className={ui.section}>
        <div className={ui.container}>
          <h2 className={ui.sectionTitle}>{t.ridersTitle}</h2>
          <p className={ui.sectionIntro}>
            {fill(t.ridersIntro, { rating: BUSINESS.googleRating })}
          </p>
          <RiderWall alt={t.ridersAlt} strip />
          <GoogleReviews lang={lang} />
        </div>
      </section>

      {/* For backpackers weighing up buying a bike in Saigon and selling it in Hanoi. */}
      <section className={`${ui.section} ${ui.sectionMist}`}>
        <div className={ui.container}>
          <h2 className={ui.sectionTitle}>{t.whyRentTitle}</h2>
          <p className={ui.sectionIntro}>{t.whyRentIntro}</p>
          <ul className={styles.whyRent}>
            {t.whyRent.map((point) => (
              <li key={point.title}>
                <h3>{point.title}</h3>
                <p>{point.text}</p>
              </li>
            ))}
          </ul>
          <p className={styles.after}>
            <Link href={to("/one-way")} className={ui.ghostLight}>
              {t.seeOneWay}
            </Link>
          </p>
        </div>
      </section>

      <section className={ui.section}>
        <div className={`${ui.container} ${styles.split}`}>
          <div>
            <h2 className={styles.splitTitle}>{m.common.included}</h2>
            <ul className={styles.ticks}>
              {includedFor(lang).map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className={styles.splitTitle}>{t.howTitle}</h2>
            <ol className={styles.steps}>
              {t.steps.map((step) => (
                <li key={step.strong}>
                  <b>{step.strong}</b> {step.rest}
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section className={`${ui.section} ${ui.sectionMist}`}>
        {/* Where the shop is: just the map, and the way to meet the team. */}
        <div className={`${ui.container} ${styles.visit}`}>
          <h2 className={styles.splitTitle}>{t.teamTitle}</h2>
          <ShopMap
            title={fill(m.common.shopMap, { address: ADDRESS_LINE })}
            className={styles.visitMap}
          />
          <p className={styles.visitFoot}>
            <Link href="/about" className={ui.link}>
              {t.meetTeam}
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}

// Where the hero switches from the tall phone crop to the whole photo.
const WIDE = "(min-width: 900px)";

/**
 * The hero photo, behind the text at every size: a tall crop on phones
 * (public/photos/karst-road-phone.webp, cut from karst-road.webp with its
 * bottom faded to night), the whole photo on wider screens. Both are preloaded at high priority, each only
 * on the screens that show it, so on a phone it is the first thing painted
 * (its blurred version comes with the page itself).
 */
function HeroPhoto({ alt }: { alt: string }) {
  const common = {
    alt,
    fill: true,
    placeholder: "blur",
    fetchPriority: "high",
    loading: "eager",
  } as const;
  // Full width on wide screens too: the photo runs behind the text.
  const wide = getImageProps({ ...common, src: karstRoad, sizes: "100vw" }).props;
  // The tall phone crop has more pixels than the wide photo: a lighter quality
  // keeps its download about the same as before.
  const phone = getImageProps({
    ...common,
    src: karstRoadPhone,
    sizes: "100vw",
    quality: 60,
  }).props;
  return (
    <>
      <link
        rel="preload"
        as="image"
        imageSrcSet={phone.srcSet}
        imageSizes={phone.sizes}
        media="(max-width: 899px)"
        fetchPriority="high"
      />
      <link
        rel="preload"
        as="image"
        imageSrcSet={wide.srcSet}
        imageSizes={wide.sizes}
        media={WIDE}
        fetchPriority="high"
      />
      <picture>
        <source media={WIDE} srcSet={wide.srcSet} sizes={wide.sizes} />
        {/* A <picture> needs a plain <img>; getImageProps gives it the same
            srcset, sizes and blur placeholder next/image would. */}
        {/* eslint-disable-next-line jsx-a11y/alt-text -- the alt text is in {...phone} */}
        <img {...phone} className={styles.heroPhoto} />
      </picture>
    </>
  );
}

// Small line icons for the three trust points (hidden from screen readers:
// the text beside each says it all).

function StarIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={styles.trustIcon}>
      <path
        fill="currentColor"
        d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3 6.1 20.6l1.3-6.6L2.5 9.4l6.6-.8z"
      />
    </svg>
  );
}

function HelmetIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={styles.trustIcon}>
      <g fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round">
        <path d="M3.5 17c0-6.2 4-10.5 9-10.5s8 3.6 8 8V17a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2z" />
        <path d="M12 10.5h8.2M12 10.5v4h8.5" />
      </g>
    </svg>
  );
}

function WrenchIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={styles.trustIcon}>
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94z"
      />
    </svg>
  );
}

async function FeaturedBikes({ lang }: { lang: Locale }) {
  // Prices are edited by staff, so read them for each visit.
  await connection();
  const [models, settings] = await Promise.all([listModels(db), getSettings(db)]);
  const featured = FEATURED.flatMap((slug) => models.filter((m) => m.slug === slug));
  return (
    <div className={cardStyles.grid}>
      {featured.map((m) => (
        <BikeCard key={m.slug} model={m} usdRate={settings.usdToVndRate} lang={lang} />
      ))}
    </div>
  );
}

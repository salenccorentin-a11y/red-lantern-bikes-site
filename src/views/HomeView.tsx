// The home page, in any language (English at /, French at /fr, Korean at /ko).

import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import pageStyles from "@/app/(public)/page.module.css";
import { BikeCard } from "@/components/BikeCard";
import cardStyles from "@/components/BikeCard.module.css";
import { GoogleReviews } from "@/components/GoogleReviews";
import { LocalBusinessData } from "@/components/LocalBusinessData";
import { OneWayTrips } from "@/components/oneway/OneWayTrips";
import { RiderWall } from "@/components/RiderWall";
import { ShopMap } from "@/components/ShopMap";
import ui from "@/components/ui.module.css";
import { ADDRESS_LINE, BUSINESS, mapsLink } from "@/content/business";
import { getMessages, hoursFor, includedFor } from "@/i18n";
import { fill, OG_LOCALE, type Locale } from "@/i18n/config";
import { languageAlternates, localize } from "@/i18n/paths";
import { db } from "@/lib/db";
import { getSettings } from "@/server/availability";
import { listModels } from "@/server/fleet";
import karstRoad from "../../public/photos/karst-road.webp";
import riverCrossing from "../../public/photos/river-crossing.webp";
import saigonOpera from "../../public/photos/saigon-opera.webp";

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
  const ways = [
    { href: to("/bikes"), photo: saigonOpera, ...t.ways.rent },
    { href: to("/one-way"), photo: riverCrossing, ...t.ways.oneWay },
  ];

  return (
    <main>
      <LocalBusinessData />

      <section className={styles.hero}>
        <div className={styles.heroMedia}>
          {/* The first thing phones download after the page: preloaded, high priority. */}
          <Image
            src={karstRoad}
            alt={t.heroAlt}
            fill
            preload
            fetchPriority="high"
            placeholder="blur"
            sizes="(max-width: 900px) 100vw, 55vw"
            className={styles.heroPhoto}
          />
          <figure className={styles.heroQuote}>
            <blockquote>{t.quote}</blockquote>
            <figcaption>{t.quoteBy}</figcaption>
          </figure>
        </div>
        <div className={styles.heroText}>
          <h1 className={styles.heroTitle}>{t.title}</h1>
          <p className={styles.lead}>{t.lead}</p>
          <div className={ui.actions}>
            <Link href={to("/book")} className={ui.primary}>
              {m.common.bookABike}
            </Link>
            <Link href={to("/one-way")} className={ui.ghostDark}>
              {t.seeOneWay}
            </Link>
          </div>
          <ul className={styles.trust}>
            <li>
              <Star /> {fill(t.trustRating, { rating: BUSINESS.googleRating })}
            </li>
            <li>{t.trustGear}</li>
            <li>{t.trustHelp}</li>
          </ul>
        </div>
      </section>

      <OneWayTrips lang={lang} title={t.oneWayTitle} intro={t.oneWayIntro} />

      <section className={ui.section}>
        <div className={ui.container}>
          <h2 className={ui.sectionTitle}>{t.waysTitle}</h2>
          <div className={styles.ways}>
            {ways.map((way) => (
              <Link key={way.href} href={way.href} className={styles.way}>
                <Image
                  src={way.photo}
                  alt={way.alt}
                  fill
                  placeholder="blur"
                  sizes="(max-width: 760px) 100vw, 33vw"
                  className={styles.wayPhoto}
                />
                <span className={styles.wayText}>
                  <span className={styles.wayTitle}>{way.title}</span>
                  <span>{way.text}</span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

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

      <section className={`${ui.section} ${ui.sectionNight}`}>
        <div className={ui.container}>
          <h2 className={ui.sectionTitle}>{t.ridersTitle}</h2>
          <p className={ui.sectionIntro}>
            {fill(t.ridersIntro, { rating: BUSINESS.googleRating })}
          </p>
          <RiderWall alt={t.ridersAlt} />
          <GoogleReviews lang={lang} tone="night" />
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
        <div className={`${ui.container} ${styles.visit}`}>
          <div>
            <h2 className={styles.splitTitle}>{t.teamTitle}</h2>
            <p>
              {t.teamText} {t.teamBio}
            </p>
            <p>
              <Link href="/about" className={ui.link}>
                {t.meetTeam}
              </Link>
            </p>
          </div>
          <div className={styles.shopCard}>
            <ShopMap title={fill(m.common.shopMap, { address: ADDRESS_LINE })} />
            <h3>{t.visitShop}</h3>
            <p>
              {ADDRESS_LINE}
              <br />
              {hoursFor(lang)}
            </p>
            <div className={ui.actions}>
              <Link href={to("/book")} className={ui.primary}>
                {m.common.bookABike}
              </Link>
              <a href={mapsLink()} target="_blank" rel="noopener" className={ui.ghostLight}>
                {m.common.openMaps}
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function Star() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" className={styles.star}>
      <path
        fill="currentColor"
        d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3 6.1 20.6l1.3-6.6L2.5 9.4l6.6-.8z"
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

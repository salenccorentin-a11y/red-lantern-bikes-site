// The one-way page, in any language (/one-way, /fr/one-way, /ko/one-way).

import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import styles from "@/app/(en)/(public)/content.module.css";
import oneWay from "@/app/(en)/(public)/one-way/one-way.module.css";
import { OneWayTrips } from "@/components/oneway/OneWayTrips";
import { PageHeader } from "@/components/PageHeader";
import ui from "@/components/ui.module.css";
import { cityName, getMessages, includedFor } from "@/i18n";
import { fill, OG_LOCALE, type Locale } from "@/i18n/config";
import { languageAlternates, localize } from "@/i18n/paths";
import { db } from "@/lib/db";
import { formatUsdApprox, formatVnd } from "@/lib/money";
import { getSettings } from "@/server/availability";
import { listModels } from "@/server/fleet";
import riverCrossing from "../../public/photos/river-crossing.webp";
import versysDirtRoad from "../../public/photos/versys-dirt-road.webp";

export function oneWayMetadata(lang: Locale): Metadata {
  const t = getMessages(lang).oneWayPage;
  return {
    title: t.metaTitle,
    description: t.metaDescription,
    alternates: languageAlternates(lang, "/one-way"),
    openGraph: { locale: OG_LOCALE[lang] },
  };
}

export function OneWayView({ lang }: { lang: Locale }) {
  const m = getMessages(lang);
  const t = m.oneWayPage;
  const to = (href: string) => localize(lang, href);
  return (
    <>
      <PageHeader
        title={t.title}
        intro={t.intro}
        photo={{ src: riverCrossing, alt: t.photoAlt, position: "50% 40%" }}
      >
        <div className={ui.actions} style={{ marginTop: 24 }}>
          <Link href={to("/book?dropoff=HANOI")} className={ui.primary}>
            {t.bookHanoi}
          </Link>
          <Link href={to("/book?dropoff=DA_NANG")} className={ui.ghostDark}>
            {t.bookDaNang}
          </Link>
        </div>
      </PageHeader>

      <main>
        <OneWayTrips lang={lang} title={t.routeTitle} intro={t.routeIntro} detailed />

        <section className={ui.section}>
          <div className={`${ui.container} ${oneWay.how}`}>
            <div>
              <h2 className={oneWay.h2}>{t.howTitle}</h2>
              <ol className={oneWay.steps}>
                {t.steps.map((step) => (
                  <li key={step.strong}>
                    <b>{step.strong}</b> {step.rest}
                  </li>
                ))}
              </ol>
              <p>
                {t.otherCities}{" "}
                <Link href={to("/contact")} className={ui.link}>
                  {t.otherCitiesLink}
                </Link>
              </p>
            </div>
            <Image
              src={versysDirtRoad}
              alt={t.howPhotoAlt}
              placeholder="blur"
              sizes="(max-width: 860px) 100vw, 40vw"
              className={oneWay.photo}
            />
          </div>
        </section>

        <section className={`${ui.section} ${ui.sectionMist}`}>
          <div className={`${ui.container} ${oneWay.planning}`}>
            <div className={styles.prose}>
              <h2 className={oneWay.h2}>{t.planningTitle}</h2>
              {t.planning.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
              <p>
                {t.readGuide}{" "}
                <Link
                  href="/blog/news-2/ho-chi-minh-city-to-hanoi-by-motorbike-the-complete-route-guide-2026-3"
                  className={ui.link}
                >
                  {t.guideLink}
                </Link>
                {lang !== "en" && ` ${t.guideNote}`}.
              </p>
            </div>
            <aside className={styles.box}>
              <h2>{m.common.included}</h2>
              <ul className={oneWay.included}>
                {includedFor(lang).map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </aside>
          </div>
        </section>

        {/* The fee table last, for riders ready to compare (owner, 2026-11-18). */}
        <section className={ui.section}>
          <div className={ui.container}>
            <Suspense fallback={<div style={{ minHeight: 720 }} />}>
              <Fees lang={lang} />
            </Suspense>
          </div>
        </section>
      </main>
    </>
  );
}

async function Fees({ lang }: { lang: Locale }) {
  await connection();
  const t = getMessages(lang).oneWayPage;
  const [models, settings] = await Promise.all([listModels(db), getSettings(db)]);
  const cities = [...new Set(models.flatMap((m) => m.oneWayFees.map((f) => f.toCity)))];

  return (
    <>
      <h2 className={oneWay.h2}>{t.feesTitle}</h2>
      <p className={oneWay.feesIntro}>{t.feesIntro}</p>
      <div className={`${styles.box} ${styles.tableScroll}`}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>{t.feesBike}</th>
              {cities.map((c) => (
                <th key={c} className={styles.num}>
                  {fill(t.feesTo, { city: cityName(lang, c) })}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {models.map((m) => (
              <tr key={m.slug}>
                <td>
                  <Link href={localize(lang, `/bikes/${m.slug}`)} className={oneWay.bikeLink}>
                    {m.name}
                  </Link>
                </td>
                {cities.map((c) => {
                  const fee = m.oneWayFees.find((f) => f.toCity === c)?.fee;
                  return (
                    <td key={c} className={styles.num}>
                      {fee === undefined ? (
                        t.notOffered
                      ) : (
                        <>
                          {formatVnd(fee)}{" "}
                          <small>{formatUsdApprox(fee, settings.usdToVndRate)}</small>
                        </>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

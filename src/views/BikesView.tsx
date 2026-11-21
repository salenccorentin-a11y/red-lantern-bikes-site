// The bikes list, in any language (/bikes, /fr/bikes, /ko/bikes).

import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import styles from "@/app/(en)/(public)/content.module.css";
import { BikeCard } from "@/components/BikeCard";
import cardStyles from "@/components/BikeCard.module.css";
import { PageHeader } from "@/components/PageHeader";
import ui from "@/components/ui.module.css";
import { getMessages } from "@/i18n";
import { OG_LOCALE, type Locale } from "@/i18n/config";
import { languageAlternates } from "@/i18n/paths";
import { db } from "@/lib/db";
import { getSettings } from "@/server/availability";
import { listModels } from "@/server/fleet";
import luggageReady from "../../public/photos/luggage-ready.webp";

export function bikesMetadata(lang: Locale): Metadata {
  const t = getMessages(lang).bikes;
  return {
    // English title kept from the old /shop page, which now redirects here.
    title: t.metaTitle,
    description: t.metaDescription,
    alternates: languageAlternates(lang, "/bikes"),
    openGraph: { locale: OG_LOCALE[lang] },
  };
}

export function BikesView({ lang }: { lang: Locale }) {
  const t = getMessages(lang).bikes;
  return (
    <>
      <PageHeader
        title={t.title}
        intro={t.intro}
        photo={{ src: luggageReady, alt: t.photoAlt, position: "50% 55%" }}
      />
      <main className={ui.sectionMist}>
        <div className={styles.page}>
          {/* No licence link here (owner, 2026-11-21): the FAQ and each bike page cover it. */}
          <p className={styles.prose}>{t.pricesNote}</p>
          <Suspense fallback={<div style={{ minHeight: 900 }} />}>
            <AllBikes lang={lang} />
          </Suspense>
        </div>
      </main>
    </>
  );
}

async function AllBikes({ lang }: { lang: Locale }) {
  await connection();
  const [models, settings] = await Promise.all([listModels(db), getSettings(db)]);
  return (
    <div className={cardStyles.grid}>
      {models.map((m) => (
        <BikeCard key={m.slug} model={m} usdRate={settings.usdToVndRate} lang={lang} />
      ))}
    </div>
  );
}

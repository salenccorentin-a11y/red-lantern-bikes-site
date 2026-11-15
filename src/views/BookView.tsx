// The booking page, in any language (/book, /fr/book, /ko/book).

import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import styles from "@/app/(booking)/book/book.module.css";
import { BookingForm } from "@/app/(booking)/book/BookingForm";
import { PageHeader } from "@/components/PageHeader";
import { addOnText, getMessages, kindLabel } from "@/i18n";
import { OG_LOCALE, type Locale } from "@/i18n/config";
import { languageAlternates } from "@/i18n/paths";
import { todayInSaigon } from "@/lib/dates";
import { db } from "@/lib/db";
import { loadCatalog } from "@/server/catalog";

type Query = Promise<Record<string, string | string[] | undefined>>;

export function bookMetadata(lang: Locale): Metadata {
  const t = getMessages(lang).book;
  return {
    title: t.metaTitle,
    description: t.metaDescription,
    alternates: languageAlternates(lang, "/book"),
    openGraph: { locale: OG_LOCALE[lang] },
  };
}

export function BookView({ lang, searchParams }: { lang: Locale; searchParams: Query }) {
  const t = getMessages(lang).book;
  return (
    <>
      <PageHeader title={t.title} intro={t.intro} />
      <main className={styles.page}>
        <Suspense fallback={<p className={styles.loading}>{t.loading}</p>}>
          <BookingLoader lang={lang} searchParams={searchParams} />
        </Suspense>
      </main>
    </>
  );
}

async function BookingLoader({ lang, searchParams }: { lang: Locale; searchParams: Query }) {
  // Links like /book?model=honda-xr150&dropoff=HANOI preselect the trip.
  const query = await searchParams;
  // Prices and availability must be current, so load them for each visit.
  await connection();
  const loaded = await loadCatalog(db);
  // Bike kinds and extras come from the database in English.
  const catalog = {
    ...loaded,
    models: loaded.models.map((m) => ({ ...m, kind: kindLabel(lang, m.kind) })),
    addOns: loaded.addOns.map((a) => ({ ...a, ...addOnText(lang, a.slug, a) })),
  };
  const model = catalog.models.find((m) => m.slug === query.model);
  const dropoff = catalog.routes.find((r) => r.toCity === query.dropoff)?.toCity ?? "SAIGON";
  const m = getMessages(lang);
  return (
    <BookingForm
      catalog={catalog}
      today={todayInSaigon()}
      initialModelId={model?.id ?? null}
      initialDropoff={dropoff}
      lang={lang}
      t={m.book}
      common={m.common}
    />
  );
}

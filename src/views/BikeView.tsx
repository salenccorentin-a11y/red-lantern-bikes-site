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
import { BikePhotos } from "@/components/BikePhotos";
import photoStyles from "@/components/BikePhotos.module.css";
import { GoogleReviews } from "@/components/GoogleReviews";
import { SharedElement } from "@/components/motion/SharedElement";
import ui from "@/components/ui.module.css";
import { WhatsAppLink } from "@/components/WhatsAppLink";
import galleries from "@/content/bike-gallery.json";
import { BIKE_CONTENT, LEAD_PHOTO, type BikeFacts } from "@/content/bikes";
import { BIKE_MODELS } from "@/db/seed-data";
import {
  bikeContent,
  bikeFacts,
  cityName,
  getMessages,
  includedFor,
  kindLabel,
  licenceText,
} from "@/i18n";
import { fill, OG_LOCALE, type Locale } from "@/i18n/config";
import { languageAlternates, localize } from "@/i18n/paths";
import { db } from "@/lib/db";
import { formatUsdApprox, formatVnd } from "@/lib/money";
import { MONTHLY_FROM_DAYS, WEEKLY_FROM_DAYS, savingVsDaily } from "@/lib/pricing";
import { getSettings } from "@/server/availability";
import { listModels, type PublicModel } from "@/server/fleet";

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
            {/* Outside the loading step, so the photos are there the moment
                the page opens and the card's photo can grow into the first. */}
            <div className={bike.imagePanel}>
              <Photos lang={lang} slug={slug} />
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
  const [barBefore, barAfter = ""] = t.barFrom.split("{price}");

  return (
    <div>
      <p className={bike.kind}>{kindLabel(lang, model.kind)}</p>
      <h1 className={bike.name}>{model.name}</h1>
      <QuickFacts lang={lang} facts={bikeFacts(lang, slug)} />
      {content && <p className={bike.description}>{content.description}</p>}

      <h2 className={bike.priceTitle}>{t.pricePerDay}</h2>
      <ul className={bike.tiers}>
        {(
          [
            [t.tierDaily, model.dailyRate],
            [t.tierWeekly, model.weeklyRate],
            [t.tierMonthly, model.monthlyRate],
          ] as const
        ).map(([label, rate]) => (
          <li key={label} className={bike.tier}>
            <span className={bike.tierLabel}>{label}</span>
            <b className={bike.tierPrice}>{formatVnd(rate)}</b>
            <span className={bike.tierUsd}>{usd(rate)}</span>
          </li>
        ))}
      </ul>
      {model.oneWayFees.length > 0 && (
        <p className={bike.oneWay}>{oneWayLine(lang, model.oneWayFees)}</p>
      )}

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

      {/* Phones: the price and the button stay in reach while scrolling. */}
      <div className={bike.mobileBar}>
        <p className={bike.mobileBarPrice}>
          {barBefore}
          <b>{formatVnd(model.dailyRate)}</b>
          {barAfter}
        </p>
        <Link href={to(`/book?model=${model.slug}`)} className={bike.mobileBarCta}>
          {t.bookThis}
        </Link>
      </div>
    </div>
  );
}

async function BikeMore({ lang, slug }: { lang: Locale; slug: string }) {
  const { model } = await loadBike(slug);
  const content = bikeContent(lang, slug);
  const t = getMessages(lang).bike;

  return (
    <>
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

// ─── Photos ───────────────────────────────────────────────────────────────

type Photo = {
  src: string;
  alt: string;
  blur?: string;
  width: number;
  height: number;
  /** The studio cut-out on white: shown whole, not cropped. */
  cutout?: boolean;
};

/** The best riding photo first, then the studio photo, then the others. */
function photosFor(slug: string, studioAlt: string): Photo[] {
  const gallery =
    (galleries as Record<string, { src: string; alt: string; blur: string }[]>)[slug] ?? [];
  const lead = gallery.find((p) => p.src === LEAD_PHOTO[slug]);
  const square = (p: (typeof gallery)[number]): Photo => ({ ...p, width: 960, height: 960 });
  const studio: Photo = {
    src: bikeImage(slug),
    alt: studioAlt,
    width: 1200,
    height: 800,
    cutout: true,
  };
  return [
    ...(lead ? [square(lead)] : []),
    studio,
    ...gallery.filter((p) => p !== lead).map(square),
  ];
}

function Photos({ lang, slug }: { lang: Locale; slug: string }) {
  const t = getMessages(lang).bike;
  const name = MODEL_NAME[slug] ?? "";
  const photos = photosFor(slug, fill(t.photoAlt, { name }));

  const slides = photos.map((p, i) => {
    const image = (
      <Image
        key={p.src}
        src={p.src}
        alt={p.alt}
        width={p.width}
        height={p.height}
        sizes="(max-width: 899px) 100vw, 600px"
        // The first photo is what the page opens on: fetched straight away.
        preload={i === 0}
        placeholder={p.blur ? "blur" : "empty"}
        blurDataURL={p.blur}
        className={p.cutout ? photoStyles.cutout : photoStyles.photo}
      />
    );
    // The fleet page's card photo grows into the first photo here.
    return i === 0 ? (
      <SharedElement key={p.src} name={`bike-${slug}`}>
        {image}
      </SharedElement>
    ) : (
      image
    );
  });

  const thumbs = photos.map((p) => (
    <Image
      key={p.src}
      src={p.src}
      alt=""
      width={p.width}
      height={p.height}
      sizes="88px"
      className={p.cutout ? photoStyles.thumbCutout : undefined}
    />
  ));

  return (
    <BikePhotos
      label={fill(t.photosLabel, { name })}
      slides={slides}
      thumbs={thumbs}
      photoOf={t.photoOf}
      showPhoto={t.showPhoto}
    />
  );
}

// ─── Quick facts ──────────────────────────────────────────────────────────

/** Engine size, gearbox, seat height and best use: only the ones we know. */
function QuickFacts({ lang, facts }: { lang: Locale; facts: BikeFacts }) {
  const t = getMessages(lang).bike;
  const gearbox = (g: NonNullable<BikeFacts["gearbox"]>) => {
    if (g.type === "automatic") return t.gearAutomatic;
    if (g.type === "semi-automatic")
      return g.speeds ? fill(t.gearSemiSpeeds, { n: g.speeds }) : t.gearSemi;
    return g.speeds ? fill(t.gearManualSpeeds, { n: g.speeds }) : t.gearManual;
  };
  const items = [
    facts.engineCc && {
      icon: <EngineIcon />,
      label: t.factEngine,
      value: fill(t.engineCc, { cc: facts.engineCc }),
    },
    facts.gearbox && { icon: <GearboxIcon />, label: t.factGearbox, value: gearbox(facts.gearbox) },
    facts.seatHeightMm && {
      icon: <SeatIcon />,
      label: t.factSeat,
      value: fill(t.seatMm, { mm: facts.seatHeightMm }),
    },
    facts.bestUse && { icon: <RouteIcon />, label: t.factBestUse, value: facts.bestUse },
  ].filter((item) => !!item);
  if (items.length === 0) return null;

  return (
    <dl className={bike.facts} aria-label={t.factsLabel}>
      {items.map((item) => (
        <div key={item.label} className={bike.fact}>
          {item.icon}
          <dt>{item.label}</dt>
          <dd>{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

// Small line icons (decorative: the label beside each says what it is).
const iconProps = {
  viewBox: "0 0 24 24",
  "aria-hidden": true,
  className: bike.factIcon,
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

/** A speedometer: engine size. */
function EngineIcon() {
  return (
    <svg {...iconProps}>
      <path d="M3.5 18a9 9 0 1 1 17 0" />
      <path d="M12 14l4.5-4.5" />
      <circle cx="12" cy="14.5" r="1" />
    </svg>
  );
}

/** A gear-shift pattern: the gearbox. */
function GearboxIcon() {
  return (
    <svg {...iconProps}>
      <path d="M6 5v14M12 5v14M18 5v7H6" />
    </svg>
  );
}

/** A height marker: seat height. */
function SeatIcon() {
  return (
    <svg {...iconProps}>
      <path d="M12 4v16M8.5 7.5 12 4l3.5 3.5M8.5 16.5 12 20l3.5-3.5M5 4h14M5 20h14" />
    </svg>
  );
}

/** A winding route: best use. */
function RouteIcon() {
  return (
    <svg {...iconProps}>
      <circle cx="6" cy="19" r="2.5" />
      <circle cx="18" cy="5" r="2.5" />
      <path d="M8.5 19H17a3.5 3.5 0 0 0 0-7H7a3.5 3.5 0 0 1 0-7h8.5" />
    </svg>
  );
}

// ─── One-way fee ──────────────────────────────────────────────────────────

/** e.g. "One-way to Da Nang (7+ days) or Hanoi (12+ days): 1.600.000₫ extra." */
function oneWayLine(lang: Locale, fees: PublicModel["oneWayFees"]): string {
  const t = getMessages(lang).bike;
  const list = new Intl.ListFormat(lang, { type: "disjunction" });
  // Usually one fee for every destination; if not, one sentence per fee.
  const byFee = new Map<number, typeof fees>();
  for (const f of [...fees].sort((a, b) => a.minDays - b.minDays)) {
    byFee.set(f.fee, [...(byFee.get(f.fee) ?? []), f]);
  }
  return [...byFee]
    .map(([fee, group]) =>
      fill(t.oneWayLine, {
        places: list.format(
          group.map((f) =>
            fill(t.oneWayPlace, { city: cityName(lang, f.toCity), days: f.minDays }),
          ),
        ),
        fee: formatVnd(fee),
      }),
    )
    .join(" ");
}

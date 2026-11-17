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
import bike from "@/app/(en)/(public)/bikes/[slug]/bike.module.css";
import styles from "@/app/(en)/(public)/content.module.css";
import { bikeImage } from "@/components/BikeCard";
import { BikePhotos } from "@/components/BikePhotos";
import photoStyles from "@/components/BikePhotos.module.css";
import { SharedElement } from "@/components/motion/SharedElement";
import ui from "@/components/ui.module.css";
import { WhatsAppLink } from "@/components/WhatsAppLink";
import galleries from "@/content/bike-gallery.json";
import { BIKE_CONTENT, type BikeFacts } from "@/content/bikes";
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
      <QuickFacts lang={lang} facts={bikeFacts(slug)} bestUse={content?.bestFor[0]} />
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
      <div className={bike.mobileBar} data-bottom-bar>
        <p className={bike.mobileBarPrice}>
          {barBefore}
          {/* The price and "a day" stay together on one line. */}
          <span className={bike.nowrap}>
            <b>{formatVnd(model.dailyRate)}</b>
            {barAfter}
          </span>
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
  const facts = bikeFacts(slug);
  const t = getMessages(lang).bike;

  return (
    <>
      <div className={bike.details}>
        <Specs lang={lang} facts={facts} />
        {content && content.bestFor.length > 0 && (
          <section>
            <h2>{t.goodFor}</h2>
            <ul className={bike.tags}>
              {content.bestFor.map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
            <p className={bike.small}>
              {model.units === 1 ? t.unitsOne : fill(t.unitsMany, { n: model.units })}
            </p>
          </section>
        )}
        {/* The shop's choice: the permit wording only on 150cc and bigger
            bikes, the same for all of them; nothing on the small ones. */}
        {(facts.engineCc ?? 0) >= 150 && (
          <section>
            <h2>{t.licence}</h2>
            <p>{licenceText(lang, "IDP_OR_A1")}</p>
          </section>
        )}
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

/**
 * The shop's own photos of the model (4:3, in the order of
 * scripts/brand/prepare-photos.cjs). The studio cut-out stays on the cards,
 * not here (owner, 2026-11-17); it only stands in for a model with no photos yet.
 */
function photosFor(slug: string, studioAlt: string): Photo[] {
  const gallery =
    (galleries as Record<string, { src: string; alt: string; blur: string }[]>)[slug] ?? [];
  if (gallery.length > 0) return gallery.map((p) => ({ ...p, width: 1200, height: 900 }));
  return [{ src: bikeImage(slug), alt: studioAlt, width: 1200, height: 800, cutout: true }];
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

/** Engine size, gearbox, fuel tank and best use: only the ones we know. */
function QuickFacts({
  lang,
  facts,
  bestUse,
}: {
  lang: Locale;
  facts: BikeFacts;
  /** The bike's first "best for" tag, in the page's language. */
  bestUse?: string;
}) {
  const t = getMessages(lang).bike;
  const num = numberIn(lang);
  const items = [
    facts.engineCc && {
      icon: <EngineIcon />,
      label: t.factEngine,
      value: fill(t.engineCc, { cc: facts.engineCc }),
    },
    facts.gearbox && {
      icon: <GearboxIcon />,
      label: t.factGearbox,
      value: gearboxText(lang, facts.gearbox),
    },
    facts.fuelTankL && {
      icon: <TankIcon />,
      label: t.factTank,
      value: facts.rangeKm
        ? fill(t.tankRange, { l: num(facts.fuelTankL), km: num(facts.rangeKm) })
        : fill(t.litres, { l: num(facts.fuelTankL) }),
    },
    bestUse && { icon: <RouteIcon />, label: t.factBestUse, value: bestUse },
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

/** Specifications lower on the page: only the ones we know. */
function Specs({ lang, facts }: { lang: Locale; facts: BikeFacts }) {
  const t = getMessages(lang).bike;
  const num = numberIn(lang);
  const brakes = (b: NonNullable<BikeFacts["brakes"]>) => {
    const text =
      b.front === "disc" && b.rear === "disc"
        ? t.brakesDiscDisc
        : b.front === "disc"
          ? t.brakesDiscDrum
          : t.brakesDrumDrum;
    return b.abs ? fill(t.withAbs, { brakes: text }) : text;
  };
  const rows: [string, string | undefined][] = [
    [t.factEngine, facts.engineCc ? fill(t.engineCc, { cc: facts.engineCc }) : undefined],
    [t.factGearbox, facts.gearbox ? gearboxText(lang, facts.gearbox) : undefined],
    [t.specPower, facts.powerHp ? fill(t.hp, { hp: num(facts.powerHp) }) : undefined],
    [t.specWeight, facts.weightKg ? fill(t.kg, { kg: num(facts.weightKg) }) : undefined],
    [t.factTank, facts.fuelTankL ? fill(t.litres, { l: num(facts.fuelTankL) }) : undefined],
    [t.specRange, facts.rangeKm ? fill(t.rangeKm, { km: num(facts.rangeKm) }) : undefined],
    [t.specBrakes, facts.brakes ? brakes(facts.brakes) : undefined],
    [
      t.specClearance,
      facts.groundClearanceMm ? fill(t.mm, { mm: num(facts.groundClearanceMm) }) : undefined,
    ],
  ];
  const known = rows.filter((r): r is [string, string] => !!r[1]);
  // Engine and gearbox alone are already in the quick facts at the top.
  if (known.length <= 2) return null;

  return (
    <section>
      <h2>{t.specsTitle}</h2>
      <dl className={bike.specs}>
        {known.map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function gearboxText(lang: Locale, g: NonNullable<BikeFacts["gearbox"]>): string {
  const t = getMessages(lang).bike;
  if (g.type === "automatic") return t.gearAutomatic;
  if (g.type === "semi-automatic")
    return g.speeds ? fill(t.gearSemiSpeeds, { n: g.speeds }) : t.gearSemi;
  return g.speeds ? fill(t.gearManualSpeeds, { n: g.speeds }) : t.gearManual;
}

/** Numbers written the local way (12.75 in English, 12,75 in French). */
const numberIn = (lang: Locale) => {
  const format = new Intl.NumberFormat(lang, { maximumFractionDigits: 2 });
  return (n: number) => format.format(n);
};

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

/** A fuel pump: the fuel tank. */
function TankIcon() {
  return (
    <svg {...iconProps}>
      <path d="M4 21V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v16M3 21h12M4 10h10" />
      <path d="M14 8h2a2 2 0 0 1 2 2v6a1.5 1.5 0 0 0 3 0V8l-3-3" />
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

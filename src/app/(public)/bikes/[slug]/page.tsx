import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { cache, Suspense } from "react";
import { bikeImage } from "@/components/BikeCard";
import { BikeGallery } from "@/components/BikeGallery";
import { SharedElement } from "@/components/motion/SharedElement";
import ui from "@/components/ui.module.css";
import { BIKE_CONTENT, LICENCE_TEXT } from "@/content/bikes";
import { BUSINESS } from "@/content/business";
import { BIKE_MODELS } from "@/db/seed-data";
import { CITY_NAME } from "@/lib/cities";
import { db } from "@/lib/db";
import { formatUsdApprox, formatVnd } from "@/lib/money";
import { getSettings } from "@/server/availability";
import { listModels } from "@/server/fleet";
import styles from "../../content.module.css";
import bike from "./bike.module.css";

// Bike pages are built ahead of time from src/content/bikes.ts, so their title
// and description are in the page head straight away (search engines need
// that), and unknown bikes are a real 404. Prices load live inside the page.
export const instant = false;

export function generateStaticParams() {
  return Object.keys(BIKE_CONTENT).map((slug) => ({ slug }));
}

export async function generateMetadata(props: PageProps<"/bikes/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const content = BIKE_CONTENT[slug];
  if (!content) return {};
  // Wording from the old site's product pages.
  return {
    title: { absolute: content.seoTitle },
    description: content.seoDescription,
    alternates: { canonical: `/bikes/${slug}` },
    openGraph: { images: [{ url: bikeImage(slug), width: 1200, height: 800 }] },
  };
}

export default async function BikePage(props: PageProps<"/bikes/[slug]">) {
  const { slug } = await props.params;
  if (!BIKE_CONTENT[slug]) notFound();
  return (
    <main className={bike.main}>
      <div className={styles.page}>
        <Link href="/bikes" className={styles.back}>
          All bikes
        </Link>
        <article>
          <div className={bike.top}>
            {/* Outside the loading step, so the photo is there the moment the
                page opens and the card's photo can grow into it. */}
            <div className={bike.imagePanel}>
              <SharedElement name={`bike-${slug}`}>
                <Image
                  src={bikeImage(slug)}
                  alt={PHOTO_ALT[slug] ?? ""}
                  width={1200}
                  height={800}
                  priority
                  sizes="(max-width: 900px) 100vw, 55vw"
                  className={bike.image}
                />
              </SharedElement>
            </div>
            <Suspense fallback={<div style={{ minHeight: 420 }} />}>
              <BikeInfo slug={slug} />
            </Suspense>
          </div>
          <Suspense fallback={null}>
            <BikeMore slug={slug} />
          </Suspense>
        </article>
      </div>
    </main>
  );
}

// The photo's description, from the fleet list (a staff rename in settings
// won't change it, which is fine for a photo description).
const PHOTO_ALT: Record<string, string> = Object.fromEntries(
  BIKE_MODELS.map((m) => [m.slug, `Studio photo of the ${m.name}`]),
);

// Prices and fleet numbers are edited by staff, so they're read on each
// visit. cache() lets the two parts below share one database read.
const loadBike = cache(async (slug: string) => {
  await connection();
  const [models, settings] = await Promise.all([listModels(db), getSettings(db)]);
  const model = models.find((m) => m.slug === slug);
  if (!model) notFound();
  return { model, settings };
});

async function BikeInfo({ slug }: { slug: string }) {
  const { model, settings } = await loadBike(slug);
  const content = BIKE_CONTENT[slug];
  const usd = (vnd: number) => formatUsdApprox(vnd, settings.usdToVndRate);

  return (
    <div>
      <p className={bike.kind}>{model.kind}</p>
      <h1 className={bike.name}>{model.name}</h1>
      {content && <p className={bike.description}>{content.description}</p>}

      <table className={styles.table}>
        <caption className={bike.caption}>Price per day</caption>
        <tbody>
          <tr>
            <td>1 to 6 days</td>
            <td className={styles.num}>
              {formatVnd(model.dailyRate)} <small>{usd(model.dailyRate)}</small>
            </td>
          </tr>
          <tr>
            <td>7 to 29 days</td>
            <td className={styles.num}>
              {formatVnd(model.weeklyRate)} <small>{usd(model.weeklyRate)}</small>
            </td>
          </tr>
          <tr>
            <td>30 days or more</td>
            <td className={styles.num}>
              {formatVnd(model.monthlyRate)} <small>{usd(model.monthlyRate)}</small>
            </td>
          </tr>
          {model.oneWayFees.map((f) => (
            <tr key={f.toCity}>
              <td>
                One-way fee to {CITY_NAME[f.toCity]}
                <br />
                <small>for trips of {f.minDays} days or more</small>
              </td>
              <td className={styles.num}>
                {formatVnd(f.fee)} <small>{usd(f.fee)}</small>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className={ui.actions} style={{ marginTop: 24 }}>
        <Link href={`/book?model=${model.slug}`} className={ui.primary}>
          Book this bike
        </Link>
        {model.oneWayFees.length > 0 && (
          <Link href={`/book?model=${model.slug}&dropoff=HANOI`} className={ui.ghostLight}>
            Ride it one-way to Hanoi
          </Link>
        )}
      </div>
      <p className={bike.small}>
        Pay {formatVnd(settings.depositVnd)} online to hold the bike; the rest at pick-up.
      </p>
    </div>
  );
}

async function BikeMore({ slug }: { slug: string }) {
  const { model } = await loadBike(slug);
  const content = BIKE_CONTENT[slug];

  return (
    <>
      <BikeGallery slug={model.slug} name={model.name} />

      <div className={bike.details}>
        {content && content.bestFor.length > 0 && (
          <section>
            <h2>Good for</h2>
            <ul className={bike.tags}>
              {content.bestFor.map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
          </section>
        )}
        <section>
          <h2>Licence</h2>
          <p>{content ? LICENCE_TEXT[content.licence] : LICENCE_TEXT.IDP_OR_A1}</p>
          <p className={styles.muted}>
            {model.units === 1
              ? "We have one of these in the fleet."
              : `We have ${model.units} of these in the fleet.`}
          </p>
        </section>
        <section>
          <h2>Included</h2>
          <ul className={bike.included}>
            {BUSINESS.included.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}

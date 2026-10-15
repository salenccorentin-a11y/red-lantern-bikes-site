import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { BIKE_CONTENT, LICENCE_TEXT } from "@/content/bikes";
import { CITY_NAME } from "@/lib/cities";
import { db } from "@/lib/db";
import { formatUsdApprox, formatVnd } from "@/lib/money";
import { getSettings } from "@/server/availability";
import { listModels } from "@/server/fleet";
import styles from "../../content.module.css";

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
  };
}

export default async function BikePage(props: PageProps<"/bikes/[slug]">) {
  const { slug } = await props.params;
  if (!BIKE_CONTENT[slug]) notFound();
  return (
    <main className={styles.page}>
      <p>
        <Link href="/bikes">← All bikes</Link>
      </p>
      <Suspense fallback={<p className={styles.muted}>Loading…</p>}>
        <Bike slug={slug} />
      </Suspense>
    </main>
  );
}

async function Bike({ slug }: { slug: string }) {
  await connection();
  const [models, settings] = await Promise.all([listModels(db), getSettings(db)]);
  const model = models.find((m) => m.slug === slug);
  if (!model) notFound();
  const content = BIKE_CONTENT[slug];
  const usd = (vnd: number) => formatUsdApprox(vnd, settings.usdToVndRate);

  return (
    <article>
      <p className={styles.eyebrow}>{model.kind}</p>
      <h1>{model.name}</h1>
      {content && <p className={styles.lead}>{content.description}</p>}

      <div className={styles.twoCol}>
        <section className={styles.box}>
          <h2>Prices</h2>
          <table className={styles.table}>
            <tbody>
              <tr>
                <td>1 to 6 days</td>
                <td className={styles.num}>
                  {formatVnd(model.dailyRate)} / day <small>{usd(model.dailyRate)}</small>
                </td>
              </tr>
              <tr>
                <td>7 to 29 days</td>
                <td className={styles.num}>
                  {formatVnd(model.weeklyRate)} / day <small>{usd(model.weeklyRate)}</small>
                </td>
              </tr>
              <tr>
                <td>30 days or more</td>
                <td className={styles.num}>
                  {formatVnd(model.monthlyRate)} / day <small>{usd(model.monthlyRate)}</small>
                </td>
              </tr>
              {model.oneWayFees.map((f) => (
                <tr key={f.toCity}>
                  <td>
                    One-way fee to {CITY_NAME[f.toCity]} <small>(from {f.minDays} days)</small>
                  </td>
                  <td className={styles.num}>
                    {formatVnd(f.fee)} <small>{usd(f.fee)}</small>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className={styles.muted}>
            Pay a {formatVnd(settings.depositVnd)} deposit online to book; the rest when you pick
            up. Helmet and gear included.
          </p>
          <div className={styles.actions}>
            <Link href={`/book?model=${model.slug}`} className={styles.primary}>
              Book this bike
            </Link>
            {model.oneWayFees.length > 0 && (
              <Link href={`/book?model=${model.slug}&dropoff=HANOI`} className={styles.secondary}>
                One-way to Hanoi
              </Link>
            )}
          </div>
        </section>

        <section className={styles.box}>
          {content && content.bestFor.length > 0 && (
            <>
              <h2>Good for</h2>
              <ul>
                {content.bestFor.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
            </>
          )}
          <h2>Licence</h2>
          <p>{content ? LICENCE_TEXT[content.licence] : LICENCE_TEXT.IDP_OR_A1}</p>
          <p className={styles.muted}>
            {model.units === 1
              ? "We have one of these in the fleet."
              : `We have ${model.units} of these in the fleet.`}
          </p>
        </section>
      </div>
    </article>
  );
}

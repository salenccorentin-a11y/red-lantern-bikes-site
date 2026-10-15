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

export async function generateMetadata(props: PageProps<"/bikes/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const model = await db.bikeModel.findUnique({ where: { slug } });
  // Checked here, before the page starts streaming, so unknown bikes get a real 404.
  if (!model || !model.active) notFound();
  const content = BIKE_CONTENT[slug];
  if (!content) return { title: `${model.name} Rental Saigon | Red Lantern Bikes` };
  // Same wording as the old product pages, with today's price.
  const { usdToVndRate } = await getSettings(db);
  const price = "$" + Math.round(model.dailyRate / usdToVndRate);
  // A function replacement, so the "$" isn't read as a replace() pattern.
  return {
    title: { absolute: content.seoTitle.replace("{price}", () => price) },
    description: content.seoDescription.replace("{price}", () => price),
  };
}

export default function BikePage(props: PageProps<"/bikes/[slug]">) {
  return (
    <main className={styles.page}>
      <p>
        <Link href="/bikes">← All bikes</Link>
      </p>
      <Suspense fallback={<p className={styles.muted}>Loading…</p>}>
        <Bike params={props.params} />
      </Suspense>
    </main>
  );
}

async function Bike({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
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

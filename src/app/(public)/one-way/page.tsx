import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { BUSINESS } from "@/content/business";
import { CITY_NAME } from "@/lib/cities";
import { db } from "@/lib/db";
import { formatUsdApprox, formatVnd } from "@/lib/money";
import { getSettings } from "@/server/availability";
import { listModels } from "@/server/fleet";
import styles from "../content.module.css";

export const metadata: Metadata = {
  title: "One-way motorbike rental Saigon to Hanoi or Da Nang | Red Lantern Bikes",
  description:
    "Pick up a motorbike in Saigon and leave it in Hanoi or Da Nang. Fixed one-way fee per bike, roadside assistance the whole way, and we bring the bike home.",
};

export default function OneWayPage() {
  return (
    <main className={styles.page}>
      <h1>One-way rental: Saigon to Hanoi or Da Nang</h1>
      <p className={styles.lead}>
        Ride the length of Vietnam without riding back. Pick up your bike at our shop in District 1,
        take the route you like at your own pace, and leave the bike at our drop-off point in Hanoi
        or Da Nang. We send it home by train.
      </p>
      <div className={styles.actions}>
        <Link href="/book?dropoff=HANOI" className={styles.primary}>
          Book one-way to Hanoi
        </Link>
        <Link href="/book?dropoff=DA_NANG" className={styles.secondary}>
          Book one-way to Da Nang
        </Link>
      </div>

      <h2>How it works</h2>
      <ol className={styles.prose}>
        <li>
          <b>Book online</b> and choose Hanoi or Da Nang as your drop-off. The one-way fee is shown
          with the price.
        </li>
        <li>
          <b>Pick up in Saigon.</b> We set the bike up for a long trip and go through the route with
          you.
        </li>
        <li>
          <b>Ride.</b> Take as long as you like within your rental. If anything goes wrong on the
          road, message us on WhatsApp and we&apos;ll help, wherever you are.
        </li>
        <li>
          <b>Drop off</b> at our partner point in Hanoi or Da Nang on your last day. That&apos;s it:
          we handle getting the bike back to Saigon.
        </li>
      </ol>

      <Suspense fallback={<p className={styles.muted}>Loading prices…</p>}>
        <Fees />
      </Suspense>

      <h2>Planning the ride</h2>
      <div className={`${styles.prose}`}>
        <p>
          Saigon to Hanoi is around 2,500 km through the Central Highlands, along the coast, over
          the Hai Van Pass and up the Ho Chi Minh Road into the karst mountains of the north. Most
          riders take three to four weeks; at 150 to 200 km a day you&apos;ll have time to stop.
        </p>
        <p>
          Saigon to Da Nang is a shorter trip of one to two weeks, with Da Lat, the beaches of Nha
          Trang and Hoi An within easy reach of the finish.
        </p>
        <p>
          The south and centre are driest from November to April; the north from March to May and
          September to November. Riding the whole country, February to April is usually best.
        </p>
        <p>
          Prefer a guide? See our <Link href="/tours/saigon-to-hanoi">Saigon to Hanoi tour</Link>.
        </p>
      </div>

      <h2>What&apos;s included</h2>
      <ul className={styles.prose}>
        {BUSINESS.included.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </main>
  );
}

async function Fees() {
  await connection();
  const [models, settings] = await Promise.all([listModels(db), getSettings(db)]);
  const cities = [...new Set(models.flatMap((m) => m.oneWayFees.map((f) => f.toCity)))];
  const minDays = (city: string) =>
    models.flatMap((m) => m.oneWayFees).find((f) => f.toCity === city)?.minDays;

  return (
    <section>
      <h2>Routes and one-way fees</h2>
      <p>
        {cities.map((c) => `${CITY_NAME[c]}: at least ${minDays(c)} days`).join(" · ")}. The one-way
        fee depends on the bike and is added once to the rental price.
      </p>
      <div className={styles.box} style={{ overflowX: "auto" }}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Bike</th>
              {cities.map((c) => (
                <th key={c} className={styles.num}>
                  To {CITY_NAME[c]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {models.map((m) => (
              <tr key={m.slug}>
                <td>
                  <Link href={`/bikes/${m.slug}`}>{m.name}</Link>
                </td>
                {cities.map((c) => {
                  const fee = m.oneWayFees.find((f) => f.toCity === c)?.fee;
                  return (
                    <td key={c} className={styles.num}>
                      {fee === undefined ? (
                        "–"
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
    </section>
  );
}

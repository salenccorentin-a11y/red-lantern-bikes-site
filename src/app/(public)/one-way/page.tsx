import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { OneWayTrips } from "@/components/oneway/OneWayTrips";
import { PageHeader } from "@/components/PageHeader";
import ui from "@/components/ui.module.css";
import { BUSINESS } from "@/content/business";
import { CITY_NAME } from "@/lib/cities";
import { db } from "@/lib/db";
import { formatUsdApprox, formatVnd } from "@/lib/money";
import { getSettings } from "@/server/availability";
import { listModels } from "@/server/fleet";
import riverCrossing from "../../../../public/photos/river-crossing.webp";
import versysDirtRoad from "../../../../public/photos/versys-dirt-road.webp";
import styles from "../content.module.css";
import oneWay from "./one-way.module.css";

export const metadata: Metadata = {
  alternates: { canonical: "/one-way" },
  title: "One-way motorbike rental Saigon to Hanoi or Da Nang | Red Lantern Bikes",
  description:
    "Pick up a motorbike in Saigon and leave it in Hanoi or Da Nang. Fixed one-way fee per bike, roadside assistance the whole way, and we bring the bike home.",
};

export default function OneWayPage() {
  return (
    <>
      <PageHeader
        title="One-way rental: Saigon to Hanoi or Da Nang"
        intro="Ride the length of Vietnam without riding back. Pick up in District 1, take the route you like, and leave the bike at our drop-off point in Hanoi or Da Nang. We send it home by train."
        photo={{
          src: riverCrossing,
          alt: "A rider and bike crossing a river on a small boat in northern Vietnam",
          position: "50% 40%",
        }}
      >
        <div className={ui.actions} style={{ marginTop: 24 }}>
          <Link href="/book?dropoff=HANOI" className={ui.primary}>
            Book one-way to Hanoi
          </Link>
          <Link href="/book?dropoff=DA_NANG" className={ui.ghostDark}>
            Book one-way to Da Nang
          </Link>
        </div>
      </PageHeader>

      <main>
        <OneWayTrips
          title="The route"
          intro="Pick up in Saigon, ride north at your own pace, and leave the bike in Da Nang or Hanoi."
          detailed
        />

        <section className={ui.section}>
          <div className={`${ui.container} ${oneWay.how}`}>
            <div>
              <h2 className={oneWay.h2}>How it works</h2>
              <ol className={oneWay.steps}>
                <li>
                  <b>Book online</b> and choose Hanoi or Da Nang as your drop-off. The one-way fee
                  is shown with the price.
                </li>
                <li>
                  <b>Pick up in Saigon.</b> We set the bike up for a long trip and go through the
                  route with you.
                </li>
                <li>
                  <b>Ride.</b> Take as long as you like within your rental. If anything goes wrong,
                  message us on WhatsApp and we&apos;ll help, wherever you are.
                </li>
                <li>
                  <b>Drop off</b> at our partner point on your last day. We handle getting the bike
                  back to Saigon.
                </li>
              </ol>
            </div>
            <Image
              src={versysDirtRoad}
              alt="A Kawasaki Versys with panniers on a red dirt road"
              placeholder="blur"
              sizes="(max-width: 860px) 100vw, 40vw"
              className={oneWay.photo}
            />
          </div>
        </section>

        <section className={`${ui.section} ${ui.sectionMist}`}>
          <div className={ui.container}>
            <Suspense fallback={<div style={{ minHeight: 720 }} />}>
              <Fees />
            </Suspense>
          </div>
        </section>

        <section className={ui.section}>
          <div className={`${ui.container} ${oneWay.planning}`}>
            <div className={styles.prose}>
              <h2 className={oneWay.h2}>Planning the ride</h2>
              <p>
                Saigon to Hanoi is around 2,500 km through the Central Highlands, along the coast,
                over the Hai Van Pass and up the Ho Chi Minh Road into the karst mountains of the
                north. Most riders take three to four weeks; at 150 to 200 km a day you&apos;ll have
                time to stop.
              </p>
              <p>
                Saigon to Da Nang is a shorter trip of one to two weeks, with Da Lat, the beaches of
                Nha Trang and Hoi An within easy reach of the finish.
              </p>
              <p>
                The south and centre are driest from November to April; the north from March to May
                and September to November. Riding the whole country, February to April is usually
                best.
              </p>
              <p>
                Read our{" "}
                <Link
                  href="/blog/news-2/ho-chi-minh-city-to-hanoi-by-motorbike-the-complete-route-guide-2026-3"
                  className={ui.link}
                >
                  complete Saigon to Hanoi route guide
                </Link>
                , or ride it with a guide on our{" "}
                <Link href="/tours/saigon-to-hanoi" className={ui.link}>
                  Saigon to Hanoi tour
                </Link>
                .
              </p>
            </div>
            <aside className={`${styles.box} ${styles.boxMist}`}>
              <h2>Included with every bike</h2>
              <ul className={oneWay.included}>
                {BUSINESS.included.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </aside>
          </div>
        </section>
      </main>
    </>
  );
}

async function Fees() {
  await connection();
  const [models, settings] = await Promise.all([listModels(db), getSettings(db)]);
  const cities = [...new Set(models.flatMap((m) => m.oneWayFees.map((f) => f.toCity)))];

  return (
    <>
      <h2 className={oneWay.h2}>One-way fees</h2>
      <p className={oneWay.feesIntro}>
        The fee depends on the bike and is added once to the rental price.
      </p>
      <div className={`${styles.box} ${styles.tableScroll}`}>
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
                  <Link href={`/bikes/${m.slug}`} className={oneWay.bikeLink}>
                    {m.name}
                  </Link>
                </td>
                {cities.map((c) => {
                  const fee = m.oneWayFees.find((f) => f.toCity === c)?.fee;
                  return (
                    <td key={c} className={styles.num}>
                      {fee === undefined ? (
                        "Not offered"
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

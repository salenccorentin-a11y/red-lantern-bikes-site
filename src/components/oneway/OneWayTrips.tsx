import Link from "next/link";
import ui from "@/components/ui.module.css";
import { ONE_WAY_ROUTE, ONE_WAY_TRIPS } from "@/content/route";
import { OneWayMap } from "./OneWayMap";
import { OneWayScroll } from "./OneWayScroll";
import styles from "./OneWayTrips.module.css";

// The one-way section on the home and one-way pages: the map of Vietnam and a
// card for each stop. As you scroll, the road draws itself from Saigon to Da
// Nang and Hanoi, and each lantern lights up as the line reaches it
// (OneWayScroll, GSAP). On wide screens the section stays pinned while it
// draws; on phones the map sits above the cards and simply scrolls by.
//
// Everything is in the page as plain HTML and fully drawn: without
// JavaScript, or with reduced motion, visitors see the finished map.

export function OneWayTrips({
  title,
  intro,
  detailed = false,
}: {
  title: string;
  intro: string;
  /** Show each stop's longer description (the one-way page). */
  detailed?: boolean;
}) {
  return (
    <section className={styles.section} data-oneway aria-labelledby="one-way-title">
      <div className={styles.track} data-track>
        <div className={styles.pin}>
          <div className={`${ui.container} ${styles.layout}`}>
            {/* Phones: the map sits between the intro and the cards (CSS order). */}
            <div className={styles.side}>
              <div className={styles.intro}>
                <h2 id="one-way-title" className={styles.title}>
                  {title}
                </h2>
                <p className={styles.lead}>{intro}</p>
              </div>

              <ol className={styles.cards}>
                {ONE_WAY_ROUTE.map((stop) => (
                  <li
                    key={stop.city}
                    className={`${styles.card} ${styles.lit}`}
                    data-place={stop.city}
                  >
                    <h3 className={styles.cardCity}>{stop.city}</h3>
                    <p className={styles.cardNote}>{stop.note}</p>
                    {detailed && stop.detail && <p className={styles.cardDetail}>{stop.detail}</p>}
                    {stop.href && (
                      <Link href={stop.href} className={styles.cardLink}>
                        Book one-way to {stop.city}
                      </Link>
                    )}
                  </li>
                ))}
              </ol>
            </div>

            <div className={styles.mapWrap} data-map>
              <OneWayMap />
            </div>
          </div>
        </div>
      </div>

      {/* The routes in words: the map above is a picture. */}
      <div className={styles.srOnly}>
        <h3>One-way routes from Saigon</h3>
        <ul>
          {ONE_WAY_TRIPS.map((trip) => (
            <li key={trip.name}>
              <a href={trip.href}>{trip.name}</a>: {trip.days}, through {trip.via.join(", ")}.
            </li>
          ))}
        </ul>
      </div>

      <OneWayScroll />
    </section>
  );
}

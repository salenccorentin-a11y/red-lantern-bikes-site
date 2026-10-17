import Link from "next/link";
import styles from "./RouteLine.module.css";

export type RouteStop = {
  city: string;
  /** Short line under the city, e.g. "10 to 14 days". */
  note: string;
  /** Longer text for the detailed version. */
  detail?: string;
  href?: string;
};

/**
 * The signature element: Saigon → Da Nang → Hanoi as a red line with the
 * lantern's gold at each stop. Horizontal on wide screens, vertical on phones.
 */
export function RouteLine({ stops, detailed }: { stops: RouteStop[]; detailed?: boolean }) {
  return (
    <ol className={`${styles.route} ${detailed ? styles.detailed : ""}`}>
      {stops.map((stop, i) => (
        <li key={stop.city} className={styles.stop}>
          <span className={`${styles.dot} ${i === 0 ? styles.start : ""}`} aria-hidden="true" />
          <span className={styles.text}>
            {stop.href ? (
              <Link href={stop.href} className={styles.city}>
                {stop.city}
              </Link>
            ) : (
              <span className={styles.city}>{stop.city}</span>
            )}
            <span className={styles.note}>{stop.note}</span>
            {detailed && stop.detail && <span className={styles.detail}>{stop.detail}</span>}
          </span>
        </li>
      ))}
    </ol>
  );
}

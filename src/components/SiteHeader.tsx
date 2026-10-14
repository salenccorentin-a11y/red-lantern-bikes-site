import Link from "next/link";
import styles from "./SiteHeader.module.css";

export function SiteHeader() {
  return (
    <header className={styles.header}>
      <Link href="/" className={styles.brandLink}>
        <span className={styles.lantern} aria-hidden="true" />
        <span>
          <span className={styles.brand}>Red Lantern Bikes</span>
          <span className={styles.tagline}>
            Motorbike rentals and one-way trips from District 1, Saigon
          </span>
        </span>
      </Link>
    </header>
  );
}

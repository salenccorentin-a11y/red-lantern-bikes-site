import styles from "./page.module.css";

export default function Home() {
  return (
    <main className={styles.main}>
      <div className={styles.lantern} aria-hidden="true" />
      <h1 className={styles.brand}>Red Lantern Bikes</h1>
      <p className={styles.tagline}>Motorbike rentals and one-way trips from District 1, Saigon.</p>
      <p className={styles.soon}>Our new website is coming soon.</p>
    </main>
  );
}

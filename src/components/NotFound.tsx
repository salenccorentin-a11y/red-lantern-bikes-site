import Link from "next/link";
import styles from "./NotFound.module.css";

// "Page not found", used by every 404 on the site: inside the header and
// footer (the not-found.tsx files) and on its own (app/global-not-found.tsx).
export function NotFound({ full = false }: { full?: boolean }) {
  return (
    <main className={full ? `${styles.page} ${styles.full}` : styles.page}>
      <div className={styles.inner}>
        <h1>This page doesn&rsquo;t exist</h1>
        <p>The address may have changed when the site was rebuilt.</p>
        <p className={styles.actions}>
          <Link href="/" className={styles.primary}>
            Go to the home page
          </Link>
          <Link href="/bikes" className={styles.link}>
            See the bikes
          </Link>
        </p>
      </div>
    </main>
  );
}

"use client";

import Link from "next/link";
import styles from "./SiteHeader.module.css";
import { useDropdownClose } from "./useDropdownClose";

// Phones: a menu that opens without JavaScript; with it, the menu folds up
// as soon as a link is tapped (see useDropdownClose).
export function MobileMenu({
  nav,
  book,
  labels,
}: {
  nav: { href: string; label: string }[];
  book: string;
  labels: { menu: string; main: string; book: string };
}) {
  const ref = useDropdownClose();

  return (
    <details ref={ref} className={styles.mobileNav}>
      <summary>
        <span className={styles.burger} aria-hidden="true" />
        <span className={styles.menuLabel}>{labels.menu}</span>
      </summary>
      <nav aria-label={labels.main}>
        {nav.map((item) => (
          <Link key={item.href} href={item.href}>
            {item.label}
          </Link>
        ))}
        <Link href={book} className={styles.book}>
          {labels.book}
        </Link>
      </nav>
    </details>
  );
}

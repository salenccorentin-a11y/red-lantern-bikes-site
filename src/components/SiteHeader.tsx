import Link from "next/link";
import { Logo } from "./Logo";
import styles from "./SiteHeader.module.css";

const NAV = [
  { href: "/bikes", label: "Bikes" },
  { href: "/one-way", label: "One-way trips" },
  { href: "/tours", label: "Tours" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Contact" },
];

export function SiteHeader() {
  return (
    <header className={styles.header}>
      <a href="#main" className={styles.skip}>
        Skip to content
      </a>
      <div className={styles.inner}>
        <Logo />

        <nav className={styles.desktopNav} aria-label="Main">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href}>
              {item.label}
            </Link>
          ))}
          <Link href="/book" className={styles.book}>
            Book a bike
          </Link>
        </nav>

        {/* Phones: a menu that opens without JavaScript. */}
        <details className={styles.mobileNav}>
          <summary>
            <span className={styles.burger} aria-hidden="true" />
            Menu
          </summary>
          <nav aria-label="Main">
            {NAV.map((item) => (
              <Link key={item.href} href={item.href}>
                {item.label}
              </Link>
            ))}
            <Link href="/book" className={styles.book}>
              Book a bike
            </Link>
          </nav>
        </details>
      </div>
    </header>
  );
}

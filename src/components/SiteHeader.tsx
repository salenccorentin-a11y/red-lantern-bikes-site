import Link from "next/link";
import { Suspense } from "react";
import type { Locale } from "@/i18n/config";
import { getMessages } from "@/i18n";
import { localize } from "@/i18n/paths";
import { LanguageSwitcher, LanguageSwitcherFallback } from "./LanguageSwitcher";
import { Logo } from "./Logo";
import styles from "./SiteHeader.module.css";

export function SiteHeader({ lang = "en" }: { lang?: Locale }) {
  const t = getMessages(lang).nav;
  const nav = [
    { href: "/bikes", label: t.bikes },
    { href: "/one-way", label: t.oneWay },
    { href: "/tours", label: t.tours },
    { href: "/faq", label: t.faq },
    { href: "/contact", label: t.contact },
  ].map((item) => ({ ...item, href: localize(lang, item.href) }));
  const book = localize(lang, "/book");

  return (
    <header className={styles.header}>
      <a href="#main" className={styles.skip}>
        {t.skip}
      </a>
      <div className={styles.inner}>
        <Logo href={localize(lang, "/")} />

        <div className={styles.right}>
          <nav className={styles.desktopNav} aria-label={t.main}>
            {nav.map((item) => (
              <Link key={item.href} href={item.href}>
                {item.label}
              </Link>
            ))}
            <Link href={book} className={styles.book}>
              {t.book}
            </Link>
          </nav>

          {/* Reads the current page's address, so it waits for it. */}
          <Suspense fallback={<LanguageSwitcherFallback lang={lang} label={t.language} />}>
            <LanguageSwitcher lang={lang} label={t.language} />
          </Suspense>

          {/* Phones: a menu that opens without JavaScript. */}
          <details className={styles.mobileNav}>
            <summary>
              <span className={styles.burger} aria-hidden="true" />
              <span className={styles.menuLabel}>{t.menu}</span>
            </summary>
            <nav aria-label={t.main}>
              {nav.map((item) => (
                <Link key={item.href} href={item.href}>
                  {item.label}
                </Link>
              ))}
              <Link href={book} className={styles.book}>
                {t.book}
              </Link>
            </nav>
          </details>
        </div>
      </div>
    </header>
  );
}

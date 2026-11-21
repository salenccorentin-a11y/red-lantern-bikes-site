import Link from "next/link";
import { Suspense } from "react";
import type { Locale } from "@/i18n/config";
import { getMessages } from "@/i18n";
import { localize } from "@/i18n/paths";
import { LanguageSwitcher, LanguageSwitcherFallback } from "./LanguageSwitcher";
import { Logo } from "./Logo";
import { MobileMenu } from "./MobileMenu";
import styles from "./SiteHeader.module.css";

export function SiteHeader({ lang = "en" }: { lang?: Locale }) {
  const t = getMessages(lang).nav;
  const nav = [
    { href: "/bikes", label: t.bikes },
    { href: "/one-way", label: t.oneWay },
    { href: "/faq", label: t.faq },
    { href: "/blog", label: t.blog },
    { href: "/contact", label: t.contact },
  ].map((item) => ({
    ...item,
    // The blog is in English only, so /fr and /ko link to the English one.
    href: item.href === "/blog" ? item.href : localize(lang, item.href),
  }));
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

          <MobileMenu
            nav={nav}
            book={book}
            labels={{ menu: t.menu, main: t.main, book: t.book }}
          />
        </div>
      </div>
    </header>
  );
}

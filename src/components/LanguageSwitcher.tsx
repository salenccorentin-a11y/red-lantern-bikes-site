"use client";

import { usePathname } from "next/navigation";
import { LOCALES, LOCALE_NAME, type Locale } from "@/i18n/config";
import { isTranslatedPath, localize, splitLocale } from "@/i18n/paths";
import styles from "./LanguageSwitcher.module.css";

// The same page in another language; the language's home page when a page
// isn't translated (about, blog, terms…). A <details> menu, so it works
// without JavaScript too.

export function LanguageSwitcher({ lang, label }: { lang: Locale; label: string }) {
  const pathname = usePathname();
  const { path } = splitLocale(pathname);
  const target = (to: Locale) => (isTranslatedPath(path) ? localize(to, path) : localize(to, "/"));

  return (
    <details className={styles.switcher}>
      <summary aria-label={label}>
        <GlobeIcon />
        <span className={styles.code}>{lang.toUpperCase()}</span>
      </summary>
      <ul>
        {LOCALES.map((to) => (
          <li key={to}>
            {/* A plain link: a different language is a fresh page load. */}
            <a
              href={target(to)}
              hrefLang={to}
              lang={to}
              aria-current={to === lang ? "true" : undefined}
            >
              {LOCALE_NAME[to]}
            </a>
          </li>
        ))}
      </ul>
    </details>
  );
}

/** Links to each language's home page, while the current page is loading. */
export function LanguageSwitcherFallback({ lang, label }: { lang: Locale; label: string }) {
  return (
    <details className={styles.switcher}>
      <summary aria-label={label}>
        <GlobeIcon />
        <span className={styles.code}>{lang.toUpperCase()}</span>
      </summary>
      <ul>
        {LOCALES.map((to) => (
          <li key={to}>
            <a href={localize(to, "/")} hrefLang={to} lang={to}>
              {LOCALE_NAME[to]}
            </a>
          </li>
        ))}
      </ul>
    </details>
  );
}

function GlobeIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />
    </svg>
  );
}

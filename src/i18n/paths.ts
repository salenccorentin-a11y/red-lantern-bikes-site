// Addresses in each language. Only these pages exist in French and Korean;
// links to any other page (about, blog, terms, privacy) stay in English.

import type { Metadata } from "next";
import { LOCALES, PREFIXED_LOCALES, type Locale } from "./config";

const TRANSLATED_PATHS = [
  /^\/$/,
  /^\/bikes(\/[^/]+)?$/,
  /^\/one-way$/,
  /^\/faq$/,
  /^\/contact$/,
  /^\/book$/,
  /^\/booking\/[^/]+$/,
];

export function isTranslatedPath(pathname: string): boolean {
  return TRANSLATED_PATHS.some((pattern) => pattern.test(pathname));
}

/**
 * The address of a page in a language: "/bikes" → "/fr/bikes". Query and
 * #anchor are kept. Pages without a translation keep their English address.
 */
export function localize(lang: Locale, href: string): string {
  const match = /^([^?#]*)(.*)$/.exec(href)!;
  const [pathname, rest] = [match[1] || "/", match[2]];
  if (lang === "en" || !isTranslatedPath(pathname)) return href;
  return `/${lang}${pathname === "/" ? "" : pathname}${rest}`;
}

/** "/fr/bikes" → { lang: "fr", path: "/bikes" }; "/bikes" → { lang: "en", path: "/bikes" }. */
export function splitLocale(pathname: string): { lang: Locale; path: string } {
  for (const lang of PREFIXED_LOCALES) {
    if (pathname === `/${lang}`) return { lang, path: "/" };
    if (pathname.startsWith(`/${lang}/`)) return { lang, path: pathname.slice(lang.length + 1) };
  }
  return { lang: "en", path: pathname };
}

/**
 * Canonical address and the other languages (hreflang), for a translated
 * page's metadata. English is also the default for other languages.
 */
export function languageAlternates(lang: Locale, path: string): Metadata["alternates"] {
  const languages: Record<string, string> = Object.fromEntries(
    LOCALES.map((l) => [l, localize(l, path)]),
  );
  languages["x-default"] = path;
  return { canonical: localize(lang, path), languages };
}

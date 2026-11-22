// For pages under app/[lang]: the language from the address, or a 404.

import { notFound } from "next/navigation";
import { isLocale, PREFIXED_LOCALES, type Locale } from "./config";

/** /fr/…, /ko/… and /vi/… only: English pages live at their original addresses. */
export async function langFrom(params: Promise<{ lang: string }>): Promise<Locale> {
  const { lang } = await params;
  if (!isLocale(lang) || lang === "en") notFound();
  return lang;
}

/**
 * For the [lang] root layout, which must always draw a page: the language
 * from the address, or English when it is not /fr, /ko or /vi. The pages below
 * still call langFrom, so an unknown address (/nope, /xx/book) becomes a 404
 * drawn inside the site's header and footer (app/[lang]/not-found.tsx).
 */
export async function langOrEnglish(params: Promise<{ lang: string }>): Promise<Locale> {
  const { lang } = await params;
  return isLocale(lang) && lang !== "en" ? lang : "en";
}

export function langParams() {
  return PREFIXED_LOCALES.map((lang) => ({ lang }));
}

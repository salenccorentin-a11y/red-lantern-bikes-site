// For pages under app/[lang]: the language from the address, or a 404.

import { notFound } from "next/navigation";
import { isLocale, PREFIXED_LOCALES, type Locale } from "./config";

/** /fr/… and /ko/… only: English pages live at their original addresses. */
export async function langFrom(params: Promise<{ lang: string }>): Promise<Locale> {
  const { lang } = await params;
  if (!isLocale(lang) || lang === "en") notFound();
  return lang;
}

export function langParams() {
  return PREFIXED_LOCALES.map((lang) => ({ lang }));
}

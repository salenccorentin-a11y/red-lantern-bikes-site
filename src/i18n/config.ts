// The site's languages. English pages keep their original addresses
// (/bikes); French, Korean and Vietnamese ones are under /fr, /ko and /vi
// (/fr/bikes).
// Only the key pages and the booking steps are translated (see paths.ts);
// the rest (about, blog, terms, privacy) is in English.

export const LOCALES = ["en", "fr", "ko", "vi"] as const;
export type Locale = (typeof LOCALES)[number];

/** Languages with their own /fr, /ko, /vi addresses. */
export const PREFIXED_LOCALES = ["fr", "ko", "vi"] as const satisfies readonly Locale[];

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}

/** Each language's name, written in that language (for the switcher). */
export const LOCALE_NAME: Record<Locale, string> = {
  en: "English",
  fr: "Français",
  ko: "한국어",
  vi: "Tiếng Việt",
};

/** For dates and the html lang attribute. */
export const DATE_LOCALE: Record<Locale, string> = {
  en: "en-GB",
  fr: "fr-FR",
  ko: "ko-KR",
  vi: "vi-VN",
};

/** For Open Graph (link previews). */
export const OG_LOCALE: Record<Locale, string> = {
  en: "en_US",
  fr: "fr_FR",
  ko: "ko_KR",
  vi: "vi_VN",
};

/** Fills "{name}" placeholders: fill("{days} days", { days: 8 }) → "8 days". */
export function fill(text: string, values: Record<string, string | number>): string {
  return text.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in values ? String(values[key]) : match,
  );
}

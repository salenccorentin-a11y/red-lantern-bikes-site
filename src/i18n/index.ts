// Picks wording and content for a language. English content lives in
// src/content (the reference); French and Korean in src/i18n/content.
//
// Server code only: interactive (client) components receive the wording they
// need as props, so browsers never download the other languages.

import {
  BIKE_CONTENT,
  BIKE_FACTS,
  LICENCE_TEXT,
  type BikeContent,
  type BikeFacts,
} from "@/content/bikes";
import { BUSINESS } from "@/content/business";
import { FAQ, type Faq } from "@/content/faq";
import { ONE_WAY_ROUTE, type RouteStop } from "@/content/route";
import type { City } from "@/generated/prisma/enums";
import { formatDisplayDate, formatSaigonDateTime } from "@/lib/dates";
import { fill, type Locale } from "./config";
import { frContent } from "./content/fr";
import { koContent } from "./content/ko";
import type { TranslatedContent } from "./content/types";
import { en, type Messages } from "./messages/en";
import { fr } from "./messages/fr";
import { ko } from "./messages/ko";
import { localize } from "./paths";

const MESSAGES: Record<Locale, Messages> = { en, fr, ko };
const CONTENT: Record<Exclude<Locale, "en">, TranslatedContent> = { fr: frContent, ko: koContent };

export function getMessages(lang: Locale): Messages {
  return MESSAGES[lang];
}

const translated = (lang: Locale) => (lang === "en" ? null : CONTENT[lang]);

export function bikeContent(lang: Locale, slug: string): BikeContent | undefined {
  const base = BIKE_CONTENT[slug];
  const t = translated(lang)?.bikes[slug];
  return base && t ? { ...base, ...t } : base;
}

/**
 * Customer text for a model: the written text for the original twelve, or,
 * for a model added from the staff area, the text entered there (in English
 * on every language's page until it's translated).
 */
export function modelContent(
  lang: Locale,
  model: {
    slug: string;
    name: string;
    summary?: string | null;
    description?: string | null;
    licence?: BikeContent["licence"] | null;
  },
): BikeContent | undefined {
  const written = bikeContent(lang, model.slug);
  if (written) return written;
  if (!model.summary || !model.description) return undefined;
  return {
    summary: model.summary,
    description: model.description,
    bestFor: [],
    licence: model.licence ?? "IDP_OR_A1",
    seoTitle: `${model.name} Rental Saigon | Red Lantern Bikes`,
    seoDescription: model.summary,
  };
}

/** A bike's facts and specifications (numbers only, the same in every language). */
export function bikeFacts(slug: string): BikeFacts {
  return BIKE_FACTS[slug] ?? {};
}

export function licenceText(lang: Locale, licence: BikeContent["licence"]): string {
  return translated(lang)?.licence[licence] ?? LICENCE_TEXT[licence];
}

/** A bike's "kind" (from the database, in English), e.g. "Manual dual-sport". */
export function kindLabel(lang: Locale, kind: string): string {
  return translated(lang)?.kinds[kind] ?? kind;
}

export function faqFor(lang: Locale): Faq[] {
  return translated(lang)?.faq ?? FAQ;
}

/** The one-way stops, with links in the same language. */
export function oneWayRouteFor(lang: Locale): RouteStop[] {
  const t = translated(lang);
  return ONE_WAY_ROUTE.map((stop) => ({
    ...stop,
    ...t?.route[stop.city],
    href: stop.href && localize(lang, stop.href),
  }));
}

export function includedFor(lang: Locale): readonly string[] {
  return translated(lang)?.included ?? BUSINESS.included;
}

export function hoursFor(lang: Locale): string {
  return translated(lang)?.hours ?? BUSINESS.hours;
}

/** An extra's name and note, by its slug; English (from the database) if not translated. */
export function addOnText(
  lang: Locale,
  slug: string,
  english: { name: string; description: string | null },
): { name: string; description: string | null } {
  return translated(lang)?.addOns[slug] ?? english;
}

export function cityName(lang: Locale, city: City): string {
  return MESSAGES[lang].common.city[city];
}

/** e.g. "Saigon (return to the shop)" or "Hanoi (one-way)". */
export function dropoffLabelFor(lang: Locale, city: City): string {
  const common = MESSAGES[lang].common;
  return city === "SAIGON"
    ? common.dropoffReturn
    : fill(common.dropoffOneWay, { city: common.city[city] });
}

/** "8 days" / "8 jours" / "8일". */
export function daysLabel(lang: Locale, n: number): string {
  const common = MESSAGES[lang].common;
  return fill(n === 1 ? common.day : common.days, { n });
}

export function formatDate(lang: Locale, isoDate: string): string {
  return formatDisplayDate(isoDate, lang);
}

export function formatDateTime(lang: Locale, moment: Date): string {
  return formatSaigonDateTime(moment, lang);
}

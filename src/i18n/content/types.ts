// The shape of translated content (bike descriptions, FAQ, tours, route).
// English stays in src/content; src/i18n/content/index.ts picks the language.

export type TranslatedContent = {
  bikes: Record<
    string,
    {
      summary: string;
      description: string;
      bestFor: string[];
      seoTitle: string;
      seoDescription: string;
    }
  >;
  licence: { IDP_OR_A1: string; A2: string };
  /** The bike "kind" shown on cards, keyed by its English wording in the database. */
  kinds: Record<string, string>;
  faq: { id: string; question: string; answer: string[] }[];
  tours: Record<
    string,
    {
      name: string;
      summary: string;
      description: string[];
      duration: string | null;
      groupSize: string;
      priceFrom: string | null;
      highlights: string[];
    }
  >;
  /** The one-way stops, keyed by English city name. */
  route: Record<string, { city: string; note: string; detail: string }>;
  included: string[];
  hours: string;
  /** Extras, keyed by their slug in the database. */
  addOns: Record<string, { name: string; description: string }>;
};

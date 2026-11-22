// Permanent (301) redirects from the old Odoo site's addresses to the new
// pages. Built from the crawl in docs/seo/old-site-crawl.json and checked by
// scripts/seo/check-redirects.ts.
//
// Addresses that stay the same (/, /terms, /blog and its posts) need no rule.
// Every rule is repeated under the old language prefixes. Old French (/fr) and
// Korean (/ko_KR) and Vietnamese (/vi) addresses go to the new French (/fr),
// Korean (/ko) and Vietnamese (/vi) page
// where one exists; the other languages go to the English page. Always one hop.

import { BUSINESS } from "../content/business";
import type { Locale } from "../i18n/config";
import { localize } from "../i18n/paths";

type Redirect = { source: string; destination: string; statusCode: 301 };

/** Old languages with no version on the new site: everything goes to English. */
const LANGS = "nl|ja|zh_CN";
/** Old language prefix → the new site's language. */
const KEPT_LANGS: [string, Locale][] = [
  ["fr", "fr"],
  ["ko_KR", "ko"],
  ["vi", "vi"],
];
const OLD_PREFIXES = `${LANGS}|${KEPT_LANGS.map(([prefix]) => prefix).join("|")}`;

/** Old shop product slug → new bike page (or the bike list if not in the fleet). */
export const PRODUCT_TO_BIKE: Record<string, string> = {
  "honda-wave-alpha-110cc-35": "/bikes/wave-alpha-110",
  "suzuki-gd110-38": "/bikes/suzuki-gd110",
  "suzuki-en-125-13": "/bikes/suzuki-en125",
  "yamaha-nvx-125-155-12": "/bikes/yamaha-nvx125",
  "honda-winner-x-150cc-20": "/bikes/honda-winner-x-150",
  "suzuki-gsxr-r-150-22": "/bikes/suzuki-gsx-r150",
  "honda-xr150-36": "/bikes/honda-xr150",
  "honda-cb150x-17": "/bikes/honda-cb150x",
  "yamaha-wr155r-40": "/bikes/yamaha-wr155r",
  "kawasaki-versys-x-300-37": "/bikes/kawasaki-versys-x300",
  // Not in the current fleet.
  "yamaha-r15v3-19": "/bikes",
};

/** Rules without the language prefix, most specific first. */
function englishRules(): [string, string][] {
  const rules: [string, string][] = [
    ["/about-us", "/about"],
    ["/contactus", "/contact"],
    ["/appointment", "/contact"],
    ["/calendar", "/contact"],
    ["/helpdesk", "/contact"],
    ["/helpdesk/:path*", "/contact"],
  ];
  for (const [product, bike] of Object.entries(PRODUCT_TO_BIKE)) {
    rules.push([`/shop/${product}`, bike], [`/shop/:category/${product}`, bike]);
  }
  rules.push(
    ["/shop/:page(cart|wishlist|checkout|payment|confirmation|address)", "/book"],
    ["/shop/:page(cart|wishlist|checkout|payment|confirmation|address)/:path*", "/book"],
    ["/shop", "/bikes"],
    ["/shop/:path*", "/bikes"],
    ["/blog/success-stories-3", "/blog"],
    ["/web/login", "/staff/login"],
  );
  for (const [name, url] of Object.entries(BUSINESS.social)) {
    if (url) rules.push([`/website/social/${name}`, url]);
  }
  return rules;
}

export function oldSiteRedirects(): Redirect[] {
  const rules = englishRules();
  const withLang = rules.map(([source, destination]): [string, string] => [
    `/:lang(${LANGS})${source}`,
    destination,
  ]);
  // Odoo translated blog category names in some languages (e.g. /zh_CN/blog/旅行-1
  // for /blog/our-blog-1) but kept the number at the end. Match on the number.
  const blogCategories: [string, string][] = [
    ["1", "/blog/our-blog-1"],
    ["2", "/blog/news-2"],
    ["3", "/blog"],
  ].flatMap(([id, category]): [string, string][] => [
    [`/:lang(${OLD_PREFIXES})/blog/:category([^/]+-${id})`, category],
    [
      `/:lang(${OLD_PREFIXES})/blog/:category([^/]+-${id})/:post`,
      id === "3" ? "/blog" : `${category}/:post`,
    ],
  ]);

  // French and Korean: the same rules, landing on the page in that language
  // (pages without a translation, like the blog, stay English).
  const keptLangs = KEPT_LANGS.flatMap(([prefix, lang]): [string, string][] => [
    ...rules.map(([source, destination]): [string, string] => [
      `/${prefix}${source}`,
      localize(lang, destination),
    ]),
    // The old site's other pages. /fr itself is now the French home page, so
    // there is no catch-all for it: only the old addresses are listed.
    ...(prefix === lang
      ? ([
          [`/${prefix}/blog`, "/blog"],
          [`/${prefix}/blog/:path*`, "/blog/:path*"],
          [`/${prefix}/terms`, "/terms"],
        ] as [string, string][])
      : ([
          [`/${prefix}`, `/${lang}`],
          [`/${prefix}/:path*`, "/:path*"],
        ] as [string, string][])),
  ]);

  // The tour pages were removed on 16 Nov 2026 (no guided tours, only
  // self-guided trips). Links to them land on the one-way page instead.
  const removedTours: [string, string][] = (["en", "fr", "ko", "vi"] as Locale[]).flatMap(
    (lang): [string, string][] => {
      const prefix = lang === "en" ? "" : `/${lang}`;
      return [
        [`${prefix}/tours`, localize(lang, "/one-way")],
        [`${prefix}/tours/:slug`, localize(lang, "/one-way")],
      ];
    },
  );

  return [
    ...rules,
    ...removedTours,
    ...withLang,
    ...blogCategories,
    ...keptLangs,
    // Anything else under a language prefix: the same page in English.
    [`/:lang(${LANGS})`, "/"],
    [`/:lang(${LANGS})/:path*`, "/:path*"],
  ].map(([source, destination]) => ({ source, destination, statusCode: 301 as const }));
}

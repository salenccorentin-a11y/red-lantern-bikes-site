// Link previews (Facebook, WhatsApp, Zalo, X…) for every public page.
//
// Next.js replaces the whole `openGraph` object when a page sets its own, so a
// page that only set its locale used to lose the picture, the site name and
// the type. Every page builds its preview here instead.

import type { Metadata } from "next";
import { BUSINESS } from "@/content/business";
import { OG_LOCALE, type Locale } from "@/i18n/config";
import { localize } from "@/i18n/paths";

export type ShareImage = { url: string; width?: number; height?: number; alt?: string };

/** 1200 × 630 JPG (the size Facebook and WhatsApp expect): the karst road photo. */
export const DEFAULT_SHARE_IMAGE: ShareImage = {
  url: "/share/red-lantern-bikes.jpg",
  width: 1200,
  height: 630,
  alt: "A red Suzuki motorbike on a mountain road in Vietnam",
};

type ShareOptions = {
  /** The page's address without the language prefix, e.g. "/bikes". */
  path: string;
  lang?: Locale;
  images?: ShareImage[];
  /** Blog posts: "article", with the date they were published. */
  article?: { publishedTime?: string };
};

export function shareMetadata({
  path,
  lang = "en",
  images = [DEFAULT_SHARE_IMAGE],
  article,
}: ShareOptions): Pick<Metadata, "openGraph" | "twitter"> {
  const common = {
    siteName: BUSINESS.name,
    locale: OG_LOCALE[lang],
    url: localize(lang, path),
    images,
  };
  return {
    openGraph: article
      ? {
          ...common,
          type: "article",
          ...(article.publishedTime && { publishedTime: article.publishedTime }),
        }
      : { ...common, type: "website" },
    twitter: { card: "summary_large_image", images: images.map((i) => i.url) },
  };
}

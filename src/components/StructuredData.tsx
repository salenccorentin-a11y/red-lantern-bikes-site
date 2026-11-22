// Structured data (schema.org JSON-LD) that helps search engines show the
// site's name, breadcrumbs and article details in results. Only facts the
// site already shows go in.

import { BUSINESS } from "@/content/business";
import { DATE_LOCALE, type Locale } from "@/i18n/config";
import { localize } from "@/i18n/paths";
import { siteUrl } from "@/seo/site";

export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}

/** The lantern, 512 × 512, from app/icon.png. */
export function logoUrl(): string {
  return `${siteUrl()}/icon.png`;
}

/** Organization that publishes the blog posts. */
function organization() {
  return {
    "@type": "Organization",
    "@id": `${siteUrl()}/#organization`,
    name: BUSINESS.name,
    url: `${siteUrl()}/`,
    logo: logoUrl(),
  };
}

/** The site itself, on the home page: gives Google the site name to show. */
export function WebSiteData({ lang }: { lang: Locale }) {
  const base = siteUrl();
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "WebSite",
        "@id": `${base}/#website`,
        name: BUSINESS.name,
        url: `${base}${localize(lang, "/")}`,
        inLanguage: DATE_LOCALE[lang],
        publisher: organization(),
      }}
    />
  );
}

/** Breadcrumb trail; the last item is the page itself. */
export function BreadcrumbData({ items }: { items: { name: string; path: string }[] }) {
  const base = siteUrl();
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: items.map((item, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: item.name,
          item: base + item.path,
        })),
      }}
    />
  );
}

export function BlogPostingData({
  title,
  description,
  path,
  image,
  date,
}: {
  title: string;
  description: string | null;
  path: string;
  image: string | null;
  date: string | null;
}) {
  const base = siteUrl();
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        headline: title,
        ...(description && { description }),
        ...(image && { image: [base + image] }),
        ...(date && { datePublished: date, dateModified: date }),
        inLanguage: "en",
        mainEntityOfPage: base + path,
        author: organization(),
        publisher: organization(),
      }}
    />
  );
}

// Structured data that tells search engines (Google Maps and local results)
// who we are, where to find us and when we're open. Only facts we know go in;
// anything null in src/content/business.ts (postcode, public email) is left out. No star rating: search engines ignore ratings a
// business publishes about itself.

import { BUSINESS, mapsLink } from "@/content/business";
import { siteUrl } from "@/seo/site";

export function LocalBusinessData() {
  const base = siteUrl();
  const data = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": `${base}/#business`,
    name: BUSINESS.name,
    description:
      "Motorbike rentals in District 1, Saigon, with one-way rentals to Hanoi and Da Nang and guided tours.",
    url: base,
    address: {
      "@type": "PostalAddress",
      streetAddress: `${BUSINESS.street}, ${BUSINESS.district}`,
      addressLocality: BUSINESS.city,
      ...(BUSINESS.postalCode && { postalCode: BUSINESS.postalCode }),
      addressCountry: "VN",
    },
    hasMap: mapsLink(),
    areaServed: "Vietnam",
    priceRange: "₫₫",
    ...(BUSINESS.phone && { telephone: BUSINESS.phone }),
    ...(BUSINESS.email && { email: BUSINESS.email }),
    openingHoursSpecification: {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
      opens: BUSINESS.opens,
      closes: BUSINESS.closes,
    },
    sameAs: Object.values(BUSINESS.social).filter(Boolean),
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}

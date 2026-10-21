// Facts about the business, used across the site, in emails and in the
// search-engine data. Edit here; every page picks it up.
//
// null = not known yet. Pages leave out anything that's null rather than
// showing a placeholder.

export const BUSINESS = {
  name: "Red Lantern Bikes",
  tagline: "Motorbike rentals and one-way trips from District 1, Saigon",
  street: "235B/A11/9 Nguyen Van Cu",
  district: "District 1",
  city: "Ho Chi Minh City",
  country: "Vietnam",
  postalCode: null as string | null,
  /** For the "Open in Google Maps" link. */
  mapsQuery: "235B/A11/9 Nguyen Van Cu, District 1, Ho Chi Minh City",
  /** Opening hours, shown on the site. */
  hours: "Open every day, 8am to 7pm",
  /** The same hours for search engines (24-hour clock, every day). */
  opens: "08:00",
  closes: "19:00",
  /** International format, e.g. "+84 90 123 4567". */
  phone: "+84 382 681 859" as string | null,
  /** International format without spaces or "+", e.g. "84901234567", for wa.me links. */
  whatsapp: "84382681859" as string | null,
  email: null as string | null,
  googleRating: "4.9",
  social: {
    // Found through the old site's social links.
    facebook: "https://www.facebook.com/profile.php?id=61569697091099" as string | null,
    instagram: "https://www.instagram.com/redlanternbikes/" as string | null,
    youtube: "https://www.youtube.com/@redlanternbikes" as string | null,
    tiktok: "https://www.tiktok.com/@redlanternbikes" as string | null,
  },
  founders: [
    {
      name: "Phi",
      role: "Founder",
      bio: "Phi has spent 15 years keeping motorbikes running, and he looks after every bike in our fleet.",
    },
    {
      name: "Coco",
      role: "Co-founder, customer care and tour guide",
      bio: "Coco looks after riders before, during and after their trip, and leads our guided tours. The Coco Loop is his favourite ride.",
    },
  ],
  /** Included with every rental, at no extra cost. */
  included: [
    "Full-face helmet",
    "Phone holder",
    "Luggage rack and bungee cords",
    "Printed map of our favourite roads",
    "Roadside assistance anywhere in Vietnam, by WhatsApp",
    "Free delivery to your hotel in or near District 1",
  ],
} as const;

export function whatsappLink(message?: string): string | null {
  if (!BUSINESS.whatsapp) return null;
  const text = message ? `?text=${encodeURIComponent(message)}` : "";
  return `https://wa.me/${BUSINESS.whatsapp}${text}`;
}

export function mapsLink(): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(BUSINESS.mapsQuery)}`;
}

export const ADDRESS_LINE = `${BUSINESS.street}, ${BUSINESS.district}, ${BUSINESS.city}`;

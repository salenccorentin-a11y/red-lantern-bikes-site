import type { Metadata, Viewport } from "next";
import { Be_Vietnam_Pro } from "next/font/google";
import { siteUrl } from "@/seo/site";
import "@/app/globals.css";

// The <html> and <body> shared by the site's two root layouts:
// app/(en)/layout.tsx (English, at the original addresses) and
// app/[lang]/layout.tsx (/fr and /ko). Each sets its own `lang` on <html>,
// so browsers, screen readers, translation prompts and search engines all
// read the page's real language.

// One family for everything (docs/design.md): designed for Vietnamese, so
// place names keep their accents properly. Only the basic Latin files are
// downloaded up front; the Vietnamese letters still load when a page uses them.
const beVietnam = Be_Vietnam_Pro({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

// Defaults for every page; pages set their own title, description and
// canonical address. metadataBase makes those addresses absolute.
export const rootMetadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: "Red Lantern Bikes",
  description: "Motorbike rentals and one-way trips from District 1, Saigon.",
  openGraph: {
    siteName: "Red Lantern Bikes",
    locale: "en_US",
    type: "website",
    images: [{ url: "/photos/karst-road.webp", width: 2000, height: 1500 }],
  },
};

export const rootViewport: Viewport = {
  themeColor: "#0F1B2D",
};

export function RootDocument({ lang, children }: { lang: string; children: React.ReactNode }) {
  return (
    <html lang={lang} className={beVietnam.variable}>
      <body>{children}</body>
    </html>
  );
}

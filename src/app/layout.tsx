import type { Metadata, Viewport } from "next";
import { Be_Vietnam_Pro } from "next/font/google";
import { siteUrl } from "@/seo/site";
import "./globals.css";

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
export const metadata: Metadata = {
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

export const viewport: Viewport = {
  themeColor: "#0F1B2D",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={beVietnam.variable}>
      <body>{children}</body>
    </html>
  );
}

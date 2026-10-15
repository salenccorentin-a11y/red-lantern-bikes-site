import type { Metadata, Viewport } from "next";
import { Inter, Oswald } from "next/font/google";
import { siteUrl } from "@/seo/site";
import "./globals.css";

const inter = Inter({
  variable: "--font-body",
  subsets: ["latin", "vietnamese"],
});

const oswald = Oswald({
  variable: "--font-display",
  subsets: ["latin", "vietnamese"],
  weight: ["500", "600"],
});

// Defaults for every page; pages set their own title, description and
// canonical address. metadataBase makes those addresses absolute.
export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: "Red Lantern Bikes",
  description: "Motorbike rentals and one-way trips from District 1, Saigon.",
  openGraph: { siteName: "Red Lantern Bikes", locale: "en_US", type: "website" },
};

export const viewport: Viewport = {
  themeColor: "#B3261E",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} ${oswald.variable}`}>
      <body>{children}</body>
    </html>
  );
}

import type { Metadata, Viewport } from "next";
import { Inter, Oswald } from "next/font/google";
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

// Placeholder until the old site's titles and descriptions are migrated (step 10).
export const metadata: Metadata = {
  title: "Red Lantern Bikes",
  description: "Motorbike rentals and one-way trips from District 1, Saigon.",
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

import { RootDocument, rootMetadata, rootViewport } from "@/components/RootDocument";

// Root layout of the English site (public pages, booking steps, staff).
// The /fr and /ko pages have their own root layout (app/[lang]/layout.tsx)
// so each language sets its own <html lang>. Moving between the two is a
// full page load, which only happens when someone switches language.
export const metadata = rootMetadata;
export const viewport = rootViewport;

export default function EnglishRootLayout({ children }: { children: React.ReactNode }) {
  return <RootDocument lang="en">{children}</RootDocument>;
}

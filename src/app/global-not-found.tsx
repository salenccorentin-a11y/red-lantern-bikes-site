import type { Metadata } from "next";
import { NotFound } from "@/components/NotFound";
import { RootDocument, rootViewport } from "@/components/RootDocument";

// The 404 for addresses that match no route at all (deeper than any page,
// e.g. /a/b/c/d). The site has two root layouts (English, and /fr + /ko), so
// there is no single layout to draw it inside: Next.js serves this page on its
// own (experimental.globalNotFound). Missing bikes, posts or languages are
// handled by the not-found.tsx files, inside the header and footer.
export const metadata: Metadata = {
  title: "Page not found | Red Lantern Bikes",
  robots: { index: false },
};
export const viewport = rootViewport;

export default function GlobalNotFound() {
  return (
    <RootDocument lang="en">
      <NotFound full />
    </RootDocument>
  );
}

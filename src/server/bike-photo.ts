// A model's studio photo: public/bikes/<slug>.webp (made by
// scripts/brand/prepare-photos.cjs). A model added from the staff area has
// none until we add it, so the shop's lantern stands in.

import { existsSync } from "node:fs";
import path from "node:path";

export const PHOTO_PLACEHOLDER = "/brand/lantern.webp";

const found = new Map<string, boolean>();

export function studioPhoto(slug: string): string {
  let has = found.get(slug);
  if (has === undefined) {
    has = existsSync(path.join(process.cwd(), "public", "bikes", `${slug}.webp`));
    found.set(slug, has);
  }
  return has ? `/bikes/${slug}.webp` : PHOTO_PLACEHOLDER;
}

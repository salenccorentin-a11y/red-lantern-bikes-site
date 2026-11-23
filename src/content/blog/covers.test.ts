import { describe, expect, it } from "vitest";
import { POSTS } from "./index";

// Files that hold the same photo under another name. A post using one of them
// counts as using the other (owner, 2026-11-23: no two posts share a cover).
const SAME_PHOTO: Record<string, string> = {
  "/blog/ho-chi-minh-city-to-hanoi-by-motorbike-the-complete-route-guide-2026-3.webp":
    "/photos/karst-road.webp",
  "/photos/karst-road-phone.webp": "/photos/karst-road.webp",
};

describe("blog covers", () => {
  it("never repeat between posts", () => {
    const seen = new Map<string, string>();
    for (const post of POSTS) {
      if (!post.cover) continue;
      const photo = SAME_PHOTO[post.cover] ?? post.cover;
      expect(seen.get(photo), `${post.postSlug} reuses the cover of ${seen.get(photo)}`).toBeUndefined();
      seen.set(photo, post.postSlug);
    }
  });
});

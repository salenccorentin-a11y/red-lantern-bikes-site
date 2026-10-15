// Blog posts moved from the old site (scripts/seo/import-blog.ts), served at
// their original addresses, e.g. /blog/news-2/best-motorbikes-to-rent-in-vietnam-2026-4.

import posts from "./posts.json";

export type BlogPost = (typeof posts)[number];

/** Newest first. */
export const POSTS: BlogPost[] = [...posts].sort((a, b) =>
  (b.date ?? "").localeCompare(a.date ?? ""),
);

/** Blog categories that have posts, by their old URL slug. */
export const CATEGORIES = [
  ...new Map(POSTS.map((p) => [p.blogSlug, p.category ?? p.blogSlug])).entries(),
].map(([slug, name]) => ({ slug, name }));

export function findPost(blogSlug: string, postSlug: string) {
  return POSTS.find((p) => p.blogSlug === blogSlug && p.postSlug === postSlug);
}

/** Some old titles were cut off mid-word ("| Red Lantern Bik"); finish them. */
export function fullTitle(title: string): string {
  return title.replace(/\|\s*Red Lantern(?: Bik\w*)?\s*$/, "| Red Lantern Bikes");
}

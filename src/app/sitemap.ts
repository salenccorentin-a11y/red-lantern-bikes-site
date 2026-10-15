import type { MetadataRoute } from "next";
import { BIKE_CONTENT } from "@/content/bikes";
import { POSTS, CATEGORIES } from "@/content/blog";
import { TOURS } from "@/content/tours";
import { siteUrl } from "@/seo/site";

// Built from the content files, so it needs no database. Private pages
// (staff, customers' booking pages) are left out.
export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl();
  const pages: { path: string; priority: number; lastModified?: string }[] = [
    { path: "/", priority: 1 },
    { path: "/book", priority: 0.9 },
    { path: "/bikes", priority: 0.9 },
    { path: "/one-way", priority: 0.9 },
    { path: "/tours", priority: 0.7 },
    { path: "/about", priority: 0.5 },
    { path: "/faq", priority: 0.6 },
    { path: "/contact", priority: 0.5 },
    { path: "/blog", priority: 0.6 },
    { path: "/terms", priority: 0.2 },
    { path: "/privacy", priority: 0.2 },
    ...Object.keys(BIKE_CONTENT).map((slug) => ({ path: `/bikes/${slug}`, priority: 0.8 })),
    ...TOURS.map((t) => ({ path: `/tours/${t.slug}`, priority: 0.6 })),
    ...CATEGORIES.map((c) => ({ path: `/blog/${c.slug}`, priority: 0.4 })),
    ...POSTS.map((p) => ({ path: p.path, priority: 0.6, lastModified: p.date ?? undefined })),
  ];
  return pages.map((p) => ({
    url: base + p.path,
    priority: p.priority,
    lastModified: p.lastModified,
  }));
}

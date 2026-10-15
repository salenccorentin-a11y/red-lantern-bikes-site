// Copies the old Odoo blog posts into the new site, unchanged in wording:
// title, subtitle, date, cover image, page title, meta description and body.
// The body is cleaned of Odoo markup (styles, classes, <font> tags) but keeps
// its headings, paragraphs, lists and links.
//
//   npx tsx scripts/seo/import-blog.ts
//
// Writes src/content/blog/posts.json and the cover images to public/blog/.

import { mkdirSync, writeFileSync } from "node:fs";
import * as cheerio from "cheerio";
import type { AnyNode } from "domhandler";

const ORIGIN = "https://www.redlanternbikes.com";
const POSTS = [
  "/blog/our-blog-1/motorbike-rental-in-saigon-everything-you-need-to-know-2",
  "/blog/news-2/ho-chi-minh-city-to-hanoi-by-motorbike-the-complete-route-guide-2026-3",
  "/blog/news-2/best-motorbikes-to-rent-in-vietnam-2026-4",
];

const KEEP_TAGS = new Set([
  "p",
  "br",
  "h2",
  "h3",
  "h4",
  "ul",
  "ol",
  "li",
  "a",
  "strong",
  "b",
  "em",
  "i",
  "blockquote",
  "table",
  "thead",
  "tbody",
  "tr",
  "th",
  "td",
  "hr",
]);
const MONTH_DATE =
  /(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},\s+\d{4}/;

function cleanBody($: cheerio.CheerioAPI, root: cheerio.Cheerio<AnyNode>): string {
  root.find("script, style, noscript").remove();
  // Unwrap anything that isn't a plain content tag (e.g. <font>, <span>, <div>).
  let changed = true;
  while (changed) {
    changed = false;
    root.find("*").each((_, el) => {
      if (el.type !== "tag") return;
      if (!KEEP_TAGS.has(el.tagName)) {
        $(el).replaceWith($(el).contents());
        changed = true;
      }
    });
  }
  root.find("*").each((_, el) => {
    if (el.type !== "tag") return;
    const href = el.tagName === "a" ? $(el).attr("href") : undefined;
    for (const name of Object.keys(el.attribs)) $(el).removeAttr(name);
    if (href) $(el).attr("href", href.startsWith(ORIGIN) ? href.slice(ORIGIN.length) || "/" : href);
  });
  root.find("p").each((_, p) => {
    if ($(p).text().trim() === "" && $(p).find("br").length === $(p).children().length)
      $(p).remove();
  });
  return (root.html() ?? "").replace(/\n{3,}/g, "\n\n").trim();
}

async function importPost(path: string) {
  const html = await fetch(ORIGIN + path).then((r) => r.text());
  const $ = cheerio.load(html);
  const [, , blogSlug, postSlug] = path.split("/");

  const coverStyle = $(".o_record_cover_image").first().attr("style") ?? "";
  const coverPath = coverStyle.match(/url\(["']?([^"')]+)["']?\)/)?.[1];
  let cover: string | null = null;
  if (coverPath) {
    const response = await fetch(new URL(coverPath, ORIGIN));
    const type = response.headers.get("content-type") ?? "";
    const ext = type.includes("png") ? "png" : type.includes("webp") ? "webp" : "jpg";
    mkdirSync("public/blog", { recursive: true });
    cover = `/blog/${postSlug}.${ext}`;
    writeFileSync(`public${cover}`, Buffer.from(await response.arrayBuffer()));
  }

  const header = $("#o_wblog_post_content").first().text();
  const date = header.match(MONTH_DATE)?.[0];

  return {
    blogSlug,
    postSlug,
    path,
    category: $(`a[href$="/blog/${blogSlug}"]`).first().text().trim() || null,
    title: $("h1").first().text().replace(/\s+/g, " ").trim(),
    subtitle: $(".o_wblog_post_subtitle").first().text().replace(/\s+/g, " ").trim() || null,
    date: date ? new Date(`${date} UTC`).toISOString().slice(0, 10) : null,
    metaTitle: $("title").first().text().trim(),
    metaDescription: $('meta[name="description"]').attr("content")?.trim() ?? null,
    cover,
    html: cleanBody($, $(".o_wblog_post_content_field").first()),
  };
}

async function main() {
  const posts = [];
  for (const path of POSTS) {
    const post = await importPost(path);
    console.log(`${post.date} ${post.title} (${post.html.length} chars, cover: ${post.cover})`);
    posts.push(post);
  }
  mkdirSync("src/content/blog", { recursive: true });
  writeFileSync("src/content/blog/posts.json", JSON.stringify(posts, null, 2) + "\n");
}

main();

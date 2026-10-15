import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { POSTS, findPost, fullTitle } from "@/content/blog";
import { formatDisplayDate } from "@/lib/dates";
import styles from "../../../content.module.css";
import blogStyles from "./post.module.css";

// Posts moved from the old site, at their original addresses. Built ahead of
// time; unknown posts are a real 404.
export const instant = false;

export function generateStaticParams() {
  return POSTS.map((p) => ({ blog: p.blogSlug, post: p.postSlug }));
}

export async function generateMetadata(props: PageProps<"/blog/[blog]/[post]">): Promise<Metadata> {
  const { blog, post } = await props.params;
  const found = findPost(blog, post);
  if (!found) return {};
  return {
    // Kept from the old site.
    title: { absolute: fullTitle(found.metaTitle) },
    description: found.metaDescription ?? undefined,
    alternates: { canonical: found.path },
    openGraph: found.cover ? { images: [found.cover] } : undefined,
  };
}

export default async function BlogPostPage(props: PageProps<"/blog/[blog]/[post]">) {
  const { blog, post } = await props.params;
  const found = findPost(blog, post);
  if (!found) notFound();

  return (
    <main className={styles.page}>
      <article className={blogStyles.article}>
        <p>
          <Link href="/blog" className={styles.back}>
            All posts
          </Link>
          {found.category && (
            <>
              {" · "}
              <Link href={`/blog/${found.blogSlug}`}>{found.category}</Link>
            </>
          )}
        </p>
        <h1>
          {found.title}
          {found.subtitle && <span className={blogStyles.subtitle}> {found.subtitle}</span>}
        </h1>
        {found.date && <p className={styles.muted}>{formatDisplayDate(found.date)}</p>}
        {found.cover && (
          <Image
            src={found.cover}
            alt=""
            width={1200}
            height={630}
            priority
            sizes="(max-width: 760px) 100vw, 720px"
            className={blogStyles.cover}
          />
        )}
        {/* Content imported from our own old site and cleaned to plain tags
            (scripts/seo/import-blog.ts), so it's safe to render as HTML. */}
        <div className={blogStyles.body} dangerouslySetInnerHTML={{ __html: found.html }} />
        <div className={styles.actions}>
          <Link href="/book" className={styles.primary}>
            Book a bike
          </Link>
          <Link href="/one-way" className={styles.secondary}>
            One-way trips
          </Link>
        </div>
      </article>
    </main>
  );
}

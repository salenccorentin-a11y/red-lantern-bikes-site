import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ReadingProgress } from "@/components/blog/ReadingProgress";
import { ROUTE_GUIDE_POSTS, RouteGuide } from "@/components/blog/RouteGuide";
import { BlogPostingData, BreadcrumbData } from "@/components/StructuredData";
import { BUSINESS } from "@/content/business";
import { POSTS, findPost, fullTitle, type BlogPost } from "@/content/blog";
import { formatDisplayDate } from "@/lib/dates";
import { shareMetadata } from "@/seo/share";
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
    ...shareMetadata({
      path: found.path,
      ...(found.cover && { images: [{ url: found.cover }] }),
      article: { publishedTime: found.date ?? undefined },
    }),
  };
}

export default async function BlogPostPage(props: PageProps<"/blog/[blog]/[post]">) {
  const { blog, post } = await props.params;
  const found = findPost(blog, post);
  if (!found) notFound();
  // Long route guides get a layout of their own (same words, laid out as the trip).
  const routeGuide = ROUTE_GUIDE_POSTS.has(found.postSlug);

  return (
    <ReadingProgress trip={tripFor(found)}>
      <main className={styles.page}>
        <BlogPostingData
          title={found.title}
          description={found.metaDescription ?? null}
          path={found.path}
          image={found.cover ?? null}
          date={found.date ?? null}
        />
        <BreadcrumbData
          items={[
            { name: BUSINESS.name, path: "/" },
            { name: "Blog", path: "/blog" },
            ...(found.category ? [{ name: found.category, path: `/blog/${found.blogSlug}` }] : []),
            { name: found.title, path: found.path },
          ]}
        />
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
          {routeGuide ? (
            <RouteGuide html={found.html} />
          ) : (
            <>
              <div className={blogStyles.body} dangerouslySetInnerHTML={{ __html: found.html }} />
              <div className={styles.actions}>
                <Link href="/book" className={styles.primary}>
                  Book a bike
                </Link>
                <Link href="/one-way" className={styles.secondary}>
                  One-way trips
                </Link>
              </div>
            </>
          )}
        </article>
      </main>
    </ReadingProgress>
  );
}

// The button at the end of the reading-progress line. Guides set their own
// (e.g. Ha Giang asks for a message instead); for the imported posts, a route
// guide books that one-way trip and other posts open the booking page.
function tripFor(post: BlogPost): { href: string; label: string } {
  if (post.trip) return post.trip;
  const label = "Rent a bike for this trip";
  const text = `${post.postSlug} ${post.title}`.toLowerCase();
  if (text.includes("hanoi")) return { href: "/book?dropoff=HANOI", label };
  if (text.includes("da nang") || text.includes("da-nang")) {
    return { href: "/book?dropoff=DA_NANG", label };
  }
  return { href: "/book", label };
}

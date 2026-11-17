import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BlogList } from "@/components/BlogList";
import { CATEGORIES, POSTS } from "@/content/blog";
import { PageHeader } from "@/components/PageHeader";
import styles from "../../content.module.css";

// Category pages from the old site, e.g. /blog/news-2. Built ahead of time;
// the page reads the category before rendering so unknown ones are a real 404.
export const instant = false;

export function generateStaticParams() {
  return CATEGORIES.map((c) => ({ blog: c.slug }));
}

export async function generateMetadata(props: PageProps<"/blog/[blog]">): Promise<Metadata> {
  const { blog } = await props.params;
  const category = CATEGORIES.find((c) => c.slug === blog);
  // "News | Red Lantern Bikes", as on the old site.
  return category
    ? { title: `${category.name} | Red Lantern Bikes`, alternates: { canonical: `/blog/${blog}` } }
    : {};
}

export default async function BlogCategory(props: PageProps<"/blog/[blog]">) {
  const { blog } = await props.params;
  const category = CATEGORIES.find((c) => c.slug === blog);
  if (!category) notFound();
  return (
    <>
      <PageHeader title={category.name} />
      <main className={styles.page}>
        <Link href="/blog" className={styles.back}>
          All posts
        </Link>
        <BlogList posts={POSTS.filter((p) => p.blogSlug === blog)} />
      </main>
    </>
  );
}

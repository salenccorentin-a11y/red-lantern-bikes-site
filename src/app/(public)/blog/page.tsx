import type { Metadata } from "next";
import { BlogList } from "@/components/BlogList";
import { POSTS } from "@/content/blog";
import styles from "../content.module.css";

// Title kept from the old site.
export const metadata: Metadata = {
  alternates: { canonical: "/blog" },
  title: "Vietnam Motorbike Travel Guides & Tips | Red Lantern Bikes Blog",
  description:
    "Route guides, bike advice and practical tips for riding a motorbike in Vietnam, from the Red Lantern Bikes team in Saigon.",
};

export default function BlogIndex() {
  return (
    <main className={styles.page}>
      <h1>Travel guides and tips</h1>
      <BlogList posts={POSTS} />
    </main>
  );
}

import Image from "next/image";
import Link from "next/link";
import type { BlogPost } from "@/content/blog";
import { formatDisplayDate } from "@/lib/dates";
import styles from "@/app/(public)/content.module.css";

export function BlogList({ posts }: { posts: BlogPost[] }) {
  return (
    <div className={styles.cards}>
      {posts.map((p) => (
        <Link key={p.path} href={p.path} className={styles.card}>
          {p.cover && (
            <Image
              src={p.cover}
              alt=""
              width={600}
              height={315}
              sizes="(max-width: 600px) 100vw, 340px"
              style={{ width: "100%", height: "auto", borderRadius: 4, marginBottom: 12 }}
            />
          )}
          <h2 style={{ fontSize: 20 }}>{p.title}</h2>
          <p>{p.date ? formatDisplayDate(p.date) : ""}</p>
        </Link>
      ))}
    </div>
  );
}

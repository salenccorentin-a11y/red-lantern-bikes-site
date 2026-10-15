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
              height={400}
              sizes="(max-width: 700px) 100vw, 360px"
              className={styles.cardPhoto}
            />
          )}
          <span className={styles.cardBody}>
            <h2 className={styles.cardTitle}>{p.title}</h2>
            {p.date && <p className={styles.cardText}>{formatDisplayDate(p.date)}</p>}
          </span>
        </Link>
      ))}
    </div>
  );
}

import { loadReviews, type Review } from "@/server/google-reviews";
import styles from "./GoogleReviews.module.css";

// Real customer reviews (src/server/google-reviews.ts), shown as written with
// the reviewer's name and Google's attribution. Hidden when there are none.

const MAX_CHARS = 280;

export async function GoogleReviews({
  title,
  limit = 3,
  tone = "light",
}: {
  /** A heading above the reviews, if the page needs one. */
  title?: string;
  limit?: number;
  /** "night" on dark sections, "light" on white or mist. */
  tone?: "light" | "night";
}) {
  const data = await loadReviews();
  if (!data || data.reviews.length === 0) return null;
  const reviews = data.reviews.slice(0, limit);

  return (
    <div className={`${styles.wrap} ${tone === "night" ? styles.night : styles.light}`}>
      {title && <h2 className={styles.title}>{title}</h2>}
      {data.rating !== null && (
        <p className={styles.summary}>
          <Stars rating={data.rating} />
          <b>{data.rating.toFixed(1)}</b>
          {data.count !== null && <span> from {data.count} reviews on Google</span>}
        </p>
      )}
      <ul className={styles.list}>
        {reviews.map((r, i) => (
          <li key={i} className={styles.card}>
            <Stars rating={r.rating} />
            <p className={styles.text}>{trim(r.text)}</p>
            <p className={styles.author}>
              {r.authorUrl ? (
                <a href={r.authorUrl} target="_blank" rel="noopener nofollow">
                  {r.author}
                </a>
              ) : (
                r.author
              )}
              {r.when && <span className={styles.when}>, {r.when}</span>}
            </p>
            {r.text.length > MAX_CHARS && data.url && (
              <a href={data.url} target="_blank" rel="noopener" className={styles.more}>
                Read on Google
              </a>
            )}
          </li>
        ))}
      </ul>
      <p className={styles.attribution}>
        Reviews from Google
        {data.url && (
          <>
            {". "}
            <a href={data.url} target="_blank" rel="noopener">
              See all reviews
            </a>
          </>
        )}
      </p>
    </div>
  );
}

/** Long reviews are cut at a word, with "…". */
function trim(text: string): string {
  if (text.length <= MAX_CHARS) return text;
  return `${text.slice(0, MAX_CHARS).replace(/\s+\S*$/, "")}…`;
}

function Stars({ rating }: { rating: Review["rating"] }) {
  const full = Math.round(rating);
  return (
    <span className={styles.stars} role="img" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, i) => (
        <svg key={i} viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
          <path
            className={i < full ? styles.starOn : styles.starOff}
            d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3 6.1 20.6l1.3-6.6L2.5 9.4l6.6-.8z"
          />
        </svg>
      ))}
    </span>
  );
}

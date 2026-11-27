import { getMessages } from "@/i18n";
import { fill, type Locale } from "@/i18n/config";
import { loadReviews, type Review } from "@/server/google-reviews";
import styles from "./GoogleReviews.module.css";

// Real customer reviews (src/server/google-reviews.ts), shown as written with
// the reviewer's name and Google's attribution. Hidden when there are none.

// Longest review text shown before it is cut with "…" and a link to Google.
const MAX_CHARS = 280;
// Compact cards (home page) keep about four lines on a phone.
const COMPACT_CHARS = 120;

export async function GoogleReviews({
  lang = "en",
  title,
  limit = 3,
  tone = "light",
  compact = false,
}: {
  lang?: Locale;
  /** A heading above the reviews, if the page needs one. */
  title?: string;
  limit?: number;
  /** "night" on dark sections, "light" on white or mist. */
  tone?: "light" | "night";
  /** Short cards, without the rating line (home page: the intro above
   * already gives the rating). */
  compact?: boolean;
}) {
  const t = getMessages(lang).reviews;
  const data = await loadReviews(lang);
  if (!data || data.reviews.length === 0) return null;
  const reviews = data.reviews.slice(0, limit);
  const max = compact ? COMPACT_CHARS : MAX_CHARS;

  return (
    <div
      className={`${styles.wrap} ${tone === "night" ? styles.night : styles.light} ${compact ? styles.compact : ""}`}
    >
      {title && <h2 className={styles.title}>{title}</h2>}
      {!compact && data.rating !== null && (
        <p className={styles.summary}>
          <Stars rating={data.rating} label={fill(t.stars, { rating: data.rating })} />
          <b>{data.rating.toFixed(1)}</b>
          {data.count !== null && <span> {fill(t.from, { count: data.count })}</span>}
        </p>
      )}
      <ul className={styles.list}>
        {reviews.map((r, i) => (
          <li key={i} className={styles.card}>
            <Stars rating={r.rating} label={fill(t.stars, { rating: r.rating })} />
            <p className={styles.text}>
              {trim(r.text, max)}
              {/* Compact cards: the link ends the text, saving a line. */}
              {compact && r.text.length > max && data.url && (
                <>
                  {" "}
                  <a href={data.url} target="_blank" rel="noopener" className={styles.more}>
                    {t.readOn}
                  </a>
                </>
              )}
            </p>
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
            {!compact && r.text.length > max && data.url && (
              <a href={data.url} target="_blank" rel="noopener" className={styles.more}>
                {t.readOn}
              </a>
            )}
          </li>
        ))}
      </ul>
      <p className={styles.attribution}>
        {t.attribution}
        {data.url && (
          <>
            {". "}
            <a href={data.url} target="_blank" rel="noopener">
              {t.seeAll}
            </a>
          </>
        )}
      </p>
    </div>
  );
}

/** Long reviews are cut at a word, with "…". */
function trim(text: string, max: number): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max).replace(/\s+\S*$/, "")}…`;
}

function Stars({ rating, label }: { rating: Review["rating"]; label: string }) {
  const full = Math.round(rating);
  return (
    <span className={styles.stars} role="img" aria-label={label}>
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

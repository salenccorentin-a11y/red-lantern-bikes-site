import Link from "next/link";
import { BIKE_CONTENT } from "@/content/bikes";
import { formatUsdApprox, formatVnd } from "@/lib/money";
import type { PublicModel } from "@/server/fleet";
import styles from "./BikeCard.module.css";

export function BikeCard({ model, usdRate }: { model: PublicModel; usdRate: number }) {
  const content = BIKE_CONTENT[model.slug];
  return (
    <Link href={`/bikes/${model.slug}`} className={styles.card}>
      <span className={styles.kind}>{model.kind}</span>
      <span className={styles.name}>{model.name}</span>
      {content && <span className={styles.summary}>{content.summary}</span>}
      <span className={styles.price}>
        {formatVnd(model.dailyRate)}
        <small> / day</small>
      </span>
      <span className={styles.from}>
        {formatUsdApprox(model.dailyRate, usdRate)} · from {formatVnd(model.monthlyRate)} / day
        monthly
      </span>
    </Link>
  );
}

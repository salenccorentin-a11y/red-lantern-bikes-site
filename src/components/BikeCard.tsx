import Image from "next/image";
import Link from "next/link";
import { BIKE_CONTENT } from "@/content/bikes";
import { formatUsdApprox, formatVnd } from "@/lib/money";
import type { PublicModel } from "@/server/fleet";
import { HoverLift } from "./motion/HoverLift";
import { SharedElement } from "./motion/SharedElement";
import styles from "./BikeCard.module.css";

/** Studio photo for a model (public/bikes/<slug>.webp, made by scripts/brand/prepare-photos.cjs). */
export const bikeImage = (slug: string) => `/bikes/${slug}.webp`;

export function BikeCard({ model, usdRate }: { model: PublicModel; usdRate: number }) {
  const content = BIKE_CONTENT[model.slug];
  return (
    <HoverLift className={styles.lift}>
      <Link href={`/bikes/${model.slug}`} className={styles.card}>
        {/* Grows into the photo on the bike's page (same name there). */}
        <SharedElement name={`bike-${model.slug}`}>
          <Image
            src={bikeImage(model.slug)}
            alt={model.name}
            width={1200}
            height={800}
            sizes="(max-width: 600px) 90vw, (max-width: 1000px) 45vw, 340px"
            className={styles.image}
          />
        </SharedElement>
        <span className={styles.body}>
          <span className={styles.kind}>{model.kind}</span>
          <span className={styles.name}>{model.name}</span>
          {content && <span className={styles.summary}>{content.summary}</span>}
          <span className={styles.price}>
            {formatVnd(model.dailyRate)}
            <small> a day</small>
            <span className={styles.usd}>{formatUsdApprox(model.dailyRate, usdRate)}</span>
          </span>
        </span>
      </Link>
    </HoverLift>
  );
}

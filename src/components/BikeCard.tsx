import Image from "next/image";
import Link from "next/link";
import { getMessages, kindLabel, modelContent } from "@/i18n";
import type { Locale } from "@/i18n/config";
import { localize } from "@/i18n/paths";
import { formatUsdApprox, formatVnd } from "@/lib/money";
import type { PublicModel } from "@/server/fleet";
import { HoverLift } from "./motion/HoverLift";
import { SharedElement } from "./motion/SharedElement";
import styles from "./BikeCard.module.css";

export function BikeCard({
  model,
  usdRate,
  lang = "en",
}: {
  model: PublicModel;
  usdRate: number;
  lang?: Locale;
}) {
  const content = modelContent(lang, model);
  const t = getMessages(lang).common;
  return (
    <HoverLift className={styles.lift}>
      <Link href={localize(lang, `/bikes/${model.slug}`)} className={styles.card}>
        {/* Grows into the photo on the bike's page (same name there). */}
        <SharedElement name={`bike-${model.slug}`}>
          <Image
            src={model.image}
            alt={model.name}
            width={1200}
            height={800}
            sizes="(max-width: 600px) 90vw, (max-width: 1000px) 45vw, 340px"
            className={styles.image}
          />
        </SharedElement>
        <span className={styles.body}>
          <span className={styles.kind}>{kindLabel(lang, model.kind)}</span>
          <span className={styles.name}>{model.name}</span>
          {content && <span className={styles.summary}>{content.summary}</span>}
          <span className={styles.price}>
            {formatVnd(model.dailyRate)}
            <small> {t.aDay}</small>
            <span className={styles.usd}>{formatUsdApprox(model.dailyRate, usdRate)}</span>
          </span>
        </span>
      </Link>
    </HoverLift>
  );
}

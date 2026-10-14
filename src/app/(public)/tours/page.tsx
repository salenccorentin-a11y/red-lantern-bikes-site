import type { Metadata } from "next";
import Link from "next/link";
import { TOURS } from "@/content/tours";
import styles from "../content.module.css";

export const metadata: Metadata = {
  title: "Motorbike tours in Vietnam | Red Lantern Bikes",
  description:
    "Guided and self-guided motorbike tours from Saigon: The Coco Loop, the Mekong Delta, a Saigon loop and the full ride to Hanoi. Small groups of 1 to 6 riders.",
};

export default function ToursPage() {
  return (
    <main className={styles.page}>
      <h1>Motorbike tours</h1>
      <p className={styles.lead}>
        Ride with a local guide, or on your own with our route and roadside assistance. Groups of
        one to six riders, planned around your dates and riding experience.
      </p>
      <div className={styles.cards}>
        {TOURS.map((tour) => (
          <Link key={tour.slug} href={`/tours/${tour.slug}`} className={styles.card}>
            <h2>{tour.name}</h2>
            <p>{tour.summary}</p>
            <span className={styles.muted}>
              {[tour.duration, tour.priceFrom].filter(Boolean).join(" · ") || "Ask us for details"}
            </span>
          </Link>
        ))}
      </div>
    </main>
  );
}

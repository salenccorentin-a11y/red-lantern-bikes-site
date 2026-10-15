import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { TOUR_PHOTOS } from "@/components/tourPhotos";
import { TOURS } from "@/content/tours";
import mountainSunset from "../../../../public/photos/mountain-sunset.webp";
import styles from "../content.module.css";

export const metadata: Metadata = {
  alternates: { canonical: "/tours" },
  title: "Motorbike tours in Vietnam | Red Lantern Bikes",
  description:
    "Guided and self-guided motorbike tours from Saigon: The Coco Loop, the Mekong Delta, a Saigon loop and the full ride to Hanoi. Small groups of 1 to 6 riders.",
};

export default function ToursPage() {
  return (
    <>
      <PageHeader
        title="Motorbike tours"
        intro="Ride with a local guide, or on your own with our route and roadside assistance. Groups of one to six riders, planned around your dates and riding experience."
        photo={{
          src: mountainSunset,
          alt: "A rider above a mountain valley at sunset",
          position: "50% 55%",
        }}
      />
      <main className={styles.page}>
        <div className={styles.cards}>
          {TOURS.map((tour) => {
            const photo = TOUR_PHOTOS[tour.slug];
            const meta = [tour.duration, tour.priceFrom].filter(Boolean);
            return (
              <Link key={tour.slug} href={`/tours/${tour.slug}`} className={styles.card}>
                {photo && (
                  <Image
                    src={photo.src}
                    alt={photo.alt}
                    placeholder="blur"
                    sizes="(max-width: 700px) 100vw, 360px"
                    className={styles.cardPhoto}
                    style={{ objectPosition: photo.position }}
                  />
                )}
                <span className={styles.cardBody}>
                  <h2 className={styles.cardTitle}>{tour.name}</h2>
                  <p className={styles.cardText}>{tour.summary}</p>
                  <p className={styles.cardMeta}>
                    {meta.length > 0 ? meta.join(", ") : "Ask us about dates and price"}
                  </p>
                </span>
              </Link>
            );
          })}
        </div>
      </main>
    </>
  );
}

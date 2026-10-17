import Image from "next/image";
import galleries from "@/content/bike-gallery.json";
import styles from "./BikeGallery.module.css";

type Photo = { src: string; alt: string; blur: string };

// Our own photos of a model, made by scripts/brand/prepare-photos.cjs.
// Models without any (yet) show nothing.
export function BikeGallery({ slug, name }: { slug: string; name: string }) {
  const photos: Photo[] = (galleries as Record<string, Photo[]>)[slug] ?? [];
  if (photos.length === 0) return null;
  return (
    <section className={styles.gallery} aria-labelledby="gallery-title">
      <h2 id="gallery-title">Photos of our {name}</h2>
      <ul
        className={styles.grid}
        data-count={photos.length}
        style={{ "--cols": Math.min(photos.length, 4) } as React.CSSProperties}
      >
        {photos.map((p) => (
          <li key={p.src}>
            <Image
              src={p.src}
              alt={p.alt}
              width={960}
              height={960}
              placeholder="blur"
              blurDataURL={p.blur}
              sizes="(max-width: 760px) 50vw, 280px"
              className={styles.photo}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}

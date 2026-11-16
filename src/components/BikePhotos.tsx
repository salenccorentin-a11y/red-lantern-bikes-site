"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./BikePhotos.module.css";

// The photos at the top of a bike's page: one wide frame you swipe through on
// a phone (native scrolling with snap points, so it feels like any photo app),
// with small thumbnails underneath on wider screens. The photos themselves
// are rendered on the server and passed in, so the first one is in the page
// from the start (the fleet page's card photo grows into it).
export function BikePhotos({
  label,
  slides,
  thumbs,
  photoOf,
  showPhoto,
}: {
  /** e.g. "Photos of the Honda XR150". */
  label: string;
  slides: React.ReactNode[];
  thumbs: React.ReactNode[];
  /** "Photo {n} of {total}", already in the page's language. */
  photoOf: string;
  /** "Show photo {n}". */
  showPhoto: string;
}) {
  const track = useRef<HTMLUListElement>(null);
  const [current, setCurrent] = useState(0);
  const total = slides.length;
  const words = (text: string, n: number) =>
    text.replace("{n}", String(n)).replace("{total}", String(total));

  // Follow the swipe: the photo that fills most of the frame is the current one.
  useEffect(() => {
    const el = track.current;
    if (!el || total < 2) return;
    const onScroll = () => setCurrent(Math.round(el.scrollLeft / el.clientWidth));
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [total]);

  const show = (i: number) => {
    const el = track.current;
    if (!el) return;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollTo({ left: i * el.clientWidth, behavior: reduce ? "auto" : "smooth" });
    setCurrent(i);
  };

  return (
    <section className={styles.photos} aria-label={label}>
      <ul
        ref={track}
        className={styles.track}
        // Scrollable with the arrow keys once focused.
        tabIndex={total > 1 ? 0 : undefined}
      >
        {slides.map((slide, i) => (
          <li key={i} className={styles.slide} aria-label={words(photoOf, i + 1)}>
            {slide}
          </li>
        ))}
      </ul>

      {total > 1 && (
        <>
          {/* Phones: where you are in the row of photos. */}
          <div className={styles.dots} aria-hidden="true">
            {slides.map((_, i) => (
              <span key={i} className={i === current ? styles.dotOn : styles.dot} />
            ))}
          </div>
          {/* Wider screens: pick a photo. */}
          <ul className={styles.thumbs}>
            {thumbs.map((thumb, i) => (
              <li key={i}>
                <button
                  type="button"
                  className={styles.thumb}
                  aria-label={words(showPhoto, i + 1)}
                  aria-current={i === current ? "true" : undefined}
                  onClick={() => show(i)}
                >
                  {thumb}
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}

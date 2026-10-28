"use client";

import { useScroll } from "motion/react";
import Link from "next/link";
import { useEffect, useRef, useSyncExternalStore } from "react";
import styles from "./ReadingProgress.module.css";

// The reading progress strip on blog posts: a thin line under the header that
// fills as you read, with a small motorbike riding along it. At the end of
// the post the bike arrives at a lantern, which lights up, and a "Rent a bike
// for this trip" button fades in.
//
// - Browsers with CSS scroll-driven animations: done entirely in CSS (see the
//   module), no JavaScript runs while scrolling.
// - Other browsers: Motion's useScroll drives the same parts (MotionFallback).
// - Reduced motion: the bike and lantern are hidden; the line still fills and
//   the button still appears at the end (CSS).

export function ReadingProgress({
  ctaHref,
  children,
}: {
  /** Where "Rent a bike for this trip" goes. */
  ctaHref: string;
  /** The post itself. Progress runs from its top to its end. */
  children: React.ReactNode;
}) {
  const scope = useRef<HTMLDivElement>(null);
  // False on the server; in the browser, whether CSS can't do it alone.
  const needsFallback = useSyncExternalStore(
    noChanges,
    () => !CSS.supports("animation-timeline: view()"),
    () => false,
  );

  return (
    <div ref={scope} className={styles.scope}>
      <div className={styles.strip}>
        <div className={styles.container}>
          <div className={styles.track} aria-hidden="true">
            <div className={styles.fill} data-part="fill" />
            <div className={styles.rider} data-part="rider">
              <Bike />
            </div>
            <div className={styles.lantern} data-part="lantern">
              <Lantern />
            </div>
          </div>
          <Link href={ctaHref} className={styles.cta} data-part="cta">
            Rent a bike for this trip
          </Link>
        </div>
      </div>
      {children}
      {needsFallback && <MotionFallback scope={scope} />}
    </div>
  );
}

// Browser support doesn't change while the page is open.
const noChanges = () => () => {};

// For browsers without scroll-driven CSS: the same progress from Motion,
// written straight onto the parts (no re-rendering while scrolling).
function MotionFallback({ scope }: { scope: React.RefObject<HTMLDivElement | null> }) {
  const { scrollYProgress } = useScroll({ target: scope, offset: ["start start", "end end"] });

  useEffect(() => {
    const root = scope.current;
    if (!root) return;
    const part = (name: string) => root.querySelector<HTMLElement>(`[data-part="${name}"]`);
    const [fill, rider, lantern, cta] = ["fill", "rider", "lantern", "cta"].map(part);
    root.classList.add(styles.scripted);
    const update = (p: number) => {
      fill?.style.setProperty("transform", `scaleX(${p})`);
      rider?.style.setProperty("transform", `translateX(${(p - 1) * 100}%)`);
      const arrived = p > 0.97;
      lantern?.classList.toggle(styles.lit, arrived);
      cta?.classList.toggle(styles.shown, arrived);
    };
    update(scrollYProgress.get());
    return scrollYProgress.on("change", update);
  }, [scope, scrollYProgress]);

  return null;
}

function Bike() {
  return (
    <svg viewBox="0 0 22 14" width="22" height="14" className={styles.bike}>
      <circle cx="4.5" cy="10" r="3.3" />
      <circle cx="17.5" cy="10" r="3.3" />
      <path d="M4.5 10 L8.5 5.2 H13.6 L17.5 10 M7.6 4.4 H11.6 M13.6 5.2 L15.2 2.4 H17.2" />
      <path d="M9.4 5.2 H13.4 L12.8 7.2 H10 Z" className={styles.tank} />
      {/* Engine and headlight, so it reads as a motorbike, not a bicycle. */}
      <rect x="8.6" y="7.4" width="4.6" height="3.2" rx="0.8" className={styles.engine} />
      <circle cx="17.6" cy="3.6" r="1" className={styles.headlight} />
    </svg>
  );
}

function LanternBody() {
  return (
    <>
      <rect x="-3.6" y="-7.4" width="7.2" height="2" rx="0.8" className={styles.cap} />
      <ellipse rx="5.6" ry="5" className={styles.body} />
      <rect x="-3.2" y="4.6" width="6.4" height="2" rx="0.8" className={styles.cap} />
    </>
  );
}

function Lantern() {
  return (
    <svg viewBox="-9 -11 18 24" width="15" height="20" className={styles.lanternIcon}>
      <circle r="9" className={styles.glow} />
      <line y1="-10" y2="-7.4" className={styles.string} />
      <LanternBody />
      {/* The lit lantern, faded in over the dark one when the bike arrives. */}
      <g className={styles.litLayer}>
        <LanternBody />
      </g>
      <line y1="6.6" y2="10" className={styles.string} />
    </svg>
  );
}

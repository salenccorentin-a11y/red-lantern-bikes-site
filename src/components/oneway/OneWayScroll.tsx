"use client";

import { useEffect, useRef } from "react";
import styles from "./OneWayTrips.module.css";

// Brings the one-way map to life (see OneWayTrips). GSAP and ScrollTrigger
// are downloaded only on pages with this section, and only once the visitor
// starts scrolling, so every page first loads exactly as before.
//
// - Wide screens: the section is pinned by CSS (position: sticky in a tall
//   track, so nothing jumps when this script arrives) and the scroll through
//   the track draws the road.
// - Phones: no pinning; the road draws while the map scrolls past.
// - Reduced motion: this does nothing, and the finished map stays as it is.

const WIDE = "(min-width: 900px) and (min-height: 600px)";
// The opposite of WIDE. GSAP only runs the setup when one condition is true,
// so phones need a condition of their own.
const SMALL = "(max-width: 899px), (max-height: 599px)";
const REDUCE = "(prefers-reduced-motion: reduce)";

export function OneWayScroll() {
  const marker = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const section = marker.current?.closest<HTMLElement>("[data-oneway]");
    if (!section || matchMedia(REDUCE).matches) return;

    let cancelled = false;
    let loading = false;
    let stop: (() => void) | undefined;
    const INTERACTIONS = ["scroll", "pointerdown", "keydown"] as const;

    // Load GSAP once: when the visitor first scrolls or touches the page, or
    // when the section is on screen (e.g. a link straight to it).
    // Nothing loads while the page is only being opened, so the first load,
    // and the PageSpeed score, stay as they were.
    const load = () => {
      if (loading) return;
      loading = true;
      observer.disconnect();
      INTERACTIONS.forEach((type) => removeEventListener(type, load));
      Promise.all([import("gsap"), import("gsap/ScrollTrigger")]).then(
        ([{ gsap }, { ScrollTrigger }]) => {
          if (!cancelled) stop = start(section, gsap, ScrollTrigger);
        },
      );
    };
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) load();
      },
      { rootMargin: "0px" },
    );
    observer.observe(section);
    INTERACTIONS.forEach((type) => addEventListener(type, load, { passive: true }));

    return () => {
      cancelled = true;
      observer.disconnect();
      INTERACTIONS.forEach((type) => removeEventListener(type, load));
      stop?.();
    };
  }, []);

  return <span ref={marker} hidden />;
}

type Gsap = typeof import("gsap").gsap;
type ScrollTriggerType = typeof import("gsap/ScrollTrigger").ScrollTrigger;

function start(section: HTMLElement, gsap: Gsap, ScrollTrigger: ScrollTriggerType) {
  gsap.registerPlugin(ScrollTrigger);

  const roads = section.querySelectorAll<SVGPathElement>("[data-road]");
  const ghost = section.querySelector<SVGPathElement>("[data-road-ghost]");
  const track = section.querySelector<HTMLElement>("[data-track]");
  const mapWrap = section.querySelector<HTMLElement>("[data-map]");
  const lit = section.querySelectorAll<Element>("[data-place]");
  if (!ghost || !track || !mapWrap) return;

  // How far along the road each place is (0 = Saigon, 1 = Hanoi).
  const at = placesAlong(ghost, section);
  const light = (progress: number) => {
    for (const el of lit) {
      const name = el.getAttribute("data-place") ?? "";
      el.classList.toggle(styles.lit, progress >= (at[name] ?? 0) - 0.01);
    }
  };

  const mm = gsap.matchMedia();
  mm.add({ wide: WIDE, small: SMALL, reduce: REDUCE }, (context) => {
    const { wide, reduce } = context.conditions as { wide: boolean; reduce: boolean };
    if (reduce) return;

    const timeline = gsap.timeline({
      defaults: { ease: "none" },
      scrollTrigger: wide
        ? // Through the tall track, while the section is pinned.
          { trigger: track, start: "top top", end: "bottom bottom", scrub: 0.5 }
        : // While the map passes through the middle of the screen.
          { trigger: mapWrap, start: "top 70%", end: "bottom 45%", scrub: 0.5 },
      onUpdate: () => light(timeline.progress()),
    });
    // The road's length is 1000 (pathLength in OneWayMap): 1000 hidden, 0 drawn.
    timeline.fromTo(roads, { strokeDashoffset: 1000 }, { strokeDashoffset: 0, duration: 1 });
    light(timeline.progress());

    // If reduced motion is switched on, or the page changes: show it all.
    return () => light(1);
  });

  return () => mm.revert();
}

// Finds, for each place on the map, the nearest point along the road.
function placesAlong(road: SVGPathElement, section: HTMLElement): Record<string, number> {
  const length = road.getTotalLength();
  const steps = 600;
  const samples = Array.from({ length: steps + 1 }, (_, i) =>
    road.getPointAtLength((length * i) / steps),
  );
  const result: Record<string, number> = {};
  for (const el of section.querySelectorAll<SVGGElement>("svg [data-place]")) {
    const x = Number(el.dataset.x);
    const y = Number(el.dataset.y);
    let best = 0;
    let bestDistance = Infinity;
    samples.forEach((p, i) => {
      const d = (p.x - x) ** 2 + (p.y - y) ** 2;
      if (d < bestDistance) {
        bestDistance = d;
        best = i;
      }
    });
    result[el.dataset.place ?? ""] = best / steps;
  }
  return result;
}

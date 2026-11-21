"use client";

import { useEffect, useRef } from "react";
import styles from "./OneWayTrips.module.css";

// Brings the one-way map to life (see OneWayTrips). GSAP and ScrollTrigger
// are downloaded only on pages with this section, and only once the visitor
// starts scrolling, so every page first loads exactly as before.
//
// Two steps, one scroll each (owner, 2026-11-21: "just 2 scrolls"): the first
// draws the road from Saigon to Da Nang, the second from Da Nang to Hanoi.
// Each step plays as a short animation, not tied to how far the finger moves.
// - Wide screens: the section is pinned by CSS (position: sticky in a tall
//   track, so nothing jumps when this script arrives) and the page settles
//   on each step (snap), so one scroll moves exactly one step.
// - Phones: no pinning; step one plays as the map comes up the screen, step
//   two once it reaches the middle.
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
        // At least a pixel of it on screen: a section that only touches the
        // bottom edge (right under a one-screen hero) does not count.
        if (entries.some((e) => e.isIntersecting && e.intersectionRatio > 0)) load();
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
  // The road drawn at each step: nothing, up to Da Nang, all the way.
  const steps = [0, at["Da Nang"] ?? 0.5, 1];

  // How much of the road is drawn (0 to 1), animated between steps.
  const road = { drawn: 0 };
  const render = () => {
    // The road's length is 1000 (pathLength in OneWayMap): 1000 hidden, 0 drawn.
    gsap.set(roads, { strokeDashoffset: 1000 * (1 - road.drawn) });
    for (const el of lit) {
      const name = el.getAttribute("data-place") ?? "";
      el.classList.toggle(styles.lit, road.drawn >= (at[name] ?? 0) - 0.01);
    }
  };
  let current = -1;
  const goTo = (step: number, animate = true) => {
    if (step === current) return;
    current = step;
    gsap.killTweensOf(road);
    if (animate) {
      gsap.to(road, { drawn: steps[step], duration: 1.1, ease: "power2.inOut", onUpdate: render });
    } else {
      road.drawn = steps[step];
      render();
    }
  };

  const mm = gsap.matchMedia();
  mm.add({ wide: WIDE, small: SMALL, reduce: REDUCE }, (context) => {
    const { wide, reduce } = context.conditions as { wide: boolean; reduce: boolean };
    if (reduce) return;

    current = -1;
    const triggers: ScrollTrigger[] = [];
    if (wide) {
      // Through the tall track, while the section is pinned: the first half
      // is step one, the second half step two, and the page settles on 0,
      // ½ or 1, always on the next one in the scroll's direction.
      const stepAt = (progress: number) => (progress < 0.25 ? 0 : progress < 0.75 ? 1 : 2);
      const trigger = ScrollTrigger.create({
        trigger: track,
        start: "top top",
        end: "bottom bottom",
        snap: {
          snapTo: [0, 0.5, 1],
          directional: true,
          duration: { min: 0.25, max: 0.6 },
          delay: 0.05,
          ease: "power2.out",
        },
        onUpdate: (self) => goTo(stepAt(self.progress)),
      });
      triggers.push(trigger);
      goTo(stepAt(trigger.progress), false);
    } else {
      // Phones: step one when the map's top passes 75% of the screen, step
      // two when its middle reaches the middle. Scrolling back undoes them.
      const one = ScrollTrigger.create({
        trigger: mapWrap,
        start: "top 75%",
        onEnter: () => goTo(Math.max(current, 1)),
        onLeaveBack: () => goTo(0),
      });
      const two = ScrollTrigger.create({
        trigger: mapWrap,
        start: "center 55%",
        onEnter: () => goTo(2),
        onLeaveBack: () => goTo(1),
      });
      triggers.push(one, two);
      goTo(two.progress > 0 || two.isActive ? 2 : one.progress > 0 || one.isActive ? 1 : 0, false);
    }

    // If reduced motion is switched on, or the page changes: show it all.
    return () => {
      triggers.forEach((t) => t.kill());
      gsap.killTweensOf(road);
      road.drawn = 1;
      render();
    };
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

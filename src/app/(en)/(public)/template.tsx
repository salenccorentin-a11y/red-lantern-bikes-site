"use client";

import { m, useReducedMotion } from "motion/react";
import { useEffect, useState, ViewTransition } from "react";

// Page transitions for the public site. Next.js renders a fresh template for
// every page, so wrapping the page here gives each page change a quick
// crossfade (about 200 ms, "page-fade" in globals.css).
//
// - Browsers with View Transitions: React's <ViewTransition> crossfades the
//   old and new page. The bike photo morph (SharedElement) still plays on top.
// - Other browsers: Motion fades the new page in instead. Never on the first
//   page of a visit, so the first load is never held back.
// - Booking steps (/book and the booking page after it) are in the
//   (booking) group, which has no template: no transition at all, so moving
//   between steps is instant. Updates inside a page never animate either
//   (default="none").
// - Reduced motion: no fades (globals.css, and the Motion check below).

// Set once the first page has rendered.
let firstPageShown = false;

export default function PublicTemplate({ children }: { children: React.ReactNode }) {
  const reduceMotion = useReducedMotion();

  // Decided once, when this page first renders.
  const [motionFallback] = useState(
    () => firstPageShown && typeof document !== "undefined" && !("startViewTransition" in document),
  );
  useEffect(() => {
    firstPageShown = true;
  }, []);

  const page =
    motionFallback && !reduceMotion ? (
      <m.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
      >
        {children}
      </m.div>
    ) : (
      children
    );

  return (
    <ViewTransition enter="page-fade" exit="page-fade" default="none">
      {page}
    </ViewTransition>
  );
}

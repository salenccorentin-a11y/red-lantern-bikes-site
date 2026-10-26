"use client";

import { LazyMotion, MotionConfig, domAnimation } from "motion/react";

// Wraps the public site so the motion components below share one setup:
// - LazyMotion loads only the animation features we use (hover, tap,
//   animate), which keeps the download small. "strict" makes sure every
//   component uses the light `m` elements.
// - reducedMotion="user": when a visitor's device asks for reduced motion,
//   Motion skips movement (lifts, scaling) and keeps only colour changes.
export function MotionProvider({ children }: { children: React.ReactNode }) {
  return (
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </LazyMotion>
  );
}

"use client";

import { m } from "motion/react";

// Lifts its content a little on hover, with a soft red-orange glow from the
// lantern, and presses in slightly on tap (phones have no hover).
// The two shadows have the same shape at rest and on hover, so Motion can
// blend between them smoothly.
const REST = "0 18px 40px -16px rgba(232, 85, 43, 0), 0 0 0 1px rgba(232, 85, 43, 0)";
const GLOW = "0 18px 40px -16px rgba(232, 85, 43, 0.55), 0 0 0 1px rgba(232, 85, 43, 0.35)";

export function HoverLift({
  children,
  className,
  lift = 6,
}: {
  children: React.ReactNode;
  className?: string;
  /** How far it rises on hover, in pixels. */
  lift?: number;
}) {
  return (
    <m.div
      className={className}
      style={{ boxShadow: REST }}
      whileHover={{ y: -lift, boxShadow: GLOW }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 420, damping: 30 }}
    >
      {children}
    </m.div>
  );
}

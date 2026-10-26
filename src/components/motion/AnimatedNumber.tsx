"use client";

import { animate, m, useMotionValue, useReducedMotion, useTransform } from "motion/react";
import { useEffect } from "react";
import styles from "./AnimatedNumber.module.css";

// A number that counts to its new value when it changes, e.g. a price total.
// It starts at its first value without animating. Screen readers get the
// final value only (the counting digits are hidden from them), and with
// reduced motion the new value simply appears.
export function AnimatedNumber({
  value,
  format,
  className,
}: {
  value: number;
  format: (n: number) => string;
  className?: string;
}) {
  const reduceMotion = useReducedMotion();
  const current = useMotionValue(value);
  // Round to the nearest thousand while counting, so the digits settle neatly.
  const text = useTransform(current, (n) =>
    format(n === value ? value : Math.round(n / 1000) * 1000),
  );

  useEffect(() => {
    if (reduceMotion) {
      current.jump(value);
      return;
    }
    const controls = animate(current, value, { duration: 0.6, ease: [0.22, 1, 0.36, 1] });
    return () => controls.stop();
  }, [value, reduceMotion, current]);

  return (
    <span className={className}>
      <m.span aria-hidden="true" className={styles.digits}>
        {text}
      </m.span>
      <span className={styles.srOnly}>{format(value)}</span>
    </span>
  );
}

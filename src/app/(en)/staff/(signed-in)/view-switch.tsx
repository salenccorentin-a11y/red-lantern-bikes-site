"use client";

// Two or three ways to see the same page (Table / Cards, Grid / List). The
// choice is kept in a cookie for a year, so a phone opens on the view its
// owner picked last time; the page reads it with viewPreference().

import Link from "next/link";
import styles from "../staff.module.css";

export type ViewOption = { value: string; label: string; href: string };

export function ViewSwitch({
  cookie,
  current,
  options,
  label,
  className,
}: {
  cookie: string;
  current: string;
  options: ViewOption[];
  label: string;
  className?: string;
}) {
  return (
    <nav className={`${styles.switch} ${className ?? ""}`} aria-label={label}>
      {options.map((o) => (
        <Link
          key={o.value}
          href={o.href}
          aria-current={o.value === current ? "true" : undefined}
          onClick={() => {
            document.cookie = `${cookie}=${o.value}; path=/staff; max-age=31536000; samesite=lax`;
          }}
        >
          {o.label}
        </Link>
      ))}
    </nav>
  );
}

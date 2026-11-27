"use client";

// The staff menu links, with the page you're on marked. On a phone the menu
// is one row you can swipe (staff.module.css), so the current link is also
// scrolled into view.

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import styles from "../staff.module.css";

export function NavLinks({ links }: { links: { href: string; label: string }[] }) {
  const path = usePathname();
  const current = useRef<HTMLAnchorElement>(null);
  const isCurrent = (href: string) =>
    href === "/staff" ? path === "/staff" : path === href || path.startsWith(`${href}/`);

  useEffect(() => {
    current.current?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [path]);

  return links.map((l) => {
    const on = isCurrent(l.href);
    return (
      <Link
        key={l.href}
        href={l.href}
        ref={on ? current : undefined}
        className={on ? styles.navOn : undefined}
        aria-current={on ? "page" : undefined}
      >
        {l.label}
      </Link>
    );
  });
}

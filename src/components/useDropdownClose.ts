"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

// Closes a <details> dropdown (the phone menu, the language menu) when:
// - a link inside it is tapped, straight away, so the menu folds up while
//   the next page loads instead of hanging over it (and also when the link
//   is the page you're already on, where nothing else would close it);
// - the page address changes;
// - the visitor taps or clicks anywhere outside it;
// - Escape is pressed (focus goes back to the button).
// Without JavaScript the <details> still opens and closes on its own.
export function useDropdownClose() {
  const ref = useRef<HTMLDetailsElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    if (ref.current) ref.current.open = false;
  }, [pathname]);

  useEffect(() => {
    const details = ref.current;
    if (!details) return;

    const close = () => {
      details.open = false;
    };
    const onClick = (event: MouseEvent) => {
      if ((event.target as Element).closest("a")) close();
    };
    const onPointerDown = (event: PointerEvent) => {
      if (details.open && !details.contains(event.target as Node)) close();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && details.open) {
        close();
        details.querySelector("summary")?.focus();
      }
    };

    details.addEventListener("click", onClick);
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      details.removeEventListener("click", onClick);
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  return ref;
}

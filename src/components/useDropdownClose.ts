"use client";

import { useEffect, useRef } from "react";

// Closes a <details> dropdown (the phone menu, the language menu) when:
// - a link inside it is tapped, straight away, so the menu folds up while
//   the next page loads instead of hanging over it (and also when the link
//   is the page you're already on, where nothing else would close it);
// - the visitor goes back or forward in the browser;
// - the visitor taps or clicks anywhere outside it;
// - Escape is pressed (focus goes back to the button).
// Without JavaScript the <details> still opens and closes on its own.
//
// It doesn't read the page address (usePathname): the header is built ahead
// of time on every page, and reading the address there stops the build.
export function useDropdownClose() {
  const ref = useRef<HTMLDetailsElement>(null);

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
    addEventListener("popstate", close);
    return () => {
      details.removeEventListener("click", onClick);
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
      removeEventListener("popstate", close);
    };
  }, []);

  return ref;
}

"use client";

// A box you can slide sideways by dragging with the mouse, for the wide
// rental table on a computer. Links, buttons and fields still work: a drag
// only starts on the rest of the table, and a drag that moved doesn't count
// as a click. Touch screens keep their normal swipe. Tapping a long note
// ([data-clamp]) opens it in full.

import { useRef } from "react";

export function DragScroll({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  const box = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; left: number; moved: boolean } | null>(null);
  // Set when a drag ends, so the click that follows it is ignored.
  const justDragged = useRef(false);

  const stop = () => {
    justDragged.current = drag.current?.moved ?? false;
    drag.current = null;
    if (box.current) box.current.style.cursor = "";
  };

  return (
    <div
      ref={box}
      className={className}
      onPointerDown={(e) => {
        justDragged.current = false;
        if (e.pointerType !== "mouse" || e.button !== 0 || !box.current) return;
        if ((e.target as HTMLElement).closest("a, button, input, textarea, select")) return;
        drag.current = { x: e.clientX, left: box.current.scrollLeft, moved: false };
      }}
      onPointerMove={(e) => {
        const d = drag.current;
        if (!d || !box.current) return;
        const dx = e.clientX - d.x;
        if (Math.abs(dx) > 4) d.moved = true;
        if (d.moved) {
          box.current.scrollLeft = d.left - dx;
          box.current.style.cursor = "grabbing";
          e.preventDefault();
        }
      }}
      onPointerUp={stop}
      onPointerLeave={stop}
      onClickCapture={(e) => {
        // A drag that ended on a link isn't a click on it.
        if (justDragged.current) {
          justDragged.current = false;
          e.preventDefault();
          e.stopPropagation();
        }
      }}
      onClick={(e) => {
        // Tapping a long note that's cut short on a phone opens it, and closes it again.
        const target = e.target as HTMLElement;
        if (target.closest("a, button, input, textarea, select")) return;
        const cell = target.closest<HTMLElement>("[data-clamp]");
        if (cell) cell.toggleAttribute("data-open");
      }}
    >
      {children}
    </div>
  );
}

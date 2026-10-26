import { ViewTransition } from "react";

// Marks an element that should carry over from one page to the next: give it
// the same name on both pages (e.g. a bike's photo on its card and on its
// page) and the browser grows or shrinks it into place during navigation.
//
// This uses the browser's View Transitions, through React. Motion's own
// shared layout (layoutId) can't do this: it only links elements on the same
// page, and Next.js replaces the whole page when you navigate.
//
// - It only plays when the element is on the new page straight away, not
//   when it arrives later from a loading state.
// - default="none" stops the element joining unrelated transitions;
//   share="morph" targets the CSS in globals.css (timing, reduced motion).
// - Browsers without View Transitions simply navigate as usual.
export function SharedElement({ name, children }: { name: string; children: React.ReactNode }) {
  return (
    <ViewTransition name={name} share="morph" default="none">
      {children}
    </ViewTransition>
  );
}

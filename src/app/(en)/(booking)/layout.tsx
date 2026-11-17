// The booking steps (/book, then the booking and payment page) use the same
// header and footer as the rest of the public site. They live in their own
// group only so they don't get the page transitions in (public)/template.tsx:
// moving between booking steps must feel instant.
export { default } from "../(public)/layout";

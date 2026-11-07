"use client";

import Script from "next/script";
import { useEffect } from "react";

// Visitor stats (Umami) and browser error alerts (Sentry) on the public
// pages. Each stays off until its key is set (see .env.example), and both
// load only after the page has finished loading, so they don't slow it down.
//
// - Umami: no cookies, no personal data. Booking page addresses contain a
//   private code; it's replaced with "[token]" before anything is sent.
//   Clicks on elements with data-umami-event="…" are counted as events.
// - Sentry: errors in the visitor's browser, e.g. on the booking form.

const UMAMI_ID = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID;
const UMAMI_SRC = process.env.NEXT_PUBLIC_UMAMI_SCRIPT_URL || "https://cloud.umami.is/script.js";
// Only count visits on these domains (so local tests aren't counted).
const UMAMI_DOMAINS = process.env.NEXT_PUBLIC_UMAMI_DOMAINS;
const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

/** Removes the private code from booking page addresses. */
const hideBookingCodes = `window.umamiBeforeSend = function (type, payload) {
  var hide = function (u) { return u && u.replace(/\\/booking\\/[^/?#]+/, "/booking/[token]"); };
  payload.url = hide(payload.url);
  payload.referrer = hide(payload.referrer);
  return payload;
};`;

export function Monitoring() {
  useEffect(() => {
    if (!SENTRY_DSN) return;
    const start = () => {
      const idle = window.requestIdleCallback ?? ((cb: () => void) => setTimeout(cb, 1500));
      idle(() => {
        Promise.all([import("@sentry/nextjs"), import("@/lib/sentry-options")]).then(
          ([Sentry, { sentryOptions }]) => {
            if (!Sentry.getClient()) Sentry.init(sentryOptions(SENTRY_DSN));
          },
        );
      });
    };
    if (document.readyState === "complete") start();
    else window.addEventListener("load", start, { once: true });
  }, []);

  if (!UMAMI_ID) return null;
  return (
    <>
      <Script id="umami-before-send" strategy="lazyOnload">
        {hideBookingCodes}
      </Script>
      <Script
        src={UMAMI_SRC}
        strategy="lazyOnload"
        data-website-id={UMAMI_ID}
        data-before-send="umamiBeforeSend"
        {...(UMAMI_DOMAINS && { "data-domains": UMAMI_DOMAINS })}
      />
    </>
  );
}
